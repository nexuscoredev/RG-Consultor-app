import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { fetchPipeline, type PipelineRow } from '@/lib/api';
import { t } from '@/lib/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

const CACHE_KEY = 'rg_pipeline_cache_v1';

export default function PipelineScreen() {
  const p = Colors[useColorScheme() ?? 'light'];
  const [rows, setRows] = useState<PipelineRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'live' | 'cache'>('live');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPipeline();
      setRows(data);
      setSource('live');
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), rows: data }));
    } catch {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { rows: PipelineRow[] };
        setRows(parsed.rows);
        setSource('cache');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <ScrollView contentContainerStyle={[styles.root, { backgroundColor: p.background }]}>
      <Text style={[styles.banner, { color: p.textSecondary }]}>
        Fonte: {source === 'live' ? 'API (simulada)' : 'Cache offline — reconecte para atualizar'}
      </Text>
      {loading ? <ActivityIndicator color={p.tint} /> : null}
      {!loading && rows.length === 0 ? (
        <Text style={[styles.empty, { color: p.textSecondary }]}>{t('pipeline').empty}</Text>
      ) : null}
      {rows.map((r) => (
        <View key={r.account} style={[styles.card, { backgroundColor: p.card, borderColor: p.border }]}>
          <Text style={[styles.account, { color: p.text }]}>{r.account}</Text>
          <Text style={[styles.stage, { color: p.tint }]}>{r.stage}</Text>
          {r.docPending ? (
            <Text style={[styles.doc, { color: p.danger }]}>Doc: {r.docPending}</Text>
          ) : null}
          <View style={styles.row}>
            <Text style={[styles.meta, { color: p.textSecondary }]}>{r.owner}</Text>
            <Text style={[styles.meta, { color: p.textSecondary }]}>{r.value}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { padding: 20, gap: 12, paddingBottom: 40 },
  empty: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 24, paddingHorizontal: 12 },
  banner: { fontSize: 13, marginBottom: 4 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 6 },
  account: { fontSize: 17, fontWeight: '800' },
  stage: { fontSize: 14, fontWeight: '700' },
  doc: { fontSize: 13, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  meta: { fontSize: 13 },
});
