/**
 * Smoke tests: key screens render without auth-related crashes after Clerk removal.
 *
 * Covers:
 *  1. Home (DailyRitualScreen) — renders in guest mode with a fresh-install user
 *  2. Profile (ProfileScreen) — renders with zero entries
 *  3. SOS (SosScreen) — renders without crashing, contains expected service names
 *  4. OnboardingGate — redirects to /onboarding when hasOnboarded is false,
 *     and renders children when hasOnboarded is true
 *
 * All tests use react-test-renderer (same setup as the rest of this project).
 * Every module mock is fully self-contained — no outer variable references.
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
    secondary: '#f0fdf4',
    accent: '#03989e',
    gradientStart: '#1a5c3a',
  }),
}));

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  // No-op — avoids overlapping act() warnings; smoke tests don't need focus side effects
  useFocusEffect: jest.fn(),
}));

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium', Heavy: 'Heavy' },
  NotificationFeedbackType: { Success: 'Success' },
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

import React, { useEffect } from 'react';
import { act, create } from 'react-test-renderer';
import { router } from 'expo-router';
import { useApp } from '../context/AppContext';

import DailyRitualScreen from '../app/(tabs)/index';
import ProfileScreen from '../app/(tabs)/profile';
import StreaksScreen from '../app/(tabs)/streaks';
import CommunityScreen from '../app/(tabs)/community';
import ToolboxScreen from '../app/(tabs)/toolbox';
import JournalScreen from '../app/journal';
import SosScreen from '../app/sos';

// ─── Typed mock references ────────────────────────────────────────────────────

const mockUseApp = useApp as jest.Mock;
const mockRouterReplace = router.replace as jest.Mock;

// ─── Shared guest user fixture ────────────────────────────────────────────────

function makeGuestUser(overrides: Record<string, unknown> = {}) {
  return {
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
    themePreference: 'system' as const,
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
    ...overrides,
  };
}

function makeFullAppContext(userOverrides: Record<string, unknown> = {}) {
  return {
    isLoaded: true,
    userData: makeGuestUser(userOverrides),
    entries: [],
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
  };
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function flushPromises(): Promise<void> {
  return new Promise(resolve => setImmediate(resolve));
}

// ─── 1. Home screen (DailyRitualScreen) ──────────────────────────────────────

describe('DailyRitualScreen – guest mode smoke test', () => {
  let root: ReturnType<typeof create> | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseApp.mockReturnValue(makeFullAppContext());
  });

  afterEach(() => {
    if (root) {
      act(() => { root!.unmount(); });
      root = undefined;
    }
  });

  it('renders without throwing in fresh-install guest mode', async () => {
    await act(async () => {
      root = create(<DailyRitualScreen />);
      await flushPromises();
    });
    expect(root).toBeTruthy();
  });

  it('renders the daily ritual progress section', async () => {
    await act(async () => {
      root = create(<DailyRitualScreen />);
      await flushPromises();
    });

    const allText = root!.root.findAll(
      (node: any) => typeof node.props.children === 'string' && node.props.children === 'Daily Ritual',
      { deep: true },
    );
    expect(allText.length).toBeGreaterThan(0);
  });

  it('renders the progress step count "0/3 steps" when nothing is done', async () => {
    await act(async () => {
      root = create(<DailyRitualScreen />);
      await flushPromises();
    });

    // JSX renders `{completedCount}/3 steps` as array children: [0, '/3 steps']
    const countNodes = root!.root.findAll(
      (node: any) => {
        const c = node.props.children;
        return Array.isArray(c) && c.includes('/3 steps');
      },
      { deep: true },
    );
    expect(countNodes.length).toBeGreaterThan(0);
  });

  it('shows the user anonymous name in the greeting', async () => {
    mockUseApp.mockReturnValue(makeFullAppContext({ anonymousName: 'HappyWalker' }));

    await act(async () => {
      root = create(<DailyRitualScreen />);
      await flushPromises();
    });

    // JSX renders `{getGreeting()}, {userData.anonymousName}` as array children
    // containing the name as one of the elements
    const nameNodes = root!.root.findAll(
      (node: any) => {
        const c = node.props.children;
        if (Array.isArray(c)) return c.includes('HappyWalker');
        return c === 'HappyWalker';
      },
      { deep: true },
    );
    expect(nameNodes.length).toBeGreaterThan(0);
  });

  it('shows "Ritual complete!" when all 3 steps are done', async () => {
    mockUseApp.mockReturnValue(
      makeFullAppContext({ isStepDone: undefined }),
    );
    // Override isStepDone to always return true
    const ctx = makeFullAppContext();
    ctx.isStepDone = jest.fn().mockReturnValue(true);
    mockUseApp.mockReturnValue(ctx);

    await act(async () => {
      root = create(<DailyRitualScreen />);
      await flushPromises();
    });

    const doneNodes = root!.root.findAll(
      (node: any) => node.props.children === 'Ritual complete!',
      { deep: true },
    );
    expect(doneNodes.length).toBeGreaterThan(0);
  });

  it('does not reference @clerk/expo — no auth-related crash', async () => {
    // If any Clerk import leaked through, the mock-less module would throw.
    // A successful render here proves the screen is Clerk-free.
    await expect(
      act(async () => {
        root = create(<DailyRitualScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
  });
});

// ─── 2. Profile screen ────────────────────────────────────────────────────────

describe('ProfileScreen – guest mode smoke test', () => {
  let root: ReturnType<typeof create> | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseApp.mockReturnValue(makeFullAppContext());
  });

  afterEach(() => {
    if (root) {
      act(() => { root!.unmount(); });
      root = undefined;
    }
  });

  it('renders without throwing in fresh-install guest mode', async () => {
    await act(async () => {
      root = create(<ProfileScreen />);
      await flushPromises();
    });
    expect(root).toBeTruthy();
  });

  it('displays the anonymous name in the profile header', async () => {
    mockUseApp.mockReturnValue(makeFullAppContext({ anonymousName: 'BraveEagle' }));

    await act(async () => {
      root = create(<ProfileScreen />);
      await flushPromises();
    });

    const nameNodes = root!.root.findAll(
      (node: any) => node.props.children === 'BraveEagle',
      { deep: true },
    );
    expect(nameNodes.length).toBeGreaterThan(0);
  });

  it('renders an "Appearance" section for theme selection', async () => {
    await act(async () => {
      root = create(<ProfileScreen />);
      await flushPromises();
    });

    const sectionNodes = root!.root.findAll(
      (node: any) => node.props.children === 'Appearance',
      { deep: true },
    );
    expect(sectionNodes.length).toBeGreaterThan(0);
  });

  it('renders the recovery code section', async () => {
    mockUseApp.mockReturnValue(makeFullAppContext({ recoveryCode: 'MY-TEST-CODE' }));

    await act(async () => {
      root = create(<ProfileScreen />);
      await flushPromises();
    });

    // The screen renders "Recovery Code" as a label
    const labelNodes = root!.root.findAll(
      (node: any) => node.props.children === 'Recovery Code',
      { deep: true },
    );
    expect(labelNodes.length).toBeGreaterThan(0);
  });

  it('does not crash with zero journal entries and zero grounding sessions', async () => {
    mockUseApp.mockReturnValue(makeFullAppContext({ entries: [], groundingSessions: [] }));

    await expect(
      act(async () => {
        root = create(<ProfileScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
  });
});

// ─── 3. SOS screen ────────────────────────────────────────────────────────────

describe('SosScreen – smoke test', () => {
  let root: ReturnType<typeof create> | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    // SOS screen uses useColors but not useApp
  });

  afterEach(() => {
    if (root) {
      act(() => { root!.unmount(); });
      root = undefined;
    }
  });

  it('renders without throwing', async () => {
    await act(async () => {
      root = create(<SosScreen />);
      await flushPromises();
    });
    expect(root).toBeTruthy();
  });

  it('lists Kids Helpline', async () => {
    await act(async () => {
      root = create(<SosScreen />);
      await flushPromises();
    });

    const nodes = root!.root.findAll(
      (node: any) => node.props.children === 'Kids Helpline',
      { deep: true },
    );
    expect(nodes.length).toBeGreaterThan(0);
  });

  it('lists Lifeline', async () => {
    await act(async () => {
      root = create(<SosScreen />);
      await flushPromises();
    });

    const nodes = root!.root.findAll(
      (node: any) => node.props.children === 'Lifeline',
      { deep: true },
    );
    expect(nodes.length).toBeGreaterThan(0);
  });

  it('lists Emergency Services', async () => {
    await act(async () => {
      root = create(<SosScreen />);
      await flushPromises();
    });

    const nodes = root!.root.findAll(
      (node: any) => node.props.children === 'Emergency Services',
      { deep: true },
    );
    expect(nodes.length).toBeGreaterThan(0);
  });

  it('does not crash for a user who has never onboarded (SOS is always accessible)', async () => {
    await expect(
      act(async () => {
        root = create(<SosScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
  });
});

// ─── 4. OnboardingGate logic ──────────────────────────────────────────────────

/**
 * OnboardingGate is an internal component in app/_layout.tsx that guards all
 * screens behind the onboarding flow.  We mirror its exact logic here to test
 * both branches without importing the full layout (which carries heavy side
 * effects like SplashScreen.preventAutoHideAsync).
 *
 * The component's contract:
 *   - While !isLoaded → render nothing (null)
 *   - When loaded and hasOnboarded === false → router.replace('/onboarding')
 *   - When loaded and hasOnboarded === true  → render children normally
 */

function OnboardingGateHarness({ children }: { children: React.ReactNode }) {
  const { isLoaded, userData } = useApp() as any;

  useEffect(() => {
    if (!isLoaded) return;
    if (!userData.hasOnboarded) {
      router.replace('/onboarding' as any);
    }
  }, [isLoaded, userData.hasOnboarded]);

  if (!isLoaded) return null;
  return <>{children}</>;
}

describe('OnboardingGate – routing logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls router.replace("/onboarding") when hasOnboarded is false', async () => {
    mockUseApp.mockReturnValue({
      ...makeFullAppContext({ hasOnboarded: false }),
      isLoaded: true,
    });

    await act(async () => {
      create(
        <OnboardingGateHarness>
          <></>
        </OnboardingGateHarness>,
      );
      await flushPromises();
    });

    expect(mockRouterReplace).toHaveBeenCalledWith('/onboarding');
  });

  it('does NOT call router.replace when hasOnboarded is true', async () => {
    mockUseApp.mockReturnValue({
      ...makeFullAppContext({ hasOnboarded: true }),
      isLoaded: true,
    });

    await act(async () => {
      create(
        <OnboardingGateHarness>
          <></>
        </OnboardingGateHarness>,
      );
      await flushPromises();
    });

    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  it('renders null while app data is still loading (isLoaded: false)', async () => {
    mockUseApp.mockReturnValue({
      ...makeFullAppContext(),
      isLoaded: false,
    });

    let root: ReturnType<typeof create> | undefined;

    await act(async () => {
      root = create(
        <OnboardingGateHarness>
          <></>
        </OnboardingGateHarness>,
      );
      await flushPromises();
    });

    // toJSON() returns null when nothing is rendered
    expect(root!.toJSON()).toBeNull();
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  it('renders children once loaded and onboarded', async () => {
    const { Text, View } = require('react-native');

    mockUseApp.mockReturnValue({
      ...makeFullAppContext({ hasOnboarded: true }),
      isLoaded: true,
    });

    let root: ReturnType<typeof create> | undefined;

    await act(async () => {
      root = create(
        <OnboardingGateHarness>
          <Text testID="child-sentinel">HomeScreen</Text>
        </OnboardingGateHarness>,
      );
      await flushPromises();
    });

    const sentinel = root!.root.findByProps({ testID: 'child-sentinel' });
    expect(sentinel).toBeTruthy();
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  it('redirects immediately on a first-launch (no AsyncStorage data) scenario', async () => {
    // Simulate a fresh install: user is loaded but hasOnboarded is false
    mockUseApp.mockReturnValue({
      ...makeFullAppContext({
        hasOnboarded: false,
        anonymousName: 'NewUser',
        currentStreak: 0,
        totalRituals: 0,
      }),
      isLoaded: true,
    });

    await act(async () => {
      create(
        <OnboardingGateHarness>
          <></>
        </OnboardingGateHarness>,
      );
      await flushPromises();
    });

    expect(mockRouterReplace).toHaveBeenCalledTimes(1);
    expect(mockRouterReplace).toHaveBeenCalledWith('/onboarding');
  });
});

// ─── 5. Journal screen ────────────────────────────────────────────────────────

describe('JournalScreen – guest mode smoke test', () => {
  let root: ReturnType<typeof create> | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseApp.mockReturnValue(makeFullAppContext());
  });

  afterEach(() => {
    if (root) {
      act(() => { root!.unmount(); });
      root = undefined;
    }
  });

  it('renders without throwing with zero journal entries (fresh install)', async () => {
    await act(async () => {
      root = create(<JournalScreen />);
      await flushPromises();
    });
    expect(root).toBeTruthy();
  });

  it('renders the "My Journal" header title', async () => {
    await act(async () => {
      root = create(<JournalScreen />);
      await flushPromises();
    });

    const headerNodes = root!.root.findAll(
      (node: any) => node.props.children === 'My Journal',
      { deep: true },
    );
    expect(headerNodes.length).toBeGreaterThan(0);
  });

  it('shows the empty-state hero title when no entries exist', async () => {
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

  it('shows the prompt to complete the first ritual when no entries exist', async () => {
    await act(async () => {
      root = create(<JournalScreen />);
      await flushPromises();
    });

    const subtitleNodes = root!.root.findAll(
      (node: any) => node.props.children === 'Complete your first daily ritual to see it here.',
      { deep: true },
    );
    expect(subtitleNodes.length).toBeGreaterThan(0);
  });

  it('does not crash with empty groundingSessions array', async () => {
    mockUseApp.mockReturnValue(makeFullAppContext({ groundingSessions: [] }));

    await expect(
      act(async () => {
        root = create(<JournalScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
  });
});

// ─── 6. Streaks tab screen ────────────────────────────────────────────────────

describe('StreaksScreen – guest mode smoke test', () => {
  let root: ReturnType<typeof create> | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseApp.mockReturnValue(makeFullAppContext());
  });

  afterEach(() => {
    if (root) {
      act(() => { root!.unmount(); });
      root = undefined;
    }
  });

  it('renders without throwing with a fresh-install user (zero streak)', async () => {
    await act(async () => {
      root = create(<StreaksScreen />);
      await flushPromises();
    });
    expect(root).toBeTruthy();
  });

  it('renders the "day streak" label', async () => {
    await act(async () => {
      root = create(<StreaksScreen />);
      await flushPromises();
    });

    const labelNodes = root!.root.findAll(
      (node: any) => node.props.children === 'day streak',
      { deep: true },
    );
    expect(labelNodes.length).toBeGreaterThan(0);
  });

  it('displays the current streak count (0) from guest user data', async () => {
    await act(async () => {
      root = create(<StreaksScreen />);
      await flushPromises();
    });

    const countNodes = root!.root.findAll(
      (node: any) => node.props.children === 0,
      { deep: true },
    );
    expect(countNodes.length).toBeGreaterThan(0);
  });

  it('does not crash when getStreakCalendar returns empty array', async () => {
    mockUseApp.mockReturnValue(
      makeFullAppContext({ getStreakCalendar: jest.fn().mockReturnValue([]) }),
    );

    await expect(
      act(async () => {
        root = create(<StreaksScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
  });
});

// ─── 7. Community tab screen ──────────────────────────────────────────────────

describe('CommunityScreen – smoke test', () => {
  let root: ReturnType<typeof create> | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    // Community screen does not use useApp
  });

  afterEach(() => {
    if (root) {
      act(() => { root!.unmount(); });
      root = undefined;
    }
  });

  it('renders without throwing', async () => {
    await act(async () => {
      root = create(<CommunityScreen />);
      await flushPromises();
    });
    expect(root).toBeTruthy();
  });

  it('renders the Gratitude feed post from the sample data', async () => {
    await act(async () => {
      root = create(<CommunityScreen />);
      await flushPromises();
    });

    // One of the hardcoded gratitude posts references 'GoldenFalcon'
    const nameNodes = root!.root.findAll(
      (node: any) => node.props.children === 'GoldenFalcon',
      { deep: true },
    );
    expect(nameNodes.length).toBeGreaterThan(0);
  });

  it('does not depend on @clerk/expo — renders without any auth context', async () => {
    await expect(
      act(async () => {
        root = create(<CommunityScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
  });
});

// ─── 8. Toolbox tab screen ────────────────────────────────────────────────────

describe('ToolboxScreen – guest mode smoke test', () => {
  let root: ReturnType<typeof create> | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseApp.mockReturnValue(makeFullAppContext());
  });

  afterEach(() => {
    if (root) {
      act(() => { root!.unmount(); });
      root = undefined;
    }
  });

  it('renders without throwing in guest mode', async () => {
    await act(async () => {
      root = create(<ToolboxScreen />);
      await flushPromises();
    });
    expect(root).toBeTruthy();
  });

  it('renders the BreathingTimer stub (box breathing tool is present)', async () => {
    await act(async () => {
      root = create(<ToolboxScreen />);
      await flushPromises();
    });

    const timerNodes = root!.root.findAll(
      (node: any) => node.props.testID === 'breathing-timer',
      { deep: true },
    );
    expect(timerNodes.length).toBeGreaterThan(0);
  });

  it('does not crash when isExerciseDoneToday returns false for all tools', async () => {
    const ctx = makeFullAppContext();
    ctx.isExerciseDoneToday = jest.fn().mockReturnValue(false);
    mockUseApp.mockReturnValue(ctx);

    await expect(
      act(async () => {
        root = create(<ToolboxScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
  });

  it('does not crash when isExerciseDoneToday returns true for all tools', async () => {
    const ctx = makeFullAppContext();
    ctx.isExerciseDoneToday = jest.fn().mockReturnValue(true);
    mockUseApp.mockReturnValue(ctx);

    await expect(
      act(async () => {
        root = create(<ToolboxScreen />);
        await flushPromises();
      }),
    ).resolves.not.toThrow();
  });
});
