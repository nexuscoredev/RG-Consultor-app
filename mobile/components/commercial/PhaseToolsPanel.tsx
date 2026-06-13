import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { HubListRow } from '@/components/ui/HubListRow';
import { space } from '@/constants/layout';
import { typography } from '@/constants/typography';
import { chevronSize } from '@/constants/icons';
import type { FunnelHubTool } from '@/lib/commercialFunnel';
import type { CommercialContext } from '@/lib/commercialLinks';
import { toolHrefWithContext } from '@/lib/commercialLinks';
import { useTabletLayout } from '@/hooks/useTabletLayout';
import { t } from '@/lib/i18n';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  tools: FunnelHubTool[];
  /** Chaves i18n em commercial.funnelTools */
  toolKeys: Record<string, { title: string; hint: string }>;
  primaryToolKey?: string;
  context?: CommercialContext;
};

export function PhaseToolsPanel({ tools, toolKeys, primaryToolKey, context }: Props) {
  const p = Colors[useColorScheme() ?? 'light'];
  const F = t('funnel');
  const { touchMinHeight, isWide } = useTabletLayout();
  const [open, setOpen] = useState(false);

  const secondary = tools.filter((t) => t.toolKey !== primaryToolKey);
  if (secondary.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={[
          styles.toggle,
          { borderColor: p.border, backgroundColor: p.card, minHeight: touchMinHeight },
        ]}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}>
        <Text style={[typography.captionBold, { color: p.text }]}>{F.moreTools}</Text>
        <MaterialCommunityIcons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={chevronSize}
          color={p.textSecondary}
        />
      </Pressable>
      {open ? (
        <View style={isWide ? styles.listGrid : styles.list}>
          {secondary.map((tool) => {
            const copy = toolKeys[tool.toolKey];
            if (!copy) return null;
            return (
              <View key={tool.toolKey} style={isWide ? styles.toolCell : undefined}>
                <HubListRow href={toolHrefWithContext(tool.href, context)} title={copy.title} hint={copy.hint} icon={tool.icon} />
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: space.md,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 44,
  },
  list: { gap: space.sm },
  listGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    justifyContent: 'space-between',
  },
  toolCell: { width: '48.5%', flexGrow: 1, minWidth: 240 },
});
