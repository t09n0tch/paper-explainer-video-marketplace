// Board scene: the slide's equation written term by term, in the order the voice names them.
const AE_TERMS = [
  // latex, meaning, colour role, which caption, seconds into it
  ['\\displaystyle\\min_{f,g}', 'f, g를 골라 최소화', 'second', 1, 4.4],
  ['\\displaystyle\\frac{1}{N}\\sum_{n=1}^{N}', 'N개의 평균', 'second', 1, 2.6],
  ['d\\Big(', '차이', 'main', 1, 0.5],
  ['x_n', '원래 데이터', 'second', 0, 1.4],
  [',\\; g(f(x_n))', '되살린 데이터', 'accent', 0, 3.6],
  ['\\Big)', '', 'main', 1, 0.5],
];
SCENE('board', {
  init(k) {
    k.stage.append(k.h('<div class="ground"><div class="grid"></div></div>'));
    this.head = k.h('<div class="words" style="left:160px;top:150px"><p class="tag">오토인코더 학습 목표</p></div>');
    const row = k.h('<div style="position:absolute;left:0;right:0;top:250px;display:flex;justify-content:center;align-items:flex-start;gap:10px"></div>');
    this.t = AE_TERMS.map(([src, meaning, role]) => {
      const col = k.h('<div style="display:flex;flex-direction:column;align-items:center;gap:26px"></div>');
      const m = k.tex(src); m.style.fontSize = '86px'; m.style.color = 'var(--' + role + ')';
      m.style.height = '250px'; m.style.display = 'flex'; m.style.alignItems = 'center';
      const d = k.h('<div class="small" style="white-space:nowrap"></div>'); d.textContent = meaning;
      col.append(m, d); row.append(col); return { m, d };
    });
    this.l2 = k.h('<div style="position:absolute;left:0;right:0;top:700px;text-align:center;font-size:66px"></div>');
    this.l2.append(k.tex('d\\big(x_n,\\, g(f(x_n))\\big) = \\big\\| x_n - g(f(x_n)) \\big\\|^2'));
    this.l2n = k.h('<div class="sub" style="position:absolute;left:0;right:0;top:850px;text-align:center">흔한 선택 · 두 벡터를 뺀 길이의 제곱, 즉 제곱 오차</div>');
    this.src = k.h('<div class="slsrc">강의자료 슬라이드 6</div>');
    k.stage.append(this.head, row, this.l2, this.l2n, this.src);
  },
  render(t, k) {
    const { seg, eo, eio } = k, c = k.caps;
    PARTS.rise(k, this.head, t, 0.3);
    this.t.forEach((x, i) => {
      const a = c[AE_TERMS[i][3]].t0 + AE_TERMS[i][4];
      PARTS.wipe(x.m, eio(seg(t, a, a + 0.7)));
      x.d.style.opacity = eo(seg(t, a + 0.5, a + 0.9));
    });
    PARTS.wipe(this.l2, eio(seg(t, c[2].t0 + 0.4, c[2].t0 + 2.6)));
    PARTS.rise(k, this.l2n, t, c[2].t0 + 2.8);
    this.src.style.opacity = eo(seg(t, 0.4, 0.9));
  },
});
