import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { Surface } from '@/components/ui/Surface';
import { radius, screenScroll, space, tabBarFloatingClearance } from '@/constants/layout';
import { typography } from '@/constants/typography';
import { chevronSize, iconSize } from '@/constants/icons';
import {
  clientStorageKey,
  commercialToolHref,
  followupHref,
  meetingLogHref,
  parseVisitSessionSearchParams,
  proposalHrefFromParams,
} from '@/lib/commercialLinks';
import { t } from '@/lib/i18n';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import { Link, useLocalSearchParams, type Href } from 'expo-router';
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
  const borderColor = step.tone === 'accent' ? p.tint : step.tone === 'success' ? p.lime : p.border;
  const bg =
    step.tone === 'accent' ? `${p.tint}10` : step.tone === 'success' ? `${p.lime}12` : p.card;
  const chevronColor = step.tone === 'success' ? p.forestDeep : step.tone === 'accent' ? p.tint : p.textSecondary;
  const iconColor = step.tone === 'success' ? p.forestDeep : p.tint;

  return (
    <Link href={step.href} asChild>
      <HapticPressable
        style={[styles.step, { borderColor, backgroundColor: bg }]}
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

function SectionLabel({ children }: { children: string }) {
  const p = Colors[useColorScheme() ?? 'light'];
  return <Text style={[typography.sectionLabel, styles.section, { color: p.textSecondary }]}>{children}</Text>;
}

export default function VisitSessionScreen() {
  const p = Colors[useColorScheme() ?? 'light'];
  const V = t('visitSession');
  const insets = useSafeAreaInsets();
  const pad = tabBarFloatingClearance(insets.bottom);
  const raw = useLocalSearchParams<Record<string, string | string[]>>();
  const session = parseVisitSessionSearchParams(raw);

  if (!session?.company) {
    return (
      <View style={[styles.center, { backgroundColor: p.background }]}>
        <Text style={{ color: p.textSecondary }}>{V.missingParams}</Text>
        <Link href={'/(tabs)/agenda' as Href} asChild>
          <PrimaryButton
            label={V.backAgenda}
            accessibilityLabel={V.backAgendaA11y}
            style={{ marginTop: space.md }}
          />
        </Link>
      </View>
    );
  }

  const ck = clientStorageKey(session);

  const prepSteps: FlowStep[] = [
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
      href: followupHref(session.contact || session.company, session.company, session.phone),
      title: V.stepFollowup,
      hint: V.stepFollowupHint,
      icon: 'message-text-outline',
    },
    {
      href: commercialToolHref('contract-flow', session),
      title: V.stepContract,
      hint: V.stepContractHint,
      icon: 'file-sign',
      tone: 'success',
    },
  ];

  return (
    <ScrollView
      contentContainerStyle={[
        styles.root,
        screenScroll,
        { backgroundColor: p.background, paddingBottom: pad },
      ]}
      showsVerticalScrollIndicator={false}>
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
      {prepSteps.map((step) => (
        <VisitStepRow key={step.title} step={step} />
      ))}

      <SectionLabel>{V.sectionClosing}</SectionLabel>
      {closingSteps.map((step) => (
        <VisitStepRow key={step.title} step={step} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.sm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.lg },
  lead: { marginVertical: space.xs },
  section: { marginTop: space.xs, marginBottom: 2 },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  stepBody: { flex: 1 },
  stepTitle: {},
  stepHint: { marginTop: 2 },
});
