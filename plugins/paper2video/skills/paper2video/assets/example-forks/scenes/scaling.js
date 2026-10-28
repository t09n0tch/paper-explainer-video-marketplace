// Average improvement over six benchmarks per model size (Table 2), then the longer-context run (Fig. 10).
SCENE('scaling', TPL.compose(
  TPL.bars({
    title: '6개 벤치마크 평균 향상폭 (갈림길 토큰만 − 전체 토큰)',
    rows: [{ label: 'Qwen3-8B Base', value: 0.53, role: 'dim', text: '+0.53' }, { label: 'Qwen3-14B Base', value: 2.99, role: 'accent', text: '+2.99' },
      { label: 'Qwen3-32B Base', value: 4.10, role: 'accent', text: '+4.10' }],
    max: 5, at: [1, 1, 1], titleAt: 0, src: 'Table 2 · Average 행', box: [140, 140, 1640, 420],
  }),
  TPL.cards({
    items: [{ head: '최대 응답 길이 20480 → 29696', body: 'Qwen3-32B · AIME’24 63.54 → 68.12', role: 'accent' }],
    at: [2], src: '그림 10 · 갈림길 토큰 학습을 이어서 진행', box: [440, 610, 1040, 260],
  })
));
