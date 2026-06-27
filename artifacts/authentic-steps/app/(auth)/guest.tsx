import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect } from 'react';

import { GUEST_MODE_KEY } from '@/app/_layout';

export default function GuestRedirect() {
  useEffect(() => {
    AsyncStorage.setItem(GUEST_MODE_KEY, '1').then(() => {
      router.replace('/(tabs)' as any);
    });
  }, []);
  return null;
}
