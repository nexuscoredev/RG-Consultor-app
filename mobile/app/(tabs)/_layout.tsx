import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BlurView } from 'expo-blur';
import { Link, Tabs, type Href } from 'expo-router';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

function TabBarIcon({
  name,
  color,
  focused,
}: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
  focused: boolean;
}) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapFocused]}>
      <FontAwesome size={focused ? 23 : 21} style={{ marginBottom: -2 }} name={name} color={color} />
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme ?? 'light';
  const p = Colors[scheme];
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: p.tabIconSelected,
        tabBarInactiveTintColor: p.tabIconDefault,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarStyle: {
          position: 'absolute',
          left: 18,
          right: 18,
          bottom: Math.max(insets.bottom, 10),
          height: 62,
          borderRadius: 26,
          borderTopWidth: 0,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: `${p.forestDeep}18`,
          backgroundColor: Platform.OS === 'android' ? `${p.card}e8` : 'transparent',
          elevation: 16,
          shadowColor: '#0a2418',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.14,
          shadowRadius: 24,
          overflow: 'hidden',
          paddingHorizontal: 6,
        },
        tabBarBackground: () => (
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
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="home" color={color} focused={focused} />,
          headerRight: () => (
            <Link href={'/(tabs)/more/settings' as Href} asChild>
              <Pressable style={{ marginRight: 16 }} accessibilityRole="button" accessibilityLabel="Configurações">
                {({ pressed }) => (
                  <FontAwesome
                    name="cog"
                    size={22}
                    color={p.text}
                    style={{ opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="calendar" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'Mais',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="ellipsis-h" color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.2, marginBottom: 4 },
  tabItem: { paddingTop: 6 },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ scale: 1 }],
  },
  iconWrapFocused: {
    transform: [{ scale: 1.06 }],
  },
});
