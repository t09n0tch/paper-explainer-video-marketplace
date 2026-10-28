// A batch of responses as rows of tiles. A plane rises to the top-20% cut; only tiles above it
// receive a beam (gradient); the rest dim. Setup card on sentence 4.
SCENE('mask', {
  init(k) {
    this.v = T3.view(k, { fov: 36, fogNear: 30, fogFar: 85 });
    this.v.add(FORK.floor(11, 4, 80));
    this.b = FORK.batch(6, 20, 7); this.v.add(this.b.group);
    this.beams = this.b.tiles.map((tl) => { const bm = FORK.beam('accent'); bm.visible = false; this.v.add(bm); return bm; });
    this.plane = FORK.plane(-0.8, -1, this.b.w + 0.8, this.b.d + 1, 0.01, 'accent'); this.v.add(this.plane);
    this.tau = k.h('<div class="lab" style="color:var(--accent);font-size:28px"><span class="tex">\\tau^{\\mathcal{B}}_{\\rho}</span> 상위 20% 문턱값</div>'); k.stage.append(this.tau);
    this.zero = k.h('<div class="lab" style="font-size:26px">그래디언트 0 · 풀이엔 그대로</div>'); k.stage.append(this.zero);
    this.rows = k.h('<div class="src" style="position:absolute;left:140px;top:845px;padding:6px 14px;border-radius:10px;background:color-mix(in srgb, var(--ground) 90%, transparent)">한 줄 = 한 응답 · 엔트로피 높이는 예시</div>'); k.stage.append(this.rows);
    this.card = k.h('<div class="card" style="left:1250px;top:150px;width:560px"><h4>나머지는 기존 DAPO와 동일</h4><div class="small" style="line-height:1.7">' +
      'Qwen3-32B · 14B · 8B Base<br>학습 데이터 DAPO-Math-17K<br><span class="tex">\\epsilon_{\\mathrm{high}}=0.28,\\ \\epsilon_{\\mathrm{low}}=0.2</span><br>최대 응답 길이 20480 · 배치 512<br>KL 손실 · 엔트로피 손실 없음</div><div class="src" style="margin-top:10px">논문 5.2절</div></div>'); k.stage.append(this.card);
  },
  render(t, k) {
    const { seg, eo, eio, lerp } = k, c = k.caps, b = this.b;
    const up = eio(seg(t, c[1].t0 + 0.1, c[1].t0 + 1.3)), dim = eo(seg(t, c[2].t0 + 0.2, c[2].t0 + 0.9));
    b.tiles.forEach((tl, j) => {
      const p = eo(seg(t, 0.5 + tl.row * 0.25 + tl.i * 0.04, 1.1 + tl.row * 0.25 + tl.i * 0.04));
      tl.m.visible = p > 0.01; tl.m.scale.y = Math.max(0.001, FORK.TOP(tl.h) * p);
      if (tl.fork) tl.tint(FORK.lowC().lerp(T3.color('accent'), up), 0.08 + 0.35 * up);
      else tl.tint(FORK.lowC().lerp(T3.color('ground'), 0.55 * dim), 0.04);
      const s = c[1].t0 + 1.1 + (j % 17) * 0.06;
      this.beams[j].set(tl.x, tl.y, FORK.TOP(tl.h), tl.fork ? eio(seg(t, s, s + 0.9)) : 0);
    });
    this.plane.setZ(lerp(0.02, b.cutTop, up)); T3.fade(this.plane, eo(seg(t, c[1].t0, c[1].t0 + 0.4)));
    const d = eio(seg(t, 0, k.dur));
    this.v.look([lerp(0, 3, d), 30, 19], [lerp(17, 18, d), 4, -1]);
    this.v.draw();
    FORK.pin(this.v, this.tau, b.w + 0.8, -1, b.cutTop, up);
    const lowT = b.tiles.find((x) => !x.fork && x.row === 5 && x.i > 4);
    FORK.pin(this.v, this.zero, lowT.x, lowT.y, FORK.TOP(lowT.h) + 0.3, dim);
    this.rows.style.opacity = eo(seg(t, 0.6, 1.2));
    this.card.style.opacity = eo(seg(t, c[3].t0 + 0.3, c[3].t0 + 0.8));
  },
});
