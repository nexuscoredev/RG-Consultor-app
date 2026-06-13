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
      <section className="login-page__brand" aria-label="RG Ambiental Consultor">
        <div className="login-page__brand-inner">
          <span className="login-page__eyebrow">Consultor de campo</span>
          <RgLogo variant="hero" subtitle="Gestão de visitas e ciclo comercial" />
          <div className="login-page__brand-copy-block">
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
        </div>
      </section>

      <div className="login-page__form-wrap">
        <div className="login-page__form-inner">
          <header className="login-page__mobile-brand">
            <RgLogo variant="wordmark" subtitle="Consultor de campo" />
          </header>

          <Card elevated className="login-card glass-panel">
            <header className="login-card__head">
              <RgLogo variant="compact" subtitle="Acesse sua conta" className="login-card__logo" />
            </header>

            <form className="login-card__form" onSubmit={onSubmit}>
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
                  placeholder="••••••••"
                />
              </div>
              {error ? <div className="banner banner--error">{error}</div> : null}
              <Button type="submit" variant="primary" fullWidth disabled={busy}>
                {busy ? 'Entrando…' : 'Entrar no sistema'}
              </Button>
            </form>

            <footer className="login-card__foot">
              <p className="login-card__hint">{authHint()}</p>
              {isApiEnabled() ? (
                <p className="login-card__meta">Servidor: {getApiBaseUrl()}</p>
              ) : null}
              <Link to="/instalar" className="login-card__install">
                Instalar no tablet ou celular
              </Link>
            </footer>
          </Card>
        </div>
      </div>
    </div>
  );
}
