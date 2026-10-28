// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    if std::env::args().any(|arg| arg == "--mcp") {
        vocal_teleprompter_lib::run_mcp_server()
    } else {
        vocal_teleprompter_lib::run()
    }
}
