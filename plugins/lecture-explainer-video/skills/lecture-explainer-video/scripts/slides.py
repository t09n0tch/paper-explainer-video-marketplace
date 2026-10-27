#!/usr/bin/env python3
"""Prepare a lecture PDF for the film: page images, region boxes, overlay groups, contact sheets.

  python slides.py lecture.pdf film/ [--dpi 400] [--pages 3-7,12]

Writes, inside the film folder:
  slides/pNN.png        one image per page (NN = page number, 2+ digits)
  slides/sheet_NN.png   contact sheets, 12 pages each with page numbers, to read the deck quickly
  slides.json           per page: title, text, and boxes in 0..1 page coordinates
                          blocks  [{id: "b3", box, text}]          paragraphs / bullets
                          lines   [{id: "b3.2", box, text}]        single lines, tight to the glyphs
                          figures [{id: "fig1", box, kind}]        raster images and vector drawings
                        plus "overlay_of": N when the page looks like a Beamer \\pause step of page N
                        (same title, earlier page's text contained in this one).

Boxes are tight glyph boxes (not line-height boxes), so marks drawn from them sit on the text.
Needs: pip install pymupdf
"""
import argparse, json, os, re, sys

try:
    import pymupdf as fitz
except ImportError:
    import fitz  # older PyMuPDF


def parse_pages(spec, n):
    if not spec:
        return list(range(1, n + 1))
    out = []
    for part in spec.split(","):
        a, _, b = part.partition("-")
        out += list(range(int(a), int(b or a) + 1))
    return [p for p in out if 1 <= p <= n]


def norm(r, W, H):
    return [round(r[0] / W, 4), round(r[1] / H, 4), round(r[2] / W, 4), round(r[3] / H, 4)]


def page_regions(page):
    W, H = page.rect.width, page.rect.height
    flags = getattr(fitz, "TEXT_ACCURATE_BBOXES", 0) | getattr(fitz, "TEXT_PRESERVE_WHITESPACE", 0)
    d = page.get_text("dict", flags=flags)
    blocks, lines, title, title_size = [], [], "", 0
    bi = 0
    for b in d["blocks"]:
        if b.get("type") != 0:
            continue
        txt_lines = []
        for l in b["lines"]:
            t = "".join(s["text"] for s in l["spans"]).strip()
            if not t:
                continue
            txt_lines.append((l, t))
        if not txt_lines:
            continue
        bi += 1
        btxt = " ".join(t for _, t in txt_lines)
        if re.fullmatch(r"\d+\s*/\s*\d+", btxt):  # Beamer page counter
            continue
        blocks.append({"id": "b%d" % bi, "box": norm(b["bbox"], W, H), "text": btxt})
        for li, (l, t) in enumerate(txt_lines, 1):
            lines.append({"id": "b%d.%d" % (bi, li), "box": norm(l["bbox"], W, H), "text": t})
            size = max(s["size"] for s in l["spans"])
            if l["bbox"][1] < 0.2 * H and size > title_size:
                title, title_size = t, size
    figs = []
    for i, info in enumerate(page.get_image_info(), 1):
        figs.append({"id": "img%d" % i, "box": norm(info["bbox"], W, H), "kind": "image"})
    # vector drawings: merge overlapping drawing boxes into clusters (diagrams)
    # skip page backgrounds and full-width block backgrounds; keep lines (zero-area rects) and shapes
    rects = [fitz.Rect(p["rect"]) for p in page.get_drawings() if p["rect"].width < 0.85 * W]
    clusters = []
    for r in rects:
        r = fitz.Rect(r.x0 - 6, r.y0 - 6, r.x1 + 6, r.y1 + 6)
        merged = True
        while merged:
            merged = False
            for c in clusters:
                if c.intersects(r):
                    r |= c; clusters.remove(c); merged = True; break
        clusters.append(r)
    big = [c for c in clusters if c.width > 0.08 * W and c.height > 0.08 * H]
    for i, c in enumerate(sorted(big, key=lambda c: (c.y0, c.x0)), 1):
        figs.append({"id": "fig%d" % i, "box": norm(c, W, H), "kind": "drawing"})
    return {"w": W, "h": H, "title": title, "text": page.get_text().strip(), "blocks": blocks, "lines": lines, "figures": figs}


def contact_sheets(doc, pages, out_dir, per=12, cols=3):
    W, H = doc[0].rect.width, doc[0].rect.height
    files = []
    for k in range(0, len(pages), per):
        chunk = pages[k:k + per]
        rows = (len(chunk) + cols - 1) // cols
        sheet = fitz.open()
        pg = sheet.new_page(width=cols * W, height=rows * (H + 18))
        for i, p in enumerate(chunk):
            x, y = (i % cols) * W, (i // cols) * (H + 18)
            pg.show_pdf_page(fitz.Rect(x + 4, y + 18, x + W - 4, y + 18 + H - 8), doc, p - 1)
            pg.insert_text((x + 6, y + 14), "p%d" % p, fontsize=13, color=(0.8, 0.1, 0.1))
        f = os.path.join(out_dir, "sheet_%02d.png" % (k // per + 1))
        pg.get_pixmap(dpi=110).save(f); files.append(f)
    return files


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("pdf"); ap.add_argument("root")
    ap.add_argument("--dpi", type=int, default=400, help="page image resolution (400 keeps zooms sharp)")
    ap.add_argument("--pages", help="e.g. 3-7,12 (default: all)")
    a = ap.parse_args()
    doc = fitz.open(a.pdf)
    pages = parse_pages(a.pages, doc.page_count)
    out = os.path.join(a.root, "slides"); os.makedirs(out, exist_ok=True)
    data, prev = {"source": os.path.basename(a.pdf), "page_count": doc.page_count, "pages": []}, None
    for p in pages:
        page = doc[p - 1]
        page.get_pixmap(dpi=a.dpi).save(os.path.join(out, "p%02d.png" % p))
        r = page_regions(page); r["page"] = p
        if prev and prev["title"] and prev["title"] == r["title"] and prev["page"] == p - 1:
            a_txt, b_txt = re.sub(r"\s+", " ", prev["text"]), re.sub(r"\s+", " ", r["text"])
            core = re.sub(r"\d+\s*/\s*\d+\s*$", "", a_txt).strip()
            if core and core[:-1] in b_txt or all(w in b_txt for w in core.split()[:40]) and len(b_txt) > len(a_txt):
                r["overlay_of"] = prev.get("overlay_of", prev["page"])
        data["pages"].append(r); prev = r
    json.dump(data, open(os.path.join(a.root, "slides.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    sheets = contact_sheets(doc, pages, out)
    ov = [(x["page"], x["overlay_of"]) for x in data["pages"] if "overlay_of" in x]
    print("slides: %d pages -> %s (%d dpi), %d contact sheets" % (len(pages), out, a.dpi, len(sheets)))
    print("overlay steps (page -> first page of its group):", ov or "none")
    for x in data["pages"]:
        print("  p%-3d %-60s blocks %2d  figures %d%s" % (x["page"], x["title"][:60], len(x["blocks"]), len(x["figures"]),
                                                        "  [overlay of p%d]" % x["overlay_of"] if "overlay_of" in x else ""))


if __name__ == "__main__":
    main()
