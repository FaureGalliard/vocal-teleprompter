//! Vosk language models: one small model per speech language, downloaded on
//! first use into the app's data folder.

use serde::Serialize;
use std::io::Read;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Emitter, Manager};

/// Speech language -> model name on alphacephei.com
pub fn model_name(language: &str) -> Option<&'static str> {
    Some(match language {
        "en-US" => "vosk-model-small-en-us-0.15",
        "es-ES" => "vosk-model-small-es-0.42",
        "fr-FR" => "vosk-model-small-fr-0.22",
        "de-DE" => "vosk-model-small-de-0.15",
        "it-IT" => "vosk-model-small-it-0.22",
        "pt-BR" => "vosk-model-small-pt-0.3",
        "ja-JP" => "vosk-model-small-ja-0.22",
        "zh-CN" => "vosk-model-small-cn-0.22",
        "ko-KR" => "vosk-model-small-ko-0.22",
        _ => return None,
    })
}

pub fn models_dir(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("models"))
}

/// Folder of the model if it is installed
pub fn installed_model(dir: &Path, language: &str) -> Option<PathBuf> {
    let path = dir.join(model_name(language)?);
    // Every Vosk model ships an acoustic model folder
    path.join("am").exists().then_some(path)
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelStatus {
    installed: bool,
}

#[tauri::command]
pub fn speech_model_status(app: AppHandle, language: String) -> Result<ModelStatus, String> {
    Ok(ModelStatus {
        installed: installed_model(&models_dir(&app)?, &language).is_some(),
    })
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct DownloadProgress {
    language: String,
    received: u64,
    total: u64,
}

/// Downloads and unpacks the model for a language, reporting progress with
/// `model-download` events
#[tauri::command]
pub async fn download_speech_model(app: AppHandle, language: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || download(&app, &language))
        .await
        .map_err(|e| e.to_string())?
}

fn download(app: &AppHandle, language: &str) -> Result<(), String> {
    let name = model_name(language).ok_or("Unsupported language")?;
    let dir = models_dir(app)?;
    if installed_model(&dir, language).is_some() {
        return Ok(());
    }
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

    let url = format!("https://alphacephei.com/vosk/models/{name}.zip");
    let response = ureq::get(&url).call().map_err(|e| e.to_string())?;
    let total = response
        .headers()
        .get("content-length")
        .and_then(|v| v.to_str().ok()?.parse().ok())
        .unwrap_or(0);
    let mut reader = response.into_body().into_reader();

    let mut bytes = Vec::with_capacity(total as usize);
    let mut buffer = [0u8; 64 * 1024];
    let mut last_report = 0u64;
    loop {
        let read = reader.read(&mut buffer).map_err(|e| e.to_string())?;
        if read == 0 {
            break;
        }
        bytes.extend_from_slice(&buffer[..read]);
        let received = bytes.len() as u64;
        // About every megabyte is plenty for a progress bar
        if received - last_report > 1 << 20 || received == total {
            last_report = received;
            let _ = app.emit(
                "model-download",
                DownloadProgress {
                    language: language.to_string(),
                    received,
                    total,
                },
            );
        }
    }

    // Unpack next to the final folder and move it in place once complete, so
    // an interrupted download never looks installed
    let staging = dir.join(format!(".{name}.partial"));
    let _ = std::fs::remove_dir_all(&staging);
    zip::ZipArchive::new(std::io::Cursor::new(bytes))
        .map_err(|e| e.to_string())?
        .extract(&staging)
        .map_err(|e| e.to_string())?;
    let final_dir = dir.join(name);
    let _ = std::fs::remove_dir_all(&final_dir);
    std::fs::rename(staging.join(name), &final_dir).map_err(|e| e.to_string())?;
    let _ = std::fs::remove_dir_all(&staging);
    Ok(())
}
