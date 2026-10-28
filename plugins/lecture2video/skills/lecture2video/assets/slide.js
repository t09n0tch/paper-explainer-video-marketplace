/* slide.js — a data-driven scene on top of a real lecture slide.
 *
 *   SLIDE('s03', { page: 3, steps: [
 *     { cap: 0, box: [x0, y0, x1, y1], mark: 'hl' },        // box in 0..1 slide coords
 *     { cap: 3, at: 2.5, box: [...], mark: 'circle', zoom: 1.8 },
 *   ] });
 *
 * Each step starts at caption `cap` (+ `at` seconds): the camera eases to the
 * box, the rest of the slide dims, and the mark draws itself.
 * mark: 'hl' highlighter, 'ul' underline, 'circle', 'box', or none.
 * zoom: 'fit' (default, capped at maxZoom), 1 (whole slide) or a number.
 */
window.SLIDE = function (id, o) {
  // the page and marks, for check_claims.py (written into verify/onscreen.json by render.py)
  (window.SLIDE_CFG = window.SLIDE_CFG || {})[id] = { page: o.page, steps: o.steps.map((s) => ({ cap: s.cap, box: s.box, mark: s.mark || '' })) };
  const SW = 1680, SH = 945, SX = 120, SY = 105, NS = 'http://www.w3.org/2000/svg';
  const maxZoom = o.maxZoom || 1;  // whole slide by default; zoom only when a scene asks
  // keep the whole frame on the slide: clamp the centre by what the frame shows at zoom z
  const clamp = (c, lo, hi) => (lo > hi ? 0.5 : Math.min(hi, Math.max(lo, c)));
  const view = (s) => {
    if (!s || s.zoom === 1) return { cx: 0.5, cy: 0.5, s: 1 };
    const [x0, y0, x1, y1] = s.box, bw = x1 - x0, bh = y1 - y0;
    let z = typeof s.zoom === 'number' ? s.zoom : Math.min(maxZoom, 0.85 / bw, 0.75 / bh);
    z = Math.max(1, z);
    const hw = 960 / (z * SW), up = (SY + SH / 2) / (z * SH), dn = (1080 - SY - SH / 2) / (z * SH);
    return { cx: clamp((x0 + x1) / 2, hw, 1 - hw), cy: clamp((y0 + y1) / 2, up, 1 - dn), s: z };
  };
  const pad = (b, p) => [b[0] - p, b[1] - p * 1.6, b[2] + p, b[3] + p * 1.6];

  SCENE(id, {
    async init(k) {
      k.stage.append(k.h('<div class="ground"><div class="grid"></div></div>'));
      const el = k.h('<div class="sl"></div>');
      el.style.width = SW + 'px'; el.style.height = SH + 'px';
      const img = document.createElement('img'); img.className = 'sl-img';
      img.src = 'slides/p' + String(o.page).padStart(2, '0') + '.png';
      el.append(img);
      this.dim = k.h('<div class="sl-dim"></div>'); el.append(this.dim);
      const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'sl-svg');
      svg.setAttribute('viewBox', '0 0 ' + SW + ' ' + SH); el.append(svg);
      this.steps = o.steps.map((s) => {
        const b = pad(s.box, 0.008), x = b[0] * SW, y = b[1] * SH, w = (b[2] - b[0]) * SW, h = (b[3] - b[1]) * SH;
        let m = null;
        if (s.mark === 'hl' || s.mark === 'ul') {
          m = k.h('<div class="sl-' + s.mark + '"></div>');
          m.style.left = x + 'px'; m.style.width = w + 'px';
          if (s.mark === 'hl') { m.style.top = y + 'px'; m.style.height = h + 'px'; } else m.style.top = (y + h + 2) + 'px';
          el.insertBefore(m, this.dim);
        } else if (s.mark === 'circle' || s.mark === 'box') {
          m = document.createElementNS(NS, s.mark === 'circle' ? 'ellipse' : 'rect');
          if (s.mark === 'circle') {
            m.setAttribute('cx', x + w / 2); m.setAttribute('cy', y + h / 2);
            m.setAttribute('rx', w / 2 * 1.18 + 10); m.setAttribute('ry', h / 2 * 1.3 + 8);
          } else {
            m.setAttribute('x', x - 6); m.setAttribute('y', y - 6); m.setAttribute('width', w + 12);
            m.setAttribute('height', h + 12); m.setAttribute('rx', 12);
          }
          m.setAttribute('fill', 'none'); m.setAttribute('stroke', getComputedStyle(k.stage).getPropertyValue('--main') || '#F08A3C');
          m.setAttribute('stroke-width', 5); m.setAttribute('pathLength', 1); m.setAttribute('stroke-dasharray', 1);
          m.setAttribute('stroke-linecap', 'round');
          svg.append(m);
        }
        return Object.assign({ v: view(s), hole: pad(s.box, 0.012), m }, s);
      });
      k.stage.append(el); this.el = el;
      const src = k.h('<div class="slsrc"></div>'); src.textContent = '강의자료 슬라이드 ' + o.page; k.stage.append(src);
      await img.decode().catch(() => {});
      if (o.init) o.init.call(this, k);
    },
    render(t, k) {
      const { seg, eio, eo, lerp } = k;
      const T = this.steps.map((s) => k.caps[s.cap].t0 + (s.at || 0));
      let cur = -1;
      T.forEach((x, i) => { if (t >= x) cur = i; });
      const base = { cx: 0.5, cy: 0.5, s: 1 };
      const a = cur > 0 ? this.steps[cur - 1].v : base, b = cur >= 0 ? this.steps[cur].v : base;
      const p = cur >= 0 ? eio(seg(t, T[cur], T[cur] + 1.1)) : 1;
      const s = a.s * Math.pow(b.s / a.s, p) * (1 + 0.015 * seg(t, 0, k.dur));
      const cx = lerp(a.cx, b.cx, p), cy = lerp(a.cy, b.cy, p);
      this.el.style.transform = 'translate(' + (SX + SW / 2 - s * cx * SW) + 'px,' + (SY + SH / 2 - s * cy * SH) + 'px) scale(' + s + ')';

      // spotlight: the hole slides from the previous box to the current one
      const st = cur >= 0 ? this.steps[cur] : null;
      const ha = cur > 0 ? this.steps[cur - 1].hole : st ? st.hole : [0, 0, 1, 1], hb = st ? st.hole : ha;
      const hp = cur > 0 ? p : 1, H = ha.map((v, i) => lerp(v, hb[i], hp));
      Object.assign(this.dim.style, { left: H[0] * SW + 'px', top: H[1] * SH + 'px', width: (H[2] - H[0]) * SW + 'px', height: (H[3] - H[1]) * SH + 'px' });
      // circles carry their own emphasis, so they lift the spotlight
      const on = (x) => (x && x.dim !== false && x.mark !== 'circle' ? 1 : 0);
      const prevOn = cur > 0 ? on(this.steps[cur - 1]) : 0;
      this.dim.style.opacity = cur < 0 ? 0 : lerp(prevOn, on(st), eo(seg(t, T[cur], T[cur] + 0.6)));

      // the current mark is full; older underlines and circles stay faintly, older highlights leave
      this.steps.forEach((x, i) => {
        if (!x.m) return;
        const d = eo(seg(t, T[i] + 0.5, T[i] + 1.1));
        const old = x.mark === 'hl' ? 0 : 0.35;
        const alpha = i > cur ? 0 : i === cur ? 1 : lerp(1, old, eo(seg(t, T[i + 1], T[i + 1] + 0.5)));
        if (x.m instanceof SVGElement) { x.m.setAttribute('stroke-dashoffset', 1 - d); x.m.style.opacity = alpha; }
        else { x.m.style.transform = 'scaleX(' + d + ')'; x.m.style.opacity = alpha; }
      });
      if (o.render) o.render.call(this, t, k);
    },
  });
};
