// The film's one world: a chain-of-thought laid out as a road of token tiles. A tile's height is its
// entropy; the few tall glowing ones are forking tokens, where faint alternative paths branch off.
// Learning signals fall on tiles as beams of light. Metres; x along the road, y across, z up.
// Token words come from the paper's appendix CoT (Fig. 13); the heights are illustrative (예시).
(function () {
  const lerp = (a, b, p) => a + (b - a) * p, c01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
  // [word, illustrative entropy 0..1, fork]
  const SEQ = [['that', 0.05], ['seems', 0.18], ['impossible', 0.04], ['.', 0.1], ['Wait', 0.95, 1], [',', 0.03], ['but', 0.72, 1],
    ['maybe', 0.85, 1], ['the', 0.08], ['list', 0.03], ['has', 0.15], ['duplicates', 0.06], ['?', 0.12], ['Wait', 0.9, 1], [',', 0.02],
    ['hold', 0.22], ['on', 0.01], ['.', 0.04], ['For', 0.3], ['example', 0.02], [',', 0.03], ['suppose', 0.8, 1], ['the', 0.06], ['list', 0.02], ['is', 0.1]];
  const STEP = 1.25, Y = (i) => 1.1 * Math.sin(i * 0.23), TOP = (h) => 0.12 + 3.0 * h;
  let BOXG = null;
  const boxG = () => { if (!BOXG) { BOXG = new THREE.BoxGeometry(0.92, 1, 0.92); BOXG.translate(0, 0.5, 0); } return BOXG; };
  const lowC = () => T3.color('ground').clone().lerp(T3.color('second'), 0.3);

  // one tile: .setH(h) sets its height, .tint(role or THREE.Color, glow) its colour
  function tile(x, y, h, fork) {
    const m = new THREE.Mesh(boxG(), new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.1 }));
    const t = { m, x, y, h, fork: !!fork };
    t.setH = (hh) => { t.h = hh; t.top = TOP(hh); m.scale.set(1, t.top, 1); m.position.copy(T3.v3(x, y, 0)); };
    t.tint = (c, glow) => { const col = c && c.isColor ? c : c ? T3.color(c) : lowC(); m.material.color.copy(col); m.material.emissive.copy(col); m.material.emissiveIntensity = glow == null ? 0.08 : glow; };
    t.setH(h); t.tint(fork ? 'accent' : null, fork ? 0.4 : 0.08);
    return t;
  }

  // a light column falling from the sky onto (x, y, top); p 0..1 = how far down it has reached
  function beam(role) {
    const g = new THREE.CylinderGeometry(0.13, 0.13, 1, 14, 1, true); g.translate(0, 0.5, 0);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: T3.color(role || 'accent'), transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.36, 0.56, 32), new THREE.MeshBasicMaterial({ color: T3.color(role || 'accent'), transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    const grp = new THREE.Group(); grp.add(m, ring);
    grp.set = (x, y, top, p, a) => {
      const sky = top + 7, bot = lerp(sky, top, c01(p));
      grp.visible = p > 0.001 && (a == null || a > 0.01);
      m.position.copy(T3.v3(x, y, bot)); m.scale.set(1, Math.max(0.001, sky - bot), 1);
      ring.position.copy(T3.v3(x, y, top + 0.02)); ring.visible = p >= 0.999;
      m.material.opacity = 0.55 * (a == null ? 1 : a); ring.material.opacity = 0.8 * (a == null ? 1 : a);
    };
    return grp;
  }

  // floor: dark plane with a faint grid
  function floor(cx, cy, size) {
    const g = new THREE.Group(), ink = T3.color('second'), gr = T3.color('ground');
    const f = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshStandardMaterial({ color: gr.clone().lerp(ink, 0.05), roughness: 1 }));
    f.rotation.x = -Math.PI / 2; f.position.copy(T3.v3(cx, cy, -0.01)); g.add(f);
    const grid = new THREE.GridHelper(size, size / 1.25, ink, ink); grid.material.transparent = true; grid.material.opacity = 0.05;
    grid.position.copy(T3.v3(cx, cy, 0)); g.add(grid);
    return g;
  }

  // a translucent horizontal plane at height z (the entropy threshold)
  function plane(x0, y0, x1, y1, z, role) {
    const g = new THREE.Group(), col = T3.color(role || 'second');
    const p = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, y1 - y0), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide }));
    p.rotation.x = -Math.PI / 2; g.add(p);
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(x1 - x0, y1 - y0)), new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.7 }));
    e.rotation.x = -Math.PI / 2; g.add(e);
    g.position.copy(T3.v3((x0 + x1) / 2, (y0 + y1) / 2, z));
    g.setZ = (zz) => g.position.copy(T3.v3((x0 + x1) / 2, (y0 + y1) / 2, zz));
    return g;
  }

  // the reasoning road: tiles for SEQ, a goal block at the end, two ghost branches at every fork
  function road() {
    const group = new THREE.Group(), tiles = [], branches = [];
    SEQ.forEach(([w, h, f], i) => { const t = tile(i * STEP, Y(i), h, f); t.word = w; t.i = i; tiles.push(t); group.add(t.m); });
    tiles.forEach((t) => {
      if (!t.fork) return;
      const sides = [];
      for (const s of [-1, 1]) {
        const pts = [];
        for (let j = 0; j <= 10; j++) { const u = j / 10; pts.push([t.x + u * 4.2, t.y + s * (0.7 + 2.6 * u * u)]); }
        const r = T3.route(pts, 'accent', 0.12); group.add(r); sides.push(r);
      }
      branches.push({ t, sides });
    });
    const gx = SEQ.length * STEP + 0.6, gy = Y(SEQ.length);
    const goal = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), new THREE.MeshStandardMaterial({ color: T3.color('second'), roughness: 0.4, emissive: T3.color('second'), emissiveIntensity: 0.05 }));
    goal.position.copy(T3.v3(gx, gy, 0.75)); group.add(goal);
    const beams = tiles.map(() => { const b = beam('accent'); group.add(b); b.visible = false; return b; });
    return {
      group, tiles, branches, goal, beams, gx, gy,
      // p 0..1 grows every fork's branches; a its opacity
      fork(p, a) { branches.forEach((b) => b.sides.forEach((r) => { r.progress(p); T3.fade(r, (a == null ? 1 : a) * 0.75); r.visible = p > 0.001; })); },
      // shine a beam on tile i with progress p (role recolours it)
      shine(i, p, role, a) {
        const b = beams[i], t = tiles[i];
        if (role) { const c = T3.color(role); b.children[0].material.color.copy(c); b.children[1].material.color.copy(c); }
        b.set(t.x, t.y, t.top, p, a);
      },
    };
  }

  // a batch: rows of responses, n tokens each; heights from a seeded generator with a heavy low tail
  function batch(rows, n, seed) {
    const r = T3.rng(seed || 11), group = new THREE.Group(), tiles = [];
    for (let row = 0; row < rows; row++) {
      for (let i = 0; i < n; i++) {
        const u = r(), h = u > 0.8 ? 0.55 + 0.45 * r() : u > 0.5 ? 0.06 + 0.22 * r() : 0.01 + 0.03 * r();
        const t = tile(i * 1.15, row * 1.7, h, false); t.row = row; t.i = i; tiles.push(t); group.add(t.m);
      }
    }
    const sorted = tiles.map((t) => t.h).sort((a, b) => a - b), cut = sorted[Math.floor(sorted.length * 0.8)];
    tiles.forEach((t) => { t.fork = t.h >= cut; });
    return { group, tiles, cut, cutTop: TOP(cut), w: (n - 1) * 1.15, d: (rows - 1) * 1.7 };
  }

  // HTML label riding on a world point; a = opacity
  function pin(v, el, x, y, z, a) {
    const p = v.at(x, y, z);
    el.style.left = p[0] + 'px'; el.style.top = p[1] + 'px';
    el.style.opacity = p[3] ? (a == null ? 1 : a) : 0;
  }

  window.FORK = { SEQ, STEP, Y, TOP, tile, beam, floor, plane, road, batch, pin, lowC };
})();
