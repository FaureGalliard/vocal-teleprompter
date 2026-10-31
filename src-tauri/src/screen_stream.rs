//! What the monitor shows, streamed by Windows as it changes
//! (Windows.Graphics.Capture), for looking behind the window while it is
//! hidden from screen capture. Windows leaves the window out of the stream
//! and only sends a frame when something on the monitor changes, so a still
//! screen costs nothing, and a video behind the window is followed as fast
//! as the app can color the letters, rather than at a steady pace.
//! Each frame is only copied on the GPU; it is read back to memory when the
//! app looks. Windows 10 draws a yellow border around a monitor streamed
//! that way, so there the monitor is duplicated instead (DXGI Desktop
//! Duplication), which also waits for the screen to change and draws no
//! border, but stops on the lock screen or a display change and is then
//! started again.

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::thread::JoinHandle;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager, WebviewWindow};
use windows::core::{h, Interface};
use windows::Foundation::Metadata::ApiInformation;
use windows::Foundation::TypedEventHandler;
use windows::Graphics::Capture::{
    Direct3D11CaptureFramePool, GraphicsCaptureItem, GraphicsCaptureSession,
};
use windows::Graphics::DirectX::Direct3D11::IDirect3DDevice;
use windows::Graphics::DirectX::DirectXPixelFormat;
use windows::Graphics::SizeInt32;
use windows::Win32::Foundation::{HMODULE, HWND};
use windows::Win32::Graphics::Direct3D::{D3D_DRIVER_TYPE_HARDWARE, D3D_DRIVER_TYPE_UNKNOWN};
use windows::Win32::Graphics::Direct3D11::{
    D3D11CreateDevice, ID3D11Device, ID3D11DeviceContext, ID3D11Texture2D, D3D11_CPU_ACCESS_READ,
    D3D11_CREATE_DEVICE_BGRA_SUPPORT, D3D11_MAPPED_SUBRESOURCE, D3D11_MAP_READ, D3D11_SDK_VERSION,
    D3D11_TEXTURE2D_DESC, D3D11_USAGE_DEFAULT, D3D11_USAGE_STAGING,
};
use windows::Win32::Graphics::Dxgi::{
    CreateDXGIFactory1, IDXGIAdapter, IDXGIDevice, IDXGIFactory1, IDXGIOutput1,
    IDXGIOutputDuplication, DXGI_ERROR_WAIT_TIMEOUT, DXGI_OUTDUPL_FRAME_INFO,
};
use windows::Win32::Graphics::Gdi::{
    GetMonitorInfoW, MonitorFromWindow, HMONITOR, MONITORINFO, MONITOR_DEFAULTTONEAREST,
};
use windows::Win32::System::WinRT::Direct3D11::{
    CreateDirect3D11DeviceFromDXGIDevice, IDirect3DDxgiInterfaceAccess,
};
use windows::Win32::System::WinRT::Graphics::Capture::IGraphicsCaptureItemInterop;

/// Tells the frontend that the monitor changed since it last looked
const CHANGED: &str = "backdrop-changed";
/// How long a duplicated monitor is waited on before checking for a stop
const WAIT_MS: u32 = 200;
/// How soon to duplicate the monitor again once that stopped
const RETRY: Duration = Duration::from_millis(500);

/// The newest frame, kept on the GPU until the app looks
struct Latest {
    device: ID3D11Device,
    context: ID3D11DeviceContext,
    frame: Option<ID3D11Texture2D>,
    staging: Option<ID3D11Texture2D>,
    // A frame came since the app last looked
    fresh: bool,
    app: AppHandle,
}

// The device and its context are only ever used under the mutex
unsafe impl Send for Latest {}

struct Stream {
    monitor: isize,
    x: i32,
    y: i32,
    // Kept for as long as the monitor is streamed
    _source: Source,
    latest: Arc<Mutex<Latest>>,
}

/// How Windows streams the monitor
enum Source {
    /// Windows.Graphics.Capture, which calls back with each frame
    Capture {
        pool: Direct3D11CaptureFramePool,
        session: GraphicsCaptureSession,
        token: i64,
    },
    /// Desktop Duplication, waited on by a thread of its own
    Duplication {
        stop: Arc<AtomicBool>,
        thread: Option<JoinHandle<()>>,
    },
}

// Windows' capture objects work from any thread
unsafe impl Send for Source {}

impl Drop for Source {
    fn drop(&mut self) {
        match self {
            Source::Capture {
                pool,
                session,
                token,
            } => {
                let _ = pool.RemoveFrameArrived(*token);
                let _ = session.Close();
                let _ = pool.Close();
            }
            Source::Duplication { stop, thread } => {
                stop.store(true, Ordering::Relaxed);
                if let Some(thread) = thread.take() {
                    let _ = thread.join();
                }
            }
        }
    }
}

/// What Windows.Graphics.Capture's pool needs to resize its frames
struct Resize {
    direct3d: IDirect3DDevice,
    size: SizeInt32,
}

// Only used by the pool's callback, one frame at a time
unsafe impl Send for Resize {}

/// What the duplicating thread works with
struct Duplicator {
    output: IDXGIOutput1,
    device: ID3D11Device,
    duplication: Option<IDXGIOutputDuplication>,
}

// Only ever used by the duplicating thread
unsafe impl Send for Duplicator {}

/// The stream of the monitor the window is on, if any
static STREAM: Mutex<Option<Stream>> = Mutex::new(None);
/// Windows cannot stream the monitor at all here: never try again
static UNAVAILABLE: Mutex<bool> = Mutex::new(false);

/// What is behind the window, as `capture_backdrop` returns it: every
/// `step`-th pixel of the monitor it is on, or an empty answer when nothing
/// changed since the last look. None when Windows cannot stream it, for
/// the app to capture the monitor itself.
pub fn look(window: &WebviewWindow, step: u32) -> Option<Vec<u8>> {
    if *UNAVAILABLE.lock().ok()? {
        return None;
    }
    let hwnd = HWND(window.hwnd().ok()?.0);
    let monitor = unsafe { MonitorFromWindow(hwnd, MONITOR_DEFAULTTONEAREST) };
    let mut stream = STREAM.lock().ok()?;
    if stream.as_ref().map(|s| s.monitor) != Some(monitor.0 as isize) {
        *stream = None;
        match start(window.app_handle().clone(), monitor) {
            Ok(started) => *stream = Some(started),
            Err(e) => {
                eprintln!("Cannot stream the monitor, capturing it instead: {e}");
                if let Ok(mut unavailable) = UNAVAILABLE.lock() {
                    *unavailable = true;
                }
                return None;
            }
        }
    }
    let stream = stream.as_ref()?;
    let mut latest = stream.latest.lock().ok()?;
    if !latest.fresh {
        return Some(Vec::new());
    }
    latest.fresh = false;
    match read(&mut latest, step, stream.x, stream.y) {
        Ok(out) => Some(out),
        Err(e) => {
            eprintln!("Could not read the monitor's stream: {e}");
            Some(Vec::new())
        }
    }
}

/// Stops streaming, while the app has no need to look behind the window
pub fn stop() {
    if let Ok(mut stream) = STREAM.lock() {
        *stream = None;
    }
}

/// Streams the monitor with Windows.Graphics.Capture where it draws no
/// border around it, or duplicates it
fn start(app: AppHandle, monitor: HMONITOR) -> windows::core::Result<Stream> {
    // Without this, Windows 10 draws a yellow border around the monitor
    let borderless = ApiInformation::IsPropertyPresent(
        h!("Windows.Graphics.Capture.GraphicsCaptureSession"),
        h!("IsBorderRequired"),
    )
    .unwrap_or(false);
    if borderless && GraphicsCaptureSession::IsSupported().unwrap_or(false) {
        match capture(app.clone(), monitor) {
            Ok(stream) => return Ok(stream),
            Err(e) => eprintln!("Cannot capture the monitor, duplicating it instead: {e}"),
        }
    }
    duplicate(app, monitor)
}

fn capture(app: AppHandle, monitor: HMONITOR) -> windows::core::Result<Stream> {
    use windows::core::Error;

    let mut info = MONITORINFO {
        cbSize: size_of::<MONITORINFO>() as u32,
        ..Default::default()
    };
    unsafe { GetMonitorInfoW(monitor, &mut info) }.ok()?;

    let (mut device, mut context) = (None, None);
    unsafe {
        D3D11CreateDevice(
            None,
            D3D_DRIVER_TYPE_HARDWARE,
            HMODULE::default(),
            D3D11_CREATE_DEVICE_BGRA_SUPPORT,
            None,
            D3D11_SDK_VERSION,
            Some(&mut device),
            None,
            Some(&mut context),
        )?
    };
    let (device, context): (ID3D11Device, ID3D11DeviceContext) = (
        device.ok_or_else(Error::empty)?,
        context.ok_or_else(Error::empty)?,
    );
    let direct3d: IDirect3DDevice =
        unsafe { CreateDirect3D11DeviceFromDXGIDevice(&device.cast::<IDXGIDevice>()?)? }.cast()?;

    let item: GraphicsCaptureItem = unsafe {
        windows::core::factory::<GraphicsCaptureItem, IGraphicsCaptureItemInterop>()?
            .CreateForMonitor(monitor)?
    };
    let format = DirectXPixelFormat::B8G8R8A8UIntNormalized;
    let pool = Direct3D11CaptureFramePool::CreateFreeThreaded(&direct3d, format, 2, item.Size()?)?;
    let latest = Arc::new(Mutex::new(Latest {
        device,
        context,
        frame: None,
        staging: None,
        fresh: false,
        app,
    }));
    let resize = Mutex::new(Resize {
        direct3d,
        size: item.Size()?,
    });

    let shared = latest.clone();
    let token = pool.FrameArrived(&TypedEventHandler::<Direct3D11CaptureFramePool, _>::new(
        move |pool, _| {
            let Some(pool) = pool.as_ref() else {
                return Ok(());
            };
            let frame = pool.TryGetNextFrame()?;
            // The monitor changed resolution: frames of the new size from now on
            let content = frame.ContentSize()?;
            if let Ok(mut resize) = resize.lock() {
                if content != resize.size {
                    resize.size = content;
                    pool.Recreate(&resize.direct3d, format, 2, content)?;
                }
            }
            let texture: ID3D11Texture2D = unsafe {
                frame
                    .Surface()?
                    .cast::<IDirect3DDxgiInterfaceAccess>()?
                    .GetInterface()?
            };
            arrived(&shared, &texture);
            frame.Close()
        },
    ))?;

    let session = pool.CreateCaptureSession(&item)?;
    session.SetIsBorderRequired(false)?;
    let _ = session.SetIsCursorCaptureEnabled(false);
    session.StartCapture()?;
    Ok(Stream {
        monitor: monitor.0 as isize,
        x: info.rcMonitor.left,
        y: info.rcMonitor.top,
        _source: Source::Capture {
            pool,
            session,
            token,
        },
        latest,
    })
}

/// Duplicates the monitor, on the graphics card it is plugged into, the
/// only one that can
fn duplicate(app: AppHandle, monitor: HMONITOR) -> windows::core::Result<Stream> {
    use windows::core::Error;

    let factory: IDXGIFactory1 = unsafe { CreateDXGIFactory1()? };
    let (adapter, output, area) = (0..)
        .map_while(|i| unsafe { factory.EnumAdapters1(i) }.ok())
        .find_map(|adapter| {
            (0..)
                .map_while(|i| unsafe { adapter.EnumOutputs(i) }.ok())
                .find_map(|output| {
                    let desc = unsafe { output.GetDesc() }.ok()?;
                    (desc.Monitor == monitor).then_some((
                        adapter.clone(),
                        output,
                        desc.DesktopCoordinates,
                    ))
                })
        })
        .ok_or_else(Error::empty)?;

    let (mut device, mut context) = (None, None);
    unsafe {
        D3D11CreateDevice(
            &adapter.cast::<IDXGIAdapter>()?,
            D3D_DRIVER_TYPE_UNKNOWN,
            HMODULE::default(),
            D3D11_CREATE_DEVICE_BGRA_SUPPORT,
            None,
            D3D11_SDK_VERSION,
            Some(&mut device),
            None,
            Some(&mut context),
        )?
    };
    let (device, context): (ID3D11Device, ID3D11DeviceContext) = (
        device.ok_or_else(Error::empty)?,
        context.ok_or_else(Error::empty)?,
    );
    let output: IDXGIOutput1 = output.cast()?;
    let duplication = unsafe { output.DuplicateOutput(&device)? };

    let latest = Arc::new(Mutex::new(Latest {
        device: device.clone(),
        context,
        frame: None,
        staging: None,
        fresh: false,
        app,
    }));
    let stop = Arc::new(AtomicBool::new(false));
    let duplicator = Duplicator {
        output,
        device,
        duplication: Some(duplication),
    };
    let (shared, stopped) = (latest.clone(), stop.clone());
    let thread = std::thread::spawn(move || follow(duplicator, &shared, &stopped));
    Ok(Stream {
        monitor: monitor.0 as isize,
        x: area.left,
        y: area.top,
        _source: Source::Duplication {
            stop,
            thread: Some(thread),
        },
        latest,
    })
}

/// Waits for the duplicated monitor to change and keeps each new frame,
/// until stopped
fn follow(mut duplicator: Duplicator, latest: &Mutex<Latest>, stop: &AtomicBool) {
    while !stop.load(Ordering::Relaxed) {
        let Some(duplication) = &duplicator.duplication else {
            std::thread::sleep(RETRY);
            duplicator.duplication =
                unsafe { duplicator.output.DuplicateOutput(&duplicator.device) }.ok();
            continue;
        };
        let mut info = DXGI_OUTDUPL_FRAME_INFO::default();
        let mut resource = None;
        match unsafe { duplication.AcquireNextFrame(WAIT_MS, &mut info, &mut resource) } {
            Ok(()) => {
                // Zero when only the mouse moved: the screen is the same
                if info.LastPresentTime != 0 {
                    if let Some(texture) = resource.and_then(|r| r.cast::<ID3D11Texture2D>().ok()) {
                        arrived(latest, &texture);
                    }
                }
                let _ = unsafe { duplication.ReleaseFrame() };
            }
            Err(e) if e.code() == DXGI_ERROR_WAIT_TIMEOUT => {}
            // Lost to the lock screen, a display change or a full-screen
            // game: duplicated again once it can be
            Err(_) => duplicator.duplication = None,
        }
    }
}

/// Keeps a new frame and tells the frontend, once until it next looks
fn arrived(latest: &Mutex<Latest>, texture: &ID3D11Texture2D) {
    let Ok(mut latest) = latest.lock() else {
        return;
    };
    if keep(&mut latest, texture).is_ok() && !latest.fresh {
        latest.fresh = true;
        let _ = latest.app.emit(CHANGED, ());
    }
}

/// Copies a frame to the one kept, on the GPU, for Windows to reuse its own
fn keep(latest: &mut Latest, texture: &ID3D11Texture2D) -> windows::core::Result<()> {
    let mut desc = D3D11_TEXTURE2D_DESC::default();
    unsafe { texture.GetDesc(&mut desc) };
    if latest.frame.as_ref().map(|f| same_size(f, &desc)) != Some(true) {
        let own = D3D11_TEXTURE2D_DESC {
            Usage: D3D11_USAGE_DEFAULT,
            BindFlags: 0,
            CPUAccessFlags: 0,
            MiscFlags: 0,
            ..desc
        };
        let mut frame = None;
        unsafe {
            latest
                .device
                .CreateTexture2D(&own, None, Some(&mut frame))?
        };
        latest.frame = frame;
    }
    if let Some(frame) = &latest.frame {
        unsafe { latest.context.CopyResource(frame, texture) };
    }
    Ok(())
}

fn same_size(texture: &ID3D11Texture2D, desc: &D3D11_TEXTURE2D_DESC) -> bool {
    let mut own = D3D11_TEXTURE2D_DESC::default();
    unsafe { texture.GetDesc(&mut own) };
    own.Width == desc.Width && own.Height == desc.Height
}

/// Every `step`-th pixel of the kept frame, after the same header as other looks
fn read(latest: &mut Latest, step: u32, x: i32, y: i32) -> windows::core::Result<Vec<u8>> {
    use windows::core::Error;

    let frame = latest.frame.clone().ok_or_else(Error::empty)?;
    let mut desc = D3D11_TEXTURE2D_DESC::default();
    unsafe { frame.GetDesc(&mut desc) };
    if latest.staging.as_ref().map(|s| same_size(s, &desc)) != Some(true) {
        let staging = D3D11_TEXTURE2D_DESC {
            Usage: D3D11_USAGE_STAGING,
            BindFlags: 0,
            CPUAccessFlags: D3D11_CPU_ACCESS_READ.0 as u32,
            MiscFlags: 0,
            ..desc
        };
        let mut texture = None;
        unsafe {
            latest
                .device
                .CreateTexture2D(&staging, None, Some(&mut texture))?
        };
        latest.staging = texture;
    }
    let staging = latest.staging.clone().ok_or_else(Error::empty)?;
    let context = &latest.context;
    unsafe { context.CopyResource(&staging, &frame) };

    let mut mapped = D3D11_MAPPED_SUBRESOURCE::default();
    unsafe { context.Map(&staging, 0, D3D11_MAP_READ, 0, Some(&mut mapped))? };
    let (width, height) = (desc.Width, desc.Height);
    let (cols, rows) = (width.div_ceil(step), height.div_ceil(step));
    let mut out = crate::backdrop::header(cols, rows, x, y);
    let pitch = mapped.RowPitch as usize;
    let bgra =
        unsafe { std::slice::from_raw_parts(mapped.pData as *const u8, pitch * height as usize) };
    sample(bgra, pitch, width, height, step, &mut out);
    unsafe { context.Unmap(&staging, 0) };
    Ok(out)
}

/// Every `step`-th pixel of BGRA rows `pitch` bytes apart, as RGB
fn sample(bgra: &[u8], pitch: usize, width: u32, height: u32, step: u32, out: &mut Vec<u8>) {
    let step = step as usize;
    for line in bgra.chunks(pitch).take(height as usize).step_by(step) {
        for px in line[..width as usize * 4]
            .as_chunks::<4>()
            .0
            .iter()
            .step_by(step)
        {
            out.extend_from_slice(&[px[2], px[1], px[0]]);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::sample;

    // A 3x3 picture whose rows are padded to 16 bytes, as graphics cards do;
    // pixel (x, y) is blue x, green y, red 10x + y
    fn picture() -> Vec<u8> {
        let mut bgra = Vec::new();
        for y in 0..3 {
            for x in 0..3 {
                bgra.extend_from_slice(&[x, y, 10 * x + y, 255]);
            }
            bgra.extend_from_slice(&[0; 4]);
        }
        bgra
    }

    #[test]
    fn every_pixel_comes_out_as_rgb() {
        let mut out = Vec::new();
        sample(&picture(), 16, 3, 3, 1, &mut out);
        assert_eq!(out.len(), 3 * 3 * 3);
        // Pixel (1, 1), the fifth
        assert_eq!(&out[12..15], &[11, 1, 1]);
    }

    #[test]
    fn steps_skip_pixels_and_never_read_the_padding() {
        let mut out = Vec::new();
        sample(&picture(), 16, 3, 3, 2, &mut out);
        // Pixels (0, 0), (2, 0), (0, 2) and (2, 2), as many as the header says
        assert_eq!(out.len(), 3u32.div_ceil(2).pow(2) as usize * 3);
        assert_eq!(out, [0, 0, 0, 20, 0, 2, 2, 2, 0, 22, 2, 2]);
    }
}
