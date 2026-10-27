# Worked example: VAE lecture, episode 1

An episode the user accepted without changes: 3:23, 10 scenes, Korean, SunHi (edge) voice, soft subtitles, 7 chapters. Source: a 30-slide Beamer deck "Machine Learning: Autoencoders and Variational Autoencoders". Use it for the shape of an episode, how much a scene carries and how pictures hang off sentences; don't reuse its wording for another lecture.

## Episode plan for the whole deck

| Ep | Slides | Topic |
|---|---|---|
| 1 | 3–7 | 차원 축소와 오토인코더 (this one) |
| 2 | 9–15 | 밀도 추정, 잠재 변수 모델, 적분 문제 |
| 3 | 16–20 | ELBO, 근사 사후분포, VAE |
| 4 | 21–27 | 학습: 몬테카를로, 재매개화, KL 닫힌 형태 |
| 5 | 29–30 | AE vs VAE 정리 |

Skipped: title (1), outlines (2, 8, 28). Slides 5 and 6 were the hand-built ones: 5 is the key picture (worth animating), 6 is the key equation (board scene). Gaps filled as 보충: the 784 example, and why M ≪ D matters (the check question).

## hook · 들어가며 · 19s

1. 28 곱하기 28 크기의 손글씨 숫자 이미지는 숫자 784개로 이루어져 있어요.
2. 그런데 이 이미지가 무슨 숫자인지 알려면 정말 784개가 다 필요할까요?
3. 이번 영상에서는 라벨 없이도 데이터를 짧게 요약하는 법을 배워 볼게요.

Picture: Canvas: a 28×28 "7" fills in pixel by pixel; "28 × 28 = 784" in KaTeX beside it (sentence 1). "784개가 다 필요할까요?" (2). Grid shrinks, accent arrow to 3 accent cells "몇 개의 숫자로 요약" (3). Orange "보충 예시" badge.

## goals · 들어가며 · 14s

1. 영상이 끝나면 세 가지를 할 수 있어요.
2. 인코더와 디코더가 각각 무엇을 하는지 설명하고,
3. 오토인코더의 학습 목표를 식으로 쓰고, 그걸 분류 문제에 어떻게 쓰는지 말할 수 있어요.

Picture: Tag + "끝나면 할 수 있는 세 가지"; numbered goals rise in on sentences 2 and 3 (two in sentence 3, at +3.1 s). Source tag "강의자료 슬라이드 3–7".

## s03 · ① 차원 축소 · 29s

1. 고차원 데이터에는 겹치거나 필요 없는 정보가 많아요. 그래서 더 적은 변수로 다시 표현하는 게 차원 축소예요.
2. 변수가 줄면 저장 공간과 계산이 줄어들죠.
3. 대신 조건이 있어요. 원래 데이터를 되살리거나, 나중에 예측하는 데 필요한 정보는 남아 있어야 해요.
4. 그림처럼 D개의 변수를 M개로 줄이는 거예요. 문제는 라벨 없는 데이터만으로 이걸 어떻게 배우느냐죠.

Picture: Slide scene, page 3: hl Motivation box → ul Efficiency → ul Information preservation → spotlight the x→z diagram → hl the Question bullet at +3.4 s in sentence 4.

## s04 · ② 인코더 · 25s

1. 이 줄이는 함수를 인코더라고 불러요. D차원의 x를 받아서 M차원의 z를 내놓죠.
2. 여기서 M은 D보다 훨씬 작아요. 이 z를 잠재 표현이라고 해요.
3. 인코더는 보통 신경망이에요. 층을 지날수록 폭이 좁아지면서 정보가 압축돼요.
4. 그런데 정답이 없는데, z가 무엇을 남겨야 하는지는 누가 알려 줄까요?

Picture: Slide scene, page 4: hl definition → circle "M ≪ D" → circle Latent z at +2.6 s → spotlight the network → hl the closing question.

## s05 · ③ 오토인코더 · 25s

1. 답은 간단해요. z에서 원래 x를 다시 만들어 보게 하는 거예요.
2. 인코더 f가 x를 z로 줄이고, 디코더 g가 z를 다시 엑스 햇으로 펼쳐요.
3. z가 x의 정보를 대부분 담고 있다면, 엑스 햇은 x와 거의 같아지겠죠.
4. 그래서 오토, 즉 스스로라는 이름이 붙었어요. 입력 x 자신이 정답이니까요.

Picture: Rebuilt (슬라이드 5 · 다시 그림): columns 8-6-4-2-4-6-8. Sentence 1: x, then z, then a dashed empty x̂ with "?". 2: encoder columns, "인코더 f", decoder columns, x̂ fills, "디코더 g", formula x → f(x) = z → g(z) = x̂. 3: x and x̂ outlined, pulsing; chip "z에 정보가 충분하면 x̂ ≈ x". 4: orange arc x̂ → x, chip "auto · 입력 x 자신이 정답".

## s06 · ③ 오토인코더 · 21s

1. 이걸 식으로 쓰면 이래요. 학습 데이터 N개 각각을 인코더에 넣고, 디코더로 되살려요.
2. 되살린 결과와 원래 데이터의 차이 d를 평균 내고, 그게 가장 작아지게 f와 g를 학습해요.
3. 차이 d로는 보통 둘을 뺀 벡터의 길이를 제곱한 값, 즉 제곱 오차를 써요.

Picture: Board: objective written term by term in spoken order (x_n, g(f(x_n)), d( ), 1/N Σ, min), meanings under each; sentence 3 wipes in d(·) = ‖x_n − g(f(x_n))‖² with "흔한 선택 · 제곱 오차".

## quiz · 확인 문제 · 14s

1. 잠깐 멈추고 생각해 보세요.
2. 만약 잠재 차원 M을 입력 차원 D와 똑같이 두면, 이 오토인코더는 무엇을 배울까요?

Picture: "확인 문제 · 잠깐 멈추고 생각해 보세요"; question with inline M = D; 5 s countdown ring during hold; 보충 badge.

## answer · 확인 문제 · 14s

1. 답은 거의 아무것도 못 배운다, 예요. 입력을 그대로 베껴 내기만 해도 오차가 0이 되니까요.
2. M을 D보다 훨씬 작게 두는 병목이 있어야, 무엇을 남길지 고르는 법을 배우게 돼요.

Picture: Three 8-cell columns x, z, x̂ joined by straight lines: "그대로 베끼기만 해도 오차 0" (orange). Sentence 2: z collapses to 2 cells, lines converge, label M = D → M ≪ D, chip "병목이 있어야 무엇을 남길지 배운다" (accent).

## s07 · ④ 활용 · 21s

1. 이렇게 배운 인코더는 라벨이 적을 때 특히 쓸모가 있어요. 준지도 학습이라고 하죠.
2. 먼저 라벨이 있든 없든 모든 데이터로 오토인코더를 학습해요.
3. 그다음 인코더로 각 입력을 z로 바꿔요.
4. 마지막으로 라벨이 있는 데이터만으로, z 위에 분류기 h를 학습하거나 미세 조정해요.

Picture: Slide scene, page 7: hl motivation → hl step 1 → hl step 2 → hl step 3 → circle the Classifier h branch at +3.2 s.

## outro · 정리 · 21s

1. 정리하면, 인코더는 x를 작은 z로 줄이고, 디코더는 z에서 x를 되살려요.
2. 되살린 결과가 원래와 같아지도록 학습하면, 라벨 없이도 좋은 표현을 얻어요.
3. 다음 편에서는 데이터를 요약하는 데서 한 걸음 나아가, 새 데이터를 만들어 내는 법을 볼게요.

Picture: Title "차원 축소와 오토인코더"; x —f→ z —g→ x̂ wiped in; two takeaway lines; card "다음 편 · 밀도 추정과 VAE · 슬라이드 9–15"; credit line with course, lecturer, school.
Full source of the prototype's hand-built scenes (hook, rebuilt autoencoder, quiz answer): `references/example-vae-scenes/`.
