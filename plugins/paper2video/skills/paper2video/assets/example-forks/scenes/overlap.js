// Four copies of a response, one per training step, stacked back to front. The tall tiles (top 20%)
// stay in nearly the same columns: Table 1's overlap with the base model.
const OV = [['Step 0', '100%'], ['Step 160', '93.04%'], ['Step 864', '87.45%'], ['Step 1360', '86.67%']];
SCENE('overlap', {
  init(k) {
    this.v = T3.view(k, { fov: 34, fogNear: 30, fogFar: 80 });
    this.v.add(FORK.floor(12, 4, 80));
    const N = 24, r = T3.rng(21), base = [];
    for (let i = 0; i < N; i++) base.push(r() < 0.22 ? 0.6 + 0.4 * r() : 0.01 + 0.12 * r());
    // which columns hold the tall tiles at each step (illustrative): a few move, most stay
    const moves = [[], [[3, 4]], [[3, 4], [15, 17]], [[3, 4], [15, 17], [20, 19]]];
    this.rows = OV.map((o, ri) => {
      const hs = base.slice();
      for (const [from, to] of moves[ri]) { const tmp = hs[from]; hs[from] = hs[to]; hs[to] = tmp; }
      return hs.map((h, i) => { const tl = FORK.tile(i * 1.0, ri * 2.6, h, h > 0.5); tl.m.scale.x = tl.m.scale.z = 0.85; this.v.add(tl.m); return tl; });
    });
    this.labs = OV.map((o) => { const e = k.h('<div class="lab" style="font-size:26px"><span>' + o[0] + '</span> · <span class="num" style="color:var(--accent)">' + o[1] + '</span></div>'); k.stage.append(e); return e; });
    this.card = k.h('<div class="card" style="left:1240px;top:150px;width:560px"><h4>상위 20% 엔트로피 위치의 겹침</h4><div class="small">기본 모델 대비 · Qwen3-14B Base에 DAPO</div>' +
      '<div class="small" style="margin-top:10px">최종 RLVR 모델 대비는 Step 0에서 86.67%</div><div class="src" style="margin-top:12px">Table 1 일부 · 행 배치와 이동한 칸은 예시</div></div>'); k.stage.append(this.card);
    this.big = k.h('<div class="card" style="left:1240px;top:520px;width:560px;border-top:6px solid var(--accent)"><div class="small">수렴 후 Step 1360</div><div class="num" style="font-size:84px;font-weight:800;color:var(--accent)">86.67%</div><div class="small">가 기본 모델과 같은 자리</div></div>'); k.stage.append(this.big);
  },
  render(t, k) {
    const { seg, eo, eio, lerp } = k, c = k.caps;
    this.rows.forEach((row, ri) => {
      const a = ri === 0 ? 0.4 : c[1].t0 + 0.3 + (ri - 1) * 0.9, p = eo(seg(t, a, a + 0.8));
      row.forEach((tl) => { tl.m.visible = p > 0.01; tl.m.scale.y = Math.max(0.001, FORK.TOP(tl.h) * p); tl.tint(tl.fork ? 'accent' : null, tl.fork ? 0.35 : 0.08); });
      this.rows[ri].p = p;
    });
    const d = eio(seg(t, 0, k.dur));
    this.v.look([lerp(2, 5, d), 30, 19], [lerp(9.5, 10.5, d), 3, -2]);
    this.v.draw();
    this.labs.forEach((e, ri) => FORK.pin(this.v, e, -0.8, ri * 2.6, 0.2, this.rows[ri].p * (ri < 3 || t > c[2].t0 ? 1 : 1)));
    this.labs.forEach((e) => { e.style.transform = 'translate(-100%,-50%)'; });
    this.card.style.opacity = eo(seg(t, c[1].t0 + 0.2, c[1].t0 + 0.7));
    this.big.style.opacity = eo(seg(t, c[2].t0 + 0.3, c[2].t0 + 0.8));
  },
});
