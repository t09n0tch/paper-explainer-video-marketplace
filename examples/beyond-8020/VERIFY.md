# Verification
verifier: Claude Opus 5.5 (fresh-context verifier subagent, round 2), 2026-10-28
layer1: FAIL 0 WARN 0 (verify/VERIFY_auto.md, 72 claims, 222 onscreen strings)

| claim / line | layer | verdict | note | fix |
|---|---|---|---|---|
| c02 intro.2, results.3 | 2 | ok | Abstract: comparable on 8B, surpasses on 14B/32B. "유지되거나 오히려 오른다" keeps both cases. | - |
| c04/c05 rlvr.1 | 2 | ok | Eq. (3): R = 1.0 if equivalent, 0.0 otherwise. Matches. | - |
| rlvr.2 card "한 풀이 안의 토큰은 모두 같은 어드밴티지" | 2 | ok | Eq. (3): Â depends on response i only. Correct reading. | - |
| c10 pattern.0 | 2 | ok | "over 10^6 response tokens", Qwen3-8B, AIME'24/'25. "1,000,000개가 넘는" is correct. | - |
| c11 pattern.1/2 | 2 | ok | 50.64% below 10^-2; top 20% above 0.672. Card shows 50.64%, caption says "절반이 넘는"; consistent. | - |
| c12 (derived) | 2/4 | ok | Recomputed: 10^-2 = 0.01. Label "10의 −2제곱 = 0.01" is on the card (preview pattern.1). | - |
| c14-c17 forks.0-2 | 2 | ok | Words in the paper's list (wait, however, thus, suppose, since, because); restricted to frequency >100 (shown on card). Low end: suffixes, code fragments, math components. | - |
| c20-c23, c71 temp.0-3 | 2 | ok | Fig. 3, Qwen3-8B, AIME 2024+2025 average (stated on card). Lowering T_high hurts more than lowering T_low; raising T_low gives nonsensical output. Direction right. | - |
| c24-c28 overlap.0-3 | 2 | ok | Table 1 Base Model row 100 / 93.04 / 87.45 / 86.67 at steps 0 / 160 / 864 / 1360; Qwen3-14B base, DAPO. Card says "Table 1 일부". | - |
| c30/c31 change.0-2 | 2 | ok | Fig. 4 (5% percentile bins) and Fig. 5. Matches. | - |
| c33-c36 method.0-3 | 2 | ok | Eq. (6): indicator on the advantage, normaliser over kept tokens, ρ = 20% in main results. Typeset in the paper's notation. | - |
| c38-c41 mask.3 | 2 | ok | ε_high 0.28, ε_low 0.2, max length 20480, batch 512, no KL or entropy loss, DAPO-Math-17K: all match Sec. 5.2. | - |
| c42-c48 results.0-3 | 2 | ok | Table 2 Acc@16, all six AIME values and deltas (+5.21, +4.79) match. The metric is higher-is-better, the baseline is vanilla DAPO with all tokens, both are stated. "8B 차이가 거의 없었어요" matches "performance remains unaffected" (+1.25 / +0.83, visible on bars). | - |
| c49-c52 scaling.0-1 | 2 | ok | Average row +0.53 / +2.99 / +4.10 over 6 benchmarks. Monotone in size, so "클수록 이득이 커져요" holds for the averages as well as for Fig. 8. | - |
| c53/c54 scaling.2 | 2 | ok | Fig. 10: the 32B forking-token run, continued at max length 29696, AIME'24 63.54 → 68.12. The card says "갈림길 토큰 학습을 이어서 진행". | - |
| c55 ablation.0-1 | 2 | ok | Fig. 7(a)(b), Qwen3-8B (stated on card). "Substantial decline" though 80% of tokens are used. | - |
| c56/c57 ablation.2-3 | 2 | ok | ρ of 10/50/100% gives persistently lower overall entropy; balance is the authors' interpretation, labelled "(저자 해석)". | - |
| c58-c61 discuss.0-3 | 2 | ok | Discussion 3 and Discussion 1. The hypothesis is labelled as the authors' hypothesis and not experimentally tested. | - |
| c63/c64 caveats.0 | 2 | ok | Llama-3.1-8B gets ~1% training accuracy, so cold-start SFT from Qwen3-32B answers is used; the authors call it less convincing. | - |
| c65 caveats.1 | 2 | ok | Paper says DAPO-Math-17K "primarily consists of mathematical data". The caption "수학뿐" is slightly strong, but the card says "DAPO-Math-17K만 학습", which is exact. No change needed. | - |
| c51/c66 caveats.2 (1378.22 → 1378) | 2/4 | ok | 7227.03 − 5848.80 = 1378.23 (table prints +1378.22). Rounded to 1378 in the caption; the card shows the exact 5848.80 → 7227.03. Consistent. | - |
| caveats.2 card "추론 비용도 그만큼 듦 (내 판단)" / c72 (opinion) | 2/4 | ok | Now labelled "(내 판단)" on the card (preview caveats.2/3), and opinion claim c72 is in claims.json with used_in caveats.2. Longer responses cost more inference compute, so the judgement is fair. | - |
| c67 caveats.3 (opinion) | 2 | ok | The paper reports no run-to-run or seed variance; only Fig. 9 mentions smoothing for high variance. The judgement is fair and labelled "내 판단" on the card. 16 samples per question matches Sec. 5.2. | - |
| c68 / outro.1 | 2 | ok | Abstract: "efficacy of RLVR primarily arises from optimizing the high-entropy tokens", plus the scaling trend. "대부분" keeps the qualifier. | - |
| c09 entropy.2 (example) | 2/4 | ok | Both example distributions sum to 1.0. The peaked one has H ≈ 0.21 nats and the spread one ≈ 1.36 nats, so the ordering is right. The label "확률은 설명용 예시" shows on both cards. | - |
| c13 pattern.* (example) | 2/4 | ok | Grid split 51 / 29 / 20 is consistent with 50.64% and 20%. The plane is labelled 0.672 on an illustrative scale, and "높이는 예시" is shown top-left. | - |
| c29 overlap.* (example) | 4 | ok | Label "행 배치와 이동한 칸은 예시" on card. | - |
| c32 change.1-2 (example) | 4 | ok | "증가 폭은 예시" on card. | - |
| c62 discuss.* (example) | 4 | ok | "높이 변화는 개념도" visible bottom-left. | - |
| c37 mask.0-3 (example) | 4 | ok | The label "한 줄 = 한 응답 · 엔트로피 높이는 예시" now has a solid background and reads clearly over the tiles and beams in mask.1-mask.3 (checked full-size frame mask.2). | - |
| c18 intro, rlvr, ablation, outro, change (example) | 4 | ok | Every road scene now shows "토큰은 부록 그림 13의 풀이에서 · 높이는 예시" on a solid chip at the bottom left (seen in all intro, rlvr, change, ablation and outro frames). c18 used_in covers these lines. change also keeps "증가 폭은 예시" (c32). | - |
| c18 forks.0-3 (example) | 4 | ok | The note now has a solid background and stays readable where the front tiles pass behind it (checked full-size frame forks.3). | - |
| intro.0-2 title block | 4 | ok | Road word pins left of x 1000 and above y 620 are hidden. The subtitle no longer collides with any pin (checked full-size frames intro.0 and intro.2). A faded "impossible" pin at the far left sits under the gradient, clear of the text. | - |
| equations (entropy, rlvr, temp, method, mask) | 4 | ok | All are typeset with KaTeX in the paper's notation (H_t, p_{t,j}, T_high / T_low, 𝕀[H ≥ τ_ρ^B], ε_high / ε_low); no ASCII stand-ins on screen. | - |
| on-screen numbers vs captions | 4 | ok | 50.64%, 20%, 0.672, 86.67% and Table 1 values, the Table 2 bars (2 dp), +0.53 / +2.99 / +4.10, 20480 / 29696 / 63.54 / 68.12 and 5848.80 / 7227.03 all agree with the captions and claims, with the same rounding. | - |
| frame content per line | 4 | ok | Each mid-line frame shows what the line says. entropy.0 shows only "H_t :=" while the formula builds, which fits "엔트로피로 재요". Mechanism scenes (method, mask) open with the formula or setup before the mechanism. Captions stay clear of cards. | - |
| discuss.3 title | 4 | ok (minor) | As the camera moves, a fork tile rises behind the end of the title "…RL은 유지". The text is drawn over the tile and stays legible, so no change is needed. | - |
| flow | 3 | ok | Order is problem (RLVR, all tokens) → entropy patterns → RLVR preserves patterns → method → results → ablation → discussion → 감안할 점 → outro. The headline abstract claims are all present: scaling, bottom-80% decline, and 8B comparable. Prior work (DAPO, clip-higher, entropy bonus) is attributed and not claimed as the paper's own. There are no "최초 / 최고 / 실시간" claims; the SoTA claim of Fig. 1 is not used. The ablation where 10% and 100% hurt is not hidden; the entropy result is shown. | - |
| licensing | 5 | ok | meta.json records the arXiv non-exclusive license and that figure reuse is not allowed. All visuals are redrawn: the road, grids and bars come from table values, and no paper figure image is used. There are no dataset images or logos; the affiliations are text only. The voice is recorded in voice.log (supertonic, F1). | - |

overall: PASS
