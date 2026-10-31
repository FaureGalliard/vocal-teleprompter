//! `vocal-teleprompter --screencast-portal`: the screen sharing part of the
//! desktop portal, which video call apps ask for the screen.
//!
//! GNOME's own records a whole monitor by copying what is on it, prompter
//! included. This one records the same rectangle as an area of the screen
//! instead, which GNOME paints anew for every frame, and there the GNOME
//! Shell extension leaves the prompter out. To the call it is still the
//! whole screen.
//!
//! xdg-desktop-portal starts it when its configuration names it for
//! screen casts; the user is asked first, like with GNOME's.

use std::collections::HashMap;
use std::sync::Mutex;

use futures_util::StreamExt;
use zbus::object_server::SignalEmitter;
use zbus::zvariant::{OwnedObjectPath, OwnedValue, Structure, Value};
use zbus::{interface, Connection};

const NAME: &str = "org.freedesktop.impl.portal.desktop.vocalteleprompter";
const PATH: &str = "/org/freedesktop/portal/desktop";
const MUTTER: &str = "org.gnome.Mutter.ScreenCast";

// Portal responses
const OK: u32 = 0;
const CANCELLED: u32 = 1;
const FAILED: u32 = 2;

// Source types and cursor modes, as the portal numbers them
const MONITOR: u32 = 1;
const CURSOR_HIDDEN: u32 = 1;
const CURSOR_EMBEDDED: u32 = 2;
const CURSOR_METADATA: u32 = 4;

type Results = HashMap<String, OwnedValue>;

/// Asks the user whether an app may share the screen; answered on the main
/// thread, where GTK runs
struct Ask {
    app_id: String,
    reply: async_channel::Sender<bool>,
}

pub fn run() {
    if let Err(e) = gtk::init() {
        eprintln!("Screen sharing portal: no display: {e}");
        return;
    }
    let (asks, asked) = async_channel::unbounded::<Ask>();
    let connection = zbus::block_on(async {
        zbus::connection::Builder::session()?
            .serve_at(PATH, ScreenCast { asks })?
            .name(NAME)?
            .build()
            .await
    });
    let _connection = match connection {
        Ok(connection) => connection,
        Err(e) => {
            eprintln!("Screen sharing portal: could not start: {e}");
            return;
        }
    };
    while let Ok(ask) = asked.recv_blocking() {
        let _ = ask.reply.send_blocking(ask_user(&ask.app_id));
    }
}

fn ask_user(app_id: &str) -> bool {
    use gtk::prelude::*;

    #[cfg(debug_assertions)]
    if std::env::var_os("VOCAL_TELEPROMPTER_PORTAL_AUTO_ACCEPT").is_some() {
        return true;
    }
    let who = if app_id.is_empty() { "An app" } else { app_id };
    let dialog = gtk::MessageDialog::new(
        None::<&gtk::Window>,
        gtk::DialogFlags::MODAL,
        gtk::MessageType::Question,
        gtk::ButtonsType::None,
        &format!("{who} wants to share your entire screen"),
    );
    dialog.set_secondary_text(Some(
        "Vocal Teleprompter stays on your screen but out of what is shared.",
    ));
    dialog.add_button("Cancel", gtk::ResponseType::Cancel);
    dialog.add_button("Share", gtk::ResponseType::Accept);
    dialog.set_default_response(gtk::ResponseType::Accept);
    dialog.set_keep_above(true);
    let response = dialog.run();
    dialog.close();
    while gtk::events_pending() {
        gtk::main_iteration();
    }
    response == gtk::ResponseType::Accept
}

struct ScreenCast {
    asks: async_channel::Sender<Ask>,
}

#[interface(name = "org.freedesktop.impl.portal.ScreenCast")]
impl ScreenCast {
    async fn create_session(
        &self,
        _handle: OwnedObjectPath,
        session_handle: OwnedObjectPath,
        _app_id: String,
        _options: Results,
        #[zbus(object_server)] server: &zbus::ObjectServer,
    ) -> (u32, Results) {
        let session = Session {
            cursor_mode: Mutex::new(CURSOR_HIDDEN),
            mutter: Mutex::new(None),
        };
        match server.at(&session_handle, session).await {
            Ok(_) => (OK, Results::new()),
            Err(e) => {
                eprintln!("Screen sharing portal: {e}");
                (FAILED, Results::new())
            }
        }
    }

    async fn select_sources(
        &self,
        _handle: OwnedObjectPath,
        session_handle: OwnedObjectPath,
        _app_id: String,
        options: Results,
        #[zbus(object_server)] server: &zbus::ObjectServer,
    ) -> (u32, Results) {
        let Ok(session) = server.interface::<_, Session>(&session_handle).await else {
            return (FAILED, Results::new());
        };
        if let Some(mode) = options
            .get("cursor_mode")
            .and_then(|v| u32::try_from(v).ok())
        {
            *session.get().await.cursor_mode.lock().unwrap() = mode;
        }
        (OK, Results::new())
    }

    // The portal's Start call, whose arguments the D-Bus interface sets
    #[allow(clippy::too_many_arguments)]
    async fn start(
        &self,
        _handle: OwnedObjectPath,
        session_handle: OwnedObjectPath,
        app_id: String,
        _parent_window: String,
        _options: Results,
        #[zbus(connection)] connection: &Connection,
        #[zbus(object_server)] server: &zbus::ObjectServer,
    ) -> (u32, Results) {
        let (reply, answer) = async_channel::bounded(1);
        if self.asks.send(Ask { app_id, reply }).await.is_err()
            || !answer.recv().await.unwrap_or(false)
        {
            return (CANCELLED, Results::new());
        }
        match start(connection, server, &session_handle).await {
            Ok(results) => (OK, results),
            Err(e) => {
                eprintln!("Screen sharing portal: could not share the screen: {e}");
                (FAILED, Results::new())
            }
        }
    }

    #[zbus(property, name = "AvailableSourceTypes")]
    fn available_source_types(&self) -> u32 {
        MONITOR
    }

    #[zbus(property, name = "AvailableCursorModes")]
    fn available_cursor_modes(&self) -> u32 {
        CURSOR_HIDDEN | CURSOR_EMBEDDED | CURSOR_METADATA
    }

    #[zbus(property, name = "version")]
    fn version(&self) -> u32 {
        5
    }
}

/// One app's screen sharing, from the portal's point of view, and the
/// recording GNOME makes for it
struct Session {
    cursor_mode: Mutex<u32>,
    mutter: Mutex<Option<OwnedObjectPath>>,
}

#[interface(name = "org.freedesktop.impl.portal.Session")]
impl Session {
    async fn close(
        &self,
        #[zbus(connection)] connection: &Connection,
        #[zbus(header)] header: zbus::message::Header<'_>,
    ) {
        let mutter = self.mutter.lock().unwrap().take();
        if let Some(mutter) = mutter {
            let _ = connection
                .call_method(
                    Some(MUTTER),
                    &mutter,
                    Some("org.gnome.Mutter.ScreenCast.Session"),
                    "Stop",
                    &(),
                )
                .await;
        }
        if let Some(path) = header.path().map(|p| p.to_owned()) {
            forget_session(connection, path.into());
        }
    }

    #[zbus(signal)]
    async fn closed(emitter: &SignalEmitter<'_>) -> zbus::Result<()>;

    #[zbus(property, name = "version")]
    fn version(&self) -> u32 {
        1
    }
}

/// Takes the session off the bus, once the call that ended it is over
fn forget_session(connection: &Connection, path: OwnedObjectPath) {
    let connection = connection.clone();
    connection
        .executor()
        .spawn(
            {
                let connection = connection.clone();
                async move {
                    let _ = connection.object_server().remove::<Session, _>(&path).await;
                }
            },
            "forget screen cast session",
        )
        .detach();
}

/// Records the primary monitor's rectangle as an area and returns the
/// PipeWire stream for the portal
async fn start(
    connection: &Connection,
    server: &zbus::ObjectServer,
    session_handle: &OwnedObjectPath,
) -> zbus::Result<Results> {
    let session = server.interface::<_, Session>(session_handle).await?;
    let cursor = match *session.get().await.cursor_mode.lock().unwrap() {
        CURSOR_EMBEDDED => 1u32,
        CURSOR_METADATA => 2u32,
        _ => 0u32,
    };
    let (x, y, width, height) = primary_monitor(connection).await?;

    let reply = connection
        .call_method(
            Some(MUTTER),
            "/org/gnome/Mutter/ScreenCast",
            Some(MUTTER),
            "CreateSession",
            &(Results::new(),),
        )
        .await?;
    let mutter: OwnedObjectPath = reply.body().deserialize()?;
    *session.get().await.mutter.lock().unwrap() = Some(mutter.clone());

    let mut properties = Results::new();
    properties.insert("cursor-mode".into(), OwnedValue::from(cursor));
    let reply = connection
        .call_method(
            Some(MUTTER),
            &mutter,
            Some("org.gnome.Mutter.ScreenCast.Session"),
            "RecordArea",
            &(x, y, width, height, properties),
        )
        .await?;
    let stream: OwnedObjectPath = reply.body().deserialize()?;

    let stream_proxy = zbus::Proxy::new(
        connection,
        MUTTER,
        stream,
        "org.gnome.Mutter.ScreenCast.Stream",
    )
    .await?;
    let mut added = stream_proxy.receive_signal("PipeWireStreamAdded").await?;
    let session_proxy = zbus::Proxy::new(
        connection,
        MUTTER,
        mutter.clone(),
        "org.gnome.Mutter.ScreenCast.Session",
    )
    .await?;
    let mut closed = session_proxy.receive_signal("Closed").await?;
    session_proxy.call_method("Start", &()).await?;
    let node: u32 = added
        .next()
        .await
        .ok_or_else(|| zbus::Error::Failure("No PipeWire stream".into()))?
        .body()
        .deserialize()?;

    // Stopped from GNOME's own indicator: tell the portal the session is over
    let emitter = session.signal_emitter().clone();
    let forget = connection.clone();
    let path = session_handle.clone();
    connection
        .executor()
        .spawn(
            async move {
                if closed.next().await.is_some() {
                    let _ = Session::closed(&emitter).await;
                    forget_session(&forget, path);
                }
            },
            "follow screen cast session",
        )
        .detach();

    let mut stream = Results::new();
    stream.insert(
        "position".into(),
        Value::from(Structure::from((x, y))).try_into()?,
    );
    stream.insert(
        "size".into(),
        Value::from(Structure::from((width, height))).try_into()?,
    );
    stream.insert("source_type".into(), OwnedValue::from(MONITOR));
    let mut results = Results::new();
    results.insert(
        "streams".into(),
        Value::from(vec![(node, stream)]).try_into()?,
    );
    results.insert("persist_mode".into(), OwnedValue::from(0u32));
    Ok(results)
}

type Mode = (String, i32, i32, f64, f64, Vec<f64>, Results);
type Monitor = ((String, String, String, String), Vec<Mode>, Results);
type Logical = (
    i32,
    i32,
    f64,
    u32,
    bool,
    Vec<(String, String, String, String)>,
    Results,
);

/// The primary monitor's rectangle in the stage's coordinates, as
/// RecordArea takes it
async fn primary_monitor(connection: &Connection) -> zbus::Result<(i32, i32, i32, i32)> {
    let reply = connection
        .call_method(
            Some("org.gnome.Mutter.DisplayConfig"),
            "/org/gnome/Mutter/DisplayConfig",
            Some("org.gnome.Mutter.DisplayConfig"),
            "GetCurrentState",
            &(),
        )
        .await?;
    let (_, monitors, logical, properties): (u32, Vec<Monitor>, Vec<Logical>, Results) =
        reply.body().deserialize()?;
    let missing = || zbus::Error::Failure("No primary monitor".into());
    let primary = logical
        .iter()
        .find(|l| l.4)
        .or(logical.first())
        .ok_or_else(missing)?;
    let connector = &primary.5.first().ok_or_else(missing)?.0;
    let monitor = monitors
        .iter()
        .find(|m| &m.0 .0 == connector)
        .ok_or_else(missing)?;
    let mode = monitor
        .1
        .iter()
        .find(|m| m.6.get("is-current").and_then(|v| bool::try_from(v).ok()) == Some(true))
        .ok_or_else(missing)?;
    // Stage coordinates are logical pixels, unless the layout is physical
    let physical = properties
        .get("layout-mode")
        .and_then(|v| u32::try_from(v).ok())
        == Some(2);
    let scale = if physical { 1.0 } else { primary.2 };
    let (mut width, mut height) = (mode.1, mode.2);
    // Rotated a quarter turn either way
    if primary.3 % 2 == 1 {
        std::mem::swap(&mut width, &mut height);
    }
    Ok((
        primary.0,
        primary.1,
        (width as f64 / scale).round() as i32,
        (height as f64 / scale).round() as i32,
    ))
}
