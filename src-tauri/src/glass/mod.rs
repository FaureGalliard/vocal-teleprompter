//! Frosted glass drawn live behind the window on Windows, as GNOME Shell
//! draws it on Linux: it follows a video or a dragged window at once, and
//! only the letters wait for the looks behind the window.
//!
//! Windows 11 blurs what shows through the window in the window's own
//! composition layer, under the page, as Windows Terminal does for its
//! acrylic (see `composition`): it does not care about the focus, blurs as
//! much as asked, and leaves out the room kept below the text for the
//! toolbar. Windows 10 blurs behind the window through the undocumented call
//! its taskbar uses (see `accent`), as strongly as it always does and over
//! the whole window. Neither of Windows' own ready-made glasses works on
//! Windows 11: its documented acrylic backdrop turns flat gray whenever the
//! window loses the focus, which the prompter does each time the slides are
//! clicked, and the taskbar's call draws solid black from 22H2 on.

mod accent;
mod composition;

use tauri::WebviewWindow;

/// The first Windows 10 build (1809) whose blur behind a window is reliable
const ACCENT_BUILD: u32 = 17763;
/// The first Windows 11 build
const COMPOSITION_BUILD: u32 = 22000;

/// How Windows draws the glass
#[derive(Clone, Copy, Debug, PartialEq)]
enum Way {
    /// A blurred visual under the page, in the window's composition layer
    Composition,
    /// The blur behind the window the taskbar uses
    Accent,
}

/// How a Windows of this build draws the glass, if it can
fn way(build: u32) -> Option<Way> {
    if build >= COMPOSITION_BUILD {
        Some(Way::Composition)
    } else if build >= ACCENT_BUILD {
        Some(Way::Accent)
    } else {
        None
    }
}

/// The build of the running Windows, which only the kernel tells as it is
fn build() -> u32 {
    use windows::Wdk::System::SystemServices::RtlGetVersion;
    use windows::Win32::System::SystemInformation::OSVERSIONINFOW;

    let mut info = OSVERSIONINFOW {
        dwOSVersionInfoSize: size_of::<OSVERSIONINFOW>() as u32,
        ..Default::default()
    };
    if unsafe { RtlGetVersion(&mut info) }.is_ok() {
        info.dwBuildNumber
    } else {
        0
    }
}

/// Blurs what is behind the window by `radius` (logical pixels; 0 takes the
/// glass away), but for `room` logical pixels at its bottom. True while
/// Windows draws it, so the app need not draw its own.
pub fn set(window: &WebviewWindow, radius: i32, room: i32) -> bool {
    match way(build()) {
        Some(Way::Composition) => composition::set(window, radius, room),
        // It frosts the whole window, room and all: the app draws its own
        // glass while the window keeps room for the toolbar
        Some(Way::Accent) => accent::set(window, radius > 0 && room == 0),
        None => false,
    }
}

/// Holds the glass at the text's `height` while the window grows or
/// shrinks around it for the toolbar, or lets it follow the window again.
/// Only Windows 11's glass covers part of the window; Windows 10's covers
/// all of it and is taken away while the toolbar is open anyway.
pub fn pin(window: &WebviewWindow, height: Option<f64>) {
    if way(build()) == Some(Way::Composition) {
        composition::pin(window, height);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn windows_11_draws_its_own_glass_in_the_composition_layer() {
        // The taskbar's call drew black on Windows 11 22H2 and later, and the
        // documented acrylic turned gray whenever the prompter lost the focus
        for build in [22000, 22621, 22631, 26100] {
            assert_eq!(way(build), Some(Way::Composition));
        }
    }

    #[test]
    fn windows_10_blurs_behind_the_window_as_the_taskbar_does() {
        assert_eq!(way(19045), Some(Way::Accent));
        assert_eq!(way(17763), Some(Way::Accent));
    }

    #[test]
    fn older_windows_10_leave_the_glass_to_the_app() {
        assert_eq!(way(17134), None);
        assert_eq!(way(0), None);
    }

    #[test]
    fn the_window_has_no_bitmap_to_cover_the_glass_with() {
        // Windows Terminal's window has none either, for the same reason
        let config: serde_json::Value =
            serde_json::from_str(include_str!("../../tauri.conf.json")).unwrap();
        let window = &config["app"]["windows"][0];
        assert_eq!(window["transparent"], true);
        assert_eq!(window["noRedirectionBitmap"], true);
        // Its windows list would replace this one, flag and all
        let windows: serde_json::Value =
            serde_json::from_str(include_str!("../../tauri.windows.conf.json")).unwrap();
        assert!(windows["app"]["windows"].is_null());
    }
}
