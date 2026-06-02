import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { Surface } from '@/components/ui/Surface';
import { space, tabBarFloatingClearance } from '@/constants/layout';
import { FOLLOWUP_EMAIL, FOLLOWUP_WHATSAPP } from '@/lib/commercialContent';
import { whatsAppUrl } from '@/lib/proposalTemplate';
import { t } from '@/lib/i18n';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
  const params = useLocalSearchParams<{ nome?: string | string[]; empresa?: string | string[]; phone?: string | string[] }>();
  const [nome, setNome] = useState('Maria');
  const [empresa, setEmpresa] = useState('ACME Indústria');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    const ns = paramOne(params.nome);
    const es = paramOne(params.empresa);
    const ps = paramOne(params.phone);
    if (ns) setNome(ns);
    if (es) setEmpresa(es);
    if (ps) setPhone(ps);
  }, [params.nome, params.empresa, params.phone]);

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

  return (
    <ScrollView contentContainerStyle={[styles.root, { backgroundColor: p.background, paddingBottom: pad }]}>
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
    </ScrollView>
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
          { borderColor: p.border, color: p.text, backgroundColor: p.card },
          multiline ? { minHeight: 64, textAlignVertical: 'top' } : null,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { padding: space.md, gap: space.md },
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
