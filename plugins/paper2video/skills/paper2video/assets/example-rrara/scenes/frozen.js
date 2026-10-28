// The agent thinks (ring). Old protocol: the world freezes. Reality: the fire keeps spreading, the plan goes stale.
SCENE('frozen', {
  init(k) {
    this.w = ROOM.build(k); this.w.agent.place(8, 8.2); this.w.v.add(this.route = T3.route([[8, 8.2], [9, 6.2], [11, 5], [13.2, 5.2]], 'accent', 0.14));
    this.chip = ROOM.label(k, 'LLM 추론 중', 'color:var(--ground);background:var(--accent);border-color:var(--accent)');
    this.mode = k.h('<div class="chip" style="right:90px;top:150px"></div>'); k.stage.append(this.mode);
    this.late = ROOM.label(k, '도착하면 이미 불 속', 'color:var(--ground);background:var(--main);border-color:var(--main)');
  },
  render(t, k) {
    const { seg, eo, lerp } = k, W = window.WORLD, c = k.caps;
    this.w.v.orbit([10, 5.5, 0], 14, 10, lerp(-1.9, -1.7, seg(t, 0, k.dur)));
    // sentence 2: frozen at 0.35; sentence 3 onward: the same thinking time, fire grows
    const f = t < c[2].t0 ? 0.35 : lerp(0.35, 0.9, seg(t, c[2].t0, c[3].t0 + 1.5));
    const frozen = t >= c[1].t0 && t < c[2].t0;
    this.w.fire.update((x, y) => W.fire(x, y, f), frozen ? c[1].t0 : t);
    const think = seg(t, 0.6, c[3].t0);
    this.w.agent.think(think < 1 ? (think * 3) % 1 : 0);
    this.route.progress(eo(seg(t, c[3].t0 + 0.2, c[3].t0 + 1.4))); T3.fade(this.route, t > c[3].t0 ? 1 : 0);
    this.w.v.draw();
    this.chip.place(this.w.v, 8, 8.2, 2.1); this.chip.style.opacity = t < c[3].t0 ? eo(seg(t, 0.6, 1)) : 0;
    this.mode.textContent = t < c[2].t0 ? '기존 평가 · 생각하는 동안 세계 정지' : 'TCM · 생각하는 동안에도 불이 번짐';
    this.mode.style.opacity = eo(seg(t, c[1].t0, c[1].t0 + 0.4));
    this.mode.style.color = t < c[2].t0 ? 'var(--second)' : 'var(--main)';
    this.late.place(this.w.v, 13.2, 5.2, 1.2); this.late.style.opacity = eo(seg(t, c[3].t0 + 1.3, c[3].t0 + 1.7));
  },
});
