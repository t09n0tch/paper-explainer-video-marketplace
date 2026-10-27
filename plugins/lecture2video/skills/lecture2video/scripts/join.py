#!/usr/bin/env python3
"""Join finished episodes into one film: video and voice back to back, subtitles shifted, chapters per episode.

  python join.py out.mp4 ep01/ ep02/ ep03/ [--title "..."] [--lang kor]

Each episode folder needs film.mp4 (from render.py + finish.py), timeline.json and narration.srt.
Writes out.mp4 (soft subtitles + chapter markers), and next to it out.srt and out-chapters.txt.
Chapters are named "<N>편 · <chapter chip>"; an episode's repeated chips are merged.
The episodes must share resolution, frame rate and codecs, which they do when made by this skill.
"""
import argparse, json, os, re, subprocess, tempfile


def duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                         capture_output=True, text=True, check=True).stdout.strip()
    return float(out)


def parse_srt(text):
    blocks = []
    for b in re.split(r"\n\s*\n", text.strip()):
        lines = b.strip().splitlines()
        if len(lines) < 3:
            continue
        m = re.match(r"(\S+) --> (\S+)", lines[1])
        if m:
            blocks.append((m.group(1), m.group(2), "\n".join(lines[2:])))
    return blocks


def ts2s(ts):
    h, m, rest = ts.split(":"); s, ms = rest.split(",")
    return int(h) * 3600 + int(m) * 60 + int(s) + int(ms) / 1000


def s2ts(x):
    ms = int(round(x * 1000))
    return "%02d:%02d:%02d,%03d" % (ms // 3600000, ms // 60000 % 60, ms // 1000 % 60, ms % 1000)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("out"); ap.add_argument("episodes", nargs="+")
    ap.add_argument("--title", default=""); ap.add_argument("--lang", default="kor")
    a = ap.parse_args()
    out = os.path.abspath(a.out); base = os.path.splitext(out)[0]
    t0, srt, chapters, n = 0.0, [], [], 1
    files = []
    for i, ep in enumerate(a.episodes, 1):
        film = os.path.abspath(os.path.join(ep, "film.mp4")); files.append(film)
        d = duration(film)
        tl = json.load(open(os.path.join(ep, "timeline.json"), encoding="utf-8"))
        for s in tl["scenes"]:
            name = "%d편 · %s" % (i, s["chapter"] or s["id"])
            if chapters and chapters[-1][0] == name:
                chapters[-1][2] = t0 + s["start"] + s["dur"]
            else:
                chapters.append([name, t0 + s["start"], t0 + s["start"] + s["dur"]])
        chapters[-1][2] = t0 + d
        for b0, b1, text in parse_srt(open(os.path.join(ep, "narration.srt"), encoding="utf-8").read()):
            srt.append("%d\n%s --> %s\n%s\n" % (n, s2ts(t0 + ts2s(b0)), s2ts(t0 + ts2s(b1)), text)); n += 1
        t0 += d
    open(base + ".srt", "w", encoding="utf-8").write("\n".join(srt))
    open(base + "-chapters.txt", "w", encoding="utf-8").write(
        "".join("%d:%02d:%02d %s\n" % (c[1] // 3600, c[1] // 60 % 60, c[1] % 60, c[0]) for c in chapters))
    meta = ";FFMETADATA1\ntitle=%s\n" % a.title + "".join(
        "[CHAPTER]\nTIMEBASE=1/1000\nSTART=%d\nEND=%d\ntitle=%s\n" % (c[1] * 1000, c[2] * 1000, c[0]) for c in chapters)
    with tempfile.TemporaryDirectory() as tmp:
        lst = os.path.join(tmp, "list.txt"); mf = os.path.join(tmp, "meta.txt")
        open(lst, "w").write("".join("file '%s'\n" % f.replace("'", "'\\''") for f in files))
        open(mf, "w", encoding="utf-8").write(meta)
        joined = os.path.join(tmp, "joined.mp4")
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", lst,
                        "-map", "0:v", "-map", "0:a", "-c", "copy", joined], check=True)
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", joined, "-i", base + ".srt", "-i", mf,
                        "-map", "0:v", "-map", "0:a", "-map", "1", "-map_metadata", "2", "-map_chapters", "2",
                        "-c", "copy", "-c:s", "mov_text", "-metadata:s:s:0", "language=" + a.lang, out], check=True)
    print("wrote %s (%.0f s, %d episodes, %d chapters, %d subtitle lines)" % (out, t0, len(files), len(chapters), n - 1))
    print("     %s.srt, %s-chapters.txt" % (os.path.basename(base), os.path.basename(base)))


if __name__ == "__main__":
    main()
