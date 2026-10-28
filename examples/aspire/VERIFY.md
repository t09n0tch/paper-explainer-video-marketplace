# Verification
verifier: Claude Opus 5.5 (fresh-context verifier subagent, round 3 of 3), 2026-10-28
layer1: FAIL 0 WARN 0 (72 claims, 214 onscreen strings; onscreen.json 14:38:49 is newer than script/claims 14:36:39, scenes ≤ 14:38:38 and templates 14:29:40; REVIEW items c40 derived, c56 example handled below)

Sources checked: paper.txt (§3.1 setup lines 412–436, Table 6 lines 1542–1553, §3.7 Rubik lines 607/646/990, abstract), meta.json, script.json (49 lines), claims.json (c01–c73), scenes/rubik.js, more.js, models.js, libero.js, real.js, transfer.js (changed since round 2), templates.js, verify/onscreen.json, preview_index.md, preview_01–04.jpg, and full-resolution frames verify/preview/0026, 0029, 0034, 0036, 0039.

Recomputed:
- Table 6 (Opus 4.6, 100-trial held-out): the per-task gains are cube_lift 0, cube_stack +1, cube_restack +11, spill_wipe −1, two_arm_handover +72, two_arm_lift −3 and nut_assembly +9, so handover is the largest of the 7 ✓. The printed Mean is 68.0% → 81.0% ✓ (c71, c73).
- c40: 11.27 / 2.01 = 5.607, about one sixth ✓. Rubik's cube times: 16.97 min → 3.09 min = 16 min 58 s → 3 min 05 s ✓.
- Real robot: 61.94 / 6.58 = 9.4×, "거의 열 분의 일" ✓. Table 1 coding agent = GPT-5.5 in Codex (line 432–433) ✓ (c72).
- LIBERO-Pro gains 76.5 (shown as the paper's 77) / 41.5 / 42.5; transfer 30.5 → 31 (22.6 / 38.3); Table 18 numbers are unchanged from round 2 ✓.

## Rows carried from round 2

| claim / line | layer | verdict | note | fix |
|---|---|---|---|---|
| c25 / more.0 (Robosuite scope) | 2/3 | ok, resolved | The ASPIRE 92% row now reads "7개 과제 중 가장 크게 오른 과제 · 7개 평균 68% → 81%" (frame 0026, legible). It is backed by c71 (Table 6 Mean) and c73 (two_arm_handover), both PASS and both `used_in` more.0. The note appears at t 0.66, during more.0. | none |
| R2-1 rubik.0-1 skill cards | 4 | ok, resolved | The cards box is now [140,120,1640,340] with cardH 250. All four bodies are one line inside their cards with margin (frame 0036), and the bars and right card no longer collide. | none |
| R2-2 rubik right card fragment | 4 | ok, resolved | The body is now "시간 16분 58초 → 3분 5초 · 토큰 약 6분의 1 (계산값)". The dangling fragment is gone and the 계산값 label is still shown for c40. | none |
| R2-3 models.2 card | 4 | ok, resolved | Card h 200 / cardH 140: the body line has a clear bottom margin (frame 0039). It reads "(논문 초록)". | none |
| R2-4 libero.0 model scope | 2 | ok, minor residual | It now reads "시뮬레이션 결과는 모두 Claude Opus 4.6 기준", and the real table source says "실제 로봇의 코딩 에이전트는 GPT-5.5" (c72 ✓, frame 0034). The paper scopes this to "the main results" (line 412). The later models and casestudy scenes are also simulation but explicitly name other models, so a viewer is not misled. | optional: "주요 시뮬레이션 결과는 모두 …" |
| R2-5 more.1 caption wrap | 4 | ok, resolved | The caption now breaks after "사람이 짠" / "프로그램보다 높아요." with no break before a particle (frame 0026). | none |
| c24, c26/c27, c29/c30, c32, c40, c37/c38, c42–c44, c12, abstract headline (round-1 rows) | 2/4 | ok | These are unchanged from round 2 and re-checked on the sheets. Numbers on screen = captions = claims. | none |
| c61–c70 | 2 | ok | Same as round 2, except c68 (see R3-1). | none |
| c01–c23, c28, c31, c33–c36, c45–c60 | 2 | ok | Unchanged scenes; sheets 1–4 show the same content as round 2. | none |
| c56 / evo.1 (example) | 2/4 | ok | "막대 높이는 예시" is on screen, and the bars carry no numbers. | none |

## New rows (round 3)

| claim / line | layer | verdict | note | fix |
|---|---|---|---|---|
| R3-1 c68 / rubik.0-1 model (GPT-6 Astra) | 2 | missing-qualifier (regression) | The re-layout changed the bar title from "GPT-6 Astra · 3회 시도, 1회차는 실패" to "면 하나당 토큰 · 3회 시도, 1회차 실패". "GPT-6 Astra" now appears nowhere in the rubik scene (onscreen.json, rubik.js) or its captions. The scene directly follows the real-robot table sourced "코딩 에이전트는 GPT-5.5" under the same "실제 로봇" chip, so a viewer will assume the Rubik's cube run used GPT-5.5. The paper says GPT-6 Astra (§3.7, line 607; Fig. 6 caption). c68's `used_in` [rubik.0, rubik.1] also no longer matches anything the film shows. | In scenes/rubik.js, set the bars title to `'면 하나당 토큰 · GPT-6 Astra · 3회 시도, 1회차 실패'` (or add `· GPT-6 Astra` to the cards title). Re-run check_claims and `render.py --preview`, then confirm frame 0036. |
| c71 / c73 (new table claims) | 2 | ok | Table 6 values are exact. The Opus 4.6 condition is covered by libero.0, and 100-trial held-out is the paper's protocol. | none |
| c72 (new quote) | 2 | ok | "we use OpenAI Codex … with GPT-5.5" (§3.1) ✓. `used_in` real.1/real.2 matches the source line shown from t 16.33. | none |
| transfer layout | 4 | ok | The flow sits at y 350–550, and the bars and card sit below without overlap. The card text "N = 0, 25, 50, 90 … (그림 5b)" fits (frame 0029). The flow boxes have some empty lower space, which is cosmetic. | none |
| flow | 3 | ok | Problem → components → example → results (protocol caveat, Robosuite scope now stated) → transfer and ablation → real robot → model dependence and abstract headline → case study → 감안할 점 → outro. No unqualified 최초/최고/실시간. | none |
| equations / location cues | 4 | ok | There are no equations. Mechanism scenes open under the component chip. | none |
| layout (rest) | 4 | ok | Nothing overflows a card, enters the caption band or the chip, or sits off-frame on sheets 1–4. No half-built frame at a line midpoint. | none |
| licensing | 5 | ok | CC BY 4.0, figure reuse allowed with attribution. Everything is redrawn and credited in the outro ("그림은 모두 다시 그림"). No dataset imagery or logos. The voice is supertonic F1 (recorded in narration.md and the manifest). | none |

overall: FIX-AND-RERUN. One open item: R3-1, a GPT-6 Astra label lost from the rubik scene (missing-qualifier, one-line fix). R2-4 has an optional wording tweak. This is round 3 of 3: if R3-1 is not fixed and confirmed by layer 1 plus the rubik preview frame, report BLOCKED with R3-1 open.
