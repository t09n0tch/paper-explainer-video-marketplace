// Title over the paper's world: the room seen from above, the camera circling slowly.
SCENE('intro', {
  init(k) {
    this.w = ROOM.build(k); this.w.agent.place(8, 8.4);
    k.stage.append(k.h('<div style="position:absolute;inset:0;background:linear-gradient(90deg, var(--ground) 0%, color-mix(in srgb, var(--ground) 70%, transparent) 38%, transparent 62%)"></div>'));
    k.stage.append(k.h('<div class="words" style="left:120px;top:250px;width:900px"><div class="tag">ARXIV 2506.07223 · UNIVERSITY OF SYDNEY</div>' +
      '<h1 class="big" style="font-size:92px">Reflex First,<br>Reflect Later</h1><div class="sub">움직이는 세상에서 LLM 에이전트는 얼마나 빨리 생각해야 할까</div></div>'));
    this.el = [...k.stage.querySelectorAll('.words > *')];
  },
  render(t, k) {
    const { seg, eo, lerp } = k, W = window.WORLD;
    this.w.v.orbit([10, 5, 0], 17, 12, lerp(-2.0, -1.6, seg(t, 0, k.dur)));
    this.w.fire.update((x, y) => W.fire(x, y, lerp(0.2, 0.4, seg(t, 0, k.dur))), t);
    this.w.v.draw();
    this.el.forEach((e, i) => { const p = eo(seg(t, 0.4 + i * 0.4, 1.1 + i * 0.4)); e.style.opacity = p; e.style.transform = 'translateY(' + (1 - p) * 20 + 'px)'; });
  },
});
