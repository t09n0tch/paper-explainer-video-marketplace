# Worked example: RRARA (arXiv 2506.07223)

A film that the user accepted. 15 scenes, about 5 minutes, Korean narration. Use it for the shape of a film, how chapters split, how much one scene carries, and how visuals hang off sentences. Don't copy its wording or numbers into another paper's film.

**The whole film ships as code**: `p2v new example/ --example rrara` copies `script.json`, `claims.json`
(69 claims, every number tied to a quote or table row), `world.js` (the room, shared by all 3D scenes) and
`scenes/*.js`; `p2v paper example/ 2506.07223` fetches the paper (not shipped: arXiv non-exclusive license),
then `p2v voice`, `p2v preview`, `p2v check` (FAIL 0, WARN 0). Which scene shows which technique:

| technique | scenes |
|---|---|
| 3D world (`T3.room`, fire voxels, agent, orbit/look cameras, labels riding on objects) | intro, setting, frozen, preplan, reflect, outro |
| templates (`TPL.formula` with swap, `lanes`, `split`, `bars`, `cards`, `compose`) | tcm, budget, idea, results, compare, caveats |
| custom signature shots | flip (bars shrink with ghosts, then re-sort), curve (scatter with drop lines), stalescore (term bars feeding a threshold gauge), reflect (one continuous walk that turns when the answer arrives) |

The shipped script follows the plan below, rewritten where arXiv v2 of the paper differs: the budget,
curve, compare and caveats lines now say only what v2 (appendix included) states, e.g. RRARA's total in
the compared episode is only in a figure, so the film shows its behaviour, not a number. The plan is the
design; `script.json` is what was checked.

Paper: "Reflex First, Reflect Later: Latency-Aware Embodied LLM Agents for Dynamic Response" (Zheng, Mao, Zhang, Cai, University of Sydney). Setting: HAZARD benchmark (fire, flood, wind); an agent rescues valued objects while the hazard spreads. Claims: inference latency matters once simulated time advances during thinking (TCM); RRARA (fast reflex layer + asynchronous LLM reflector, plus an LLM pre-planner and a staleness score) scores best under TCM.

World used in every 3D scene: a 16×10 m room with a doorway wall at x=10, five target objects (56 bag value 5, 62 value 5, 57/64/66 value 1), fire spreading from two sources.

## intro · 들어가며 · ~12s

1. 시드니 대학교의 RRARA 논문을 영상으로 쉽게 풀어볼게요.
2. 핵심은 하나예요. LLM이 생각하는 시간도 로봇에게는 비용이라는 것.

Picture: 방 전체를 비스듬히 내려다보는 3D 장면, 카메라가 천천히 돈다. 왼쪽에 영문 제목 두 줄과 한 줄 부제.

## setting · ① 문제 · 실험 무대 · ~18s

1. 실험 무대는 HAZARD 벤치마크예요. 불이 번지는 방에서 물건을 구해 내는 과제죠.
2. 물건마다 가치가 달라요. 비싼 물건은 5점, 싼 물건은 1점이에요.
3. 불에 손상되면 절반, 타 버리면 0점. 그래서 빨리, 그리고 잘 골라야 해요.

Picture: 카메라가 방 가운데로 다가간다. 문장 2에서 물건마다 '56 · 5점' 라벨이 차례로 뜨고, 문장 3에서 불이 57번에 닿아 라벨이 '손상 → 0.5점'으로 바뀐다. 오른쪽 카드: 점수 규칙, 출처 식 (10)(11).

## frozen · ① 문제 · 멈춘 세계 · ~25s

1. 요즘은 이런 에이전트의 두뇌로 LLM을 써요. 상황을 읽고 다음 목표를 고르죠.
2. 그런데 기존 시뮬레이터는 LLM이 생각하는 동안 세계를 멈춰 둬요.
3. 현실은 다르죠. 생각하는 몇 초 사이에도 불은 계속 번져요.
4. 에이전트가 본 세상과 행동하는 세상이 달라지고, 계획은 실행 전에 낡아요.

Picture: 에이전트 머리 위 진행 링(생각 중) + '추론 3.2초' 라벨. 문장 2: 불의 깜빡임까지 정지, 카드 '기존 평가 · 환경 진행 0프레임'. 문장 3: 같은 생각 동안 불이 커지고 '+150프레임'. 문장 4: 57번으로 가는 점선 경로, 도착 지점에 '도착하면 이미 불 속'.

## tcm · ② 평가 · 시간 환산 · ~19s

1. 그래서 저자들은 생각한 시간만큼 시뮬레이션을 진행시키는 TCM을 만들었어요.
2. 추론 시간에 초당 프레임 수를 곱해요. 30 FPS에서 3초면 90프레임이죠.
3. 그동안 에이전트는 제자리에 서 있고, 행동은 생각이 끝나야 시작돼요.

Picture: 수식 토큰이 입력부터 하나씩 등장, 각 토큰 아래 뜻. 문장 2: t_inf→3, FPS→30, F_inf→90으로 바뀌고 90칸 필름 스트립이 채워진다. 문장 3: t₀ 관찰 → 정지 블록 → t₀+t_inf 행동 시작 타임라인.

## budget · ② 평가 · 시간 예산 · ~20s

1. 화재와 홍수 과제는 1,500프레임, 그러니까 50초 안에 끝나요.
2. GPT-3.5는 결정 한 번에 평균 2.54초, 약 77프레임을 써요.
3. Claude-3.7-Sonnet은 13초가 넘어요. 결정 한 번에 제한 시간의 4분의 1이죠.

Picture: 1,500프레임 예산 막대. 문장 2·3: 모델별 레인에 '멈춰서 추론'(주황 테두리)과 '행동'(청록) 블록이 플레이헤드로 채워진다. 끝에 '결정 한 번 = 392프레임 ≈ 26%' 카드. 출처 Table 2.

## flip · ③ 결과가 뒤집힌다 · 순위 역전 · ~24s

1. 같은 모델을 두 방식으로 평가해요. 먼저 세계를 멈춘 기존 방식이에요.
2. 화재 과제에서는 Claude-3.7-Sonnet이 0.77로 가장 높아요.
3. 그런데 TCM을 켜면 0.10으로 떨어져요. 거의 꼴찌죠.
4. 대신 빠른 GPT-3.5가 0.44로 1위가 돼요. 생각이 빠를수록 덜 잃는 거죠.

Picture: 9개 모델 가로 막대가 기존 점수로 자란다(Table 1, 화재). 문장 2: Claude-3.7 강조 + '1위' 칩. 문장 3: 모든 막대가 TCM 점수로 줄고 점선 유령이 원래 길이를 남긴다. 문장 4: TCM 순서로 행이 재정렬, GPT-3.5에 '1위'.

## curve · ③ 결과가 뒤집힌다 · 지연 대 성적 · ~13s

1. 응답 지연과 성적을 함께 놓으면, 느릴수록 거의 일정하게 떨어져요.
2. 더 똑똑하지만 더 느린 모델은, 그 똑똑함을 지연으로 잃는 거예요.

Picture: 산점도: x=응답 지연(Table 2), y=TCM 평균 가치. 점이 지연 순으로 뜨고 추세 점선. 문장 2: 각 모델 위에 기존 평가 평균(빈 원)이 생기고 아래로 낙차 선이 내려온다.

## idea · ④ RRARA · 반사와 숙고 · ~26s

1. 그래서 나온 답이 RRARA. 먼저 반사하고, 나중에 숙고하는 에이전트예요.
2. 기존 방식은 생각하고, 움직이고, 또 멈춰 생각해요. 멈춘 시간은 전부 손해죠.
3. RRARA는 멈추지 않아요. 반사 층이 계속 움직이고, LLM은 옆에서 검토해요.
4. 반사 층은 미리 계산한 A* 거리로, 거의 즉시 다음 행동을 골라요.

Picture: 'RRARA' 대형 타이틀 → 위로 사라짐. 문장 2: 순차형 레인(생각/행동 교대)이 플레이헤드로 채워짐. 문장 3: Rapid-Reflex 레인(행동 연속)과 Async-Reflect 레인(✓, ✗→56) + 교정 화살표. 문장 4: 레인을 흐리게 하고 정책 카드 a_t = π(O_t, C_t, M_t), 식 (2).

## preplan · ⑤ 사전 계획기 · ~20s

1. v2에서는 반사 층 자리에 LLM 사전 계획기를 넣어요. 한 번 물어서 순서를 통째로 받죠.
2. 출력은 물체 번호와 쉼표뿐이라 짧고, 응답은 0.4초면 돼요.
3. 실행기는 이 목록을 위에서부터 하나씩 꺼내 실행해요.

Picture: 왼쪽 3D 방, 오른쪽 카드 열. 입력 카드(O_t, C_t, M_t 행). 문장 2: 출력 '57, 56, 62'가 타이핑, 응답 지연 0.40초 vs 2.54초. 문장 3: 큐 카드 p1·p2·p3, 에이전트가 p1 경로를 걷고 57을 집으면 p2로 넘어간다.

## stalescore · ⑥ 낡음 점수 · ~21s

1. 미리 세운 계획도 시간이 지나면 낡아요. 그래서 얼마나 낡았는지 점수로 재요.
2. 흐른 시간, 에이전트 이동, 물체 상태, 위험 지도의 변화를 합쳐요. 비싼 물체엔 가중치를 더 주고요.
3. 점수가 0.6을 넘으면 계획을 버리고 새로 세워요. LLM 없이 계산돼서 거의 공짜예요.

Picture: 왼쪽 3D 방에서 불이 커지고 에이전트가 움직이고 64가 손상된다. 오른쪽: 수식 카드(식 4~7), 네 항목 막대(예시 값, 화면에 '예시' 표기), Stale 게이지와 δ=0.6 선. 문장 3에서 게이지가 선을 넘으면 '재계획' 칩, 막대가 0으로 리셋.

## reflect · ⑦ 비동기 반성기 · ~27s

1. 마지막 조각은 반성기예요. 행동이 진행되는 동안 LLM이 옆에서 계속 점검해요.
2. 논문의 예시예요. 에이전트가 가치 1짜리 헤어브러시로 가고 있어요.
3. 그런데 거의 같은 거리에 가치 5짜리 가방이 보여요. 온도도 조금 낮아요.
4. 반성기가 ‘부적절, 56번’이라고 답하면 목표가 바뀌고, 걸음은 멈추지 않아요.

Picture: 3D 방 + 오른쪽 반성기 프롬프트 카드(논문 그림 3의 내용). 문장 2: 57로 가는 경로와 '현재 행동 walk_to 57'. 문장 3: 56·57의 가치·거리·온도 줄. 문장 4: 'Inappropriate 56' 카드, 옛 경로는 회색 점선, 새 경로가 그려지고 에이전트는 멈추지 않고 방향을 튼다.

## results · ⑧ 결과 · 평균 성적 · ~20s

1. TCM 아래, 세 재난 과제의 평균 성적이에요. 기존 LLM 최고는 GPT-3.5의 0.25.
2. 규칙 기반 반사 층에 반성기를 붙인 v1은 0.37, 응답 지연은 0초예요.
3. 사전 계획기에 반성기를 붙인 v2는 0.44로 가장 높아요.

Picture: 세로 막대 6개가 서사 순서로 등장: 규칙 0.19, GPT-5 0.21, GPT-3.5 0.25 → 문장 2: v1 0.37 + 규칙에서 v1로 '+ 반성기' 호 → 문장 3: PrePlanner 0.40, v2 0.44 + '+ 반성기' 호. 출처 Table 2.

## compare · ⑧ 결과 · 한 장면 비교 · ~21s

1. 같은 화재 장면 하나로 비교해 볼게요. 만점은 13점이에요.
2. GPT-5는 목표를 자꾸 바꾸다 1점, 사전 계획기는 근처 물건을 놓쳐 8.5점.
3. RRARA는 근처 물건부터 챙겨 다섯 개를 모두 구하고, 10점을 얻어요.

Picture: 13점 만점 틀 안에 에이전트별 누적 막대(물체별 조각, 손상은 빗금). 다른 기준선은 흐리게 먼저, 문장 2에서 GPT-5와 PrePlanner, 문장 3에서 RRARA가 조각조각 쌓여 10점. 출처 그림 5~7.

## caveats · ⑨ 감안할 점 · ~21s

1. 다만 반성기는 1,000개 시연으로 파인튜닝한 GPT-3.5예요. 그것만으로도 0.25가 0.35가 되죠.
2. 또 응답 지연에는 뒤에서 도는 반성기의 계산 시간이 빠져 있어요.
3. 테스트 환경은 위험 유형마다 한 곳뿐이고, 결과의 분산도 보고되지 않았어요.

Picture: 카드 세 장이 문장마다 하나씩: ① 파인튜닝 막대(0.25/0.30/0.35, Table 3)와 v2 0.44, ② 실행 레인 vs 'RL에서 빠짐' 점선 레인, ③ 환경 4칸 중 테스트 1칸 강조 + 분산 미보고.

## outro · 정리 · ~11s

1. 정리하면, 움직이는 세상에서는 생각하는 시간도 성능이에요.
2. 먼저 반사하고, 나중에 숙고하라. 논문 제목 그대로예요.

Picture: 처음의 3D 방으로 돌아와 에이전트가 경로를 걷고, 왼쪽에 제목 두 줄과 청록 밑줄, 저자 크레딧. 마지막 5초 정지 화면.
