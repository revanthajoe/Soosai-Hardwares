import { createContext, useContext } from 'react';

// The context object and its hook live here, separate from the provider
// component, so ThemeContext.jsx exports only a component. React Fast Refresh
// cannot hot-reload a module that mixes component and non-component exports.
export const ThemeContext = createContext(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
