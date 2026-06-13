import { useEffect, useRef, useState } from 'react';

import { AppIcon } from '@/components/AppIcon';
import type { CommandItem } from '@/lib/commandIndex';

type Props = {
  open: boolean;
  query: string;
  results: CommandItem[];
  onQueryChange: (q: string) => void;
  onClose: () => void;
  onSelect: (item: CommandItem) => void;
};

export function CommandPalette({ open, query, results, onQueryChange, onClose, onSelect }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (open) {
      setActive(0);
      const t = window.setTimeout(() => inputRef.current?.focus(), 40);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query, results.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results[active]) {
        e.preventDefault();
        onSelect(results[active]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, results, active, onSelect]);

  if (!open) return null;

  const grouped = results.reduce<Record<string, CommandItem[]>>((acc, item) => {
    acc[item.group] = acc[item.group] ?? [];
    acc[item.group].push(item);
    return acc;
  }, {});

  let flatIndex = 0;

  return (
    <div className="cmd-palette" role="dialog" aria-modal="true" aria-label="Busca rápida">
      <button type="button" className="cmd-palette__backdrop" onClick={onClose} aria-label="Fechar" />
      <div className="cmd-palette__panel">
        <div className="cmd-palette__search">
          <AppIcon name="search" size={18} />
          <input
            ref={inputRef}
            type="search"
            placeholder="Buscar páginas, ferramentas, clientes…"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            aria-label="Buscar"
          />
          <kbd className="cmd-palette__kbd">Esc</kbd>
        </div>

        <div className="cmd-palette__results">
          {results.length === 0 ? (
            <p className="cmd-palette__empty">Nenhum resultado para &ldquo;{query}&rdquo;</p>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group} className="cmd-palette__group">
                <p className="cmd-palette__group-label">{group}</p>
                {items.map((item) => {
                  const idx = flatIndex++;
                  const isActive = idx === active;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`cmd-palette__item${isActive ? ' cmd-palette__item--active' : ''}`}
                      onClick={() => onSelect(item)}
                      onMouseEnter={() => setActive(idx)}>
                      <span className="cmd-palette__item-label">{item.label}</span>
                      {item.hint ? <span className="cmd-palette__item-hint">{item.hint}</span> : null}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <p className="cmd-palette__foot">
          <kbd>↑</kbd> <kbd>↓</kbd> navegar · <kbd>Enter</kbd> abrir · <kbd>Ctrl</kbd>+<kbd>K</kbd> fechar
        </p>
      </div>
    </div>
  );
}
