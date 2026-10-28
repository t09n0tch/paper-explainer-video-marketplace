// The paper's own example (Fig. 3): walking to hairbrush 57; the reflector sees bag 56 at about the same
// distance and cooler, answers "Inappropriate 56", and the agent turns without stopping.
SCENE('reflect', {
  init(k) {
    this.w = ROOM.build(k);
    this.old = [[8, 7.4], [10.6, 6.2], [13.2, 5.2]]; this.turnAt = 0.3;
    const p = ROOM.along(this.old, this.turnAt);
    this.neu = [p, [7, 5.8], [4.2, 3.6], [2.6, 2.8]];
    this.w.v.add(this.r1 = T3.route(this.old, 'accent', 0.14)); this.w.v.add(this.r2 = T3.route(this.neu, 'accent', 0.14));
    this.l57 = ROOM.label(k, '57 헤어브러시 · 가치 1'); this.l56 = ROOM.label(k, '56 가방 · 가치 5', 'color:var(--ground);background:var(--second)');
    k.stage.append(k.h('<div style="position:absolute;right:0;top:0;bottom:0;width:760px;background:linear-gradient(90deg, transparent, var(--ground) 20%)"></div>'));
    k.stage.append(k.h('<div class="card rf-a" style="right:90px;top:130px;width:600px"><h4>현재 행동</h4><div class="num" style="font-size:34px">walk_to 57</div></div>'));
    k.stage.append(k.h('<div class="card rf-b" style="right:90px;top:300px;width:600px"><h4>반성기가 보는 것</h4>' +
      '<div class="num" style="font-size:21px;line-height:1.7;white-space:nowrap">56 bag · value 5 · 43.86 m · 202.19 °C<br>57 hairbrush · value 1 · 44.57 m · 212.25 °C</div><div class="src" style="margin-top:8px">논문 그림 3의 프롬프트</div></div>'));
    k.stage.append(k.h('<div class="card rf-c" style="right:90px;top:640px;width:600px;border-color:var(--main);border-width:3px"><h4 class="hl">반성기 답: Inappropriate 56</h4><div class="small">목표를 56으로 바꾸고, 걸음은 계속</div></div>'));
    Object.assign(this, { a: k.q('.rf-a'), b: k.q('.rf-b'), c: k.q('.rf-c') });
  },
  render(t, k) {
    const { seg, eo, lerp } = k, c = k.caps, W = window.WORLD;
    this.w.v.look([7, 21, 16], [12.5, 4.2, 0]);
    this.w.fire.update((x, y) => W.fire(x, y, lerp(0.35, 0.55, seg(t, 0, k.dur))), t);
    // one continuous walk: along the old path until the answer arrives, then along the new one
    const tAns = c[3].t0 + 0.8, w1 = seg(t, c[1].t0, tAns) * this.turnAt, w2 = seg(t, tAns, k.dur - 0.5);
    const p = t < tAns ? ROOM.along(this.old, w1) : ROOM.along(this.neu, w2);
    this.w.agent.place(p[0], p[1]);
    this.w.agent.think(t > c[0].t0 + 0.5 && t < tAns ? (t * 0.7) % 1 : 0);
    this.r1.progress(1); T3.fade(this.r1, t < tAns ? eo(seg(t, c[1].t0, c[1].t0 + 0.4)) : 0.25);
    this.r1.material.color.set(T3.color(t < tAns ? 'accent' : 'second'));
    this.r2.progress(eo(seg(t, tAns, tAns + 0.8))); T3.fade(this.r2, t >= tAns ? 1 : 0);
    this.w.v.draw();
    this.l57.place(this.w.v, 13.2, 5.2, 0.9); this.l57.style.opacity = eo(seg(t, c[1].t0 + 0.3, c[1].t0 + 0.6));
    this.l56.place(this.w.v, 2.6, 2.8, 0.9); this.l56.style.opacity = eo(seg(t, c[2].t0 + 0.3, c[2].t0 + 0.6));
    const show = (el, a) => { const e = eo(seg(t, a, a + 0.5)); el.style.opacity = e; el.style.transform = 'translateY(' + (1 - e) * 16 + 'px)'; };
    show(this.a, c[1].t0 + 0.2); show(this.b, c[2].t0 + 0.2); show(this.c, c[3].t0 + 0.3);
  },
});
