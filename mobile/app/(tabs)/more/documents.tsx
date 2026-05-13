import { ScreenChrome } from '@/components/ScreenChrome';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { t } from '@/lib/i18n';
import * as WebBrowser from 'expo-web-browser';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

export default function DocumentsScreen() {
  const p = Colors[useColorScheme() ?? 'light'];
  const d = t('documents');

  const open = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      Alert.alert('Erro', t('common').linkOpenFailed);
    }
  };

  return (
    <ScreenChrome title="" subtitle="">
      <Text style={[styles.intro, { color: p.textSecondary }]}>{d.intro}</Text>
      {d.items.map((l) => (
        <Pressable
          key={l.title}
          onPress={() => void open(l.url)}
          style={[styles.card, { backgroundColor: p.card, borderColor: p.border }]}
          accessibilityRole="link"
          accessibilityLabel={l.title}>
          <Text style={[styles.title, { color: p.text }]}>{l.title}</Text>
          <Text style={[styles.hint, { color: p.textSecondary }]}>{l.hint}</Text>
          <Text style={[styles.url, { color: p.tint }]}>{l.url}</Text>
        </Pressable>
      ))}
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: 14, lineHeight: 20, marginBottom: 4 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 6 },
  title: { fontSize: 17, fontWeight: '800' },
  hint: { fontSize: 13, lineHeight: 18 },
  url: { fontSize: 12, fontWeight: '700' },
});
