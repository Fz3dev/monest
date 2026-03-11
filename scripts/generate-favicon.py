#!/usr/bin/env python3
"""Generate favicon with dark background for link previews"""
from PIL import Image, ImageDraw, ImageFont
import os

OUT = os.path.join(os.path.dirname(__file__), "..", "public")
FONT_BOLD = "/System/Library/Fonts/HelveticaNeue.ttc"
BG = (11, 11, 15)       # #0B0B0F
BRAND = (108, 99, 255)  # #6C63FF
WHITE = (255, 255, 255)


def make_favicon(size, filename, radius=6):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # Dark rounded square background
    draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=BG)
    # Purple rounded square inside (with padding)
    pad = max(size // 8, 3)
    inner_r = max(radius - 2, 3)
    draw.rounded_rectangle((pad, pad, size - pad - 1, size - pad - 1),
                           radius=inner_r, fill=BRAND)
    # White "M" letter
    font_size = int(size * 0.45)
    try:
        font = ImageFont.truetype(FONT_BOLD, font_size, index=1)
    except:
        font = ImageFont.load_default()
    bbox = font.getbbox("M")
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = (size - tw) // 2
    ty = (size - th) // 2 - bbox[1]
    draw.text((tx, ty), "M", fill=WHITE, font=font)
    img.save(os.path.join(OUT, filename), "PNG", optimize=True)
    print(f"  {filename} ({size}x{size})")


print("Generating favicons...")
make_favicon(32, "favicon.png", radius=6)
make_favicon(180, "apple-touch-icon.png", radius=36)
make_favicon(192, "pwa-192.png", radius=38)
make_favicon(512, "pwa-512.png", radius=100)
print("Done!")
