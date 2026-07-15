#!/usr/bin/env node
/**
 * Authentic Steps — App Store Screenshot Compositor (en-AU locale)
 *
 * Produces professional marketing screenshots captioned in Australian English
 * for iOS 6.7", iOS 6.5", and Google Play Store phone sizes.
 *
 * Outputs to store-assets/screenshots-professional/en-AU/{ios_6.7,ios_6.5,play_store}/
 *
 * Key AU differences from the base en locale generator:
 *   - "Made for young Australians" (screen 1) — grounds the listing locally
 *   - "practise" (noun) instead of "practice/ritual" where relevant (AU/UK spelling)
 *   - Numbers spelled out where AU style guides prefer it at small sizes
 *
 * Usage:
 *   node store-assets/generate-screenshots-en-AU.js
 *
 * Requires: ImageMagick 7 (magick command) on PATH.
 */

'use strict';

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// ─── Paths ────────────────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, '..');
const INPUT_DIR = path.join(ROOT, 'store-assets/screenshots/ios_6.7');
const OUTPUT_ROOT = path.join(ROOT, 'store-assets/screenshots-professional/en-AU');
const FONT_BOLD = path.join(ROOT, 'store-assets/fonts/Inter-Bold.ttf');
const FONT_SEMI = path.join(ROOT, 'store-assets/fonts/Inter-SemiBold.ttf');

// ─── Brand Colours ───────────────────────────────────────────────────────────

const NAVY    = '#193b83';
const TEAL_DARK = '#037880';
const WHITE   = '#FFFFFF';
const FRAME_SILVER = '#E2E4E8';
const DI_COLOR = '#000000';
const BTN_COLOR = '#B8BCC6';

// ─── Size definitions ────────────────────────────────────────────────────────

const SIZES = {
  ios_6_7: {
    slug: 'ios_6.7',
    canvas: { w: 1290, h: 2796 },
    frame: { x: 145, y: 480, w: 1000, h: 2200, radius: 72 },
    screen: { bezelTop: 46, bezelSide: 24, bezelBottom: 38 },
    headline: { y: 158, size: 86, lineH: 102 },
    sub: { y: 380, size: 48 },
    dynamicIsland: { w: 240, h: 34, yOffset: 18 },
  },
  ios_6_5: {
    slug: 'ios_6.5',
    canvas: { w: 1284, h: 2778 },
    frame: { x: 142, y: 478, w: 1000, h: 2180, radius: 72 },
    screen: { bezelTop: 46, bezelSide: 24, bezelBottom: 38 },
    headline: { y: 156, size: 86, lineH: 102 },
    sub: { y: 378, size: 48 },
    dynamicIsland: { w: 240, h: 34, yOffset: 18 },
  },
  play_store: {
    slug: 'play_store',
    canvas: { w: 1080, h: 1920 },
    frame: { x: 115, y: 350, w: 850, h: 1508, radius: 58 },
    screen: { bezelTop: 38, bezelSide: 20, bezelBottom: 32 },
    headline: { y: 126, size: 72, lineH: 86 },
    sub: { y: 263, size: 40 },
    dynamicIsland: { w: 198, h: 28, yOffset: 14 },
  },
};

// ─── Screenshot manifest — en-AU captions ────────────────────────────────────
//
// Story order: hook → daily ritual → outcome, then remaining screens.
// Support screen placed last (no crisis/SOS imagery leading the set).
//
// AU spelling/tone changes from base en locale:
//   01-onboarding  sub: "Made for young Australians" (localises the listing)
//   02-home        sub: "A five-minute morning practise" (AU spelling: practise
//                  as noun; number spelled out per AU style)
//   All other captions are locale-neutral and unchanged.

const SCREENS = [
  { file: '10-onboarding.jpg', out: '01-onboarding.png',
    headline: 'Your wellbeing\njourney starts here', sub: 'Made for young Australians' },
  { file: '01-home.jpg',        out: '02-home.png',
    headline: 'Start your day\nwith intention',      sub: 'A five-minute morning practise' },
  { file: '06-streaks.jpg',     out: '03-streaks.png',
    headline: 'Watch your\nprogress grow',           sub: 'Build a streak that sticks' },
  { file: '02-gratitude.jpg',   out: '04-gratitude.png',
    headline: 'Notice what is\ngoing right',         sub: 'Three things. Every day.' },
  { file: '03-intention.jpg',   out: '05-intention.png',
    headline: 'Set intentions\nthat inspire you',   sub: 'Turn goals into action' },
  { file: '04-iamstatement.jpg',out: '06-affirmation.png',
    headline: 'Affirm who\nyou are becoming',        sub: 'Daily affirmations that land' },
  { file: '05-complete.jpg',    out: '07-complete.png',
    headline: 'Celebrate every\nstep forward',      sub: 'Small wins add up' },
  { file: '07-toolbox.jpg',     out: '08-toolbox.png',
    headline: 'Calming tools\nat your fingertips',  sub: 'Breathe. Ground. Reset.' },
  { file: '08-community.jpg',   out: '09-community.png',
    headline: 'Connect with\nthose who care',       sub: 'You are not in this alone' },
  { file: '09-support.jpg',     out: '10-support.png',
    headline: 'Support whenever\nyou need it',      sub: 'Help is always close by' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function run(cmd) {
  execSync(cmd, { stdio: 'pipe' });
}

function q(s) { return `"${s}"`; }

function imq(str) {
  return "'" + str.replace(/'/g, "'\\''") + "'";
}

// ─── SVG builders ─────────────────────────────────────────────────────────────

function writeBgSvg(w, h, out) {
  fs.writeFileSync(out, `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.1" y2="1">
      <stop offset="0%"   stop-color="${NAVY}"/>
      <stop offset="58%"  stop-color="#0c4585"/>
      <stop offset="100%" stop-color="${TEAL_DARK}"/>
    </linearGradient>
    <radialGradient id="glow" cx="78%" cy="10%" r="38%">
      <stop offset="0%"   stop-color="#03989e" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#03989e" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect width="${w}" height="${h}" fill="url(#glow)"/>
</svg>`);
}

function writeDecorSvg(w, h, out) {
  fs.writeFileSync(out, `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <circle cx="${Math.round(w*0.11)}" cy="${Math.round(h*0.065)}" r="${Math.round(w*0.18)}" fill="#03989e" opacity="0.07"/>
  <circle cx="${Math.round(w*0.88)}" cy="${Math.round(h*0.09)}"  r="${Math.round(w*0.12)}" fill="#6dbdf2" opacity="0.08"/>
  <circle cx="${Math.round(w*0.04)}" cy="${Math.round(h*0.15)}"  r="${Math.round(w*0.06)}" fill="#03989e" opacity="0.11"/>
  <circle cx="${Math.round(w*0.83)}" cy="${Math.round(h*0.045)}" r="9" fill="${WHITE}" opacity="0.22"/>
  <circle cx="${Math.round(w*0.77)}" cy="${Math.round(h*0.075)}" r="5" fill="${WHITE}" opacity="0.15"/>
  <circle cx="${Math.round(w*0.18)}" cy="${Math.round(h*0.108)}" r="7" fill="${WHITE}" opacity="0.18"/>
</svg>`);
}

function writeFrameBehindSvg(cfg, sx, sy, sw, sh, sRadius, out) {
  const { frame, canvas } = cfg;
  const { x: fx, y: fy, w: fw, h: fh, radius: fr } = frame;
  const cw = canvas.w;
  const ch = canvas.h;
  const shX = fx + 10, shY = fy + 20;

  fs.writeFileSync(out, `<svg xmlns="http://www.w3.org/2000/svg" width="${cw}" height="${ch}">
  <defs>
    <mask id="hole">
      <rect width="${cw}" height="${ch}" fill="white"/>
      <rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="${sRadius}" ry="${sRadius}" fill="black"/>
    </mask>
    <filter id="sh" x="-6%" y="-4%" width="116%" height="112%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="20"/>
    </filter>
    <linearGradient id="metal" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="${WHITE}" stop-opacity="0.55"/>
      <stop offset="35%"  stop-color="${FRAME_SILVER}" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.06"/>
    </linearGradient>
  </defs>
  <rect x="${shX}" y="${shY}" width="${fw}" height="${fh}" rx="${fr}" ry="${fr}"
        fill="rgba(0,0,0,0.38)" filter="url(#sh)" mask="url(#hole)"/>
  <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="${fr}" ry="${fr}"
        fill="${FRAME_SILVER}" mask="url(#hole)"/>
  <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="${fr}" ry="${fr}"
        fill="url(#metal)" opacity="0.55" mask="url(#hole)"/>
</svg>`);
}

function writeFrameFrontSvg(cfg, sx, sy, sw, sh, sRadius, out) {
  const { frame, canvas, dynamicIsland } = cfg;
  const { x: fx, y: fy, w: fw, h: fh } = frame;
  const cw = canvas.w;
  const ch = canvas.h;

  const diW = dynamicIsland.w;
  const diH = dynamicIsland.h;
  const diX = cw / 2 - diW / 2;
  const diY = sy + dynamicIsland.yOffset;
  const diR = diH / 2;

  const btnR = 4;
  const pwrX = fx + fw;
  const pwrY = fy + Math.round(fh * 0.37);
  const pwrH = Math.round(fh * 0.10);
  const volX = fx - 7;
  const volY = fy + Math.round(fh * 0.285);
  const volH = Math.round(fh * 0.072);
  const vol2Y = fy + Math.round(fh * 0.38);
  const silY = fy + Math.round(fh * 0.21);
  const silH = Math.round(fh * 0.038);

  fs.writeFileSync(out, `<svg xmlns="http://www.w3.org/2000/svg" width="${cw}" height="${ch}">
  <rect x="${sx - 4}" y="${sy - 4}" width="${sw + 8}" height="${sh + 8}"
        rx="${sRadius + 4}" ry="${sRadius + 4}"
        fill="none" stroke="#1C1C1E" stroke-width="7"/>
  <rect x="${sx - 1}" y="${sy - 1}" width="${sw + 2}" height="${sh + 2}"
        rx="${sRadius + 1}" ry="${sRadius + 1}"
        fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2"/>
  <rect x="${diX}" y="${diY}" width="${diW}" height="${diH}" rx="${diR}" ry="${diR}" fill="${DI_COLOR}"/>
  <rect x="${pwrX}" y="${pwrY}" width="7" height="${pwrH}" rx="${btnR}" ry="${btnR}" fill="${BTN_COLOR}"/>
  <rect x="${volX}" y="${volY}" width="7" height="${volH}" rx="${btnR}" ry="${btnR}" fill="${BTN_COLOR}"/>
  <rect x="${volX}" y="${vol2Y}" width="7" height="${volH}" rx="${btnR}" ry="${btnR}" fill="${BTN_COLOR}"/>
  <rect x="${volX}" y="${silY}" width="7" height="${silH}" rx="${btnR}" ry="${btnR}" fill="${BTN_COLOR}"/>
</svg>`);
}

// ─── Per-size setup ────────────────────────────────────────────────────────────

function setupSize(cfg) {
  const { canvas, frame, screen: bezel } = cfg;
  const { w: cw, h: ch } = canvas;
  const slug = cfg.slug.replace('.', '_');

  const sx = frame.x + bezel.bezelSide;
  const sy = frame.y + bezel.bezelTop;
  const sw = frame.w - bezel.bezelSide * 2;
  const sh = frame.h - bezel.bezelTop - bezel.bezelBottom;
  const sRadius = Math.max(frame.radius - 16, 48);

  const tmpBgSvg      = `/tmp/as_au_bg_${slug}.svg`;
  const tmpDecorSvg   = `/tmp/as_au_decor_${slug}.svg`;
  const tmpFBehindSvg = `/tmp/as_au_fbehind_${slug}.svg`;
  const tmpFFrontSvg  = `/tmp/as_au_ffront_${slug}.svg`;

  const tmpBgPng      = `/tmp/as_au_bg_${slug}.png`;
  const tmpDecorPng   = `/tmp/as_au_decor_${slug}.png`;
  const tmpFBehindPng = `/tmp/as_au_fbehind_${slug}.png`;
  const tmpFFrontPng  = `/tmp/as_au_ffront_${slug}.png`;

  writeBgSvg(cw, ch, tmpBgSvg);
  writeDecorSvg(cw, ch, tmpDecorSvg);
  writeFrameBehindSvg(cfg, sx, sy, sw, sh, sRadius, tmpFBehindSvg);
  writeFrameFrontSvg(cfg, sx, sy, sw, sh, sRadius, tmpFFrontSvg);

  run(`magick -background ${q(NAVY)} ${q(tmpBgSvg)} -resize ${cw}x${ch}! ${q(tmpBgPng)}`);
  run(`magick -background none ${q(tmpDecorSvg)} -resize ${cw}x${ch}! ${q(tmpDecorPng)}`);
  run(`magick -background none ${q(tmpFBehindSvg)} -resize ${cw}x${ch}! ${q(tmpFBehindPng)}`);
  run(`magick -background none ${q(tmpFFrontSvg)} -resize ${cw}x${ch}! ${q(tmpFFrontPng)}`);

  return { sx, sy, sw, sh, sRadius, tmpBgPng, tmpDecorPng, tmpFBehindPng, tmpFFrontPng };
}

// ─── Per-image compositor ─────────────────────────────────────────────────────

function composite(sizeCfg, sizeCtx, screen, outputDir) {
  const { canvas, headline, sub } = sizeCfg;
  const { w: cw, h: ch } = canvas;
  const { sx, sy, sw, sh, sRadius,
          tmpBgPng, tmpDecorPng, tmpFBehindPng, tmpFFrontPng } = sizeCtx;

  const inputPath = path.join(INPUT_DIR, screen.file);
  if (!fs.existsSync(inputPath)) {
    console.warn(`  ⚠ Skipping ${screen.file} — not found`);
    return;
  }

  const outputPath = path.join(outputDir, screen.out);
  const tag = `${cw}_au_${screen.out.replace('.png', '')}`;

  const srcW = 1290, srcH = 2796;
  const scaleX = sw / srcW;
  const scaleY = sh / srcH;
  const scale  = Math.max(scaleX, scaleY);
  const scaledW = Math.round(srcW * scale);
  const scaledH = Math.round(srcH * scale);
  const cropOffX = Math.round((scaledW - sw) / 2);
  const cropOffY = Math.round((scaledH - sh) / 2);

  const tmpShot = `/tmp/as_shot_${tag}.png`;
  const tmpMask = `/tmp/as_mask_au_${cw}.png`;

  run(
    `magick ${q(inputPath)} -resize ${scaledW}x${scaledH}! ` +
    `-gravity Center -crop ${sw}x${sh}+${cropOffX}+${cropOffY} +repage ` +
    `${q(tmpShot)}`
  );

  run(
    `magick -size ${sw}x${sh} xc:black ` +
    `-fill white -draw "roundrectangle 0,0,${sw - 1},${sh - 1},${sRadius},${sRadius}" ` +
    `${q(tmpMask)}`
  );

  run(
    `magick ${q(tmpShot)} -alpha set ` +
    `${q(tmpMask)} -compose CopyOpacity -composite ` +
    `${q(tmpShot)}`
  );

  const hlLines = screen.headline.split('\n');
  let annotateLines = '';
  for (let i = 0; i < hlLines.length; i++) {
    const lineY = headline.y + i * headline.lineH;
    annotateLines +=
      ` -font ${q(FONT_BOLD)} -pointsize ${headline.size}` +
      ` -fill "${WHITE}" -gravity North -annotate +0+${lineY} ${imq(hlLines[i])}`;
  }
  const subAnnotate =
    ` -font ${q(FONT_SEMI)} -pointsize ${sub.size}` +
    ` -fill "rgba(188,224,255,0.90)" -gravity North -annotate +0+${sub.y} ${imq(screen.sub)}`;

  const cmd = [
    `magick`,
    q(tmpBgPng),
    `${q(tmpDecorPng)} -composite`,
    `${q(tmpFBehindPng)} -composite`,
    `${q(tmpShot)} -geometry +${sx}+${sy} -composite`,
    `${q(tmpFFrontPng)} -composite`,
    annotateLines,
    subAnnotate,
    q(outputPath),
  ].join(' \\\n  ');

  run(cmd);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const targets = [
    { cfg: SIZES.ios_6_7,    dir: path.join(OUTPUT_ROOT, 'ios_6.7') },
    { cfg: SIZES.ios_6_5,    dir: path.join(OUTPUT_ROOT, 'ios_6.5') },
    { cfg: SIZES.play_store, dir: path.join(OUTPUT_ROOT, 'play_store') },
  ];

  for (const { cfg, dir } of targets) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`\n▶ Generating ${cfg.slug} en-AU (${cfg.canvas.w}×${cfg.canvas.h})`);
    process.stdout.write('  Setting up size layers…');
    const ctx = setupSize(cfg);
    console.log(' ✓');

    for (let i = 0; i < SCREENS.length; i++) {
      const screen = SCREENS[i];
      process.stdout.write(`  ${String(i + 1).padStart(2, '0')}. ${screen.out}…`);
      try {
        composite(cfg, ctx, screen, dir);
        console.log(' ✓');
      } catch (e) {
        console.log(` ✗\n     ${e.message}`);
      }
    }
  }

  console.log('\n✅ Done — store-assets/screenshots-professional/en-AU/');
}

main();
