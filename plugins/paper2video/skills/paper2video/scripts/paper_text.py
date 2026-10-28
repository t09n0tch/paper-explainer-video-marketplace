#!/usr/bin/env python3
"""Put the paper's text into the film folder, so claims can be checked against it.

  python paper_text.py film/ paper.pdf            a local PDF
  python paper_text.py film/ 2607.00272           an arXiv id or link (abs/pdf, with or without vN)
  python paper_text.py film/ https://.../x.pdf    any PDF URL
  python paper_text.py film/ paper.txt            text you already have (pasted paper, OCR output)

Writes film/paper/paper.txt (with '=== page N ===' markers when it comes from a PDF),
film/paper/paper.pdf when there is one, and film/paper/meta.json (source, and for arXiv
the title and license, which decides whether paper figures may appear in the film).
Text extraction: pdftotext -layout if installed, else pypdf (pip install pypdf).
check_claims.py matches quotes and table rows against paper.txt, so always build it
from the paper itself, never from a summary.

The arXiv license detection follows SunandBean/paper2video (MIT, Sunbin Kim).
"""
import json, os, re, shutil, subprocess, sys, urllib.request
from datetime import datetime, timezone

UA = {"User-Agent": "paper2video (personal research explainer)"}
LICENSES = {
    "creativecommons.org/licenses/by/4.0": "CC BY 4.0",
    "creativecommons.org/licenses/by-sa/4.0": "CC BY-SA 4.0",
    "creativecommons.org/licenses/by-nc-sa/4.0": "CC BY-NC-SA 4.0",
    "creativecommons.org/licenses/by-nc-nd/4.0": "CC BY-NC-ND 4.0",
    "creativecommons.org/publicdomain/zero/1.0": "CC0 1.0",
    "arxiv.org/licenses/nonexclusive-distrib/1.0": "arXiv non-exclusive (no reuse grant)",
}
FIGURE_REUSE = {
    "CC BY 4.0": "allowed with attribution (note changes)",
    "CC BY-SA 4.0": "allowed with attribution; derivatives must be CC BY-SA",
    "CC BY-NC-SA 4.0": "non-commercial only: avoid if the video earns money",
    "CC BY-NC-ND 4.0": "non-commercial, no modification: avoid",
    "CC0 1.0": "allowed",
    "arXiv non-exclusive (no reuse grant)": "NOT allowed without author permission: draw your own visuals",
}
ARXIV = re.compile(r"(?:arxiv\.org/(?:abs|pdf)/|arxiv:)?(\d{4}\.\d{4,5}|[a-z-]+(?:\.[A-Z]{2})?/\d{7})(v\d+)?(?:\.pdf)?/?$", re.I)


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120) as r:
        return r.read()


def pdf_to_text(pdf):
    if shutil.which("pdftotext"):
        out = []
        n = 1
        while True:
            r = subprocess.run(["pdftotext", "-layout", "-f", str(n), "-l", str(n), pdf, "-"], capture_output=True, text=True)
            if r.returncode != 0:
                break
            out.append("=== page %d ===\n%s" % (n, r.stdout)); n += 1
        if out:
            return "\n".join(out)
    print("note: pdftotext not found, using pypdf; it can drop spaces and occasionally merge table cells. "
          "For reliable table checks: brew install poppler / apt-get install poppler-utils")
    try:
        from pypdf import PdfReader
    except ImportError:
        sys.exit("no PDF text extractor: install poppler (brew install poppler / apt-get install poppler-utils) or pip install pypdf")
    def page(p):
        try:
            return p.extract_text(extraction_mode="layout") or ""   # keeps table columns apart (pypdf 3.17+)
        except Exception:
            return ""
    pages = PdfReader(pdf).pages
    # layout mode keeps table cells apart but drops text inside figures; plain mode keeps it, so store both
    return "\n".join("=== page %d ===\n%s" % (i + 1, page(p)) for i, p in enumerate(pages)) + \
        "\n=== plain extraction (text the layout pass drops, e.g. inside figures) ===\n" + \
        "\n".join("=== page %d ===\n%s" % (i + 1, p.extract_text() or "") for i, p in enumerate(pages))


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    root, src = sys.argv[1], sys.argv[2].strip()
    d = os.path.join(root, "paper"); os.makedirs(d, exist_ok=True)
    pdf, txt = os.path.join(d, "paper.pdf"), os.path.join(d, "paper.txt")
    meta = {"source": src, "fetched": datetime.now(timezone.utc).isoformat(timespec="seconds")}
    m = ARXIV.search(src) if not os.path.exists(src) else None
    if m:
        aid = m.group(1) + (m.group(2) or "")
        meta["arxiv"] = aid
        abs_html = get("https://arxiv.org/abs/" + aid).decode("utf-8", "replace")
        t = re.search(r'<meta name="citation_title" content="([^"]+)"', abs_html)
        meta["title"] = t.group(1) if t else ""
        meta["license_url"], meta["license"] = "", "unknown (check the abs page)"
        for k, v in LICENSES.items():
            if k in abs_html:
                meta["license_url"], meta["license"] = "https://" + k + "/", v; break
        meta["figure_reuse"] = FIGURE_REUSE.get(meta["license"], "unknown: draw your own visuals")
        open(pdf, "wb").write(get("https://arxiv.org/pdf/" + aid))
    elif re.match(r"https?://", src):
        open(pdf, "wb").write(get(src))
        meta["figure_reuse"] = "unknown license: draw your own visuals"
    elif src.lower().endswith(".pdf"):
        shutil.copy(src, pdf)
        meta["figure_reuse"] = "unknown license: draw your own visuals"
    else:
        shutil.copy(src, txt)
        meta["figure_reuse"] = "unknown license: draw your own visuals"
        pdf = None
    if pdf:
        text = pdf_to_text(pdf).replace("\x00", "")
        open(txt, "w", encoding="utf-8").write(text)
    text = open(txt, encoding="utf-8").read()
    json.dump(meta, open(os.path.join(d, "meta.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    words = len(text.split())
    print("paper text: %s (%d words)" % (txt, words))
    if words < 500:
        print("WARNING: very little text. A scanned PDF needs OCR first; claims cannot be checked against this.")
    if meta.get("license"):
        print("license: %s -> figures: %s" % (meta["license"], meta["figure_reuse"]))


if __name__ == "__main__":
    main()
