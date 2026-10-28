# Scene API

Contents: 1. The contract · 2. What `k` holds · 2a. Templates (`TPL`) · 2b. The 3D world (`T3`) ·
3. Pattern: the flat world (`k.W3`) · 4. Pattern: formula that builds (real math typesetting) · 5. Pattern:
bars that grow then re-sort · 6. Pattern: timeline lanes with a playhead · 7. Pitfalls

Sections 4-6 show how the templates work inside; reach for `TPL` first and write these
by hand only when a shot needs something the template can't do. The worked example
(`p2v new example/ --example rrara`) has every pattern in real use.

## 1. The contract

`scenes/<id>.js` registers one scene:

```js
SCENE('setting', {
  init(k) { /* build DOM once inside k.stage; keep references on this */ },
  render(t, k) { /* set every changing property from t alone */ },
});
```

- `t` is seconds since the scene began; `render` must be **pure**: the same t
  gives the same picture, called in any order (export, scrubbing). No timers, no
  CSS transitions or animations, no `Math.random()` (use a hash of an index).
- `init` may be async. It runs once at load for every scene, so keep it light.
- The scene's box is transparent; paint a `.ground` div first if you want the
  background colour behind a canvas.
- Captions and the chapter chip are drawn by the player, from `script.json`.
- A line of words is one string in one element (the caption system and any
  later edit rely on it). Use `k.fadeWords(el, t, t0)` for word-by-word entrances.

## 2. What `k` holds

| | |
|---|---|
| `k.stage` | the scene's 1920×1080 box |
| `k.dur` | scene length in seconds |
| `k.caps` | `[{t0, t1, text}]` the scene's sentences, times relative to the scene |
| `k.h(html)` | HTML string → element (first element only) |
| `k.q(sel)` | querySelector inside the scene |
| `k.tex(latex, {display})` | element with the LaTeX typeset by KaTeX (also: any `.tex` element in the scene is typeset after `init`) |
| `k.P` | palette for canvas drawing: `{ground, main, second, accent}` as RGB arrays |
| `k.seg(t,a,b)` | 0..1 progress across [a,b] |
| `k.lerp`, `k.c01` | |
| `k.eo` `k.ei` `k.eio` `k.eob(x, s=1.6)` | easings: out, in, in-out, back-out (overshoot) |
| `k.fadeWords(el, t, t0, {stagger, dur, dx})` | word-by-word entrance |
| `k.W3` | flat, tilted "3D" world on a canvas (section 3); for real 3D use the global `T3` (2b), for ready-made scenes `TPL` (2a) |
| `k.css(rgb, alpha)`, `k.mix(a, b, p)` | colour helpers for canvas |

Classes in `film.css`: `.ground .grid .words .big .line .sub .small .tag .mono
.num .hl .k .card .src .lab .chip .art` (`.art` = full-stage SVG).

## 2a. Templates (`TPL`, assets/templates.js)

A template is a whole scene definition; pass it to `SCENE` directly, or put several in
one scene with `TPL.compose`, each with its own `box: [x, y, w, h]`:

```js
SCENE('results', TPL.bars({
  title: 'TCM 아래 평균 가치 비율',
  rows: [{ label: 'GPT-3.5', value: 0.25, role: 'second' }, { label: 'RRARA-v2', value: 0.44, role: 'accent', note: '사전 계획기 + 반성기' }],
  max: 0.5, digits: 2, at: [0, 2], src: 'Table 2',
}));
SCENE('tcm', TPL.compose(
  TPL.formula({ terms: [['F_{\\mathrm{inf}}', '지연 프레임', 'main'], ['=', ''], ['t_{\\mathrm{inf}} \\times \\mathrm{FPS}', '추론 시간 × 초당 프레임']],
                swap: { at: 1, terms: ['90', null, '3 \\times 30'] }, at: 0, src: '식 (1) · 3초는 예시', box: [140, 160, 1640, 330] }),
  TPL.lanes({ lanes: [{ label: '에이전트', spans: [[0, 1, '관찰', 'second'], [1, 4, '추론', 'main'], [4, 6, '행동', 'accent']] }],
              range: [0, 6], at: [2, 2, 2], box: [140, 600, 1640, 170] })
));
```

| template | for |
|---|---|
| `title` / `end` | opening and closing cards |
| `bars` | horizontal bars; `sortAt` re-sorts them on a later sentence; `lowerBetter` |
| `groupBars` | grouped vertical bars with a legend (methods x benchmarks) |
| `line` | line chart drawn along its path; `logX`; end labels |
| `flow` | left-to-right pipeline, one box per beat, arrows growing between |
| `cards` | 1-6 cards (caveats, contributions) |
| `table` | rows appear one by one; `hl` highlights a row |
| `split` | one bar cut into parts (time or memory breakdown) |
| `formula` | equation term by term with meanings; `swap` turns terms into a worked example |
| `lanes` | time lanes with labelled spans and a playhead |

`at` is a caption index, a list of indices (one per item), or `{ t: seconds }`. Roles:
`main`, `accent`, `second`, `dim`. Every value is written once as text and fades in with
its mark, so the on-screen check sees the real number; the title fades in at the start.

## 2b. The 3D world (`T3`, assets/t3.js on three.js)

Same coordinates as `k.W3` and `world.js` (metres, x across, y deep, z up), so one
`world.js` serves both. One shared WebGL renderer draws whichever scene is on screen.

```js
SCENE('setting', {
  init(k) {
    this.v = T3.view(k, { fov: 38 });                 // canvas + scene + camera + lights, film.css colours
    this.room = T3.room(window.WORLD); this.v.add(this.room.group);   // floor, walls, furniture, items
    this.fire = T3.field(window.WORLD, 'main'); this.v.add(this.fire); // hazard voxels
    this.agent = T3.agent('accent'); this.agent.place(8, 8.4); this.v.add(this.agent);
    this.lab = k.h('<div class="lab">56 · 5점</div>'); k.stage.append(this.lab);
  },
  render(t, k) {
    this.v.orbit([8, 5, 0], 15, 11, k.lerp(-2.1, -1.8, k.seg(t, 0, k.dur)));   // drift on every hold
    this.fire.update((x, y) => window.WORLD.fire(x, y, 0.6), t);
    this.v.draw();                                    // render last, then place labels
    const p = this.v.at(2.6, 2.8, 0.9); this.lab.style.left = p[0] + 'px'; this.lab.style.top = p[1] + 'px';
  },
});
```

Also: `T3.street(seed)` (procedural road, buildings, trees, cars), `T3.car`, `T3.box`,
`T3.frustum` (camera view cones), `T3.route(pts)` with `.progress(p)`, `T3.points(n)` +
`T3.samplePoints(boxes, density)` + `T3.turbo` (depth -> point cloud shots, gaussian
splats), `T3.fade(obj, a)`, `T3.rng(seed)`. `v.look(pos, target)` places the camera
directly; to keep the world on the left with cards on the right, aim the camera at a
point right of the world's centre. Rendering is software WebGL in export, identical on
every machine.

## 3. Pattern: the flat world (`k.W3`)

```js
const WORLD = {
  w: 16, h: 10,                                   // metres
  walls: [[0,0,16,0.22],[0,9.78,6.8,10],[9.2,9.78,16,10],[0,0,0.22,10],[15.78,0,16,10],
          [9.9,0,10.12,4],[9.9,6,10.12,10]],      // x0,y0,x1,y1[,height=1]
  boxes: [[1,0.5,5.4,1.3,0.9],[3.4,4.2,6.6,6,0.75]],   // furniture, buildings
  items: { 56: [2.6,2.8,5], 57: [13.2,5,1] },     // id: [x, y, value]
};
const ROUTE = [[8, 8.6], [9, 5], [13.2, 5]];

SCENE('reflect', {
  init(k) {
    k.stage.append(k.h('<div class="ground"><div class="grid"></div></div>'));
    this.cv = k.W3.canvas(); k.stage.append(this.cv); this.ctx = this.cv.getContext('2d');
    this.lab = k.h('<div class="lab">57 헤어브러시 · 가치 1</div>'); k.stage.append(this.lab);
  },
  render(t, k) {
    const { W3, seg, eio, eo, lerp } = k, c = k.caps;
    const cam = W3.cam({ x: 8, y: 5, yaw: lerp(-0.5, -0.4, eio(seg(t, 0, k.dur))),
                         pitch: 0.86, zoom: 64, sx: 620, sy: 540 });  // room on the left, panels right
    const fire = lerp(0.5, 0.9, seg(t, 0, k.dur));                     // hazard grows over the scene
    const field = (x, y) => k.c01((0.5 + 3.2 * fire - Math.hypot(x - 12.8, y - 1.6)) / 1.2);
    const walked = 0.55 * Math.max(0, t - c[1].t0);                    // starts walking on sentence 2
    const pos = W3.walk(ROUTE, walked);
    W3.draw(this.ctx, k.P, WORLD, {
      cam, t, field,
      items: { 56: {}, 57: { st: 'ok' } },                            // st: 'ok' | 'dmg' | 'gone'; sc: scale
      agent: { x: pos[0], y: pos[1], think: 0 },                       // think 0..1 = progress ring
      routes: [{ pts: ROUTE, p: eio(seg(t, c[1].t0, c[1].t0 + 1)), col: 'accent' }],
    });
    const p = W3.at(cam, 13.2, 5, 0.9);                               // world -> screen
    this.lab.style.left = p[0] + 'px'; this.lab.style.top = p[1] + 'px';
    this.lab.style.opacity = eo(seg(t, c[1].t0 + 0.4, c[1].t0 + 0.8));
  },
});
```

Camera: `x, y` look-at point (metres), `yaw` rotation (≈ -0.4…-0.8 reads well),
`pitch` tilt (0.8–0.9), `zoom` px per metre, `sx, sy` where the look-at point
lands on screen. Ease between two cameras with `W3.lerpCam(a, b, p)`; shift
`sx` to make room for panels. Re-use the same `WORLD` constant in every world
scene (copy it, or put it in a `scenes/_world.js`, see Pitfalls).

Not a room? The same boxes make a street (buildings as `boxes`), a warehouse,
a table-top. `field(x,y)` can be fire, water, signal strength, a heat map of
attention; `fieldColor: 'accent'` draws it in the accent colour.

## 4. Pattern: a formula that builds

Math is LaTeX typeset by KaTeX, in the paper's notation. One element per term,
so terms can enter one by one with their meaning underneath; the full working
example is `assets/starter/scenes/formula.js`.

```js
const TERMS = [['\\mathrm{Stale}(t,\\tau)', '계획이 낡은 정도'], ['=', ''],
               ['\\lambda_T S_T', '흐른 시간'], ['+\\,\\lambda_A S_A', '에이전트 이동']];
// init
const row = k.h('<div style="position:absolute;left:0;right:0;top:300px;display:flex;justify-content:center;gap:30px"></div>');
this.t = TERMS.map(([src, meaning]) => {
  const col = k.h('<div style="display:flex;flex-direction:column;align-items:center;gap:22px"></div>');
  const m = k.tex(src); m.style.fontSize = '78px';          // size the math with font-size
  const d = k.h('<div class="small"></div>'); d.textContent = meaning;
  col.append(m, d); row.append(col); return { col, d };
});
k.stage.append(row);
// render: inputs first, result last, during sentence 1
this.t.forEach((x, i) => {
  const a = k.caps[0].t0 + 0.4 + i * 0.5;
  x.col.style.opacity = k.eo(k.seg(t, a, a + 0.35));
  x.col.style.transform = 'translateY(' + k.lerp(30, 0, k.eob(k.seg(t, a, a + 0.5), 1.5)) + 'px)';
});
```

Worked numbers: a term can turn into its value for an example (`t_{\mathrm{inf}}` →
`3`). Build both as `.tex` elements in the same spot and cross-fade them on the
sentence that gives the number. Inline math inside a label: `<p class="small">흐른
시간 <span class="tex">S_T</span></p>`. Escape backslashes in JS strings (`'\\lambda'`).

## 5. Pattern: bars that grow, then re-sort

The "ranking flips" beat: bars grow to value A on sentence 1, a dashed ghost
keeps A while bars shrink to value B on sentence 3, rows slide to B's order on
sentence 4.

```js
// rows absolutely positioned; FL = [[name, A, B], ...]; Y(i) = 210 + i * 76; scale 1300 px per 1.0
const sw = k.eio(k.seg(t, c[2].t0 + 0.7, c[2].t0 + 2.7));   // A -> B
const mv = k.eio(k.seg(t, c[3].t0 + 0.3, c[3].t0 + 1.7));   // re-sort
rows.forEach((r, i) => {
  const grow = k.eo(k.seg(t, 1 + i * 0.28, 2.2 + i * 0.28));
  const v = k.lerp(r.A * grow, r.B, sw);
  r.bar.style.transform = 'scaleX(' + v + ')';              // bar width = full scale, origin left
  r.ghost.style.opacity = sw;                                // dashed outline at A
  r.val.textContent = v.toFixed(2);
  r.row.style.transform = 'translateY(' + k.lerp(Y(i), Y(r.rankB), mv) + 'px)';
});
```

Highlight the protagonist rows with `--accent` (winner) or `--main` (loser),
leave the rest grey. A `.card` in the corner names the mode ("기존 평가" → "TCM
적용") and a `.src` line names the table.

## 6. Pattern: timeline lanes with a playhead

For "sequential vs parallel" or any process over time: lanes of blocks on a
shared seconds axis, revealed by a sweeping playhead.

```js
// blocks: [lane, s0, s1, kind, label]; X(s) = 560 + 100 * s
const sweep = 12 * k.eio(k.seg(t, c[1].t0 + 0.5, c[1].t0 + 5.5));
blocks.forEach((b) => {
  const r = k.c01((sweep - b.s0) / (b.s1 - b.s0));
  b.el.style.transform = 'scaleX(' + r + ')';                      // origin left
  b.txt.style.transform = 'scaleX(' + (r > 0.001 ? 1 / r : 1) + ')'; // keep the label unsquashed
  b.txt.style.opacity = k.c01((r - 0.4) * 3);
});
```

Waiting/thinking blocks: outlined in `--main`; doing blocks: filled `--accent`;
a correction: a short `--main` arrow between lanes at the moment it happens.

## 7. Pitfalls

- **Shared code between scenes:** put it in a file in the film folder (say
  `world.js`, defining `window.WORLD = {...}`) and list it in `script.json` as
  `"shared": ["world.js"]`. Shared files load before any scene.
- **Text in SVG:** keep words in HTML elements, not SVG `<text>`; they wrap,
  use the film's font and can be edited.
- **Style strings:** markup lives in single-quoted JS strings with `style="…"`
  in double quotes; a nested quote inside a style silently ends it.
- **Layout drift:** a long Korean label wraps differently per font. Give text
  boxes explicit widths, and check stills on the machine that exports.
- **Numbers that count up** start near their final value, or a still shows
  "0.00" at the moment the narrator says the number.
- **3D: render, then place labels.** `v.at()` uses the camera of the last `look`/`orbit`;
  call `v.draw()` once per frame, at the end of the 3D updates.
- **The checker reads the screen.** The player records every string that holds on
  screen for check_claims.py: DOM text (KaTeX by its LaTeX source) and canvas
  `fillText`. Hide a counter (`opacity: 0`) until it starts moving, or "0.00" lands in
  `verify/onscreen.json` as a number nobody sourced. Numbers that are not data (ids,
  equation numbers) go in `claims.json` `allow_numbers` with a reason.
- **Wide content**: panels on the right, world on the left: move the camera's
  `sx` rather than shrinking the world.
