import { ScreenChrome } from '@/components/ScreenChrome';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/context/AuthContext';
import { fetchMgmtAlerts, fetchSellerAlerts, type MgmtAlert } from '@/lib/api';
import { isApiEnabled } from '@/lib/apiConfig';
import { mockMgmtAlerts } from '@/lib/mockData';
import { t } from '@/lib/i18n';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function AlertsScreen() {
  const p = Colors[useColorScheme() ?? 'light'];
  const a = t('alerts');
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<'live' | 'demo'>('demo');
  const [items, setItems] = useState<MgmtAlert[]>(mockMgmtAlerts);

  const load = useCallback(async () => {
    if (!isApiEnabled()) {
      setItems(mockMgmtAlerts);
      setSource('demo');
      return;
    }
    setLoading(true);
    try {
      const live =
        profile?.role === 'master' ? await fetchMgmtAlerts() : await fetchSellerAlerts();
      if (live.length) {
        setItems(live);
        setSource('live');
      } else {
        setItems([]);
        setSource('live');
      }
    } catch {
      setItems(mockMgmtAlerts);
      setSource('demo');
    } finally {
      setLoading(false);
    }
  }, [profile?.role]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <ScreenChrome title="" subtitle="">
      <Text style={[styles.intro, { color: p.textSecondary }]}>{a.intro}</Text>
      {source === 'demo' ? (
        <Text style={[styles.banner, { color: p.textSecondary, backgroundColor: p.border + '44' }]}>{a.demoBanner}</Text>
      ) : (
        <Text style={[styles.banner, { color: p.tint, backgroundColor: `${p.tint}14` }]}>{a.liveBanner}</Text>
      )}
      {loading ? <ActivityIndicator color={p.tint} style={{ marginVertical: 12 }} /> : null}
      {items.length === 0 && !loading ? (
        <Text style={{ color: p.textSecondary }}>{a.empty}</Text>
      ) : (
        items.map((item) => (
          <View
            key={item.id}
            style={[
              styles.card,
              { backgroundColor: p.card, borderColor: item.severity === 'danger' ? p.danger : p.border },
            ]}>
            <Text style={[styles.title, { color: item.severity === 'danger' ? p.danger : p.text }]}>{item.title}</Text>
            <Text style={[styles.body, { color: p.textSecondary }]}>{item.body}</Text>
          </View>
        ))
      )}
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: 14, lineHeight: 20, marginBottom: 4 },
  banner: { fontSize: 12, fontWeight: '700', padding: 10, borderRadius: 10, marginBottom: 8 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 6, marginBottom: 8 },
  title: { fontSize: 16, fontWeight: '900' },
  body: { fontSize: 14, lineHeight: 20 },
});
