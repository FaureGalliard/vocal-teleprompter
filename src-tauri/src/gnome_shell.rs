//! The GNOME Shell extension in linux/gnome-shell-extension, which does on
//! Wayland what only the compositor can: see behind the window and keep it
//! above the others.

use std::sync::OnceLock;
use tauri::Runtime;
use zbus::blocking::Connection;
use zbus::message::Body;

const NAME: &str = "io.github.FaureGalliard.VocalTeleprompter.Shell";
const PATH: &str = "/io/github/FaureGalliard/VocalTeleprompter/Shell";

pub fn call<B>(method: &str, body: &B) -> Result<Body, String>
where
    B: serde::Serialize + zbus::zvariant::DynamicType,
{
    static BUS: OnceLock<Result<Connection, String>> = OnceLock::new();
    let bus = BUS
        .get_or_init(|| Connection::session().map_err(|e| e.to_string()))
        .as_ref()?;
    bus.call_method(Some(NAME), PATH, Some(NAME), method, body)
        .map(|reply| reply.body())
        .map_err(|e| e.to_string())
}

/// Keeps the window above the others once it is on screen (Wayland ignores
/// the app's own request). Without the extension the window stays where
/// the desktop puts it.
pub fn keep_above<R: Runtime>(window: &tauri::Window<R>, event: &tauri::WindowEvent) {
    static DONE: OnceLock<()> = OnceLock::new();
    if window.label() == "main" && matches!(event, tauri::WindowEvent::Focused(true)) {
        DONE.get_or_init(|| {
            std::thread::spawn(|| {
                if let Err(e) = call("SetAbove", &(true,)) {
                    eprintln!("Could not keep the window above the others: {e}");
                }
            });
        });
    }
}
