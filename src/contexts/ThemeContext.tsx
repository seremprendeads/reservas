import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Theme, allThemes } from '../themes';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  allThemes: Theme[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'reservas_theme';

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const found = allThemes.find(t => t.id === stored);
    if (found) return found;
  }
  return allThemes[0];
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t.id);
  };

  useEffect(() => {
    const root = document.documentElement;
    const t = theme.tokens;
    root.style.setProperty('--booking-primary', t.primary);
    root.style.setProperty('--booking-primary-hover', t.primaryHover);
    root.style.setProperty('--booking-primary-light', t.primaryLight);
    root.style.setProperty('--booking-bg', t.background);
    root.style.setProperty('--booking-card-bg', t.cardBg);
    root.style.setProperty('--booking-text', t.text);
    root.style.setProperty('--booking-text-muted', t.textMuted);
    root.style.setProperty('--booking-caption', t.caption);
    root.style.setProperty('--booking-border', t.border);
    root.style.setProperty('--booking-ring', t.ring);
    root.style.setProperty('--booking-input-bg', t.inputBg);
    root.style.setProperty('--booking-success', t.success);
    root.style.setProperty('--booking-warning', t.warning);
    root.style.setProperty('--booking-error', t.error);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, allThemes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
