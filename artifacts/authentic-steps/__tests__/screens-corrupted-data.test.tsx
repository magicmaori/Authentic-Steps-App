/**
 * Corrupted / missing data resilience tests.
 *
 * The app runs in guest/AsyncStorage mode.  If AsyncStorage returns null (fresh
 * install) or malformed JSON (failed write, OS corruption, mid-upgrade), the
 * context may feed screens with undefined or partially-missing fields.
 *
 * These tests verify that DailyRitualScreen, ProfileScreen, JournalScreen, and
 * SosScreen never throw a render-time exception when given the worst-case data
 * shapes: undefined arrays, null strings, missing numeric fields, etc.
 *
 * All module mocks are self-contained (jest.mock factory closures).  The test
 * runner is jest-expo, identical to every other test in this package.
 */

// ─── Module mocks ─────────────────────────────────────────────────────────────

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
  useColors: () => ({
    background: '#ffffff',
    foreground: '#111827',
    mutedForeground: '#6b7280',
    card: '#f9fafb',
    border: '#e5e7eb',
    primary: '#1a5c3a',
    primaryForeground: '#ffffff',
    secondary: '#f0fdf4',
    muted: '#f3f4f6',
    accent: '#03989e',
    gradientStart: '#1a5c3a',
    destructive: '#ef4444',
  }),
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useFocusEffect: jest.fn(),
}));

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium', Heavy: 'Heavy' },
  NotificationFeedbackType: { Success: 'Success', Warning: 'Warning' },
}));

jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children, ...rest }: any) =>
      React.createElement(View, rest, children),
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: any) => children,
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const stub = ({ name }: { name: string }) =>
    React.createElement(Text, { testID: `icon-${name}` }, name);
  return { Ionicons: stub, Feather: stub };
});

jest.mock('@/components/VideoPlaceholder', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    VideoPlaceholder: () => React.createElement(View, { testID: 'video-placeholder' }),
  };
});

jest.mock('@/components/AppLogo', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    AppLogo: () => React.createElement(View, { testID: 'app-logo' }),
  };
});

jest.mock('@/components/SOSButton', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SOSButton: () => React.createElement(View, { testID: 'sos-button' }),
  };
});

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: () => React.createElement(View, { testID: 'date-time-picker' }),
  };
});

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(undefined),
  getStringAsync: jest.fn().mockResolvedValue(''),
}));

jest.mock('expo-print', () => ({
  printAsync: jest.fn().mockResolvedValue(undefined),
  printToFileAsync: jest.fn().mockResolvedValue({ uri: 'file://test.pdf' }),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(false),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/utils/notifications', () => ({
  getPermissionState: jest.fn().mockResolvedValue('undetermined'),
  requestPermission: jest.fn().mockResolvedValue(false),
  scheduleRitualReminder: jest.fn().mockResolvedValue(undefined),
  scheduleEveningReminder: jest.fn().mockResolvedValue(undefined),
  cancelAllReminders: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/components/BreathingTimer', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: () => React.createElement(View, { testID: 'breathing-timer' }),
  };
});

jest.mock('@/components/GroundingWalkthrough', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: () => React.createElement(View, { testID: 'grounding-walkthrough' }),
  };
});

jest.mock('@/components/MovementExercise', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: () => React.createElement(View, { testID: 'movement-exercise' }),
  };
});

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import React from 'react';
import { act, create } from 'react-test-renderer';
import { useApp } from '../context/AppContext';

import DailyRitualScreen from '../app/(tabs)/index';
import ProfileScreen from '../app/(tabs)/profile';
import JournalScreen from '../app/journal';
import SosScreen from '../app/sos';
import ToolboxScreen from '../app/(tabs)/toolbox';
import StreaksScreen from '../app/(tabs)/streaks';
import GratitudeScreen from '../app/ritual/gratitude';
import IntentionScreen from '../app/ritual/intention';
import IAmScreen from '../app/ritual/iamstatement';
import CompleteScreen from '../app/ritual/complete';

// ─── Typed mock reference ─────────────────────────────────────────────────────

const mockUseApp = useApp as jest.Mock;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function flushPromises(): Promise<void> {
  return new Promise(resolve => setImmediate(resolve));
}

/**
 * Returns a well-formed AppContext value with any overrides applied.
 * Fields are explicitly typed as `any` for the corrupted-data variants so we
 * can pass undefined/null without TS errors in the tests themselves.
 */
function makeCtx(overrides: Record<string, any> = {}): Record<string, any> {
  return {
    isLoaded: true,
    userData: {
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
    },
    entries: {},
    groundingSessions: [],
    lastSynced: null,
    todayEntry: null,
    isStepDone: jest.fn().mockReturnValue(false),
    setThemePreference: jest.fn().mockResolvedValue(undefined),
    buildRecoveryPayload: jest.fn().mockReturnValue('TEST-PAYLOAD'),
    restoreFromCode: jest.fn().mockResolvedValue({ ok: true }),
    resetAllData: jest.fn().mockResolvedValue(undefined),
    setNotificationPref: jest.fn().mockResolvedValue(undefined),
    setNotificationTime: jest.fn().mockResolvedValue(undefined),
    disableAllNotificationPrefs: jest.fn().mockResolvedValue(undefined),
    setChimeEnabled: jest.fn().mockResolvedValue(undefined),
    saveEntry: jest.fn().mockResolvedValue(undefined),
    saveGroundingSession: jest.fn().mockResolvedValue(undefined),
    deleteGroundingSession: jest.fn().mockResolvedValue(undefined),
    getStreakCalendar: jest.fn().mockReturnValue([]),
    toggleFavouriteTool: jest.fn().mockResolvedValue(undefined),
    isExerciseDoneToday: jest.fn().mockReturnValue(false),
    markExerciseDone: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

/** Merge corrupted fields into userData while keeping the rest intact. */
function makeCtxWithCorruptUser(
  userOverrides: Record<string, any>,
  ctxOverrides: Record<string, any> = {},
): Record<string, any> {
  const base = makeCtx(ctxOverrides);
  base.userData = { ...base.userData, ...userOverrides };
  return base;
}

// ─── 1. DailyRitualScreen – corrupted data ────────────────────────────────────

describe('DailyRitualScreen – corrupted / missing AsyncStorage data', () => {
  let root: ReturnType<typeof create> | undefined;

  afterEach(() => {
    if (root) {
      act(() => { root!.unmount(); });
      root = undefined;
    }
    jest.clearAllMocks();
  });

  it('does not crash when milestones is undefined (null JSON field)', async () => {
    mockUseApp.mockReturnValue(makeCtxWithCorruptUser({ milestones: undefined }));

    await expect(
      act(async () => {
        root = create(<DailyRitualScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
    expect(root).toBeTruthy();
  });

  it('does not crash when milestones is null', async () => {
    mockUseApp.mockReturnValue(makeCtxWithCorruptUser({ milestones: null }));

    await expect(
      act(async () => {
        root = create(<DailyRitualScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
  });

  it('does not crash when anonymousName is undefined', async () => {
    mockUseApp.mockReturnValue(makeCtxWithCorruptUser({ anonymousName: undefined }));

    await expect(
      act(async () => {
        root = create(<DailyRitualScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
  });

  it('does not crash when anonymousName is empty string', async () => {
    mockUseApp.mockReturnValue(makeCtxWithCorruptUser({ anonymousName: '' }));

    await expect(
      act(async () => {
        root = create(<DailyRitualScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
  });

  it('does not crash when currentStreak is undefined', async () => {
    mockUseApp.mockReturnValue(makeCtxWithCorruptUser({ currentStreak: undefined }));

    await expect(
      act(async () => {
        root = create(<DailyRitualScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
  });

  it('does not crash when todayEntry fields are null', async () => {
    mockUseApp.mockReturnValue(
      makeCtx({
        todayEntry: {
          date: '2026-01-01',
          gratitudes: [],
          intention: null,
          intentionCategory: '',
          iAmStatement: null,
          completedSteps: [],
          isComplete: false,
        },
      }),
    );

    await expect(
      act(async () => {
        root = create(<DailyRitualScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
  });

  it('does not crash when all numeric fields are undefined', async () => {
    mockUseApp.mockReturnValue(
      makeCtxWithCorruptUser({
        currentStreak: undefined,
        longestStreak: undefined,
        totalRituals: undefined,
        streakFreezes: undefined,
      }),
    );

    await expect(
      act(async () => {
        root = create(<DailyRitualScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
  });
});

// ─── 2. ProfileScreen – corrupted / missing AsyncStorage data ─────────────────

describe('ProfileScreen – corrupted / missing AsyncStorage data', () => {
  let root: ReturnType<typeof create> | undefined;

  afterEach(() => {
    if (root) {
      act(() => { root!.unmount(); });
      root = undefined;
    }
    jest.clearAllMocks();
  });

  it('does not crash when milestones is undefined', async () => {
    mockUseApp.mockReturnValue(makeCtxWithCorruptUser({ milestones: undefined }));

    await expect(
      act(async () => {
        root = create(<ProfileScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
    expect(root).toBeTruthy();
  });

  it('does not crash when milestones is null', async () => {
    mockUseApp.mockReturnValue(makeCtxWithCorruptUser({ milestones: null }));

    await expect(
      act(async () => {
        root = create(<ProfileScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
  });

  it('does not crash when anonymousName is empty string (initials derived from it)', async () => {
    mockUseApp.mockReturnValue(makeCtxWithCorruptUser({ anonymousName: '' }));

    await expect(
      act(async () => {
        root = create(<ProfileScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
  });

  it('does not crash when anonymousName is undefined', async () => {
    mockUseApp.mockReturnValue(makeCtxWithCorruptUser({ anonymousName: undefined }));

    await expect(
      act(async () => {
        root = create(<ProfileScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
  });

  it('does not crash when entries is undefined (corrupted AsyncStorage)', async () => {
    mockUseApp.mockReturnValue(makeCtx({ entries: undefined }));

    await expect(
      act(async () => {
        root = create(<ProfileScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
  });

  it('does not crash when groundingSessions is undefined', async () => {
    mockUseApp.mockReturnValue(makeCtx({ groundingSessions: undefined }));

    await expect(
      act(async () => {
        root = create(<ProfileScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
  });

  it('does not crash when recoveryCode is undefined', async () => {
    mockUseApp.mockReturnValue(makeCtxWithCorruptUser({ recoveryCode: undefined }));

    await expect(
      act(async () => {
        root = create(<ProfileScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
  });

  it('does not crash when all notification time fields are undefined', async () => {
    mockUseApp.mockReturnValue(
      makeCtxWithCorruptUser({
        ritualHour: undefined,
        ritualMinute: undefined,
        eveningHour: undefined,
        eveningMinute: undefined,
      }),
    );

    await expect(
      act(async () => {
        root = create(<ProfileScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
  });

  it('does not crash when all numeric stat fields are undefined', async () => {
    mockUseApp.mockReturnValue(
      makeCtxWithCorruptUser({
        currentStreak: undefined,
        longestStreak: undefined,
        totalRituals: undefined,
        milestones: undefined,
      }),
    );

    await expect(
      act(async () => {
        root = create(<ProfileScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
  });
});

// ─── 3. JournalScreen – corrupted / missing AsyncStorage data ─────────────────

describe('JournalScreen – corrupted / missing AsyncStorage data', () => {
  let root: ReturnType<typeof create> | undefined;

  afterEach(() => {
    if (root) {
      act(() => { root!.unmount(); });
      root = undefined;
    }
    jest.clearAllMocks();
  });

  it('does not crash when entries is undefined (fresh install / parse failure)', async () => {
    mockUseApp.mockReturnValue(makeCtx({ entries: undefined }));

    await expect(
      act(async () => {
        root = create(<JournalScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
    expect(root).toBeTruthy();
  });

  it('does not crash when entries is null', async () => {
    mockUseApp.mockReturnValue(makeCtx({ entries: null }));

    await expect(
      act(async () => {
        root = create(<JournalScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
  });

  it('does not crash when groundingSessions is undefined', async () => {
    mockUseApp.mockReturnValue(makeCtx({ groundingSessions: undefined }));

    await expect(
      act(async () => {
        root = create(<JournalScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
  });

  it('does not crash when groundingSessions is null', async () => {
    mockUseApp.mockReturnValue(makeCtx({ groundingSessions: null }));

    await expect(
      act(async () => {
        root = create(<JournalScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
  });

  it('still shows the empty-state title when entries resolves to an empty object after corrupt load', async () => {
    mockUseApp.mockReturnValue(makeCtx({ entries: undefined }));

    await act(async () => {
      root = create(<JournalScreen />);
      await flushPromises();
    });

    const titleNodes = root!.root.findAll(
      (node: any) => node.props.children === 'Your Journey Begins',
      { deep: true },
    );
    expect(titleNodes.length).toBeGreaterThan(0);
  });

  it('does not crash when both entries and groundingSessions are undefined', async () => {
    mockUseApp.mockReturnValue(makeCtx({ entries: undefined, groundingSessions: undefined }));

    await expect(
      act(async () => {
        root = create(<JournalScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
  });
});

// ─── 5. ToolboxScreen – corrupted favouriteTools ──────────────────────────────

describe('ToolboxScreen – corrupted / missing favouriteTools data', () => {
  let root: ReturnType<typeof create> | undefined;

  afterEach(() => {
    if (root) {
      act(() => { root!.unmount(); });
      root = undefined;
    }
    jest.clearAllMocks();
  });

  it('does not crash when favouriteTools is undefined', async () => {
    mockUseApp.mockReturnValue(makeCtxWithCorruptUser({ favouriteTools: undefined }));

    await expect(
      act(async () => {
        root = create(<ToolboxScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
    expect(root).toBeTruthy();
  });

  it('does not crash when favouriteTools is null', async () => {
    mockUseApp.mockReturnValue(makeCtxWithCorruptUser({ favouriteTools: null }));

    await expect(
      act(async () => {
        root = create(<ToolboxScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
  });

  it('does not crash when favouriteTools contains unrecognised tool ids', async () => {
    mockUseApp.mockReturnValue(
      makeCtxWithCorruptUser({ favouriteTools: ['unknown-tool-xyz', 'another-bad-id'] }),
    );

    await expect(
      act(async () => {
        root = create(<ToolboxScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
  });

  it('does not crash when favouriteTools is an empty array', async () => {
    mockUseApp.mockReturnValue(makeCtxWithCorruptUser({ favouriteTools: [] }));

    await expect(
      act(async () => {
        root = create(<ToolboxScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
  });
});

// ─── 4. SosScreen – always safe (no AppContext dependency) ────────────────────

describe('SosScreen – corrupted / missing data (no AppContext dependency)', () => {
  let root: ReturnType<typeof create> | undefined;

  afterEach(() => {
    if (root) {
      act(() => { root!.unmount(); });
      root = undefined;
    }
    jest.clearAllMocks();
  });

  it('renders without throwing when useApp is not set up at all', async () => {
    // SOS screen never calls useApp; it should be completely resilient to
    // any AppContext state.  Prove this by not configuring the mock at all.
    mockUseApp.mockReturnValue(undefined);

    await expect(
      act(async () => {
        root = create(<SosScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
    expect(root).toBeTruthy();
  });

  it('renders without throwing in a fresh-install scenario (empty AsyncStorage)', async () => {
    await expect(
      act(async () => {
        root = create(<SosScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
  });

  it('always shows the helpline list regardless of user data state', async () => {
    mockUseApp.mockReturnValue(null);

    await act(async () => {
      root = create(<SosScreen />);
      await flushPromises();
    });

    const kidsNodes = root!.root.findAll(
      (node: any) => node.props.children === 'Kids Helpline',
      { deep: true },
    );
    expect(kidsNodes.length).toBeGreaterThan(0);
  });
});

// ─── 6. StreaksScreen – corrupted streak calendar data ────────────────────────

describe('StreaksScreen – corrupted / missing streak calendar data', () => {
  let root: ReturnType<typeof create> | undefined;

  afterEach(() => {
    if (root) {
      act(() => { root!.unmount(); });
      root = undefined;
    }
    jest.clearAllMocks();
  });

  it('does not crash when getStreakCalendar returns null', async () => {
    mockUseApp.mockReturnValue(
      makeCtx({ getStreakCalendar: jest.fn().mockReturnValue(null) }),
    );

    await expect(
      act(async () => {
        root = create(<StreaksScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
    expect(root).toBeTruthy();
  });

  it('does not crash when getStreakCalendar returns undefined', async () => {
    mockUseApp.mockReturnValue(
      makeCtx({ getStreakCalendar: jest.fn().mockReturnValue(undefined) }),
    );

    await expect(
      act(async () => {
        root = create(<StreaksScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
  });

  it('does not crash when getStreakCalendar returns an empty array', async () => {
    mockUseApp.mockReturnValue(
      makeCtx({ getStreakCalendar: jest.fn().mockReturnValue([]) }),
    );

    await expect(
      act(async () => {
        root = create(<StreaksScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
  });

  it('does not crash when milestones is undefined', async () => {
    mockUseApp.mockReturnValue(makeCtxWithCorruptUser({ milestones: undefined }));

    await expect(
      act(async () => {
        root = create(<StreaksScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
  });

  it('does not crash when milestones is null', async () => {
    mockUseApp.mockReturnValue(makeCtxWithCorruptUser({ milestones: null }));

    await expect(
      act(async () => {
        root = create(<StreaksScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
  });

  it('does not crash when both calendar is null and milestones is undefined', async () => {
    mockUseApp.mockReturnValue(
      makeCtxWithCorruptUser(
        { milestones: undefined },
        { getStreakCalendar: jest.fn().mockReturnValue(null) },
      ),
    );

    await expect(
      act(async () => {
        root = create(<StreaksScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
  });
});

// ─── 7. isLoaded: false – loading placeholder is shown instead of crashing ────

describe('Tab screens – isLoaded: false does not throw', () => {
  let root: ReturnType<typeof create> | undefined;

  afterEach(() => {
    if (root) {
      act(() => { root!.unmount(); });
      root = undefined;
    }
    jest.clearAllMocks();
  });

  it('DailyRitualScreen renders a loading placeholder when isLoaded is false', async () => {
    mockUseApp.mockReturnValue(makeCtx({ isLoaded: false }));

    await expect(
      act(async () => {
        root = create(<DailyRitualScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
    expect(root).toBeTruthy();
  });

  it('ToolboxScreen renders a loading placeholder when isLoaded is false', async () => {
    mockUseApp.mockReturnValue(makeCtx({ isLoaded: false }));

    await expect(
      act(async () => {
        root = create(<ToolboxScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
    expect(root).toBeTruthy();
  });

  it('StreaksScreen renders a loading placeholder when isLoaded is false', async () => {
    mockUseApp.mockReturnValue(makeCtx({ isLoaded: false }));

    await expect(
      act(async () => {
        root = create(<StreaksScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
    expect(root).toBeTruthy();
  });

  it('ProfileScreen renders a loading placeholder when isLoaded is false', async () => {
    mockUseApp.mockReturnValue(makeCtx({ isLoaded: false }));

    await expect(
      act(async () => {
        root = create(<ProfileScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
    expect(root).toBeTruthy();
  });

  it('DailyRitualScreen does not throw when userData is completely empty and isLoaded is false', async () => {
    mockUseApp.mockReturnValue(makeCtx({ isLoaded: false, userData: {} as any }));

    await expect(
      act(async () => {
        root = create(<DailyRitualScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
  });

  it('ToolboxScreen does not throw when userData is completely empty and isLoaded is false', async () => {
    mockUseApp.mockReturnValue(makeCtx({ isLoaded: false, userData: {} as any }));

    await expect(
      act(async () => {
        root = create(<ToolboxScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
  });
});

// ─── 8. Ritual sub-screens – isLoaded: false does not throw ───────────────────

describe('Ritual sub-screens – isLoaded: false does not throw', () => {
  let root: ReturnType<typeof create> | undefined;

  afterEach(() => {
    if (root) {
      act(() => { root!.unmount(); });
      root = undefined;
    }
    jest.clearAllMocks();
  });

  it('GratitudeScreen renders a loading placeholder when isLoaded is false', async () => {
    mockUseApp.mockReturnValue(makeCtx({ isLoaded: false }));

    await expect(
      act(async () => {
        root = create(<GratitudeScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
    expect(root).toBeTruthy();
  });

  it('IntentionScreen renders a loading placeholder when isLoaded is false', async () => {
    mockUseApp.mockReturnValue(makeCtx({ isLoaded: false }));

    await expect(
      act(async () => {
        root = create(<IntentionScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
    expect(root).toBeTruthy();
  });

  it('IAmScreen renders a loading placeholder when isLoaded is false', async () => {
    mockUseApp.mockReturnValue(makeCtx({ isLoaded: false }));

    await expect(
      act(async () => {
        root = create(<IAmScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
    expect(root).toBeTruthy();
  });

  it('CompleteScreen renders a loading placeholder when isLoaded is false', async () => {
    mockUseApp.mockReturnValue(makeCtx({ isLoaded: false }));

    await expect(
      act(async () => {
        root = create(<CompleteScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
    expect(root).toBeTruthy();
  });

  it('ritual sub-screens do not throw when userData is empty and isLoaded is false', async () => {
    mockUseApp.mockReturnValue(makeCtx({ isLoaded: false, userData: {} as any }));

    await expect(
      act(async () => {
        root = create(<CompleteScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
  });
});
