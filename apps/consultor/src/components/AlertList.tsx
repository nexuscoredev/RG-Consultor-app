import { AppIcon } from '@/components/AppIcon';
import type { MgmtAlert } from '@/lib/api';

type Props = {
  items: MgmtAlert[];
  limit?: number;
};

export function AlertList({ items, limit = 5 }: Props) {
  const visible = items.slice(0, limit);
  if (visible.length === 0) return null;

  return (
    <section className="ios-section" aria-label="Alertas">
      <h2 className="ios-section__title">Alertas</h2>
      <div className="ios-group">
        {visible.map((a) => (
          <div key={a.id} className={`ios-row ios-row--${a.severity}`}>
            <span className="ios-row__glyph" aria-hidden>
              {a.severity === 'danger' ? (
                <AppIcon name="alert" size={18} />
              ) : a.severity === 'warning' ? (
                <AppIcon name="file" size={18} />
              ) : (
                <AppIcon name="leaf" size={18} />
              )}
            </span>
            <div className="ios-row__content">
              <span className="ios-row__title">{a.title}</span>
              <span className="ios-row__subtitle">{a.body}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
