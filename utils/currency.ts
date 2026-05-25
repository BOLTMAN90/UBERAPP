import { CURRENCIES, DEFAULT_CURRENCY, getCurrencyMeta } from '@/constants/currencies';
import type { CurrencyCode, WalletBalances } from '@/types';

export function createEmptyBalances(): WalletBalances {
  return CURRENCIES.reduce(
    (acc, c) => {
      acc[c.code] = 0;
      return acc;
    },
    {} as WalletBalances,
  );
}

export function normalizeBalances(raw?: Partial<WalletBalances>, legacySingle?: number): WalletBalances {
  const balances = createEmptyBalances();
  if (raw) {
    for (const c of CURRENCIES) {
      if (typeof raw[c.code] === 'number') {
        balances[c.code] = raw[c.code]!;
      }
    }
  }
  if (typeof legacySingle === 'number' && legacySingle > 0) {
    balances.NGN = (balances.NGN ?? 0) + legacySingle;
  }
  return balances;
}

/** Convert amount between currencies using static MVP rates. */
export function convertCurrency(amount: number, from: CurrencyCode, to: CurrencyCode): number {
  if (from === to) {
    return amount;
  }
  const fromMeta = getCurrencyMeta(from);
  const toMeta = getCurrencyMeta(to);
  const usd = amount * fromMeta.usdRate;
  return Math.round((usd / toMeta.usdRate) * 100) / 100;
}

export function formatMoney(amount: number, currency: CurrencyCode = DEFAULT_CURRENCY): string {
  const { symbol } = getCurrencyMeta(currency);
  const formatted = Math.abs(amount).toLocaleString(undefined, {
    minimumFractionDigits: currency === 'NGN' ? 0 : 2,
    maximumFractionDigits: currency === 'NGN' ? 0 : 2,
  });
  const sign = amount < 0 ? '-' : '';
  return `${sign}${symbol}${formatted}`;
}
