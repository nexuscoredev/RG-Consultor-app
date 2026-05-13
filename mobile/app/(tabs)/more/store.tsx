import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { Surface } from '@/components/ui/Surface';
import { useGamification } from '@/context/GamificationContext';
import { STORE_ITEMS, type StoreItem } from '@/lib/gamificationEngine';
import { TIER_SHIMMER } from '@/lib/tierVisuals';
import { radius, space, tabBarFloatingClearance } from '@/constants/layout';
import { STORE_ITEM_IMAGE_URI } from '@/lib/mockData';
import { t } from '@/lib/i18n';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const showcaseTag: Record<string, string> = {
  voucher_100: 'Benefício',
  day_off: 'Experiência',
  course_esg: 'Aprendizado',
  badge_elite: 'Reconhecimento',
  coffee_team: 'Networking',
};

function LuxuryCard({
  item,
  affordable,
  palette,
  onRedeem,
}: {
  item: StoreItem;
  affordable: boolean;
  palette: (typeof Colors)['light'];
  onRedeem: () => void;
}) {
  const st = t('store');
  const [imgFailed, setImgFailed] = useState(false);
  const tag = showcaseTag[item.id] ?? 'RG Rewards';
  const img = STORE_ITEM_IMAGE_URI[item.id];
  return (
    <Surface elevated style={styles.product}>
      {img && !imgFailed ? (
        <Image
          source={{ uri: img }}
          style={styles.heroImg}
          accessibilityLabel={item.title}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
          onError={() => setImgFailed(true)}
        />
      ) : img ? (
        <View
          style={[styles.heroImg, styles.heroImgFallback]}
          accessibilityLabel={st.imagePlaceholderA11y}>
          <Text style={[styles.heroImgFallbackText, { color: palette.textSecondary }]}>{st.imageFailedLabel}</Text>
        </View>
      ) : null}
      <View style={[styles.tag, { backgroundColor: `${palette.tint}12`, borderColor: `${palette.tint}35` }]}>
        <Text style={[styles.tagText, { color: palette.tint }]}>{tag}</Text>
      </View>
      <View style={[styles.shimmerBar, { backgroundColor: palette.tint }]} />
      <Text style={[styles.title, { color: palette.text }]}>{item.title}</Text>
      <Text style={[styles.desc, { color: palette.textSecondary }]}>{item.description}</Text>
      <View style={styles.row}>
        <View>
          <Text style={[styles.priceLabel, { color: palette.textSecondary }]}>Resgate</Text>
          <Text style={[styles.cost, { color: affordable ? palette.tint : palette.danger }]}>{item.costCoins}</Text>
          <Text style={[styles.priceUnit, { color: palette.textSecondary }]}>moedas</Text>
        </View>
        <HapticPressable
          onPress={onRedeem}
          disabled={!affordable}
          style={[
            styles.btn,
            { backgroundColor: affordable ? palette.tint : palette.border, opacity: affordable ? 1 : 0.55 },
          ]}
          accessibilityLabel={`Resgatar ${item.title}`}>
          <Text style={styles.btnText}>Resgatar</Text>
        </HapticPressable>
      </View>
    </Surface>
  );
}

export default function StoreScreen() {
  const p = Colors[useColorScheme() ?? 'light'];
  const insets = useSafeAreaInsets();
  const bottomPad = tabBarFloatingClearance(insets.bottom);
  const { wallet, redemptions, redeem } = useGamification();

  const onRedeem = (item: StoreItem) => {
    Alert.alert('Resgatar prêmio', `${item.title}\nCusto: ${item.costCoins} moedas. Você tem ${wallet.coins}.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: () => {
          const r = redeem(item.id);
          Alert.alert(r.ok ? 'Sucesso' : 'Não foi possível', r.message);
        },
      },
    ]);
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.root, { backgroundColor: p.background, paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}>
      <Text style={[styles.eyebrow, { color: p.textSecondary }]}>Marketplace</Text>
      <Text style={[styles.headline, { color: p.text }]}>Recompensas RG</Text>
      <Text style={[styles.sub, { color: p.textSecondary }]}>
        Cada meta batida aumenta seu poder de compra no ecossistema interno.
      </Text>

      <Surface elevated strong style={styles.walletHero}>
        <Text style={[styles.walletLabel, { color: p.textSecondary }]}>Saldo em moedas</Text>
        <Text style={[styles.walletVal, { color: p.tint }]}>{wallet.coins}</Text>
        <View style={[styles.walletAccent, { backgroundColor: TIER_SHIMMER.diamante }]} />
      </Surface>

      <Text style={[styles.section, { color: p.textSecondary }]}>Vitrine</Text>
      {STORE_ITEMS.map((item) => {
        const affordable = wallet.coins >= item.costCoins;
        return (
          <LuxuryCard
            key={item.id}
            item={item}
            affordable={affordable}
            palette={p}
            onRedeem={() => onRedeem(item)}
          />
        );
      })}

      <Text style={[styles.section, { color: p.textSecondary }]}>Histórico</Text>
      <Surface style={{ paddingVertical: space.md }}>
        {redemptions.length === 0 ? (
          <Text style={[styles.empty, { color: p.textSecondary }]}>Nenhum resgate ainda.</Text>
        ) : (
          redemptions.map((r) => (
            <View key={r.id} style={[styles.historyRow, { borderBottomColor: p.border }]}>
              <Text style={[styles.historyTitle, { color: p.text }]}>{r.title}</Text>
              <Text style={[styles.historyMeta, { color: p.textSecondary }]}>
                −{r.coins} moedas · {new Date(r.at).toLocaleString('pt-BR')}
              </Text>
            </View>
          ))
        )}
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: space.lg, paddingTop: space.lg, gap: space.lg, paddingBottom: space.xl },
  heroImg: {
    width: '100%',
    height: 176,
    borderRadius: radius.md,
    marginBottom: space.sm,
    backgroundColor: 'rgba(10,36,24,0.06)',
  },
  heroImgFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(10,36,24,0.12)',
  },
  heroImgFallbackText: { fontSize: 13, fontWeight: '700' },
  eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  headline: { fontSize: 28, fontWeight: '900', letterSpacing: -0.6, marginTop: 4 },
  sub: { fontSize: 15, lineHeight: 22, marginTop: 6 },
  walletHero: { overflow: 'hidden', paddingVertical: space.xl },
  walletLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  walletVal: { fontSize: 44, fontWeight: '900', marginTop: 4, letterSpacing: -1 },
  walletAccent: { position: 'absolute', right: 0, top: 0, width: 120, height: 120, borderBottomLeftRadius: 120, opacity: 0.35 },
  section: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginTop: space.sm,
  },
  product: { gap: space.md, paddingVertical: space.xl },
  tag: { alignSelf: 'flex-start', paddingHorizontal: space.md, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1 },
  tagText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  shimmerBar: { marginTop: 4, height: 3, borderRadius: 2, opacity: 0.35 },
  title: { fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
  desc: { fontSize: 14, lineHeight: 21 },
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: space.sm },
  priceLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  cost: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  priceUnit: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  btn: { paddingHorizontal: space.xl, paddingVertical: 14, borderRadius: radius.md },
  btnText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  empty: { fontSize: 14 },
  historyRow: { paddingVertical: space.md, borderBottomWidth: StyleSheet.hairlineWidth, gap: 4 },
  historyTitle: { fontSize: 16, fontWeight: '800' },
  historyMeta: { fontSize: 12 },
});
