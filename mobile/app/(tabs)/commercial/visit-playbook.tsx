import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Surface } from '@/components/ui/Surface';
import { space, tabBarFloatingClearance } from '@/constants/layout';
import { VISIT_PLAYBOOK } from '@/lib/commercialContent';
import { clientStorageKey, parseCommercialContext } from '@/lib/commercialLinks';
import { loadVisitPlaybookChecks, saveVisitPlaybookChecks } from '@/lib/commercialStorage';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TabletScrollScreen } from '@/components/ui/TabletScrollScreen';
import { useTabletLayout } from '@/hooks/useTabletLayout';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function key(si: number, bi: number) {
  return `${si}-${bi}`;
}

export default function VisitPlaybookScreen() {
  const p = Colors[useColorScheme() ?? 'light'];
  const insets = useSafeAreaInsets();
  const pad = tabBarFloatingClearance(insets.bottom);
  const raw = useLocalSearchParams<Record<string, string | string[]>>();
  const ctx = parseCommercialContext(raw);
  const clientKey = useMemo(
    () => clientStorageKey({ stopId: ctx.stopId ?? '', company: ctx.company ?? 'global' }),
    [ctx.company, ctx.stopId],
  );
  const [checks, setChecks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    void loadVisitPlaybookChecks(clientKey).then(setChecks);
  }, [clientKey]);

  const toggle = useCallback(
    async (k: string) => {
      setChecks((prev) => {
        const next = { ...prev, [k]: !prev[k] };
        void saveVisitPlaybookChecks(next, clientKey);
        return next;
      });
    },
    [clientKey],
  );

  const { isWide } = useTabletLayout();

  return (
    <TabletScrollScreen style={{ backgroundColor: p.background }} padBottom={pad} contentContainerStyle={styles.root}>
      {ctx.company ? (
        <Text style={[styles.client, { color: p.tint }]}>{ctx.company}</Text>
      ) : null}
      <Text style={[styles.intro, { color: p.textSecondary }]}>
        Execute na ordem com o cliente. O progresso fica guardado por cliente neste aparelho.
      </Text>
      <View style={isWide ? styles.stepGrid : undefined}>
      {VISIT_PLAYBOOK.map((step, si) => (
        <Surface
          key={step.title}
          elevated
          style={isWide ? [styles.card, styles.cardWide, { borderColor: p.border }] : [styles.card, { borderColor: p.border }]}>
          <Text style={[styles.stepTitle, { color: p.tint }]}>{step.title}</Text>
          {step.bullets.map((b, bi) => {
            const k = key(si, bi);
            const on = checks[k];
            return (
              <Pressable
                key={k}
                onPress={() => void toggle(k)}
                style={styles.row}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}>
                <View style={[styles.box, { borderColor: on ? p.tint : p.border, backgroundColor: on ? `${p.tint}18` : p.card }]}>
                  {on ? <Text style={{ color: p.tint, fontWeight: '900' }}>✓</Text> : null}
                </View>
                <Text style={[styles.bullet, { color: p.text }]}>{b}</Text>
              </Pressable>
            );
          })}
        </Surface>
      ))}
      </View>
    </TabletScrollScreen>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.md },
  stepGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  cardWide: { width: '48%', flexGrow: 1 },
  client: { fontSize: 17, fontWeight: '900' },
  intro: { fontSize: 14, lineHeight: 20, marginBottom: 4 },
  card: { padding: space.md, borderRadius: 16, borderWidth: 1, gap: 10 },
  stepTitle: { fontSize: 16, fontWeight: '900', marginBottom: 4 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 6 },
  box: { width: 26, height: 26, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  bullet: { flex: 1, fontSize: 15, lineHeight: 22 },
});
