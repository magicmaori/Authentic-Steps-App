/**
 * Tests for AppContext:
 *  1. Migration path: when AsyncStorage lacks ritualHour/eveningHour the values
 *     are read from the OS scheduler and written back to AsyncStorage.
 *  2. Chime persistence: toggling chimeEnabled via setChimeEnabled survives a
 *     simulated unmount/remount cycle (i.e. across cold starts).
 *
 * NOTE: jest.mock() is hoisted before variable declarations, so factory
 * functions must be self-contained. We get typed references to mock functions
 * via the mocked module imports after the jest.mock calls.
 */

// ─── Module mocks (must be fully self-contained — no outer variable refs) ────

jest.mock('@react-native-async-storage/async-storage', () => {
  const store: Record<string, string> = {};
  return {
    __store: store,
    getItem: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
      return Promise.resolve();
    }),
    multiRemove: jest.fn((keys: string[]) => {
      keys.forEach(k => delete store[k]);
      return Promise.resolve();
    }),
  };
});

jest.mock('@/utils/notifications', () => ({
  getScheduledReminderTimes: jest.fn().mockResolvedValue({}),
  scheduleRitualReminder: jest.fn().mockResolvedValue(undefined),
  scheduleEveningReminder: jest.fn().mockResolvedValue(undefined),
  getPermissionState: jest.fn().mockResolvedValue('undetermined'),
  setupAndroidChannel: jest.fn().mockResolvedValue(undefined),
  cancelAllReminders: jest.fn().mockResolvedValue(undefined),
  fireMilestoneNotification: jest.fn().mockResolvedValue(undefined),
  requestPermission: jest.fn().mockResolvedValue(true),
}));

jest.mock('expo-constants', () => ({
  default: { expoConfig: { extra: { apiBaseUrl: '' } } },
}));

jest.mock('@/constants/affirmations', () => ({
  generateAnonymousName: () => 'TestUser',
}));

jest.mock('fflate', () => ({
  deflateSync: (data: Uint8Array) => data,
  decompressSync: (data: Uint8Array) => data,
  strToU8: (s: string) => Buffer.from(s),
  strFromU8: (u: Uint8Array) => Buffer.from(u).toString('utf-8'),
}));

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
  },
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import React, { useEffect } from 'react';
import { act, create } from 'react-test-renderer';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import * as notificationUtils from '@/utils/notifications';
import { AppProvider, useApp, type RestoreResult } from '../context/AppContext';

// ─── Typed mock references ────────────────────────────────────────────────────

const mockGetScheduledReminderTimes = notificationUtils.getScheduledReminderTimes as jest.Mock;

// Access the in-memory store through the mock module's __store property
const asyncStore = (AsyncStorage as unknown as { __store: Record<string, string> }).__store;

const STORAGE_KEY_USER = '@authentic_steps_user';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function flushPromises(): Promise<void> {
  return new Promise(resolve => setImmediate(resolve));
}

/** Serialised user object stored in AsyncStorage by an old install — no time fields. */
function makeStoredUser(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    anonymousName: 'TestUser',
    currentStreak: 0,
    longestStreak: 0,
    totalRituals: 5,
    streakFreezes: 0,
    flexDaysUsedThisWeek: 0,
    milestones: [],
    totalEncouragements: 0,
    lastCheckIn: '',
    lastFlexWeek: '',
    hasOnboarded: true,
    themePreference: 'system',
    recoveryCode: 'TEST-CODE-1234',
    favouriteTools: [],
    notifRitual: true,
    notifEvening: true,
    notifMilestone: true,
    chimeEnabled: true,
    ...overrides,
  });
}

function clearStore() {
  Object.keys(asyncStore).forEach(k => delete asyncStore[k]);
  (AsyncStorage.setItem as jest.Mock).mockClear();
  (AsyncStorage.getItem as jest.Mock).mockClear();
}

// ─── Migration tests ──────────────────────────────────────────────────────────

describe('AppContext – reminder-time migration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearStore();
    (notificationUtils.getPermissionState as jest.Mock).mockResolvedValue('undetermined');
  });

  it('reads times from the OS scheduler and writes them back when ritualHour is absent', async () => {
    asyncStore[STORAGE_KEY_USER] = makeStoredUser();

    mockGetScheduledReminderTimes.mockResolvedValue({
      ritualHour: 7,
      ritualMinute: 45,
      eveningHour: 21,
      eveningMinute: 30,
    });

    let capturedUserData: Record<string, unknown> | null = null;

    function Consumer() {
      const { userData, isLoaded } = useApp();
      useEffect(() => {
        if (isLoaded) capturedUserData = userData as unknown as Record<string, unknown>;
      }, [isLoaded, userData]);
      return null;
    }

    await act(async () => {
      create(
        <AppProvider>
          <Consumer />
        </AppProvider>,
      );
      await flushPromises();
    });

    expect(mockGetScheduledReminderTimes).toHaveBeenCalledTimes(1);

    const snapshot = capturedUserData as Record<string, unknown> | null;
    expect(snapshot?.ritualHour).toBe(7);
    expect(snapshot?.ritualMinute).toBe(45);
    expect(snapshot?.eveningHour).toBe(21);
    expect(snapshot?.eveningMinute).toBe(30);

    const writeCalls = (AsyncStorage.setItem as jest.Mock).mock.calls.filter(
      ([key]: [string]) => key === STORAGE_KEY_USER,
    );
    expect(writeCalls.length).toBeGreaterThan(0);
    const lastWrite = JSON.parse(writeCalls[writeCalls.length - 1][1] as string);
    expect(lastWrite.ritualHour).toBe(7);
    expect(lastWrite.ritualMinute).toBe(45);
    expect(lastWrite.eveningHour).toBe(21);
    expect(lastWrite.eveningMinute).toBe(30);
  });

  it('does NOT call getScheduledReminderTimes when times are already stored', async () => {
    asyncStore[STORAGE_KEY_USER] = makeStoredUser({
      ritualHour: 9,
      ritualMinute: 0,
      eveningHour: 20,
      eveningMinute: 0,
    });

    await act(async () => {
      create(
        <AppProvider>
          <></>
        </AppProvider>,
      );
      await flushPromises();
    });

    expect(mockGetScheduledReminderTimes).not.toHaveBeenCalled();
  });

  it('falls back to in-code defaults when the OS scheduler returns nothing', async () => {
    asyncStore[STORAGE_KEY_USER] = makeStoredUser();
    mockGetScheduledReminderTimes.mockResolvedValue({});

    let capturedUserData: Record<string, unknown> | null = null;

    function Consumer() {
      const { userData, isLoaded } = useApp();
      useEffect(() => {
        if (isLoaded) capturedUserData = userData as unknown as Record<string, unknown>;
      }, [isLoaded, userData]);
      return null;
    }

    await act(async () => {
      create(
        <AppProvider>
          <Consumer />
        </AppProvider>,
      );
      await flushPromises();
    });

    const snapshot = capturedUserData as Record<string, unknown> | null;
    expect(snapshot?.ritualHour).toBe(9);
    expect(snapshot?.ritualMinute).toBe(0);
    expect(snapshot?.eveningHour).toBe(20);
    expect(snapshot?.eveningMinute).toBe(0);
  });
});

// ─── Chime persistence tests ──────────────────────────────────────────────────

describe('AppContext – chime persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearStore();
    (notificationUtils.getPermissionState as jest.Mock).mockResolvedValue('undetermined');
    mockGetScheduledReminderTimes.mockResolvedValue({
      ritualHour: 9,
      ritualMinute: 0,
      eveningHour: 20,
      eveningMinute: 0,
    });
  });

  it('persists chimeEnabled=false to AsyncStorage when toggled off', async () => {
    asyncStore[STORAGE_KEY_USER] = makeStoredUser({
      ritualHour: 9,
      ritualMinute: 0,
      eveningHour: 20,
      eveningMinute: 0,
      chimeEnabled: true,
    });

    let toggle: ((v: boolean) => Promise<void>) | null = null;

    function Consumer() {
      const { setChimeEnabled } = useApp();
      useEffect(() => { toggle = setChimeEnabled; }, [setChimeEnabled]);
      return null;
    }

    await act(async () => {
      create(<AppProvider><Consumer /></AppProvider>);
      await flushPromises();
    });

    await act(async () => {
      await toggle!(false);
      await flushPromises();
    });

    const writeCalls = (AsyncStorage.setItem as jest.Mock).mock.calls.filter(
      ([key]: [string]) => key === STORAGE_KEY_USER,
    );
    expect(writeCalls.length).toBeGreaterThan(0);
    const lastWrite = JSON.parse(writeCalls[writeCalls.length - 1][1] as string);
    expect(lastWrite.chimeEnabled).toBe(false);
  });

  it('loads persisted chimeEnabled=false on fresh mount (upgrade simulation)', async () => {
    asyncStore[STORAGE_KEY_USER] = makeStoredUser({
      ritualHour: 9,
      ritualMinute: 0,
      eveningHour: 20,
      eveningMinute: 0,
      chimeEnabled: false,
    });

    let captured: boolean | null = null;

    function Consumer() {
      const { userData, isLoaded } = useApp();
      useEffect(() => {
        if (isLoaded) captured = userData.chimeEnabled;
      }, [isLoaded, userData.chimeEnabled]);
      return null;
    }

    await act(async () => {
      create(<AppProvider><Consumer /></AppProvider>);
      await flushPromises();
    });

    expect(captured).toBe(false);
  });

  it('toggling chime off then re-mounting reads back false', async () => {
    asyncStore[STORAGE_KEY_USER] = makeStoredUser({
      ritualHour: 9,
      ritualMinute: 0,
      eveningHour: 20,
      eveningMinute: 0,
      chimeEnabled: true,
    });

    let toggle: ((v: boolean) => Promise<void>) | null = null;

    function FirstMount() {
      const { setChimeEnabled } = useApp();
      useEffect(() => { toggle = setChimeEnabled; }, [setChimeEnabled]);
      return null;
    }

    await act(async () => {
      create(<AppProvider><FirstMount /></AppProvider>);
      await flushPromises();
    });

    await act(async () => {
      await toggle!(false);
      await flushPromises();
    });

    let capturedAfterRemount: boolean | null = null;

    function SecondMount() {
      const { userData, isLoaded } = useApp();
      useEffect(() => {
        if (isLoaded) capturedAfterRemount = userData.chimeEnabled;
      }, [isLoaded, userData.chimeEnabled]);
      return null;
    }

    await act(async () => {
      create(<AppProvider><SecondMount /></AppProvider>);
      await flushPromises();
    });

    expect(capturedAfterRemount).toBe(false);
  });
});

// ─── restoreFromCode notification-settings tests ──────────────────────────────

describe('AppContext – restoreFromCode notification settings', () => {
  const mockScheduleRitual = notificationUtils.scheduleRitualReminder as jest.Mock;
  const mockScheduleEvening = notificationUtils.scheduleEveningReminder as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    clearStore();
    (notificationUtils.getPermissionState as jest.Mock).mockResolvedValue('undetermined');
    mockGetScheduledReminderTimes.mockResolvedValue({});
  });

  it('preserves custom reminder times and chimeEnabled=false in AsyncStorage after restoreFromCode', async () => {
    asyncStore[STORAGE_KEY_USER] = makeStoredUser({
      ritualHour: 7,
      ritualMinute: 30,
      eveningHour: 22,
      eveningMinute: 15,
      chimeEnabled: false,
      notifRitual: true,
      notifEvening: true,
    });

    let buildPayload: (() => string) | null = null;
    let restore: ((code: string) => Promise<RestoreResult>) | null = null;

    function Consumer() {
      const { buildRecoveryPayload, restoreFromCode, isLoaded } = useApp();
      useEffect(() => {
        if (isLoaded) {
          buildPayload = buildRecoveryPayload;
          restore = restoreFromCode;
        }
      }, [isLoaded, buildRecoveryPayload, restoreFromCode]);
      return null;
    }

    await act(async () => {
      create(<AppProvider><Consumer /></AppProvider>);
      await flushPromises();
    });

    const code = buildPayload!();

    (AsyncStorage.setItem as jest.Mock).mockClear();

    let result: RestoreResult | null = null;
    await act(async () => {
      result = await restore!(code);
      await flushPromises();
    });

    expect(result).toEqual({ ok: true });

    const writeCalls = (AsyncStorage.setItem as jest.Mock).mock.calls.filter(
      ([key]: [string]) => key === STORAGE_KEY_USER,
    );
    expect(writeCalls.length).toBeGreaterThan(0);
    const lastWrite = JSON.parse(writeCalls[writeCalls.length - 1][1] as string);
    expect(lastWrite.ritualHour).toBe(7);
    expect(lastWrite.ritualMinute).toBe(30);
    expect(lastWrite.eveningHour).toBe(22);
    expect(lastWrite.eveningMinute).toBe(15);
    expect(lastWrite.chimeEnabled).toBe(false);
  });

  it('calls scheduleRitualReminder and scheduleEveningReminder with restored times when permission is granted', async () => {
    asyncStore[STORAGE_KEY_USER] = makeStoredUser({
      ritualHour: 6,
      ritualMinute: 45,
      eveningHour: 21,
      eveningMinute: 0,
      chimeEnabled: false,
      notifRitual: true,
      notifEvening: true,
    });

    let buildPayload: (() => string) | null = null;
    let restore: ((code: string) => Promise<RestoreResult>) | null = null;

    function Consumer() {
      const { buildRecoveryPayload, restoreFromCode, isLoaded } = useApp();
      useEffect(() => {
        if (isLoaded) {
          buildPayload = buildRecoveryPayload;
          restore = restoreFromCode;
        }
      }, [isLoaded, buildRecoveryPayload, restoreFromCode]);
      return null;
    }

    await act(async () => {
      create(<AppProvider><Consumer /></AppProvider>);
      await flushPromises();
    });

    const code = buildPayload!();

    (notificationUtils.getPermissionState as jest.Mock).mockResolvedValue('granted');
    mockScheduleRitual.mockClear();
    mockScheduleEvening.mockClear();

    await act(async () => {
      await restore!(code);
      await flushPromises();
    });

    expect(mockScheduleRitual).toHaveBeenCalledWith(true, 6, 45);
    expect(mockScheduleEvening).toHaveBeenCalledWith(true, 21, 0);
  });

  it('does not corrupt notification settings when restoring on top of a fresh install', async () => {
    asyncStore[STORAGE_KEY_USER] = makeStoredUser({
      ritualHour: 8,
      ritualMinute: 0,
      eveningHour: 20,
      eveningMinute: 30,
      chimeEnabled: false,
    });

    let buildPayload: (() => string) | null = null;
    let restore: ((code: string) => Promise<RestoreResult>) | null = null;

    function First() {
      const { buildRecoveryPayload, restoreFromCode, isLoaded } = useApp();
      useEffect(() => {
        if (isLoaded) {
          buildPayload = buildRecoveryPayload;
          restore = restoreFromCode;
        }
      }, [isLoaded, buildRecoveryPayload, restoreFromCode]);
      return null;
    }

    await act(async () => {
      create(<AppProvider><First /></AppProvider>);
      await flushPromises();
    });

    const code = buildPayload!();

    // Simulate fresh install: clear everything
    Object.keys(asyncStore).forEach(k => delete asyncStore[k]);
    (AsyncStorage.setItem as jest.Mock).mockClear();

    // Mount a brand-new provider (no prior storage) and restore
    let restore2: ((code: string) => Promise<RestoreResult>) | null = null;
    let isLoadedAfter = false;

    function Second() {
      const { restoreFromCode, isLoaded } = useApp();
      useEffect(() => {
        restore2 = restoreFromCode;
        isLoadedAfter = isLoaded;
      }, [isLoaded, restoreFromCode]);
      return null;
    }

    await act(async () => {
      create(<AppProvider><Second /></AppProvider>);
      await flushPromises();
    });

    expect(isLoadedAfter).toBe(true);

    await act(async () => {
      await restore2!(code);
      await flushPromises();
    });

    const writeCalls = (AsyncStorage.setItem as jest.Mock).mock.calls.filter(
      ([key]: [string]) => key === STORAGE_KEY_USER,
    );
    const lastWrite = JSON.parse(writeCalls[writeCalls.length - 1][1] as string);
    expect(lastWrite.ritualHour).toBe(8);
    expect(lastWrite.ritualMinute).toBe(0);
    expect(lastWrite.eveningHour).toBe(20);
    expect(lastWrite.eveningMinute).toBe(30);
    expect(lastWrite.chimeEnabled).toBe(false);
  });
});

// ─── OnboardingGate behaviour tests ──────────────────────────────────────────
//
// OnboardingGate (defined in app/_layout.tsx) redirects to /onboarding when
// userData.hasOnboarded is false.  We mirror its logic inline so we can test
// through AppProvider without exporting a private component.

function TestOnboardingGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, userData } = useApp();
  useEffect(() => {
    if (!isLoaded) return;
    if (!userData.hasOnboarded) {
      router.replace('/onboarding' as any);
    }
  }, [isLoaded, userData.hasOnboarded]);
  if (!isLoaded) return null;
  return <>{children}</>;
}

describe('OnboardingGate – redirect behaviour', () => {
  const mockReplace = router.replace as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    clearStore();
    (notificationUtils.getPermissionState as jest.Mock).mockResolvedValue('undetermined');
    mockGetScheduledReminderTimes.mockResolvedValue({
      ritualHour: 9,
      ritualMinute: 0,
      eveningHour: 20,
      eveningMinute: 0,
    });
  });

  it('redirects to /onboarding when hasOnboarded is false', async () => {
    asyncStore[STORAGE_KEY_USER] = makeStoredUser({
      hasOnboarded: false,
      ritualHour: 9,
      ritualMinute: 0,
      eveningHour: 20,
      eveningMinute: 0,
    });

    await act(async () => {
      create(
        <AppProvider>
          <TestOnboardingGate>
            <></>
          </TestOnboardingGate>
        </AppProvider>,
      );
      await flushPromises();
    });

    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith('/onboarding');
  });

  it('does NOT redirect when hasOnboarded is true', async () => {
    asyncStore[STORAGE_KEY_USER] = makeStoredUser({
      hasOnboarded: true,
      ritualHour: 9,
      ritualMinute: 0,
      eveningHour: 20,
      eveningMinute: 0,
    });

    await act(async () => {
      create(
        <AppProvider>
          <TestOnboardingGate>
            <></>
          </TestOnboardingGate>
        </AppProvider>,
      );
      await flushPromises();
    });

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('redirects when AsyncStorage contains a partial user object (no hasOnboarded, no rituals)', async () => {
    asyncStore[STORAGE_KEY_USER] = JSON.stringify({
      anonymousName: 'PartialUser',
      currentStreak: 0,
      totalRituals: 0,
    });

    await act(async () => {
      create(
        <AppProvider>
          <TestOnboardingGate>
            <></>
          </TestOnboardingGate>
        </AppProvider>,
      );
      await flushPromises();
    });

    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith('/onboarding');
  });

  it('redirects when AsyncStorage contains corrupt (non-JSON) data', async () => {
    asyncStore[STORAGE_KEY_USER] = 'NOT_VALID_JSON{{{';

    await act(async () => {
      create(
        <AppProvider>
          <TestOnboardingGate>
            <></>
          </TestOnboardingGate>
        </AppProvider>,
      );
      await flushPromises();
    });

    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith('/onboarding');
  });
});
