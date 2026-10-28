//! Speech recognition against recorded scripts: each `tests/fixtures/<lang>.wav`
//! is synthesized speech of `<lang>.txt`, and Vosk must recognize most of
//! its words in order. Models are read from `VOSK_MODELS_DIR` (the folder
//! holding the unpacked `vosk-model-small-*` models); without it the test is
//! skipped, so run `scripts/fetch-speech-models.ps1` first.

use std::path::{Path, PathBuf};
use vocal_teleprompter_lib::speech::audio::Resampler;
use vocal_teleprompter_lib::speech::{models::model_name, transcribe, Transcriber};

/// Share of the script's words that must come back, in order
const MIN_ACCURACY: f64 = 0.8;

fn fixtures() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("tests").join("fixtures")
}

/// 16-bit mono PCM samples of a WAV file
fn read_wav(path: &Path) -> Vec<i16> {
    let bytes = std::fs::read(path).unwrap();
    let mut at = 12;
    while at + 8 <= bytes.len() {
        let id = &bytes[at..at + 4];
        let size = u32::from_le_bytes(bytes[at + 4..at + 8].try_into().unwrap()) as usize;
        if id == b"data" {
            return bytes[at + 8..(at + 8 + size).min(bytes.len())]
                .chunks_exact(2)
                .map(|b| i16::from_le_bytes([b[0], b[1]]))
                .collect();
        }
        at += 8 + size + (size & 1);
    }
    panic!("no data chunk in {}", path.display());
}

fn words(text: &str) -> Vec<String> {
    text.split_whitespace()
        .map(|w| {
            w.chars()
                .filter(|c| c.is_alphanumeric())
                .collect::<String>()
                .to_lowercase()
        })
        .filter(|w| !w.is_empty())
        .collect()
}

/// Longest common subsequence of words, over the script's length
fn accuracy(expected: &[String], heard: &[String]) -> f64 {
    let mut row = vec![0usize; heard.len() + 1];
    for e in expected {
        let mut diagonal = 0;
        for (j, h) in heard.iter().enumerate() {
            let above = row[j + 1];
            row[j + 1] = if e == h { diagonal + 1 } else { above.max(row[j]) };
            diagonal = above;
        }
    }
    row[heard.len()] as f64 / expected.len().max(1) as f64
}

#[test]
fn recognizes_the_recorded_scripts() {
    let Ok(models) = std::env::var("VOSK_MODELS_DIR") else {
        eprintln!("VOSK_MODELS_DIR not set, skipping speech recognition test");
        return;
    };
    let mut checked = 0;
    for entry in std::fs::read_dir(fixtures()).unwrap().flatten() {
        let path = entry.path();
        if path.extension().is_none_or(|e| e != "wav") {
            continue;
        }
        let language = path.file_stem().unwrap().to_string_lossy().to_string();
        let model = Path::new(&models).join(model_name(&language).expect("known language"));
        assert!(model.exists(), "model for {language} missing at {}", model.display());

        let script = std::fs::read_to_string(path.with_extension("txt")).unwrap();
        let heard = transcribe(&model, &read_wav(&path)).unwrap();
        let score = accuracy(&words(&script), &words(&heard));
        println!("{language}: {:.0}% — {heard}", score * 100.0);
        assert!(
            score >= MIN_ACCURACY,
            "{language} recognized only {:.0}% of the script: {heard}",
            score * 100.0
        );
        checked += 1;
    }
    assert!(checked > 0, "no fixtures found");
}

/// The live path: a 48 kHz microphone delivering 10 ms float chunks, resampled
/// to 16 kHz on the fly, must recognize the script as well as the file does
#[test]
fn recognizes_a_live_48khz_stream() {
    let Ok(models) = std::env::var("VOSK_MODELS_DIR") else {
        eprintln!("VOSK_MODELS_DIR not set, skipping live stream test");
        return;
    };
    let path = fixtures().join("en-US.wav");
    let model_dir = Path::new(&models).join(model_name("en-US").unwrap());
    let model = vosk::Model::new(model_dir.to_string_lossy()).expect("model");

    // Upsample the 16 kHz recording to 48 kHz floats, as a microphone gives it
    let source = read_wav(&path);
    let mic: Vec<f32> = source
        .windows(2)
        .flat_map(|w| {
            let (a, b) = (w[0] as f32 / i16::MAX as f32, w[1] as f32 / i16::MAX as f32);
            [a, a + (b - a) / 3.0, a + 2.0 * (b - a) / 3.0]
        })
        .collect();

    let mut transcriber = Transcriber::new(&model).unwrap();
    let mut resampler = Resampler::new();
    let mut buffer = Vec::new();
    let mut heard = Vec::new();
    for chunk in mic.chunks(480) {
        buffer.clear();
        resampler.process(chunk, 48_000, &mut buffer);
        if let Some((text, true)) = transcriber.feed(&buffer) {
            heard.push(text);
        }
    }
    heard.push(transcriber.finish());
    let heard = heard.join(" ");

    let script = std::fs::read_to_string(path.with_extension("txt")).unwrap();
    let score = accuracy(&words(&script), &words(&heard));
    println!("live 48 kHz: {:.0}% — {heard}", score * 100.0);
    assert!(score >= MIN_ACCURACY, "live stream recognized only {:.0}%: {heard}", score * 100.0);
}
