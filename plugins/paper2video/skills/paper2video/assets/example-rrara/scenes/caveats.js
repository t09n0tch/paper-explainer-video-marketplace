// What to keep in mind, one card per sentence.
SCENE('caveats', TPL.cards({
  title: '감안할 점',
  items: [
    { head: '반성기는 파인튜닝 모델', body: 'GPT-3.5를 1,000개 시연으로 파인튜닝. 그것만으로 0.25 → 0.35 (Table 3)', role: 'main' },
    { head: '응답 지연에서 빠진 것', body: '뒤에서 도는 반성기와 계획기의 계산 시간은 RL에 들어가지 않음', role: 'main' },
    { head: '재현성', body: '원격 API의 응답 시간은 네트워크와 서버 상태에 따라 달라짐 (논문 한계 절)', role: 'main' },
    { head: 'TCM의 가정', body: '생각하는 동안 에이전트는 제자리. 생각하며 이전 행동을 계속하는 방식이면 결과가 달라질 수 있음 (논문 한계 절)', role: 'main' }],
  cols: 2, cardH: 250, at: [0, 1, 2, 3],
}));
