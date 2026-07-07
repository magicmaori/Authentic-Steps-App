import { ExpoConfig } from 'expo/config';

const replitDevDomain = process.env.REPLIT_DEV_DOMAIN ?? '';
const apiBaseUrl = replitDevDomain ? `https://${replitDevDomain}` : '';

// Single source of truth: version lives in package.json.
// Bump it with: npm version patch|minor|major
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { version } = require('./package.json') as { version: string };

const config: ExpoConfig = {
  name: 'Authentic Steps For Youth',
  slug: 'authentic-steps',
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
  android: { package: 'org.authenticsteps.youth' },
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
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    apiBaseUrl,
  },
};

export default config;
