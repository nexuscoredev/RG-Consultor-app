import { useState, type FormEvent } from 'react';
import { Navigate, Link } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { RgLogo } from '@/components/RgLogo';
import { useAuth } from '@/context/AuthContext';
import { authHint } from '@/lib/auth';
import { getApiBaseUrl, isApiEnabled } from '@/lib/apiConfig';

export function LoginPage() {
  const { signIn, token, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && token) return <Navigate to="/" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no login');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-page__brand" aria-hidden={false}>
        <RgLogo variant="hero" subtitle="Gestão de visitas e ciclo comercial" />
        <div>
          <h1 className="login-page__brand-title">Consultoria de campo, com método.</h1>
          <p className="login-page__brand-copy">
            Agenda, funil comercial, propostas e pipeline — otimizado para tablet e celular no navegador.
          </p>
        </div>
        <ul className="login-page__brand-list">
          <li>Rota do dia e paradas no mapa</li>
          <li>Kit comercial em 4 fases</li>
          <li>Propostas e pipeline sincronizados</li>
        </ul>
      </section>

      <div className="login-page__form-wrap">
        <Card elevated className="login-card glass-panel">
          <RgLogo variant="compact" subtitle="Acesse sua conta" className="login-card__logo" />

          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vendedor@rg.com"
              />
            </div>
            <div className="field">
              <label htmlFor="password">Senha</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error ? <div className="banner banner--error">{error}</div> : null}
            <Button type="submit" variant="primary" fullWidth disabled={busy}>
              {busy ? 'Entrando…' : 'Entrar no sistema'}
            </Button>
          </form>

          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink-muted)', textAlign: 'center' }}>
            {authHint()}
          </p>
          {isApiEnabled() ? (
            <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: 'var(--ink-faint)', textAlign: 'center' }}>
              Servidor: {getApiBaseUrl()}
            </p>
          ) : null}
          <p style={{ margin: '12px 0 0', fontSize: '0.85rem', textAlign: 'center' }}>
            <Link to="/instalar" className="install-link">Instalar no tablet ou celular</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
