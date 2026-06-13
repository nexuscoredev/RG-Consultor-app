import { Link } from 'react-router-dom';

import { apiConfigLabel, isApiEnabled } from '@/lib/apiConfig';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { RgLogo } from '@/components/RgLogo';
import { useAuth } from '@/context/AuthContext';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { useToast } from '@/context/ToastContext';
import { useSync } from '@/context/SyncContext';
import { syncEvents } from '@/lib/api';
import { listOutboxForUi } from '@/lib/outbox';

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const toast = useToast();
  const { pending, failed, syncNow, retryFailed } = useSync();
  const outbox = listOutboxForUi(8);

  const testSync = async () => {
    try {
      await syncEvents([]);
      toast.push('Conexão com API verificada.', 'success');
    } catch (e) {
      toast.push(e instanceof Error ? e.message : 'Falha ao contactar API', 'error');
    }
  };

  return (
    <div className="page">
      <PageHeader eyebrow="Conta" title="Configurações" subtitle="Perfil, conexão com API e informações do sistema." />

      <Card elevated className="card--accent settings-brand-card">
        <RgLogo variant="hero" subtitle="Sistema web para consultores" className="settings-hero-logo" />
      </Card>

      <Card>
        <h3 className="section-title">Perfil</h3>
        <p style={{ margin: 0, fontWeight: 700 }}>{user?.displayName}</p>
        <p style={{ margin: '4px 0 0', color: 'var(--ink-muted)' }}>{user?.email}</p>
        <p style={{ margin: '8px 0 0', fontSize: '0.9rem' }}>Região: {user?.region}</p>
        {user?.role === 'master' ? (
          <Link to="/master" className="chip" style={{ marginTop: 12 }}>
            Painel master
          </Link>
        ) : null}
      </Card>

      <Card>
        <h3 className="section-title">Aparência</h3>
        <p style={{ margin: '0 0 12px', color: 'var(--ink-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
          Tema claro, escuro ou automático conforme o dispositivo.
        </p>
        <ThemeSwitcher />
      </Card>

      <Card>
        <h3 className="section-title">Sync e outbox</h3>
        <p style={{ margin: 0 }}>
          {pending} pendente(s) · {failed} falha(s)
        </p>
        <div className="chip-row" style={{ marginTop: 12 }}>
          <Button variant="secondary" onClick={() => syncNow()}>Sincronizar agora</Button>
          {failed > 0 ? (
            <Button variant="ghost" onClick={() => retryFailed()}>Reenviar falhas</Button>
          ) : null}
        </div>
        {outbox.length > 0 ? (
          <ul className="outbox-list">
            {outbox.map((row) => (
              <li key={row.id}>
                <span className="outbox-list__type">{row.type}</span>
                <span className="outbox-list__status">{row.status}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </Card>

      <Card>
        <h3 className="section-title">API</h3>
        <p style={{ margin: 0 }}>{apiConfigLabel()}</p>
        <p style={{ margin: '8px 0 0', fontSize: '0.9rem', color: 'var(--ink-muted)', lineHeight: 1.5 }}>
          {isApiEnabled()
            ? 'Rota, pipeline e clientes vêm do servidor. Mantenha a API rodando com npm run api.'
            : 'Modo demonstração — dados mockados no navegador (localStorage).'}
        </p>
        {isApiEnabled() ? (
          <Button variant="secondary" style={{ marginTop: 12 }} onClick={testSync}>
            Testar API
          </Button>
        ) : null}
      </Card>

      <Card>
        <h3 className="section-title">Atalhos</h3>
        <div className="chip-row">
          <Link to="/comercial" className="chip">Comercial</Link>
          <Link to="/agenda" className="chip">Agenda</Link>
          <Link to="/comercial/pipeline" className="chip">Pipeline</Link>
          <Link to="/comercial/visita" className="chip">Modo visita</Link>
        </div>
      </Card>

      <Button variant="ghost" onClick={signOut}>Sair da conta</Button>
    </div>
  );
}
