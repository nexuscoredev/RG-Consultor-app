import { RgConsultorLogo } from '@/components/RgConsultorLogo';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/context/AuthContext';
import { getAuthApiHint, isDemoAuthVisible } from '@/lib/authApi';
import { t } from '@/lib/i18n';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const p = Colors[useColorScheme() ?? 'light'];
  const L = t('login');
  const { signIn } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('vendedor@rg.com');
  const [password, setPassword] = useState('rg2026');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    setBusy(true);
    try {
      await signIn(email, password);
      router.replace('/');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Falha no login');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: p.background, paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.inner}>
        <RgConsultorLogo variant="hero" subtitle="Performance comercial e sustentabilidade." />
        {isDemoAuthVisible() ? (
          <View style={[styles.demoBadge, { backgroundColor: `${p.tint}14`, borderColor: `${p.tint}40` }]}>
            <Text style={[styles.demoBadgeText, { color: p.forestDeep }]}>{L.demoBadge}</Text>
          </View>
        ) : null}
        <Text style={[styles.h1, { color: p.text }]}>{L.title}</Text>
        <Text style={[styles.sub, { color: p.textSecondary }]}>
          {isDemoAuthVisible() ? L.demoHint : getAuthApiHint()}
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder={L.email}
          placeholderTextColor={p.textSecondary}
          style={[styles.input, { borderColor: p.border, color: p.text, backgroundColor: p.card }]}
          accessibilityLabel={L.email}
          accessibilityHint="Endereço de e-mail corporativo"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder={L.password}
          placeholderTextColor={p.textSecondary}
          style={[styles.input, { borderColor: p.border, color: p.text, backgroundColor: p.card }]}
          accessibilityLabel={L.password}
          accessibilityHint="Senha de acesso"
        />
        {err ? (
          <Text style={{ color: p.danger }} accessibilityLiveRegion="polite">
            {err}
          </Text>
        ) : null}
        <Pressable
          onPress={() => void submit()}
          disabled={busy}
          style={({ pressed }) => [
            styles.btn,
            { backgroundColor: p.tint, opacity: pressed ? 0.88 : busy ? 0.6 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={L.submit}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{L.submit}</Text>}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { flex: 1, padding: 24, gap: 12, justifyContent: 'center' },
  demoBadge: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  demoBadgeText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.6 },
  h1: { fontSize: 22, fontWeight: '800', marginTop: 8 },
  sub: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16 },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
