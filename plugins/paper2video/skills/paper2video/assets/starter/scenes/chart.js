// A results scene from a template: bars grow one by one from sentence 1, the source line names the table.
SCENE('chart', TPL.bars({
  title: '순위가 뒤집힌다',
  rows: [{ label: '기존 평가', value: 0.77, role: 'dim' }, { label: '지연 반영', value: 0.10, role: 'main' }],
  digits: 2, max: 1, at: 0,
  src: '예시 값 · 실제 영상에서는 논문 표 번호를 적는다',
}));
