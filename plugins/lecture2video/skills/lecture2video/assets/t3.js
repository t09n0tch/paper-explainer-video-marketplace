/* t3.js — a real 3D world for scenes, on three.js (WebGL), drawn into the scene's own canvas.
 *
 * Same coordinates as ENG.W3 and world.js: metres, x across, y deep, z up. A world.js written
 * for W3 (walls, boxes, items, a hazard field) builds here unchanged with T3.room().
 * One shared WebGL renderer draws whichever scene is on screen and copies the frame into that
 * scene's canvas, so a film can hold any number of 3D scenes. Everything is a pure function of
 * t (no clock, no Math.random: use T3.rng(seed)), so export and scrubbing stay exact.
 *
 *   const v = T3.view(k, { fov: 40 })        canvas + scene + camera + lights, coloured from film.css
 *   v.add(obj) / v.scene / v.cam
 *   v.look([x,y,z], [x,y,z])                 camera position and target (world coords)
 *   v.orbit([cx,cy,cz], r, height, angle)    camera on a circle around a point
 *   v.draw()                                  render this frame (call at the end of render(t))
 *   v.at(x, y, z) -> [sx, sy, depth, onScreen] screen pixels, for .lab elements riding on objects
 *
 *   T3.room(world, P)            floor + walls + furniture + items  -> { group, items: {id: mesh}, floor }
 *   T3.field(world, P, role)     hazard voxels (fire, flood); .update(fn(x,y)->0..1, t)
 *   T3.street(seed)              procedural street: road, sidewalks, buildings, trees, poles, cars -> { group, boxes, cars }
 *   T3.car(color) · T3.agent(color) · T3.box(x0,y0,x1,y1,h,color) · T3.frustum(fovDeg, len, color)
 *   T3.route(pts, color, width)  a path on the floor; .progress(p) draws its first p (0..1)
 *   T3.points(n, size)           soft points / gaussian splats: fill .geometry attributes position, color, alpha, psize
 *   T3.samplePoints(boxes, density, seed) points on box surfaces (for "depth -> point cloud" shots)
 *   T3.turbo(t) depth colormap · T3.fade(obj, a) · T3.rng(seed) · T3.color(role|hex)
 *
 * Street, splats and turbo follow SunandBean/paper2video engine/core.js (MIT, Sunbin Kim).
 */
(function () {
  if (!window.THREE) { console.error('t3.js: three.min.js is not loaded'); return; }
  const W = 1920, H = 1080, c01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x), lerp = (a, b, p) => a + (b - a) * p;
  let R = null;
  const renderer = () => {
    if (R) return R;
    const glc = document.createElement('canvas'); glc.width = W; glc.height = H;
    R = new THREE.WebGLRenderer({ canvas: glc, antialias: true, preserveDrawingBuffer: true });
    R.setPixelRatio(1); R.setSize(W, H, false); R.outputColorSpace = THREE.SRGBColorSpace;
    return R;
  };
  const css = (n, d) => (getComputedStyle(document.getElementById('stage') || document.documentElement).getPropertyValue(n) || '').trim() || d;
  const color = (c) => new THREE.Color(c === 'main' ? css('--main', '#F08A3C') : c === 'accent' ? css('--accent', '#5CC8C2')
    : c === 'second' ? css('--second', '#EDE8E0') : c === 'ground' ? css('--ground', '#14161C') : c);
  const v3 = (x, y, z) => new THREE.Vector3(x, z || 0, y);   // world (x across, y deep, z up) -> three (y up)
  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  const mat = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: color(c), roughness: 0.7, metalness: 0.05 }, o || {}));

  function view(k, o) {
    o = o || {};
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.className = 'w3d';
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
    k.stage.append(cv);
    const ctx = cv.getContext('2d'), scene = new THREE.Scene(), bg = color(o.bg || 'ground');
    scene.background = bg;
    if (o.fog !== false) scene.fog = new THREE.Fog(bg, o.fogNear || 40, o.fogFar || 140);
    scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x1a1d24, 1.25));
    const sun = new THREE.DirectionalLight(0xffffff, 1.7); sun.position.set(20, 40, 12); scene.add(sun);
    const cam = new THREE.PerspectiveCamera(o.fov || 40, W / H, 0.1, 2000);
    return {
      canvas: cv, scene, cam,
      add(...a) { scene.add(...a); return a[0]; },
      look(p, t) { cam.position.copy(v3(p[0], p[1], p[2])); cam.lookAt(v3(t[0], t[1], t[2])); },
      orbit(c, r, h, ang) { this.look([c[0] + Math.cos(ang) * r, c[1] + Math.sin(ang) * r, h], c); },
      at(x, y, z) {
        cam.updateMatrixWorld(); const p = v3(x, y, z).project(cam);
        return [(p.x + 1) / 2 * W, (1 - p.y) / 2 * H, p.z, p.z < 1 && Math.abs(p.x) < 1.1 && Math.abs(p.y) < 1.1];
      },
      draw() { const r = renderer(); r.render(scene, cam); ctx.clearRect(0, 0, W, H); ctx.drawImage(r.domElement, 0, 0); },
    };
  }

  function box(x0, y0, x1, y1, h, c, z0) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x1 - x0), h, Math.abs(y1 - y0)), c && c.isMaterial ? c : mat(c || 'second'));
    m.position.copy(v3((x0 + x1) / 2, (y0 + y1) / 2, (z0 || 0) + h / 2));
    return m;
  }

  // the W3 world spec in 3D: floor with a faint grid, walls, furniture, items (value >= 5 bright)
  function room(world, o) {
    o = o || {};
    const g = new THREE.Group(), ink = color('second'), gr = color('ground');
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(world.w, world.h), mat(gr.clone().lerp(ink, 0.08)));
    floor.rotation.x = -Math.PI / 2; floor.position.set(world.w / 2, 0, world.h / 2); g.add(floor);
    const grid = new THREE.GridHelper(Math.max(world.w, world.h), Math.max(world.w, world.h), ink, ink);
    grid.material.transparent = true; grid.material.opacity = 0.06; grid.position.set(world.w / 2, 0.005, world.h / 2); g.add(grid);
    const wallM = mat(ink.clone().lerp(gr, 0.18)), furnM = mat(gr.clone().lerp(ink, 0.32));
    for (const w of world.walls || []) g.add(box(w[0], w[1], w[2], w[3], w[4] == null ? (o.wallH || 1.2) : w[4], wallM));
    for (const b of world.boxes || []) g.add(box(b[0], b[1], b[2], b[3], b[4] == null ? 0.8 : b[4], furnM));
    const items = {};
    for (const id in world.items || {}) {
      const it = world.items[id], m = box(it[0] - 0.3, it[1] - 0.3, it[0] + 0.3, it[1] + 0.3, 0.5, mat(it[2] >= 5 ? 'second' : gr.clone().lerp(ink, 0.55)));
      g.add(m); items[id] = m;
    }
    return { group: g, items, floor };
  }

  // hazard voxels on a 0.5 m grid; update(fn, t) sets heights from fn(x, y) in 0..1, flickering with t
  function field(world, role, step) {
    step = step || 0.5;
    const cells = [];
    for (let x = step / 2; x < world.w; x += step) for (let y = step / 2; y < world.h; y += step) cells.push([x, y]);
    const base = color(role || 'main'), hot = base.clone().lerp(color('second'), 0.5);
    const m = new THREE.InstancedMesh(new THREE.BoxGeometry(step * 0.78, 1, step * 0.78), new THREE.MeshStandardMaterial({ roughness: 0.5, emissive: base, emissiveIntensity: 0.35 }), cells.length);
    const M = new THREE.Matrix4(), C = new THREE.Color();
    m.update = (fn, t) => {
      cells.forEach(([x, y], i) => {
        const h = fn(x, y), ph = Math.abs(Math.sin(x * 12.9898 + y * 78.233)) * 6.28;
        const hh = 0.08 + 1.6 * h * (0.82 + 0.18 * Math.sin((t || 0) * 5.2 + ph)), on = h > 0.02 ? 1 : 0;
        M.makeScale(on, hh * on, on).setPosition(x, hh / 2, y); m.setMatrixAt(i, M);
        m.setColorAt(i, C.copy(base).lerp(hot, 0.6 * h));
      });
      m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
    };
    m.frustumCulled = false;
    return m;
  }

  function car(c) {
    const g = new THREE.Group(), body = mat(c || 'accent', { roughness: 0.45, metalness: 0.25 });
    const b = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.85, 1.9), body); b.position.y = 0.75; g.add(b);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.65, 1.7), mat(0x1b2430, { roughness: 0.2, metalness: 0.6 })); cab.position.set(-0.25, 1.45, 0); g.add(cab);
    const wm = mat(0x111111, { roughness: 0.9 });
    for (const [x, z] of [[1.5, 0.95], [1.5, -0.95], [-1.5, 0.95], [-1.5, -0.95]]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.3, 16), wm); w.rotation.x = Math.PI / 2; w.position.set(x, 0.38, z); g.add(w);
    }
    return g;
  }

  // a small robot: body, head, a ring above it (g.ring) for "thinking" progress
  function agent(c) {
    const g = new THREE.Group(), m = mat(c || 'accent', { roughness: 0.4, emissive: color(c || 'accent'), emissiveIntensity: 0.15 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.8, 24), m); body.position.y = 0.4; g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 16), m); head.position.y = 0.98; g.add(head);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.05, 8, 48, Math.PI * 2), new THREE.MeshBasicMaterial({ color: color(c || 'accent'), transparent: true }));
    ring.rotation.x = Math.PI / 2; ring.position.y = 1.6; ring.visible = false; g.add(ring); g.ring = ring;
    g.think = (p) => { ring.visible = p > 0.001; ring.geometry.dispose(); ring.geometry = new THREE.TorusGeometry(0.42, 0.05, 8, 48, Math.PI * 2 * c01(p)); };
    g.place = (x, y, z) => g.position.copy(v3(x, y, z || 0));
    return g;
  }

  // a path on the floor drawn as a flat ribbon; progress(p) shows its first p
  function route(pts, c, width) {
    width = width || 0.16;
    const pos = [], idx = [];
    let n = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L * width / 2, ny = dx / L * width / 2;
      pos.push(a[0] + nx, 0.03, a[1] + ny, a[0] - nx, 0.03, a[1] - ny, b[0] + nx, 0.03, b[1] + ny, b[0] - nx, 0.03, b[1] - ny);
      idx.push(n, n + 2, n + 1, n + 1, n + 2, n + 3); n += 4;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: color(c || 'accent'), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    const lens = []; let tot = 0;
    for (let i = 0; i < pts.length - 1; i++) { const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); lens.push(l); tot += l; }
    // whole segments only: good enough with short segments (split long legs with extra points)
    m.progress = (p) => { let d = tot * c01(p), s = 0; while (s < lens.length && d >= lens[s]) { d -= lens[s]; s++; } g.setDrawRange(0, 6 * (s + (d > 0 ? 1 : 0))); };
    return m;
  }

  function frustum(fovDeg, len, c, aspect) {
    aspect = aspect || 0.6;
    const g = new THREE.Group(), hw = Math.tan(fovDeg * Math.PI / 360) * len, hh = hw * aspect, col = color(c || 'accent');
    const cs = [[len, hh, hw], [len, hh, -hw], [len, -hh, -hw], [len, -hh, hw]], lp = [], fp = [];
    for (const p of cs) lp.push(0, 0, 0, ...p);
    for (let i = 0; i < 4; i++) { lp.push(...cs[i], ...cs[(i + 1) % 4]); fp.push(0, 0, 0, ...cs[i], ...cs[(i + 1) % 4]); }
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
    const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3));
    g.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.9 })));
    g.add(new THREE.Mesh(fg, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false })));
    return g;
  }

  // opacity for a whole group (remembers each material's own opacity)
  function fade(obj, a) {
    obj.visible = a > 0.005;
    obj.traverse((o) => {
      for (const m of [].concat(o.material || [])) {
        if (m.userData.op == null) m.userData.op = m.opacity;
        m.transparent = true; m.opacity = m.userData.op * a;
        if (m.uniforms && m.uniforms.uGlobal) m.uniforms.uGlobal.value = a;
      }
    });
  }

  // procedural street along x (world coords: x along the road, y across, z up)
  function street(seed) {
    const r = rng(seed || 7), boxes = [], g = new THREE.Group();
    const add = (cls, x0, y0, z0, x1, y1, z1, c) => boxes.push({ cls, min: [x0, y0, z0], max: [x1, y1, z1], c });
    add('road', -60, -6, -0.05, 130, 6, 0, '#3b3f46');
    add('sidewalk', -60, -9, -0.05, 130, -6, 0.15, '#8f8a82'); add('sidewalk', -60, 6, -0.05, 130, 9, 0.15, '#8f8a82');
    add('terrain', -60, -32, -0.05, 130, -9, 0.05, '#4d6a3a'); add('terrain', -60, 9, -0.05, 130, 32, 0.05, '#4d6a3a');
    const facades = ['#c9b79c', '#a9706a', '#8f9aa6', '#d8cfc0', '#7d8a96', '#b58b6b'];
    for (const side of [-1, 1]) {
      for (let x = -60; x < 125;) {
        const len = 8 + r() * 14, gap = 2 + r() * 5, h = 6 + r() * 22, d0 = 11 + r() * 3, d1 = d0 + 8 + r() * 10;
        add('building', x, side < 0 ? -d1 : d0, 0, x + len, side < 0 ? -d0 : d1, h, facades[Math.floor(r() * facades.length)]);
        x += len + gap;
      }
      for (let tx = -55; tx < 125; tx += 9 + r() * 6) {
        const y = side * 7.6; add('vegetation', tx - 1.2, y - 1.2, 2.2, tx + 1.2, y + 1.2, 5 + r() * 2, '#4f8a3a'); add('pole', tx - 0.15, y - 0.15, 0, tx + 0.15, y + 0.15, 2.3, '#5a4632');
      }
    }
    const carCols = ['#c0392b', '#ecf0f1', '#2c3e50', '#2980b9', '#7f8c8d', '#f1c40f'], cars = [];
    for (let i = 0; i < 9; i++) {
      const x = -40 + i * 18 + r() * 8, lane = r() < 0.5 ? -3 : 3, cr = car(carCols[i % carCols.length]);
      cr.position.copy(v3(x, lane, 0)); g.add(cr); cars.push(cr);
      boxes.push({ cls: 'car', min: [x - 2.3, lane - 0.95, 0], max: [x + 2.3, lane + 0.95, 1.5], c: carCols[i % carCols.length] });
    }
    for (const b of boxes) if (b.cls !== 'car') g.add(box(b.min[0], b.min[1], b.max[0], b.max[1], b.max[2] - b.min[2], mat(b.c), b.min[2]));
    return { group: g, boxes, cars };
  }

  // points on box surfaces ({min:[x,y,z], max:[x,y,z]} in world coords); flat boxes: top only
  function samplePoints(boxes, density, seed, filter) {
    const r = rng(seed || 3), pts = [];
    for (const b of boxes) {
      const [x0, y0, z0] = b.min, [x1, y1, z1] = b.max, flat = z1 - z0 < 0.3;
      const faces = flat ? [['z', z1]] : [['z', z1], ['x', x0], ['x', x1], ['y', y0], ['y', y1]];
      for (const [ax, v] of faces) {
        const area = ax === 'z' ? (x1 - x0) * (y1 - y0) : ax === 'x' ? (y1 - y0) * (z1 - z0) : (x1 - x0) * (z1 - z0);
        for (let i = 0, n = Math.round(area * density); i < n; i++) {
          const p = ax === 'z' ? [lerp(x0, x1, r()), lerp(y0, y1, r()), v] : ax === 'x' ? [v, lerp(y0, y1, r()), lerp(z0, z1, r())] : [lerp(x0, x1, r()), v, lerp(z0, z1, r())];
          if (!filter || filter(p, b)) pts.push({ p, box: b, c: b.c });
        }
      }
    }
    return pts;
  }

  // soft gaussian sprites; size in world units, capped on screen by uMax
  function points(n, size) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('alpha', new THREE.BufferAttribute(new Float32Array(n).fill(1), 1));
    g.setAttribute('psize', new THREE.BufferAttribute(new Float32Array(n).fill(1), 1));
    const m = new THREE.ShaderMaterial({
      uniforms: { uSize: { value: size || 60 }, uGlobal: { value: 1 }, uMax: { value: 140 } },
      vertexShader: 'attribute vec3 color; attribute float alpha; attribute float psize; varying vec3 vC; varying float vA; uniform float uSize; uniform float uMax;' +
        'void main(){ vC=color; vA=alpha; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=min(uMax,uSize*psize*12.0/max(0.5,-mv.z)); gl_Position=projectionMatrix*mv; }',
      fragmentShader: 'varying vec3 vC; varying float vA; uniform float uGlobal;' +
        'void main(){ vec2 d=gl_PointCoord-0.5; float a=exp(-dot(d,d)*14.0)*vA*uGlobal; if(a<0.02) discard; gl_FragColor=vec4(vC,a); }',
      transparent: true, depthWrite: false,
    });
    const o = new THREE.Points(g, m); o.frustumCulled = false;
    // set point i from world coords and a THREE.Color / [r,g,b]
    o.set = (i, x, y, z, c, a) => {
      g.attributes.position.setXYZ(i, x, z, y);
      if (c) { const k = c.isColor ? c : { r: c[0], g: c[1], b: c[2] }; g.attributes.color.setXYZ(i, k.r, k.g, k.b); }
      if (a != null) g.attributes.alpha.setX(i, a);
    };
    o.commit = () => { for (const k of ['position', 'color', 'alpha', 'psize']) g.attributes[k].needsUpdate = true; };
    return o;
  }

  function turbo(t) {
    t = c01(t);
    return [c01(0.1357 + t * (4.5974 - t * (42.3277 - t * (130.5887 - t * (150.5666 - t * 58.1375))))),
      c01(0.0914 + t * (2.1856 + t * (4.8052 - t * (14.0195 - t * (4.2109 + t * 2.7747))))),
      c01(0.1067 + t * (12.5925 - t * (60.1097 - t * (109.0745 - t * (88.5066 - t * 26.8183)))))];
  }

  window.T3 = { view, room, field, street, car, agent, box, route, frustum, fade, points, samplePoints, turbo, rng, color, v3, mat, renderer };
})();
