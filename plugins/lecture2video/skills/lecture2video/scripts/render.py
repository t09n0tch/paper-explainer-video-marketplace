#!/usr/bin/env python3
"""Render film/index.html to video, mixing the voiced lines in at their caption times.

  python render.py film/ --out film.mp4            full film, 30 fps
  python render.py film/ --stills 3,12.5,40         PNG stills into film/stills/ (to check layout)
  python render.py film/ --sheet 24                 one contact sheet of 24 evenly spaced frames
  python render.py film/ --from 30 --to 60 --out part.mp4

Needs: pip install playwright && python -m playwright install chromium, and ffmpeg.
Set CHROMIUM_PATH to use an existing Chromium/Chrome instead of Playwright's.
Codec, CRF, preset and audio come from settings.py (shipped: libx264, CRF 18, medium,
AAC 192k), overridable per film in script.json "encode" or per run with --crf / --codec.
The page is driven frame by frame (FILM.renderAt(t)), so export is exact and
does not depend on the machine's speed.
"""
import argparse, array, json, os, pathlib, subprocess, sys, wave

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


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("root"); ap.add_argument("--out"); ap.add_argument("--fps", type=float)
    ap.add_argument("--from", dest="t0", type=float, default=0); ap.add_argument("--to", dest="t1", type=float)
    ap.add_argument("--stills"); ap.add_argument("--sheet", type=int); ap.add_argument("--crf", type=int); ap.add_argument("--codec"); ap.add_argument("--preset")
    ap.add_argument("--music", help="optional background track, mixed quietly under the voice")
    a = ap.parse_args()
    root = os.path.abspath(a.root)
    tl = json.load(open(os.path.join(root, "timeline.json"), encoding="utf-8"))
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
        pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(pathlib.Path(root, "index.html").as_uri() + "?render=1")
        pg.evaluate("() => FILM.ready")
        clip = {"x": 0, "y": 0, "width": 1920, "height": 1080}
        shot = lambda t: (pg.evaluate("t => FILM.renderAt(t)", t), pg.screenshot(clip=clip, type="png"))[1]

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
            if i % int(fps * 10) == 0:
                print("  frame %d / %d  (%.0f s)" % (i, n, a.t0 + i / fps), flush=True)
        ff.stdin.close(); ff.wait()
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
