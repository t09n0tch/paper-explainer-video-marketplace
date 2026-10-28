#!/usr/bin/env python3
"""Mechanical cross-check of a lecture episode against its slides (layer 1 of references/verification.md).

  python check_claims.py ep01/

Reads ep01/slides.json (slides.py), ep01/claims.json, ep01/script.json, the scene files, and
ep01/verify/onscreen.json (every string the player showed, plus every slide scene's page and marks;
written by render.py --preview, --scan and the full render). Checks:

  * kind=slide       the quote appears on the cited slide page (whitespace/hyphenation-insensitive)
  * kind=supplement  보충: content the slides don't contain; needs `on_screen_label` (default "보충"), and a
                     `source` or `reason`
  * kind=derived     needs `from` (claim ids), `derivation` and `on_screen_label`
  * kind=example     an illustrative value; needs `on_screen_label` (e.g. "예시")
  * labels           each on_screen_label really appears on screen in a scene the claim is used in
  * coverage         every number in captions, `say` lines, scene string literals and on-screen text is covered
                     by a claim that passed or by `allow_numbers`; a caption number above 10 must come from a
                     claim whose `used_in` lists that line; a number the voice says must be in its caption
  * marks            every slide scene's page exists and matches the scene's "slide" in script.json, and every
                     mark lands on a line (highlight, underline) or a line or figure (circle, box) of that page
  * formulas         every typeset formula shown is listed per scene for the verifier to compare with the slides

Writes ep01/verify/VERIFY_auto.md. Exit 1 if anything FAILs (or, with --strict, WARNs). WARNs must be fixed or justified.
Shares its number parsing with paper2video's check_claims.py (after SunandBean/paper2video, MIT, Sunbin Kim).
"""
import json, os, re, sys, unicodedata


def norm(s):
    s = unicodedata.normalize("NFKC", s)
    s = s.replace("−", "-").replace("–", "-").replace("—", "-").replace("­", "")
    s = re.sub(r"-\s*\n\s*", "", s)            # de-hyphenate line breaks
    s = re.sub(r"\s+", " ", s)
    s = re.sub(r"\bT able\b|\bF ig\.", lambda m: m.group(0).replace(" ", ""), s)   # pypdf splits "Table" / "Fig."
    return s.lower().strip()


# A shown number keeps its sign, exponent and power, so "-3" is not covered by "3", nor "1e-3" by "1" and "3".
# A minus counts as a sign only when it does not follow a word character ("2-3" is a range: 2 and 3).
NUM = re.compile(r"(?<![\w.])([-+]?)(\d+(?:[.,]\d+)*)((?:[eE][-+]?\d+)|(?:\^\{?[-+]?\d+\}?))?")


def nums(s):
    s = re.sub(r"[①-⓿❶-➓]", " ", s)   # circled chapter numbers (①, ⑪) are labels, not data
    s = unicodedata.normalize("NFKC", s).replace("−", "-")
    s = re.sub(r"(?<=[가-힣])(?=\d)", " ", s)   # "가치5" -> "가치 5" (Hangul may touch digits; "H100" stays a name)
    out = []
    for m in NUM.finditer(s):
        if re.match(r"-?D(?![A-Za-z])", s[m.end():]) and not m.group(3):
            continue   # "3D", "4D": names, not data
        sign, v, ex = m.group(1), m.group(2), m.group(3) or ""
        v = v.replace(",", "") if re.fullmatch(r"\d{1,3}(,\d{3})+", v) else v
        ex = ex.replace("{", "").replace("}", "").replace("E", "e")
        v = v.rstrip(".")
        # 67.0 and 67 are the same value; "1.000" may be a European thousand, so it is left as written
        if "." in v and "," not in v and not re.fullmatch(r"\d{1,3}\.\d{3}", v):
            v = v.rstrip("0").rstrip(".")
        out.append(("-" if sign == "-" else "") + v + ex)
    return out


# ---- numbers spoken as words in `say` lines ----------------------------------------------------

# English ("sixty point nine", "forty-seven", "two hundred and twelve"). A lone "one" or "zero" is skipped.
_UNITS = {w: i for i, w in enumerate("zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen "
                                      "fifteen sixteen seventeen eighteen nineteen".split())}
_TENS = {w: 10 * i for i, w in enumerate("_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()) if i >= 2}
_SCALE = {"hundred": 100, "thousand": 1000, "million": 10 ** 6, "billion": 10 ** 9}


def spoken_en(s):
    toks = re.findall(r"[a-z]+|[,.;:!?]", s.lower().replace("-", " "))
    out, i = [], 0
    digit = lambda t: t == "oh" or (t in _UNITS and _UNITS[t] < 10)
    while i < len(toks):
        if toks[i] == "point" and i + 1 < len(toks) and digit(toks[i + 1]) and not (i and (toks[i - 1] in _UNITS or toks[i - 1] in _TENS)):
            j, d = i + 1, ""
            while j < len(toks) and digit(toks[j]):
                d += str(_UNITS.get(toks[j], 0)); j += 1
            out.append(("0." + d).rstrip("0").rstrip(".") or "0"); i = j; continue
        if toks[i] not in _UNITS and toks[i] not in _TENS and not (toks[i] == "a" and i + 1 < len(toks) and toks[i + 1] in _SCALE):
            i += 1; continue
        j, total, cur, words = i, 0, 0, 0
        while j < len(toks):
            t = toks[j]
            if t in _UNITS:
                if cur % 10 or 10 <= cur % 100 < 20:
                    break          # "three one" / "twelve three" are two numbers
                cur += _UNITS[t]
            elif t in _TENS:
                if cur % 100:
                    break
                cur += _TENS[t]
            elif t == "a" and j + 1 < len(toks) and toks[j + 1] in _SCALE:
                cur += 1
            elif t in _SCALE and (cur or total):
                if _SCALE[t] == 100:
                    cur *= 100
                else:
                    total += cur * _SCALE[t]; cur = 0
            elif t == "and" and words and j + 1 < len(toks) and (toks[j + 1] in _UNITS or toks[j + 1] in _TENS):
                pass
            else:
                break
            words += 1; j += 1
        val = str(total + cur)
        if j < len(toks) and toks[j] == "point" and j + 1 < len(toks) and digit(toks[j + 1]):
            d = ""; j += 1
            while j < len(toks) and digit(toks[j]):
                d += str(_UNITS.get(toks[j], 0)); j += 1
            val = (val + "." + d).rstrip("0").rstrip("."); words += 2
        if not (words == 1 and toks[i] in ("one", "zero")):
            out.append(val)
        i = max(j, i + 1)
    return out


# Korean Sino numerals ("삼십칠", "백이십", "영 점 칠칠"). Many numeral syllables are also ordinary words
# (이, 일, 사, 오, 만, 천, 점), so only runs that are clearly numbers count: at a word start, at least two
# syllables with a place value (십 백 천 만 억) that parse cleanly, or "X 점 Y" decimals.
_KD = {"영": 0, "공": 0, "일": 1, "이": 2, "삼": 3, "사": 4, "오": 5, "육": 6, "륙": 6, "칠": 7, "팔": 8, "구": 9}
_KU = {"십": 10, "백": 100, "천": 1000}
_KB = {"만": 10 ** 4, "억": 10 ** 8}
_KALL = "".join(_KD) + "".join(_KU) + "".join(_KB)


_K_WORDS = r"이만큼|이만하|이만 하|천만에|만만|오만|사천|구만"  # ordinary words made of numeral syllables


def _k_int(run):
    total, part, d, last_u, last_b = 0, 0, None, 10 ** 9, 10 ** 13
    for ch in run:
        if ch in _KD:
            if d is not None:
                return None
            d = _KD[ch]
        elif ch in _KU:
            u = _KU[ch]
            if u >= last_u:
                return None
            part += (1 if d is None else d) * u; d, last_u = None, u
        else:
            b = _KB[ch]
            if b >= last_b:
                return None
            part += d or 0
            total += (part or 1) * b; part, d, last_u, last_b = 0, None, 10 ** 9, b
    return total + part + (d or 0)


def spoken_ko(s):
    out, taken = [], []
    for m in re.finditer(r"(?<![가-힣])([%s]+)\s*점\s*([영공일이삼사오육칠팔구]+)" % _KALL, s):
        frac = m.group(2)
        if frac == "이" and m.group(0).endswith("점이"):
            continue   # "이 점이" (this point) is not 2.2
        whole = _k_int(m.group(1)) if len(m.group(1)) > 1 else _KD.get(m.group(1))
        if whole is None:
            continue
        out.append((str(whole) + "." + "".join(str(_KD[c]) for c in frac)).rstrip("0").rstrip("."))
        taken.append(m.span())
    for m in re.finditer(r"(?<![가-힣])([%s]{2,})" % _KALL, s):
        if any(a <= m.start() < b for a, b in taken) or not re.search("[십백천만억]", m.group(1)):
            continue
        if re.match(_K_WORDS, s[m.start():]):
            continue
        run = m.group(1)   # a particle may also be a numeral syllable ("삼십칠이"): take the longest prefix that parses
        for n in range(len(run), 1, -1):
            v = _k_int(run[:n])
            if v is not None and re.search("[십백천만억]", run[:n]):
                out.append(str(v)); break
    return out


def spoken(s, lang):
    return spoken_ko(s) if lang.startswith("ko") else spoken_en(s) if lang.startswith("en") else []


# ---- scene source and screen text ---------------------------------------------------------------

def tex_strip(s):
    # subscripts are indices (x_1, \lambda_{T}), not data; superscripts stay (10^{-3})
    return re.sub(r"_\{[^}]*\}|_[A-Za-z0-9]", "", s)


def tex_escape_slips(js):
    """Lone backslashes before TeX spacing (\\; \\, \\! \\:) in scene code: JavaScript drops them, so '\\;' renders as ';'."""
    return [m.group(0) for m in re.finditer(r"(?<!\\)\\[;,!:]", re.sub(r"//[^\n]*", "", js))]


def string_literals(js):
    js = re.sub(r"/\*.*?\*/", "", js, flags=re.S)
    js = re.sub(r"(?<![:\\])//[^\n]*", "", js)
    for parts in re.findall(r"'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\]|\\.)*)`|\"((?:[^\"\\\n]|\\.)*)\"", js):
        s = next((p for p in parts if p), "")
        s = re.sub(r"\$\{[^}]*\}", " ", s)
        s = re.sub(r"<[^>]*>", " ", s)                 # HTML tags and their attributes (style="top:300px")
        s = re.sub(r"[\w-]+\s*:\s*[^;\"']*;", " ", s)    # inline CSS declarations
        s = re.sub(r"\b(left|top|right|bottom|width|height|font-size|font-weight|gap|margin|padding|opacity|z-index|"
                   r"line-height|border-radius|letter-spacing|inset|flex|order|stroke-width|r|cx|cy|x|y)\s*[:=]\s*\S+", " ", s)
        s = re.sub(r"\b\d+(\.\d+)?(px|em|rem|vh|vw|deg|ms|s)\b|#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|var\(--[\w-]+\)", " ", s)
        s = re.sub(r"\b(translate[XYZ]?|scale[XYZ]?|rotate[XYZ]?|matrix|skew[XY]?|color-mix|calc)\([^)]*\)?|^\s*[23]d\s*$", " ", s)   # transforms, colour maths, getContext('2d')
        s = re.sub(r"[\w-]+=\"[^\"]*\"?", " ", s)   # attribute fragments split across string pieces (stroke-dasharray="8 8")
        s = tex_strip(s.replace("\\\\", "\\"))
        if not re.search(r"\d", s) or not re.search(r"[A-Za-z가-힣%×≈]", s):
            continue
        if re.fullmatch(r"[\sMmLlCcQqSsTtAaHhVvZz\d.,-]+", s) or "/>" in s or "<path" in s:
            continue   # SVG path data ("M 160 L 180 C ...") and markup fragments
        if re.search(r"[{};]|=>", s) or re.match(r"^\s*(\.|/|[\d.\s,]+$)", s) or "http" in s:
            continue   # code, selectors, paths, bare number lists
        yield s


def overlaps(a, b):
    """How much of mark box a lies on target box b (0..1 of a), or 1 if a's centre is inside b."""
    cx, cy = (a[0] + a[2]) / 2, (a[1] + a[3]) / 2
    if b[0] <= cx <= b[2] and b[1] <= cy <= b[3]:
        return 1.0
    w, h = min(a[2], b[2]) - max(a[0], b[0]), min(a[3], b[3]) - max(a[1], b[1])
    area = max(1e-9, (a[2] - a[0]) * (a[3] - a[1]))
    return max(0.0, w) * max(0.0, h) / area


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    root = sys.argv[1]
    P = lambda *a: os.path.join(root, *a)
    if not os.path.exists(P("slides.json")):
        sys.exit("missing %s: run slides.py lecture.pdf %s first" % (P("slides.json"), root))
    if not os.path.exists(P("claims.json")):
        sys.exit("missing %s: write it first (format in references/verification.md)" % P("claims.json"))
    SL = json.load(open(P("slides.json"), encoding="utf-8"))
    pages = {int(p["page"]): p for p in SL.get("pages", SL if isinstance(SL, list) else [])}
    page_txt = {n: norm(p.get("text", "")) for n, p in pages.items()}
    all_txt = " ".join(page_txt.values())
    C = json.load(open(P("claims.json"), encoding="utf-8"))
    script = json.load(open(P("script.json"), encoding="utf-8"))
    lang = script.get("lang", "ko")
    claims = C.get("claims", [])
    sent_keys = {"%s.%d" % (s["id"], k) for s in script["scenes"] for k in range(len(s["captions"]))}
    rows = []

    seen_ids = set()
    for i, c in enumerate(claims):
        if not c.get("id"):
            rows.append(("FAIL", "#%d" % i, "claim has no id")); c["id"] = "#%d" % i
        elif c["id"] in seen_ids:
            rows.append(("FAIL", c["id"], "duplicate claim id"))
        seen_ids.add(c["id"])
    ids = {c["id"] for c in claims}
    for c in claims:
        k, cid = c.get("kind"), c.get("id")
        bad = [u for u in c.get("used_in", []) if u not in sent_keys]
        if bad:
            rows.append(("WARN", cid, "used_in refers to unknown line(s) %s (use <scene id>.<caption index>)" % bad))
        if k == "slide":
            q = norm(c.get("quote", ""))
            if len(q) < 3:
                rows.append(("FAIL", cid, "quote missing or too short to verify")); continue
            pg = c.get("page")
            hay = page_txt.get(int(pg), "") if pg is not None else all_txt
            if pg is not None and int(pg) not in pages:
                rows.append(("FAIL", cid, "slide %s not in slides.json" % pg)); continue
            ok = q in hay or q.replace(" ", "") in hay.replace(" ", "")
            where = "slide %s" % pg if pg is not None else "the deck"
            rows.append(("PASS" if ok else "FAIL", cid, ("found on " + where) if ok else 'NOT found on %s: "%s"' % (where, c.get("quote", "")[:90])))
            if pg is None:
                rows.append(("WARN", cid, "slide claim without `page`: cite the slide it comes from"))
        elif k == "supplement":
            miss = [f for f in ("on_screen_label",) if not c.get(f)] + ([] if c.get("source") or c.get("reason") else ["source or reason"])
            rows.append(("WARN" if miss else "REVIEW", cid, "보충: %s" % c.get("text", "")[:80] + ("  missing %s" % miss if miss else "")))
        elif k == "derived":
            miss = [f for f in ("from", "derivation", "on_screen_label") if not c.get(f)]
            unk = [f for f in c.get("from", []) if f not in ids]
            rows.append(("WARN" if (miss or unk) else "REVIEW", cid, "derived: %s" % c.get("derivation", "")[:80]
                         + ("  missing %s" % miss if miss else "") + ("  unknown ids %s" % unk if unk else "")))
        elif k == "example":
            rows.append(("REVIEW" if c.get("on_screen_label") else "WARN", cid, "example" + ("" if c.get("on_screen_label") else ": no on_screen_label")))
        else:
            rows.append(("FAIL", cid, "unknown kind %s (slide, supplement, derived, example)" % k))

    allowed = set()
    for k in C.get("allow_numbers", {}):
        allowed.update(nums(k) or [k])
    failed = {r[1] for r in rows if r[0] == "FAIL"}
    covered, by_sent = set(allowed), {}
    for c in claims:
        if c["id"] in failed:
            continue
        ns = set()
        for v in c.get("values", []):
            ns.update(nums(str(v)))
        for f in ("quote", "text", "derivation"):
            ns.update(nums(tex_strip(c.get(f, ""))))
        covered |= ns
        for u in c.get("used_in", []):
            by_sent.setdefault(u, set()).update(ns)

    shown = []
    for s in script["scenes"]:
        say = s.get("say", {})
        for i, cap in enumerate(s["captions"]):
            key = "%s.%d" % (s["id"], i)
            cn = nums(cap)
            shown += [(n, key + " caption") for n in cn]
            sp = say.get(str(i))
            vn = (nums(sp) + spoken(sp, lang)) if sp else spoken(cap, lang)
            shown += [(n, key + " say") for n in vn]
            if sp:
                extra = sorted(set(vn) - set(cn))
                if extra:
                    rows.append(("WARN", key, "say has %s that the caption does not show (same number in both, or fix one)" % extra))
            for n in sorted(set(cn) | set(vn)):
                small = re.fullmatch(r"\d", n) or n == "10"
                if n in covered and n not in allowed and not small and n not in by_sent.get(key, set()):
                    rows.append(("WARN", key, "%s is covered by a claim, but not by one whose used_in lists %s (is it the same quantity?)" % (n, key)))

    js = [os.path.join("scenes", f) for f in sorted(os.listdir(P("scenes"))) if f.endswith(".js")] if os.path.isdir(P("scenes")) else []
    on = P("verify", "onscreen.json")
    items, slides_cfg = [], {}
    if os.path.exists(on):
        srcs = [P("script.json")] + [P(f) for f in js] + ([P("timeline.json")] if os.path.exists(P("timeline.json")) else [])
        if os.path.getmtime(on) < max(os.path.getmtime(f) for f in srcs):
            rows.append(("WARN", "onscreen", "verify/onscreen.json is older than the script/scenes: run render.py --preview (or --scan) again"))
        O = json.load(open(on, encoding="utf-8"))
        items, slides_cfg = O.get("items", []), O.get("slides", {})
        for it in items:
            t = tex_strip(it.get("text", "")) if it.get("tex") else it.get("text", "")
            shown += [(n, 'on screen (%s, %.1fs): "%s"' % (it.get("scene"), it.get("t", 0), it.get("text", "")[:50])) for n in nums(t)]
    elif js:
        rows.append(("INFO", "onscreen", "no verify/onscreen.json yet: marks and numbers computed in JS are checked after render.py --preview"))
    for f in js:
        src = open(P(f), encoding="utf-8").read()
        for slip in tex_escape_slips(src):
            rows.append(("WARN", f, "JS string drops the backslash in %r (renders as %r): write it doubled, %r" % (slip, slip[1], "\\" + slip))); break
        for lit in string_literals(src):
            shown += [(n, '%s: "%s"' % (f, lit.strip()[:50])) for n in nums(lit)]

    # marks: each slide scene shows a real page and points at something on it
    want = {s["id"]: s.get("slide") for s in script["scenes"]}
    for sid, cfg in sorted(slides_cfg.items()):
        pg = cfg.get("page")
        if pg not in pages:
            rows.append(("FAIL", sid, "slide scene shows page %s, which slides.json does not have" % pg)); continue
        if want.get(sid) is not None and int(want[sid]) != int(pg):
            rows.append(("WARN", sid, 'script.json says "slide": %s but the scene shows page %s' % (want[sid], pg)))
        p = pages[pg]
        for i, st in enumerate(cfg.get("steps", [])):
            if not st.get("box") or not st.get("mark"):
                continue
            targets = [l["box"] for l in p.get("lines", [])] + ([f["box"] for f in p.get("figures", [])] if st["mark"] in ("circle", "box") else [])
            best = max([overlaps(st["box"], b) for b in targets] or [0])
            if best < 0.3:
                rows.append(("WARN", sid, "mark %d (%s, caption %s) lands on nothing on page %s: take its box from slides.json %s"
                             % (i, st["mark"], st.get("cap"), pg, "lines" if st["mark"] in ("hl", "ul") else "lines or figures")))

    if items:
        by_scene = {}
        for it in items:
            by_scene.setdefault(it.get("scene"), []).append(norm(it.get("text", "")))
        for c in claims:
            lab = norm(c.get("on_screen_label", "보충" if c.get("kind") == "supplement" else ""))
            if not lab or c["kind"] not in ("derived", "example", "supplement"):
                continue
            scenes = {u.split(".")[0] for u in c.get("used_in", [])} or set(by_scene)
            if not any(lab in t for sc in scenes for t in by_scene.get(sc, [])):
                rows.append(("WARN", c["id"], 'on_screen_label "%s" never appears on screen in %s' % (lab, sorted(scenes))))

    unc = {}
    for n, where in shown:
        if n not in covered:
            unc.setdefault(n, []).append(where)
    for n, w in sorted(unc.items()):
        rows.append(("WARN", "num " + n, "not covered by any claim; shown at %s" % w[:3] + (" …" if len(w) > 3 else "")))

    formulas = {}
    for it in items:
        if it.get("tex"):
            formulas.setdefault(it.get("scene"), []).append(it["text"])
    n_fail = sum(r[0] == "FAIL" for r in rows); n_warn = sum(r[0] == "WARN" for r in rows)
    os.makedirs(P("verify"), exist_ok=True)
    with open(P("verify", "VERIFY_auto.md"), "w", encoding="utf-8") as f:
        f.write("# Mechanical cross-check\n\nFAIL %d · WARN %d · claims %d · onscreen strings %d · slide scenes %d\n\n| status | id | detail |\n|---|---|---|\n"
                % (n_fail, n_warn, len(claims), len(items), len(slides_cfg)))
        for r in rows:
            f.write("| %s | %s | %s |\n" % (r[0], r[1], r[2].replace("|", "/")))
        if formulas:
            f.write("\n## Formulas on screen (compare each with the slide it comes from)\n\n")
            for sc, fs in formulas.items():
                for x in dict.fromkeys(fs):
                    f.write("- `%s`: `%s`\n" % (sc, x.replace("`", "'")))
    for r in rows:
        if r[0] != "PASS":
            print("%-6s %-10s %s" % r)
    print("\nFAIL %d  WARN %d  PASS %d  -> %s" % (n_fail, n_warn, sum(r[0] == "PASS" for r in rows), P("verify", "VERIFY_auto.md")))
    sys.exit(1 if n_fail or ("--strict" in sys.argv and n_warn) else 0)


if __name__ == "__main__":
    main()
