// A 28x28 handwritten "7" builds pixel by pixel, then folds into a few numbers.
SCENE('hook', {
  init(k) {
    k.stage.append(k.h('<div class="ground"><div class="grid"></div></div>'));
    this.cv = document.createElement('canvas'); this.cv.width = 1920; this.cv.height = 1080;
    this.cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%'; k.stage.append(this.cv);
    this.ctx = this.cv.getContext('2d');
    // pixel intensities of a "7": distance to two strokes
    const segd = (px, py, ax, ay, bx, by) => {
      const dx = bx - ax, dy = by - ay, u = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
      return Math.hypot(px - ax - u * dx, py - ay - u * dy);
    };
    this.px = [];
    for (let r = 0; r < 28; r++) for (let c = 0; c < 28; c++) {
      const d = Math.min(segd(c, r, 6, 6.5, 21, 5.5), segd(c, r, 21, 5.5, 12, 23));
      this.px.push(Math.max(0, Math.min(1, (2.3 - d) / 1.3)));
    }
    this.lab = k.h('<div class="words" style="left:860px;top:330px;width:900px"><p class="tag">손글씨 숫자 이미지 한 장</p><p class="line"><span class="tex">28 \\times 28 = 784</span></p><p class="sub">개의 밝기 값</p></div>');
    this.q = k.h('<p class="line" style="position:absolute;left:860px;top:600px;margin:0;width:960px">784개가 다 필요할까요?</p>');
    this.zl = k.h('<div class="words" style="left:1330px;top:330px;width:500px"><p class="tag">요약</p><p class="sub">몇 개의 숫자로</p></div>');
    this.badge = k.h('<div class="extra" style="right:120px;top:44px">보충 예시</div>');
    k.stage.append(this.lab, this.q, this.zl, this.badge);
    this.z = PARTS.col(k, 3, [0.9, 0.55, 0.75], 'accent');
  },
  render(t, k) {
    const { seg, eo, eio, lerp } = k, c = k.caps, ctx = this.ctx, P = k.P;
    ctx.clearRect(0, 0, 1920, 1080);
    const fold = eio(seg(t, c[2].t0 + 0.4, c[2].t0 + 2.2));          // grid shrinks toward the summary
    const S = lerp(19, 13, fold), gx = lerp(300, 300, fold), gy = lerp(275, 360, fold);
    const reveal = 784 * eo(seg(t, c[0].t0 + 0.3, c[0].t0 + 3.0));
    for (let i = 0; i < 784; i++) {
      if (i > reveal) break;
      const r = Math.floor(i / 28), cc = i % 28, v = this.px[i];
      ctx.fillStyle = k.css(k.mix(k.mix(P.ground, P.second, 0.1), P.second, v), 1);
      ctx.fillRect(gx + cc * S, gy + r * S, S - 1.5, S - 1.5);
    }
    PARTS.rise(k, this.lab, t, c[0].t0 + 2.6);
    this.lab.style.opacity *= 1 - fold;
    PARTS.rise(k, this.q, t, c[1].t0 + 0.4);
    this.q.style.opacity *= 1 - fold;
    // arrow from the shrunken grid to three numbers
    const a = eo(seg(t, c[2].t0 + 1.8, c[2].t0 + 2.8));
    if (a > 0) {
      const x0 = gx + 28 * S + 30, x1 = lerp(x0, 1180, a), y = gy + 14 * S;
      ctx.strokeStyle = k.css(P.accent, 0.9); ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x1 - 18, y - 12); ctx.moveTo(x1, y); ctx.lineTo(x1 - 18, y + 12); ctx.stroke();
    }
    PARTS.place(this.z, 1250, gy + 14 * S);
    this.z.forEach((e, i) => PARTS.rise(k, e, t, c[2].t0 + 2.6 + i * 0.2, 0));
    PARTS.rise(k, this.zl, t, c[2].t0 + 3.2);
    this.badge.style.opacity = eo(seg(t, 0.6, 1.1));
  },
});
