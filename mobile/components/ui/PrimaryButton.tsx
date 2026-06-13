import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { useTabletLayout } from '@/hooks/useTabletLayout';
import { button, radius } from '@/constants/layout';
import { typography } from '@/constants/typography';
import { forwardRef, type ReactNode } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type ViewStyle,
} from 'react-native';

export type PrimaryButtonVariant = 'tint' | 'lime' | 'danger' | 'whatsapp';

type Props = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: PrimaryButtonVariant;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
};

export const PrimaryButton = forwardRef<View, Props>(function PrimaryButton(
  { label, variant = 'tint', loading, disabled, icon, fullWidth, style, accessibilityLabel, ...rest },
  ref,
) {
  const p = Colors[useColorScheme() ?? 'light'];
  const { touchMinHeight } = useTabletLayout();
  const bg =
    variant === 'lime'
      ? p.lime
      : variant === 'danger'
        ? p.danger
        : variant === 'whatsapp'
          ? p.whatsapp
          : p.tint;
  const textColor = variant === 'lime' ? p.forestDeep : '#fff';

  return (
    <HapticPressable
      ref={ref}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={[
        styles.base,
        { minHeight: touchMinHeight },
        fullWidth && styles.fullWidth,
        { backgroundColor: bg, opacity: disabled || loading ? 0.55 : 1 },
        style as ViewStyle,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.inner}>
          {icon}
          <Text style={[styles.label, { color: textColor }]} numberOfLines={1}>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { alignSelf: 'stretch', width: '100%' },
  inner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  label: { ...typography.button },
});
