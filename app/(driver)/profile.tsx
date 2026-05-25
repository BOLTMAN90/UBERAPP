import { router, type Href } from 'expo-router';

import { useEffect, useState } from 'react';

import { ScrollView, StyleSheet, Text, View } from 'react-native';



import { Button } from '@/components/Button';

import { ProfilePhotoSection } from '@/components/ProfilePhotoSection';

import { Radius, Spacing } from '@/constants/theme';

import { useAuth } from '@/context/AuthContext';

import { useTheme } from '@/context/ThemeContext';

import { ensureDriverProfile, getDriverProfile } from '@/services/drivers';

import { signOut } from '@/services/auth';

import type { DriverProfile } from '@/types';

import { formatMoney } from '@/utils/currency';



function DetailRow({ label, value }: { label: string; value: string }) {

  const { colors } = useTheme();

  return (

    <View style={styles.detailRow}>

      <Text style={{ color: colors.textSecondary }}>{label}</Text>

      <Text style={{ color: colors.text, fontWeight: '600' }}>{value}</Text>

    </View>

  );

}



export default function DriverProfileScreen() {

  const { profile: authProfile, user, refreshProfile } = useAuth();

  const { colors } = useTheme();

  const [driver, setDriver] = useState<DriverProfile | null>(null);

  const [photoURL, setPhotoURL] = useState<string | undefined>(authProfile?.photoURL);



  const displayName =

    authProfile?.displayName?.trim() ||

    driver?.displayName?.trim() ||

    user?.displayName?.trim() ||

    'Driver';



  useEffect(() => {

    setPhotoURL(authProfile?.photoURL ?? driver?.photoURL);

  }, [authProfile?.photoURL, driver?.photoURL]);



  useEffect(() => {

    if (!user) return;

    void ensureDriverProfile(user.uid, displayName).then(setDriver);

  }, [user, displayName]);



  return (

    <ScrollView style={{ flex: 1, backgroundColor: colors.secondary }} contentContainerStyle={styles.content}>

      <Text style={[styles.heading, { color: colors.text }]}>Driver profile</Text>



      {user ? (

        <ProfilePhotoSection

          userId={user.uid}

          displayName={displayName}

          email={authProfile?.email ?? user.email ?? undefined}

          photoURL={photoURL}

          onUpdated={(url) => {

            setPhotoURL(url);

            void refreshProfile();

            void getDriverProfile(user.uid).then(setDriver);

          }}

        />

      ) : null}



      <View style={[styles.card, { backgroundColor: colors.surface }]}>

        <DetailRow label="Full name" value={displayName} />

        <DetailRow label="Email" value={authProfile?.email ?? user?.email ?? '—'} />

        <DetailRow label="Phone" value={authProfile?.phone ?? 'Not set'} />

        <DetailRow label="KYC" value={driver?.kycStatus ?? authProfile?.kycStatus ?? 'pending'} />

        <DetailRow label="Rating" value={`${(driver?.rating ?? 5).toFixed(1)} ★ (${driver?.ratingCount ?? 0} reviews)`} />

        <DetailRow label="Total trips" value={String(driver?.totalTrips ?? 0)} />

        <DetailRow label="Total earnings" value={formatMoney(driver?.totalEarnings ?? 0, 'USD')} />

        <DetailRow label="Fuel expenses" value={formatMoney(driver?.fuelCostTotal ?? 0, 'USD')} />

        <DetailRow label="Vehicle" value={driver?.vehicleInfo ?? 'Not set'} />

        <DetailRow

          label="Ride categories"

          value={driver?.rideCategories?.join(', ') ?? 'economy, comfort, xl'}

        />

        <DetailRow label="Subscription" value={driver?.subscriptionActive ? 'Active' : 'Inactive'} />

        <DetailRow label="Auto-accept" value={driver?.autoAcceptRides ? 'On' : 'Off'} />

        <DetailRow label="Status" value={driver?.isOnline ? 'Online' : 'Offline'} />

      </View>



      <Button label="Open drive screen" onPress={() => router.push('/(driver)')} />

      <Button label="Switch to rider app" variant="secondary" onPress={() => router.replace('/(rider)' as Href)} />

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

  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md },

});

