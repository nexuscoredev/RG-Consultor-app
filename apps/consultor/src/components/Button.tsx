import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  fullWidth?: boolean;
  children: ReactNode;
};

export function Button({ variant = 'primary', fullWidth, className = '', children, ...rest }: Props) {
  return (
    <button
      type="button"
      className={`btn btn--${variant}${fullWidth ? ' btn--full' : ''} ${className}`.trim()}
      {...rest}>
      {children}
    </button>
  );
}
