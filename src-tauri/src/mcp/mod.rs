//! Lets AI assistants (Claude Desktop, Cursor, VS Code...) drive the prompter
//! through the Model Context Protocol.
//!
//! The running app opens a small bridge on localhost (`bridge`). Assistants
//! start `vocal-teleprompter --mcp` (`server`), which speaks MCP over stdio and
//! forwards each tool call to that bridge, where the frontend answers it.

pub mod bridge;
pub mod guide;
pub mod server;

use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// Same as the identifier in tauri.conf.json, so the file lands in the app's
/// own data folder
const APP_IDENTIFIER: &str = "com.angel.vocal-teleprompter";

/// Where the running app tells the connector how to reach it
#[derive(Serialize, Deserialize)]
pub struct BridgeInfo {
    pub port: u16,
    pub token: String,
}

pub fn bridge_file() -> Option<PathBuf> {
    Some(dirs::data_dir()?.join(APP_IDENTIFIER).join("mcp-bridge.json"))
}

/// One request from the connector to the app, sent as a single JSON line
#[derive(Serialize, Deserialize)]
pub struct BridgeRequest {
    pub token: String,
    pub method: String,
    #[serde(default)]
    pub params: serde_json::Value,
}

/// The app's answer, also a single JSON line
#[derive(Serialize, Deserialize)]
pub struct BridgeResponse {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub result: Option<serde_json::Value>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}
