// Eq. (5): two temperatures by entropy, then what lowering or raising each one did (Fig. 3, qualitative).
SCENE('temp', TPL.compose(
  TPL.formula({
    terms: [["p'_t", '조정된 분포', 'second'], ['=', ''], ["\\mathrm{Softmax}\\!\\left(\\frac{z_t}{T'_t}\\right)", '로짓을 토큰별 온도로 나눔', 'second'],
            ["T'_t=\\begin{cases}T_{\\mathrm{high}} & H_t>h_{\\mathrm{threshold}}\\\\ T_{\\mathrm{low}} & \\text{otherwise}\\end{cases}", '갈림길 토큰과 나머지에 다른 온도', 'accent']],
    at: [0, 0, 0, 1], size: 58, top: 0, src: '논문 식 (5) · 문턱값 0.672 = 엔트로피 80번째 백분위', box: [140, 130, 1640, 330],
  }),
  TPL.cards({
    items: [
      { head: '갈림길 토큰의 온도 ↓', body: '나머지 온도를 낮출 때보다 AIME 점수가 훨씬 크게 떨어짐', role: 'main' },
      { head: '나머지 토큰의 온도 ↑', body: '갈림길 온도를 올릴 때보다 훨씬 나쁨 · 엉뚱한 출력까지 생성', role: 'main' }],
    cols: 2, cardH: 220, at: [2, 3], src: '그림 3 · Qwen3-8B · AIME 2024와 2025 평균', box: [140, 560, 1640, 320],
  })
));
