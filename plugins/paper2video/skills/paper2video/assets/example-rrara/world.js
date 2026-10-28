// RRARA's world: the HAZARD fire room (16 x 10 m, doorway wall at x = 10), the five target objects
// of the paper's appendix episode, fire spreading from two sources. Metres; x across, y deep.
window.WORLD = {
  w: 16, h: 10,
  walls: [[0, 0, 16, 0.22], [0, 9.78, 6.8, 10], [9.2, 9.78, 16, 10], [0, 0, 0.22, 10], [15.78, 0, 16, 10], [9.9, 0, 10.12, 4], [9.9, 6, 10.12, 10]],
  boxes: [[1, 0.5, 5.4, 1.3, 0.9], [3.4, 4.2, 6.6, 6, 0.75], [11, 0.7, 14.6, 3.3, 0.5]],
  // id: [x, y, value]  (56 bag and 62: value 5; 57 hairbrush, 64, 66: value 1)
  items: { 56: [2.6, 2.8, 5], 62: [13.4, 8.4, 5], 57: [13.2, 5.2, 1], 64: [7.4, 7.8, 1], 66: [4.6, 8.4, 1] },
  // fire intensity 0..1 at (x, y) for spread f (0 = start, 1 = late)
  fire(x, y, f) {
    const a = (0.4 + 3.4 * f - Math.hypot(x - 12.8, y - 1.6)) / 1.2, b = (2.6 * f - 0.6 - Math.hypot(x - 8.6, y - 4.4)) / 1.2;
    return Math.max(0, Math.min(1, Math.max(a, b)));
  },
};

// The room as every 3D scene of this film builds it, plus small helpers for labels on objects.
window.ROOM = {
  build(k, o) {
    o = o || {};
    const v = T3.view(k, { fov: o.fov || 38 }), r = T3.room(window.WORLD);
    v.add(r.group);
    const fire = T3.field(window.WORLD, 'main'); v.add(fire);
    const agent = T3.agent('accent'); v.add(agent);
    return { v, room: r, fire, agent };
  },
  // a .lab element; place(v, x, y, z) moves it over a world point
  label(k, text, style) {
    const el = k.h('<div class="lab"' + (style ? ' style="' + style + '"' : '') + '></div>'); el.textContent = text; k.stage.append(el);
    el.place = (v, x, y, z) => { const p = v.at(x, y, z == null ? 1 : z); el.style.left = p[0] + 'px'; el.style.top = p[1] + 'px'; };
    return el;
  },
  // walk a polyline: the point at fraction p of its length
  along(pts, p) {
    let L = 0; const seg = [];
    for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); L += l; }
    let d = L * Math.max(0, Math.min(1, p));
    for (let i = 0; i < seg.length; i++) {
      if (d <= seg[i] || i === seg.length - 1) { const u = Math.min(1, d / seg[i]); return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u]; }
      d -= seg[i];
    }
    return pts[pts.length - 1];
  },
};
