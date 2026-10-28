// Eq. (4) term by term; four illustrative term bars feed a staleness gauge that crosses δ = 0.6 and triggers a replan.
const TERMS = [['S_T', '흐른 시간', 0.20], ['S_A', '에이전트 이동', 0.12], ['S_O', '물체 상태', 0.22], ['S_H', '위험 지도', 0.14]];
SCENE('stalescore', {
  init(k) {
    this.f = TPL.formula({ terms: [['\\mathrm{Stale}(t,\\tau)', '계획이 낡은 정도', 'second'], ['=', ''], ['\\lambda_T S_T', '흐른 시간', 'accent'], ['+\\,\\lambda_A S_A', '에이전트 이동', 'accent'],
      ['+\\,\\lambda_O S_O', '물체 상태 (비싼 물체 가중)', 'accent'], ['+\\,\\lambda_H S_H', '위험 지도', 'accent']], at: [0, 0, 1, 1, 1, 1], size: 62, top: 0, src: '논문 식 (4)–(7) · 부록 A', box: [140, 140, 1640, 260] });
    this.f.init(k);
    let bars = '';
    TERMS.forEach((x, i) => {
      bars += '<div style="position:absolute;left:' + (i * 150) + 'px;bottom:0;width:110px;text-align:center"><div class="st-b" style="margin:0 auto;width:70px;height:240px;border-radius:8px 8px 0 0;background:var(--accent);transform-origin:50% 100%"></div>' +
        '<div style="font-size:30px;margin-top:8px"><span class="tex">' + x[0] + '</span></div></div>';
    });
    k.stage.append(k.h('<div style="position:absolute;left:220px;top:440px;width:600px;height:300px">' + bars + '<div class="src" style="position:absolute;left:0;top:-40px">항목 값은 예시</div></div>'));
    k.stage.append(k.h('<div style="position:absolute;left:1000px;top:440px;width:700px;height:300px">' +
      '<div class="small" style="margin-bottom:16px">낡음 점수</div><div style="position:relative;height:70px;border-radius:12px;background:color-mix(in srgb, var(--second) 12%, transparent)">' +
      '<div class="st-g" style="position:absolute;left:0;top:0;bottom:0;width:100%;border-radius:12px;background:var(--main);transform-origin:0 50%"></div>' +
      '<div style="position:absolute;left:60%;top:-16px;bottom:-16px;width:4px;background:var(--second)"></div></div>' +
      '<div style="position:absolute;left:calc(60% - 70px);top:150px;width:140px;text-align:center;font-size:30px"><span class="tex">\\delta = 0.6</span></div>' +
      '<div class="chip st-r" style="left:0;top:220px;background:var(--main);color:var(--ground)">재계획</div></div>'));
    Object.assign(this, { b: [...k.stage.querySelectorAll('.st-b')], g: k.q('.st-g'), r: k.q('.st-r') });
  },
  render(t, k) {
    const { seg, eo, eio } = k, c = k.caps;
    this.f.render(t, k);
    const grow = eio(seg(t, c[1].t0 + 0.5, c[2].t0 + 1.5)), reset = t > c[2].t0 + 2.8;
    this.b.forEach((b, i) => { b.style.transform = 'scaleY(' + Math.max(0.0001, reset ? 0 : TERMS[i][2] / 0.3 * grow * eo(seg(t, c[1].t0 + i * 0.2, c[1].t0 + 0.5 + i * 0.2))) + ')'; });
    const score = reset ? 0.04 : 0.68 * grow;
    this.g.style.transform = 'scaleX(' + Math.max(0.0001, score) + ')';
    this.r.style.opacity = eo(seg(t, c[2].t0 + 1.4, c[2].t0 + 1.7));
  },
});
