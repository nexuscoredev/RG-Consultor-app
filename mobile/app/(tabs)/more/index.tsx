import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { tabBarFloatingClearance } from '@/constants/layout';
import { t } from '@/lib/i18n';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, type Href } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type IconName = React.ComponentProps<typeof FontAwesome>['name'];

const items: { href: string; label: string; icon: IconName; hint: string }[] = [
  { href: '/(tabs)/more/contract-flow', label: 'Novo contrato', icon: 'file-text', hint: 'Assistente em etapas' },
  { href: '/(tabs)/more/operation', label: 'Nossa Operação', icon: 'play-circle', hint: 'Showroom de confiança' },
  { href: '/(tabs)/more/pipeline', label: 'Pipeline', icon: 'briefcase', hint: 'CRM + pendências' },
  { href: '/(tabs)/more/missions', label: 'Mission Center', icon: 'trophy', hint: 'Metas, níveis e ranking' },
  { href: '/(tabs)/more/store', label: 'Loja de prêmios', icon: 'gift', hint: 'Resgate com moedas' },
  { href: '/(tabs)/more/documents', label: 'Trilha documental', icon: 'file-text', hint: 'MTR, certificados' },
  { href: '/(tabs)/more/alerts', label: 'Alertas (gestão)', icon: 'bell', hint: 'SLA e risco' },
  { href: '/(tabs)/more/legal', label: 'Privacidade / LGPD', icon: 'shield', hint: 'Retenção e bases legais' },
  { href: '/(tabs)/more/settings', label: 'Configurações', icon: 'cog', hint: 'Sync, ranking, sair' },
];

export default function MoreHubScreen() {
  const p = Colors[useColorScheme() ?? 'light'];
  const M = t('more');
  const insets = useSafeAreaInsets();
  const padBottom = tabBarFloatingClearance(insets.bottom);
  return (
    <ScrollView
      contentContainerStyle={[styles.root, { backgroundColor: p.background, paddingBottom: padBottom }]}
      accessibilityRole="menu">
      <Text style={[styles.title, { color: p.text }]}>{M.title}</Text>
      <Text style={[styles.sub, { color: p.textSecondary }]}>{M.subtitle}</Text>
      {items.map((it) => (
        <Link key={it.href} href={it.href as Href} asChild>
          <Pressable
            style={[styles.row, { backgroundColor: p.card, borderColor: p.border }]}
            accessibilityRole="button"
            accessibilityLabel={it.label}>
            <FontAwesome name={it.icon} size={22} color={p.tint} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: p.text }]}>{it.label}</Text>
              <Text style={[styles.hint, { color: p.textSecondary }]}>{it.hint}</Text>
            </View>
            <FontAwesome name="chevron-right" size={14} color={p.textSecondary} />
          </Pressable>
        </Link>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { padding: 20, paddingBottom: 48, gap: 10 },
  title: { fontSize: 28, fontWeight: '900' },
  sub: { marginBottom: 8, fontSize: 15 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  label: { fontSize: 17, fontWeight: '800' },
  hint: { fontSize: 13, marginTop: 2 },
});
