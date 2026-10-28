#!/usr/bin/env python3
"""Voice every narration line of film/script.json into film/audio/<scene>_<nn>.wav.

Engines (pick with --engine, or let 'auto' find one):
  supertonic  Supertonic 3 (pip install supertonic; OpenRAIL-M weights). Offline neural voices
         for Korean and 30 other languages, voices F1-F5 / M1-M5. The default for every
         language but English. ~400 MB model downloaded once from Hugging Face.
  kokoro Kokoro-82M via kokoro-onnx (pip install kokoro-onnx soundfile; Apache-2.0 weights).
         Offline neural English voices (af_heart, am_michael, bf_emma...); the default for
         English. ~350 MB model downloaded once from GitHub.
  say    macOS built-in voices (Korean: Yuna). Offline, decent.
  sapi   Windows built-in voices via PowerShell (Korean: Heami, if installed). Offline.
  edge   the 'edge-tts' package (pip install edge-tts). Natural neural voices
         (Korean: ko-KR-SunHiNeural, ko-KR-InJoonNeural) but needs internet access
         to Microsoft's speech service.
  sherpa an offline neural voice run with sherpa-onnx (pip install sherpa-onnx==1.12.40).
         Korean: the Mimic3 "kss" voice (female). Needs no system voice and no internet
         after a one-time model download (~60 MB) from GitHub. Clear but lo-fi.
  espeak espeak-ng. Works almost anywhere, sounds robotic. Last resort.
  cmd    any other TTS you have (a paid API CLI, a local model...):
         --cmd 'mytts --in {text_file} --out {out}'   ({text} also works, shell-quoted)

--rate is words per minute for say/espeak, a percentage for edge, a speed factor
(1.0 = normal) for supertonic/kokoro/sherpa.
The kokoro/supertonic code follows SunandBean/paper2video (MIT, Sunbin Kim).
All output is normalised to 48 kHz mono 16-bit WAV with ffmpeg.
Existing files are kept unless --force, so editing one line re-voices only that line
(delete its wav, or use --only scene_id).

usage: python tts.py film/ --samples [--text "..."]   one sentence in every available voice,
                                                   into film/voice-samples/, for the user to pick
       python tts.py film/ [--engine auto|supertonic|kokoro|say|sapi|edge|sherpa|espeak|cmd] [--voice NAME]
                           [--rate N] [--cmd TEMPLATE] [--only ID[,ID]] [--force] [--list]
Without --engine the voice comes from settings.py: the shipped default (supertonic F1; English: kokoro af_heart),
overridden by the user's ~/.config/lecture2video/config.json, overridden by script.json
"voice": {"engine": "...", "voice": "...", "rate": ...}. If the default engine is missing or fails
tts.py falls back to edge, then the best other voice on this machine, and says so.
After it finishes, run timeline.py again so the timing follows the real speech.
"""
import argparse, json, os, platform, shlex, shutil, subprocess, sys, tempfile, urllib.request

import settings

LANG = ["ko"]

SHERPA_MODELS = {  # lang -> (release asset, folder, model file)
    "ko": ("vits-mimic3-ko_KO-kss_low", "ko_KO-kss_low.onnx"),
}
SHERPA_URL = "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/%s.tar.bz2"
CACHE = os.path.join(os.path.expanduser("~"), ".cache", "paper2video", "tts")   # shared with paper2video: voice models download once
KOKORO_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/"
KOKORO_FILES = {"kokoro-v1.0.onnx": 325532387, "voices-v1.0.bin": 28214398}  # name: size in bytes
KOKORO_LANG = {"a": "en-us", "b": "en-gb", "e": "es", "f": "fr-fr", "h": "hi", "i": "it", "p": "pt-br"}  # voice prefix
KOKORO_VOICES = {"en": ["af_heart", "af_bella", "am_michael", "am_fenrir", "bf_emma", "bm_george"]}
SUPERTONIC_LANGS = set("en ko ja ar bg cs da de el es et fi fr hi hr hu id it lt lv nl pl pt ro ru sk sl sv tr uk vi".split())
SUPERTONIC_VOICES = ["F1", "F2", "F3", "F4", "F5", "M1", "M2", "M3", "M4", "M5"]
PIP = {"supertonic": "pip install supertonic", "kokoro": "pip install kokoro-onnx soundfile",
       "edge": "pip install edge-tts", "sherpa": "pip install sherpa-onnx==1.12.40"}

DEFAULT_VOICE = {
    "say": {"ko": "Yuna", "en": "Samantha", "ja": "Kyoko"},
    "sapi": {"ko": "ko-KR", "en": "en-US", "ja": "ja-JP"},
    "edge": {"ko": "ko-KR-SunHiNeural", "en": "en-US-AriaNeural", "ja": "ja-JP-NanamiNeural"},
    "espeak": {"ko": "ko", "en": "en-us", "ja": "ja"},
    "sherpa": {"ko": "kss"},
    "kokoro": {"en": "af_heart"},
    "supertonic": dict((l, "F1") for l in SUPERTONIC_LANGS),
}
EDGE_VOICES = {"ko": ["ko-KR-SunHiNeural", "ko-KR-InJoonNeural"], "en": ["en-US-AriaNeural", "en-US-GuyNeural"], "ja": ["ja-JP-NanamiNeural", "ja-JP-KeitaNeural"]}


def run(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, **kw)


def have_say_voice(lang):
    if platform.system() != "Darwin" or not shutil.which("say"):
        return None
    out = run(["say", "-v", "?"]).stdout
    tag = {"ko": "ko_KR", "en": "en_US", "ja": "ja_JP"}.get(lang, lang)
    best = DEFAULT_VOICE["say"].get(lang)
    if best and any(l.startswith(best + " ") and tag in l for l in out.splitlines()):
        return best
    for line in out.splitlines():
        if tag in line:
            return line.split()[0]
    return None


def have_sapi_voice(lang):
    if platform.system() != "Windows":
        return None
    culture = DEFAULT_VOICE["sapi"].get(lang, lang)
    ps = ("Add-Type -AssemblyName System.Speech; $s=New-Object System.Speech.Synthesis.SpeechSynthesizer; "
          "$s.GetInstalledVoices() | %% { $_.VoiceInfo } | ? { $_.Culture.Name -eq '%s' } | select -First 1 -ExpandProperty Name" % culture)
    out = run(["powershell", "-NoProfile", "-Command", ps]).stdout.strip()
    return out or None


def have_edge():
    if shutil.which("edge-tts"):
        return True
    try:
        import edge_tts  # noqa: F401
        return True
    except Exception:
        return False


def sherpa_ready(lang, download=False):
    """Path of the offline model folder, downloading it once if asked. None if unavailable."""
    if lang not in SHERPA_MODELS:
        return None
    try:
        import sherpa_onnx  # noqa: F401
    except Exception:
        return None
    name, _ = SHERPA_MODELS[lang]
    d = os.path.join(CACHE, name)
    if os.path.isdir(d):
        return d
    if not download:
        return d  # present as available; fetched on first use
    os.makedirs(CACHE, exist_ok=True)
    import tarfile
    tgz = os.path.join(CACHE, name + ".tar.bz2")
    print("downloading offline voice model (one time):", SHERPA_URL % name)
    urllib.request.urlretrieve(SHERPA_URL % name, tgz)
    with tarfile.open(tgz) as tf:
        tf.extractall(CACHE)
    os.remove(tgz)
    return d


def kokoro_ready(lang):
    try:
        import kokoro_onnx  # noqa: F401
    except Exception:
        return False
    return lang in KOKORO_VOICES


def supertonic_ready(lang):
    try:
        import supertonic  # noqa: F401
    except Exception:
        return False
    return lang in SUPERTONIC_LANGS


def missing(engine, lang):
    """Why this engine can't voice this language here (with the pip command), or None."""
    mod = {"kokoro": "kokoro_onnx", "supertonic": "supertonic", "sherpa": "sherpa_onnx"}.get(engine)
    if engine == "edge" and not have_edge() or mod and not __import__("importlib.util").util.find_spec(mod):
        return "voice engine '%s' is not installed (%s)" % (engine, PIP[engine])
    if not ready(engine, lang):
        return "voice engine '%s' has no '%s' voice" % (engine, lang)
    return None


def ready(engine, lang):
    return {"edge": have_edge, "kokoro": lambda: kokoro_ready(lang), "supertonic": lambda: supertonic_ready(lang),
            "sherpa": lambda: bool(sherpa_ready(lang))}.get(engine, lambda: True)()


_LOCAL = {}


def write_wav(out_wav, samples, sr):
    import wave, numpy as np
    pcm = (np.clip(np.asarray(samples, dtype=np.float32).reshape(-1), -1, 1) * 32767).astype("<i2")
    with wave.open(out_wav, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(int(sr)); w.writeframes(pcm.tobytes())


def kokoro_say(text, out_wav, voice, speed):
    if "kokoro" not in _LOCAL:
        try:  # phonemizer copies libespeak-ng to a temp dir before dlopen, which hardened macOS can refuse
            import phonemizer.backend.espeak.api as api
            cp = api.shutil.copy
            def link(src, dst, follow_symlinks=True):
                try:
                    os.symlink(os.path.abspath(src), dst); return dst
                except OSError:
                    return cp(src, dst, follow_symlinks=follow_symlinks)
            api.shutil.copy = link
        except (ImportError, AttributeError):
            pass
        from kokoro_onnx import Kokoro
        d = os.path.join(CACHE, "kokoro"); os.makedirs(d, exist_ok=True)
        for name, size in KOKORO_FILES.items():
            p = os.path.join(d, name)
            if os.path.exists(p) and os.path.getsize(p) == size:
                continue
            print("downloading offline voice model (one time, %d MB): %s" % (size // 10**6, KOKORO_URL + name))
            urllib.request.urlretrieve(KOKORO_URL + name, p + ".part")
            if os.path.getsize(p + ".part") != size:
                os.remove(p + ".part"); raise RuntimeError(name + ": incomplete download")
            os.replace(p + ".part", p)
        import espeakng_loader
        from kokoro_onnx import EspeakConfig
        data = espeakng_loader.get_data_path()
        if len(data) > 150:  # espeak-ng silently ignores data paths longer than its fixed buffer
            short = os.path.join(CACHE, "espeak-ng-data")
            if not os.path.exists(os.path.join(short, "phontab")):
                shutil.copytree(data, short, dirs_exist_ok=True)
            data = short
        _LOCAL["kokoro"] = Kokoro(os.path.join(d, "kokoro-v1.0.onnx"), os.path.join(d, "voices-v1.0.bin"),
                                  espeak_config=EspeakConfig(data_path=data))
    s, sr = _LOCAL["kokoro"].create(text, voice=voice, speed=speed, lang=KOKORO_LANG.get(voice[0], "en-us"))
    write_wav(out_wav, s, sr)


def supertonic_say(lang, text, out_wav, voice, speed):
    if "supertonic" not in _LOCAL:
        from supertonic import TTS
        d = os.path.join(CACHE, "supertonic3")
        if not os.path.isdir(d):
            print("downloading offline voice model (one time, ~400 MB) from huggingface.co/Supertone/supertonic-3")
        _LOCAL["supertonic"] = TTS(model_dir=d, auto_download=True)
    t = _LOCAL["supertonic"]
    w, _ = t.synthesize(text, voice_style=t.get_voice_style(voice_name=voice), lang=lang, speed=speed)
    write_wav(out_wav, w, t.sample_rate)


def local(fn, out, *args):
    """Run an in-process engine; report failure like a subprocess so the fallback logic applies."""
    try:
        fn(*args)
        return out, subprocess.CompletedProcess([], 0, "", "")
    except Exception as e:
        return out, subprocess.CompletedProcess([], 1, "", "%s: %s" % (e.__class__.__name__, e))


_SHERPA = {}


def sherpa_say(lang, text, out_wav, speed=1.0):
    import array, wave, sherpa_onnx
    d = sherpa_ready(lang, download=True)
    if d not in _SHERPA:
        m = os.path.join(d, SHERPA_MODELS[lang][1])
        cfg = sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
            vits=sherpa_onnx.OfflineTtsVitsModelConfig(model=m, tokens=os.path.join(d, "tokens.txt"), data_dir=os.path.join(d, "espeak-ng-data")),
            num_threads=2), max_num_sentences=2)
        _SHERPA[d] = sherpa_onnx.OfflineTts(cfg)
    a = _SHERPA[d].generate(text, sid=0, speed=float(speed or 1.0))
    if not a.sample_rate:
        raise SystemExit("sherpa-onnx produced no audio. Use sherpa-onnx 1.12.x (pip install sherpa-onnx==1.12.40); "
                         "2.x builds lack the built-in phonemizer this voice needs.")
    pcm = array.array("h", (int(max(-1.0, min(1.0, x)) * 32767) for x in a.samples))
    with wave.open(out_wav, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(a.sample_rate); w.writeframes(pcm.tobytes())


def all_voices(lang):
    """Every (engine, voice, rate, label) this machine can probably produce, best first."""
    out = []
    if kokoro_ready(lang):
        out += [("kokoro", v, None, "offline Kokoro " + v) for v in KOKORO_VOICES[lang]]
    if supertonic_ready(lang):
        out += [("supertonic", v, None, "offline Supertonic " + v) for v in SUPERTONIC_VOICES]
    if platform.system() == "Darwin" and shutil.which("say"):
        tag = {"ko": "ko_KR", "en": "en_US", "ja": "ja_JP"}.get(lang, lang)
        for line in run(["say", "-v", "?"]).stdout.splitlines():
            if tag in line:
                v = line.split("  ")[0].strip(); out.append(("say", v, None, "macOS " + v))
    if platform.system() == "Windows":
        culture = DEFAULT_VOICE["sapi"].get(lang, lang)
        ps = ("Add-Type -AssemblyName System.Speech; $s=New-Object System.Speech.Synthesis.SpeechSynthesizer; "
              "$s.GetInstalledVoices() | %% { $_.VoiceInfo } | ? { $_.Culture.Name -eq '%s' } | %% { $_.Name }" % culture)
        for v in run(["powershell", "-NoProfile", "-Command", ps]).stdout.split("\n"):
            if v.strip():
                out.append(("sapi", v.strip(), None, "Windows " + v.strip()))
    if have_edge():
        for v in EDGE_VOICES.get(lang, []):
            out.append(("edge", v, None, "Microsoft " + v + " (online)"))
    if sherpa_ready(lang):
        out.append(("sherpa", "kss", 1.0, "offline kss, normal speed"))
        out.append(("sherpa", "kss", 0.9, "offline kss, slower"))
    if shutil.which("espeak-ng") or shutil.which("espeak"):
        out.append(("espeak", DEFAULT_VOICE["espeak"].get(lang, lang), None, "espeak-ng (robotic)"))
    return out


def pick(lang, skip=()):
    """Best engine here: local neural (kokoro for English, supertonic), then edge, system voices, sherpa, espeak."""
    for e in ("kokoro", "supertonic"):
        if e not in skip and ready(e, lang):
            return e, DEFAULT_VOICE[e][lang]
    if "edge" not in skip and have_edge():
        return "edge", DEFAULT_VOICE["edge"].get(lang)
    v = "say" not in skip and have_say_voice(lang)
    if v:
        return "say", v
    v = "sapi" not in skip and have_sapi_voice(lang)
    if v:
        return "sapi", v
    if "sherpa" not in skip and sherpa_ready(lang):
        return "sherpa", "kss"
    if shutil.which("espeak-ng") or shutil.which("espeak"):
        print("warning: only espeak found; the voice will sound robotic. Consider --engine edge or --engine cmd.")
        return "espeak", DEFAULT_VOICE["espeak"].get(lang, lang)
    return None, None


def synth(engine, voice, text, raw, rate, cmd_tpl):
    if engine == "say":
        c = ["say", "-o", raw + ".aiff"] + (["-v", voice] if voice else []) + (["-r", str(rate)] if rate else []) + [text]
        r = run(c); return raw + ".aiff", r
    if engine == "sapi":
        tf = raw + ".txt"; open(tf, "w", encoding="utf-8").write(text)
        sel = ("$v=$s.GetInstalledVoices()|%%{$_.VoiceInfo}|?{$_.Name -eq '%s' -or $_.Culture.Name -eq '%s'}|select -First 1; if($v){$s.SelectVoice($v.Name)}; " % (voice, voice)) if voice else ""
        ps = ("Add-Type -AssemblyName System.Speech; $s=New-Object System.Speech.Synthesis.SpeechSynthesizer; %s"
              "%s$s.SetOutputToWaveFile('%s'); $s.Speak([IO.File]::ReadAllText('%s',[Text.Encoding]::UTF8)); $s.Dispose()"
              % (sel, ("$s.Rate=%d; " % int(rate)) if rate else "", raw + ".wav", tf))
        r = run(["powershell", "-NoProfile", "-Command", ps]); return raw + ".wav", r
    if engine == "edge":
        tf = raw + ".txt"; open(tf, "w", encoding="utf-8").write(text)
        exe = shutil.which("edge-tts")
        c = ([exe] if exe else [sys.executable, "-m", "edge_tts"]) + ["--voice", voice or "ko-KR-SunHiNeural", "-f", tf, "--write-media", raw + ".mp3"]
        if rate:
            c += ["--rate", rate if str(rate).endswith("%") else "%+d%%" % int(rate)]
        r = run(c); return raw + ".mp3", r
    if engine == "kokoro":
        return local(kokoro_say, raw + ".wav", text, raw + ".wav", voice or "af_heart", float(rate or 1.0))
    if engine == "supertonic":
        return local(supertonic_say, raw + ".wav", LANG[0], text, raw + ".wav", voice or "F1", float(rate or 1.05))
    if engine == "sherpa":
        sherpa_say(LANG[0], text, raw + ".wav", rate or 1.0)
        return raw + ".wav", subprocess.CompletedProcess([], 0, "", "")
    if engine == "espeak":
        exe = shutil.which("espeak-ng") or shutil.which("espeak")
        r = run([exe, "-v", voice or "ko", "-w", raw + ".wav"] + (["-s", str(rate)] if rate else []) + [text]); return raw + ".wav", r
    if engine == "cmd":
        tf = raw + ".txt"; open(tf, "w", encoding="utf-8").write(text)
        out = raw + ".out"
        c = cmd_tpl.replace("{text_file}", shlex.quote(tf)).replace("{text}", shlex.quote(text)).replace("{out}", shlex.quote(out))
        r = subprocess.run(c, shell=True, capture_output=True, text=True); return out, r
    raise SystemExit("unknown engine " + engine)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("root"); ap.add_argument("--engine", default="auto"); ap.add_argument("--voice")
    ap.add_argument("--rate"); ap.add_argument("--cmd"); ap.add_argument("--only"); ap.add_argument("--force", action="store_true")
    ap.add_argument("--list", action="store_true", help="print which engine/voice auto would use, then stop")
    ap.add_argument("--samples", action="store_true", help="voice one sentence in every available voice, then stop")
    ap.add_argument("--text", help="sentence for --samples (default: the script's first line)")
    a = ap.parse_args()
    spec = json.load(open(os.path.join(a.root, "script.json"), encoding="utf-8"))
    lang = spec.get("lang", "ko")[:2]
    LANG[0] = lang
    if not shutil.which("ffmpeg"):
        sys.exit("ffmpeg is required (macOS: brew install ffmpeg, Windows: winget install ffmpeg)")
    if a.samples:
        return samples(a, spec, lang)
    cfg = settings.load(spec)["voice"]
    fallback = a.engine == "auto" and cfg.get("fallback", "auto") == "auto"
    if a.engine == "auto" and settings.per_lang(cfg.get("engine"), lang) not in (None, "auto"):
        a.engine = settings.per_lang(cfg["engine"], lang)
        a.voice = a.voice or settings.voice_name(cfg.get("voice"), lang)
        a.rate = a.rate or cfg.get("rate")
    engine, voice = (a.engine, a.voice) if a.engine != "auto" else pick(lang)
    why = engine and missing(engine, lang)
    if why and not fallback:
        sys.exit(why)
    if why:
        print(why + "; falling back")
        engine, voice = pick(lang, skip=(engine,)); a.rate = None
    elif a.engine != "auto" and not voice:
        voice = DEFAULT_VOICE.get(engine, {}).get(lang)
    elif a.voice:
        voice = a.voice
    if a.list or not engine:
        print("engine:", engine, "voice:", voice)
        if not engine:
            sys.exit("No TTS engine found. Options: %s (offline), pip install edge-tts (online), a %s system voice, or --engine cmd." % (PIP["kokoro" if lang == "en" else "supertonic"], lang))
        return
    if engine == "cmd" and not a.cmd:
        sys.exit("--engine cmd needs --cmd TEMPLATE")
    only = set(a.only.split(",")) if a.only else None
    os.makedirs(os.path.join(a.root, "audio"), exist_ok=True)
    tmp = tempfile.mkdtemp()
    made = 0
    # audio/manifest.json: the text each wav was voiced from; a changed line is re-voiced, and render.py refuses a mismatch
    man_path = os.path.join(a.root, "audio", "manifest.json")
    man = json.load(open(man_path, encoding="utf-8")) if os.path.exists(man_path) else {}
    print("engine: %s  voice: %s" % (engine, voice))
    for s in spec["scenes"]:
        if only and s["id"] not in only:
            continue
        for i, text in enumerate(s["captions"]):
            dst = os.path.join(a.root, "audio", "%s_%02d.wav" % (s["id"], i))
            say_text = s.get("say", {}).get(str(i), text) if isinstance(s.get("say"), dict) else text
            if os.path.exists(dst) and not a.force and man.get(os.path.basename(dst), say_text) == say_text:
                man.setdefault(os.path.basename(dst), say_text)
                continue
            raw = os.path.join(tmp, "%s_%02d" % (s["id"], i))
            src, r = synth(engine, voice, say_text, raw, a.rate, a.cmd)
            bad = lambda: r.returncode or not os.path.exists(src) or not os.path.getsize(src)
            if bad() and fallback and not made:
                print("%s failed (%s); falling back" % (engine, (r.stderr or r.stdout).strip()[-200:]))
                engine, voice = pick(lang, skip=(engine,)); a.rate = None; fallback = False
                if not engine:
                    sys.exit("No other TTS engine found.")
                print("engine: %s  voice: %s" % (engine, voice))
                src, r = synth(engine, voice, say_text, raw, a.rate, a.cmd)
            if bad():
                sys.exit("TTS failed on %s line %d:\n%s%s" % (s["id"], i, r.stdout, r.stderr))
            c = run(["ffmpeg", "-y", "-v", "error", "-i", src, "-ac", "1", "-ar", "48000", "-sample_fmt", "s16",
                     "-af", "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse",
                     dst])
            if c.returncode:
                sys.exit("ffmpeg failed: " + c.stderr)
            made += 1
            man[os.path.basename(dst)] = say_text
            man["_voice"] = "%s %s" % (engine, voice)   # recorded for the credits and the verifier
            json.dump(man, open(man_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
            print("  voiced %s_%02d" % (s["id"], i))
    json.dump(man, open(man_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("done: %d new lines. Now run: python timeline.py %s" % (made, a.root))


def samples(a, spec, lang):
    text = a.text or spec["scenes"][0]["captions"][0]
    d = os.path.join(a.root, "voice-samples"); os.makedirs(d, exist_ok=True)
    tmp = tempfile.mkdtemp(); rows = []
    voices = all_voices(lang)
    if not voices:
        sys.exit("No voice available. Options: pip install supertonic kokoro-onnx soundfile (offline), pip install edge-tts (online), "
                 "or a system voice for this language.")
    for i, (eng, v, rate, label) in enumerate(voices, 1):
        dst = os.path.join(d, "%02d-%s-%s%s.wav" % (i, eng, v.replace(" ", "_"), "" if rate in (None, 1.0) else "-%s" % rate))
        try:
            src, r = synth(eng, v, text, os.path.join(tmp, "s%02d" % i), rate, None)
            if not os.path.exists(src):
                raise RuntimeError((r.stderr or r.stdout or "no output")[-300:])
            c = run(["ffmpeg", "-y", "-v", "error", "-i", src, "-ac", "1", "-ar", "48000", "-sample_fmt", "s16", dst])
            if c.returncode:
                raise RuntimeError(c.stderr[-300:])
            rows.append("| %d | %s | `%s` | %s |" % (i, label, os.path.basename(dst), json.dumps({"engine": eng, "voice": v, "rate": rate}, ensure_ascii=False)))
            print("  sample %d: %s" % (i, label))
        except Exception as e:
            print("  skipped %s (%s)" % (label, str(e).strip()[:160]))
    md = ["# Voice samples", "", "Sentence: " + text, "", "| # | voice | file | put in script.json as \"voice\" |", "|---|---|---|---|"] + rows
    open(os.path.join(d, "index.md"), "w", encoding="utf-8").write("\n".join(md) + "\n")
    print("wrote", os.path.join(d, "index.md"))


if __name__ == "__main__":
    main()
