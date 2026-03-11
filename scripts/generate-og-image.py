#!/usr/bin/env python3
"""Generate OG image for Monest link previews (1200x630)"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

W, H = 1200, 630
BG = (11, 11, 15)         # #0B0B0F
BRAND = (108, 99, 255)    # #6C63FF
BRAND_LIGHT = (129, 140, 248)  # #818CF8
WHITE = (232, 232, 237)   # #E8E8ED
GRAY = (156, 163, 175)    # #9CA3AF
DARK_CARD = (22, 22, 30)  # #16161E
BORDER = (255, 255, 255, 20)
GREEN = (74, 222, 128)    # #4ADE80
RED = (248, 113, 113)     # #F87171

FONT = "/System/Library/Fonts/HelveticaNeue.ttc"
FONT_BOLD = "/System/Library/Fonts/HelveticaNeue.ttc"

out = os.path.join(os.path.dirname(__file__), "..", "public", "og-image.png")


def rounded_rect(draw, xy, radius, fill=None, outline=None, width=1):
    x0, y0, x1, y1 = xy
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def draw_pill(draw, xy, text, font, color=BRAND):
    x, y = xy
    bbox = font.getbbox(text)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    pad_x, pad_y = 18, 8
    w = tw + pad_x * 2
    h = th + pad_y * 2
    rounded_rect(draw, (x, y, x + w, y + h), radius=h // 2, outline=color, width=2)
    draw.text((x + pad_x, y + pad_y - 1), text, fill=color, font=font)
    return w


def main():
    img = Image.new("RGBA", (W, H), BG)

    # --- Ambient purple glow (left-center) ---
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    # Large ellipse
    glow_draw.ellipse((50, 80, 650, 550), fill=(108, 99, 255, 25))
    glow = glow.filter(ImageFilter.GaussianBlur(80))
    img = Image.alpha_composite(img, glow)

    # Small glow top-right
    glow2 = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    glow2_draw = ImageDraw.Draw(glow2)
    glow2_draw.ellipse((700, -50, 1100, 200), fill=(108, 99, 255, 15))
    glow2 = glow2.filter(ImageFilter.GaussianBlur(60))
    img = Image.alpha_composite(img, glow2)

    draw = ImageDraw.Draw(img)

    # --- Fonts ---
    font_title = ImageFont.truetype(FONT_BOLD, 52, index=1)   # Bold
    font_tagline = ImageFont.truetype(FONT, 26, index=0)       # Regular
    font_pill = ImageFont.truetype(FONT, 17, index=0)
    font_card_label = ImageFont.truetype(FONT, 16, index=0)
    font_card_big = ImageFont.truetype(FONT_BOLD, 42, index=1)
    font_card_name = ImageFont.truetype(FONT, 16, index=1)     # Bold
    font_card_amount = ImageFont.truetype(FONT, 15, index=0)
    font_card_small = ImageFont.truetype(FONT, 14, index=0)
    font_card_pct = ImageFont.truetype(FONT_BOLD, 13, index=1)

    # --- Left side: Logo + Text ---
    left_x = 80
    logo_y = 190

    # Logo: purple rounded square with M
    logo_size = 52
    rounded_rect(draw, (left_x, logo_y, left_x + logo_size, logo_y + logo_size),
                 radius=14, fill=BRAND)
    font_logo = ImageFont.truetype(FONT_BOLD, 30, index=1)
    draw.text((left_x + 15, logo_y + 10), "M", fill=WHITE, font=font_logo)

    # "Monest" next to logo
    draw.text((left_x + logo_size + 16, logo_y + 5), "Monest", fill=WHITE, font=font_title)

    # Tagline
    tagline_y = logo_y + 80
    draw.text((left_x, tagline_y), "Votre budget, en clair.", fill=GRAY, font=font_tagline)

    # Sub-tagline
    sub_y = tagline_y + 40
    draw.text((left_x, sub_y), "En solo ou en couple.", fill=(*GRAY[:3],), font=font_tagline)

    # Pills row
    pill_y = sub_y + 60
    pill_x = left_x
    for label in ["Budget", "Charges", "Épargne", "Dépenses"]:
        pw = draw_pill(draw, (pill_x, pill_y), label, font_pill)
        pill_x += pw + 12

    # --- Right side: Dashboard card mockup ---
    card_x = 660
    card_y = 100
    card_w = 440
    card_h = 430

    # Card background
    rounded_rect(draw, (card_x, card_y, card_x + card_w, card_y + card_h),
                 radius=20, fill=DARK_CARD, outline=(255, 255, 255, 15), width=1)

    # "Reste à vivre" label
    draw.text((card_x + 30, card_y + 25), "Reste à vivre", fill=GRAY, font=font_card_label)

    # Big amount
    draw.text((card_x + 30, card_y + 50), "1 247 €", fill=WHITE, font=font_card_big)

    # Progress bar
    bar_y = card_y + 110
    bar_w = card_w - 60
    rounded_rect(draw, (card_x + 30, bar_y, card_x + 30 + bar_w, bar_y + 6),
                 radius=3, fill=(255, 255, 255, 20))
    filled_w = int(bar_w * 0.72)
    rounded_rect(draw, (card_x + 30, bar_y, card_x + 30 + filled_w, bar_y + 6),
                 radius=3, fill=BRAND)

    # Separator
    sep_y = bar_y + 25
    draw.line((card_x + 30, sep_y, card_x + card_w - 30, sep_y), fill=(255, 255, 255, 15), width=1)

    # Person A row
    p1_y = sep_y + 18
    # Circle avatar
    draw.ellipse((card_x + 30, p1_y, card_x + 56, p1_y + 26), fill=BRAND)
    font_avatar = ImageFont.truetype(FONT_BOLD, 13, index=1)
    draw.text((card_x + 39, p1_y + 5), "F", fill=WHITE, font=font_avatar)
    draw.text((card_x + 65, p1_y + 1), "Fawsy", fill=WHITE, font=font_card_name)
    draw.text((card_x + 65, p1_y + 20), "623 €", fill=GRAY, font=font_card_amount)
    draw.text((card_x + card_w - 75, p1_y + 6), "+12%", fill=GREEN, font=font_card_pct)

    # Person B row
    p2_y = p1_y + 55
    draw.ellipse((card_x + 30, p2_y, card_x + 56, p2_y + 26), fill=RED)
    draw.text((card_x + 40, p2_y + 5), "S", fill=WHITE, font=font_avatar)
    draw.text((card_x + 65, p2_y + 1), "Sarah", fill=WHITE, font=font_card_name)
    draw.text((card_x + 65, p2_y + 20), "624 €", fill=GRAY, font=font_card_amount)
    draw.text((card_x + card_w - 70, p2_y + 6), "+8%", fill=GREEN, font=font_card_pct)

    # Separator 2
    sep2_y = p2_y + 55
    draw.line((card_x + 30, sep2_y, card_x + card_w - 30, sep2_y), fill=(255, 255, 255, 15), width=1)

    # Charges fixes row
    row3_y = sep2_y + 15
    draw.text((card_x + 30, row3_y), "Charges fixes", fill=GRAY, font=font_card_small)
    draw.text((card_x + card_w - 95, row3_y), "2 180 €", fill=WHITE, font=font_card_name)

    # Épargne row
    row4_y = row3_y + 30
    draw.text((card_x + 30, row4_y), "Épargne", fill=GRAY, font=font_card_small)
    draw.text((card_x + card_w - 80, row4_y), "400 €", fill=GREEN, font=font_card_name)

    # --- Bottom subtle brand line ---
    draw.line((0, H - 4, W, H - 4), fill=BRAND, width=4)

    # Convert to RGB for PNG
    final = Image.new("RGB", (W, H), BG)
    final.paste(img, mask=img.split()[3])

    final.save(out, "PNG", optimize=True)
    print(f"OG image saved to {out} ({os.path.getsize(out) // 1024} KB)")


if __name__ == "__main__":
    main()
