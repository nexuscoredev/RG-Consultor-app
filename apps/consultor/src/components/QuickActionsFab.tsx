import { Link, useLocation } from 'react-router-dom';

import { AppIcon } from '@/components/AppIcon';

const ACTIONS = [
  { to: '/comercial/proposta', label: 'Proposta', icon: 'file' as const },
  { to: '/agenda', label: 'Agenda', icon: 'map' as const },
  { to: '/comercial/clientes', label: 'Cliente', icon: 'users' as const },
] as const;

export function QuickActionsFab() {
  const { pathname } = useLocation();
  if (pathname === '/login') return null;

  return (
    <div className="quick-fab" aria-label="Ações rápidas">
      {ACTIONS.map((a) => (
        <Link key={a.to} to={a.to} className="quick-fab__btn" title={a.label}>
          <AppIcon name={a.icon} size={18} />
          <span className="quick-fab__label">{a.label}</span>
        </Link>
      ))}
    </div>
  );
}
