# Verification
verifier: Claude Opus 5.5 (fresh verifier subagent), 2026-10-28
layer1: FAIL 0 WARN 0

| claim / line | layer | verdict | note | fix |
|---|---|---|---|---|
| c01 / hook.0-1 (`28 \times 28 = 784`) | 2 | ok | example, recomputed 28 × 28 = 784; 28×28 grayscale handwritten digit is a correct illustration; "보충 예시" badge visible in hook.0-2 frames | - |
| c03 / s03.0 | 2 | ok | matches slide 3 Motivation ("redundant or unnecessary information … fewer variables"); hl on the Motivation block | - |
| c04 / s03.1 | 2 | ok | Efficiency bullet; ul on that line | - |
| c05 / s03.2 | 2 | ok | Information preservation bullet, both "reconstruction" and "downstream prediction" kept; ul on that line | - |
| c06 / s03.3, hook.2, goals.0 | 2 | ok | Question bullet; figure boxed, then hl on the Question line | - |
| c07 / s04.0-1, goals.1, outro.0 | 2 | ok | f: R^D → R^M, z = f(x), M ≪ D kept; "잠재 표현" = latent representation | - |
| c08 / s04.2 | 2 | ok | "can be neural networks" is slide 5; "층을 지날수록 폭이 좁아지며" matches slide 4 figure (layers narrow to z). "보통" is a mild strengthening of "can be", acceptable | - |
| c09 / s04.3 | 2 | ok | slide 4 bottom question; hl on that line | - |
| c10 / s05.0-1 (`x \to f(x) = z \to g(z) = \hat{x}`) | 2 | ok | formula identical to slide 5; redraw keeps x, z, x̂, Encoder f, Decoder g and the hourglass shape; source tag "슬라이드 5 · 다시 그림" | - |
| c11 / s05.2 (`\hat{x} \approx x`) | 2 | ok | slide: "if z captures most of the information, we may be able to reconstruct x"; caption hedged with "~다면 … 거의 같아지겠죠" | - |
| c12 / s05.3 | 2 | ok | "auto" = input is its own reconstruction target | - |
| c13 / s06.0-1 (`\min_{f,g} \frac{1}{N}\sum_{n=1}^{N} d(x_n, g(f(x_n)))`) | 2 | ok | same notation as slide 6 (min over f,g, 1/N, n=1..N, d, x_n); explanation (average of d over N samples, minimise over f, g) correct | - |
| c14 / s06.2 (`d(x_n, g(f(x_n))) = \|x_n - g(f(x_n))\|^2`) | 2 | ok | matches slide 6 "A common choice"; "흔한 선택" qualifier kept; squared Euclidean norm described correctly | - |
| c15 / quiz, answer (`M = D`, `z, M \ll D`) | 2 | ok | supplement; correct (with M = D the identity map gives zero reconstruction error, so no useful compression is forced; undercomplete AE, Goodfellow et al. 14.1). Follows from slide 4's M ≪ D. 보충 badge visible in quiz.0-1 and answer.0-1 frames | - |
| c16 / s07.0 | 2 | ok | slide 7 Motivation; hl on that line | - |
| c17 / s07.1 | 2 | ok | step 1, "both labeled and unlabeled" kept; hl on step 1 | - |
| c18 / s07.2 | 2 | ok | step 2; hl on step 2 | - |
| c19 / s07.3 | 2 | ok | step 3, "train or fine-tune", "labeled observations" kept; hl on step 3, then circle on "Classifier h" (box matches line b7.1) | - |
| c20 / space.0-2 (`z = f(x)`, `g(z) = ?`) | 2 | ok | supplement, reasonable: AE maps each x to one point (slide 29); nearby codes for similar inputs follows from a continuous encoder; regions between codes are unseen by the decoder during training. Marked "개념도" and 보충 badge visible in all three frames | - |
| c22 / outro.2 | 2 | ok | next topic density estimation, slide 9 quote correct | - |
| derived claims | 2 | ok | none in claims.json; the only arithmetic (28 × 28 = 784, c01) is recomputed above | - |
| slide order 3 → 4 → 5 → 6 → 7 | 3 | ok | lecture order; quiz between 6 and 7 is fine; no overlay pages in range | - |
| skipped pages | 3 | ok | 1 (title), 2 and 8 (outline) skipped as planned in lecture-map.md; all bullets of 3-7 covered (slide 5's "We want z to capture most of the information" folded into s05.2) | - |
| recap / wrap-up | 3 | ok | Ep 1 has no previous episode; outro names Ep 2 "밀도 추정과 잠재 변수 모델", 슬라이드 9–15, matching lecture-map.md | - |
| glossary | 3 | ok | 차원 축소, 인코더, 디코더, 잠재 표현, 준지도 학습, 밀도 추정 used as in lecture-map.md | - |
| marks (s03, s04, s07) | 4 | ok | every mark at mid-line sits on the line the caption is about: s04.1 circle on "where M ≪ D" then on Latent z / z ∈ R^M; s04.2 box on the encoder figure; s07.3 circle on "Classifier h" | - |
| overlaps / cropping | 4 | ok | nothing under the chapter chip, chapter strip or source tag; slides not cropped; in space.2 the "디코더가 본 적 없는 곳 · g(z) = ?" label touches the edge of the top-left cluster but stays readable | - |
| typeset math | 4 | ok | all formulas in VERIFY_auto render via KaTeX in the previews and match slides 5 and 6 | - |
| 보충 badges | 4 | ok | visible in hook (보충 예시), quiz, answer, space | - |
| rights | 5 | ok | outro credit "Machine Learning · Autoencoders and Variational Autoencoders · Sangdon Park, POSTECH"; supplement source (Goodfellow, Bengio, Courville, Deep Learning 14.1) recorded in claims.json; voice recorded in narration.md (supertonic F1). The delivery message must state the slides belong to the instructor before any public posting | - |

overall: PASS
