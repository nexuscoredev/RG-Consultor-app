import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { useAuth } from '@/context/AuthContext';
import type { ThemePreference } from '@/context/PrefsContext';
import { usePrefs } from '@/context/PrefsContext';
import { useSync } from '@/context/SyncContext';
import { radius, screenScroll, space, tabBarFloatingClearance } from '@/constants/layout';
import { countFailedOutbox, countPendingOutbox, listOutboxForUi } from '@/lib/outbox';
import { apiHealthCheck } from '@/lib/apiClient';
import { getApiBaseUrl, getApiMode, isApiEnabled } from '@/lib/apiConfig';
import { t } from '@/lib/i18n';
import { checkOtaUpdateAvailable, fetchOtaAndReload, isOtaRuntimeSupported } from '@/lib/otaUpdates';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const p = Colors[useColorScheme() ?? 'light'];
  const s = t('settings');
  const insets = useSafeAreaInsets();
  const bottomPad = tabBarFloatingClearance(insets.bottom);
  const { signOut, profile } = useAuth();
  const { prefs, setPrefs } = usePrefs();
  const { runSyncNow, retryFailed, status } = useSync();
  const router = useRouter();
  const [pending, setPending] = useState(0);
  const [failed, setFailed] = useState(0);
  const [tail, setTail] = useState('');
  const [otaBusy, setOtaBusy] = useState(false);
  const [apiOk, setApiOk] = useState<boolean | null>(null);

  const refresh = useCallback(() => {
    setPending(countPendingOutbox());
    setFailed(countFailedOutbox());
    setTail(
      listOutboxForUi(5)
        .map((r) => `${r.type} ${r.status}`)
        .join(' · '),
    );
    if (isApiEnabled()) {
      void apiHealthCheck().then(setApiOk);
    } else {
      setApiOk(null);
    }
  }, []);

  const testBiometric = useCallback(async () => {
    const st = t('settings');
    try {
      const has = await LocalAuthentication.hasHardwareAsync();
      if (!has) {
        Alert.alert(st.bioTitle, st.noHardware);
        return;
      }
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        Alert.alert(st.bioTitle, st.noEnrolled);
        return;
      }
      const r = await LocalAuthentication.authenticateAsync({
        promptMessage: 'RG Consultor',
        cancelLabel: t('common').cancel,
      });
      Alert.alert(st.bioTitle, r.success ? st.bioSuccess : st.bioCancelled);
    } catch (e) {
      Alert.alert(st.bioTitle, e instanceof Error ? e.message : 'Erro desconhecido.');
    }
  }, []);

  const onCheckOta = useCallback(async () => {
    const st = t('settings');
    if (!isOtaRuntimeSupported()) {
      Alert.alert(st.otaCheckSection, st.otaCheckDev);
      return;
    }
    setOtaBusy(true);
    try {
      const available = await checkOtaUpdateAvailable();
      if (!available) {
        Alert.alert(st.otaCheckSection, st.otaCheckUpToDate);
        return;
      }
      Alert.alert(st.otaCheckFoundTitle, st.otaCheckFoundBody, [
        { text: st.otaCheckFoundLater, style: 'cancel' },
        {
          text: st.otaCheckFoundApply,
          onPress: () => {
            void (async () => {
              try {
                await fetchOtaAndReload();
              } catch {
                Alert.alert(st.otaCheckSection, st.otaCheckFail);
              }
            })();
          },
        },
      ]);
    } catch {
      Alert.alert(st.otaCheckSection, st.otaCheckFail);
    } finally {
      setOtaBusy(false);
    }
  }, []);

  const themeChip = (value: ThemePreference, label: string) => {
    const active = prefs.themePreference === value;
    return (
      <HapticPressable
        key={value}
        onPress={() => void setPrefs({ themePreference: value })}
        style={[
          styles.chip,
          {
            borderColor: active ? p.tint : p.border,
            backgroundColor: active ? `${p.tint}18` : p.card,
          },
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        accessibilityLabel={label}>
        <Text style={[styles.chipText, { color: active ? p.tint : p.text }]}>{label}</Text>
      </HapticPressable>
    );
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.root,
        screenScroll,
        { backgroundColor: p.background, paddingBottom: bottomPad },
      ]}
      onLayout={refresh}>
      {profile ? (
        <View style={[styles.profileCard, { borderColor: p.border, backgroundColor: p.card }]}>
          <Text style={[styles.h, { color: p.text }]}>{s.account}</Text>
          <Text style={[styles.p, { color: p.text }]}>{profile.displayName}</Text>
          <Text style={[styles.p, { color: p.textSecondary }]}>{profile.email}</Text>
          <Text style={[styles.p, { color: p.textSecondary }]}>
            Perfil: {profile.role === 'master' ? s.profileMaster : s.profileSeller} · {profile.region}
          </Text>
        </View>
      ) : null}

      <Text style={[styles.h, { color: p.text }]}>{s.theme}</Text>
      <View style={styles.chipRow}>
        {themeChip('light', s.themeLight)}
        {themeChip('dark', s.themeDark)}
        {themeChip('system', s.themeSystem)}
      </View>

      <View style={[styles.infoCard, { borderColor: p.border, backgroundColor: p.card }]}>
        <Text style={[styles.h, { color: p.text }]}>{s.nativeVsOtaTitle}</Text>
        <Text style={[styles.p, { color: p.textSecondary }]}>{s.nativeVsOtaBody}</Text>
      </View>

      <Text style={[styles.h, { color: p.text, marginTop: 8 }]}>{s.otaCheckSection}</Text>
      <Text style={[styles.p, { color: p.textSecondary }]}>{s.otaCheckHint}</Text>
      <Pressable
        onPress={() => void onCheckOta()}
        disabled={otaBusy}
        style={[
          styles.btnSecondary,
          { borderColor: p.tint, opacity: otaBusy ? 0.65 : 1 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={s.otaCheckBtn}>
        <Text style={[styles.btnSecondaryText, { color: p.tint }]}>
          {otaBusy ? s.otaCheckSearching : s.otaCheckBtn}
        </Text>
      </Pressable>

      <Text style={[styles.h, { color: p.text, marginTop: 8 }]}>{s.biometricTest}</Text>
      <Text style={[styles.p, { color: p.textSecondary }]}>{s.biometricHint}</Text>
      <View style={styles.row}>
        <Text style={{ color: p.text, flex: 1 }}>{s.biometricPref}</Text>
        <Switch value={prefs.biometricQuickLogin} onValueChange={(v) => void setPrefs({ biometricQuickLogin: v })} />
      </View>
      <Pressable
        onPress={() => void testBiometric()}
        style={[styles.btnSecondary, { borderColor: p.tint }]}
        accessibilityRole="button"
        accessibilityLabel={s.biometricTest}>
        <Text style={[styles.btnSecondaryText, { color: p.tint }]}>{s.biometricTest}</Text>
      </Pressable>

      <Text style={[styles.h, { color: p.text, marginTop: 24 }]}>{s.syncTitle}</Text>
      <View style={[styles.infoCard, { borderColor: p.border, backgroundColor: p.card, marginBottom: 10 }]}>
        <Text style={[styles.h, { color: p.text }]}>{s.apiTitle}</Text>
        <Text style={[styles.p, { color: p.textSecondary }]}>
          {s.apiModeLabel}: {getApiMode()} · {s.apiUrlLabel}: {getApiBaseUrl() || '—'}
        </Text>
        {isApiEnabled() ? (
          <Text style={[styles.p, { color: apiOk ? p.tint : p.danger }]}>
            {apiOk ? s.apiOnline : s.apiOffline}
          </Text>
        ) : null}
      </View>
      <Text style={[styles.p, { color: p.textSecondary }]}>
        {s.syncQueue.replace('{pending}', String(pending)).replace('{failed}', String(failed)).replace('{status}', status)}
      </Text>
      <Text style={[styles.mono, { color: p.textSecondary }]}>{tail}</Text>
      <Pressable
        onPress={() => {
          void runSyncNow();
          refresh();
        }}
        style={[styles.btn, { backgroundColor: p.tint }]}
        accessibilityLabel={s.syncNowA11y}>
        <Text style={styles.btnText}>{s.syncNow}</Text>
      </Pressable>
      {failed > 0 ? (
        <Pressable onPress={retryFailed} style={[styles.btn, { backgroundColor: p.danger, marginTop: 8 }]}>
          <Text style={styles.btnText}>{s.retryFailed}</Text>
        </Pressable>
      ) : null}

      <Text style={[styles.h, { color: p.text, marginTop: 24 }]}>{s.rankingTitle}</Text>
      <View style={styles.row}>
        <Text style={{ color: p.text, flex: 1 }}>{s.rankingToggle}</Text>
        <Switch value={prefs.rankingOptIn} onValueChange={(v) => void setPrefs({ rankingOptIn: v })} />
      </View>
      <Text style={[styles.label, { color: p.textSecondary }]}>{s.rankingAliasLabel}</Text>
      <TextInput
        value={prefs.leaderboardAlias}
        onChangeText={(txt) => void setPrefs({ leaderboardAlias: txt })}
        style={[styles.input, { borderColor: p.border, color: p.text }]}
        placeholder={s.aliasPlaceholder}
        placeholderTextColor={p.textSecondary}
      />

      <Pressable
        onPress={async () => {
          await signOut();
          router.replace('/login');
        }}
        style={[styles.btn, { backgroundColor: p.danger, marginTop: 24 }]}
        accessibilityLabel={s.signOutA11y}>
        <Text style={styles.btnText}>{s.signOut}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.sm },
  infoCard: { borderRadius: radius.md, borderWidth: 1, padding: space.md, gap: space.sm, marginTop: space.xs },
  profileCard: { borderRadius: radius.md, borderWidth: 1, padding: space.md, gap: space.xs, marginBottom: space.sm },
  h: { fontSize: 18, fontWeight: '900' },
  p: { fontSize: 14, lineHeight: 20 },
  mono: { fontSize: 11 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  chipText: { fontSize: 13, fontWeight: '800' },
  btn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '900' },
  btnSecondary: {
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  btnSecondaryText: { fontWeight: '800', fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 8 },
  label: { fontSize: 13, marginTop: 8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 16 },
});
