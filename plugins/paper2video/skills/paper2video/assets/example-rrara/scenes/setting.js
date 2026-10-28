// Where first: the camera moves into the room; values appear on the objects; fire reaches 57 and its value halves.
SCENE('setting', {
  init(k) {
    this.w = ROOM.build(k); this.w.agent.place(8, 8.4);
    const W = window.WORLD;
    this.labs = Object.keys(W.items).map((id) => ({ id, el: ROOM.label(k, id + ' · ' + W.items[id][2] + '점', W.items[id][2] >= 5 ? 'color:var(--ground);background:var(--second)' : '') }));
    this.dmg = ROOM.label(k, '57 · 손상 → 절반', 'color:var(--ground);background:var(--main);border-color:var(--main)');
    k.stage.append(k.h('<div class="card" style="right:90px;top:150px;width:470px"><h4>점수 규칙</h4>' +
      '<div class="sub" style="font-size:28px">구하면 물건의 가치만큼<br>손상되면 <span class="hl">절반</span> · 타 버리면 <span class="hl">0</span></div><div class="src" style="margin-top:14px">논문 식 (10)(11)</div></div>'));
    this.card = k.q('.card');
  },
  render(t, k) {
    const { seg, eo, eio, lerp } = k, W = window.WORLD, c = k.caps;
    this.w.v.orbit([9, 5, 0], lerp(18, 13, eio(seg(t, 0, c[1].t0))), lerp(13, 9, eio(seg(t, 0, c[1].t0))), lerp(-1.95, -1.75, seg(t, 0, k.dur)));
    const f = lerp(0.35, 0.7, eio(seg(t, c[2].t0, c[2].t0 + 3)));
    this.w.fire.update((x, y) => W.fire(x, y, f), t);
    const burnt = W.fire(13.2, 5.2, f) > 0.25;
    this.w.room.items[57].material.color.set(burnt ? T3.color('main') : T3.color('#8f9095'));
    this.w.v.draw();
    this.labs.forEach((l, i) => {
      const it = W.items[l.id], a = c[1].t0 + 0.3 + i * 0.25;
      l.el.place(this.w.v, it[0], it[1], 0.9);
      l.el.style.opacity = l.id === '57' && burnt ? 0 : eo(seg(t, a, a + 0.35));
    });
    this.dmg.place(this.w.v, 13.2, 5.2, 0.9); this.dmg.style.opacity = burnt ? 1 : 0;
    const p = eo(seg(t, c[2].t0, c[2].t0 + 0.5)); this.card.style.opacity = p; this.card.style.transform = 'translateX(' + (1 - p) * 30 + 'px)';
  },
});
