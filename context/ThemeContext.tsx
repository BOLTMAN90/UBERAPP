import React, { createContext, useContext, useMemo } from 'react';

import { Colors, type ThemeColors } from '@/constants/theme';

/**
 * RideYellow brand theme (yellow #FBC02D + light gray #F5F5F5).
 * Kept consistent with the original app design — not system dark mode.
 */
interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: Colors,
  isDark: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo(
    () => ({
      colors: Colors,
      isDark: false,
    }),
    [],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
