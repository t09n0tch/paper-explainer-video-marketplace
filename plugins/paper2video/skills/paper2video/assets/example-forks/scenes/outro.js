// Back to the opening road: forks lit, beams on them, title held.
SCENE('outro', {
  init(k) {
    this.v = T3.view(k, { fov: 36, fogNear: 30, fogFar: 70 });
    this.v.add(FORK.floor(16, 0, 90));
    this.r = FORK.road(); this.v.add(this.r.group);
    this.exn = k.h('<div class="src" style="position:absolute;left:140px;top:845px;padding:6px 14px;border-radius:10px;background:color-mix(in srgb, var(--ground) 90%, transparent)">토큰은 부록 그림 13의 풀이에서 · 높이는 예시</div>'); k.stage.append(this.exn);
    k.stage.append(k.h('<div style="position:absolute;inset:0;background:linear-gradient(90deg, var(--ground) 0%, color-mix(in srgb, var(--ground) 75%, transparent) 34%, transparent 58%)"></div>'));
    k.stage.append(k.h('<div class="words" style="left:120px;top:150px;width:860px"><h1 class="big" style="font-size:86px;line-height:1.05">Beyond the<br>80/20 Rule</h1>' +
      '<div class="ol-u" style="height:6px;width:480px;background:var(--accent);transform-origin:0 50%;margin:18px 0"></div>' +
      '<div class="sub">High-Entropy Minority Tokens Drive Effective RL for LLM Reasoning</div>' +
      '<div class="small" style="margin-top:14px">Wang et al. · Qwen Team, Alibaba · LeapLab, Tsinghua · NeurIPS 2025 · arXiv 2506.01939</div></div>'));
    this.el = [...k.stage.querySelectorAll('.words > *')]; this.u = k.q('.ol-u');
    k.stage.append(this.exn);
  },
  render(t, k) {
    const { seg, eo, eio, lerp } = k;
    this.r.fork(1, 0.8);
    this.r.tiles.forEach((tl, i) => { if (tl.fork) this.r.shine(i, eio(seg(t, 1 + i * 0.05, 2 + i * 0.05))); });
    const a = lerp(-0.7, -0.45, seg(t, 0, k.dur));
    this.v.look([-1 + Math.cos(a) * 3, 17 - Math.sin(a) * 2, 10], [14, 0, -1.5]);
    this.v.draw();
    this.el.forEach((e, i) => { e.style.opacity = eo(seg(t, 0.4 + i * 0.4, 1.1 + i * 0.4)); });
    this.u.style.transform = 'scaleX(' + Math.max(0.0001, eo(seg(t, 1.2, 2.2))) + ')';
  },
});
