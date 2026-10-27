// Slide 5 redrawn: the hourglass builds, x is squeezed to z and spread back to x-hat.
SCENE('s05', {
  init(k) {
    k.stage.append(k.h('<div class="ground"><div class="grid"></div></div>'));
    const N = [8, 6, 4, 2, 4, 6, 8]; this.X = N.map((_, i) => 420 + i * 180); this.Y = 470;
    const vx = Array.from({ length: 8 }, (_, i) => 0.2 + 0.8 * PARTS.hash(i));
    const vh = vx.map((v, i) => Math.max(0, Math.min(1, v + 0.12 * (PARTS.hash(i + 50) - 0.5))));
    // lines first so the cells sit on top
    this.svg = k.h('<svg class="art" viewBox="0 0 1920 1080"></svg>'); k.stage.append(this.svg);
    this.cols = N.map((n, i) => PARTS.col(k, n, i === 0 ? vx : i === 6 ? vh : Array(n).fill(i === 3 ? 0.85 : 0.3), i === 3 ? 'accent' : 'second'));
    this.ys = this.cols.map((cs, i) => PARTS.place(cs, this.X[i], this.Y));
    const ext = (i) => [this.ys[i][0] - 20, this.ys[i][this.ys[i].length - 1] + 20];
    this.gaps = [];
    for (let i = 0; i < 6; i++) {
      const [a0, a1] = ext(i), [b0, b1] = ext(i + 1), xa = this.X[i] + 23, xb = this.X[i + 1] - 23;
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.innerHTML = [[a0, b0], [a1, b1], [a0, b1], [a1, b0]].map(([p, q]) => '<line x1="' + xa + '" y1="' + p + '" x2="' + xb + '" y2="' + q + '" stroke="#EDE8E0" stroke-opacity=".35" stroke-width="2" stroke-dasharray="7 7"/>').join('');
      this.svg.append(g); this.gaps.push(g);
    }
    // the empty target outline for x-hat, and the "?" before the decoder exists
    this.ghost = k.h('<div style="position:absolute;left:' + (this.X[6] - 30) + 'px;top:' + (this.ys[6][0] - 27) + 'px;width:60px;height:' + (this.ys[6][7] - this.ys[6][0] + 54) + 'px;border:3px dashed var(--second);border-radius:10px;opacity:0"></div>');
    this.qm = k.h('<div class="line" style="position:absolute;left:' + (this.X[6] - 20) + 'px;top:' + (this.Y - 50) + 'px;color:var(--main)">?</div>');
    const lab = (txt, x, y, cls) => { const e = k.h('<div class="' + (cls || 'small') + '" style="position:absolute;left:' + (x - 150) + 'px;top:' + y + 'px;width:300px;text-align:center"></div>'); e.innerHTML = txt; k.stage.append(e); return e; };
    k.stage.append(this.ghost, this.qm);
    this.lx = lab('입력 <span class="tex">x</span>', this.X[0], 220);
    this.lz = lab('잠재 <span class="tex">z</span>', this.X[3], 370);
    this.lh = lab('출력 <span class="tex">\\hat{x}</span>', this.X[6], 220);
    this.lf = lab('인코더 <span class="tex">f</span>', this.X[1] + 90, 740, 'sub');
    this.lg = lab('디코더 <span class="tex">g</span>', this.X[5] - 90, 740, 'sub');
    this.eq = k.h('<div style="position:absolute;left:0;right:0;top:820px;text-align:center;font-size:56px"><span class="tex">x \\to f(x) = z \\to g(z) = \\hat{x}</span></div>');
    this.approx = k.h('<div class="chip" style="left:860px;top:920px;font-size:34px;color:var(--accent)">z에 정보가 충분하면 <span class="tex">\\hat{x} \\approx x</span></div>');
    this.hx = k.h('<div style="position:absolute;border:4px solid var(--accent);border-radius:14px"></div>');
    this.hh = this.hx.cloneNode();
    [[this.hx, 0], [this.hh, 6]].forEach(([e, i]) => Object.assign(e.style, { left: this.X[i] - 40 + 'px', top: this.ys[i][0] - 34 + 'px', width: '80px', height: this.ys[i][7] - this.ys[i][0] + 68 + 'px' }));
    this.arc = k.h('<svg class="art" viewBox="0 0 1920 1080"><path d="M ' + this.X[6] + ' 180 C ' + this.X[6] + ' 70, ' + this.X[0] + ' 70, ' + this.X[0] + ' 180" fill="none" stroke="#F08A3C" stroke-width="5" pathLength="1" stroke-dasharray="1"/><path d="M ' + (this.X[0] - 14) + ' 160 L ' + this.X[0] + ' 184 L ' + (this.X[0] + 14) + ' 160" fill="none" stroke="#F08A3C" stroke-width="5"/></svg>');
    this.auto = k.h('<div class="chip" style="left:760px;top:60px;font-size:32px">auto · 입력 <span class="tex">x</span> 자신이 정답</div>');
    k.stage.append(this.eq, this.approx, this.hx, this.hh, this.arc, this.auto);
    this.src = k.h('<div class="slsrc">강의자료 슬라이드 5 · 다시 그림</div>'); this.src.style.top = '1010px'; k.stage.append(this.src);
  },
  render(t, k) {
    const { seg, eo } = k, c = k.caps;
    const at = [c[0].t0 + 0.3, c[1].t0 + 0.3, c[1].t0 + 0.8, c[0].t0 + 1.6, c[1].t0 + 2.6, c[1].t0 + 3.1, c[1].t0 + 3.6];
    this.cols.forEach((cs, i) => cs.forEach((e, j) => PARTS.rise(k, e, t, at[i] + j * 0.05, 0)));
    this.gaps.forEach((g, i) => { g.style.opacity = eo(seg(t, Math.max(at[i], at[i + 1]) - 0.1, Math.max(at[i], at[i + 1]) + 0.4)); });
    this.ghost.style.opacity = eo(seg(t, c[0].t0 + 3.0, c[0].t0 + 3.4)) * (1 - eo(seg(t, at[6], at[6] + 0.4)));
    this.qm.style.opacity = this.ghost.style.opacity;
    PARTS.rise(k, this.lx, t, at[0]); PARTS.rise(k, this.lz, t, at[3]); PARTS.rise(k, this.lh, t, at[6]);
    PARTS.rise(k, this.lf, t, c[1].t0 + 1.0); PARTS.rise(k, this.lg, t, c[1].t0 + 3.0);
    PARTS.rise(k, this.eq, t, c[1].t0 + 4.2);
    const cmp = c[2].t0 + 0.4, pulse = 0.5 + 0.5 * Math.sin((t - cmp) * 4);
    [this.hx, this.hh].forEach((e) => { e.style.opacity = eo(seg(t, cmp, cmp + 0.4)) * (t < c[3].t0 ? 0.6 + 0.4 * pulse : 0.5); });
    PARTS.rise(k, this.approx, t, cmp + 1.0);
    this.arc.firstChild.setAttribute('stroke-dashoffset', 1 - eo(seg(t, c[3].t0 + 0.6, c[3].t0 + 1.8)));
    this.arc.lastChild.style.opacity = eo(seg(t, c[3].t0 + 1.7, c[3].t0 + 1.9));
    PARTS.rise(k, this.auto, t, c[3].t0 + 1.6);
    this.src.style.opacity = eo(seg(t, 0.4, 0.9));
  },
});
