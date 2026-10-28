#!/usr/bin/env python3
"""Create a film folder from the templates.

  python new_film.py path/to/film [--starter]

Copies index.html (the player), engine.js, film.css, slide.js (the data-driven slide scene), parts.js
(builders for hand-made scenes), t3.js (real 3D on three.js) with three/, and katex/, and makes scenes/,
audio/ and slides/.
--starter also copies a small example (script.json, claims.json, scenes/) to start from.
Existing files are never overwritten, so it is safe to run again.
"""
import os, shutil, sys

if len(sys.argv) < 2:
    sys.exit(__doc__)
root = sys.argv[1]
assets = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets")
os.makedirs(os.path.join(root, "scenes"), exist_ok=True)
os.makedirs(os.path.join(root, "audio"), exist_ok=True)
os.makedirs(os.path.join(root, "slides"), exist_ok=True)
for lib in ("katex", "three"):
    if not os.path.exists(os.path.join(root, lib)):
        shutil.copytree(os.path.join(assets, lib), os.path.join(root, lib))
        print("created", os.path.join(root, lib))
for src, dst in [("film-template.html", "index.html"), ("engine.js", "engine.js"), ("film.css", "film.css"),
                 ("slide.js", "slide.js"), ("parts.js", "parts.js"), ("cards.js", "cards.js"), ("t3.js", "t3.js")]:
    d = os.path.join(root, dst)
    if not os.path.exists(d):
        shutil.copy(os.path.join(assets, src), d)
        print("created", d)
if "--starter" in sys.argv:
    st = os.path.join(assets, "starter")
    for dp, dn, fn in os.walk(st):
        for f in fn:
            rel = os.path.relpath(os.path.join(dp, f), st); d = os.path.join(root, rel)
            os.makedirs(os.path.dirname(d), exist_ok=True)
            if not os.path.exists(d):
                shutil.copy(os.path.join(dp, f), d); print("created", d)
print("next: write %s/script.json, then python timeline.py %s" % (root, root))
