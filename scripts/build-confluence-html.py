#!/usr/bin/env python3
"""
Render guide.md into a single self-contained HTML file for pasting into
Confluence.

Confluence cannot follow the guide's relative image paths, and the repository
is private so GitHub image URLs will not load either. Inlining every image as a
data URI sidesteps both: opening the output in a browser and copying the page
puts the image bytes on the clipboard, so Confluence uploads them as page
attachments on paste. One copy, one paste, no manual attaching.

Heading self-links are flattened to plain text, because Confluence generates
its own heading anchors and the markdown ones would paste as dead links.

Run after editing guide.md:

    python3 scripts/build-confluence-html.py

Handles only the subset of Markdown the guide uses.
"""
import base64
import html
import mimetypes
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "guide.md")
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
    ROOT, "guide-for-confluence.html"
)


def data_uri(rel):
    path = os.path.join(ROOT, rel)
    mime = mimetypes.guess_type(path)[0] or "image/png"
    with open(path, "rb") as f:
        return f"data:{mime};base64,{base64.b64encode(f.read()).decode()}"


def inline(t):
    t = html.escape(t, quote=False)
    t = re.sub(r"`([^`]+)`", r"<code>\1</code>", t)
    t = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"(?<!\*)\*([^*\n]+)\*(?!\*)", r"<em>\1</em>", t)
    # Anchor-only links become plain text; Confluence makes its own anchors.
    t = re.sub(r"\[([^\]]+)\]\(#[^)]*\)", r"\1", t)
    t = re.sub(r"\[([^\]]+)\]\((https?://[^)]+)\)", r'<a href="\2">\1</a>', t)
    t = re.sub(r"&lt;(https?://[^&]+)&gt;", r'<a href="\1">\1</a>', t)
    return t


def render(lines):
    out, i = [], 0
    while i < len(lines):
        ln = lines[i]

        if not ln.strip():
            i += 1
            continue

        if ln.strip() == "---":
            out.append("<hr>")
            i += 1
            continue

        m = re.match(r"^(#{1,6})\s+(.*)$", ln)
        if m:
            lvl, txt = len(m.group(1)), m.group(2)
            out.append(f"<h{lvl}>{inline(txt)}</h{lvl}>")
            i += 1
            continue

        m = re.match(r"^!\[([^\]]*)\]\(([^)]+)\)\s*$", ln)
        if m:
            alt, src = m.group(1), m.group(2)
            uri = src if src.startswith("http") else data_uri(src)
            out.append(
                f'<p><img src="{uri}" alt="{html.escape(alt)}" '
                f'style="max-width:720px;border:1px solid #d8dde3;'
                f'border-radius:6px"></p>'
            )
            i += 1
            continue

        if ln.lstrip().startswith("|") and i + 1 < len(lines) and re.match(
            r"^\s*\|[\s:|-]+\|\s*$", lines[i + 1]
        ):
            def cells(row):
                return [c.strip() for c in row.strip().strip("|").split("|")]

            head = cells(ln)
            i += 2
            rows = []
            while i < len(lines) and lines[i].lstrip().startswith("|"):
                rows.append(cells(lines[i]))
                i += 1
            t = [
                '<table style="border-collapse:collapse" border="1" '
                'cellpadding="6">',
                "<thead><tr>",
            ]
            t += [f"<th>{inline(c)}</th>" for c in head]
            t.append("</tr></thead><tbody>")
            for r in rows:
                t.append(
                    "<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>"
                )
            t.append("</tbody></table>")
            out.append("".join(t))
            continue

        if ln.lstrip().startswith(">"):
            buf = []
            while i < len(lines) and lines[i].lstrip().startswith(">"):
                buf.append(re.sub(r"^\s*>\s?", "", lines[i]))
                i += 1
            out.append(
                "<blockquote>"
                + inline(" ".join(x for x in buf if x.strip()))
                + "</blockquote>"
            )
            continue

        if re.match(r"^\s*[-*]\s+", ln) or re.match(r"^\s*\d+\.\s+", ln):
            tag = "ol" if re.match(r"^\s*\d+\.\s+", ln) else "ul"
            items = []
            while i < len(lines) and (
                re.match(r"^\s*[-*]\s+", lines[i])
                or re.match(r"^\s*\d+\.\s+", lines[i])
            ):
                items.append(re.sub(r"^\s*(?:[-*]|\d+\.)\s+", "", lines[i]))
                i += 1
            out.append(
                f"<{tag}>"
                + "".join(f"<li>{inline(x)}</li>" for x in items)
                + f"</{tag}>"
            )
            continue

        buf = []
        while (
            i < len(lines)
            and lines[i].strip()
            and lines[i].strip() != "---"
            and not re.match(
                r"^(#{1,6}\s|!\[|\s*[-*]\s|\s*\d+\.\s|\s*>|\s*\|)", lines[i]
            )
        ):
            buf.append(lines[i])
            i += 1
        if buf:
            out.append("<p>" + inline(" ".join(buf)) + "</p>")
    return out


blocks = render(open(SRC).read().split("\n"))
with open(OUT, "w") as f:
    f.write(
        '<!doctype html><meta charset="utf-8">'
        "<title>Self-Service Guide for Events Portal</title>"
        '<body style="font:16px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;'
        'max-width:820px;margin:40px auto;padding:0 20px;color:#172b4d">'
        + "\n".join(blocks)
        + "</body>"
    )

print(f"wrote {OUT} ({os.path.getsize(OUT) / 1024 / 1024:.1f} MB)")
