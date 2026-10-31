//! The part of the window Windows shows and lets take clicks. Like on
//! Linux, the window keeps room for the toolbar below the teleprompter all
//! the time instead of growing for it: each time a window changes size,
//! Windows draws no glass behind it for a moment, which flickered every
//! time the toolbar opened. While the toolbar is closed, the window is cut
//! down to the teleprompter, so the empty room neither shows nor takes
//! clicks, and clicks there reach what is behind it.

use tauri::WebviewWindow;
use windows::Win32::Foundation::{HWND, POINT, RECT};
use windows::Win32::Graphics::Gdi::{
    ClientToScreen, CombineRgn, CreateRectRgn, DeleteObject, SetWindowRgn, RGN_OR,
};
use windows::Win32::UI::WindowsAndMessaging::GetWindowRect;

/// `rects` (x, y, width and height in CSS pixels, from the page's top left)
/// as edges in physical pixels from the window's top left, which is
/// `offset` physical pixels before the page's
fn physical(rects: &[[f64; 4]], scale: f64, offset: (i32, i32)) -> Vec<RECT> {
    rects
        .iter()
        .map(|[x, y, w, h]| RECT {
            left: (x * scale).floor() as i32 + offset.0,
            top: (y * scale).floor() as i32 + offset.1,
            right: ((x + w) * scale).ceil() as i32 + offset.0,
            bottom: ((y + h) * scale).ceil() as i32 + offset.1,
        })
        .collect()
}

/// Shows the window only inside `rects`, or all of it when None
pub fn set(window: &WebviewWindow, rects: Option<Vec<[f64; 4]>>) -> Result<(), String> {
    let hwnd = HWND(window.hwnd().map_err(|e| e.to_string())?.0);
    let Some(rects) = rects else {
        return match unsafe { SetWindowRgn(hwnd, None, true) } {
            0 => Err("Windows would not show the whole window".into()),
            _ => Ok(()),
        };
    };
    let scale = window.scale_factor().map_err(|e| e.to_string())?;
    // Where the page starts inside the window, which may have borders
    let mut outer = RECT::default();
    let mut page = POINT::default();
    unsafe {
        GetWindowRect(hwnd, &mut outer).map_err(|e| e.to_string())?;
        let _ = ClientToScreen(hwnd, &mut page);
    }
    let offset = (page.x - outer.left, page.y - outer.top);
    unsafe {
        let region = CreateRectRgn(0, 0, 0, 0);
        for rect in physical(&rects, scale, offset) {
            let part = CreateRectRgn(rect.left, rect.top, rect.right, rect.bottom);
            CombineRgn(Some(region), Some(region), Some(part), RGN_OR);
            let _ = DeleteObject(part.into());
        }
        // Windows owns the region from now on
        if SetWindowRgn(hwnd, Some(region), true) == 0 {
            let _ = DeleteObject(region.into());
            return Err("Windows would not cut the window down".into());
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rects_become_physical_pixels_from_the_window_corner() {
        let rects = physical(&[[0.0, 0.0, 1080.0, 165.0]], 1.25, (0, 0));
        assert_eq!(
            (rects[0].left, rects[0].top, rects[0].right, rects[0].bottom),
            (0, 0, 1350, 207)
        );
    }

    #[test]
    fn partial_pixels_are_kept_whole_and_borders_counted() {
        let rects = physical(&[[10.5, 4.2, 20.0, 10.0]], 1.0, (8, 31));
        assert_eq!(
            (rects[0].left, rects[0].top, rects[0].right, rects[0].bottom),
            (18, 35, 39, 46)
        );
    }
}
