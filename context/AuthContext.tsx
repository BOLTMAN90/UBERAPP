import { onAuthStateChanged, User } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { getUserProfile } from '@/services/auth';
import { auth } from '@/services/firebase';
import { registerForPushNotifications } from '@/services/notifications';
import type { AppUser } from '@/types';
import { isFirebaseOfflineError } from '@/utils/firebaseErrors';

function profileFromAuthUser(nextUser: User, nextProfile: AppUser | null): AppUser {
  if (nextProfile) {
    return {
      ...nextProfile,
      displayName: nextProfile.displayName || nextUser.displayName || 'User',
      photoURL: nextProfile.photoURL ?? nextUser.photoURL ?? undefined,
    };
  }
  return {
    uid: nextUser.uid,
    email: nextUser.email ?? '',
    displayName: nextUser.displayName ?? 'User',
    photoURL: nextUser.photoURL ?? undefined,
    role: 'rider',
    createdAt: Date.now(),
  };
}

interface AuthContextValue {
  user: User | null;
  profile: AppUser | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!auth.currentUser) {
      setProfile(null);
      return;
    }

    try {
      const nextProfile = await getUserProfile(auth.currentUser.uid);
      if (nextProfile) {
        setProfile(nextProfile);
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[Auth] refreshProfile failed:', error);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);

      if (nextUser) {
        try {
          const nextProfile = await getUserProfile(nextUser.uid);
          setProfile(profileFromAuthUser(nextUser, nextProfile));

          if (!nextProfile) {
            void (async () => {
              for (let attempt = 0; attempt < 4; attempt += 1) {
                await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
                try {
                  const retryProfile = await getUserProfile(nextUser.uid);
                  if (retryProfile) {
                    setProfile(profileFromAuthUser(nextUser, retryProfile));
                    return;
                  }
                } catch (error) {
                  if (__DEV__) {
                    console.warn('[Auth] profile retry failed:', error);
                  }
                }
              }
            })().catch((error) => {
              if (__DEV__) {
                console.warn('[Auth] profile retry loop failed:', error);
              }
            });
          }
        } catch (error) {
          if (__DEV__ && !isFirebaseOfflineError(error)) {
            console.warn('[Auth] profile load failed:', error);
          }
          setProfile(profileFromAuthUser(nextUser, null));
        }
        void registerForPushNotifications().catch(() => null);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      refreshProfile,
    }),
    [user, profile, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}

