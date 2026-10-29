# Contributing

Bug reports, ideas and pull requests are welcome. For anything big, open an issue first
so we can agree on the approach.

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
