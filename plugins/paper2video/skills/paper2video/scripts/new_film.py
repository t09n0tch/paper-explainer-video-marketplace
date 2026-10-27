#!/usr/bin/env python3
"""Create a film folder from the templates.

  python new_film.py path/to/film [--starter]

Copies index.html (the player), engine.js, film.css and katex/ (math typesetting), and makes scenes/ and audio/.
--starter also copies a two-scene example (script.json, world.js, scenes/) to start from.
Existing files are never overwritten, so it is safe to run again.
"""
import os, shutil, sys

if len(sys.argv) < 2:
    sys.exit(__doc__)
root = sys.argv[1]
assets = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets")
os.makedirs(os.path.join(root, "scenes"), exist_ok=True)
os.makedirs(os.path.join(root, "audio"), exist_ok=True)
if not os.path.exists(os.path.join(root, "katex")):
    shutil.copytree(os.path.join(assets, "katex"), os.path.join(root, "katex"))
    print("created", os.path.join(root, "katex"))
for src, dst in [("film-template.html", "index.html"), ("engine.js", "engine.js"), ("film.css", "film.css")]:
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
