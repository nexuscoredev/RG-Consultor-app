import { useTabletLayout } from '@/hooks/useTabletLayout';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Centraliza e limita largura do conteúdo em tablets (Redmi Pad 2, etc.). */
export function TabletContent({ children, style }: Props) {
  const { isTablet, contentMaxWidth } = useTabletLayout();

  if (!isTablet) {
    return <View style={style}>{children}</View>;
  }

  return (
    <View style={[styles.frame, { maxWidth: contentMaxWidth, width: '100%' }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { alignSelf: 'center' },
});
