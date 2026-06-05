/** Demo / display config for wallet funding flows. */

export const BANK_TRANSFER_DETAILS = {
  accountNumber: '7025694561',
  bankName: 'OPAY',
  accountName: 'BOLUWATIFE CLEMENT KAYODE',
} as const;

export const DEMO_CARD = {
  number: '4242 4242 4242 4242',
  expiry: '12/28',
  cvv: '123',
  holder: 'Demo Rider',
} as const;

export const DEMO_MOBILE_MONEY = {
  providers: ['MTN MoMo', 'Airtel Money', 'OPay', 'M-Pesa'],
  demoPhone: '08012345678',
} as const;

/** Methods that cannot top up the in-app wallet (cash is pay-at-ride only). */
export const TOP_UP_EXCLUDED_METHODS = ['cash'] as const;
