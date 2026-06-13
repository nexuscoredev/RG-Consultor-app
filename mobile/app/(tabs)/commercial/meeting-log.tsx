import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { Surface } from '@/components/ui/Surface';
import { space, tabBarFloatingClearance } from '@/constants/layout';
import { useGamification } from '@/context/GamificationContext';
import { useSync } from '@/context/SyncContext';
import { afterCommercialEnqueue } from '@/lib/commercialSync';
import { recordPipelineStep } from '@/lib/gamificationEngine';
import {
  COMMERCIAL_HISTORY_UI_PAGE,
  loadMeetingLogs,
  saveMeetingLogs,
  type MeetingLogEntry,
} from '@/lib/commercialStorage';
import { syncMeetingLogToPipeline } from '@/lib/localPipelineStore';
import { enqueueMeetingLog } from '@/lib/outbox';
import { t } from '@/lib/i18n';
import { Link, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TabletScrollScreen } from '@/components/ui/TabletScrollScreen';
import { useTabletLayout } from '@/hooks/useTabletLayout';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

export default function MeetingLogScreen() {
  const p = Colors[useColorScheme() ?? 'light'];
  const ML = t('meetingLog');
  const insets = useSafeAreaInsets();
  const pad = tabBarFloatingClearance(insets.bottom);
  const { refresh: refreshGamification } = useGamification();
  const sync = useSync();
  const router = useRouter();
  const params = useLocalSearchParams<{ client?: string | string[] }>();
  const initialClient = useMemo(() => {
    const raw = params.client;
    const s = Array.isArray(raw) ? raw[0] : raw;
    return s ? decodeURIComponent(s) : '';
  }, [params.client]);
  const [entries, setEntries] = useState<MeetingLogEntry[]>([]);
  const [client, setClient] = useState('');

  useEffect(() => {
    if (initialClient) setClient((c) => c || initialClient);
  }, [initialClient]);
  const [notes, setNotes] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [nextDate, setNextDate] = useState('');

  useEffect(() => {
    void loadMeetingLogs().then(setEntries);
  }, []);

  const add = useCallback(async () => {
    if (!client.trim()) {
      Alert.alert(ML.title, ML.missingClient);
      return;
    }
    const row: MeetingLogEntry = {
      id: newId(),
      at: Date.now(),
      client: client.trim(),
      notes: notes.trim(),
      nextAction: nextAction.trim(),
      nextDate: nextDate.trim(),
    };
    const next = [row, ...entries];
    setEntries(next);
    await saveMeetingLogs(next);
    await syncMeetingLogToPipeline(row);
    enqueueMeetingLog({
      client: row.client,
      notes: row.notes,
      nextAction: row.nextAction,
      nextDate: row.nextDate,
    });
    afterCommercialEnqueue(sync);
    recordPipelineStep('outro');
    refreshGamification();
    setClient(initialClient || row.client);
    setNotes('');
    setNextAction('');
    setNextDate('');
    Alert.alert(ML.title, ML.savedPipeline, [
      { text: ML.ok, style: 'default' },
      {
        text: ML.viewPipeline,
        onPress: () => router.push('/(tabs)/commercial/pipeline' as Href),
      },
    ]);
  }, [ML, client, notes, nextAction, nextDate, entries, refreshGamification, router, sync, initialClient]);

  return (
    <TabletScrollScreen style={{ backgroundColor: p.background }} padBottom={pad} contentContainerStyle={styles.root}>
      <Text style={[styles.intro, { color: p.textSecondary }]}>{ML.intro}</Text>

      <Surface elevated style={[styles.form, { borderColor: p.border }]}>
        <Text style={[styles.h, { color: p.text }]}>{ML.newEntry}</Text>
        <Field label={ML.client} value={client} onChangeText={setClient} p={p} />
        <Field label={ML.notes} value={notes} onChangeText={setNotes} p={p} multiline />
        <Field label={ML.nextAction} value={nextAction} onChangeText={setNextAction} p={p} />
        <Field label={ML.nextDate} value={nextDate} onChangeText={setNextDate} p={p} />
        <HapticPressable onPress={() => void add()} style={[styles.btn, { backgroundColor: p.tint }]}>
          <Text style={styles.btnText}>{ML.save}</Text>
        </HapticPressable>
        <Link href={'/(tabs)/commercial/pipeline' as Href} asChild>
          <HapticPressable style={[styles.linkBtn, { borderColor: p.border }]}>
            <Text style={[styles.linkText, { color: p.tint }]}>{ML.viewPipeline}</Text>
          </HapticPressable>
        </Link>
      </Surface>

      <Text style={[styles.h, { color: p.text, marginTop: 8 }]}>{ML.history}</Text>
      {entries.length === 0 ? (
        <Text style={{ color: p.textSecondary }}>{ML.empty}</Text>
      ) : (
        <>
          {entries.length > COMMERCIAL_HISTORY_UI_PAGE ? (
            <Text style={{ color: p.textSecondary, fontSize: 13 }}>
              {ML.historyShown
                .replace('{shown}', String(COMMERCIAL_HISTORY_UI_PAGE))
                .replace('{total}', String(entries.length))}
            </Text>
          ) : null}
          {entries.slice(0, COMMERCIAL_HISTORY_UI_PAGE).map((e) => (
          <Surface key={e.id} style={[styles.card, { borderColor: p.border }]}>
            <Text style={[styles.date, { color: p.textSecondary }]}>
              {new Date(e.at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
            </Text>
            <Text style={[styles.client, { color: p.text }]}>{e.client}</Text>
            {e.notes ? <Text style={[styles.body, { color: p.textSecondary }]}>{e.notes}</Text> : null}
            {e.nextAction ? (
              <Text style={[styles.next, { color: p.tint }]}>
                {ML.nextLabel}: {e.nextAction}
                {e.nextDate ? ` · ${e.nextDate}` : ''}
              </Text>
            ) : null}
          </Surface>
          ))}
        </>
      )}
    </TabletScrollScreen>
  );
}

function Field({
  label,
  value,
  onChangeText,
  p,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  p: (typeof Colors)['light'];
  multiline?: boolean;
}) {
  const { isTablet } = useTabletLayout();
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ color: p.textSecondary, fontSize: 12, fontWeight: '700' }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={p.textSecondary}
        multiline={multiline}
        style={[
          styles.input,
          isTablet && styles.inputTablet,
          { borderColor: p.border, color: p.text, backgroundColor: p.card },
          multiline ? { minHeight: isTablet ? 120 : 88, textAlignVertical: 'top' } : null,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.md },
  inputTablet: { minHeight: 52, fontSize: 16 },
  intro: { fontSize: 14, lineHeight: 20 },
  form: { padding: space.md, borderRadius: 16, borderWidth: 1, gap: 12 },
  h: { fontSize: 17, fontWeight: '900' },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 16 },
  btn: { borderRadius: 12, padding: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '900' },
  linkBtn: { borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1 },
  linkText: { fontWeight: '800' },
  card: { padding: space.md, borderRadius: 14, borderWidth: 1, gap: 6 },
  date: { fontSize: 12 },
  client: { fontSize: 17, fontWeight: '800' },
  body: { fontSize: 15, lineHeight: 22 },
  next: { fontSize: 14, fontWeight: '700', marginTop: 4 },
});
