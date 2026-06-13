import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { radius, space } from '@/constants/layout';
import { typography } from '@/constants/typography';
import {
  COMMERCIAL_PHASE_ORDER,
  primaryHrefForPhase,
  phaseShortLabel,
  type CommercialPhase,
} from '@/lib/commercialFunnel';
import { useTabletLayout } from '@/hooks/useTabletLayout';
import { t } from '@/lib/i18n';
import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  activePhase: CommercialPhase;
  /** Versão compacta para cabeçalhos de telas */
  compact?: boolean;
};

export function FunnelStepper({ activePhase, compact }: Props) {
  const p = Colors[useColorScheme() ?? 'light'];
  const F = t('funnel');
  const { isTablet, funnelStepMinHeight } = useTabletLayout();
  const showLabels = !compact || isTablet;

  return (
    <View style={styles.wrap} accessibilityRole="tablist" accessibilityLabel={F.stepperA11y}>
      <View style={styles.row}>
        {COMMERCIAL_PHASE_ORDER.map((phase, index) => {
          const num = index + 1;
          const isActive = phase === activePhase;
          const isPast = COMMERCIAL_PHASE_ORDER.indexOf(activePhase) > index;
          const href = primaryHrefForPhase(phase);
          const label = phaseShortLabel(phase);

          return (
            <View key={phase} style={styles.stepCell}>
              {index > 0 ? (
                <View
                  style={[
                    styles.connector,
                    { backgroundColor: isPast || isActive ? p.tint : p.border },
                  ]}
                />
              ) : null}
              <Link href={href} asChild>
                <HapticPressable
                  style={[
                    styles.stepBtn,
                    compact && !isTablet && styles.stepBtnCompact,
                    {
                      minHeight: funnelStepMinHeight,
                      borderColor: isActive ? p.tint : p.border,
                      backgroundColor: isActive ? `${p.tint}18` : isPast ? `${p.tint}0a` : p.card,
                    },
                  ]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={`${num}. ${label}`}>
                  <Text
                    style={[
                      typography.captionBold,
                      styles.num,
                      { color: isActive || isPast ? p.tint : p.textSecondary },
                    ]}>
                    {num}
                  </Text>
                  {showLabels ? (
                    <Text
                      style={[
                        typography.caption,
                        isTablet ? styles.labelTablet : styles.label,
                        { color: isActive ? p.text : p.textSecondary },
                      ]}
                      numberOfLines={1}>
                      {label}
                    </Text>
                  ) : null}
                </HapticPressable>
              </Link>
            </View>
          );
        })}
      </View>
      {compact ? (
        <Text style={[typography.captionBold, styles.compactHint, { color: p.tint }]}>
          {F.phaseActive.replace('{n}', String(COMMERCIAL_PHASE_ORDER.indexOf(activePhase) + 1)).replace(
            '{title}',
            phaseShortLabel(activePhase),
          )}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.xs },
  row: { flexDirection: 'row', alignItems: 'center' },
  stepCell: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  connector: { height: 2, flex: 0.35, marginRight: 2, borderRadius: 1 },
  stepBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 48,
    gap: 2,
  },
  stepBtnCompact: { minHeight: 44, paddingVertical: 8 },
  num: { fontSize: 15 },
  label: { fontSize: 11, fontWeight: '600' },
  labelTablet: { fontSize: 13, fontWeight: '700' },
  compactHint: { textAlign: 'center', marginTop: 4 },
});
