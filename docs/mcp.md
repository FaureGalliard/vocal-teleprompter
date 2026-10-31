# 🤖 Vocal Teleprompter with Claude and other AI assistants

Back to the [README](../README.md).

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
| `load_script` | Puts a script in the prompter, as a new saved script (or appends slides to the current one) |
| `list_scripts` | Lists the saved scripts, latest first, and which one is on screen |
| `open_script` | Puts a saved script on screen |
| `get_script` | Reads the current script, to review or improve it |
| `get_status` | Slides, words, estimated time, target duration, language and live pace |
| `control` | Start, pause, resume, stop, next or previous slide, show or hide the window |
| `update_settings` | Hide from screen sharing, text size and color, background color and opacity, frosted glass, contrast, font, weight, line spacing, text width and alignment, scrolling mode, reading line, countdown, target duration, title bar, click-through, speech language |

It also ships an **app guide** (every feature and where it is, so the assistant can point
you to it), a **format guide** (plain spoken text, `---` between slides, about 130
words per minute) and a **Prepare a presentation** prompt. Everything stays on your
computer: the connector talks to the open app over localhost with a private token, and
opens the app if it is closed. MCP clients that run local servers are supported; web
versions such as claude.ai in the browser cannot reach a desktop app.
