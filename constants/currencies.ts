import type { CurrencyCode } from '@/types';

export const CURRENCIES: {
  code: CurrencyCode;
  label: string;
  symbol: string;
  /** Rate: 1 unit of this currency ≈ X USD (for conversion display). */
  usdRate: number;
}[] = [
  { code: 'USD', label: 'US Dollar', symbol: '$', usdRate: 1 },
  { code: 'NGN', label: 'Nigerian Naira', symbol: '₦', usdRate: 1 / 1550 },
  { code: 'EUR', label: 'Euro', symbol: '€', usdRate: 1.09 },
  { code: 'GBP', label: 'British Pound', symbol: '£', usdRate: 1.27 },
  { code: 'KES', label: 'Kenyan Shilling', symbol: 'KSh', usdRate: 1 / 130 },
  { code: 'GHS', label: 'Ghanaian Cedi', symbol: '₵', usdRate: 1 / 15 },
  { code: 'ZAR', label: 'South African Rand', symbol: 'R', usdRate: 1 / 18 },
];

export const DEFAULT_CURRENCY: CurrencyCode = 'USD';

export function getCurrencyMeta(code: CurrencyCode) {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}
