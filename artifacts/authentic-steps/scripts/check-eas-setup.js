/**
 * Pre-flight check for EAS build/submit commands.
 *
 * Fails fast with a clear, actionable error if:
 *  - The project hasn't been linked via `eas init` yet (no projectId in app.json)
 *  - The iOS submit placeholders in eas.json haven't been filled in (--check-ios-submit)
 *
 * Usage:
 *   node scripts/check-eas-setup.js                   # build check only
 *   node scripts/check-eas-setup.js --check-ios-submit # also validate iOS submit config
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const checkIosSubmit = process.argv.includes('--check-ios-submit');

function fail(msg) {
  console.error('\n\x1b[31mEAS setup check failed:\x1b[0m', msg, '\n');
  process.exit(1);
}

// --- 1. Check EAS project link (written by `eas init`) ---
const appJsonPath = path.join(projectRoot, 'app.json');
let appJson;
try {
  appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
} catch {
  fail(
    `Could not read ${appJsonPath}.\n` +
    'Make sure you are running from the authentic-steps package directory.',
  );
}

const projectId = appJson?.expo?.extra?.eas?.projectId;
if (!projectId) {
  fail(
    'The EAS project is not linked yet (no extra.eas.projectId in app.json).\n\n' +
    '  To fix:\n' +
    '    1. Set EXPO_TOKEN (get one at expo.dev → Account Settings → Access Tokens)\n' +
    '    2. Run: pnpm --filter @workspace/authentic-steps run eas-init\n' +
    '    3. Commit the updated app.json',
  );
}

// --- 2. Optionally check iOS submit placeholders ---
if (checkIosSubmit) {
  const easJsonPath = path.join(projectRoot, 'eas.json');
  let easJson;
  try {
    easJson = JSON.parse(fs.readFileSync(easJsonPath, 'utf-8'));
  } catch {
    fail(`Could not read ${easJsonPath}.`);
  }

  const ios = easJson?.submit?.production?.ios ?? {};

  if (!ios.ascAppId || ios.ascAppId === 'REPLACE_WITH_ASC_APP_ID') {
    fail(
      'submit.production.ios.ascAppId is not set in eas.json.\n\n' +
      '  To fix:\n' +
      '    Open artifacts/authentic-steps/eas.json and replace\n' +
      '    "REPLACE_WITH_ASC_APP_ID" with your numeric App Store Connect app ID.\n' +
      '    (Find it at appstoreconnect.apple.com → Your App → General → App Information → Apple ID)',
    );
  }

  if (!ios.appleTeamId || ios.appleTeamId === 'REPLACE_WITH_APPLE_TEAM_ID') {
    fail(
      'submit.production.ios.appleTeamId is not set in eas.json.\n\n' +
      '  To fix:\n' +
      '    Open artifacts/authentic-steps/eas.json and replace\n' +
      '    "REPLACE_WITH_APPLE_TEAM_ID" with your 10-character Apple Team ID.\n' +
      '    (Find it at developer.apple.com → Account → Membership → Team ID)',
    );
  }
}

console.log('\x1b[32mEAS setup check passed.\x1b[0m');
