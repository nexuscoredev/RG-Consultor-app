import { useAuth } from '@/context/AuthContext';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function GateScreen() {
  const { ready, token, consent, profile } = useAuth();

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!token) {
    return <Redirect href="/login" />;
  }

  const consentOk = Boolean(consent?.locationWhenInUse && consent?.dataRetentionAck);
  if (!consentOk) {
    return <Redirect href="/onboarding/consent" />;
  }

  if (profile?.role === 'master') {
    return <Redirect href="/master" />;
  }

  return <Redirect href="/(tabs)" />;
}
