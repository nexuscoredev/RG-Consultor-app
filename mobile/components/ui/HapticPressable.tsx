import * as Haptics from 'expo-haptics';
import { forwardRef, useCallback, useMemo } from 'react';
import { Platform, Pressable, StyleSheet, type PressableProps, type View } from 'react-native';

type Props = PressableProps & {
  haptic?: boolean;
};

/**
 * Web: sem Reanimated (evita erro no Chrome: `CSSStyleDeclaration` indexed setter).
 * Nativo: spring + Reanimated (carregado só em iOS/Android).
 */
export const HapticPressable = forwardRef<View, Props>(function HapticPressable(props, ref) {
  if (Platform.OS === 'web') {
    return <HapticPressableWeb ref={ref} {...props} />;
  }
  return <HapticPressableNative ref={ref} {...props} />;
});

const HapticPressableWeb = forwardRef<View, Props>(function HapticPressableWeb(
  { children, style, onPressIn, onPressOut, onPress, haptic = true, ...rest },
  ref,
) {
  const handleIn = useCallback(
    (e: Parameters<NonNullable<PressableProps['onPressIn']>>[0]) => {
      if (haptic) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      onPressIn?.(e);
    },
    [haptic, onPressIn],
  );

  return (
    <Pressable
      ref={ref}
      {...rest}
      style={(state) => {
        const base = typeof style === 'function' ? style(state) : style;
        const flat = StyleSheet.flatten(base);
        return StyleSheet.compose(flat, state.pressed ? { opacity: 0.92 } : undefined);
      }}
      onPressIn={handleIn}
      onPressOut={onPressOut}
      onPress={onPress}>
      {children}
    </Pressable>
  );
});

const HapticPressableNative = forwardRef<View, Props>(function HapticPressableNative(
  { children, style, onPressIn, onPressOut, onPress, haptic = true, ...rest },
  ref,
) {
  const R = require('react-native-reanimated') as typeof import('react-native-reanimated');
  const ReanimatedPressable = useMemo(() => R.default.createAnimatedComponent(Pressable), []);
  const scale = R.useSharedValue(1);
  const animatedStyle = R.useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleIn = useCallback(
    (e: Parameters<NonNullable<PressableProps['onPressIn']>>[0]) => {
      scale.value = R.withSpring(0.97, { damping: 16, stiffness: 420 });
      if (haptic) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPressIn?.(e);
    },
    [haptic, onPressIn, scale],
  );

  const handleOut = useCallback(
    (e: Parameters<NonNullable<PressableProps['onPressOut']>>[0]) => {
      scale.value = R.withSpring(1, { damping: 14, stiffness: 380 });
      onPressOut?.(e);
    },
    [onPressOut, scale],
  );

  return (
    <ReanimatedPressable
      ref={ref}
      {...rest}
      style={[animatedStyle, style]}
      onPressIn={handleIn}
      onPressOut={handleOut}
      onPress={onPress}>
      {children}
    </ReanimatedPressable>
  );
});
