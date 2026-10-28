// The same road after RLVR: tall tiles grow (ghost outline = before), low tiles barely move.
SCENE('change', {
  init(k) {
    this.v = T3.view(k, { fov: 36, fogNear: 30, fogFar: 75 });
    this.v.add(FORK.floor(16, 0, 90));
    this.r = FORK.road(); this.v.add(this.r.group);
    this.exn = k.h('<div class="src" style="position:absolute;left:140px;top:845px;padding:6px 14px;border-radius:10px;background:color-mix(in srgb, var(--ground) 90%, transparent)">토큰은 부록 그림 13의 풀이에서 · 높이는 예시</div>'); k.stage.append(this.exn);
    this.ghost = this.r.tiles.filter((t) => t.fork).map((t) => {
      const g = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.96, 1, 0.96)), new THREE.LineBasicMaterial({ color: T3.color('second'), transparent: true, opacity: 0.7 }));
      g.scale.y = t.top; g.position.copy(T3.v3(t.x, t.y, t.top / 2)); this.v.add(g); return g;
    });
    this.c1 = k.h('<div class="card" style="left:1240px;top:150px;width:560px;border-top:6px solid var(--accent)"><h4 style="color:var(--accent)">원래 엔트로피가 높을수록</h4><div class="small">학습 뒤 평균 엔트로피 증가가 더 큼</div><div class="src" style="margin-top:10px">그림 4 · 기본 모델 엔트로피 5% 구간별</div></div>'); k.stage.append(this.c1);
    this.c2 = k.h('<div class="card" style="left:1240px;top:430px;width:560px"><h4>낮은 엔트로피 토큰</h4><div class="small">학습 내내 좁은 범위에서만 변동</div><div class="src" style="margin-top:10px">그림 5 · 증가 폭은 예시</div></div>'); k.stage.append(this.c2);
  },
  render(t, k) {
    const { seg, eo, eio, lerp } = k, c = k.caps;
    const g = eio(seg(t, c[1].t0 + 0.3, c[1].t0 + 2.3)), w = eo(seg(t, c[2].t0 + 0.2, c[2].t0 + 0.8));
    this.r.tiles.forEach((tl, i) => {
      const h0 = FORK.SEQ[i][1];
      tl.setH(tl.fork ? h0 * (1 + 0.45 * g) : h0 * (1 + 0.25 * w * Math.sin(t * 3 + i * 1.7)));
    });
    this.ghost.forEach((gh) => { gh.visible = g > 0.01; gh.material.opacity = 0.7 * Math.min(1, g * 3); });
    const d = eio(seg(t, 0, k.dur));
    this.v.look([lerp(0, 3, d), 17, lerp(8, 9, d)], [lerp(15, 17, d), 0, -1.2]);
    this.v.draw();
    this.c1.style.opacity = eo(seg(t, c[1].t0 + 0.4, c[1].t0 + 0.9));
    this.c2.style.opacity = eo(seg(t, c[2].t0 + 0.3, c[2].t0 + 0.8));
  },
});
