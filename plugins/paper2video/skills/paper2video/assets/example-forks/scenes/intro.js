// Title over the token road: flat tiles of a chain of thought; the forks rise and branch on sentence 2.
SCENE('intro', {
  init(k) {
    this.v = T3.view(k, { fov: 36, fogNear: 30, fogFar: 70 });
    this.v.add(FORK.floor(16, 0, 90));
    this.r = FORK.road(); this.v.add(this.r.group);
    this.exn = k.h('<div class="src" style="position:absolute;left:140px;top:845px;padding:6px 14px;border-radius:10px;background:color-mix(in srgb, var(--ground) 90%, transparent)">토큰은 부록 그림 13의 풀이에서 · 높이는 예시</div>'); k.stage.append(this.exn);
    this.labs = this.r.tiles.map((t) => { const e = k.h('<div class="lab" style="font-size:22px"></div>'); e.textContent = t.word; k.stage.append(e); return e; });
    k.stage.append(k.h('<div style="position:absolute;inset:0;background:linear-gradient(90deg, var(--ground) 0%, color-mix(in srgb, var(--ground) 75%, transparent) 34%, transparent 58%)"></div>'));
    k.stage.append(k.h('<div class="words" style="left:120px;top:120px;width:860px"><div class="tag">ARXIV 2506.01939 · QWEN TEAM × TSINGHUA</div>' +
      '<h1 class="big" style="font-size:86px;line-height:1.05">Beyond the<br>80/20 Rule</h1>' +
      '<div class="sub">강화학습의 효과는 소수의 고엔트로피 토큰, 생각의 갈림길에서 나온다</div></div>'));
    this.el = [...k.stage.querySelectorAll('.words > *')];
    this.sx = this.r.tiles.map((t) => t.h);
    k.stage.append(this.exn);
  },
  render(t, k) {
    const { seg, eo, eio, lerp } = k, c = k.caps;
    const rise = eio(seg(t, c[1].t0 + 0.2, c[1].t0 + 1.6));          // forks grow on sentence 2
    this.r.tiles.forEach((tl, i) => tl.setH(tl.fork ? lerp(0.08, this.sx[i], rise) : this.sx[i]));
    this.r.tiles.forEach((tl) => tl.tint(tl.fork ? T3.color('accent').clone().lerp(FORK.lowC(), 1 - rise) : null, tl.fork ? 0.4 * rise + 0.08 : 0.08));
    this.r.fork(eio(seg(t, c[1].t0 + 1.2, c[1].t0 + 3.2)));
    for (const i of [4, 6, 7, 13, 21]) this.r.shine(i, eio(seg(t, c[2].t0 + 0.6 + i * 0.03, c[2].t0 + 1.8 + i * 0.03)));
    const a = lerp(-0.95, -0.7, seg(t, 0, k.dur));
    this.v.look([-1 + Math.cos(a) * 3, 17 - Math.sin(a) * 2, 10], [14, 0, -1.5]);
    this.v.draw();
    this.r.tiles.forEach((tl, i) => FORK.pin(this.v, this.labs[i], tl.x, tl.y, tl.top + 0.25, eo(seg(t, 0.6 + i * 0.05, 1.0 + i * 0.05)) * (tl.fork ? 1 : 0.55)));
    this.labs.forEach((e) => { if (parseFloat(e.style.left) < 1000 && parseFloat(e.style.top) < 620) e.style.opacity = 0; });
    this.labs.forEach((e, i) => { e.style.color = this.r.tiles[i].fork && rise > 0.5 ? 'var(--accent)' : ''; });
    this.el.forEach((e, i) => { const p = eo(seg(t, 0.4 + i * 0.4, 1.1 + i * 0.4)); e.style.opacity = p; e.style.transform = 'translateY(' + (1 - p) * 20 + 'px)'; });
  },
});
