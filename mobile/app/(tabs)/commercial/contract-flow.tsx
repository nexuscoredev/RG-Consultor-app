import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { Surface } from '@/components/ui/Surface';
import { radius, space, tabBarFloatingClearance } from '@/constants/layout';
import { typography } from '@/constants/typography';
import { chevronSize, iconSize } from '@/constants/icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useGamification } from '@/context/GamificationContext';
import { useSync } from '@/context/SyncContext';
import { parseCommercialContext } from '@/lib/commercialLinks';
import { recordPipelineStep } from '@/lib/gamificationEngine';
import { syncContractToPipeline } from '@/lib/localPipelineStore';
import { enqueueContractClosed } from '@/lib/outbox';
import { t } from '@/lib/i18n';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STEPS = ['Cliente', 'Serviço', 'Comercial', 'Envio'] as const;

export default function ContractFlowScreen() {
  const p = Colors[useColorScheme() ?? 'light'];
  const CF = t('contractFlow');
  const insets = useSafeAreaInsets();
  const bottomPad = tabBarFloatingClearance(insets.bottom);
  const raw = useLocalSearchParams<Record<string, string | string[]>>();
  const ctx = parseCommercialContext(raw);
  const { refresh: refreshGamification } = useGamification();
  const { runSyncNow } = useSync();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [account, setAccount] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [service, setService] = useState('Gerenciamento de resíduos classe II');
  const [volume, setVolume] = useState('');
  const [value, setValue] = useState('');
  const [term, setTerm] = useState('12 meses');

  useEffect(() => {
    if (ctx.company) setAccount(ctx.company);
    if (ctx.cnpj) setCnpj(ctx.cnpj);
    if (ctx.value) setValue(ctx.value.replace(/[^\d.,]/g, '') || ctx.value);
  }, [ctx.company, ctx.cnpj, ctx.value]);

  const progress = useMemo(() => (step + 1) / STEPS.length, [step]);

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
    void runSyncNow();
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
      contentContainerStyle={[styles.root, { backgroundColor: p.background, paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}>
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
            <Field label="Razão social" value={account} onChangeText={setAccount} palette={p} />
            <Field label="CNPJ" value={cnpj} onChangeText={setCnpj} palette={p} />
          </>
        ) : null}
        {step === 1 ? (
          <>
            <Text style={[styles.cardTitle, { color: p.text }]}>Escopo ambiental</Text>
            <Field label="Serviço principal" value={service} onChangeText={setService} palette={p} />
            <Field label="Volume estimado" value={volume} onChangeText={setVolume} palette={p} />
          </>
        ) : null}
        {step === 2 ? (
          <>
            <Text style={[styles.cardTitle, { color: p.text }]}>Condições</Text>
            <Field label="Valor mensal (R$)" value={value} onChangeText={setValue} palette={p} keyboardType="decimal-pad" />
            <Field label="Prazo" value={term} onChangeText={setTerm} palette={p} />
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
          </>
        ) : null}
      </Surface>

      <View style={styles.navRow}>
        <HapticPressable
          onPress={back}
          disabled={step === 0}
          style={[styles.secondaryBtn, { borderColor: p.border, opacity: step === 0 ? 0.45 : 1 }]}
          accessibilityLabel="Voltar etapa">
          <Text style={[styles.secondaryTxt, { color: p.text }]}>Voltar</Text>
        </HapticPressable>
        <HapticPressable
          onPress={next}
          style={[styles.primaryBtn, { backgroundColor: p.tint }]}
          accessibilityLabel={step === STEPS.length - 1 ? 'Enviar contrato' : 'Próxima etapa'}>
          <Text style={styles.primaryTxt}>{step === STEPS.length - 1 ? 'Registrar' : 'Continuar'}</Text>
          <MaterialCommunityIcons name="chevron-right" size={chevronSize} color="#fff" />
        </HapticPressable>
      </View>
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
  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.fieldLabel, { color: palette.textSecondary }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholderTextColor={palette.textSecondary}
        style={[styles.input, { color: palette.text, borderColor: palette.border, backgroundColor: palette.card }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: space.lg, paddingTop: space.lg, gap: space.lg },
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
  secondaryBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  secondaryTxt: { fontWeight: '900', fontSize: 16 },
  primaryBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: radius.md,
  },
  primaryTxt: { color: '#fff', fontWeight: '900', fontSize: 16 },
});
