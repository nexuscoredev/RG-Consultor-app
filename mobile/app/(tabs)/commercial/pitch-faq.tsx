import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Surface } from '@/components/ui/Surface';
import { tabBarFloatingClearance } from '@/constants/layout';
import { FAQ_ITEMS, PITCH_60S } from '@/lib/commercialContent';
import { space } from '@/constants/layout';
import { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, ScrollView, StyleSheet, Text, UIManager, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function PitchFaqScreen() {
  const p = Colors[useColorScheme() ?? 'light'];
  const insets = useSafeAreaInsets();
  const pad = tabBarFloatingClearance(insets.bottom);
  const [open, setOpen] = useState<number | null>(0);

  return (
    <ScrollView contentContainerStyle={[styles.root, { backgroundColor: p.background, paddingBottom: pad }]}>
      <Surface elevated style={[styles.card, { borderColor: p.border }]}>
        <Text style={[styles.h2, { color: p.tint }]}>Pitch (~60 segundos)</Text>
        <Text style={[styles.body, { color: p.text }]}>{PITCH_60S}</Text>
      </Surface>

      <Text style={[styles.h2, { color: p.text, marginTop: 8 }]}>Objeções frequentes</Text>
      {FAQ_ITEMS.map((item, i) => {
        const expanded = open === i;
        return (
          <Surface key={item.q} style={[styles.card, { borderColor: p.border }]}>
            <Pressable
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setOpen(expanded ? null : i);
              }}
              accessibilityRole="button"
              accessibilityState={{ expanded }}>
              <Text style={[styles.q, { color: p.text }]}>{item.q}</Text>
              <Text style={[styles.toggle, { color: p.tint }]}>{expanded ? 'Ocultar resposta' : 'Ver resposta'}</Text>
            </Pressable>
            {expanded ? <Text style={[styles.a, { color: p.textSecondary }]}>{item.a}</Text> : null}
          </Surface>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { padding: space.md, gap: space.sm },
  card: { padding: space.md, borderRadius: 16, borderWidth: 1, gap: 8 },
  h2: { fontSize: 16, fontWeight: '900' },
  body: { fontSize: 15, lineHeight: 24 },
  q: { fontSize: 16, fontWeight: '800' },
  toggle: { fontSize: 13, fontWeight: '700', marginTop: 6 },
  a: { fontSize: 14, lineHeight: 21, marginTop: 8 },
});
