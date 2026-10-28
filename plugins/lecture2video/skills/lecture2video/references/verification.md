# Verification

An episode is checked against the professor's slides: everything it says or shows either comes
from a slide (and is cited by page), or is marked on screen as 보충, 계산값 or 예시. A script
checks this mechanically, including where every mark lands; then a verifier that did not write the
episode checks the rest. Only an episode that passes goes to the final render.

Adapted from paper2video's verification (after SunandBean/paper2video, MIT, Sunbin Kim).

## Files

| File | Written by | What |
|---|---|---|
| `slides.json`, `slides/pNN.png` | `slides.py` | each page's text, line and figure boxes, page images |
| `claims.json` | you | every fact, number and formula the episode says or shows, with its slide page or its 보충 source |
| `verify/onscreen.json` | `render.py --preview`, `--scan`, full render | every string that held on screen, and every slide scene's page and marks |
| `verify/preview_NN.jpg`, `preview_index.md` | `render.py --preview` | one frame at the middle of every narration line |
| `verify/VERIFY_auto.md` | `check_claims.py` | layer 1 result, and every formula shown, per scene |
| `VERIFY.md` | the verifier subagent | layers 1-5, verdict |

## claims.json

```json
{
  "claims": [
    { "id": "c01", "kind": "slide", "page": 4, "used_in": ["s04.0", "s04.1"], "text": "인코더는 D차원 x를 M차원 z로",
      "quote": "encoder f maps x in R^D to z in R^M" },
    { "id": "c02", "kind": "supplement", "used_in": ["quiz.0", "answer.1"], "text": "M = D면 항등 함수만 배운다",
      "reason": "흔한 오해를 짚는 확인 문제", "source": "Goodfellow et al., Deep Learning, 14.1", "on_screen_label": "보충" },
    { "id": "c03", "kind": "derived", "used_in": ["hook.1"], "text": "28 × 28 = 784", "from": ["c05"], "derivation": "28 * 28 = 784",
      "on_screen_label": "계산값" },
    { "id": "c04", "kind": "example", "used_in": ["board.2"], "text": "x = (1, 2)는 설명용", "values": ["1", "2"], "on_screen_label": "예시" }
  ],
  "allow_numbers": { "6": "slide number in the source tag", "5": "quiz countdown" }
}
```

- `slide`: `quote` copied from that page's text in `slides.json` (prose; text inside pictures isn't there,
  so cite what the slide's text layer has, and describe a diagram in `text`). Always give `page`.
- `supplement` (보충): anything the slides don't contain: a gap the narration fills, a check question, an
  intuition, a textbook fact. Needs `reason` or `source`, and the 보충 badge on screen in the scenes it is used in.
- `derived` (your arithmetic) and `example` (illustrative values) need their on-screen label too.
- `allow_numbers`: numbers that are not content (slide numbers, the countdown, list numbering), with a reason.

## Layer 1. Mechanical: `l2v check ep01/`

Required: **FAIL 0, WARN 0**. It checks:
- every `slide` quote is on the page it cites;
- every number in captions, `say` lines, scene code and on-screen text is covered by a claim that
  passed (a caption number above 10 by a claim whose `used_in` lists that line), and the voice says no
  number the caption doesn't show (Korean Sino numerals and English number words included);
- each 보충 / 계산값 / 예시 label is on screen where its claim is used;
- every slide scene shows the page its `script.json` scene says, and every mark lands on a line
  (highlight, underline) or a line or figure (circle, box) of that page;
- `verify/onscreen.json` is newer than the script and scenes.

It also lists every typeset formula shown, per scene, for layer 2.

## Layer 2. Fidelity to the slides (verifier)

- Each formula on screen uses the slide's own notation (same letters, sub- and superscripts, operator
  names). Compare the VERIFY_auto list with the slide images.
- Each explanation says what the slide says; where it goes further, it is a `supplement` and correct.
- Definitions and conditions are kept (domains, assumptions, "for small ε", which norm).
- The check question's answer is right, and follows from the slides or the 보충 it cites.
Verdict per item: `ok` / `missing-qualifier` / `misleading` / `wrong`.

## Layer 3. Flow (verifier)

- Slides in the lecture's order; Beamer overlay pages merged into one scene and revealed in order.
- Nothing from the episode's slide range is skipped without a reason (title, outline, references).
- The recap matches the previous episode and the wrap-up names the next one's real topic and slides.
- Glossary terms used consistently (`lecture-map.md`).

## Layer 4. Screen (verifier, with the preview sheets)

- At the middle of each line, the mark sits on the thing that line is about (VERIFY_auto checks a mark
  lands on *a* line; you check it is the *right* one).
- Nothing hides under the chapter chip, the chapter strip or the slide source tag; the slide is never
  cropped; formulas match the slides.
- 보충 badges are visible wherever supplementary content is.

## Layer 5. Rights (verifier)

- The slides and any textbook figures in them belong to the instructor; the delivery message says so
  before anyone posts an episode publicly. 보충 sources are credited. The voice used is recorded
  (`narration.md`).

## Running the verifier

Spawn a fresh subagent with the Agent tool (a different model if the session allows). It must not be
the context that wrote the episode. Give it only paths, not your conclusions:

> You verify a lecture episode against its slides. Read `<absolute path of this verification.md>`, then,
> in `<episode>/`, read `slides.json`, `script.json`, `claims.json`, `scenes/*.js`, `narration.md`,
> `verify/VERIFY_auto.md`, `verify/onscreen.json`, `verify/preview_index.md`, and look at every
> `verify/preview_*.jpg` and at the `slides/pNN.png` pages the episode uses. Do layers 2-5 (layer 1 is
> VERIFY_auto.md; recompute every `derived` claim, judge every `supplement` and `example`). Write
> `<episode>/VERIFY.md` in the format below. Do not edit any other file.

```
# Verification
verifier: <model/agent>, <date>
layer1: FAIL 0 WARN 0
| claim / line | layer | verdict | note | fix |
...
overall: PASS | FIX-AND-RERUN | BLOCKED (needs user)
```

Loop: fix what it found, re-run `l2v preview` and `l2v check`, and send what changed to a new
verifier. After 3 rounds without PASS, stop and report BLOCKED with the open items.
