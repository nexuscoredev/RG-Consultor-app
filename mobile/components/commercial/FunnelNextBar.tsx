import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { space } from '@/constants/layout';
import { typography } from '@/constants/typography';
import { chevronSize } from '@/constants/icons';
import { nextPhase, phaseShortLabel, type CommercialPhase } from '@/lib/commercialFunnel';
import { phaseHref, type CommercialContext } from '@/lib/commercialLinks';
import { t } from '@/lib/i18n';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Link, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  currentPhase: CommercialPhase;
  /** Texto curto do que fazer na próxima fase */
  hint?: string;
  /** Contexto do cliente para a próxima fase */
  context?: CommercialContext;
};

export function FunnelNextBar({ currentPhase, hint, context }: Props) {
  const p = Colors[useColorScheme() ?? 'light'];
  const F = t('funnel');
  const next = nextPhase(currentPhase);

  if (!next) {
    return (
      <View style={[styles.wrap, { borderColor: p.border, backgroundColor: `${p.lime}14` }]}>
        <Text style={[typography.bodyBold, { color: p.forestDeep }]}>{F.flowComplete}</Text>
        <Link href="/(tabs)/commercial/pipeline" asChild>
          <SecondaryButton fullWidth tint label={F.viewPipeline} accessibilityLabel={F.viewPipeline} />
        </Link>
      </View>
    );
  }

  const nextNum = COMMERCIAL_PHASE_INDEX[next] + 1;
  const nextTitle = phaseShortLabel(next);
  const nextHref = phaseHref(next, context);

  return (
    <View style={[styles.wrap, { borderColor: p.border, backgroundColor: p.card }]}>
      <Text style={[typography.captionBold, { color: p.textSecondary }]}>{F.nextPhaseTitle}</Text>
      {hint ? <Text style={[typography.caption, { color: p.textSecondary }]}>{hint}</Text> : null}
      <Link href={nextHref as Href} asChild>
        <PrimaryButton
          fullWidth
          label={F.nextPhaseCta.replace('{n}', String(nextNum)).replace('{title}', nextTitle)}
          accessibilityLabel={F.nextPhaseCta.replace('{n}', String(nextNum)).replace('{title}', nextTitle)}
          icon={<MaterialCommunityIcons name="arrow-right" size={chevronSize} color="#fff" />}
        />
      </Link>
    </View>
  );
}

const COMMERCIAL_PHASE_INDEX: Record<CommercialPhase, number> = {
  prospecting: 0,
  proposal: 1,
  acceptance: 2,
  contract: 3,
};

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 14,
    borderWidth: 1,
    padding: space.md,
    gap: space.sm,
    marginTop: space.md,
  },
});
