// The flip side on the road: beams fall on the flat tiles instead (main colour); then back to the forks.
SCENE('ablation', {
  init(k) {
    this.v = T3.view(k, { fov: 36, fogNear: 30, fogFar: 75 });
    this.v.add(FORK.floor(16, 0, 90));
    this.r = FORK.road(); this.v.add(this.r.group);
    this.exn = k.h('<div class="src" style="position:absolute;left:140px;top:845px;padding:6px 14px;border-radius:10px;background:color-mix(in srgb, var(--ground) 90%, transparent)">토큰은 부록 그림 13의 풀이에서 · 높이는 예시</div>'); k.stage.append(this.exn);
    this.c1 = k.h('<div class="card" style="left:1240px;top:140px;width:560px;border-top:6px solid var(--main)"><h4 style="color:var(--main)">하위 80% 토큰만</h4><div class="small">학습 토큰의 80%를 쓰고도 성능이 크게 하락</div><div class="src" style="margin-top:10px">그림 7(a) · Qwen3-8B Base</div></div>'); k.stage.append(this.c1);
    this.c2 = k.h('<div class="card" style="left:1240px;top:390px;width:560px"><h4>상위 10% · 50% · 100%</h4><div class="small">학습 초반부터 전체 엔트로피가 20%보다 계속 낮음</div><div class="src" style="margin-top:10px">그림 7(b)(d)(f)</div></div>'); k.stage.append(this.c2);
    this.c3 = k.h('<div class="card" style="left:1240px;top:640px;width:560px;border-top:6px solid var(--accent)"><h4 style="color:var(--accent)">상위 20% 근처</h4><div class="small">탐색과 학습 안정성의 균형 (저자 해석)</div></div>'); k.stage.append(this.c3);
  },
  render(t, k) {
    const { seg, eo, eio, lerp } = k, c = k.caps, n = this.r.tiles.length;
    const back = eio(seg(t, c[3].t0 + 0.2, c[3].t0 + 1.0));
    this.r.tiles.forEach((tl, i) => {
      const s = c[0].t0 + 1.0 + (i % 9) * 0.07;
      if (tl.fork) { this.r.shine(i, eio(seg(t, c[3].t0 + 0.6 + i * 0.03, c[3].t0 + 1.6 + i * 0.03)), 'accent'); tl.tint(FORK.lowC().lerp(T3.color('accent'), 0.35 + 0.65 * back), 0.1 + 0.3 * back); }
      else { this.r.shine(i, eio(seg(t, s, s + 0.9)), 'main', 1 - back); tl.tint(null, 0.08); }
    });
    const d = eio(seg(t, 0, k.dur));
    this.v.look([lerp(-1, 2, d), 18, 10], [lerp(17, 18, d), 0, -1.5]);
    this.v.draw();
    this.c1.style.opacity = eo(seg(t, c[1].t0 + 0.3, c[1].t0 + 0.8));
    this.c2.style.opacity = eo(seg(t, c[2].t0 + 0.3, c[2].t0 + 0.8));
    this.c3.style.opacity = eo(seg(t, c[3].t0 + 0.3, c[3].t0 + 0.8));
  },
});
