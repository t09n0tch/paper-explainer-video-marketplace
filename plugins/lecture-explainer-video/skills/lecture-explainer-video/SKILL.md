---
name: lecture-explainer-video
description: Turn lecture material (slide-deck PDF such as Beamer or PowerPoint exports, lecture notes, optionally a PPTX with speaker notes) into a series of short narrated explainer videos, one per section, that walk through the real slides with highlights, a TTS voice, hand-built animations for the hardest ideas, board-style equations, pause-and-think quizzes, soft subtitles and chapter markers, exported as MP4. Use this skill whenever the user wants course slides, 강의자료, 수업 PDF, 강의 슬라이드 or 강의노트 turned into a video, lecture video, review video, study video or animation (강의 영상, 복습 영상, 강의 요약 영상, "이 강의자료 영상으로 만들어줘"), or wants to continue or redo such an episode, even if they never say "skill". For a single research paper use paper-explainer-video instead. Korean by default; works for other languages.
---

# Lecture explainer video

Make a series of 5–8 minute episodes, one per section of a lecture, that a student
can watch to review the class: the professor's own slides on screen, a voice that
explains what the slides only list, and the picture pointing at exactly what the
voice is talking about.

The job is the reverse of a paper explainer. A paper is all text, so the film must
invent pictures. A slide deck already has the pictures; what is missing is the
lecturer's voice: why each bullet is there, how slides connect, the example done on
the board. So most of the work is writing that explanation and pointing at the right
place on the slide while it is spoken. The failure to avoid is the narrated
PowerPoint: a static slide with its bullets read aloud. Read `references/craft.md`
before writing narration; it holds the rules learned from a real prototype.

## What you produce

One folder per episode (default `./<course-short-name>-ep01/` and so on):

- `film.mp4`: 1920×1080, 30 fps, voice, the narration as a selectable subtitle track,
  one chapter marker per chapter
- `narration.srt`, `narration.md`: subtitles and the timed script
- `chapters.txt`: timestamps for a YouTube description
- `index.html`: interactive preview (needs the folder next to it)

Plus, once for the whole lecture, `lecture-map.md` (step 2).

## Workflow

### 1. Intake

Ask only what you can't infer, and use the defaults otherwise:

- the material (PDF; a PPTX if they have one, since its speaker notes are the best
  source for narration; a class recording transcript if any)
- which part (default: propose an episode plan and start with episode 1)
- audience (default: students taking the course, reviewing after class)
- narration language (default Korean; slides in English stay in English on screen)
- burned-in captions or soft subtitles (default soft; see craft.md §6)

### 2. Read the deck and make the lecture map

```bash
S=<this skill's folder>/scripts
python $S/new_film.py ep01/ --starter        # player, engine, slide scene, example scenes
python $S/slides.py lecture.pdf ep01/        # page images, slides.json, contact sheets
```

Look at the contact sheets (`slides/sheet_*.png`) and then at each page image you
will use. Read the slides as pictures, not only as extracted text: lecture decks are
diagram-heavy and text extraction misses what the diagram says. `slides.json` lists
every page's title, text, and boxes (`lines` tight to the glyphs, `figures` for
images and drawn diagrams) and flags Beamer overlay steps (`overlay_of`): pages that
repeat a slide with one more item revealed. Merge those into one scene and reveal in
the same order.

Write `lecture-map.md` (shared by all episodes; keep it in the parent folder):

- **Episode plan**: sections → episodes of 5–8 minutes, by slide range. Skip title,
  outline and "Questions?" pages (outlines can become chapter transitions).
- **Triage** for this episode: each slide's type and treatment (table below).
- **Concepts and notation**: definitions, formulas exactly as the slides write them,
  each with its slide number.
- **Gaps**: where the slides jump (an undefined symbol, a missing step, a figure
  never explained). The narration fills these; mark the additions as 보충.
- **Glossary**: Korean ↔ English terms, used consistently.

| Slide type | Treatment |
|---|---|
| bullets, definitions, short text | slide scene: highlight / underline the line being explained |
| a diagram the lecture leans on | slide scene with a circle; if it is the key idea, rebuild it as an animation |
| an equation or derivation | board scene: KaTeX, term by term, in the voice's order |
| algorithm, code, a process | animation that steps through it (see the paper skill's timeline pattern) |
| worked example or exercise | pose it, pause, then solve |
| title, outline, references | skip, or use as a chapter transition |

About 70–80% of scenes should be slide scenes and 2–4 per episode hand-built. That
split keeps the professor's slides recognisable for exam review and keeps the cost
of an episode reasonable.

### 3. Write the narration

Write `script.json` (format below) following `references/craft.md`: hook, learning
goals, then the slides in order, one check question with its answer, a short wrap-up
pointing to the next episode. Each sentence 5–8 s spoken, 2–4 sentences per scene.

Run `python $S/timeline.py ep01/` and show the user the plan, the triage and
`narration.md` before building anything. Text is cheap to change; scenes are not.

```json
{
  "title": "1편 · 차원 축소와 오토인코더",
  "lang": "ko", "fps": 30,
  "shared": ["slide.js", "parts.js"],
  "scenes": [
    { "id": "s04", "chapter": "② 인코더", "slide": 4,
      "captions": ["이 줄이는 함수를 인코더라고 불러요. D차원의 x를 받아서 M차원의 z를 내놓죠.", "…"],
      "say": { "0": "이 줄이는 함수를 인코더라고 불러요. 디 차원의 엑스를 받아서 엠 차원의 제트를 내놓죠." } },
    { "id": "quiz", "chapter": "확인 문제", "hold": 5, "captions": ["잠깐 멈추고 생각해 보세요.", "…"] }
  ]
}
```

`say` gives the TTS a spoken spelling (symbols, acronyms) while the caption keeps the
written form. Per scene: `slide` (page number, documentation only), `hold`,
`min_dur`. Top level: `voice`, `burn_captions` (default false), `lead`, `gap`, `tail`,
`rate`, `shared`.

### 4. Voice and time

```bash
python $S/tts.py ep01/               # voice every line (default voice unless told otherwise)
python $S/timeline.py ep01/          # re-time from the real speech
```

The default voice is Microsoft's neural `ko-KR-SunHiNeural` (edge-tts); if it is
missing or fails, `tts.py` falls back to the best other voice on the machine. Video
defaults: H.264 CRF 18, AAC 192k (`defaults.json`). Change them only when asked, at
the scope the user means:

- "다른 목소리 들어보고 싶어": run `--samples`, present `voice-samples/index.md`.
- This episode only: `"voice": {...}` or `"encode": {"crf": 23}` in `script.json`, then
  delete `audio/*.wav` and re-run `tts.py` and `timeline.py`.
- Every episode from now on: `python $S/settings.py set voice '{"engine": "say", "voice": "Yuna"}'`
  (or `set encode ...`), stored in `~/.config/lecture-explainer-video/config.json`;
  `settings.py show ep01/` prints what will be used, `settings.py reset` undoes it.

Engines: `say` (macOS), `sapi` (Windows), `edge` (natural, needs `pip install edge-tts`
and internet), `sherpa` (offline neural), `espeak`, or `--engine cmd` for any other
TTS. Keep one voice for every episode of a course. If nothing can voice, make the
film anyway and hand over `narration.md` for recording; dropping
`audio/<scene>_<nn>.wav` files in later re-times everything.

### 5. Build the scenes

Read `references/scene-api.md`. In short:

- **Slide scene**: one call, no drawing code. Each step names a caption, a box from
  `slides.json` and a mark (`hl`, `ul`, `circle`, `box`). Take boxes from `lines`
  (not `blocks`, which include line spacing and make marks sit low).
- **Card scenes** (`cards.js`, one call each): `CARD` for a recap of the last episode
  or the wrap-up (title, one formula, takeaway lines, next-episode card), `GOALS`,
  `QUIZ` (countdown during the scene's `hold`). Use them rather than writing these by
  hand; they keep every episode of a course looking the same.
- **Hand-built scenes** (`SCENE(id, {init, render})`): the hook and the one or two
  ideas per episode that need motion (a rebuilt diagram, a quiz answer that shows
  why, a board equation). `parts.js` has cell columns, rise-in and the board wipe;
  `assets/starter/` and `references/example-vae-scenes/` have working ones to copy.
- Time everything from `k.caps[i].t0`, never fixed seconds.
- Math is typeset with KaTeX in the slides' own notation; the spoken caption says it
  in words.

Build in order and check each scene's stills as you go.

### 6. Check, export, finish

```bash
python $S/render.py ep01/ --stills 12,40,75        # PNGs in stills/
python $S/render.py ep01/ --sheet 24               # contact sheet of the whole episode
python $S/render.py ep01/                          # ep01/film.mp4; several minutes, run it in the background
python $S/finish.py ep01/                          # adds soft subtitles + chapters to film.mp4, writes chapters.txt
```

Look at the stills yourself: every mark sits on the words it means, nothing hides
under the chapter chip (top left) or the source tag (top right), the slide is never
cropped, each sentence's subject is on screen while it is spoken, and every formula
matches the slide. Then pull one or two frames from the final `film.mp4` with ffmpeg
to confirm the export.

Install as needed: `pip install pymupdf playwright edge-tts`,
`python -m playwright install chromium`, ffmpeg from the system package manager.

### 7. Deliver

Send `film.mp4` and mention `narration.srt`, `chapters.txt`, `index.html`. Say which
voice was used, what was added as 보충, and anything left rough. The slides and any
textbook figures in them belong to the instructor: mention that before the user
posts an episode publicly. Then offer the next episode; it reuses the map, the voice
and the look, so it goes faster.

For the whole lecture as one video, keep the episodes (each with its recap and
wrap-up, which double as section breaks) and join them:

```bash
python $S/join.py lecture.mp4 ep01/ ep02/ ep03/ --title "..."   # + lecture.srt, lecture-chapters.txt
```

Episode folders render independently, so render several at once in the background.

## Reference files

- `references/craft.md`: structure, pacing, slide-scene and narration rules (read before step 3)
- `references/scene-api.md`: the slide scene, parts.js, board and quiz patterns
- `references/scene-api-paper.md`: the engine's full API from the paper skill: pseudo-3D
  world, bars that re-sort, timeline lanes (for processes and algorithms)
- `references/example-vae.md`: a whole accepted episode, plan to scenes
