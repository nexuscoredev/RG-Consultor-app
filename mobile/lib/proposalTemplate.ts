/** Dados institucionais e HTML da proposta comercial (template aprovado — demo). */

export const RG_COMPANY = {
  legalName: 'RG Ambiental Ltda.',
  brand: 'RG Ambiental',
  cnpj: '12.345.678/0001-90',
  address: 'Av. Exemplo, 1000 — São Paulo/SP',
  email: 'comercial@rgambiental.com.br',
  phone: '(11) 3000-0000',
  site: 'www.rgambiental.com.br',
} as const;

const PROPOSAL_SEQ_KEY = 'rg_proposal_seq_v1';

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br/>');
}

function pad(n: number, len: number): string {
  return String(n).padStart(len, '0');
}

/** Número sequencial local (demo) — em produção virá do CRM. */
export async function nextProposalNumber(): Promise<string> {
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  const raw = await AsyncStorage.getItem(PROPOSAL_SEQ_KEY);
  const seq = raw ? parseInt(raw, 10) + 1 : 1;
  await AsyncStorage.setItem(PROPOSAL_SEQ_KEY, String(seq));
  const d = new Date();
  const ymd = `${d.getFullYear()}${pad(d.getMonth() + 1, 2)}${pad(d.getDate(), 2)}`;
  return `RG-${ymd}-${pad(seq, 4)}`;
}

export type ProposalPdfInput = {
  proposalNumber: string;
  issued: string;
  clientName: string;
  company: string;
  email: string;
  scope: string;
  value: string;
  validityDays: string;
};

export function buildProposalHtml(input: ProposalPdfInput): string {
  const C = RG_COMPANY;
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"/>
<style>
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
  td{padding:5px 0;vertical-align:top;font-size:13px}
  .k{width:130px;color:#64748b;font-size:12px}
  .footer{margin-top:28px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b}
  .logo-mark{width:48px;height:48px;border-radius:10px;background:linear-gradient(135deg,#008D4C,#8DC63F);display:inline-block;margin-right:10px;vertical-align:middle}
  .legal{font-size:10px;color:#94a3b8;margin-top:8px;line-height:1.4}
</style></head><body>
  <div class="header">
    <div>
      <span class="logo-mark"></span>
      <span class="brand">${escHtml(C.brand)}</span>
      <div class="brand-sub">Gerenciamento de resíduos e conformidade ambiental</div>
    </div>
    <div class="meta">
      <div><strong>Proposta nº ${escHtml(input.proposalNumber)}</strong></div>
      <div>Emitida em ${escHtml(input.issued)}</div>
      <div>Validade: ${escHtml(input.validityDays || '15')} dias úteis</div>
    </div>
  </div>

  <h1>Proposta comercial</h1>
  <p class="muted">Documento gerado pelo RG Consultor. Revise com o comercial antes do envio ao cliente.</p>

  <div class="box"><h2>Dados do proponente</h2>
  <table width="100%">
    <tr><td class="k">Razão social</td><td>${escHtml(C.legalName)}</td></tr>
    <tr><td class="k">CNPJ</td><td>${escHtml(C.cnpj)}</td></tr>
    <tr><td class="k">Endereço</td><td>${escHtml(C.address)}</td></tr>
    <tr><td class="k">Contato</td><td>${escHtml(C.email)} · ${escHtml(C.phone)}</td></tr>
  </table></div>

  <div class="box"><h2>Cliente</h2>
  <table width="100%">
    <tr><td class="k">Empresa</td><td>${escHtml(input.company)}</td></tr>
    <tr><td class="k">Contato</td><td>${escHtml(input.clientName)}</td></tr>
    <tr><td class="k">E-mail</td><td>${escHtml(input.email || '—')}</td></tr>
  </table></div>

  <div class="box"><h2>Escopo proposto</h2><p>${escHtml(input.scope || 'A definir com o consultor após diagnóstico em campo.')}</p></div>

  <div class="box"><h2>Investimento estimado</h2>
  <p><strong>${escHtml(input.value || 'A proposta comercial')}</strong></p>
  <p class="muted">Valores sujeitos a contrato formal, visita técnica e condições de pagamento aprovadas pela financeira.</p></div>

  <div class="box"><h2>Condições gerais</h2>
  <ul style="margin:0;padding-left:18px;font-size:12px;color:#334155">
    <li>Escopo, SLA de coleta e documentação conforme contrato-padrão RG Ambiental.</li>
    <li>MTR, certificados de destinação e rastreabilidade conforme legislação vigente.</li>
    <li>Proposta válida pelo prazo indicado; renovação automática não se aplica.</li>
  </ul></div>

  <div class="footer">
    <strong>${escHtml(C.brand)}</strong> · ${escHtml(C.site)}<br/>
    CNPJ ${escHtml(C.cnpj)} · ${escHtml(C.address)}
    <p class="legal">Template comercial interno (demonstração). Valide dados cadastrais e cláusulas com jurídico antes de uso em produção.</p>
  </div>
</body></html>`;
}

export function buildProposalWhatsAppSummary(input: {
  proposalNumber: string;
  company: string;
  clientName: string;
  value: string;
  validityDays: string;
}): string {
  return `Olá ${input.clientName}! Segue a proposta comercial RG Ambiental (${input.proposalNumber}) para ${input.company}.

Investimento estimado: ${input.value || 'conforme PDF anexo'}.
Validade: ${input.validityDays || '15'} dias úteis.

Envio o PDF em anexo. Posso esclarecer algum ponto?`;
}

export function whatsAppUrl(text: string, phoneE164?: string): string {
  const enc = encodeURIComponent(text);
  if (phoneE164?.replace(/\D/g, '')) {
    const digits = phoneE164.replace(/\D/g, '');
    return `https://wa.me/${digits}?text=${enc}`;
  }
  return `https://wa.me/?text=${enc}`;
}
