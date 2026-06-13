import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CommercialContext } from '@/lib/commercialLinks';
import { defaultProposalScope } from '@/lib/commercialLinks';
import { FUNNEL_STAGE } from '@/lib/commercialFunnel';
import { upsertLocalPipeline } from '@/lib/localPipelineStore';

const KEY = 'rg_client_registry_v1';
const MAX_CLIENTS = 500;

export type ClientRecord = {
  id: string;
  company: string;
  tradeName: string;
  cnpj: string;
  segment: string;
  contactName: string;
  contactRole: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  notes: string;
  createdAt: number;
  updatedAt: number;
};

export type ClientDraft = Omit<ClientRecord, 'id' | 'createdAt' | 'updatedAt'>;

function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `client-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function loadClients(): Promise<ClientRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return (parsed as ClientRecord[]).sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

async function saveClients(rows: ClientRecord[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(rows.slice(0, MAX_CLIENTS)));
}

export async function upsertClient(draft: Partial<ClientDraft> & { id?: string }): Promise<ClientRecord> {
  const rows = await loadClients();
  const now = Date.now();
  const company = draft.company?.trim() ?? '';
  const contactName = draft.contactName?.trim() ?? '';
  if (!company || !contactName) {
    throw new Error('missing_fields');
  }

  const existingIdx = draft.id ? rows.findIndex((r) => r.id === draft.id) : -1;
  const prev = existingIdx >= 0 ? rows[existingIdx] : null;

  const row: ClientRecord = {
    id: draft.id ?? newId(),
    company,
    tradeName: draft.tradeName?.trim() ?? prev?.tradeName ?? '',
    cnpj: draft.cnpj?.trim() ?? prev?.cnpj ?? '',
    segment: draft.segment?.trim() ?? prev?.segment ?? '',
    contactName,
    contactRole: draft.contactRole?.trim() ?? prev?.contactRole ?? '',
    phone: draft.phone?.trim() ?? prev?.phone ?? '',
    email: draft.email?.trim() ?? prev?.email ?? '',
    address: draft.address?.trim() ?? prev?.address ?? '',
    city: draft.city?.trim() ?? prev?.city ?? '',
    notes: draft.notes?.trim() ?? prev?.notes ?? '',
    createdAt: prev?.createdAt ?? now,
    updatedAt: now,
  };

  if (existingIdx >= 0) rows[existingIdx] = row;
  else rows.unshift(row);

  await saveClients(rows);
  await syncClientToPipeline(row);
  return row;
}

export async function deleteClient(id: string): Promise<void> {
  const rows = await loadClients();
  await saveClients(rows.filter((r) => r.id !== id));
}

export function clientToCommercialContext(client: ClientRecord): CommercialContext {
  const scope =
    client.address && client.city
      ? defaultProposalScope(client.company, client.address, client.city)
      : undefined;
  return {
    stopId: `client-${client.id}`,
    company: client.company,
    contact: client.contactName,
    clientName: client.contactName,
    address: client.address,
    city: client.city,
    phone: client.phone,
    email: client.email,
    cnpj: client.cnpj,
    scope,
  };
}

export async function syncClientToPipeline(client: ClientRecord): Promise<void> {
  const valueParts = [client.segment, client.city].filter(Boolean).join(' · ');
  await upsertLocalPipeline({
    id: `client-${client.id}`,
    account: client.company,
    stage: FUNNEL_STAGE.prospecting,
    phase: 'prospecting',
    owner: 'Você',
    value: valueParts || 'Cliente cadastrado',
    docPending: client.cnpj ? `CNPJ ${client.cnpj}` : undefined,
    source: 'prospecting',
    contact: client.contactName,
    address: client.address,
    city: client.city,
    phone: client.phone,
  });
}

export function clientMatchesQuery(client: ClientRecord, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const hay = [
    client.company,
    client.tradeName,
    client.contactName,
    client.city,
    client.cnpj,
    client.segment,
  ]
    .join(' ')
    .toLowerCase();
  return hay.includes(needle);
}

export function emptyClientDraft(): ClientDraft {
  return {
    company: '',
    tradeName: '',
    cnpj: '',
    segment: '',
    contactName: '',
    contactRole: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    notes: '',
  };
}

export function clientToDraft(client: ClientRecord): ClientDraft {
  const { id: _id, createdAt: _c, updatedAt: _u, ...draft } = client;
  return draft;
}

/** Mescla clientes do servidor (updatedAt mais recente vence). */
export async function mergeClientsFromServer(
  remote: {
    id: string;
    company: string;
    contactName: string;
    segment?: string;
    city?: string;
    phone?: string;
    email?: string;
    cnpj?: string;
    updatedAt: number;
  }[],
): Promise<void> {
  if (!remote.length) return;
  const local = await loadClients();
  const byId = new Map(local.map((r) => [r.id, r]));
  for (const r of remote) {
    const prev = byId.get(r.id);
    if (prev && prev.updatedAt >= r.updatedAt) continue;
    const row: ClientRecord = {
      id: r.id,
      company: r.company,
      tradeName: prev?.tradeName ?? '',
      cnpj: r.cnpj ?? prev?.cnpj ?? '',
      segment: r.segment ?? prev?.segment ?? '',
      contactName: r.contactName,
      contactRole: prev?.contactRole ?? '',
      phone: r.phone ?? prev?.phone ?? '',
      email: r.email ?? prev?.email ?? '',
      address: prev?.address ?? '',
      city: r.city ?? prev?.city ?? '',
      notes: prev?.notes ?? '',
      createdAt: prev?.createdAt ?? r.updatedAt,
      updatedAt: r.updatedAt,
    };
    byId.set(r.id, row);
    await syncClientToPipeline(row);
  }
  await saveClients([...byId.values()].sort((a, b) => b.updatedAt - a.updatedAt));
}

export async function hydrateClientsFromApi(): Promise<void> {
  const { fetchClients } = await import('@/lib/api');
  const { isApiEnabled } = await import('@/lib/apiConfig');
  if (!isApiEnabled()) return;
  try {
    const rows = await fetchClients();
    await mergeClientsFromServer(rows);
  } catch {
    /* mantém cache local */
  }
}
