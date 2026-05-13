import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Stack } from 'expo-router';

export default function MoreStackLayout() {
  const scheme = useColorScheme() ?? 'light';
  const p = Colors[scheme];
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: p.card },
        headerTintColor: p.tint,
        headerTitleStyle: { color: p.text, fontWeight: '800' },
      }}>
      <Stack.Screen name="index" options={{ title: 'Mais' }} />
      <Stack.Screen name="pipeline" options={{ title: 'Pipeline' }} />
      <Stack.Screen name="missions" options={{ title: 'Mission Center' }} />
      <Stack.Screen name="store" options={{ title: 'Loja de prêmios' }} />
      <Stack.Screen name="operation" options={{ title: 'Nossa Operação', headerShown: false }} />
      <Stack.Screen name="contract-flow" options={{ title: 'Novo contrato' }} />
      <Stack.Screen name="documents" options={{ title: 'Trilha documental' }} />
      <Stack.Screen name="alerts" options={{ title: 'Alertas gestão' }} />
      <Stack.Screen name="legal" options={{ title: 'Privacidade e retenção' }} />
      <Stack.Screen name="settings" options={{ title: 'Configurações' }} />
    </Stack>
  );
}
