import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useSync } from '@/context/SyncContext';
import { t } from '@/lib/i18n';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

export function SyncBanner() {
  const scheme = useColorScheme() ?? 'light';
  const p = Colors[scheme];
  const S = t('sync');
  const { status, pending, failed, lastMessage, runSyncNow, retryFailed } = useSync();

  if (status === 'idle' && pending === 0 && failed === 0 && !lastMessage) return null;

  const tone =
    status === 'error' || failed > 0 ? p.danger : status === 'offline' ? p.textSecondary : p.tint;

  return (
    <View style={[styles.wrap, { backgroundColor: p.card, borderColor: p.border }]} accessibilityLiveRegion="polite">
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: p.text }]}>
          {S.title}
          {status === 'syncing' ? '…' : status === 'offline' ? ' (offline)' : ''}
        </Text>
        {status === 'offline' ? (
          <Text style={[styles.offline, { color: p.tint }]}>{S.offline}</Text>
        ) : null}
        <Text style={[styles.meta, { color: p.textSecondary }]}>
          {S.pending}: {pending} · {S.failed}: {failed}
          {lastMessage ? ` · ${lastMessage}` : ''}
        </Text>
      </View>
      {status === 'syncing' ? (
        <ActivityIndicator color={p.tint} accessibilityLabel={S.title} />
      ) : (
        <View style={styles.btns}>
          {failed > 0 ? (
            <Pressable
              onPress={retryFailed}
              style={({ pressed }) => [
                styles.btn,
                { borderColor: tone, opacity: pressed ? 0.85 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={S.retryBtn}
              accessibilityHint="Reenvia itens que falharam na fila">
              <Text style={[styles.btnText, { color: tone }]}>{S.retryBtn}</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => void runSyncNow()}
            style={({ pressed }) => [
              styles.btn,
              { backgroundColor: p.tint, borderColor: p.tint, opacity: pressed ? 0.9 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={S.syncBtn}
            accessibilityHint="Envia a fila de sincronização agora">
            <Text style={[styles.btnText, { color: '#fff' }]}>{S.syncBtn}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  title: { fontWeight: '800', fontSize: 15 },
  offline: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  meta: { fontSize: 12, marginTop: 4, flexWrap: 'wrap' },
  btns: { flexDirection: 'row', gap: 8 },
  btn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  btnText: { fontWeight: '800', fontSize: 12 },
});
