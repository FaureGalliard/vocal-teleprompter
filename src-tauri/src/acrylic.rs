//! Frosted glass drawn live by Windows itself behind the window, so it
//! follows a video or a dragged window at once, with no look behind the
//! window. Windows 11 draws the acrylic backdrop of transient windows, and
//! paints it as a flat color while the window is inactive, which the
//! prompter almost always is (the slides have the focus), so the window is
//! kept looking active. Windows 10 has no such backdrop, but blurs behind a
//! window it is asked to through an undocumented call that its own taskbar
//! and Start menu use.

use tauri::WebviewWindow;
use windows::Win32::Foundation::{HWND, LPARAM, LRESULT, WPARAM};

/// The first Windows 11 build that draws the acrylic backdrop for any window
const BACKDROP_BUILD: u32 = 22621;
/// The first Windows 10 build (1809) whose blur behind a window is reliable
const BLUR_BUILD: u32 = 17763;

/// Picked by this app, to find its own subclass of the window again
const SUBCLASS_ID: usize = 0x7670_6774;

/// How Windows draws the glass
#[derive(Clone, Copy, Debug, PartialEq)]
enum Kind {
    /// Windows 11's acrylic backdrop
    Backdrop,
    /// The blur behind the window of Windows 10 and the first Windows 11.
    /// Windows 11 22H2 lags it behind a dragged window, but has the backdrop.
    Blur,
}

/// How a Windows of this build draws the glass, if it can
fn kind(build: u32) -> Option<Kind> {
    if build >= BACKDROP_BUILD {
        Some(Kind::Backdrop)
    } else if build >= BLUR_BUILD {
        Some(Kind::Blur)
    } else {
        None
    }
}

/// The build of the running Windows, which only the kernel tells as it is
pub fn build() -> u32 {
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

/// Shows the glass, tinted dark or light, or takes it away. True while
/// Windows draws it.
pub fn set(window: &WebviewWindow, on: bool, dark: bool) -> bool {
    let Some(kind) = kind(build()) else {
        return false;
    };
    let Ok(hwnd) = window.hwnd() else {
        return false;
    };
    // As a number, which can go to another thread
    let hwnd = hwnd.0 as isize;
    let (done, drawn) = std::sync::mpsc::channel();
    // The subclass only takes on the thread that owns the window
    let set = window.run_on_main_thread(move || {
        let hwnd = HWND(hwnd as *mut _);
        let drawn = match kind {
            Kind::Backdrop => unsafe { apply(hwnd, on, dark) },
            Kind::Blur => unsafe { blur(hwnd, on) },
        };
        let _ = done.send(drawn);
    });
    set.is_ok() && drawn.recv().unwrap_or(false) && on
}

unsafe fn apply(hwnd: HWND, on: bool, dark: bool) -> bool {
    use std::ffi::c_void;
    use windows::core::BOOL;
    use windows::Win32::Graphics::Dwm::{
        DwmSetWindowAttribute, DWMSBT_NONE, DWMSBT_TRANSIENTWINDOW, DWMWA_SYSTEMBACKDROP_TYPE,
        DWMWA_USE_IMMERSIVE_DARK_MODE, DWMWA_WINDOW_CORNER_PREFERENCE, DWMWCP_DONOTROUND,
        DWM_SYSTEMBACKDROP_TYPE, DWM_WINDOW_CORNER_PREFERENCE,
    };
    use windows::Win32::UI::Shell::SetWindowSubclass;
    use windows::Win32::UI::WindowsAndMessaging::{DefWindowProcW, WM_NCACTIVATE};

    let dark = BOOL::from(dark);
    let _ = DwmSetWindowAttribute(
        hwnd,
        DWMWA_USE_IMMERSIVE_DARK_MODE,
        &dark as *const BOOL as *const c_void,
        size_of::<BOOL>() as u32,
    );
    // Square, like the frame drawn over it
    let corners = DWMWCP_DONOTROUND;
    let _ = DwmSetWindowAttribute(
        hwnd,
        DWMWA_WINDOW_CORNER_PREFERENCE,
        &corners as *const DWM_WINDOW_CORNER_PREFERENCE as *const c_void,
        size_of::<DWM_WINDOW_CORNER_PREFERENCE>() as u32,
    );
    let kind = if on {
        DWMSBT_TRANSIENTWINDOW
    } else {
        DWMSBT_NONE
    };
    let drawn = DwmSetWindowAttribute(
        hwnd,
        DWMWA_SYSTEMBACKDROP_TYPE,
        &kind as *const DWM_SYSTEMBACKDROP_TYPE as *const c_void,
        size_of::<DWM_SYSTEMBACKDROP_TYPE>() as u32,
    )
    .is_ok();
    if drawn && on && SetWindowSubclass(hwnd, Some(stay_active), SUBCLASS_ID, 0).as_bool() {
        // Look active right away, not only from the next focus change
        DefWindowProcW(hwnd, WM_NCACTIVATE, WPARAM(1), LPARAM(0));
    }
    drawn
}

/// Lets the window learn that it lost the focus as usual, then tells
/// Windows to keep drawing it as active, so the glass stays
unsafe extern "system" fn stay_active(
    hwnd: HWND,
    message: u32,
    wparam: WPARAM,
    lparam: LPARAM,
    _id: usize,
    _data: usize,
) -> LRESULT {
    use windows::Win32::UI::Shell::DefSubclassProc;
    use windows::Win32::UI::WindowsAndMessaging::{DefWindowProcW, WM_NCACTIVATE};

    let result = DefSubclassProc(hwnd, message, wparam, lparam);
    if message == WM_NCACTIVATE && wparam.0 == 0 {
        DefWindowProcW(hwnd, WM_NCACTIVATE, WPARAM(1), lparam);
    }
    result
}

/// Turns Windows 10's blur behind the window on or off, through the
/// undocumented call its own taskbar uses. The frame draws its tint over it.
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
    use super::*;

    #[test]
    fn windows_11_22h2_and_later_draw_the_backdrop() {
        assert_eq!(kind(22621), Some(Kind::Backdrop));
        assert_eq!(kind(26100), Some(Kind::Backdrop));
    }

    #[test]
    fn windows_10_and_the_first_windows_11_blur() {
        // Windows 10 22H2, the last one, has the glass too
        assert_eq!(kind(19045), Some(Kind::Blur));
        assert_eq!(kind(17763), Some(Kind::Blur));
        assert_eq!(kind(22000), Some(Kind::Blur));
    }

    #[test]
    fn older_windows_10_draw_their_own_glass() {
        assert_eq!(kind(17134), None);
        assert_eq!(kind(0), None);
    }
}
