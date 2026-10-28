#!/usr/bin/env python3
"""Voice and encoding settings, layered (later wins):

  1. <skill>/defaults.json                          shipped defaults (supertonic F1, English kokoro af_heart; x264 CRF 18)
  2. ~/.config/paper2video/config.json    this user's own defaults, for every film
  3. film/script.json  "voice" / "encode"           this film only
  4. command-line flags of tts.py / render.py       this run only

  python settings.py show [film/]                   print the merged settings
  python settings.py set voice '{"engine": "say", "voice": "Yuna"}'
                                                    engine and voice may be {lang: value} maps
  python settings.py set encode '{"crf": 23}'       change the user defaults (layer 2)
  python settings.py reset                          delete the user defaults
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULTS = os.path.join(HERE, "..", "defaults.json")
USER = os.path.join(os.path.expanduser("~"), ".config", "paper2video", "config.json")


def _read(path):
    try:
        return json.load(open(path, encoding="utf-8"))
    except FileNotFoundError:
        return {}


def _merge(a, b):
    out = dict(a)
    for k, v in (b or {}).items():
        out[k] = _merge(out[k], v) if isinstance(v, dict) and isinstance(out.get(k), dict) else v
    return out


def load(spec=None):
    d, u = _read(DEFAULTS), _read(USER)
    s = _merge(d, u)
    if u.get("voice"):
        s["voice"] = u["voice"]
    for key in ("voice", "encode"):
        if spec and spec.get(key):
            # a voice (user or film) replaces the one below it outright, so a stored
            # {"engine": "say"} never inherits supertonic's voice name
            s[key] = _merge(s.get(key, {}), spec[key]) if key == "encode" else spec[key]
    return s


def per_lang(v, lang):
    """engine/voice may be a plain value or a {lang: value} map, "*" for any other language."""
    return v.get(lang, v.get("*")) if isinstance(v, dict) else v


voice_name = per_lang


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "show"
    if cmd == "show":
        spec = _read(os.path.join(sys.argv[2], "script.json")) if len(sys.argv) > 2 else None
        print(json.dumps(load(spec), ensure_ascii=False, indent=2))
        print("user config:", USER if os.path.exists(USER) else "(none)")
    elif cmd == "set" and len(sys.argv) == 4 and sys.argv[2] in ("voice", "encode"):
        u = _read(USER)
        val = json.loads(sys.argv[3])
        u[sys.argv[2]] = val if sys.argv[2] == "voice" else _merge(u.get("encode", {}), val)
        os.makedirs(os.path.dirname(USER), exist_ok=True)
        json.dump(u, open(USER, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        print("saved", USER)
    elif cmd == "reset":
        if os.path.exists(USER):
            os.remove(USER)
        print("user defaults removed; shipped defaults apply")
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()
