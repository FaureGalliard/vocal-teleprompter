//! The GNOME Shell extension in linux/gnome-shell-extension, which does on
//! Wayland what only the compositor can: see behind the window, keep it
//! above the others, leave it out of screen shares and tell when it is
//! being moved.

use std::sync::atomic::{AtomicBool, Ordering};
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

// Whether the window should be left out of screenshots and screen shares
static HIDDEN: AtomicBool = AtomicBool::new(true);

fn apply_hidden() -> Result<(), String> {
    call("SetHiddenFromCapture", &(HIDDEN.load(Ordering::Relaxed),)).map(drop)
}

/// Leaves the window out of screenshots and screen shares, or lets it show.
/// Applied again once the window is on screen, in case it was not yet.
pub fn set_hidden_from_capture(hidden: bool) {
    HIDDEN.store(hidden, Ordering::Relaxed);
    std::thread::spawn(|| {
        let _ = apply_hidden();
    });
}

// The window is on screen, so the extension can find it
static SHOWN: AtomicBool = AtomicBool::new(false);

/// Keeps the window above the others (Wayland ignores the app's own
/// request) and hidden from capture as asked. Without the extension the
/// window stays where the desktop puts it.
fn apply_all() {
    if let Err(e) = call("SetAbove", &(true,)) {
        eprintln!("Could not keep the window above the others: {e}");
    }
    if let Err(e) = apply_hidden() {
        eprintln!("Could not hide the window from capture: {e}");
    }
}

/// Applies everything once the window is on screen
pub fn on_shown<R: Runtime>(window: &tauri::Window<R>, event: &tauri::WindowEvent) {
    if window.label() == "main"
        && matches!(event, tauri::WindowEvent::Focused(true))
        && !SHOWN.swap(true, Ordering::Relaxed)
    {
        std::thread::spawn(apply_all);
    }
}

/// Applies everything again whenever the extension starts, turned on or
/// reloaded after the app, which would otherwise lose it until restarted
pub fn watch_extension() {
    use zbus::blocking::fdo::DBusProxy;

    std::thread::spawn(|| {
        let watch = || -> Result<(), String> {
            let dbus = DBusProxy::new(bus()?).map_err(|e| e.to_string())?;
            let changes = dbus
                .receive_name_owner_changed_with_args(&[(0, NAME)])
                .map_err(|e| e.to_string())?;
            for change in changes {
                let started = change.args().is_ok_and(|a| a.new_owner().is_some());
                if started && SHOWN.load(Ordering::Relaxed) {
                    apply_all();
                }
            }
            Ok(())
        };
        if let Err(e) = watch() {
            eprintln!("Could not watch for the GNOME Shell extension: {e}");
        }
    });
}

/// Passes on what on Wayland only the compositor knows: `window-moving`,
/// true when the window starts being moved or resized and false when it
/// stops, and `user-input` after a click, a key or the wheel anywhere, as
/// `input` does on Windows
pub fn watch_signals<R: Runtime>(app: tauri::AppHandle<R>) {
    use tauri::Emitter;
    use zbus::blocking::MessageIterator;
    use zbus::message::Type;
    use zbus::MatchRule;

    std::thread::spawn(move || {
        let watch = || -> Result<(), String> {
            let rule = MatchRule::builder()
                .msg_type(Type::Signal)
                .interface(NAME)
                .map_err(|e| e.to_string())?
                .build();
            let signals =
                MessageIterator::for_match_rule(rule, bus()?, None).map_err(|e| e.to_string())?;
            for signal in signals.flatten() {
                match signal.header().member().map(|m| m.as_str()) {
                    Some("Moving") => {
                        if let Ok(moving) = signal.body().deserialize::<bool>() {
                            let _ = app.emit("window-moving", moving);
                        }
                    }
                    Some("UserInput") => {
                        let _ = app.emit("user-input", ());
                    }
                    _ => {}
                }
            }
            Ok(())
        };
        if let Err(e) = watch() {
            eprintln!("Could not follow the GNOME Shell extension: {e}");
        }
    });
}
