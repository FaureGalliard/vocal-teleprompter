//! What is behind the window, drawn by the windows themselves. Each window
//! under ours is asked to paint itself into memory (PrintWindow), and those
//! paintings are stacked back to front. Nothing on screen changes, so screen
//! recordings never see the prompter blink, unlike capturing the screen with
//! the prompter stepped out of it.

use tauri::WebviewWindow;

/// The window's inside on the desktop and what is behind it there, as BGRA
/// rows of `width` pixels
#[cfg(not(target_os = "linux"))]
pub struct Behind {
    pub x: i32,
    pub y: i32,
    pub width: i32,
    pub height: i32,
    pub bgra: Vec<u8>,
}

#[cfg(windows)]
pub fn draw(window: &WebviewWindow) -> Result<Behind, String> {
    use std::ffi::c_void;
    use windows::Win32::Foundation::{HWND, RECT};
    use windows::Win32::Graphics::Dwm::{
        DwmGetWindowAttribute, DWMWA_CLOAKED, DWMWA_EXTENDED_FRAME_BOUNDS,
    };
    use windows::Win32::Graphics::Gdi::{
        CreateCompatibleDC, CreateDIBSection, DeleteDC, DeleteObject, GetDC, ReleaseDC,
        SelectObject, BITMAPINFO, BITMAPINFOHEADER, BI_RGB, DIB_RGB_COLORS,
    };
    use windows::Win32::Storage::Xps::{PrintWindow, PRINT_WINDOW_FLAGS};
    use windows::Win32::UI::WindowsAndMessaging::{
        GetWindow, GetWindowRect, IsIconic, IsWindowVisible, GW_HWNDNEXT,
    };

    // Renders content drawn by the GPU too (browsers, slide shows)
    const PW_RENDERFULLCONTENT: PRINT_WINDOW_FLAGS = PRINT_WINDOW_FLAGS(2);

    let ours = HWND(window.hwnd().map_err(|e| e.to_string())?.0);
    let position = window.inner_position().map_err(|e| e.to_string())?;
    let size = window.inner_size().map_err(|e| e.to_string())?;
    let area = RECT {
        left: position.x,
        top: position.y,
        right: position.x + size.width as i32,
        bottom: position.y + size.height as i32,
    };
    let (width, height) = (size.width as i32, size.height as i32);
    let mut bgra = vec![0u8; (width * height * 4) as usize];

    let overlap = |a: &RECT, b: &RECT| {
        a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
    };
    let covers = |a: &RECT, b: &RECT| {
        a.left <= b.left && a.top <= b.top && a.right >= b.right && a.bottom >= b.bottom
    };

    // The visible windows under ours that show behind it, front to back,
    // down to the first one that fills the whole area
    let mut stack: Vec<(HWND, RECT)> = Vec::new();
    let mut next = unsafe { GetWindow(ours, GW_HWNDNEXT) }.ok();
    while let Some(hwnd) = next {
        next = unsafe { GetWindow(hwnd, GW_HWNDNEXT) }.ok();
        if !unsafe { IsWindowVisible(hwnd) }.as_bool() || unsafe { IsIconic(hwnd) }.as_bool() {
            continue;
        }
        let mut cloaked = 0u32;
        let _ = unsafe {
            DwmGetWindowAttribute(
                hwnd,
                DWMWA_CLOAKED,
                &mut cloaked as *mut u32 as *mut c_void,
                size_of::<u32>() as u32,
            )
        };
        if cloaked != 0 {
            continue;
        }
        let mut frame = RECT::default();
        if unsafe {
            DwmGetWindowAttribute(
                hwnd,
                DWMWA_EXTENDED_FRAME_BOUNDS,
                &mut frame as *mut RECT as *mut c_void,
                size_of::<RECT>() as u32,
            )
        }
        .is_err()
            || !overlap(&frame, &area)
        {
            continue;
        }
        let full = covers(&frame, &area);
        stack.push((hwnd, frame));
        if full {
            break;
        }
    }

    // Back to front, each one painted over what is under it
    for (hwnd, frame) in stack.iter().rev() {
        let mut outer = RECT::default();
        if unsafe { GetWindowRect(*hwnd, &mut outer) }.is_err() {
            continue;
        }
        let (ww, wh) = (outer.right - outer.left, outer.bottom - outer.top);
        if ww <= 0 || wh <= 0 {
            continue;
        }
        unsafe {
            let screen = GetDC(None);
            let memory = CreateCompatibleDC(Some(screen));
            let info = BITMAPINFO {
                bmiHeader: BITMAPINFOHEADER {
                    biSize: size_of::<BITMAPINFOHEADER>() as u32,
                    biWidth: ww,
                    // Negative: rows top to bottom
                    biHeight: -wh,
                    biPlanes: 1,
                    biBitCount: 32,
                    biCompression: BI_RGB.0,
                    ..Default::default()
                },
                ..Default::default()
            };
            let mut bits: *mut c_void = std::ptr::null_mut();
            if let Ok(bitmap) =
                CreateDIBSection(Some(memory), &info, DIB_RGB_COLORS, &mut bits, None, 0)
            {
                let old = SelectObject(memory, bitmap.into());
                if PrintWindow(*hwnd, memory, PW_RENDERFULLCONTENT).as_bool() && !bits.is_null() {
                    let painted =
                        std::slice::from_raw_parts(bits as *const u8, (ww * wh * 4) as usize);
                    // Only the visible frame (no invisible borders), inside our area
                    for y in frame.top.max(area.top)..frame.bottom.min(area.bottom) {
                        for x in frame.left.max(area.left)..frame.right.min(area.right) {
                            let from = (((y - outer.top) * ww + (x - outer.left)) * 4) as usize;
                            let to = (((y - area.top) * width + (x - area.left)) * 4) as usize;
                            bgra[to..to + 4].copy_from_slice(&painted[from..from + 4]);
                        }
                    }
                }
                SelectObject(memory, old);
                let _ = DeleteObject(bitmap.into());
            }
            let _ = DeleteDC(memory);
            ReleaseDC(None, screen);
        }
    }

    Ok(Behind {
        x: area.left,
        y: area.top,
        width,
        height,
        bgra,
    })
}

/// What is behind the top `share` of the window (0-1), every `step`-th pixel
/// as RGB rows, and where that area is: `(cols, rows, x, y, rgb)`. On Linux
/// only the compositor can leave a window out of what it paints, so the
/// GNOME Shell extension does it and hands back the pixels.
#[cfg(target_os = "linux")]
pub fn look(
    window: &WebviewWindow,
    step: u32,
    share: f64,
) -> Result<(u32, u32, i32, i32, Vec<u8>), String> {
    use crate::gnome_shell::call;
    let unknown = |e: &String| e.contains("UnknownMethod");
    // Painted at the size the prompter looks at and only behind its text,
    // for a fraction of the work; older extensions paint the whole window,
    // the oldest only at full size, and every step-th pixel is picked here
    // instead. Anything below the text is cut off by the frontend.
    let fraction = 1.0 / step as f64;
    let (reply, pick) = match call("BehindTop", &(fraction, share)) {
        Ok(reply) => (reply, 1),
        Err(e) if unknown(&e) => match call("BehindAt", &(fraction,)) {
            Ok(reply) => (reply, 1),
            Err(e) if unknown(&e) => (call("Behind", &())?, step as usize),
            Err(e) => return Err(e),
        },
        Err(e) => return Err(e),
    };
    // Borrowed in one piece: as a Vec it is decoded byte by byte, which
    // took over a second for a small window
    let (width, height, stride, channels, pixels): (i32, i32, i32, i32, &[u8]) =
        reply.deserialize().map_err(|e| e.to_string())?;
    if width <= 0 || height <= 0 || !(3..=4).contains(&channels) {
        return Err("Unexpected picture from the shell".into());
    }
    let (width, height) = (width as usize, height as usize);
    let (stride, channels) = (stride as usize, channels as usize);
    if pixels.len() < stride * (height - 1) + width * channels {
        return Err("Short picture from the shell".into());
    }

    let (cols, rows) = (width.div_ceil(pick), height.div_ceil(pick));
    let mut rgb = Vec::with_capacity(cols * rows * 3);
    for row in pixels.chunks(stride).step_by(pick).take(rows) {
        for px in row[..width * channels].chunks_exact(channels).step_by(pick) {
            rgb.extend_from_slice(&px[..3]);
        }
    }
    // Wayland tells no app where its window is: placed where the app
    // believes it is, so the frontend finds it under itself
    let position = window.inner_position().map_err(|e| e.to_string())?;
    Ok((cols as u32, rows as u32, position.x, position.y, rgb))
}

#[cfg(not(any(windows, target_os = "linux")))]
pub fn draw(_window: &WebviewWindow) -> Result<Behind, String> {
    Err("Not available on this system".into())
}
