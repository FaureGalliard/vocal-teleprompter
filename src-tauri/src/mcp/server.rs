//! `vocal-teleprompter --mcp`: a Model Context Protocol server over stdio
//! (newline-delimited JSON-RPC) that forwards tool calls to the running app.

use super::guide::{presentation_prompt, APP_GUIDE, FORMAT_GUIDE, SERVER_INSTRUCTIONS};
use super::{bridge_file, BridgeInfo, BridgeRequest, BridgeResponse};
use serde_json::{json, Value};
use std::io::{BufRead, BufReader, Write};
use std::net::TcpStream;
use std::time::{Duration, Instant};

const DEFAULT_PROTOCOL_VERSION: &str = "2025-06-18";
const FORMAT_GUIDE_URI: &str = "teleprompter://format-guide";
const APP_GUIDE_URI: &str = "teleprompter://app-guide";
/// How long to wait for the app to come up when the connector has to open it
const LAUNCH_TIMEOUT: Duration = Duration::from_secs(15);

pub fn run() {
    let stdin = std::io::stdin();
    let mut stdout = std::io::stdout();
    for line in stdin.lock().lines() {
        let Ok(line) = line else { break };
        if line.trim().is_empty() {
            continue;
        }
        let Ok(message) = serde_json::from_str::<Value>(&line) else {
            continue;
        };
        // Notifications carry no id and get no answer
        let Some(id) = message.get("id").cloned() else {
            continue;
        };
        let method = message["method"].as_str().unwrap_or_default();
        let params = message.get("params").cloned().unwrap_or(Value::Null);

        let reply = match handle(method, &params) {
            Ok(result) => json!({ "jsonrpc": "2.0", "id": id, "result": result }),
            Err((code, error)) => json!({
                "jsonrpc": "2.0",
                "id": id,
                "error": { "code": code, "message": error },
            }),
        };
        let _ = writeln!(stdout, "{reply}");
        let _ = stdout.flush();
    }
}

fn handle(method: &str, params: &Value) -> Result<Value, (i64, String)> {
    match method {
        "initialize" => Ok(json!({
            "protocolVersion": params["protocolVersion"]
                .as_str()
                .unwrap_or(DEFAULT_PROTOCOL_VERSION),
            "capabilities": { "tools": {}, "prompts": {}, "resources": {} },
            "serverInfo": {
                "name": "vocal-teleprompter",
                "title": "Vocal Teleprompter",
                "version": env!("CARGO_PKG_VERSION"),
            },
            "instructions": SERVER_INSTRUCTIONS,
        })),
        "ping" => Ok(json!({})),
        "tools/list" => Ok(json!({ "tools": tools() })),
        "tools/call" => Ok(call_tool(params)),
        "prompts/list" => Ok(json!({ "prompts": [prompt_definition()] })),
        "prompts/get" => get_prompt(params),
        "resources/list" => Ok(json!({ "resources": [
            {
                "uri": FORMAT_GUIDE_URI,
                "name": "format-guide",
                "title": "Teleprompter format guide",
                "description": "How to write scripts and slide cards for Vocal Teleprompter",
                "mimeType": "text/markdown",
            },
            {
                "uri": APP_GUIDE_URI,
                "name": "app-guide",
                "title": "Vocal Teleprompter app guide",
                "description": "Every feature, where it is in the interface, and the keyboard shortcuts",
                "mimeType": "text/markdown",
            },
        ] })),
        "resources/read" => match params["uri"].as_str() {
            Some(FORMAT_GUIDE_URI) => Ok(resource(FORMAT_GUIDE_URI, FORMAT_GUIDE)),
            Some(APP_GUIDE_URI) => Ok(resource(APP_GUIDE_URI, APP_GUIDE)),
            _ => Err((-32002, "Resource not found".into())),
        },
        _ => Err((-32601, format!("Method not found: {method}"))),
    }
}

fn resource(uri: &str, text: &str) -> Value {
    json!({ "contents": [{ "uri": uri, "mimeType": "text/markdown", "text": text }] })
}

fn tools() -> Value {
    json!([
        {
            "name": "load_script",
            "title": "Load script",
            "description": format!(
                "Put a script in the teleprompter, replacing the current one or appending \
                 to it. Listening stops and the position goes back to the start.\n\n{FORMAT_GUIDE}"
            ),
            "inputSchema": {
                "type": "object",
                "properties": {
                    "text": {
                        "type": "string",
                        "description": "The script, exactly as it will be read aloud. Separate slides with a line containing only ---.",
                    },
                    "mode": {
                        "type": "string",
                        "enum": ["replace", "append"],
                        "description": "replace (default) or append as new slides after the current script",
                    },
                },
                "required": ["text"],
            },
        },
        {
            "name": "get_script",
            "title": "Get script",
            "description": "Read the script currently in the teleprompter, to review or improve it.",
            "annotations": { "readOnlyHint": true },
            "inputSchema": { "type": "object", "properties": {} },
        },
        {
            "name": "get_status",
            "title": "Get status",
            "description": "Slides, word count, estimated reading time, the speaker's target duration, speech language, the current settings, and whether it is listening, with the elapsed time and pace while it is.",
            "annotations": { "readOnlyHint": true },
            "inputSchema": { "type": "object", "properties": {} },
        },
        {
            "name": "control",
            "title": "Control the teleprompter",
            "description": "Start, pause, resume or stop listening, move to the next or previous slide, or show or hide the window.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "action": {
                        "type": "string",
                        "enum": ["start", "pause", "resume", "stop", "next_slide", "previous_slide", "show_window", "hide_window"],
                    },
                },
                "required": ["action"],
            },
        },
        {
            "name": "update_settings",
            "title": "Change settings",
            "description": "Change the teleprompter's settings. Pass only what should change. See the app guide resource for what each one does.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "hideFromScreenSharing": { "type": "boolean", "description": "Keep the window out of screen shares, recordings and screenshots" },
                    "fontSize": { "type": "integer", "minimum": 6, "maximum": 200, "description": "Text size in pixels" },
                    "targetMinutes": { "type": "integer", "minimum": 0, "maximum": 180, "description": "Target duration of the talk; 0 turns it off" },
                    "countdownSeconds": { "type": "integer", "enum": [0, 3, 5, 10], "description": "Countdown before listening starts; 0 turns it off" },
                    "readingLine": { "type": "boolean", "description": "Hold the current line near the top, close to the camera" },
                    "autoContrast": { "type": "boolean", "description": "Adjust the text color so it stays readable" },
                    "clickThrough": { "type": "boolean", "description": "Let clicks pass through the window to the app behind it" },
                    "speechLanguage": {
                        "type": "string",
                        "enum": ["es-ES", "en-US", "fr-FR", "de-DE", "it-IT", "pt-BR", "ja-JP", "zh-CN", "ko-KR"],
                        "description": "Language the speaker will speak in",
                    },
                },
            },
        },
    ])
}

fn prompt_definition() -> Value {
    json!({
        "name": "prepare_presentation",
        "title": "Prepare a presentation",
        "description": "Write a spoken presentation script, one card per slide, sized to a duration, and load it into the teleprompter",
        "arguments": [
            { "name": "topic", "description": "What the presentation is about", "required": true },
            { "name": "minutes", "description": "How long it should last, in minutes", "required": true },
            { "name": "slides", "description": "Number of slides, if already decided", "required": false },
            { "name": "audience", "description": "Who it is for (class, team, clients...)", "required": false },
        ],
    })
}

fn get_prompt(params: &Value) -> Result<Value, (i64, String)> {
    if params["name"] != "prepare_presentation" {
        return Err((-32602, "Unknown prompt".into()));
    }
    let arg = |name: &str| params["arguments"][name].as_str().unwrap_or_default().to_string();
    Ok(json!({
        "description": "Prepare a presentation for Vocal Teleprompter",
        "messages": [{
            "role": "user",
            "content": {
                "type": "text",
                "text": presentation_prompt(&arg("topic"), &arg("minutes"), &arg("slides"), &arg("audience")),
            },
        }],
    }))
}

/// Tool failures are reported inside the result, so the assistant can read
/// them and react, rather than as protocol errors
fn call_tool(params: &Value) -> Value {
    let name = params["name"].as_str().unwrap_or_default();
    let arguments = params.get("arguments").cloned().unwrap_or(json!({}));
    match send_to_app(name, arguments) {
        Ok(result) => json!({
            "content": [{ "type": "text", "text": result.to_string() }],
            "structuredContent": if result.is_object() { result } else { json!({ "result": result }) },
        }),
        Err(error) => json!({
            "content": [{ "type": "text", "text": error }],
            "isError": true,
        }),
    }
}

fn send_to_app(method: &str, params: Value) -> Result<Value, String> {
    let mut stream = connect().ok_or_else(|| {
        "Vocal Teleprompter is not running and could not be started. Ask the user to open it."
            .to_string()
    })?;
    let info = read_bridge_info().ok_or("Bridge file missing")?;
    let request = BridgeRequest {
        token: info.token,
        method: method.to_string(),
        params,
    };
    let mut line = serde_json::to_vec(&request).map_err(|e| e.to_string())?;
    line.push(b'\n');
    stream.write_all(&line).map_err(|e| e.to_string())?;

    let mut answer = String::new();
    BufReader::new(stream)
        .read_line(&mut answer)
        .map_err(|e| e.to_string())?;
    let response: BridgeResponse = serde_json::from_str(&answer).map_err(|e| e.to_string())?;
    match response.error {
        Some(error) => Err(error),
        None => Ok(response.result.unwrap_or(Value::Null)),
    }
}

fn read_bridge_info() -> Option<BridgeInfo> {
    let bytes = std::fs::read(bridge_file()?).ok()?;
    serde_json::from_slice(&bytes).ok()
}

fn try_connect() -> Option<TcpStream> {
    let info = read_bridge_info()?;
    let stream = TcpStream::connect(("127.0.0.1", info.port)).ok()?;
    stream.set_read_timeout(Some(Duration::from_secs(15))).ok()?;
    Some(stream)
}

/// Reaches the running app, opening it first if needed
fn connect() -> Option<TcpStream> {
    if let Some(stream) = try_connect() {
        return Some(stream);
    }
    let exe = std::env::current_exe().ok()?;
    std::process::Command::new(exe)
        .stdin(std::process::Stdio::null())
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .spawn()
        .ok()?;
    let started = Instant::now();
    while started.elapsed() < LAUNCH_TIMEOUT {
        std::thread::sleep(Duration::from_millis(300));
        if let Some(stream) = try_connect() {
            return Some(stream);
        }
    }
    None
}
