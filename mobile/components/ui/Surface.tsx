import Colors from '@/constants/Colors';
import { radius, shadow, space } from '@/constants/layout';
import { useColorScheme } from '@/components/useColorScheme';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';

type Props = {
  children: ReactNode;
  elevated?: boolean;
  strong?: boolean;
  style?: ViewStyle | ViewStyle[];
};

export function Surface({ children, elevated, strong, style }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const p = Colors[scheme];
  const sh = Platform.OS === 'web' ? undefined : strong ? shadow.lift : elevated ? shadow.card : shadow.soft;
  return (
    <View
      style={[
        styles.base,
        { backgroundColor: p.card, borderColor: p.border },
        sh,
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: space.lg,
  },
});
