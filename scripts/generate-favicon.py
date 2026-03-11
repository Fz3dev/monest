#!/usr/bin/env python3
"""Generate favicon/PWA icons using the real crown logo (transparent background)"""
from PIL import Image
import os

OUT = os.path.join(os.path.dirname(__file__), "..", "public")
LOGO_SRC = os.path.join(OUT, "logo-crown-sm.png")


def make_favicon(size, filename):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    logo = Image.open(LOGO_SRC).convert("RGBA")
    logo = logo.resize((size, size), Image.LANCZOS)
    img.paste(logo, (0, 0), logo)
    img.save(os.path.join(OUT, filename), "PNG", optimize=True)
    print(f"  {filename} ({size}x{size})")


print("Generating favicons with crown logo (transparent)...")
make_favicon(32, "favicon.png")
make_favicon(180, "apple-touch-icon.png")
make_favicon(192, "pwa-192.png")
make_favicon(512, "pwa-512.png")
print("Done!")
