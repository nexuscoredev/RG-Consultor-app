import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useDemoGps } from '@/context/DemoGpsContext';
import { useGamification } from '@/context/GamificationContext';
import { useSync } from '@/context/SyncContext';
import { distanceMeters } from '@/lib/geo';
import {
  recordCheckInJustified,
  recordCheckInValid,
  recordCheckOut,
  recordPipelineStep,
} from '@/lib/gamificationEngine';
import { enqueueCheckIn, enqueueCheckOut } from '@/lib/outbox';
import { setCheckIn, setCheckOut, setNextStep, type VisitLocal } from '@/lib/visitStore';
import type { Parada } from '@rg-ambiental/shared';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

function mapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

function wazeUrl(lat: number, lng: number) {
  return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
}

type Props = {
  stop: Parada;
  routeDate: string;
  visit: VisitLocal | null;
  onMutate: () => void;
  /** Destaca o card quando o GPS indica proximidade do cliente (próxima ação: check-in). */
  highlightArrival?: boolean;
};

export function StopCard({ stop, routeDate, visit, onMutate, highlightArrival }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const { simulateAtClient } = useDemoGps();
  const { refreshCounts } = useSync();
  const { refresh: refreshGamification } = useGamification();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [justifyOpen, setJustifyOpen] = useState(false);
  const [justifyDraft, setJustifyDraft] = useState('');
  const [pendingAction, setPendingAction] = useState<'in' | 'out' | null>(null);

  const [lng, lat] = stop.geo.coordinates;

  const openMaps = useCallback(() => {
    void Linking.openURL(mapsUrl(lat, lng));
  }, [lat, lng]);

  const openWaze = useCallback(() => {
    void Linking.openURL(wazeUrl(lat, lng));
  }, [lat, lng]);

  const call = useCallback(() => {
    void Linking.openURL(`tel:${stop.contact.phoneE164}`);
  }, [stop.contact.phoneE164]);

  const resolvePosition = useCallback(async () => {
    let latP = lat;
    let lngP = lng;
    let accuracyM: number | undefined;
    if (simulateAtClient) {
      accuracyM = 5;
    } else {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Localização', 'Permissão negada. Ative a simulação GPS na Agenda ou conceda acesso.');
        return null;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      latP = pos.coords.latitude;
      lngP = pos.coords.longitude;
      accuracyM = pos.coords.accuracy ?? undefined;
    }
    return { latP, lngP, accuracyM };
  }, [lat, lng, simulateAtClient]);

  const performCheckIn = useCallback(
    async (justificationReason?: string) => {
      setBusy(true);
      try {
        const pos = await resolvePosition();
        if (!pos) return;
        const { latP, lngP, accuracyM } = pos;
        const dist = distanceMeters(latP, lngP, lat, lng);
        const valid = dist <= stop.geofenceRadiusM;
        if (!valid && !justificationReason?.trim()) {
          setPendingAction('in');
          setJustifyOpen(true);
          return;
        }
        if (!valid && (justificationReason?.trim().length ?? 0) < 8) {
          Alert.alert('Justificativa', 'Descreva o motivo (mínimo 8 caracteres) para check-in fora do raio.');
          setPendingAction('in');
          setJustifyOpen(true);
          return;
        }
        const at = new Date().toISOString();
        const coords: [number, number] = [lngP, latP];
        const payload = {
          paradaId: stop.id,
          at,
          geo: { type: 'Point' as const, coordinates: coords },
          accuracyM,
          mockOverride: simulateAtClient || undefined,
          justificationReason: justificationReason?.trim() || undefined,
        };
        enqueueCheckIn(payload);
        setCheckIn(routeDate, stop.id, at);
        setFeedback(
          valid
            ? `Check-in válido (${Math.round(dist)} m). Na fila de sync.`
            : `Check-in fora do raio (${Math.round(dist)} m) — registrado com justificativa.`,
        );
        if (valid) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        else void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        if (valid) recordCheckInValid();
        else recordCheckInJustified();
        refreshGamification();
        onMutate();
        refreshCounts();
      } finally {
        setBusy(false);
      }
    },
    [
      lat,
      lng,
      onMutate,
      refreshCounts,
      refreshGamification,
      resolvePosition,
      routeDate,
      simulateAtClient,
      stop.geofenceRadiusM,
      stop.id,
    ],
  );

  const performCheckOut = useCallback(
    async (justificationReason?: string) => {
      setBusy(true);
      try {
        const pos = await resolvePosition();
        if (!pos) return;
        const { latP, lngP, accuracyM } = pos;
        const dist = distanceMeters(latP, lngP, lat, lng);
        const valid = dist <= stop.geofenceRadiusM * 1.5;
        if (!valid && !justificationReason?.trim()) {
          setPendingAction('out');
          setJustifyOpen(true);
          return;
        }
        if (!valid && (justificationReason?.trim().length ?? 0) < 8) {
          Alert.alert('Justificativa', 'Mínimo 8 caracteres para check-out distante do cliente.');
          setPendingAction('out');
          setJustifyOpen(true);
          return;
        }
        const at = new Date().toISOString();
        const coords: [number, number] = [lngP, latP];
        enqueueCheckOut({
          paradaId: stop.id,
          at,
          geo: { type: 'Point', coordinates: coords },
          accuracyM,
          mockOverride: simulateAtClient || undefined,
          justificationReason: justificationReason?.trim() || undefined,
        });
        setCheckOut(routeDate, stop.id, at);
        setFeedback(`Check-out registrado (${Math.round(dist)} m).`);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        recordCheckOut();
        refreshGamification();
        onMutate();
        refreshCounts();
      } finally {
        setBusy(false);
      }
    },
    [
      lat,
      lng,
      onMutate,
      refreshCounts,
      refreshGamification,
      resolvePosition,
      routeDate,
      simulateAtClient,
      stop.geofenceRadiusM,
      stop.id,
    ],
  );

  const onNextStep = useCallback(() => {
    Alert.alert('Próximo passo', 'O que registrar após a visita?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Proposta enviada',
        onPress: () => {
          setNextStep(routeDate, stop.id, 'proposta', 'Proposta enviada ao cliente');
          recordPipelineStep('proposta');
          refreshGamification();
          onMutate();
        },
      },
      {
        text: 'Pendência MTR',
        onPress: () => {
          setNextStep(routeDate, stop.id, 'mtr', 'Aguardando MTR / documentação');
          recordPipelineStep('mtr');
          refreshGamification();
          onMutate();
        },
      },
      {
        text: 'Agendar coleta',
        onPress: () => {
          setNextStep(routeDate, stop.id, 'coleta', 'Coleta agendada');
          recordPipelineStep('coleta');
          refreshGamification();
          onMutate();
        },
      },
      {
        text: 'Outro',
        onPress: () => {
          setNextStep(routeDate, stop.id, 'outro', 'Registrado em campo');
          recordPipelineStep('outro');
          refreshGamification();
          onMutate();
        },
      },
    ]);
  }, [onMutate, refreshGamification, routeDate, stop.id]);

  const submitJustification = useCallback(() => {
    const j = justifyDraft.trim();
    if (j.length < 8) {
      Alert.alert('Justificativa', 'Mínimo 8 caracteres.');
      return;
    }
    setJustifyOpen(false);
    setJustifyDraft('');
    if (pendingAction === 'in') void performCheckIn(j);
    if (pendingAction === 'out') void performCheckOut(j);
    setPendingAction(null);
  }, [justifyDraft, pendingAction, performCheckIn, performCheckOut]);

  const checkedIn = Boolean(visit?.check_in_at);
  const checkedOut = Boolean(visit?.check_out_at);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: palette.card,
          borderColor: highlightArrival ? palette.lime : palette.border,
          borderWidth: highlightArrival ? 2.5 : 1,
          shadowColor: highlightArrival ? palette.tint : 'transparent',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: highlightArrival ? 0.25 : 0,
          shadowRadius: highlightArrival ? 14 : 0,
          elevation: highlightArrival ? 6 : 0,
        },
      ]}>
      <Text style={[styles.time, { color: palette.tint }]} accessibilityLabel={`Janela ${stop.windowStart.slice(11, 16)} até ${stop.windowEnd.slice(11, 16)}`}>
        {stop.windowStart.slice(11, 16)} – {stop.windowEnd.slice(11, 16)}
      </Text>
      <Text style={[styles.account, { color: palette.text }]}>{stop.accountName}</Text>
      <Text style={[styles.address, { color: palette.textSecondary }]}>
        {stop.addressLine}
        {'\n'}
        {stop.city}
      </Text>
      {visit?.next_step ? (
        <Text style={[styles.badge, { color: palette.tint }]}>
          Próximo passo: {visit.next_step} — {visit.next_note}
        </Text>
      ) : null}
      {checkedIn ? (
        <Text style={[styles.meta, { color: palette.textSecondary }]}>Check-in: {visit?.check_in_at}</Text>
      ) : null}
      {checkedOut ? (
        <Text style={[styles.meta, { color: palette.textSecondary }]}>Check-out: {visit?.check_out_at}</Text>
      ) : null}
      <View style={styles.contactRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.contactName, { color: palette.text }]}>{stop.contact.name}</Text>
          <Text style={[styles.contactRole, { color: palette.textSecondary }]}>{stop.contact.role}</Text>
          <Text style={[styles.phone, { color: palette.textSecondary }]}>{stop.contact.phoneE164}</Text>
        </View>
        <Pressable
          onPress={call}
          style={[styles.callBtn, { backgroundColor: palette.tint }]}
          accessibilityRole="button"
          accessibilityLabel={`Ligar para ${stop.contact.name}`}>
          <Text style={styles.callBtnText}>Ligar</Text>
        </Pressable>
      </View>
      <View style={styles.actions}>
        <Pressable
          onPress={openMaps}
          style={[styles.secondaryBtn, { borderColor: palette.border }]}
          accessibilityRole="button"
          accessibilityLabel="Abrir rota no Google Maps">
          <Text style={[styles.secondaryBtnText, { color: palette.text }]}>Google Maps</Text>
        </Pressable>
        <Pressable
          onPress={openWaze}
          style={[styles.secondaryBtn, { borderColor: palette.border }]}
          accessibilityRole="button"
          accessibilityLabel="Abrir rota no Waze">
          <Text style={[styles.secondaryBtnText, { color: palette.text }]}>Waze</Text>
        </Pressable>
      </View>
      {!checkedIn ? (
        <Pressable
          onPress={() => void performCheckIn()}
          disabled={busy}
          style={[styles.primaryBtn, { backgroundColor: palette.tint }]}
          accessibilityRole="button"
          accessibilityLabel="Check-in com validação de GPS">
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Check-in GPS</Text>}
        </Pressable>
      ) : !checkedOut ? (
        <>
          <Pressable
            onPress={() => void performCheckOut()}
            disabled={busy}
            style={[styles.primaryBtn, { backgroundColor: palette.lime }]}
            accessibilityRole="button"
            accessibilityLabel="Check-out com validação de GPS">
            {busy ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={[styles.primaryBtnText, { color: '#ffffff' }]}>Check-out GPS</Text>
            )}
          </Pressable>
          <Pressable
            onPress={onNextStep}
            style={[styles.outlineBtn, { borderColor: palette.tint }]}
            accessibilityRole="button"
            accessibilityLabel="Registrar próximo passo comercial">
            <Text style={[styles.outlineText, { color: palette.tint }]}>Próximo passo</Text>
          </Pressable>
        </>
      ) : null}
      {feedback ? <Text style={[styles.feedback, { color: palette.textSecondary }]}>{feedback}</Text> : null}

      <Modal visible={justifyOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: palette.card }]}>
            <Text style={[styles.modalTitle, { color: palette.text }]}>Justificativa obrigatória</Text>
            <Text style={{ color: palette.textSecondary, marginBottom: 8 }}>
              Você está fora do raio permitido. Informe o motivo (auditoria / revisão pelo gestor).
            </Text>
            <TextInput
              value={justifyDraft}
              onChangeText={setJustifyDraft}
              placeholder="Ex.: Cliente autorizou recepção no portão principal..."
              placeholderTextColor={palette.textSecondary}
              multiline
              style={[styles.input, { borderColor: palette.border, color: palette.text }]}
              accessibilityLabel="Campo de justificativa"
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => { setJustifyOpen(false); setPendingAction(null); }} style={styles.modalBtnGhost}>
                <Text style={{ color: palette.textSecondary }}>Cancelar</Text>
              </Pressable>
              <Pressable onPress={submitJustification} style={[styles.modalBtn, { backgroundColor: palette.tint }]}>
                <Text style={styles.primaryBtnText}>Confirmar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  time: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  account: { fontSize: 18, fontWeight: '700' },
  address: { fontSize: 14, lineHeight: 20 },
  meta: { fontSize: 12 },
  badge: { fontSize: 13, fontWeight: '700' },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  contactName: { fontSize: 16, fontWeight: '600' },
  contactRole: { fontSize: 13, marginTop: 2 },
  phone: { fontSize: 13, marginTop: 2 },
  callBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  callBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtnText: { fontWeight: '600', fontSize: 14 },
  primaryBtn: {
    marginTop: 4,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  outlineBtn: {
    marginTop: 6,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  outlineText: { fontWeight: '800', fontSize: 14 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  feedback: { fontSize: 13, lineHeight: 18, marginTop: 4 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: { borderRadius: 16, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 100,
    padding: 12,
    textAlignVertical: 'top',
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12 },
  modalBtnGhost: { padding: 10 },
  modalBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
});
