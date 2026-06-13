import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
  elevated?: boolean;
};

export function Card({ children, className = '', elevated }: Props) {
  return <div className={`card${elevated ? ' card--elevated' : ''} ${className}`.trim()}>{children}</div>;
}
