import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';

type Props = {
  progress: number;
  trackColor: string;
};

/** Web: barra simples — evita `style` em `<Svg>` (quebra `CSSStyleDeclaration` no Chrome). */
export function MissionProgressBar({ progress, trackColor }: Props) {
  const [w, setW] = useState(0);
  const clamped = Math.max(0, Math.min(1, progress));
  const fillW = w * clamped;

  const onLayout = (e: LayoutChangeEvent) => {
    setW(e.nativeEvent.layout.width);
  };

  return (
    <View style={[styles.track, { backgroundColor: trackColor }]} onLayout={onLayout}>
      {fillW > 0 ? (
        <View
          style={[
            styles.fill,
            {
              width: fillW,
              backgroundColor: '#059669',
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 6,
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: 8,
    borderRadius: 999,
  },
});
