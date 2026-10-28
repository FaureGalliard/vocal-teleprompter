# Speech recordings for the tests

Each `<language>.wav` is synthesized speech of `<language>.txt`, as 16 kHz,
16-bit mono PCM. `tests/speech.rs` checks that Vosk recognizes most of the
script, and `src/lib/matcher.test.ts` replays what Vosk returned for them.

- `en-US.wav`: Windows speech synthesizer (Microsoft David), through
  `System.Speech.Synthesis.SpeechSynthesizer` with a 16 kHz mono output format.
- `es-ES.wav`: [Piper](https://github.com/rhasspy/piper) with the
  `es_ES-davefx-medium` voice, resampled from 22.05 kHz to 16 kHz.

To add a language: synthesize its script the same way, save the pair here,
add the model to `scripts/fetch-speech-models.ps1` if needed, and run the
tests; CI fetches the models for every recording in this folder.
