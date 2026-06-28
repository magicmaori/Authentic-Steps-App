import { Redirect } from 'expo-router';

export default function GuestRedirect() {
  return <Redirect href="/(tabs)" />;
}
