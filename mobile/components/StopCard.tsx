import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { useDemoGps } from '@/context/DemoGpsContext';
import { useGamification } from '@/context/GamificationContext';
import { useSync } from '@/context/SyncContext';
import { radius, space } from '@/constants/layout';
import { isDemoToolsEnabled } from '@/lib/demoTools';
import { distanceMeters } from '@/lib/geo';
import {
  recordCheckInJustified,
  recordCheckInValid,
  recordCheckOut,
} from '@/lib/gamificationEngine';
import { visitSessionHref } from '@/lib/commercialLinks';
import { t } from '@/lib/i18n';
import { enqueueCheckIn, enqueueCheckOut } from '@/lib/outbox';
import { whatsAppUrl } from '@/lib/proposalTemplate';
import { registerVisitOutcome, type VisitOutcomeKind } from '@/lib/visitOutcome';
import { setCheckIn, setCheckOut, type VisitLocal } from '@/lib/visitStore';
import type { Parada } from '@rg-ambiental/shared';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { Link } from 'expo-router';
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
  highlightArrival?: boolean;
};

export function StopCard({ stop, routeDate, visit, onMutate, highlightArrival }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const S = t('stopCard');
  const C = t('common');
  const { simulateAtClient } = useDemoGps();
  const { refreshCounts, runSyncNow } = useSync();
  const { refresh: refreshGamification } = useGamification();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [justifyOpen, setJustifyOpen] = useState(false);
  const [justifyDraft, setJustifyDraft] = useState('');
  const [pendingAction, setPendingAction] = useState<'in' | 'out' | null>(null);

  const [lng, lat] = stop.geo.coordinates;
  const windowStart = stop.windowStart.slice(11, 16);
  const windowEnd = stop.windowEnd.slice(11, 16);

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
        Alert.alert(S.locationTitle, S.locationDenied);
        return null;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      latP = pos.coords.latitude;
      lngP = pos.coords.longitude;
      accuracyM = pos.coords.accuracy ?? undefined;
    }
    return { latP, lngP, accuracyM };
  }, [S.locationDenied, S.locationTitle, lat, lng, simulateAtClient]);

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
          Alert.alert(S.justificationTitle, S.justificationMin);
          setPendingAction('in');
          setJustifyOpen(true);
          return;
        }
        const at = new Date().toISOString();
        const coords: [number, number] = [lngP, latP];
        enqueueCheckIn({
          paradaId: stop.id,
          at,
          geo: { type: 'Point' as const, coordinates: coords },
          accuracyM,
          mockOverride: simulateAtClient && isDemoToolsEnabled() ? true : undefined,
          justificationReason: justificationReason?.trim() || undefined,
        });
        setCheckIn(routeDate, stop.id, at);
        setFeedback(
          valid
            ? S.checkInValid.replace('{dist}', String(Math.round(dist)))
            : S.checkInJustified.replace('{dist}', String(Math.round(dist))),
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
      S.checkInJustified,
      S.checkInValid,
      S.justificationMin,
      S.justificationTitle,
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
          Alert.alert(S.justificationTitle, S.justificationMinOut);
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
          mockOverride: simulateAtClient && isDemoToolsEnabled() ? true : undefined,
          justificationReason: justificationReason?.trim() || undefined,
        });
        setCheckOut(routeDate, stop.id, at);
        setFeedback(S.checkOutDone.replace('{dist}', String(Math.round(dist))));
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
      S.checkOutDone,
      S.justificationMinOut,
      S.justificationTitle,
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

  const openWhatsApp = useCallback(() => {
    const text = S.waTemplate
      .replace('{name}', stop.contact.name)
      .replace('{company}', stop.accountName);
    void Linking.openURL(whatsAppUrl(text, stop.contact.phoneE164));
  }, [S.waTemplate, stop.accountName, stop.contact.name, stop.contact.phoneE164]);

  const onNextStep = useCallback(() => {
    const apply = (kind: VisitOutcomeKind) => {
      void (async () => {
        await registerVisitOutcome(kind, {
          routeDate,
          stopId: stop.id,
          company: stop.accountName,
        });
        refreshGamification();
        refreshCounts();
        void runSyncNow();
        onMutate();
      })();
    };

    Alert.alert(S.nextStepTitle, S.nextStepBody, [
      { text: C.cancel, style: 'cancel' },
      { text: S.outcomeProposal, onPress: () => apply('proposta') },
      { text: S.outcomeMtr, onPress: () => apply('mtr') },
      { text: S.outcomeColeta, onPress: () => apply('coleta') },
      { text: S.outcomeOther, onPress: () => apply('outro') },
    ]);
  }, [
    C.cancel,
    S.nextStepBody,
    S.nextStepTitle,
    S.outcomeColeta,
    S.outcomeMtr,
    S.outcomeOther,
    S.outcomeProposal,
    onMutate,
    refreshCounts,
    refreshGamification,
    routeDate,
    runSyncNow,
    stop.accountName,
    stop.id,
  ]);

  const submitJustification = useCallback(() => {
    const j = justifyDraft.trim();
    if (j.length < 8) {
      Alert.alert(S.justificationTitle, S.justificationMin);
      return;
    }
    setJustifyOpen(false);
    setJustifyDraft('');
    if (pendingAction === 'in') void performCheckIn(j);
    if (pendingAction === 'out') void performCheckOut(j);
    setPendingAction(null);
  }, [S.justificationMin, S.justificationTitle, justifyDraft, pendingAction, performCheckIn, performCheckOut]);

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
      <Text
        style={[styles.time, { color: palette.tint }]}
        accessibilityLabel={S.windowA11y.replace('{start}', windowStart).replace('{end}', windowEnd)}>
        {windowStart} – {windowEnd}
      </Text>
      <Text style={[styles.account, { color: palette.text }]}>{stop.accountName}</Text>
      <Text style={[styles.address, { color: palette.textSecondary }]}>
        {stop.addressLine}
        {'\n'}
        {stop.city}
      </Text>
      {visit?.next_step ? (
        <Text style={[styles.badge, { color: palette.tint }]}>
          {S.nextStepBadge.replace('{step}', visit.next_step).replace('{note}', visit.next_note ?? '')}
        </Text>
      ) : null}
      {checkedIn ? (
        <Text style={[styles.meta, { color: palette.textSecondary }]}>
          {S.checkInAt.replace('{at}', visit?.check_in_at ?? '')}
        </Text>
      ) : null}
      {checkedOut ? (
        <Text style={[styles.meta, { color: palette.textSecondary }]}>
          {S.checkOutAt.replace('{at}', visit?.check_out_at ?? '')}
        </Text>
      ) : null}

      <View style={styles.contactBlock}>
        <Text style={[styles.contactName, { color: palette.text }]}>{stop.contact.name}</Text>
        <Text style={[styles.contactRole, { color: palette.textSecondary }]}>{stop.contact.role}</Text>
        <Text style={[styles.phone, { color: palette.textSecondary }]}>{stop.contact.phoneE164}</Text>
      </View>

      <View style={styles.gridRow}>
        <View style={styles.gridCell}>
          <PrimaryButton
            fullWidth
            label={S.call}
            onPress={call}
            accessibilityLabel={S.callA11y.replace('{name}', stop.contact.name)}
          />
        </View>
        <View style={styles.gridCell}>
          <PrimaryButton
            fullWidth
            variant="whatsapp"
            label={S.whatsApp}
            onPress={openWhatsApp}
            accessibilityLabel={S.whatsAppA11y.replace('{name}', stop.contact.name)}
          />
        </View>
      </View>

      <Link href={visitSessionHref(stop, routeDate)} asChild>
        <SecondaryButton
          fullWidth
          tint
          label={S.visitMode}
          accessibilityLabel={S.visitModeA11y}
        />
      </Link>

      <View style={styles.gridRow}>
        <View style={styles.gridCell}>
          <SecondaryButton
            fullWidth
            label={S.maps}
            onPress={openMaps}
            accessibilityLabel={S.mapsA11y}
          />
        </View>
        <View style={styles.gridCell}>
          <SecondaryButton
            fullWidth
            label={S.waze}
            onPress={openWaze}
            accessibilityLabel={S.wazeA11y}
          />
        </View>
      </View>

      {!checkedIn ? (
        <PrimaryButton
          fullWidth
          label={S.checkIn}
          onPress={() => void performCheckIn()}
          disabled={busy}
          loading={busy}
          accessibilityLabel={S.checkInA11y}
        />
      ) : !checkedOut ? (
        <>
          <PrimaryButton
            fullWidth
            variant="lime"
            label={S.checkOut}
            onPress={() => void performCheckOut()}
            disabled={busy}
            loading={busy}
            accessibilityLabel={S.checkOutA11y}
          />
          <SecondaryButton
            fullWidth
            tint
            label={S.nextStepBtn}
            onPress={onNextStep}
            accessibilityLabel={S.nextStepBtnA11y}
          />
        </>
      ) : null}
      {feedback ? <Text style={[styles.feedback, { color: palette.textSecondary }]}>{feedback}</Text> : null}

      <Modal visible={justifyOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <Text style={[styles.modalTitle, { color: palette.text }]}>{S.justificationRequired}</Text>
            <Text style={[styles.modalBody, { color: palette.textSecondary }]}>{S.justificationBody}</Text>
            <TextInput
              value={justifyDraft}
              onChangeText={setJustifyDraft}
              placeholder={S.justificationPlaceholder}
              placeholderTextColor={palette.textSecondary}
              multiline
              style={[styles.input, { borderColor: palette.border, color: palette.text }]}
              accessibilityLabel={S.justificationFieldA11y}
            />
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  setJustifyOpen(false);
                  setPendingAction(null);
                }}
                style={styles.modalBtnGhost}
                accessibilityRole="button"
                accessibilityLabel={C.cancel}>
                <Text style={{ color: palette.textSecondary }}>{C.cancel}</Text>
              </Pressable>
              <PrimaryButton label={S.confirm} onPress={submitJustification} style={styles.modalConfirm} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: space.md,
    gap: space.sm,
  },
  time: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  account: { fontSize: 18, fontWeight: '800' },
  address: { fontSize: 14, lineHeight: 20 },
  meta: { fontSize: 12 },
  badge: { fontSize: 13, fontWeight: '700' },
  contactBlock: { marginTop: space.xs },
  contactName: { fontSize: 16, fontWeight: '700' },
  contactRole: { fontSize: 13, marginTop: 2 },
  phone: { fontSize: 13, marginTop: 2 },
  gridRow: { flexDirection: 'row', gap: space.sm },
  gridCell: { flex: 1 },
  feedback: { fontSize: 13, lineHeight: 18 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: space.lg,
  },
  modalCard: { borderRadius: radius.md, padding: space.md, borderWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: space.xs },
  modalBody: { marginBottom: space.sm, lineHeight: 20 },
  input: {
    borderWidth: 1,
    borderRadius: radius.sm,
    minHeight: 100,
    padding: space.sm,
    textAlignVertical: 'top',
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: space.sm, marginTop: space.sm },
  modalBtnGhost: { padding: space.sm },
  modalConfirm: { paddingHorizontal: space.md, minHeight: 44, paddingVertical: 10 },
});
