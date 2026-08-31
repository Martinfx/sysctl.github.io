#!/usr/bin/env python3
"""Render tools/og-card.html into assets/img/og.png (1200x630).

Drives headless Chromium and crops the result. No third-party modules.

    python3 tools/render-og.py [--chrome /path/to/chrome]

Chromium is rendered in a taller window than the card and the screenshot is
cropped afterwards: --window-size counts browser chrome, so asking for a
1200x630 window yields a viewport shorter than 630 and clips the card.
"""

import argparse
import os
import pathlib
import shutil
import struct
import subprocess
import sys
import tempfile
import zlib

W, H = 1200, 630
ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "tools" / "og-card.html"
OUT = ROOT / "assets" / "img" / "og.png"

CANDIDATES = [
    "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    "chromium", "chromium-browser", "google-chrome", "google-chrome-stable",
]


def find_chrome(explicit):
    for c in ([explicit] if explicit else []) + CANDIDATES:
        p = shutil.which(c) or (c if os.path.exists(c) else None)
        if p:
            return p
    sys.exit("no chromium found; pass --chrome /path/to/chrome")


def read_png(path):
    data = path.read_bytes()
    idat, i = b"", 8
    while i < len(data):
        ln = struct.unpack(">I", data[i:i + 4])[0]
        tag, chunk = data[i + 4:i + 8], data[i + 8:i + 8 + ln]
        if tag == b"IHDR":
            w, h, depth, colour = struct.unpack(">IIBB", chunk[:10])
            if depth != 8 or colour not in (2, 6):
                sys.exit("unexpected PNG format from chromium")
        elif tag == b"IDAT":
            idat += chunk
        i += 12 + ln

    bpp = 4 if colour == 6 else 3
    stride = w * bpp
    raw = zlib.decompress(idat)
    rows, prev = [], bytearray(stride)
    for y in range(h):
        filt = raw[y * (stride + 1)]
        line = bytearray(raw[y * (stride + 1) + 1:(y + 1) * (stride + 1)])
        for x in range(stride):
            a = line[x - bpp] if x >= bpp else 0
            b = prev[x]
            c = prev[x - bpp] if x >= bpp else 0
            if filt == 1:
                line[x] = (line[x] + a) & 255
            elif filt == 2:
                line[x] = (line[x] + b) & 255
            elif filt == 3:
                line[x] = (line[x] + (a + b) // 2) & 255
            elif filt == 4:
                pa, pb, pc = abs(b - c), abs(a - c), abs(a + b - 2 * c)
                pred = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[x] = (line[x] + pred) & 255
        rows.append(bytes(line))
        prev = line
    return w, h, rows, bpp


def write_png(path, width, height, rows, bpp):
    raw = b"".join(b"\x00" + r for r in rows)

    def chunk(tag, payload):
        return (struct.pack(">I", len(payload)) + tag + payload
                + struct.pack(">I", zlib.crc32(tag + payload) & 0xFFFFFFFF))

    path.write_bytes(
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8,
                                     6 if bpp == 4 else 2, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b""))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--chrome")
    ap.add_argument("--src", help="alternate card HTML, e.g. one with fonts "
                                  "served locally instead of from Google Fonts")
    args = ap.parse_args()
    chrome = find_chrome(args.chrome)
    src = pathlib.Path(args.src).resolve() if args.src else SRC

    with tempfile.TemporaryDirectory() as tmp:
        shot = pathlib.Path(tmp) / "shot.png"
        subprocess.run([
            chrome, "--headless=new", "--disable-gpu", "--no-sandbox",
            "--hide-scrollbars", "--force-device-scale-factor=1",
            "--font-render-hinting=none", "--virtual-time-budget=15000",
            "--window-size=%d,%d" % (W, H + 300),
            "--screenshot=%s" % shot, src.as_uri(),
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        w, h, rows, bpp = read_png(shot)
        if w < W or h < H:
            sys.exit("screenshot %dx%d is smaller than the card" % (w, h))
        cropped = [r[:W * bpp] for r in rows[:H]]
        write_png(OUT, W, H, cropped, bpp)

    print("wrote %s (%dx%d)" % (OUT.relative_to(ROOT), W, H))


if __name__ == "__main__":
    main()
