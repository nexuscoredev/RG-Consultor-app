import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { TabletContent } from '@/components/ui/TabletContent';
import { radius, space } from '@/constants/layout';
import { useTabletLayout } from '@/hooks/useTabletLayout';
import { SHOWROOM_HLS_URI, SHOWROOM_MP4_FALLBACK, SHOWROOM_POSTER_URI, showroomChapters } from '@/lib/mockData';
import { ResizeMode, Video, type AVPlaybackStatus } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OperationScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const insets = useSafeAreaInsets();
  const video = useRef<Video>(null);
  const [presentation, setPresentation] = useState(false);
  const [preferHls, setPreferHls] = useState(false);
  const videoUri = preferHls ? SHOWROOM_HLS_URI : SHOWROOM_MP4_FALLBACK;
  const [storyIndex, setStoryIndex] = useState(0);
  const { horizontalPadding, isTablet } = useTabletLayout();

  useEffect(() => {
    if (!presentation) return;
    const id = setTimeout(() => {
      void video.current?.playAsync();
    }, 120);
    return () => clearTimeout(id);
  }, [presentation]);

  const onPlaybackStatusUpdate = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded && status.error && preferHls) {
        setPreferHls(false);
      }
    },
    [preferHls],
  );

  const seek = async (seconds: number, index: number) => {
    setStoryIndex(index);
    try {
      await video.current?.setPositionAsync(seconds * 1000);
      await video.current?.playAsync();
      void Haptics.selectionAsync();
    } catch {
      /* noop */
    }
  };

  const storyCircles = (
    <View style={styles.storiesRow}>
      {showroomChapters.map((c, i) => {
        const active = i === storyIndex;
        return (
          <HapticPressable
            key={c.id}
            onPress={() => void seek(c.seconds, i)}
            style={styles.storyHit}
            accessibilityLabel={`Capítulo ${c.label}`}>
            <View
              style={[
                styles.storyRing,
                {
                  borderColor: active ? palette.tint : palette.border,
                  backgroundColor: active ? `${palette.tint}18` : palette.card,
                },
              ]}>
              <Text style={[styles.storyInitial, { color: active ? palette.tint : palette.textSecondary }]}>
                {c.label.slice(0, 1)}
              </Text>
            </View>
            <Text
              style={[styles.storyLabel, { color: active ? palette.text : palette.textSecondary }]}
              numberOfLines={1}>
              {c.label}
            </Text>
          </HapticPressable>
        );
      })}
    </View>
  );

  const cinematicChapters = (
    <View style={styles.cinematicChips}>
      {showroomChapters.map((c, i) => {
        const active = i === storyIndex;
        return (
          <HapticPressable
            key={c.id}
            onPress={() => void seek(c.seconds, i)}
            style={[
              styles.cineChip,
              { borderColor: active ? palette.goldMatte : 'rgba(255,255,255,0.35)', backgroundColor: active ? 'rgba(184,154,106,0.35)' : 'rgba(0,0,0,0.35)' },
            ]}
            accessibilityLabel={`Capítulo ${c.label}`}>
            <Text style={[styles.cineChipText, { color: active ? '#0a2418' : '#f4faf7' }]}>{c.label}</Text>
          </HapticPressable>
        );
      })}
    </View>
  );

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: presentation ? '#030806' : palette.background,
          paddingTop: presentation ? 0 : insets.top,
        },
      ]}>
      {!presentation ? (
        <TabletContent style={{ paddingHorizontal: horizontalPadding }}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: palette.text }]}>Nossa Operação</Text>
          <Text style={[styles.sub, { color: palette.textSecondary }]}>
            Stories para saltar entre trechos — modo trailer em tela cheia para apresentar ao cliente.
          </Text>
        </View>
        {storyCircles}
        </TabletContent>
      ) : null}

      <View style={[styles.body, presentation && styles.bodyPresentation]}>
        <View
          style={[
            presentation ? styles.videoWrapPresentation : styles.videoWrap,
            !presentation && { paddingHorizontal: horizontalPadding },
          ]}>
          {!presentation ? (
            <TabletContent>
              <Video
                key={videoUri}
                ref={video}
                style={[styles.video, isTablet && styles.videoTablet]}
                source={{ uri: videoUri }}
                posterSource={{ uri: SHOWROOM_POSTER_URI }}
                usePoster
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                isLooping
                onPlaybackStatusUpdate={onPlaybackStatusUpdate}
              />
            </TabletContent>
          ) : (
            <>
              <Video
                key={videoUri}
                ref={video}
                style={styles.videoPresentation}
                source={{ uri: videoUri }}
                posterSource={{ uri: SHOWROOM_POSTER_URI }}
                usePoster={false}
                useNativeControls={false}
                resizeMode={ResizeMode.COVER}
                isLooping
                onPlaybackStatusUpdate={onPlaybackStatusUpdate}
              />
              <View
                pointerEvents="box-none"
                style={[
                  StyleSheet.absoluteFill,
                  {
                    paddingTop: insets.top + space.sm,
                    paddingBottom: insets.bottom + space.md,
                    paddingHorizontal: space.md,
                    justifyContent: 'space-between',
                  },
                ]}>
                <View style={styles.cineTopRow}>
                  <Text style={styles.cineTag}>RG Ambiental · vitrine</Text>
                  <HapticPressable
                    onPress={() => setPresentation(false)}
                    style={[styles.cineExit, { borderColor: 'rgba(255,255,255,0.4)' }]}
                    accessibilityLabel="Sair do modo trailer">
                    <Text style={styles.cineExitText}>Sair</Text>
                  </HapticPressable>
                </View>
                <View style={{ flex: 1 }} />
                {cinematicChapters}
              </View>
            </>
          )}
        </View>
      </View>

      {!presentation ? (
        <TabletContent style={{ paddingHorizontal: horizontalPadding }}>
        <View style={styles.dots}>
          {showroomChapters.map((c, i) => (
            <HapticPressable key={c.id} onPress={() => void seek(c.seconds, i)} style={styles.dotHit}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: i === storyIndex ? palette.tint : palette.border, width: i === storyIndex ? 18 : 6 },
                ]}
              />
            </HapticPressable>
          ))}
        </View>
        </TabletContent>
      ) : null}

      <TabletContent style={{ paddingHorizontal: horizontalPadding }}>
      <View style={[styles.toolbar, { borderTopColor: palette.border, backgroundColor: palette.card }]}>
        <Text style={[styles.toolLabel, { color: palette.text }]}>Stream HLS (teste)</Text>
        <Switch
          value={preferHls}
          onValueChange={setPreferHls}
          accessibilityLabel="Alternar entre vídeo MP4 estável e stream HLS de teste"
        />
      </View>

      <View style={[styles.toolbar, { borderTopColor: palette.border, backgroundColor: palette.card }]}>
        <Text style={[styles.toolLabel, { color: palette.text }]}>Modo trailer (tela cheia)</Text>
        <Switch value={presentation} onValueChange={setPresentation} accessibilityLabel="Alternar modo trailer cinematográfico" />
      </View>
      </TabletContent>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1 },
  bodyPresentation: { flex: 1, position: 'relative' },
  header: { paddingHorizontal: space.lg, paddingBottom: space.md },
  title: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  sub: { marginTop: 8, fontSize: 14, lineHeight: 21 },
  storiesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: space.lg,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    flexWrap: 'wrap',
  },
  storyHit: { alignItems: 'center', width: 76, gap: 6 },
  storyRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0d3d24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  storyInitial: { fontSize: 20, fontWeight: '900' },
  storyLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  videoWrap: { paddingHorizontal: space.md, flex: 1, justifyContent: 'center' },
  videoWrapPresentation: { flex: 1, paddingHorizontal: 0, minHeight: 200 },
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: '#0f1a15',
  },
  videoTablet: { maxHeight: 420 },
  videoPresentation: { flex: 1, width: '100%', minHeight: 320, backgroundColor: '#0a1812' },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingBottom: space.sm },
  dotHit: { paddingVertical: 6, paddingHorizontal: 4 },
  dot: { height: 6, borderRadius: 3 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  toolLabel: { fontSize: 15, fontWeight: '700' },
  cineTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cineTag: { color: 'rgba(244,250,247,0.85)', fontSize: 11, fontWeight: '900', letterSpacing: 1.6, textTransform: 'uppercase' },
  cineExit: {
    paddingHorizontal: space.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  cineExitText: { color: '#f4faf7', fontWeight: '900', fontSize: 13 },
  cinematicChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  cineChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.pill, borderWidth: 1 },
  cineChipText: { fontSize: 12, fontWeight: '800' },
});
