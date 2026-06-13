import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { FormFieldCell, FormFieldRow } from '@/components/commercial/FormFieldRow';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { Surface } from '@/components/ui/Surface';
import { space, tabBarFloatingClearance } from '@/constants/layout';
import { INTENT_TERM_POINTS } from '@/lib/commercialContent';
import { buildIntentTermHtml } from '@/lib/documentTemplates';
import { parseCommercialContext, phaseHref } from '@/lib/commercialLinks';
import { t } from '@/lib/i18n';
import { exportHtmlDocument } from '@/lib/documentExport';
import { Link, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TabletScrollScreen } from '@/components/ui/TabletScrollScreen';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function IntentTermScreen() {
  const p = Colors[useColorScheme() ?? 'light'];
  const IT = t('intentTerm');
  const insets = useSafeAreaInsets();
  const pad = tabBarFloatingClearance(insets.bottom);
  const raw = useLocalSearchParams();
  const funnelContext = useMemo(
    () => parseCommercialContext(raw as Record<string, string | string[] | undefined>),
    [raw],
  );
  const acceptanceHref = useMemo(() => phaseHref('acceptance', funnelContext), [funnelContext]);
  const contractHref = useMemo(() => phaseHref('contract', funnelContext), [funnelContext]);
  const proposalHref = useMemo(() => phaseHref('proposal', funnelContext), [funnelContext]);

  const [company, setCompany] = useState('');
  const [contact, setContact] = useState('');
  const [scope, setScope] = useState('');
  const [validityDays, setValidityDays] = useState('30');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (funnelContext.company) setCompany((v) => v || funnelContext.company!);
    const c = funnelContext.contact ?? funnelContext.clientName;
    if (c) setContact((v) => v || c);
    if (funnelContext.scope) setScope((v) => v || funnelContext.scope!);
  }, [funnelContext.company, funnelContext.contact, funnelContext.clientName, funnelContext.scope]);

  const exportPdf = useCallback(async () => {
    if (!company.trim()) {
      Alert.alert(IT.title, IT.missingCompany);
      return;
    }
    setExporting(true);
    try {
      const issued = new Date().toLocaleDateString('pt-BR');
      const html = buildIntentTermHtml({
        company: company.trim(),
        contact: contact.trim(),
        scope: scope.trim(),
        validityDays: validityDays.trim() || '30',
        issued,
      });
      await exportHtmlDocument({
        html,
        dialogTitle: IT.title,
        webDocumentTitle: IT.title,
      });
    } catch {
      Alert.alert(IT.title, IT.pdfError);
    } finally {
      setExporting(false);
    }
  }, [IT, company, contact, scope, validityDays]);

  return (
    <TabletScrollScreen style={{ backgroundColor: p.background }} padBottom={pad} contentContainerStyle={styles.root}>
      <Text style={[styles.intro, { color: p.textSecondary }]}>{IT.intro}</Text>

      <Surface elevated style={[styles.card, { borderColor: p.border }]}>
        <FormFieldRow>
          <FormFieldCell>
            <Field label={IT.company} value={company} onChangeText={setCompany} p={p} />
          </FormFieldCell>
          <FormFieldCell>
            <Field label={IT.contact} value={contact} onChangeText={setContact} p={p} />
          </FormFieldCell>
        </FormFieldRow>
        <Field label={IT.scope} value={scope} onChangeText={setScope} p={p} multiline />
        <Field label={IT.validity} value={validityDays} onChangeText={setValidityDays} p={p} />
        <PrimaryButton
          fullWidth
          label={IT.exportPdf}
          loading={exporting}
          onPress={() => void exportPdf()}
          accessibilityLabel={IT.exportPdfA11y}
        />
      </Surface>

      <Surface elevated style={[styles.card, { borderColor: p.border }]}>
        {INTENT_TERM_POINTS.map((line) => (
          <Text key={line} style={[styles.bullet, { color: p.text }]}>
            • {line.replace(/\*/g, '')}
          </Text>
        ))}
      </Surface>

      <Link href={acceptanceHref} asChild>
        <SecondaryButton fullWidth tint label={IT.openAcceptance} accessibilityLabel={IT.openAcceptance} />
      </Link>
      <Link href={contractHref} asChild>
        <SecondaryButton fullWidth tint label={IT.openContract} accessibilityLabel={IT.openContract} />
      </Link>
      <Link href={proposalHref} asChild>
        <SecondaryButton fullWidth tint label={IT.openProposal} accessibilityLabel={IT.openProposal} />
      </Link>
    </TabletScrollScreen>
  );
}

function Field({
  label,
  value,
  onChangeText,
  p,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  p: (typeof Colors)['light'];
  multiline?: boolean;
}) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ color: p.textSecondary, fontSize: 12, fontWeight: '700' }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={p.textSecondary}
        multiline={multiline}
        style={[
          styles.input,
          { borderColor: p.border, color: p.text, backgroundColor: p.card },
          multiline ? { minHeight: 88, textAlignVertical: 'top' } : null,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.md },
  intro: { fontSize: 14, lineHeight: 21 },
  card: { padding: space.md, borderRadius: 16, borderWidth: 1, gap: 12 },
  bullet: { fontSize: 14, lineHeight: 22 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 16 },
});
