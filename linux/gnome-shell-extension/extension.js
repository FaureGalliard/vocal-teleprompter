// What Windows lets any app do and Wayland leaves to the compositor: see
// what is behind a window without the window itself in the way. The
// prompter asks over D-Bus; the scene is painted offscreen with the
// prompter left out, so nothing on screen changes.
//
// Only the prompter's own windows can be looked behind, and only by the
// process that owns them, so this gives no app a way to read the screen.

import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Mtk from 'gi://Mtk';
import Shell from 'gi://Shell';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

Gio._promisify(Shell.Screenshot, 'composite_to_stream');

const BUS_NAME = 'io.github.FaureGalliard.VocalTeleprompter.Shell';
const OBJECT_PATH = '/io/github/FaureGalliard/VocalTeleprompter/Shell';
// The app id on Wayland, the WM_CLASS through XWayland
const APP = 'vocal-teleprompter';

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
    <!-- Keeps the caller's window above the others, or lets it go -->
    <method name="SetAbove">
      <arg type="b" direction="in" name="above"/>
    </method>
    <property name="Version" type="u" access="read"/>
  </interface>
</node>`;

class Service {
    get Version() {
        return 1;
    }

    async BehindAsync(params, invocation) {
        try {
            const actor = await this._callerActor(invocation);
            const pixbuf = await behind(actor);
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

    // The prompter window of the process that sent the call
    async _callerActor(invocation) {
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
        const actor = global
            .get_window_actors()
            .find(a => a.meta_window.get_pid() === pid && a.meta_window.get_wm_class() === APP);
        if (!actor)
            throw new Error('No prompter window belongs to the caller');
        return actor;
    }
}

// Paints the scene under the window with the window left out, offscreen
async function behind(actor) {
    const frame = actor.meta_window.get_frame_rect();
    const rect = new Mtk.Rectangle({
        x: frame.x,
        y: frame.y,
        width: frame.width,
        height: frame.height,
    });
    const [, , , scale] = global.stage.get_capture_final_size(rect);
    // Skipped by this one paint only: the screen is not redrawn in between
    const opacity = actor.opacity;
    actor.opacity = 0;
    let content;
    try {
        content = global.stage.paint_to_content(rect, scale, null, Clutter.PaintFlag.NO_CURSORS);
    } finally {
        actor.opacity = opacity;
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
        this._service = new Service();
        this._dbus = Gio.DBusExportedObject.wrapJSObject(IFACE, this._service);
        this._dbus.export(Gio.DBus.session, OBJECT_PATH);
        this._owner = Gio.bus_own_name_on_connection(
            Gio.DBus.session,
            BUS_NAME,
            Gio.BusNameOwnerFlags.NONE,
            null,
            null,
        );
    }

    disable() {
        Gio.bus_unown_name(this._owner);
        this._dbus.unexport();
        this._dbus = null;
        this._service = null;
    }
}
