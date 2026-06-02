import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Surface } from '@/components/ui/Surface';
import { space, tabBarFloatingClearance } from '@/constants/layout';
import { COMPARE_ROWS } from '@/lib/commercialContent';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CompareScreen() {
  const p = Colors[useColorScheme() ?? 'light'];
  const insets = useSafeAreaInsets();
  const pad = tabBarFloatingClearance(insets.bottom);

  return (
    <ScrollView contentContainerStyle={[styles.root, { backgroundColor: p.background, paddingBottom: pad }]}>
      <Text style={[styles.intro, { color: p.textSecondary }]}>
        Use como conversa guiada — não é slide; é para alinhar valor com o decisor.
      </Text>
      <Surface style={[styles.table, { borderColor: p.border }]}>
        <View style={[styles.head, { borderBottomColor: p.border }]}>
          <Text style={[styles.hcell, { color: p.textSecondary, flex: 1.1 }]}>Aspecto</Text>
          <Text style={[styles.hcell, { color: p.danger, flex: 1 }]}>Sem RG</Text>
          <Text style={[styles.hcell, { color: p.tint, flex: 1 }]}>Com RG</Text>
        </View>
        {COMPARE_ROWS.map((row) => (
          <View key={row.aspect} style={[styles.row, { borderBottomColor: p.border }]}>
            <Text style={[styles.cell, { color: p.text, fontWeight: '800', flex: 1.1 }]}>{row.aspect}</Text>
            <Text style={[styles.cell, { color: p.textSecondary, flex: 1 }]}>{row.sem}</Text>
            <Text style={[styles.cell, { color: p.text, flex: 1 }]}>{row.com}</Text>
          </View>
        ))}
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { padding: space.md, gap: space.md },
  intro: { fontSize: 14, lineHeight: 20 },
  table: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  head: { flexDirection: 'row', borderBottomWidth: 1, paddingVertical: 10, paddingHorizontal: 8, gap: 6 },
  hcell: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  row: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 12, paddingHorizontal: 8, gap: 6 },
  cell: { fontSize: 13, lineHeight: 18 },
});
