import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Milestone } from '@/context/AppContext';

const CHANNEL_ID = 'authentic-steps-default';
const ID_RITUAL = 'ritual-daily-reminder';
const ID_EVENING = 'evening-checkin-reminder';

export async function setupAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Authentic Steps reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#03989e',
  });
}

export type PermissionState = 'granted' | 'denied' | 'undetermined';

export async function getPermissionState(): Promise<PermissionState> {
  const result = (await Notifications.getPermissionsAsync()) as any;
  if (result.granted) return 'granted';
  if (result.canAskAgain !== false) return 'undetermined';
  return 'denied';
}

export async function requestPermission(): Promise<boolean> {
  const existing = (await Notifications.getPermissionsAsync()) as unknown as { granted: boolean };
  if (existing.granted) return true;
  const result = (await Notifications.requestPermissionsAsync()) as unknown as { granted: boolean };
  return result.granted;
}

export async function scheduleRitualReminder(enabled: boolean, hour = 9, minute = 0): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(ID_RITUAL).catch(() => {});
  if (!enabled) return;
  await Notifications.scheduleNotificationAsync({
    identifier: ID_RITUAL,
    content: {
      title: 'Good morning 🌱',
      body: "Your daily ritual is waiting. Start your day with intention.",
      sound: true,
      ...(Platform.OS === 'android' && { channelId: CHANNEL_ID }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    } as any,
  });
}

export async function scheduleEveningReminder(enabled: boolean, hour = 20, minute = 0): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(ID_EVENING).catch(() => {});
  if (!enabled) return;
  await Notifications.scheduleNotificationAsync({
    identifier: ID_EVENING,
    content: {
      title: 'Evening check-in 🌙',
      body: "How did today go? Take a moment to reflect on your intention.",
      sound: true,
      ...(Platform.OS === 'android' && { channelId: CHANNEL_ID }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    } as any,
  });
}

export async function fireMilestoneNotification(milestone: Milestone): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: `milestone-${milestone.id}-${Date.now()}`,
    content: {
      title: `🏅 ${milestone.label} earned!`,
      body: milestone.description,
      sound: true,
      ...(Platform.OS === 'android' && { channelId: CHANNEL_ID }),
    },
    trigger: null,
  });
}

export async function cancelAllReminders(): Promise<void> {
  await Promise.all([
    Notifications.cancelScheduledNotificationAsync(ID_RITUAL).catch(() => {}),
    Notifications.cancelScheduledNotificationAsync(ID_EVENING).catch(() => {}),
  ]);
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
