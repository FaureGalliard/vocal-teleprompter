//! Localhost bridge inside the running app. The connector sends one JSON line
//! per request; the request is handed to the frontend as an `mcp-request`
//! event and the frontend answers through the `mcp_respond` command.

use super::{bridge_file, BridgeInfo, BridgeRequest, BridgeResponse};
use serde::Serialize;
use std::collections::HashMap;
use std::io::{BufRead, BufReader, Write};
use std::net::{TcpListener, TcpStream};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::mpsc::{channel, Sender};
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};

/// How long a request may wait for the frontend before giving up
const RESPONSE_TIMEOUT: Duration = Duration::from_secs(10);

#[derive(Default)]
pub struct Bridge {
    // Set once the frontend listens for requests; until then they would be lost
    ready: AtomicBool,
    next_id: AtomicU64,
    pending: Mutex<HashMap<u64, Sender<BridgeResponse>>>,
}

#[derive(Clone, Serialize)]
struct FrontendRequest {
    id: u64,
    method: String,
    params: serde_json::Value,
}

/// Called by the frontend with the answer to an `mcp-request` event
#[tauri::command]
pub fn mcp_respond(
    bridge: tauri::State<'_, Bridge>,
    id: u64,
    result: Option<serde_json::Value>,
    error: Option<String>,
) {
    if let Some(sender) = bridge.pending.lock().unwrap().remove(&id) {
        let _ = sender.send(BridgeResponse { result, error });
    }
}

/// Called by the frontend once it listens for `mcp-request` events
#[tauri::command]
pub fn mcp_ready(bridge: tauri::State<'_, Bridge>) {
    bridge.ready.store(true, Ordering::Relaxed);
}

/// Opens the bridge on a free localhost port and publishes how to reach it
pub fn start(app: &AppHandle) -> std::io::Result<()> {
    let listener = TcpListener::bind(("127.0.0.1", 0))?;
    let info = BridgeInfo {
        port: listener.local_addr()?.port(),
        // Only processes that can read the user's data folder can drive the app
        token: uuid::Uuid::new_v4().to_string(),
    };
    if let Some(path) = bridge_file() {
        if let Some(dir) = path.parent() {
            std::fs::create_dir_all(dir)?;
        }
        std::fs::write(&path, serde_json::to_vec(&info)?)?;
    }

    let app = app.clone();
    std::thread::spawn(move || {
        for stream in listener.incoming().flatten() {
            let app = app.clone();
            let token = info.token.clone();
            std::thread::spawn(move || {
                let _ = handle(&app, &token, stream);
            });
        }
    });
    Ok(())
}

fn handle(app: &AppHandle, token: &str, mut stream: TcpStream) -> std::io::Result<()> {
    stream.set_read_timeout(Some(RESPONSE_TIMEOUT))?;
    let mut line = String::new();
    BufReader::new(stream.try_clone()?).read_line(&mut line)?;

    let response = match serde_json::from_str::<BridgeRequest>(&line) {
        Ok(request) if request.token == token => forward(app, request),
        Ok(_) => BridgeResponse {
            result: None,
            error: Some("Invalid bridge token".into()),
        },
        Err(e) => BridgeResponse {
            result: None,
            error: Some(format!("Malformed request: {e}")),
        },
    };

    let mut out = serde_json::to_vec(&response)?;
    out.push(b'\n');
    stream.write_all(&out)
}

fn forward(app: &AppHandle, request: BridgeRequest) -> BridgeResponse {
    let bridge = app.state::<Bridge>();
    // Right after launch the window may still be loading
    let waited = std::time::Instant::now();
    while !bridge.ready.load(Ordering::Relaxed) && waited.elapsed() < RESPONSE_TIMEOUT {
        std::thread::sleep(Duration::from_millis(100));
    }
    let id = bridge.next_id.fetch_add(1, Ordering::Relaxed);
    let (sender, receiver) = channel();
    bridge.pending.lock().unwrap().insert(id, sender);

    let event = FrontendRequest {
        id,
        method: request.method,
        params: request.params,
    };
    if let Err(e) = app.emit("mcp-request", event) {
        bridge.pending.lock().unwrap().remove(&id);
        return BridgeResponse {
            result: None,
            error: Some(e.to_string()),
        };
    }

    receiver.recv_timeout(RESPONSE_TIMEOUT).unwrap_or_else(|_| {
        bridge.pending.lock().unwrap().remove(&id);
        BridgeResponse {
            result: None,
            error: Some("The teleprompter did not answer in time".into()),
        }
    })
}
