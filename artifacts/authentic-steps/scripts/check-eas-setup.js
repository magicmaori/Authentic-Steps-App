/**
 * Pre-flight check for EAS build/submit commands.
 *
 * Fails fast with a clear, actionable error if:
 *  - The project hasn't been linked via `eas init` yet (no projectId in app.json)
 *  - The iOS submit placeholders in eas.json haven't been filled in (--check-ios-submit)
 *  - The Android service account JSON is missing (--check-android-submit)
 *
 * Usage:
 *   node scripts/check-eas-setup.js                                              # build check only
 *   node scripts/check-eas-setup.js --check-ios-submit --ios-submit-profile preview     # validate preview iOS submit config
 *   node scripts/check-eas-setup.js --check-ios-submit --ios-submit-profile production  # validate production iOS submit config
 *   node scripts/check-eas-setup.js --check-android-submit                       # also validate Android submit config
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const checkIosSubmit = process.argv.includes('--check-ios-submit');
const checkAndroidSubmit = process.argv.includes('--check-android-submit');

// Parse --ios-submit-profile <name> (defaults to 'production' for backward compatibility)
const iosSubmitProfileIdx = process.argv.indexOf('--ios-submit-profile');
const iosSubmitProfile =
  iosSubmitProfileIdx !== -1 && process.argv[iosSubmitProfileIdx + 1]
    ? process.argv[iosSubmitProfileIdx + 1]
    : 'production';

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

  const profileConfig = easJson?.submit?.[iosSubmitProfile];
  if (!profileConfig) {
    fail(
      `submit.${iosSubmitProfile} is not defined in eas.json.\n\n` +
      '  To fix:\n' +
      `    Add a "submit": { "${iosSubmitProfile}": { "ios": { ... } } } section to\n` +
      '    artifacts/authentic-steps/eas.json with ascAppId and appleTeamId.',
    );
  }

  const ios = profileConfig.ios ?? {};

  if (!ios.ascAppId || ios.ascAppId === 'REPLACE_WITH_ASC_APP_ID') {
    fail(
      `submit.${iosSubmitProfile}.ios.ascAppId is not set in eas.json.\n\n` +
      '  To fix:\n' +
      '    Open artifacts/authentic-steps/eas.json and replace\n' +
      '    "REPLACE_WITH_ASC_APP_ID" with your numeric App Store Connect app ID.\n' +
      '    (Find it at appstoreconnect.apple.com → Your App → General → App Information → Apple ID)',
    );
  }

  if (!ios.appleTeamId || ios.appleTeamId === 'REPLACE_WITH_APPLE_TEAM_ID') {
    fail(
      `submit.${iosSubmitProfile}.ios.appleTeamId is not set in eas.json.\n\n` +
      '  To fix:\n' +
      '    Open artifacts/authentic-steps/eas.json and replace\n' +
      '    "REPLACE_WITH_APPLE_TEAM_ID" with your 10-character Apple Team ID.\n' +
      '    (Find it at developer.apple.com → Account → Membership → Team ID)',
    );
  }
}

// --- 3. Optionally check Android service account JSON ---
if (checkAndroidSubmit) {
  const easJsonPath = path.join(projectRoot, 'eas.json');
  let easJson;
  try {
    easJson = JSON.parse(fs.readFileSync(easJsonPath, 'utf-8'));
  } catch {
    fail(`Could not read ${easJsonPath}.`);
  }

  const android = easJson?.submit?.production?.android ?? {};
  const keyPath = android.serviceAccountKeyPath;

  if (!keyPath) {
    fail(
      'submit.production.android.serviceAccountKeyPath is not set in eas.json.\n\n' +
      '  To fix:\n' +
      '    Add "serviceAccountKeyPath": "./google-play-service-account.json" under\n' +
      '    submit.production.android in artifacts/authentic-steps/eas.json.',
    );
  }

  const resolvedKeyPath = path.resolve(projectRoot, keyPath);
  if (!fs.existsSync(resolvedKeyPath)) {
    fail(
      `Android service account JSON not found at: ${resolvedKeyPath}\n\n` +
      '  To fix:\n' +
      '    1. Go to Google Play Console → Setup → API access\n' +
      '    2. Link to a Google Cloud project (or create one)\n' +
      '    3. Create a service account with the "Release Manager" role\n' +
      '    4. Download its JSON key\n' +
      '    5. Place the file at: artifacts/authentic-steps/google-play-service-account.json\n' +
      '    (This file is gitignored — never commit it)',
    );
  }

  // Basic sanity-check: must be valid JSON with a type field
  try {
    const keyJson = JSON.parse(fs.readFileSync(resolvedKeyPath, 'utf-8'));
    if (keyJson.type !== 'service_account') {
      fail(
        `The file at ${resolvedKeyPath} does not look like a Google service account key.\n` +
        '  Expected a JSON file with "type": "service_account".\n' +
        '  Make sure you downloaded the correct JSON key from Google Cloud Console.',
      );
    }
  } catch (e) {
    if (e.message && e.message.includes('setup check failed')) throw e;
    fail(
      `Could not parse the service account JSON at ${resolvedKeyPath}.\n` +
      '  Make sure the file is valid JSON downloaded from Google Cloud Console.',
    );
  }
}

console.log('\x1b[32mEAS setup check passed.\x1b[0m');
