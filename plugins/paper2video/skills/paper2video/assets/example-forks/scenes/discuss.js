// Three ways to move entropy on the road: entropy bonus lifts every tile (main), clip-higher mostly the
// forks (accent); SFT flattens the forks while RL keeps them (ghost outline = before).
SCENE('discuss', {
  init(k) {
    this.v = T3.view(k, { fov: 36, fogNear: 30, fogFar: 75 });
    this.v.add(FORK.floor(16, 0, 90));
    this.r = FORK.road(); this.v.add(this.r.group);
    this.mode = k.h('<div class="words" style="left:140px;top:130px;width:1000px"><div class="tag mode-t"></div><div class="big mode-b" style="font-size:56px"></div></div>'); k.stage.append(this.mode);
    this.mt = k.q('.mode-t'); this.mb = k.q('.mode-b');
    this.hyp = k.h('<div class="card" style="left:1180px;top:560px;width:620px;border-top:6px solid var(--second)"><h4>가설 (저자)</h4><div class="small">갈림길의 엔트로피를 지키는 것이 RL은 일반화하고 SFT는 외우는 차이의 한 원인일 수 있음</div><div class="src" style="margin-top:10px">논문 6절 논의 1 · 실험으로 검증한 것은 아님</div></div>'); k.stage.append(this.hyp);
    this.src = k.h('<div class="src" style="position:absolute;left:140px;top:840px">논문 6절 논의 1, 3 · 높이 변화는 개념도</div>'); k.stage.append(this.src);
  },
  render(t, k) {
    const { seg, eo, eio, lerp } = k, c = k.caps;
    const b = eio(seg(t, c[0].t0 + 2.5, c[0].t0 + 4.0)) * (1 - eio(seg(t, c[1].t0, c[1].t0 + 0.6)));
    const ch = eio(seg(t, c[1].t0 + 0.6, c[1].t0 + 2.0)) * (1 - eio(seg(t, c[2].t0, c[2].t0 + 0.6)));
    const sft = eio(seg(t, c[2].t0 + 0.6, c[2].t0 + 2.2)) * (1 - eio(seg(t, c[2].t1 - 0.3, c[2].t1 + 1.2)));
    this.r.tiles.forEach((tl, i) => {
      const h0 = FORK.SEQ[i][1];
      const h = tl.fork ? h0 * (1 + 0.12 * b + 0.35 * ch - 0.92 * sft) : h0 + 0.28 * b * (0.6 + 0.4 * Math.sin(t * 4 + i * 2.1));
      tl.setH(Math.max(0.005, h));
      if (tl.fork) tl.tint(T3.color('accent').clone().lerp(T3.color('main'), sft), 0.35);
      else tl.tint(FORK.lowC().lerp(T3.color('main'), 0.8 * b), 0.08 + 0.3 * b);
    });
    const d = eio(seg(t, 0, k.dur));
    this.v.look([lerp(0, 3, d), 17, 9], [lerp(15, 17, d), 0, -2]);
    this.v.draw();
    const M = t < c[1].t0 ? ['ENTROPY BONUS', '엔트로피 보너스: 모든 토큰을 흔든다', 'main']
      : t < c[2].t0 ? ['CLIP-HIGHER', '주로 갈림길 토큰을 더 학습', 'accent']
      : ['SFT ↔ RL', '지도학습은 갈림길을 납작하게, RL은 유지', 'second'];
    this.mt.textContent = M[0]; this.mb.textContent = M[1]; this.mt.style.color = 'var(--' + M[2] + ')';
    const seen = [c[0].t0, c[1].t0, c[2].t0].filter((x) => t >= x).pop() || 0;
    this.mode.style.opacity = eo(seg(t, seen + 0.3, seen + 0.8));
    this.hyp.style.opacity = eo(seg(t, c[3].t0 + 0.3, c[3].t0 + 0.8));
    this.src.style.opacity = eo(seg(t, 0.5, 1));
  },
});
