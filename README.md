<div align="center">

# 🎙️ Vocal Teleprompter

**A teleprompter that listens to you and scrolls your script as you speak.**

No fixed speed, no foot pedal: talk at your own pace and the text follows your voice.
Invisible in Zoom, Meet and OBS, so only you can see it.

[![Release](https://img.shields.io/github/v/release/FaureGalliard/vocal-teleprompter?label=download)](https://github.com/FaureGalliard/vocal-teleprompter/releases/latest)
![Platform](https://img.shields.io/badge/platform-Windows%2010%20%7C%2011-0078d4)
![Built with Tauri](https://img.shields.io/badge/built%20with-Tauri%202-24c8db)
![Languages](https://img.shields.io/badge/speech-ES%20%7C%20EN%20%7C%20FR%20%7C%20DE%20%7C%20IT%20%7C%20PT%20%7C%20JA%20%7C%20ZH%20%7C%20KO-445ade)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow)](LICENSE)

### [⬇️ Download for Windows](https://github.com/FaureGalliard/vocal-teleprompter/releases/latest/download/VocalTeleprompter-Setup.exe)

[Features](#-features) · [Shortcuts](#%EF%B8%8F-keyboard-shortcuts) · [Development](#-development)

![Main Screenshot](docs/screenshot-main.png)

</div>

---

## ✨ Why Vocal Teleprompter

- **🎤 It follows your voice.** Speech recognition finds where you are in the script and
  scrolls there. Pause, speed up or ad-lib, and it waits for you.
- **🕶️ Hidden from screen sharing.** Zoom, Google Meet, Teams, OBS, Discord and screenshots
  leave the window out. Your audience sees your slides; you see your script.
- **◐ Always readable.** The text color is adjusted automatically to keep WCAG contrast
  with the background. With a see-through background the text gets a halo, so it stays
  legible over a video, slides or your desktop.
- **🪟 Sits on top of everything.** Always on top, see-through background, resizable, with
  no taskbar entry. It can live right under your webcam.

---

## 🧩 Features

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

---

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

---

## 🎬 Demo

| Voice sync & highlighting | Easy resize | Color customization |
|---|---|---|
| [▶️ demo-voice-sync.mp4](docs/demo-voice-sync.mp4) | [▶️ demo-resize.mp4](docs/demo-resize.mp4) | [▶️ demo-color.mp4](docs/demo-color.mp4) |

| Toolbar | Microphone selector | Language selector |
|---|---|---|
| ![Toolbar](docs/screenshot-toolbar.png) | ![Microphone](docs/screenshot-microphone.png) | ![Language](docs/screenshot-language.png) |

---

## 🤖 Use it with Claude and other AI assistants

Vocal Teleprompter includes an [MCP](https://modelcontextprotocol.io) server, so AI
assistants can write your script and load it straight into the prompter. Ask something
like *"Prepare a 10-minute presentation about my thesis, one card per slide"* and the script
shows up ready to read, already split into slide cards and sized to your time.

**Connect it:** open **Settings → AI connector** and click **Connect** next to Claude
Desktop, Claude Code, Cursor or VS Code, then restart that app (or open a new Claude Code
session). For any other MCP client, use
**Copy the config**, or add this by hand:

```json
{
  "mcpServers": {
    "vocal-teleprompter": {
      "command": "C:\\Program Files\\vocal-teleprompter\\vocal-teleprompter.exe",
      "args": ["--mcp"]
    }
  }
}
```

Use the path where the app is installed: `C:\Program Files\vocal-teleprompter` for the
`.msi`, `%LOCALAPPDATA%\vocal-teleprompter` for the `.exe` installer.

**Claude Code by hand:** register it in the **user scope**, so every session in every
folder gets it (without `-s user` it only works in the folder where you ran the command):

```bash
claude mcp add -s user vocal-teleprompter -- "C:\Program Files\vocal-teleprompter\vocal-teleprompter.exe" --mcp
```

```bash
claude mcp list
```

It should show `vocal-teleprompter ... ✓ Connected`; open a new session to get its tools.
To check the connector itself, ask it for the prompter's status (the app opens if closed):

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_status","arguments":{}}}' | "/c/Program Files/vocal-teleprompter/vocal-teleprompter.exe" --mcp
```

> These are bash commands (Git Bash on Windows). Windows PowerShell 5.1 drops the `--` in
> `claude mcp add` (put `--%` right after `claude`) and does not pipe input into GUI apps, so
> the check above prints nothing there.

What the assistant can do:

| Tool | What it does |
|---|---|
| `load_script` | Puts a script in the prompter (replace or append slides) |
| `get_script` | Reads the current script, to review or improve it |
| `get_status` | Slides, words, estimated time, target duration, language and live pace |
| `control` | Start, pause, resume, stop, next or previous slide, show or hide the window |
| `update_settings` | Hide from screen sharing, text size, target duration, countdown, reading line, contrast, click-through, speech language |

It also ships an **app guide** (every feature and where it is, so the assistant can point
you to it), a **format guide** (plain spoken text, `---` between slides, about 130
words per minute) and a **Prepare a presentation** prompt. Everything stays on your
computer: the connector talks to the open app over localhost with a private token, and
opens the app if it is closed. MCP clients that run local servers are supported; web
versions such as claude.ai in the browser cannot reach a desktop app.

---

## ⬇️ Download

**[⬇️ Download Vocal Teleprompter for Windows](https://github.com/FaureGalliard/vocal-teleprompter/releases/latest/download/VocalTeleprompter-Setup.exe)**: one click, then run the file.

Prefer the `.msi`, or an older version? They are all on the
[Releases](https://github.com/FaureGalliard/vocal-teleprompter/releases/latest) page.
From v1.2.0 on, the app updates itself: you only install it once.

> **Windows SmartScreen**: the app is not code-signed yet, so Windows may warn you on the
> first launch. Click **More info → Run anyway**. The source is all here.

**Good to know**

- Speech recognition runs **on your computer** with [Vosk](https://alphacephei.com/vosk/):
  no account and no internet while you speak. The first time you press Start in a language,
  its speech model (30 to 90 MB) is downloaded once.
- It listens to **any microphone** you pick in the microphone menu, which also has a level
  meter to test it.
- Hiding from screen capture needs **Windows 10 version 2004 or newer**. On older builds the
  window shows up black instead of disappearing. You can turn it off in **Settings** if
  you want to record the app itself.

---

## ⚙️ How it works

```
Any microphone → Vosk (offline, streaming) → words as you say them
                                  ↓
             Intl.Segmenter → words, normalized (case, accents, punctuation)
                                  ↓
     Fuzzy matcher: last 3 spoken words vs. the next 25 words of the script
                                  ↓
          Nearest best match → highlight + smooth scroll to the current word
```

Each candidate word is scored by how many of the last spoken words line up with the
script before it. Ties go to the nearest word, so a repeated word further ahead can't make
the prompter jump. Short, common words only advance a step or two.

Contrast follows the WCAG 2 formula. When the text is below 4.5:1 against the background,
it is blended toward white or black just enough to pass and keeps its hue.

---

## 🚀 Development

Requirements: Node 22 + pnpm, Rust, and the
[Tauri prerequisites](https://tauri.app/start/prerequisites/).

```bash
pnpm install
```

```bash
pnpm tauri dev
```

Build the installers:

```bash
pnpm tauri build
```

They end up in `src-tauri/target/release/bundle/` (`nsis/*.exe` and `msi/*.msi`). The
bundler also signs the updater artifacts, so a local build needs the signing key in
`TAURI_SIGNING_PRIVATE_KEY` (its contents or its path).

**Releasing**: bump the version in `package.json`, `src-tauri/tauri.conf.json` and
`src-tauri/Cargo.toml`, then push a tag such as `v1.2.0`. The
[Release workflow](.github/workflows/release.yml) builds and signs the installers and opens
a draft release with `latest.json`; publishing the draft is what makes installed apps see
the update. The workflow reads the key from the `TAURI_SIGNING_PRIVATE_KEY` secret.

**Tests**: `pnpm test` runs the unit tests (matcher, slide cards, contrast). The speech
recognition tests transcribe recorded scripts in `src-tauri/tests/fixtures` and need the
models first:

```powershell
./scripts/fetch-speech-models.ps1
$env:VOSK_MODELS_DIR = "$PWD\.speech-models"
cargo test --manifest-path src-tauri/Cargo.toml
```

**Code style**: Prettier formats the frontend and rustfmt the Rust code; ESLint checks the
hook rules and keeps every file under 300 lines of code, and clippy lints the Rust side.

```bash
pnpm format
```

```bash
pnpm lint
```

CI runs all of them on every push, and a release is only built when they pass.

**Stack**: React 19 + TypeScript, Vite, Tailwind CSS v4, Framer Motion, Tauri 2 (Rust), and
Vosk for offline speech recognition, cpal for audio capture.

---

## 🗺️ Roadmap

Next up:

- 🐧 **Linux**: AppImage, `.deb` and `.rpm` builds, then the AUR and Flathub.
- 🍎 **macOS** build.
- 🪟 **Microsoft Store and winget**, for a one-command install on Windows.
- 🎚️ **Microphone sensitivity** control in the microphone menu.

Ideas for later versions:

- 📚 **Script library**: keep several scripts and switch between recent ones.
- ⏭️ **Advance your slides by voice**: send the next-slide key to PowerPoint, Google Slides
  or Keynote when a card is finished.
- 📥 **Import PowerPoint notes**: one card per slide from a `.pptx`.
- 🧭 **First-run setup**: language, microphone with a live level meter and a look preset.
- 🏷️ **Script markers**: highlighted `[PAUSE]` cues and `(notes)` that you don't have to read.
- 🧠 **Sharper recognition** with a local Whisper model, for accents and noisy rooms.

---

## 🎯 Use cases

YouTube videos · talks and presentations · video calls · podcasts · live streaming ·
recording courses

---

## ⭐ Found this project useful?

- **Star the repo** on GitHub: it helps other people find it.
- **Share it** with a classmate or a colleague who has a presentation coming up.
- **Found a bug or have an idea?** [Open an issue](https://github.com/FaureGalliard/vocal-teleprompter/issues).

### 💜 Support the project

Vocal Teleprompter is free and open source, and stays that way. If it saves you time
before a talk or a recording, you can
**[sponsor it on GitHub](https://github.com/sponsors/FaureGalliard)**: it pays for the
time that goes into new features, the Linux and macOS builds, and code signing so Windows
stops warning about the installer.

---

## 📄 License

[MIT](LICENSE)

## 👨‍💻 Author

Angel Gabriel Crispin Valdivia
