import { ExpoConfig } from 'expo/config';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withSpmFix = require('./plugins/withSpmFix');

const replitDevDomain = process.env.REPLIT_DEV_DOMAIN ?? '';
const apiBaseUrl = replitDevDomain ? `https://${replitDevDomain}` : '';

// Single source of truth: version lives in package.json.
// Bump it with: npm version patch|minor|major
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { version } = require('./package.json') as { version: string };

// EAS project ID is written to app.json by `eas init` and read back here so
// that app.config.ts (which takes precedence over app.json) still exposes it
// to the EAS CLI.  If it is missing, `scripts/check-eas-setup.js` will print
// a clear error before any build or submit command runs.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const appJson = require('./app.json') as {
  expo?: { extra?: { eas?: { projectId?: string } }; ios?: { buildNumber?: string } };
};
const easProjectId = appJson?.expo?.extra?.eas?.projectId;
const iosBuildNumber = appJson?.expo?.ios?.buildNumber;

const config: ExpoConfig = {
  name: 'Authentic Steps For Youth',
  slug: 'authentic-steps-app',
  version,
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'authentic-steps',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/images/icon.png',
    resizeMode: 'contain',
    backgroundColor: '#03989e',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'org.authenticsteps.youth',
    buildNumber: iosBuildNumber,
    infoPlist: {
      // The app uses only standard HTTPS/TLS — no custom or non-exempt encryption.
      // Apple requires this export compliance declaration in the binary.
      ITSAppUsesNonExemptEncryption: false,
    },
    privacyManifests: {
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
          NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
        },
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryFileTimestamp',
          NSPrivacyAccessedAPITypeReasons: ['C617.1'],
        },
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategorySystemBootTime',
          NSPrivacyAccessedAPITypeReasons: ['35F9.1'],
        },
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryDiskSpace',
          NSPrivacyAccessedAPITypeReasons: ['E174.1'],
        },
      ],
    },
  },
  android: { package: 'org.authenticsteps.youth', versionCode: 5 },
  web: { favicon: './assets/images/icon.png' },
  plugins: [
    ['expo-router', { origin: 'https://replit.com/' }],
    'expo-font',
    'expo-web-browser',
    [
      'expo-notifications',
      {
        icon: './assets/images/icon.png',
        color: '#03989e',
        defaultChannel: 'authentic-steps-default',
      },
    ],
    [
      'expo-build-properties',
      {
        android: {
          packagingOptions: {
            pickFirst: ['META-INF/versions/9/OSGI-INF/MANIFEST.MF'],
          },
        },
      },
    ],
    withSpmFix,
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    apiBaseUrl,
    eas: {
      projectId: easProjectId,
    },
  },
};

export default config;
