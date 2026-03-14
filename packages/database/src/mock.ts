import type {
  Account,
  AuditLog,
  Bill,
  BusinessMembership,
  BusinessProfile,
  BudgetTarget,
  BudgetInsight,
  Card,
  CreditProfile,
  CreditScoreSnapshot,
  DashboardSnapshot,
  DeviceSession,
  FraudEvent,
  Loan,
  LoanWithSchedule,
  NotificationItem,
  P2PContact,
  P2PTransfer,
  SavingsRule,
  StatementDocument,
  SupportTicket,
  Transaction,
  UserProfile,
  WalletToken,
  WireTransfer
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
  },
  {
    id: "doc-03",
    userId: accountOwnerId,
    documentType: "account-summary",
    storagePath: "documents/account-summary-march-2026.pdf",
    status: "available",
    createdAt: "2026-03-14T00:00:00.000Z"
  },
  {
    id: "doc-04",
    userId: accountOwnerId,
    documentType: "initial-disclosure",
    storagePath: "documents/initial-disclosure.pdf",
    status: "available",
    createdAt: "2025-09-01T00:00:00.000Z"
  }
];

export const mockBudgetTargets: BudgetTarget[] = [
  {
    id: "budget-01",
    userId: accountOwnerId,
    category: "Dining",
    limitAmount: 450,
    period: "monthly",
    alertThreshold: 0.8,
    active: true,
    createdAt: "2026-03-01T00:00:00.000Z"
  },
  {
    id: "budget-02",
    userId: accountOwnerId,
    category: "Transport",
    limitAmount: 300,
    period: "monthly",
    alertThreshold: 0.85,
    active: true,
    createdAt: "2026-03-01T00:00:00.000Z"
  }
];

export const mockBudgetInsights: BudgetInsight[] = [
  {
    category: "Dining",
    limitAmount: 450,
    spentAmount: 286,
    remainingAmount: 164,
    utilization: 0.64,
    status: "on_track"
  },
  {
    category: "Transport",
    limitAmount: 300,
    spentAmount: 242,
    remainingAmount: 58,
    utilization: 0.81,
    status: "watch"
  }
];

export const mockSavingsRules: SavingsRule[] = [
  {
    id: "save-rule-01",
    userId: accountOwnerId,
    sourceAccountId: "acc-checking-01",
    destinationAccountId: "acc-savings-01",
    ruleType: "recurring",
    amount: 250,
    cadence: "monthly",
    active: true,
    nextRunAt: "2026-04-01T09:00:00.000Z",
    createdAt: "2026-03-01T00:00:00.000Z"
  }
];

export const mockP2PContacts: P2PContact[] = [
  {
    id: "p2p-contact-01",
    userId: accountOwnerId,
    displayName: "Jane Smith",
    handle: "@jane",
    destinationReference: "jane-smith@instantpay",
    status: "active",
    createdAt: "2026-03-01T00:00:00.000Z"
  }
];

export const mockP2PTransfers: P2PTransfer[] = [
  {
    id: "p2p-transfer-01",
    userId: accountOwnerId,
    contactId: "p2p-contact-01",
    fromAccountId: "acc-checking-01",
    amount: 42.5,
    direction: "sent",
    status: "completed",
    note: "Dinner split",
    createdAt: "2026-03-12T19:00:00.000Z",
    completedAt: "2026-03-12T19:01:00.000Z"
  }
];

export const mockBusinessProfiles: BusinessProfile[] = [
  {
    id: "biz-01",
    userId: accountOwnerId,
    businessName: "Oak Street Studio",
    legalName: "Oak Street Studio LLC",
    industry: "Professional Services",
    taxIdMasked: "**-***8421",
    status: "active",
    createdAt: "2026-02-10T00:00:00.000Z"
  }
];

export const mockBusinessMemberships: BusinessMembership[] = [
  {
    id: "biz-member-01",
    businessProfileId: "biz-01",
    userId: accountOwnerId,
    membershipRole: "owner",
    status: "active",
    createdAt: "2026-02-10T00:00:00.000Z"
  }
];

export const mockWireTransfers: WireTransfer[] = [
  {
    id: "wire-01",
    userId: accountOwnerId,
    fromAccountId: "acc-checking-01",
    beneficiaryName: "Evergreen Escrow",
    beneficiaryBank: "First National Bank",
    routingNumberMasked: "*****1023",
    accountNumberLast4: "5567",
    amount: 1250,
    purpose: "Property deposit",
    status: "pending",
    reviewStatus: "pending_review",
    createdAt: "2026-03-14T09:00:00.000Z",
    submittedAt: "2026-03-14T09:00:00.000Z"
  }
];

export const mockCreditProfile: CreditProfile = {
  id: "credit-profile-01",
  userId: accountOwnerId,
  provider: "TransUnion",
  score: 742,
  scoreBand: "good",
  updatedAt: "2026-03-10T00:00:00.000Z"
};

export const mockCreditScoreSnapshots: CreditScoreSnapshot[] = [
  {
    id: "credit-snap-01",
    userId: accountOwnerId,
    score: 728,
    reasonCodes: ["High card utilization", "Thin installment mix"],
    recordedAt: "2026-01-10T00:00:00.000Z"
  },
  {
    id: "credit-snap-02",
    userId: accountOwnerId,
    score: 735,
    reasonCodes: ["Improving utilization", "On-time payment streak"],
    recordedAt: "2026-02-10T00:00:00.000Z"
  },
  {
    id: "credit-snap-03",
    userId: accountOwnerId,
    score: 742,
    reasonCodes: ["Low delinquency risk", "Stable account age"],
    recordedAt: "2026-03-10T00:00:00.000Z"
  }
];

export const mockWalletTokens: WalletToken[] = [
  {
    id: "wallet-01",
    userId: accountOwnerId,
    cardId: "card-01",
    provider: "apple_pay",
    deviceLabel: "iPhone 16 Pro",
    status: "active",
    createdAt: "2026-03-01T00:00:00.000Z"
  },
  {
    id: "wallet-02",
    userId: accountOwnerId,
    cardId: "card-02",
    provider: "google_pay",
    deviceLabel: "Pixel Fold",
    status: "pending",
    createdAt: "2026-03-11T00:00:00.000Z"
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
