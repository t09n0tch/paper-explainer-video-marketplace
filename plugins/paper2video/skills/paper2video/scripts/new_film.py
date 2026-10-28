#!/usr/bin/env python3
"""Create a film folder from the templates.

  python new_film.py path/to/film [--starter | --example rrara]

Copies index.html (the player), engine.js, t3.js (3D on three.js), templates.js (ready-made scenes), film.css,
katex/ (math typesetting) and three/, and makes scenes/ and audio/.
--starter also copies a three-scene example (script.json, claims.json, world.js, scenes/) to start from.
--example rrara copies the complete worked example film (15 scenes, claims.json); get its paper with
  paper_text.py film/ 2506.07223, then timeline.py, tts.py, render.py --preview, check_claims.py.
Existing files are never overwritten, so it is safe to run again.
"""
import os, shutil, sys

if len(sys.argv) < 2:
    sys.exit(__doc__)
root = sys.argv[1]
assets = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets")
os.makedirs(os.path.join(root, "scenes"), exist_ok=True)
os.makedirs(os.path.join(root, "audio"), exist_ok=True)
for lib in ("katex", "three"):
    if not os.path.exists(os.path.join(root, lib)):
        shutil.copytree(os.path.join(assets, lib), os.path.join(root, lib))
        print("created", os.path.join(root, lib))
for src, dst in [("film-template.html", "index.html"), ("engine.js", "engine.js"), ("t3.js", "t3.js"), ("templates.js", "templates.js"), ("film.css", "film.css")]:
    d = os.path.join(root, dst)
    if not os.path.exists(d):
        shutil.copy(os.path.join(assets, src), d)
        print("created", d)
ex = sys.argv[sys.argv.index("--example") + 1] if "--example" in sys.argv else None
if "--starter" in sys.argv or ex:
    st = os.path.join(assets, "example-" + ex if ex else "starter")
    if not os.path.isdir(st):
        sys.exit("no example %r (have: %s)" % (ex, ", ".join(d[8:] for d in os.listdir(assets) if d.startswith("example-"))))
    for dp, dn, fn in os.walk(st):
        for f in fn:
            rel = os.path.relpath(os.path.join(dp, f), st); d = os.path.join(root, rel)
            os.makedirs(os.path.dirname(d), exist_ok=True)
            if not os.path.exists(d):
                shutil.copy(os.path.join(dp, f), d); print("created", d)
print("next: write %s/script.json, then python timeline.py %s" % (root, root))
