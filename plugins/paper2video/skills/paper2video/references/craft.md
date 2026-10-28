# Craft: what makes a paper explainer watchable

These rules come from a real round of feedback. The rejected film: 95 seconds,
13 scenes, each a headline plus a chart plus a footnote, no voice. The viewer's
words: "too fast, I don't understand it, it should be more detailed, I didn't ask
for PPT slides with motion graphics." The accepted reference: a 4-minute film,
TTS voice only, one sentence captioned at a time, the same 3D scene revisited,
diagrams built step by step, small source-tagged data panels.

## 1. Narration leads, the picture follows

- Write the narration first. Every scene is a set of sentences; the picture's
  job is to show what the current sentence says, no more.
- One sentence = one change on screen (something appears, moves, fills, turns
  red). If a sentence has nothing to show, the picture keeps moving gently
  (camera drift, a slow fill) but adds nothing new.
- Never put on screen a paragraph the voice is not saying. On-screen words are
  labels, numbers, formula tokens, short panel lines (≤ 12 words). The caption
  already carries the sentence.

## 2. Structure (4–5 minutes, 12–16 scenes)

| Part | Scenes | Job |
|---|---|---|
| Opening | 1 | Title on the paper's world; the one-line takeaway |
| ① 문제 | 2–3 | The setting made concrete (the task, the scoring), then the gap |
| ② How they measure | 1–2 | The evaluation idea, its formula, a worked number |
| ③ The surprising result | 1–2 | The finding that motivates the method |
| ④–⑦ Method | 1 per component | Name, what it takes in, what it outputs, why it's fast/right |
| ⑧ 결과 | 2 | Headline table, then one concrete episode compared |
| ⑨ 감안할 점 | 1 | Fair-comparison caveats, metric definitions, scale, reproducibility |
| Close | 1 | The takeaway again, title card held ≥ 3 s |

The chip (top left) names the chapter: "① 문제", "④ RRARA". Consecutive scenes
in one chapter keep the same chip text, and it doesn't re-animate.

## 3. Pacing

- Korean TTS speaks about 5.5–6.5 syllables a second. A sentence of 30–45
  syllables runs 5–8 s. Longer sentences: split them.
- 2–4 sentences per scene, so scenes run 12–27 s. Never under 10 s unless it's
  a pure transition.
- After a cut, give the eye 0.6–1 s before the first new thing appears.
- Entrances 0.4–0.6 s, ease-out; staggered items 0.2–0.4 s apart. Exits faster.
- Hold the final card at least 3 s.

## 4. Visual language

- **One world.** Render the paper's world in real 3D with `T3` once and come back
  to it in several chapters with different camera angles (`k.W3`, the flat tilted
  view, suits top-down maps). Continuity is what makes it feel like a film rather
  than slides.
- **The world is the paper's subject, not a stock set.** A room, a street, a car and
  a robot (`T3.room`, `T3.street`, `T3.agent`) fit embodied, robotics and driving
  papers only. For any other paper, build the world from the thing the paper studies,
  so that its central quantity becomes something you can see: a height, a glow, a
  path, a gap. A viewer rejected a film for an LLM-training paper because its 3D
  looked like robotics/autonomous driving. Decide the world before the first scene,
  in one sentence: "X is shown as Y; its key quantity is Y's Z."

  | paper is about | world idea |
  |---|---|
  | tokens, decoding, RL for LLMs | a road of token tiles; height = entropy/probability/advantage; forks branch off as faint paths; gradients fall as light beams (`--example forks`) |
  | attention, transformers | tokens as pillars in a row; attention as arcs between them, thickness = weight; heads as stacked layers |
  | graphs, GNNs, retrieval | nodes as glowing spheres on a floor; edges as ribbons; messages travel along them |
  | images, diffusion, vision | a patch grid as a field of tiles; noise as jittering heights that settle; masks as darkened tiles |
  | optimisation, loss landscapes | a terrain mesh; the optimiser as a marker rolling downhill; the paper's trick changes the slope |
  | data, scaling, benchmarks | a city of bars: one block per model/dataset, rising as size grows |
  | embodied agents, robots, driving | the room or street itself (`--example rrara`) |

  Labels for the world's pieces (token words, node names) ride on them; if a quantity
  in the world is illustrative (heights you made up), say so on screen once per scene.
- **Colour has meaning, held all film:** `--main` = the problem/hazard/loss,
  `--accent` = the method/agent/our result, `--second` = ink and neutral
  objects. Baselines are greyed second.
- **Use the templates** (`TPL.bars`, `flow`, `formula`, `table`, ... in
  `references/scene-api.md`) for results, pipelines and equations; write custom code
  for the world and for the paper's signature idea, where the film earns its keep.
- **Diagrams build.** A formula appears token by token, each with its meaning
  under it; then the tokens swap to numbers for the worked example. Timelines
  sweep with a playhead. Bars grow, then re-sort.
- **Data panels** (`.card`) are small, sit right or top, and end with a source
  line: `Table 2`, `논문 그림 3`, `식 (4)`.
- **Show where before how.** Every mechanism scene opens with a location cue
  before the mechanism itself: which part of the system, where in the pipeline,
  where in the world. Highlight that part of the overview diagram (or fly the camera
  to that spot in the world) for the first sentence, then zoom into how it works. A
  viewer who doesn't know where they are can't follow what happens there.
- **Labels ride on objects** in the world (`.lab`, positioned with `v.at` in a T3
  world or `W3.at` in a flat one).
- **Everything breathes:** a slow camera drift or grid drift on every hold. A
  frozen frame reads as a bug. Nothing flashes more than 3 times a second.

## 5. Math

- Typeset every equation with KaTeX (`.tex` / `k.tex`), in the paper's notation:
  same letters, same sub- and superscripts, same operator names (`\mathrm{Stale}`).
  Never show `S_T`, `t_inf`, `lambda` or `λ_T` as plain text.
- Build long equations term by term (one `.tex` element per term), each term's
  meaning in a short Korean label under it, coloured like the thing it measures.
- Show the equation number as the source (`논문 식 (4)`).
- The narration names terms in words; a TTS reading LaTeX aloud is useless.

## 6. Safe zones (1920×1080)

- Caption band: bottom ~200 px (captions sit at bottom 56 px, up to 2 lines).
  Keep scene content above y ≈ 900.
- Chip: top-left 56,44. Keep content below y ≈ 110 on the left.
- Margins: 80–140 px left/right.

## 7. Writing for the ear

- Short declaratives. One idea per sentence. Spoken endings (-요, -죠) read
  naturally in Korean TTS.
- No parentheses, slashes or footnote marks in a spoken line.
- Numbers as you'd say them; put the exact figure on screen.
- Acronyms and model names: test them. Put a phonetic spelling in `say`
  ("HAZARD" → "해저드", "v2" → "브이 투") and keep the written form in the caption.
- Name the source on screen, not in the voice ("Table 2" goes on the panel).

## 8. Accuracy

- Every number on screen is in `claims.json` with its source (a verbatim quote or a
  table row), and `check_claims.py` proves it (`references/verification.md`).
- Illustrative values (anything the paper doesn't give) are `example` claims and are
  labelled 예시 on screen; your own arithmetic is `derived` and labelled too.
- Keep the paper's conditions: "best" keeps its qualifiers (비교한 방법 중, 미세조정 후,
  which benchmark, which hardware).
- The caveats chapter is not optional: fair-comparison issues (e.g. the method
  got fine-tuning the baselines didn't), how the metric is defined, test-set
  size, missing variance.
- Don't overclaim: say what the paper shows, in its setting.

## 9. Checking

Render a contact sheet (`render.py --sheet 24`) and look at it like a stranger:
Is every caption readable over the picture? Does anything overlap? Is there a
frame where the sentence talks about something not yet on screen? Then spot-check
stills at each sentence start (`k.caps[i].t0` + 1 s).
