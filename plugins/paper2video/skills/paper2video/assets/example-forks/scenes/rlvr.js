// RLVR on the token road: the answer is written token by token, the verifier marks the goal block,
// then one learning signal falls on every tile alike.
SCENE('rlvr', {
  init(k) {
    this.v = T3.view(k, { fov: 36, fogNear: 30, fogFar: 75 });
    this.v.add(FORK.floor(16, 0, 90));
    this.r = FORK.road(); this.v.add(this.r.group);
    this.exn = k.h('<div class="src" style="position:absolute;left:140px;top:845px;padding:6px 14px;border-radius:10px;background:color-mix(in srgb, var(--ground) 90%, transparent)">토큰은 부록 그림 13의 풀이에서 · 높이는 예시</div>'); k.stage.append(this.exn);
    this.ok = k.h('<div class="lab" style="color:var(--ground);background:var(--accent);font-size:28px">✓ 정답 · 보상 1</div>'); k.stage.append(this.ok);
    this.card = k.h('<div class="card" style="left:1180px;top:330px;width:600px"><h4>검증 가능한 보상</h4>' +
      '<div style="font-size:40px"><span class="tex">R^{i}=\\begin{cases}1.0 & \\text{if is\\_equivalent}(a,o^{i})\\\\ 0.0 & \\text{otherwise}\\end{cases}</span></div>' +
      '<div class="src" style="margin-top:14px">논문 식 (3)</div></div>'); k.stage.append(this.card);
    this.all = k.h('<div class="card" style="left:1180px;top:620px;width:600px"><h4>DAPO: 모든 토큰에 같은 신호</h4><div class="small">한 풀이 안의 토큰은 모두 같은 어드밴티지 <span class="tex">\\hat{A}^{i}_{t}</span> 로 학습</div><div class="src" style="margin-top:12px">논문 식 (4)</div></div>'); k.stage.append(this.all);
    this.q = k.h('<div class="card" style="left:140px;top:150px;width:940px"><div class="big" style="font-size:60px">모든 토큰이 똑같이 중요할까?</div></div>'); k.stage.append(this.q);
  },
  render(t, k) {
    const { seg, eo, eio, lerp } = k, c = k.caps, n = this.r.tiles.length;
    this.r.tiles.forEach((tl, i) => {                                  // written one by one during sentence 1
      const p = eo(seg(t, 0.6 + i * 0.16, 1.0 + i * 0.16));
      tl.m.visible = p > 0.01; tl.setH(Math.max(0.001, FORK.SEQ[i][1] * p)); tl.tint(null, 0.08);
    });
    this.r.goal.visible = t > 0.6 + n * 0.16;
    const g = eo(seg(t, c[1].t0 + 1.2, c[1].t0 + 1.7));
    this.r.goal.material.color.copy(FORK.lowC().lerp(T3.color('accent'), g)); this.r.goal.material.emissive.copy(this.r.goal.material.color); this.r.goal.material.emissiveIntensity = 0.3 * g;
    this.r.tiles.forEach((tl, i) => this.r.shine(i, eio(seg(t, c[2].t0 + 0.6 + (n - i) * 0.05, c[2].t0 + 1.6 + (n - i) * 0.05)), 'second', 0.7));
    const a = lerp(0, 1, eio(seg(t, 0, k.dur)));
    this.v.look([lerp(-3, 0, a), 19, lerp(10, 12, a)], [lerp(17, 19, a), 0, -1]);
    this.v.draw();
    FORK.pin(this.v, this.ok, this.r.gx, this.r.gy, 1.9, g);
    this.card.style.opacity = eo(seg(t, c[1].t0 + 0.3, c[1].t0 + 0.8));
    this.all.style.opacity = eo(seg(t, c[2].t0 + 0.3, c[2].t0 + 0.8));
    const qa = eo(seg(t, c[3].t0 + 0.3, c[3].t0 + 0.9)); this.q.style.opacity = qa; this.q.style.transform = 'translateY(' + (1 - qa) * 20 + 'px)';
  },
});
