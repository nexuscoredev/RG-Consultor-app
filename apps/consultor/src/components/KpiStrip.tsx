import type { ReactNode } from 'react';

export type KpiItem = {
  id: string;
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  tone?: 'default' | 'brand' | 'accent';
};

type Props = {
  items: KpiItem[];
};

export function KpiStrip({ items }: Props) {
  return (
    <div className="kpi-strip" role="list">
      {items.map((item) => (
        <article
          key={item.id}
          className={`kpi-strip__item kpi-strip__item--${item.tone ?? 'default'}`}
          role="listitem">
          {item.icon ? <span className="kpi-strip__icon">{item.icon}</span> : null}
          <div className="kpi-strip__body">
            <span className="kpi-strip__label">{item.label}</span>
            <span className="kpi-strip__value">{item.value}</span>
            {item.hint ? <span className="kpi-strip__hint">{item.hint}</span> : null}
          </div>
        </article>
      ))}
    </div>
  );
}
