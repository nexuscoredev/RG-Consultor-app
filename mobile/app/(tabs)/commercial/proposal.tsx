import Colors from '@/constants/Colors';
import { FormFieldCell, FormFieldRow } from '@/components/commercial/FormFieldRow';
import { FunnelNextBar } from '@/components/commercial/FunnelNextBar';
import { FunnelStepper } from '@/components/commercial/FunnelStepper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { TabletContent } from '@/components/ui/TabletContent';
import { useColorScheme } from '@/components/useColorScheme';
import { space, tabBarFloatingClearance } from '@/constants/layout';
import { useCommercialDraftWithLoad } from '@/hooks/useCommercialDraft';
import { useTabletLayout } from '@/hooks/useTabletLayout';
import { useGamification } from '@/context/GamificationContext';
import { useSync } from '@/context/SyncContext';
import {
  acceptanceHref,
  buildCommercialContext,
  parseCommercialContext,
} from '@/lib/commercialLinks';
import {
  draftScopeKey,
  proposalDraftStorage,
  type ProposalDraft,
} from '@/lib/commercialStorage';
import { afterCommercialEnqueue } from '@/lib/commercialSync';
import { recordPipelineStep } from '@/lib/gamificationEngine';
import { t } from '@/lib/i18n';
import { syncProposalToPipeline } from '@/lib/localPipelineStore';
import { enqueueProposalSent } from '@/lib/outbox';
import {
  buildProposalHtml,
  buildProposalWhatsAppSummary,
  nextProposalNumber,
  whatsAppUrl,
} from '@/lib/proposalTemplate';
import { exportHtmlDocument } from '@/lib/documentExport';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProposalPdfScreen() {
  const p = Colors[useColorScheme() ?? 'light'];
  const P = t('proposal');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const padBottom = tabBarFloatingClearance(insets.bottom);
  const { horizontalPadding } = useTabletLayout();
  const { refresh: refreshGamification } = useGamification();
  const sync = useSync();
  const rawParams = useLocalSearchParams();
  const urlCtx = useMemo(
    () => parseCommercialContext(rawParams as Record<string, string | string[] | undefined>),
    [rawParams],
  );
  const draftScope = useMemo(() => draftScopeKey(urlCtx.company, urlCtx.stopId), [urlCtx.company, urlCtx.stopId]);

  const [clientName, setClientName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [scope, setScope] = useState('');
  const [value, setValue] = useState('');
  const [validity, setValidity] = useState('15');
  const [proposalNumber, setProposalNumber] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (urlCtx.company) setCompany((v) => v || urlCtx.company!);
    const cn = urlCtx.clientName ?? urlCtx.contact;
    if (cn) setClientName((v) => v || cn);
    if (urlCtx.scope) setScope((v) => v || urlCtx.scope!);
    if (urlCtx.value) setValue((v) => v || urlCtx.value!);
    if (urlCtx.email) setEmail((v) => v || urlCtx.email!);
  }, [urlCtx.company, urlCtx.clientName, urlCtx.contact, urlCtx.scope, urlCtx.value, urlCtx.email]);

  const applyDraft = useCallback((d: ProposalDraft) => {
    setClientName(d.clientName);
    setCompany(d.company);
    setEmail(d.email);
    setScope(d.scope);
    setValue(d.value);
    setValidity(d.validity || '15');
    setProposalNumber(d.proposalNumber);
  }, []);

  const draftPayload = useMemo(
    (): ProposalDraft => ({
      clientName,
      company,
      email,
      scope,
      value,
      validity,
      proposalNumber,
    }),
    [clientName, company, email, scope, value, validity, proposalNumber],
  );

  const { clearDraft } = useCommercialDraftWithLoad(proposalDraftStorage, draftScope, draftPayload, applyDraft);

  const funnelContext = useMemo(
    () =>
      buildCommercialContext(urlCtx, {
        company,
        clientName,
        email,
        scope,
        value,
        proposalNumber,
      }),
    [urlCtx, company, clientName, email, scope, value, proposalNumber],
  );

  const onGenerate = useCallback(async () => {
    if (!company.trim() || !clientName.trim()) {
      Alert.alert(P.title, P.missingFields);
      return;
    }
    setBusy(true);
    try {
      const num = await nextProposalNumber();
      setProposalNumber(num);
      const issued = new Date().toLocaleDateString('pt-BR');
      const html = buildProposalHtml({
        proposalNumber: num,
        issued,
        clientName: clientName.trim(),
        company: company.trim(),
        email: email.trim(),
        scope: scope.trim(),
        value: value.trim(),
        validityDays: validity.trim() || '15',
      });

      await exportHtmlDocument({
        html,
        dialogTitle: P.title,
        webDocumentTitle: `Proposta ${num}`,
      });
      await syncProposalToPipeline({
        company: company.trim(),
        value: value.trim(),
        proposalNumber: num,
        scope: scope.trim(),
      });
      enqueueProposalSent({
        company: company.trim(),
        clientName: clientName.trim(),
        value: value.trim(),
        proposalNumber: num,
        scope: scope.trim(),
      });
      afterCommercialEnqueue(sync);
      recordPipelineStep('proposta');
      refreshGamification();
      await clearDraft();

      const waText = buildProposalWhatsAppSummary({
        proposalNumber: num,
        company: company.trim(),
        clientName: clientName.trim(),
        value: value.trim(),
        validityDays: validity.trim() || '15',
      });
      const acceptHref = acceptanceHref({
        company: company.trim(),
        clientName: clientName.trim(),
        proposalNumber: num,
        value: value.trim(),
        email: email.trim(),
      });
      Alert.alert(P.title, P.generatedOk, [
        { text: P.waLater, style: 'cancel' },
        {
          text: P.registerAcceptance,
          onPress: () => router.push(acceptHref as Href),
        },
        {
          text: P.waOpen,
          onPress: () => void Linking.openURL(whatsAppUrl(waText)),
        },
      ]);
    } catch {
      Alert.alert(P.title, P.printFail);
    } finally {
      setBusy(false);
    }
  }, [P, clientName, company, email, scope, value, validity, refreshGamification, router, sync, clearDraft]);

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.root,
        { backgroundColor: p.background, paddingBottom: padBottom, paddingHorizontal: horizontalPadding },
      ]}>
      <TabletContent>
        <FunnelStepper activePhase="proposal" compact />
        <Text style={[styles.title, { color: p.text }]}>{P.title}</Text>
        <Text style={[styles.sub, { color: p.textSecondary }]}>{P.subtitle}</Text>

        {proposalNumber ? (
          <View style={[styles.numBadge, { backgroundColor: `${p.tint}14`, borderColor: p.tint }]}>
            <Text style={[styles.numText, { color: p.tint }]}>
              {P.lastNumber}: {proposalNumber}
            </Text>
          </View>
        ) : null}

        <View style={[styles.callout, { borderColor: p.border, backgroundColor: p.card }]}>
          <Text style={[styles.calloutTitle, { color: p.tint }]}>{P.checklistTitle}</Text>
          <Text style={[styles.calloutBody, { color: p.textSecondary }]}>{P.checklistBody}</Text>
        </View>

        <FormFieldRow>
          <FormFieldCell>
            <Field label={P.clientName} value={clientName} onChangeText={setClientName} p={p} />
          </FormFieldCell>
          <FormFieldCell>
            <Field label={P.company} value={company} onChangeText={setCompany} p={p} />
          </FormFieldCell>
        </FormFieldRow>
        <FormFieldRow>
          <FormFieldCell>
            <Field label={P.email} value={email} onChangeText={setEmail} p={p} keyboardType="email-address" />
          </FormFieldCell>
          <FormFieldCell>
            <Field label={P.value} value={value} onChangeText={setValue} p={p} />
          </FormFieldCell>
        </FormFieldRow>
        <Field label={P.scope} value={scope} onChangeText={setScope} p={p} multiline />
        <Field label={P.validity} value={validity} onChangeText={setValidity} p={p} keyboardType="number-pad" />

        <PrimaryButton
          fullWidth
          label={P.generate}
          onPress={() => void onGenerate()}
          disabled={busy}
          loading={busy}
          accessibilityLabel={P.generate}
        />

        <FunnelNextBar currentPhase="proposal" hint={t('funnel').phase2Hint} context={funnelContext} />
      </TabletContent>
    </ScrollView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  p,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  p: (typeof Colors)['light'];
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'number-pad';
}) {
  const { isTablet } = useTabletLayout();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: p.textSecondary }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={p.textSecondary}
        style={[
          styles.input,
          isTablet && styles.inputTablet,
          { borderColor: p.border, color: p.text, backgroundColor: p.card },
          multiline ? { minHeight: isTablet ? 120 : 100, textAlignVertical: 'top' } : null,
        ]}
        multiline={multiline}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingTop: space.md, gap: space.md },
  inputTablet: { minHeight: 52, fontSize: 17, paddingVertical: 12 },
  title: { fontSize: 24, fontWeight: '900' },
  sub: { fontSize: 14, lineHeight: 20 },
  numBadge: { borderWidth: 1, borderRadius: 12, padding: 10 },
  numText: { fontSize: 13, fontWeight: '800' },
  callout: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 6 },
  calloutTitle: { fontSize: 13, fontWeight: '800' },
  calloutBody: { fontSize: 13, lineHeight: 19 },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: '700' },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
});
