---
name: lecture2video
description: Turn lecture material (slide-deck PDF such as Beamer or PowerPoint exports, lecture notes, optionally a PPTX with speaker notes) into a complete series of short narrated explainer videos, one per section, made end to end without stopping between episodes, that walk through the real slides with highlights, a TTS voice, hand-built animations for the hardest ideas, board-style equations, pause-and-think quizzes, soft subtitles and chapter markers, exported as MP4. Use this skill whenever the user wants course slides, 강의자료, 수업 PDF, 강의 슬라이드 or 강의노트 turned into a video, lecture video, review video, study video or animation (강의 영상, 복습 영상, 강의 요약 영상, "이 강의자료 영상으로 만들어줘"), or wants to continue or redo such an episode, even if they never say "skill". For a single research paper use paper2video instead. Korean by default; works for other languages.
allowed-tools: Bash(python3 ${CLAUDE_SKILL_DIR}/scripts/l2v.py *)
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
- `claims.json` and `VERIFY.md`: every fact and formula with its slide page (or marked 보충), and
  the independent verifier's verdict (`references/verification.md`)

Plus, once for the whole lecture, `lecture-map.md` (step 2).

## Workflow

Every step is one command, `l2v` (type it exactly like this, with the full path, so the
pre-approved permission matches and no prompt interrupts the run):

```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/l2v.py <command> ep01/ ...
```

Below, `l2v X` is short for that line. Start with `l2v doctor`. If it ends with
`-> run: ... setup`, tell the user "first run: installing the toolchain (~1.5 GB, a few
minutes)" and run `l2v setup` once with the Bash tool's maximum timeout (600000 ms). The
toolchain and voice models are shared with paper2video, so if that skill is set up this
only adds pymupdf. `l2v smoke` runs the whole chain on the starter episode and must end
with ALL PASS; run it if anything looks broken.

**Make the whole series in one go.** Once the material is in hand, plan every episode
and build them one after another, each through steps 2-6 and its own verification, then
deliver them all together (step 7). Don't stop to ask between steps or between episodes:
no "here is episode 1, shall I continue?", no script approval. The independent verifier
(step 6) is the check, and it doesn't need the user. Stop early only when the user asks
for a single episode or a slide range, or when something blocks every episode (the PDF has
no text layer, the toolchain fails twice). An episode that ends BLOCKED after 3 verifier
rounds doesn't stop the series: note it and move on to the next one.

### 1. Intake

Ask only what you can't infer, and use the defaults otherwise. Ask once, at the start,
and only if the answer changes the plan; never between episodes:

- the material (PDF; a PPTX if they have one, since its speaker notes are the best
  source for narration; a class recording transcript if any)
- which part (default: the whole deck, every episode in the plan)
- audience (default: students taking the course, reviewing after class)
- narration language (default Korean; slides in English stay in English on screen)
- burned-in captions or soft subtitles (default soft; see craft.md §6)

### 2. Read the deck and make the lecture map

```bash
l2v new ep01/ --starter            # player, engine, slide scene, example scenes
l2v slides lecture.pdf ep01/       # page images, slides.json, contact sheets
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

Then write `claims.json` (format in `references/verification.md`): every fact, number and
formula the episode says or shows, each with the slide page it comes from and a quote from
that page's text in `slides.json`, or marked `supplement` (보충: the gaps the narration fills,
the check question, intuitions, textbook facts) with its reason or source. Run `l2v check
ep01/`: captions and `say` lines must be FAIL 0, WARN 0 before you build scenes.

Run `l2v timeline ep01/` and read `narration.md` yourself before building scenes: text is
cheap to change, scenes are not. Don't wait for the user's approval of the plan or the
script; carry on to the next step. (If the user asked to review the script first, show it
then and wait.)

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
l2v voice ep01/        # voice every line (default voice unless told otherwise), then re-time from the real speech
```

`S` below is `${CLAUDE_SKILL_DIR}/scripts`; `l2v tts ep01/ [args]` passes `tts.py` options through.
The default voice is local and offline, so every episode of a course sounds the same:
Supertonic 3 `F1` for Korean and other languages, Kokoro `af_heart` for English. If it can't
run, `tts.py` falls back to edge-tts SunHi, then the best other voice on the machine, and says so. Video
defaults: H.264 CRF 18, AAC 192k (`defaults.json`). Change them only when asked, at
the scope the user means:

- "다른 목소리 들어보고 싶어": run `l2v tts ep01/ --samples`, present `voice-samples/index.md`.
- This episode only: `"voice": {...}` or `"encode": {"crf": 23}` in `script.json`, then
  `l2v tts ep01/ --force` and `l2v timeline ep01/`.
- Every episode from now on: `python $S/settings.py set voice '{"engine": "say", "voice": "Yuna"}'`
  (or `set encode ...`), stored in `~/.config/lecture2video/config.json`;
  `settings.py show ep01/` prints what will be used, `settings.py reset` undoes it.

Engines: `supertonic` and `kokoro` (offline neural, the defaults), `say` (macOS), `sapi`
(Windows), `edge` (natural, needs internet), `sherpa` (offline, lo-fi), `espeak`, or
`--engine cmd` for any other TTS. Keep one voice for every episode of a course. If nothing
can voice, make the film anyway and hand over `narration.md` for recording; dropping
`audio/<scene>_<nn>.wav` files in later re-times everything.

After editing a line, run `l2v voice ep01/` again: lines whose text changed are re-voiced
(`audio/manifest.json` records what each file says), and `l2v render` refuses to export an
episode whose voice or timing no longer matches `script.json`.

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
- Where before how: at each chapter start the player shows the episode's chapter list along
  the top for a few seconds, current one lit (`"agenda": false` in script.json turns it off).
  In a hand-built scene about one part of a bigger diagram, show that part in the whole first.
- Anything the slides don't contain carries the 보충 badge on screen (`<div class="extra">보충</div>`);
  the check looks for it.
- Math is typeset with KaTeX in the slides' own notation; the spoken caption says it
  in words.

Build in order and check each scene's stills as you go.

### 6. Check, verify, export, finish

```bash
l2v render ep01/ --stills 12,40,75   # PNGs in stills/ while building a scene
l2v preview ep01/                    # one frame per narration line + on-screen text and mark scan
l2v check ep01/                      # FAIL 0, WARN 0: slides, numbers, labels, and where every mark lands
```

Look at every `verify/preview_*.jpg` yourself (`verify/preview_index.md` says which cell
is which line): every mark sits on the words it means (the check only proves it lands on
*a* line), nothing hides under the chapter chip, the chapter strip or the source tag, the
slide is never cropped, each sentence's subject is on screen while it is spoken, and every
formula matches the slide (`verify/VERIFY_auto.md` lists them). Fix, re-run until FAIL 0, WARN 0.

Then the independent check: spawn a fresh subagent with the Agent tool, with the prompt in
`references/verification.md` ("Running the verifier"). It writes `VERIFY.md`. On
FIX-AND-RERUN, fix, re-run preview and check, and send what changed to a new verifier;
after 3 rounds without PASS mark the episode BLOCKED with its open items (for the final
report) and continue with the next episode. Don't skip this step, even when the user said
"just make it".

Only after PASS:

```bash
l2v render ep01/                     # ep01/film.mp4; several minutes, run it in the background
l2v check ep01/                      # once more: the render records every 3rd frame's text
l2v finish ep01/                     # adds soft subtitles + chapters to film.mp4, writes chapters.txt
```

Pull one or two frames from the final `film.mp4` with ffmpeg to confirm the export.

### 7. Next episode, then deliver the series

When an episode has passed verification and its render is running in the background, go
straight to the next episode in `lecture-map.md` (`l2v new ep02/ --starter`, `l2v slides`
for its range, then steps 3-6). Each episode reuses the map, the voice, the look and the
glossary, and its recap scene picks up from the previous episode's wrap-up. Episode folders
render independently, so renders overlap with building the next episode. Between
episodes, tell the user progress in one line ("2편 완료 · 4:12 · 검증 PASS, 3편 시작"), not
a question.

After the last episode, join them into the whole lecture (each episode's recap and wrap-up
double as section breaks):

```bash
l2v join lecture.mp4 ep01/ ep02/ ep03/ --title "..."   # + lecture.srt, lecture-chapters.txt
```

Then deliver everything at once: send `lecture.mp4` and each episode's `film.mp4`, and give
a table with one row per episode (slides, length, `VERIFY.md` verdict, what was added as
보충). Mention `narration.srt`, `chapters.txt` and `index.html`, the voice used, any episode
left BLOCKED with its open items, and anything left rough. The slides and any textbook
figures in them belong to the instructor: say so before the user posts anything publicly.

## Reference files

- `references/craft.md`: structure, pacing, slide-scene and narration rules (read before step 3)
- `references/verification.md`: claims.json, the mechanical check, the verifier's five layers
- `references/scene-api.md`: the slide scene, parts.js, board and quiz patterns
- `references/scene-api-paper.md`: the engine's full API from the paper skill: pseudo-3D
  world, bars that re-sort, timeline lanes (for processes and algorithms)
- `references/example-vae.md`: a whole accepted episode, plan to scenes
