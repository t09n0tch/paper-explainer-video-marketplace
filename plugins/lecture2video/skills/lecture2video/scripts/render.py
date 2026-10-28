#!/usr/bin/env python3
"""Render film/index.html to video, mixing the voiced lines in at their caption times.

  python render.py film/ --out film.mp4            full film, 30 fps
  python render.py film/ --stills 3,12.5,40         PNG stills into film/stills/ (to check layout)
  python render.py film/ --sheet 24                 one contact sheet of 24 evenly spaced frames
  python render.py film/ --from 30 --to 60 --out part.mp4
  python render.py film/ --preview                  one still per narration line (its midpoint) -> verify/preview_NN.jpg
                                                    + verify/preview_index.md, and a --scan
  python render.py film/ --scan [3]                 every 3rd frame: record every visible string -> verify/onscreen.json

Needs: pip install playwright && python -m playwright install chromium, and ffmpeg.
Set CHROMIUM_PATH to use an existing Chromium/Chrome instead of Playwright's.
Codec, CRF, preset and audio come from settings.py (shipped: libx264, CRF 18, medium,
AAC 192k), overridable per film in script.json "encode" or per run with --crf / --codec.
The page is driven frame by frame (FILM.renderAt(t)), so export is exact and
does not depend on the machine's speed. The full render also writes verify/onscreen.json
(every 3rd frame) with every slide scene's page and marks, which check_claims.py reads.
"""
import argparse, array, json, os, pathlib, subprocess, sys, wave
from datetime import datetime, timezone

import settings


def mix_audio(root, tl, path):
    """Place each audio/<scene>_<nn>.wav at its caption start. Returns path or None."""
    rate, total = 48000, int(tl["duration"] * 48000) + 48000
    buf = array.array("i", [0]) * total
    used = 0
    for s in tl["scenes"]:
        for c in s["caps"]:
            if not c.get("audio"):
                continue
            f = os.path.join(root, c["audio"])
            if not os.path.exists(f):
                continue
            with wave.open(f) as w:
                if w.getframerate() != rate or w.getnchannels() != 1 or w.getsampwidth() != 2:
                    print("skip (not 48k mono 16-bit, re-run tts.py):", f); continue
                data = array.array("h", w.readframes(w.getnframes()))
            at = int((s["start"] + c["t0"]) * rate)
            for i, v in enumerate(data):
                if at + i < total:
                    buf[at + i] += v
            used += 1
    if not used:
        return None
    out = array.array("h", (max(-32768, min(32767, v)) for v in buf))
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate); w.writeframes(out.tobytes())
    print("audio: %d lines mixed -> %s" % (used, path))
    return path


def stale(root, tl):
    """Reasons the timeline or the voice no longer match script.json (empty list = fresh)."""
    why, P = [], lambda *a: os.path.join(root, *a)
    m = lambda f: os.path.getmtime(f)
    spec = json.load(open(P("script.json"), encoding="utf-8"))
    if m(P("timeline.json")) < m(P("script.json")):
        why.append("script.json changed after the last timeline.py run")
    caps = [(s["id"], c) for s in spec["scenes"] for c in s["captions"]]
    have = [(s["id"], c["text"]) for s in tl["scenes"] for c in s["caps"]]
    if caps != have:
        why.append("timeline.json captions differ from script.json")
    newer = [f for f in sorted(pathlib.Path(root, "audio").glob("*.wav")) if f.name != "mix.wav" and m(f) > m(P("timeline.json"))]
    if newer:
        why.append("%d voice file(s) newer than timeline.json (e.g. %s)" % (len(newer), newer[0].name))
    man = P("audio", "manifest.json")   # tts.py records the text each wav was made from
    if os.path.exists(man):
        made = json.load(open(man, encoding="utf-8"))
        for s in spec["scenes"]:
            for i, c in enumerate(s["captions"]):
                f = "%s_%02d.wav" % (s["id"], i)
                said = s.get("say", {}).get(str(i), c)
                if f in made and made[f] != said:   # ("_voice" and other keys are metadata)
                    why.append("audio/%s was voiced from different text; re-run tts.py" % f); break
    return why


def write_onscreen(root, items, step, slides=None):
    os.makedirs(os.path.join(root, "verify"), exist_ok=True)
    f = os.path.join(root, "verify", "onscreen.json")
    json.dump({"generated": datetime.now(timezone.utc).isoformat(timespec="seconds"), "step_frames": step, "items": items, "slides": slides or {}},
              open(f, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("onscreen: %d strings -> %s" % (len(items), f))


def preview(root, tl, shot):
    """One still at the middle of every narration line, tiled 4x3 per sheet, with an index of which cell is which line."""
    import shutil
    d = os.path.join(root, "verify", "preview"); shutil.rmtree(d, ignore_errors=True); os.makedirs(d)
    for old in pathlib.Path(root, "verify").glob("preview_*.jpg"):
        old.unlink()
    lines = [(s["id"], i, s["start"] + (c["t0"] + c["t1"]) / 2, c["text"]) for s in tl["scenes"] for i, c in enumerate(s["caps"])]
    idx = ["# Preview sheets", "", "One frame at the middle of each narration line, 4 x 3 per sheet, left to right, top to bottom.", ""]
    per = 12
    for k in range(0, len(lines), per):
        sheet = k // per + 1
        idx += ["## preview_%02d.jpg" % sheet, ""]
        for j, (sid, i, t, text) in enumerate(lines[k:k + per]):
            open(os.path.join(d, "%04d.png" % (k + j)), "wb").write(shot(t))
            idx.append("%d. `%s.%d` %.1fs  %s" % (j + 1, sid, i, t, text))
        idx.append("")
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-start_number", str(k), "-i", os.path.join(d, "%04d.png"),
                        "-vf", "scale=640:-1,tile=4x3:padding=6:color=black", "-frames:v", "1", "-q:v", "3",
                        os.path.join(root, "verify", "preview_%02d.jpg" % sheet)], check=True)
    open(os.path.join(root, "verify", "preview_index.md"), "w", encoding="utf-8").write("\n".join(idx))
    print("preview: %d lines on %d sheets -> %s" % (len(lines), (len(lines) + per - 1) // per, os.path.join(root, "verify")))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("root"); ap.add_argument("--out"); ap.add_argument("--fps", type=float)
    ap.add_argument("--from", dest="t0", type=float, default=0); ap.add_argument("--to", dest="t1", type=float)
    ap.add_argument("--stills"); ap.add_argument("--sheet", type=int); ap.add_argument("--crf", type=int); ap.add_argument("--codec"); ap.add_argument("--preset")
    ap.add_argument("--music", help="optional background track, mixed quietly under the voice")
    ap.add_argument("--preview", action="store_true", help="one still per narration line + onscreen scan, for review")
    ap.add_argument("--scan", type=int, nargs="?", const=3, help="record visible strings every N frames (default 3)")
    ap.add_argument("--allow-stale", action="store_true", help="render even if the narration is out of date")
    a = ap.parse_args()
    root = os.path.abspath(a.root)
    tl = json.load(open(os.path.join(root, "timeline.json"), encoding="utf-8"))
    why = stale(root, tl) if os.path.exists(os.path.join(root, "script.json")) else []
    if why and not a.allow_stale and not (a.stills or a.sheet):
        sys.exit("stale narration, not rendering:\n  " + "\n  ".join(why) +
                 "\nRun tts.py then timeline.py (p2v voice film/), or pass --allow-stale.")
    fps = a.fps or tl.get("fps", 30)
    spec_path = os.path.join(root, "script.json")
    enc = settings.load(json.load(open(spec_path, encoding="utf-8")) if os.path.exists(spec_path) else None)["encode"]
    for k in ("crf", "codec", "preset"):
        if getattr(a, k) is not None:
            enc[k] = getattr(a, k)
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        kw = {"executable_path": os.environ["CHROMIUM_PATH"]} if os.environ.get("CHROMIUM_PATH") else {}
        b = p.chromium.launch(**kw)
        pg = b.new_page(viewport={"width": 1920, "height": 1080})
        errors = []
        note = lambda e: errors.append(e.split("\n")[0]) if e.split("\n")[0] not in errors else None   # one line per distinct error
        pg.on("console", lambda m: note(m.text) if m.type == "error" else None)
        pg.on("pageerror", lambda e: note(str(e)))
        pg.goto(pathlib.Path(root, "index.html").as_uri() + "?render=1")
        pg.evaluate("() => FILM.ready")
        clip = {"x": 0, "y": 0, "width": 1920, "height": 1080}
        shot = lambda t: (pg.evaluate("t => FILM.renderAt(t)", t), pg.screenshot(clip=clip, type="png"))[1]

        if a.preview or a.scan:
            if a.preview:
                preview(root, tl, shot)
            step = a.scan or 3
            write_onscreen(root, pg.evaluate("s => FILM.scan(s)", step), step, pg.evaluate("() => window.SLIDE_CFG || {}"))
            if errors:
                print("page errors:\n  " + "\n  ".join(errors[:20]))
            b.close(); return

        if a.stills or a.sheet:
            d = os.path.join(root, "stills")
            if a.sheet:  # a clean folder, so the sheet holds only this run's frames
                import shutil
                d = os.path.join(d, "sheet-frames"); shutil.rmtree(d, ignore_errors=True)
            os.makedirs(d, exist_ok=True)
            times = [float(x) for x in a.stills.split(",")] if a.stills else \
                [tl["duration"] * (i + 0.5) / a.sheet for i in range(a.sheet)]
            files = []
            for t in times:
                f = os.path.join(d, "t_%07.2f.png" % t); open(f, "wb").write(shot(t)); files.append(f)
            if a.sheet:
                cols = 4; rows = (len(files) + cols - 1) // cols
                sheet = os.path.join(root, "stills", "sheet.png")
                subprocess.run(["ffmpeg", "-y", "-v", "error", "-pattern_type", "glob", "-i", os.path.join(d, "t_*.png"),
                                "-vf", "scale=480:-1,tile=%dx%d" % (cols, rows), "-frames:v", "1", sheet], check=True)
                print("sheet:", sheet)
            else:
                print("\n".join(files))
            if errors:
                print("page errors:\n  " + "\n  ".join(errors[:20]))
            b.close(); return

        t1 = a.t1 if a.t1 is not None else tl["duration"]
        n = int(round((t1 - a.t0) * fps))
        out = a.out or os.path.join(root, "film.mp4")
        silent = out + ".video.mp4"
        ff = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "image2pipe", "-framerate", str(fps), "-i", "-",
                               "-c:v", enc["codec"], "-pix_fmt", enc["pix_fmt"], "-crf", str(enc["crf"]), "-preset", enc["preset"], silent],
                              stdin=subprocess.PIPE)
        for i in range(n):
            ff.stdin.write(shot(a.t0 + i / fps))
            if i % 3 == 0:
                pg.evaluate("() => FILM.collect()")
            if i % int(fps * 10) == 0:
                print("  frame %d / %d  (%.0f s)" % (i, n, a.t0 + i / fps), flush=True)
        ff.stdin.close(); ff.wait()
        if a.t0 == 0 and a.t1 is None:
            write_onscreen(root, pg.evaluate("() => FILM.onscreen()"), 3, pg.evaluate("() => window.SLIDE_CFG || {}"))
        b.close()
    if errors:
        print("page errors (first 20):\n  " + "\n  ".join(errors[:20]))
    mix = mix_audio(root, tl, os.path.join(root, "audio", "mix.wav"))
    if mix or a.music:
        cmd = ["ffmpeg", "-y", "-v", "error", "-i", silent]
        filt, maps = [], []
        if mix:
            cmd += ["-ss", str(a.t0), "-i", mix]
        if a.music:
            cmd += ["-stream_loop", "-1", "-i", a.music]
        if mix and a.music:
            filt = ["-filter_complex", "[2:a]volume=0.12[m];[1:a][m]amix=inputs=2:duration=first:normalize=0[a]", "-map", "0:v", "-map", "[a]"]
        elif a.music:
            filt = ["-filter_complex", "[1:a]volume=0.25[a]", "-map", "0:v", "-map", "[a]"]
        cmd += filt + ["-c:v", "copy", "-c:a", enc["audio_codec"], "-b:a", enc["audio_bitrate"], "-t", str(t1 - a.t0), out]
        subprocess.run(cmd, check=True)
        os.remove(silent)
    else:
        os.replace(silent, out)
        print("no voiced lines found; the video is silent (captions only).")
    print("wrote", out)


if __name__ == "__main__":
    main()
