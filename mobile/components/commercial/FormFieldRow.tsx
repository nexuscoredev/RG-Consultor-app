import { useTabletLayout } from '@/hooks/useTabletLayout';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { space } from '@/constants/layout';

type Props = {
  children: ReactNode;
};

/** Em tablet: dois campos lado a lado; em telemóvel: coluna. */
export function FormFieldRow({ children }: Props) {
  const { isTablet } = useTabletLayout();
  return <View style={isTablet ? styles.row : styles.col}>{children}</View>;
}

export function FormFieldCell({ children }: { children: ReactNode }) {
  const { isTablet } = useTabletLayout();
  return <View style={isTablet ? styles.cell : undefined}>{children}</View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.md },
  col: { gap: space.sm },
  cell: { flex: 1, minWidth: 0 },
});
