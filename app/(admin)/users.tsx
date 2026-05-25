import { useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { getAllDrivers, getAllUsers, updateUserKyc } from '@/services/admin';
import type { AppUser, DriverProfile, KycStatus } from '@/types';

type UserRow = { type: 'user'; data: AppUser } | { type: 'driver'; data: DriverProfile };

export default function AdminUsersScreen() {
  const { colors } = useTheme();
  const [rows, setRows] = useState<UserRow[]>([]);

  const load = () => {
    void Promise.all([getAllUsers(), getAllDrivers()]).then(([users, drivers]) => {
      setRows([
        ...users.map((u) => ({ type: 'user' as const, data: u })),
        ...drivers.map((d) => ({ type: 'driver' as const, data: d })),
      ]);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const setKyc = async (uid: string, status: KycStatus) => {
    await updateUserKyc(uid, status);
    load();
  };

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.secondary }}
      ListHeaderComponent={
        <Text style={{ color: colors.text, fontWeight: '800', padding: Spacing.md, fontSize: 18 }}>
          Riders & drivers · KYC
        </Text>
      }
      data={rows}
      keyExtractor={(item) => item.data.uid}
      renderItem={({ item }) => {
        const uid = item.data.uid;
        const name = item.data.displayName;
        const kyc = item.data.kycStatus ?? 'pending';
        return (
          <View
            style={{
              padding: Spacing.md,
              marginHorizontal: Spacing.md,
              marginBottom: Spacing.sm,
              backgroundColor: colors.surface,
              borderRadius: 12,
            }}>
            <Text style={{ color: colors.text, fontWeight: '600' }}>{name}</Text>
            <Text style={{ color: colors.textSecondary }}>
              {item.type} · KYC: {kyc}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <Button label="Approve" onPress={() => void setKyc(uid, 'approved')} />
              <Button label="Reject" variant="outline" onPress={() => void setKyc(uid, 'rejected')} />
            </View>
          </View>
        );
      }}
    />
  );
}
