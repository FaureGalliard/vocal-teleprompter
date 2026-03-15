## AI Voice-Synced Teleprompter

An intelligent teleprompter that **listens to the speaker and automatically scrolls the script in real time**.

Instead of using a fixed scrolling speed, the application performs **real-time speech recognition** to detect the words spoken by the user and synchronizes the teleprompter with the script. As the speaker talks, the system identifies the current position in the text and smoothly advances the display.

This allows creators, presenters, and speakers to **talk naturally without worrying about manual scrolling or timing**.

---

### Key Features

- 🎤 **Active listening teleprompter** — detects spoken words and syncs with the script in real time
- 🔎 **Word-level alignment** with fuzzy matching between spoken audio and the script
- ⚡ **Real-time scrolling** that adapts to the speaker's natural pace
- 🌍 **Multilanguage support** — Spanish, English, French, German, Italian, Portuguese, Japanese, Chinese, Korean
- 🎙 **Microphone selector** — choose your input device from the UI
- 🖥 **Always-on-top window** — stays visible over other applications during presentations
- 🎨 **Customizable display** — background color, opacity, text color, font size
- 📋 **Paste or import text** — from clipboard or `.txt` file
- 🪟 **Custom title bar** — moveable between top and bottom, hideable
- 🖱 **System tray** — minimize to tray and restore with a click

---

### Tech Stack

- **React + TypeScript** — user interface
- **Vite** — frontend build tool
- **Tailwind CSS v4** — styling
- **Tauri v2** — cross-platform desktop application framework
- **Rust** — native backend and system integration
- **Web Speech API** — real-time speech recognition (low latency, no cost, no internet required)
- **Tauri Plugins** — clipboard, file dialog, file system, opener

---

### How It Works

```
Microphone → Web Speech API → Transcript
                                  ↓
                         Fuzzy word matcher
                                  ↓
                    Current position in script
                                  ↓
                    Smooth auto-scroll + highlight
```

The fuzzy matcher normalizes text (removes accents, lowercases, strips punctuation) and uses edit-distance matching so the system stays in sync even when the speaker mispronounces or skips words.

---

### Use Cases

- YouTube creators
- Presentations and talks
- Podcasts
- Video recording
- Live streaming

---
