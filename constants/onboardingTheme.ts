import { Colors } from '@/constants/theme';

/**
 * Premium onboarding palette — keeps the BoltRide yellow + light gray identity.
 * Used only inside the onboarding flow.
 */
export const OnboardingTheme = {
  background: '#FFFFFF',
  backgroundElevated: '#F5F5F5',
  surface: '#FAFAFA',
  accent: Colors.primary,
  accentDeep: Colors.primaryDark,
  accentSoft: 'rgba(251, 192, 45, 0.18)',
  text: '#1A1A1A',
  textMuted: '#555555',
  textFaint: '#9E9E9E',
  hairline: 'rgba(0, 0, 0, 0.08)',
  cardBg: '#FFFFFF',
  cardBorder: 'rgba(251, 192, 45, 0.35)',
  glow: 'rgba(251, 192, 45, 0.40)',
  brandInk: '#121212',
  routeBase: 'rgba(0, 0, 0, 0.06)',
} as const;
