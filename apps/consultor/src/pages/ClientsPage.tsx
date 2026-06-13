import { useEffect, useState, type FormEvent } from 'react';

import { BackLink } from '@/components/BackLink';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { LoadingBlock } from '@/components/LoadingBlock';
import { PageHeader } from '@/components/PageHeader';
import { useToast } from '@/context/ToastContext';
import { useSync } from '@/context/SyncContext';
import { fetchClients, type ClientRow } from '@/lib/api';
import { enqueueClientSaved } from '@/lib/outbox';
import { upsertLocalPipeline } from '@/lib/pipelineStore';
import { getJson, setJson } from '@/lib/storage';

const LOCAL_KEY = 'rg_clients_local';

export function ClientsPage() {
  const toast = useToast();
  const { syncNow } = useSync();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [company, setCompany] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    const [api, local] = await Promise.all([
      fetchClients().catch(() => []),
      Promise.resolve(getJson<ClientRow[]>(LOCAL_KEY, [])),
    ]);
    const merged = [...local, ...api.filter((a) => !local.some((l) => l.company === a.company))];
    setClients(merged);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await reload();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const addClient = (e?: FormEvent) => {
    e?.preventDefault();
    if (!company.trim()) {
      toast.push('Informe o nome da empresa.', 'error');
      return;
    }
    const row: ClientRow = {
      id: crypto.randomUUID(),
      company: company.trim(),
      contact: contact.trim() || undefined,
      updatedAt: Date.now(),
    };
    const local = getJson<ClientRow[]>(LOCAL_KEY, []);
    setJson(LOCAL_KEY, [row, ...local]);
    setClients((prev) => [row, ...prev]);
    enqueueClientSaved({
      id: row.id,
      company: row.company,
      contactName: row.contact ?? '',
      segment: row.segment,
    });
    upsertLocalPipeline({
      id: `local-${row.company.toLowerCase().replace(/\s+/g, '-')}`,
      account: row.company,
      stage: 'Prospecção',
      phase: 'prospecting',
      owner: 'Você',
      value: 'Cliente cadastrado',
      docPending: row.contact ? `Contato: ${row.contact}` : undefined,
    });
    syncNow();
    setCompany('');
    setContact('');
    toast.push(`${row.company} cadastrado com sucesso.`, 'success');
  };

  return (
    <div className="page">
      <BackLink to="/comercial" label="Voltar ao funil" />

      <PageHeader
        eyebrow="Base comercial"
        title="Clientes"
        subtitle="Cadastro local no navegador, mesclado com clientes da API quando disponível."
      />

      <Card elevated className="form-panel">
        <h3 className="section-title">Novo cliente</h3>
        <form className="form-grid" onSubmit={addClient}>
          <div className="field">
            <label htmlFor="company">Empresa *</label>
            <input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Ex.: Metalúrgica Horizonte"
            />
          </div>
          <div className="field">
            <label htmlFor="contact">Contato</label>
            <input
              id="contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Nome do decisor"
            />
          </div>
          <Button type="submit" variant="primary">
            Salvar cliente
          </Button>
        </form>
      </Card>

      {loading ? (
        <LoadingBlock label="Carregando clientes…" />
      ) : clients.length === 0 ? (
        <Card elevated>
          <EmptyState
            lottie="search"
            title="Nenhum cliente ainda"
            description="Cadastre empresas que você visita ou prospecta para retomar o contexto no funil."
          />
        </Card>
      ) : (
        <div className="client-grid">
          {clients.map((c) => (
            <article key={c.id} className="client-card">
              <div className="client-card__avatar" aria-hidden>
                {c.company.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="client-card__name">{c.company}</h3>
                {c.contact ? <p className="client-card__meta">{c.contact}</p> : null}
                {c.segment ? <span className="client-card__tag">{c.segment}</span> : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
