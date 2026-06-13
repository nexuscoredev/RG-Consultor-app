import type { ThemeMode } from '@/context/ThemeContext';
import { useTheme } from '@/context/ThemeContext';

const OPTIONS: { id: ThemeMode; label: string }[] = [
  { id: 'system', label: 'Sistema' },
  { id: 'light', label: 'Claro' },
  { id: 'dark', label: 'Escuro' },
];

export function ThemeSwitcher() {
  const { mode, setMode } = useTheme();

  return (
    <div className="theme-switcher" role="group" aria-label="Tema da interface">
      {OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          className={`theme-switcher__btn${mode === opt.id ? ' theme-switcher__btn--active' : ''}`}
          onClick={() => setMode(opt.id)}
          aria-pressed={mode === opt.id}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}
