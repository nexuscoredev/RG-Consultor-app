import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { Surface } from '@/components/ui/Surface';
import { TabletScrollScreen } from '@/components/ui/TabletScrollScreen';
import { space, tabBarFloatingClearance } from '@/constants/layout';
import { useSync } from '@/context/SyncContext';
import { afterCommercialEnqueue } from '@/lib/commercialSync';
import { FOLLOWUP_EMAIL, FOLLOWUP_WHATSAPP } from '@/lib/commercialContent';
import { syncFollowupToPipeline } from '@/lib/localPipelineStore';
import { enqueueFollowUpSent } from '@/lib/outbox';
import { whatsAppUrl } from '@/lib/proposalTemplate';
import { t } from '@/lib/i18n';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { Link, useLocalSearchParams, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTabletLayout } from '@/hooks/useTabletLayout';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function fill(template: string, vars: Record<string, string>) {
  let s = template;
  for (const [k, v] of Object.entries(vars)) {
    s = s.split(`{${k}}`).join(v);
  }
  return s;
}

function paramOne(raw: string | string[] | undefined): string {
  const s = Array.isArray(raw) ? raw[0] : raw;
  return s ? decodeURIComponent(s) : '';
}

export default function FollowupScreen() {
  const p = Colors[useColorScheme() ?? 'light'];
  const F = t('followup');
  const insets = useSafeAreaInsets();
  const pad = tabBarFloatingClearance(insets.bottom);
  const sync = useSync();
  const params = useLocalSearchParams<{
    nome?: string | string[];
    empresa?: string | string[];
    phone?: string | string[];
    routeDate?: string | string[];
    stopId?: string | string[];
    address?: string | string[];
    city?: string | string[];
  }>();
  const [nome, setNome] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [phone, setPhone] = useState('');
  const [routeDate, setRouteDate] = useState('');
  const [stopId, setStopId] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const ns = paramOne(params.nome);
    const es = paramOne(params.empresa);
    const ps = paramOne(params.phone);
    const rd = paramOne(params.routeDate);
    const sid = paramOne(params.stopId);
    const ad = paramOne(params.address);
    const ct = paramOne(params.city);
    if (ns) setNome(ns);
    if (es) setEmpresa(es);
    if (ps) setPhone(ps);
    if (rd) setRouteDate(rd);
    if (sid) setStopId(sid);
    if (ad) setAddress(ad);
    if (ct) setCity(ct);
  }, [params.nome, params.empresa, params.phone, params.routeDate, params.stopId, params.address, params.city]);

  const [escopo, setEscopo] = useState('Gerenciamento de resíduos classe II — coleta 2x/semana');
  const [passo, setPasso] = useState('Enviar proposta formal com SLA');
  const [prazo, setPrazo] = useState('15/05');
  const [consultor, setConsultor] = useState('Consultor RG');

  const vars = { NOME: nome, EMPRESA: empresa, ESCOPO: escopo, PASSO: passo, PRAZO: prazo, CONSULTOR: consultor };
  const emailBody = fill(FOLLOWUP_EMAIL, vars);
  const waBody = fill(FOLLOWUP_WHATSAPP, vars);

  const copy = useCallback(async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert(F.copiedTitle, `${label} ${F.copiedBody}`);
  }, [F]);

  const openWhatsApp = useCallback(() => {
    void Linking.openURL(whatsAppUrl(waBody, phone.trim() || undefined));
  }, [waBody, phone]);

  const saveToPipeline = useCallback(async () => {
    if (!empresa.trim()) return;
    setSaving(true);
    try {
      await syncFollowupToPipeline({
        company: empresa.trim(),
        nextStep: passo.trim() || 'Follow-up enviado',
        deadline: prazo.trim(),
        visit: {
          routeDate: routeDate || undefined,
          stopId: stopId || undefined,
          contact: nome.trim() || undefined,
          address: address || undefined,
          city: city || undefined,
          phone: phone.trim() || undefined,
        },
      });
      enqueueFollowUpSent({
        company: empresa.trim(),
        contactName: nome.trim() || undefined,
        channel: 'copy',
        phase: 'proposal',
      });
      afterCommercialEnqueue(sync);
      Alert.alert(F.savedPipelineTitle, F.savedPipelineBody);
    } finally {
      setSaving(false);
    }
  }, [address, city, empresa, nome, passo, phone, prazo, routeDate, stopId, sync, F]);

  return (
    <TabletScrollScreen style={{ backgroundColor: p.background }} padBottom={pad} contentContainerStyle={styles.root}>
      <Text style={[styles.intro, { color: p.textSecondary }]}>{F.intro}</Text>

      <Surface style={[styles.form, { borderColor: p.border }]}>
        <Mini label={F.contactName} value={nome} onChangeText={setNome} p={p} />
        <Mini label={F.company} value={empresa} onChangeText={setEmpresa} p={p} />
        <Mini label={F.phone} value={phone} onChangeText={setPhone} p={p} keyboardType="phone-pad" />
        <Mini label={F.scope} value={escopo} onChangeText={setEscopo} p={p} multiline />
        <Mini label={F.nextStep} value={passo} onChangeText={setPasso} p={p} />
        <Mini label={F.deadline} value={prazo} onChangeText={setPrazo} p={p} />
        <Mini label={F.signature} value={consultor} onChangeText={setConsultor} p={p} />
      </Surface>

      <Text style={[styles.h, { color: p.text }]}>{F.emailSection}</Text>
      <Surface style={[styles.block, { borderColor: p.border }]}>
        <Text style={[styles.mono, { color: p.text }]} selectable>
          {emailBody}
        </Text>
        <HapticPressable onPress={() => void copy(emailBody, F.emailSection)} style={[styles.btn, { borderColor: p.tint }]}>
          <Text style={[styles.btnText, { color: p.tint }]}>{F.copyEmail}</Text>
        </HapticPressable>
      </Surface>

      <Text style={[styles.h, { color: p.text }]}>{F.waSection}</Text>
      <Surface style={[styles.block, { borderColor: p.border }]}>
        <Text style={[styles.mono, { color: p.text }]} selectable>
          {waBody}
        </Text>
        <View style={styles.waRow}>
          <HapticPressable onPress={() => void copy(waBody, F.waSection)} style={[styles.btn, { borderColor: p.tint }]}>
            <Text style={[styles.btnText, { color: p.tint }]}>{F.copyWa}</Text>
          </HapticPressable>
          <HapticPressable onPress={openWhatsApp} style={[styles.btnPrimary, { backgroundColor: p.tint }]}>
            <Text style={styles.btnPrimaryText}>{F.openWa}</Text>
          </HapticPressable>
        </View>
      </Surface>

      <PrimaryButton
        fullWidth
        label={F.savePipeline}
        onPress={() => void saveToPipeline()}
        loading={saving}
        disabled={saving}
        accessibilityLabel={F.savePipelineA11y}
      />
      <Link href={'/(tabs)/commercial/pipeline' as Href} asChild>
        <SecondaryButton fullWidth tint label={F.viewPipeline} accessibilityLabel={F.viewPipelineA11y} />
      </Link>
    </TabletScrollScreen>
  );
}

function Mini({
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
  keyboardType?: 'default' | 'phone-pad';
}) {
  const { isTablet } = useTabletLayout();
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ color: p.textSecondary, fontSize: 11, fontWeight: '700' }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={p.textSecondary}
        multiline={multiline}
        keyboardType={keyboardType}
        style={[
          styles.input,
          isTablet && styles.inputTablet,
          { borderColor: p.border, color: p.text, backgroundColor: p.card },
          multiline ? { minHeight: isTablet ? 88 : 64, textAlignVertical: 'top' } : null,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.md },
  inputTablet: { minHeight: 52, fontSize: 16, paddingVertical: 12 },
  intro: { fontSize: 14, lineHeight: 20 },
  form: { padding: space.md, borderRadius: 16, borderWidth: 1, gap: 10 },
  h: { fontSize: 16, fontWeight: '900' },
  block: { padding: space.md, borderRadius: 16, borderWidth: 1, gap: 12 },
  mono: { fontSize: 14, lineHeight: 22 },
  waRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  btn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1 },
  btnText: { fontWeight: '800' },
  btnPrimary: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12 },
  btnPrimaryText: { color: '#fff', fontWeight: '900' },
  input: { borderWidth: 1, borderRadius: 10, padding: 10, fontSize: 15 },
});
