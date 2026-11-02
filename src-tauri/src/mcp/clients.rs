//! One-click setup: adds this app as an MCP server to the config file of
//! Claude Desktop, Cursor or VS Code, keeping everything else in the file.

use serde_json::{json, Map, Value};
use std::path::{Path, PathBuf};

const SERVER_NAME: &str = "vocal-teleprompter";

const CLIENTS: [&str; 4] = ["claude", "claude-code", "cursor", "vscode"];

fn current_exe() -> Result<PathBuf, String> {
    // An AppImage runs from a folder mounted anew on every start, so point at
    // the AppImage file itself
    match std::env::var_os("APPIMAGE") {
        Some(appimage) => Ok(PathBuf::from(appimage)),
        None => std::env::current_exe().map_err(|e| e.to_string()),
    }
}

fn server_entry(client: &str) -> Result<Value, String> {
    let exe = current_exe()?;
    let mut entry = json!({ "command": exe.to_string_lossy(), "args": ["--mcp"] });
    // VS Code and Claude Code spell out the transport
    if client == "vscode" || client == "claude-code" {
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
                            paths.push(
                                entry
                                    .path()
                                    .join("LocalCache")
                                    .join("Roaming")
                                    .join("Claude"),
                            );
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
        // Top-level servers in ~/.claude.json are Claude Code's user scope:
        // available in every session and folder, unlike per-project ones
        "claude-code" => Ok((
            vec![dirs::home_dir().ok_or_else(missing)?.join(".claude.json")],
            "mcpServers",
        )),
        "cursor" => Ok((
            vec![dirs::home_dir()
                .ok_or_else(missing)?
                .join(".cursor")
                .join("mcp.json")],
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

fn read_config(path: &Path) -> Result<Map<String, Value>, String> {
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
    let entry = server_entry(&client)?;
    let mut written = Vec::new();
    for path in paths {
        // Only the Store build's folder may be missing; skip it if so
        if !written.is_empty() && !path.parent().is_some_and(|p| p.exists()) {
            continue;
        }
        add_server(&path, key, &entry)?;
        written.push(path.display().to_string());
    }
    Ok(written)
}

/// Sets this app's entry under `key` in a JSON config file, leaving every
/// other setting, and the order of the keys, as it was
fn add_server(path: &Path, key: &str, entry: &Value) -> Result<(), String> {
    let mut config = read_config(path)?;
    let servers = config.entry(key).or_insert_with(|| json!({}));
    if !servers.is_object() {
        *servers = json!({});
    }
    servers[SERVER_NAME] = entry.clone();
    if let Some(dir) = path.parent() {
        std::fs::create_dir_all(dir).map_err(|e| e.to_string())?;
    }
    let text = serde_json::to_string_pretty(&Value::Object(config)).map_err(|e| e.to_string())?;
    std::fs::write(path, text).map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn temp_file(name: &str, content: &str) -> PathBuf {
        let path = std::env::temp_dir().join(format!("vt-test-{}-{name}", std::process::id()));
        std::fs::write(&path, content).unwrap();
        path
    }

    #[test]
    fn keeps_everything_else_in_the_config() {
        let path = temp_file(
            "claude.json",
            r#"{"numStartups": 5, "mcpServers": {"other": {"command": "x"}}, "userID": "abc"}"#,
        );
        add_server(
            &path,
            "mcpServers",
            &json!({"command": "vt.exe", "args": ["--mcp"]}),
        )
        .unwrap();
        let text = std::fs::read_to_string(&path).unwrap();
        let config: Value = serde_json::from_str(&text).unwrap();

        assert_eq!(config["numStartups"], 5);
        assert_eq!(config["userID"], "abc");
        assert_eq!(config["mcpServers"]["other"]["command"], "x");
        assert_eq!(config["mcpServers"][SERVER_NAME]["args"][0], "--mcp");
        // Keys stay in their original order, so the file is not reshuffled
        let order: Vec<_> = config.as_object().unwrap().keys().cloned().collect();
        assert_eq!(order, ["numStartups", "mcpServers", "userID"]);
        let _ = std::fs::remove_file(path);
    }

    #[test]
    fn refuses_to_rewrite_a_file_it_cannot_parse() {
        let path = temp_file(
            "broken.json",
            "{ // a comment
 }",
        );
        assert!(add_server(&path, "mcpServers", &json!({})).is_err());
        assert_eq!(
            std::fs::read_to_string(&path).unwrap(),
            "{ // a comment
 }"
        );
        let _ = std::fs::remove_file(path);
    }

    #[test]
    fn creates_a_missing_config() {
        let path = std::env::temp_dir().join(format!("vt-test-{}-new.json", std::process::id()));
        let _ = std::fs::remove_file(&path);
        add_server(&path, "servers", &json!({"type": "stdio"})).unwrap();
        let config: Value = serde_json::from_str(&std::fs::read_to_string(&path).unwrap()).unwrap();
        assert_eq!(config["servers"][SERVER_NAME]["type"], "stdio");
        let _ = std::fs::remove_file(path);
    }
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
    let config = json!({ "mcpServers": { SERVER_NAME: server_entry("other")? } });
    serde_json::to_string_pretty(&config).map_err(|e| e.to_string())
}

/// Points the configs that already list this app at the running copy when
/// the file they name is gone, as after reinstalling it in another folder or
/// downloading a newer AppImage, so the user does not have to connect again
pub fn repair_stale_entries() {
    // A dev build would hijack the configs of the installed app
    if cfg!(debug_assertions) {
        return;
    }
    let Ok(exe) = current_exe() else {
        return;
    };
    for client in CLIENTS {
        let Ok((paths, key)) = targets(client) else {
            continue;
        };
        for path in paths {
            if let Err(e) = repoint_server(&path, key, &exe) {
                eprintln!("Could not update {}: {e}", path.display());
            }
        }
    }
}

/// Rewrites the command of this app's entry under `key` when the file it
/// names no longer exists; returns whether the config changed
fn repoint_server(path: &Path, key: &str, exe: &Path) -> Result<bool, String> {
    if !path.exists() {
        return Ok(false);
    }
    let mut config = read_config(path)?;
    let Some(entry) = config
        .get_mut(key)
        .and_then(|servers| servers.get_mut(SERVER_NAME))
        .and_then(Value::as_object_mut)
    else {
        return Ok(false);
    };
    let stale = match entry.get("command").and_then(Value::as_str) {
        Some(command) => !Path::new(command).exists(),
        None => true,
    };
    if !stale {
        return Ok(false);
    }
    entry.insert("command".into(), json!(exe.to_string_lossy()));
    let text = serde_json::to_string_pretty(&Value::Object(config)).map_err(|e| e.to_string())?;
    std::fs::write(path, text).map_err(|e| e.to_string())?;
    Ok(true)
}

#[cfg(test)]
mod repair_tests {
    use super::*;

    fn temp_file(name: &str, content: &str) -> PathBuf {
        let path = std::env::temp_dir().join(format!("vt-repair-{}-{name}", std::process::id()));
        std::fs::write(&path, content).unwrap();
        path
    }

    #[test]
    fn repoints_an_entry_whose_exe_is_gone() {
        let path = temp_file(
            "stale.json",
            &json!({"mcpServers": {
                SERVER_NAME: {"type": "stdio", "command": r"C:\Program Files\gone\vt.exe", "args": ["--mcp"], "env": {}},
                "other": {"command": "x"}
            }})
            .to_string(),
        );
        let exe = std::env::current_exe().unwrap();
        assert!(repoint_server(&path, "mcpServers", &exe).unwrap());
        let config: Value = serde_json::from_str(&std::fs::read_to_string(&path).unwrap()).unwrap();
        let entry = &config["mcpServers"][SERVER_NAME];
        assert_eq!(entry["command"], exe.to_string_lossy().as_ref());
        // Everything else in the entry and the file stays
        assert_eq!(entry["type"], "stdio");
        assert_eq!(entry["args"][0], "--mcp");
        assert_eq!(config["mcpServers"]["other"]["command"], "x");
        let _ = std::fs::remove_file(path);
    }

    #[test]
    fn leaves_an_entry_whose_exe_still_exists() {
        let other = std::env::current_exe().unwrap();
        let content = json!({"mcpServers": {SERVER_NAME: {"command": other.to_string_lossy(), "args": ["--mcp"]}}}).to_string();
        let path = temp_file("fine.json", &content);
        assert!(!repoint_server(&path, "mcpServers", Path::new("elsewhere.exe")).unwrap());
        assert_eq!(std::fs::read_to_string(&path).unwrap(), content);
        let _ = std::fs::remove_file(path);
    }

    #[test]
    fn never_adds_the_app_to_a_config_that_does_not_list_it() {
        let content = r#"{"mcpServers": {"other": {"command": "x"}}}"#;
        let path = temp_file("absent.json", content);
        assert!(!repoint_server(&path, "mcpServers", Path::new("vt.exe")).unwrap());
        assert_eq!(std::fs::read_to_string(&path).unwrap(), content);
        let _ = std::fs::remove_file(path);

        let missing =
            std::env::temp_dir().join(format!("vt-repair-{}-none.json", std::process::id()));
        assert!(!repoint_server(&missing, "mcpServers", Path::new("vt.exe")).unwrap());
        assert!(!missing.exists());
    }
}
