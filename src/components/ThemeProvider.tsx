import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

export type AccentKey =
  | 'blue' | 'violet' | 'pink' | 'rose' | 'orange'
  | 'amber' | 'emerald' | 'teal' | 'cyan' | 'indigo';

export const ACCENTS: { key: AccentKey; name: string; hsl: string; hex: string }[] = [
  { key: 'blue',    name: 'Blue',    hsl: '222 91% 63%', hex: '#4A7CF7' },
  { key: 'violet',  name: 'Violet',  hsl: '262 83% 66%', hex: '#8B5CF6' },
  { key: 'indigo',  name: 'Indigo',  hsl: '239 84% 67%', hex: '#6366F1' },
  { key: 'cyan',    name: 'Cyan',    hsl: '189 94% 43%', hex: '#06B6D4' },
  { key: 'teal',    name: 'Teal',    hsl: '173 80% 40%', hex: '#14B8A6' },
  { key: 'emerald', name: 'Emerald', hsl: '160 84% 39%', hex: '#10B981' },
  { key: 'amber',   name: 'Amber',   hsl: '38 92% 50%',  hex: '#F59E0B' },
  { key: 'orange',  name: 'Orange',  hsl: '20 90% 55%',  hex: '#F97316' },
  { key: 'rose',    name: 'Rose',    hsl: '350 89% 60%', hex: '#EF4444' },
  { key: 'pink',    name: 'Pink',    hsl: '329 86% 60%', hex: '#EC4899' },
];

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  accent: AccentKey;
  setAccent: (a: AccentKey) => void;
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = 'dark',
  storageKey = 'ankor-theme',
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem(storageKey);
    return (stored as Theme) || defaultTheme;
  });
  const [accent, setAccent] = useState<AccentKey>(() => {
    return (localStorage.getItem('ankor-accent') as AccentKey) || 'blue';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    const preset = ACCENTS.find(a => a.key === accent) || ACCENTS[0];
    const root = window.document.documentElement;
    root.style.setProperty('--primary', preset.hsl);
    root.style.setProperty('--ring', preset.hsl);
    root.style.setProperty('--glow', preset.hsl);
    if (theme === 'dark') {
      root.style.setProperty('--primary-foreground', '0 0% 100%');
    } else {
      root.style.removeProperty('--primary-foreground');
    }
  }, [accent, theme]);

  const value: ThemeProviderState = {
    theme,
    setTheme: (t: Theme) => {
      localStorage.setItem(storageKey, t);
      setTheme(t);
    },
    accent,
    setAccent: (a: AccentKey) => {
      localStorage.setItem('ankor-accent', a);
      setAccent(a);
    },
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
