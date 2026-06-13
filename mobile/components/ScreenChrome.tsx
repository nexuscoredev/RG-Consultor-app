import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { TabletContent } from '@/components/ui/TabletContent';
import { useTabletLayout } from '@/hooks/useTabletLayout';
import { space, tabBarFloatingClearance } from '@/constants/layout';
import { typography } from '@/constants/typography';
import { ReactNode, useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function ScreenChrome({
  title,
  subtitle,
  headerRight,
  children,
  footer,
  onRefresh,
  scrollable = true,
}: {
  title?: string;
  subtitle?: string;
  /** Ação no canto direito do cabeçalho (ex.: configurações). */
  headerRight?: ReactNode;
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
  const { horizontalPadding, isTablet, contentGap } = useTabletLayout();
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
      {title || subtitle || headerRight ? (
        <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}>
          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              {title ? (
                <Text
                  style={[
                    styles.title,
                    isTablet && styles.titleTablet,
                    { color: palette.text },
                  ]}>
                  {title}
                </Text>
              ) : null}
              {subtitle ? (
                <Text
                  style={[
                    styles.subtitle,
                    isTablet && styles.subtitleTablet,
                    { color: palette.textSecondary },
                  ]}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
            {headerRight ? <View style={styles.headerAction}>{headerRight}</View> : null}
          </View>
        </View>
      ) : null}
      {scrollable ? (
        <ScrollView
          nestedScrollEnabled
          contentContainerStyle={[
            styles.scroll,
            {
              paddingHorizontal: horizontalPadding,
              paddingBottom: Math.max(space.xxl, tabBarFloatingClearance(insets.bottom)),
            },
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
          <TabletContent>{children}</TabletContent>
        </ScrollView>
      ) : (
        <View
          style={[
            styles.scroll,
            styles.noScrollBody,
            {
              paddingHorizontal: horizontalPadding,
              paddingBottom: Math.max(space.xxl, tabBarFloatingClearance(insets.bottom)),
            },
          ]}>
          <TabletContent style={styles.noScrollBody}>{children}</TabletContent>
        </View>
      )}
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingBottom: space.md },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  headerCopy: { flex: 1, minWidth: 0 },
  headerAction: { marginTop: 2 },
  title: { ...typography.h1, fontWeight: typography.h1.fontWeight },
  subtitle: { ...typography.subtitle, marginTop: 6 },
  scroll: { paddingBottom: space.xxl, gap: space.lg },
  titleTablet: { fontSize: 32, letterSpacing: -0.8 },
  subtitleTablet: { fontSize: 17, lineHeight: 24 },
  /** Permite que um ScrollView filho ocupe altura restante sem colapsar no Android. */
  noScrollBody: { flex: 1, minHeight: 0 },
});
