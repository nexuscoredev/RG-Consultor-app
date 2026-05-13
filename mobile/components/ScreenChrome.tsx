import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { space, tabBarFloatingClearance } from '@/constants/layout';
import { ReactNode, useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function ScreenChrome({
  title,
  subtitle,
  children,
  footer,
  onRefresh,
  scrollable = true,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Pull-to-refresh (indicador com cores de marca). */
  onRefresh?: () => void | Promise<void>;
  /**
   * Quando `false`, o conteúdo não fica dentro de um ScrollView vertical (evita aninhar MapView
   * e outros widgets que quebram no Android). Use um ScrollView interno na tela, se precisar.
   */
  scrollable?: boolean;
}) {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  return (
    <View style={[styles.root, { backgroundColor: palette.background, paddingTop: insets.top }]}>
      {title || subtitle ? (
        <View style={styles.header}>
          {title ? <Text style={[styles.title, { color: palette.text }]}>{title}</Text> : null}
          {subtitle ? (
            <Text style={[styles.subtitle, { color: palette.textSecondary }]}>{subtitle}</Text>
          ) : null}
        </View>
      ) : null}
      {scrollable ? (
        <ScrollView
          nestedScrollEnabled
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: Math.max(space.xxl, tabBarFloatingClearance(insets.bottom)) },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => void handleRefresh()}
                tintColor={palette.tint}
                colors={[palette.tint, palette.forestDeep]}
                progressBackgroundColor={palette.card}
              />
            ) : undefined
          }>
          {children}
        </ScrollView>
      ) : (
        <View
          style={[
            styles.scroll,
            styles.noScrollBody,
            { paddingBottom: Math.max(space.xxl, tabBarFloatingClearance(insets.bottom)) },
          ]}>
          {children}
        </View>
      )}
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: space.lg, paddingBottom: space.md },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { marginTop: 6, fontSize: 15, lineHeight: 20 },
  scroll: { paddingHorizontal: space.lg, paddingBottom: space.xxl, gap: space.lg },
  /** Permite que um ScrollView filho ocupe altura restante sem colapsar no Android. */
  noScrollBody: { flex: 1, minHeight: 0 },
});
