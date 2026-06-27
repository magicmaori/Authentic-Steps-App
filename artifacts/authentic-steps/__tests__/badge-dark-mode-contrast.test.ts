/**
 * WCAG AA contrast verification for the phone-number badge in dark mode.
 *
 * The badge background is `${accent}22` — accent tinted at ~13.3 % opacity
 * (0x22 / 255) over the card. The text colour is either the accent itself (if
 * it meets the 4.5:1 threshold) or `colors.foreground` as a fallback.
 *
 * This test suite contains zero React rendering; it exercises only the pure
 * colour-utility logic that lives in support.tsx, reproduced inline here so
 * the module's native/expo dependencies do not need to be mocked.
 *
 * Pass criteria: every helpline's final phone-badge text colour achieves
 * ≥ 4.5:1 contrast ratio against the composited pill background in dark mode.
 */

// ─── Colour utilities (mirrors support.tsx) ────────────────────────────────

function relativeLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const lin = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrastRatio(hex1: string, hex2: string): number {
  const L1 = relativeLuminance(hex1);
  const L2 = relativeLuminance(hex2);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

function blendHex(fg: string, bg: string, alpha: number): string {
  const fr = parseInt(fg.slice(1, 3), 16);
  const fg_ = parseInt(fg.slice(3, 5), 16);
  const fb = parseInt(fg.slice(5, 7), 16);
  const br = parseInt(bg.slice(1, 3), 16);
  const bg_ = parseInt(bg.slice(3, 5), 16);
  const bb = parseInt(bg.slice(5, 7), 16);
  const r = Math.round(fr * alpha + br * (1 - alpha));
  const g = Math.round(fg_ * alpha + bg_ * (1 - alpha));
  const b = Math.round(fb * alpha + bb * (1 - alpha));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function safeTextColor(
  accentHex: string,
  bgHex: string,
  fallback: string,
  threshold = 4.5,
): string {
  return contrastRatio(accentHex, bgHex) >= threshold ? accentHex : fallback;
}

const PILL_ALPHA = 0x22 / 255; // ≈ 0.133

// ─── Theme constants (mirrors constants/colors.ts dark palette) ────────────

const DARK_CARD = '#193b83';
const DARK_FOREGROUND = '#e8f4f8';

// ─── Helpline data (mirrors HELPLINES in support.tsx) ─────────────────────

const HELPLINES = [
  { name: 'Kids Helpline', darkAccent: '#FFAA55' },
  { name: 'Lifeline',      darkAccent: '#FF9966' },
  { name: 'Beyond Blue',   darkAccent: '#8BBFE8' },
  { name: '13YARN',        darkAccent: '#F0B040' },
  { name: 'Emergency',     darkAccent: '#FF9999' },
] as const;

// ─── Tests ────────────────────────────────────────────────────────────────

describe('Phone-number badge – dark mode WCAG AA contrast', () => {
  it.each(HELPLINES)(
    '$name: badge text meets ≥ 4.5:1 contrast against composited pill background',
    ({ name, darkAccent }) => {
      // The actual opaque background the text sits on
      const pillBg = blendHex(darkAccent, DARK_CARD, PILL_ALPHA);

      // Same logic as safeTextColor in support.tsx
      const textColor = safeTextColor(darkAccent, pillBg, DARK_FOREGROUND);

      const ratio = contrastRatio(textColor, pillBg);

      expect(ratio).toBeGreaterThanOrEqual(4.5);
    },
  );

  it('dark card (#193b83) is correctly identified as dark (luminance < 0.18)', () => {
    expect(relativeLuminance(DARK_CARD)).toBeLessThan(0.18);
  });

  it('dark foreground (#e8f4f8) has ≥ 4.5:1 contrast on dark card', () => {
    expect(contrastRatio(DARK_FOREGROUND, DARK_CARD)).toBeGreaterThanOrEqual(4.5);
  });
});
