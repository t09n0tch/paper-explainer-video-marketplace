#!/usr/bin/env python3
"""l2v — every step of a lecture episode, one command.

  python3 l2v.py setup                     install the toolchain into its venv (once; re-run to repair)
  python3 l2v.py doctor                    what is installed, what is missing, which voice will be used
  python3 l2v.py new ep01/ [--starter]     episode folder from the templates
  python3 l2v.py slides lecture.pdf ep01/ [slides.py args]   page images, slides.json, contact sheets
  python3 l2v.py timeline ep01/            timing, narration.md, narration.srt
  python3 l2v.py tts ep01/ [tts.py args]   voice every line
  python3 l2v.py voice ep01/               tts, then timeline again (the usual pair)
  python3 l2v.py check ep01/               claims vs slides vs screen, marks on the slides (FAIL 0, WARN 0 needed)
  python3 l2v.py preview ep01/             one frame per narration line + on-screen text and mark scan
  python3 l2v.py render ep01/ [render.py args]     the MP4 (refuses stale narration)
  python3 l2v.py finish ep01/              soft subtitles + chapters into film.mp4
  python3 l2v.py join lecture.mp4 ep01/ ep02/ ... [--title T]   the whole lecture as one video
  python3 l2v.py smoke [--keep]            whole toolchain on the starter episode; ends with ALL PASS
  python3 l2v.py test                      fast regression tests (checker, number parsing)

The toolchain (Playwright + Chromium, TTS engines, pymupdf, ffmpeg if the system has none) lives in the
same venv as paper2video's, ~/.local/share/paper2video/venv (Windows: %LOCALAPPDATA%\\paper2video\\venv),
so the two skills install it once. Override with P2V_HOME.
"""
import os, platform, shutil, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
SKILL = os.path.dirname(HERE)
HOME = os.environ.get("P2V_HOME") or (os.path.join(os.environ.get("LOCALAPPDATA", os.path.expanduser("~")), "paper2video")
                                      if platform.system() == "Windows" else os.path.expanduser("~/.local/share/paper2video"))
VENV = os.path.join(HOME, "venv")
VPY = os.path.join(VENV, "Scripts", "python.exe") if platform.system() == "Windows" else os.path.join(VENV, "bin", "python")
PACKAGES = ["playwright", "edge-tts", "kokoro-onnx", "soundfile", "supertonic", "pypdf", "pymupdf", "imageio-ffmpeg"]


def in_venv():
    return os.path.exists(VPY) and os.path.realpath(sys.prefix) == os.path.realpath(VENV)


def ffmpeg_env():
    """Put an ffmpeg on PATH for child processes: the system one, else the one imageio-ffmpeg ships."""
    env = dict(os.environ)
    if shutil.which("ffmpeg"):
        return env
    try:
        import imageio_ffmpeg
        exe = imageio_ffmpeg.get_ffmpeg_exe()
        d = os.path.join(HOME, "bin"); os.makedirs(d, exist_ok=True)
        link = os.path.join(d, "ffmpeg.exe" if platform.system() == "Windows" else "ffmpeg")
        if not os.path.exists(link):
            try:
                os.symlink(exe, link)
            except OSError:
                shutil.copy(exe, link)
        env["PATH"] = d + os.pathsep + env.get("PATH", "")
    except ImportError:
        pass
    return env


def run(script, *args, check=True):
    r = subprocess.run([sys.executable, os.path.join(HERE, script), *args], env=ffmpeg_env())
    if check and r.returncode:
        sys.exit(r.returncode)
    return r.returncode


def setup():
    py = sys.executable
    if not os.path.exists(VPY):
        if sys.version_info < (3, 10):
            sys.exit("Python 3.10+ needed (this is %s). Run setup with a newer python3." % platform.python_version())
        print("== venv", VENV); os.makedirs(HOME, exist_ok=True)
        subprocess.run([py, "-m", "venv", VENV], check=True)
    print("== packages:", " ".join(PACKAGES))
    subprocess.run([VPY, "-m", "pip", "install", "-q", "--upgrade", "pip"], check=True)
    r = subprocess.run([VPY, "-m", "pip", "install", "-q", *PACKAGES])
    if r.returncode:   # one package without a wheel for this Python must not block the rest
        for p in PACKAGES:
            if subprocess.run([VPY, "-m", "pip", "install", "-q", p]).returncode:
                print("   could not install %s (its engine will be skipped)" % p)
    print("== Chromium for rendering")
    subprocess.run([VPY, "-m", "playwright", "install", "chromium"], check=True)
    print("== done. Next: python3 %s doctor" % os.path.join(HERE, "l2v.py"))


def doctor():
    ok = lambda b: "ok     " if b else "MISSING"
    print("skill   ", SKILL)
    print("python  ", sys.executable, platform.python_version(), "(toolchain venv)" if in_venv() else "")
    print("venv    ", ok(os.path.exists(VPY)), VENV)
    missing = []
    for mod, pkg in [("playwright", "playwright"), ("edge_tts", "edge-tts"), ("kokoro_onnx", "kokoro-onnx"), ("supertonic", "supertonic"), ("pymupdf", "pymupdf")]:
        try:
            __import__(mod); have = True
        except Exception:
            have = False; missing.append(pkg)
        print("%-8s %s" % (pkg[:8], ok(have)))
    env = ffmpeg_env()
    ff = shutil.which("ffmpeg", path=env["PATH"])
    print("ffmpeg  ", ok(ff), ff or "")
    chromium = False
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            p.chromium.launch().close(); chromium = True
    except Exception as e:
        print("         chromium:", str(e).split("\n")[0][:120])
    print("chromium", ok(chromium))
    print("voice   ", end=" ", flush=True)
    subprocess.run([sys.executable, os.path.join(HERE, "settings.py"), "show"], env=env)
    if not os.path.exists(VPY) or missing or not chromium or not ff:
        print("\n-> run: python3 %s setup" % os.path.join(HERE, "l2v.py"))
        return 1
    print("\nready.")
    return 0


def make_deck(path):
    """A small stand-in lecture deck (16:9) whose layout matches the starter scenes' boxes."""
    import pymupdf
    doc = pymupdf.open()
    for i in range(1, 7):
        pg = doc.new_page(width=960, height=540)
        pg.insert_text((60, 70), "Lecture %d: Autoencoders" % i if i == 1 else "Slide %d" % i, fontsize=30)
        if i == 1:
            pg.insert_text((110, 200), "An encoder maps x in R^D to a shorter code z in R^M, M < D.", fontsize=22)
            pg.draw_rect(pymupdf.Rect(330, 310, 630, 450), color=(0.2, 0.5, 0.8), fill=(0.85, 0.9, 1))
            pg.insert_text((400, 385), "encoder -> z -> decoder", fontsize=16)
        if i == 6:
            pg.insert_text((110, 200), "Objective: min over f, g of (1/N) sum_{n=1}^{N} d(x_n, g(f(x_n)))", fontsize=20)
            pg.insert_text((110, 250), "Common choice: squared error ||x_n - g(f(x_n))||^2", fontsize=20)
    doc.save(path)


def smoke(keep):
    d = tempfile.mkdtemp(prefix="l2v-smoke-"); film = os.path.join(d, "film")
    steps = []
    def step(name, fn):
        print("\n== %s" % name, flush=True)
        rc = fn(); steps.append((name, rc)); print("-> %s" % ("PASS" if rc == 0 else "FAIL (%s)" % rc))
        return rc == 0
    deck = os.path.join(d, "deck.pdf")
    go = (step("new episode", lambda: run("new_film.py", film, "--starter", check=False))
          and step("slides", lambda: (make_deck(deck), run("slides.py", deck, film, "--dpi", "150", check=False))[1])
          and step("timeline (estimated)", lambda: run("timeline.py", film, check=False)))
    if go:
        voiced = step("tts", lambda: run("tts.py", film, check=False))
        go = step("timeline (from speech)", lambda: run("timeline.py", film, check=False))
    go = go and step("preview + on-screen scan", lambda: run("render.py", film, "--preview", check=False))
    go = go and step("check claims (FAIL 0, WARN 0)", lambda: run("check_claims.py", film, "--strict", check=False))
    go = go and step("render 4 s", lambda: run("render.py", film, "--to", "4", "--out", os.path.join(film, "smoke.mp4"), check=False))
    bad = [n for n, rc in steps if rc]
    print("\n" + ("ALL PASS" if go and not bad else "FAILED: " + ", ".join(bad) if bad else "STOPPED"), "(%s)" % film if keep or bad else "")
    if not keep and not bad:
        shutil.rmtree(d, ignore_errors=True)
    return 0 if go and not bad else 1


def main():
    a = sys.argv[1:]
    if not a or a[0] in ("-h", "--help", "help"):
        sys.exit(__doc__)
    cmd, rest = a[0], a[1:]
    if cmd == "setup":
        return setup()
    if os.path.exists(VPY) and not in_venv():   # every other step runs inside the toolchain venv
        os.execv(VPY, [VPY, os.path.abspath(__file__), *a])
    simple = {"new": "new_film.py", "slides": "slides.py", "timeline": "timeline.py", "tts": "tts.py",
              "check": "check_claims.py", "render": "render.py", "finish": "finish.py", "join": "join.py"}
    if cmd in simple:
        return run(simple[cmd], *rest, check=False)
    if cmd == "voice":
        run("tts.py", *rest); return run("timeline.py", rest[0], check=False)
    if cmd == "preview":
        return run("render.py", rest[0], "--preview", *rest[1:], check=False)
    if cmd == "doctor":
        return doctor()
    if cmd == "smoke":
        return smoke("--keep" in rest)
    if cmd == "test":
        return subprocess.run([sys.executable, "-m", "unittest", "discover", "-s", os.path.join(SKILL, "tests"), "-v"], env=ffmpeg_env()).returncode
    sys.exit("unknown command %r\n%s" % (cmd, __doc__))


if __name__ == "__main__":
    sys.exit(main() or 0)
