import { ClientPicker } from '@/components/commercial/ClientPicker';
import Colors from '@/constants/Colors';
import { FormFieldCell, FormFieldRow } from '@/components/commercial/FormFieldRow';
import { FunnelNextBar } from '@/components/commercial/FunnelNextBar';
import { FunnelStepper } from '@/components/commercial/FunnelStepper';
import { TabletScrollScreen } from '@/components/ui/TabletScrollScreen';
import { useTabletLayout } from '@/hooks/useTabletLayout';
import { useColorScheme } from '@/components/useColorScheme';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { Surface } from '@/components/ui/Surface';
import { space, tabBarFloatingClearance } from '@/constants/layout';
import { typography } from '@/constants/typography';
import { useGamification } from '@/context/GamificationContext';
import { clientToCommercialContext, type ClientRecord } from '@/lib/clientRegistry';
import { PROSPECTING_SOURCES } from '@/lib/commercialContent';
import { useCommercialDraftWithLoad } from '@/hooks/useCommercialDraft';
import { useSync } from '@/context/SyncContext';
import {
  buildCommercialContext,
  parseCommercialContext,
  phaseHref,
} from '@/lib/commercialLinks';
import {
  COMMERCIAL_HISTORY_UI_PAGE,
  draftScopeKey,
  loadProspectingRecords,
  prospectingDraftStorage,
  saveProspectingRecords,
  type ProspectingDraft,
  type ProspectingRecord,
} from '@/lib/commercialStorage';
import { afterCommercialEnqueue } from '@/lib/commercialSync';
import { recordPipelineStep } from '@/lib/gamificationEngine';
import { syncProspectingToPipeline } from '@/lib/localPipelineStore';
import { enqueueProspectingSaved } from '@/lib/outbox';
import { t } from '@/lib/i18n';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  p: (typeof Colors)['light'];
  multiline?: boolean;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
};

function Field({ label, value, onChangeText, p, multiline, keyboardType }: FieldProps) {
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

export default function ProspectingScreen() {
  const p = Colors[useColorScheme() ?? 'light'];
  const PS = t('prospecting');
  const insets = useSafeAreaInsets();
  const pad = tabBarFloatingClearance(insets.bottom);
  const router = useRouter();
  const rawParams = useLocalSearchParams();
  const urlCtx = useMemo(
    () => parseCommercialContext(rawParams as Record<string, string | string[] | undefined>),
    [rawParams],
  );
  const draftScope = useMemo(() => draftScopeKey(urlCtx.company, urlCtx.stopId), [urlCtx.company, urlCtx.stopId]);
  const { refresh: refreshGamification } = useGamification();
  const sync = useSync();
  const [history, setHistory] = useState<ProspectingRecord[]>([]);

  const [company, setCompany] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [segment, setSegment] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [source, setSource] = useState<string>(PROSPECTING_SOURCES[0]);
  const [wasteTypes, setWasteTypes] = useState('');
  const [volumeMonthly, setVolumeMonthly] = useState('');
  const [currentProvider, setCurrentProvider] = useState('');
  const [painPoints, setPainPoints] = useState('');
  const [budgetRange, setBudgetRange] = useState('');
  const [decisionMaker, setDecisionMaker] = useState('');
  const [urgency, setUrgency] = useState('média');
  const [nextStep, setNextStep] = useState('');
  const [nextDate, setNextDate] = useState('');
  const [notes, setNotes] = useState('');
  const [pickedClientId, setPickedClientId] = useState<string | null>(null);

  const applyRegisteredClient = useCallback((client: ClientRecord) => {
    setPickedClientId(client.id);
    setCompany(client.company);
    setTradeName(client.tradeName);
    setCnpj(client.cnpj);
    setSegment(client.segment);
    setAddress(client.address);
    setCity(client.city);
    setContactName(client.contactName);
    setContactRole(client.contactRole);
    setPhone(client.phone);
    setEmail(client.email);
    if (client.notes) setNotes((n) => n || client.notes);
  }, []);

  useEffect(() => {
    if (urlCtx.company) setCompany((v) => v || urlCtx.company!);
    const contact = urlCtx.contact ?? urlCtx.clientName;
    if (contact) setContactName((v) => v || contact);
    if (urlCtx.cnpj) setCnpj((v) => v || urlCtx.cnpj!);
    if (urlCtx.email) setEmail((v) => v || urlCtx.email!);
    if (urlCtx.phone) setPhone((v) => v || urlCtx.phone!);
    if (urlCtx.address) setAddress((v) => v || urlCtx.address!);
    if (urlCtx.city) setCity((v) => v || urlCtx.city!);
  }, [urlCtx.company, urlCtx.contact, urlCtx.clientName, urlCtx.cnpj, urlCtx.email, urlCtx.phone, urlCtx.address, urlCtx.city]);

  const applyDraft = useCallback((d: ProspectingDraft) => {
    setCompany(d.company);
    setTradeName(d.tradeName);
    setCnpj(d.cnpj);
    setSegment(d.segment);
    setAddress(d.address);
    setCity(d.city);
    setContactName(d.contactName);
    setContactRole(d.contactRole);
    setPhone(d.phone);
    setEmail(d.email);
    setSource(d.source || PROSPECTING_SOURCES[0]);
    setWasteTypes(d.wasteTypes);
    setVolumeMonthly(d.volumeMonthly);
    setCurrentProvider(d.currentProvider);
    setPainPoints(d.painPoints);
    setBudgetRange(d.budgetRange);
    setDecisionMaker(d.decisionMaker);
    setUrgency(d.urgency);
    setNextStep(d.nextStep);
    setNextDate(d.nextDate);
    setNotes(d.notes);
  }, []);

  const draftPayload = useMemo(
    (): ProspectingDraft => ({
      company,
      tradeName,
      cnpj,
      segment,
      address,
      city,
      contactName,
      contactRole,
      phone,
      email,
      source,
      wasteTypes,
      volumeMonthly,
      currentProvider,
      painPoints,
      budgetRange,
      decisionMaker,
      urgency,
      nextStep,
      nextDate,
      notes,
    }),
    [
      company,
      tradeName,
      cnpj,
      segment,
      address,
      city,
      contactName,
      contactRole,
      phone,
      email,
      source,
      wasteTypes,
      volumeMonthly,
      currentProvider,
      painPoints,
      budgetRange,
      decisionMaker,
      urgency,
      nextStep,
      nextDate,
      notes,
    ],
  );

  const { clearDraft } = useCommercialDraftWithLoad(
    prospectingDraftStorage,
    draftScope,
    draftPayload,
    applyDraft,
  );

  const funnelContext = useMemo(
    () =>
      buildCommercialContext(urlCtx, {
        company,
        clientName: contactName,
        cnpj,
        email,
        phone,
        address,
        city,
      }),
    [urlCtx, company, contactName, cnpj, email, phone, address, city],
  );

  useEffect(() => {
    void loadProspectingRecords().then(setHistory);
  }, []);

  const save = useCallback(async () => {
    if (!company.trim() || !contactName.trim()) {
      Alert.alert(PS.title, PS.missingCompany);
      return;
    }
    const row: ProspectingRecord = {
      id: newId(),
      at: Date.now(),
      company: company.trim(),
      tradeName: tradeName.trim(),
      cnpj: cnpj.trim(),
      segment: segment.trim(),
      contactName: contactName.trim(),
      contactRole: contactRole.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      city: city.trim(),
      source: source.trim(),
      wasteTypes: wasteTypes.trim(),
      volumeMonthly: volumeMonthly.trim(),
      currentProvider: currentProvider.trim(),
      painPoints: painPoints.trim(),
      budgetRange: budgetRange.trim(),
      decisionMaker: decisionMaker.trim(),
      urgency: urgency.trim(),
      nextStep: nextStep.trim(),
      nextDate: nextDate.trim(),
      notes: notes.trim(),
    };
    const next = [row, ...history];
    setHistory(next);
    await saveProspectingRecords(next);
    await syncProspectingToPipeline({
      id: row.id,
      company: row.company,
      nextStep: row.nextStep,
      nextDate: row.nextDate,
      segment: row.segment,
      volumeMonthly: row.volumeMonthly,
    });
    enqueueProspectingSaved({
      company: row.company,
      segment: row.segment,
      source: row.source,
      contactName: row.contactName,
    });
    afterCommercialEnqueue(sync);
    recordPipelineStep('outro');
    refreshGamification();
    await clearDraft();
    const F = t('funnel');
    const proposalHref = phaseHref('proposal', funnelContext);
    Alert.alert(PS.title, PS.saved, [
      { text: PS.ok, style: 'cancel' },
      { text: PS.viewPipeline, onPress: () => router.push('/(tabs)/commercial/pipeline' as Href) },
      {
        text: F.nextPhaseCta.replace('{n}', '2').replace('{title}', 'Proposta'),
        onPress: () => router.push(proposalHref),
      },
    ]);
  }, [
    PS,
    company,
    contactName,
    funnelContext,
    clearDraft,
    sync,
    history,
    tradeName,
    cnpj,
    segment,
    address,
    city,
    contactRole,
    phone,
    email,
    source,
    wasteTypes,
    volumeMonthly,
    currentProvider,
    painPoints,
    budgetRange,
    decisionMaker,
    urgency,
    nextStep,
    nextDate,
    notes,
    refreshGamification,
    router,
  ]);

  return (
    <TabletScrollScreen
      style={{ backgroundColor: p.background }}
      padBottom={pad}
      contentContainerStyle={styles.root}>
        <FunnelStepper activePhase="prospecting" compact />
        <Text style={[typography.body, styles.intro, { color: p.textSecondary }]}>{PS.intro}</Text>

        <ClientPicker selectedId={pickedClientId} onSelect={applyRegisteredClient} />

        <Surface elevated style={[styles.form, { borderColor: p.border }]}>
          <Text style={[typography.title, { color: p.text }]}>{PS.sectionCompany}</Text>
          <FormFieldRow>
            <FormFieldCell>
              <Field label={PS.company} value={company} onChangeText={setCompany} p={p} />
            </FormFieldCell>
            <FormFieldCell>
              <Field label={PS.tradeName} value={tradeName} onChangeText={setTradeName} p={p} />
            </FormFieldCell>
          </FormFieldRow>
          <FormFieldRow>
            <FormFieldCell>
              <Field label={PS.cnpj} value={cnpj} onChangeText={setCnpj} p={p} />
            </FormFieldCell>
            <FormFieldCell>
              <Field label={PS.segment} value={segment} onChangeText={setSegment} p={p} />
            </FormFieldCell>
          </FormFieldRow>
          <Field label={PS.address} value={address} onChangeText={setAddress} p={p} />
          <Field label={PS.city} value={city} onChangeText={setCity} p={p} />

          <Text style={[typography.title, styles.sectionGap, { color: p.text }]}>{PS.sectionContact}</Text>
          <FormFieldRow>
            <FormFieldCell>
              <Field label={PS.contactName} value={contactName} onChangeText={setContactName} p={p} />
            </FormFieldCell>
            <FormFieldCell>
              <Field label={PS.contactRole} value={contactRole} onChangeText={setContactRole} p={p} />
            </FormFieldCell>
          </FormFieldRow>
          <FormFieldRow>
            <FormFieldCell>
              <Field label={PS.phone} value={phone} onChangeText={setPhone} p={p} keyboardType="phone-pad" />
            </FormFieldCell>
            <FormFieldCell>
              <Field label={PS.email} value={email} onChangeText={setEmail} p={p} keyboardType="email-address" />
            </FormFieldCell>
          </FormFieldRow>
        <Field
          label={`${PS.source} (${PROSPECTING_SOURCES.join(', ')})`}
          value={source}
          onChangeText={setSource}
          p={p}
        />

        <Text style={[typography.title, styles.sectionGap, { color: p.text }]}>{PS.sectionWaste}</Text>
        <Field label={PS.wasteTypes} value={wasteTypes} onChangeText={setWasteTypes} p={p} multiline />
        <Field label={PS.volumeMonthly} value={volumeMonthly} onChangeText={setVolumeMonthly} p={p} />
        <Field label={PS.currentProvider} value={currentProvider} onChangeText={setCurrentProvider} p={p} />
        <Field label={PS.painPoints} value={painPoints} onChangeText={setPainPoints} p={p} multiline />

        <Text style={[typography.title, styles.sectionGap, { color: p.text }]}>{PS.sectionQualification}</Text>
        <Field label={PS.budgetRange} value={budgetRange} onChangeText={setBudgetRange} p={p} />
        <Field label={PS.decisionMaker} value={decisionMaker} onChangeText={setDecisionMaker} p={p} />
        <Field label={PS.urgency} value={urgency} onChangeText={setUrgency} p={p} />

        <Text style={[typography.title, styles.sectionGap, { color: p.text }]}>{PS.sectionNext}</Text>
        <Field label={PS.nextStep} value={nextStep} onChangeText={setNextStep} p={p} />
        <Field label={PS.nextDate} value={nextDate} onChangeText={setNextDate} p={p} />
        <Field label={PS.notes} value={notes} onChangeText={setNotes} p={p} multiline />

        <HapticPressable onPress={() => void save()} style={[styles.btn, { backgroundColor: p.tint }]}>
          <Text style={styles.btnText}>{PS.save}</Text>
        </HapticPressable>
      </Surface>

      <FunnelNextBar currentPhase="prospecting" hint={t('funnel').phase1Hint} context={funnelContext} />

      <Text style={[typography.title, { color: p.text }]}>{PS.history}</Text>
      {history.length === 0 ? (
        <Text style={[typography.body, { color: p.textSecondary }]}>{PS.empty}</Text>
      ) : (
        <>
          {history.length > COMMERCIAL_HISTORY_UI_PAGE ? (
            <Text style={[typography.caption, { color: p.textSecondary }]}>
              {PS.historyShown
                .replace('{shown}', String(COMMERCIAL_HISTORY_UI_PAGE))
                .replace('{total}', String(history.length))}
            </Text>
          ) : null}
          {history.slice(0, COMMERCIAL_HISTORY_UI_PAGE).map((h) => (
          <View key={h.id} style={[styles.histRow, { borderColor: p.border }]}>
            <Text style={[typography.bodyBold, { color: p.text }]}>{h.company}</Text>
            <Text style={[typography.caption, { color: p.textSecondary }]}>
              {h.contactName} · {h.segment || h.source}
            </Text>
          </View>
          ))}
        </>
      )}
    </TabletScrollScreen>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.md },
  inputTablet: { minHeight: 52, fontSize: 16, paddingVertical: 12 },
  intro: { marginBottom: space.xs },
  form: { padding: space.md, borderRadius: 16, borderWidth: 1, gap: space.sm },
  sectionGap: { marginTop: space.sm },
  field: { gap: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  inputMulti: { minHeight: 72, textAlignVertical: 'top' },
  btn: { padding: 14, borderRadius: 12, alignItems: 'center', marginTop: space.sm },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  outline: { padding: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  outlineText: { fontWeight: '800' },
  histRow: { borderBottomWidth: 1, paddingVertical: space.sm },
});
