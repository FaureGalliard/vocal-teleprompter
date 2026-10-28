//! One-click setup: adds this app as an MCP server to the config file of
//! Claude Desktop, Cursor or VS Code, keeping everything else in the file.

use serde_json::{json, Map, Value};
use std::path::PathBuf;

const SERVER_NAME: &str = "vocal-teleprompter";

fn server_entry(vscode: bool) -> Result<Value, String> {
    let exe = std::env::current_exe().map_err(|e| e.to_string())?;
    let mut entry = json!({ "command": exe.to_string_lossy(), "args": ["--mcp"] });
    if vscode {
        entry["type"] = json!("stdio");
    }
    Ok(entry)
}

/// Config files to update for a client, plus the key that holds the servers
fn targets(client: &str) -> Result<(Vec<PathBuf>, &'static str), String> {
    let missing = || "Could not find the user folders".to_string();
    match client {
        "claude" => {
            let mut paths = vec![dirs::config_dir().ok_or_else(missing)?.join("Claude")];
            // The Microsoft Store build of Claude keeps its config in its package folder
            if let Some(local) = dirs::data_local_dir() {
                if let Ok(entries) = std::fs::read_dir(local.join("Packages")) {
                    for entry in entries.flatten() {
                        if entry.file_name().to_string_lossy().starts_with("Claude_") {
                            paths.push(entry.path().join("LocalCache").join("Roaming").join("Claude"));
                        }
                    }
                }
            }
            Ok((
                paths
                    .into_iter()
                    .map(|dir| dir.join("claude_desktop_config.json"))
                    .collect(),
                "mcpServers",
            ))
        }
        "cursor" => Ok((
            vec![dirs::home_dir().ok_or_else(missing)?.join(".cursor").join("mcp.json")],
            "mcpServers",
        )),
        "vscode" => Ok((
            vec![dirs::config_dir()
                .ok_or_else(missing)?
                .join("Code")
                .join("User")
                .join("mcp.json")],
            "servers",
        )),
        _ => Err(format!("Unknown client: {client}")),
    }
}

fn read_config(path: &PathBuf) -> Result<Map<String, Value>, String> {
    match std::fs::read_to_string(path) {
        Ok(text) if text.trim().is_empty() => Ok(Map::new()),
        // Refuse to touch a file we cannot parse rather than overwrite it
        Ok(text) => match serde_json::from_str::<Value>(&text) {
            Ok(Value::Object(map)) => Ok(map),
            _ => Err(format!(
                "{} is not plain JSON (it may contain comments); add the server by hand",
                path.display()
            )),
        },
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(Map::new()),
        Err(e) => Err(e.to_string()),
    }
}

/// Adds the server to the client's config and returns the files written
#[tauri::command]
pub fn connect_mcp_client(client: String) -> Result<Vec<String>, String> {
    let (paths, key) = targets(&client)?;
    let entry = server_entry(client == "vscode")?;
    let mut written = Vec::new();
    for path in paths {
        // Only the Store build's folder may be missing; skip it if so
        if !written.is_empty() && !path.parent().is_some_and(|p| p.exists()) {
            continue;
        }
        let mut config = read_config(&path)?;
        let servers = config.entry(key).or_insert_with(|| json!({}));
        if !servers.is_object() {
            *servers = json!({});
        }
        servers[SERVER_NAME] = entry.clone();
        if let Some(dir) = path.parent() {
            std::fs::create_dir_all(dir).map_err(|e| e.to_string())?;
        }
        let text = serde_json::to_string_pretty(&Value::Object(config)).map_err(|e| e.to_string())?;
        std::fs::write(&path, text).map_err(|e| e.to_string())?;
        written.push(path.display().to_string());
    }
    Ok(written)
}

/// Whether the client's config already points at this app
#[tauri::command]
pub fn is_mcp_client_connected(client: String) -> bool {
    let Ok((paths, key)) = targets(&client) else {
        return false;
    };
    paths.iter().any(|path| {
        read_config(path)
            .ok()
            .and_then(|config| config.get(key)?.get(SERVER_NAME).cloned())
            .is_some()
    })
}

/// The config snippet for any other MCP client
#[tauri::command]
pub fn mcp_config_snippet() -> Result<String, String> {
    let config = json!({ "mcpServers": { SERVER_NAME: server_entry(false)? } });
    serde_json::to_string_pretty(&config).map_err(|e| e.to_string())
}
