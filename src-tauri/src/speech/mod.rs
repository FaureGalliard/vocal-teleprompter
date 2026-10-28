//! Offline speech recognition with Vosk, listening to whichever microphone
//! the user picks. Results reach the frontend as `speech` events with the
//! text of the current utterance; `mic-level` events carry the input level.

pub mod audio;
pub mod models;

use audio::{Capture, Resampler, TARGET_RATE};
use serde::Serialize;
use std::collections::HashMap;
use std::path::Path;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, State};
use vosk::{DecodingState, Model, Recognizer};

/// How often the input level is reported
const LEVEL_INTERVAL: Duration = Duration::from_millis(50);

#[derive(Default)]
pub struct SpeechEngine {
    capture: Mutex<Option<Capture>>,
    // The level meter has its own capture, so stopping it can never stop
    // recognition that started meanwhile
    monitor: Mutex<Option<Capture>>,
    // Loading a model takes a moment, so keep the ones already used
    models: Mutex<HashMap<String, Arc<Model>>>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct SpeechEvent {
    text: String,
    // false while the utterance is still being decoded
    is_final: bool,
}

/// Keeps Vosk from printing its model loading log
fn quiet() {
    vosk::set_log_level(vosk::LogLevel::Error);
}

fn load_model(engine: &SpeechEngine, dir: &Path) -> Result<Arc<Model>, String> {
    quiet();
    let key = dir.to_string_lossy().to_string();
    let mut models = engine.models.lock().unwrap();
    if let Some(model) = models.get(&key) {
        return Ok(model.clone());
    }
    let model = Arc::new(Model::new(&key).ok_or("model-unreadable")?);
    models.insert(key, model.clone());
    Ok(model)
}

/// Feeds 16 kHz audio to a recognizer and returns the text of every
/// utterance it completes, plus the partial text of the current one
pub struct Transcriber {
    recognizer: Recognizer,
    partial: String,
}

impl Transcriber {
    pub fn new(model: &Model) -> Result<Self, String> {
        let recognizer =
            Recognizer::new(model, TARGET_RATE as f32).ok_or("Could not create the recognizer")?;
        Ok(Self {
            recognizer,
            partial: String::new(),
        })
    }

    /// Returns (text, is_final) when there is something new to report
    pub fn feed(&mut self, samples: &[i16]) -> Option<(String, bool)> {
        match self.recognizer.accept_waveform(samples) {
            Ok(DecodingState::Finalized) => {
                let text = self
                    .recognizer
                    .result()
                    .single()
                    .map(|r| r.text.to_string())
                    .unwrap_or_default();
                self.partial.clear();
                (!text.is_empty()).then_some((text, true))
            }
            Ok(DecodingState::Running) => {
                let text = self.recognizer.partial_result().partial.to_string();
                if text.is_empty() || text == self.partial {
                    return None;
                }
                self.partial = text.clone();
                Some((text, false))
            }
            _ => None,
        }
    }

    pub fn finish(&mut self) -> String {
        self.recognizer
            .final_result()
            .single()
            .map(|r| r.text.to_string())
            .unwrap_or_default()
    }
}

#[tauri::command]
pub fn list_microphones() -> Vec<audio::InputDevice> {
    audio::list_inputs()
}

/// Starts listening on a microphone (None = system default) in a language.
/// Fails with "model-missing" when that language's model is not installed.
#[tauri::command]
pub fn speech_start(
    app: AppHandle,
    engine: State<'_, SpeechEngine>,
    language: String,
    device_id: Option<String>,
) -> Result<(), String> {
    speech_stop(engine.clone());
    // Two captures of the same microphone are not needed: listening reports
    // the level too
    engine.monitor.lock().unwrap().take();
    let dir = models::find_model(&app, &language)?.ok_or("model-missing")?;
    let model = load_model(&engine, &dir)?;
    let mut transcriber = Transcriber::new(&model)?;
    let mut resampler = Resampler::new();
    let mut buffer = Vec::new();
    let mut last_level = Instant::now();

    let capture = audio::capture(device_id, move |samples, rate| {
        // The recognizer points into the model, so the closure keeps it alive
        let _ = &model;
        if last_level.elapsed() >= LEVEL_INTERVAL {
            last_level = Instant::now();
            let _ = app.emit("mic-level", audio::level(samples));
        }
        buffer.clear();
        resampler.process(samples, rate, &mut buffer);
        if let Some((text, is_final)) = transcriber.feed(&buffer) {
            let _ = app.emit("speech", SpeechEvent { text, is_final });
        }
    })?;
    *engine.capture.lock().unwrap() = Some(capture);
    Ok(())
}

#[tauri::command]
pub fn speech_stop(engine: State<'_, SpeechEngine>) {
    engine.capture.lock().unwrap().take();
}

/// Only measures the input level, to test a microphone without listening.
/// Does nothing while listening, which already reports the level.
#[tauri::command]
pub fn mic_monitor_start(
    app: AppHandle,
    engine: State<'_, SpeechEngine>,
    device_id: Option<String>,
) -> Result<(), String> {
    if engine.capture.lock().unwrap().is_some() {
        return Ok(());
    }
    engine.monitor.lock().unwrap().take();
    let mut last_level = Instant::now();
    let capture = audio::capture(device_id, move |samples, _| {
        if last_level.elapsed() >= LEVEL_INTERVAL {
            last_level = Instant::now();
            let _ = app.emit("mic-level", audio::level(samples));
        }
    })?;
    *engine.monitor.lock().unwrap() = Some(capture);
    Ok(())
}

#[tauri::command]
pub fn mic_monitor_stop(engine: State<'_, SpeechEngine>) {
    engine.monitor.lock().unwrap().take();
}

/// Transcribes a whole 16 kHz mono recording; used by the tests
pub fn transcribe(model_dir: &Path, samples: &[i16]) -> Result<String, String> {
    quiet();
    let model = Model::new(model_dir.to_string_lossy()).ok_or("model-unreadable")?;
    let mut transcriber = Transcriber::new(&model)?;
    let mut text = Vec::new();
    for chunk in samples.chunks(4000) {
        if let Some((utterance, true)) = transcriber.feed(chunk) {
            text.push(utterance);
        }
    }
    text.push(transcriber.finish());
    Ok(text.into_iter().filter(|t| !t.is_empty()).collect::<Vec<_>>().join(" "))
}
