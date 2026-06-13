import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { radius, space } from '@/constants/layout';
import { typography } from '@/constants/typography';
import {
  clientMatchesQuery,
  loadClients,
  type ClientRecord,
} from '@/lib/clientRegistry';
import { t } from '@/lib/i18n';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

type Props = {
  selectedId?: string | null;
  onSelect: (client: ClientRecord) => void;
  label?: string;
};

export function ClientPicker({ selectedId, onSelect, label }: Props) {
  const p = Colors[useColorScheme() ?? 'light'];
  const CL = t('clients');
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [clients, setClients] = useState<ClientRecord[]>([]);

  const reload = useCallback(async () => {
    setClients(await loadClients());
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const selected = useMemo(
    () => clients.find((c) => c.id === selectedId) ?? null,
    [clients, selectedId],
  );

  const filtered = useMemo(
    () => clients.filter((c) => clientMatchesQuery(c, query)),
    [clients, query],
  );

  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: p.textSecondary, fontSize: 12, fontWeight: '700' }}>
        {label ?? CL.pickLabel}
      </Text>
      <HapticPressable
        onPress={() => {
          void reload();
          setOpen(true);
        }}
        style={[styles.trigger, { borderColor: p.border, backgroundColor: p.card }]}>
        <MaterialCommunityIcons name="account-search-outline" size={20} color={p.tint} />
        <Text style={[typography.body, { color: selected ? p.text : p.textSecondary, flex: 1 }]} numberOfLines={1}>
          {selected ? `${selected.company} · ${selected.contactName}` : CL.pickPlaceholder}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={20} color={p.textSecondary} />
      </HapticPressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={[styles.sheet, { backgroundColor: p.background }]}>
          <Text style={[typography.title, { color: p.text }]}>{CL.pickTitle}</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={CL.search}
            placeholderTextColor={p.textSecondary}
            style={[styles.search, { borderColor: p.border, color: p.text, backgroundColor: p.card }]}
          />
          <ScrollView style={{ maxHeight: 360 }} keyboardShouldPersistTaps="handled">
            {filtered.length === 0 ? (
              <Text style={{ color: p.textSecondary, paddingVertical: space.md }}>{CL.empty}</Text>
            ) : (
              filtered.map((c) => (
                <HapticPressable
                  key={c.id}
                  onPress={() => {
                    onSelect(c);
                    setOpen(false);
                    setQuery('');
                  }}
                  style={[styles.row, { borderColor: p.border }]}>
                  <Text style={[typography.bodyBold, { color: p.text }]}>{c.company}</Text>
                  <Text style={[typography.caption, { color: p.textSecondary }]}>
                    {c.contactName}
                    {c.city ? ` · ${c.city}` : ''}
                  </Text>
                </HapticPressable>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    maxHeight: '70%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: space.lg,
    gap: space.sm,
  },
  search: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  row: {
    paddingVertical: space.sm,
    borderBottomWidth: 1,
    gap: 2,
  },
});
