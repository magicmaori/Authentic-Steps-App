/**
 * Unit tests for getScheduledReminderTimes in utils/notifications.ts
 *
 * Verifies that the utility correctly maps scheduled OS notifications to
 * ritualHour/ritualMinute/eveningHour/eveningMinute, which the migration
 * block in AppContext.loadData relies on.
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

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

import * as Notifications from 'expo-notifications';
import { getScheduledReminderTimes } from '../utils/notifications';

const mockGetAllScheduled = Notifications.getAllScheduledNotificationsAsync as jest.Mock;

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
