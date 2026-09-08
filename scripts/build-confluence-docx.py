#!/usr/bin/env python3
"""
Render guide.md into a Word .docx with every screenshot embedded.

Confluence has no "upload a folder and make it a page" import, but it does have
Import Word Document, which pulls images in with the text. This produces a file
for that route: one upload, one page, screenshots attached automatically.

A .docx is a zip of XML, so this is built with the standard library only.
Handles the subset of Markdown the guide uses.

    python3 scripts/build-confluence-docx.py
"""
import os
import re
import struct
import sys
import zipfile
from xml.sax.saxutils import escape

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "guide.md")
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
    ROOT, "guide-for-confluence.docx"
)

EMU_PER_PX = 9525
MAX_W_EMU = 5486400  # 6 inches, fits a portrait page with default margins

images = []  # (rel_id, arcname, w_emu, h_emu)


def png_size(path):
    with open(path, "rb") as f:
        head = f.read(24)
    return struct.unpack(">II", head[16:24])


def add_image(rel_path):
    src = os.path.join(ROOT, rel_path)
    w, h = png_size(src)
    w_emu, h_emu = w * EMU_PER_PX, h * EMU_PER_PX
    if w_emu > MAX_W_EMU:
        h_emu = int(h_emu * MAX_W_EMU / w_emu)
        w_emu = MAX_W_EMU
    idx = len(images) + 1
    rid = f"rIdImg{idx}"
    images.append((rid, f"media/image{idx}.png", src, w_emu, h_emu))
    return rid, w_emu, h_emu


def runs(text):
    """Inline markdown -> a list of <w:r> runs, honouring bold/italic/code."""
    text = re.sub(r"\[([^\]]+)\]\(#[^)]*\)", r"\1", text)      # anchor links -> text
    text = re.sub(r"\[([^\]]+)\]\((https?://[^)]+)\)", r"\1 (\2)", text)
    # Bare autolinks are written <https://...> in the source; unwrap them
    # before any escaping, or the angle brackets survive into the document.
    text = re.sub(r"<(https?://[^>]+)>", r"\1", text)

    out = []
    for part in re.split(r"(\*\*[^*]+\*\*|(?<!\*)\*[^*\n]+\*(?!\*)|`[^`]+`)", text):
        if not part:
            continue
        props, body = "", part
        if part.startswith("**") and part.endswith("**"):
            props, body = "<w:b/>", part[2:-2]
        elif part.startswith("`") and part.endswith("`"):
            props, body = '<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/>', part[1:-1]
        elif part.startswith("*") and part.endswith("*"):
            props, body = "<w:i/>", part[1:-1]
        body = escape(body)
        rpr = f"<w:rPr>{props}</w:rPr>" if props else ""
        out.append(f'<w:r>{rpr}<w:t xml:space="preserve">{body}</w:t></w:r>')
    return "".join(out)


def para(content, style=None, spacing_after=160):
    ppr = "<w:pPr>"
    if style:
        ppr += f'<w:pStyle w:val="{style}"/>'
    ppr += f'<w:spacing w:after="{spacing_after}"/></w:pPr>'
    return f"<w:p>{ppr}{content}</w:p>"


def image_para(rid, w, h, alt):
    return (
        "<w:p><w:pPr><w:spacing w:after='200'/></w:pPr><w:r><w:drawing>"
        f'<wp:inline distT="0" distB="0" distL="0" distR="0">'
        f'<wp:extent cx="{w}" cy="{h}"/><wp:docPr id="{len(images)}" '
        f'name="{escape(alt) or "screenshot"}"/>'
        "<a:graphic xmlns:a='http://schemas.openxmlformats.org/drawingml/2006/main'>"
        "<a:graphicData uri='http://schemas.openxmlformats.org/drawingml/2006/picture'>"
        "<pic:pic xmlns:pic='http://schemas.openxmlformats.org/drawingml/2006/picture'>"
        f"<pic:nvPicPr><pic:cNvPr id='{len(images)}' name='image.png'/>"
        "<pic:cNvPicPr/></pic:nvPicPr>"
        f"<pic:blipFill><a:blip r:embed='{rid}'/><a:stretch><a:fillRect/>"
        "</a:stretch></pic:blipFill>"
        f"<pic:spPr><a:xfrm><a:off x='0' y='0'/><a:ext cx='{w}' cy='{h}'/></a:xfrm>"
        "<a:prstGeom prst='rect'><a:avLst/></a:prstGeom></pic:spPr>"
        "</pic:pic></a:graphicData></a:graphic></wp:inline>"
        "</w:drawing></w:r></w:p>".replace("'", '"')
    )


def table(head, rows):
    def cell(t, bold=False):
        c = runs(f"**{t}**" if bold and not t.startswith("**") else t)
        return (
            '<w:tc><w:tcPr><w:tcW w:w="0" w:type="auto"/></w:tcPr>'
            f'<w:p><w:pPr><w:spacing w:after="0"/></w:pPr>{c}</w:p></w:tc>'
        )

    xml = [
        "<w:tbl><w:tblPr><w:tblStyle w:val='TableGrid'/>"
        "<w:tblW w:w='0' w:type='auto'/>"
        "<w:tblBorders>"
        + "".join(
            f"<w:{s} w:val='single' w:sz='4' w:color='D8DDE3'/>"
            for s in ("top", "left", "bottom", "right", "insideH", "insideV")
        )
        + "</w:tblBorders></w:tblPr>"
    ]
    xml.append("<w:tr>" + "".join(cell(h, bold=True) for h in head) + "</w:tr>")
    for r in rows:
        xml.append("<w:tr>" + "".join(cell(c) for c in r) + "</w:tr>")
    xml.append("</w:tbl>")
    # A table must be followed by a paragraph or Word complains.
    return "".join(xml).replace("'", '"') + '<w:p><w:pPr><w:spacing w:after="160"/></w:pPr></w:p>'


lines = open(SRC).read().split("\n")
body, i = [], 0

while i < len(lines):
    ln = lines[i]

    if not ln.strip() or ln.strip() == "---":
        i += 1
        continue

    m = re.match(r"^(#{1,4})\s+(.*)$", ln)
    if m:
        lvl = min(len(m.group(1)), 3)
        body.append(para(runs(m.group(2)), style=f"Heading{lvl}", spacing_after=120))
        i += 1
        continue

    m = re.match(r"^!\[([^\]]*)\]\(([^)]+)\)\s*$", ln)
    if m:
        rid, w, h = add_image(m.group(2))
        body.append(image_para(rid, w, h, m.group(1)))
        i += 1
        continue

    if ln.lstrip().startswith("|") and i + 1 < len(lines) and re.match(
        r"^\s*\|[\s:|-]+\|\s*$", lines[i + 1]
    ):
        cells = lambda r: [c.strip() for c in r.strip().strip("|").split("|")]
        head = cells(ln)
        i += 2
        rows = []
        while i < len(lines) and lines[i].lstrip().startswith("|"):
            rows.append(cells(lines[i]))
            i += 1
        body.append(table(head, rows))
        continue

    if ln.lstrip().startswith(">"):
        buf = []
        while i < len(lines) and lines[i].lstrip().startswith(">"):
            buf.append(re.sub(r"^\s*>\s?", "", lines[i]))
            i += 1
        body.append(para(runs(" ".join(x for x in buf if x.strip())), style="Quote"))
        continue

    if re.match(r"^\s*[-*]\s+", ln) or re.match(r"^\s*\d+\.\s+", ln):
        n = 1
        while i < len(lines) and (
            re.match(r"^\s*[-*]\s+", lines[i]) or re.match(r"^\s*\d+\.\s+", lines[i])
        ):
            ordered = bool(re.match(r"^\s*\d+\.\s+", lines[i]))
            txt = re.sub(r"^\s*(?:[-*]|\d+\.)\s+", "", lines[i])
            # A literal marker, rather than numbering.xml, keeps the file simple
            # and imports identically.
            marker = f"{n}. " if ordered else "•  "
            body.append(para(runs(marker + txt), spacing_after=80))
            n += 1
            i += 1
        continue

    buf = []
    while (
        i < len(lines)
        and lines[i].strip()
        and lines[i].strip() != "---"
        and not re.match(r"^(#{1,6}\s|!\[|\s*[-*]\s|\s*\d+\.\s|\s*>|\s*\|)", lines[i])
    ):
        buf.append(lines[i])
        i += 1
    if buf:
        body.append(para(runs(" ".join(buf))))

document = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" '
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
    'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">'
    "<w:body>" + "".join(body) +
    '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>'
    '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr>'
    "</w:body></w:document>"
)

def heading_style(i, size, color):
    return (
        f'<w:style w:type="paragraph" w:styleId="Heading{i}"><w:name w:val="heading {i}"/>'
        '<w:basedOn w:val="Normal"/><w:pPr><w:outlineLvl w:val="%d"/>'
        '<w:spacing w:before="280" w:after="120"/></w:pPr>'
        f'<w:rPr><w:b/><w:color w:val="{color}"/><w:sz w:val="{size}"/></w:rPr></w:style>'
    ) % (i - 1)

styles = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
    '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/>'
    '<w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr></w:style>'
    + heading_style(1, 40, "172B4D")
    + heading_style(2, 32, "172B4D")
    + heading_style(3, 26, "172B4D")
    + '<w:style w:type="paragraph" w:styleId="Quote"><w:name w:val="Quote"/>'
    '<w:basedOn w:val="Normal"/><w:pPr><w:ind w:left="454"/></w:pPr>'
    '<w:rPr><w:i/><w:color w:val="5E6C84"/></w:rPr></w:style>'
    '<w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/></w:style>'
    "</w:styles>"
)

rels = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    '<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
    + "".join(
        f'<Relationship Id="{rid}" '
        'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" '
        f'Target="{arc}"/>'
        for rid, arc, _src, _w, _h in images
    )
    + "</Relationships>"
)

content_types = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    '<Default Extension="xml" ContentType="application/xml"/>'
    '<Default Extension="png" ContentType="image/png"/>'
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
    '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'
    "</Types>"
)

root_rels = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
    "</Relationships>"
)

with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
    z.writestr("[Content_Types].xml", content_types)
    z.writestr("_rels/.rels", root_rels)
    z.writestr("word/document.xml", document)
    z.writestr("word/styles.xml", styles)
    z.writestr("word/_rels/document.xml.rels", rels)
    for _rid, arc, src, _w, _h in images:
        z.write(src, f"word/{arc}")

print(f"wrote {OUT} ({os.path.getsize(OUT)/1024/1024:.1f} MB, {len(images)} images)")
