#!/usr/bin/env python3
"""Build the film's timeline from film/script.json.

Each narration line gets a slot. If audio/<scene>_<n>.wav exists (made by tts.py),
the slot is the real speech length; otherwise it is estimated from the text.
Scenes are then sized to fit their lines, so visuals timed with k.caps[i].t0
stay in sync after re-voicing.

Writes, inside the film folder:
  timeline.js    window.TIMELINE = {...}   (read by index.html)
  timeline.json  same data
  narration.srt  subtitles
  narration.md   the script with timestamps, for review or manual recording

usage: python timeline.py film/
"""
import json, os, re, subprocess, sys, wave


def wav_len(path):
    try:
        with wave.open(path) as w:
            return w.getnframes() / float(w.getframerate())
    except Exception:
        try:
            out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                                 capture_output=True, text=True).stdout.strip()
            return float(out)
        except Exception:
            return None


def estimate(text, lang, rate):
    if lang.startswith("ko") or lang.startswith("ja") or lang.startswith("zh"):
        units = len(re.findall(r"[\u3131-\u318e\uac00-\ud7a3\u3040-\u30ff\u4e00-\u9fff]", text))
        units += 0.5 * len(re.findall(r"[A-Za-z0-9]", text))  # latin chars read faster per char
        sec = units / (rate or 6.0)
    else:
        sec = len(text.split()) / (rate or 2.6)
    sec += 0.25 * len(re.findall(r"[,.?!·]", text))  # breath at punctuation
    return max(2.2, sec + 0.4)


def ts(x, sep=","):
    ms = int(round(x * 1000))
    return "%02d:%02d:%02d%s%03d" % (ms // 3600000, ms // 60000 % 60, ms // 1000 % 60, sep, ms % 1000)


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    root = sys.argv[1]
    spec = json.load(open(os.path.join(root, "script.json"), encoding="utf-8"))
    lang = spec.get("lang", "ko")
    lead, gap, tail = spec.get("lead", 0.35), spec.get("gap", 0.35), spec.get("tail", 0.5)
    pad = spec.get("audio_pad", 0.2)
    rate = spec.get("rate")
    out, t, n_audio, n_lines = [], 0.0, 0, 0
    for s in spec["scenes"]:
        caps, x = [], lead
        for i, text in enumerate(s["captions"]):
            a = os.path.join(root, "audio", "%s_%02d.wav" % (s["id"], i))
            d = wav_len(a) if os.path.exists(a) else None
            if d:
                n_audio += 1
                d += pad
            else:
                d, a = estimate(text, lang, rate), None
            n_lines += 1
            caps.append({"t0": round(x, 3), "t1": round(x + d, 3), "text": text,
                         "audio": os.path.relpath(a, root) if a else None})
            x += d + gap
        dur = max(x - gap + tail + s.get("hold", 0), s.get("min_dur", 0))
        out.append({"id": s["id"], "chapter": s.get("chapter", ""), "start": round(t, 3), "dur": round(dur, 3), "caps": caps})
        t += dur
    tl = {"title": spec.get("title", ""), "fps": spec.get("fps", 30), "duration": round(t, 3), "shared": spec.get("shared", []), "burn_captions": spec.get("burn_captions", False), "scenes": out}
    json.dump(tl, open(os.path.join(root, "timeline.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    open(os.path.join(root, "timeline.js"), "w", encoding="utf-8").write("window.TIMELINE = " + json.dumps(tl, ensure_ascii=False) + ";\n")

    srt, md, n = [], ["# " + (tl["title"] or "Narration"), "", "Total %s" % ts(t, ".")[3:-1], ""], 1
    for s in out:
        md += ["## %s  (%s - %s)" % (s["chapter"] or s["id"], ts(s["start"], ".")[3:-1], ts(s["start"] + s["dur"], ".")[3:-1]), ""]
        for c in s["caps"]:
            a, b = s["start"] + c["t0"], s["start"] + c["t1"]
            srt.append("%d\n%s --> %s\n%s\n" % (n, ts(a), ts(b), c["text"]))
            md.append("- `%s - %s` (%.1fs) %s" % (ts(a, ".")[3:-1], ts(b, ".")[3:-1], b - a, c["text"]))
            n += 1
        md.append("")
    open(os.path.join(root, "narration.srt"), "w", encoding="utf-8").write("\n".join(srt))
    open(os.path.join(root, "narration.md"), "w", encoding="utf-8").write("\n".join(md))
    print("timeline: %d scenes, %d lines, %.1f s total, %d lines timed from audio" % (len(out), n_lines, t, n_audio))
    for s in out:
        print("  %-14s start %6.1f  dur %5.1f  lines %d" % (s["id"], s["start"], s["dur"], len(s["caps"])))


if __name__ == "__main__":
    main()
