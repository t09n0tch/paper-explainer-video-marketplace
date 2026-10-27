/* engine.js — helpers shared by every scene of a paper-explainer film.
 *
 * Everything here is a pure function of the values passed in, so a scene's
 * render(t) stays deterministic (same t -> same picture), which is what lets
 * render.py export frames in any order.
 *
 *   ENG.seg(t, a, b)        0..1 progress of t across [a, b]
 *   ENG.eo / ei / eio / eob easing (cubic out / in / in-out / back-out)
 *   ENG.lerp(a, b, p)
 *   ENG.fadeWords(el, t, t0) word-by-word entrance for a line of text
 *   ENG.W3                  pseudo-3D (orthographic, tilted) box world on a <canvas>
 */
(function () {
  const c01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
  const seg = (t, a, b) => c01((t - a) / (b - a));
  const lerp = (a, b, p) => a + (b - a) * p;
  const eo = (x) => 1 - Math.pow(1 - c01(x), 3);
  const ei = (x) => Math.pow(c01(x), 3);
  const eio = (x) => { x = c01(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const eob = (x, s) => { x = c01(x); s = s == null ? 1.6 : s; const c3 = s + 1; return 1 + c3 * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2); };

  // Word-by-word entrance from the right. Splits the element's text once.
  function fadeWords(el, t, t0, o) {
    o = o || {};
    const stagger = o.stagger == null ? 0.11 : o.stagger, dur = o.dur || 0.5, dx = o.dx == null ? 26 : o.dx;
    if (!el._words) {
      const words = el.textContent.split(' ');
      el.textContent = '';
      el._words = words.map((w, i) => {
        const s = document.createElement('span');
        s.textContent = w + (i < words.length - 1 ? ' ' : '');
        s.style.display = 'inline-block'; s.style.whiteSpace = 'pre';
        el.appendChild(s); return s;
      });
    }
    el._words.forEach((s, i) => {
      const p = eo(seg(t, t0 + i * stagger, t0 + i * stagger + dur));
      s.style.opacity = p; s.style.transform = 'translateX(' + (1 - p) * dx + 'px)';
    });
  }

  const hex = (h) => { h = String(h).trim().replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
  const mix = (a, b, p) => [0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * p);
  const css = (c, al) => 'rgba(' + c.map(Math.round).join(',') + ',' + (al == null ? 1 : al) + ')';

  /* W3 — a tilted, orthographic "3D" world of boxes, drawn on a canvas.
   *
   * world = {
   *   w, h,                          floor size in metres (x across, y deep)
   *   walls: [[x0,y0,x1,y1,height]], opaque wall boxes
   *   boxes: [[x0,y0,x1,y1,height]], furniture / buildings
   *   items: { id: [x, y, value] }   small objects; value >= 5 draws bright
   * }
   * state = {
   *   cam,                           W3.cam({...}) — x,y look-at, yaw, pitch, zoom (px per m), sx,sy screen centre
   *   t,                             seconds, drives flicker
   *   field: (x,y) => 0..1,          optional hazard field (fire, water...) drawn as voxel columns
   *   fieldColor: 'main'|'accent',   colour role of the hazard
   *   items: { id: { st:'ok'|'dmg'|'gone', sc } },
   *   agent: { x, y, sc, think },    think 0..1 draws a progress ring above the agent
   *   routes: [{ pts:[[x,y]..], p, col:'accent'|'main'|'dim', dash, a, w }],
   *   alpha
   * }
   * Painter's sort by depth; good enough for rooms, streets and maps.
   */
  const W3 = {
    pal(rootEl) {
      const s = getComputedStyle(rootEl || document.documentElement);
      const g = (n, d) => hex((s.getPropertyValue(n) || '').trim() || d);
      return { ground: g('--ground', '#14161C'), main: g('--main', '#F08A3C'), second: g('--second', '#EDE8E0'), accent: g('--accent', '#5CC8C2') };
    },
    canvas(cls) {
      const c = document.createElement('canvas');
      c.width = 1920; c.height = 1080; c.className = 'w3 ' + (cls || '');
      c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
      return c;
    },
    cam(o) { return Object.assign({ x: 8, y: 5, yaw: -0.62, pitch: 0.82, zoom: 74, sx: 960, sy: 520 }, o || {}); },
    lerpCam(a, b, p) { const o = {}; for (const k in a) o[k] = k === 'zoom' ? a[k] * Math.pow(b[k] / a[k], p) : a[k] + (b[k] - a[k]) * p; return o; },
    at(c, x, y, z) {
      const dx = x - c.x, dy = y - c.y, cs = Math.cos(c.yaw), sn = Math.sin(c.yaw);
      const X = dx * cs - dy * sn, Y = dx * sn + dy * cs;
      return [c.sx + X * c.zoom, c.sy + (Y * Math.sin(c.pitch) - (z || 0) * Math.cos(c.pitch)) * c.zoom, Y];
    },
    // walk a polyline: returns the point at distance d from its start
    walk(P, d) {
      for (let i = 1; i < P.length; i++) {
        const L = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
        if (d <= L || i === P.length - 1) { const u = c01(d / (L || 1)); return [lerp(P[i - 1][0], P[i][0], u), lerp(P[i - 1][1], P[i][1], u)]; }
        d -= L;
      }
      return P[P.length - 1];
    },
    draw(ctx, P, world, s) {
      const c = s.cam, t = s.t || 0;
      ctx.clearRect(0, 0, 1920, 1080);
      ctx.save();
      ctx.globalAlpha = s.alpha == null ? 1 : s.alpha;
      const poly = (pts, fill) => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); };
      const A = (x, y, z) => W3.at(c, x, y, z);
      const W = world.w, H = world.h;
      poly([A(0, 0, 0), A(W, 0, 0), A(W, H, 0), A(0, H, 0)], css(mix(P.ground, P.second, 0.07)));
      ctx.lineWidth = 1; ctx.strokeStyle = css(P.second, 0.07);
      for (let i = 1; i < W; i++) { const a = A(i, 0, 0), b = A(i, H, 0); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
      for (let j = 1; j < H; j++) { const a = A(0, j, 0), b = A(W, j, 0); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
      const hz = s.fieldColor === 'accent' ? P.accent : P.main;
      const cells = [];
      if (s.field) {
        for (let x = 0.25; x < W; x += 0.5) for (let y = 0.25; y < H; y += 0.5) {
          const h = s.field(x, y);
          if (h <= 0.02) continue;
          poly([A(x - 0.25, y - 0.25, 0), A(x + 0.25, y - 0.25, 0), A(x + 0.25, y + 0.25, 0), A(x - 0.25, y + 0.25, 0)], css(hz, 0.12 + 0.3 * h));
          if (h > 0.25) cells.push([x, y, h]);
        }
      }
      for (const r of s.routes || []) {
        const col = r.col === 'main' ? P.main : r.col === 'dim' ? mix(P.second, P.ground, 0.5) : P.accent;
        let L = 0; const sg = [];
        for (let i = 1; i < r.pts.length; i++) { const l = Math.hypot(r.pts[i][0] - r.pts[i - 1][0], r.pts[i][1] - r.pts[i - 1][1]); sg.push(l); L += l; }
        let left = L * c01(r.p == null ? 1 : r.p);
        ctx.beginPath();
        const p0 = A(r.pts[0][0], r.pts[0][1], 0.03); ctx.moveTo(p0[0], p0[1]);
        for (let i = 1; i < r.pts.length && left > 0; i++) {
          const u = Math.min(1, left / sg[i - 1]); left -= sg[i - 1];
          const q = A(lerp(r.pts[i - 1][0], r.pts[i][0], u), lerp(r.pts[i - 1][1], r.pts[i][1], u), 0.03);
          ctx.lineTo(q[0], q[1]);
        }
        ctx.setLineDash(r.dash ? [10, 14] : []);
        ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = r.w || 7; ctx.strokeStyle = css(col, r.a == null ? 1 : r.a); ctx.stroke();
        ctx.setLineDash([]);
      }
      const D = [];
      const box = (x0, y0, x1, y1, h, top, side) => {
        const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
        D.push({ d: A(cx, cy, 0)[2] + 0.001 * h, f: () => {
          const cr = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], faces = [];
          for (let i = 0; i < 4; i++) { const a = cr[i], b = cr[(i + 1) % 4]; faces.push([A((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0)[2], a, b, i]); }
          faces.sort((p, q) => p[0] - q[0]);
          for (const fc of faces) poly([A(fc[1][0], fc[1][1], 0), A(fc[2][0], fc[2][1], 0), A(fc[2][0], fc[2][1], h), A(fc[1][0], fc[1][1], h)], css(mix(P.ground, side, fc[3] % 2 ? 0.78 : 0.62)));
          poly(cr.map((p) => A(p[0], p[1], h)), css(top));
        } });
      };
      // long boxes are cut into ~1 m pieces so the depth sort stays right next to small things
      const long = (x0, y0, x1, y1, h, top, side) => {
        const nx = Math.max(1, Math.ceil((x1 - x0) / 1.0)), ny = Math.max(1, Math.ceil((y1 - y0) / 1.0));
        for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++)
          box(lerp(x0, x1, i / nx), lerp(y0, y1, j / ny), lerp(x0, x1, (i + 1) / nx), lerp(y0, y1, (j + 1) / ny), h, top, side);
      };
      for (const w of world.walls || []) long(w[0], w[1], w[2], w[3], w[4] == null ? 1 : w[4], mix(P.second, P.ground, 0.15), P.second);
      for (const b of world.boxes || []) long(b[0], b[1], b[2], b[3], b[4] == null ? 0.8 : b[4], mix(P.ground, P.second, 0.26), mix(P.ground, P.second, 0.45));
      for (const cl of cells) {
        const ph = Math.abs(Math.sin(cl[0] * 12.9898 + cl[1] * 78.233)) * 6.28;
        const hh = 0.15 + 1.5 * cl[2] * (0.82 + 0.18 * Math.sin(t * 5.2 + ph));
        box(cl[0] - 0.19, cl[1] - 0.19, cl[0] + 0.19, cl[1] + 0.19, hh, mix(hz, P.second, 0.45 * cl[2]), hz);
      }
      const items = s.items || {};
      for (const id in items) {
        const it = items[id], w = (world.items || {})[id];
        if (!w || it.st === 'gone' || (it.sc != null && it.sc <= 0.01)) continue;
        const sc = it.sc == null ? 1 : it.sc, r = 0.3 * sc;
        const top = it.st === 'dmg' ? mix(P.main, P.ground, 0.35) : w[2] >= 5 ? P.second : mix(P.second, P.ground, 0.45);
        box(w[0] - r, w[1] - r, w[0] + r, w[1] + r, 0.5 * sc, top, top);
      }
      if (s.agent) {
        const g = s.agent, k = g.sc == null ? 1 : g.sc, r = 0.34 * k;
        if (r > 0.01) {
          const sh = A(g.x, g.y, 0);
          D.push({ d: sh[2] + 0.002, f: () => { ctx.beginPath(); ctx.ellipse(sh[0], sh[1], r * c.zoom * 1.2, r * c.zoom * 1.2 * Math.sin(c.pitch), 0, 0, 6.2832); ctx.fillStyle = css(P.ground, 0.5); ctx.fill(); } });
          box(g.x - r, g.y - r, g.x + r, g.y + r, 0.8 * k, mix(P.accent, P.second, 0.35), P.accent);
        }
      }
      D.sort((p, q) => p.d - q.d);
      for (const d of D) d.f();
      if (s.agent && s.agent.think) {
        const g = s.agent, p = A(g.x, g.y, 1.7);
        ctx.beginPath(); ctx.arc(p[0], p[1], 34, 0, 6.2832); ctx.strokeStyle = css(P.second, 0.18); ctx.lineWidth = 6; ctx.stroke();
        ctx.beginPath(); ctx.arc(p[0], p[1], 34, -1.5708, -1.5708 + 6.2832 * c01(g.think)); ctx.strokeStyle = css(P.accent); ctx.lineCap = 'round'; ctx.stroke();
      }
      ctx.restore();
    },
  };

  window.ENG = { c01, seg, lerp, eo, ei, eio, eob, fadeWords, W3, mix, hex, css };
})();
