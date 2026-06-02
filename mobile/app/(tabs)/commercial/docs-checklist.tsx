import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { Surface } from '@/components/ui/Surface';
import { space, tabBarFloatingClearance } from '@/constants/layout';
import { useGamification } from '@/context/GamificationContext';
import { useSync } from '@/context/SyncContext';
import { DOCS_CHECKLIST } from '@/lib/commercialContent';
import { clientStorageKey, parseCommercialContext } from '@/lib/commercialLinks';
import { loadDocsChecklist, saveDocsChecklist, type DocsChecklistState } from '@/lib/commercialStorage';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DocsChecklistScreen() {
  const p = Colors[useColorScheme() ?? 'light'];
  const insets = useSafeAreaInsets();
  const pad = tabBarFloatingClearance(insets.bottom);
  const raw = useLocalSearchParams<Record<string, string | string[]>>();
  const ctx = parseCommercialContext(raw);
  const clientKey = useMemo(
    () => clientStorageKey({ stopId: ctx.stopId ?? '', company: ctx.company ?? 'global' }),
    [ctx.company, ctx.stopId],
  );
  const [state, setState] = useState<DocsChecklistState>({});

  useEffect(() => {
    void loadDocsChecklist(clientKey).then(setState);
  }, [clientKey]);

  const toggle = useCallback(
    async (id: string) => {
      setState((prev) => {
        const next = { ...prev, [id]: !prev[id] };
        void saveDocsChecklist(next, clientKey);
        return next;
      });
    },
    [clientKey],
  );

  const done = DOCS_CHECKLIST.filter((d) => state[d.id]).length;

  return (
    <ScrollView contentContainerStyle={[styles.root, { backgroundColor: p.background, paddingBottom: pad }]}>
      {ctx.company ? (
        <Text style={[styles.client, { color: p.tint }]}>{ctx.company}</Text>
      ) : null}
      <Text style={[styles.intro, { color: p.textSecondary }]}>
        Marque o que o cliente já trouxe ou enviou. O que falta vira pedido claro no follow-up.
      </Text>
      <Text style={[styles.progress, { color: p.tint }]}>
        {done} / {DOCS_CHECKLIST.length} itens
      </Text>
      {DOCS_CHECKLIST.map((d) => {
        const on = state[d.id];
        return (
          <Surface key={d.id} style={[styles.row, { borderColor: p.border }]}>
            <HapticPressable
              haptic={false}
              onPress={() => void toggle(d.id)}
              style={styles.hit}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}>
              <View style={[styles.box, { borderColor: on ? p.tint : p.border, backgroundColor: on ? `${p.tint}18` : p.card }]}>
                {on ? <Text style={{ color: p.tint, fontWeight: '900' }}>✓</Text> : null}
              </View>
              <Text style={[styles.label, { color: p.text }]}>{d.label}</Text>
            </HapticPressable>
          </Surface>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { padding: space.md, gap: 10 },
  client: { fontSize: 17, fontWeight: '900' },
  intro: { fontSize: 14, lineHeight: 20 },
  progress: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  row: { padding: space.sm, borderRadius: 14, borderWidth: 1 },
  hit: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  box: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, fontSize: 15, lineHeight: 21 },
});
