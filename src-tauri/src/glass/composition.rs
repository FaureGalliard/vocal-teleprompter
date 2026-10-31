//! Windows 11's glass, drawn by the window itself: a visual in the window's
//! own composition layer, under the page, painted with what shows through
//! the window (a backdrop brush) blurred by Direct2D's Gaussian blur. The
//! window has no redirection bitmap and the page is transparent, so what
//! shows through is the desktop behind it, live. This is how Windows
//! Terminal keeps its acrylic while unfocused: unlike the system's own
//! backdrops, a brush inside the window has no idea of the focus.

use std::cell::RefCell;
use tauri::WebviewWindow;
use windows::core::{Interface, Result, HSTRING};
use windows::System::{DispatcherQueue, DispatcherQueueController};
use windows::Win32::Foundation::HWND;
use windows::Win32::System::WinRT::Composition::ICompositorDesktopInterop;
use windows::Win32::System::WinRT::{
    CreateDispatcherQueueController, DispatcherQueueOptions, DQTAT_COM_NONE, DQTYPE_THREAD_CURRENT,
};
use windows::UI::Composition::Desktop::DesktopWindowTarget;
use windows::UI::Composition::{CompositionEffectBrush, Compositor, SpriteVisual};
use windows_numerics::Vector2;

/// The blur effect's name for what it blurs
const SOURCE: &str = "behind";

thread_local! {
    // Composition objects belong to the window's thread, so they stay there
    static LAYER: RefCell<Option<Layer>> = const { RefCell::new(None) };
}

/// The glass under the page, kept for as long as the window lives
struct Layer {
    // Composition needs a dispatcher queue on its thread; kept running
    _queue: Option<DispatcherQueueController>,
    compositor: Compositor,
    _target: DesktopWindowTarget,
    sprite: SpriteVisual,
    // The blur's strength in physical pixels, and the brush drawing it
    blur: Option<(f32, CompositionEffectBrush)>,
}

/// How strong the blur is for a `radius` in logical pixels, as the Gaussian
/// blur's standard deviation in physical pixels: half the radius, as GNOME
/// Shell's blur takes it
fn deviation(radius: i32, scale: f64) -> f32 {
    (radius.max(0) as f64 * scale / 2.0) as f32
}

/// The glass's size over the window's: as wide, and short of the `room` (in
/// logical pixels) kept below the text, in physical pixels
fn size(room: i32, scale: f64) -> Vector2 {
    Vector2 {
        X: 0.0,
        Y: -(room.max(0) as f64 * scale) as f32,
    }
}

/// Shows the glass blurred by `radius`, leaving out `room` at the bottom,
/// or hides it at a radius of 0. True while it is shown.
pub fn set(window: &WebviewWindow, radius: i32, room: i32) -> bool {
    let Ok(hwnd) = window.hwnd() else {
        return false;
    };
    // As a number, which can go to another thread
    let hwnd = hwnd.0 as isize;
    let scale = window.scale_factor().unwrap_or(1.0);
    let (done, shown) = std::sync::mpsc::channel();
    let asked = window.run_on_main_thread(move || {
        let shown = LAYER.with(|layer| {
            show(
                &mut layer.borrow_mut(),
                HWND(hwnd as *mut _),
                radius,
                room,
                scale,
            )
        });
        let _ = done.send(shown.unwrap_or_else(|e| {
            eprintln!("Could not draw the glass behind the window: {e}");
            false
        }));
    });
    asked.is_ok() && shown.recv().unwrap_or(false)
}

fn show(layer: &mut Option<Layer>, hwnd: HWND, radius: i32, room: i32, scale: f64) -> Result<bool> {
    if radius <= 0 {
        if let Some(layer) = layer {
            layer.sprite.SetIsVisible(false)?;
        }
        return Ok(false);
    }
    if layer.is_none() {
        *layer = Some(Layer::new(hwnd)?);
    }
    let Some(layer) = layer else {
        return Ok(false);
    };
    let strength = deviation(radius, scale);
    if layer.blur.as_ref().map(|(s, _)| *s) != Some(strength) {
        let brush = blurred(&layer.compositor, strength)?;
        layer.sprite.SetBrush(&brush)?;
        layer.blur = Some((strength, brush));
    }
    layer.sprite.SetSize(size(room, scale))?;
    layer.sprite.SetIsVisible(true)?;
    Ok(true)
}

impl Layer {
    fn new(hwnd: HWND) -> Result<Self> {
        let queue = match DispatcherQueue::GetForCurrentThread() {
            Ok(_) => None,
            Err(_) => Some(unsafe {
                CreateDispatcherQueueController(DispatcherQueueOptions {
                    dwSize: size_of::<DispatcherQueueOptions>() as u32,
                    threadType: DQTYPE_THREAD_CURRENT,
                    apartmentType: DQTAT_COM_NONE,
                })?
            }),
        };
        let compositor = Compositor::new()?;
        // Not topmost: under the page, which draws over it
        let target = unsafe {
            compositor
                .cast::<ICompositorDesktopInterop>()?
                .CreateDesktopWindowTarget(hwnd, false)?
        };
        let whole = Vector2 { X: 1.0, Y: 1.0 };
        let root = compositor.CreateContainerVisual()?;
        root.SetRelativeSizeAdjustment(whole)?;
        let sprite = compositor.CreateSpriteVisual()?;
        sprite.SetRelativeSizeAdjustment(whole)?;
        root.Children()?.InsertAtBottom(&sprite)?;
        target.SetRoot(&root)?;
        Ok(Self {
            _queue: queue,
            compositor,
            _target: target,
            sprite,
            blur: None,
        })
    }
}

/// A brush painting what shows through the window, blurred by `deviation`
fn blurred(compositor: &Compositor, deviation: f32) -> Result<CompositionEffectBrush> {
    let factory = compositor.CreateEffectFactory(&gaussian::blur(deviation, SOURCE)?)?;
    let brush = factory.CreateBrush()?;
    brush.SetSourceParameter(&HSTRING::from(SOURCE), &compositor.CreateBackdropBrush()?)?;
    Ok(brush)
}

/// Direct2D's Gaussian blur, described the way composition takes effects
/// (outside UWP there is no Win2D to describe it)
mod gaussian {
    use std::sync::Mutex;
    use windows::core::{implement, Interface, Result, GUID, HRESULT, HSTRING, PCWSTR};
    use windows::Foundation::{IPropertyValue, PropertyValue};
    use windows::Graphics::Effects::{
        IGraphicsEffect, IGraphicsEffectSource, IGraphicsEffectSource_Impl, IGraphicsEffect_Impl,
    };
    use windows::Win32::System::WinRT::Graphics::Direct2D::{
        IGraphicsEffectD2D1Interop, IGraphicsEffectD2D1Interop_Impl,
        GRAPHICS_EFFECT_PROPERTY_MAPPING, GRAPHICS_EFFECT_PROPERTY_MAPPING_DIRECT,
    };
    use windows::UI::Composition::CompositionEffectSourceParameter;

    /// CLSID_D2D1GaussianBlur
    const EFFECT: GUID = GUID::from_u128(0x1feb6d69_2fe6_4ac9_8c58_1d7f93e7a6a5);
    /// Its properties, by index
    pub(super) const PROPERTIES: [&str; 3] = ["StandardDeviation", "Optimization", "BorderMode"];
    /// D2D1_GAUSSIANBLUR_OPTIMIZATION_BALANCED
    const BALANCED: u32 = 1;
    /// D2D1_BORDER_MODE_HARD: no see-through fringe at the glass's edges
    const HARD: u32 = 1;

    fn invalid() -> windows::core::Error {
        windows::core::Error::from_hresult(HRESULT(0x80070057u32 as i32))
    }

    #[implement(IGraphicsEffect, IGraphicsEffectSource, IGraphicsEffectD2D1Interop)]
    struct Blur {
        name: Mutex<HSTRING>,
        deviation: f32,
        source: IGraphicsEffectSource,
    }

    /// The blur of the source named `source`, by `deviation` pixels
    pub fn blur(deviation: f32, source: &str) -> Result<IGraphicsEffect> {
        if !deviation.is_finite() || deviation < 0.0 {
            return Err(invalid());
        }
        Ok(Blur {
            name: Mutex::new(HSTRING::from("Blur")),
            deviation,
            source: CompositionEffectSourceParameter::Create(&HSTRING::from(source))?.cast()?,
        }
        .into())
    }

    impl IGraphicsEffect_Impl for Blur_Impl {
        fn Name(&self) -> Result<HSTRING> {
            Ok(self.name.lock().map_err(|_| invalid())?.clone())
        }
        fn SetName(&self, name: &HSTRING) -> Result<()> {
            *self.name.lock().map_err(|_| invalid())? = name.clone();
            Ok(())
        }
    }

    impl IGraphicsEffectSource_Impl for Blur_Impl {}

    impl IGraphicsEffectD2D1Interop_Impl for Blur_Impl {
        fn GetEffectId(&self) -> Result<GUID> {
            Ok(EFFECT)
        }
        fn GetNamedPropertyMapping(
            &self,
            name: &PCWSTR,
            index: *mut u32,
            mapping: *mut GRAPHICS_EFFECT_PROPERTY_MAPPING,
        ) -> Result<()> {
            if name.is_null() || index.is_null() || mapping.is_null() {
                return Err(invalid());
            }
            let name = unsafe { name.to_string() }.map_err(|_| invalid())?;
            let found = PROPERTIES
                .iter()
                .position(|p| *p == name)
                .ok_or_else(invalid)?;
            unsafe {
                *index = found as u32;
                *mapping = GRAPHICS_EFFECT_PROPERTY_MAPPING_DIRECT;
            }
            Ok(())
        }
        fn GetPropertyCount(&self) -> Result<u32> {
            Ok(PROPERTIES.len() as u32)
        }
        fn GetProperty(&self, index: u32) -> Result<IPropertyValue> {
            match index {
                0 => PropertyValue::CreateSingle(self.deviation)?.cast(),
                1 => PropertyValue::CreateUInt32(BALANCED)?.cast(),
                2 => PropertyValue::CreateUInt32(HARD)?.cast(),
                _ => Err(invalid()),
            }
        }
        fn GetSource(&self, index: u32) -> Result<IGraphicsEffectSource> {
            if index != 0 {
                return Err(invalid());
            }
            Ok(self.source.clone())
        }
        fn GetSourceCount(&self) -> Result<u32> {
            Ok(1)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_blur_is_half_the_radius_in_physical_pixels() {
        assert_eq!(deviation(16, 1.0), 8.0);
        assert_eq!(deviation(16, 1.5), 12.0);
        assert_eq!(deviation(0, 2.0), 0.0);
        assert_eq!(deviation(-3, 1.0), 0.0);
    }

    #[test]
    fn the_glass_leaves_out_the_room_kept_for_the_toolbar() {
        // As wide as the window, and as tall less the room
        assert_eq!(size(0, 1.25), Vector2 { X: 0.0, Y: 0.0 });
        assert_eq!(size(496, 1.25), Vector2 { X: 0.0, Y: -620.0 });
    }

    #[test]
    fn the_blur_names_the_properties_direct2d_expects() {
        assert_eq!(
            gaussian::PROPERTIES,
            ["StandardDeviation", "Optimization", "BorderMode"]
        );
    }
}
