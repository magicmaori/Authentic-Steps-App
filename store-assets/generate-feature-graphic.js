#!/usr/bin/env node
/**
 * Authentic Steps — Google Play Feature Graphic Generator
 *
 * Produces a 1024×500 PNG for the Google Play Store listing header.
 * Uses the same brand gradient as the screenshot compositor.
 *
 * Usage:
 *   node store-assets/generate-feature-graphic.js
 *
 * Requires: ImageMagick 7 (magick command) on PATH.
 */

'use strict';

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'store-assets');
const OUT_FILE = path.join(OUT_DIR, 'play-store-feature-graphic.png');
const FONT_BOLD = path.join(ROOT, 'store-assets/fonts/Inter-Bold.ttf');
const FONT_SEMI = path.join(ROOT, 'store-assets/fonts/Inter-SemiBold.ttf');
const ICON = path.join(ROOT, 'artifacts/authentic-steps/assets/images/icon.png');

const W = 1024;
const H = 500;

const NAVY      = '#193b83';
const TEAL_DARK = '#037880';
const WHITE     = '#FFFFFF';

function run(cmd) {
  execSync(cmd, { stdio: 'pipe' });
}

function q(s) { return `"${s}"`; }
function imq(s) { return "'" + s.replace(/'/g, "'\\''") + "'"; }

// ─── 1. Brand gradient background SVG ─────────────────────────────────────────
const bgSvg = `/tmp/as_fg_bg.svg`;
const bgPng = `/tmp/as_fg_bg.png`;

fs.writeFileSync(bgSvg, `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="${NAVY}"/>
      <stop offset="55%"  stop-color="#0c4585"/>
      <stop offset="100%" stop-color="${TEAL_DARK}"/>
    </linearGradient>
    <radialGradient id="glow" cx="85%" cy="15%" r="50%">
      <stop offset="0%"   stop-color="#03989e" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#03989e" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
</svg>`);

run(`magick -background ${q(NAVY)} ${q(bgSvg)} -resize ${W}x${H}! ${q(bgPng)}`);

// ─── 2. Decorative circles SVG ────────────────────────────────────────────────
const decorSvg = `/tmp/as_fg_decor.svg`;
const decorPng = `/tmp/as_fg_decor.png`;

fs.writeFileSync(decorSvg, `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <!-- Large teal circle — right side, behind icon area -->
  <circle cx="820" cy="250" r="230" fill="#03989e" opacity="0.08"/>
  <!-- Medium circle — upper right -->
  <circle cx="980" cy="60"  r="110" fill="#6dbdf2" opacity="0.09"/>
  <!-- Small accent top-left -->
  <circle cx="60"  cy="70"  r="70"  fill="#03989e" opacity="0.10"/>
  <!-- Tiny star-dots -->
  <circle cx="890" cy="40"  r="5"   fill="${WHITE}" opacity="0.25"/>
  <circle cx="830" cy="75"  r="3"   fill="${WHITE}" opacity="0.18"/>
  <circle cx="160" cy="420" r="4"   fill="${WHITE}" opacity="0.18"/>
  <circle cx="720" cy="460" r="6"   fill="${WHITE}" opacity="0.12"/>
</svg>`);

run(`magick -background none ${q(decorSvg)} -resize ${W}x${H}! ${q(decorPng)}`);

// ─── 3. App icon (rounded-square, with drop shadow) ──────────────────────────
const iconSize = 200;
const iconRadius = 44;
const iconX = 580;   // right-of-center
const iconY = (H - iconSize) / 2;

const iconMask = `/tmp/as_fg_iconmask.png`;
const iconRounded = `/tmp/as_fg_icon.png`;

// Create rounded mask
run(
  `magick -size ${iconSize}x${iconSize} xc:black ` +
  `-fill white -draw "roundrectangle 0,0,${iconSize-1},${iconSize-1},${iconRadius},${iconRadius}" ` +
  `${q(iconMask)}`
);

// Resize icon and apply rounded corners
run(
  `magick ${q(ICON)} -resize ${iconSize}x${iconSize}! ` +
  `-alpha set ${q(iconMask)} -compose CopyOpacity -composite ` +
  `${q(iconRounded)}`
);

// ─── 4. Compose final image ───────────────────────────────────────────────────
// Text layout:
//   App name "Authentic Steps"  — large, left-ish area
//   Tagline (two lines)          — below app name
//   "For Youth"                  — styled subtitle under app name
//
// Visual split: left 55% = text, right 45% = icon

const textCenterX = Math.round(W * 0.27);  // absolute pixel x for gravity NorthWest offsets

// Build the composite + text command in one pass
const cmd = [
  `magick`,
  // Layer 1: gradient background
  q(bgPng),
  // Layer 2: decorative circles
  `${q(decorPng)} -composite`,
  // Layer 3: icon with drop shadow (use -shadow trick via two composites)
  `\\(`,
    q(iconRounded),
    `-alpha set`,
    `\\( +clone -background "rgba(0,0,0,0.35)" -shadow 40x20+0+8 \\)`,
    `+swap -background none -layers merge +repage`,
  `\\)`,
  `-geometry +${iconX - 12}+${Math.round(iconY - 12)} -composite`,
  // Layer 4: Thin separator line between text and icon
  `-fill "rgba(255,255,255,0.12)" -draw "rectangle ${Math.round(W*0.535)},60 ${Math.round(W*0.537)},${H-60}"`,
  // ── Text annotations (gravity NorthWest so we control x,y precisely) ──
  // App name
  `-font ${q(FONT_BOLD)} -pointsize 68`,
  `-fill "${WHITE}" -gravity NorthWest -annotate +72+110 ${imq('Authentic Steps')}`,
  // "For Youth" badge line
  `-font ${q(FONT_SEMI)} -pointsize 28`,
  `-fill "rgba(160,210,255,0.88)" -gravity NorthWest -annotate +76+192 ${imq('For Youth')}`,
  // Tagline — two lines
  `-font ${q(FONT_SEMI)} -pointsize 30`,
  `-fill "rgba(210,235,255,0.82)" -gravity NorthWest -annotate +72+264 ${imq('Your wellbeing journey')}`,
  `-gravity NorthWest -annotate +72+304 ${imq('starts here')}`,
  // Fine print / bottom label
  `-font ${q(FONT_SEMI)} -pointsize 20`,
  `-fill "rgba(255,255,255,0.45)" -gravity NorthWest -annotate +72+390 ${imq('Mental wellbeing for young people')}`,
  q(OUT_FILE),
].join(' \\\n  ');

run(cmd);

console.log(`✅  Feature graphic written to: ${OUT_FILE}`);
