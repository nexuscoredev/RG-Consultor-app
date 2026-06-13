import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { space } from '@/constants/layout';
import { typography } from '@/constants/typography';

export default function NotFoundScreen() {
  const p = Colors[useColorScheme() ?? 'light'];

  return (
    <>
      <Stack.Screen options={{ title: 'Página não encontrada' }} />
      <View style={[styles.container, { backgroundColor: p.background }]}>
        <Text style={[typography.h2, { color: p.text }]}>Esta tela não existe.</Text>
        <Text style={[typography.body, styles.sub, { color: p.textSecondary }]}>
          O endereço pode estar desatualizado ou foi digitado incorretamente.
        </Text>
        <Link href="/(tabs)" asChild>
          <PrimaryButton label="Ir para o início" accessibilityLabel="Ir para o início" style={styles.btn} />
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
    gap: space.md,
  },
  sub: { textAlign: 'center' },
  btn: { marginTop: space.sm, minWidth: 220 },
});
