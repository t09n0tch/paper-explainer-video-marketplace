"""Regression tests for check_claims.py: number parsing and the checker on a small film.

  python3 scripts/p2v.py test
"""
import json, os, shutil, subprocess, sys, tempfile, unittest

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPTS = os.path.join(os.path.dirname(HERE), "scripts")
sys.path.insert(0, SCRIPTS)
import check_claims as cc  # noqa: E402


class Numbers(unittest.TestCase):
    def test_digits(self):
        self.assertEqual(cc.nums("가치5점"), ["5"])
        self.assertEqual(cc.nums("H100 GPT4 3D 4D"), [])           # names, not data
        self.assertEqual(cc.nums("67.0 and 0.70 and 1.000"), ["67", "0.7", "1.000"])   # 1.000 may be a European thousand
        self.assertEqual(cc.nums("① 문제 ⑪"), [])
        self.assertEqual(cc.nums("1,234 and 10^{-3} and -3"), ["1234", "10^-3", "-3"])
        self.assertEqual(cc.nums("2-3"), ["2", "3"])

    def test_english_words(self):
        self.assertEqual(cc.spoken_en("from sixty point nine to forty-seven, two hundred and twelve"), ["60.9", "47", "212"])
        self.assertEqual(cc.spoken_en("one model, zero shot"), [])

    def test_korean_words(self):
        k = cc.spoken_ko
        self.assertEqual(k("삼십칠 퍼센트예요"), ["37"])
        self.assertEqual(k("삼십칠이 돼요"), ["37"])
        self.assertEqual(k("영 점 칠칠에서"), ["0.77"])
        self.assertEqual(k("영점칠칠"), ["0.77"])
        self.assertEqual(k("점수가 오 점 오예요"), ["5.5"])
        self.assertEqual(k("백이십 개, 일억삼천만, 십만 번"), ["120", "130000000", "100000"])
        for ordinary in ("이 점이 중요해요", "이만큼", "천천히", "천만에요", "사람이 일을 해요", "오른쪽"):
            self.assertEqual(k(ordinary), [], ordinary)

    def test_literals(self):
        js = "k.h('<div style=\"left:140px;top:300px\">Table 2 · 0.77</div>'); el.style.transform = 'translate(-50%,-100%) scale(' + s + ')'; getContext('2d');"
        lits = list(cc.string_literals(js))
        self.assertEqual([cc.nums(l) for l in lits if cc.nums(l)], [["2", "0.77"]])


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
        self.d = tempfile.mkdtemp(prefix="p2v-test-")
        os.makedirs(os.path.join(self.d, "paper")); os.makedirs(os.path.join(self.d, "scenes"))
        shutil.copy(os.path.join(HERE, "fixtures", "starter-paper.txt"), os.path.join(self.d, "paper", "paper.txt"))
        self.script = {"lang": "ko", "scenes": [{"id": "a", "captions": ["비싼 물건은 5점, 싼 물건은 1점이에요.", "지연을 반영하면 0.77에서 0.10이 돼요."]}]}
        self.claims = {"claims": [
            {"id": "c1", "kind": "quote", "used_in": ["a.0"], "quote": "high-value objects are worth 5 points and low-value objects 1 point"},
            {"id": "c2", "kind": "table", "used_in": ["a.1"], "table": "Table 2", "row": "RRARA", "values": ["0.77", "0.10"]}]}

    def tearDown(self):
        shutil.rmtree(self.d, ignore_errors=True)

    def check(self):
        json.dump(self.script, open(os.path.join(self.d, "script.json"), "w"), ensure_ascii=False)
        json.dump(self.claims, open(os.path.join(self.d, "claims.json"), "w"), ensure_ascii=False)
        r = subprocess.run([sys.executable, os.path.join(SCRIPTS, "check_claims.py"), self.d], capture_output=True, text=True)
        return r.returncode, r.stdout

    def test_clean(self):
        rc, out = self.check()
        self.assertEqual(rc, 0, out); self.assertIn("FAIL 0  WARN 0", out)

    def test_wrong_quote_and_table(self):
        self.claims["claims"][0]["quote"] = "objects are worth 9 points"
        self.claims["claims"][1]["values"] = ["0.78"]
        rc, out = self.check()
        self.assertEqual(rc, 1); self.assertIn("quote NOT found", out); self.assertIn("NOT matched", out)

    def test_unsourced_and_say_mismatch(self):
        self.script["scenes"][0]["captions"][0] = "비싼 물건은 7점이에요."
        self.script["scenes"][0]["say"] = {"1": "영 점 칠칠에서 삼십칠이 돼요."}
        rc, out = self.check()
        self.assertIn("num 7", out); self.assertIn("say has ['37']", out)

    def test_label_must_be_on_screen(self):
        self.claims["claims"].append({"id": "c3", "kind": "example", "used_in": ["a.1"], "values": ["0.77"], "on_screen_label": "예시"})
        os.makedirs(os.path.join(self.d, "verify"))
        json.dump(self.script, open(os.path.join(self.d, "script.json"), "w"), ensure_ascii=False)
        json.dump({"items": [{"text": "0.77", "scene": "a", "t": 1}]}, open(os.path.join(self.d, "verify", "onscreen.json"), "w"))
        rc, out = self.check()
        self.assertIn('on_screen_label "예시" never appears', out)


if __name__ == "__main__":
    unittest.main()
