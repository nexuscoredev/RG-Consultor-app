import React from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { iconSize } from '@/constants/icons';
import { typography } from '@/constants/typography';
import { useTabletLayout } from '@/hooks/useTabletLayout';

type TabIconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

function TabBarIcon({
  name,
  color,
  focused,
}: {
  name: TabIconName;
  color: string;
  focused: boolean;
}) {
  return (
    <View style={focused ? [styles.iconWrap, styles.iconWrapFocused] : styles.iconWrap}>
      <MaterialCommunityIcons
        size={focused ? iconSize.lg + 1 : iconSize.lg - 1}
        style={{ marginBottom: -2 }}
        name={name}
        color={color}
      />
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme ?? 'light';
  const p = Colors[scheme];
  const insets = useSafeAreaInsets();
  const { isTablet, tabBarMaxWidth, tabBarHeight, width: screenW } = useTabletLayout();
  const tabBarLeft = isTablet ? Math.max(0, (screenW - tabBarMaxWidth) / 2) : 18;
  const tabBarWidth = isTablet ? tabBarMaxWidth : screenW - 36;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: p.tabIconSelected,
        tabBarInactiveTintColor: p.tabIconDefault,
        tabBarShowLabel: true,
        tabBarLabelStyle: isTablet ? { ...typography.tabLabel, fontSize: 13 } : typography.tabLabel,
        tabBarItemStyle: [styles.tabItem, isTablet && styles.tabItemTablet],
        tabBarStyle: {
          position: 'absolute',
          left: tabBarLeft,
          width: tabBarWidth,
          bottom: Math.max(insets.bottom, isTablet ? 14 : 10),
          height: tabBarHeight,
          borderRadius: 26,
          borderTopWidth: 0,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: `${p.forestDeep}18`,
          backgroundColor:
            Platform.OS === 'web'
              ? scheme === 'dark'
                ? `${p.card}f5`
                : `${p.card}f8`
              : Platform.OS === 'android'
                ? `${p.card}e8`
                : 'transparent',
          overflow: 'hidden',
          paddingHorizontal: 6,
          ...(Platform.OS === 'web'
            ? { boxShadow: '0 10px 24px rgba(10,36,24,0.14)' }
            : {
                elevation: 16,
                shadowColor: '#0a2418',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.14,
                shadowRadius: 24,
              }),
        },
        tabBarBackground: () =>
          Platform.OS === 'web' ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: scheme === 'dark' ? `${p.card}f0` : `${p.card}ee` },
              ]}
            />
          ) : (
            <BlurView
              intensity={scheme === 'dark' ? 42 : 56}
              tint={scheme === 'dark' ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ),
        headerShown: useClientOnlyValue(false, true),
        headerStyle: { backgroundColor: p.background },
        headerTintColor: p.tint,
        headerTitleStyle: { color: p.text, fontWeight: '800' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Agenda',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'calendar-month' : 'calendar-month-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="commercial"
        options={{
          title: 'Comercial',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'briefcase' : 'briefcase-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'Mais',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="dots-horizontal" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: { paddingTop: 6 },
  tabItemTablet: { paddingTop: 8, paddingHorizontal: 4 },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ scale: 1 }],
  },
  iconWrapFocused: {
    transform: [{ scale: 1.06 }],
  },
});
