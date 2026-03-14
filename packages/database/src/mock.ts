import type {
  Account,
  AuditLog,
  Bill,
  Card,
  DashboardSnapshot,
  DeviceSession,
  FraudEvent,
  Loan,
  LoanWithSchedule,
  NotificationItem,
  StatementDocument,
  SupportTicket,
  Transaction,
  UserProfile
} from "@banking/types";

const accountOwnerId = "11111111-1111-1111-1111-111111111111";

export const mockUsers: UserProfile[] = [
  {
    id: accountOwnerId,
    email: "john_doe@nextgenbank.dev",
    name: "John Doe",
    role: "customer",
    createdAt: "2025-07-10T09:00:00.000Z"
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    email: "admin.ops@nextgenbank.dev",
    name: "Riley Carter",
    role: "admin",
    createdAt: "2025-06-01T09:00:00.000Z"
  }
];

export const mockAccounts: Account[] = [
  {
    id: "acc-checking-01",
    userId: accountOwnerId,
    accountType: "checking",
    nickname: "Everyday Checking",
    accountNumber: "7210456732",
    balance: 12458.42,
    availableBalance: 12248.42,
    currency: "USD",
    status: "active",
    createdAt: "2025-09-01T12:00:00.000Z"
  },
  {
    id: "acc-savings-01",
    userId: accountOwnerId,
    accountType: "savings",
    nickname: "Rainy Day Savings",
    accountNumber: "0945127784",
    balance: 28340.15,
    availableBalance: 28340.15,
    currency: "USD",
    status: "active",
    createdAt: "2025-08-12T12:00:00.000Z"
  }
];

export const mockTransactions: Transaction[] = [
  {
    id: "txn-01",
    accountId: "acc-checking-01",
    amount: 3250,
    direction: "credit",
    type: "deposit",
    category: "Income",
    description: "Payroll deposit",
    merchantName: "Acme Health Group",
    postedAt: "2026-03-12T15:20:00.000Z"
  },
  {
    id: "txn-02",
    accountId: "acc-checking-01",
    amount: 14.78,
    direction: "debit",
    type: "purchase",
    category: "Dining",
    description: "Coffee and breakfast",
    merchantName: "Starbucks",
    postedAt: "2026-03-13T08:10:00.000Z"
  },
  {
    id: "txn-03",
    accountId: "acc-checking-01",
    amount: 86.12,
    direction: "debit",
    type: "purchase",
    category: "Transport",
    description: "Rideshare commute",
    merchantName: "Uber",
    postedAt: "2026-03-13T18:40:00.000Z"
  },
  {
    id: "txn-04",
    accountId: "acc-savings-01",
    amount: 500,
    direction: "credit",
    type: "transfer",
    category: "Savings",
    description: "Automatic savings sweep",
    merchantName: null,
    postedAt: "2026-03-10T13:00:00.000Z"
  }
];

export const mockBills: Bill[] = [
  {
    id: "bill-01",
    userId: accountOwnerId,
    payeeName: "City Electric",
    amount: 142.19,
    dueDate: "2026-03-18",
    status: "scheduled",
    frequency: "Monthly"
  },
  {
    id: "bill-02",
    userId: accountOwnerId,
    payeeName: "Metro Wireless",
    amount: 89.99,
    dueDate: "2026-03-22",
    status: "scheduled",
    frequency: "Monthly"
  }
];

export const mockCards: Card[] = [
  {
    id: "card-01",
    userId: accountOwnerId,
    accountId: "acc-checking-01",
    cardType: "debit",
    network: "Visa",
    last4: "4821",
    status: "active",
    spendLimit: 2500
  },
  {
    id: "card-02",
    userId: accountOwnerId,
    accountId: "acc-checking-01",
    cardType: "credit",
    network: "Mastercard",
    last4: "9130",
    status: "active",
    spendLimit: 5000
  }
];

export const mockLoans: Loan[] = [
  {
    id: "loan-01",
    userId: accountOwnerId,
    loanType: "auto",
    balance: 12480,
    originalAmount: 25000,
    interestRate: 4.9,
    nextPaymentDate: "2026-03-27",
    status: "active"
  }
];

export const mockLoanDetails: LoanWithSchedule[] = [
  {
    ...mockLoans[0],
    monthlyPayment: 486.33,
    amortization: [
      {
        installment: 1,
        paymentDate: "2026-03-27",
        principal: 435.37,
        interest: 50.96,
        balance: 12044.63
      },
      {
        installment: 2,
        paymentDate: "2026-04-27",
        principal: 437.15,
        interest: 49.18,
        balance: 11607.48
      },
      {
        installment: 3,
        paymentDate: "2026-05-27",
        principal: 438.94,
        interest: 47.39,
        balance: 11168.54
      }
    ]
  }
];

export const mockNotifications: NotificationItem[] = [
  {
    id: "note-01",
    userId: accountOwnerId,
    type: "security",
    message: "New device sign-in detected from Bengaluru, IN.",
    read: false,
    createdAt: "2026-03-13T18:44:00.000Z"
  },
  {
    id: "note-02",
    userId: accountOwnerId,
    type: "payment",
    message: "City Electric bill is scheduled for March 18, 2026.",
    read: false,
    createdAt: "2026-03-13T09:10:00.000Z"
  }
];

export const mockDeviceSessions: DeviceSession[] = [
  {
    id: "device-01",
    userId: accountOwnerId,
    deviceFingerprint: "ab12cd34ef56",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    trusted: true,
    lastSeenAt: "2026-03-14T08:00:00.000Z",
    createdAt: "2026-01-18T10:00:00.000Z"
  },
  {
    id: "device-02",
    userId: accountOwnerId,
    deviceFingerprint: "ff98ac77dd12",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X)",
    trusted: false,
    lastSeenAt: "2026-03-13T18:44:00.000Z",
    createdAt: "2026-03-13T18:44:00.000Z"
  }
];

export const mockDocuments: StatementDocument[] = [
  {
    id: "doc-01",
    userId: accountOwnerId,
    documentType: "statement",
    storagePath: "statements/2026-02-checking.pdf",
    status: "available",
    createdAt: "2026-03-01T00:00:00.000Z"
  },
  {
    id: "doc-02",
    userId: accountOwnerId,
    documentType: "statement",
    storagePath: "statements/2026-02-savings.pdf",
    status: "available",
    createdAt: "2026-03-01T00:00:00.000Z"
  }
];

export const mockSupportTickets: SupportTicket[] = [
  {
    id: "ticket-01",
    userId: accountOwnerId,
    subject: "Debit card travel notice",
    status: "pending",
    priority: "medium",
    latestMessage: "Travel notice submitted and queued for agent review.",
    createdAt: "2026-03-11T11:30:00.000Z"
  }
];

export const mockFraudEvents: FraudEvent[] = [
  {
    id: "fraud-01",
    userId: accountOwnerId,
    accountId: "acc-checking-01",
    severity: "medium",
    ruleName: "velocity_check",
    status: "reviewing",
    detectedAt: "2026-03-13T18:41:00.000Z"
  }
];

export const mockAuditLogs: AuditLog[] = [
  {
    id: "audit-01",
    userId: accountOwnerId,
    action: "transfer.created",
    entity: "transfers",
    entityId: "trf-01",
    timestamp: "2026-03-10T13:00:00.000Z"
  },
  {
    id: "audit-02",
    userId: accountOwnerId,
    action: "device.login_detected",
    entity: "device_sessions",
    entityId: "device-01",
    timestamp: "2026-03-13T18:44:00.000Z"
  }
];

export const mockDashboardSnapshot: DashboardSnapshot = {
  netWorth: 28318.57,
  monthToDateSpend: 1836.42,
  upcomingBills: 232.18,
  cashFlow: 1413.58,
  accounts: mockAccounts,
  recentTransactions: mockTransactions,
  financialGoals: [
    {
      id: "goal-01",
      userId: accountOwnerId,
      name: "Emergency fund",
      currentAmount: 8200,
      targetAmount: 15000,
      targetDate: "2026-09-01"
    },
    {
      id: "goal-02",
      userId: accountOwnerId,
      name: "Vacation savings",
      currentAmount: 2300,
      targetAmount: 5000,
      targetDate: "2026-06-15"
    }
  ],
  notifications: mockNotifications
};
