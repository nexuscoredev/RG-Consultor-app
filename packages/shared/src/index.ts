import { z } from "zod";

/** GeoJSON-style point for PostGIS interchange */
export const GeoPointSchema = z.object({
  type: z.literal("Point"),
  coordinates: z.tuple([z.number(), z.number()]), // [lng, lat]
});

export const ContactSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  role: z.string().min(1),
  phoneE164: z.string().regex(/^\+[1-9]\d{6,14}$/),
});

export const ParadaSchema = z.object({
  id: z.string().uuid(),
  routeDayId: z.string().uuid(),
  order: z.number().int().nonnegative(),
  windowStart: z.string().datetime({ offset: true }),
  windowEnd: z.string().datetime({ offset: true }),
  addressLine: z.string().min(1),
  city: z.string().min(1),
  geo: GeoPointSchema,
  geofenceRadiusM: z.number().positive().default(150),
  contact: ContactSchema,
  accountName: z.string().min(1),
});

export const RotaDiaSchema = z.object({
  id: z.string().uuid(),
  date: z.string().date(),
  sellerId: z.string().uuid(),
  stops: z.array(ParadaSchema),
});

export const CheckInPayloadSchema = z.object({
  paradaId: z.string().uuid(),
  at: z.string().datetime({ offset: true }),
  geo: GeoPointSchema,
  accuracyM: z.number().nonnegative().optional(),
  mockOverride: z.boolean().optional(),
  /** Obrigatório quando check-in fora do geofence (auditoria / exceção aprovada pelo gestor em produção) */
  justificationReason: z.string().min(8).max(500).optional(),
});

export const VisitaSchema = z.object({
  id: z.string().uuid(),
  paradaId: z.string().uuid(),
  sellerId: z.string().uuid(),
  checkIn: CheckInPayloadSchema,
  checkOut: CheckInPayloadSchema.optional(),
});

export const PositionPingSchema = z.object({
  sellerId: z.string().uuid(),
  at: z.string().datetime({ offset: true }),
  geo: GeoPointSchema,
  accuracyM: z.number().nonnegative().optional(),
});

export const MissionProgressSchema = z.object({
  missionId: z.string().uuid(),
  title: z.string(),
  current: z.number().nonnegative(),
  target: z.number().positive(),
  unit: z.enum(["visits", "proposals", "points"]),
});

export const BadgeSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string(),
  description: z.string(),
  unlockedAt: z.string().datetime({ offset: true }).optional(),
});

export const RankingEntrySchema = z.object({
  sellerId: z.string().uuid(),
  displayName: z.string(),
  weeklyPoints: z.number().nonnegative(),
  rank: z.number().int().positive(),
});

export const MeetingLogPayloadSchema = z.object({
  client: z.string().min(1),
  notes: z.string(),
  nextAction: z.string(),
  nextDate: z.string(),
});

export const ProposalSentPayloadSchema = z.object({
  company: z.string().min(1),
  clientName: z.string(),
  value: z.string(),
  proposalNumber: z.string(),
  scope: z.string().optional(),
});

export const ContractClosedPayloadSchema = z.object({
  company: z.string().min(1),
  cnpj: z.string(),
  service: z.string(),
  value: z.string(),
  term: z.string(),
});

export const ProspectingSavedPayloadSchema = z.object({
  company: z.string().min(1),
  segment: z.string(),
  source: z.string(),
  contactName: z.string(),
});

export const ProposalAcceptedPayloadSchema = z.object({
  company: z.string().min(1),
  proposalNumber: z.string(),
  acceptedValue: z.string(),
  acceptanceType: z.string(),
});

export const ClientSavedPayloadSchema = z.object({
  id: z.string().min(1),
  company: z.string().min(1),
  contactName: z.string(),
  segment: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  cnpj: z.string().optional(),
});

export const FollowUpSentPayloadSchema = z.object({
  company: z.string().min(1),
  contactName: z.string().optional(),
  channel: z.enum(["email", "whatsapp", "copy"]),
  phase: z.string().optional(),
});

export const OutboxEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("CHECK_IN"),
    id: z.string().uuid(),
    payload: CheckInPayloadSchema,
    createdAt: z.number().int(),
  }),
  z.object({
    type: z.literal("CHECK_OUT"),
    id: z.string().uuid(),
    payload: CheckInPayloadSchema,
    createdAt: z.number().int(),
  }),
  z.object({
    type: z.literal("LOCATION_BATCH"),
    id: z.string().uuid(),
    payload: z.object({ pings: z.array(PositionPingSchema) }),
    createdAt: z.number().int(),
  }),
  z.object({
    type: z.literal("MEETING_LOG"),
    id: z.string().uuid(),
    payload: MeetingLogPayloadSchema,
    createdAt: z.number().int(),
  }),
  z.object({
    type: z.literal("PROPOSAL_SENT"),
    id: z.string().uuid(),
    payload: ProposalSentPayloadSchema,
    createdAt: z.number().int(),
  }),
  z.object({
    type: z.literal("CONTRACT_CLOSED"),
    id: z.string().uuid(),
    payload: ContractClosedPayloadSchema,
    createdAt: z.number().int(),
  }),
  z.object({
    type: z.literal("PROSPECTING_SAVED"),
    id: z.string().uuid(),
    payload: ProspectingSavedPayloadSchema,
    createdAt: z.number().int(),
  }),
  z.object({
    type: z.literal("PROPOSAL_ACCEPTED"),
    id: z.string().uuid(),
    payload: ProposalAcceptedPayloadSchema,
    createdAt: z.number().int(),
  }),
  z.object({
    type: z.literal("CLIENT_SAVED"),
    id: z.string().min(1),
    payload: ClientSavedPayloadSchema,
    createdAt: z.number().int(),
  }),
  z.object({
    type: z.literal("FOLLOW_UP_SENT"),
    id: z.string().min(1),
    payload: FollowUpSentPayloadSchema,
    createdAt: z.number().int(),
  }),
]);

export type GeoPoint = z.infer<typeof GeoPointSchema>;
export type Contact = z.infer<typeof ContactSchema>;
export type Parada = z.infer<typeof ParadaSchema>;
export type RotaDia = z.infer<typeof RotaDiaSchema>;
export type CheckInPayload = z.infer<typeof CheckInPayloadSchema>;
export type Visita = z.infer<typeof VisitaSchema>;
export type PositionPing = z.infer<typeof PositionPingSchema>;
export type MissionProgress = z.infer<typeof MissionProgressSchema>;
export type Badge = z.infer<typeof BadgeSchema>;
export type RankingEntry = z.infer<typeof RankingEntrySchema>;
export type OutboxEvent = z.infer<typeof OutboxEventSchema>;

/** REST shapes (MVP) */
export const ApiRotaDiaResponseSchema = RotaDiaSchema;
export const ApiPostCheckInRequestSchema = CheckInPayloadSchema;
export const ApiPostCheckInResponseSchema = z.object({
  visitaId: z.string().uuid(),
  valid: z.boolean(),
  distanceM: z.number().nonnegative(),
});
