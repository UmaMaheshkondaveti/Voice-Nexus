import type { Account } from '../../../shared/types.js';

export interface InternalAccount extends Account {
  kbaAnswer: string;
}

export const ACCOUNTS: InternalAccount[] = [
  {
    phoneNumber: '+14085550101',
    accountId: 'ACC-1001',
    fullName: 'Eddard Stark',
    planName: 'Home 300',
    planPrice: 59.99,
    balanceDue: 84.5,
    lastPaymentDate: '2026-08-02',
    lastPaymentAmount: 59.99,
    serviceAddress: '221 Maple Street, Springvale',
    serviceStatus: 'active',
    kbaQuestion: 'What city were you born in?',
    kbaAnswer: 'chicago',
    scheduledAppointments: [],
    openTickets: [],
  },
  {
    phoneNumber: '+14085550102',
    accountId: 'ACC-1002',
    fullName: 'Cersi Lannister',
    planName: 'Essentials 100',
    planPrice: 39.99,
    balanceDue: 0,
    lastPaymentDate: '2026-08-20',
    lastPaymentAmount: 39.99,
    serviceAddress: '48 Birchwood Ave, Springvale',
    serviceStatus: 'active',
    kbaQuestion: 'What is the name of your first pet?',
    kbaAnswer: 'rusty',
    scheduledAppointments: [],
    openTickets: [{ id: 'TCK-1', issue: 'Intermittent Wi-Fi drops in the evening', status: 'open' }],
  },
  {
    phoneNumber: '+14085550103',
    accountId: 'ACC-1003',
    fullName: 'Sansa Stark',
    planName: 'Gig 1000',
    planPrice: 89.99,
    balanceDue: 179.98,
    lastPaymentDate: '2026-06-15',
    lastPaymentAmount: 89.99,
    serviceAddress: '9 Lakeview Court, Springvale',
    serviceStatus: 'past_due',
    kbaQuestion: 'What is your mother’s maiden name?',
    kbaAnswer: 'oconnor',
    scheduledAppointments: [],
    openTickets: [],
  },
  {
    phoneNumber: '+14085550104',
    accountId: 'ACC-1004',
    fullName: 'Margaery Tyrell',
    planName: 'Home 500',
    planPrice: 74.99,
    balanceDue: 0,
    lastPaymentDate: '2026-08-25',
    lastPaymentAmount: 74.99,
    serviceAddress: '77 Cedar Row, Springvale',
    serviceStatus: 'active',
    kbaQuestion: 'What was the model of your first car?',
    kbaAnswer: 'civic',
    scheduledAppointments: [
      { id: 'APT-1', type: 'Technician visit', windowStart: '2026-09-05T15:00:00.000Z', windowEnd: '2026-09-05T17:00:00.000Z', status: 'scheduled' },
    ],
    openTickets: [],
  },
  {
    phoneNumber: '+14085550105',
    accountId: 'ACC-1005',
    fullName: 'Jon Snow',
    planName: 'Home 300',
    planPrice: 59.99,
    balanceDue: 59.99,
    lastPaymentDate: '2026-07-28',
    lastPaymentAmount: 59.99,
    serviceAddress: '5 Harbor Lane, Springvale',
    serviceStatus: 'active',
    kbaQuestion: 'What street did you grow up on?',
    kbaAnswer: 'elm',
    scheduledAppointments: [],
    openTickets: [],
  },
];

export function findAccountByPhone(phoneNumber: string): InternalAccount | undefined {
  return ACCOUNTS.find((a) => a.phoneNumber === phoneNumber);
}

export function findAccountById(accountId: string): InternalAccount | undefined {
  return ACCOUNTS.find((a) => a.accountId === accountId);
}

export function toPublicAccount(account: InternalAccount): Account {
  const { kbaAnswer, ...publicAccount } = account;
  return publicAccount;
}
