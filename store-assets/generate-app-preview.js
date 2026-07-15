#!/usr/bin/env node
/**
 * Authentic Steps — iOS App Preview Video Generator
 *
 * Produces a 30-second App Preview MP4 (1290×2796, H.264) suitable for
 * the iOS App Store. Shows the core 3-screen flow:
 *   1. Onboarding / splash
 *   2. Home / daily ritual
 *   3. Ritual completion
 *
 * Timing model (xfade eats XFADE seconds from the output timeline per fade):
 *   total_out = TITLE + 3×SCREEN + END − 4×XFADE
 *   → SCREEN = (TOTAL − TITLE − END + 4×XFADE) / 3 = (30 − 2.5 − 2.5 + 3) / 3 = 28/3 ≈ 9.33s
 *
 * Usage:
 *   node store-assets/generate-app-preview.js
 *
 * Requires: ffmpeg on PATH.
 */

'use strict';

const { execFileSync } = require('child_process');
const path = require('path');
const fs   = require('fs');

const ROOT   = path.resolve(__dirname, '..');
const SS_DIR = path.join(ROOT, 'store-assets/screenshots-professional/ios_6.7');
const OUT    = path.join(ROOT, 'store-assets/ios-app-preview.mp4');
const FONT   = path.join(ROOT, 'store-assets/fonts/Inter-Bold.ttf');
const FONT_S = path.join(ROOT, 'store-assets/fonts/Inter-SemiBold.ttf');

const W   = 1290;
const H   = 2796;
const FPS = 30;

// ─── Timing ───────────────────────────────────────────────────────────────────
// total_output = TITLE + 3*SCREEN + END - 4*XFADE  (4 xfades for 5 segments)
const TITLE       = 2.5;
const END         = 2.5;
const XFADE       = 0.75;
const TOTAL       = 30;
const SCREEN_CNT  = 3;
const XFADE_CNT   = SCREEN_CNT + 1;           // 4 fades: T→S0, S0→S1, S1→S2, S2→E
const SCREEN_SECS = (TOTAL - TITLE - END + XFADE_CNT * XFADE) / SCREEN_CNT;
// = (30 - 2.5 - 2.5 + 3) / 3 = 28/3 ≈ 9.333s

const SCREENS = [
  { file: '01-onboarding.png' },
  { file: '02-home.png'       },
  { file: '07-complete.png'   },
];

// Validate inputs
for (const s of SCREENS) {
  const p = path.join(SS_DIR, s.file);
  if (!fs.existsSync(p)) { console.error(`❌  Missing: ${p}`); process.exit(1); }
}

// ─── Build filter_complex ─────────────────────────────────────────────────────
// Key rule: xfade offsets must be in OUTPUT timeline, not cumulative input time.
// After each xfade the output time advances by (segDuration - XFADE).

const parts = [];

// Title card
parts.push(
  `color=c=0x193b83:size=${W}x${H}:rate=${FPS}:duration=${TITLE},` +
  `drawtext=fontfile='${FONT}':text='Authentic Steps':fontcolor=white:fontsize=96` +
  `:x=(w-text_w)/2:y=(h/2)-160,` +
  `drawtext=fontfile='${FONT_S}':text='Your wellbeing journey starts here':` +
  `fontcolor=0xBCE0FF:fontsize=52:x=(w-text_w)/2:y=(h/2)+20` +
  `[title]`
);

// Screenshot segments — convert PNG's 25 fps timebase to 30 fps so xfade matches
SCREENS.forEach((_, i) => {
  parts.push(`[${i}:v]fps=${FPS},setpts=PTS-STARTPTS[z${i}]`);
});

// End card
parts.push(
  `color=c=0x037880:size=${W}x${H}:rate=${FPS}:duration=${END},` +
  `drawtext=fontfile='${FONT}':text='Download today':fontcolor=white:fontsize=86` +
  `:x=(w-text_w)/2:y=(h/2)-130,` +
  `drawtext=fontfile='${FONT_S}':text='Authentic Steps':` +
  `fontcolor=0xBCE0FF:fontsize=50:x=(w-text_w)/2:y=(h/2)+20` +
  `[end]`
);

// xfade chain: title → z0 → z1 → z2 → end
// cumul tracks OUTPUT timeline position (end of the last fully played segment)
const segs    = ['z0', 'z1', 'z2', 'end'];
const segDurs = [SCREEN_SECS, SCREEN_SECS, SCREEN_SECS, END];

let prev        = 'title';
let cumulOutput = TITLE;   // output time at the end of the title card

segs.forEach((next, xi) => {
  const offset   = (cumulOutput - XFADE).toFixed(3);
  const outLabel = xi === segs.length - 1 ? 'vout' : `xf${xi}`;
  parts.push(
    `[${prev}][${next}]xfade=transition=fade:duration=${XFADE}:offset=${offset}[${outLabel}]`
  );
  // After this xfade the output timeline advances by (segDur - XFADE)
  cumulOutput += segDurs[xi] - XFADE;
  prev = outLabel;
});

// Sanity check
const expectedTotal = TITLE + SCREEN_CNT * SCREEN_SECS + END - XFADE_CNT * XFADE;
console.log(`  Computed total: ${expectedTotal.toFixed(2)}s (target: ${TOTAL}s)`);

// Write filter to a file — avoids all shell-escaping issues
const filterFile = '/tmp/as_preview_filter.txt';
fs.writeFileSync(filterFile, parts.join('; \n'));

// ─── ffmpeg args ──────────────────────────────────────────────────────────────
const args = [
  '-y',
  // 3 looped PNG inputs, each trimmed to SCREEN_SECS
  ...SCREENS.flatMap((s) => [
    '-loop', '1',
    '-t', SCREEN_SECS.toFixed(3),
    '-i', path.join(SS_DIR, s.file),
  ]),
  '-filter_complex_script', filterFile,
  '-map', '[vout]',
  '-c:v', 'libx264',
  '-preset', 'ultrafast',
  '-crf', '20',
  '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart',
  '-t', String(TOTAL),
  OUT,
];

console.log('▶ Generating iOS App Preview…');
console.log(`  Output: ${OUT}`);
console.log(`  ${W}×${H}, ${TOTAL}s, H.264`);
console.log(`  Segments: title=${TITLE}s | screen=${SCREEN_SECS.toFixed(3)}s ×3 | end=${END}s | xfade=${XFADE}s ×${XFADE_CNT}\n`);

execFileSync('ffmpeg', args, { stdio: 'inherit' });

console.log(`\n✅  App Preview written to: ${OUT}`);
