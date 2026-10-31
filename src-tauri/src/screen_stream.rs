//! What the monitor shows, streamed by Windows as it changes
//! (Windows.Graphics.Capture), for looking behind the window while it is
//! hidden from screen capture. Windows leaves the window out of the stream
//! and only sends a frame when something on the monitor changes, so a still
//! screen costs nothing, and a video behind the window is followed as fast
//! as the app can color the letters, rather than at a steady pace.
//! Each frame is only copied on the GPU; it is read back to memory when the
//! app looks. Windows 10 draws a yellow border around a streamed monitor,
//! so there the app keeps capturing the monitor at a steady pace instead.

use std::sync::{Arc, Mutex};
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
use windows::Win32::Graphics::Direct3D::D3D_DRIVER_TYPE_HARDWARE;
use windows::Win32::Graphics::Direct3D11::{
    D3D11CreateDevice, ID3D11Device, ID3D11DeviceContext, ID3D11Texture2D, D3D11_CPU_ACCESS_READ,
    D3D11_CREATE_DEVICE_BGRA_SUPPORT, D3D11_MAPPED_SUBRESOURCE, D3D11_MAP_READ, D3D11_SDK_VERSION,
    D3D11_TEXTURE2D_DESC, D3D11_USAGE_DEFAULT, D3D11_USAGE_STAGING,
};
use windows::Win32::Graphics::Dxgi::IDXGIDevice;
use windows::Win32::Graphics::Gdi::{
    GetMonitorInfoW, MonitorFromWindow, HMONITOR, MONITORINFO, MONITOR_DEFAULTTONEAREST,
};
use windows::Win32::System::WinRT::Direct3D11::{
    CreateDirect3D11DeviceFromDXGIDevice, IDirect3DDxgiInterfaceAccess,
};
use windows::Win32::System::WinRT::Graphics::Capture::IGraphicsCaptureItemInterop;

/// Tells the frontend that the monitor changed since it last looked
const CHANGED: &str = "backdrop-changed";

/// The newest frame, kept on the GPU until the app looks
struct Latest {
    device: ID3D11Device,
    direct3d: IDirect3DDevice,
    // What the pool's frames are sized for
    size: SizeInt32,
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
    pool: Direct3D11CaptureFramePool,
    session: GraphicsCaptureSession,
    token: i64,
    latest: Arc<Mutex<Latest>>,
}

// Windows' capture objects work from any thread
unsafe impl Send for Stream {}

impl Drop for Stream {
    fn drop(&mut self) {
        let _ = self.pool.RemoveFrameArrived(self.token);
        let _ = self.session.Close();
        let _ = self.pool.Close();
    }
}

/// The stream of the monitor the window is on, if any
static STREAM: Mutex<Option<Stream>> = Mutex::new(None);
/// Windows cannot stream monitors without a border here: never try again
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

fn start(app: AppHandle, monitor: HMONITOR) -> windows::core::Result<Stream> {
    use windows::core::Error;
    use windows::Win32::Foundation::E_NOTIMPL;

    // Without this, Windows 10 draws a yellow border around the monitor
    let borderless = ApiInformation::IsPropertyPresent(
        h!("Windows.Graphics.Capture.GraphicsCaptureSession"),
        h!("IsBorderRequired"),
    )?;
    if !borderless || !GraphicsCaptureSession::IsSupported()? {
        return Err(Error::new(
            E_NOTIMPL,
            "no borderless capture on this Windows",
        ));
    }

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
        direct3d,
        size: item.Size()?,
        context,
        frame: None,
        staging: None,
        fresh: false,
        app,
    }));

    let shared = latest.clone();
    let token = pool.FrameArrived(&TypedEventHandler::<Direct3D11CaptureFramePool, _>::new(
        move |pool, _| {
            let Some(pool) = pool.as_ref() else {
                return Ok(());
            };
            let frame = pool.TryGetNextFrame()?;
            let Ok(mut latest) = shared.lock() else {
                return frame.Close();
            };
            // The monitor changed resolution: frames of the new size from now on
            let content = frame.ContentSize()?;
            if content != latest.size {
                latest.size = content;
                pool.Recreate(&latest.direct3d, format, 2, content)?;
            }
            let texture: ID3D11Texture2D = unsafe {
                frame
                    .Surface()?
                    .cast::<IDirect3DDxgiInterfaceAccess>()?
                    .GetInterface()?
            };
            if keep(&mut latest, &texture).is_ok() && !latest.fresh {
                latest.fresh = true;
                let _ = latest.app.emit(CHANGED, ());
            }
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
        pool,
        session,
        token,
        latest,
    })
}

/// Copies a frame to the one kept, on the GPU, for the pool to reuse its own
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
    for row in 0..rows as usize {
        let line = &bgra[row * step as usize * pitch..];
        for col in 0..cols as usize {
            let i = col * step as usize * 4;
            // BGRA to RGB
            out.extend_from_slice(&[line[i + 2], line[i + 1], line[i]]);
        }
    }
    unsafe { context.Unmap(&staging, 0) };
    Ok(out)
}
