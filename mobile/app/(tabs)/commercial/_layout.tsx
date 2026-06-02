import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Stack } from 'expo-router';

export default function CommercialStackLayout() {
  const p = Colors[useColorScheme() ?? 'light'];
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: p.card },
        headerTintColor: p.tint,
        headerTitleStyle: { color: p.text, fontWeight: '800' },
      }}>
      <Stack.Screen name="index" options={{ title: 'Comercial' }} />
      <Stack.Screen name="visit-session" options={{ title: 'Modo visita' }} />
      <Stack.Screen name="visit-playbook" options={{ title: 'Roteiro de visita' }} />
      <Stack.Screen name="pitch-faq" options={{ title: 'Pitch 60s e FAQ' }} />
      <Stack.Screen name="calculator" options={{ title: 'Calculadora rápida' }} />
      <Stack.Screen name="cases" options={{ title: 'Cases por segmento' }} />
      <Stack.Screen name="compare" options={{ title: 'Com RG vs sem RG' }} />
      <Stack.Screen name="docs-checklist" options={{ title: 'Documentos do cliente' }} />
      <Stack.Screen name="meeting-log" options={{ title: 'Registo de reunião' }} />
      <Stack.Screen name="followup" options={{ title: 'Follow-up e-mail / WhatsApp' }} />
      <Stack.Screen name="intent-term" options={{ title: 'Termo de intenção' }} />
      <Stack.Screen name="proposal" options={{ title: 'Proposta PDF' }} />
      <Stack.Screen name="pipeline" options={{ title: 'Pipeline' }} />
      <Stack.Screen name="contract-flow" options={{ title: 'Novo contrato' }} />
    </Stack>
  );
}
