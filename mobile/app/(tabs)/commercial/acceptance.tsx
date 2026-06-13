import Colors from '@/constants/Colors';
import { FormFieldCell, FormFieldRow } from '@/components/commercial/FormFieldRow';
import { FunnelNextBar } from '@/components/commercial/FunnelNextBar';
import { FunnelStepper } from '@/components/commercial/FunnelStepper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { TabletScrollScreen } from '@/components/ui/TabletScrollScreen';
import { useColorScheme } from '@/components/useColorScheme';
import { useCommercialDraftWithLoad } from '@/hooks/useCommercialDraft';
import { useTabletLayout } from '@/hooks/useTabletLayout';
import { useSync } from '@/context/SyncContext';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { Surface } from '@/components/ui/Surface';
import { space, tabBarFloatingClearance } from '@/constants/layout';
import { typography } from '@/constants/typography';
import { useGamification } from '@/context/GamificationContext';
import {
  ACCEPTANCE_DOC_CHECKLIST,
  ACCEPTANCE_EMAIL,
  ACCEPTANCE_TYPES,
  ACCEPTANCE_WHATSAPP,
} from '@/lib/commercialContent';
import {
  buildCommercialContext,
  parseCommercialContext,
  phaseHref,
} from '@/lib/commercialLinks';
import {
  COMMERCIAL_HISTORY_UI_PAGE,
  acceptanceDraftStorage,
  draftScopeKey,
  loadAcceptanceRecords,
  saveAcceptanceRecords,
  type AcceptanceDraft,
  type AcceptanceRecord,
} from '@/lib/commercialStorage';
import { afterCommercialEnqueue } from '@/lib/commercialSync';
import { recordPipelineStep } from '@/lib/gamificationEngine';
import { syncAcceptanceToPipeline } from '@/lib/localPipelineStore';
import { enqueueProposalAccepted } from '@/lib/outbox';
import { whatsAppUrl } from '@/lib/proposalTemplate';
import { t } from '@/lib/i18n';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { Link, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function fill(template: string, vars: Record<string, string>) {
  let s = template;
  for (const [k, v] of Object.entries(vars)) {
    s = s.split(`{${k}}`).join(v);
  }
  return s;
}

type MiniProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  p: (typeof Colors)['light'];
  multiline?: boolean;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
};

function Mini({ label, value, onChangeText, p, multiline, keyboardType }: MiniProps) {
  const { isTablet } = useTabletLayout();
  return (
    <View style={styles.field}>
      <Text style={[typography.captionBold, { color: p.textSecondary }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={p.textSecondary}
        multiline={multiline}
        keyboardType={keyboardType}
        style={[
          styles.input,
          isTablet && styles.inputTablet,
          multiline && styles.inputMulti,
          { color: p.text, borderColor: p.border, backgroundColor: p.background },
        ]}
      />
    </View>
  );
}

export default function AcceptanceScreen() {
  const p = Colors[useColorScheme() ?? 'light'];
  const A = t('acceptance');
  const insets = useSafeAreaInsets();
  const pad = tabBarFloatingClearance(insets.bottom);
  const { isTablet, touchMinHeight } = useTabletLayout();
  const raw = useLocalSearchParams();
  const urlCtx = useMemo(
    () => parseCommercialContext(raw as Record<string, string | string[] | undefined>),
    [raw],
  );
  const draftScope = useMemo(() => draftScopeKey(urlCtx.company, urlCtx.stopId), [urlCtx.company, urlCtx.stopId]);
  const router = useRouter();
  const { refresh: refreshGamification } = useGamification();
  const sync = useSync();

  const [company, setCompany] = useState('');
  const [proposalNumber, setProposalNumber] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [acceptedValue, setAcceptedValue] = useState('');
  const [scopeSummary, setScopeSummary] = useState('');
  const [acceptanceType, setAcceptanceType] = useState<string>(ACCEPTANCE_TYPES[0].id);
  const [acceptanceDate, setAcceptanceDate] = useState('');
  const [notes, setNotes] = useState('');
  const [consultant, setConsultant] = useState('Consultor RG');
  const [deadline, setDeadline] = useState('5 dias úteis');
  const [docChecks, setDocChecks] = useState<Record<string, boolean>>({});
  const [history, setHistory] = useState<AcceptanceRecord[]>([]);

  useEffect(() => {
    if (urlCtx.company) setCompany((v) => v || urlCtx.company!);
    if (urlCtx.clientName) setContactName((v) => v || urlCtx.clientName!);
    if (urlCtx.value) setAcceptedValue((v) => v || urlCtx.value!);
    if (urlCtx.phone) setPhone((v) => v || urlCtx.phone!);
    if (urlCtx.email) setEmail((v) => v || urlCtx.email!);
    if (urlCtx.proposalNumber) setProposalNumber((v) => v || urlCtx.proposalNumber!);
  }, [
    urlCtx.company,
    urlCtx.clientName,
    urlCtx.value,
    urlCtx.phone,
    urlCtx.email,
    urlCtx.proposalNumber,
  ]);

  const applyDraft = useCallback((d: AcceptanceDraft) => {
    setCompany(d.company);
    setProposalNumber(d.proposalNumber);
    setContactName(d.contactName);
    setEmail(d.email);
    setPhone(d.phone);
    setAcceptedValue(d.acceptedValue);
    setScopeSummary(d.scopeSummary);
    setAcceptanceType(d.acceptanceType || ACCEPTANCE_TYPES[0].id);
    setAcceptanceDate(d.acceptanceDate);
    setDocChecks(d.docChecks ?? {});
    setConsultant(d.consultant || 'Consultor RG');
    setDeadline(d.deadline || '5 dias úteis');
    setNotes(d.notes);
  }, []);

  const draftPayload = useMemo(
    (): AcceptanceDraft => ({
      company,
      proposalNumber,
      contactName,
      email,
      phone,
      acceptedValue,
      scopeSummary,
      acceptanceType,
      acceptanceDate,
      docChecks,
      consultant,
      deadline,
      notes,
    }),
    [
      company,
      proposalNumber,
      contactName,
      email,
      phone,
      acceptedValue,
      scopeSummary,
      acceptanceType,
      acceptanceDate,
      docChecks,
      consultant,
      deadline,
      notes,
    ],
  );

  const { clearDraft } = useCommercialDraftWithLoad(
    acceptanceDraftStorage,
    draftScope,
    draftPayload,
    applyDraft,
  );

  const funnelContext = useMemo(
    () =>
      buildCommercialContext(urlCtx, {
        company,
        clientName: contactName,
        email,
        phone,
        value: acceptedValue,
        proposalNumber,
        cnpj: urlCtx.cnpj,
      }),
    [urlCtx, company, contactName, email, phone, acceptedValue, proposalNumber],
  );

  useEffect(() => {
    void loadAcceptanceRecords().then(setHistory);
  }, []);

  const docList = useMemo(() => {
    const pending = ACCEPTANCE_DOC_CHECKLIST.filter((d) => docChecks[d.id])
      .map((d) => `• ${d.label}`);
    return pending.length ? pending.join('\n') : '• Conforme combinado na proposta';
  }, [docChecks]);

  const vars = useMemo(
    () => ({
      NOME: contactName || 'Cliente',
      EMPRESA: company || 'sua empresa',
      PROPOSTA: proposalNumber || '—',
      ESCOPO: scopeSummary || 'escopo da proposta RG',
      VALOR: acceptedValue || 'conforme proposta',
      PRAZO: deadline,
      DOC_LIST: docList,
      CONSULTOR: consultant,
    }),
    [contactName, company, proposalNumber, scopeSummary, acceptedValue, deadline, docList, consultant],
  );

  const emailBody = fill(ACCEPTANCE_EMAIL, vars);
  const waBody = fill(ACCEPTANCE_WHATSAPP, vars);
  const mailto = `mailto:${encodeURIComponent(email.trim())}?subject=${encodeURIComponent(
    `RG Ambiental — aceite ${proposalNumber}`,
  )}&body=${encodeURIComponent(emailBody)}`;

  const save = useCallback(async () => {
    if (!company.trim()) {
      Alert.alert(A.title, A.missingCompany);
      return;
    }
    const row: AcceptanceRecord = {
      id: newId(),
      at: Date.now(),
      company: company.trim(),
      proposalNumber: proposalNumber.trim(),
      contactName: contactName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      acceptedValue: acceptedValue.trim(),
      scopeSummary: scopeSummary.trim(),
      acceptanceType,
      acceptanceDate: acceptanceDate.trim(),
      docsPending: docList,
      sendChannel: '',
      notes: notes.trim(),
    };
    const next = [row, ...history];
    setHistory(next);
    await saveAcceptanceRecords(next);
    await syncAcceptanceToPipeline({
      id: row.id,
      company: row.company,
      proposalNumber: row.proposalNumber,
      acceptedValue: row.acceptedValue,
      docsPending: row.docsPending.slice(0, 120),
    });
    enqueueProposalAccepted({
      company: row.company,
      proposalNumber: row.proposalNumber,
      acceptedValue: row.acceptedValue,
      acceptanceType: row.acceptanceType,
    });
    afterCommercialEnqueue(sync);
    recordPipelineStep('proposta');
    refreshGamification();
    await clearDraft();
    const contractHref = phaseHref('contract', funnelContext);
    Alert.alert(A.title, A.saved, [
      { text: A.ok, style: 'default' },
      { text: A.viewPipeline, onPress: () => router.push('/(tabs)/commercial/pipeline' as Href) },
      { text: A.viewContract, onPress: () => router.push(contractHref) },
    ]);
  }, [
    A,
    company,
    proposalNumber,
    contactName,
    email,
    phone,
    acceptedValue,
    scopeSummary,
    acceptanceType,
    acceptanceDate,
    docList,
    notes,
    history,
    refreshGamification,
    router,
    sync,
    clearDraft,
    funnelContext,
  ]);

  const copy = useCallback(
    async (text: string, label: string) => {
      await Clipboard.setStringAsync(text);
      Alert.alert(A.copiedTitle, `${label} ${A.copiedBody}`);
    },
    [A],
  );

  return (
    <TabletScrollScreen
      style={{ backgroundColor: p.background }}
      padBottom={pad}
      contentContainerStyle={styles.root}>
        <FunnelStepper activePhase="acceptance" compact />
        <Text style={[typography.body, styles.intro, { color: p.textSecondary }]}>{A.intro}</Text>

        <Surface elevated style={[styles.form, { borderColor: p.border }]}>
          <FormFieldRow>
            <FormFieldCell>
              <Mini label={A.company} value={company} onChangeText={setCompany} p={p} />
            </FormFieldCell>
            <FormFieldCell>
              <Mini label={A.proposalNumber} value={proposalNumber} onChangeText={setProposalNumber} p={p} />
            </FormFieldCell>
          </FormFieldRow>
          <FormFieldRow>
            <FormFieldCell>
              <Mini label={A.contactName} value={contactName} onChangeText={setContactName} p={p} />
            </FormFieldCell>
            <FormFieldCell>
              <Mini label={A.phone} value={phone} onChangeText={setPhone} p={p} keyboardType="phone-pad" />
            </FormFieldCell>
          </FormFieldRow>
          <FormFieldRow>
            <FormFieldCell>
              <Mini label={A.email} value={email} onChangeText={setEmail} p={p} keyboardType="email-address" />
            </FormFieldCell>
            <FormFieldCell>
              <Mini label={A.acceptedValue} value={acceptedValue} onChangeText={setAcceptedValue} p={p} />
            </FormFieldCell>
          </FormFieldRow>
          <Mini label={A.scopeSummary} value={scopeSummary} onChangeText={setScopeSummary} p={p} multiline />
          <Mini label={A.acceptanceDate} value={acceptanceDate} onChangeText={setAcceptanceDate} p={p} />

        <Text style={[typography.captionBold, { color: p.textSecondary }]}>{A.acceptanceType}</Text>
        <View style={styles.chips}>
          {ACCEPTANCE_TYPES.map((opt) => {
            const on = acceptanceType === opt.id;
            return (
              <HapticPressable
                key={opt.id}
                onPress={() => setAcceptanceType(opt.id)}
                style={[
                  styles.chip,
                  { borderColor: p.border, backgroundColor: on ? `${p.tint}22` : p.card, minHeight: touchMinHeight },
                ]}>
                <Text style={[typography.body, { color: on ? p.tint : p.text }]}>{opt.label}</Text>
              </HapticPressable>
            );
          })}
        </View>

        <Text style={[typography.title, styles.sectionGap, { color: p.text }]}>{A.docsSection}</Text>
        <View style={isTablet ? styles.checkGrid : undefined}>
          {ACCEPTANCE_DOC_CHECKLIST.map((d) => {
            const on = !!docChecks[d.id];
            return (
              <HapticPressable
                key={d.id}
                onPress={() => setDocChecks((s) => ({ ...s, [d.id]: !on }))}
                style={[
                  styles.checkRow,
                  isTablet && styles.checkRowTablet,
                  { borderColor: p.border, minHeight: touchMinHeight },
                ]}>
                <Text style={[typography.body, { color: p.text }]}>{on ? '☑' : '☐'} {d.label}</Text>
              </HapticPressable>
            );
          })}
        </View>

        <Mini label={A.notes} value={notes} onChangeText={setNotes} p={p} multiline />
        <PrimaryButton fullWidth label={A.save} onPress={() => void save()} accessibilityLabel={A.save} />
      </Surface>

      <Text style={[typography.title, { color: p.text }]}>{A.sendSection}</Text>
      <Surface style={[styles.form, { borderColor: p.border }]}>
        <FormFieldRow>
          <FormFieldCell>
            <Mini label={A.consultant} value={consultant} onChangeText={setConsultant} p={p} />
          </FormFieldCell>
          <FormFieldCell>
            <Mini label={A.deadline} value={deadline} onChangeText={setDeadline} p={p} />
          </FormFieldCell>
        </FormFieldRow>
        <View style={styles.actions}>
          <HapticPressable
            style={[styles.actionBtn, { borderColor: p.border, minHeight: touchMinHeight }]}
            onPress={() => void copy(emailBody, 'E-mail')}>
            <Text style={[typography.captionBold, { color: p.tint }]}>{A.copyEmail}</Text>
          </HapticPressable>
          {email.trim() ? (
            <HapticPressable
              style={[styles.actionBtn, { borderColor: p.border, minHeight: touchMinHeight }]}
              onPress={() => void Linking.openURL(mailto)}>
              <Text style={[typography.captionBold, { color: p.tint }]}>{A.mailto}</Text>
            </HapticPressable>
          ) : null}
          <HapticPressable
            style={[styles.actionBtn, { borderColor: p.border, minHeight: touchMinHeight }]}
            onPress={() => void copy(waBody, 'WhatsApp')}>
            <Text style={[typography.captionBold, { color: p.tint }]}>{A.copyWa}</Text>
          </HapticPressable>
          <HapticPressable
            style={[styles.actionBtn, { backgroundColor: p.tint, minHeight: touchMinHeight }]}
            onPress={() => void Linking.openURL(whatsAppUrl(waBody, phone.trim() || undefined))}>
            <Text style={[typography.captionBold, { color: '#fff' }]}>{A.openWa}</Text>
          </HapticPressable>
        </View>
        <Text style={[typography.caption, { color: p.textSecondary }]} selectable>
          {emailBody}
        </Text>
      </Surface>

      <Text style={[typography.title, { color: p.text }]}>{A.history}</Text>
      {history.length === 0 ? (
        <Text style={[typography.body, { color: p.textSecondary }]}>{A.empty}</Text>
      ) : (
        <>
          {history.length > COMMERCIAL_HISTORY_UI_PAGE ? (
            <Text style={[typography.caption, { color: p.textSecondary }]}>
              {A.historyShown
                .replace('{shown}', String(COMMERCIAL_HISTORY_UI_PAGE))
                .replace('{total}', String(history.length))}
            </Text>
          ) : null}
          {history.slice(0, COMMERCIAL_HISTORY_UI_PAGE).map((h) => (
            <Text key={h.id} style={[typography.caption, { color: p.textSecondary }]}>
              {h.company} · {h.proposalNumber || '—'} · {h.acceptedValue}
            </Text>
          ))}
        </>
      )}

        <FunnelNextBar currentPhase="acceptance" hint={t('funnel').phase3Hint} context={funnelContext} />
    </TabletScrollScreen>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.md },
  inputTablet: { minHeight: 52, fontSize: 16, paddingVertical: 12 },
  checkGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  checkRowTablet: { width: '48%', flexGrow: 1 },
  intro: {},
  form: { padding: space.md, borderRadius: 16, borderWidth: 1, gap: space.sm },
  sectionGap: { marginTop: space.xs },
  field: { gap: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  inputMulti: { minHeight: 72, textAlignVertical: 'top' },
  chips: { gap: space.xs },
  chip: { padding: 12, borderRadius: 10, borderWidth: 1, justifyContent: 'center' },
  checkRow: { paddingVertical: 8, paddingHorizontal: 4, borderBottomWidth: StyleSheet.hairlineWidth },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
});
