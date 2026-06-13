import type { CommercialPhase } from '@/lib/commercialFunnel';
import { primaryHrefForPhase } from '@/lib/commercialFunnel';
import type { Parada } from '@rg-ambiental/shared';
import type { Href } from 'expo-router';

/** Contexto mínimo para propagar entre fases do funil comercial. */
export type CommercialContext = {
  routeDate?: string;
  stopId?: string;
  company?: string;
  contact?: string;
  clientName?: string;
  address?: string;
  city?: string;
  phone?: string;
  value?: string;
  cnpj?: string;
  proposalNumber?: string;
  email?: string;
  scope?: string;
};

export type VisitSessionParams = {
  routeDate: string;
  stopId: string;
  company: string;
  contact: string;
  address: string;
  city: string;
  phone?: string;
};

function enc(v: string): string {
  return encodeURIComponent(v);
}

export function defaultProposalScope(company: string, address: string, city: string): string {
  return `Gerenciamento de resíduos e conformidade ambiental RG Ambiental para ${company} — ${address}, ${city}. Inclui coleta, MTR, rastreabilidade e suporte operacional conforme diagnóstico em visita.`;
}

export function clientStorageKey(session: Pick<VisitSessionParams, 'stopId' | 'company'>): string {
  return session.stopId || session.company.trim().toLowerCase().replace(/\s+/g, '-');
}

export function commercialContextQueryString(ctx: CommercialContext): string {
  const parts: string[] = [];
  if (ctx.routeDate) parts.push(`routeDate=${enc(ctx.routeDate)}`);
  if (ctx.stopId) parts.push(`stopId=${enc(ctx.stopId)}`);
  if (ctx.company) parts.push(`company=${enc(ctx.company)}`);
  const contact = ctx.contact || ctx.clientName;
  if (contact) {
    parts.push(`contact=${enc(contact)}`);
    parts.push(`clientName=${enc(contact)}`);
  }
  if (ctx.address) parts.push(`address=${enc(ctx.address)}`);
  if (ctx.city) parts.push(`city=${enc(ctx.city)}`);
  if (ctx.phone) parts.push(`phone=${enc(ctx.phone)}`);
  if (ctx.value) parts.push(`value=${enc(ctx.value)}`);
  if (ctx.cnpj) parts.push(`cnpj=${enc(ctx.cnpj)}`);
  if (ctx.proposalNumber) parts.push(`proposalNumber=${enc(ctx.proposalNumber)}`);
  if (ctx.email) parts.push(`email=${enc(ctx.email)}`);
  if (ctx.scope) parts.push(`scope=${enc(ctx.scope)}`);
  return parts.join('&');
}

/** Mescla URL params com valores do formulário (formulário ganha se não vazio). */
export function buildCommercialContext(
  urlCtx: CommercialContext,
  overrides: CommercialContext,
): CommercialContext {
  const pick = (override?: string, base?: string) => {
    const o = override?.trim();
    if (o) return o;
    return base?.trim() || undefined;
  };
  return {
    routeDate: pick(overrides.routeDate, urlCtx.routeDate),
    stopId: pick(overrides.stopId, urlCtx.stopId),
    company: pick(overrides.company, urlCtx.company),
    contact: pick(overrides.contact ?? overrides.clientName, urlCtx.contact ?? urlCtx.clientName),
    clientName: pick(overrides.clientName ?? overrides.contact, urlCtx.clientName ?? urlCtx.contact),
    address: pick(overrides.address, urlCtx.address),
    city: pick(overrides.city, urlCtx.city),
    phone: pick(overrides.phone, urlCtx.phone),
    value: pick(overrides.value, urlCtx.value),
    cnpj: pick(overrides.cnpj, urlCtx.cnpj),
    proposalNumber: pick(overrides.proposalNumber, urlCtx.proposalNumber),
    email: pick(overrides.email, urlCtx.email),
    scope: pick(overrides.scope, urlCtx.scope),
  };
}

export function phaseHref(phase: CommercialPhase, ctx?: CommercialContext): Href {
  const base = primaryHrefForPhase(phase);
  if (!ctx) return base;
  const q = commercialContextQueryString(ctx);
  if (!q) return base;
  return `${base}?${q}` as Href;
}

/** Anexa contexto comercial a qualquer rota do funil. */
export function toolHrefWithContext(href: Href, ctx?: CommercialContext): Href {
  if (!ctx?.company) return href;
  const path = typeof href === 'string' ? href.split('?')[0]! : String(href);
  const q = commercialContextQueryString(ctx);
  if (!q) return href;
  return `${path}?${q}` as Href;
}

export function commercialContextFromPipelineRow(row: {
  account: string;
  contact?: string;
  routeDate?: string;
  stopId?: string;
  address?: string;
  city?: string;
  phone?: string;
  value?: string;
  proposalNumber?: string;
}): CommercialContext {
  return {
    company: row.account,
    contact: row.contact,
    clientName: row.contact,
    routeDate: row.routeDate,
    stopId: row.stopId,
    address: row.address,
    city: row.city,
    phone: row.phone,
    value: row.value,
    proposalNumber: row.proposalNumber,
  };
}

export function sessionQueryString(p: Partial<VisitSessionParams>): string {
  const parts: string[] = [];
  if (p.routeDate) parts.push(`routeDate=${enc(p.routeDate)}`);
  if (p.stopId) parts.push(`stopId=${enc(p.stopId)}`);
  if (p.company) parts.push(`company=${enc(p.company)}`);
  if (p.contact) parts.push(`contact=${enc(p.contact)}`);
  if (p.address) parts.push(`address=${enc(p.address)}`);
  if (p.city) parts.push(`city=${enc(p.city)}`);
  if (p.phone) parts.push(`phone=${enc(p.phone)}`);
  return parts.join('&');
}

export type CommercialSessionTool =
  | 'visit-playbook'
  | 'pitch-faq'
  | 'docs-checklist'
  | 'calculator'
  | 'proposal'
  | 'contract-flow'
  | 'cases'
  | 'compare'
  | 'intent-term'
  | 'contract-kit'
  | 'followup'
  | 'meeting-log';

export function commercialToolHref(
  tool: CommercialSessionTool,
  session: VisitSessionParams,
  extra?: Record<string, string>,
): Href {
  const q = sessionQueryString(session);
  const tail = extra
    ? Object.entries(extra)
        .map(([k, v]) => `${enc(k)}=${enc(v)}`)
        .join('&')
    : '';
  const full = [q, tail].filter(Boolean).join('&');
  return `/(tabs)/commercial/${tool}?${full}` as Href;
}

export function visitSessionHref(stop: Parada, routeDate: string): Href {
  const q = sessionQueryString({
    routeDate,
    stopId: stop.id,
    company: stop.accountName,
    contact: stop.contact.name,
    address: stop.addressLine,
    city: stop.city,
    phone: stop.contact.phoneE164,
  });
  return `/(tabs)/commercial/visit-session?${q}` as Href;
}

export function proposalHrefFromStop(stop: Parada, routeDate?: string): Href {
  return proposalHrefWithValue({
    routeDate,
    stopId: stop.id,
    company: stop.accountName,
    clientName: stop.contact.name,
    scope: defaultProposalScope(stop.accountName, stop.addressLine, stop.city),
  });
}

export function proposalHrefFromParams(p: Pick<VisitSessionParams, 'company' | 'contact' | 'address' | 'city'>): Href {
  const q = [
    `company=${enc(p.company)}`,
    `clientName=${enc(p.contact)}`,
    `scope=${enc(defaultProposalScope(p.company, p.address, p.city))}`,
  ].join('&');
  return `/(tabs)/commercial/proposal?${q}` as Href;
}

export function proposalHrefWithValue(p: {
  company?: string;
  clientName?: string;
  scope?: string;
  value?: string;
  stopId?: string;
  routeDate?: string;
}): Href {
  const q = [
    p.routeDate ? `routeDate=${enc(p.routeDate)}` : '',
    p.stopId ? `stopId=${enc(p.stopId)}` : '',
    p.company ? `company=${enc(p.company)}` : '',
    p.clientName ? `clientName=${enc(p.clientName)}` : '',
    p.scope ? `scope=${enc(p.scope)}` : '',
    p.value ? `value=${enc(p.value)}` : '',
  ]
    .filter(Boolean)
    .join('&');
  return `/(tabs)/commercial/proposal?${q}` as Href;
}

export function contractHrefFromSession(session: VisitSessionParams, value?: string): Href {
  return commercialToolHref('contract-flow', session, value ? { value } : undefined);
}

export function parseVisitSessionSearchParams(
  raw: Record<string, string | string[] | undefined>,
): VisitSessionParams | null {
  const one = (k: string) => {
    const v = raw[k];
    const s = Array.isArray(v) ? v[0] : v;
    return s?.trim() ?? '';
  };
  const routeDate = one('routeDate');
  const stopId = one('stopId');
  const company = one('company');
  if (!routeDate || !stopId || !company) {
    if (!company) return null;
    return {
      routeDate: routeDate || '',
      stopId: stopId || company.toLowerCase().replace(/\s+/g, '-'),
      company,
      contact: one('contact'),
      address: one('address'),
      city: one('city'),
      phone: one('phone'),
    };
  }
  return {
    routeDate,
    stopId,
    company,
    contact: one('contact'),
    address: one('address'),
    city: one('city'),
    phone: one('phone'),
  };
}

/** Params com contexto mínimo (proposta, contrato, pipeline). */
export function parseCommercialContext(
  raw: Record<string, string | string[] | undefined>,
): CommercialContext {
  const one = (k: string) => {
    const v = raw[k];
    const s = Array.isArray(v) ? v[0] : v;
    return s ? decodeURIComponent(s) : '';
  };
  return {
    routeDate: one('routeDate'),
    stopId: one('stopId'),
    company: one('company'),
    contact: one('contact') || one('clientName'),
    clientName: one('clientName') || one('contact'),
    address: one('address'),
    city: one('city'),
    phone: one('phone'),
    value: one('value'),
    cnpj: one('cnpj'),
    proposalNumber: one('proposalNumber'),
    email: one('email'),
    scope: one('scope'),
  };
}

export function meetingLogHref(clientLabel: string): Href {
  return `/(tabs)/commercial/meeting-log?client=${enc(clientLabel)}` as Href;
}

export function followupHref(
  nome: string,
  empresa: string,
  phone?: string,
  session?: Partial<VisitSessionParams>,
): Href {
  const q = [
    `nome=${enc(nome)}`,
    `empresa=${enc(empresa)}`,
    phone ? `phone=${enc(phone)}` : '',
    session?.routeDate ? `routeDate=${enc(session.routeDate)}` : '',
    session?.stopId ? `stopId=${enc(session.stopId)}` : '',
    session?.address ? `address=${enc(session.address)}` : '',
    session?.city ? `city=${enc(session.city)}` : '',
  ]
    .filter(Boolean)
    .join('&');
  return `/(tabs)/commercial/followup?${q}` as Href;
}

/** Contexto de visita guardado no pipeline local (quando disponível). */
export type PipelineVisitMeta = {
  routeDate?: string;
  stopId?: string;
  contact?: string;
  address?: string;
  city?: string;
  phone?: string;
};

export function visitSessionFromMeta(
  account: string,
  meta?: PipelineVisitMeta,
): VisitSessionParams {
  return {
    routeDate: meta?.routeDate ?? '',
    stopId: meta?.stopId ?? account.toLowerCase().replace(/\s+/g, '-'),
    company: account,
    contact: meta?.contact ?? '',
    address: meta?.address ?? '',
    city: meta?.city ?? '',
    phone: meta?.phone,
  };
}

export function visitSessionHrefFromMeta(account: string, meta?: PipelineVisitMeta): Href {
  const session = visitSessionFromMeta(account, meta);
  const q = sessionQueryString(session);
  return `/(tabs)/commercial/visit-session?${q}` as Href;
}

export function prospectingHref(company?: string): Href {
  return company
    ? (`/(tabs)/commercial/prospecting?company=${enc(company)}` as Href)
    : ('/(tabs)/commercial/prospecting' as Href);
}

export function acceptanceHref(p: {
  company?: string;
  proposalNumber?: string;
  clientName?: string;
  value?: string;
  phone?: string;
  email?: string;
}): Href {
  const q = [
    p.company ? `company=${enc(p.company)}` : '',
    p.proposalNumber ? `proposalNumber=${enc(p.proposalNumber)}` : '',
    p.clientName ? `clientName=${enc(p.clientName)}` : '',
    p.value ? `value=${enc(p.value)}` : '',
    p.phone ? `phone=${enc(p.phone)}` : '',
    p.email ? `email=${enc(p.email)}` : '',
  ]
    .filter(Boolean)
    .join('&');
  return `/(tabs)/commercial/acceptance?${q}` as Href;
}
