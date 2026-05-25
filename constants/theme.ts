/** Brand colors and shared layout tokens — light + dark (BoltRide). */

export const Colors = {
  /** Ride UI accent (original yellow) */
  primary: '#FBC02D',
  primaryDark: '#F9A825',
  /** BoltRide logo blue */
  brandBlue: '#00AEEF',
  brandBlueDark: '#0088CC',
  /** Auth screens — original light gray background */
  authBackground: '#F5F5F5',
  secondary: '#F5F5F5',
  background: '#FFFFFF',
  surface: '#FAFAFA',
  text: '#212121',
  textSecondary: '#757575',
  border: '#E0E0E0',
  success: '#43A047',
  error: '#E53935',
  warning: '#FB8C00',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.45)',
} as const;

export const DarkColors = {
  primary: '#FBC02D',
  primaryDark: '#F9A825',
  brandBlue: '#00AEEF',
  brandBlueDark: '#0088CC',
  authBackground: '#000000',
  secondary: '#121212',
  background: '#0A0A0A',
  surface: '#1A1A1A',
  text: '#F5F5F5',
  textSecondary: '#9E9E9E',
  border: '#2C2C2C',
  success: '#66BB6A',
  error: '#EF5350',
  warning: '#FFA726',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.65)',
} as const;

export type ThemeColors = typeof Colors | typeof DarkColors;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;
