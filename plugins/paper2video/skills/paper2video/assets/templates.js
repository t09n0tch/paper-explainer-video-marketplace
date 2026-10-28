/* templates.js — ready-made scenes for the shots every paper film needs.
 *
 *   SCENE('results', TPL.bars({ title: '...', rows: [...], src: 'Table 2', at: 1 }));
 *   SCENE('method', TPL.compose(TPL.flow({...}), TPL.cards({...})));
 *
 * Every template returns a scene definition ({init, render}) and times itself from the
 * narration: `at` is a caption index (the beat starts 0.3 s after that sentence starts),
 * an array of indices (one per item), or { t: seconds }. Values are written once as text and
 * fade in with their mark (no counting up), so the on-screen check sees the real number.
 *
 * Colour roles everywhere: 'main' (problem, loss), 'accent' (the method, our result),
 * 'second' (ink, neutral), 'dim' (baselines, context).
 *
 *   title({ tag, title, sub, note })
 *   bars({ title, rows: [{label, value, role, note, text}], max, digits, unit, lowerBetter, sortAt, src, at })   text: shown instead of the formatted value ("77%p")
 *   groupBars({ title, groups: [label], series: [{name, role}], values: [[per series] per group], max, digits, src, at })
 *   line({ title, series: [{name, role, pts: [[x, y]]}], x: [min, max], y: [min, max], xTicks, yTicks, xLabel, yLabel, logX, src, at })
 *   flow({ title, boxes: [{text, sub, role}], src, at })            left-to-right pipeline, one box per beat
 *   cards({ title, items: [{head, body, role}], cols, src, at })
 *   table({ title, cols: [..], rows: [[..]], hl: rowIndex, src, at })
 *   split({ title, parts: [{label, value, role}], total, unit, digits, src, at })   one bar cut into parts
 *   formula({ terms: [[latex, label, role]], swap: { at, terms: [latex] }, size, src, at })
 *   lanes({ lanes: [{label, spans: [[t0, t1, text, role]]}], range: [a, b], playhead: true, src, at })
 *   end({ title, lines: [..], note })
 *   compose(...defs)                                                  several templates in one scene
 * Optional on all: box: [x, y, w, h] (default [140, 150, 1640, 700], above the caption band); titleAt: caption index
 * for the title (default: the scene start), so a chart title doesn't wait over an empty chart.
 *
 * The template set follows SunandBean/paper2video engine/templates.js (MIT, Sunbin Kim).
 */
(function () {
  const E = () => window.ENG;
  const ROLE = { main: 'var(--main)', accent: 'var(--accent)', second: 'var(--second)', dim: 'color-mix(in srgb, var(--second) 34%, var(--ground))' };
  const col = (r) => ROLE[r] || r || ROLE.second;
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const BOX = [140, 150, 1640, 700];
  const fmt = (v, d, u) => (typeof v === 'number' ? v.toLocaleString('en-US', { minimumFractionDigits: d == null ? (Math.abs(v) < 10 ? 2 : 1) : d, maximumFractionDigits: d == null ? (Math.abs(v) < 10 ? 2 : 1) : d }) : String(v)) + (u || '');
  // cue time for item i: `at` may be an index, an array of indices, or {t: seconds}
  function cue(k, at, i, step) {
    if (at && typeof at === 'object' && !Array.isArray(at)) return at.t + (i || 0) * (step || 0.35);
    const idx = Array.isArray(at) ? at[Math.min(i || 0, at.length - 1)] : at || 0;
    const c = k.caps[Math.min(idx, k.caps.length - 1)];
    return (c ? c.t0 : 0) + 0.3 + (Array.isArray(at) ? 0 : (i || 0) * (step || 0.3));
  }
  const appear = (el, p, dy) => { el.style.opacity = p; el.style.transform = 'translateY(' + (1 - p) * (dy == null ? 18 : dy) + 'px)'; };
  function frame(o, k, html) {
    const b = o.box || BOX, root = k.h('<div style="position:absolute;left:' + b[0] + 'px;top:' + b[1] + 'px;width:' + b[2] + 'px;height:' + b[3] + 'px">' + html + '</div>');
    if (!o._bare && !k._bare) k.stage.append(k.h('<div class="ground"><div class="grid"></div></div>'));
    k.stage.append(root);
    return root;
  }
  const head = (o) => (o.title ? '<h3 class="tp-title" style="margin:0;font-size:46px;font-weight:700;line-height:1.2">' + esc(o.title) + '</h3>' : '');
  const src = (o) => (o.src ? '<div class="src tp-src" style="position:absolute;right:0;bottom:0">' + esc(o.src) + '</div>' : '');
  // title fades word by word, source line fades last; shared by most templates
  function chrome(self, t, k, o, last) {
    if (self.tt) k.fadeWords(self.tt, t, o.titleAt != null ? Math.max(0.2, cue(k, o.titleAt, 0) - 0.5) : 0.3);   // the title sets the scene unless titleAt ties it to a sentence
    if (self.sr) self.sr.style.opacity = E().eo(E().seg(t, last + 0.4, last + 0.9));
  }

  const TPL = {};

  TPL.title = (o) => ({
    init(k) {
      const r = frame(o, k, '<div class="words" style="left:0;top:180px">' + (o.tag ? '<div class="tag">' + esc(o.tag) + '</div>' : '') +
        '<h1 class="big">' + esc(o.title) + '</h1>' + (o.sub ? '<div class="sub">' + esc(o.sub) + '</div>' : '') + (o.note ? '<div class="small">' + esc(o.note) + '</div>' : '') + '</div>');
      this.el = [...r.querySelectorAll('.words > *')];
    },
    render(t, k) { this.el.forEach((e, i) => appear(e, E().eo(E().seg(t, 0.3 + i * 0.35, 0.9 + i * 0.35)))); },
  });

  TPL.bars = (o) => ({
    init(k) {
      const rows = o.rows, max = o.max || Math.max(...rows.map((r) => r.value)) * 1.08, b = o.box || BOX;
      const top = o.title ? 110 : 20, rh = Math.min(110, (b[3] - top - 60) / rows.length), lw = 340, bw = b[2] - lw - 200;
      let html = head(o);
      rows.forEach((r, i) => {
        html += '<div class="tp-row" style="position:absolute;left:0;top:' + (top + i * rh) + 'px;width:100%;height:' + rh + 'px">' +
          '<div class="tp-lb" style="position:absolute;left:0;top:' + (rh / 2 - 22) + 'px;width:' + (lw - 30) + 'px;font-size:32px;font-weight:700;text-align:right;color:' + (r.role === 'dim' ? col('dim') : col('second')) + '">' + esc(r.label) +
          (r.note ? '<div class="small" style="font-size:20px;font-weight:400">' + esc(r.note) + '</div>' : '') + '</div>' +
          '<div class="tp-bar" style="position:absolute;left:' + lw + 'px;top:' + (rh / 2 - 24) + 'px;height:48px;width:' + bw + 'px;border-radius:10px;transform-origin:0 50%;background:' + col(r.role || 'dim') + '"></div>' +
          '<div class="num tp-val" style="position:absolute;left:' + lw + 'px;top:' + (rh / 2 - 22) + 'px;font-size:34px;font-weight:700">' + esc(r.text != null ? r.text : fmt(r.value, o.digits, o.unit)) + '</div></div>';
      });
      if (o.lowerBetter != null) html += '<div class="small" style="position:absolute;left:' + lw + 'px;top:' + (top - 46) + 'px">' + (o.lowerBetter ? '낮을수록 좋음' : '높을수록 좋음') + '</div>';
      const r = frame(o, k, html + src(o));
      Object.assign(this, { r, rh, top, max, bw, lw, lb: [...r.querySelectorAll('.tp-lb')], row: [...r.querySelectorAll('.tp-row')], bar: [...r.querySelectorAll('.tp-bar')], val: [...r.querySelectorAll('.tp-val')], tt: r.querySelector('.tp-title'), sr: r.querySelector('.tp-src') });
      const ord = rows.map((x, i) => i).sort((a, c) => (o.lowerBetter ? rows[a].value - rows[c].value : rows[c].value - rows[a].value));
      this.rank = []; ord.forEach((ri, pos) => { this.rank[ri] = pos; });
    },
    render(t, k) {
      const { eo, eio, seg, lerp } = E();
      let last = 0;
      o.rows.forEach((r, i) => {
        const t0 = cue(k, o.at, i, 0.35), g = eo(seg(t, t0, t0 + 0.9)), w = r.value / this.max * g;
        last = Math.max(last, t0 + 0.9);
        this.bar[i].style.transform = 'scaleX(' + Math.max(0.0001, w) + ')';
        this.val[i].style.opacity = eo(seg(t, t0 + 0.5, t0 + 0.9));
        this.val[i].style.transform = 'translateX(' + (w * this.bw + 18) + 'px)';
        this.lb[i].style.opacity = eo(seg(t, t0 - 0.2, t0 + 0.3));
        const s = o.sortAt != null ? eio(seg(t, cue(k, o.sortAt, 0), cue(k, o.sortAt, 0) + 0.9)) : 0;
        this.row[i].style.top = lerp(this.top + i * this.rh, this.top + this.rank[i] * this.rh, s) + 'px';
      });
      chrome(this, t, k, o, last);
    },
  });

  TPL.groupBars = (o) => ({
    init(k) {
      const b = o.box || BOX, G = o.groups.length, S = o.series.length, top = o.title ? 170 : 60, bottom = b[3] - 90;
      const max = o.max || Math.max(...o.values.flat()) * 1.1, gw = (b[2] - 120) / G, bw = Math.min(90, (gw - 60) / S);
      let html = head(o) + '<div style="position:absolute;right:0;top:' + (o.title ? 70 : 0) + 'px;display:flex;gap:28px">' +
        o.series.map((s) => '<span class="small" style="display:flex;align-items:center;gap:10px"><i style="width:22px;height:22px;border-radius:5px;background:' + col(s.role) + '"></i>' + esc(s.name) + '</span>').join('') + '</div>';
      o.groups.forEach((g, gi) => {
        const x0 = 120 + gi * gw + (gw - bw * S) / 2;
        html += '<div style="position:absolute;left:' + (120 + gi * gw) + 'px;top:' + (bottom + 16) + 'px;width:' + gw + 'px;text-align:center;font-size:28px;font-weight:700">' + esc(g) + '</div>';
        o.series.forEach((s, si) => {
          const h = o.values[gi][si] / max * (bottom - top);
          html += '<div class="tp-gb" style="position:absolute;left:' + (x0 + si * bw) + 'px;top:' + (bottom - h) + 'px;width:' + (bw - 8) + 'px;height:' + h + 'px;border-radius:8px 8px 0 0;transform-origin:50% 100%;background:' + col(s.role) + '"></div>' +
            '<div class="num tp-gv" style="position:absolute;left:' + (x0 + si * bw - 20) + 'px;top:' + (bottom - h - 40) + 'px;width:' + (bw + 32) + 'px;text-align:center;font-size:24px;font-weight:700">' + esc(fmt(o.values[gi][si], o.digits, o.unit)) + '</div>';
        });
      });
      html += '<div style="position:absolute;left:100px;right:0;top:' + bottom + 'px;height:2px;background:' + col('dim') + '"></div>';
      const r = frame(o, k, html + src(o));
      Object.assign(this, { gb: [...r.querySelectorAll('.tp-gb')], gv: [...r.querySelectorAll('.tp-gv')], tt: r.querySelector('.tp-title'), sr: r.querySelector('.tp-src') });
    },
    render(t, k) {
      const { eo, seg } = E(), S = o.series.length;
      let last = 0;
      this.gb.forEach((el, j) => {
        const gi = Math.floor(j / S), t0 = cue(k, o.at, gi, 0.4) + (j % S) * 0.12, g = eo(seg(t, t0, t0 + 0.8));
        el.style.transform = 'scaleY(' + Math.max(0.0001, g) + ')'; this.gv[j].style.opacity = eo(seg(t, t0 + 0.5, t0 + 0.9)); last = Math.max(last, t0 + 0.9);
      });
      chrome(this, t, k, o, last);
    },
  });

  TPL.line = (o) => ({
    init(k) {
      const b = o.box || BOX, top = o.title ? 120 : 30, L = 110, Wd = b[2] - L - 220, Hd = b[3] - top - 90;
      const X = o.x || [Math.min(...o.series.flatMap((s) => s.pts.map((p) => p[0]))), Math.max(...o.series.flatMap((s) => s.pts.map((p) => p[0])))];
      const Y = o.y || [0, Math.max(...o.series.flatMap((s) => s.pts.map((p) => p[1]))) * 1.1];
      const fx = (x) => L + (o.logX ? (Math.log(x) - Math.log(X[0])) / (Math.log(X[1]) - Math.log(X[0])) : (x - X[0]) / (X[1] - X[0])) * Wd;
      const fy = (y) => top + Hd - (y - Y[0]) / (Y[1] - Y[0]) * Hd;
      let svg = '<svg class="art" viewBox="0 0 ' + b[2] + ' ' + b[3] + '" style="position:absolute;inset:0">' +
        '<line x1="' + L + '" y1="' + (top + Hd) + '" x2="' + (L + Wd) + '" y2="' + (top + Hd) + '" stroke="' + col('dim') + '" stroke-width="2"/>' +
        '<line x1="' + L + '" y1="' + top + '" x2="' + L + '" y2="' + (top + Hd) + '" stroke="' + col('dim') + '" stroke-width="2"/>';
      o.series.forEach((s) => {
        svg += '<polyline class="tp-ln" fill="none" stroke="' + col(s.role) + '" stroke-width="6" stroke-linejoin="round" stroke-linecap="round" points="' + s.pts.map((p) => fx(p[0]) + ',' + fy(p[1])).join(' ') + '"/>';
      });
      svg += '</svg>';
      let html = head(o) + svg;
      (o.xTicks || []).forEach((x) => { html += '<div class="small num" style="position:absolute;left:' + (fx(x) - 60) + 'px;top:' + (top + Hd + 10) + 'px;width:120px;text-align:center">' + esc(x) + '</div>'; });
      (o.yTicks || []).forEach((y) => { html += '<div class="small num" style="position:absolute;left:0;top:' + (fy(y) - 18) + 'px;width:' + (L - 16) + 'px;text-align:right">' + esc(y) + '</div>'; });
      if (o.xLabel) html += '<div class="small" style="position:absolute;left:' + L + 'px;top:' + (top + Hd + 50) + 'px;width:' + Wd + 'px;text-align:center">' + esc(o.xLabel) + '</div>';
      if (o.yLabel) html += '<div class="small" style="position:absolute;left:' + L + 'px;top:' + (top - 40) + 'px">' + esc(o.yLabel) + '</div>';
      o.series.forEach((s) => {
        const p = s.pts[s.pts.length - 1];
        html += '<div class="tp-le" style="position:absolute;left:' + (fx(p[0]) + 18) + 'px;top:' + (fy(p[1]) - 22) + 'px;font-size:28px;font-weight:700;color:' + col(s.role) + ';white-space:nowrap">' + esc(s.name) + ' <span class="num">' + esc(s.endLabel != null ? s.endLabel : p[1]) + '</span></div>';
      });
      const r = frame(o, k, html + src(o));
      Object.assign(this, { ln: [...r.querySelectorAll('.tp-ln')], le: [...r.querySelectorAll('.tp-le')], tt: r.querySelector('.tp-title'), sr: r.querySelector('.tp-src') });
      this.len = this.ln.map((l) => { let d = 0; const P = l.getAttribute('points').split(' ').map((q) => q.split(',').map(Number)); for (let i = 1; i < P.length; i++) d += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); return d; });
    },
    render(t, k) {
      const { eio, eo, seg } = E();
      let last = 0;
      this.ln.forEach((l, i) => {
        const t0 = cue(k, o.at, i, 0.6), p = eio(seg(t, t0, t0 + 1.4));
        l.style.strokeDasharray = this.len[i]; l.style.strokeDashoffset = this.len[i] * (1 - p);
        this.le[i].style.opacity = eo(seg(t, t0 + 1.2, t0 + 1.6)); last = Math.max(last, t0 + 1.6);
      });
      chrome(this, t, k, o, last);
    },
  });

  TPL.flow = (o) => ({
    init(k) {
      const b = o.box || BOX, n = o.boxes.length, gap = 70, bw = (b[2] - gap * (n - 1)) / n, top = o.title ? 230 : 140;
      let html = head(o);
      o.boxes.forEach((x, i) => {
        const left = i * (bw + gap);
        html += '<div class="card tp-fb" style="left:' + left + 'px;top:' + top + 'px;width:' + bw + 'px;min-height:200px;border-color:' + col(x.role || 'dim') + ';border-width:2.5px">' +
          '<h4 style="color:' + col(x.role || 'second') + '">' + esc(x.text) + '</h4>' + (x.sub ? '<div class="small">' + esc(x.sub) + '</div>' : '') + '</div>';
        if (i < n - 1) html += '<div class="tp-fa" style="position:absolute;left:' + (left + bw + 10) + 'px;top:' + (top + 84) + 'px;width:' + (gap - 20) + 'px;height:4px;background:' + col('dim') + ';transform-origin:0 50%">' +
          '<i style="position:absolute;right:-4px;top:-9px;border:11px solid transparent;border-left:14px solid ' + col('dim') + ';border-right:0"></i></div>';
      });
      const r = frame(o, k, html + src(o));
      Object.assign(this, { fb: [...r.querySelectorAll('.tp-fb')], fa: [...r.querySelectorAll('.tp-fa')], tt: r.querySelector('.tp-title'), sr: r.querySelector('.tp-src') });
    },
    render(t, k) {
      const { eo, eob, seg } = E();
      let last = 0;
      this.fb.forEach((el, i) => {
        const t0 = cue(k, o.at, i, 0.5), p = seg(t, t0, t0 + 0.5);
        el.style.opacity = eo(p); el.style.transform = 'scale(' + (0.92 + 0.08 * eob(p, 1.4)) + ')'; last = Math.max(last, t0 + 0.5);
        if (this.fa[i - 1]) this.fa[i - 1].style.transform = 'scaleX(' + Math.max(0.0001, eo(seg(t, t0 - 0.35, t0))) + ')';
      });
      chrome(this, t, k, o, last);
    },
  });

  TPL.cards = (o) => ({
    init(k) {
      const b = o.box || BOX, n = o.items.length, cols = o.cols || Math.min(n, 3), rows = Math.ceil(n / cols), gap = 36, top = o.title ? 110 : 0;
      const cw = (b[2] - gap * (cols - 1)) / cols, ch = Math.min(o.cardH || 300, (b[3] - top - 50 - gap * (rows - 1)) / rows);
      let html = head(o);
      o.items.forEach((x, i) => {
        html += '<div class="card tp-cd" style="left:' + (i % cols) * (cw + gap) + 'px;top:' + (top + Math.floor(i / cols) * (ch + gap)) + 'px;width:' + cw + 'px;height:' + ch + 'px;border-top:6px solid ' + col(x.role || 'accent') + '">' +
          '<h4 style="font-size:34px;color:' + col(x.role || 'second') + '">' + esc(x.head) + '</h4><div class="sub" style="font-size:28px">' + esc(x.body || '') + '</div></div>';
      });
      const r = frame(o, k, html + src(o));
      Object.assign(this, { cd: [...r.querySelectorAll('.tp-cd')], tt: r.querySelector('.tp-title'), sr: r.querySelector('.tp-src') });
    },
    render(t, k) {
      let last = 0;
      this.cd.forEach((el, i) => { const t0 = cue(k, o.at, i, 0.3); appear(el, E().eo(E().seg(t, t0, t0 + 0.5)), 24); last = Math.max(last, t0 + 0.5); });
      chrome(this, t, k, o, last);
    },
  });

  TPL.table = (o) => ({
    init(k) {
      const b = o.box || BOX, top = o.title ? 110 : 0, rh = Math.min(84, (b[3] - top - 60) / (o.rows.length + 1));
      const cw = o.widths || o.cols.map((c, i) => (i === 0 ? 0.34 : 0.66 / (o.cols.length - 1)) * b[2]);
      const cell = (v, i, hd) => '<div style="position:absolute;left:' + cw.slice(0, i).reduce((a, c) => a + c, 0) + 'px;width:' + cw[i] + 'px;text-align:' + (i ? 'center' : 'left') + ';padding-left:' + (i ? 0 : 24) + 'px;box-sizing:border-box;line-height:' + rh + 'px;' + (hd ? 'font-size:24px;color:' + col('dim') : 'font-size:30px') + '"' + (i && !hd ? ' class="num"' : '') + '>' + esc(v) + '</div>';
      let html = head(o) + '<div class="tp-th" style="position:absolute;left:0;top:' + top + 'px;width:100%;height:' + rh + 'px">' + o.cols.map((c, i) => cell(c, i, true)).join('') + '</div>';
      o.rows.forEach((row, ri) => {
        const hl = ri === o.hl;
        html += '<div class="tp-tr" style="position:absolute;left:0;top:' + (top + (ri + 1) * rh) + 'px;width:100%;height:' + rh + 'px;border-top:1.5px solid color-mix(in srgb, var(--second) 14%, transparent);' +
          (hl ? 'background:color-mix(in srgb, var(--accent) 16%, transparent);color:var(--accent);font-weight:700' : '') + '">' + row.map((v, i) => cell(v, i)).join('') + '</div>';
      });
      const r = frame(o, k, html + src(o));
      Object.assign(this, { th: r.querySelector('.tp-th'), tr: [...r.querySelectorAll('.tp-tr')], tt: r.querySelector('.tp-title'), sr: r.querySelector('.tp-src') });
    },
    render(t, k) {
      let last = 0;
      this.th.style.opacity = E().eo(E().seg(t, cue(k, o.at, 0) - 0.3, cue(k, o.at, 0)));
      this.tr.forEach((el, i) => { const t0 = cue(k, o.at, i, 0.22); appear(el, E().eo(E().seg(t, t0, t0 + 0.4)), 10); last = Math.max(last, t0 + 0.4); });
      chrome(this, t, k, o, last);
    },
  });

  TPL.split = (o) => ({
    init(k) {
      const b = o.box || BOX, total = o.total || o.parts.reduce((a, p) => a + p.value, 0), top = o.title ? 200 : 80;
      let html = head(o), x = 0;
      if (o.total != null) html += '<div class="num tp-st" style="position:absolute;left:0;top:' + (top - 70) + 'px;font-size:44px;font-weight:700">' + esc(fmt(o.total, o.digits, o.unit)) + '</div>';
      o.parts.forEach((p) => {
        const w = p.value / total * b[2];
        html += '<div class="tp-sp" style="position:absolute;left:' + x + 'px;top:' + top + 'px;width:' + (w - 4) + 'px;height:90px;border-radius:10px;background:' + col(p.role) + '"></div>' +
          '<div class="tp-sl" style="position:absolute;left:' + x + 'px;top:' + (top + 108) + 'px;width:' + Math.max(w, 140) + 'px"><div style="font-size:26px;font-weight:700">' + esc(p.label) + '</div><div class="num small">' + esc(fmt(p.value, o.digits, o.unit)) + '</div></div>';
        x += w;
      });
      const r = frame(o, k, html + src(o));
      Object.assign(this, { st: r.querySelector('.tp-st'), sp: [...r.querySelectorAll('.tp-sp')], sl: [...r.querySelectorAll('.tp-sl')], tt: r.querySelector('.tp-title'), sr: r.querySelector('.tp-src') });
    },
    render(t, k) {
      const { eo, seg } = E();
      let last = 0;
      if (this.st) appear(this.st, eo(seg(t, cue(k, o.at, 0) - 0.3, cue(k, o.at, 0) + 0.2)), 10);
      this.sp.forEach((el, i) => {
        const t0 = cue(k, o.at, i, 0.3), p = eo(seg(t, t0, t0 + 0.5));
        el.style.transformOrigin = '0 50%'; el.style.transform = 'scaleX(' + Math.max(0.0001, p) + ')'; appear(this.sl[i], eo(seg(t, t0 + 0.3, t0 + 0.7)), 10); last = Math.max(last, t0 + 0.7);
      });
      chrome(this, t, k, o, last);
    },
  });

  // an equation built term by term, each term's meaning under it; swap turns the terms into numbers
  TPL.formula = (o) => ({
    init(k) {
      const r = frame(o, k, '<div class="tp-row" style="position:absolute;left:0;right:0;top:' + (o.top != null ? o.top : 180) + 'px;display:flex;justify-content:center;align-items:flex-start;gap:30px"></div>' + src(o));
      const row = r.querySelector('.tp-row');
      this.t = o.terms.map((x, i) => {
        const c = k.h('<div style="display:flex;flex-direction:column;align-items:center;gap:22px;position:relative"></div>');
        const m = k.tex(x[0]); m.style.fontSize = (o.size || 78) + 'px'; m.style.color = col(x[2] || 'second');
        const d = k.h('<div class="small" style="height:36px;white-space:nowrap"></div>'); d.textContent = x[1] || ''; d.style.color = col(x[2] || 'second');
        c.append(m, d);
        let n = null;
        if (o.swap && o.swap.terms[i] != null) { n = k.tex(o.swap.terms[i]); n.style.cssText = 'position:absolute;left:50%;top:0;transform:translateX(-50%);font-size:' + (o.size || 78) + 'px;color:' + col(x[2] || 'second'); c.append(n); }
        row.append(c); return { c, m, d, n };
      });
      this.sr = r.querySelector('.tp-src');
    },
    render(t, k) {
      const { eo, seg } = E();
      let last = 0;
      const ts = o.swap ? cue(k, o.swap.at, 0) : 1e9;
      this.t.forEach((x, i) => {
        const t0 = cue(k, o.at, i, 0.45);
        appear(x.c, eo(seg(t, t0, t0 + 0.5)), 16); x.d.style.opacity = eo(seg(t, t0 + 0.3, t0 + 0.7)); last = Math.max(last, t0 + 0.7);
        if (x.n) { const s = eo(seg(t, ts + i * 0.12, ts + i * 0.12 + 0.4)); x.n.style.opacity = s; x.m.style.opacity = 1 - s; }
      });
      if (this.sr) this.sr.style.opacity = eo(seg(t, last + 0.4, last + 0.9));
    },
  });

  // horizontal lanes of labelled spans on a shared time axis; a playhead sweeps across the scene
  TPL.lanes = (o) => ({
    init(k) {
      const b = o.box || BOX, L = 260, Wd = b[2] - L, top = o.title ? 130 : 40, lh = Math.min(120, (b[3] - top - 60) / o.lanes.length);
      const [a, z] = o.range, fx = (v) => L + (v - a) / (z - a) * Wd;
      let html = head(o);
      let n = 0; this.first = [];
      o.lanes.forEach((ln, i) => {
        this.first.push(n); n += ln.spans.length;
        html += '<div class="tp-ll" style="position:absolute;left:0;top:' + (top + i * lh + lh / 2 - 20) + 'px;width:' + (L - 24) + 'px;text-align:right;font-size:28px;font-weight:700">' + esc(ln.label) + '</div>';
        ln.spans.forEach((s) => {
          html += '<div class="tp-ls" style="position:absolute;left:' + fx(s[0]) + 'px;top:' + (top + i * lh + 12) + 'px;width:' + (fx(s[1]) - fx(s[0]) - 4) + 'px;height:' + (lh - 24) + 'px;border-radius:10px;background:color-mix(in srgb, ' + col(s[3]) + ' 28%, transparent);border:2px solid ' + col(s[3]) + ';display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;white-space:nowrap;overflow:hidden">' + esc(s[2] || '') + '</div>';
        });
      });
      if (o.playhead !== false) html += '<div class="tp-ph" style="position:absolute;top:' + (top - 10) + 'px;height:' + (o.lanes.length * lh + 20) + 'px;width:3px;background:var(--second)"></div>';
      const r = frame(o, k, html + src(o));
      Object.assign(this, { ll: [...r.querySelectorAll('.tp-ll')], ls: [...r.querySelectorAll('.tp-ls')], ph: r.querySelector('.tp-ph'), L, Wd, tt: r.querySelector('.tp-title'), sr: r.querySelector('.tp-src') });
    },
    render(t, k) {
      const { eo, seg } = E();
      let last = 0;
      this.ls.forEach((el, i) => { const t0 = cue(k, o.at, i, 0.25); el.style.opacity = eo(seg(t, t0, t0 + 0.4)); last = Math.max(last, t0 + 0.4); });
      this.ll.forEach((el, i) => { const t0 = cue(k, o.at, this.first[i], 0.25); el.style.opacity = eo(seg(t, t0 - 0.2, t0 + 0.2)); });
      if (this.ph) { const p = seg(t, cue(k, o.at, 0), k.dur - 0.5); this.ph.style.left = (this.L + p * this.Wd) + 'px'; this.ph.style.opacity = p > 0 && p < 1 ? 1 : 0; }
      chrome(this, t, k, o, last);
    },
  });

  TPL.end = (o) => ({
    init(k) {
      const r = frame(o, k, '<div class="words" style="left:0;top:200px"><h1 class="line">' + esc(o.title) + '</h1>' +
        (o.lines || []).map((l) => '<div class="sub">' + esc(l) + '</div>').join('') + (o.note ? '<div class="small">' + esc(o.note) + '</div>' : '') + '</div>');
      this.el = [...r.querySelectorAll('.words > *')];
    },
    render(t) { this.el.forEach((e, i) => appear(e, E().eo(E().seg(t, 0.3 + i * 0.4, 0.9 + i * 0.4)))); },
  });

  // several templates in one scene, sharing one background; give each its own box
  TPL.compose = (...defs) => ({
    init(k) { k.stage.append(k.h('<div class="ground"><div class="grid"></div></div>')); return Promise.all(defs.map((d) => d.init.call(d, Object.assign({}, k, { _bare: true })))); },
    render(t, k) { defs.forEach((d) => d.render.call(d, t, k)); },
  });

  window.TPL = TPL;
})();
