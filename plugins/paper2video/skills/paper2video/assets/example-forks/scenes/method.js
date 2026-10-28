// Eq. (6) in two rows. Sentence 2 lights the indicator, sentence 3 the new normaliser; rho = 20% lands last.
SCENE('method', {
  init(k) {
    k.stage.append(k.h('<div class="ground"><div class="grid"></div></div>'));
    const I = '\\mathbb{I}\\big[H^{i}_{t}\\ge\\tau^{\\mathcal{B}}_{\\rho}\\big]';
    this.f1 = TPL.formula({ terms: [['J_{\\mathrm{HighEnt}}(\\theta)', '목적 함수', 'second'], ['=', ''], ['\\mathbb{E}\\Big[', '배치 기댓값 (아래첨자 생략)', 'second'],
      ['\\frac{1}{\\sum_{i=1}^{G}\\sum_{t=1}^{|o^{i}|}' + I + '}', '② 남은 토큰 수로 평균', 'accent']], at: [0, 0, 0, 2], size: 54, top: 0, box: [140, 120, 1640, 260] });
    this.f2 = TPL.formula({ terms: [['\\sum_{i=1}^{G}\\sum_{t=1}^{|o^{i}|}', 'G개 응답의 모든 토큰', 'second'], [I, '① 상위 비율 안이면 1, 아니면 0', 'accent'],
      ['\\cdot\\min\\big(r^{i}_{t}(\\theta)\\hat{A}^{i}_{t},\\ \\mathrm{clip}\\big(r^{i}_{t}(\\theta),1-\\epsilon_{\\mathrm{low}},1+\\epsilon_{\\mathrm{high}}\\big)\\hat{A}^{i}_{t}\\big)\\Big]', 'DAPO와 같은 클립 손실', 'second']],
      at: [0, 1, 0], size: 50, top: 0, src: '논문 식 (6) · DAPO 식 (4)와 다른 곳은 두 군데', box: [140, 400, 1640, 280] });
    this.f1.init(Object.assign({}, k, { _bare: true })); this.f2.init(Object.assign({}, k, { _bare: true }));
    this.rho = k.h('<div class="card" style="left:560px;top:720px;width:800px;display:flex;align-items:center;gap:40px;border-top:6px solid var(--accent)">' +
      '<div style="font-size:60px;color:var(--accent)"><span class="tex">\\rho = 20\\%</span></div><div class="small">주 실험 설정<br>나머지 80% 토큰의 그래디언트는 버림</div></div>'); k.stage.append(this.rho);
  },
  render(t, k) {
    const { seg, eo } = k, c = k.caps;
    this.f1.render(t, k); this.f2.render(t, k);
    const a = eo(seg(t, c[3].t0 + 0.3, c[3].t0 + 0.8)); this.rho.style.opacity = a; this.rho.style.transform = 'translateY(' + (1 - a) * 20 + 'px)';
  },
});
