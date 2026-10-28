// Eq. (1) term by term; under it, two illustrative next-token distributions: one peaked, one spread.
const DISTS = [
  { head: '단어 끝을 잇는 자리', ctx: 'dupl… →', cands: [['icates', 0.96], ['icate', 0.02], ['ex', 0.01], ['ic', 0.01]], h: '0에 가까움', role: 'second' },
  { head: '다음 생각을 고르는 자리', ctx: '… impossible. →', cands: [['Wait', 0.34], ['But', 0.27], ['So', 0.21], ['Let', 0.18]], h: '큼', role: 'accent' }];
SCENE('entropy', {
  init(k) {
    k.stage.append(k.h('<div class="ground"><div class="grid"></div></div>'));
    this.f = TPL.formula({ terms: [['H_t', '토큰 엔트로피', 'accent'], [':=', ''], ['-\\sum_{j=1}^{V}', '어휘 전체에 대해 더하고 부호 반전', 'second'], ['p_{t,j}\\,\\log p_{t,j}', '확률 × 로그 확률', 'second']],
      at: [0, 0, 1, 1], size: 76, top: 0, src: '논문 식 (1) · p_t = 다음 토큰 분포', box: [140, 120, 1640, 300] });
    this.f.init(Object.assign({}, k, { _bare: true }));
    this.d = DISTS.map((d, di) => {
      let bars = '';
      d.cands.forEach((cd) => {
        bars += '<div style="display:flex;align-items:center;gap:14px;height:46px"><div class="mono" style="width:150px;text-align:right;font-size:26px">' + cd[0] + '</div>' +
          '<div class="en-b" style="height:30px;width:' + Math.round(cd[1] * 460) + 'px;border-radius:6px;background:var(--' + (d.role === 'accent' ? 'accent' : 'second') + ');transform-origin:0 50%;opacity:.85"></div></div>';
      });
      const el = k.h('<div class="card" style="left:' + (140 + di * 860) + 'px;top:470px;width:780px;height:380px"><h4>' + d.head + '</h4>' +
        '<div class="small mono" style="margin-bottom:10px">' + d.ctx + '</div>' + bars +
        '<div style="position:absolute;right:30px;top:26px;font-size:30px;font-weight:700;color:var(--' + (d.role === 'accent' ? 'accent' : 'second') + ')"><span class="tex">H_t</span> ' + d.h + '</div>' +
        '<div class="src" style="position:absolute;left:30px;bottom:18px">확률은 설명용 예시</div></div>');
      k.stage.append(el); return { el, bars: [...el.querySelectorAll('.en-b')] };
    });
  },
  render(t, k) {
    const { seg, eo } = k, c = k.caps;
    this.f.render(t, k);
    this.d.forEach((d, di) => {
      const a = c[2].t0 + 0.3 + di * 1.6;
      d.el.style.opacity = eo(seg(t, a, a + 0.4));
      d.bars.forEach((b, i) => { b.style.transform = 'scaleX(' + Math.max(0.0001, eo(seg(t, a + 0.3 + i * 0.12, a + 0.9 + i * 0.12))) + ')'; });
    });
  },
});
