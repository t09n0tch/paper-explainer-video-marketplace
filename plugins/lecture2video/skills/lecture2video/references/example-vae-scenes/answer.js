// M = D: z is a straight copy, error 0. Then the bottleneck: z collapses to two cells.
SCENE('answer', {
  init(k) {
    k.stage.append(k.h('<div class="ground"><div class="grid"></div></div>'));
    this.svg = k.h('<svg class="art" viewBox="0 0 1920 1080"></svg>'); k.stage.append(this.svg);
    const vx = Array.from({ length: 8 }, (_, i) => 0.2 + 0.8 * PARTS.hash(i));
    this.x = PARTS.col(k, 8, vx); this.z = PARTS.col(k, 8, vx, 'accent'); this.h = PARTS.col(k, 8, vx);
    this.lines = Array.from({ length: 16 }, () => {
      const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      l.setAttribute('stroke', '#EDE8E0'); l.setAttribute('stroke-opacity', '.4'); l.setAttribute('stroke-width', '2');
      this.svg.append(l); return l;
    });
    const lab = (html, x, y) => { const e = k.h('<div class="sub" style="position:absolute;left:' + (x - 160) + 'px;top:' + y + 'px;width:320px;text-align:center"></div>'); e.innerHTML = html; k.stage.append(e); return e; };
    lab('<span class="tex">x</span>', 560, 230); lab('<span class="tex">\\hat{x}</span>', 1360, 230);
    this.lzEq = lab('<span class="tex">z,\\ M = D</span>', 960, 230);
    this.lzLo = lab('<span class="tex">z,\\ M \\ll D</span>', 960, 230);
    this.copy = k.h('<div class="chip" style="left:0;top:800px;font-size:34px;color:var(--main)">그대로 베끼기만 해도 오차 0</div>');
    this.neck = k.h('<div class="chip" style="left:0;top:800px;font-size:34px;color:var(--accent)">병목이 있어야 무엇을 남길지 배운다</div>');
    this.badge = k.h('<div class="extra" style="right:120px;top:44px">보충</div>');
    k.stage.append(this.copy, this.neck, this.badge);
  },
  render(t, k) {
    const { seg, eo, eio } = k, c = k.caps, Y = 520;
    const p = eio(seg(t, c[1].t0 + 0.5, c[1].t0 + 2.2));
    const w = Array.from({ length: 8 }, (_, i) => (i === 3 || i === 4 ? 1 : 1 - p));
    const yx = PARTS.place(this.x, 560, Y), yz = PARTS.place(this.z, 960, Y, w), yh = PARTS.place(this.h, 1360, Y);
    this.z.forEach((e, i) => { e.style.opacity = w[i] < 0.02 ? 0 : 1; });
    const draw = eo(seg(t, c[0].t0 + 0.6, c[0].t0 + 1.8));
    this.lines.forEach((l, j) => {
      const i = j % 8, left = j < 8;
      // collapsed cells hand their line to the nearest kept cell
      const zy = w[i] > 0.02 || p < 1 ? (i < 3 ? k.lerp(yz[i], yz[3], p) : i > 4 ? k.lerp(yz[i], yz[4], p) : yz[i]) : yz[i];
      const [x1, y1, x2, y2] = left ? [583, yx[i], 937, zy] : [983, zy, 1337, yh[i]];
      l.setAttribute('x1', x1); l.setAttribute('y1', y1); l.setAttribute('x2', k.lerp(x1, x2, draw)); l.setAttribute('y2', k.lerp(y1, y2, draw));
    });
    this.lzEq.style.opacity = 1 - p; this.lzLo.style.opacity = p;
    const center = (e) => { e.style.left = (960 - e.offsetWidth / 2) + 'px'; };
    center(this.copy); center(this.neck);
    PARTS.rise(k, this.copy, t, c[0].t0 + 3.4); this.copy.style.opacity *= 1 - p;
    PARTS.rise(k, this.neck, t, c[1].t0 + 2.2);
    this.badge.style.opacity = 1;
  },
});
