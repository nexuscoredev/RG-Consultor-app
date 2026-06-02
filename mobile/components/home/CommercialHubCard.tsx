import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { radius, space } from '@/constants/layout';
import { typography } from '@/constants/typography';
import { chevronSize } from '@/constants/icons';
import { t } from '@/lib/i18n';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import { Link, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

type QuickItem = {
  href: Href;
  labelKey: 'commercialQuickPlaybook' | 'commercialQuickProposal' | 'commercialQuickCalculator';
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
};

const QUICK_KEYS: QuickItem[] = [
  { href: '/(tabs)/commercial/visit-playbook' as Href, labelKey: 'commercialQuickPlaybook', icon: 'format-list-numbered' },
  { href: '/(tabs)/commercial/proposal' as Href, labelKey: 'commercialQuickProposal', icon: 'file-pdf-box' },
  { href: '/(tabs)/commercial/calculator' as Href, labelKey: 'commercialQuickCalculator', icon: 'calculator-variant' },
];

export function CommercialHubCard() {
  const scheme = useColorScheme() ?? 'light';
  const p = Colors[scheme];
  const H = t('home');

  return (
    <View style={[styles.wrap, { backgroundColor: p.card, borderColor: p.border }]}>
      <View style={styles.head}>
        <MaterialCommunityIcons name="briefcase-outline" size={22} color={p.tint} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: p.text }]}>{H.commercialHubTitle}</Text>
          <Text style={[styles.sub, { color: p.textSecondary }]}>{H.commercialHubBody}</Text>
        </View>
      </View>
      <View style={styles.quickRow}>
        {QUICK_KEYS.map((item) => (
          <Link key={item.labelKey} href={item.href} asChild style={styles.quickCell}>
            <HapticPressable
              haptic={false}
              style={[styles.chip, { borderColor: p.border, backgroundColor: `${p.tint}0c` }]}
              accessibilityRole="button"
              accessibilityLabel={H[item.labelKey]}>
              <MaterialCommunityIcons name={item.icon} size={18} color={p.tint} />
              <Text style={[styles.chipText, { color: p.text }]} numberOfLines={1}>
                {H[item.labelKey]}
              </Text>
            </HapticPressable>
          </Link>
        ))}
      </View>
      <Link href={'/(tabs)/commercial' as Href} asChild>
        <PrimaryButton
          fullWidth
          label={H.commercialHubOpen}
          accessibilityLabel={H.commercialHubOpenA11y}
          icon={<MaterialCommunityIcons name="chevron-right" size={chevronSize} color="#fff" />}
        />
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radius.lg, borderWidth: 1, padding: space.md, gap: space.md },
  head: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
  title: { ...typography.title, fontWeight: '900' },
  sub: { ...typography.caption, marginTop: 4 },
  quickRow: { flexDirection: 'row', gap: space.sm },
  quickCell: { flex: 1 },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: space.sm,
    paddingHorizontal: space.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    minHeight: 44,
  },
  chipText: { ...typography.meta, fontWeight: '700', flexShrink: 1 },
});
