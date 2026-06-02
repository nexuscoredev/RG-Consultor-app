import type { Parada } from '@rg-ambiental/shared';
import type { Href } from 'expo-router';

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

export function commercialToolHref(
  tool:
    | 'visit-playbook'
    | 'pitch-faq'
    | 'docs-checklist'
    | 'calculator'
    | 'proposal'
    | 'contract-flow',
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

export function proposalHrefFromStop(stop: Parada): Href {
  const q = [
    `company=${enc(stop.accountName)}`,
    `clientName=${enc(stop.contact.name)}`,
    `scope=${enc(defaultProposalScope(stop.accountName, stop.addressLine, stop.city))}`,
  ].join('&');
  return `/(tabs)/commercial/proposal?${q}` as Href;
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
): Partial<VisitSessionParams> & { clientName?: string; value?: string; cnpj?: string } {
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
  };
}

export function meetingLogHref(clientLabel: string): Href {
  return `/(tabs)/commercial/meeting-log?client=${enc(clientLabel)}` as Href;
}

export function followupHref(nome: string, empresa: string, phone?: string): Href {
  const q = [`nome=${enc(nome)}`, `empresa=${enc(empresa)}`, phone ? `phone=${enc(phone)}` : ''].filter(Boolean).join('&');
  return `/(tabs)/commercial/followup?${q}` as Href;
}
