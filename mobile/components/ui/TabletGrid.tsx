import { space } from '@/constants/layout';
import { Children, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTabletLayout } from '@/hooks/useTabletLayout';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Largura de cada célula em layout largo (default 48.5%). */
  cellWidth?: `${number}%`;
};

/** Grelha 2 colunas em tablet largo (≥900dp); coluna única no telemóvel. */
export function TabletGrid({ children, style, cellWidth = '48.5%' }: Props) {
  const { isWide } = useTabletLayout();

  if (!isWide) {
    return <View style={[{ gap: space.md }, style]}>{children}</View>;
  }

  return (
    <View style={[styles.grid, style]}>
      {Children.map(children, (child) =>
        child ? <View style={[styles.cell, { width: cellWidth }]}>{child}</View> : null,
      )}
    </View>
  );
}

/** Envolve um item para uso dentro de TabletGrid (evita map em array). */
export function TabletGridItem({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={style}>{children}</View>;
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
    justifyContent: 'space-between',
  },
  cell: {
    flexGrow: 1,
    minWidth: 280,
  },
});
