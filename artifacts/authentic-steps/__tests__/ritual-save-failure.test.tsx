/**
 * Ritual sub-screen save-failure tests.
 *
 * Each ritual step (Gratitude, Intention, I Am statement) calls a save
 * function from AppContext and then navigates to the next step.  If that
 * save rejects — e.g. AsyncStorage quota exceeded — the screen must NOT
 * navigate away or display a false "completed" state.  These tests verify:
 *
 *   1. `router.push` is never called when the save rejects.
 *   2. A visible error message appears after the rejection.
 *   3. `saving` is reset to false (button is not permanently disabled).
 *
 * Follows the same module-mock pattern as screens-corrupted-data.test.tsx.
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

jest.mock('@/components/SOSButton', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SOSButton: () => React.createElement(View, { testID: 'sos-button' }),
  };
});

jest.mock('@/constants/affirmations', () => ({
  affirmations: [
    { id: 'a1', theme: 'confidence', text: 'I am capable and strong' },
    { id: 'a2', theme: 'confidence', text: 'I believe in myself' },
  ],
  THEME_LABELS: {
    confidence: 'Confidence',
    resilience: 'Resilience',
    relationships: 'Relationships',
    purpose: 'Purpose',
    calm: 'Calm',
  },
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import React from 'react';
import { TextInput } from 'react-native';
import { act, create } from 'react-test-renderer';
import { useApp } from '../context/AppContext';

import GratitudeScreen from '../app/ritual/gratitude';
import IntentionScreen from '../app/ritual/intention';
import IAmScreen from '../app/ritual/iamstatement';

// ─── Typed mock references ────────────────────────────────────────────────────

const mockUseApp = useApp as jest.Mock;
const mockRouter = (jest.requireMock('expo-router') as any).router;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function flushPromises(): Promise<void> {
  return new Promise(resolve => setImmediate(resolve));
}

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
    saveGratitude: jest.fn().mockResolvedValue(undefined),
    saveIntention: jest.fn().mockResolvedValue(undefined),
    saveIAmStatement: jest.fn().mockResolvedValue(undefined),
    saveGroundingSession: jest.fn().mockResolvedValue(undefined),
    deleteGroundingSession: jest.fn().mockResolvedValue(undefined),
    getStreakCalendar: jest.fn().mockReturnValue([]),
    toggleFavouriteTool: jest.fn().mockResolvedValue(undefined),
    isExerciseDoneToday: jest.fn().mockReturnValue(false),
    markExerciseDone: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

/** Find a node by testID in a rendered tree. */
function findByTestID(root: ReturnType<typeof create>, testID: string) {
  return root.root.findAll(
    (node: any) => node.props.testID === testID,
    { deep: true },
  )[0];
}

// ─── 1. GratitudeScreen ───────────────────────────────────────────────────────

describe('GratitudeScreen – rejected saveGratitude', () => {
  let root: ReturnType<typeof create> | undefined;

  beforeEach(() => {
    mockRouter.push.mockClear();
  });

  afterEach(() => {
    if (root) {
      act(() => { root!.unmount(); });
      root = undefined;
    }
    jest.clearAllMocks();
  });

  it('does not navigate when saveGratitude rejects', async () => {
    const saveGratitude = jest.fn().mockRejectedValue(new Error('AsyncStorage full'));
    mockUseApp.mockReturnValue(makeCtx({ saveGratitude }));

    await act(async () => {
      root = create(<GratitudeScreen />);
      await flushPromises();
    });

    const inputs = root!.root.findAllByType(TextInput);
    await act(async () => {
      inputs[0].props.onChangeText('I am grateful for sunshine');
      await flushPromises();
    });

    const continueBtn = findByTestID(root!, 'continue-btn');
    await act(async () => {
      await continueBtn.props.onPress();
      await flushPromises();
    });

    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('shows an error message when saveGratitude rejects', async () => {
    const saveGratitude = jest.fn().mockRejectedValue(new Error('AsyncStorage full'));
    mockUseApp.mockReturnValue(makeCtx({ saveGratitude }));

    await act(async () => {
      root = create(<GratitudeScreen />);
      await flushPromises();
    });

    const inputs = root!.root.findAllByType(TextInput);
    await act(async () => {
      inputs[0].props.onChangeText('I am grateful for fresh air');
      await flushPromises();
    });

    const continueBtn = findByTestID(root!, 'continue-btn');
    await act(async () => {
      await continueBtn.props.onPress();
      await flushPromises();
    });

    const errorNode = findByTestID(root!, 'save-error');
    expect(errorNode).toBeTruthy();
    expect(errorNode.props.children).toMatch(/try again/i);
  });

  it('re-enables the continue button after a failed save', async () => {
    const saveGratitude = jest.fn().mockRejectedValue(new Error('AsyncStorage full'));
    mockUseApp.mockReturnValue(makeCtx({ saveGratitude }));

    await act(async () => {
      root = create(<GratitudeScreen />);
      await flushPromises();
    });

    const inputs = root!.root.findAllByType(TextInput);
    await act(async () => {
      inputs[0].props.onChangeText('I am grateful for today');
      await flushPromises();
    });

    const continueBtn = findByTestID(root!, 'continue-btn');
    await act(async () => {
      await continueBtn.props.onPress();
      await flushPromises();
    });

    expect(findByTestID(root!, 'continue-btn').props.disabled).toBe(false);
  });

  it('navigates normally when saveGratitude resolves', async () => {
    const saveGratitude = jest.fn().mockResolvedValue(undefined);
    mockUseApp.mockReturnValue(makeCtx({ saveGratitude }));

    await act(async () => {
      root = create(<GratitudeScreen />);
      await flushPromises();
    });

    const inputs = root!.root.findAllByType(TextInput);
    await act(async () => {
      inputs[0].props.onChangeText('I am grateful for my family');
      await flushPromises();
    });

    const continueBtn = findByTestID(root!, 'continue-btn');
    await act(async () => {
      await continueBtn.props.onPress();
      await flushPromises();
    });

    expect(mockRouter.push).toHaveBeenCalledWith('/ritual/intention');
  });
});

// ─── 2. IntentionScreen ───────────────────────────────────────────────────────

describe('IntentionScreen – rejected saveIntention', () => {
  let root: ReturnType<typeof create> | undefined;

  beforeEach(() => {
    mockRouter.push.mockClear();
  });

  afterEach(() => {
    if (root) {
      act(() => { root!.unmount(); });
      root = undefined;
    }
    jest.clearAllMocks();
  });

  it('does not navigate when saveIntention rejects', async () => {
    const saveIntention = jest.fn().mockRejectedValue(new Error('AsyncStorage full'));
    mockUseApp.mockReturnValue(makeCtx({ saveIntention }));

    await act(async () => {
      root = create(<IntentionScreen />);
      await flushPromises();
    });

    const inputs = root!.root.findAllByType(TextInput);
    await act(async () => {
      inputs[0].props.onChangeText('Go for a walk outside');
      await flushPromises();
    });

    const continueBtn = findByTestID(root!, 'continue-btn');
    await act(async () => {
      await continueBtn.props.onPress();
      await flushPromises();
    });

    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('shows an error message when saveIntention rejects', async () => {
    const saveIntention = jest.fn().mockRejectedValue(new Error('AsyncStorage full'));
    mockUseApp.mockReturnValue(makeCtx({ saveIntention }));

    await act(async () => {
      root = create(<IntentionScreen />);
      await flushPromises();
    });

    const inputs = root!.root.findAllByType(TextInput);
    await act(async () => {
      inputs[0].props.onChangeText('Call a friend today');
      await flushPromises();
    });

    const continueBtn = findByTestID(root!, 'continue-btn');
    await act(async () => {
      await continueBtn.props.onPress();
      await flushPromises();
    });

    const errorNode = findByTestID(root!, 'save-error');
    expect(errorNode).toBeTruthy();
    expect(errorNode.props.children).toMatch(/try again/i);
  });

  it('re-enables the continue button after a failed save', async () => {
    const saveIntention = jest.fn().mockRejectedValue(new Error('AsyncStorage full'));
    mockUseApp.mockReturnValue(makeCtx({ saveIntention }));

    await act(async () => {
      root = create(<IntentionScreen />);
      await flushPromises();
    });

    const inputs = root!.root.findAllByType(TextInput);
    await act(async () => {
      inputs[0].props.onChangeText('Read for 20 minutes');
      await flushPromises();
    });

    const continueBtn = findByTestID(root!, 'continue-btn');
    await act(async () => {
      await continueBtn.props.onPress();
      await flushPromises();
    });

    expect(findByTestID(root!, 'continue-btn').props.disabled).toBe(false);
  });

  it('navigates normally when saveIntention resolves', async () => {
    const saveIntention = jest.fn().mockResolvedValue(undefined);
    mockUseApp.mockReturnValue(makeCtx({ saveIntention }));

    await act(async () => {
      root = create(<IntentionScreen />);
      await flushPromises();
    });

    const inputs = root!.root.findAllByType(TextInput);
    await act(async () => {
      inputs[0].props.onChangeText('Drink more water today');
      await flushPromises();
    });

    const continueBtn = findByTestID(root!, 'continue-btn');
    await act(async () => {
      await continueBtn.props.onPress();
      await flushPromises();
    });

    expect(mockRouter.push).toHaveBeenCalledWith('/ritual/iamstatement');
  });
});

// ─── 3. IAmScreen ─────────────────────────────────────────────────────────────

describe('IAmScreen – rejected saveIAmStatement', () => {
  let root: ReturnType<typeof create> | undefined;

  beforeEach(() => {
    mockRouter.push.mockClear();
  });

  afterEach(() => {
    if (root) {
      act(() => { root!.unmount(); });
      root = undefined;
    }
    jest.clearAllMocks();
  });

  it('does not navigate when saveIAmStatement rejects (library selection)', async () => {
    const saveIAmStatement = jest.fn().mockRejectedValue(new Error('AsyncStorage full'));
    mockUseApp.mockReturnValue(makeCtx({ saveIAmStatement }));

    await act(async () => {
      root = create(<IAmScreen />);
      await flushPromises();
    });

    const affirmationCards = root!.root.findAll(
      (node: any) => node.props.testID === undefined &&
        node.props.onPress !== undefined &&
        node.type !== undefined,
      { deep: true },
    );

    const statCards = root!.root.findAll(
      (node: any) =>
        node.props.onPress !== undefined &&
        node.props.testID !== 'continue-btn' &&
        node.props.testID !== 'confirm-btn',
      { deep: true },
    );

    await act(async () => {
      if (statCards.length > 0) {
        await statCards[0].props.onPress();
      }
      await flushPromises();
    });

    const confirmBtn = findByTestID(root!, 'confirm-btn');
    await act(async () => {
      await confirmBtn.props.onPress();
      await flushPromises();
    });

    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('does not navigate when saveIAmStatement rejects (custom text)', async () => {
    const saveIAmStatement = jest.fn().mockRejectedValue(new Error('AsyncStorage full'));
    mockUseApp.mockReturnValue(makeCtx({ saveIAmStatement }));

    await act(async () => {
      root = create(<IAmScreen />);
      await flushPromises();
    });

    const modeBtns = root!.root.findAll(
      (node: any) =>
        node.props.onPress !== undefined &&
        node.props.testID === undefined,
      { deep: true },
    );
    await act(async () => {
      const customModeBtn = modeBtns.find((n: any) => {
        const children = n.props.children;
        return Array.isArray(children)
          ? children.some((c: any) => typeof c?.props?.children === 'string' && c.props.children.includes('Write'))
          : typeof children?.props?.children === 'string' && children.props.children.includes('Write');
      });
      if (customModeBtn) await customModeBtn.props.onPress();
      await flushPromises();
    });

    const inputs = root!.root.findAllByType(TextInput);
    await act(async () => {
      if (inputs.length > 0) {
        inputs[0].props.onChangeText('worthy of love');
      }
      await flushPromises();
    });

    const confirmBtn = findByTestID(root!, 'confirm-btn');
    await act(async () => {
      await confirmBtn.props.onPress();
      await flushPromises();
    });

    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('shows an error message when saveIAmStatement rejects (custom text)', async () => {
    const saveIAmStatement = jest.fn().mockRejectedValue(new Error('AsyncStorage full'));
    mockUseApp.mockReturnValue(makeCtx({ saveIAmStatement }));

    await act(async () => {
      root = create(<IAmScreen />);
      await flushPromises();
    });

    const modeBtns = root!.root.findAll(
      (node: any) =>
        node.props.onPress !== undefined &&
        node.props.testID === undefined,
      { deep: true },
    );
    await act(async () => {
      const customModeBtn = modeBtns.find((n: any) => {
        const children = n.props.children;
        return Array.isArray(children)
          ? children.some((c: any) => typeof c?.props?.children === 'string' && c.props.children.includes('Write'))
          : typeof children?.props?.children === 'string' && children.props.children.includes('Write');
      });
      if (customModeBtn) await customModeBtn.props.onPress();
      await flushPromises();
    });

    const inputs = root!.root.findAllByType(TextInput);
    await act(async () => {
      if (inputs.length > 0) {
        inputs[0].props.onChangeText('enough and I am growing');
      }
      await flushPromises();
    });

    const confirmBtn = findByTestID(root!, 'confirm-btn');
    await act(async () => {
      await confirmBtn.props.onPress();
      await flushPromises();
    });

    const errorNode = findByTestID(root!, 'save-error');
    expect(errorNode).toBeTruthy();
    expect(errorNode.props.children).toMatch(/try again/i);
  });

  it('navigates normally when saveIAmStatement resolves (custom text)', async () => {
    const saveIAmStatement = jest.fn().mockResolvedValue(undefined);
    mockUseApp.mockReturnValue(makeCtx({ saveIAmStatement }));

    await act(async () => {
      root = create(<IAmScreen />);
      await flushPromises();
    });

    const modeBtns = root!.root.findAll(
      (node: any) =>
        node.props.onPress !== undefined &&
        node.props.testID === undefined,
      { deep: true },
    );
    await act(async () => {
      const customModeBtn = modeBtns.find((n: any) => {
        const children = n.props.children;
        return Array.isArray(children)
          ? children.some((c: any) => typeof c?.props?.children === 'string' && c.props.children.includes('Write'))
          : typeof children?.props?.children === 'string' && children.props.children.includes('Write');
      });
      if (customModeBtn) await customModeBtn.props.onPress();
      await flushPromises();
    });

    const inputs = root!.root.findAllByType(TextInput);
    await act(async () => {
      if (inputs.length > 0) {
        inputs[0].props.onChangeText('resilient and ready');
      }
      await flushPromises();
    });

    const confirmBtn = findByTestID(root!, 'confirm-btn');
    await act(async () => {
      await confirmBtn.props.onPress();
      await flushPromises();
    });

    expect(mockRouter.push).toHaveBeenCalledWith('/ritual/complete');
  });
});
