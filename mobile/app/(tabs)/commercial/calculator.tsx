import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { Surface } from '@/components/ui/Surface';
import { tabBarFloatingClearance } from '@/constants/layout';
import { space } from '@/constants/layout';
import { proposalHrefWithValue, parseCommercialContext } from '@/lib/commercialLinks';
import {
  CALC_CATEGORIES,
  CALC_DISCLAIMER,
  type CalcCategoryId,
  estimateRange,
} from '@/lib/commercialContent';
import { t } from '@/lib/i18n';
import { Link, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function formatRange(min: number, max: number): string {
  return `R$ ${min.toLocaleString('pt-BR')} — R$ ${max.toLocaleString('pt-BR')} / mês (faixa indicativa)`;
}

export default function CalculatorScreen() {
  const p = Colors[useColorScheme() ?? 'light'];
  const CALC = t('calculator');
  const insets = useSafeAreaInsets();
  const pad = tabBarFloatingClearance(insets.bottom);
  const raw = useLocalSearchParams<Record<string, string | string[]>>();
  const ctx = parseCommercialContext(raw);
  const [cat, setCat] = useState<CalcCategoryId>('industria');
  const [tons, setTons] = useState('8');
  const range = useMemo(() => {
    const t = parseFloat(tons.replace(',', '.')) || 0;
    return estimateRange(cat, t);
  }, [cat, tons]);

  const valueLabel = formatRange(range.min, range.max);
  const proposalHref = proposalHrefWithValue({
    company: ctx.company,
    clientName: ctx.clientName ?? ctx.contact,
    stopId: ctx.stopId,
    routeDate: ctx.routeDate,
    value: valueLabel,
  });

  return (
    <ScrollView contentContainerStyle={[styles.root, { backgroundColor: p.background, paddingBottom: pad }]}>
      {ctx.company ? (
        <Text style={[styles.client, { color: p.tint }]}>{ctx.company}</Text>
      ) : null}
      <Text style={[styles.intro, { color: p.textSecondary }]}>{CALC_DISCLAIMER}</Text>

      <Text style={[styles.label, { color: p.textSecondary }]}>{CALC.segment}</Text>
      <View style={styles.chips}>
        {CALC_CATEGORIES.map((c) => {
          const active = c.id === cat;
          return (
            <HapticPressable
              key={c.id}
              haptic={false}
              onPress={() => setCat(c.id)}
              style={[styles.chip, { borderColor: active ? p.tint : p.border, backgroundColor: active ? `${p.tint}14` : p.card }]}>
              <Text style={[styles.chipText, { color: active ? p.tint : p.text }]} numberOfLines={2}>
                {c.label}
              </Text>
            </HapticPressable>
          );
        })}
      </View>

      <Text style={[styles.label, { color: p.textSecondary }]}>{CALC.volume}</Text>
      <TextInput
        value={tons}
        onChangeText={setTons}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={p.textSecondary}
        style={[styles.input, { borderColor: p.border, color: p.text, backgroundColor: p.card }]}
      />

      <Surface elevated style={[styles.result, { borderColor: p.border }]}>
        <Text style={[styles.resultLabel, { color: p.textSecondary }]}>{CALC.rangeLabel}</Text>
        <Text style={[styles.resultVal, { color: p.tint }]}>
          R$ {range.min.toLocaleString('pt-BR')} — R$ {range.max.toLocaleString('pt-BR')}
        </Text>
      </Surface>

      <Link href={proposalHref} asChild>
        <HapticPressable style={[styles.cta, { backgroundColor: p.tint }]} accessibilityRole="button">
          <Text style={styles.ctaText}>{CALC.useInProposal}</Text>
        </HapticPressable>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { padding: space.md, gap: space.md },
  client: { fontSize: 17, fontWeight: '900' },
  intro: { fontSize: 13, lineHeight: 19 },
  label: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, maxWidth: '48%' },
  chipText: { fontSize: 13, fontWeight: '700' },
  input: { borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 18, fontWeight: '800' },
  result: { padding: space.md, borderRadius: 16, borderWidth: 1, gap: 6 },
  resultLabel: { fontSize: 13 },
  resultVal: { fontSize: 22, fontWeight: '900' },
  cta: { borderRadius: 14, padding: 16, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '900', fontSize: 15 },
});
