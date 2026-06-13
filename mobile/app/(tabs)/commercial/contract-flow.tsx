import Colors from '@/constants/Colors';
import { FormFieldCell, FormFieldRow } from '@/components/commercial/FormFieldRow';
import { FunnelNextBar } from '@/components/commercial/FunnelNextBar';
import { FunnelStepper } from '@/components/commercial/FunnelStepper';
import { useColorScheme } from '@/components/useColorScheme';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { TabletContent } from '@/components/ui/TabletContent';
import { Surface } from '@/components/ui/Surface';
import { useTabletLayout } from '@/hooks/useTabletLayout';
import { radius, space, tabBarFloatingClearance } from '@/constants/layout';
import { typography } from '@/constants/typography';
import { chevronSize, iconSize } from '@/constants/icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useCommercialDraftWithLoad } from '@/hooks/useCommercialDraft';
import { useGamification } from '@/context/GamificationContext';
import { useSync } from '@/context/SyncContext';
import { buildCommercialContext, parseCommercialContext } from '@/lib/commercialLinks';
import {
  contractDraftStorage,
  draftScopeKey,
  type ContractDraft,
} from '@/lib/commercialStorage';
import { afterCommercialEnqueue } from '@/lib/commercialSync';
import { recordPipelineStep } from '@/lib/gamificationEngine';
import { syncContractToPipeline } from '@/lib/localPipelineStore';
import { enqueueContractClosed } from '@/lib/outbox';
import { buildContractHtml } from '@/lib/documentTemplates';
import { t } from '@/lib/i18n';
import * as Haptics from 'expo-haptics';
import { exportHtmlDocument } from '@/lib/documentExport';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STEPS = ['Cliente', 'Serviço', 'Comercial', 'Envio'] as const;

export default function ContractFlowScreen() {
  const p = Colors[useColorScheme() ?? 'light'];
  const CF = t('contractFlow');
  const insets = useSafeAreaInsets();
  const bottomPad = tabBarFloatingClearance(insets.bottom);
  const { horizontalPadding } = useTabletLayout();
  const raw = useLocalSearchParams<Record<string, string | string[]>>();
  const urlCtx = parseCommercialContext(raw);
  const draftScope = useMemo(
    () => draftScopeKey(urlCtx.company, urlCtx.stopId),
    [urlCtx.company, urlCtx.stopId],
  );
  const { refresh: refreshGamification } = useGamification();
  const sync = useSync();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [account, setAccount] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [service, setService] = useState('Gerenciamento de resíduos classe II');
  const [volume, setVolume] = useState('');
  const [value, setValue] = useState('');
  const [term, setTerm] = useState('12 meses');
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    if (urlCtx.company) setAccount((v) => v || urlCtx.company!);
    if (urlCtx.cnpj) setCnpj((v) => v || urlCtx.cnpj!);
    const rawVal = urlCtx.value;
    if (rawVal) setValue((v) => v || rawVal.replace(/[^\d.,]/g, '') || rawVal);
  }, [urlCtx.company, urlCtx.cnpj, urlCtx.value]);

  const applyDraft = useCallback((d: ContractDraft) => {
    setStep(d.step ?? 0);
    setAccount(d.account);
    setCnpj(d.cnpj);
    setService(d.service || 'Gerenciamento de resíduos classe II');
    setVolume(d.volume);
    setValue(d.value);
    setTerm(d.term || '12 meses');
  }, []);

  const draftPayload = useMemo(
    (): ContractDraft => ({
      step,
      account,
      cnpj,
      service,
      volume,
      value,
      term,
    }),
    [step, account, cnpj, service, volume, value, term],
  );

  const { clearDraft } = useCommercialDraftWithLoad(
    contractDraftStorage,
    draftScope,
    draftPayload,
    applyDraft,
  );

  const funnelContext = useMemo(
    () =>
      buildCommercialContext(urlCtx, {
        company: account,
        cnpj,
        value,
      }),
    [urlCtx, account, cnpj, value],
  );

  const progress = useMemo(() => (step + 1) / STEPS.length, [step]);

  const exportContractPdf = async () => {
    if (!account.trim()) {
      Alert.alert(CF.title, CF.missingAccount);
      return;
    }
    setExportingPdf(true);
    try {
      const html = buildContractHtml({
        account: account.trim(),
        cnpj: cnpj.trim(),
        service: service.trim(),
        volume: volume.trim(),
        value: value.trim(),
        term: term.trim(),
        issued: new Date().toLocaleDateString('pt-BR'),
      });
      await exportHtmlDocument({
        html,
        dialogTitle: CF.exportPdf,
        webDocumentTitle: CF.title,
      });
    } catch {
      Alert.alert(CF.title, CF.exportPdfError);
    } finally {
      setExportingPdf(false);
    }
  };

  const finish = async () => {
    if (!account.trim()) {
      Alert.alert(CF.title, CF.missingAccount);
      return;
    }
    await syncContractToPipeline({
      company: account.trim(),
      value: `R$ ${value.trim()}/mês · ${term.trim()}`,
      cnpj: cnpj.trim() || '—',
      service: service.trim(),
    });
    enqueueContractClosed({
      company: account.trim(),
      cnpj: cnpj.trim(),
      service: service.trim(),
      value: value.trim(),
      term: term.trim(),
    });
    recordPipelineStep('coleta');
    refreshGamification();
    afterCommercialEnqueue(sync);
    await clearDraft();
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(CF.title, CF.saved, [
      { text: CF.ok, style: 'default' },
      {
        text: CF.viewPipeline,
        onPress: () => router.push('/(tabs)/commercial/pipeline' as Href),
      },
    ]);
    setStep(0);
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep((s) => s + 1);
    } else {
      void finish();
    }
  };

  const back = () => {
    if (step > 0) {
      void Haptics.selectionAsync();
      setStep((s) => s - 1);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.root,
        { backgroundColor: p.background, paddingBottom: bottomPad, paddingHorizontal: horizontalPadding },
      ]}
      showsVerticalScrollIndicator={false}>
      <TabletContent>
        <FunnelStepper activePhase="contract" compact />
      <Text style={[styles.eyebrow, { color: p.textSecondary }]}>Novo contrato</Text>
      <Text style={[styles.title, { color: p.text }]}>Assistente em etapas</Text>
      <Text style={[styles.sub, { color: p.textSecondary }]}>
        Formulário curto e visual — orgulho de fechar na mesa com o cliente.
      </Text>

      <View style={styles.stepTrack}>
        <View style={[styles.stepFill, { width: `${progress * 100}%`, backgroundColor: p.tint }]} />
      </View>
      <View style={styles.stepLabels}>
        {STEPS.map((label, i) => (
          <Text
            key={label}
            style={[styles.stepLab, { color: i <= step ? p.tint : p.textSecondary, fontWeight: i === step ? '900' : '600' }]}>
            {label}
          </Text>
        ))}
      </View>

      <Surface elevated style={styles.card}>
        {step === 0 ? (
          <>
            <Text style={[styles.cardTitle, { color: p.text }]}>Quem contrata</Text>
            <FormFieldRow>
              <FormFieldCell>
                <Field label="Razão social" value={account} onChangeText={setAccount} palette={p} />
              </FormFieldCell>
              <FormFieldCell>
                <Field label="CNPJ" value={cnpj} onChangeText={setCnpj} palette={p} />
              </FormFieldCell>
            </FormFieldRow>
          </>
        ) : null}
        {step === 1 ? (
          <>
            <Text style={[styles.cardTitle, { color: p.text }]}>Escopo ambiental</Text>
            <FormFieldRow>
              <FormFieldCell>
                <Field label="Serviço principal" value={service} onChangeText={setService} palette={p} />
              </FormFieldCell>
              <FormFieldCell>
                <Field label="Volume estimado" value={volume} onChangeText={setVolume} palette={p} />
              </FormFieldCell>
            </FormFieldRow>
          </>
        ) : null}
        {step === 2 ? (
          <>
            <Text style={[styles.cardTitle, { color: p.text }]}>Condições</Text>
            <FormFieldRow>
              <FormFieldCell>
                <Field
                  label="Valor mensal (R$)"
                  value={value}
                  onChangeText={setValue}
                  palette={p}
                  keyboardType="decimal-pad"
                />
              </FormFieldCell>
              <FormFieldCell>
                <Field label="Prazo" value={term} onChangeText={setTerm} palette={p} />
              </FormFieldCell>
            </FormFieldRow>
          </>
        ) : null}
        {step === 3 ? (
          <>
            <Text style={[styles.cardTitle, { color: p.text }]}>Revisão</Text>
            <Text style={[styles.review, { color: p.textSecondary }]}>
              {account} · {cnpj}
              {'\n'}
              {service} · {volume}
              {'\n'}
              R$ {value}/mês · {term}
            </Text>
            <View style={[styles.seal, { borderColor: p.goldMatte }]}>
              <MaterialCommunityIcons name="leaf" size={iconSize.sm} color={p.goldMatte} />
              <Text style={[styles.sealText, { color: p.forestDeep }]}>RG Ambiental · eco-tech</Text>
            </View>
            <SecondaryButton
              fullWidth
              tint
              label={CF.exportPdf}
              loading={exportingPdf}
              onPress={() => void exportContractPdf()}
              accessibilityLabel={CF.exportPdfA11y}
            />
          </>
        ) : null}
      </Surface>

        <View style={styles.navRow}>
          <View style={styles.navCell}>
            <SecondaryButton
              fullWidth
              label="Voltar"
              onPress={back}
              disabled={step === 0}
              accessibilityLabel="Voltar etapa"
            />
          </View>
          <View style={styles.navCellPrimary}>
            <PrimaryButton
              fullWidth
              label={step === STEPS.length - 1 ? 'Registrar' : 'Continuar'}
              onPress={next}
              icon={<MaterialCommunityIcons name="chevron-right" size={chevronSize} color="#fff" />}
              accessibilityLabel={step === STEPS.length - 1 ? 'Enviar contrato' : 'Próxima etapa'}
            />
          </View>
        </View>

        <FunnelNextBar currentPhase="contract" hint={t('funnel').phase4Hint} context={funnelContext} />
      </TabletContent>
    </ScrollView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  palette,
  keyboardType = 'default',
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  palette: (typeof Colors)['light'];
  keyboardType?: 'default' | 'decimal-pad';
}) {
  const { isTablet } = useTabletLayout();
  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.fieldLabel, { color: palette.textSecondary }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholderTextColor={palette.textSecondary}
        style={[
          styles.input,
          isTablet && styles.inputTablet,
          { color: palette.text, borderColor: palette.border, backgroundColor: palette.card },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingTop: space.lg, gap: space.lg },
  inputTablet: { minHeight: 52, fontSize: 17, paddingVertical: 14 },
  eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  title: { fontSize: 28, fontWeight: '900', letterSpacing: -0.6 },
  sub: { fontSize: 15, lineHeight: 22 },
  stepTrack: { height: 6, borderRadius: 999, backgroundColor: 'rgba(10,36,24,0.08)', overflow: 'hidden', marginTop: 4 },
  stepFill: { height: '100%', borderRadius: 999 },
  stepLabels: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 },
  stepLab: { fontSize: 10, letterSpacing: 0.2 },
  card: { padding: space.xl, gap: space.md },
  cardTitle: { fontSize: 20, fontWeight: '900', marginBottom: 4 },
  fieldLabel: { fontSize: 12, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600',
  },
  review: { fontSize: 15, lineHeight: 24 },
  seal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: space.md,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    backgroundColor: 'rgba(184,154,106,0.08)',
  },
  sealText: { fontSize: 13, fontWeight: '800' },
  navRow: { flexDirection: 'row', gap: space.md, marginTop: space.sm },
  navCell: { flex: 1 },
  navCellPrimary: { flex: 1.4 },
});
