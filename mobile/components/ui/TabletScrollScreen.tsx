import { TabletContent } from '@/components/ui/TabletContent';
import { space } from '@/constants/layout';
import { useTabletLayout } from '@/hooks/useTabletLayout';
import type { ReactNode } from 'react';
import { ScrollView, type ScrollViewProps, type StyleProp, type ViewStyle } from 'react-native';

type Props = Omit<ScrollViewProps, 'contentContainerStyle'> & {
  children: ReactNode;
  /** Espaço inferior (ex.: tabBarFloatingClearance). */
  padBottom?: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

/** ScrollView com padding horizontal tablet + conteúdo centralizado (max-width). */
export function TabletScrollScreen({
  children,
  padBottom = 0,
  contentContainerStyle,
  ...rest
}: Props) {
  const { horizontalPadding, contentGap } = useTabletLayout();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        {
          paddingHorizontal: horizontalPadding,
          paddingTop: space.md,
          paddingBottom: Math.max(space.md, padBottom),
          gap: contentGap,
        },
        contentContainerStyle,
      ]}
      {...rest}>
      <TabletContent>{children}</TabletContent>
    </ScrollView>
  );
}
