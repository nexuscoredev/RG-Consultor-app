import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Surface } from '@/components/ui/Surface';
import { space, tabBarFloatingClearance } from '@/constants/layout';
import { CASES } from '@/lib/commercialContent';
import { TabletScrollScreen } from '@/components/ui/TabletScrollScreen';
import { useTabletLayout } from '@/hooks/useTabletLayout';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CasesScreen() {
  const p = Colors[useColorScheme() ?? 'light'];
  const insets = useSafeAreaInsets();
  const pad = tabBarFloatingClearance(insets.bottom);
  const { isWide } = useTabletLayout();

  return (
    <TabletScrollScreen style={{ backgroundColor: p.background }} padBottom={pad} contentContainerStyle={styles.root}>
      <Text style={[styles.intro, { color: p.textSecondary }]}>
        Histórias curtas para contar na mesa — adapte números e nomes com o que for real na tua região.
      </Text>
      <View style={isWide ? styles.caseGrid : undefined}>
      {CASES.map((c) => (
        <Surface
          key={c.id}
          elevated
          style={isWide ? [styles.card, styles.cardWide, { borderColor: p.border }] : [styles.card, { borderColor: p.border }]}>
          <View style={[styles.badge, { backgroundColor: `${p.tint}16` }]}>
            <Text style={[styles.badgeText, { color: p.tint }]}>{c.segment}</Text>
          </View>
          <Text style={[styles.title, { color: p.text }]}>{c.title}</Text>
          <Text style={[styles.label, { color: p.danger }]}>Antes</Text>
          <Text style={[styles.body, { color: p.textSecondary }]}>{c.before}</Text>
          <Text style={[styles.label, { color: p.tint }]}>Depois</Text>
          <Text style={[styles.body, { color: p.text }]}>{c.after}</Text>
        </Surface>
      ))}
      </View>
    </TabletScrollScreen>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.md },
  caseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  cardWide: { width: '48%', flexGrow: 1 },
  intro: { fontSize: 14, lineHeight: 20 },
  card: { padding: space.md, borderRadius: 16, borderWidth: 1, gap: 8 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '800' },
  title: { fontSize: 18, fontWeight: '900' },
  label: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 4 },
  body: { fontSize: 15, lineHeight: 22 },
});
