import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { HubListRow, type HubIconName } from '@/components/ui/HubListRow';
import { screenScroll, space, tabBarFloatingClearance } from '@/constants/layout';
import { typography } from '@/constants/typography';
import { t } from '@/lib/i18n';
import { type Href } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const items: { href: string; label: string; icon: HubIconName; hint: string }[] = [
  { href: '/(tabs)/more/missions', label: 'Mission Center', icon: 'trophy-outline', hint: 'Metas, níveis e ranking' },
  { href: '/(tabs)/more/store', label: 'Loja de prêmios', icon: 'gift-outline', hint: 'Resgate com moedas' },
  { href: '/(tabs)/more/operation', label: 'Nossa Operação', icon: 'play-circle-outline', hint: 'Showroom de confiança' },
  { href: '/(tabs)/more/documents', label: 'Trilha documental', icon: 'file-document-outline', hint: 'MTR, certificados' },
  { href: '/(tabs)/more/alerts', label: 'Alertas (gestão)', icon: 'bell-outline', hint: 'SLA e risco' },
  { href: '/(tabs)/more/legal', label: 'Privacidade / LGPD', icon: 'shield-check-outline', hint: 'Retenção e bases legais' },
  { href: '/(tabs)/more/settings', label: 'Configurações', icon: 'cog-outline', hint: 'Sync, ranking, sair' },
];

export default function MoreHubScreen() {
  const p = Colors[useColorScheme() ?? 'light'];
  const M = t('more');
  const insets = useSafeAreaInsets();
  const padBottom = tabBarFloatingClearance(insets.bottom);
  return (
    <ScrollView
      contentContainerStyle={[
        styles.root,
        screenScroll,
        { backgroundColor: p.background, paddingBottom: padBottom },
      ]}
      accessibilityRole="menu">
      <Text style={[typography.h1, { color: p.text }]}>{M.title}</Text>
      <Text style={[typography.subtitle, styles.sub, { color: p.textSecondary }]}>{M.subtitle}</Text>
      {items.map((it) => (
        <HubListRow key={it.href} href={it.href as Href} title={it.label} hint={it.hint} icon={it.icon} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.sm },
  sub: { marginBottom: space.xs },
});
