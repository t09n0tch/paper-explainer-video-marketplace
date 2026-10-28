// A hand-built 3D scene whose world is the lecture's own subject: the latent space is the floor.
// Inputs drop in as codes (sentence 2) and settle into clusters; the gap between them lights up in
// --main with a probe sample (sentence 3). Camera on the +y side so x reads left to right.
const CLUSTERS = [[3, 3.4], [9.2, 4.2], [6, 9.6]];
SCENE('latent', {
  init(k) {
    this.v = T3.view(k, { fov: 36, fogNear: 30, fogFar: 70 });
    const ink = T3.color('second'), gr = T3.color('ground');
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: gr.clone().lerp(ink, 0.06), roughness: 1 }));
    floor.rotation.x = -Math.PI / 2; floor.position.copy(T3.v3(6, 6.5, -0.01)); this.v.add(floor);
    const grid = new THREE.GridHelper(80, 80, ink, ink); grid.material.transparent = true; grid.material.opacity = 0.07;
    grid.position.copy(T3.v3(6, 6.5, 0)); this.v.add(grid);
    const r = T3.rng(3), geo = new THREE.SphereGeometry(0.2, 16, 12);
    this.codes = [];
    CLUSTERS.forEach((c, ci) => {
      for (let i = 0; i < 14; i++) {
        const a = r() * 6.283, d = 0.3 + 1.0 * Math.sqrt(r());
        const m = new THREE.Mesh(geo, T3.mat('accent', { emissive: T3.color('accent'), emissiveIntensity: 0.3 }));
        this.v.add(m); this.codes.push({ m, x: c[0] + Math.cos(a) * d, y: c[1] + Math.sin(a) * d, x0: 6 + (r() - 0.5) * 11, y0: 6.5 + (r() - 0.5) * 11, i: ci * 14 + i });
      }
    });
    this.hole = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.3, 48), new THREE.MeshBasicMaterial({ color: T3.color('main'), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    this.hole.rotation.x = -Math.PI / 2; this.hole.position.copy(T3.v3(6.2, 6, 0.02)); this.v.add(this.hole);
    this.probe = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 12), T3.mat('main', { emissive: T3.color('main'), emissiveIntensity: 0.5 })); this.v.add(this.probe);
    this.lz = k.h('<div class="lab">잠재 공간 <span class="tex">z</span></div>');
    this.lq = k.h('<div class="lab" style="color:var(--main)">디코더가 본 적 없는 곳</div>');
    this.badge = k.h('<div class="extra" style="right:120px;top:44px">보충</div>');
    k.stage.append(this.lz, this.lq, this.badge);
  },
  render(t, k) {
    const { seg, eo, eio, lerp } = k, c = k.caps;
    this.codes.forEach((p) => {                                 // codes fall onto the floor, then cluster
      const a = c[1].t0 + 0.2 + p.i * 0.04, f = eio(seg(t, a, a + 0.8)), s = eio(seg(t, c[1].t0 + 2.0, c[1].t0 + 3.6));
      p.m.visible = f > 0.01;
      p.m.position.copy(T3.v3(lerp(p.x0, p.x, s), lerp(p.y0, p.y, s), lerp(6, 0.2, f)));
    });
    const h = eo(seg(t, c[2].t0 + 0.3, c[2].t0 + 0.9)), pr = eio(seg(t, c[2].t0 + 1.0, c[2].t0 + 2.0));
    T3.fade(this.hole, h); this.probe.visible = pr > 0.01; this.probe.position.copy(T3.v3(6.2, 6, lerp(6, 0.26, pr)));
    const a = lerp(-0.25, 0.1, eio(seg(t, 0, k.dur)));             // slow drift, camera at +y
    this.v.look([6 + Math.sin(a) * 15, 6.5 + Math.cos(a) * 15, 11], [6, 6.5, -0.5]);
    this.v.draw();
    const pz = this.v.at(1, 12, 0), pq = this.v.at(6.2, 6, 1.1);
    this.lz.style.left = pz[0] + 'px'; this.lz.style.top = pz[1] + 'px'; this.lz.style.opacity = eo(seg(t, c[0].t0 + 0.5, c[0].t0 + 1.0));
    this.lq.style.left = pq[0] + 'px'; this.lq.style.top = pq[1] + 'px'; this.lq.style.opacity = h;
    this.badge.style.opacity = eo(seg(t, c[2].t0, c[2].t0 + 0.5));
  },
});
