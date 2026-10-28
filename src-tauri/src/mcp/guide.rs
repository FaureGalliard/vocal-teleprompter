//! What an assistant needs to know to write for the prompter. It reaches the
//! assistant three ways: the server instructions, the `load_script` tool
//! description and the format guide resource.

pub const SERVER_INSTRUCTIONS: &str = "\
Vocal Teleprompter is a desktop teleprompter that listens to the speaker and \
scrolls the script as they read it aloud. Use it to put a speech or a \
presentation script in front of the user: write the script, send it with \
load_script, and check its length with get_status. Read the format guide \
resource (teleprompter://format-guide) before writing a script.";

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
