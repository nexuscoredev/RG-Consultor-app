import { Link } from 'react-router-dom';

type Props = {
  to: string;
  label?: string;
};

export function BackLink({ to, label = 'Voltar' }: Props) {
  return (
    <Link to={to} className="back-link">
      <span aria-hidden>←</span>
      {label}
    </Link>
  );
}
