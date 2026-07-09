/**
 * Unit tests for utils/notifications.ts
 *
 * Covers:
 * - getScheduledReminderTimes: maps scheduled OS notifications to
 *   ritualHour/ritualMinute/eveningHour/eveningMinute (used by the
 *   migration block in AppContext.loadData).
 * - setupAndroidChannel: must swallow any error from
 *   setNotificationChannelAsync instead of crashing on startup, which
 *   is the Android cold-start fix this test suite guards against regression.
 *
 * NOTE: jest.mock() is hoisted before variable declarations, so mock
 * factory functions must not reference outer const/let variables. We use
 * jest.fn() directly in the factory and grab the typed reference via the
 * mocked module import.
 */

jest.mock('expo-notifications', () => ({
  getAllScheduledNotificationsAsync: jest.fn(),
  getPermissionsAsync: jest.fn().mockResolvedValue({ granted: true, canAskAgain: true }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  scheduleNotificationAsync: jest.fn().mockResolvedValue(undefined),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  setNotificationHandler: jest.fn(),
  SchedulableTriggerInputTypes: { DAILY: 'daily' },
  AndroidImportance: { HIGH: 4 },
}));

// Platform.OS is set per-describe block via jest.resetModules() where needed;
// the default here is 'ios' to match the existing getScheduledReminderTimes tests.
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  Alert: { alert: jest.fn() },
}));

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { getScheduledReminderTimes, setupAndroidChannel } from '../utils/notifications';

const mockGetAllScheduled = Notifications.getAllScheduledNotificationsAsync as jest.Mock;
const mockSetNotificationChannelAsync = Notifications.setNotificationChannelAsync as jest.Mock;

describe('getScheduledReminderTimes', () => {
  beforeEach(() => {
    mockGetAllScheduled.mockReset();
  });

  it('returns ritual and evening times when both are scheduled', async () => {
    mockGetAllScheduled.mockResolvedValue([
      {
        identifier: 'ritual-daily-reminder',
        trigger: { hour: 7, minute: 30 },
      },
      {
        identifier: 'evening-checkin-reminder',
        trigger: { hour: 21, minute: 0 },
      },
    ]);

    const times = await getScheduledReminderTimes();

    expect(times).toEqual({
      ritualHour: 7,
      ritualMinute: 30,
      eveningHour: 21,
      eveningMinute: 0,
    });
  });

  it('returns only ritual times when only ritual is scheduled', async () => {
    mockGetAllScheduled.mockResolvedValue([
      {
        identifier: 'ritual-daily-reminder',
        trigger: { hour: 8, minute: 15 },
      },
    ]);

    const times = await getScheduledReminderTimes();

    expect(times.ritualHour).toBe(8);
    expect(times.ritualMinute).toBe(15);
    expect(times.eveningHour).toBeUndefined();
    expect(times.eveningMinute).toBeUndefined();
  });

  it('returns only evening times when only evening is scheduled', async () => {
    mockGetAllScheduled.mockResolvedValue([
      {
        identifier: 'evening-checkin-reminder',
        trigger: { hour: 20, minute: 30 },
      },
    ]);

    const times = await getScheduledReminderTimes();

    expect(times.eveningHour).toBe(20);
    expect(times.eveningMinute).toBe(30);
    expect(times.ritualHour).toBeUndefined();
    expect(times.ritualMinute).toBeUndefined();
  });

  it('returns an empty object when no reminders are scheduled', async () => {
    mockGetAllScheduled.mockResolvedValue([]);

    const times = await getScheduledReminderTimes();

    expect(times).toEqual({});
  });

  it('skips notifications whose trigger lacks hour/minute', async () => {
    mockGetAllScheduled.mockResolvedValue([
      {
        identifier: 'ritual-daily-reminder',
        trigger: { type: 'push' },
      },
      {
        identifier: 'evening-checkin-reminder',
        trigger: null,
      },
    ]);

    const times = await getScheduledReminderTimes();

    expect(times).toEqual({});
  });

  it('ignores unknown notification identifiers', async () => {
    mockGetAllScheduled.mockResolvedValue([
      {
        identifier: 'milestone-first-123456',
        trigger: { hour: 9, minute: 0 },
      },
    ]);

    const times = await getScheduledReminderTimes();

    expect(times).toEqual({});
  });

  it('returns an empty object if getAllScheduledNotificationsAsync throws', async () => {
    mockGetAllScheduled.mockRejectedValue(new Error('permission denied'));

    const times = await getScheduledReminderTimes();

    expect(times).toEqual({});
  });
});

/**
 * setupAndroidChannel — cold-start / fresh-install guard
 *
 * On Android, setNotificationChannelAsync can throw on first boot (e.g. bad
 * argument on a specific Android version or during an OTA upgrade). The fix
 * wraps the call in try/catch; these tests confirm it stays in place so a
 * future refactor can't silently reintroduce the crash.
 */
describe('setupAndroidChannel', () => {
  beforeEach(() => {
    mockSetNotificationChannelAsync.mockReset();
  });

  it('swallows an error from setNotificationChannelAsync on Android (does not throw)', async () => {
    // Simulate the Android environment
    (Platform as any).OS = 'android';
    mockSetNotificationChannelAsync.mockRejectedValue(
      new Error('channel creation failed (simulated Android crash)'),
    );

    await expect(setupAndroidChannel()).resolves.toBeUndefined();
  });

  it('calls setNotificationChannelAsync with the correct channel config on Android', async () => {
    (Platform as any).OS = 'android';
    mockSetNotificationChannelAsync.mockResolvedValue(null);

    await setupAndroidChannel();

    expect(mockSetNotificationChannelAsync).toHaveBeenCalledTimes(1);
    const [channelId, config] = mockSetNotificationChannelAsync.mock.calls[0];
    expect(typeof channelId).toBe('string');
    expect(channelId.length).toBeGreaterThan(0);
    expect(config).toMatchObject({
      name: expect.any(String),
      importance: expect.any(Number),
    });
  });

  it('is a no-op on iOS (does not call setNotificationChannelAsync)', async () => {
    (Platform as any).OS = 'ios';
    mockSetNotificationChannelAsync.mockResolvedValue(null);

    await setupAndroidChannel();

    expect(mockSetNotificationChannelAsync).not.toHaveBeenCalled();
  });

  afterEach(() => {
    // Restore the default mock Platform.OS so other tests are unaffected.
    (Platform as any).OS = 'ios';
  });
});
