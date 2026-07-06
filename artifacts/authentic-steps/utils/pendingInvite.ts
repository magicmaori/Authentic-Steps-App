import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';

/**
 * An invite code arriving via deep link (e.g. tapping a member invite link
 * on the landing page, which opens `exp://host/--/redeem?code=XYZ` in Expo
 * Go) needs to survive AccessGate's forced navigation through sign-in before
 * the user ever reaches the redeem screen — query params don't survive a
 * `router.replace`. We stash it here once at launch and let the redeem
 * screen consult it as a fallback when it has no route param of its own.
 */
const PENDING_INVITE_KEY = '@authentic_steps_pending_invite_code';

export async function capturePendingInviteFromUrl(url: string | null | undefined): Promise<void> {
  if (!url) return;
  try {
    const { queryParams } = Linking.parse(url);
    const code = queryParams?.code;
    const value = Array.isArray(code) ? code[0] : code;
    if (typeof value === 'string' && value.trim()) {
      await AsyncStorage.setItem(PENDING_INVITE_KEY, value.trim());
    }
  } catch {
    // Malformed or unrelated URL — nothing to capture.
  }
}

export async function getPendingInviteCode(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(PENDING_INVITE_KEY);
  } catch {
    return null;
  }
}

export async function clearPendingInviteCode(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PENDING_INVITE_KEY);
  } catch {
    // Best-effort cleanup only.
  }
}
