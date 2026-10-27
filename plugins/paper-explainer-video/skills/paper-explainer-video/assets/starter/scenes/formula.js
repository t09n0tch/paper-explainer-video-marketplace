// A formula scene: the paper's equation in real math typesetting, built term by term,
// each term's meaning appearing under it as the narrator explains it.
const TERMS = [
  ['\\mathrm{Stale}(t,\\tau)', '계획이 낡은 정도', 'var(--second)'],
  ['=', '', ''],
  ['\\lambda_T S_T', '흐른 시간', 'var(--accent)'],
  ['+\\,\\lambda_A S_A', '에이전트 이동', 'var(--accent)'],
  ['+\\,\\lambda_O S_O', '물체 상태', 'var(--accent)'],
  ['+\\,\\lambda_H S_H', '위험 지도', 'var(--accent)'],
];
SCENE('formula', {
  init(k) {
    const row = k.h('<div style="position:absolute;left:0;right:0;top:300px;display:flex;justify-content:center;align-items:flex-start;gap:30px"></div>');
    this.t = TERMS.map((x) => {
      const col = k.h('<div style="display:flex;flex-direction:column;align-items:center;gap:22px"></div>');
      const m = k.tex(x[0]); m.style.fontSize = '78px';
      const d = k.h('<div class="small" style="height:36px;white-space:nowrap"></div>'); d.textContent = x[1]; d.style.color = x[2];
      col.append(m, d); row.append(col); return { col, m, d };
    });
    k.stage.append(k.h('<div class="ground"><div class="grid"></div></div>'));
    k.stage.append(row);
    k.stage.append(k.h('<div class="src" style="position:absolute;left:0;right:0;top:520px;text-align:center">논문 식 (4)</div>'));
    const w = k.h('<div style="position:absolute;left:0;right:0;top:620px;text-align:center"></div>');
    this.w = k.tex('w(o) = 1 + \\beta \\max\\big(v_t(o),\\, v_\\tau(o)\\big)', { display: true }); this.w.style.fontSize = '54px';
    w.append(this.w); k.stage.append(w);
  },
  render(t, k) {
    const c = k.caps;
    this.t.forEach((x, i) => {
      const a = c[0].t0 + 0.4 + i * 0.5;
      x.col.style.opacity = k.eo(k.seg(t, a, a + 0.35));
      x.col.style.transform = 'translateY(' + k.lerp(30, 0, k.eob(k.seg(t, a, a + 0.5), 1.5)) + 'px)';
      x.d.style.opacity = k.eo(k.seg(t, a + 0.3, a + 0.7));
    });
    const b = c[1].t0 + 0.5;
    this.w.style.opacity = k.eo(k.seg(t, b, b + 0.5));
  },
});
