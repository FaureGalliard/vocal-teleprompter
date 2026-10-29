//! Notices when the user clicks, types or scrolls anywhere, without seeing
//! what: Windows tells when the last input happened and whether a mouse
//! button is down, which is enough to know the screen may be about to change
//! (a click or a key is what moves most slides on). No input hooks, no keys.

use tauri::AppHandle;

/// Emits `user-input` on a click (press and release), a key or a wheel turn,
/// but not on plain mouse moves
pub fn watch(app: AppHandle) {
    #[cfg(windows)]
    std::thread::spawn(move || {
        use std::time::Duration;
        use tauri::Emitter;
        use windows::Win32::Foundation::POINT;
        use windows::Win32::UI::Input::KeyboardAndMouse::{
            GetAsyncKeyState, GetLastInputInfo, LASTINPUTINFO, VK_LBUTTON, VK_MBUTTON, VK_RBUTTON,
        };
        use windows::Win32::UI::WindowsAndMessaging::GetCursorPos;

        let mut last_tick = 0u32;
        let mut last_pos = POINT::default();
        let mut buttons = false;
        loop {
            std::thread::sleep(Duration::from_millis(30));
            let mut info = LASTINPUTINFO {
                cbSize: size_of::<LASTINPUTINFO>() as u32,
                dwTime: 0,
            };
            let mut pos = POINT::default();
            let read =
                unsafe { GetLastInputInfo(&mut info).as_bool() && GetCursorPos(&mut pos).is_ok() };
            if !read {
                continue;
            }
            let down = [VK_LBUTTON, VK_RBUTTON, VK_MBUTTON]
                .iter()
                .any(|key| unsafe { GetAsyncKeyState(key.0 as i32) } < 0);
            // New input with the cursor where it was: a key or the wheel
            let still_input = last_tick != 0 && info.dwTime != last_tick && pos == last_pos;
            if down != buttons || still_input {
                let _ = app.emit("user-input", ());
            }
            last_tick = info.dwTime;
            last_pos = pos;
            buttons = down;
        }
    });
    #[cfg(not(windows))]
    let _ = app;
}
