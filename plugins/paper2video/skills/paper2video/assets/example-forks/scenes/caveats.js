// What to keep in mind, one card per sentence.
SCENE('caveats', TPL.cards({
  title: '감안할 점',
  items: [
    { head: '거의 Qwen3 실험', body: 'Llama-3.1-8B는 RL만으론 학습 정확도 약 1%, Qwen3-32B 답으로 지도학습 후 실험. 저자도 덜 설득력 있다고 함', role: 'main' },
    { head: '수학 데이터 · 20%라는 값', body: 'DAPO-Math-17K만 학습. 다른 RLVR 설정에선 비율을 다시 맞춰야 할 수 있음 (논문 한계 절)', role: 'main' },
    { head: '응답이 길어짐', body: 'Qwen3-32B 평균 길이 5848.80 → 7227.03 토큰 (Table 2). 추론 비용도 그만큼 듦 (내 판단)', role: 'main' },
    { head: '편차 정보', body: '점수는 문제당 16번 생성 평균. 학습 반복 간 편차는 본문에 없음 (내 판단)', role: 'main' }],
  cols: 2, cardH: 270, at: [0, 1, 2, 3],
}));
