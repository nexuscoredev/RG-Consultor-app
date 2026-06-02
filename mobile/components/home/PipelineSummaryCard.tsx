import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { radius, space } from '@/constants/layout';
import { fetchPipeline } from '@/lib/api';
import { t } from '@/lib/i18n';
import {
  countOpenPipeline,
  loadLocalPipeline,
  mergePipelineRows,
  type PipelineViewRow,
} from '@/lib/localPipelineStore';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { Link, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function PipelineSummaryCard() {
  const scheme = useColorScheme() ?? 'light';
  const p = Colors[scheme];
  const H = t('home');
  const [rows, setRows] = useState<PipelineViewRow[]>([]);

  const load = useCallback(async () => {
    try {
      const [api, local] = await Promise.all([fetchPipeline(), loadLocalPipeline()]);
      setRows(mergePipelineRows(api, local));
    } catch {
      const local = await loadLocalPipeline();
      setRows(mergePipelineRows([], local));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const open = countOpenPipeline(rows);
  if (open === 0) return null;

  const preview = rows.filter((r) => !/contrato ativo|renovação anual/i.test(r.stage)).slice(0, 2);

  return (
    <View style={[styles.wrap, { backgroundColor: p.card, borderColor: p.border }]}>
      <View style={styles.head}>
        <MaterialCommunityIcons name="chart-timeline-variant" size={22} color={p.tint} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: p.text }]}>{H.pipelineTitle}</Text>
          <Text style={[styles.sub, { color: p.textSecondary }]}>
            {H.pipelineCount.replace('{n}', String(open))}
          </Text>
        </View>
      </View>
      {preview.map((r) => (
        <View key={r.id} style={[styles.row, { borderColor: p.border }]}>
          <Text style={[styles.account, { color: p.text }]} numberOfLines={1}>
            {r.account}
          </Text>
          <Text style={[styles.stage, { color: p.tint }]} numberOfLines={1}>
            {r.stage}
          </Text>
        </View>
      ))}
      <Link href={'/(tabs)/commercial/pipeline' as Href} asChild>
        <HapticPressable style={[styles.cta, { borderColor: p.tint }]} accessibilityRole="button">
          <Text style={[styles.ctaText, { color: p.tint }]}>{H.pipelineOpen}</Text>
        </HapticPressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radius.lg, borderWidth: 1, padding: space.md, gap: space.sm },
  head: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  title: { fontSize: 17, fontWeight: '900' },
  sub: { fontSize: 13, marginTop: 2 },
  row: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8, gap: 2 },
  account: { fontSize: 15, fontWeight: '800' },
  stage: { fontSize: 13, fontWeight: '700' },
  cta: { borderWidth: 1, borderRadius: radius.md, paddingVertical: 10, alignItems: 'center', marginTop: 4 },
  ctaText: { fontWeight: '900', fontSize: 14 },
});
