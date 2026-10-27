#!/usr/bin/env python3
"""Finish a rendered episode: soft subtitles, chapter markers, YouTube timestamps.

  python finish.py film/ [--lang kor]

Reads timeline.json and narration.srt (made by timeline.py). Writes:
  film.mp4       updated in place: the narration as a selectable subtitle track (mov_text)
                 and one chapter marker per chapter chip
  chapters.txt   "0:00 들어가며" lines for a YouTube description
Run it after render.py, which writes film.mp4 into the film folder.
"""
import argparse, json, os, subprocess


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("root"); ap.add_argument("--lang", default="kor")
    a = ap.parse_args()
    R = lambda f: os.path.join(a.root, f)
    tl = json.load(open(R("timeline.json"), encoding="utf-8"))
    ch = []
    for s in tl["scenes"]:
        name = s["chapter"] or s["id"]
        if ch and ch[-1][0] == name:
            ch[-1][2] = s["start"] + s["dur"]
        else:
            ch.append([name, s["start"], s["start"] + s["dur"]])
    meta = ";FFMETADATA1\ntitle=%s\n" % tl.get("title", "")
    for name, t0, t1 in ch:
        meta += "[CHAPTER]\nTIMEBASE=1/1000\nSTART=%d\nEND=%d\ntitle=%s\n" % (t0 * 1000, t1 * 1000, name)
    open(R("chapters.ffmeta"), "w", encoding="utf-8").write(meta)
    open(R("chapters.txt"), "w", encoding="utf-8").write(
        "".join("%d:%02d %s\n" % (t0 // 60, t0 % 60, name) for name, t0, _ in ch))
    tmp = R("film.finish.mp4")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", R("film.mp4"), "-i", R("narration.srt"), "-i", R("chapters.ffmeta"),
                    "-map", "0:v", "-map", "0:a?", "-map", "1", "-map_metadata", "2", "-map_chapters", "2",
                    "-c", "copy", "-c:s", "mov_text", "-metadata:s:s:0", "language=" + a.lang, tmp], check=True)
    os.replace(tmp, R("film.mp4"))
    print("updated %s (%d chapters, soft subtitles) and wrote chapters.txt" % (R("film.mp4"), len(ch)))
    print(open(R("chapters.txt"), encoding="utf-8").read().rstrip())


if __name__ == "__main__":
    main()
