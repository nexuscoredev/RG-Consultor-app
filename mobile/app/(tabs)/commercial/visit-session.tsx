import { ClientPicker } from '@/components/commercial/ClientPicker';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { Surface } from '@/components/ui/Surface';
import { TabletContent } from '@/components/ui/TabletContent';
import { useTabletLayout } from '@/hooks/useTabletLayout';
import { radius, space, tabBarFloatingClearance } from '@/constants/layout';
import { typography } from '@/constants/typography';
import { chevronSize, iconSize } from '@/constants/icons';
import {
  acceptanceHref,
  clientStorageKey,
  commercialToolHref,
  meetingLogHref,
  parseVisitSessionSearchParams,
  proposalHrefFromParams,
  prospectingHref,
  visitSessionHrefFromMeta,
} from '@/lib/commercialLinks';
import { type ClientRecord } from '@/lib/clientRegistry';
import { t } from '@/lib/i18n';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import { Link, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type StepTone = 'default' | 'accent' | 'success';

type FlowStep = {
  href: Href;
  title: string;
  hint: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  tone?: StepTone;
};

function VisitStepRow({ step }: { step: FlowStep }) {
  const p = Colors[useColorScheme() ?? 'light'];
  const { isTablet, touchMinHeight } = useTabletLayout();
  const borderColor = step.tone === 'accent' ? p.tint : step.tone === 'success' ? p.lime : p.border;
  const bg =
    step.tone === 'accent' ? `${p.tint}10` : step.tone === 'success' ? `${p.lime}12` : p.card;
  const chevronColor = step.tone === 'success' ? p.forestDeep : step.tone === 'accent' ? p.tint : p.textSecondary;
  const iconColor = step.tone === 'success' ? p.forestDeep : p.tint;

  return (
    <Link href={step.href} asChild>
      <HapticPressable
        style={[
          styles.step,
          isTablet && styles.stepTablet,
          { borderColor, backgroundColor: bg, minHeight: touchMinHeight },
        ]}
        accessibilityRole="button"
        accessibilityLabel={step.title}>
        <MaterialCommunityIcons name={step.icon} size={iconSize.lg} color={iconColor} />
        <View style={styles.stepBody}>
          <Text style={[typography.title, styles.stepTitle, { color: p.text }]}>{step.title}</Text>
          <Text style={[typography.caption, styles.stepHint, { color: p.textSecondary }]}>{step.hint}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={chevronSize} color={chevronColor} />
      </HapticPressable>
    </Link>
  );
}

function StepList({ steps }: { steps: FlowStep[] }) {
  const { isWide } = useTabletLayout();
  if (!isWide) {
    return (
      <>
        {steps.map((step) => (
          <VisitStepRow key={step.title} step={step} />
        ))}
      </>
    );
  }
  return (
    <View style={styles.stepGrid}>
      {steps.map((step) => (
        <View key={step.title} style={styles.stepGridCell}>
          <VisitStepRow step={step} />
        </View>
      ))}
    </View>
  );
}

function SectionLabel({ children }: { children: string }) {
  const p = Colors[useColorScheme() ?? 'light'];
  return <Text style={[typography.sectionLabel, styles.section, { color: p.textSecondary }]}>{children}</Text>;
}

export default function VisitSessionScreen() {
  const p = Colors[useColorScheme() ?? 'light'];
  const V = t('visitSession');
  const insets = useSafeAreaInsets();
  const pad = tabBarFloatingClearance(insets.bottom);
  const { horizontalPadding } = useTabletLayout();
  const raw = useLocalSearchParams<Record<string, string | string[]>>();
  const router = useRouter();
  const session = parseVisitSessionSearchParams(raw);

  if (!session?.company) {
    const goClient = (client: ClientRecord) => {
      router.replace(
        visitSessionHrefFromMeta(client.company, {
          stopId: `client-${client.id}`,
          contact: client.contactName,
          address: client.address,
          city: client.city,
          phone: client.phone,
        }),
      );
    };

    return (
      <ScrollView
        contentContainerStyle={[
          styles.centerScroll,
          { backgroundColor: p.background, paddingBottom: pad, paddingHorizontal: horizontalPadding },
        ]}>
        <TabletContent>
          <Text style={[typography.body, { color: p.textSecondary, marginBottom: space.md }]}>{V.missingParams}</Text>
          <ClientPicker onSelect={goClient} />
          <Link href={'/(tabs)/commercial/clients?new=1' as Href} asChild style={{ marginTop: space.md }}>
            <PrimaryButton label={t('clients').add} accessibilityLabel={t('clients').add} />
          </Link>
          <Link href={'/(tabs)/agenda' as Href} asChild style={{ marginTop: space.sm }}>
            <SecondaryButton fullWidth tint label={V.backAgenda} accessibilityLabel={V.backAgendaA11y} />
          </Link>
        </TabletContent>
      </ScrollView>
    );
  }

  const ck = clientStorageKey(session);

  const prepSteps: FlowStep[] = [
    {
      href: prospectingHref(session.company),
      title: V.stepProspecting,
      hint: V.stepProspectingHint,
      icon: 'clipboard-text-outline',
    },
    {
      href: commercialToolHref('visit-playbook', session),
      title: V.stepPlaybook,
      hint: V.stepPlaybookHint,
      icon: 'format-list-numbered',
    },
    {
      href: commercialToolHref('pitch-faq', session),
      title: V.stepPitch,
      hint: V.stepPitchHint,
      icon: 'bullhorn',
    },
    {
      href: commercialToolHref('docs-checklist', session),
      title: V.stepDocs,
      hint: V.stepDocsHint.replace('{company}', session.company),
      icon: 'checkbox-marked-outline',
    },
    {
      href: commercialToolHref('calculator', session),
      title: V.stepCalc,
      hint: V.stepCalcHint,
      icon: 'calculator-variant',
    },
    {
      href: commercialToolHref('cases', session),
      title: V.stepCases,
      hint: V.stepCasesHint,
      icon: 'briefcase-outline',
    },
    {
      href: commercialToolHref('compare', session),
      title: V.stepCompare,
      hint: V.stepCompareHint,
      icon: 'scale-balance',
    },
  ];

  const closingSteps: FlowStep[] = [
    {
      href: proposalHrefFromParams(session),
      title: V.stepProposal,
      hint: V.stepProposalHint,
      icon: 'file-pdf-box',
      tone: 'accent',
    },
    {
      href: meetingLogHref(session.company),
      title: V.stepLog,
      hint: V.stepLogHint,
      icon: 'notebook-edit-outline',
    },
    {
      href: commercialToolHref('followup', session, {
        nome: session.contact || session.company,
        empresa: session.company,
        ...(session.phone ? { phone: session.phone } : {}),
      }),
      title: V.stepFollowup,
      hint: V.stepFollowupHint,
      icon: 'message-text-outline',
    },
    {
      href: acceptanceHref({
        company: session.company,
        clientName: session.contact,
        phone: session.phone,
      }),
      title: V.stepAcceptance,
      hint: V.stepAcceptanceHint,
      icon: 'handshake-outline',
      tone: 'accent',
    },
    {
      href: commercialToolHref('intent-term', session),
      title: V.stepIntent,
      hint: V.stepIntentHint,
      icon: 'file-sign',
    },
    {
      href: commercialToolHref('contract-kit', session),
      title: V.stepContractKit,
      hint: V.stepContractKitHint,
      icon: 'file-certificate-outline',
    },
    {
      href: commercialToolHref('contract-flow', session),
      title: V.stepContract,
      hint: V.stepContractHint,
      icon: 'file-document-edit-outline',
      tone: 'success',
    },
  ];

  return (
    <ScrollView
      contentContainerStyle={[
        styles.root,
        { backgroundColor: p.background, paddingBottom: pad, paddingHorizontal: horizontalPadding, paddingTop: space.lg, gap: space.sm },
      ]}
      showsVerticalScrollIndicator={false}>
      <TabletContent>
      <Surface elevated style={{ gap: space.xs }}>
        <Text style={[typography.eyebrow, { color: p.tint }]}>{V.eyebrow}</Text>
        <Text style={[typography.h2, { color: p.text }]}>{session.company}</Text>
        {session.contact ? (
          <Text style={[typography.body, { color: p.textSecondary }]}>
            {V.withContact.replace('{name}', session.contact)}
          </Text>
        ) : null}
        {session.address ? (
          <Text style={[typography.body, { color: p.textSecondary }]}>
            {session.address}
            {session.city ? ` · ${session.city}` : ''}
          </Text>
        ) : null}
        <Text style={[typography.meta, { color: p.textSecondary }]}>
          {V.clientRef.replace('{id}', ck.slice(0, 8))}
        </Text>
      </Surface>

      <Text style={[typography.body, styles.lead, { color: p.textSecondary }]}>{V.lead}</Text>

      <SectionLabel>{V.sectionPrep}</SectionLabel>
      <StepList steps={prepSteps} />

      <SectionLabel>{V.sectionClosing}</SectionLabel>
      <StepList steps={closingSteps} />
      </TabletContent>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.sm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.lg },
  centerScroll: { paddingTop: space.lg, gap: space.md },
  lead: { marginVertical: space.xs },
  section: { marginTop: space.xs, marginBottom: 2 },
  stepGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  stepGridCell: { width: '48%', flexGrow: 1 },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  stepTablet: { padding: space.lg },
  stepBody: { flex: 1 },
  stepTitle: {},
  stepHint: { marginTop: 2 },
});
