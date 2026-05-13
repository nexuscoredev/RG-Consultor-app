import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth, type ConsentSnapshot } from '@/context/AuthContext';
import { t } from '@/lib/i18n';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ConsentScreen() {
  const p = Colors[useColorScheme() ?? 'light'];
  const C = t('consent');
  const { saveConsent } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [c, setC] = useState<ConsentSnapshot>({
    locationWhenInUse: false,
    locationBackground: false,
    dataRetentionAck: false,
  });

  const next = () => setStep((s) => Math.min(2, s + 1));
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const finish = async () => {
    await saveConsent(c);
    router.replace('/');
  };

  return (
    <View style={[styles.root, { backgroundColor: p.background, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: p.text }]}>{C.title}</Text>
        <Text style={[styles.meta, { color: p.textSecondary }]}>
          {C.step} {step + 1} {C.of} 3
        </Text>

        {step === 0 ? (
          <View style={[styles.card, { borderColor: p.border, backgroundColor: p.card }]}>
            <Text style={[styles.h2, { color: p.text }]}>{C.locUseTitle}</Text>
            <Text style={[styles.body, { color: p.textSecondary }]}>{C.locUseBody}</Text>
            <View style={styles.row}>
              <Text style={{ color: p.text, flex: 1 }}>{C.locUseToggle}</Text>
              <Switch value={c.locationWhenInUse} onValueChange={(v) => setC({ ...c, locationWhenInUse: v })} />
            </View>
          </View>
        ) : null}

        {step === 1 ? (
          <View style={[styles.card, { borderColor: p.border, backgroundColor: p.card }]}>
            <Text style={[styles.h2, { color: p.text }]}>{C.locBgTitle}</Text>
            <Text style={[styles.body, { color: p.textSecondary }]}>{C.locBgBody}</Text>
            <View style={styles.row}>
              <Text style={{ color: p.text, flex: 1 }}>{C.locBgToggle}</Text>
              <Switch value={c.locationBackground} onValueChange={(v) => setC({ ...c, locationBackground: v })} />
            </View>
          </View>
        ) : null}

        {step === 2 ? (
          <View style={[styles.card, { borderColor: p.border, backgroundColor: p.card }]}>
            <Text style={[styles.h2, { color: p.text }]}>{C.retentionTitle}</Text>
            <Text style={[styles.body, { color: p.textSecondary }]}>{C.retentionBody}</Text>
            <View style={styles.row}>
              <Text style={{ color: p.text, flex: 1 }}>{C.retentionToggle}</Text>
              <Switch value={c.dataRetentionAck} onValueChange={(v) => setC({ ...c, dataRetentionAck: v })} />
            </View>
          </View>
        ) : null}

        <View style={styles.nav}>
          {step > 0 ? (
            <Pressable onPress={prev} style={styles.ghost}>
              <Text style={{ color: p.textSecondary }}>{C.back}</Text>
            </Pressable>
          ) : (
            <View />
          )}
          {step < 2 ? (
            <Pressable onPress={next} style={[styles.primary, { backgroundColor: p.tint }]}>
              <Text style={styles.primaryText}>{C.continue}</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => void finish()}
              disabled={!c.locationWhenInUse || !c.dataRetentionAck}
              style={[
                styles.primary,
                { backgroundColor: c.locationWhenInUse && c.dataRetentionAck ? p.tint : p.border },
              ]}>
              <Text style={styles.primaryText}>{C.finish}</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40, gap: 12 },
  title: { fontSize: 24, fontWeight: '900' },
  meta: { marginBottom: 8 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  h2: { fontSize: 18, fontWeight: '800' },
  body: { fontSize: 14, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  ghost: { padding: 12 },
  primary: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12 },
  primaryText: { color: '#fff', fontWeight: '800' },
});
