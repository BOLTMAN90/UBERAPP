import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button } from '@/components/Button';
import { InputField } from '@/components/InputField';
import {
  BANK_TRANSFER_DETAILS,
  DEMO_CARD,
  DEMO_MOBILE_MONEY,
} from '@/constants/walletFunding';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import type { CurrencyCode, PaymentMethod } from '@/types';
import { formatMoney } from '@/utils/currency';

type Step = 'form' | 'processing' | 'success';

interface FundingFlowModalProps {
  visible: boolean;
  method: PaymentMethod;
  amount: number;
  currency: CurrencyCode;
  onClose: () => void;
  onComplete: () => Promise<void>;
}

export function FundingFlowModal({
  visible,
  method,
  amount,
  currency,
  onClose,
  onComplete,
}: FundingFlowModalProps) {
  const { colors } = useTheme();
  const [step, setStep] = useState<Step>('form');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [walletProvider, setWalletProvider] = useState('');
  const [walletId, setWalletId] = useState('');
  const [walletPhone, setWalletPhone] = useState('');
  const [mobileProvider, setMobileProvider] = useState<string>(DEMO_MOBILE_MONEY.providers[0]);
  const [mobilePhone, setMobilePhone] = useState('');
  const [mobilePin, setMobilePin] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setStep('form');
      setError(null);
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
      setCardName('');
      setWalletProvider('');
      setWalletId('');
      setWalletPhone('');
      setMobilePhone('');
      setMobilePin('');
    }
  }, [visible]);

  const titleForMethod = () => {
    switch (method) {
      case 'card':
        return 'Link card & pay';
      case 'wallet':
        return 'External wallet';
      case 'transfer':
        return 'Bank transfer';
      case 'mobile_money':
        return 'Mobile money';
      default:
        return 'Add funds';
    }
  };

  const validateForm = (): boolean => {
    setError(null);
    if (method === 'card') {
      if (cardNumber.replace(/\s/g, '').length < 12) {
        setError('Enter a valid card number.');
        return false;
      }
      if (!cardExpiry.trim() || !cardCvv.trim() || !cardName.trim()) {
        setError('Complete all card fields.');
        return false;
      }
      return true;
    }
    if (method === 'wallet') {
      if (!walletProvider.trim() || !walletId.trim() || !walletPhone.trim()) {
        setError('Enter wallet provider, ID, and phone number.');
        return false;
      }
      return true;
    }
    if (method === 'mobile_money') {
      if (!mobilePhone.trim() || mobilePin.length < 4) {
        setError('Enter phone number and PIN (demo: any 4+ digits).');
        return false;
      }
      return true;
    }
    return true;
  };

  const runPayment = async () => {
    if (!validateForm()) return;
    setStep('processing');
    await new Promise((r) => setTimeout(r, 1800));
    try {
      await onComplete();
      setStep('success');
    } catch (e) {
      setStep('form');
      setError(e instanceof Error ? e.message : 'Payment failed.');
    }
  };

  const fillDemoCard = () => {
    setCardNumber(DEMO_CARD.number);
    setCardExpiry(DEMO_CARD.expiry);
    setCardCvv(DEMO_CARD.cvv);
    setCardName(DEMO_CARD.holder);
  };

  const renderForm = () => {
    switch (method) {
      case 'card':
        return (
          <View style={styles.formBlock}>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Link your card to complete this demo payment. No real charge is made.
            </Text>
            <Pressable onPress={fillDemoCard} style={[styles.demoChip, { borderColor: colors.primary }]}>
              <Text style={{ color: colors.primary, fontWeight: '700' }}>Use demo card</Text>
            </Pressable>
            <InputField label="Card number" value={cardNumber} onChangeText={setCardNumber} keyboardType="number-pad" />
            <View style={styles.row}>
              <View style={styles.half}>
                <InputField label="Expiry" value={cardExpiry} onChangeText={setCardExpiry} placeholder="MM/YY" />
              </View>
              <View style={styles.half}>
                <InputField label="CVV" value={cardCvv} onChangeText={setCardCvv} keyboardType="number-pad" secureTextEntry />
              </View>
            </View>
            <InputField label="Name on card" value={cardName} onChangeText={setCardName} />
          </View>
        );
      case 'wallet':
        return (
          <View style={styles.formBlock}>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Link your external wallet (PayPal, Apple Pay, etc.) to fund BoltRide.
            </Text>
            <InputField label="Wallet provider" value={walletProvider} onChangeText={setWalletProvider} placeholder="e.g. PayPal" />
            <InputField label="Wallet ID / email" value={walletId} onChangeText={setWalletId} />
            <InputField label="Phone linked to wallet" value={walletPhone} onChangeText={setWalletPhone} keyboardType="phone-pad" />
          </View>
        );
      case 'transfer':
        return (
          <View style={[styles.bankCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.bankTitle, { color: colors.text }]}>Send payment to:</Text>
            <Text style={[styles.bankLine, { color: colors.text }]}>Bank: {BANK_TRANSFER_DETAILS.bankName}</Text>
            <Text style={[styles.bankLine, { color: colors.text }]}>Account: {BANK_TRANSFER_DETAILS.accountNumber}</Text>
            <Text style={[styles.bankLine, { color: colors.text }]}>Name: {BANK_TRANSFER_DETAILS.accountName}</Text>
            <Text style={[styles.hint, { color: colors.textSecondary, marginTop: Spacing.sm }]}>
              Transfer exactly {formatMoney(amount, currency)}. Tap below after you send it.
            </Text>
          </View>
        );
      case 'mobile_money':
        return (
          <View style={styles.formBlock}>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Demo mobile money — enter any phone and PIN (4+ digits).
            </Text>
            <InputField
              label="Provider"
              value={mobileProvider}
              onChangeText={setMobileProvider}
              placeholder={DEMO_MOBILE_MONEY.providers.join(', ')}
            />
            <InputField
              label="Mobile number"
              value={mobilePhone}
              onChangeText={setMobilePhone}
              keyboardType="phone-pad"
              placeholder={DEMO_MOBILE_MONEY.demoPhone}
            />
            <InputField label="PIN" value={mobilePin} onChangeText={setMobilePin} secureTextEntry keyboardType="number-pad" />
          </View>
        );
      default:
        return null;
    }
  };

  const primaryLabel =
    method === 'transfer' ? 'I have sent the payment' : method === 'card' ? 'Pay with card' : 'Confirm payment';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <ScrollView contentContainerStyle={styles.sheetContent}>
            <Text style={[styles.title, { color: colors.text }]}>{titleForMethod()}</Text>
            <Text style={[styles.amount, { color: colors.primary }]}>
              {formatMoney(amount, currency)}
            </Text>

            {step === 'form' ? (
              <>
                {renderForm()}
                {error ? <Text style={{ color: colors.error }}>{error}</Text> : null}
                <Button label={primaryLabel} onPress={() => void runPayment()} />
                <Button label="Cancel" variant="outline" onPress={onClose} />
              </>
            ) : null}

            {step === 'processing' ? (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ color: colors.textSecondary, marginTop: Spacing.md }}>Processing payment…</Text>
              </View>
            ) : null}

            {step === 'success' ? (
              <View style={styles.centered}>
                <Text style={[styles.successTitle, { color: colors.success }]}>Payment successful!</Text>
                <Text style={{ color: colors.textSecondary, textAlign: 'center', lineHeight: 22 }}>
                  Your wallet has been funded. Equivalent balances were added in all currencies.
                  Return to the Wallet tab to see your updated balance.
                </Text>
                <Button
                  label="Go to wallet"
                  onPress={() => {
                    onClose();
                    router.push('/(rider)/wallet');
                  }}
                />
                <Button label="Close" variant="outline" onPress={onClose} />
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    maxHeight: '90%',
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
  },
  sheetContent: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xl },
  title: { fontSize: 20, fontWeight: '800' },
  amount: { fontSize: 28, fontWeight: '800' },
  formBlock: { gap: Spacing.sm },
  hint: { fontSize: 13, lineHeight: 20 },
  demoChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  row: { flexDirection: 'row', gap: Spacing.sm },
  half: { flex: 1 },
  bankCard: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  bankTitle: { fontWeight: '800', fontSize: 16, marginBottom: Spacing.xs },
  bankLine: { fontSize: 15, fontWeight: '600' },
  centered: { alignItems: 'center', paddingVertical: Spacing.lg, gap: Spacing.md },
  successTitle: { fontSize: 22, fontWeight: '800' },
});
