//! The GNOME Shell extension in linux/gnome-shell-extension, which does on
//! Wayland what only the compositor can: see behind the window, keep it
//! above the others and tell when it is being moved.

use std::sync::OnceLock;
use tauri::Runtime;
use zbus::blocking::Connection;
use zbus::message::Body;

const NAME: &str = "io.github.FaureGalliard.VocalTeleprompter.Shell";
const PATH: &str = "/io/github/FaureGalliard/VocalTeleprompter/Shell";

fn bus() -> Result<&'static Connection, String> {
    static BUS: OnceLock<Result<Connection, String>> = OnceLock::new();
    BUS.get_or_init(|| Connection::session().map_err(|e| e.to_string()))
        .as_ref()
        .map_err(Clone::clone)
}

pub fn call<B>(method: &str, body: &B) -> Result<Body, String>
where
    B: serde::Serialize + zbus::zvariant::DynamicType,
{
    bus()?
        .call_method(Some(NAME), PATH, Some(NAME), method, body)
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

/// Emits `window-moving` with true when the window starts being moved or
/// resized and false when it stops, which on Wayland only the compositor
/// knows
pub fn watch_moves<R: Runtime>(app: tauri::AppHandle<R>) {
    use tauri::Emitter;
    use zbus::blocking::MessageIterator;
    use zbus::message::Type;
    use zbus::MatchRule;

    std::thread::spawn(move || {
        let watch = || -> Result<(), String> {
            let rule = MatchRule::builder()
                .msg_type(Type::Signal)
                .interface(NAME)
                .and_then(|r| r.member("Moving"))
                .map_err(|e| e.to_string())?
                .build();
            let signals =
                MessageIterator::for_match_rule(rule, bus()?, None).map_err(|e| e.to_string())?;
            for signal in signals.flatten() {
                if let Ok(moving) = signal.body().deserialize::<bool>() {
                    let _ = app.emit("window-moving", moving);
                }
            }
            Ok(())
        };
        if let Err(e) = watch() {
            eprintln!("Could not follow the window's moves: {e}");
        }
    });
}
