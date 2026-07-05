/**
 * PDF export resilience tests.
 *
 * The app runs in guest/AsyncStorage mode. If AsyncStorage returns malformed
 * JSON (failed write, OS corruption, mid-upgrade), the context can feed the PDF
 * builders `undefined`/`null` for `entries` and `groundingSessions`.
 *
 * Both `buildPdfHtml` (journal.tsx) and `buildProfilePdfHtml` (profile.tsx) have
 * null guards so they never throw. These tests lock in that guarantee: with both
 * `entries` and `groundingSessions` undefined the builders must NOT throw and must
 * return a non-empty, well-formed HTML document — never an empty string that would
 * let the export silently succeed with empty output.
 */

// ─── Module mocks (screen modules import native/expo deps at load time) ───────

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  multiRemove: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/context/AppContext', () => ({
  useApp: jest.fn(),
  AppProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({}),
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useFocusEffect: jest.fn(),
}));

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(),
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: {},
  NotificationFeedbackType: { Success: 'Success', Warning: 'Warning' },
}));

jest.mock('expo-print', () => ({
  printAsync: jest.fn().mockResolvedValue(undefined),
  printToFileAsync: jest.fn().mockResolvedValue({ uri: 'file://test.pdf' }),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(false),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
  getStringAsync: jest.fn().mockResolvedValue(''),
}));

jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { LinearGradient: ({ children, ...rest }: any) => React.createElement(View, rest, children) };
});

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const stub = ({ name }: { name: string }) => React.createElement(Text, null, name);
  return { Ionicons: stub, Feather: stub };
});

jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { __esModule: true, default: () => React.createElement(View) };
});

jest.mock('@/utils/notifications', () => ({
  getPermissionState: jest.fn().mockResolvedValue('undetermined'),
  requestPermissionWithRationale: jest.fn().mockResolvedValue(false),
  scheduleRitualReminder: jest.fn().mockResolvedValue(undefined),
  scheduleEveningReminder: jest.fn().mockResolvedValue(undefined),
}));

// profile.tsx imports @clerk/expo at load time, which pulls in @clerk/clerk-js.
// That module opens a persistent MessagePort on import, which keeps the Jest
// worker alive after the run finishes (the whole suite hangs and never exits).
// Stub it so the real Clerk native bundle never loads.
jest.mock('@clerk/expo', () => ({
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    signOut: jest.fn().mockResolvedValue(undefined),
    getToken: jest.fn().mockResolvedValue('test-token'),
  }),
  useUser: () => ({
    isLoaded: true,
    isSignedIn: true,
    user: { primaryEmailAddress: { emailAddress: 'test@example.com' } },
  }),
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import { buildPdfHtml } from '../app/journal';
import { buildProfilePdfHtml } from '../app/(tabs)/profile';
import type { UserData } from '../context/AppContext';

// A well-formed profile with no journal/grounding data (worst case: everything empty).
const emptyUserData: UserData = {
  anonymousName: 'TestUser',
  currentStreak: 0,
  longestStreak: 0,
  totalRituals: 0,
  streakFreezes: 0,
  flexDaysUsedThisWeek: 0,
  milestones: [],
  totalEncouragements: 0,
  lastCheckIn: '',
  lastFlexWeek: '',
  hasOnboarded: true,
  themePreference: 'system',
  recoveryCode: 'TEST-CODE-XXXX',
  favouriteTools: [],
  notifRitual: false,
  notifEvening: false,
  notifMilestone: false,
  ritualHour: 9,
  ritualMinute: 0,
  eveningHour: 20,
  eveningMinute: 0,
  chimeEnabled: true,
};

/** Asserts the value is a non-empty, well-formed HTML document. */
function expectValidHtmlDocument(html: unknown): void {
  expect(typeof html).toBe('string');
  const doc = html as string;
  expect(doc.trim().length).toBeGreaterThan(0);
  expect(doc).toMatch(/<!DOCTYPE html>/i);
  expect(doc).toMatch(/<html[\s>]/i);
  expect(doc).toMatch(/<body[\s>]/i);
  expect(doc).toMatch(/<\/body>/i);
  expect(doc).toMatch(/<\/html>/i);
}

describe('buildPdfHtml (journal export) — corrupted / missing data', () => {
  it('does not throw and returns a valid non-empty HTML document when entries and groundingSessions are undefined', () => {
    let html: string | undefined;
    expect(() => {
      // Cast: corrupted AsyncStorage can hand us undefined at runtime despite the types.
      html = buildPdfHtml([], undefined as any, undefined as any);
    }).not.toThrow();
    expectValidHtmlDocument(html);
  });

  it('does not throw and returns a valid non-empty HTML document when groundingSessions is null', () => {
    let html: string | undefined;
    expect(() => {
      html = buildPdfHtml([], undefined as any, null as any);
    }).not.toThrow();
    expectValidHtmlDocument(html);
  });
});

describe('buildProfilePdfHtml (profile export) — corrupted / missing data', () => {
  it('does not throw and returns a valid non-empty HTML document when entries and groundingSessions are undefined', () => {
    let html: string | undefined;
    expect(() => {
      html = buildProfilePdfHtml(emptyUserData, undefined, undefined);
    }).not.toThrow();
    expectValidHtmlDocument(html);
  });

  it('does not throw and returns a valid non-empty HTML document when entries and groundingSessions are null', () => {
    let html: string | undefined;
    expect(() => {
      html = buildProfilePdfHtml(emptyUserData, null as any, null as any);
    }).not.toThrow();
    expectValidHtmlDocument(html);
  });
});
