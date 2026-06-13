import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

if (Platform.OS !== 'web') {
  require('react-native-reanimated');
}

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { AppThemeProvider } from '@/context/AppThemeContext';
import { AuthSessionBridge } from '@/components/AuthSessionBridge';
import { AuthProvider } from '@/context/AuthContext';
import { DemoGpsProvider } from '@/context/DemoGpsContext';
import { GamificationProvider } from '@/context/GamificationContext';
import { PrefsProvider } from '@/context/PrefsContext';
import { SyncProvider } from '@/context/SyncContext';
import { OtaUpdateBanner } from '@/components/OtaUpdateBanner';
import { getDb } from '@/lib/db';
import { t } from '@/lib/i18n';
import { initTelemetry } from '@/lib/telemetry';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={styles.errRoot} accessibilityRole="alert">
      <Text style={styles.errTitle}>{t('error').title}</Text>
      <Text style={styles.errBody}>{error.message}</Text>
      <Text style={styles.errHint}>{t('error').body}</Text>
      <Pressable onPress={retry} style={styles.errBtn} accessibilityRole="button" accessibilityLabel={t('common').retry}>
        <Text style={styles.errBtnText}>{t('common').retry}</Text>
      </Pressable>
    </View>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    getDb();
    initTelemetry();
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <PrefsProvider>
      <AppThemeProvider>
        <RootLayoutNav />
      </AppThemeProvider>
    </PrefsProvider>
  );
}

const navLight = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.tint,
    background: Colors.light.background,
    card: Colors.light.card,
    text: Colors.light.text,
    border: Colors.light.border,
    notification: Colors.light.tint,
  },
};

const navDark = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.tint,
    background: Colors.dark.background,
    card: Colors.dark.card,
    text: Colors.dark.text,
    border: Colors.dark.border,
    notification: Colors.dark.tint,
  },
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const bg = colorScheme === 'dark' ? Colors.dark.background : Colors.light.background;

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(bg);
  }, [bg]);

  const base = colorScheme === 'dark' ? navDark : navLight;
  const theme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colorScheme === 'dark' ? Colors.dark.tint : Colors.light.tint,
    },
  };

  return (
    <ThemeProvider value={theme}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <OtaUpdateBanner />
      <AuthProvider>
        <AuthSessionBridge />
        <DemoGpsProvider>
          <SyncProvider>
            <GamificationProvider>
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: 'fade',
                  contentStyle: { backgroundColor: bg },
                }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="login" />
                <Stack.Screen name="onboarding/consent" />
                <Stack.Screen name="master" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" />
              </Stack>
            </GamificationProvider>
          </SyncProvider>
        </DemoGpsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  errRoot: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 12,
    backgroundColor: Colors.light.background,
  },
  errTitle: { fontSize: 20, fontWeight: '800', color: Colors.light.text },
  errBody: { fontSize: 14, color: Colors.light.danger },
  errHint: { fontSize: 14, color: Colors.light.textSecondary, lineHeight: 20 },
  errBtn: {
    marginTop: 16,
    alignSelf: 'flex-start',
    backgroundColor: Colors.light.tint,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  errBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
