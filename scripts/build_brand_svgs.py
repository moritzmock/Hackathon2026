# Writes the Calibra logo files in public/brand as SVG: the mark, the full logo with the name as outlines,
# white versions and the app icon. Run: uv run --no-project --with fonttools python scripts/build_brand_svgs.py "$PWD" public/brand
# The PNG and PDF files and calibra-corporate-identity.pdf were rendered from these SVGs in a browser.
import sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

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
    """'Calibra' in Sora 600 at `size` px, letter spacing -0.04em, the i dotless with an orange tile as its dot."""
    scale = size / upm
    track = -0.04 * size
    x = 0.0
    paths, i_box = [], None
    for ch in "Calıbra":
        name = cmap[ord(ch)]
        pen = SVGPathPen(gs)
        gs[name].draw(TransformPen(pen, (scale, 0, 0, -scale, x, size * 0.8)))
        paths.append(pen.getCommands())
        if ch == "ı":
            bp = BoundsPen(gs); gs[name].draw(bp)
            i_box = (x + bp.bounds[0] * scale, x + bp.bounds[2] * scale)
        x += hmtx[name][0] * scale + (track if ch != "ı" else 0)
    width = x - track
    # The dot: where Sora's own dot would sit, a little larger (as in the app's CSS).
    d = 0.17 * size
    cx = (i_box[0] + i_box[1]) / 2
    top = size * 0.8 - 0.75 * size + 0.05 * size  # cap height ≈ 0.75em above the baseline
    r1, r2 = 0.063 * size, 0.012 * size
    dot = (f'<path fill="{ORANGE}" d="M{cx-d/2+r1:.2f} {top:.2f} H{cx+d/2-r2:.2f} Q{cx+d/2:.2f} {top:.2f} {cx+d/2:.2f} {top+r2:.2f} '
           f'V{top+d-r1:.2f} Q{cx+d/2:.2f} {top+d:.2f} {cx+d/2-r1:.2f} {top+d:.2f} H{cx-d/2+r1:.2f} Q{cx-d/2:.2f} {top+d:.2f} {cx-d/2:.2f} {top+d-r1:.2f} '
           f'V{top+r1:.2f} Q{cx-d/2:.2f} {top:.2f} {cx-d/2+r1:.2f} {top:.2f} Z"/>')
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
