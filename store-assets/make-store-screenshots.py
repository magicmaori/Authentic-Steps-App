#!/usr/bin/env python3
"""
Store screenshot generator — composites an iPhone 15 Pro device frame and a
benefit-led marketing headline over each raw app screenshot, then saves the
result at all three submission sizes:
  • ios_6.7   1290 × 2796  (iPhone 15 Pro Max / 6.7-inch)
  • ios_6.5   1284 × 2778  (iPhone 11 Pro Max / 12-13 Pro Max / 6.5-inch)
  • play_store 1080 × 1920  (Google Play portrait)

Usage:
    python3 store-assets/make-store-screenshots.py
"""

import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# ---------------------------------------------------------------------------
# Paths & constants
# ---------------------------------------------------------------------------

FONT_BOLD    = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REGULAR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

RAW_DIR  = "store-assets/screenshots/raw"
OUT_DIRS = {
    "ios_6.7":    "store-assets/screenshots/ios_6.7",
    "ios_6.5":    "store-assets/screenshots/ios_6.5",
    "play_store": "store-assets/screenshots/play_store",
}

SIZES = {
    "ios_6.7":    (1290, 2796),
    "ios_6.5":    (1284, 2778),
    "play_store": (1080, 1920),
}

# Phone width as a fraction of canvas width for each target size.
# play_store is a shorter canvas, so we use a narrower phone so the
# headline area stays tall enough to be readable.
PHONE_W_RATIO = {
    "ios_6.7":    0.80,
    "ios_6.5":    0.80,
    "play_store": 0.63,
}

# Brand palette (Authentic Steps)
BG_TOP    = (25,  59, 131)   # #193b83  deep indigo
BG_BOTTOM = (3,  120, 128)   # #037880  teal

PHONE_BODY = (44, 44, 46)    # #2C2C2E  dark titanium
PHONE_EDGE = (80, 80, 84)    # #505054  edge highlight

WHITE      = (255, 255, 255)
WHITE_SOFT = (210, 235, 255)  # softer white for second headline line

# ---------------------------------------------------------------------------
# Screens & headlines
# ---------------------------------------------------------------------------

SCREENS = [
    ("01-home",         "Show up for yourself",        "every single day"),
    ("02-gratitude",    "Find three things",            "to be grateful for"),
    ("03-intention",    "Set an intention",             "that shapes your day"),
    ("04-iamstatement", "Affirm who you are",           "and who you\u2019re becoming"),
    ("05-complete",     "Ritual complete!",             "you showed up for yourself"),
    ("06-streaks",      "Build habits that stick",      "with your daily streak"),
    ("07-toolbox",      "Your resilience toolbox",      "breathing, movement & grounding"),
    ("08-community",    "Let\u2019s change the world",  "one day at a time"),
    ("09-support",      "You don\u2019t have to",       "figure this out alone"),
    ("10-onboarding",   "Build the habit of",           "showing up for yourself"),
]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_gradient_bg(w: int, h: int) -> Image.Image:
    """Vertical linear gradient from BG_TOP to BG_BOTTOM."""
    # Build a 1-wide column then scale horizontally — fast and smooth.
    col = Image.new("RGB", (1, h))
    for y in range(h):
        t = y / (h - 1)
        r = round(BG_TOP[0] + (BG_BOTTOM[0] - BG_TOP[0]) * t)
        g = round(BG_TOP[1] + (BG_BOTTOM[1] - BG_TOP[1]) * t)
        b = round(BG_TOP[2] + (BG_BOTTOM[2] - BG_TOP[2]) * t)
        col.putpixel((0, y), (r, g, b))
    return col.resize((w, h), Image.NEAREST)


def add_drop_shadow(canvas: Image.Image,
                    px: int, py: int, pw: int, ph: int,
                    corner_r: int) -> None:
    """Bake a soft drop-shadow under the phone onto canvas (in-place)."""
    pad = 60
    shadow = Image.new("RGBA", (pw + pad * 2, ph + pad * 2), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle(
        [pad, pad + ph // 10, pad + pw, pad + ph + ph // 20],
        radius=corner_r + pad // 2,
        fill=(0, 0, 0, 130),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=pad // 2))
    # Paste using the alpha channel as mask
    canvas.paste(
        Image.new("RGB", shadow.size, (0, 0, 0)),
        (px - pad, py - pad),
        mask=shadow.split()[3],
    )


def draw_phone(canvas: Image.Image,
               px: int, py: int, pw: int, ph: int,
               sx: int, sy: int, sw: int, sh: int,
               screenshot: Image.Image,
               corner_r: int) -> None:
    """Draw the iPhone 15 Pro frame and composite screenshot inside it."""
    draw = ImageDraw.Draw(canvas)

    # --- phone body ---
    draw.rounded_rectangle(
        [px, py, px + pw, py + ph],
        radius=corner_r,
        fill=PHONE_BODY,
    )

    # --- screen background ---
    draw.rectangle([sx, sy, sx + sw, sy + sh], fill=(0, 0, 0))

    # --- screenshot ---
    ss = screenshot.resize((sw, sh), Image.LANCZOS)
    canvas.paste(ss, (sx, sy))

    # --- Dynamic Island (pill centred at top of screen) ---
    di_w = round(sw * 0.30)
    di_h = round(di_w * 0.30)
    di_x = sx + (sw - di_w) // 2
    di_y = sy + 14
    draw.rounded_rectangle(
        [di_x, di_y, di_x + di_w, di_y + di_h],
        radius=di_h // 2,
        fill=(0, 0, 0),
    )

    # --- outer edge highlight ---
    draw.rounded_rectangle(
        [px, py, px + pw, py + ph],
        radius=corner_r,
        outline=PHONE_EDGE,
        width=3,
    )

    # --- inner screen edge (very subtle) ---
    draw.rectangle(
        [sx - 1, sy - 1, sx + sw + 1, sy + sh + 1],
        outline=(20, 20, 20),
        width=1,
    )

    # --- side buttons ---
    btn_w = max(5, round(pw * 0.013))   # thickness of button tab

    # Left: mute switch + vol-up + vol-down
    def left_btn(btn_y: int, btn_h: int) -> None:
        draw.rounded_rectangle(
            [px - btn_w - 1, btn_y, px - 1, btn_y + btn_h],
            radius=btn_w // 2,
            fill=PHONE_BODY,
            outline=PHONE_EDGE,
            width=1,
        )

    left_btn(py + round(ph * 0.145), round(ph * 0.050))   # mute
    left_btn(py + round(ph * 0.220), round(ph * 0.085))   # vol +
    left_btn(py + round(ph * 0.325), round(ph * 0.085))   # vol -

    # Right: power / side button
    pwr_y = py + round(ph * 0.230)
    pwr_h = round(ph * 0.115)
    draw.rounded_rectangle(
        [px + pw + 1, pwr_y, px + pw + btn_w + 1, pwr_y + pwr_h],
        radius=btn_w // 2,
        fill=PHONE_BODY,
        outline=PHONE_EDGE,
        width=1,
    )

    # --- home indicator bar at bottom of screen ---
    hi_w = round(sw * 0.32)
    hi_h = max(4, round(sh * 0.004))
    hi_x = sx + (sw - hi_w) // 2
    hi_y = sy + sh - 20
    # Draw as RGBA strip — PIL canvas is still RGB so we just use a light colour
    draw.rounded_rectangle(
        [hi_x, hi_y, hi_x + hi_w, hi_y + hi_h],
        radius=hi_h // 2,
        fill=(200, 200, 205),
    )


def draw_headline(canvas: Image.Image,
                  line1: str, line2: str,
                  headline_h: int,
                  canvas_w: int) -> None:
    """Render a two-line headline centred in the headline band."""
    draw = ImageDraw.Draw(canvas)

    # Scale font size to canvas width
    size1 = max(28, round(canvas_w * 0.052))
    size2 = max(24, round(canvas_w * 0.042))

    try:
        font1 = ImageFont.truetype(FONT_BOLD,    size1)
        font2 = ImageFont.truetype(FONT_REGULAR, size2)
    except OSError:
        font1 = font2 = ImageFont.load_default()

    bb1 = draw.textbbox((0, 0), line1, font=font1)
    bb2 = draw.textbbox((0, 0), line2, font=font2)

    w1 = bb1[2] - bb1[0];  h1 = bb1[3] - bb1[1]
    w2 = bb2[2] - bb2[0];  h2 = bb2[3] - bb2[1]
    gap = round(size1 * 0.30)
    block_h = h1 + gap + h2

    # Vertically centred in the headline band
    start_y = (headline_h - block_h) // 2

    shadow = 3  # pixel offset for text shadow

    # Line 1
    x1 = (canvas_w - w1) // 2
    draw.text((x1 + shadow, start_y + shadow), line1, fill=(0, 0, 0, 80),  font=font1)
    draw.text((x1,          start_y),           line1, fill=WHITE,          font=font1)

    # Line 2
    x2 = (canvas_w - w2) // 2
    y2 = start_y + h1 + gap
    draw.text((x2 + shadow, y2 + shadow), line2, fill=(0, 0, 0, 80),   font=font2)
    draw.text((x2,          y2),           line2, fill=WHITE_SOFT,       font=font2)


def add_decorative_rule(canvas: Image.Image,
                        headline_h: int,
                        canvas_w: int) -> None:
    """A subtle horizontal rule that sits below the headline text block."""
    draw  = ImageDraw.Draw(canvas)
    rule_w = round(canvas_w * 0.12)
    rule_h = max(3, round(canvas_w * 0.003))
    rx = (canvas_w - rule_w) // 2
    # Place it at roughly 82 % of the headline band
    ry = round(headline_h * 0.82)
    # Colour: teal-ish, semi-transparent-looking (blended with bg)
    draw.rounded_rectangle(
        [rx, ry, rx + rule_w, ry + rule_h],
        radius=rule_h // 2,
        fill=(100, 220, 230),
    )

# ---------------------------------------------------------------------------
# Main generator
# ---------------------------------------------------------------------------

def generate(name: str, line1: str, line2: str,
             size_key: str) -> None:
    canvas_w, canvas_h = SIZES[size_key]
    out_path = os.path.join(OUT_DIRS[size_key], f"{name}.jpg")
    raw_path = os.path.join(RAW_DIR, f"{name}.jpg")

    screenshot = Image.open(raw_path).convert("RGB")

    # --- phone geometry ---
    phone_w = round(canvas_w * PHONE_W_RATIO[size_key])
    if phone_w % 2:
        phone_w -= 1

    # Bezel proportions (relative to phone width)
    bezel_lr  = round(phone_w * 0.038)
    bezel_top = round(phone_w * 0.063)
    bezel_bot = round(phone_w * 0.043)

    screen_w = phone_w - bezel_lr * 2
    screen_h = round(screen_w * 932 / 430)   # preserve 430 × 932 ratio
    phone_h  = screen_h + bezel_top + bezel_bot

    bottom_pad = max(20, round(canvas_h * 0.018))
    phone_x = (canvas_w - phone_w) // 2
    phone_y = canvas_h - phone_h - bottom_pad

    # Safeguard: if phone overflows canvas, shrink proportionally
    if phone_y < 60:
        phone_h  = canvas_h - 80 - bottom_pad
        screen_h = phone_h - bezel_top - bezel_bot
        screen_w = round(screen_h * 430 / 932)
        phone_w  = screen_w + bezel_lr * 2
        phone_x  = (canvas_w - phone_w) // 2
        phone_y  = 60

    headline_area_h = phone_y
    screen_x = phone_x + bezel_lr
    screen_y = phone_y + bezel_top
    corner_r = round(phone_w * 0.072)

    # --- build canvas ---
    canvas = make_gradient_bg(canvas_w, canvas_h)

    # Drop shadow
    add_drop_shadow(canvas, phone_x, phone_y, phone_w, phone_h, corner_r)

    # Phone frame + screenshot
    draw_phone(canvas, phone_x, phone_y, phone_w, phone_h,
               screen_x, screen_y, screen_w, screen_h,
               screenshot, corner_r)

    # Headline text
    draw_headline(canvas, line1, line2, headline_area_h, canvas_w)

    # Subtle decorative rule below text
    add_decorative_rule(canvas, headline_area_h, canvas_w)

    # Save
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    canvas.save(out_path, "JPEG", quality=93, optimize=True)
    print(f"  ✓  {out_path}")


def main() -> None:
    for size_key in ("ios_6.7", "ios_6.5", "play_store"):
        canvas_w, canvas_h = SIZES[size_key]
        print(f"\n── {size_key}  {canvas_w}×{canvas_h} ──")
        for name, line1, line2 in SCREENS:
            generate(name, line1, line2, size_key)

    total = len(SCREENS) * len(SIZES)
    print(f"\nDone — {total} store-ready screenshots generated.")


if __name__ == "__main__":
    main()
