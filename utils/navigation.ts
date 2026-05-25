import type { Href } from 'expo-router';

import type { AppUser, UserRole } from '@/types';

/** Home route for a user role. */
export function homeHrefForRole(role: UserRole | undefined): Href {
  if (role === 'admin') return '/(admin)' as Href;
  if (role === 'driver') return '/(driver)' as Href;
  return '/(rider)' as Href;
}

/** Home route for the signed-in user's role. */
export function homeHrefForProfile(profile: AppUser | null): Href {
  return homeHrefForRole(profile?.role);
}
