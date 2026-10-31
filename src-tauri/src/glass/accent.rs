//! Windows 10's glass: the blur behind a window that the taskbar and the
//! Start menu use, asked for through an undocumented call. It keeps going
//! whether the window has the focus or not.

use tauri::WebviewWindow;
use windows::Win32::Foundation::HWND;

#[repr(C)]
#[derive(Clone, Copy, Debug, PartialEq)]
struct AccentPolicy {
    state: u32,
    flags: u32,
    // ABGR, Windows' tint over the blur
    color: u32,
    animation: u32,
}

const ACCENT_DISABLED: u32 = 0;
const ACCENT_ENABLE_BLURBEHIND: u32 = 3;
/// Tint the blur with `color`, rather than solid black
const ACCENT_TINTED: u32 = 2;

/// The blur, tinted with nothing (the frame draws its own tint over it), or
/// no blur
fn policy(on: bool) -> AccentPolicy {
    AccentPolicy {
        state: if on {
            ACCENT_ENABLE_BLURBEHIND
        } else {
            ACCENT_DISABLED
        },
        flags: if on { ACCENT_TINTED } else { 0 },
        color: 0,
        animation: 0,
    }
}

/// Blurs behind the window, or stops. True while Windows blurs it.
pub fn set(window: &WebviewWindow, on: bool) -> bool {
    let Ok(hwnd) = window.hwnd() else {
        return false;
    };
    // As a number, which can go to another thread
    let hwnd = hwnd.0 as isize;
    let (done, drawn) = std::sync::mpsc::channel();
    // On the thread that owns the window, as Tauri's own window effects do
    let asked = window.run_on_main_thread(move || {
        let _ = done.send(unsafe { apply(HWND(hwnd as *mut _), policy(on)) });
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

    #[test]
    fn the_blur_is_tinted_with_nothing_not_solid_black() {
        // Without the tint flag, Windows filled the window with black
        let on = policy(true);
        assert_eq!(on.state, ACCENT_ENABLE_BLURBEHIND);
        assert_eq!(on.flags, ACCENT_TINTED);
        assert_eq!(on.color >> 24, 0, "the tint must be fully transparent");
    }

    #[test]
    fn turning_it_off_asks_for_no_accent() {
        assert_eq!(policy(false).state, ACCENT_DISABLED);
    }
}
