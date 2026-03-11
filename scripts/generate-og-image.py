#!/usr/bin/env python3
"""Generate OG image for Monest link previews (1200x630)"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math, os

W, H = 1200, 630
BG = (11, 11, 15)         # #0B0B0F
BRAND = (108, 99, 255)    # #6C63FF
WHITE = (232, 232, 237)   # #E8E8ED
GRAY = (156, 163, 175)    # #9CA3AF
DARK_CARD = (22, 22, 30)  # #16161E
GREEN = (74, 222, 128)    # #4ADE80

FONT = "/System/Library/Fonts/HelveticaNeue.ttc"
LOGO_SRC = os.path.join(os.path.dirname(__file__), "..", "public", "logo-crown-sm.png")
out = os.path.join(os.path.dirname(__file__), "..", "public", "og-image.png")

CATEGORIES = [
    ("Logement",     35, (108, 99, 255)),
    ("Alimentation", 22, (74, 222, 128)),
    ("Transport",    15, (251, 146, 60)),
    ("Abonnements",  12, (56, 189, 248)),
    ("Loisirs",      10, (52, 211, 153)),
    ("Autre",         6, (148, 163, 184)),
]


def rounded_rect(draw, xy, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def draw_pill(draw, xy, text, font, color=BRAND):
    x, y = xy
    bbox = font.getbbox(text)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    pad_x, pad_y = 18, 8
    w, h = tw + pad_x * 2, th + pad_y * 2
    rounded_rect(draw, (x, y, x + w, y + h), radius=h // 2, outline=color, width=2)
    draw.text((x + pad_x, y + pad_y - 1), text, fill=color, font=font)
    return w


def draw_pie(img, cx, cy, r, categories):
    """Draw a donut pie chart."""
    pie = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(pie)
    cumulative = 0
    for _, pct, color in categories:
        start_deg = cumulative * 360 - 90
        end_deg = (cumulative + pct / 100) * 360 - 90
        d.pieslice(
            (cx - r, cy - r, cx + r, cy + r),
            start_deg, end_deg,
            fill=(*color, 220),
            outline=BG, width=2,
        )
        cumulative += pct / 100
    # Inner circle (donut hole)
    inner_r = int(r * 0.52)
    d.ellipse((cx - inner_r, cy - inner_r, cx + inner_r, cy + inner_r), fill=DARK_CARD)
    return Image.alpha_composite(img, pie)


def main():
    img = Image.new("RGBA", (W, H), BG)

    # --- Ambient purple glow ---
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse((50, 80, 650, 550), fill=(108, 99, 255, 25))
    glow = glow.filter(ImageFilter.GaussianBlur(80))
    img = Image.alpha_composite(img, glow)
    glow2 = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(glow2).ellipse((700, -50, 1100, 200), fill=(108, 99, 255, 15))
    glow2 = glow2.filter(ImageFilter.GaussianBlur(60))
    img = Image.alpha_composite(img, glow2)

    draw = ImageDraw.Draw(img)

    # --- Fonts ---
    font_title = ImageFont.truetype(FONT, 52, index=1)
    font_tagline = ImageFont.truetype(FONT, 26, index=0)
    font_pill = ImageFont.truetype(FONT, 17, index=0)
    font_card_label = ImageFont.truetype(FONT, 16, index=0)
    font_card_big = ImageFont.truetype(FONT, 42, index=1)
    font_card_name = ImageFont.truetype(FONT, 14, index=1)
    font_card_small = ImageFont.truetype(FONT, 13, index=0)
    font_card_pct = ImageFont.truetype(FONT, 12, index=1)

    # --- Left side ---
    left_x = 80
    logo_y = 190

    # Crown logo
    logo = Image.open(LOGO_SRC).convert("RGBA")
    logo = logo.resize((52, 52), Image.LANCZOS)
    img.paste(logo, (left_x, logo_y), logo)
    draw = ImageDraw.Draw(img)  # refresh after paste
    draw.text((left_x + 68, logo_y + 5), "Monest", fill=WHITE, font=font_title)

    draw.text((left_x, logo_y + 80), "Votre budget, en clair.", fill=GRAY, font=font_tagline)
    draw.text((left_x, logo_y + 120), "En solo ou en couple.", fill=GRAY, font=font_tagline)

    pill_x = left_x
    for label in ["Budget", "Charges", "Épargne", "Dépenses"]:
        pill_x += draw_pill(draw, (pill_x, logo_y + 180), label, font_pill) + 12

    # --- Right side: card with pie chart ---
    card_x, card_y = 660, 80
    card_w, card_h = 450, 470
    rounded_rect(draw, (card_x, card_y, card_x + card_w, card_y + card_h),
                 radius=20, fill=DARK_CARD, outline=(255, 255, 255, 15), width=1)

    # "Reste à vivre"
    draw.text((card_x + 30, card_y + 22), "Reste à vivre", fill=GRAY, font=font_card_label)
    draw.text((card_x + 30, card_y + 46), "1 247 €", fill=WHITE, font=font_card_big)

    # Progress bar
    bar_y = card_y + 105
    bar_w = card_w - 60
    rounded_rect(draw, (card_x + 30, bar_y, card_x + 30 + bar_w, bar_y + 6),
                 radius=3, fill=(255, 255, 255, 20))
    rounded_rect(draw, (card_x + 30, bar_y, card_x + 30 + int(bar_w * 0.72), bar_y + 6),
                 radius=3, fill=BRAND)

    # Separator
    sep_y = bar_y + 25
    draw.line((card_x + 30, sep_y, card_x + card_w - 30, sep_y), fill=(255, 255, 255, 15), width=1)

    # "Répartition" label
    draw.text((card_x + 30, sep_y + 12), "Répartition des charges", fill=GRAY, font=font_card_label)

    # Pie chart
    pie_cx = card_x + 120
    pie_cy = sep_y + 120
    pie_r = 70
    img = draw_pie(img, pie_cx, pie_cy, pie_r, CATEGORIES)
    draw = ImageDraw.Draw(img)  # refresh draw after compositing

    # Legend (right of pie)
    legend_x = pie_cx + pie_r + 30
    legend_y = sep_y + 55
    for label, pct, color in CATEGORIES:
        draw.ellipse((legend_x, legend_y + 3, legend_x + 10, legend_y + 13), fill=color)
        draw.text((legend_x + 16, legend_y), label, fill=GRAY, font=font_card_small)
        draw.text((legend_x + 145, legend_y), f"{pct}%", fill=WHITE, font=font_card_pct)
        legend_y += 22

    # Bottom stats row
    stats_y = card_y + card_h - 55
    draw.line((card_x + 30, stats_y - 10, card_x + card_w - 30, stats_y - 10),
              fill=(255, 255, 255, 15), width=1)
    draw.text((card_x + 30, stats_y), "Épargne", fill=GRAY, font=font_card_small)
    draw.text((card_x + 130, stats_y), "€4 200", fill=GREEN, font=font_card_name)
    draw.text((card_x + 250, stats_y), "Charges", fill=GRAY, font=font_card_small)
    draw.text((card_x + 340, stats_y), "€793", fill=WHITE, font=font_card_name)

    # --- Bottom brand line ---
    draw.line((0, H - 4, W, H - 4), fill=BRAND, width=4)

    final = Image.new("RGB", (W, H), BG)
    final.paste(img, mask=img.split()[3])
    final.save(out, "PNG", optimize=True)
    print(f"OG image saved to {out} ({os.path.getsize(out) // 1024} KB)")


if __name__ == "__main__":
    main()
