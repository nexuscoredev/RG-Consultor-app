import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { radius, space } from '@/constants/layout';
import { typography } from '@/constants/typography';
import { chevronSize } from '@/constants/icons';
import {
  COMMERCIAL_PHASE_ORDER,
  primaryHrefForPhase,
  phaseShortLabel,
} from '@/lib/commercialFunnel';
import { useTabletLayout } from '@/hooks/useTabletLayout';
import { t } from '@/lib/i18n';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import { Link, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

const PHASE_ICONS: Record<string, ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  prospecting: 'clipboard-text-outline',
  proposal: 'file-pdf-box',
  acceptance: 'handshake-outline',
  contract: 'file-document-edit-outline',
};

export function CommercialHubCard() {
  const scheme = useColorScheme() ?? 'light';
  const p = Colors[scheme];
  const H = t('home');
  const { isTablet, touchMinHeight } = useTabletLayout();

  return (
    <View style={[styles.wrap, { backgroundColor: p.card, borderColor: p.border }]}>
      <View style={styles.head}>
        <MaterialCommunityIcons name="briefcase-outline" size={22} color={p.tint} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: p.text }]}>{H.commercialHubTitle}</Text>
          <Text style={[styles.sub, { color: p.textSecondary }]}>{H.commercialHubBody}</Text>
        </View>
      </View>

      <View style={styles.phaseGrid}>
        {COMMERCIAL_PHASE_ORDER.map((phase, index) => {
          const href = primaryHrefForPhase(phase);
          const label = phaseShortLabel(phase);
          const icon = PHASE_ICONS[phase];
          return (
            <Link key={phase} href={href as Href} asChild style={styles.phaseCell}>
              <HapticPressable
                haptic={false}
                style={[
                  styles.phaseChip,
                  isTablet && styles.phaseChipTablet,
                  { borderColor: p.border, backgroundColor: `${p.tint}0c`, minHeight: touchMinHeight },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${index + 1}. ${label}`}>
                <View style={[styles.phaseNum, { backgroundColor: p.tint }]}>
                  <Text style={styles.phaseNumText}>{index + 1}</Text>
                </View>
                <MaterialCommunityIcons name={icon} size={20} color={p.tint} />
                <Text style={[styles.chipText, { color: p.text }]} numberOfLines={1}>
                  {label}
                </Text>
              </HapticPressable>
            </Link>
          );
        })}
      </View>

      <Link href={'/(tabs)/commercial' as Href} asChild>
        <PrimaryButton
          fullWidth
          label={H.commercialHubOpen}
          accessibilityLabel={H.commercialHubOpenA11y}
          icon={<MaterialCommunityIcons name="chevron-right" size={chevronSize} color="#fff" />}
        />
      </Link>
      <Link href={'/(tabs)/commercial/clients' as Href} asChild>
        <HapticPressable style={[styles.clientsLink, { borderColor: p.tint }]}>
          <Text style={[typography.buttonSm, { color: p.tint }]}>{t('clients').hubCta}</Text>
        </HapticPressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radius.lg, borderWidth: 1, padding: space.md, gap: space.md },
  head: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
  title: { ...typography.title, fontWeight: '900' },
  sub: { ...typography.caption, marginTop: 4 },
  phaseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  phaseCell: { width: '48%', flexGrow: 1 },
  phaseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: space.sm,
    paddingHorizontal: space.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 52,
  },
  phaseChipTablet: { paddingVertical: space.md },
  phaseNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseNumText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  chipText: { ...typography.captionBold, flex: 1 },
  clientsLink: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
  },
});
