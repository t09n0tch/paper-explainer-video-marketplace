# Craft: what makes a lecture episode worth watching

These rules come from the paper-explainer skill's feedback (narration leads, one
change per sentence, no "PPT with motion") and from a lecture prototype the user
accepted: episode 1 of a VAE lecture, 3:23, slides 3–7.

## 1. Explain, don't read

- The slide is already on screen; reading it aloud adds nothing. Each sentence says
  what the line *means*, why it is there, or how it follows from the last slide.
- One sentence = one place on the slide. The mark (highlight, underline, circle)
  lands on that place as the sentence starts. A sentence with no place to point at
  belongs in a hand-built scene, not over a slide.
- Answer the slide's own questions. Lecture decks often end a slide with a question
  ("How can unlabeled data tell us…?"); end the scene on it and open the next scene
  with the answer. That is the thread that makes slides feel like one lecture.

## 2. Episode structure (5–8 minutes)

| Part | Scenes | Job |
|---|---|---|
| Hook | 1 | A concrete question or picture, not the slide title (e.g. 28×28 = 784 numbers for one digit) |
| Goals | 1 | 2–3 things the viewer will be able to do, said once |
| Slides | 1 per slide | In the lecture's order; chapter chips follow the lecture's sections |
| Check question | 2 | Question with a 5 s countdown (`hold: 5`), then the answer scene |
| Wrap-up | 1 | Two takeaways, the next episode's topic and slide range, credit line |

The check question goes right after the idea it tests, not at the very end. Pick the
question that exposes the usual misunderstanding (for an autoencoder: "what if
M = D?"). Questions and answers the slides don't contain are 보충.

## 3. Pacing

- Korean TTS: about 6 syllables a second; sentences of 30–45 syllables (5–8 s).
- 2–4 sentences per scene, scenes 12–30 s. A slide that needs more than 4 sentences
  is two scenes on the same page.
- Episode length from the deck: roughly 30–45 s per content slide.
- Give the eye 0.5 s after a sentence starts before the mark draws; marks draw in
  about 0.6 s; nothing flashes.

## 4. Slide scenes

- **Show the whole slide.** The prototype zoomed in at first: wide lines ran off the
  frame and the title slid under the chapter chip. Whole-slide framing with a
  spotlight (the rest dims) and marks reads better. Zoom (`zoom: 1.3`) only for a
  small diagram that is unreadable otherwise.
- **Marks:** `hl` for the sentence's line, `ul` for a short term inside a paragraph,
  `circle` for a symbol or a diagram part (circles lift the spotlight). The current
  mark is full; old underlines and circles fade, old highlights leave.
- **Boxes from `lines`, not `blocks`.** Block boxes include line spacing, so a
  highlight spills into the white below and a circle sits under its word.
- The source tag (top right) says `강의자료 슬라이드 N`; rebuilt diagrams say
  `강의자료 슬라이드 N · 다시 그림`.

## 5. Hand-built scenes

Use them where motion explains what a still slide can't: data flowing through a
network, a bottleneck shrinking, an equation assembled in the order the voice names
its parts. Copy the slide's notation and colour meaning; don't redesign the idea.

- **Board equation:** one KaTeX element per term, each with a short Korean meaning
  under it, written on (left-to-right wipe) when the voice names it, inputs before
  the result. Use `\displaystyle` for sums and limits and leave ~100 px under the row
  for the labels, or limits collide with them.
- **Colour roles:** `--second` for data and neutral ink, `--accent` for the thing
  being learned or the answer (z, the reconstruction), `--main` for errors, losses,
  differences and the 보충 badge.

## 6. Captions

Default: soft subtitles (the narration as a selectable track in the MP4, plus
`narration.srt` for YouTube). A caption band burned in at the bottom would cover the
bottom of every slide, and slide text, caption text and voice saying the same thing
at once is more to read, not more to learn. If the user wants burned-in captions,
set `"burn_captions": true` and shrink the slide (`SH`) to clear the bottom 200 px.

## 7. Writing for the ear

- Short sentences, spoken endings (-요, -죠), one idea each.
- Symbols in captions as written (x, z, M ≪ D); in `say` as spoken (엑스, 제트, 엠).
  Check every line with a symbol or acronym.
- English terms: say the Korean term and, the first time, the English one
  ("인코더", "잠재 표현, latent representation"); keep slides' English on screen.
- No parentheses or slashes in spoken lines; numbers as spoken words in `say`.

## 8. Accuracy

- Everything on screen matches the slides: same symbols, same definitions, same
  ordering of steps. Students will be examined on the slides, not on the video.
- Anything the slides don't say (an example number, a check question, an intuition)
  is marked 보충 on screen and must not contradict the lecture.
- Don't guess what will be on the exam.
