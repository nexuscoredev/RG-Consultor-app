import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { button, radius } from '@/constants/layout';
import { typography } from '@/constants/typography';
import { forwardRef, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, type PressableProps, type ViewStyle } from 'react-native';

type Props = Omit<PressableProps, 'children'> & {
  label: string;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
  /** Texto e borda na cor de marca (default: texto neutro) */
  tint?: boolean;
};

export const SecondaryButton = forwardRef<View, Props>(function SecondaryButton(
  { label, loading, disabled, icon, fullWidth, tint, style, accessibilityLabel, ...rest },
  ref,
) {
  const p = Colors[useColorScheme() ?? 'light'];
  const labelColor = tint ? p.tint : p.text;

  return (
    <HapticPressable
      ref={ref}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={[
        styles.base,
        fullWidth && styles.fullWidth,
        { borderColor: tint ? p.tint : p.border, opacity: disabled || loading ? 0.55 : 1 },
        style as ViewStyle,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={labelColor} />
      ) : (
        <View style={styles.inner}>
          {icon}
          <Text style={[styles.label, { color: labelColor }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      )}
    </HapticPressable>
  );
});

const styles = StyleSheet.create({
  base: {
    minHeight: button.minHeight,
    paddingVertical: button.paddingVertical,
    paddingHorizontal: button.paddingHorizontal,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { alignSelf: 'stretch', width: '100%' },
  inner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  label: { ...typography.buttonSm },
});
