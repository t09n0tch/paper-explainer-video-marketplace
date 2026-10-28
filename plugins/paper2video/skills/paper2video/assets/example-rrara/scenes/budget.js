// The time budget: one bar for the episode, then how much one decision eats out of it.
SCENE('budget', TPL.compose(
  TPL.split({
    title: '한 에피소드의 시간 예산 (화재 · 홍수)', parts: [{ label: '에피소드 한도 · 30 FPS로 50초 (계산값)', value: 1500, role: 'dim' }],
    unit: ' 프레임', digits: 0, at: 0, box: [140, 150, 1640, 300],
  }),
  TPL.bars({
    title: '결정 한 번에 멈춰 서는 시간', rows: [
      { label: 'GPT-3.5', value: 2.54, role: 'second', note: '≈ 77프레임 (계산값)' },
      { label: 'Claude-3.7-Sonnet', value: 13.05, role: 'main', note: '≈ 392프레임 · 예산의 약 26% (계산값)' }],
    max: 15, digits: 2, unit: ' s', at: [1, 2], src: 'Table 2 (RL) · 부록 A · 프레임 환산은 계산값', box: [140, 540, 1640, 360],
  })
));
