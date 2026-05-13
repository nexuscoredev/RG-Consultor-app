import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

const GRAD_ID = 'homeMissionProgressGrad';

type Props = {
  progress: number;
  trackColor: string;
};

/**
 * Barra de progresso com gradiente esmeralda e trilho arredondado.
 */
export function MissionProgressBar({ progress, trackColor }: Props) {
  const [w, setW] = useState(0);
  const clamped = Math.max(0, Math.min(1, progress));
  const fillW = w * clamped;

  const onLayout = (e: LayoutChangeEvent) => {
    setW(e.nativeEvent.layout.width);
  };

  return (
    <View style={[styles.track, { backgroundColor: trackColor }]} onLayout={onLayout}>
      {w > 0 && fillW > 0 ? (
        <Svg width={fillW} height={8} style={styles.svg}>
          <Defs>
            <LinearGradient id={GRAD_ID} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#a7f3d0" />
              <Stop offset="0.55" stopColor="#34d399" />
              <Stop offset="1" stopColor="#059669" />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={fillW} height={8} rx={4} ry={4} fill={`url(#${GRAD_ID})`} />
        </Svg>
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
  svg: { position: 'absolute', left: 0, top: 0 },
});
