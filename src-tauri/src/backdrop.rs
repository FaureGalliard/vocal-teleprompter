//! What the screen shows behind the window, so the prompter can soften it and
//! pick a readable color for each letter against it.
//!
//! The whole monitor the window is on is captured, so the window can be moved
//! over it without looking again. The window is left out of the capture, so
//! what comes back is exactly what is behind it. When it isn't hidden from
//! screen capture anyway, it is hidden just for the frame of the capture.

use tauri::ipc::Response;
use tauri::WebviewWindow;
use xcap::Monitor;

/// Captures the monitor the window is on and returns every `step`-th pixel
/// of it, as `[cols: u32][rows: u32][x: i32][y: i32][r g b ...]` (little
/// endian; x and y place the monitor on the desktop, in physical pixels).
/// Picking single pixels rather than averaging keeps letters and background
/// apart. Async, so it runs off the main thread, which is busy while the
/// window is dragged. `shown` says the window is normally visible to screen
/// captures.
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
        // One frame for the compositor to take the window out
        std::thread::sleep(std::time::Duration::from_millis(16));
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
    let monitor = Monitor::from_point(position.x, position.y).map_err(|e| e.to_string())?;
    let (x, y) = (
        monitor.x().map_err(|e| e.to_string())?,
        monitor.y().map_err(|e| e.to_string())?,
    );
    let image = monitor.capture_image().map_err(|e| e.to_string())?;

    let (cols, rows) = (image.width().div_ceil(step), image.height().div_ceil(step));
    let mut out = Vec::with_capacity(16 + (cols * rows * 3) as usize);
    out.extend_from_slice(&cols.to_le_bytes());
    out.extend_from_slice(&rows.to_le_bytes());
    out.extend_from_slice(&x.to_le_bytes());
    out.extend_from_slice(&y.to_le_bytes());
    for row in 0..rows {
        for col in 0..cols {
            out.extend_from_slice(&image.get_pixel(col * step, row * step).0[..3]);
        }
    }
    Ok(Response::new(out))
}
