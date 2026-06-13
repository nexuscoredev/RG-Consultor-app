import Colors from '@/constants/Colors';
import { FormFieldCell, FormFieldRow } from '@/components/commercial/FormFieldRow';
import { useColorScheme } from '@/components/useColorScheme';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { Surface } from '@/components/ui/Surface';
import { TabletGrid } from '@/components/ui/TabletGrid';
import { TabletScrollScreen } from '@/components/ui/TabletScrollScreen';
import { useTabletLayout } from '@/hooks/useTabletLayout';
import { radius, space, tabBarFloatingClearance } from '@/constants/layout';
import { typography } from '@/constants/typography';
import { useSync } from '@/context/SyncContext';
import {
  clientMatchesQuery,
  clientToCommercialContext,
  clientToDraft,
  deleteClient,
  emptyClientDraft,
  loadClients,
  upsertClient,
  type ClientDraft,
  type ClientRecord,
} from '@/lib/clientRegistry';
import { afterCommercialEnqueue } from '@/lib/commercialSync';
import { phaseHref } from '@/lib/commercialLinks';
import { enqueueClientSaved } from '@/lib/outbox';
import { t } from '@/lib/i18n';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { Link, useLocalSearchParams, type Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Mode = 'list' | 'form';

export default function ClientsScreen() {
  const p = Colors[useColorScheme() ?? 'light'];
  const CL = t('clients');
  const insets = useSafeAreaInsets();
  const pad = tabBarFloatingClearance(insets.bottom);
  const { isTablet } = useTabletLayout();
  const sync = useSync();
  const params = useLocalSearchParams<{ new?: string }>();

  const [mode, setMode] = useState<Mode>(params.new === '1' ? 'form' : 'list');
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ClientDraft>(emptyClientDraft());
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    setClients(await loadClients());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const filtered = useMemo(
    () => clients.filter((c) => clientMatchesQuery(c, query)),
    [clients, query],
  );

  const openNew = () => {
    setEditingId(null);
    setDraft(emptyClientDraft());
    setMode('form');
  };

  const openEdit = (client: ClientRecord) => {
    setEditingId(client.id);
    setDraft(clientToDraft(client));
    setMode('form');
  };

  const save = async () => {
    if (!draft.company.trim() || !draft.contactName.trim()) {
      Alert.alert(CL.title, CL.missingRequired);
      return;
    }
    setSaving(true);
    try {
      const row = await upsertClient({ ...draft, id: editingId ?? undefined });
      enqueueClientSaved({
        id: row.id,
        company: row.company,
        contactName: row.contactName,
        segment: row.segment,
        city: row.city,
        phone: row.phone,
        email: row.email,
      });
      afterCommercialEnqueue(sync);
      setMode('list');
      await reload();
      Alert.alert(CL.title, editingId ? CL.updated : CL.saved);
    } catch {
      Alert.alert(CL.title, CL.saveError);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (client: ClientRecord) => {
    Alert.alert(CL.deleteTitle, CL.deleteBody.replace('{name}', client.company), [
      { text: CL.cancel, style: 'cancel' },
      {
        text: CL.delete,
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await deleteClient(client.id);
            await reload();
          })();
        },
      },
    ]);
  };

  if (mode === 'form') {
    return (
      <TabletScrollScreen style={{ backgroundColor: p.background }} padBottom={pad} contentContainerStyle={styles.root}>
        <Text style={[typography.title, { color: p.text }]}>
          {editingId ? CL.editTitle : CL.newTitle}
        </Text>
        <Text style={[typography.body, { color: p.textSecondary }]}>{CL.formIntro}</Text>

        <Surface elevated style={[styles.form, { borderColor: p.border }]}>
          <Text style={[typography.captionBold, { color: p.tint }]}>{CL.sectionMain}</Text>
          <FormFieldRow>
            <FormFieldCell>
              <Field label={CL.company} value={draft.company} onChange={(v) => setDraft((d) => ({ ...d, company: v }))} p={p} required />
            </FormFieldCell>
            <FormFieldCell>
              <Field label={CL.tradeName} value={draft.tradeName} onChange={(v) => setDraft((d) => ({ ...d, tradeName: v }))} p={p} />
            </FormFieldCell>
          </FormFieldRow>
          <FormFieldRow>
            <FormFieldCell>
              <Field label={CL.contactName} value={draft.contactName} onChange={(v) => setDraft((d) => ({ ...d, contactName: v }))} p={p} required />
            </FormFieldCell>
            <FormFieldCell>
              <Field label={CL.contactRole} value={draft.contactRole} onChange={(v) => setDraft((d) => ({ ...d, contactRole: v }))} p={p} />
            </FormFieldCell>
          </FormFieldRow>
          <FormFieldRow>
            <FormFieldCell>
              <Field label={CL.phone} value={draft.phone} onChange={(v) => setDraft((d) => ({ ...d, phone: v }))} p={p} />
            </FormFieldCell>
            <FormFieldCell>
              <Field label={CL.email} value={draft.email} onChange={(v) => setDraft((d) => ({ ...d, email: v }))} p={p} />
            </FormFieldCell>
          </FormFieldRow>
          <FormFieldRow>
            <FormFieldCell>
              <Field label={CL.cnpj} value={draft.cnpj} onChange={(v) => setDraft((d) => ({ ...d, cnpj: v }))} p={p} />
            </FormFieldCell>
            <FormFieldCell>
              <Field label={CL.segment} value={draft.segment} onChange={(v) => setDraft((d) => ({ ...d, segment: v }))} p={p} />
            </FormFieldCell>
          </FormFieldRow>
          <Field label={CL.address} value={draft.address} onChange={(v) => setDraft((d) => ({ ...d, address: v }))} p={p} />
          <Field label={CL.city} value={draft.city} onChange={(v) => setDraft((d) => ({ ...d, city: v }))} p={p} />
          <Field label={CL.notes} value={draft.notes} onChange={(v) => setDraft((d) => ({ ...d, notes: v }))} p={p} multiline />
        </Surface>

        <PrimaryButton fullWidth label={CL.save} loading={saving} onPress={() => void save()} />
        <SecondaryButton fullWidth label={CL.backList} onPress={() => setMode('list')} />
      </TabletScrollScreen>
    );
  }

  return (
    <TabletScrollScreen style={{ backgroundColor: p.background }} padBottom={pad} contentContainerStyle={styles.root}>
      <Text style={[typography.body, { color: p.textSecondary }]}>{CL.intro}</Text>

      <PrimaryButton
        fullWidth
        label={CL.add}
        onPress={openNew}
        icon={<MaterialCommunityIcons name="account-plus-outline" size={20} color="#fff" />}
      />

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={CL.search}
        placeholderTextColor={p.textSecondary}
        style={[styles.search, isTablet && styles.searchTablet, { borderColor: p.border, color: p.text, backgroundColor: p.card }]}
      />

      {filtered.length === 0 ? (
        <Surface style={[styles.empty, { borderColor: p.border }]}>
          <Text style={[typography.bodyBold, { color: p.text }]}>{CL.emptyTitle}</Text>
          <Text style={[typography.body, { color: p.textSecondary }]}>{CL.emptyBody}</Text>
        </Surface>
      ) : (
        <TabletGrid>
          {filtered.map((client) => {
          const ctx = clientToCommercialContext(client);
          const visitHref = `/(tabs)/commercial/visit-session?${[
            ctx.stopId && `stopId=${encodeURIComponent(ctx.stopId)}`,
            ctx.company && `company=${encodeURIComponent(ctx.company)}`,
            ctx.contact && `contact=${encodeURIComponent(ctx.contact)}`,
            ctx.address && `address=${encodeURIComponent(ctx.address)}`,
            ctx.city && `city=${encodeURIComponent(ctx.city)}`,
            ctx.phone && `phone=${encodeURIComponent(ctx.phone)}`,
          ]
            .filter(Boolean)
            .join('&')}` as Href;

          return (
            <Surface key={client.id} elevated style={[styles.card, { borderColor: p.border }]}>
              <View style={styles.cardHead}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[typography.bodyBold, { color: p.text }]}>{client.company}</Text>
                  <Text style={[typography.caption, { color: p.textSecondary }]}>
                    {client.contactName}
                    {client.city ? ` · ${client.city}` : ''}
                  </Text>
                </View>
                <HapticPressable onPress={() => openEdit(client)} accessibilityLabel={CL.edit}>
                  <MaterialCommunityIcons name="pencil-outline" size={22} color={p.tint} />
                </HapticPressable>
              </View>

              <View style={styles.actions}>
                <Link href={phaseHref('prospecting', ctx)} asChild>
                  <HapticPressable style={[styles.chip, { borderColor: p.tint }]}>
                    <Text style={[typography.captionBold, { color: p.tint }]}>{CL.actionProspect}</Text>
                  </HapticPressable>
                </Link>
                <Link href={phaseHref('proposal', ctx)} asChild>
                  <HapticPressable style={[styles.chip, { borderColor: p.tint }]}>
                    <Text style={[typography.captionBold, { color: p.tint }]}>{CL.actionProposal}</Text>
                  </HapticPressable>
                </Link>
                <Link href={visitHref} asChild>
                  <HapticPressable style={[styles.chip, { borderColor: p.tint }]}>
                    <Text style={[typography.captionBold, { color: p.tint }]}>{CL.actionVisit}</Text>
                  </HapticPressable>
                </Link>
              </View>

              <HapticPressable onPress={() => confirmDelete(client)}>
                <Text style={[typography.caption, { color: p.danger }]}>{CL.delete}</Text>
              </HapticPressable>
            </Surface>
          );
        })}
        </TabletGrid>
      )}

      <Link href={'/(tabs)/commercial/pipeline' as Href} asChild>
        <SecondaryButton fullWidth tint label={CL.viewPipeline} />
      </Link>
    </TabletScrollScreen>
  );
}

function Field({
  label,
  value,
  onChange,
  p,
  multiline,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  p: (typeof Colors)['light'];
  multiline?: boolean;
  required?: boolean;
}) {
  return (
    <View style={{ gap: 4, flex: 1 }}>
      <Text style={{ color: p.textSecondary, fontSize: 12, fontWeight: '700' }}>
        {label}
        {required ? ' *' : ''}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholderTextColor={p.textSecondary}
        multiline={multiline}
        style={[
          styles.input,
          { borderColor: p.border, color: p.text, backgroundColor: p.card },
          multiline ? { minHeight: 80, textAlignVertical: 'top' } : null,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.md },
  search: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  searchTablet: { minHeight: 52, fontSize: 17 },
  form: { padding: space.md, borderRadius: 16, borderWidth: 1, gap: 12 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 16 },
  empty: { padding: space.lg, borderRadius: 16, borderWidth: 1, gap: 8 },
  card: { padding: space.md, borderRadius: 16, borderWidth: 1, gap: 10 },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
