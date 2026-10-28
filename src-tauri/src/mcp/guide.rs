//! What an assistant needs to know to write for the prompter. It reaches the
//! assistant three ways: the server instructions, the `load_script` tool
//! description and the format guide resource.

pub const SERVER_INSTRUCTIONS: &str = "\
Vocal Teleprompter is a desktop teleprompter that listens to the speaker and \
scrolls the script as they read it aloud. Use it to put a speech or a \
presentation script in front of the user: write the script, send it with \
load_script, and check its length with get_status. Read the format guide \
resource (teleprompter://format-guide) before writing a script, and the app \
guide (teleprompter://app-guide) to explain features or where to find them. \
update_settings changes the prompter's settings, control drives it.";

pub const APP_GUIDE: &str = "\
# Vocal Teleprompter: features and where to find them

A small always-on-top window, usually placed under the webcam. The round \
button at its top right opens and closes the toolbar, a column of icons \
down the right edge that shows each icon's name on hover; holding the round \
button drags the window.

## Toolbar, top to bottom
- Script: Paste (clipboard), Import (.txt file), Clear, Edit (write in place; \
Done or Esc to finish).
- Start / Stop: listening starts after a short countdown. Pause / Resume \
appears while listening.
- Speech language (EN, ES...). Microphone: shows the Windows default input, \
which is the one speech recognition always uses, with a live level meter and \
a button to change it in the Windows sound settings.
- Appearance (palette icon): text size, background color and opacity, text \
color, and typography (font, weight, line spacing, text width, alignment).
- Tutorial (?) replays the guided tour. Settings (gear) holds the rest.

## Settings
Interface language (9 languages), hide from screen sharing, automatic \
contrast, click-through, reading line, countdown, target duration, title \
bar, AI connector, updates, global shortcuts (rebindable, can be turned \
off), tutorial and reset.

## In the script
- A line with only --- separates slide cards; the bottom bar shows Slide n / \
total with previous and next buttons.
- Click a word to edit the script there; Ctrl+click (or a click while \
listening) continues reading from that word.
- The bottom right shows the estimated reading time, and while listening the \
elapsed time, words per minute, time left and pace against the target.

## Features worth knowing
- Hide from screen sharing (on by default): Zoom, Meet, Teams, OBS and \
screenshots leave the window out, while the speaker still sees it.
- Automatic contrast keeps the text readable; with a see-through background \
the text gets a halo.
- Click-through lets clicks reach the app behind the window. Turned off with \
Ctrl+Alt+K or from the tray icon.
- Reading line holds the current line near the top, close to the camera.

## Shortcuts
In the window: Space start/pause, Esc stop, arrows move a word, PageUp and \
PageDown change slide, + and - change the text size.
Global (from any app, by default): Ctrl+Alt+Space start/pause, \
Ctrl+Alt+Left/Right previous/next slide, Ctrl+Alt+H show/hide the window, \
Ctrl+Alt+K click-through.

## Good to know
Speech recognition uses the Windows WebView2 engine and needs internet. \
Hiding from capture needs Windows 10 version 2004 or newer.";

pub const FORMAT_GUIDE: &str = "\
# Writing scripts for Vocal Teleprompter

The prompter matches each word the speaker says against the script, so the \
script must be exactly what will be said out loud.

- Plain text only. No Markdown, headings, bullet points, emojis, speaker \
labels or stage directions: everything in the script is expected to be read.
- One card per slide: put a line containing only --- between slides. The \
prompter shows \"Slide 3 / 12\" and moves to the next card as soon as the \
last word of the current one is spoken. Keep the order of the slides.
- Short, natural spoken sentences. Paragraph breaks are kept on screen.
- Numbers can stay as digits. Write symbols the speaker would pronounce as \
words (\"percent\" instead of %, \"and\" instead of &).
- Length: about 130 words per minute. A 5 minute talk is about 650 words, \
10 minutes about 1300 words. get_status reports the estimated reading time \
and the speaker's target duration, if any.
- Write in the language the speaker will speak. It should match the \
prompter's speech language, reported by get_status.

Example with two slides:

Good morning everyone. Today I want to show you how we cut our delivery \
times in half.
---
It started with a simple question: where were we actually losing time?";

/// Text of the `prepare_presentation` prompt
pub fn presentation_prompt(topic: &str, minutes: &str, slides: &str, audience: &str) -> String {
    let mut text = format!(
        "Help me prepare a spoken presentation about: {topic}.\n\n\
         It should last about {minutes} minutes"
    );
    if !slides.is_empty() {
        text.push_str(&format!(" and have {slides} slides"));
    }
    text.push('.');
    if !audience.is_empty() {
        text.push_str(&format!(" The audience is: {audience}."));
    }
    text.push_str(
        "\n\nFirst read the teleprompter format guide resource. Then write the \
         script I will read aloud, one card per slide separated by a line with \
         only ---, at about 130 words per minute. Load it into the teleprompter \
         with load_script, check get_status, and if the estimated time is far \
         from the target, adjust the script and load it again. Finally give me \
         a short outline of the slides so I can build them.",
    );
    text
}
