# Verification

Every number and claim in the film is tied to the paper, checked by a script against the
paper's text and against what the player actually showed, and then checked again by a
verifier that did not write the film. Only a film that passes goes to the final render.

Adapted from SunandBean/paper2video (MIT, Sunbin Kim): claims ledger, on-screen text
capture, fresh-context verifier with five layers.

## Files

| File | Written by | What |
|---|---|---|
| `paper/paper.txt`, `paper/meta.json` | `paper_text.py` | the paper's text (quotes are matched here), source and license |
| `claims.json` | you | every factual statement and every number the film says or shows |
| `verify/onscreen.json` | `render.py --preview`, `--scan`, full render | every string that held on screen, per scene |
| `verify/preview_NN.jpg`, `preview_index.md` | `render.py --preview` | one frame at the middle of every narration line |
| `verify/VERIFY_auto.md` | `check_claims.py` | layer 1 result |
| `VERIFY.md` | the verifier subagent | layers 1-5, verdict |

## claims.json

```json
{
  "claims": [
    { "id": "c01", "kind": "quote", "used_in": ["setting.1"], "text": "비싼 물건 5점, 싼 물건 1점",
      "quote": "high-value objects are worth 5 points and low-value objects 1 point" },
    { "id": "c02", "kind": "table", "used_in": ["results.0", "results.1"], "text": "RRARA 0.77 → 지연 반영 0.10",
      "table": "Table 2", "row": "RRARA", "values": ["0.77", "0.10"] },
    { "id": "c03", "kind": "derived", "used_in": ["results.2"], "text": "7.7배 차이 (0.77 / 0.10)",
      "from": ["c02"], "derivation": "0.77 / 0.10 = 7.7", "on_screen_label": "계산값" },
    { "id": "c04", "kind": "opinion", "used_in": ["caveats.0"], "text": "기준선은 미세조정을 받지 않았다",
      "on_screen_label": "감안할 점" },
    { "id": "c05", "kind": "example", "used_in": ["formula.2"], "text": "점수 구성 3 + 2 + 1 은 설명용으로 만든 값",
      "values": ["3", "2", "1"], "on_screen_label": "예시" }
  ],
  "allow_numbers": { "4": "equation number shown as the source, 논문 식 (4)" }
}
```

- `used_in` lists every narration line that says or shows the claim: `<scene id>.<caption index>`, from 0.
- `quote`: copied verbatim from `paper.txt` (prose; avoid spans with math glyphs, which extract badly).
  Quotes stay in the paper's language; `text` is how the film says it, in Korean.
- `table`: `table` as printed in the caption ("Table 2"), `row` = the row label as printed, `values` = exact printed strings.
- `derived` (your arithmetic), `opinion` (your judgement), `example` (illustrative values the paper does
  not give) are never trusted by the script; each needs an `on_screen_label` that the film really shows
  in the scenes listed in `used_in`.
- Rounded display values: put the exact source value in `text` ("141.72 → 142 으로 표시").
- `allow_numbers`: numbers that are not data (equation and section numbers, ids, model names read aloud
  such as "GPT-4", axis gridlines), each with a reason.

## Layer 1. Numbers and sentences (mechanical): `check_claims.py film/`

Required: **FAIL 0, WARN 0**. It looks at captions, `say` lines (digits, English number words, Korean
Sino numerals such as 삼십칠 or 영 점 칠칠), string literals in `scenes/*.js` and shared files, and
`verify/onscreen.json`. The last is the one that matters: numbers computed in JS (bar values, counters,
`v.toFixed(2)`) only exist there. A string counts once it holds still for two samples, so a counter
tweening to 0.77 records 0.77, not every value on the way.

- A number is covered only through a claim that passed, or `allow_numbers`.
- A caption number above 10 must come from a claim whose `used_in` lists that line, so "42개" cannot
  vouch for "42% 향상".
- A number the voice says (`say`) must also be in that line's caption.
- `table` claims are searched only inside the cited table.
- onscreen.json older than the script or scenes is a WARN: re-run `render.py --preview`.

## Layer 2. Conditions and context (verifier)

For each result claim, the conditions the paper attaches, and whether the film keeps them:
benchmark, split, metric direction (higher/lower is better), units; who the baseline is and the
comparison set ("비교한 방법 중"); training condition (fine-tuned? ablation subset?); hardware and
input size for speed or memory; headline number versus a cherry-picked row.
Verdict per claim: `ok` / `missing-qualifier` / `misleading` / `wrong`.

## Layer 3. Flow (verifier)

- The script follows the paper's logic: problem → method → results → limits.
- The paper's contributions are not confused with prior work it cites.
- The abstract's headline claims are represented; nothing is contradicted later in the paper.
- The limitations are reflected, and the 감안할 점 chapter is there. An ablation that hurt a metric is not hidden.
- No claim the paper does not make ("실시간", "최고 성능" without its qualifier, "최초").

## Layer 4. Screen (verifier, with the preview sheets)

- On-screen numbers = captions = claims, with the same rounding everywhere.
- `derived` / `opinion` / `example` values carry their label on screen.
- Every equation is typeset (KaTeX) in the paper's notation; no ASCII stand-ins like `S_T` or `lambda`.
- Nothing overflows a card, overlaps the caption band (bottom ~200 px) or the chip, or sits off-frame.
- At the middle of each line, the picture shows what that line is saying (no blank or half-built frame).
- Every mechanism scene opens with a location cue (which part of the system or pipeline) before the mechanism.

## Layer 5. Licensing (verifier)

- `paper/meta.json` license and `figure_reuse` noted; no paper figures unless allowed, and then credited
  ("adapted from ..., CC BY 4.0, changes made").
- No dataset imagery or company logos. The voice used is recorded.

## Running the verifier

Spawn a fresh subagent with the Agent tool (a different model if the session allows). It must not be
the context that wrote the script. Give it only paths, not your conclusions:

> You verify a paper explainer film against its paper. Read `<absolute path of this verification.md>`,
> then, in `<film>/`, `paper/paper.txt`, `paper/meta.json`, `script.json`, `claims.json`, `scenes/*.js`,
> `verify/VERIFY_auto.md`, `verify/onscreen.json`, `verify/preview_index.md` and look at every
> `verify/preview_*.jpg`. Do layers 2-5 (layer 1 is VERIFY_auto.md; recompute every `derived` claim and
> judge every `opinion` and `example`). Write `<film>/VERIFY.md` in the format below. Do not edit any other file.

```
# Verification
verifier: <model/agent>, <date>
layer1: FAIL 0 WARN 0
| claim / line | layer | verdict | note | fix |
...
overall: PASS | FIX-AND-RERUN | BLOCKED (needs user)
```

Loop: fix what it found, re-run layer 1 and `render.py --preview` for what changed, and send the changed
claims and scenes to a new verifier. After 3 rounds without PASS, stop and report BLOCKED with the open items.
