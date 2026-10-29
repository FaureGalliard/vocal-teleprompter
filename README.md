<div align="center">

<img src="src-tauri/icons/128x128.png" width="96" alt="Vocal Teleprompter icon">

# Vocal Teleprompter

### The teleprompter that follows your voice, and that nobody else can see.

Talk at your own pace: the script scrolls as you speak, waits when you pause, and stays
invisible in Zoom, Meet, Teams and OBS. Free, open source, and it runs offline.

[![Download](https://img.shields.io/github/v/release/FaureGalliard/vocal-teleprompter?label=download&color=445ade)](https://github.com/FaureGalliard/vocal-teleprompter/releases/latest)
[![Downloads](https://img.shields.io/github/downloads/FaureGalliard/vocal-teleprompter/total?color=445ade)](https://github.com/FaureGalliard/vocal-teleprompter/releases)
[![Stars](https://img.shields.io/github/stars/FaureGalliard/vocal-teleprompter?style=flat&color=facc15)](https://github.com/FaureGalliard/vocal-teleprompter/stargazers)
![Windows](https://img.shields.io/badge/Windows-10%20%7C%2011-0078d4)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow)](LICENSE)

## [⬇️ Download for Windows](https://github.com/FaureGalliard/vocal-teleprompter/releases/latest/download/VocalTeleprompter-Setup.exe)

<!-- MEDIA hero.png: the prompter at the top center of the screen over a full-screen slide,
     one word highlighted in yellow mid-script, toolbar closed. 1600 px wide. -->
![Vocal Teleprompter over a presentation](docs/media/hero.png)

</div>

---

## 🎤 It follows your voice

No fixed speed, no foot pedal. Speech recognition finds where you are in the script and
scrolls there, word by word. Pause, slow down or ad-lib, and it waits for you. Works with
any microphone, in 9 languages, entirely on your computer.

<!-- MEDIA demo-voice: 15-20 s screen recording with sound, reading out loud; halfway through,
     pause or say something off-script, then carry on. Upload it by dragging it into a GitHub
     issue and paste the user-attachments link on its own line here, replacing the GIF below. -->
![Reading out loud while the prompter follows](docs/media/demo-voice.gif)

## 🕶️ Your audience never sees it

Share your screen and only your slides go out. Zoom, Google Meet, Teams, OBS, Discord and
screenshots leave the prompter out, while you keep reading from it, right under your webcam.

<!-- MEDIA hidden-from-sharing.png: two panels side by side, the same moment of a call.
     Left "What you see": slides with the prompter on top. Right "What your audience sees":
     the same slides from another device in the call, no prompter. -->
![What you see vs. what your audience sees](docs/media/hidden-from-sharing.png)

## 🤖 Ask Claude for your script

Ask *"Prepare a 10-minute talk about my thesis, one card per slide"* and the script lands in
the prompter, split into slides and sized to your time. Connect Claude Desktop, Claude Code,
Cursor or VS Code in one click from **Settings → AI connector**.
[How it works →](docs/mcp.md)

<!-- MEDIA ai-assistant.png (or a 20 s video): Claude with that prompt on the left, the
     prompter on the right with the new script loaded and "Slide 1 / 6" in the bottom row. -->
![Claude writing a script straight into the prompter](docs/media/ai-assistant.png)

## 🧰 Everything else a speaker needs

<!-- MEDIA toolbar.png: the prompter with its toolbar open below it and the Settings panel
     showing the Reading, Window and General sections. -->
![The toolbar and settings](docs/media/toolbar.png)

- 🃏 **Slide cards**: put `---` between slides; it moves to the next one as you finish.
- ⏱️ **Pace**: time left, words per minute, and a nudge to speed up or slow down.
- ⏳ **Countdown** before it starts listening, so you can look at the camera.
- ◐ **Always readable**: automatic contrast, and a halo over see-through backgrounds.
- 🪟 **Stays where you put it**: always on top, remembers its size and spot.
- ⌨️ **Global shortcuts** that work while Zoom or your slides have the focus.
- 🖱️ **Click-through**, so clicks reach the app behind the prompter.
- 🔄 **Updates itself** in one click.

[Every feature and shortcut →](docs/features.md)

---

## ⬇️ Download

**[Download for Windows](https://github.com/FaureGalliard/vocal-teleprompter/releases/latest/download/VocalTeleprompter-Setup.exe)**,
run it, and you're done: the app updates itself from then on. The `.msi` and older versions
are on the [Releases](https://github.com/FaureGalliard/vocal-teleprompter/releases/latest)
page.

> **Windows SmartScreen** may warn you because the installer is not code-signed yet:
> **More info → Run anyway**. The source is all here.

Linux and macOS are next, see the roadmap.

## 🗺️ Roadmap

- 🐧 **Linux** (AppImage, `.deb`, `.rpm`, then the AUR and Flathub) and 🍎 **macOS**
- 🪟 **Microsoft Store and winget**
- ⏭️ **Advance your slides by voice** and 📥 **import PowerPoint speaker notes**
- 📚 **Script library** and 🏷️ **script markers** like `[PAUSE]`

Have an idea? [Open an issue](https://github.com/FaureGalliard/vocal-teleprompter/issues).

## 💜 Support the project

If it saved you time before a talk or a recording:

- ⭐ **Star the repo**, it's what helps other people find it.
- 💜 **[Sponsor it on GitHub](https://github.com/sponsors/FaureGalliard)**: it pays for the
  Linux and macOS builds and for code signing.
- 📣 **Share it** with someone who has a presentation coming up.

---

[Contributing](CONTRIBUTING.md) · [MIT License](LICENSE) · Made by Angel Gabriel Crispin Valdivia
