import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { radius, space, tabBarFloatingClearance } from '@/constants/layout';
import { t } from '@/lib/i18n';
import { checkOtaUpdateAvailable, fetchOtaAndReload, isOtaRuntimeSupported } from '@/lib/otaUpdates';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  AppState,
  type AppStateStatus,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type State =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'available' }
  | { kind: 'downloading' }
  | { kind: 'ready' };

/** Ao voltar ao app + intervalo — equilíbrio entre rapidez e uso de rede/bateria */
const CHECK_INTERVAL_MS = 5 * 60 * 1000;

export function OtaUpdateBanner() {
  const scheme = useColorScheme() ?? 'light';
  const p = Colors[scheme];
  const insets = useSafeAreaInsets();
  const bottomPad = tabBarFloatingClearance(insets.bottom);
  const O = t('ota');
  const [state, setState] = useState<State>({ kind: 'idle' });
  const slideY = useRef(new Animated.Value(120)).current;
  const inFlight = useRef(false);
  const stateRef = useRef<State>({ kind: 'idle' });
  stateRef.current = state;

  const show = state.kind === 'available' || state.kind === 'downloading' || state.kind === 'ready';

  useEffect(() => {
    Animated.spring(slideY, {
      toValue: show ? 0 : 120,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
  }, [show, slideY]);

  const runCheck = useCallback(async () => {
    if (!isOtaRuntimeSupported()) return;
    const s = stateRef.current;
    if (s.kind === 'available' || s.kind === 'downloading' || s.kind === 'ready') return;
    if (inFlight.current) return;
    inFlight.current = true;
    setState({ kind: 'checking' });
    try {
      const available = await checkOtaUpdateAvailable();
      if (available) {
        setState({ kind: 'available' });
      } else {
        setState({ kind: 'idle' });
      }
    } catch {
      setState({ kind: 'idle' });
    } finally {
      inFlight.current = false;
    }
  }, []);

  const applyUpdate = async () => {
    setState({ kind: 'downloading' });
    try {
      await fetchOtaAndReload();
    } catch (e) {
      setState({ kind: 'idle' });
      Alert.alert(
        O.updateFailTitle,
        e instanceof Error ? e.message : O.updateFailBody,
      );
    }
  };

  useEffect(() => {
    void runCheck();
    const id = setInterval(() => void runCheck(), CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [runCheck]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') {
        void runCheck();
      }
    });
    return () => sub.remove();
  }, [runCheck]);

  if (!show) return null;

  const busy = state.kind === 'downloading' || state.kind === 'ready';

  return (
    <Animated.View
      style={[
        styles.wrap,
        { transform: [{ translateY: slideY }], paddingBottom: bottomPad + space.sm },
      ]}
      accessibilityLiveRegion="polite">
      <View
        style={[
          styles.card,
          {
            backgroundColor: scheme === 'dark' ? Colors.dark.card : Colors.light.card,
            borderColor: p.tint,
          },
        ]}>
        <View style={[styles.dot, { backgroundColor: p.tint }]} />
        <View style={styles.content}>
          <Text style={[styles.title, { color: p.text }]}>
            {state.kind === 'ready' ? O.titleRestart : O.titleAvail}
          </Text>
          <Text style={[styles.body, { color: p.textSecondary }]}>
            {state.kind === 'downloading'
              ? O.bodyDownload
              : state.kind === 'ready'
                ? O.bodyRestart
                : O.bodyDefault}
          </Text>
        </View>
        {busy ? (
          <ActivityIndicator color={p.tint} />
        ) : (
          <Pressable
            onPress={() => void applyUpdate()}
            style={({ pressed }) => [
              styles.btn,
              { backgroundColor: p.tint, opacity: pressed ? 0.85 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={O.updateBtnA11y}>
            <Text style={styles.btnText}>{O.updateBtn}</Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: space.lg,
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  content: { flex: 1, gap: 2 },
  title: { fontSize: 14, fontWeight: '800' },
  body: { fontSize: 12, lineHeight: 17 },
  btn: {
    paddingHorizontal: space.md,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  btnText: { color: '#fff', fontWeight: '900', fontSize: 13 },
});
