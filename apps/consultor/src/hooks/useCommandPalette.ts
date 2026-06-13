import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { buildCommandIndex, filterCommands, type CommandItem } from '@/lib/commandIndex';

export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const index = useMemo(() => buildCommandIndex(), [open]);
  const results = useMemo(() => filterCommands(query, index), [query, index]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  const openPalette = useCallback(() => {
    setOpen(true);
    setQuery('');
  }, []);

  const select = useCallback(
    (item: CommandItem) => {
      close();
      navigate(item.path);
    },
    [close, navigate],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
        setQuery('');
      }
      if (e.key === 'Escape' && open) {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  return { open, query, setQuery, results, close, openPalette, select };
}
