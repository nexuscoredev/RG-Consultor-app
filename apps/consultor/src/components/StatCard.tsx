import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { AppIcon, type IconName } from './AppIcon';
import { Button } from './Button';

type Props = {
  title: string;
  value: string;
  hint?: string;
  icon?: IconName;
  to?: string;
  actionLabel?: string;
  accent?: 'forest' | 'lime' | 'neutral';
  children?: ReactNode;
};

export function StatCard({
  title,
  value,
  hint,
  icon,
  to,
  actionLabel,
  accent = 'neutral',
  children,
}: Props) {
  return (
    <article className={`stat-card stat-card--${accent}`}>
      <div className="stat-card__head">
        {icon ? (
          <span className="stat-card__icon">
            <AppIcon name={icon} size={22} />
          </span>
        ) : null}
        <div>
          <p className="stat-card__title">{title}</p>
          <p className="stat-card__value">{value}</p>
          {hint ? <p className="stat-card__hint">{hint}</p> : null}
        </div>
      </div>
      {children}
      {to && actionLabel ? (
        <Link to={to} className="stat-card__action">
          <Button variant={accent === 'forest' ? 'secondary' : accent === 'lime' ? 'secondary' : 'primary'} fullWidth>
            {actionLabel}
          </Button>
        </Link>
      ) : null}
    </article>
  );
}
