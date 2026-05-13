import { ScreenChrome } from '@/components/ScreenChrome';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { mockMgmtAlerts } from '@/lib/mockData';
import { t } from '@/lib/i18n';
import { StyleSheet, Text, View } from 'react-native';

export default function AlertsScreen() {
  const p = Colors[useColorScheme() ?? 'light'];
  const a = t('alerts');

  return (
    <ScreenChrome title="" subtitle="">
      <Text style={[styles.intro, { color: p.textSecondary }]}>{a.intro}</Text>
      {mockMgmtAlerts.map((item) => (
        <View
          key={item.id}
          style={[
            styles.card,
            { backgroundColor: p.card, borderColor: item.severity === 'danger' ? p.danger : p.border },
          ]}>
          <Text style={[styles.title, { color: item.severity === 'danger' ? p.danger : p.text }]}>{item.title}</Text>
          <Text style={[styles.body, { color: p.textSecondary }]}>{item.body}</Text>
        </View>
      ))}
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: 14, lineHeight: 20, marginBottom: 4 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 6 },
  title: { fontSize: 16, fontWeight: '900' },
  body: { fontSize: 14, lineHeight: 20 },
});
