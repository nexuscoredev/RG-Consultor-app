import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { Surface } from '@/components/ui/Surface';
import { radius, space } from '@/constants/layout';
import { t } from '@/lib/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const KEY = 'rg_home_pull_tip_dismissed_v1';

export function HomePullTip() {
  const scheme = useColorScheme() ?? 'light';
  const p = Colors[scheme];
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const v = await AsyncStorage.getItem(KEY);
      if (!cancelled && v !== '1') setShow(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!show) return null;

  const home = t('home');

  return (
    <Surface style={[styles.wrap, { borderColor: p.border }]}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[styles.title, { color: p.text }]}>{home.pullTipTitle}</Text>
        <Text style={[styles.body, { color: p.textSecondary }]}>{home.pullTipBody}</Text>
      </View>
      <HapticPressable
        onPress={async () => {
          await AsyncStorage.setItem(KEY, '1');
          setShow(false);
        }}
        style={[styles.btn, { backgroundColor: p.tint }]}
        accessibilityLabel={home.pullTipDismiss}>
        <Text style={styles.btnText}>{home.pullTipDismiss}</Text>
      </HapticPressable>
    </Surface>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  title: { fontSize: 14, fontWeight: '900' },
  body: { fontSize: 13, lineHeight: 18, flex: 1 },
  btn: { paddingHorizontal: space.md, paddingVertical: 10, borderRadius: radius.md },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
});
