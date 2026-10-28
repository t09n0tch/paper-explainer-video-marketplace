// RRARA's idea as time lanes: the sequential agent stops to think; RRARA's reflex keeps moving while the LLM checks beside it.
SCENE('idea', TPL.compose(
  TPL.title({ tag: 'RAPID-REFLEX ASYNC-REFLECT AGENT', title: 'RRARA', box: [140, -30, 1640, 330] }),
  TPL.lanes({
    lanes: [
      { label: '기존 LLM 에이전트', spans: [[0, 2.5, '멈춰서 생각', 'main'], [2.5, 4, '행동', 'accent'], [4, 6.5, '멈춰서 생각', 'main'], [6.5, 8, '행동', 'accent']] },
      { label: 'RRARA 반사 층', spans: [[0, 8, '계속 행동 (규칙 · A* 거리)', 'accent']] },
      { label: 'RRARA 반성기', spans: [[0.5, 2.5, '✓ 유지', 'second'], [3, 5, '✓ 유지', 'second'], [5.5, 7.5, '✗ → 56', 'main']] },
    ],
    range: [0, 8], at: [1, 1, 1, 1, 2, 2, 2, 2], box: [140, 340, 1640, 270],
  }),
  TPL.formula({ terms: [['a_t', '다음 행동', 'accent'], ['=', ''], ['\\pi(O_t,\\, C_t,\\, M_t)', '보이는 물체 · 과제 · 지도', 'second']], at: 3, size: 64, top: 0, src: '논문 식 (2)', box: [140, 620, 1640, 200] })
));
