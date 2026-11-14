# Writes the Calibra logo files in public/brand as SVG: the mark, the full logo with the name as outlines,
# white versions and the app icon. Run: uv run --no-project --with fonttools python scripts/build_brand_svgs.py "$PWD" public/brand
# The PNG and PDF files and calibra-corporate-identity.pdf were rendered from these SVGs in a browser.
# The logo PNGs (2000 x 477, transparent) and PDFs (300 pt high) are each one headless-Chrome render of the SVG.
import sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.recordingPen import DecomposingRecordingPen

root, out = sys.argv[1], sys.argv[2]
VIOLET, ORANGE = "#4f256e", "#f26e26"
FLAME = "M0.5 -7 C1 -3.5 6 -1.5 6 2.8 C6 5.8 3.4 7.5 0 7.5 C-3.4 7.5 -6 5.6 -6 2.6 C-6 0.2 -4.6 -1.3 -3.6 -3.2 C-2.6 -1.4 -1.6 -0.6 -0.6 -0.4 C-1.2 -3 -0.6 -5.2 0.5 -7 Z"

def mark(ink):
    return (f'<g fill="none" stroke="{ink}" stroke-width="4.4" stroke-linecap="round">'
            f'<path d="M35.57 10.21 A18 18 0 1 0 35.57 37.79"/><circle cx="24" cy="24" r="3.6"/><path d="M26.6 21.4 L31.2 16.8"/></g>'
            f'<path transform="translate(40.6 22.6) scale(1.15 1.45)" d="{FLAME}" fill="{ORANGE}" stroke="{ORANGE}" stroke-width="1" stroke-linejoin="round"/>')

font = TTFont(f"{root}/node_modules/@fontsource/sora/files/sora-latin-600-normal.woff")
gs, cmap, upm = font.getGlyphSet(), font.getBestCmap(), font["head"].unitsPerEm
hmtx = font["hmtx"]

def wordmark(ink, size):
    """'Calibra' in Sora 600 at `size` px, letter spacing -0.04em; the dot of the i is Sora's own, in orange."""
    scale = size / upm
    track = -0.04 * size
    x = 0.0
    paths, dot = [], ""
    for ch in "Calibra":
        name = cmap[ord(ch)]
        pen = SVGPathPen(gs)
        where = (scale, 0, 0, -scale, x, size * 0.8)
        if ch == "i":
            # The stem in ink, the dot in orange: split the glyph's outlines at the x-height.
            rec = DecomposingRecordingPen(gs)
            gs[name].draw(rec)
            contours, cur = [], []
            for op, args in rec.value:
                cur.append((op, args))
                if op in ("closePath", "endPath"):
                    contours.append(cur)
                    cur = []
            xh = font["OS/2"].sxHeight
            dot_pen = SVGPathPen(gs)
            for c in contours:
                low = min(pt[1] for _, args in c for pt in args if pt is not None)
                target = TransformPen(dot_pen if low > xh else pen, where)
                for op, args in c:
                    getattr(target, op)(*args)
            dot = f'<path fill="{ORANGE}" d="{dot_pen.getCommands()}"/>'
        else:
            gs[name].draw(TransformPen(pen, where))
        paths.append(pen.getCommands())
        x += hmtx[name][0] * scale + (track if ch != "i" else 0)
    width = x - track
    return f'<path fill="{ink}" d="{" ".join(paths)}"/>{dot}', width

def svg(w, h, body, view=None):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view or f"0 0 {w:.1f} {h:.1f}"}" width="{w:.0f}" height="{h:.0f}">{body}</svg>\n'

files = {}
files["calibra-mark.svg"] = svg(512, 512, mark(VIOLET), "0 0 48 48")
files["calibra-mark-white.svg"] = svg(512, 512, mark("#ffffff"), "0 0 48 48")
files["calibra-app-icon.svg"] = svg(512, 512, f'<rect x="1" y="1" width="46" height="46" rx="11" fill="{VIOLET}"/><g transform="translate(24 24) scale(0.8) translate(-24 -24)">{mark("#ffffff")}</g>', "0 0 48 48")
# Logo: mark 34 px, gap 10 px, name 28 px, as in the app's list header; drawn at 4x.
for name, ink in (("calibra-logo.svg", VIOLET), ("calibra-logo-white.svg", "#ffffff")):
    k = 4
    wm, ww = wordmark(ink, 28 * k)
    m = 34 * k
    h = m
    body = f'<g transform="scale({m/48:.4f})">{mark(ink)}</g><g transform="translate({m + 10*k} {(h - 28*k)/2:.2f})">{wm}</g>'
    files[name] = svg(m + 10 * k + ww, h, body)
for n, s in files.items():
    open(f"{out}/{n}", "w").write(s)
print("\n".join(files))
