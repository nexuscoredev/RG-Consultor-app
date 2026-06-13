import type { ReactNode } from 'react';

import { LottieEmpty } from './LottieEmpty';
import { Button } from './Button';

type Props = {
  title: string;
  description: string;
  icon?: ReactNode;
  lottie?: 'box' | 'search';
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, description, icon, lottie, actionLabel, onAction }: Props) {
  const visual = lottie ? <LottieEmpty variant={lottie} /> : icon ? <div className="empty-state__icon">{icon}</div> : null;

  return (
    <div className="empty-state">
      {visual}
      <h3 className="empty-state__title">{title}</h3>
      <p className="empty-state__desc">{description}</p>
      {actionLabel && onAction ? (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
