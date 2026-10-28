// Eq. (1) built term by term, then turned into the worked example; a lane shows the agent standing still.
SCENE('tcm', TPL.compose(
  TPL.formula({
    terms: [['F_{\\mathrm{inf}}', '지연 프레임', 'main'], ['=', ''], ['\\lceil\\, t_{\\mathrm{inf}}', '추론 시간(초)', 'accent'], ['\\times', ''], ['\\mathrm{FPS}\\,\\rceil', '초당 프레임', 'second']],
    swap: { at: 1, terms: ['90', null, '\\lceil\\, 3', null, '30\\,\\rceil'] },
    at: 0, size: 84, top: 40, src: '논문 식 (1) · 3초는 예시', box: [140, 160, 1640, 330],
  }),
  TPL.lanes({
    lanes: [{ label: '에이전트', spans: [[0, 1, '관찰', 'second'], [1, 4, '제자리에서 추론 (세계는 진행)', 'main'], [4, 6, '행동 시작', 'accent']] }],
    range: [0, 6], at: [2, 2, 2], box: [140, 600, 1640, 170],
  })
));
