# Worked example: Beyond the 80/20 Rule (arXiv 2506.01939)

A film the user accepted after asking for a 3D world that fits an LLM paper instead of the
robotics-looking room: 16 scenes, 6 min 19 s, Korean narration (Supertonic F1). Use it for how to
turn an abstract ML idea into one continuous 3D world. Don't copy its wording or numbers.

**The whole film ships as code**: `p2v new example/ --example forks` copies `script.json`,
`claims.json` (72 claims), `world.js` (`window.FORK`, shared by every 3D scene) and `scenes/*.js`;
`p2v paper example/ 2506.01939` fetches the paper (not shipped: arXiv non-exclusive license), then
`p2v voice`, `p2v preview`, `p2v check` (FAIL 0, WARN 0). The independent verifier passed it in round 2;
round 1 asked for the illustration label on every scene that reuses the road, and solid backgrounds
under labels that sit over 3D.

Paper: Wang et al. (Qwen Team, Alibaba; LeapLab, Tsinghua), NeurIPS 2025. In chains of thought only a
minority of tokens have high entropy; they act as forks. RLVR mostly keeps the base model's fork
positions and mostly changes their entropy. Training DAPO on only the top 20% highest-entropy tokens
matches full training on Qwen3-8B and beats it on 14B and 32B; training on the bottom 80% hurts.

## The world in one sentence

A chain of thought is a road of token tiles; a tile's height is its entropy; fork tokens are tall
glowing pillars where faint alternative paths branch off; the learning signal falls as beams of light.

`world.js` builds it from four pieces: `tile` (box with base at z=0, `setH`, `tint`), `beam` (open
cylinder, additive blending, landing ring), `plane` (translucent threshold with outline), `road` (25
tokens from the paper's appendix CoT, with branches at forks and a goal block), plus `batch` (rows of
tiles with the 80th-percentile cut computed from their heights) and `pin` (HTML label on a 3D point).
Every height is illustrative and every scene that shows them carries a 예시 label.

| technique | scenes |
|---|---|
| the road from different cameras: build, rise, branch, dolly | intro, rlvr, forks, change, ablation, discuss, outro |
| beams as gradients: on every tile (DAPO), on forks only (method), on flat tiles in `--main` (bottom-80% ablation) | rlvr, mask, ablation, intro |
| 100 tiles sort from shuffled to ranked; the top 20 rise above a threshold plane | pattern |
| one row per training step, stacked in depth, so stable fork columns read as overlap (Table 1) | overlap |
| a batch of rows, a plane rising to the top-20% cut, beams only above it | mask |
| heights changing with a wireframe ghost of the old height | change, discuss |
| templates (`formula` in two rows for Eq. 6, `groupBars`, `bars`, `cards`, `compose` with a formula) | entropy, temp, method, results, scaling, caveats |

## Structure

| chapter | scenes | job |
|---|---|---|
| (title) | intro | the road; forks rise and branch; the takeaway |
| ① 배경 | rlvr, entropy | RLVR on the road (every tile gets the same beam), Eq. 1 with a peaked vs spread example |
| ② 엔트로피 패턴 | pattern, forks, temp | 50.64% below 0.01, top 20% above 0.672; fork words; Eq. 5 temperatures |
| ③ RLVR이 바꾸는 것 | overlap, change | 86.67% overlap at step 1360; high-entropy tokens change most |
| ④ 방법 | method, mask | Eq. 6 term by term; the masked batch in 3D |
| ⑤ 결과 | results, scaling, ablation | Table 2 AIME bars; average gain grows with size; bottom 80% and other ratios |
| ⑥ 논의 | discuss | entropy bonus vs clip-higher vs SFT on the same road |
| ⑦ 감안할 점 | caveats | Qwen-only, math-only, longer responses, no run-to-run variance |
| (end) | outro | the road with forks lit, title held |

## Lessons from making it

- Camera at positive y: from negative y the road read right-to-left (`scene-api.md`, Pitfalls).
- Keep the 3D on one side and cards on the other by aiming the camera at a point beside the world's
  centre, then pull back until the tallest tile clears the top edge.
- Labels over 3D need a solid background; a bare `.src` line disappears into tiles and beams.
- Hide word labels that fall under a title block instead of shrinking the title.
