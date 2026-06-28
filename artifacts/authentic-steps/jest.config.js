module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  // In PNPM, physical packages live under node_modules/.pnpm/<pkg@ver>/node_modules/<pkg>.
  // The default pattern only checks the segment right after "node_modules/", so ".pnpm"
  // blocks the lookahead and every RN/Expo package is left untransformed.
  // Using .* inside the lookahead means "transform me if my full path contains any of
  // these package names", which works regardless of the nesting depth.
  transformIgnorePatterns: [
    'node_modules/(?!.*((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/|@expo-google-fonts/|fflate|react-navigation|@react-navigation/))',
  ],
};
