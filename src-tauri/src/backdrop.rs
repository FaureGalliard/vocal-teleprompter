//! What the screen shows behind the window, so the prompter can soften it and
//! pick a readable color for each letter against it.
//!
//! Hidden from screen capture, the window is left out of a capture of the
//! whole monitor it is on, so what comes back is exactly what is behind it,
//! and the window can be moved over it without looking again. Otherwise the
//! windows behind it paint themselves instead (see `behind`), so the window
//! never has to step out of the way and recordings never see it blink.

use tauri::ipc::Response;
use tauri::WebviewWindow;

/// Returns every `step`-th pixel of what is behind the window, as
/// `[cols: u32][rows: u32][x: i32][y: i32][r g b ...]` (little endian; x and
/// y place the area on the desktop, in physical pixels): the whole monitor
/// when hidden from capture, the window's own area when `shown` in screen
/// captures. Picking single pixels rather than averaging keeps letters and
/// background apart. Async, so it runs off the main thread, which is busy
/// while the window is dragged.
#[tauri::command]
pub async fn capture_backdrop(
    window: WebviewWindow,
    step: u32,
    shown: bool,
) -> Result<Response, String> {
    let step = step.max(1);
    // On Linux the GNOME Shell extension leaves the window out of what it
    // paints either way, so there only what is behind it is looked at
    #[cfg(target_os = "linux")]
    {
        let _ = shown;
        let (cols, rows, x, y, rgb) = crate::behind::look(&window, step)?;
        let mut out = header(cols, rows, x, y);
        out.extend_from_slice(&rgb);
        Ok(Response::new(out))
    }
    #[cfg(not(target_os = "linux"))]
    {
        if !shown {
            return capture(&window, step);
        }
        shown_capture(&window, step)
    }
}

#[cfg(not(target_os = "linux"))]
fn shown_capture(window: &WebviewWindow, step: u32) -> Result<Response, String> {
    let behind = crate::behind::draw(window)?;
    let (cols, rows) = (
        (behind.width as u32).div_ceil(step),
        (behind.height as u32).div_ceil(step),
    );
    let mut out = header(cols, rows, behind.x, behind.y);
    for row in 0..rows {
        for col in 0..cols {
            let i = ((row * step * behind.width as u32 + col * step) * 4) as usize;
            // BGRA to RGB
            out.extend_from_slice(&[behind.bgra[i + 2], behind.bgra[i + 1], behind.bgra[i]]);
        }
    }
    Ok(Response::new(out))
}

fn header(cols: u32, rows: u32, x: i32, y: i32) -> Vec<u8> {
    let mut out = Vec::with_capacity(16 + (cols * rows * 3) as usize);
    out.extend_from_slice(&cols.to_le_bytes());
    out.extend_from_slice(&rows.to_le_bytes());
    out.extend_from_slice(&x.to_le_bytes());
    out.extend_from_slice(&y.to_le_bytes());
    out
}

#[cfg(not(target_os = "linux"))]
fn capture(window: &WebviewWindow, step: u32) -> Result<Response, String> {
    use xcap::Monitor;

    let position = window.inner_position().map_err(|e| e.to_string())?;
    let monitor = Monitor::from_point(position.x, position.y).map_err(|e| e.to_string())?;
    let (x, y) = (
        monitor.x().map_err(|e| e.to_string())?,
        monitor.y().map_err(|e| e.to_string())?,
    );
    let image = monitor.capture_image().map_err(|e| e.to_string())?;

    let (cols, rows) = (image.width().div_ceil(step), image.height().div_ceil(step));
    let mut out = header(cols, rows, x, y);
    for row in 0..rows {
        for col in 0..cols {
            out.extend_from_slice(&image.get_pixel(col * step, row * step).0[..3]);
        }
    }
    Ok(Response::new(out))
}
