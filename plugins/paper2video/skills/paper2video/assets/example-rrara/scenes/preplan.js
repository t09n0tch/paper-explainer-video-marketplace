// Where first: the room on the left with the agent; then the pre-planner's input, its short output, and the queue it feeds.
SCENE('preplan', {
  init(k) {
    this.w = ROOM.build(k); this.w.agent.place(8, 8.2);
    this.path = [[8, 8.2], [10.4, 6.8], [12.4, 5.6], [13.2, 5.2]];
    this.w.v.add(this.route = T3.route(this.path, 'accent', 0.14));
    k.stage.append(k.h('<div style="position:absolute;right:0;top:0;bottom:0;width:820px;background:linear-gradient(90deg, transparent, var(--ground) 18%)"></div>'));
    k.stage.append(k.h('<div class="card pp-in" style="right:100px;top:130px;width:620px"><h4>입력 (표 형식 프롬프트)</h4><div style="font-size:40px"><span class="tex">O_t,\\; C_t,\\; M_t</span></div>' +
      '<div class="small">보이는 물체 · 과제 맥락 · 지도 정보</div></div>'));
    k.stage.append(k.h('<div class="card pp-out" style="right:100px;top:350px;width:620px"><h4>출력: 물체 번호와 쉼표뿐</h4><div class="num pp-ids" style="font-size:52px;font-weight:700;color:var(--accent)">57, 56, 62</div>' +
      '<div class="small">응답 지연 <span class="num k">0.40 s</span> · GPT-3.5 매 결정 <span class="num">2.54 s</span></div><div class="src" style="margin-top:8px">순서는 예시 · 지연은 Table 2</div></div>'));
    k.stage.append(k.h('<div class="pp-q" style="position:absolute;right:100px;top:640px;width:620px;display:flex;gap:16px">' +
      ['p1 · 57', 'p2 · 56', 'p3 · 62'].map((s) => '<div class="card" style="position:relative;flex:1;padding:18px;text-align:center;font-size:30px;font-weight:700">' + s + '</div>').join('') + '</div>'));
    Object.assign(this, { inp: k.q('.pp-in'), out: k.q('.pp-out'), ids: k.q('.pp-ids'), q: [...k.stage.querySelectorAll('.pp-q .card')] });
  },
  render(t, k) {
    const { seg, eo, lerp } = k, c = k.caps, W = window.WORLD;
    this.w.v.look([7, 21, 16], [12.5, 4.2, 0]);
    this.w.fire.update((x, y) => W.fire(x, y, lerp(0.3, 0.5, seg(t, 0, k.dur))), t);
    const walk = seg(t, c[2].t0 + 0.5, k.dur - 1);
    const p = ROOM.along(this.path, walk); this.w.agent.place(p[0], p[1]);
    this.route.progress(1); T3.fade(this.route, eo(seg(t, c[2].t0, c[2].t0 + 0.4)) * (walk >= 1 ? 0.3 : 1));
    this.w.room.items[57].visible = walk < 1;
    this.w.v.draw();
    const show = (el, a) => { const e = eo(seg(t, a, a + 0.5)); el.style.opacity = e; el.style.transform = 'translateY(' + (1 - e) * 16 + 'px)'; };
    show(this.inp, 0.8); show(this.out, c[1].t0 + 0.2);
    this.q.forEach((el, i) => {
      show(el, c[2].t0 + i * 0.25);
      const done = i === 0 && walk >= 1, cur = (i === 0 && walk < 1) || (i === 1 && walk >= 1);
      el.style.borderColor = cur ? 'var(--accent)' : ''; el.style.opacity = done ? 0.35 : el.style.opacity;
    });
  },
});
