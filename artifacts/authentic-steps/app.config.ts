import { ExpoConfig } from 'expo/config';

const replitDevDomain = process.env.REPLIT_DEV_DOMAIN ?? '';
const apiBaseUrl = replitDevDomain ? `https://${replitDevDomain}` : '';

const config: ExpoConfig = {
  name: 'Authentic Steps For Youth',
  slug: 'authentic-steps',
  version: '1.0.0',
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
  ios: { supportsTablet: false },
  android: {},
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
