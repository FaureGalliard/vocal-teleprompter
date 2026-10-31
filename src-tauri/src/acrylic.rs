//! Frosted glass drawn live by Windows 11 itself behind the window: the
//! acrylic backdrop of transient windows. It follows a video or a dragged
//! window at once, with no look behind the window. Windows paints it as a
//! flat color while the window is inactive, which the prompter almost always
//! is (the slides have the focus), so the window is kept looking active.

use tauri::WebviewWindow;
use windows::Win32::Foundation::{HWND, LPARAM, LRESULT, WPARAM};

/// The first Windows 11 build that draws the acrylic backdrop for any window
const FIRST_BUILD: u32 = 22621;

/// Picked by this app, to find its own subclass of the window again
const SUBCLASS_ID: usize = 0x7670_6774;

/// Whether Windows can draw the glass. Older builds only have an
/// undocumented blur that lags behind a dragged window.
pub fn supported() -> bool {
    use windows::Wdk::System::SystemServices::RtlGetVersion;
    use windows::Win32::System::SystemInformation::OSVERSIONINFOW;

    let mut info = OSVERSIONINFOW {
        dwOSVersionInfoSize: size_of::<OSVERSIONINFOW>() as u32,
        ..Default::default()
    };
    unsafe { RtlGetVersion(&mut info) }.is_ok() && info.dwBuildNumber >= FIRST_BUILD
}

/// Shows the glass, tinted dark or light, or takes it away. True while
/// Windows draws it.
pub fn set(window: &WebviewWindow, on: bool, dark: bool) -> bool {
    if !supported() {
        return false;
    }
    let Ok(hwnd) = window.hwnd() else {
        return false;
    };
    // As a number, which can go to another thread
    let hwnd = hwnd.0 as isize;
    let (done, drawn) = std::sync::mpsc::channel();
    // The subclass only takes on the thread that owns the window
    let set = window.run_on_main_thread(move || {
        let _ = done.send(unsafe { apply(HWND(hwnd as *mut _), on, dark) });
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
