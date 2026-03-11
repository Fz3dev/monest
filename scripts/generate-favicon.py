#!/usr/bin/env python3
"""Generate favicon/PWA icons with crown logo on dark background (#0B0B0F)"""
from PIL import Image
import os

OUT = os.path.join(os.path.dirname(__file__), "..", "public")
LOGO_SRC = os.path.join(OUT, "logo-crown-sm.png")
BG_COLOR = (11, 11, 15, 255)  # #0B0B0F


def make_icon(size, filename, logo_ratio=0.75):
    """Generate an icon with logo centered on dark background.
    logo_ratio: portion of icon size used by the logo (0.75 = 25% total padding)
    """
    img = Image.new("RGBA", (size, size), BG_COLOR)
    logo = Image.open(LOGO_SRC).convert("RGBA")
    logo_size = int(size * logo_ratio)
    logo = logo.resize((logo_size, logo_size), Image.LANCZOS)
    offset = (size - logo_size) // 2
    img.paste(logo, (offset, offset), logo)
    img.save(os.path.join(OUT, filename), "PNG", optimize=True)
    print(f"  {filename} ({size}x{size}, logo {int(logo_ratio*100)}%)")


print("Generating PWA icons (dark background #0B0B0F)...")
make_icon(32, "favicon.png")
make_icon(64, "pwa-64x64.png")
make_icon(180, "apple-touch-icon.png")
make_icon(180, "apple-touch-icon-180x180.png")
make_icon(192, "pwa-192.png")
make_icon(192, "pwa-192x192.png")
make_icon(512, "pwa-512.png")
make_icon(512, "pwa-512x512.png")
# Maskable: logo at 60% so it fits within the 80% safe zone
make_icon(512, "pwa-512-maskable.png", logo_ratio=0.60)
print("Done!")
