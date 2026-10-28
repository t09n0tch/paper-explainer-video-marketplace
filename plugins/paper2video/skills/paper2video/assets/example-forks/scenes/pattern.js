// 100 tiles stand for the measured tokens (proportions only, heights illustrative). Shuffled at first,
// they sort into a staircase on sentence 2: the flat half lights up; on sentence 3 the top 20 rise above
// the 0.672 plane.
SCENE('pattern', {
  init(k) {
    this.v = T3.view(k, { fov: 34, fogNear: 30, fogFar: 80 });
    this.v.add(FORK.floor(6, 6, 60));
    const r = T3.rng(5), H = [];
    for (let i = 0; i < 100; i++) H.push(i < 51 ? 0.004 + 0.002 * r() : i < 80 ? 0.03 + 0.18 * ((i - 51) / 29) : 0.25 + 0.75 * Math.pow((i - 80) / 19, 1.6));
    const order = H.map((_, i) => i); for (let i = 99; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    this.tiles = H.map((h, rank) => {
      const s = order[rank], tl = FORK.tile(0, 0, h, false);
      tl.rank = rank; tl.a = [(s % 10) * 1.25, Math.floor(s / 10) * 1.25]; tl.b = [(rank % 10) * 1.25, (9 - Math.floor(rank / 10)) * 1.25];
      this.v.add(tl.m); return tl;
    });
    this.cut = 0.22;                                                    // where 0.672 sits on this illustrative scale
    this.plane = FORK.plane(-0.8, -0.8, 12.05, 12.05, FORK.TOP(this.cut), 'accent'); this.v.add(this.plane);
    this.c1 = k.h('<div class="card" style="left:1240px;top:170px;width:560px"><div class="num" style="font-size:72px;font-weight:800">50.64%</div>' +
      '<div class="small">엔트로피 <span class="tex">H_t &lt; 10^{-2}</span> 인 토큰</div><div class="small">10의 −2제곱 = 0.01</div><div class="src" style="margin-top:10px">논문 3절 · 그림 2(a)</div></div>'); k.stage.append(this.c1);
    this.c2 = k.h('<div class="card" style="left:1240px;top:470px;width:560px;border-top:6px solid var(--accent)"><div class="num" style="font-size:72px;font-weight:800;color:var(--accent)">20%</div>' +
      '<div class="small">엔트로피 <span class="tex">H_t &gt; 0.672</span> 인 토큰</div><div class="src" style="margin-top:10px">논문 3절 · 그림 2(a)</div></div>'); k.stage.append(this.c2);
    this.note = k.h('<div class="src" style="position:absolute;left:140px;top:120px">100칸 = 측정한 토큰의 비율 · 높이는 예시</div>'); k.stage.append(this.note);
    this.tag = k.h('<div class="lab" style="color:var(--accent)"><span class="tex">0.672</span></div>'); k.stage.append(this.tag);
  },
  render(t, k) {
    const { seg, eo, eio, lerp } = k, c = k.caps;
    const s = eio(seg(t, c[1].t0 + 0.2, c[1].t0 + 2.4)), hi = eio(seg(t, c[2].t0 + 0.2, c[2].t0 + 1.4));
    this.tiles.forEach((tl, i) => {
      const p = eo(seg(t, 0.4 + (i * 37 % 100) * 0.03, 1.0 + (i * 37 % 100) * 0.03));
      tl.m.visible = p > 0.01;
      const x = lerp(tl.a[0], tl.b[0], s), y = lerp(tl.a[1], tl.b[1], s);
      tl.m.position.copy(T3.v3(x, y, 0)); tl.m.scale.y = Math.max(0.001, FORK.TOP(tl.h) * p);
      if (tl.rank < 51) tl.tint(FORK.lowC().lerp(T3.color('second'), 0.5 * s), 0.08);
      else if (tl.rank >= 80) tl.tint(FORK.lowC().lerp(T3.color('accent'), hi), 0.08 + 0.35 * hi);
      else tl.tint(null, 0.08);
    });
    T3.fade(this.plane, hi);
    const a = lerp(-0.9, -0.55, eio(seg(t, 0, k.dur)));
    this.v.look([5.6 + Math.cos(a) * 24, 5.6 - Math.sin(a) * 24, 17], [13.5, 5.6, 1.5]);
    this.v.draw();
    FORK.pin(this.v, this.tag, -0.8, -0.8, FORK.TOP(this.cut) + 0.1, hi);
    this.note.style.opacity = eo(seg(t, 0.4, 1));
    this.c1.style.opacity = eo(seg(t, c[1].t0 + 1.6, c[1].t0 + 2.1));
    this.c2.style.opacity = eo(seg(t, c[2].t0 + 0.6, c[2].t0 + 1.1));
  },
});
