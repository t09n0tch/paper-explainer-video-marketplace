# Scene API for lecture episodes

Contents: 1. Slide scenes · 2. Hand-built scenes and `k` · 3. parts.js · 4. Pattern:
board equation · 5. Pattern: check question · 6. Pattern: rebuilt diagram · 7. Pitfalls

The engine (`engine.js`, the player, `render.py`) is the paper skill's, unchanged:
`render(t, k)` must be a pure function of `t`; no timers, CSS transitions or
`Math.random()`. `references/scene-api-paper.md` has the full `k` table, the
pseudo-3D world, re-sorting bars and timeline lanes.

## 1. Slide scenes

`slide.js` (listed in `"shared"`) defines `SLIDE(id, options)`. A scene file is one call:

```js
SLIDE('s03', { page: 3, steps: [
  { cap: 0, box: [0.024, 0.147, 0.952, 0.292], mark: 'hl' },          // sentence 1
  { cap: 1, box: [0.072, 0.357, 0.470, 0.391], mark: 'ul' },          // sentence 2
  { cap: 3, box: [0.290, 0.611, 0.709, 0.854] },                      // spotlight only
  { cap: 3, at: 3.4, box: [0.072, 0.497, 0.736, 0.532], mark: 'hl' }, // later in sentence 4
] });
```

| step field | |
|---|---|
| `cap` | caption index the step starts with |
| `at` | seconds after that caption starts (default 0); for a sentence with two subjects |
| `box` | `[x0, y0, x1, y1]` in 0..1 page coordinates, from `slides.json` |
| `mark` | `'hl'` highlighter · `'ul'` underline · `'circle'` · `'box'` · none |
| `dim` | `false` to keep the rest of the slide undimmed |
| `zoom` | a number (e.g. 1.3) to push in; default is the whole slide |

Scene options: `page` (image `slides/pNN.png`), `steps`, `maxZoom`, and optional
`init(k)` / `render(t, k)` hooks that run after the slide's own, for an extra label
or a 보충 badge (`k.h('<div class="extra" style="right:120px;top:44px">보충</div>')`).

Picking boxes: open `slides.json`, find the page, and use `lines[].box` for text
(tight to the glyphs) and `figures[].box` for diagrams (`kind: "drawing"`) and
images. Merge several lines by taking the min/max of their boxes. For one symbol in
a line (say "M ≪ D"), estimate its x-range inside the line box from the text and
check the still.

Layout: the slide is drawn 1680×945 at (120, 105), under the chapter chip
(56, 44) and the source tag (top right). With burned captions on, reduce `SH` in
`slide.js` so the slide ends above y ≈ 880.

## 2. Hand-built scenes

```js
SCENE('hook', {
  init(k) { /* build DOM once in k.stage */ },
  render(t, k) { /* set every changing property from t */ },
});
```

`k.caps[i].t0` / `.t1` are sentence times within the scene; `k.dur` the scene
length; `k.h(html)`, `k.tex(latex)`, `k.seg`, `k.eo`, `k.eio`, `k.lerp`,
`k.fadeWords`, `k.P` (palette for canvas) as in the paper skill. Start each scene
with `k.stage.append(k.h('<div class="ground"><div class="grid"></div></div>'))`.

Classes from `film.css`: `.words .big .line .sub .small .tag .chip .card .src .extra
(.extra = orange 보충 badge) .slsrc (source tag, top right) .cell (one vector cell) .tex`.

## 3. parts.js

| | |
|---|---|
| `PARTS.col(k, n, vals, role)` | n `.cell` divs tinted by `vals[i]` 0..1 in colour role `role` |
| `PARTS.place(cells, x, y, w)` | stack cells centred on (x, y); `w[i]` 0..1 collapses a cell; returns centre ys |
| `PARTS.rise(k, el, t, a)` | fade and rise in from time `a` |
| `PARTS.wipe(el, p)` | board reveal, left to right, p 0..1 |
| `PARTS.hash(i)` | deterministic 0..1 per index (instead of random) |

## 4. Pattern: board equation

`assets/starter/scenes/board.js` is the whole working scene. Terms are listed with
the caption and offset at which the voice names them, so the equation is written in
spoken order (inputs, then the operation, then min):

```js
const TERMS = [
  ['\\displaystyle\\min_{f,g}', 'f, g를 골라 최소화', 'second', 1, 4.4],
  ['\\displaystyle\\frac{1}{N}\\sum_{n=1}^{N}', 'N개의 평균', 'second', 1, 2.6],
  ['d\\Big(', '차이', 'main', 1, 0.5],
  ['x_n', '원래 데이터', 'second', 0, 1.4],
  [',\\; g(f(x_n))', '되살린 데이터', 'accent', 0, 3.6],
  ['\\Big)', '', 'main', 1, 0.5],
];
// render: PARTS.wipe(term, k.eio(k.seg(t, a, a + 0.7))) with a = caps[c].t0 + offset
```

A second line (a special case, the next step of a derivation) wipes in over ~2 s on
its own sentence. Give the term row a fixed height (250 px at 86 px font) so labels
clear `\sum` limits.

## 5. Pattern: check question

`assets/starter/scenes/quiz.js`: tag + "잠깐 멈추고 생각해 보세요", the question in
`.line` with inline `.tex`, a 보충 badge, and a ring that drains during the scene's
`hold` (set `"hold": 5` in script.json) with the seconds counting down. The answer is
the next scene, usually a small animation that shows why (the prototype's answer
collapsed the latent column from 8 cells to 2).

## 6. Pattern: rebuilt diagram

For the episode's key diagram, rebuild it from cells and dashed SVG lines so it can
move. The prototype's autoencoder scene: columns of 8-6-4-2-4-6-8 cells
(`PARTS.col` + `PARTS.place`), dashed connectors between adjacent columns, built
left to right as the voice says "encoder" then "decoder", the input and output
outlined together on "x̂ ≈ x", and an arc from output back to input labelled with
the slide's own phrase. Keep the slide's layout and symbols so the viewer
recognises it, and tag it `강의자료 슬라이드 N · 다시 그림`.

## 7. Pitfalls

- KaTeX inline mode puts `\min_{f,g}` and `\sum` limits to the side; use `\displaystyle`.
- A slide scene with no `mark` on a step still dims the rest: good for "look at this
  diagram", but say what to look at.
- Two steps in one sentence (`at`) need the sentence to actually turn there; check
  the timing in `narration.md` and the still at that second.
- Page images are rendered at 400 dpi so zooms stay sharp; don't go lower if you zoom.
- Escape backslashes in JS strings (`'\\hat{x}'`).
