import { router } from 'expo-router';
import { useEffect } from 'react';

export default function GuestRedirect() {
  useEffect(() => {
    router.replace('/(tabs)' as any);
  }, []);
  return null;
}
