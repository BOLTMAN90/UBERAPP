import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { CurrencyPicker } from '@/components/CurrencyPicker';
import { InputField } from '@/components/InputField';
import { PaymentPicker } from '@/components/PaymentPicker';
import { FundingFlowModal } from '@/components/wallet/FundingFlowModal';
import { TOP_UP_EXCLUDED_METHODS } from '@/constants/walletFunding';
import { CURRENCIES } from '@/constants/currencies';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
  getWalletBalances,
  getWalletTransactions,
  setPreferredCurrency,
  topUpWallet,
} from '@/services/wallet';
import type { CurrencyCode, PaymentMethod, WalletTransaction } from '@/types';
import { convertCurrency, formatMoney } from '@/utils/currency';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';

export default function WalletScreen() {
  const { user, refreshProfile } = useAuth();
  const { colors } = useTheme();
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [balances, setBalances] = useState<Record<CurrencyCode, number>>({} as Record<CurrencyCode, number>);
  const [txns, setTxns] = useState<WalletTransaction[]>([]);
  const [amount, setAmount] = useState('50');
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fundingOpen, setFundingOpen] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      const wallet = await getWalletBalances(user.uid);
      setCurrency(wallet.preferredCurrency);
      setBalances(wallet.balances);
      setTxns(await getWalletTransactions(user.uid));
      await refreshProfile();
    } catch (e) {
      setError(getFirebaseErrorMessage(e));
    }
  }, [user, refreshProfile]);

  useEffect(() => {
    void load();
  }, [load]);

  const balance = balances[currency] ?? 0;

  const handleCurrencyChange = async (code: CurrencyCode) => {
    setCurrency(code);
    if (user) {
      await setPreferredCurrency(user.uid, code);
    }
  };

  const openFundingFlow = () => {
    const value = Number(amount);
    if (!value || value <= 0) {
      Alert.alert('Invalid amount', 'Enter a valid amount to add.');
      return;
    }
    setFundingOpen(true);
  };

  const completeFunding = async () => {
    if (!user) return;
    const value = Number(amount);
    setLoading(true);
    try {
      await topUpWallet(user.uid, value, currency, method);
      await load();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.secondary }} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>Multi-currency wallet</Text>
      <Text style={{ color: colors.textSecondary, marginBottom: Spacing.sm }}>
        Top up via card, bank transfer, mobile money, or external wallet. Cash is for paying drivers on rides only.
      </Text>

      <CurrencyPicker value={currency} onChange={handleCurrencyChange} balance={balance} />

      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={{ color: colors.textSecondary }}>Available balance ({currency})</Text>
        <Text style={[styles.balance, { color: colors.primary }]}>{formatMoney(balance, currency)}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: Spacing.xs }}>
          Equivalent balances (updated together on each top-up):
        </Text>
        {CURRENCIES.filter((c) => c.code !== currency).map((c) => (
          <Text key={c.code} style={{ color: colors.textSecondary, fontSize: 12 }}>
            ≈ {formatMoney(balances[c.code] ?? 0, c.code)}
          </Text>
        ))}
      </View>

      <Text style={[styles.section, { color: colors.text }]}>Add funds ({currency})</Text>
      <InputField
        label={`Amount (${currency})`}
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />
      <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: Spacing.xs }}>
        After payment, the same value is credited in all currencies (converted at live rates).
      </Text>
      <PaymentPicker
        value={method}
        onChange={setMethod}
        exclude={[...TOP_UP_EXCLUDED_METHODS]}
      />
      {error ? <Text style={{ color: colors.error }}>{error}</Text> : null}
      <Button
        label={`Continue to pay ${formatMoney(Number(amount) || 0, currency)}`}
        onPress={openFundingFlow}
        loading={loading}
        disabled={!Number(amount) || Number(amount) <= 0}
      />

      <Text style={[styles.section, { color: colors.text, marginTop: Spacing.md }]}>Transactions</Text>
      <FlatList
        data={txns}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ListEmptyComponent={<Text style={{ color: colors.textSecondary }}>No transactions yet.</Text>}
        renderItem={({ item }) => (
          <View style={[styles.txn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View>
              <Text style={{ color: colors.text, fontWeight: '600' }}>{item.type.replace('_', ' ')}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                {item.method ? `${item.method} · ` : ''}
                {new Date(item.createdAt).toLocaleString()}
              </Text>
            </View>
            <Text style={{ color: item.amount >= 0 ? colors.success : colors.error, fontWeight: '700' }}>
              {item.amount >= 0 ? '+' : ''}
              {formatMoney(item.amount, item.currency)}
            </Text>
          </View>
        )}
      />

      <FundingFlowModal
        visible={fundingOpen}
        method={method}
        amount={Number(amount) || 0}
        currency={currency}
        onClose={() => setFundingOpen(false)}
        onComplete={completeFunding}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.lg, paddingBottom: Spacing.xl },
  title: { fontSize: 22, fontWeight: '800' },
  card: { padding: Spacing.lg, borderRadius: Radius.lg, gap: Spacing.xs, marginVertical: Spacing.md },
  balance: { fontSize: 36, fontWeight: '800' },
  section: { fontWeight: '700', fontSize: 16 },
  txn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
});
