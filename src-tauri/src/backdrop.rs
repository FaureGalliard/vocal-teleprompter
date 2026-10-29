//! What the screen shows where the window is, so the prompter can pick a
//! readable color for each word against whatever is behind it.
//!
//! The window is left out of the capture, so what comes back is exactly
//! what is behind it. When it isn't hidden from screen capture anyway, it is
//! hidden just for the moment of the capture.

use tauri::ipc::Response;
use tauri::WebviewWindow;
use xcap::Monitor;

/// Captures the window's area and returns every `step`-th pixel of it, as
/// `[width: u32 LE][height: u32 LE][r g b ...]`. Picking single pixels
/// rather than averaging keeps letters and background apart. Async, so it
/// runs off the main thread, which is busy while the window is dragged.
/// `shown` says the window is normally visible to screen captures.
#[tauri::command]
pub async fn capture_backdrop(
    window: WebviewWindow,
    step: u32,
    shown: bool,
) -> Result<Response, String> {
    if shown {
        window
            .set_content_protected(true)
            .map_err(|e| e.to_string())?;
        // Give the compositor a frame to take the window out
        std::thread::sleep(std::time::Duration::from_millis(40));
    }
    let captured = capture(&window, step.max(1));
    if shown {
        window
            .set_content_protected(false)
            .map_err(|e| e.to_string())?;
    }
    captured
}

fn capture(window: &WebviewWindow, step: u32) -> Result<Response, String> {
    let position = window.inner_position().map_err(|e| e.to_string())?;
    let size = window.inner_size().map_err(|e| e.to_string())?;
    let monitor = Monitor::from_point(position.x, position.y).map_err(|e| e.to_string())?;
    let (mx, my) = (
        monitor.x().map_err(|e| e.to_string())?,
        monitor.y().map_err(|e| e.to_string())?,
    );
    let (mw, mh) = (
        monitor.width().map_err(|e| e.to_string())?,
        monitor.height().map_err(|e| e.to_string())?,
    );

    // The part of the window on this monitor; the rest reads as black
    let x = (position.x - mx).max(0) as u32;
    let y = (position.y - my).max(0) as u32;
    let width = size.width.min(mw.saturating_sub(x));
    let height = size.height.min(mh.saturating_sub(y));
    if width == 0 || height == 0 {
        return Err("The window is off screen".into());
    }
    let image = monitor
        .capture_region(x, y, width, height)
        .map_err(|e| e.to_string())?;

    let (cols, rows) = (size.width.div_ceil(step), size.height.div_ceil(step));
    let mut out = Vec::with_capacity(8 + (cols * rows * 3) as usize);
    out.extend_from_slice(&cols.to_le_bytes());
    out.extend_from_slice(&rows.to_le_bytes());
    for row in 0..rows {
        for col in 0..cols {
            let (px, py) = (col * step, row * step);
            if px < width && py < height {
                out.extend_from_slice(&image.get_pixel(px, py).0[..3]);
            } else {
                out.extend_from_slice(&[0, 0, 0]);
            }
        }
    }
    Ok(Response::new(out))
}
