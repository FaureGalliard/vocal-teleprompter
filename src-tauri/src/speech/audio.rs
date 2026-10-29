//! Microphone capture with cpal, so any input device can be used, not only
//! the system default.

use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{FromSample, Sample, SizedSample};
use serde::Serialize;
use std::sync::mpsc::{channel, sync_channel, Sender};
use std::thread::JoinHandle;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InputDevice {
    pub id: String,
    pub name: String,
    pub is_default: bool,
}

pub fn list_inputs() -> Vec<InputDevice> {
    let host = cpal::default_host();
    let default_id = host.default_input_device().and_then(|d| d.id().ok());
    let Ok(devices) = host.input_devices() else {
        return Vec::new();
    };
    devices
        .filter_map(|device| {
            let id = device.id().ok()?;
            let name = device
                .description()
                .map(|d| d.name().to_string())
                .unwrap_or_else(|_| id.to_string());
            Some(InputDevice {
                is_default: Some(&id) == default_id.as_ref(),
                id: id.to_string(),
                name,
            })
        })
        .collect()
}

/// A running capture; dropping it stops the microphone
pub struct Capture {
    stop: Option<Sender<()>>,
    thread: Option<JoinHandle<()>>,
}

impl Drop for Capture {
    fn drop(&mut self) {
        drop(self.stop.take());
        if let Some(thread) = self.thread.take() {
            let _ = thread.join();
        }
    }
}

/// Starts capturing from the device with that id (or the default input) and
/// hands `sink` mono samples with their sample rate. The stream lives on its
/// own thread because cpal streams cannot move between threads.
pub fn capture(
    device_id: Option<String>,
    sink: impl FnMut(&[f32], u32) + Send + 'static,
) -> Result<Capture, String> {
    let (ready_tx, ready_rx) = sync_channel::<Result<(), String>>(1);
    let (stop_tx, stop_rx) = channel::<()>();

    let thread = std::thread::spawn(move || {
        let stream = match open_stream(device_id, sink) {
            Ok(stream) => stream,
            Err(e) => {
                let _ = ready_tx.send(Err(e));
                return;
            }
        };
        if let Err(e) = stream.play() {
            let _ = ready_tx.send(Err(e.to_string()));
            return;
        }
        let _ = ready_tx.send(Ok(()));
        // Runs until the Capture is dropped
        let _ = stop_rx.recv();
        drop(stream);
    });

    ready_rx
        .recv()
        .map_err(|_| "The audio thread stopped unexpectedly".to_string())??;
    Ok(Capture {
        stop: Some(stop_tx),
        thread: Some(thread),
    })
}

fn open_stream(
    device_id: Option<String>,
    sink: impl FnMut(&[f32], u32) + Send + 'static,
) -> Result<cpal::Stream, String> {
    let host = cpal::default_host();
    let device = match device_id {
        Some(id) => {
            let id = id.parse().map_err(|e: cpal::Error| e.to_string())?;
            host.device_by_id(&id)
                .ok_or_else(|| "microphone-unavailable".to_string())?
        }
        None => host
            .default_input_device()
            .ok_or_else(|| "microphone-unavailable".to_string())?,
    };
    let config = device.default_input_config().map_err(|e| e.to_string())?;
    let rate = config.sample_rate();
    let channels = config.channels() as usize;

    match config.sample_format() {
        cpal::SampleFormat::F32 => build::<f32>(&device, config.config(), channels, rate, sink),
        cpal::SampleFormat::I16 => build::<i16>(&device, config.config(), channels, rate, sink),
        cpal::SampleFormat::I32 => build::<i32>(&device, config.config(), channels, rate, sink),
        cpal::SampleFormat::U16 => build::<u16>(&device, config.config(), channels, rate, sink),
        other => Err(format!("Unsupported sample format {other}")),
    }
}

fn build<T>(
    device: &cpal::Device,
    config: cpal::StreamConfig,
    channels: usize,
    rate: u32,
    mut sink: impl FnMut(&[f32], u32) + Send + 'static,
) -> Result<cpal::Stream, String>
where
    T: SizedSample,
    f32: FromSample<T>,
{
    let mut mono = Vec::new();
    device
        .build_input_stream(
            config,
            move |data: &[T], _| {
                // Average the channels down to mono
                mono.clear();
                mono.extend(data.chunks(channels.max(1)).map(|frame| {
                    frame.iter().map(|&s| f32::from_sample(s)).sum::<f32>() / frame.len() as f32
                }));
                sink(&mono, rate);
            },
            |e| eprintln!("Microphone error: {e}"),
            None,
        )
        .map_err(|e| e.to_string())
}

/// Linear resampler from any rate to the 16 kHz 16-bit audio Vosk expects
pub struct Resampler {
    position: f64,
    last: f32,
}

pub const TARGET_RATE: u32 = 16_000;

impl Default for Resampler {
    fn default() -> Self {
        Self::new()
    }
}

impl Resampler {
    pub fn new() -> Self {
        Self {
            position: 0.0,
            last: 0.0,
        }
    }

    pub fn process(&mut self, input: &[f32], rate: u32, out: &mut Vec<i16>) {
        let step = rate as f64 / TARGET_RATE as f64;
        // Sample i of `input` is position i + 1 counting the carried-over one
        while self.position < input.len() as f64 {
            let index = self.position.floor() as usize;
            let frac = (self.position - index as f64) as f32;
            let a = if index == 0 {
                self.last
            } else {
                input[index - 1]
            };
            let b = input[index];
            let value = a + (b - a) * frac;
            out.push((value.clamp(-1.0, 1.0) * i16::MAX as f32) as i16);
            self.position += step;
        }
        self.position -= input.len() as f64;
        if let Some(&last) = input.last() {
            self.last = last;
        }
    }
}

/// Automatic gain for quiet voices: learns how loud speech is (ignoring
/// silence) and boosts it towards a comfortable level, never above 8x and
/// never attenuating, with a limiter so loud bursts do not clip
pub struct AutoGain {
    speech_level: f32,
    gain: f32,
}

const TARGET_LEVEL: f32 = 0.1;
const MAX_GAIN: f32 = 8.0;
// Below this the chunk is background noise, not speech
const NOISE_FLOOR: f32 = 0.004;

impl Default for AutoGain {
    fn default() -> Self {
        Self::new()
    }
}

impl AutoGain {
    pub fn new() -> Self {
        Self {
            speech_level: TARGET_LEVEL,
            gain: 1.0,
        }
    }

    pub fn gain(&self) -> f32 {
        self.gain
    }

    pub fn process(&mut self, samples: &mut [f32]) {
        if samples.is_empty() {
            return;
        }
        let rms = (samples.iter().map(|s| s * s).sum::<f32>() / samples.len() as f32).sqrt();
        if rms > NOISE_FLOOR {
            // Follow the speaker's level over a few seconds
            self.speech_level += (rms - self.speech_level) * 0.02;
        }
        let wanted = (TARGET_LEVEL / self.speech_level.max(1e-4)).clamp(1.0, MAX_GAIN);
        // Change the gain gradually so the level does not pump
        self.gain += (wanted - self.gain) * 0.05;
        for s in samples.iter_mut() {
            let v = *s * self.gain;
            // Soft limiter near full scale
            *s = if v.abs() > 0.9 {
                v.signum() * (0.9 + (v.abs() - 0.9) * 0.1).min(1.0)
            } else {
                v
            };
        }
    }
}

/// Loudness of a chunk from 0 to 1, scaled so normal speech fills most of it
pub fn level(samples: &[f32]) -> f32 {
    if samples.is_empty() {
        return 0.0;
    }
    let rms = (samples.iter().map(|s| s * s).sum::<f32>() / samples.len() as f32).sqrt();
    (rms * 6.0).min(1.0)
}
