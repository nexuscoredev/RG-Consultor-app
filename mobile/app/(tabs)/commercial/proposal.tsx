import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { tabBarFloatingClearance } from '@/constants/layout';
import { useGamification } from '@/context/GamificationContext';
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
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as Linking from 'expo-linking';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function paramOne(raw: string | string[] | undefined): string {
  const s = Array.isArray(raw) ? raw[0] : raw;
  return s ? decodeURIComponent(s) : '';
}

export default function ProposalPdfScreen() {
  const p = Colors[useColorScheme() ?? 'light'];
  const P = t('proposal');
  const insets = useSafeAreaInsets();
  const padBottom = tabBarFloatingClearance(insets.bottom);
  const { refresh: refreshGamification } = useGamification();
  const params = useLocalSearchParams<{
    company?: string;
    clientName?: string;
    scope?: string;
    value?: string;
  }>();

  const [clientName, setClientName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [scope, setScope] = useState('');
  const [value, setValue] = useState('');
  const [validity, setValidity] = useState('15');
  const [proposalNumber, setProposalNumber] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const c = paramOne(params.company);
    const n = paramOne(params.clientName);
    const sc = paramOne(params.scope);
    const v = paramOne(params.value);
    if (c) setCompany(c);
    if (n) setClientName(n);
    if (sc) setScope(sc);
    if (v) setValue(v);
  }, [params.company, params.clientName, params.scope, params.value]);

  const onGenerate = useCallback(async () => {
    if (Platform.OS === 'web') {
      Alert.alert('PDF', P.webNotSupported);
      return;
    }
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

      const { uri } = await Print.printToFileAsync({ html });
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
      recordPipelineStep('proposta');
      refreshGamification();

      const can = await Sharing.isAvailableAsync();
      if (!can) {
        Alert.alert(P.title, P.shareFail);
        return;
      }
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: P.title });

      const waText = buildProposalWhatsAppSummary({
        proposalNumber: num,
        company: company.trim(),
        clientName: clientName.trim(),
        value: value.trim(),
        validityDays: validity.trim() || '15',
      });
      Alert.alert(P.title, P.generatedOk, [
        { text: P.waLater, style: 'cancel' },
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
  }, [P, clientName, company, email, scope, value, validity, refreshGamification]);

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.root, { backgroundColor: p.background, paddingBottom: padBottom }]}>
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

      <Field label={P.clientName} value={clientName} onChangeText={setClientName} p={p} />
      <Field label={P.company} value={company} onChangeText={setCompany} p={p} />
      <Field label={P.email} value={email} onChangeText={setEmail} p={p} keyboardType="email-address" />
      <Field label={P.scope} value={scope} onChangeText={setScope} p={p} multiline />
      <Field label={P.value} value={value} onChangeText={setValue} p={p} />
      <Field label={P.validity} value={validity} onChangeText={setValidity} p={p} keyboardType="number-pad" />

      <Pressable
        onPress={() => void onGenerate()}
        disabled={busy}
        style={[styles.btn, { backgroundColor: p.tint, opacity: busy ? 0.7 : 1 }]}
        accessibilityRole="button"
        accessibilityLabel={P.generate}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{P.generate}</Text>}
      </Pressable>
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
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: p.textSecondary }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={p.textSecondary}
        style={[
          styles.input,
          { borderColor: p.border, color: p.text, backgroundColor: p.card },
          multiline ? { minHeight: 100, textAlignVertical: 'top' } : null,
        ]}
        multiline={multiline}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { padding: 20, gap: 14 },
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
  btn: { borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
