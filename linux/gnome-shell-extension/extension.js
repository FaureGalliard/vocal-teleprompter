// What Windows lets any app do and Wayland leaves to the compositor: see
// what is behind a window without the window itself in the way. The
// prompter asks over D-Bus; the scene is painted offscreen with the
// prompter left out, so nothing on screen changes.
//
// It also keeps the prompter above other windows, leaves it out of
// screenshots and screen shares, and tells when it is being dragged.
//
// Only the prompter's own windows can be looked behind, and only by the
// process that owns them, so this gives no app a way to read the screen.

import Clutter from 'gi://Clutter';
import Cogl from 'gi://Cogl';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Mtk from 'gi://Mtk';
import Shell from 'gi://Shell';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

Gio._promisify(Shell.Screenshot, 'composite_to_stream');

const BUS_NAME = 'io.github.FaureGalliard.VocalTeleprompter.Shell';
const OBJECT_PATH = '/io/github/FaureGalliard/VocalTeleprompter/Shell';
// The app id on Wayland, the WM_CLASS through XWayland
const APP = 'vocal-teleprompter';
const HIDE_EFFECT = 'vocal-teleprompter-hidden-from-capture';
// Input after this long without any counts as a new burst of input
const INPUT_PAUSE_MS = 80;

// Where a monitor is being painted right now, between the stage's
// before-paint and after-paint (the paint context tells no JS code which
// monitor, if any, it paints)
let monitorFramebuffer = null;

// Paints the window on the monitors but not in paints made offscreen into
// another framebuffer: screenshots, and the recordings or screen shares
// drawn from the scene. Any doubt paints it, so it never vanishes from the
// screen.
const HiddenFromCapture = GObject.registerClass(
    class HiddenFromCapture extends Clutter.Effect {
        vfunc_paint(node, paintContext, flags) {
            let onMonitor = true;
            try {
                const framebuffer = paintContext.get_framebuffer();
                onMonitor =
                    framebuffer === monitorFramebuffer || framebuffer instanceof Cogl.Onscreen;
            } catch (e) {
                logError(e, 'Could not tell where the prompter is painted');
            }
            if (onMonitor)
                super.vfunc_paint(node, paintContext, flags);
        }
    },
);

const IFACE = `<node>
  <interface name="io.github.FaureGalliard.VocalTeleprompter.Shell">
    <!-- What is behind the caller's window, as rows of RGB or RGBA pixels
         (channels: 3 or 4), in physical pixels -->
    <method name="Behind">
      <arg type="i" direction="out" name="width"/>
      <arg type="i" direction="out" name="height"/>
      <arg type="i" direction="out" name="stride"/>
      <arg type="i" direction="out" name="channels"/>
      <arg type="ay" direction="out" name="pixels"/>
    </method>
    <!-- The same at a fraction of the physical size (0.5: every second
         pixel), which is all the prompter looks at, for a fraction of the
         work -->
    <method name="BehindAt">
      <arg type="d" direction="in" name="fraction"/>
      <arg type="i" direction="out" name="width"/>
      <arg type="i" direction="out" name="height"/>
      <arg type="i" direction="out" name="stride"/>
      <arg type="i" direction="out" name="channels"/>
      <arg type="ay" direction="out" name="pixels"/>
    </method>
    <!-- The same for just the top share of the window (0-1), where the
         prompter's text is: the rest is room kept for its toolbar, and
         painting it would be work for nothing -->
    <method name="BehindTop">
      <arg type="d" direction="in" name="fraction"/>
      <arg type="d" direction="in" name="share"/>
      <arg type="i" direction="out" name="width"/>
      <arg type="i" direction="out" name="height"/>
      <arg type="i" direction="out" name="stride"/>
      <arg type="i" direction="out" name="channels"/>
      <arg type="ay" direction="out" name="pixels"/>
    </method>
    <!-- Keeps the caller's window above the others, or lets it go -->
    <method name="SetAbove">
      <arg type="b" direction="in" name="above"/>
    </method>
    <!-- The prompter window started (true) or stopped (false) being moved
         or resized, which Wayland tells no app about its own window -->
    <signal name="Moving">
      <arg type="b" name="moving"/>
    </signal>
    <!-- Leaves the caller's window out of screenshots and screen shares -->
    <method name="SetHiddenFromCapture">
      <arg type="b" direction="in" name="hidden"/>
    </method>
    <!-- The user clicked, typed, scrolled or moved the mouse after a pause,
         when the screen is likely about to change (a slide moves on) -->
    <signal name="UserInput"/>
    <property name="Version" type="u" access="read"/>
  </interface>
</node>`;

class Service {
    constructor(clients) {
        // Told about every prompter that calls, so the work done for one
        // happens only while one runs
        this._clients = clients;
    }

    get Version() {
        return 4;
    }

    BehindAsync(params, invocation) {
        this._behind(1, invocation);
    }

    BehindAtAsync([fraction], invocation) {
        this._behind(Math.min(Math.max(fraction, 0.05), 1), invocation);
    }

    BehindTopAsync([fraction, share], invocation) {
        this._behind(
            Math.min(Math.max(fraction, 0.05), 1),
            invocation,
            Math.min(Math.max(share, 0.01), 1));
    }

    async _behind(fraction, invocation, share = 1) {
        try {
            const actor = await this._callerActor(invocation);
            const pixbuf = await behind(actor, fraction, share);
            invocation.return_value(
                GLib.Variant.new_tuple([
                    new GLib.Variant('i', pixbuf.get_width()),
                    new GLib.Variant('i', pixbuf.get_height()),
                    new GLib.Variant('i', pixbuf.get_rowstride()),
                    new GLib.Variant('i', pixbuf.get_n_channels()),
                    GLib.Variant.new_from_bytes(
                        new GLib.VariantType('ay'),
                        pixbuf.read_pixel_bytes(),
                        true,
                    ),
                ]),
            );
        } catch (e) {
            invocation.return_error_literal(Gio.DBusError, Gio.DBusError.FAILED, e.message);
        }
    }

    async SetAboveAsync([above], invocation) {
        try {
            const window = (await this._callerActor(invocation)).meta_window;
            if (above)
                window.make_above();
            else
                window.unmake_above();
            invocation.return_value(null);
        } catch (e) {
            invocation.return_error_literal(Gio.DBusError, Gio.DBusError.FAILED, e.message);
        }
    }

    async SetHiddenFromCaptureAsync([hidden], invocation) {
        try {
            const actor = await this._callerActor(invocation);
            const effect = actor.get_effect(HIDE_EFFECT);
            if (hidden && !effect)
                actor.add_effect_with_name(HIDE_EFFECT, new HiddenFromCapture());
            else if (!hidden && effect)
                actor.remove_effect(effect);
            this._clients.syncPaintWatch();
            invocation.return_value(null);
        } catch (e) {
            invocation.return_error_literal(Gio.DBusError, Gio.DBusError.FAILED, e.message);
        }
    }

    // The prompter window of the process that sent the call
    async _callerActor(invocation) {
        const sender = invocation.get_sender();
        const pid = this._clients.pid(sender) ?? (await this._askPid(invocation));
        const actor = global
            .get_window_actors()
            .find(a => a.meta_window.get_pid() === pid && a.meta_window.get_wm_class() === APP);
        if (!actor)
            throw new Error('No prompter window belongs to the caller');
        this._clients.seen(sender, pid);
        return actor;
    }

    async _askPid(invocation) {
        const reply = await invocation.get_connection().call(
            'org.freedesktop.DBus',
            '/org/freedesktop/DBus',
            'org.freedesktop.DBus',
            'GetConnectionUnixProcessID',
            new GLib.Variant('(s)', [invocation.get_sender()]),
            new GLib.VariantType('(u)'),
            Gio.DBusCallFlags.NONE,
            -1,
            null,
        );
        const [pid] = reply.deepUnpack();
        return pid;
    }
}

// The prompters running, by bus name, and what is done only while there is
// one: following the input, and the paint watch that hiding from capture
// needs. Nothing of it runs in GNOME Shell while no prompter is open, as
// GNOME Shell paints the whole desktop on the same thread.
class Clients {
    constructor(onInput) {
        this._onInput = onInput;
        this._clients = new Map();
        this._idleWatch = 0;
        this._activeWatch = 0;
        this._paintSignals = null;
    }

    pid(name) {
        return this._clients.get(name)?.pid;
    }

    seen(name, pid) {
        if (this._clients.has(name))
            return;
        const watch = Gio.bus_watch_name_on_connection(
            Gio.DBus.session, name, Gio.BusNameWatcherFlags.NONE, null,
            () => this._gone(name));
        this._clients.set(name, {pid, watch});
        if (this._clients.size === 1)
            this._followInput(true);
    }

    _gone(name) {
        const client = this._clients.get(name);
        if (!client)
            return;
        Gio.bus_unwatch_name(client.watch);
        this._clients.delete(name);
        if (this._clients.size === 0)
            this._followInput(false);
        this.syncPaintWatch();
    }

    // Once per burst of input: the first event after a short pause.
    // GNOME restarts its idle time on any input, including what goes to
    // the apps, which no event filter of an extension gets to see.
    _followInput(follow) {
        const idle = global.backend.get_core_idle_monitor();
        if (follow && !this._idleWatch) {
            this._idleWatch = idle.add_idle_watch(INPUT_PAUSE_MS, () => {
                if (this._activeWatch)
                    return;
                this._activeWatch = idle.add_user_active_watch(() => {
                    this._activeWatch = 0;
                    this._onInput();
                });
            });
        } else if (!follow && this._idleWatch) {
            idle.remove_watch(this._idleWatch);
            this._idleWatch = 0;
            if (this._activeWatch)
                idle.remove_watch(this._activeWatch);
            this._activeWatch = 0;
        }
    }

    // Where each monitor is painted, which the hiding effect compares with,
    // is followed on every frame: only while some window uses the effect
    syncPaintWatch() {
        const needed = global.get_window_actors().some(a => a.get_effect(HIDE_EFFECT));
        if (needed && !this._paintSignals) {
            this._paintSignals = [
                global.stage.connect('before-paint', (stage, view) => {
                    monitorFramebuffer = view.get_framebuffer();
                }),
                global.stage.connect('after-paint', () => {
                    monitorFramebuffer = null;
                }),
            ];
        } else if (!needed && this._paintSignals) {
            this._paintSignals.forEach(id => global.stage.disconnect(id));
            this._paintSignals = null;
            monitorFramebuffer = null;
        }
    }

    destroy() {
        for (const name of [...this._clients.keys()])
            this._gone(name);
        this._followInput(false);
        this.syncPaintWatch();
    }
}

// Paints the scene under the top `share` of the window with the window
// left out, offscreen
async function behind(actor, fraction, share) {
    const frame = actor.meta_window.get_frame_rect();
    const rect = new Mtk.Rectangle({
        x: frame.x,
        y: frame.y,
        width: frame.width,
        height: Math.max(1, Math.round(frame.height * share)),
    });
    const [, , , scale] = global.stage.get_capture_final_size(rect);
    // Left out of this one paint only: the screen is not redrawn in between.
    // The override leaves the opacity itself alone, which a fade-in may be
    // animating, so it never sticks at a value taken halfway through.
    actor.set_opacity_override(0);
    let content;
    try {
        content = global.stage.paint_to_content(
            rect, scale * fraction, null, Clutter.PaintFlag.NO_CURSORS);
    } finally {
        actor.set_opacity_override(-1);
    }
    const stream = Gio.MemoryOutputStream.new_resizable();
    const pixbuf = await Shell.Screenshot.composite_to_stream(
        content.get_texture(),
        0, 0, -1, -1,
        1,
        null, 0, 0, 1,
        stream,
    );
    stream.close(null);
    return pixbuf;
}

export default class VocalTeleprompterExtension extends Extension {
    enable() {
        this._clients = new Clients(() => this._dbus?.emit_signal('UserInput', null));
        this._service = new Service(this._clients);
        this._dbus = Gio.DBusExportedObject.wrapJSObject(IFACE, this._service);
        this._dbus.export(Gio.DBus.session, OBJECT_PATH);
        const moving = value => (display, window) => {
            if (window?.get_wm_class() === APP)
                this._dbus.emit_signal('Moving', new GLib.Variant('(b)', [value]));
        };
        this._grabSignals = [
            global.display.connect('grab-op-begin', moving(true)),
            global.display.connect('grab-op-end', moving(false)),
        ];
        this._owner = Gio.bus_own_name_on_connection(
            Gio.DBus.session,
            BUS_NAME,
            Gio.BusNameOwnerFlags.NONE,
            null,
            null,
        );
    }

    disable() {
        for (const actor of global.get_window_actors()) {
            const effect = actor.get_effect(HIDE_EFFECT);
            if (effect)
                actor.remove_effect(effect);
        }
        this._grabSignals.forEach(id => global.display.disconnect(id));
        this._grabSignals = null;
        this._clients.destroy();
        this._clients = null;
        Gio.bus_unown_name(this._owner);
        this._dbus.unexport();
        this._dbus = null;
        this._service = null;
    }
}
