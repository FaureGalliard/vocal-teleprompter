//! Frosted glass blurred live by Windows itself behind the window, as on
//! GNOME, so it follows a video or a dragged window at once and only the
//! letters wait for the looks behind the window. Windows blurs behind a
//! window it is asked to through an undocumented call its own taskbar and
//! Start menu use, whether the window has the focus or not. (Windows 11's
//! documented acrylic backdrop turns into a flat gray as soon as the window
//! loses the focus, which the prompter does whenever the slides are
//! clicked, so it cannot be used.) That call has two kinds of glass, and
//! each Windows draws only one of them well: Windows 10 lags its acrylic
//! behind a dragged window, and Windows 11 22H2 and later draw its plain
//! blur as solid black. Either glass only shows through where the window
//! draws nothing, so the window has no redirection bitmap (see
//! tauri.conf.json): left to show, that bitmap filled it with black.

use tauri::WebviewWindow;
use windows::Win32::Foundation::HWND;

/// The first Windows 10 build (1809) whose glass behind a window is reliable
const FIRST_BUILD: u32 = 17763;
/// The first Windows 11 build (22H2) that draws the plain blur as black
const ACRYLIC_BUILD: u32 = 22621;

#[repr(C)]
#[derive(Clone, Copy, Debug, PartialEq)]
struct AccentPolicy {
    state: u32,
    flags: u32,
    // ABGR, Windows' tint over the glass
    color: u32,
    animation: u32,
}

const ACCENT_DISABLED: u32 = 0;
const ACCENT_ENABLE_BLURBEHIND: u32 = 3;
const ACCENT_ENABLE_ACRYLICBLURBEHIND: u32 = 4;
/// Tint the plain blur with `color`, rather than solid black
const ACCENT_TINTED: u32 = 2;

/// What to ask a Windows of this build for, while `on`: its glass tinted
/// with as little as it takes (the frame draws its own tint over it), or
/// none. None when it has no glass worth drawing.
fn policy(build: u32, on: bool) -> Option<AccentPolicy> {
    let off = AccentPolicy {
        state: ACCENT_DISABLED,
        flags: 0,
        color: 0,
        animation: 0,
    };
    if build < FIRST_BUILD {
        None
    } else if !on {
        Some(off)
    } else if build >= ACRYLIC_BUILD {
        // Acrylic with no tint at all draws nothing, so the faintest one
        Some(AccentPolicy {
            state: ACCENT_ENABLE_ACRYLICBLURBEHIND,
            color: 1 << 24,
            ..off
        })
    } else {
        Some(AccentPolicy {
            state: ACCENT_ENABLE_BLURBEHIND,
            flags: ACCENT_TINTED,
            ..off
        })
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

/// Blurs behind the window, or stops. True while Windows blurs it.
pub fn set(window: &WebviewWindow, on: bool) -> bool {
    let Some(policy) = policy(build(), on) else {
        return false;
    };
    let Ok(hwnd) = window.hwnd() else {
        return false;
    };
    // As a number, which can go to another thread
    let hwnd = hwnd.0 as isize;
    let (done, drawn) = std::sync::mpsc::channel();
    // On the thread that owns the window, as Tauri's own window effects do
    let asked = window.run_on_main_thread(move || {
        let _ = done.send(unsafe { apply(HWND(hwnd as *mut _), policy) });
    });
    let drawn = asked.is_ok() && drawn.recv().unwrap_or(false);
    if !drawn {
        eprintln!("Windows would not blur behind the window");
    }
    drawn && on
}

/// Hands the policy to Windows, through the undocumented call the taskbar uses
unsafe fn apply(hwnd: HWND, mut policy: AccentPolicy) -> bool {
    use std::ffi::c_void;
    use windows::core::{s, w, BOOL};
    use windows::Win32::System::LibraryLoader::{GetModuleHandleW, GetProcAddress};

    #[repr(C)]
    struct Data {
        attribute: u32,
        data: *mut c_void,
        size: usize,
    }
    type SetWindowCompositionAttribute = unsafe extern "system" fn(HWND, *mut Data) -> BOOL;
    const WCA_ACCENT_POLICY: u32 = 19;

    let Ok(user32) = GetModuleHandleW(w!("user32.dll")) else {
        return false;
    };
    let Some(call) = GetProcAddress(user32, s!("SetWindowCompositionAttribute")) else {
        return false;
    };
    let call: SetWindowCompositionAttribute = std::mem::transmute(call);
    let mut data = Data {
        attribute: WCA_ACCENT_POLICY,
        data: &mut policy as *mut AccentPolicy as *mut c_void,
        size: size_of::<AccentPolicy>(),
    };
    call(hwnd, &mut data).as_bool()
}

#[cfg(test)]
mod tests {
    use super::*;

    const WINDOWS_10_22H2: u32 = 19045;
    const WINDOWS_11_23H2: u32 = 22631;

    #[test]
    fn windows_10_gets_the_plain_blur_tinted_with_nothing() {
        // Without the tint flag, Windows filled the window with black
        let on = policy(WINDOWS_10_22H2, true).unwrap();
        assert_eq!(on.state, ACCENT_ENABLE_BLURBEHIND);
        assert_eq!(on.flags, ACCENT_TINTED);
        assert_eq!(on.color >> 24, 0, "the tint must be fully transparent");
        assert_eq!(policy(17763, true).unwrap().state, ACCENT_ENABLE_BLURBEHIND);
        // The first Windows 11 lags acrylic like Windows 10 does
        assert_eq!(policy(22000, true).unwrap().state, ACCENT_ENABLE_BLURBEHIND);
    }

    #[test]
    fn windows_11_22h2_and_later_get_acrylic_not_a_black_blur() {
        // Its plain blur filled the window with black
        for build in [22621, WINDOWS_11_23H2, 26100] {
            let on = policy(build, true).unwrap();
            assert_eq!(on.state, ACCENT_ENABLE_ACRYLICBLURBEHIND);
            // Barely tinted: acrylic with no tint at all draws nothing
            assert_eq!(on.color >> 24, 1);
        }
    }

    #[test]
    fn turning_it_off_asks_for_no_accent() {
        for build in [WINDOWS_10_22H2, WINDOWS_11_23H2] {
            assert_eq!(policy(build, false).unwrap().state, ACCENT_DISABLED);
        }
    }

    #[test]
    fn the_window_has_no_bitmap_to_cover_the_glass_with_black() {
        let config: serde_json::Value =
            serde_json::from_str(include_str!("../tauri.conf.json")).unwrap();
        let window = &config["app"]["windows"][0];
        assert_eq!(window["transparent"], true);
        assert_eq!(window["noRedirectionBitmap"], true);
        // Its windows list would replace this one, flag and all
        let windows: serde_json::Value =
            serde_json::from_str(include_str!("../tauri.windows.conf.json")).unwrap();
        assert!(windows["app"]["windows"].is_null());
    }

    #[test]
    fn older_windows_10_draw_their_own_glass() {
        assert_eq!(policy(17134, true), None);
        assert_eq!(policy(0, true), None);
    }
}
