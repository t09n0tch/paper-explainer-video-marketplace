"""Regression tests for the lecture check_claims.py: number parsing, slide quotes, labels and mark placement.

  python3 scripts/l2v.py test
"""
import json, os, shutil, subprocess, sys, tempfile, unittest

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPTS = os.path.join(os.path.dirname(HERE), "scripts")
sys.path.insert(0, SCRIPTS)
import check_claims as cc  # noqa: E402

SLIDES = {"pages": [
    {"page": 1, "title": "Autoencoders", "text": "An encoder maps x in R^D to a code z in R^M, M < D.",
     "lines": [{"id": "b1.1", "box": [0.11, 0.33, 0.85, 0.38], "text": "An encoder maps x ..."}],
     "figures": [{"id": "fig1", "box": [0.34, 0.57, 0.66, 0.83], "kind": "drawing"}]},
    {"page": 6, "title": "Objective", "text": "Common choice: squared error ||x_n - g(f(x_n))||^2. We use 784 pixels.",
     "lines": [{"id": "b2.1", "box": [0.11, 0.42, 0.8, 0.47], "text": "Common choice ..."}], "figures": []}]}


class Numbers(unittest.TestCase):
    def test_shared_parsing(self):
        self.assertEqual(cc.nums("가치5점 H100 3D"), ["5"])
        self.assertEqual(cc.spoken_ko("칠백팔십사 개의 픽셀"), ["784"])
        self.assertEqual(cc.spoken_ko("이 점이 중요해요"), [])

    def test_overlap(self):
        self.assertEqual(cc.overlaps([0.1, 0.3, 0.9, 0.45], [0.11, 0.33, 0.85, 0.38]), 1.0)
        self.assertEqual(cc.overlaps([0.1, 0.8, 0.2, 0.9], [0.11, 0.33, 0.85, 0.38]), 0.0)


class Literals(unittest.TestCase):
    def test_svg_path_data_is_not_content(self):
        js = "d.setAttribute('d', 'M ' + x + ' 160 L ' + y + ' 180 C'); el.innerHTML = '<path d=M0 L 12/>';"
        self.assertEqual([cc.nums(l) for l in cc.string_literals(js) if cc.nums(l)], [])


class TexEscapes(unittest.TestCase):
    def test_lone_backslash_before_tex_spacing(self):
        self.assertEqual(cc.tex_escape_slips(r"const T = 'x \\xrightarrow{\;f\;} z';"), [r"\;", r"\;"])
        self.assertEqual(cc.tex_escape_slips(r"const T = 'x \\xrightarrow{\\;f\\;} z';"), [])


class Checker(unittest.TestCase):
    def setUp(self):
        self.d = tempfile.mkdtemp(prefix="l2v-test-")
        json.dump(SLIDES, open(os.path.join(self.d, "slides.json"), "w"))
        self.script = {"lang": "ko", "scenes": [{"id": "s06", "slide": 6, "captions": ["숫자 하나에 784개의 픽셀이에요.", "흔한 선택은 제곱 오차예요."]}]}
        self.claims = {"claims": [
            {"id": "c1", "kind": "slide", "page": 6, "used_in": ["s06.0"], "quote": "We use 784 pixels"},
            {"id": "c2", "kind": "slide", "page": 6, "used_in": ["s06.1"], "quote": "squared error"}]}

    def tearDown(self):
        shutil.rmtree(self.d, ignore_errors=True)

    def check(self, onscreen=None):
        json.dump(self.script, open(os.path.join(self.d, "script.json"), "w"), ensure_ascii=False)
        json.dump(self.claims, open(os.path.join(self.d, "claims.json"), "w"), ensure_ascii=False)
        if onscreen is not None:
            os.makedirs(os.path.join(self.d, "verify"), exist_ok=True)
            json.dump(onscreen, open(os.path.join(self.d, "verify", "onscreen.json"), "w"), ensure_ascii=False)
        r = subprocess.run([sys.executable, os.path.join(SCRIPTS, "check_claims.py"), self.d], capture_output=True, text=True)
        return r.returncode, r.stdout

    def test_clean(self):
        rc, out = self.check()
        self.assertEqual(rc, 0, out); self.assertIn("FAIL 0  WARN 0", out)

    def test_quote_must_be_on_cited_page(self):
        self.claims["claims"][0]["page"] = 1
        rc, out = self.check()
        self.assertEqual(rc, 1); self.assertIn("NOT found on slide 1", out)

    def test_supplement_needs_label_on_screen(self):
        self.claims["claims"].append({"id": "c3", "kind": "supplement", "used_in": ["s06.1"], "text": "추가 설명", "reason": "흔한 오해"})
        rc, out = self.check({"items": [{"text": "제곱 오차", "scene": "s06", "t": 1}], "slides": {}})
        self.assertIn('on_screen_label "보충" never appears', out)

    def test_marks_land_on_the_slide(self):
        good = {"page": 6, "steps": [{"cap": 0, "box": [0.1, 0.41, 0.82, 0.48], "mark": "hl"}]}
        rc, out = self.check({"items": [], "slides": {"s06": good}})
        self.assertIn("FAIL 0  WARN 0", out)
        bad = {"page": 6, "steps": [{"cap": 1, "box": [0.1, 0.8, 0.3, 0.9], "mark": "ul"}]}
        rc, out = self.check({"items": [], "slides": {"s06": bad}})
        self.assertIn("lands on nothing on page 6", out)
        wrong = {"page": 1, "steps": []}
        rc, out = self.check({"items": [], "slides": {"s06": wrong}})
        self.assertIn('says "slide": 6 but the scene shows page 1', out)


if __name__ == "__main__":
    unittest.main()
