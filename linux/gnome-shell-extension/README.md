# GNOME Shell extension

On Wayland only the compositor can see behind a window or keep it above the
others. This extension does both for Vocal Teleprompter over D-Bus
(`io.github.FaureGalliard.VocalTeleprompter.Shell`), and only for the
prompter's own windows, asked by the process that owns them.

To install it with the app from a release, download
`vocal-teleprompter@faure-galliard.github.io.shell-extension.zip` from the
same release, then:

```sh
gnome-extensions install --force vocal-teleprompter@faure-galliard.github.io.shell-extension.zip
# log out and back in (Wayland loads new extensions only at login), then
gnome-extensions enable vocal-teleprompter@faure-galliard.github.io
```

It is made for GNOME 51. Without it the app still works, with a plain
background instead of glass and letters colored to read over anything.

To try it while developing:

```sh
ln -s "$PWD/linux/gnome-shell-extension" \
  ~/.local/share/gnome-shell/extensions/vocal-teleprompter@faure-galliard.github.io
# log out and back in (Wayland loads new extensions only at login), then
gnome-extensions enable vocal-teleprompter@faure-galliard.github.io
```

Its log: `journalctl --user -f -o cat /usr/bin/gnome-shell`.
