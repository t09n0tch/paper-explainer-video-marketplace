---
name: "paper2video"
description: Turn an academic paper (PDF, arXiv link or pasted text) into a narrated explainer video with motion graphics, voiced by text-to-speech, with chapter chips, sentence-by-sentence captions, a pseudo-3D world of the paper's setting, and charts built from the paper's own tables, exported as MP4 plus subtitles. Use this skill whenever the user wants a paper explained as a video, animation or motion graphic (논문 설명 영상, 논문 리뷰 영상, 논문 모션그래픽, 논문 애니메이션, TTS 내레이션 영상, "이 논문 영상으로 만들어줘"), or wants to redo or extend such a film, even if they never say "skill". For lecture slides or course material use lecture2video instead. Korean by default; works for other languages.
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

## Workflow

### 1. Intake

You need the paper, the language (default Korean), the audience (default: a
student in the field, so explain jargon once, keep the maths), and a target
length (default 4–5 minutes). If the user gave a reference video, extract frames
(`ffmpeg -i ref.mp4 -vf fps=1/5,scale=480:-1,tile=4x4 sheet_%02d.png`) and note its
pacing, layout and whether it has a voice.

### 2. Read the paper and build a fact sheet

Read the whole paper, appendix included. Write `facts.md` in the film folder:
the problem, the method's parts, every number you might show with its source
(Table 2, Fig. 3, Eq. 4), the paper's own examples (they make the best scenes),
and its limitations. Add your own critical notes too (unfair comparisons, missing
variance, metric definitions that flatter the method): a good explainer has a
"what to keep in mind" chapter.

Only facts in `facts.md` go on screen. If a scene needs values the paper does not
give (say, the components of a score), make them up only as an illustration and
label them on screen as an example (예시).

### 3. Write the narration

Write `script.json` (format below). Follow the structure and pacing rules in
`references/craft.md`: chapters numbered ①②③ in the chip, 2–4 sentences per
scene, each sentence 5–8 seconds spoken, written for the ear.

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
S=<this skill's folder>/scripts
python $S/new_film.py film/ --starter # player, engine, math fonts, a 3-scene example
python $S/timeline.py film/          # estimated timing, narration.md for review
python $S/tts.py film/               # voice every line with the default voice
python $S/timeline.py film/          # re-time from the real speech lengths
```

**The voice and the encoder have defaults; don't ask about them.** Unless the
user says otherwise, `tts.py` uses Microsoft's neural voice through `edge-tts`
(Korean: `ko-KR-SunHiNeural`) and `render.py` encodes H.264 (libx264, CRF 18,
preset medium) with AAC 192k audio. These live in `defaults.json`. If `edge-tts`
is missing, run `pip install edge-tts`; if it still can't be used (no internet),
`tts.py` falls back by itself to the best other voice on the machine and says so.
Tell the user which voice was used.

**Change them only when the user asks**, at the scope they mean:

- "다른 목소리 들어보고 싶어" / "voices?": `python $S/tts.py film/ --samples`, present
  `film/voice-samples/index.md` and the files, and store the pick as below.
- This film only: put `"voice": {"engine": ..., "voice": ..., "rate": ...}` (value from
  `index.md`) or `"encode": {"crf": 23, ...}` in `script.json`, delete `audio/*.wav`,
  re-run `tts.py` and `timeline.py`.
- From now on, every film: `python $S/settings.py set voice '{"engine": "say", "voice": "Yuna"}'`
  or `python $S/settings.py set encode '{"crf": 23, "preset": "slow"}'`. This writes
  `~/.config/paper2video/config.json`; `settings.py reset` goes back to the
  shipped defaults, `settings.py show film/` prints what will be used.
- One run: `tts.py --engine ... --voice ...`, `render.py --crf ... --codec ... --preset ...`.

Engines `tts.py` knows (which ones exist depends on where the code runs):

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

Voice before building scenes, so scene lengths are final. After editing a line,
delete its `audio/<id>_<nn>.wav`, re-run `tts.py` and `timeline.py`.

### 5. Build the scenes

One file per scene, `scenes/<id>.js`. The player (`index.html`) draws the caption
and the chapter chip itself; a scene draws only its picture. Read
`references/scene-api.md` for the API, the pseudo-3D world (`k.W3`) and patterns
for the common scene types, and `references/example-rrara.md` for a whole film's
plan. `--starter` left three example scenes (`room`, `formula`, `chart`) and a
`world.js`; replace them with the paper's own.

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

### 6. Check, then export

```bash
python $S/render.py film/ --stills 3,9.5,15     # PNGs in film/stills/
python $S/render.py film/ --sheet 24            # contact sheet of the whole film
python $S/render.py film/                       # film/film.mp4 with the voice mixed in
```

Look at the stills yourself. Check: nothing overlaps the caption band (bottom
~200 px) or the chip, no text runs off a card, no blank or half-built frame lands
where a sentence is spoken, every number matches `facts.md`, and the page printed
no errors. A full 5-minute export takes several minutes; run it last.
`--music track.mp3` lays a quiet bed under the voice if the user supplies one.

Install what's missing as you need it: `pip install playwright` then
`python -m playwright install chromium`; ffmpeg from the system package manager
(macOS `brew install ffmpeg`, Windows `winget install ffmpeg`, Linux `apt-get install ffmpeg`);
for the offline voice `pip install sherpa-onnx==1.12.40`.

### 7. Deliver

Give the user `film.mp4`, `narration.srt`, `narration.md`, and say how to preview
(`index.html` in a browser; it needs the folder next to it). Mention the voice
used, anything shown as an illustrative example, and anything you could not do.

## If you are in claude.ai with a Motion artifact type

Some claude.ai sessions offer a "Motion" artifact type instead of a filesystem
render. There the type's own instructions govern; it cannot hold a voice track,
so make the film with captions and deliver `narration.srt`/`narration.md` for
dubbing. `references/motion-artifact.md` says how to carry this skill's engine,
captions and pacing across.
