import { NavLink, Outlet } from 'react-router-dom';

import { CommandPalette } from '@/components/CommandPalette';
import { NavIcon } from '@/components/NavIcon';
import { QuickActionsFab } from '@/components/QuickActionsFab';
import { SyncBanner } from '@/components/SyncBanner';
import { RgLogo } from '@/components/RgLogo';
import { Button } from '@/components/Button';
import { AppIcon } from '@/components/AppIcon';
import { useAuth } from '@/context/AuthContext';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { useTabletLayout } from '@/hooks/useTabletLayout';
import { apiConfigLabel } from '@/lib/apiConfig';

const NAV = [
  { to: '/', label: 'Início', icon: 'home' as const },
  { to: '/agenda', label: 'Agenda', icon: 'agenda' as const },
  { to: '/comercial', label: 'Comercial', icon: 'comercial' as const },
  { to: '/configuracoes', label: 'Mais', icon: 'settings' as const },
] as const;

function userInitial(name?: string, email?: string): string {
  const src = name ?? email ?? '?';
  return src.trim().charAt(0).toUpperCase();
}

export function AppShell() {
  const { user, signOut } = useAuth();
  const initial = userInitial(user?.displayName, user?.email);
  const palette = useCommandPalette();
  const tablet = useTabletLayout();

  return (
    <div
      className="app-shell"
      data-tablet={tablet.isTablet ? 'true' : 'false'}
      data-wide={tablet.isWide ? 'true' : 'false'}>
      <header className="app-shell__topbar">
        <RgLogo variant="compact" subtitle="Campo comercial" />
        <div className="app-shell__topbar-actions">
          <button
            type="button"
            className="cmd-trigger"
            onClick={palette.openPalette}
            aria-label="Busca rápida (Ctrl+K)">
            <AppIcon name="search" size={18} />
            <span className="cmd-trigger__label">Buscar</span>
            <kbd className="cmd-trigger__kbd">⌘K</kbd>
          </button>
          <span className="app-shell__topbar-user" title={user?.displayName ?? user?.email}>
            {initial}
          </span>
        </div>
      </header>

      <div className="app-shell__body">
        <aside className="app-shell__sidebar">
          <RgLogo variant="sidebar" subtitle="Campo comercial inteligente" className="rg-logo--shell" />
          <nav aria-label="Menu principal">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `app-shell__nav-link${isActive ? ' app-shell__nav-link--active' : ''}`
                }>
                <NavIcon name={item.icon} />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="app-shell__sidebar-foot">
            <span className="app-shell__sidebar-name">{user?.displayName ?? user?.email}</span>
            <span>{apiConfigLabel()}</span>
            <Button variant="ghost" fullWidth onClick={signOut}>
              Sair
            </Button>
          </div>
        </aside>

        <main
          className="app-shell__main"
          style={{
            paddingLeft: tablet.isTablet ? tablet.horizontalPadding : undefined,
            paddingRight: tablet.isTablet ? tablet.horizontalPadding : undefined,
            maxWidth: tablet.isWide ? tablet.contentMaxWidth + tablet.horizontalPadding * 2 : undefined,
            marginInline: tablet.isWide ? 'auto' : undefined,
          }}>
          <SyncBanner />
          <Outlet />
        </main>
      </div>

      <QuickActionsFab />

      <CommandPalette
        open={palette.open}
        query={palette.query}
        results={palette.results}
        onQueryChange={palette.setQuery}
        onClose={palette.close}
        onSelect={palette.select}
      />

      <nav className="app-shell__bottom-nav" aria-label="Navegação principal">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `app-shell__bottom-link${isActive ? ' app-shell__bottom-link--active' : ''}`
            }>
            <NavIcon name={item.icon} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
