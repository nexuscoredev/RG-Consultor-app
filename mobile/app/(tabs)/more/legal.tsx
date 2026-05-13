import { ScreenChrome } from '@/components/ScreenChrome';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { t } from '@/lib/i18n';
import { StyleSheet, Text } from 'react-native';

export default function LegalScreen() {
  const p = Colors[useColorScheme() ?? 'light'];
  const L = t('legal');

  return (
    <ScreenChrome title="" subtitle="">
      <Text style={[styles.h, { color: p.text }]}>{L.hLgpd}</Text>
      <Text style={[styles.p, { color: p.textSecondary }]}>{L.pLgpd}</Text>
      <Text style={[styles.h, { color: p.text }]}>{L.hRetention}</Text>
      <Text style={[styles.p, { color: p.textSecondary }]}>{L.pRetention}</Text>
      <Text style={[styles.h, { color: p.text }]}>{L.hRanking}</Text>
      <Text style={[styles.p, { color: p.textSecondary }]}>{L.pRanking}</Text>
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  h: { fontSize: 18, fontWeight: '900' },
  p: { fontSize: 14, lineHeight: 22 },
});
