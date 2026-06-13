type Props = {
  lines?: number;
  label?: string;
};

export function LoadingBlock({ lines = 3, label = 'Carregando…' }: Props) {
  return (
    <div className="loading-block" role="status" aria-label={label}>
      <span className="loading-block__spinner" aria-hidden />
      <p className="loading-block__label">{label}</p>
      <div className="loading-block__skeletons">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="skeleton" style={{ width: `${88 - i * 12}%` }} />
        ))}
      </div>
    </div>
  );
}
