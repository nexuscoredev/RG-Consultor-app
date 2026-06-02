import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { chevronSize, iconSize } from '@/constants/icons';
import { radius, space } from '@/constants/layout';
import { typography } from '@/constants/typography';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Link, type Href } from 'expo-router';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type HubIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type Props = {
  href: Href;
  title: string;
  hint: string;
  icon: HubIconName;
};

export function HubListRow({ href, title, hint, icon }: Props) {
  const p = Colors[useColorScheme() ?? 'light'];

  return (
    <Link href={href} asChild>
      <HapticPressable
        style={[styles.row, { backgroundColor: p.card, borderColor: p.border }]}
        accessibilityRole="button"
        accessibilityLabel={title}>
        <MaterialCommunityIcons name={icon} size={iconSize.lg} color={p.tint} />
        <View style={styles.body}>
          <Text style={[typography.title, { color: p.text }]}>{title}</Text>
          <Text style={[typography.caption, styles.hint, { color: p.textSecondary }]}>{hint}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={chevronSize} color={p.textSecondary} />
      </HapticPressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  body: { flex: 1 },
  hint: { marginTop: 2 },
});
