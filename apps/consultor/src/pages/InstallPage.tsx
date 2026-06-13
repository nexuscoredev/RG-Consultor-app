import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { RgLogo } from '@/components/RgLogo';
import { getApiBaseUrl } from '@/lib/apiConfig';

export function InstallPage() {
  const appUrl = useMemo(() => window.location.origin, []);
  const apiUrl = useMemo(() => getApiBaseUrl(), []);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard?.writeText(appUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page install-page">
      <RgLogo variant="hero" subtitle="Instalar no tablet ou celular" />

      <PageHeader
        title="Link de instalação"
        subtitle="Tablet e celular devem estar na mesma rede Wi‑Fi que este computador."
      />

      <Card elevated className="install-page__link-card">
        <p className="highlight-card__label">Abra este link no tablet</p>
        <p className="install-page__url">{appUrl}</p>
        <div className="chip-row">
          <Button variant="primary" onClick={() => copy()}>
            {copied ? 'Copiado!' : 'Copiar link'}
          </Button>
          <a href={appUrl} className="btn-link">
            <Button variant="secondary">Abrir app</Button>
          </a>
        </div>
      </Card>

      <Card>
        <h3 className="section-title">API (login real)</h3>
        <p style={{ margin: 0, color: 'var(--ink-muted)', lineHeight: 1.5 }}>
          Com <code>npm run dev</code> na raiz, a API fica em{' '}
          <strong>{apiUrl}</strong> quando você abre o app pelo IP da rede.
        </p>
        <p style={{ margin: '12px 0 0', color: 'var(--ink-muted)', fontSize: '0.9rem' }}>
          Login demo: <strong>vendedor@rg.com</strong> / <strong>rg2026</strong>
        </p>
      </Card>

      <Card>
        <h3 className="section-title">Android (Chrome)</h3>
        <ol className="install-steps">
          <li>Abra o link no Chrome.</li>
          <li>Menu ⋮ → <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong>.</li>
          <li>Confirme — o ícone RG aparece como app.</li>
        </ol>
      </Card>

      <Card>
        <h3 className="section-title">iPad / iPhone (Safari)</h3>
        <ol className="install-steps">
          <li>Abra o link no Safari (não no Chrome).</li>
          <li>Compartilhar → <strong>Adicionar à Tela de Início</strong>.</li>
          <li>Confirme — abre em modo app sem barra do browser.</li>
        </ol>
      </Card>

      <p className="install-page__foot">
        No PC: <code>npm run dev</code> ou <code>npm run dev:clean</code> · Firewall Windows pode pedir permissão na porta 5173.
      </p>

      <Link to="/login" className="chip">Ir para login</Link>
    </div>
  );
}
