import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { Surface } from '@/components/ui/Surface';
import { space, tabBarFloatingClearance } from '@/constants/layout';
import { INTENT_TERM_POINTS } from '@/lib/commercialContent';
import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function IntentTermScreen() {
  const p = Colors[useColorScheme() ?? 'light'];
  const insets = useSafeAreaInsets();
  const pad = tabBarFloatingClearance(insets.bottom);

  return (
    <ScrollView contentContainerStyle={[styles.root, { backgroundColor: p.background, paddingBottom: pad }]}>
      <Text style={[styles.intro, { color: p.textSecondary }]}>
        Use quando houver alinhamento verbal mas ainda não for o momento do contrato completo. Sempre com validação do
        jurídico da empresa.
      </Text>
      <Surface elevated style={[styles.card, { borderColor: p.border }]}>
        {INTENT_TERM_POINTS.map((line) => (
          <Text key={line} style={[styles.bullet, { color: p.text }]}>
            • {line.replace(/\*/g, '')}
          </Text>
        ))}
      </Surface>
      <Link href="/(tabs)/more/contract-flow" asChild>
        <HapticPressable style={[styles.cta, { backgroundColor: p.tint }]} accessibilityRole="button">
          <Text style={styles.ctaText}>Ir para assistente “Novo contrato”</Text>
        </HapticPressable>
      </Link>
      <Link href="/(tabs)/commercial/proposal" asChild>
        <HapticPressable style={[styles.outline, { borderColor: p.tint }]} accessibilityRole="button">
          <Text style={[styles.outlineText, { color: p.tint }]}>Gerar proposta PDF</Text>
        </HapticPressable>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { padding: space.md, gap: space.md },
  intro: { fontSize: 14, lineHeight: 21 },
  card: { padding: space.md, borderRadius: 16, borderWidth: 1, gap: 12 },
  bullet: { fontSize: 15, lineHeight: 24 },
  cta: { padding: 16, borderRadius: 14, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  outline: { padding: 14, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  outlineText: { fontWeight: '800' },
});
