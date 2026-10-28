// Table 2, AIME rows for the three model sizes: all tokens vs forking tokens only.
SCENE('results', TPL.groupBars({
  title: 'AIME 정확도 Acc@16 · DAPO 전체 토큰 vs 갈림길 토큰만',
  groups: ['32B · AIME’24', '32B · AIME’25', '14B · AIME’24', '14B · AIME’25', '8B · AIME’24', '8B · AIME’25'],
  series: [{ name: '전체 토큰 (기존 DAPO)', role: 'dim' }, { name: '상위 20% 갈림길 토큰만', role: 'accent' }],
  values: [[55.83, 63.54], [45.63, 56.67], [45.21, 50.42], [38.13, 42.92], [33.33, 34.58], [25.42, 26.25]],
  max: 70, digits: 2, at: [1, 1, 2, 2, 3, 3], titleAt: 0, src: 'Table 2 · Qwen3 Base에서 RLVR · 벤치마크당 16회 평균',
}));
