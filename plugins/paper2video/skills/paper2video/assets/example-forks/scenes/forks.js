// Close along the road: the fork words light up with the paper's high-entropy word list, then the
// low tiles with the low-entropy kinds; the branches open as the name "forking token" lands.
SCENE('forks', {
  init(k) {
    this.v = T3.view(k, { fov: 38, fogNear: 25, fogFar: 60 });
    this.v.add(FORK.floor(16, 0, 90));
    this.r = FORK.road(); this.v.add(this.r.group);
    this.labs = this.r.tiles.map((t) => { const e = k.h('<div class="lab" style="font-size:24px"></div>'); e.textContent = t.word; k.stage.append(e); return e; });
    this.hi = k.h('<div class="card" style="left:1220px;top:140px;width:580px;border-top:6px solid var(--accent)"><h4 style="color:var(--accent)">평균 엔트로피 최상위</h4>' +
      '<div class="mono" style="font-size:34px;line-height:1.5">wait · however · thus<br>suppose · since · because</div><div class="src" style="margin-top:10px">그림 2(b) · 빈도 100회 초과 토큰 중</div></div>'); k.stage.append(this.hi);
    this.lo = k.h('<div class="card" style="left:1220px;top:470px;width:580px"><h4>평균 엔트로피 최하위</h4>' +
      '<div style="font-size:32px;line-height:1.5">단어의 뒷부분 · 코드 조각<br>수식의 구성 요소</div><div class="src" style="margin-top:10px">그림 2(c)</div></div>'); k.stage.append(this.lo);
    this.name = k.h('<div class="words" style="left:140px;top:140px;width:900px"><div class="tag">FORKING TOKENS</div><div class="big" style="font-size:66px">갈림길 토큰</div></div>'); k.stage.append(this.name);
    this.note = k.h('<div class="src" style="position:absolute;left:140px;top:845px;padding:6px 14px;border-radius:10px;background:color-mix(in srgb, var(--ground) 90%, transparent)">토큰은 부록 그림 13의 풀이에서 · 높이는 예시</div>'); k.stage.append(this.note);
  },
  render(t, k) {
    const { seg, eo, eio, lerp } = k, c = k.caps;
    const fk = eo(seg(t, c[1].t0 + 0.2, c[1].t0 + 0.8)), lo = eo(seg(t, c[2].t0 + 0.2, c[2].t0 + 0.8));
    this.r.tiles.forEach((tl) => {
      if (tl.fork) tl.tint(T3.color('accent').clone().lerp(FORK.lowC(), 0.6 * (1 - fk)), 0.12 + 0.3 * fk);
      else if (tl.h < 0.07) tl.tint(FORK.lowC().lerp(T3.color('second'), 0.55 * lo), 0.08 + 0.1 * lo);
      else tl.tint(null, 0.08);
    });
    this.r.fork(eio(seg(t, c[3].t0 + 0.3, c[3].t0 + 2.6)));
    const p = eio(seg(t, 0, k.dur));                                  // dolly along the road
    this.v.look([lerp(-2, 9, p), 12, 6.5], [lerp(8, 19, p), 0, -0.5]);
    this.v.draw();
    this.r.tiles.forEach((tl, i) => {
      const e = this.labs[i], on = tl.fork ? 0.6 + 0.4 * fk : tl.h < 0.07 ? 0.45 + 0.55 * lo : 0.45;
      FORK.pin(this.v, e, tl.x, tl.y, tl.top + 0.25, on * eo(seg(t, 0.5, 1.2)));
      e.style.color = tl.fork && fk > 0.5 ? 'var(--accent)' : '';
    });
    this.hi.style.opacity = eo(seg(t, c[1].t0 + 0.4, c[1].t0 + 0.9));
    this.lo.style.opacity = eo(seg(t, c[2].t0 + 0.4, c[2].t0 + 0.9));
    const n = eo(seg(t, c[3].t0 + 0.3, c[3].t0 + 0.9)); this.name.style.opacity = n; this.name.style.transform = 'translateY(' + (1 - n) * 20 + 'px)';
    this.note.style.opacity = eo(seg(t, 0.5, 1.1));
  },
});
