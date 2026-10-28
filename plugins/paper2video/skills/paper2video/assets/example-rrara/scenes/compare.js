// One fire episode from the appendix: 13 points available; GPT-3.5 and the pre-planner's totals as bars,
// RRARA's behaviour as a card (its total is only in the figure, so the film does not state a number).
SCENE('compare', TPL.compose(
  TPL.bars({
    title: '같은 화재 장면 · 구할 수 있는 가치 13점',
    rows: [{ label: 'GPT-3.5', value: 6.5, role: 'second', note: '위험에 가까운 물건부터' }, { label: 'LLM-PrePlanner', value: 8.5, role: 'second', note: '비싼 물건부터 · 근처 물건은 놓침' }],
    max: 13, digits: 1, unit: '점', at: [1, 1], src: '부록 B · 그림 5–7', box: [140, 150, 1640, 400],
  }),
  TPL.cards({ items: [{ head: 'RRARA · 이 장면 최고', body: '반성기의 조언으로 가까운 66번을 먼저 집고, 방 반대편으로 이동', role: 'accent' }], at: 2, box: [500, 600, 920, 250] })
));
