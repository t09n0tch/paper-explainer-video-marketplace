---
name: "paper2video"
description: Turn an academic paper (PDF, arXiv link or pasted text) into a narrated explainer video with motion graphics, voiced by text-to-speech, with chapter chips, sentence-by-sentence captions, a real 3D world of the paper's setting (three.js), and charts built from the paper's own tables, exported as MP4 plus subtitles, with every number and claim fact-checked against the paper (claims ledger, on-screen text check, independent verifier). Use this skill whenever the user wants a paper explained as a video, animation or motion graphic (논문 설명 영상, 논문 리뷰 영상, 논문 모션그래픽, 논문 애니메이션, TTS 내레이션 영상, "이 논문 영상으로 만들어줘"), or wants to redo or extend such a film, even if they never say "skill". For lecture slides or course material use lecture2video instead. Korean by default; works for other languages.
allowed-tools: Bash(python3 ${CLAUDE_SKILL_DIR}/scripts/p2v.py *)
---

# Paper explainer video

Make a 3–5 minute narrated film that a student in the field can follow on first
watch: one spoken sentence at a time, the picture changing in step with it,
numbers that come straight from the paper.

This skill exists because the obvious approach fails. A first attempt that put a
title and a chart on each scene, 7 seconds apiece with no voice, was rejected as
"PPT slides with motion": too fast, too dense, no narration. What worked was the
opposite: narration leads, captions show the sentence being spoken, one
continuous world is revisited with camera moves, and each diagram is built piece
by piece as the voice describes it. Read `references/craft.md` before writing
anything; it is the distilled version of that feedback.

## What you produce

In a film folder (default `./<paper-short-name>-film/`):

- `film.mp4`: the voiced video (1920×1080, 30 fps)
- `narration.srt` and `narration.md`: subtitles and the timed script
- `index.html`: an interactive preview (play, scrub, with the voice if voiced)
- `claims.json` and `VERIFY.md`: every number and claim with its source in the paper, and the
  independent verifier's verdict (`references/verification.md`)

## Workflow

Every step is one command, `p2v` (type it exactly like this, with the full path, so
the pre-approved permission matches and no prompt interrupts the run):

```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/p2v.py <command> film/ ...
```

Below, `p2v X` is short for that line. Start with `p2v doctor`. If it ends with
`-> run: ... setup`, tell the user "first run: installing the toolchain (~1.5 GB, a few
minutes)" and run `p2v setup` once with the Bash tool's maximum timeout (600000 ms); it
builds its own venv (Playwright + Chromium, the offline voices, pypdf, ffmpeg if
missing), so nothing else needs installing. `p2v smoke` runs the whole chain on the
starter film and must end with ALL PASS; run it if anything looks broken.

### 1. Intake

You need the paper, the language (default Korean), the audience (default: a
student in the field, so explain jargon once, keep the maths), and a target
length (default 4–5 minutes). If the user gave a reference video, extract frames
(`ffmpeg -i ref.mp4 -vf fps=1/5,scale=480:-1,tile=4x4 sheet_%02d.png`) and note its
pacing, layout and whether it has a voice.

### 2. Read the paper and build a fact sheet

Put the paper's text in the film folder first; every claim is checked against it:

```bash
p2v new film/ --starter
p2v paper film/ <paper.pdf | arXiv id or link | PDF URL | paper.txt>
```

For an arXiv paper it also records the license (`paper/meta.json`): paper figures appear in the
film only if `figure_reuse` allows it; otherwise draw everything yourself.

Read the whole paper (`paper/paper.txt`), appendix included. Write `facts.md` in the film folder:
the problem, the method's parts, every number you might show with its source
(Table 2, Fig. 3, Eq. 4), the paper's own examples (they make the best scenes),
and its limitations. Add your own critical notes too (unfair comparisons, missing
variance, metric definitions that flatter the method): a good explainer has a
"what to keep in mind" chapter.

Only facts in `facts.md` go on screen. If a scene needs values the paper does not
give (say, the components of a score), make them up only as an illustration and
label them on screen as an example (예시).

**Fact-checking replaces trust.** The film is checked in three layers; read
`references/verification.md` before writing claims:

1. `claims.json` ledgers every factual statement and every number the film says or
   shows, each tied to a verbatim quote or a table row of `paper.txt` (or marked
   `derived` / `opinion` / `example` with an on-screen label), with `used_in` naming the
   narration lines that use it.
2. `check_claims.py` checks it mechanically against the paper, the captions, the `say`
   lines and every string the player actually showed. It must end **FAIL 0, WARN 0**.
3. A fresh-context verifier subagent checks conditions, flow, screen and licensing and
   writes `VERIFY.md`. Only a PASS goes to the final render.

### 3. Write the narration

Write `script.json` (format below). Follow the structure and pacing rules in
`references/craft.md`: chapters numbered ①②③ in the chip, 2–4 sentences per
scene, each sentence 5–8 seconds spoken, written for the ear.

Then write `claims.json` for every line (step 2's rules) and run
`p2v check film/`. Captions and `say` lines must be
FAIL 0, WARN 0 before you build scenes; scene numbers are checked in step 6.

If the user is around, show them the chapter outline and the narration
(`narration.md`, after step 4's timeline run) and ask for changes before building
scenes: text is cheap to change, scenes are not. If they said "just make it",
carry on.

```json
{
  "title": "RRARA 논문 설명",
  "lang": "ko",
  "fps": 30,
  "scenes": [
    { "id": "setting", "chapter": "① 문제",
      "captions": ["실험 무대는 HAZARD 벤치마크예요. 불이 번지는 방에서 물건을 구해 내는 과제죠.",
                   "물건마다 가치가 달라요. 비싼 물건은 5점, 싼 물건은 1점이에요."],
      "say": { "0": "실험 무대는 해저드 벤치마크예요. 불이 번지는 방에서 물건을 구해 내는 과제죠." } }
  ]
}
```

`say` (optional) gives the TTS a different spelling of a line, for acronyms and
names it would misread; the caption keeps the written form. Scene ids are
lower-case words; each becomes `scenes/<id>.js`. Optional per scene: `min_dur`,
`hold` (extra seconds at the end). Top level: `lead`, `gap`, `tail` (seconds of
silence around lines), `rate` (syllables per second for estimates, default 6),
`shared` (JS files in the film folder loaded before the scenes, e.g. the world).

### 4. Set up, voice, time

```bash
p2v timeline film/      # estimated timing, narration.md for review
p2v voice film/         # voice every line with the default voice, then re-time from the real speech
```

`p2v tts film/ [args]` and `p2v timeline film/` run the two halves separately; the
`tts.py` and `settings.py` options below work through them (`p2v tts film/ --samples`).
`S` below is `${CLAUDE_SKILL_DIR}/scripts`.

**The voice and the encoder have defaults; don't ask about them.** Unless the
user says otherwise, `tts.py` uses a local, offline neural voice chosen by the
script's language: Supertonic 3 voice `F1` for Korean and every other language,
Kokoro `af_heart` for English. `render.py` encodes H.264 (libx264, CRF 18,
preset medium) with AAC 192k audio. These live in `defaults.json`. If the engine's
package is missing, run `p2v setup`. The model downloads once on first use.
If the local voice still can't be used, `tts.py` falls back by itself to `edge`,
then the best other voice on the machine, and says so. Tell the user which voice was used.

**Change them only when the user asks**, at the scope they mean:

- "다른 목소리 들어보고 싶어" / "voices?": `p2v tts film/ --samples`, present
  `film/voice-samples/index.md` and the files, and store the pick as below.
- This film only: put `"voice": {"engine": ..., "voice": ..., "rate": ...}` (value from
  `index.md`) or `"encode": {"crf": 23, ...}` in `script.json`, delete `audio/*.wav`,
  re-run `tts.py` and `timeline.py`.
- From now on, every film: `python $S/settings.py set voice '{"engine": "say", "voice": "Yuna"}'`
  (engine and voice may also be `{lang: value}` maps, `"*"` for any other language)
  or `python $S/settings.py set encode '{"crf": 23, "preset": "slow"}'`. This writes
  `~/.config/paper2video/config.json`; `settings.py reset` goes back to the
  shipped defaults, `settings.py show film/` prints what will be used.
- One run: `tts.py --engine ... --voice ...`, `render.py --crf ... --codec ... --preset ...`.

Engines `tts.py` knows (which ones exist depends on where the code runs):

- `supertonic`: Supertonic 3, offline neural voices for Korean and 30 other
  languages (`F1`-`F5`, `M1`-`M5`); `pip install supertonic`, ~400 MB model from
  Hugging Face on first use. `--rate` is a speed factor (default 1.05).
- `kokoro`: Kokoro-82M, offline neural English voices (`af_heart`, `am_michael`,
  `bf_emma`...); `pip install kokoro-onnx soundfile`, ~350 MB model from GitHub on
  first use. `--rate` is a speed factor (default 1.0).
- `say`: macOS system voices (Korean: Yuna), only when running directly on a Mac.
- `sapi`: Windows system voices (Korean: Heami, if installed), only directly on Windows.
- `edge`: Microsoft neural voices (Korean: SunHi, InJoon); natural, needs
  `pip install edge-tts` and internet access to Microsoft's speech service.
- `sherpa`: an offline neural voice (Korean: "kss", female), works in a sandbox
  with no system voices; needs `pip install sherpa-onnx==1.12.40` (2.x lacks the
  phonemizer it uses) and a one-time ~60 MB model download from GitHub. Clear but lo-fi.
- `espeak`: robotic, last resort. `--engine cmd --cmd '...'` runs any other TTS
  the user has (a paid API's CLI, a local model).

If no voice works at all, say so plainly, make the film anyway (captions carry the
narration) and hand over `narration.md` and `narration.srt` for recording.

Voice before building scenes, so scene lengths are final. After editing a line, run
`p2v voice film/` again: lines whose text changed are re-voiced (`audio/manifest.json`
records what each file says), and `p2v render` refuses to export a film whose voice or
timing no longer matches `script.json`.

### 5. Build the scenes

One file per scene, `scenes/<id>.js`. The player (`index.html`) draws the caption
and the chapter chip itself; a scene draws only its picture. Read
`references/scene-api.md` for the API: the real 3D world (`T3`, three.js), the
ready-made templates (`TPL.bars`, `flow`, `formula`, `table`, `lanes`, ...) and patterns
for custom scenes. `--starter` left three example scenes (`room` in 3D, `formula`,
`chart` from a template) and a `world.js`; replace them with the paper's own.

**Study the worked example before the first scene.** `p2v new example/ --example rrara`
copies a complete, verified 15-scene film (RRARA, arXiv 2506.07223): script, 69 claims,
the shared 3D world, and every scene's code: 3D world shots with labels riding on objects,
template scenes, and custom signature shots (bars that shrink and re-sort, a scatter
with drop lines, an agent re-routing mid-walk). `references/example-rrara.md` explains
its plan. Copy patterns from it; don't copy its wording or numbers.

Use templates for results, pipelines, tables and equations, so they look the same in
every film; spend custom code on the world and the paper's signature idea. Open every
mechanism scene with where before how (`references/craft.md`).

**Math is typeset, never typed as ASCII.** Write the paper's equations in LaTeX
exactly as the paper writes them (same symbols, sub- and superscripts) and put them
in `<span class="tex">...</span>` or `k.tex('...')`; KaTeX renders them in the
paper's own Computer Modern style. `S_T` as plain text, `lambda`, `tau`, `v_t`
written out, or Unicode imitations like `λ_T` are not acceptable on screen. The
spoken caption says it in words ("시간 항", "람다 티") and never contains LaTeX.

Time every visual event from the narration, not from fixed seconds:
`k.caps[1].t0` is when the second sentence starts. Then re-voicing never puts a
picture out of step with its sentence.

Build the scenes in order and look at each one as you go (step 6) rather than
writing all of them blind.

### 6. Check, verify, then export

```bash
p2v render film/ --stills 3,9.5,15   # PNGs in film/stills/ while building a scene
p2v preview film/                    # one frame per narration line + verify/onscreen.json
p2v check film/                      # FAIL 0, WARN 0, now including every number on screen
```

Look at every `verify/preview_*.jpg` yourself (`verify/preview_index.md` says which cell
is which line). Check: nothing overlaps the caption band (bottom ~200 px) or the chip,
no text runs off a card, no blank or half-built frame lands where a sentence is spoken,
and the page printed no errors. Fix, re-run `--preview` and `check_claims.py` until
FAIL 0, WARN 0.

Then the independent check: spawn a fresh subagent with the Agent tool, with the prompt
in `references/verification.md` ("Running the verifier"). It writes `VERIFY.md`. On
FIX-AND-RERUN, fix, re-run preview and check, and send what changed to a new verifier;
after 3 rounds without PASS stop and tell the user what is open (BLOCKED). Do not skip
this step, even when the user said "just make it"; it replaces script approval, it does
not need the user.

Only after PASS:

```bash
p2v render film/                     # film/film.mp4 with the voice mixed in
p2v check film/                      # once more: the render records every 3rd frame's text
```

A full 5-minute export takes several minutes; run it last.
`--music track.mp3` lays a quiet bed under the voice if the user supplies one.

`p2v setup` installs everything the steps need. Optional: poppler (`brew install poppler`,
`apt-get install poppler-utils`) gives the cleanest table text for claim checks; without it
pypdf is used.

### 7. Deliver

Give the user `film.mp4`, `narration.srt`, `narration.md`, and say how to preview
(`index.html` in a browser; it needs the folder next to it). Mention the voice
used, the `VERIFY.md` verdict and the number of claims checked, anything shown as an
illustrative example, and anything you could not do.

## If you are in claude.ai with a Motion artifact type

Some claude.ai sessions offer a "Motion" artifact type instead of a filesystem
render. There the type's own instructions govern; it cannot hold a voice track,
so make the film with captions and deliver `narration.srt`/`narration.md` for
dubbing. `references/motion-artifact.md` says how to carry this skill's engine,
captions and pacing across.
