import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { HubListRow, type HubIconName } from '@/components/ui/HubListRow';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { iconSize } from '@/constants/icons';
import { screenScroll, space, tabBarFloatingClearance } from '@/constants/layout';
import { typography } from '@/constants/typography';
import { t } from '@/lib/i18n';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Link, type Href } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type HubItemKey =
  | 'visitPlaybook'
  | 'pitchFaq'
  | 'calculator'
  | 'cases'
  | 'compare'
  | 'docsChecklist'
  | 'meetingLog'
  | 'followup'
  | 'intentTerm';

type HubItem = {
  href: Href;
  icon: HubIconName;
  titleKey: HubItemKey;
};

const HUB_ITEMS: HubItem[] = [
  { href: '/(tabs)/commercial/visit-playbook', icon: 'format-list-numbered', titleKey: 'visitPlaybook' },
  { href: '/(tabs)/commercial/pitch-faq', icon: 'bullhorn', titleKey: 'pitchFaq' },
  { href: '/(tabs)/commercial/calculator', icon: 'calculator-variant', titleKey: 'calculator' },
  { href: '/(tabs)/commercial/cases', icon: 'briefcase-outline', titleKey: 'cases' },
  { href: '/(tabs)/commercial/compare', icon: 'scale-balance', titleKey: 'compare' },
  { href: '/(tabs)/commercial/docs-checklist', icon: 'checkbox-marked-outline', titleKey: 'docsChecklist' },
  { href: '/(tabs)/commercial/meeting-log', icon: 'notebook-edit-outline', titleKey: 'meetingLog' },
  { href: '/(tabs)/commercial/followup', icon: 'email-outline', titleKey: 'followup' },
  { href: '/(tabs)/commercial/intent-term', icon: 'handshake-outline', titleKey: 'intentTerm' },
];

export default function CommercialHubScreen() {
  const p = Colors[useColorScheme() ?? 'light'];
  const C = t('commercial');
  const insets = useSafeAreaInsets();
  const pad = tabBarFloatingClearance(insets.bottom);

  return (
    <ScrollView
      contentContainerStyle={[
        styles.root,
        screenScroll,
        { backgroundColor: p.background, paddingBottom: pad },
      ]}
      showsVerticalScrollIndicator={false}>
      <Text style={[typography.body, styles.lead, { color: p.textSecondary }]}>{C.hubLead}</Text>

      {HUB_ITEMS.map((it) => {
        const copy = C.hubItems[it.titleKey];
        return (
          <HubListRow key={it.titleKey} href={it.href} title={copy.title} hint={copy.hint} icon={it.icon} />
        );
      })}

      <View style={styles.ctaBlock}>
        <Link href="/(tabs)/commercial/proposal" asChild>
          <PrimaryButton
            fullWidth
            label={C.proposalCta}
            accessibilityLabel={C.proposalCta}
            icon={<MaterialCommunityIcons name="file-pdf-box" size={iconSize.sm} color="#fff" />}
          />
        </Link>
        <View style={styles.rowBtns}>
          <Link href="/(tabs)/commercial/pipeline" asChild style={styles.rowBtn}>
            <SecondaryButton fullWidth tint label={C.pipelineCta} accessibilityLabel={C.pipelineCta} />
          </Link>
          <Link href="/(tabs)/commercial/contract-flow" asChild style={styles.rowBtn}>
            <SecondaryButton fullWidth tint label={C.contractCta} accessibilityLabel={C.contractCta} />
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.sm },
  lead: { marginBottom: space.xs },
  ctaBlock: { gap: space.sm, marginTop: space.sm },
  rowBtns: { flexDirection: 'row', gap: space.sm },
  rowBtn: { flex: 1 },
});
