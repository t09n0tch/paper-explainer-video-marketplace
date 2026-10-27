// A world scene: slow camera drift, hazard growing, a label that appears with sentence 2.
SCENE('room', {
  init(k) {
    k.stage.append(k.h('<div class="ground"><div class="grid"></div></div>'));
    this.cv = k.W3.canvas(); k.stage.append(this.cv); this.ctx = this.cv.getContext('2d');
    this.lab = k.h('<div class="lab" style="color:var(--ground);background:var(--second)">56 · 5점</div>'); k.stage.append(this.lab);
    this.grid = k.q('.grid');
  },
  render(t, k) {
    const { W3, seg, eio, eo, eob, lerp } = k, c = k.caps, W = window.WORLD;
    const cam = W3.cam({ yaw: lerp(-0.6, -0.45, eio(seg(t, 0, k.dur))), pitch: 0.84, zoom: 72, sx: 960, sy: 520 });
    const f = lerp(0.3, 0.9, seg(t, 0, k.dur));
    W3.draw(this.ctx, k.P, W, { cam, t, field: (x, y) => W.fire(x, y, f), items: { 56: {}, 57: {}, 62: {} }, agent: { x: 8, y: 8.4 } });
    const p = W3.at(cam, 2.6, 2.8, 0.8);
    this.lab.style.left = p[0] + 'px'; this.lab.style.top = p[1] + 'px';
    const a = c[1].t0 + 0.3;                       // on sentence 2
    this.lab.style.opacity = eo(seg(t, a, a + 0.3));
    this.lab.style.transform = 'translate(-50%,-100%) scale(' + eob(seg(t, a, a + 0.45), 1.6) + ')';
    this.grid.style.transform = 'translateY(' + (-t * 3) + 'px)';
  },
});
