#!/usr/bin/env python3
"""Generate Apple splash screens for iOS PWA."""
from PIL import Image
import os

LOGO_SRC = os.path.join(os.path.dirname(__file__), '..', 'public', 'logo-crown.png')
OUT = os.path.join(os.path.dirname(__file__), '..', 'public')
BG_COLOR = (11, 11, 15)  # #0B0B0F

# Device screen sizes (portrait only — iOS rotates automatically)
SCREENS = [
    (1179, 2556, 'splash-1179x2556.png'),   # iPhone 14 Pro / 15 / 16
    (1290, 2796, 'splash-1290x2796.png'),   # iPhone 14 Pro Max / 15 Plus
    (1170, 2532, 'splash-1170x2532.png'),   # iPhone 12/13/14
    (1125, 2436, 'splash-1125x2436.png'),   # iPhone X/XS/11 Pro
    (1242, 2688, 'splash-1242x2688.png'),   # iPhone XS Max / 11 Pro Max
    (828, 1792, 'splash-828x1792.png'),     # iPhone XR / 11
    (750, 1334, 'splash-750x1334.png'),     # iPhone 8 / SE3
    (640, 1136, 'splash-640x1136.png'),     # iPhone SE1
    (1024, 1366, 'splash-1024x1366.png'),   # iPad Pro 12.9 (portrait half)
    (834, 1194, 'splash-834x1194.png'),     # iPad Pro 11
    (820, 1180, 'splash-820x1180.png'),     # iPad Air 10.9
    (768, 1024, 'splash-768x1024.png'),     # iPad mini / iPad 9.7
]

def make_splash(w, h, filename):
    img = Image.new('RGB', (w, h), BG_COLOR)
    logo = Image.open(LOGO_SRC).convert('RGBA')

    # Logo = 15% of screen width
    logo_size = int(w * 0.15)
    logo = logo.resize((logo_size, logo_size), Image.LANCZOS)

    # Center the logo
    x = (w - logo_size) // 2
    y = (h - logo_size) // 2 - int(h * 0.05)  # Slightly above center

    img.paste(logo, (x, y), logo)
    img.save(os.path.join(OUT, filename), 'PNG', optimize=True)
    print(f'  {filename} ({w}x{h})')

if __name__ == '__main__':
    print('Generating Apple splash screens...')
    for w, h, name in SCREENS:
        make_splash(w, h, name)
    print(f'Done! {len(SCREENS)} splash screens generated.')
