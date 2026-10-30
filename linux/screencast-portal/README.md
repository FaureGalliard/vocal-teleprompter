# Screen sharing portal

GNOME shares a whole monitor by copying what is on it, so with a browser
(Meet, Zoom on the web) the prompter shows in the call even with the GNOME
Shell extension hiding it from screenshots. Recording the same rectangle as
an area makes GNOME paint every frame anew, and there the extension leaves
the prompter out.

`vocal-teleprompter --screencast-portal` is a backend for
`org.freedesktop.impl.portal.ScreenCast` that does exactly that, asking the
user first. To the call it is still the whole screen.

To try it (it replaces GNOME's screen sharing for the user, so read the
files first):

```sh
mkdir -p ~/.local/share/xdg-desktop-portal/portals ~/.config/xdg-desktop-portal \
  ~/.local/share/dbus-1/services
cp linux/screencast-portal/vocalteleprompter.portal ~/.local/share/xdg-desktop-portal/portals/
cp linux/screencast-portal/gnome-portals.conf ~/.config/xdg-desktop-portal/
sed "s|@EXEC@|$PWD/src-tauri/target/debug/vocal-teleprompter|" \
  linux/screencast-portal/org.freedesktop.impl.portal.desktop.vocalteleprompter.service \
  > ~/.local/share/dbus-1/services/org.freedesktop.impl.portal.desktop.vocalteleprompter.service
systemctl --user restart xdg-desktop-portal
```

To go back to GNOME's: delete `~/.config/xdg-desktop-portal/gnome-portals.conf`
and restart `xdg-desktop-portal` again.

For now it shares the primary monitor only, and windows cannot be shared
through it.
