import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { BackLink } from '@/components/BackLink';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { useToast } from '@/context/ToastContext';
import { useSync } from '@/context/SyncContext';
import { enqueueProposalSent } from '@/lib/outbox';
import { upsertLocalPipeline } from '@/lib/pipelineStore';

function buildProposalHtml(opts: {
  company: string;
  clientName: string;
  scope: string;
  value: string;
  proposalNumber: string;
  issued: string;
}) {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Proposta ${opts.proposalNumber}</title>
<style>
  body{font-family:'Segoe UI',system-ui,sans-serif;padding:48px;color:#111827;max-width:800px;margin:0 auto}
  .head{border-bottom:3px solid #047857;padding-bottom:20px;margin-bottom:28px;display:flex;align-items:center;gap:16px}
  .logo{height:48px;width:auto}
  h1{color:#065f46;margin:0 0 8px;font-size:1.6rem}
  .meta{color:#6b7280;font-size:0.95rem}
  .block{margin:20px 0;padding:16px 18px;background:#f0fdf4;border-radius:12px;border:1px solid rgba(4,120,87,.15)}
  .label{font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#047857}
  p{margin:6px 0 0;line-height:1.5}
  footer{margin-top:40px;font-size:.85rem;color:#6b7280}
</style></head><body>
<div class="head">
  <img class="logo" src="/images/rg-ambiental-logo.png" alt="RG Ambiental" />
  <div>
  <h1>Proposta Comercial</h1>
  <p class="meta">RG Ambiental · Nº ${opts.proposalNumber} · ${opts.issued}</p>
  </div>
</div>
<div class="block"><p class="label">Cliente</p><p><strong>${opts.company}</strong></p><p>${opts.clientName}</p></div>
<div class="block"><p class="label">Escopo</p><p>${opts.scope}</p></div>
<div class="block"><p class="label">Investimento</p><p><strong>${opts.value}</strong></p></div>
<footer>Validade: 15 dias · Documentação conforme legislação vigente · RG Ambiental</footer>
</body></html>`;
}

export function ProposalPage() {
  const toast = useToast();
  const { syncNow } = useSync();
  const [params] = useSearchParams();
  const [company, setCompany] = useState(params.get('company') ?? '');
  const [clientName, setClientName] = useState('');
  const [scope, setScope] = useState('');
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);

  const onGenerate = async () => {
    if (!company.trim() || !clientName.trim()) {
      toast.push('Preencha empresa e contato.', 'error');
      return;
    }
    setBusy(true);
    try {
      const num = `RG-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
      const issued = new Date().toLocaleDateString('pt-BR');
      const html = buildProposalHtml({
        company: company.trim(),
        clientName: clientName.trim(),
        scope: scope.trim() || 'Gestão de resíduos, MTR e conformidade ambiental',
        value: value.trim() || 'A combinar',
        proposalNumber: num,
        issued,
      });
      const w = window.open('', '_blank');
      if (!w) {
        toast.push('Permita pop-ups para gerar o PDF.', 'error');
        return;
      }
      w.document.write(html);
      w.document.close();
      w.focus();
      setTimeout(() => w.print(), 350);

      upsertLocalPipeline({
        id: `local-${company.trim().toLowerCase().replace(/\s+/g, '-')}`,
        account: company.trim(),
        stage: 'Proposta enviada',
        phase: 'proposal',
        owner: 'Você',
        value: value.trim() || 'Proposta gerada',
      });
      enqueueProposalSent({
        company: company.trim(),
        clientName: clientName.trim(),
        value: value.trim() || 'A combinar',
        proposalNumber: num,
        scope: scope.trim(),
      });
      syncNow();
      toast.push(`Proposta ${num} gerada — use Imprimir → Salvar como PDF.`, 'success');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <BackLink to="/comercial" label="Voltar ao funil" />

      <PageHeader
        eyebrow="Fase 2"
        title="Proposta comercial"
        subtitle="Preencha os dados e exporte via impressão do navegador (PDF)."
      />

      <Card elevated className="form-panel">
        <div className="form-grid">
          <div className="field">
            <label htmlFor="company">Empresa *</label>
            <input id="company" value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="client">Contato *</label>
            <input id="client" value={clientName} onChange={(e) => setClientName(e.target.value)} />
          </div>
          <div className="field field--full">
            <label htmlFor="scope">Escopo</label>
            <textarea id="scope" rows={4} value={scope} onChange={(e) => setScope(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="value">Valor</label>
            <input id="value" value={value} onChange={(e) => setValue(e.target.value)} placeholder="R$ 4.500/mês" />
          </div>
          <Button variant="primary" fullWidth disabled={busy} onClick={onGenerate}>
            {busy ? 'Gerando…' : 'Gerar e imprimir PDF'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
