import { CONTRACT_KIT_SECTIONS, INTENT_TERM_POINTS } from '@/lib/commercialContent';
import { RG_COMPANY } from '@/lib/proposalTemplate';

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br/>');
}

const PDF_BASE_STYLE = `
  @page { margin: 18mm 14mm; }
  body{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;padding:0;color:#0f172a;line-height:1.5;font-size:13px}
  .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #008D4C;padding-bottom:14px;margin-bottom:18px}
  .brand{font-size:20px;font-weight:800;color:#14532d;margin:0}
  .brand-sub{font-size:11px;color:#64748b;margin-top:2px}
  .meta{text-align:right;font-size:11px;color:#64748b}
  .meta strong{color:#14532d;font-size:13px}
  h1{font-size:18px;color:#14532d;margin:0 0 6px;font-weight:800}
  .muted{color:#64748b;font-size:12px}
  .box{border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-top:12px}
  h2{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#14532d;margin:0 0 8px;font-weight:800}
  .footer{margin-top:28px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b}
  .legal{font-size:10px;color:#94a3b8;margin-top:8px;line-height:1.4}
  ul{margin:0;padding-left:18px;font-size:12px;color:#334155}
`;

export type IntentTermPdfInput = {
  company: string;
  contact: string;
  scope: string;
  validityDays: string;
  issued: string;
};

export function buildIntentTermHtml(input: IntentTermPdfInput): string {
  const C = RG_COMPANY;
  const bullets = INTENT_TERM_POINTS.map((line) => `<li>${escHtml(line.replace(/\*/g, ''))}</li>`).join('');
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"/>
<style>${PDF_BASE_STYLE}</style></head><body>
  <div class="header">
    <div>
      <div class="brand">${escHtml(C.brand)}</div>
      <div class="brand-sub">Termo de intenção comercial</div>
    </div>
    <div class="meta">
      <div><strong>Emitido em ${escHtml(input.issued)}</strong></div>
      <div>Vigência da intenção: ${escHtml(input.validityDays || '30')} dias</div>
    </div>
  </div>
  <h1>Termo de intenção de negócio</h1>
  <p class="muted">Documento de alinhamento pré-contratual. Não substitui contrato assinado — validar com jurídico.</p>
  <div class="box"><h2>Partes</h2>
    <p><strong>Proponente:</strong> ${escHtml(C.legalName)} · CNPJ ${escHtml(C.cnpj)}</p>
    <p><strong>Cliente:</strong> ${escHtml(input.company)}</p>
    <p><strong>Contacto:</strong> ${escHtml(input.contact || '—')}</p>
  </div>
  <div class="box"><h2>Objeto resumido</h2><p>${escHtml(input.scope || 'Gerenciamento de resíduos e conformidade ambiental conforme diagnóstico em campo.')}</p></div>
  <div class="box"><h2>Orientações</h2><ul>${bullets}</ul></div>
  <div class="box"><h2>Assinaturas</h2>
    <p class="muted">Espaço para assinatura das partes após validação jurídica.</p>
    <br/><br/>
    <p>_______________________________________<br/>${escHtml(C.brand)}</p>
    <br/>
    <p>_______________________________________<br/>${escHtml(input.company)}</p>
  </div>
  <div class="footer">
    <strong>${escHtml(C.brand)}</strong> · ${escHtml(C.site)}<br/>
    CNPJ ${escHtml(C.cnpj)} · ${escHtml(C.address)}
    <p class="legal">Template interno (demonstração). Revise cláusulas com jurídico antes de uso com clientes.</p>
  </div>
</body></html>`;
}

export type ContractPdfInput = {
  account: string;
  cnpj: string;
  service: string;
  volume: string;
  value: string;
  term: string;
  issued: string;
};

export function buildContractHtml(input: ContractPdfInput): string {
  const C = RG_COMPANY;
  const sections = CONTRACT_KIT_SECTIONS.map(
    (sec) =>
      `<div class="box"><h2>${escHtml(sec.title)}</h2><ul>${sec.bullets.map((b) => `<li>${escHtml(b)}</li>`).join('')}</ul></div>`,
  ).join('');
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"/>
<style>${PDF_BASE_STYLE}</style></head><body>
  <div class="header">
    <div>
      <div class="brand">${escHtml(C.brand)}</div>
      <div class="brand-sub">Minuta de contrato de prestação de serviços</div>
    </div>
    <div class="meta"><div><strong>Emitido em ${escHtml(input.issued)}</strong></div></div>
  </div>
  <h1>Contrato de gerenciamento de resíduos</h1>
  <p class="muted">Minuta gerada pelo RG Consultor. Sujeita a revisão jurídica e aprovação financeira.</p>
  <div class="box"><h2>Contratante</h2>
    <p><strong>Razão social:</strong> ${escHtml(input.account)}</p>
    <p><strong>CNPJ:</strong> ${escHtml(input.cnpj || '—')}</p>
  </div>
  <div class="box"><h2>Contratada</h2>
    <p>${escHtml(C.legalName)} · CNPJ ${escHtml(C.cnpj)}</p>
    <p>${escHtml(C.address)}</p>
  </div>
  <div class="box"><h2>Objeto e condições comerciais</h2>
    <p><strong>Serviço:</strong> ${escHtml(input.service)}</p>
    <p><strong>Volume estimado:</strong> ${escHtml(input.volume || 'Conforme diagnóstico')}</p>
    <p><strong>Investimento:</strong> R$ ${escHtml(input.value || '—')}/mês</p>
    <p><strong>Vigência:</strong> ${escHtml(input.term || '12 meses')}</p>
  </div>
  ${sections}
  <div class="footer">
    <strong>${escHtml(C.brand)}</strong> · ${escHtml(C.site)}
    <p class="legal">Minuta comercial interna (demonstração). Não constitui contrato válido até assinatura e registo jurídico.</p>
  </div>
</body></html>`;
}
