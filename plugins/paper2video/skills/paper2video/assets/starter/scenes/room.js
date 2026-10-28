// A world scene in real 3D (t3.js): the room from world.js, fire spreading, a slow camera
// orbit, and a label riding on object 56 that appears with sentence 2.
SCENE('room', {
  init(k) {
    const W = window.WORLD;
    this.v = T3.view(k, { fov: 38 });
    this.room = T3.room(W); this.v.add(this.room.group);
    this.fire = T3.field(W, 'main'); this.v.add(this.fire);
    this.agent = T3.agent('accent'); this.agent.place(8, 8.4); this.v.add(this.agent);
    this.lab = k.h('<div class="lab" style="color:var(--ground);background:var(--second)">56 · 5점</div>'); k.stage.append(this.lab);
  },
  render(t, k) {
    const { seg, eio, eo, eob, lerp } = k, c = k.caps, W = window.WORLD;
    this.v.orbit([8, 5, 0], 15, 11, lerp(-2.1, -1.75, eio(seg(t, 0, k.dur))));   // drift on every hold
    const f = lerp(0.3, 0.9, seg(t, 0, k.dur));
    this.fire.update((x, y) => W.fire(x, y, f), t);
    this.v.draw();
    const p = this.v.at(2.6, 2.8, 0.9);
    this.lab.style.left = p[0] + 'px'; this.lab.style.top = p[1] + 'px';
    const a = c[1].t0 + 0.3;                       // on sentence 2
    this.lab.style.opacity = eo(seg(t, a, a + 0.3));
    this.lab.style.transform = 'translate(-50%,-100%) scale(' + eob(seg(t, a, a + 0.45), 1.6) + ')';
  },
});
