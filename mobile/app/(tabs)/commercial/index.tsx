import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { SyncBanner } from '@/components/SyncBanner';
import { FunnelStepper } from '@/components/commercial/FunnelStepper';
import { PhaseToolsPanel } from '@/components/commercial/PhaseToolsPanel';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Surface } from '@/components/ui/Surface';
import { TabletScrollScreen } from '@/components/ui/TabletScrollScreen';
import { iconSize } from '@/constants/icons';
import { space, tabBarFloatingClearance } from '@/constants/layout';
import { typography } from '@/constants/typography';
import { useTabletLayout } from '@/hooks/useTabletLayout';
import { FUNNEL_HUB, inferPhaseFromStage, type CommercialPhase } from '@/lib/commercialFunnel';
import {
  commercialContextFromPipelineRow,
  toolHrefWithContext,
  type CommercialContext,
} from '@/lib/commercialLinks';
import { hydrateClientsFromApi } from '@/lib/clientRegistry';
import { loadLocalPipeline } from '@/lib/localPipelineStore';
import { t } from '@/lib/i18n';
import { useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Link, type Href } from 'expo-router';
import type { ComponentProps } from 'react';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PHASE_ICONS: Record<string, ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  prospecting: 'clipboard-text-outline',
  proposal: 'file-pdf-box',
  acceptance: 'handshake-outline',
  contract: 'file-document-edit-outline',
};

function inferHubPhase(rows: Awaited<ReturnType<typeof loadLocalPipeline>>): CommercialPhase {
  const open = rows.find((r) => !/contrato ativo|renovação anual/i.test(r.stage));
  if (!open) return 'prospecting';
  return inferPhaseFromStage(open.stage);
}

export default function CommercialHubScreen() {
  const p = Colors[useColorScheme() ?? 'light'];
  const C = t('commercial');
  const insets = useSafeAreaInsets();
  const pad = tabBarFloatingClearance(insets.bottom);
  const { isWide } = useTabletLayout();
  const [activePhase, setActivePhase] = useState<CommercialPhase>('prospecting');
  const [activeCtx, setActiveCtx] = useState<CommercialContext | undefined>();

  useFocusEffect(
    useCallback(() => {
      void hydrateClientsFromApi();
      void loadLocalPipeline().then((rows) => {
        setActivePhase(inferHubPhase(rows));
        const open = rows.find((r) => !/contrato ativo|renovação anual|contrato fechado/i.test(r.stage));
        setActiveCtx(open ? commercialContextFromPipelineRow(open) : undefined);
      });
    }, []),
  );

  return (
    <TabletScrollScreen
      style={{ backgroundColor: p.background }}
      padBottom={pad}
      contentContainerStyle={styles.root}>
      <SyncBanner />

      {activeCtx?.company ? (
        <Surface style={[styles.activeChip, { borderColor: p.tint, backgroundColor: `${p.tint}10` }]}>
          <Text style={[typography.captionBold, { color: p.tint }]}>{C.continueWith}</Text>
          <Text style={[typography.title, { color: p.text }]} numberOfLines={1}>
            {activeCtx.company}
          </Text>
          <Link href={toolHrefWithContext('/(tabs)/commercial/visit-session' as Href, activeCtx)} asChild>
            <SecondaryButton fullWidth tint label={C.continueVisit} accessibilityLabel={C.continueVisit} />
          </Link>
        </Surface>
      ) : null}
      <View style={isWide ? styles.topCtaRow : styles.topCtaStack}>
        <Link href={'/(tabs)/commercial/clients' as Href} asChild style={isWide ? styles.topCtaCell : undefined}>
          <PrimaryButton
            fullWidth
            label={t('clients').hubCta}
            accessibilityLabel={t('clients').hubCtaA11y}
            icon={<MaterialCommunityIcons name="account-group-outline" size={iconSize.sm} color="#fff" />}
          />
        </Link>
        {isWide ? (
          <Link href="/(tabs)/commercial/pipeline" asChild style={styles.topCtaCell}>
            <SecondaryButton fullWidth tint label={C.pipelineCta} accessibilityLabel={C.pipelineCta} />
          </Link>
        ) : null}
      </View>

      <Text style={[typography.body, styles.lead, { color: p.textSecondary }]}>{C.hubLead}</Text>

      <FunnelStepper activePhase={activePhase} />

      <Text style={[typography.caption, styles.hintCenter, { color: p.textSecondary }]}>
        {C.hubStartHere}
      </Text>

      <View style={isWide ? styles.phaseGrid : styles.phaseStack}>
        {FUNNEL_HUB.map((phase) => {
          const phaseCopy = C.funnelPhases[phase.phaseKey as keyof typeof C.funnelPhases];
          const icon = PHASE_ICONS[phase.phase] ?? 'circle-outline';
          const isActive = phase.phase === activePhase;

          return (
            <Surface
              key={phase.phase}
              elevated={isActive}
              style={[
                styles.phaseCard,
                ...(isWide ? [styles.phaseCardWide] : []),
                {
                  borderColor: isActive ? p.tint : p.border,
                  borderWidth: isActive ? 1.5 : 1,
                },
              ]}>
              <View style={[styles.phaseHead, { borderLeftColor: isActive ? p.tint : p.border }]}>
                <Text style={[typography.title, { color: p.text }]}>{phaseCopy.title}</Text>
                <Text style={[typography.caption, { color: p.textSecondary }]}>{phaseCopy.subtitle}</Text>
              </View>

              {phase.primaryHref && phase.primaryToolKey ? (
                <Link href={toolHrefWithContext(phase.primaryHref, activeCtx)} asChild>
                  <PrimaryButton
                    fullWidth
                    label={C.funnelTools[phase.primaryToolKey as keyof typeof C.funnelTools].title}
                    accessibilityLabel={
                      C.funnelTools[phase.primaryToolKey as keyof typeof C.funnelTools].title
                    }
                    icon={<MaterialCommunityIcons name={icon} size={iconSize.sm} color="#fff" />}
                  />
                </Link>
              ) : null}

              <PhaseToolsPanel
                tools={phase.tools}
                toolKeys={C.funnelTools}
                primaryToolKey={phase.primaryToolKey}
                context={activeCtx}
              />
            </Surface>
          );
        })}
      </View>

      {!isWide ? (
        <View style={styles.ctaBlock}>
          <Link href="/(tabs)/commercial/pipeline" asChild>
            <SecondaryButton fullWidth tint label={C.pipelineCta} accessibilityLabel={C.pipelineCta} />
          </Link>
        </View>
      ) : null}
    </TabletScrollScreen>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.md },
  lead: { marginBottom: space.xs },
  hintCenter: { textAlign: 'center' },
  phaseStack: { gap: space.md },
  phaseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
    justifyContent: 'space-between',
  },
  phaseCard: { padding: space.md, gap: space.sm },
  phaseCardWide: { width: '48.5%', flexGrow: 1 },
  phaseHead: {
    borderLeftWidth: 4,
    paddingLeft: space.sm,
    gap: 2,
    marginBottom: space.xs,
  },
  ctaBlock: { marginTop: space.xs },
  topCtaStack: { gap: space.sm },
  topCtaRow: { flexDirection: 'row', gap: space.md, alignItems: 'stretch' },
  topCtaCell: { flex: 1, minWidth: 0 },
  activeChip: { padding: space.md, gap: space.sm, borderRadius: 14, borderWidth: 1 },
});
