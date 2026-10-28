// Average value rate under TCM, in story order: baselines, then v1, then the pre-planner and v2.
SCENE('results', TPL.bars({
  title: 'TCM 아래 평균 가치 비율 (화재 · 홍수 · 바람)',
  rows: [
    { label: 'Rule', value: 0.19, role: 'dim' }, { label: 'GPT-5', value: 0.21, role: 'dim' }, { label: 'GPT-3.5', value: 0.25, role: 'second', note: '기존 LLM 최고' },
    { label: 'RRARA-v1', value: 0.37, role: 'accent', note: '규칙 반사 층 + 반성기 · RL 0.00 s' },
    { label: 'LLM-PrePlanner', value: 0.40, role: 'second', note: '반성기 없이' }, { label: 'RRARA-v2', value: 0.44, role: 'accent', note: '사전 계획기 + 반성기' }],
  max: 0.5, digits: 2, at: [0, 0, 0, 1, 2, 2], src: 'Table 2',
}));
