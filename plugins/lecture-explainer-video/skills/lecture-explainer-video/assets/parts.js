/* parts.js — small builders shared by the hand-made scenes. */
window.PARTS = {
  hash(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); },
  // a column of n cells; returns the cell elements. Place them with PARTS.place().
  col(k, n, vals, role) {
    return Array.from({ length: n }, (_, i) => {
      const c = k.h('<div class="cell"></div>');
      const v = vals ? vals[i] : 0.5;
      c.style.background = 'color-mix(in srgb, var(--' + (role || 'second') + ') ' + Math.round(15 + 70 * v) + '%, var(--ground))';
      k.stage.append(c); return c;
    });
  },
  // stack cells centred on (x, y); w[i] 0..1 lets a cell collapse out of the stack
  place(cells, x, y, w, H, G) {
    H = H || 40; G = G || 6;
    const ws = cells.map((_, i) => (w ? w[i] : 1));
    const tot = ws.reduce((a, b) => a + b * (H + G), 0) - G;
    let yy = y - tot / 2;
    const ys = [];
    cells.forEach((c, i) => {
      c.style.left = (x - 23) + 'px'; c.style.top = yy + 'px';
      c.style.height = H * ws[i] + 'px'; ys.push(yy + H * ws[i] / 2);
      yy += ws[i] * (H + G);
    });
    return ys;
  },
  // fade + rise for an element starting at a
  rise(k, el, t, a, dy) {
    const p = k.eo(k.seg(t, a, a + 0.5));
    el.style.opacity = p; el.style.transform = (el._tf || '') + ' translateY(' + (1 - p) * (dy == null ? 24 : dy) + 'px)';
  },
  // left-to-right "written on the board" reveal
  wipe(el, p) { el.style.clipPath = 'inset(-40% ' + ((1 - p) * 100).toFixed(2) + '% -40% -6%)'; },
};
