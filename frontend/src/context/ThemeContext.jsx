import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';

/**
 * Global light/dark theme for the MediFind app (admin dashboard in particular).
 *
 * The mode is persisted in localStorage so a refresh keeps the selection.
 * Design tokens are exposed as CSS custom properties (--mf-*) so components
 * can reference them via `var()` in sx props — the values swap automatically
 * when the mode changes without re-rendering every consumer.
 */
const ThemeContext = createContext(null);

export const useThemeMode = () => useContext(ThemeContext);

const STORAGE_KEY = 'medifind-theme';

const LIGHT_VARS = {
  '--mf-bg': '#F7F9FC',
  '--mf-card': '#FFFFFF',
  '--mf-surface': '#FAFBFC',
  '--mf-text': '#101B36',
  '--mf-muted': '#5C6780',
  '--mf-border': '#E8EDF2',
  '--mf-hover': '#F5F7FA',
};

const DARK_VARS = {
  '--mf-bg': '#0F172A',
  '--mf-card': '#1E293B',
  '--mf-surface': '#1E293B',
  '--mf-text': '#E2E8F0',
  '--mf-muted': '#94A3B8',
  '--mf-border': '#334155',
  '--mf-hover': '#273449',
};

const applyVars = (vars) => {
  Object.entries(vars).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
};

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    applyVars(mode === 'dark' ? DARK_VARS : LIGHT_VARS);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch { /* ignore */ }
  }, [mode]);

  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: '#079A9A' },
          background: {
            default: mode === 'dark' ? '#0F172A' : '#F7F9FC',
            paper: mode === 'dark' ? '#1E293B' : '#FFFFFF',
          },
          text: {
            primary: mode === 'dark' ? '#E2E8F0' : '#101B36',
            secondary: mode === 'dark' ? '#94A3B8' : '#5C6780',
          },
          divider: mode === 'dark' ? '#334155' : '#E8EDF2',
        },
      }),
    [mode]
  );

  const value = useMemo(() => ({
    mode,
    isDark: mode === 'dark',
    toggle: () => setMode((m) => (m === 'dark' ? 'light' : 'dark')),
    setMode,
  }), [mode]);

  return (
    <MuiThemeProvider theme={muiTheme}>
      <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
    </MuiThemeProvider>
  );
};
