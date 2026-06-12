import { router, type Href } from 'expo-router';

import { useEffect, useState } from 'react';

import { ScrollView, StyleSheet, Text, View } from 'react-native';



import { Button } from '@/components/Button';

import { CurrencyPicker } from '@/components/CurrencyPicker';

import { ProfilePhotoSection } from '@/components/ProfilePhotoSection';

import { Radius, Spacing } from '@/constants/theme';

import { useAuth } from '@/context/AuthContext';

import { useTheme } from '@/context/ThemeContext';

import { getDriverProfile } from '@/services/drivers';

import { signOut, updateUserRole } from '@/services/auth';

import { getWalletBalances, setPreferredCurrency } from '@/services/wallet';

import type { CurrencyCode, DriverProfile } from '@/types';

import { formatMoney, normalizeBalances } from '@/utils/currency';
import { voidFirestore } from '@/utils/voidFirestore';



function DetailRow({ label, value }: { label: string; value: string }) {

  const { colors } = useTheme();

  return (

    <View style={styles.detailRow}>

      <Text style={{ color: colors.textSecondary }}>{label}</Text>

      <Text style={{ color: colors.text, fontWeight: '600' }}>{value}</Text>

    </View>

  );

}



export default function RiderProfileScreen() {

  const { profile, user, refreshProfile } = useAuth();

  const { colors } = useTheme();

  const [currency, setCurrency] = useState<CurrencyCode>('USD');

  const [balances, setBalances] = useState(normalizeBalances());

  const [driverStats, setDriverStats] = useState<DriverProfile | null>(null);

  const [photoURL, setPhotoURL] = useState<string | undefined>(
    profile?.avatarDataUrl ?? profile?.photoURL,
  );



  const displayName =

    profile?.displayName?.trim() ||

    user?.displayName?.trim() ||

    'Rider';



  useEffect(() => {

    setPhotoURL(profile?.avatarDataUrl ?? profile?.photoURL);

  }, [profile?.avatarDataUrl, profile?.photoURL]);



  useEffect(() => {

    if (!user) return;

    voidFirestore(
      getWalletBalances(user.uid).then((w) => {
        setCurrency(w.preferredCurrency);
        setBalances(w.balances);
      }),
      'profile:wallet',
    );

    if (profile?.role === 'driver') {
      voidFirestore(getDriverProfile(user.uid).then(setDriverStats), 'profile:driver');
    }

  }, [user, profile?.role]);



  const handleCurrency = async (code: CurrencyCode) => {

    setCurrency(code);

    if (user) {

      await setPreferredCurrency(user.uid, code);

      await refreshProfile();

    }

  };



  const switchToDriver = async () => {

    if (!profile) return;

    await updateUserRole(profile.uid, 'driver');

    await refreshProfile();

    router.replace('/(driver)' as Href);

  };



  return (

    <ScrollView style={{ flex: 1, backgroundColor: colors.secondary }} contentContainerStyle={styles.content}>

      <Text style={[styles.heading, { color: colors.text }]}>Customer profile</Text>



      {user ? (

        <ProfilePhotoSection

          userId={user.uid}

          displayName={displayName}

          email={profile?.email ?? user.email ?? undefined}

          photoURL={photoURL}

          onUpdated={(url) => {

            setPhotoURL(url);

            void refreshProfile();

          }}

        />

      ) : null}



      <View style={[styles.card, { backgroundColor: colors.surface }]}>

        <DetailRow label="Full name" value={displayName} />

        <DetailRow label="Email" value={profile?.email ?? user?.email ?? '—'} />

        <DetailRow label="Phone" value={profile?.phone ?? 'Not set'} />

        <DetailRow label="Account role" value={profile?.role ?? 'rider'} />

        <DetailRow label="KYC status" value={profile?.kycStatus ?? 'pending'} />

        <DetailRow label="Member since" value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'} />

        <DetailRow label="Loyalty points" value={String(profile?.loyaltyPoints ?? 0)} />

        <DetailRow label="Referral code" value={profile?.referralCode ?? '—'} />

        <DetailRow

          label="Emergency contacts"

          value={profile?.emergencyContacts?.length ? profile.emergencyContacts.join(', ') : 'None'}

        />

      </View>



      <Text style={[styles.section, { color: colors.text }]}>Preferred currency</Text>

      <CurrencyPicker value={currency} onChange={handleCurrency} balance={balances[currency]} />

      <Text style={{ color: colors.textSecondary, fontSize: 13 }}>

        Wallet: {formatMoney(balances[currency] ?? 0, currency)}

      </Text>



      {driverStats ? (

        <View style={[styles.card, { backgroundColor: colors.surface }]}>

          <Text style={[styles.section, { color: colors.text }]}>Driver stats (also on driver app)</Text>

          <DetailRow label="Rating" value={`${(driverStats.rating ?? 5).toFixed(1)} ★`} />

          <DetailRow label="Total trips" value={String(driverStats.totalTrips)} />

          <DetailRow label="Earnings" value={formatMoney(driverStats.totalEarnings, currency)} />

        </View>

      ) : null}



      <Button label="Saved places (Home / Work)" variant="secondary" onPress={() => router.push('/(rider)/favorites' as Href)} />

      <Button label="Become a driver / open driver app" onPress={switchToDriver} />

      <Button

        label="Sign out"

        variant="outline"

        onPress={async () => {

          await signOut();

          router.replace('/(auth)/login');

        }}

      />

    </ScrollView>

  );

}



const styles = StyleSheet.create({

  content: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xl },

  heading: { fontSize: 22, fontWeight: '800' },

  card: { padding: Spacing.lg, borderRadius: Radius.lg, gap: Spacing.sm },

  section: { fontWeight: '700', fontSize: 16 },

  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md },

});

