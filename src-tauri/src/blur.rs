//! Frosted glass blurred live by Windows itself behind the window, as on
//! GNOME, so it follows a video or a dragged window at once and only the
//! letters wait for the looks behind the window. Windows blurs behind a
//! window it is asked to through an undocumented call its own taskbar and
//! Start menu use, on Windows 10 and 11 alike, whether the window has the
//! focus or not. (Windows 11's documented acrylic backdrop turns into a flat
//! gray as soon as the window loses the focus, which the prompter does
//! whenever the slides are clicked, so it cannot be used.)

use tauri::WebviewWindow;
use windows::Win32::Foundation::HWND;

/// The first Windows 10 build (1809) whose blur behind a window is reliable
const FIRST_BUILD: u32 = 17763;

/// Whether a Windows of this build blurs behind the window
fn blurs(build: u32) -> bool {
    build >= FIRST_BUILD
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
    if !blurs(build()) {
        return false;
    }
    let Ok(hwnd) = window.hwnd() else {
        return false;
    };
    let drawn = unsafe { blur(HWND(hwnd.0), on) };
    if !drawn {
        eprintln!("Windows would not blur behind the window");
    }
    drawn && on
}

/// Turns the blur behind the window on or off, through the undocumented
/// call the taskbar uses. The frame draws its tint over it.
unsafe fn blur(hwnd: HWND, on: bool) -> bool {
    use std::ffi::c_void;
    use windows::core::{s, w, BOOL};
    use windows::Win32::System::LibraryLoader::{GetModuleHandleW, GetProcAddress};

    #[repr(C)]
    struct AccentPolicy {
        state: u32,
        flags: u32,
        color: u32,
        animation: u32,
    }
    #[repr(C)]
    struct Data {
        attribute: u32,
        data: *mut c_void,
        size: usize,
    }
    type SetWindowCompositionAttribute = unsafe extern "system" fn(HWND, *mut Data) -> BOOL;
    const WCA_ACCENT_POLICY: u32 = 19;
    const ACCENT_DISABLED: u32 = 0;
    const ACCENT_ENABLE_BLURBEHIND: u32 = 3;

    let Ok(user32) = GetModuleHandleW(w!("user32.dll")) else {
        return false;
    };
    let Some(call) = GetProcAddress(user32, s!("SetWindowCompositionAttribute")) else {
        return false;
    };
    let call: SetWindowCompositionAttribute = std::mem::transmute(call);
    let mut policy = AccentPolicy {
        state: if on {
            ACCENT_ENABLE_BLURBEHIND
        } else {
            ACCENT_DISABLED
        },
        flags: 0,
        color: 0,
        animation: 0,
    };
    let mut data = Data {
        attribute: WCA_ACCENT_POLICY,
        data: &mut policy as *mut AccentPolicy as *mut c_void,
        size: size_of::<AccentPolicy>(),
    };
    call(hwnd, &mut data).as_bool()
}

#[cfg(test)]
mod tests {
    use super::blurs;

    #[test]
    fn windows_11_blurs_too_not_only_windows_10() {
        // Windows 11 once drew a flat gray instead, whenever the prompter
        // lost the focus
        assert!(blurs(22631));
        assert!(blurs(26100));
        assert!(blurs(22000));
    }

    #[test]
    fn windows_10_1809_and_later_blur() {
        assert!(blurs(19045));
        assert!(blurs(17763));
    }

    #[test]
    fn older_windows_10_draw_their_own_glass() {
        assert!(!blurs(17134));
        assert!(!blurs(0));
    }
}
