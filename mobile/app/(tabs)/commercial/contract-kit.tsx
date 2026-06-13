import Colors from '@/constants/Colors';
import { FunnelNextBar } from '@/components/commercial/FunnelNextBar';
import { FunnelStepper } from '@/components/commercial/FunnelStepper';
import { useColorScheme } from '@/components/useColorScheme';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { TabletContent } from '@/components/ui/TabletContent';
import { Surface } from '@/components/ui/Surface';
import { useTabletLayout } from '@/hooks/useTabletLayout';
import { space, tabBarFloatingClearance } from '@/constants/layout';
import { typography } from '@/constants/typography';
import { parseCommercialContext, phaseHref } from '@/lib/commercialLinks';
import { CONTRACT_KIT_SECTIONS, CONTRACT_PRE_SIGN_CHECKLIST } from '@/lib/commercialContent';
import { t } from '@/lib/i18n';
import { Link, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ContractKitScreen() {
  const p = Colors[useColorScheme() ?? 'light'];
  const CK = t('contractKit');
  const insets = useSafeAreaInsets();
  const pad = tabBarFloatingClearance(insets.bottom);
  const { horizontalPadding, isTablet } = useTabletLayout();
  const raw = useLocalSearchParams();
  const funnelContext = useMemo(
    () => parseCommercialContext(raw as Record<string, string | string[] | undefined>),
    [raw],
  );
  const contractHref = useMemo(() => phaseHref('contract', funnelContext), [funnelContext]);
  const proposalHref = useMemo(() => phaseHref('proposal', funnelContext), [funnelContext]);

  return (
    <ScrollView
      contentContainerStyle={[
        styles.root,
        { backgroundColor: p.background, paddingBottom: pad, paddingHorizontal: horizontalPadding },
      ]}>
      <TabletContent>
        <FunnelStepper activePhase="contract" compact />
        <Text style={[typography.body, styles.intro, { color: p.textSecondary }]}>{CK.intro}</Text>

        <Text style={[typography.title, { color: p.text }]}>{CK.preSignTitle}</Text>
        <Surface
          elevated
          style={[styles.card, ...(isTablet ? [styles.cardTablet] : []), { borderColor: p.border }]}>
          {CONTRACT_PRE_SIGN_CHECKLIST.map((line) => (
            <Text
              key={line}
              style={[typography.body, isTablet && styles.bulletTablet, styles.bullet, { color: p.text }]}>
              ☐ {line}
            </Text>
          ))}
        </Surface>

        <Text style={[typography.title, { color: p.text }]}>{CK.sectionsTitle}</Text>
        <View style={isTablet ? styles.sectionGrid : undefined}>
          {CONTRACT_KIT_SECTIONS.map((sec) => (
            <Surface
              key={sec.title}
              style={[
                styles.card,
                ...(isTablet ? [styles.cardTablet, styles.cardGridItem] : []),
                { borderColor: p.border },
              ]}>
              <Text style={[typography.bodyBold, isTablet && typography.title, { color: p.tint }]}>{sec.title}</Text>
              {sec.bullets.map((b) => (
                <Text
                  key={b}
                  style={[typography.body, isTablet && styles.bulletTablet, styles.bullet, { color: p.text }]}>
                  • {b}
                </Text>
              ))}
            </Surface>
          ))}
        </View>

        <Link href={contractHref} asChild>
          <PrimaryButton fullWidth label={CK.openFlow} accessibilityLabel={CK.openFlow} />
        </Link>
        <Link href={proposalHref} asChild>
          <SecondaryButton fullWidth tint label={CK.openProposal} accessibilityLabel={CK.openProposal} />
        </Link>

        <FunnelNextBar currentPhase="contract" hint={t('funnel').phase4Hint} />
      </TabletContent>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { paddingTop: space.md, gap: space.md },
  intro: {},
  card: { padding: space.md, borderRadius: 16, borderWidth: 1, gap: space.sm },
  cardTablet: { padding: space.lg },
  sectionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  cardGridItem: { width: '48%', flexGrow: 1 },
  bullet: { lineHeight: 22 },
  bulletTablet: { fontSize: 16, lineHeight: 24 },
});
