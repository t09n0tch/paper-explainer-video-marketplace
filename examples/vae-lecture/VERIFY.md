# Verification
verifier: claude-opus-5-5 (fresh verifier subagent, round 3), 2026-10-28
layer1: FAIL 0 WARN 0

| claim / line | layer | verdict | note | fix |
|---|---|---|---|---|
| c00 / hook.0-2 | 2 | ok | Carried forward. 보충 example; 28 × 28 = 784 is correct, and the "보충 예시" badge is visible in all three hook frames. | — |
| hook formula `28 \times 28 = 784` | 2 | ok | Carried forward. | — |
| goals.0-2 | 2 | ok | Carried forward. Matches slides 4–7; source tag 3–7. | — |
| s03.0-3 / c01-c04 | 2 | ok | Carried forward. Matches the slide 3 Motivation, Efficiency, Information preservation, the diagram and the Question. | — |
| s04.0-1 / c05, c06 | 2 | ok | Carried forward. f : ℝ^D → ℝ^M, M ≪ D, z = latent representation. | — |
| s04.2 / c07 (round 1: missing-qualifier) | 2 | ok — fixed | Now "인코더는 신경망일 수 있고…", which matches slide 5's "can be neural networks". "층을 지날수록 폭이 좁아지면서" describes the slide 4 figure. The audio s04_02.wav was re-voiced (15:22) and the narration.md timing updated (6.2 s). | — |
| s04.3 / c08 | 2 | ok | Carried forward. | — |
| s05.0-3 / c09-c12, s05 labels and formulas | 2 | ok | Carried forward. `x \to f(x) = z \to g(z) = \hat{x}` is identical to slide 5. The hedge ("~다면 … 거의 같아지겠죠") is kept. | — |
| board formulas | 2 | ok | Carried forward. Re-checked in round 2 against p06.png: `\min_{f,g}`, `\frac{1}{N}\sum_{n=1}^{N}`, `d(x_n, g(f(x_n)))` and `\|x_n - g(f(x_n))\|^2` all match. | — |
| board.0 / c13 | 2 | ok | Carried forward. | — |
| board.1 / c13 (round 1: missing-qualifier) | 2 | ok — fixed | The line now says "차이 d, 즉 재구성 오차를 N개에 대해 평균 내고…", matching slide 6 ("minimizing the reconstruction error") and the glossary term. The say line matches, board_01.wav was re-voiced, and the d-term sub-label is "차이 · 재구성 오차". | — |
| board.2 / c14 | 2 | ok | Carried forward. "흔한 선택" is on screen. | — |
| c15 / quiz.1, answer.0-1 | 2 | ok | Still correct. The new source (Goodfellow, Bengio and Courville, *Deep Learning*, §14.1 Undercomplete Autoencoders) is apt: that section motivates the undercomplete code by the copying failure. The 보충 badge is visible in the quiz and answer frames. | — |
| quiz/answer formulas | 2 | ok | Carried forward. | — |
| s07.0-3 / c16-c19 | 2 | ok | Carried forward. | — |
| outro.0-1 / c09, c20, outro formula | 2 | ok | Carried forward. | — |
| outro.2 / c21, next-episode card (round 1: misleading) | 3 | ok — fixed | The card title is now "밀도 추정과 잠재 변수 모델", sub "요약에서 생성으로", 슬라이드 9–15. This matches slides 9–15 (density estimation on 9–11, latent variables on 12–15) and the lecture map's episode 2. c21's quote is on p09 ("Density estimation learns a probabilistic model"). | — |
| flow: slide order 3→4→5→6→(quiz)→7 | 3 | ok | Carried forward. Slides 1, 2 and 8 (title and outlines) are skipped as planned. This is the first episode, so there is no recap. | — |
| glossary | 3 | ok — fixed | 재구성 오차 is now used (board.1 and the board label). All other terms are consistent. | — |
| board.1 frame: sub-labels under `d\Big(` and `x_n` (round 2: misleading) | 4 | ok — fixed | scenes/board.js (15:24:24) has the d-term label back to "차이". The preview (15:24:26-28) is newer than it. In preview/0019.png and 0020.png the labels read as five separate items: "f, g를 골라 최소화", "N개의 평균", "차이", "원래 데이터", "되살린 데이터". "차이" no longer runs into "원래 데이터", and the d( column is no wider than its glyph, so the formula spacing reads like slide 6. | — |
| board heading "오토인코더 학습 목표 · 재구성 오차 최소화" | 2 | ok | New. It matches slide 6's title "Autoencoder Learning Objective" and its "by minimizing the reconstruction error" (c13), and the glossary term 재구성 오차. It contains no numbers. In 0018-0020 and on preview_02 it sits clear of the chapter chip and the source tag. | — |
| board term timing | 4 | ok | At board.1's mid-line (4.4 s), the Σ term and its "N개의 평균" label are up, matching the voice ("N개에 대해 평균"). `min_{f,g}` arrives at 4.4 s, about 2 s before the voice says "f와 g를 학습". This is within the same line and acceptable. | — |
| s03, s04, s05, s07 marks and frames | 4 | ok | Carried forward. Re-checked on all three round-3 sheets, with nothing new. The s04.2 frame shows circles on the network and on Latent z, and the voice now describes that figure. | — |
| quiz/answer frames | 4 | ok | Carried forward. | — |
| chapter chip / strip / source tag | 4 | ok | Nothing hidden and no slide cropped. | — |
| outro frames | 4 | ok | The next-episode card (0031.png) is legible and clear of the summary lines and the credit line. | — |
| rights | 5 | ok | The outro credits "Sangdon Park, POSTECH". c15 now cites its textbook source, and c00 is an original illustration with a reason. narration.md records the voice (supertonic F1 TTS). The delivery message must state that the slides belong to the instructor before any public posting. | — |

overall: PASS
