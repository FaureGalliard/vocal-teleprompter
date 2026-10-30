# 🧩 Every feature

Back to the [README](../README.md).

- 🎨 **Reads over anything**: with a see-through background (the default), what is behind
  the window is softened like frosted glass, and every letter takes the color that stands
  out most from what is right behind it, so the prompter can sit anywhere on your slides.
  Clicks and key presses anywhere make it look again right away.
- 🃏 **Slide cards**: put a line with `---` between slides and each part becomes a card.
  The current card stands out, the bottom bar shows *Slide 3 / 12*, and it moves on as
  soon as you say the last word of the slide.
- ⏱️ **Pace and time**: see how long the script takes before you start, then the elapsed
  time, words per minute and time left. Set a **target duration** (say 10 minutes) and it
  tells you to speed up or slow down.
- 🤖 **Works with Claude and other AI assistants** through MCP: ask for your presentation
  and it lands in the prompter, already split into slide cards and sized to your time.
- ⌨️ **Global shortcuts** that work while Zoom, Meet or your slides have the focus. Rebind
  any of them in Settings, or turn them off.
- ⏳ **Countdown** (3, 2, 1) before listening starts, so you can settle and look at the
  camera. It ticks in the bottom row, never over your script.
- 🔤 **Typography**: font, weight, line spacing, text width and alignment.
- 🖱️ **Click-through mode**: clicks pass through the window to the app behind it.
- 📏 **Reading line** (optional): the current line stays at a fixed height near your
  camera, with the text around it faded.
- 🔎 **Word-level sync**: fuzzy matching (edit distance) on the last few spoken words, so
  mispronounced or skipped words don't throw it off.
- 🌍 **9 languages**: Spanish, English, French, German, Italian, Portuguese, Japanese,
  Chinese and Korean. Scripts without spaces are split into words with `Intl.Segmenter`.
- 🖱️ **Click any word to continue reading from it** after you jump ahead or repeat a
  passage; click it again, or between words, to edit the script right there.
- 🎙️ **Microphone picker** that picks up devices you plug in while the app is open.
- 💾 **Remembers everything**: script, colors, opacity, text size, language, microphone,
  and where and how big you left the window. The first time it opens as a strip at the
  top center of the screen, right under the webcam.
- 🧰 **Toolbar outside the text**: the round button in the bottom corner opens a row of
  controls below the prompter, so it never covers your script. The space it opens up
  lets clicks through to the apps behind.
- 🎨 **Appearance panel**: text size, background color and opacity, text color, automatic
  contrast and typography in one place.
- ✍️ **Write right in the prompter**: open the script menu (document icon) and pick
  **Edit script**, then the check mark (or `Esc`) to go back to prompting.
- 📋 **Paste or import** your script from the clipboard or a `.txt` file, from the same
  menu. Line breaks are kept.
- 🌐 **Interface in the same 9 languages** (English by default), tray menu included.
- ⚙️ **Settings panel** behind the gear button, grouped into **Reading** (scrolling,
  reading line, countdown, target duration), **Window** (hiding from screen sharing,
  click-through, title bar) and **General** (interface language, AI connector, global
  shortcuts, updates and a reset to defaults).
- 🎓 **Guided tour** on first launch (replay it any time from the script menu).
- 🔄 **Automatic updates**: the app tells you when a new version is out and updates itself
  in one click.
- 🧭 **Custom title bar** that you can move to the top or bottom, or hide.
- 🖥️ **System tray**: show, hide, toggle click-through or quit from the tray icon.

## ⌨️ Keyboard shortcuts

**Global** (work from any app; rebind them or turn them off in Settings):

| Keys | Action |
|---|---|
| `Ctrl+Alt+Space` | Start listening / pause / resume |
| `Ctrl+Alt+→` / `Ctrl+Alt+←` | Next / previous slide card |
| `Ctrl+Alt+H` | Show / hide the window |
| `Ctrl+Alt+K` | Click-through on / off |

**In the window:**

| Key | Action |
|---|---|
| `Space` | Start listening / pause / resume |
| `Esc` | Stop listening |
| `→` `↓` | Next word |
| `←` `↑` | Previous word |
| `PageDown` / `PageUp` | Next / previous slide card (10 words without cards) |
| `+` / `-` | Bigger / smaller text |

## Good to know

- Speech recognition runs **on your computer** with [Vosk](https://alphacephei.com/vosk/):
  no account and no internet while you speak. The first time you press Start in a language,
  its speech model (30 to 90 MB) is downloaded once.
- It listens to **any microphone** you pick in the microphone menu, which also has a level
  meter to test it.
- Hiding from screen capture needs **Windows 10 version 2004 or newer**. On older builds the
  window shows up black instead of disappearing. You can turn it off in **Settings** if
  you want to record the app itself.
