// Back to the opening world: the agent walks its route, the title returns, held at the end.
SCENE('outro', {
  init(k) {
    this.w = ROOM.build(k); this.path = [[8, 8.2], [6.4, 8.4], [4.6, 8.4]];
    this.w.v.add(this.route = T3.route(this.path, 'accent', 0.14));
    k.stage.append(k.h('<div style="position:absolute;inset:0;background:linear-gradient(90deg, var(--ground) 0%, color-mix(in srgb, var(--ground) 70%, transparent) 38%, transparent 62%)"></div>'));
    k.stage.append(k.h('<div class="words" style="left:120px;top:280px;width:900px"><h1 class="big" style="font-size:92px">Reflex First,<br>Reflect Later</h1>' +
      '<div class="ol-u" style="height:6px;width:520px;background:var(--accent);transform-origin:0 50%"></div>' +
      '<div class="sub">Zheng, Mao, Zhang, Cai · The University of Sydney · arXiv 2506.07223</div></div>'));
    this.el = [...k.stage.querySelectorAll('.words > *')]; this.u = k.q('.ol-u');
  },
  render(t, k) {
    const { seg, eo, lerp } = k, W = window.WORLD;
    this.w.v.orbit([10, 5, 0], 17, 12, lerp(-1.6, -1.35, seg(t, 0, k.dur)));
    this.w.fire.update((x, y) => W.fire(x, y, 0.3), t);
    const p = ROOM.along(this.path, seg(t, 0.5, k.dur - 3)); this.w.agent.place(p[0], p[1]);
    this.route.progress(1); T3.fade(this.route, 0.8);
    this.w.room.items[66].visible = seg(t, 0.5, k.dur - 3) < 1;
    this.w.v.draw();
    this.el.forEach((e, i) => { const a = eo(seg(t, 0.4 + i * 0.4, 1.1 + i * 0.4)); e.style.opacity = a; });
    this.u.style.transform = 'scaleX(' + Math.max(0.0001, eo(seg(t, 1.2, 2.2))) + ')';
  },
});
