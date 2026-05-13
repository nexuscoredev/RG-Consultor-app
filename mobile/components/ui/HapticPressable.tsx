import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const ReanimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = PressableProps & {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  haptic?: boolean;
};

/**
 * Micro-interação: escala com spring + impacto tátil leve.
 */
export function HapticPressable({ children, style, onPressIn, onPressOut, onPress, haptic = true, ...rest }: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleIn = useCallback(
    (e: Parameters<NonNullable<PressableProps['onPressIn']>>[0]) => {
      scale.value = withSpring(0.97, { damping: 16, stiffness: 420 });
      if (haptic) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPressIn?.(e);
    },
    [haptic, onPressIn, scale],
  );

  const handleOut = useCallback(
    (e: Parameters<NonNullable<PressableProps['onPressOut']>>[0]) => {
      scale.value = withSpring(1, { damping: 14, stiffness: 380 });
      onPressOut?.(e);
    },
    [onPressOut, scale],
  );

  return (
    <ReanimatedPressable
      {...rest}
      style={[animatedStyle, style]}
      onPressIn={handleIn}
      onPressOut={handleOut}
      onPress={onPress}>
      {children}
    </ReanimatedPressable>
  );
}
