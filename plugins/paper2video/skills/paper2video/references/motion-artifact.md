# Using this skill with a claude.ai Motion artifact

Some claude.ai chats have an Artifact tool that lists a "Motion" type (animated
films written as code, with a player, comments and MP4 export). When that is the
only way to make a video in the session, the type's own instructions come first:
its questions, its document names, its rules about what may be written. This
page only says how to carry this skill's approach across.

What carries over unchanged:

- `references/craft.md`: structure, pacing, writing for the ear, accuracy,
  safe zones. Ask the Motion type's own Length question, but answer it with this
  skill's 4–5 minute default (its cap is 300 s).
- The narration: write `script.json`'s captions first, then the scene list
  from it, one Motion scene per script scene, `dur` from `timeline.py`'s
  estimates (run it in the container if one exists, or estimate 6 syllables a
  second plus 0.35 s between sentences).

What changes:

- **No voice.** The Motion player synthesises only a wordless score. Say so
  before building, make the film with captions, keep any score very quiet
  (master gain around -12 dB) so a voice can be laid over it, and deliver
  `narration.srt` and `narration.md` (timed from the final scene durations) for
  dubbing. If the user needs the voice in the file, recommend running this skill
  in Cowork or Claude Code, where `tts.py` and `render.py` can run.
- **Captions per scene.** The Motion player draws no captions, so put a caption
  helper in the film's shared module (one element per sentence, shown between
  its t0 and t1 with 0.25 s fades) and call it from every scene's `render`.
- **The engine.** Put `assets/engine.js`'s `W3` object in the shared module too.
  Read the palette from the stage's CSS variables. Draw on a canvas the scene
  creates itself (the Motion player's shared top canvas would sit above the
  captions).
- **Math.** The Motion player loads nothing from outside, so KaTeX can't be
  fetched. Upload KaTeX's fonts as the film's font assets and inline its CSS, or
  at least set math in a serif italic with real `<sub>`/`<sup>`; never plain `S_T`.
- **Times are literal** there, not caption-relative: keep caption start times
  as constants at the top of each scene so visuals and captions move together
  when you retime.
