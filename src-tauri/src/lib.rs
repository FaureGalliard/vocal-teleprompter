mod backdrop;
mod behind;
#[cfg(target_os = "linux")]
mod desktop_entry;
#[cfg(target_os = "linux")]
mod gnome_shell;
mod input;
mod mcp;
pub mod speech;

use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, Wry,
};

// Tray menu entries, kept so the frontend can relabel them in its language
struct TrayItems {
    show: MenuItem<Wry>,
    hide: MenuItem<Wry>,
    click_through: MenuItem<Wry>,
    quit: MenuItem<Wry>,
}

/// Whether something on the desktop shows tray icons. GNOME shows none
/// without an extension, and the tray library then falls back to a GTK
/// status icon that cannot work on Wayland and only logs errors.
fn tray_shown() -> bool {
    #[cfg(target_os = "linux")]
    {
        use zbus::blocking::{fdo::DBusProxy, Connection};
        let watcher = zbus::names::BusName::try_from("org.kde.StatusNotifierWatcher").unwrap();
        Connection::session()
            .and_then(|bus| {
                DBusProxy::new(&bus)?
                    .name_has_owner(watcher)
                    .map_err(Into::into)
            })
            .unwrap_or(false)
    }
    #[cfg(not(target_os = "linux"))]
    true
}

/// Leaves the window out of screenshots and screen shares, or lets it show
#[tauri::command]
fn set_hidden_from_capture(window: tauri::WebviewWindow, hidden: bool) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        let _ = window;
        gnome_shell::set_hidden_from_capture(hidden);
        Ok(())
    }
    #[cfg(not(target_os = "linux"))]
    window
        .set_content_protected(hidden)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn set_tray_labels(
    items: tauri::State<'_, TrayItems>,
    show: String,
    hide: String,
    click_through: String,
    quit: String,
) -> Result<(), String> {
    items.show.set_text(show).map_err(|e| e.to_string())?;
    items.hide.set_text(hide).map_err(|e| e.to_string())?;
    items
        .click_through
        .set_text(click_through)
        .map_err(|e| e.to_string())?;
    items.quit.set_text(quit).map_err(|e| e.to_string())?;
    Ok(())
}

/// `vocal-teleprompter --mcp`: serve AI assistants over stdio instead of
/// opening the window
pub fn run_mcp_server() {
    mcp::server::run()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .manage(mcp::bridge::Bridge::default())
        .manage(speech::SpeechEngine::default())
        .invoke_handler(tauri::generate_handler![
            set_tray_labels,
            set_hidden_from_capture,
            backdrop::capture_backdrop,
            speech::list_microphones,
            speech::speech_start,
            speech::speech_stop,
            speech::mic_monitor_start,
            speech::mic_monitor_stop,
            speech::models::speech_model_status,
            speech::models::download_speech_model,
            mcp::bridge::mcp_respond,
            mcp::bridge::mcp_ready,
            mcp::clients::connect_mcp_client,
            mcp::clients::is_mcp_client_connected,
            mcp::clients::mcp_config_snippet
        ])
        .on_window_event(|window, event| {
            #[cfg(target_os = "linux")]
            gnome_shell::on_shown(window, event);
            #[cfg(not(target_os = "linux"))]
            let _ = (window, event);
        })
        .setup(|app| {
            // Most Linux desktops have no tray, so the window has to stay in
            // the dock and Alt+Tab to be found again after minimizing it
            #[cfg(target_os = "linux")]
            if let Some(win) = app.get_webview_window("main") {
                let _ = win.set_skip_taskbar(false);
            }
            #[cfg(target_os = "linux")]
            desktop_entry::ensure();
            #[cfg(target_os = "linux")]
            gnome_shell::watch_moves(app.handle().clone());
            #[cfg(target_os = "linux")]
            gnome_shell::watch_extension();
            input::watch(app.handle().clone());
            if let Err(e) = mcp::bridge::start(app.handle()) {
                eprintln!("AI connector bridge unavailable: {e}");
            }
            let show = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
            let hide = MenuItem::with_id(app, "hide", "Hide", true, None::<&str>)?;
            // Way back out of click-through mode, since the window takes no clicks then
            let click_through =
                MenuItem::with_id(app, "click_through", "Click-through", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &hide, &click_through, &quit])?;
            app.manage(TrayItems {
                show: show.clone(),
                hide: hide.clone(),
                click_through: click_through.clone(),
                quit: quit.clone(),
            });

            if tray_shown() {
                TrayIconBuilder::new()
                    .icon(app.default_window_icon().unwrap().clone())
                    .tooltip("Vocal Teleprompter")
                    .menu(&menu)
                    .show_menu_on_left_click(false)
                    .on_menu_event(|app, event| match event.id.as_ref() {
                        "show" => {
                            if let Some(win) = app.get_webview_window("main") {
                                let _ = win.unminimize();
                                let _ = win.show();
                                let _ = win.set_focus();
                            }
                        }
                        "hide" => {
                            if let Some(win) = app.get_webview_window("main") {
                                let _ = win.hide();
                            }
                        }
                        "click_through" => {
                            let _ = app.emit("toggle-click-through", ());
                        }
                        "quit" => app.exit(0),
                        _ => {}
                    })
                    .on_tray_icon_event(|tray, event| {
                        if let TrayIconEvent::Click {
                            button: MouseButton::Left,
                            ..
                        } = event
                        {
                            let app = tray.app_handle();
                            if let Some(win) = app.get_webview_window("main") {
                                if win.is_visible().unwrap_or(false) {
                                    let _ = win.hide();
                                } else {
                                    let _ = win.unminimize();
                                    let _ = win.show();
                                    let _ = win.set_focus();
                                }
                            }
                        }
                    })
                    .build(app)?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
