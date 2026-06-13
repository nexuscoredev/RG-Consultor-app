import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useToast } from '@/context/ToastContext';
import { useSync } from '@/context/SyncContext';
import {
  ACCEPTANCE_TYPES,
  CALC_CATEGORIES,
  DOCS_CHECKLIST,
  FOLLOWUP_EMAIL,
  FOLLOWUP_WHATSAPP,
  PROSPECTING_SOURCES,
  VISIT_PLAYBOOK,
} from '@/lib/commercialContent';
import {
  clearProspectingDraft,
  draftScopeKey,
  loadAcceptanceRecords,
  loadDocsChecklist,
  loadMeetingLogs,
  loadProspectingDraft,
  loadProspectingRecords,
  loadVisitPlaybookChecks,
  saveAcceptanceRecords,
  saveDocsChecklist,
  saveMeetingLogs,
  saveProspectingDraft,
  saveProspectingRecords,
  saveVisitPlaybookChecks,
  type AcceptanceRecord,
  type MeetingLogEntry,
  type ProspectingRecord,
} from '@/lib/commercialStorage';
import {
  enqueueContractClosed,
  enqueueFollowUpSent,
  enqueueMeetingLog,
  enqueueProposalAccepted,
  enqueueProspectingSaved,
} from '@/lib/outbox';
import { upsertLocalPipeline } from '@/lib/pipelineStore';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}

export function ProspectingForm() {
  const toast = useToast();
  const { syncNow } = useSync();
  const [params] = useSearchParams();
  const companyParam = params.get('company') ?? '';
  const stopId = params.get('stopId') ?? undefined;
  const scope = draftScopeKey(companyParam, stopId);

  const empty = (): Omit<ProspectingRecord, 'id' | 'at'> => ({
    company: companyParam,
    tradeName: '',
    cnpj: '',
    segment: '',
    contactName: '',
    contactRole: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    source: PROSPECTING_SOURCES[0],
    wasteTypes: '',
    volumeMonthly: '',
    currentProvider: '',
    painPoints: '',
    budgetRange: '',
    decisionMaker: '',
    urgency: '',
    nextStep: '',
    nextDate: '',
    notes: '',
  });

  const [form, setForm] = useState(empty);

  useEffect(() => {
    const draft = loadProspectingDraft(scope);
    setForm(draft ? { ...empty(), ...draft, company: draft.company || companyParam } : empty());
  }, [companyParam, scope]);

  const set = (key: keyof typeof form, value: string) => {
    const next = { ...form, [key]: value };
    setForm(next);
    saveProspectingDraft(scope, next);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.company.trim()) {
      toast.push('Informe a empresa.', 'error');
      return;
    }
    const record: ProspectingRecord = {
      ...form,
      id: crypto.randomUUID(),
      at: Date.now(),
      company: form.company.trim(),
    };
    const rows = loadProspectingRecords();
    saveProspectingRecords([record, ...rows]);
    enqueueProspectingSaved({
      company: record.company,
      segment: record.segment,
      source: record.source,
      contactName: record.contactName,
    });
    upsertLocalPipeline({
      id: `local-${record.company.toLowerCase().replace(/\s+/g, '-')}`,
      account: record.company,
      stage: 'Prospecção',
      phase: 'prospecting',
      owner: 'Você',
      value: record.segment || record.volumeMonthly || 'Qualificação',
      docPending: record.contactName ? `Contato: ${record.contactName}` : undefined,
    });
    clearProspectingDraft(scope);
    syncNow();
    toast.push('Prospecção salva e enviada para sync.', 'success');
  };

  return (
    <Card elevated className="form-panel">
      <form className="form-grid" onSubmit={onSubmit}>
        <Field label="Empresa *">
          <input value={form.company} onChange={(e) => set('company', e.target.value)} />
        </Field>
        <Field label="Segmento">
          <input value={form.segment} onChange={(e) => set('segment', e.target.value)} />
        </Field>
        <Field label="Contato">
          <input value={form.contactName} onChange={(e) => set('contactName', e.target.value)} />
        </Field>
        <Field label="Origem">
          <select value={form.source} onChange={(e) => set('source', e.target.value)}>
            {PROSPECTING_SOURCES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Tipos de resíduo">
          <input value={form.wasteTypes} onChange={(e) => set('wasteTypes', e.target.value)} />
        </Field>
        <Field label="Volume mensal (t)">
          <input value={form.volumeMonthly} onChange={(e) => set('volumeMonthly', e.target.value)} />
        </Field>
        <Field label="Dores / urgência">
          <textarea rows={3} value={form.painPoints} onChange={(e) => set('painPoints', e.target.value)} />
        </Field>
        <Field label="Próximo passo">
          <input value={form.nextStep} onChange={(e) => set('nextStep', e.target.value)} />
        </Field>
        <Field label="Data próximo passo">
          <input type="date" value={form.nextDate} onChange={(e) => set('nextDate', e.target.value)} />
        </Field>
        <Button type="submit" variant="primary">Salvar prospecção</Button>
      </form>
    </Card>
  );
}

export function MeetingLogForm() {
  const toast = useToast();
  const { syncNow } = useSync();
  const [params] = useSearchParams();
  const [client, setClient] = useState(params.get('company') ?? '');
  const [notes, setNotes] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [nextDate, setNextDate] = useState('');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!client.trim()) {
      toast.push('Informe o cliente.', 'error');
      return;
    }
    const entry: MeetingLogEntry = {
      id: crypto.randomUUID(),
      at: Date.now(),
      client: client.trim(),
      notes,
      nextAction,
      nextDate,
    };
    saveMeetingLogs([entry, ...loadMeetingLogs()]);
    enqueueMeetingLog({
      client: entry.client,
      notes: entry.notes,
      nextAction: entry.nextAction,
      nextDate: entry.nextDate,
    });
    upsertLocalPipeline({
      id: `local-${client.trim().toLowerCase().replace(/\s+/g, '-')}`,
      account: client.trim(),
      stage: nextAction.trim() || 'Registo de reunião',
      phase: 'prospecting',
      owner: 'Você',
      value: nextDate ? `${nextAction} · ${nextDate}` : nextAction || 'Follow-up',
    });
    syncNow();
    toast.push('Reunião registrada.', 'success');
    setNotes('');
    setNextAction('');
    setNextDate('');
  };

  return (
    <Card elevated className="form-panel">
      <form className="form-grid" onSubmit={onSubmit}>
        <Field label="Cliente *">
          <input value={client} onChange={(e) => setClient(e.target.value)} />
        </Field>
        <Field label="Notas da reunião">
          <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <Field label="Próxima ação">
          <input value={nextAction} onChange={(e) => setNextAction(e.target.value)} />
        </Field>
        <Field label="Data">
          <input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} />
        </Field>
        <Button type="submit" variant="primary">Registrar reunião</Button>
      </form>
    </Card>
  );
}

export function AcceptanceForm() {
  const toast = useToast();
  const { syncNow } = useSync();
  const [params] = useSearchParams();
  const [company, setCompany] = useState(params.get('company') ?? '');
  const [proposalNumber, setProposalNumber] = useState('');
  const [contactName, setContactName] = useState(params.get('contact') ?? '');
  const [acceptedValue, setAcceptedValue] = useState('');
  const [acceptanceType, setAcceptanceType] = useState<string>(ACCEPTANCE_TYPES[0]);
  const [acceptanceDate, setAcceptanceDate] = useState('');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!company.trim()) {
      toast.push('Informe a empresa.', 'error');
      return;
    }
    const record: AcceptanceRecord = {
      id: crypto.randomUUID(),
      at: Date.now(),
      company: company.trim(),
      proposalNumber,
      contactName,
      email: '',
      phone: '',
      acceptedValue,
      scopeSummary: '',
      acceptanceType,
      acceptanceDate,
      docsPending: '',
      sendChannel: '',
      notes: '',
    };
    saveAcceptanceRecords([record, ...loadAcceptanceRecords()]);
    enqueueProposalAccepted({
      company: record.company,
      proposalNumber: record.proposalNumber,
      acceptedValue: record.acceptedValue,
      acceptanceType: record.acceptanceType,
    });
    upsertLocalPipeline({
      id: `local-${company.trim().toLowerCase().replace(/\s+/g, '-')}`,
      account: company.trim(),
      stage: 'Proposta aceita',
      phase: 'acceptance',
      owner: 'Você',
      value: acceptedValue || 'Valor aceite',
    });
    syncNow();
    toast.push('Aceite registrado.', 'success');
  };

  return (
    <Card elevated className="form-panel">
      <form className="form-grid" onSubmit={onSubmit}>
        <Field label="Empresa *">
          <input value={company} onChange={(e) => setCompany(e.target.value)} />
        </Field>
        <Field label="Nº proposta">
          <input value={proposalNumber} onChange={(e) => setProposalNumber(e.target.value)} />
        </Field>
        <Field label="Contato">
          <input value={contactName} onChange={(e) => setContactName(e.target.value)} />
        </Field>
        <Field label="Valor aceito">
          <input value={acceptedValue} onChange={(e) => setAcceptedValue(e.target.value)} placeholder="R$ 4.500/mês" />
        </Field>
        <Field label="Tipo de aceite">
          <select value={acceptanceType} onChange={(e) => setAcceptanceType(e.target.value)}>
            {ACCEPTANCE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Data do aceite">
          <input type="date" value={acceptanceDate} onChange={(e) => setAcceptanceDate(e.target.value)} />
        </Field>
        <Button type="submit" variant="primary">Registrar aceite</Button>
      </form>
    </Card>
  );
}

export function ContractForm() {
  const toast = useToast();
  const { syncNow } = useSync();
  const [company, setCompany] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [service, setService] = useState('');
  const [value, setValue] = useState('');
  const [term, setTerm] = useState('12 meses');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!company.trim()) {
      toast.push('Informe a empresa.', 'error');
      return;
    }
    enqueueContractClosed({
      company: company.trim(),
      cnpj,
      service,
      value,
      term,
    });
    upsertLocalPipeline({
      id: `local-${company.trim().toLowerCase().replace(/\s+/g, '-')}`,
      account: company.trim(),
      stage: 'Contrato fechado',
      phase: 'contract',
      owner: 'Você',
      value: value ? `R$ ${value}/mês · ${term}` : 'Contrato fechado',
      docPending: cnpj ? `CNPJ ${cnpj}` : undefined,
    });
    syncNow();
    toast.push('Contrato registrado no pipeline.', 'success');
  };

  return (
    <Card elevated className="form-panel">
      <form className="form-grid" onSubmit={onSubmit}>
        <Field label="Empresa *">
          <input value={company} onChange={(e) => setCompany(e.target.value)} />
        </Field>
        <Field label="CNPJ">
          <input value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
        </Field>
        <Field label="Serviço">
          <input value={service} onChange={(e) => setService(e.target.value)} />
        </Field>
        <Field label="Valor mensal">
          <input value={value} onChange={(e) => setValue(e.target.value)} />
        </Field>
        <Field label="Prazo">
          <input value={term} onChange={(e) => setTerm(e.target.value)} />
        </Field>
        <Button type="submit" variant="primary">Fechar contrato</Button>
      </form>
    </Card>
  );
}

export function FollowUpForm() {
  const toast = useToast();
  const { syncNow } = useSync();
  const [params] = useSearchParams();
  const [company, setCompany] = useState(params.get('company') ?? '');
  const [contactName, setContactName] = useState(params.get('contact') ?? '');
  const [escopo, setEscopo] = useState('');
  const [passo, setPasso] = useState('');
  const [prazo, setPrazo] = useState('');

  const emailText = useMemo(() => {
    return FOLLOWUP_EMAIL
      .replace('{NOME}', contactName || 'cliente')
      .replace('{ESCOPO}', escopo || '—')
      .replace('{PASSO}', passo || '—')
      .replace('{PRAZO}', prazo || '—')
      .replace('{CONSULTOR}', 'Consultor RG');
  }, [contactName, escopo, passo, prazo]);

  const whatsText = useMemo(() => {
    return FOLLOWUP_WHATSAPP
      .replace('{NOME}', contactName || 'cliente')
      .replace('{EMPRESA}', company || 'empresa')
      .replace('{ESCOPO}', escopo || '—')
      .replace('{PASSO}', passo || '—')
      .replace('{PRAZO}', prazo || '—');
  }, [company, contactName, escopo, passo, prazo]);

  const copy = (text: string, channel: 'email' | 'whatsapp' | 'copy') => {
    navigator.clipboard?.writeText(text);
    enqueueFollowUpSent({ company, contactName, channel, phase: 'proposal' });
    syncNow();
    toast.push('Texto copiado e follow-up registrado.', 'success');
  };

  return (
    <Card elevated className="form-panel">
      <div className="form-grid">
        <Field label="Empresa">
          <input value={company} onChange={(e) => setCompany(e.target.value)} />
        </Field>
        <Field label="Contato">
          <input value={contactName} onChange={(e) => setContactName(e.target.value)} />
        </Field>
        <Field label="Escopo">
          <input value={escopo} onChange={(e) => setEscopo(e.target.value)} />
        </Field>
        <Field label="Próximo passo">
          <input value={passo} onChange={(e) => setPasso(e.target.value)} />
        </Field>
        <Field label="Prazo">
          <input value={prazo} onChange={(e) => setPrazo(e.target.value)} />
        </Field>
        <div className="chip-row">
          <Button variant="secondary" onClick={() => copy(emailText, 'email')}>Copiar e-mail</Button>
          <Button variant="secondary" onClick={() => copy(whatsText, 'whatsapp')}>Copiar WhatsApp</Button>
        </div>
        <pre className="followup-preview">{emailText}</pre>
      </div>
    </Card>
  );
}

export function DocsChecklistForm() {
  const [params] = useSearchParams();
  const clientKey = draftScopeKey(params.get('company') ?? undefined, params.get('stopId') ?? undefined);
  const [checks, setChecks] = useState<Record<string, boolean>>(() => loadDocsChecklist(clientKey));

  const toggle = (id: string) => {
    const next = { ...checks, [id]: !checks[id] };
    setChecks(next);
    saveDocsChecklist(next, clientKey);
  };

  const done = DOCS_CHECKLIST.filter((d) => checks[d.id]).length;

  return (
    <Card elevated>
      <p className="highlight-card__label">{done}/{DOCS_CHECKLIST.length} documentos marcados</p>
      <ul className="checklist">
        {DOCS_CHECKLIST.map((doc) => (
          <li key={doc.id}>
            <label className="checklist__item">
              <input type="checkbox" checked={checks[doc.id] ?? false} onChange={() => toggle(doc.id)} />
              <span>{doc.label}</span>
            </label>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function VisitPlaybookForm() {
  const [params] = useSearchParams();
  const clientKey = draftScopeKey(params.get('company') ?? undefined, params.get('stopId') ?? undefined);
  const [checks, setChecks] = useState<Record<string, boolean>>(() => loadVisitPlaybookChecks(clientKey));

  const toggle = (key: string) => {
    const next = { ...checks, [key]: !checks[key] };
    setChecks(next);
    saveVisitPlaybookChecks(next, clientKey);
  };

  return (
    <div className="stack">
      {VISIT_PLAYBOOK.map((section) => (
        <Card key={section.title} elevated>
          <h3 className="section-title">{section.title}</h3>
          <ul className="checklist">
            {section.bullets.map((b, i) => {
              const key = `${section.title}-${i}`;
              return (
                <li key={key}>
                  <label className="checklist__item">
                    <input type="checkbox" checked={checks[key] ?? false} onChange={() => toggle(key)} />
                    <span>{b}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </Card>
      ))}
    </div>
  );
}

export function CalculatorForm() {
  const [params] = useSearchParams();
  const company = params.get('company') ?? '';
  const [categoryId, setCategoryId] = useState(CALC_CATEGORIES[0].id as string);
  const [tons, setTons] = useState('8');

  const cat = CALC_CATEGORIES.find((c) => c.id === categoryId) ?? CALC_CATEGORIES[0];
  const t = Number(tons) || 0;
  const estimate = Math.round(cat.baseMin + t * cat.perTon);
  const estimateMax = Math.round(cat.baseMax + t * cat.perTon * 1.15);

  return (
    <Card elevated className="form-panel">
      <div className="form-grid">
        <Field label="Segmento">
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {CALC_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Volume (ton/mês)">
          <input type="number" min={0} value={tons} onChange={(e) => setTons(e.target.value)} />
        </Field>
        <div className="calc-result">
          <p className="highlight-card__label">Estimativa mensal</p>
          <p className="calc-result__value">
            R$ {estimate.toLocaleString('pt-BR')} – {estimateMax.toLocaleString('pt-BR')}
          </p>
          <p style={{ color: 'var(--ink-muted)', fontSize: '0.88rem' }}>
            Base {cat.baseMin.toLocaleString('pt-BR')}–{cat.baseMax.toLocaleString('pt-BR')} + ~R$ {cat.perTon}/ton
          </p>
        </div>
        <Link
          to={company ? `/comercial/proposta?company=${encodeURIComponent(company)}` : '/comercial/proposta'}
          className="btn-link">
          <Button variant="primary">Ir para proposta</Button>
        </Link>
      </div>
    </Card>
  );
}

export const COMMERCIAL_FORM_SLUGS = new Set([
  'prospecao',
  'registro-reuniao',
  'aceite',
  'contrato',
  'followup',
  'checklist-docs',
  'roteiro-visita',
  'calculadora',
]);

export function CommercialFormBySlug({ slug }: { slug: string }) {
  switch (slug) {
    case 'prospecao':
      return <ProspectingForm />;
    case 'registro-reuniao':
      return <MeetingLogForm />;
    case 'aceite':
      return <AcceptanceForm />;
    case 'contrato':
      return <ContractForm />;
    case 'followup':
      return <FollowUpForm />;
    case 'checklist-docs':
      return <DocsChecklistForm />;
    case 'roteiro-visita':
      return <VisitPlaybookForm />;
    case 'calculadora':
      return <CalculatorForm />;
    default:
      return null;
  }
}
