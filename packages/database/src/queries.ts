import { z } from "zod";
import type {
  Account,
  AuditLog,
  Bill,
  BusinessMembership,
  BusinessProfile,
  BudgetInsight,
  BudgetTarget,
  ChatMessage,
  Card,
  CreditProfile,
  CreditScoreSnapshot,
  DashboardSnapshot,
  DeviceSession,
  FinancialGoal,
  FraudEvent,
  Loan,
  LoanWithSchedule,
  NotificationItem,
  P2PContact,
  P2PTransfer,
  SavingsRule,
  StatementDocument,
  SupportTicket,
  TransferQuote,
  Transaction,
  UserProfile,
  WalletToken,
  WireTransfer
} from "@banking/types";
import {
  createServiceRoleSupabaseClient,
  createServerSupabaseClient,
  hasSupabaseEnv,
  type BankingSupabaseClient
} from "./client";
import {
  mockAccounts,
  mockAuditLogs,
  mockBills,
  mockBusinessMemberships,
  mockBusinessProfiles,
  mockBudgetInsights,
  mockBudgetTargets,
  mockCards,
  mockCreditProfile,
  mockCreditScoreSnapshots,
  mockDashboardSnapshot,
  mockDeviceSessions,
  mockDocuments,
  mockFraudEvents,
  mockLoanDetails,
  mockLoans,
  mockNotifications,
  mockP2PContacts,
  mockP2PTransfers,
  mockSavingsRules,
  mockSupportTickets,
  mockTransactions,
  mockUsers,
  mockWalletTokens,
  mockWireTransfers
} from "./mock";

function asString(value: unknown) {
  return String(value ?? "");
}

function asNumber(value: unknown) {
  return Number(value ?? 0);
}

const transferInputSchema = z
  .object({
    fromAccountId: z.string().min(1),
    toAccountId: z.preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
      z.string().min(1).optional()
    ),
    externalDestination: z.preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
      z.string().min(1).optional()
    ),
    amount: z.number().positive(),
    memo: z.string().max(140).optional(),
    rail: z.enum(["internal", "ach"]).default("internal")
  })
  .superRefine((value, ctx) => {
    if (value.rail === "internal" && !value.toAccountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Destination account is required for internal transfers.",
        path: ["toAccountId"]
      });
    }

    if (value.rail === "ach" && !value.externalDestination) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "External ACH destination is required.",
        path: ["externalDestination"]
      });
    }
  });

const billInputSchema = z.object({
  payeeName: z.string().min(1),
  payeeCategory: z.string().min(1),
  amount: z.number().positive(),
  dueDate: z.string().min(1),
  autopay: z.boolean().default(false)
});

const cardControlSchema = z.object({
  cardId: z.string().min(1),
  action: z.enum(["freeze", "unfreeze", "set_limit"]),
  spendLimit: z.number().positive().optional()
});

const deviceTrustSchema = z.object({
  deviceSessionId: z.string().min(1),
  trusted: z.boolean()
});

const mfaChallengeSchema = z.object({
  factorType: z.enum(["totp", "sms"]),
  code: z.string().length(6).optional()
});

const supportTicketSchema = z.object({
  subject: z.string().min(3).max(120),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  message: z.string().min(10).max(500)
});

const budgetTargetSchema = z.object({
  category: z.string().min(2).max(60),
  limitAmount: z.number().positive(),
  alertThreshold: z.number().min(0.5).max(1).default(0.8)
});

const savingsRuleSchema = z.object({
  sourceAccountId: z.string().min(1),
  destinationAccountId: z.string().min(1),
  ruleType: z.enum(["roundup", "recurring", "percentage"]),
  amount: z.number().positive(),
  cadence: z.enum(["weekly", "biweekly", "monthly", "per_transaction"]),
  active: z.boolean().default(true)
});

const savingsRuleToggleSchema = z.object({
  ruleId: z.string().min(1),
  active: z.boolean()
});

const p2pContactSchema = z.object({
  displayName: z.string().min(2).max(80),
  handle: z.string().min(2).max(40),
  destinationReference: z.string().min(3).max(120)
});

const p2pTransferSchema = z.object({
  contactId: z.string().min(1),
  fromAccountId: z.string().min(1),
  amount: z.number().positive(),
  direction: z.enum(["sent", "requested"]),
  note: z.string().max(120).optional()
});

const businessProfileSchema = z.object({
  businessName: z.string().min(2).max(120),
  legalName: z.string().min(2).max(160),
  industry: z.string().min(2).max(120),
  taxId: z.string().min(4).max(20)
});

const businessMembershipSchema = z.object({
  businessProfileId: z.string().min(1),
  email: z.string().email(),
  membershipRole: z.enum(["owner", "operator", "viewer"])
});

const wireTransferSchema = z.object({
  fromAccountId: z.string().min(1),
  beneficiaryName: z.string().min(2).max(120),
  beneficiaryBank: z.string().min(2).max(120),
  routingNumber: z.string().regex(/^\d{9}$/, "Routing number must contain 9 digits."),
  accountNumber: z.string().min(4).max(17),
  amount: z.number().positive(),
  purpose: z.string().min(4).max(160)
});

const wireReviewSchema = z.object({
  wireId: z.string().min(1),
  reviewStatus: z.enum(["approved", "flagged"])
});

const walletTokenSchema = z.object({
  cardId: z.string().min(1),
  provider: z.enum(["apple_pay", "google_pay"]),
  deviceLabel: z.string().min(2).max(80)
});

const walletTokenStatusSchema = z.object({
  walletTokenId: z.string().min(1),
  status: z.enum(["active", "suspended"])
});

const fraudReviewSchema = z.object({
  fraudEventId: z.string().min(1),
  status: z.enum(["open", "reviewing", "closed"])
});

const loanPaymentSchema = z.object({
  loanId: z.string().min(1),
  sourceAccountId: z.string().min(1),
  amount: z.number().positive()
});

const transactionSearchSchema = z.object({
  q: z.string().optional(),
  accountId: z.string().optional(),
  direction: z.enum(["debit", "credit"]).optional(),
  category: z.string().optional(),
  limit: z.coerce.number().int().positive().max(200).default(50)
});

const transferQuoteSchema = z.object({
  fromAccountId: z.string().min(1),
  toAccountId: z.string().optional(),
  externalDestination: z.string().optional(),
  amount: z.number().positive(),
  memo: z.string().max(140).optional(),
  rail: z.enum(["internal", "ach"]).default("internal")
});

async function fallbackOrQuery<T>(
  table: string,
  fallback: T,
  columns = "*",
  client?: BankingSupabaseClient | null
): Promise<T> {
  if (!hasSupabaseEnv()) {
    return fallback;
  }

  const scopedClient = client ?? createServerSupabaseClient();

  if (!scopedClient) {
    return fallback;
  }

  const { data, error } = await scopedClient.from(table).select(columns);

  if (error) {
    throw error;
  }

  if (!data) {
    return fallback;
  }

  return data as T;
}

async function requireAuthenticatedUserId(
  client?: BankingSupabaseClient | null
): Promise<string> {
  if (!client) {
    throw new Error("Authenticated Supabase client is required.");
  }

  const {
    data: { user },
    error
  } = await client.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error("Authentication required.");
  }

  return user.id;
}

function addDays(value: Date, days: number) {
  return new Date(value.getTime() + days * 24 * 60 * 60 * 1000);
}

function nextRunForCadence(cadence: SavingsRule["cadence"], from = new Date()) {
  if (cadence === "per_transaction") {
    return null;
  }

  if (cadence === "weekly") {
    return addDays(from, 7).toISOString();
  }

  if (cadence === "biweekly") {
    return addDays(from, 14).toISOString();
  }

  return addDays(from, 30).toISOString();
}

function maskRoutingNumber(value: string) {
  return `${"*".repeat(Math.max(value.length - 4, 0))}${value.slice(-4)}`;
}

function maskAccountNumber(value: string) {
  return value.slice(-4);
}

async function insertNotificationSafe(
  client: BankingSupabaseClient,
  userId: string,
  type: string,
  message: string
) {
  await client.from("notifications").insert({
    user_id: userId,
    type,
    message,
    read: false
  });
}

async function insertAuditSafe(
  client: BankingSupabaseClient,
  userId: string | null,
  action: string,
  entity: string,
  entityId: string | null
) {
  await client.from("audit_logs").insert({
    user_id: userId,
    action,
    entity,
    entity_id: entityId,
    timestamp: new Date().toISOString()
  });
}

async function hasStepUpRequirement(
  userId: string,
  client?: BankingSupabaseClient | null
) {
  const privilegedClient = createServiceRoleSupabaseClient() ?? client;

  if (!privilegedClient) {
    return false;
  }

  const { data, error } = await privilegedClient
    .from("fraud_events")
    .select("id")
    .eq("user_id", userId)
    .in("severity", ["high", "critical"])
    .in("status", ["open", "reviewing"])
    .limit(1);

  if (error) {
    throw error;
  }

  return Boolean(data && data.length > 0);
}

export async function listAccounts(
  client?: BankingSupabaseClient | null
): Promise<Account[]> {
  const rows = await fallbackOrQuery<Record<string, unknown>[]>(
    "accounts",
    mockAccounts as unknown as Record<string, unknown>[],
    "*",
    client
  );

  return rows.map((item) => ({
    id: asString(item.id),
    userId: asString(item.user_id ?? item.userId),
    accountType: asString(
      item.account_type ?? item.accountType
    ) as Account["accountType"],
    nickname: asString(item.nickname),
    accountNumber: asString(item.account_number ?? item.accountNumber),
    balance: asNumber(item.balance),
    availableBalance: asNumber(item.available_balance ?? item.availableBalance),
    currency: asString(item.currency ?? "USD"),
    status: asString(item.status) as Account["status"],
    createdAt: asString(item.created_at ?? item.createdAt)
  }));
}

export async function listAuthenticatedAccounts(
  client?: BankingSupabaseClient | null
): Promise<Account[]> {
  if (!hasSupabaseEnv() || !client) {
    return mockAccounts;
  }

  const userId = await requireAuthenticatedUserId(client);
  const privilegedClient = createServiceRoleSupabaseClient() ?? client;
  const { data, error } = await privilegedClient
    .from("accounts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as Record<string, unknown>[];

  return rows.map((item) => ({
    id: asString(item.id),
    userId: asString(item.user_id ?? item.userId),
    accountType: asString(
      item.account_type ?? item.accountType
    ) as Account["accountType"],
    nickname: asString(item.nickname),
    accountNumber: asString(item.account_number ?? item.accountNumber),
    balance: asNumber(item.balance),
    availableBalance: asNumber(item.available_balance ?? item.availableBalance),
    currency: asString(item.currency ?? "USD"),
    status: asString(item.status) as Account["status"],
    createdAt: asString(item.created_at ?? item.createdAt)
  }));
}

export async function listTransactions(
  client?: BankingSupabaseClient | null
): Promise<Transaction[]> {
  const rows = await fallbackOrQuery<Record<string, unknown>[]>(
    "transactions",
    mockTransactions as unknown as Record<string, unknown>[],
    "id, account_id, amount, direction, type, category, description, merchant_name, posted_at",
    client
  );

  return rows.map((item) => ({
    id: asString(item.id),
    accountId: asString(item.account_id ?? item.accountId),
    amount: asNumber(item.amount),
    direction: asString(item.direction) as Transaction["direction"],
    type: asString(item.type) as Transaction["type"],
    category: asString(item.category),
    description: asString(item.description),
    merchantName: item.merchant_name ? asString(item.merchant_name) : null,
    postedAt: asString(item.posted_at ?? item.postedAt)
  }));
}

export async function listAuthenticatedTransactions(
  client?: BankingSupabaseClient | null
): Promise<Transaction[]> {
  if (!hasSupabaseEnv() || !client) {
    return mockTransactions;
  }

  const accounts = await listAuthenticatedAccounts(client);
  const accountIds = accounts.map((account) => account.id);

  if (accountIds.length === 0) {
    return [];
  }

  const privilegedClient = createServiceRoleSupabaseClient() ?? client;
  const { data, error } = await privilegedClient
    .from("transactions")
    .select("id, account_id, amount, direction, type, category, description, merchant_name, posted_at")
    .in("account_id", accountIds)
    .order("posted_at", { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as Record<string, unknown>[];

  return rows.map((item) => ({
    id: asString(item.id),
    accountId: asString(item.account_id ?? item.accountId),
    amount: asNumber(item.amount),
    direction: asString(item.direction) as Transaction["direction"],
    type: asString(item.type) as Transaction["type"],
    category: asString(item.category),
    description: asString(item.description),
    merchantName: item.merchant_name ? asString(item.merchant_name) : null,
    postedAt: asString(item.posted_at ?? item.postedAt)
  }));
}

export async function searchTransactions(
  input: unknown,
  client?: BankingSupabaseClient | null
): Promise<Transaction[]> {
  const query = transactionSearchSchema.parse(input ?? {});
  const transactions = await listTransactions(client);

  return transactions
    .filter((transaction) =>
      query.accountId ? transaction.accountId === query.accountId : true
    )
    .filter((transaction) =>
      query.direction ? transaction.direction === query.direction : true
    )
    .filter((transaction) =>
      query.category
        ? transaction.category.toLowerCase() === query.category.toLowerCase()
        : true
    )
    .filter((transaction) =>
      query.q
        ? `${transaction.description} ${transaction.merchantName ?? ""}`
            .toLowerCase()
            .includes(query.q.toLowerCase())
        : true
    )
    .slice(0, query.limit);
}

export async function searchAuthenticatedTransactions(
  input: unknown,
  client?: BankingSupabaseClient | null
): Promise<Transaction[]> {
  const query = transactionSearchSchema.parse(input ?? {});
  const transactions = await listAuthenticatedTransactions(client);

  return transactions
    .filter((transaction) =>
      query.accountId ? transaction.accountId === query.accountId : true
    )
    .filter((transaction) =>
      query.direction ? transaction.direction === query.direction : true
    )
    .filter((transaction) =>
      query.category
        ? transaction.category.toLowerCase() === query.category.toLowerCase()
        : true
    )
    .filter((transaction) =>
      query.q
        ? `${transaction.description} ${transaction.merchantName ?? ""}`
            .toLowerCase()
            .includes(query.q.toLowerCase())
        : true
    )
    .slice(0, query.limit);
}

export async function listBills(
  client?: BankingSupabaseClient | null
): Promise<Bill[]> {
  const rows = await fallbackOrQuery<Record<string, unknown>[]>(
    "bills",
    mockBills as unknown as Record<string, unknown>[],
    "id, user_id, amount, due_date, status, frequency, payees(name)",
    client
  );

  return rows.map((item) => ({
    id: asString(item.id),
    userId: asString(item.user_id ?? item.userId),
    payeeName:
      typeof item.payees === "object" && item.payees && "name" in item.payees
        ? asString((item.payees as { name?: unknown }).name)
        : asString(item.payee_name ?? item.payeeName ?? item.name),
    amount: asNumber(item.amount),
    dueDate: asString(item.due_date ?? item.dueDate),
    status: asString(item.status) as Bill["status"],
    frequency: asString(item.frequency)
  }));
}

export async function listAuthenticatedBills(
  client?: BankingSupabaseClient | null
): Promise<Bill[]> {
  if (!hasSupabaseEnv() || !client) {
    return mockBills;
  }

  const userId = await requireAuthenticatedUserId(client);
  const privilegedClient = createServiceRoleSupabaseClient() ?? client;
  const { data, error } = await privilegedClient
    .from("bills")
    .select("id, user_id, amount, due_date, status, frequency, payees(name)")
    .eq("user_id", userId)
    .order("due_date", { ascending: true });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as Record<string, unknown>[];

  return rows.map((item) => ({
    id: asString(item.id),
    userId: asString(item.user_id ?? item.userId),
    payeeName:
      typeof item.payees === "object" && item.payees && "name" in item.payees
        ? asString((item.payees as { name?: unknown }).name)
        : asString(item.payee_name ?? item.payeeName ?? item.name),
    amount: asNumber(item.amount),
    dueDate: asString(item.due_date ?? item.dueDate),
    status: asString(item.status) as Bill["status"],
    frequency: asString(item.frequency)
  }));
}

export async function listCards(
  client?: BankingSupabaseClient | null
): Promise<Card[]> {
  const rows = await fallbackOrQuery<Record<string, unknown>[]>(
    "cards",
    mockCards as unknown as Record<string, unknown>[],
    "*",
    client
  );

  return rows.map((item) => ({
    id: asString(item.id),
    userId: asString(item.user_id ?? item.userId),
    accountId: asString(item.account_id ?? item.accountId),
    cardType: asString(item.card_type ?? item.cardType) as Card["cardType"],
    network: asString(item.network),
    last4: asString(item.last4),
    status: asString(item.status) as Card["status"],
    spendLimit:
      item.spend_limit === null || item.spendLimit === null
        ? null
        : asNumber(item.spend_limit ?? item.spendLimit)
  }));
}

export async function listAuthenticatedCards(
  client?: BankingSupabaseClient | null
): Promise<Card[]> {
  if (!hasSupabaseEnv() || !client) {
    return mockCards;
  }

  const userId = await requireAuthenticatedUserId(client);
  const privilegedClient = createServiceRoleSupabaseClient() ?? client;
  const { data, error } = await privilegedClient
    .from("cards")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as Record<string, unknown>[];

  return rows.map((item) => ({
    id: asString(item.id),
    userId: asString(item.user_id ?? item.userId),
    accountId: asString(item.account_id ?? item.accountId),
    cardType: asString(item.card_type ?? item.cardType) as Card["cardType"],
    network: asString(item.network),
    last4: asString(item.last4),
    status: asString(item.status) as Card["status"],
    spendLimit:
      item.spend_limit === null || item.spendLimit === null
        ? null
        : asNumber(item.spend_limit ?? item.spendLimit)
  }));
}

export async function listLoans(
  client?: BankingSupabaseClient | null
): Promise<Loan[]> {
  const rows = await fallbackOrQuery<Record<string, unknown>[]>(
    "loans",
    mockLoans as unknown as Record<string, unknown>[],
    "*",
    client
  );

  return rows.map((item) => ({
    id: asString(item.id),
    userId: asString(item.user_id ?? item.userId),
    loanType: asString(item.loan_type ?? item.loanType) as Loan["loanType"],
    balance: asNumber(item.balance),
    originalAmount: asNumber(item.original_amount ?? item.originalAmount),
    interestRate: asNumber(item.interest_rate ?? item.interestRate),
    nextPaymentDate: asString(item.next_payment_date ?? item.nextPaymentDate),
    status: asString(item.status) as Loan["status"]
  }));
}

export async function listAuthenticatedLoans(
  client?: BankingSupabaseClient | null
): Promise<Loan[]> {
  if (!hasSupabaseEnv() || !client) {
    return mockLoans;
  }

  const userId = await requireAuthenticatedUserId(client);
  const privilegedClient = createServiceRoleSupabaseClient() ?? client;
  const { data, error } = await privilegedClient
    .from("loans")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as Record<string, unknown>[];

  return rows.map((item) => ({
    id: asString(item.id),
    userId: asString(item.user_id ?? item.userId),
    loanType: asString(item.loan_type ?? item.loanType) as Loan["loanType"],
    balance: asNumber(item.balance),
    originalAmount: asNumber(item.original_amount ?? item.originalAmount),
    interestRate: asNumber(item.interest_rate ?? item.interestRate),
    nextPaymentDate: asString(item.next_payment_date ?? item.nextPaymentDate),
    status: asString(item.status) as Loan["status"]
  }));
}

export async function getLoanDetails(
  client?: BankingSupabaseClient | null
): Promise<LoanWithSchedule[]> {
  if (!hasSupabaseEnv() || !client) {
    return mockLoanDetails;
  }

  const loans = await listLoans(client);

  return loans.map((loan) => ({
    ...loan,
    monthlyPayment: Math.max(Number((loan.balance * 0.039).toFixed(2)), 75),
    amortization: Array.from({ length: 3 }, (_, index) => {
      const principal = Number((loan.balance * 0.035).toFixed(2));
      const interest = Number(
        ((loan.balance * loan.interestRate) / 1200).toFixed(2)
      );
      return {
        installment: index + 1,
        paymentDate: new Date(
          new Date(loan.nextPaymentDate).getTime() +
            index * 30 * 24 * 60 * 60 * 1000
        )
          .toISOString()
          .slice(0, 10),
        principal,
        interest,
        balance: Number((loan.balance - principal * (index + 1)).toFixed(2))
      };
    })
  }));
}

export async function getAuthenticatedLoanDetails(
  client?: BankingSupabaseClient | null
): Promise<LoanWithSchedule[]> {
  const loans = await listAuthenticatedLoans(client);

  return loans.map((loan) => ({
    ...loan,
    monthlyPayment: Math.max(Number((loan.balance * 0.039).toFixed(2)), 75),
    amortization: Array.from({ length: 3 }, (_, index) => {
      const principal = Number((loan.balance * 0.035).toFixed(2));
      const interest = Number(
        ((loan.balance * loan.interestRate) / 1200).toFixed(2)
      );
      return {
        installment: index + 1,
        paymentDate: new Date(
          new Date(loan.nextPaymentDate).getTime() +
            index * 30 * 24 * 60 * 60 * 1000
        )
          .toISOString()
          .slice(0, 10),
        principal,
        interest,
        balance: Number((loan.balance - principal * (index + 1)).toFixed(2))
      };
    })
  }));
}

export async function listNotifications(
  client?: BankingSupabaseClient | null
): Promise<NotificationItem[]> {
  const rows = await fallbackOrQuery<Record<string, unknown>[]>(
    "notifications",
    mockNotifications as unknown as Record<string, unknown>[],
    "*",
    client
  );

  return rows.map((item) => ({
    id: asString(item.id),
    userId: asString(item.user_id ?? item.userId),
    type: asString(item.type),
    message: asString(item.message),
    read: Boolean(item.read),
    createdAt: asString(item.created_at ?? item.createdAt)
  }));
}

export async function listAuthenticatedNotifications(
  client?: BankingSupabaseClient | null
): Promise<NotificationItem[]> {
  if (!hasSupabaseEnv() || !client) {
    return mockNotifications;
  }

  const userId = await requireAuthenticatedUserId(client);
  const privilegedClient = createServiceRoleSupabaseClient() ?? client;
  const { data, error } = await privilegedClient
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as Record<string, unknown>[];

  return rows.map((item) => ({
    id: asString(item.id),
    userId: asString(item.user_id ?? item.userId),
    type: asString(item.type),
    message: asString(item.message),
    read: Boolean(item.read),
    createdAt: asString(item.created_at ?? item.createdAt)
  }));
}

export async function listSupportTickets(
  client?: BankingSupabaseClient | null
): Promise<SupportTicket[]> {
  const rows = await fallbackOrQuery<Record<string, unknown>[]>(
    "support_tickets",
    mockSupportTickets as unknown as Record<string, unknown>[],
    "*",
    client
  );

  return rows.map((item) => ({
    id: asString(item.id),
    userId: asString(item.user_id ?? item.userId),
    subject: asString(item.subject),
    status: asString(item.status) as SupportTicket["status"],
    priority: asString(item.priority) as SupportTicket["priority"],
    latestMessage: asString(item.latest_message ?? item.latestMessage),
    createdAt: asString(item.created_at ?? item.createdAt)
  }));
}

export async function listAuthenticatedSupportTickets(
  client?: BankingSupabaseClient | null
): Promise<SupportTicket[]> {
  if (!hasSupabaseEnv() || !client) {
    return mockSupportTickets;
  }

  const userId = await requireAuthenticatedUserId(client);
  const privilegedClient = createServiceRoleSupabaseClient() ?? client;
  const { data, error } = await privilegedClient
    .from("support_tickets")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as Record<string, unknown>[];

  return rows.map((item) => ({
    id: asString(item.id),
    userId: asString(item.user_id ?? item.userId),
    subject: asString(item.subject),
    status: asString(item.status) as SupportTicket["status"],
    priority: asString(item.priority) as SupportTicket["priority"],
    latestMessage: asString(item.latest_message ?? item.latestMessage),
    createdAt: asString(item.created_at ?? item.createdAt)
  }));
}

export async function listDocuments(
  client?: BankingSupabaseClient | null
): Promise<StatementDocument[]> {
  const rows = await fallbackOrQuery<Record<string, unknown>[]>(
    "documents",
    mockDocuments as unknown as Record<string, unknown>[],
    "*",
    client
  );

  return rows.map((item) => ({
    id: asString(item.id),
    userId: asString(item.user_id ?? item.userId),
    documentType: asString(item.document_type ?? item.documentType),
    storagePath: asString(item.storage_path ?? item.storagePath),
    status: asString(item.status),
    createdAt: asString(item.created_at ?? item.createdAt)
  }));
}

export async function listAuthenticatedDocuments(
  client?: BankingSupabaseClient | null
): Promise<StatementDocument[]> {
  if (!hasSupabaseEnv() || !client) {
    return mockDocuments;
  }

  const userId = await requireAuthenticatedUserId(client);
  const privilegedClient = createServiceRoleSupabaseClient() ?? client;
  const { data, error } = await privilegedClient
    .from("documents")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as Record<string, unknown>[];

  return rows.map((item) => ({
    id: asString(item.id),
    userId: asString(item.user_id ?? item.userId),
    documentType: asString(item.document_type ?? item.documentType),
    storagePath: asString(item.storage_path ?? item.storagePath),
    status: asString(item.status),
    createdAt: asString(item.created_at ?? item.createdAt)
  }));
}

export async function listBudgetTargets(
  client?: BankingSupabaseClient | null
): Promise<BudgetTarget[]> {
  if (!hasSupabaseEnv() || !client) {
    return mockBudgetTargets;
  }

  const userId = await requireAuthenticatedUserId(client);
  const privilegedClient = createServiceRoleSupabaseClient() ?? client;
  const { data, error } = await privilegedClient
    .from("budgets")
    .select("*")
    .eq("user_id", userId)
    .order("category", { ascending: true });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as Record<string, unknown>[];

  return rows.map((item) => ({
    id: asString(item.id),
    userId: asString(item.user_id ?? item.userId),
    category: asString(item.category),
    limitAmount: asNumber(item.limit_amount ?? item.limitAmount),
    period: "monthly",
    alertThreshold: asNumber(item.alert_threshold ?? item.alertThreshold),
    active: Boolean(item.active),
    createdAt: asString(item.created_at ?? item.createdAt)
  }));
}

export async function upsertBudgetTarget(
  input: unknown,
  client?: BankingSupabaseClient | null
) {
  const payload = budgetTargetSchema.parse(input);

  if (!hasSupabaseEnv() || !client) {
    return {
      id: "budget-preview",
      userId: mockUsers[0]?.id ?? "preview",
      period: "monthly" as const,
      active: true,
      createdAt: new Date().toISOString(),
      ...payload
    };
  }

  const userId = await requireAuthenticatedUserId(client);
  const privilegedClient = createServiceRoleSupabaseClient() ?? client;
  const normalizedCategory = payload.category.trim();
  const { data, error } = await privilegedClient
    .from("budgets")
    .upsert(
      {
        user_id: userId,
        category: normalizedCategory,
        limit_amount: payload.limitAmount,
        period: "monthly",
        alert_threshold: payload.alertThreshold,
        active: true
      },
      {
        onConflict: "user_id,category,period"
      }
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return {
    id: asString(data.id),
    userId,
    category: normalizedCategory,
    limitAmount: asNumber(data.limit_amount),
    period: "monthly" as const,
    alertThreshold: asNumber(data.alert_threshold),
    active: Boolean(data.active),
    createdAt: asString(data.created_at)
  };
}

export async function getBudgetInsights(
  client?: BankingSupabaseClient | null
): Promise<BudgetInsight[]> {
  if (!hasSupabaseEnv() || !client) {
    return mockBudgetInsights;
  }

  const [budgets, transactions] = await Promise.all([
    listBudgetTargets(client),
    listAuthenticatedTransactions(client)
  ]);

  return budgets.map((budget) => {
    const spentAmount = transactions
      .filter(
        (transaction) =>
          transaction.direction === "debit" &&
          transaction.category.toLowerCase() === budget.category.toLowerCase()
      )
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const utilization = budget.limitAmount > 0 ? spentAmount / budget.limitAmount : 0;
    const remainingAmount = Number((budget.limitAmount - spentAmount).toFixed(2));

    return {
      category: budget.category,
      limitAmount: budget.limitAmount,
      spentAmount: Number(spentAmount.toFixed(2)),
      remainingAmount,
      utilization: Number(utilization.toFixed(2)),
      status:
        spentAmount > budget.limitAmount
          ? "over_budget"
          : utilization >= budget.alertThreshold
            ? "watch"
            : "on_track"
    };
  });
}

export async function listSavingsRules(
  client?: BankingSupabaseClient | null
): Promise<SavingsRule[]> {
  if (!hasSupabaseEnv() || !client) {
    return mockSavingsRules;
  }

  const userId = await requireAuthenticatedUserId(client);
  const privilegedClient = createServiceRoleSupabaseClient() ?? client;
  const { data, error } = await privilegedClient
    .from("savings_rules")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as Record<string, unknown>[];

  return rows.map((item) => ({
    id: asString(item.id),
    userId: asString(item.user_id ?? item.userId),
    sourceAccountId: asString(item.source_account_id ?? item.sourceAccountId),
    destinationAccountId: asString(item.destination_account_id ?? item.destinationAccountId),
    ruleType: asString(item.rule_type ?? item.ruleType) as SavingsRule["ruleType"],
    amount: asNumber(item.amount),
    cadence: asString(item.cadence) as SavingsRule["cadence"],
    active: Boolean(item.active),
    nextRunAt:
      item.next_run_at === null || item.nextRunAt === null
        ? null
        : asString(item.next_run_at ?? item.nextRunAt),
    createdAt: asString(item.created_at ?? item.createdAt)
  }));
}

export async function createSavingsRule(
  input: unknown,
  client?: BankingSupabaseClient | null
) {
  const payload = savingsRuleSchema.parse(input);

  if (!hasSupabaseEnv() || !client) {
    return {
      id: "savings-rule-preview",
      userId: mockUsers[0]?.id ?? "preview",
      nextRunAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      ...payload
    };
  }

  const userId = await requireAuthenticatedUserId(client);
  const accounts = await listAuthenticatedAccounts(client);
  const sourceAccount = accounts.find((account) => account.id === payload.sourceAccountId);
  const destinationAccount = accounts.find(
    (account) => account.id === payload.destinationAccountId
  );

  if (!sourceAccount || !destinationAccount) {
    throw new Error("Savings automation accounts could not be found.");
  }

  if (sourceAccount.id === destinationAccount.id) {
    throw new Error("Source and destination accounts must be different.");
  }

  const nextRunAt =
    payload.cadence === "per_transaction"
      ? null
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const privilegedClient = createServiceRoleSupabaseClient() ?? client;
  const { data, error } = await privilegedClient
    .from("savings_rules")
    .insert({
      user_id: userId,
      source_account_id: payload.sourceAccountId,
      destination_account_id: payload.destinationAccountId,
      rule_type: payload.ruleType,
      amount: payload.amount,
      cadence: payload.cadence,
      active: payload.active,
      next_run_at: nextRunAt
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return {
    id: asString(data.id),
    userId,
    sourceAccountId: asString(data.source_account_id),
    destinationAccountId: asString(data.destination_account_id),
    ruleType: asString(data.rule_type) as SavingsRule["ruleType"],
    amount: asNumber(data.amount),
    cadence: asString(data.cadence) as SavingsRule["cadence"],
    active: Boolean(data.active),
    nextRunAt: data.next_run_at ? asString(data.next_run_at) : null,
    createdAt: asString(data.created_at)
  };
}

export async function updateSavingsRuleStatus(
  input: unknown,
  client?: BankingSupabaseClient | null
) {
  const payload = savingsRuleToggleSchema.parse(input);

  if (!hasSupabaseEnv() || !client) {
    return payload;
  }

  const userId = await requireAuthenticatedUserId(client);
  const privilegedClient = createServiceRoleSupabaseClient() ?? client;
  const { data, error } = await privilegedClient
    .from("savings_rules")
    .update({
      active: payload.active
    })
    .eq("id", payload.ruleId)
    .eq("user_id", userId)
    .select("id, active")
    .single();

  if (error) {
    throw error;
  }

  return {
    id: asString(data.id),
    active: Boolean(data.active)
  };
}

export async function executeSavingsRules(
  client?: BankingSupabaseClient | null
): Promise<{ processed: number; skipped: number }> {
  if (!hasSupabaseEnv() || !client) {
    return {
      processed: 1,
      skipped: 0
    };
  }

  const userId = await requireAuthenticatedUserId(client);
  const privilegedClient = createServiceRoleSupabaseClient() ?? client;
  const [rules, accounts] = await Promise.all([
    listSavingsRules(client),
    listAuthenticatedAccounts(client)
  ]);

  let processed = 0;
  let skipped = 0;

  for (const rule of rules.filter((item) => item.active)) {
    if (rule.ruleType === "percentage" || rule.ruleType === "roundup") {
      skipped += 1;
      continue;
    }

    if (rule.nextRunAt && new Date(rule.nextRunAt).getTime() > Date.now()) {
      skipped += 1;
      continue;
    }

    const source = accounts.find((account) => account.id === rule.sourceAccountId);
    const destination = accounts.find(
      (account) => account.id === rule.destinationAccountId
    );

    if (!source || !destination || source.availableBalance < rule.amount) {
      skipped += 1;
      continue;
    }

    const completedAt = new Date().toISOString();
    const nextSourceBalance = Number((source.balance - rule.amount).toFixed(2));
    const nextDestinationBalance = Number((destination.balance + rule.amount).toFixed(2));

    const { error: updateSourceError } = await privilegedClient
      .from("accounts")
      .update({
        balance: nextSourceBalance,
        available_balance: nextSourceBalance
      })
      .eq("id", source.id)
      .eq("user_id", userId);

    if (updateSourceError) {
      throw updateSourceError;
    }

    const { error: updateDestinationError } = await privilegedClient
      .from("accounts")
      .update({
        balance: nextDestinationBalance,
        available_balance: nextDestinationBalance
      })
      .eq("id", destination.id)
      .eq("user_id", userId);

    if (updateDestinationError) {
      throw updateDestinationError;
    }

    const { error: transactionError } = await privilegedClient.from("transactions").insert([
      {
        account_id: source.id,
        amount: rule.amount,
        direction: "debit",
        type: "transfer",
        category: "Savings",
        description: "Savings automation transfer",
        merchant_name: null,
        posted_at: completedAt,
        running_balance: nextSourceBalance,
        counterparty_account_id: destination.id
      },
      {
        account_id: destination.id,
        amount: rule.amount,
        direction: "credit",
        type: "transfer",
        category: "Savings",
        description: "Savings automation deposit",
        merchant_name: null,
        posted_at: completedAt,
        running_balance: nextDestinationBalance,
        counterparty_account_id: source.id
      }
    ]);

    if (transactionError) {
      throw transactionError;
    }

    const { error: ruleError } = await privilegedClient
      .from("savings_rules")
      .update({
        next_run_at: nextRunForCadence(rule.cadence, new Date(completedAt))
      })
      .eq("id", rule.id)
      .eq("user_id", userId);

    if (ruleError) {
      throw ruleError;
    }

    await insertNotificationSafe(
      privilegedClient,
      userId,
      "savings",
      `Savings automation moved ${rule.amount.toFixed(2)} into ${destination.nickname}.`
    );
    await insertAuditSafe(privilegedClient, userId, "savings.executed", "savings_rules", rule.id);
    processed += 1;
  }

  return { processed, skipped };
}

export async function runBudgetMonthClose(
  client?: BankingSupabaseClient | null
): Promise<{ alerts: number; overBudget: number }> {
  if (!hasSupabaseEnv() || !client) {
    return {
      alerts: mockBudgetInsights.filter((item) => item.status !== "on_track").length,
      overBudget: mockBudgetInsights.filter((item) => item.status === "over_budget").length
    };
  }

  const userId = await requireAuthenticatedUserId(client);
  const privilegedClient = createServiceRoleSupabaseClient() ?? client;
  const insights = await getBudgetInsights(client);
  const actionable = insights.filter((item) => item.status !== "on_track");

  for (const insight of actionable) {
    const descriptor =
      insight.status === "over_budget"
        ? `Budget exceeded in ${insight.category} by ${Math.abs(insight.remainingAmount).toFixed(2)}.`
        : `Budget watch alert for ${insight.category}; ${Math.round(insight.utilization * 100)}% used.`;

    await insertNotificationSafe(privilegedClient, userId, "budget", descriptor);
  }

  await insertAuditSafe(privilegedClient, userId, "budget.month_close", "budgets", null);

  return {
    alerts: actionable.length,
    overBudget: actionable.filter((item) => item.status === "over_budget").length
  };
}

export async function listP2PContacts(
  client?: BankingSupabaseClient | null
): Promise<P2PContact[]> {
  if (!hasSupabaseEnv() || !client) {
    return mockP2PContacts;
  }

  const userId = await requireAuthenticatedUserId(client);
  const privilegedClient = createServiceRoleSupabaseClient() ?? client;
  const { data, error } = await privilegedClient
    .from("p2p_contacts")
    .select("*")
    .eq("user_id", userId)
    .order("display_name", { ascending: true });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as Record<string, unknown>[];

  return rows.map((item) => ({
    id: asString(item.id),
    userId: asString(item.user_id ?? item.userId),
    displayName: asString(item.display_name ?? item.displayName),
    handle: asString(item.handle),
    destinationReference: asString(
      item.destination_reference ?? item.destinationReference
    ),
    status: asString(item.status) as P2PContact["status"],
    createdAt: asString(item.created_at ?? item.createdAt)
  }));
}

export async function createP2PContact(
  input: unknown,
  client?: BankingSupabaseClient | null
) {
  const payload = p2pContactSchema.parse(input);

  if (!hasSupabaseEnv() || !client) {
    return {
      id: "p2p-contact-preview",
      userId: mockUsers[0]?.id ?? "preview",
      status: "active" as const,
      createdAt: new Date().toISOString(),
      ...payload
    };
  }

  const userId = await requireAuthenticatedUserId(client);
  const privilegedClient = createServiceRoleSupabaseClient() ?? client;
  const { data, error } = await privilegedClient
    .from("p2p_contacts")
    .insert({
      user_id: userId,
      display_name: payload.displayName.trim(),
      handle: payload.handle.trim(),
      destination_reference: payload.destinationReference.trim(),
      status: "active"
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await insertAuditSafe(
    privilegedClient,
    userId,
    "p2p.contact_created",
    "p2p_contacts",
    asString(data.id)
  );

  return {
    id: asString(data.id),
    userId,
    displayName: asString(data.display_name),
    handle: asString(data.handle),
    destinationReference: asString(data.destination_reference),
    status: asString(data.status) as P2PContact["status"],
    createdAt: asString(data.created_at)
  };
}

export async function listP2PTransfers(
  client?: BankingSupabaseClient | null
): Promise<P2PTransfer[]> {
  if (!hasSupabaseEnv() || !client) {
    return mockP2PTransfers;
  }

  const userId = await requireAuthenticatedUserId(client);
  const privilegedClient = createServiceRoleSupabaseClient() ?? client;
  const { data, error } = await privilegedClient
    .from("p2p_transfers")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as Record<string, unknown>[];

  return rows.map((item) => ({
    id: asString(item.id),
    userId: asString(item.user_id ?? item.userId),
    contactId: asString(item.contact_id ?? item.contactId),
    fromAccountId: asString(item.from_account_id ?? item.fromAccountId),
    amount: asNumber(item.amount),
    direction: asString(item.direction) as P2PTransfer["direction"],
    status: asString(item.status) as P2PTransfer["status"],
    note: item.note ? asString(item.note) : null,
    createdAt: asString(item.created_at ?? item.createdAt),
    completedAt: item.completed_at ? asString(item.completed_at) : null
  }));
}

export async function createP2PTransfer(
  input: unknown,
  client?: BankingSupabaseClient | null
) {
  const payload = p2pTransferSchema.parse(input);

  if (!hasSupabaseEnv() || !client) {
    return {
      id: "p2p-transfer-preview",
      userId: mockUsers[0]?.id ?? "preview",
      status: payload.direction === "sent" ? "completed" : "pending",
      createdAt: new Date().toISOString(),
      completedAt: payload.direction === "sent" ? new Date().toISOString() : null,
      ...payload
    };
  }

  const userId = await requireAuthenticatedUserId(client);

  if (await hasStepUpRequirement(userId, client)) {
    throw new Error("Step-up verification is required before sending new peer payments.");
  }

  const privilegedClient = createServiceRoleSupabaseClient() ?? client;
  const [contacts, accounts] = await Promise.all([
    listP2PContacts(client),
    listAuthenticatedAccounts(client)
  ]);
  const contact = contacts.find((item) => item.id === payload.contactId);
  const account = accounts.find((item) => item.id === payload.fromAccountId);

  if (!contact || contact.status !== "active") {
    throw new Error("P2P contact could not be found.");
  }

  if (!account) {
    throw new Error("Funding account could not be found.");
  }

  if (account.status !== "active" || account.accountType !== "checking") {
    throw new Error("Peer payments must originate from an active checking account.");
  }

  if (payload.direction === "sent" && account.availableBalance < payload.amount) {
    throw new Error("Insufficient available balance for this peer payment.");
  }

  const now = new Date().toISOString();
  const status = payload.direction === "sent" ? "completed" : "pending";
  const { data, error } = await privilegedClient
    .from("p2p_transfers")
    .insert({
      user_id: userId,
      contact_id: payload.contactId,
      from_account_id: payload.fromAccountId,
      amount: payload.amount,
      direction: payload.direction,
      status,
      note: payload.note ?? null,
      created_at: now,
      completed_at: payload.direction === "sent" ? now : null
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  if (payload.direction === "sent") {
    const nextBalance = Number((account.balance - payload.amount).toFixed(2));
    const { error: updateError } = await privilegedClient
      .from("accounts")
      .update({
        balance: nextBalance,
        available_balance: nextBalance
      })
      .eq("id", account.id)
      .eq("user_id", userId);

    if (updateError) {
      throw updateError;
    }

    const { error: transactionError } = await privilegedClient.from("transactions").insert({
      account_id: account.id,
      amount: payload.amount,
      direction: "debit",
      type: "transfer",
      category: "P2P",
      description: `Peer payment sent to ${contact.displayName}`,
      merchant_name: contact.displayName,
      posted_at: now,
      running_balance: nextBalance,
      counterparty_account_id: null
    });

    if (transactionError) {
      throw transactionError;
    }

    await insertNotificationSafe(
      privilegedClient,
      userId,
      "p2p",
      `You sent ${payload.amount.toFixed(2)} to ${contact.displayName}.`
    );
  } else {
    await insertNotificationSafe(
      privilegedClient,
      userId,
      "p2p",
      `Money request sent to ${contact.displayName} for ${payload.amount.toFixed(2)}.`
    );
  }

  await insertAuditSafe(
    privilegedClient,
    userId,
    "p2p.transfer_created",
    "p2p_transfers",
    asString(data.id)
  );

  return {
    id: asString(data.id),
    userId,
    contactId: asString(data.contact_id),
    fromAccountId: asString(data.from_account_id),
    amount: asNumber(data.amount),
    direction: asString(data.direction) as P2PTransfer["direction"],
    status: asString(data.status) as P2PTransfer["status"],
    note: data.note ? asString(data.note) : null,
    createdAt: asString(data.created_at),
    completedAt: data.completed_at ? asString(data.completed_at) : null
  };
}

export async function listBusinessProfiles(
  client?: BankingSupabaseClient | null
): Promise<BusinessProfile[]> {
  if (!hasSupabaseEnv() || !client) {
    return mockBusinessProfiles;
  }

  const userId = await requireAuthenticatedUserId(client);
  const privilegedClient = createServiceRoleSupabaseClient() ?? client;
  const { data: memberships, error: membershipError } = await privilegedClient
    .from("business_memberships")
    .select("business_profile_id")
    .eq("user_id", userId)
    .eq("status", "active");

  if (membershipError) {
    throw membershipError;
  }

  const businessIds = (memberships ?? []).map((item) =>
    asString(item.business_profile_id)
  );

  if (businessIds.length === 0) {
    return [];
  }

  const { data, error } = await privilegedClient
    .from("business_profiles")
    .select("*")
    .in("id", businessIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as Record<string, unknown>[];

  return rows.map((item) => ({
    id: asString(item.id),
    userId: asString(item.user_id ?? item.userId),
    businessName: asString(item.business_name ?? item.businessName),
    legalName: asString(item.legal_name ?? item.legalName),
    industry: asString(item.industry),
    taxIdMasked: asString(item.tax_id_masked ?? item.taxIdMasked),
    status: asString(item.status) as BusinessProfile["status"],
    createdAt: asString(item.created_at ?? item.createdAt)
  }));
}

export async function listBusinessMemberships(
  businessProfileId?: string,
  client?: BankingSupabaseClient | null
): Promise<BusinessMembership[]> {
  if (!hasSupabaseEnv() || !client) {
    return businessProfileId
      ? mockBusinessMemberships.filter((item) => item.businessProfileId === businessProfileId)
      : mockBusinessMemberships;
  }

  const userId = await requireAuthenticatedUserId(client);
  const privilegedClient = createServiceRoleSupabaseClient() ?? client;
  const { data: allowedMemberships, error: allowedError } = await privilegedClient
    .from("business_memberships")
    .select("business_profile_id")
    .eq("user_id", userId);

  if (allowedError) {
    throw allowedError;
  }

  const allowedIds = (allowedMemberships ?? []).map((item) =>
    asString(item.business_profile_id)
  );
  const scopedIds = businessProfileId ? [businessProfileId] : allowedIds;

  if (scopedIds.length === 0) {
    return [];
  }

  const { data, error } = await privilegedClient
    .from("business_memberships")
    .select("*")
    .in("business_profile_id", scopedIds)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as Record<string, unknown>[];

  return rows.map((item) => ({
    id: asString(item.id),
    businessProfileId: asString(item.business_profile_id ?? item.businessProfileId),
    userId: asString(item.user_id ?? item.userId),
    membershipRole: asString(
      item.membership_role ?? item.membershipRole
    ) as BusinessMembership["membershipRole"],
    status: asString(item.status) as BusinessMembership["status"],
    createdAt: asString(item.created_at ?? item.createdAt)
  }));
}

export async function createBusinessProfile(
  input: unknown,
  client?: BankingSupabaseClient | null
) {
  const payload = businessProfileSchema.parse(input);

  if (!hasSupabaseEnv() || !client) {
    return {
      id: "business-profile-preview",
      userId: mockUsers[0]?.id ?? "preview",
      businessName: payload.businessName,
      legalName: payload.legalName,
      industry: payload.industry,
      taxIdMasked: `**-***${payload.taxId.slice(-4)}`,
      status: "pending_review" as const,
      createdAt: new Date().toISOString()
    };
  }

  const userId = await requireAuthenticatedUserId(client);
  const privilegedClient = createServiceRoleSupabaseClient() ?? client;
  const { data, error } = await privilegedClient
    .from("business_profiles")
    .insert({
      user_id: userId,
      business_name: payload.businessName.trim(),
      legal_name: payload.legalName.trim(),
      industry: payload.industry.trim(),
      tax_id_masked: `**-***${payload.taxId.slice(-4)}`,
      status: "pending_review"
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  const { error: membershipError } = await privilegedClient
    .from("business_memberships")
    .insert({
      business_profile_id: data.id,
      user_id: userId,
      membership_role: "owner",
      status: "active"
    });

  if (membershipError) {
    throw membershipError;
  }

  await insertNotificationSafe(
    privilegedClient,
    userId,
    "business",
    `${payload.businessName.trim()} is pending review for business banking access.`
  );
  await insertAuditSafe(
    privilegedClient,
    userId,
    "business.profile_created",
    "business_profiles",
    asString(data.id)
  );

  return {
    id: asString(data.id),
    userId,
    businessName: asString(data.business_name),
    legalName: asString(data.legal_name),
    industry: asString(data.industry),
    taxIdMasked: asString(data.tax_id_masked),
    status: asString(data.status) as BusinessProfile["status"],
    createdAt: asString(data.created_at)
  };
}

export async function addBusinessMembership(
  input: unknown,
  client?: BankingSupabaseClient | null
) {
  const payload = businessMembershipSchema.parse(input);

  if (!hasSupabaseEnv() || !client) {
    return {
      id: "business-membership-preview",
      businessProfileId: payload.businessProfileId,
      userId: mockUsers[0]?.id ?? "preview",
      membershipRole: payload.membershipRole,
      status: "active" as const,
      createdAt: new Date().toISOString()
    };
  }

  const actorId = await requireAuthenticatedUserId(client);
  const privilegedClient = createServiceRoleSupabaseClient() ?? client;
  const { data: actorMembership, error: actorMembershipError } = await privilegedClient
    .from("business_memberships")
    .select("membership_role")
    .eq("business_profile_id", payload.businessProfileId)
    .eq("user_id", actorId)
    .maybeSingle();

  if (actorMembershipError) {
    throw actorMembershipError;
  }

  if (
    !actorMembership ||
    !["owner", "operator"].includes(asString(actorMembership.membership_role))
  ) {
    throw new Error("You do not have permission to invite members to this business.");
  }

  const { data: targetUser, error: targetUserError } = await privilegedClient
    .from("users")
    .select("id")
    .eq("email", payload.email)
    .maybeSingle();

  if (targetUserError) {
    throw targetUserError;
  }

  if (!targetUser) {
    throw new Error("The invited user must already have a banking profile.");
  }

  const { data, error } = await privilegedClient
    .from("business_memberships")
    .insert({
      business_profile_id: payload.businessProfileId,
      user_id: targetUser.id,
      membership_role: payload.membershipRole,
      status: "active"
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await insertNotificationSafe(
    privilegedClient,
    asString(targetUser.id),
    "business",
    `You were added to a business profile as ${payload.membershipRole}.`
  );
  await insertAuditSafe(
    privilegedClient,
    actorId,
    "business.member_added",
    "business_memberships",
    asString(data.id)
  );

  return {
    id: asString(data.id),
    businessProfileId: asString(data.business_profile_id),
    userId: asString(data.user_id),
    membershipRole: asString(data.membership_role) as BusinessMembership["membershipRole"],
    status: asString(data.status) as BusinessMembership["status"],
    createdAt: asString(data.created_at)
  };
}

export async function listWireTransfers(
  client?: BankingSupabaseClient | null
): Promise<WireTransfer[]> {
  if (!hasSupabaseEnv() || !client) {
    return mockWireTransfers;
  }

  const userId = await requireAuthenticatedUserId(client);
  const privilegedClient = createServiceRoleSupabaseClient() ?? client;
  const { data, error } = await privilegedClient
    .from("wire_transfers")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as Record<string, unknown>[];

  return rows.map((item) => ({
    id: asString(item.id),
    userId: asString(item.user_id ?? item.userId),
    fromAccountId: asString(item.from_account_id ?? item.fromAccountId),
    beneficiaryName: asString(item.beneficiary_name ?? item.beneficiaryName),
    beneficiaryBank: asString(item.beneficiary_bank ?? item.beneficiaryBank),
    routingNumberMasked: asString(item.routing_number_masked ?? item.routingNumberMasked),
    accountNumberLast4: asString(item.account_number_last4 ?? item.accountNumberLast4),
    amount: asNumber(item.amount),
    purpose: asString(item.purpose),
    status: asString(item.status) as WireTransfer["status"],
    reviewStatus: asString(item.review_status ?? item.reviewStatus) as WireTransfer["reviewStatus"],
    createdAt: asString(item.created_at ?? item.createdAt),
    submittedAt: item.submitted_at ? asString(item.submitted_at) : null
  }));
}

export async function listOperationalWireTransfers(
  client?: BankingSupabaseClient | null
): Promise<WireTransfer[]> {
  if (!hasSupabaseEnv() || !client) {
    return mockWireTransfers;
  }

  const rows = await fallbackOrQuery<Record<string, unknown>[]>(
    "wire_transfers",
    mockWireTransfers as unknown as Record<string, unknown>[],
    "*",
    client
  );

  return rows.map((item) => ({
    id: asString(item.id),
    userId: asString(item.user_id ?? item.userId),
    fromAccountId: asString(item.from_account_id ?? item.fromAccountId),
    beneficiaryName: asString(item.beneficiary_name ?? item.beneficiaryName),
    beneficiaryBank: asString(item.beneficiary_bank ?? item.beneficiaryBank),
    routingNumberMasked: asString(item.routing_number_masked ?? item.routingNumberMasked),
    accountNumberLast4: asString(item.account_number_last4 ?? item.accountNumberLast4),
    amount: asNumber(item.amount),
    purpose: asString(item.purpose),
    status: asString(item.status) as WireTransfer["status"],
    reviewStatus: asString(item.review_status ?? item.reviewStatus) as WireTransfer["reviewStatus"],
    createdAt: asString(item.created_at ?? item.createdAt),
    submittedAt: item.submitted_at ? asString(item.submitted_at) : null
  }));
}

export async function createWireTransfer(
  input: unknown,
  client?: BankingSupabaseClient | null
) {
  const payload = wireTransferSchema.parse(input);

  if (!hasSupabaseEnv() || !client) {
    return {
      id: "wire-preview",
      userId: mockUsers[0]?.id ?? "preview",
      fromAccountId: payload.fromAccountId,
      beneficiaryName: payload.beneficiaryName,
      beneficiaryBank: payload.beneficiaryBank,
      routingNumberMasked: maskRoutingNumber(payload.routingNumber),
      accountNumberLast4: maskAccountNumber(payload.accountNumber),
      amount: payload.amount,
      purpose: payload.purpose,
      status: payload.amount >= 5000 ? "pending" : "completed",
      reviewStatus: payload.amount >= 5000 ? "pending_review" : "approved",
      createdAt: new Date().toISOString(),
      submittedAt: new Date().toISOString()
    };
  }

  const userId = await requireAuthenticatedUserId(client);

  if (await hasStepUpRequirement(userId, client)) {
    throw new Error("Step-up verification is required before initiating a wire transfer.");
  }

  const privilegedClient = createServiceRoleSupabaseClient() ?? client;
  const accounts = await listAuthenticatedAccounts(client);
  const fundingAccount = accounts.find((item) => item.id === payload.fromAccountId);

  if (!fundingAccount) {
    throw new Error("Funding account could not be found.");
  }

  if (fundingAccount.status !== "active" || fundingAccount.accountType !== "checking") {
    throw new Error("Domestic wires must originate from an active checking account.");
  }

  if (fundingAccount.availableBalance < payload.amount) {
    throw new Error("Insufficient available balance for this wire.");
  }

  const requiresReview =
    payload.amount >= 5000 ||
    /escrow|settlement|property|closing/i.test(payload.purpose);
  const reviewStatus: WireTransfer["reviewStatus"] = requiresReview
    ? "pending_review"
    : "approved";
  const status: WireTransfer["status"] = requiresReview ? "pending" : "completed";
  const now = new Date().toISOString();

  const { data, error } = await privilegedClient
    .from("wire_transfers")
    .insert({
      user_id: userId,
      from_account_id: payload.fromAccountId,
      beneficiary_name: payload.beneficiaryName.trim(),
      beneficiary_bank: payload.beneficiaryBank.trim(),
      routing_number_masked: maskRoutingNumber(payload.routingNumber),
      account_number_last4: maskAccountNumber(payload.accountNumber),
      amount: payload.amount,
      purpose: payload.purpose.trim(),
      status,
      review_status: reviewStatus,
      created_at: now,
      submitted_at: now
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  if (!requiresReview) {
    const nextBalance = Number((fundingAccount.balance - payload.amount).toFixed(2));
    const { error: accountUpdateError } = await privilegedClient
      .from("accounts")
      .update({
        balance: nextBalance,
        available_balance: nextBalance
      })
      .eq("id", fundingAccount.id)
      .eq("user_id", userId);

    if (accountUpdateError) {
      throw accountUpdateError;
    }

    const { error: transactionError } = await privilegedClient.from("transactions").insert({
      account_id: fundingAccount.id,
      amount: payload.amount,
      direction: "debit",
      type: "transfer",
      category: "Wires",
      description: `Domestic wire to ${payload.beneficiaryName.trim()}`,
      merchant_name: payload.beneficiaryBank.trim(),
      posted_at: now,
      running_balance: nextBalance,
      counterparty_account_id: null
    });

    if (transactionError) {
      throw transactionError;
    }
  } else {
    await insertNotificationSafe(
      privilegedClient,
      userId,
      "security",
      `Wire transfer to ${payload.beneficiaryName.trim()} is pending review before release.`
    );
  }

  await insertAuditSafe(
    privilegedClient,
    userId,
    "wire.created",
    "wire_transfers",
    asString(data.id)
  );

  return {
    id: asString(data.id),
    userId,
    fromAccountId: asString(data.from_account_id),
    beneficiaryName: asString(data.beneficiary_name),
    beneficiaryBank: asString(data.beneficiary_bank),
    routingNumberMasked: asString(data.routing_number_masked),
    accountNumberLast4: asString(data.account_number_last4),
    amount: asNumber(data.amount),
    purpose: asString(data.purpose),
    status: asString(data.status) as WireTransfer["status"],
    reviewStatus: asString(data.review_status) as WireTransfer["reviewStatus"],
    createdAt: asString(data.created_at),
    submittedAt: data.submitted_at ? asString(data.submitted_at) : null
  };
}

export async function updateWireTransferReview(
  input: unknown,
  client?: BankingSupabaseClient | null
) {
  const payload = wireReviewSchema.parse(input);
  const privilegedClient = createServiceRoleSupabaseClient() ?? client;

  if (!hasSupabaseEnv() || !privilegedClient) {
    return payload;
  }

  const { data: wire, error: wireError } = await privilegedClient
    .from("wire_transfers")
    .select("*")
    .eq("id", payload.wireId)
    .maybeSingle();

  if (wireError) {
    throw wireError;
  }

  if (!wire) {
    throw new Error("Wire transfer could not be found.");
  }

  if (payload.reviewStatus === "flagged") {
    const { error } = await privilegedClient
      .from("wire_transfers")
      .update({
        review_status: "flagged",
        status: "pending"
      })
      .eq("id", payload.wireId);

    if (error) {
      throw error;
    }

    await insertNotificationSafe(
      privilegedClient,
      asString(wire.user_id),
      "security",
      `Wire transfer to ${asString(wire.beneficiary_name)} was flagged for manual review.`
    );

    await privilegedClient
      .from("fraud_events")
      .update({
        status: "reviewing"
      })
      .contains("payload", { wireId: payload.wireId });

    return {
      id: asString(wire.id),
      reviewStatus: "flagged"
    };
  }

  const { data: account, error: accountError } = await privilegedClient
    .from("accounts")
    .select("id, user_id, balance, available_balance")
    .eq("id", wire.from_account_id)
    .maybeSingle();

  if (accountError) {
    throw accountError;
  }

  if (!account) {
    throw new Error("Funding account could not be found.");
  }

  const nextBalance = Number(
    (Number(account.balance ?? 0) - Number(wire.amount ?? 0)).toFixed(2)
  );

  if (nextBalance < 0) {
    throw new Error("Insufficient available balance for this wire.");
  }

  const now = new Date().toISOString();
  const { error: wireUpdateError } = await privilegedClient
    .from("wire_transfers")
    .update({
      review_status: "approved",
      status: "completed",
      submitted_at: wire.submitted_at ?? now
    })
    .eq("id", payload.wireId);

  if (wireUpdateError) {
    throw wireUpdateError;
  }

  const { error: accountUpdateError } = await privilegedClient
    .from("accounts")
    .update({
      balance: nextBalance,
      available_balance: nextBalance
    })
    .eq("id", wire.from_account_id)
    .eq("user_id", wire.user_id);

  if (accountUpdateError) {
    throw accountUpdateError;
  }

  const { error: transactionError } = await privilegedClient.from("transactions").insert({
    account_id: wire.from_account_id,
    amount: Number(wire.amount),
    direction: "debit",
    type: "transfer",
    category: "Wires",
    description: `Domestic wire to ${asString(wire.beneficiary_name)}`,
    merchant_name: asString(wire.beneficiary_bank),
    posted_at: now,
    running_balance: nextBalance,
    counterparty_account_id: null
  });

  if (transactionError) {
    throw transactionError;
  }

  await insertNotificationSafe(
    privilegedClient,
    asString(wire.user_id),
    "wire",
    `Wire transfer to ${asString(wire.beneficiary_name)} has been approved and released.`
  );
  await privilegedClient
    .from("fraud_events")
    .update({
      status: "closed"
    })
    .contains("payload", { wireId: payload.wireId });
  await insertAuditSafe(
    privilegedClient,
    asString(wire.user_id),
    "wire.approved",
    "wire_transfers",
    payload.wireId
  );

  return {
    id: asString(wire.id),
    reviewStatus: "approved"
  };
}

export async function getCreditProfile(
  client?: BankingSupabaseClient | null
): Promise<CreditProfile | null> {
  if (!hasSupabaseEnv() || !client) {
    return mockCreditProfile;
  }

  const userId = await requireAuthenticatedUserId(client);
  const privilegedClient = createServiceRoleSupabaseClient() ?? client;
  const { data, error } = await privilegedClient
    .from("credit_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    id: asString(data.id),
    userId: asString(data.user_id),
    provider: asString(data.provider),
    score: asNumber(data.score),
    scoreBand: asString(data.score_band) as CreditProfile["scoreBand"],
    updatedAt: asString(data.updated_at)
  };
}

export async function listCreditScoreSnapshots(
  client?: BankingSupabaseClient | null
): Promise<CreditScoreSnapshot[]> {
  if (!hasSupabaseEnv() || !client) {
    return mockCreditScoreSnapshots;
  }

  const userId = await requireAuthenticatedUserId(client);
  const privilegedClient = createServiceRoleSupabaseClient() ?? client;
  const { data, error } = await privilegedClient
    .from("credit_score_snapshots")
    .select("*")
    .eq("user_id", userId)
    .order("recorded_at", { ascending: true });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as Record<string, unknown>[];

  return rows.map((item) => ({
    id: asString(item.id),
    userId: asString(item.user_id ?? item.userId),
    score: asNumber(item.score),
    reasonCodes: Array.isArray(item.reason_codes)
      ? item.reason_codes.map((value) => asString(value))
      : [],
    recordedAt: asString(item.recorded_at ?? item.recordedAt)
  }));
}

export async function refreshCreditProfile(
  client?: BankingSupabaseClient | null
) {
  if (!hasSupabaseEnv() || !client) {
    return {
      score: 744,
      delta: 2
    };
  }

  const userId = await requireAuthenticatedUserId(client);
  const privilegedClient = createServiceRoleSupabaseClient() ?? client;
  const [currentProfile, insights] = await Promise.all([
    getCreditProfile(client),
    getBudgetInsights(client)
  ]);

  const overBudgetCount = insights.filter((item) => item.status === "over_budget").length;
  const watchCount = insights.filter((item) => item.status === "watch").length;
  const adjustment = overBudgetCount > 0 ? -8 : watchCount > 0 ? -3 : 4;
  const nextScore = Math.min(
    850,
    Math.max(300, (currentProfile?.score ?? 720) + adjustment)
  );
  const scoreBand: CreditProfile["scoreBand"] =
    nextScore >= 760
      ? "excellent"
      : nextScore >= 700
        ? "good"
        : nextScore >= 640
          ? "fair"
          : "poor";
  const reasonCodes =
    adjustment >= 0
      ? ["Stable utilization", "On-time payment posture", "Healthy cash flow"]
      : [
          "Elevated spending utilization",
          "Recent budget pressure",
          "Monitor revolving balances"
        ];
  const now = new Date().toISOString();

  const { error: profileError } = await privilegedClient
    .from("credit_profiles")
    .upsert(
      {
        user_id: userId,
        provider: currentProfile?.provider ?? "TransUnion",
        score: nextScore,
        score_band: scoreBand,
        updated_at: now
      },
      {
        onConflict: "user_id"
      }
    );

  if (profileError) {
    throw profileError;
  }

  const { error: snapshotError } = await privilegedClient
    .from("credit_score_snapshots")
    .insert({
      user_id: userId,
      score: nextScore,
      reason_codes: reasonCodes,
      recorded_at: now
    });

  if (snapshotError) {
    throw snapshotError;
  }

  await insertNotificationSafe(
    privilegedClient,
    userId,
    "credit",
    `Credit score updated to ${nextScore} (${adjustment >= 0 ? "+" : ""}${adjustment}).`
  );
  await insertAuditSafe(
    privilegedClient,
    userId,
    "credit.refreshed",
    "credit_profiles",
    userId
  );

  return {
    score: nextScore,
    delta: adjustment
  };
}

export async function listWalletTokens(
  client?: BankingSupabaseClient | null
): Promise<WalletToken[]> {
  if (!hasSupabaseEnv() || !client) {
    return mockWalletTokens;
  }

  const userId = await requireAuthenticatedUserId(client);
  const privilegedClient = createServiceRoleSupabaseClient() ?? client;
  const { data, error } = await privilegedClient
    .from("wallet_tokens")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as Record<string, unknown>[];

  return rows.map((item) => ({
    id: asString(item.id),
    userId: asString(item.user_id ?? item.userId),
    cardId: asString(item.card_id ?? item.cardId),
    provider: asString(item.provider) as WalletToken["provider"],
    deviceLabel: asString(item.device_label ?? item.deviceLabel),
    status: asString(item.status) as WalletToken["status"],
    createdAt: asString(item.created_at ?? item.createdAt)
  }));
}

export async function createWalletToken(
  input: unknown,
  client?: BankingSupabaseClient | null
) {
  const payload = walletTokenSchema.parse(input);

  if (!hasSupabaseEnv() || !client) {
    return {
      id: "wallet-preview",
      userId: mockUsers[0]?.id ?? "preview",
      status: "pending" as const,
      createdAt: new Date().toISOString(),
      ...payload
    };
  }

  const userId = await requireAuthenticatedUserId(client);
  const cards = await listAuthenticatedCards(client);
  const card = cards.find((item) => item.id === payload.cardId);

  if (!card) {
    throw new Error("Card could not be found.");
  }

  const privilegedClient = createServiceRoleSupabaseClient() ?? client;
  const { data, error } = await privilegedClient
    .from("wallet_tokens")
    .insert({
      user_id: userId,
      card_id: payload.cardId,
      provider: payload.provider,
      device_label: payload.deviceLabel.trim(),
      status: "pending"
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await insertNotificationSafe(
    privilegedClient,
    userId,
    "wallet",
    `${payload.provider === "apple_pay" ? "Apple Pay" : "Google Pay"} enrollment requested for card ending ${card.last4}.`
  );

  return {
    id: asString(data.id),
    userId,
    cardId: asString(data.card_id),
    provider: asString(data.provider) as WalletToken["provider"],
    deviceLabel: asString(data.device_label),
    status: asString(data.status) as WalletToken["status"],
    createdAt: asString(data.created_at)
  };
}

export async function updateWalletTokenStatus(
  input: unknown,
  client?: BankingSupabaseClient | null
) {
  const payload = walletTokenStatusSchema.parse(input);

  if (!hasSupabaseEnv() || !client) {
    return payload;
  }

  const userId = await requireAuthenticatedUserId(client);
  const privilegedClient = createServiceRoleSupabaseClient() ?? client;
  const { data, error } = await privilegedClient
    .from("wallet_tokens")
    .update({
      status: payload.status
    })
    .eq("id", payload.walletTokenId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await insertNotificationSafe(
    privilegedClient,
    userId,
    "wallet",
    `Wallet token ${payload.status === "active" ? "activated" : "suspended"} for ${asString(data.device_label)}.`
  );

  return {
    id: asString(data.id),
    status: asString(data.status) as WalletToken["status"]
  };
}

export async function uploadAuthenticatedDocument(
  input: {
    fileName: string;
    contentType: string;
    bytes: Uint8Array;
    documentType: string;
  },
  client?: BankingSupabaseClient | null
) {
  if (!hasSupabaseEnv() || !client) {
    return {
      id: "document-upload-preview",
      userId: mockUsers[0]?.id ?? "preview",
      documentType: input.documentType,
      storagePath: `uploads/${input.fileName}`,
      status: "available",
      createdAt: new Date().toISOString()
    };
  }

  const userId = await requireAuthenticatedUserId(client);
  const privilegedClient = createServiceRoleSupabaseClient();

  if (!privilegedClient) {
    throw new Error("Service-role client is required for secure document ingestion.");
  }

  const path = `${userId}/${Date.now()}-${input.fileName.replace(/[^A-Za-z0-9._-]/g, "-")}`;
  const { error: uploadError } = await privilegedClient.storage
    .from("customer-documents")
    .upload(path, input.bytes, {
      contentType: input.contentType,
      upsert: false
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data, error } = await privilegedClient
    .from("documents")
    .insert({
      user_id: userId,
      document_type: input.documentType,
      storage_path: path,
      status: "available"
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await insertAuditSafe(
    privilegedClient,
    userId,
    "document.uploaded",
    "documents",
    asString(data.id)
  );

  return {
    id: asString(data.id),
    userId,
    documentType: asString(data.document_type),
    storagePath: asString(data.storage_path),
    status: asString(data.status),
    createdAt: asString(data.created_at)
  };
}

export async function downloadAuthenticatedDocument(
  documentId: string,
  client?: BankingSupabaseClient | null
) {
  if (!hasSupabaseEnv() || !client) {
    throw new Error("Document downloads require Supabase configuration.");
  }

  const userId = await requireAuthenticatedUserId(client);
  const privilegedClient = createServiceRoleSupabaseClient();

  if (!privilegedClient) {
    throw new Error("Service-role client is required for secure document downloads.");
  }

  const { data: document, error } = await privilegedClient
    .from("documents")
    .select("id, user_id, storage_path, document_type")
    .eq("id", documentId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!document || asString(document.user_id) !== userId) {
    throw new Error("Document could not be found.");
  }

  const { data: file, error: downloadError } = await privilegedClient.storage
    .from("customer-documents")
    .download(asString(document.storage_path));

  if (downloadError) {
    throw downloadError;
  }

  return {
    file,
    storagePath: asString(document.storage_path),
    documentType: asString(document.document_type)
  };
}

export async function listAuthenticatedFraudEvents(
  client?: BankingSupabaseClient | null
): Promise<FraudEvent[]> {
  if (!hasSupabaseEnv() || !client) {
    return mockFraudEvents;
  }

  const userId = await requireAuthenticatedUserId(client);
  const privilegedClient = createServiceRoleSupabaseClient() ?? client;
  const { data, error } = await privilegedClient
    .from("fraud_events")
    .select("*")
    .eq("user_id", userId)
    .order("detected_at", { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as Record<string, unknown>[];

  return rows.map((item) => ({
    id: asString(item.id),
    userId: item.user_id ? asString(item.user_id) : null,
    accountId: item.account_id ? asString(item.account_id) : null,
    severity: asString(item.severity) as FraudEvent["severity"],
    ruleName: asString(item.rule_name ?? item.ruleName),
    status: asString(item.status) as FraudEvent["status"],
    payload:
      typeof item.payload === "object" && item.payload !== null
        ? (item.payload as Record<string, unknown>)
        : undefined,
    detectedAt: asString(item.detected_at ?? item.detectedAt)
  }));
}

export async function runFraudAutomation(
  client?: BankingSupabaseClient | null
): Promise<{ created: number; reviewed: number }> {
  const privilegedClient = createServiceRoleSupabaseClient() ?? client;

  if (!hasSupabaseEnv() || !privilegedClient) {
    return {
      created: 1,
      reviewed: mockFraudEvents.length
    };
  }

  const [transactions, wires, accounts] = await Promise.all([
    privilegedClient
      .from("transactions")
      .select("account_id, amount, description, posted_at")
      .gte("posted_at", addDays(new Date(), -14).toISOString()),
    privilegedClient
      .from("wire_transfers")
      .select("id, user_id, from_account_id, amount, beneficiary_name, review_status")
      .gte("created_at", addDays(new Date(), -14).toISOString()),
    privilegedClient.from("accounts").select("id, user_id")
  ]);

  if (transactions.error) {
    throw transactions.error;
  }

  if (wires.error) {
    throw wires.error;
  }

  if (accounts.error) {
    throw accounts.error;
  }

  let created = 0;
  const accountOwnerMap = new Map(
    (accounts.data ?? []).map((account) => [
      asString(account.id),
      asString(account.user_id)
    ])
  );

  for (const transaction of transactions.data ?? []) {
    const amount = Number(transaction.amount ?? 0);
    if (amount < 2000) {
      continue;
    }

    const existing = await privilegedClient
      .from("fraud_events")
      .select("id")
      .eq("account_id", transaction.account_id)
      .eq("rule_name", "high_value_transaction")
      .gte("detected_at", addDays(new Date(), -14).toISOString())
      .limit(1);

    if (existing.error) {
      throw existing.error;
    }

    if ((existing.data ?? []).length > 0) {
      continue;
    }

    const accountOwnerId = accountOwnerMap.get(asString(transaction.account_id)) ?? null;

    const { data: fraudEvent, error } = await privilegedClient
      .from("fraud_events")
      .insert({
        user_id: accountOwnerId,
        account_id: transaction.account_id,
        severity: amount >= 5000 ? "critical" : "high",
        rule_name: "high_value_transaction",
        status: "open",
        payload: {
          amount,
          description: transaction.description
        },
        detected_at: new Date().toISOString()
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    if (accountOwnerId) {
      await insertNotificationSafe(
        privilegedClient,
        accountOwnerId,
        "security",
        "Step-up verification required because unusual outbound activity was detected."
      );
    }

    await insertAuditSafe(
      privilegedClient,
      accountOwnerId,
      "fraud.event_created",
      "fraud_events",
      asString(fraudEvent.id)
    );
    created += 1;
  }

  for (const wire of wires.data ?? []) {
    const reviewStatus = asString(wire.review_status);

    if (!["flagged", "pending_review"].includes(reviewStatus)) {
      continue;
    }

    const existing = await privilegedClient
      .from("fraud_events")
      .select("id")
      .eq("account_id", wire.from_account_id)
      .eq("rule_name", "wire_review_hold")
      .gte("detected_at", addDays(new Date(), -14).toISOString())
      .limit(1);

    if (existing.error) {
      throw existing.error;
    }

    if ((existing.data ?? []).length === 0) {
      const { data: fraudEvent, error } = await privilegedClient
        .from("fraud_events")
        .insert({
          user_id: wire.user_id,
          account_id: wire.from_account_id,
          severity: reviewStatus === "flagged" ? "critical" : "high",
          rule_name: "wire_review_hold",
          status: "reviewing",
          payload: {
            wireId: wire.id,
            amount: wire.amount,
            beneficiaryName: wire.beneficiary_name,
            reviewStatus
          },
          detected_at: new Date().toISOString()
        })
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      await insertAuditSafe(
        privilegedClient,
        asString(wire.user_id),
        "fraud.event_created",
        "fraud_events",
        asString(fraudEvent.id)
      );
      await insertNotificationSafe(
        privilegedClient,
        asString(wire.user_id),
        "security",
        reviewStatus === "flagged"
          ? "A wire transfer has been flagged and requires review before further outbound transfers."
          : "A wire transfer is pending review and outbound high-risk activity may require step-up verification."
      );
      created += 1;
    }
  }

  return {
    created,
    reviewed: (transactions.data ?? []).length + (wires.data ?? []).length
  };
}

export async function updateFraudEventStatus(
  input: unknown,
  client?: BankingSupabaseClient | null
) {
  const payload = fraudReviewSchema.parse(input);
  const privilegedClient = createServiceRoleSupabaseClient() ?? client;

  if (!hasSupabaseEnv() || !privilegedClient) {
    return payload;
  }

  const { data, error } = await privilegedClient
    .from("fraud_events")
    .update({
      status: payload.status
    })
    .eq("id", payload.fraudEventId)
    .select("id, user_id, status")
    .single();

  if (error) {
    throw error;
  }

  if (data.user_id) {
    await insertNotificationSafe(
      privilegedClient,
      asString(data.user_id),
      "security",
      payload.status === "closed"
        ? "Fraud review is complete and outbound transfer restrictions are lifted."
        : "Fraud review is in progress on your account."
    );
  }

  return {
    id: asString(data.id),
    status: asString(data.status) as FraudEvent["status"]
  };
}

export async function listDeviceSessions(
  client?: BankingSupabaseClient | null
): Promise<DeviceSession[]> {
  const rows = await fallbackOrQuery<Record<string, unknown>[]>(
    "device_sessions",
    mockDeviceSessions as unknown as Record<string, unknown>[],
    "*",
    client
  );

  return rows.map((item) => ({
    id: asString(item.id),
    userId: asString(item.user_id ?? item.userId),
    deviceFingerprint: asString(
      item.device_fingerprint ?? item.deviceFingerprint
    ),
    userAgent: asString(item.user_agent ?? item.userAgent),
    trusted: Boolean(item.trusted),
    lastSeenAt: asString(item.last_seen_at ?? item.lastSeenAt),
    createdAt: asString(item.created_at ?? item.createdAt)
  }));
}

export async function listAuthenticatedDeviceSessions(
  client?: BankingSupabaseClient | null
): Promise<DeviceSession[]> {
  if (!hasSupabaseEnv() || !client) {
    return mockDeviceSessions;
  }

  const userId = await requireAuthenticatedUserId(client);
  const privilegedClient = createServiceRoleSupabaseClient() ?? client;
  const { data, error } = await privilegedClient
    .from("device_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as Record<string, unknown>[];

  return rows.map((item) => ({
    id: asString(item.id),
    userId: asString(item.user_id ?? item.userId),
    deviceFingerprint: asString(
      item.device_fingerprint ?? item.deviceFingerprint
    ),
    userAgent: asString(item.user_agent ?? item.userAgent),
    trusted: Boolean(item.trusted),
    lastSeenAt: asString(item.last_seen_at ?? item.lastSeenAt),
    createdAt: asString(item.created_at ?? item.createdAt)
  }));
}

export async function listFraudEvents(
  client?: BankingSupabaseClient | null
): Promise<FraudEvent[]> {
  const rows = await fallbackOrQuery<Record<string, unknown>[]>(
    "fraud_events",
    mockFraudEvents as unknown as Record<string, unknown>[],
    "*",
    client
  );

  return rows.map((item) => ({
    id: asString(item.id),
    userId: item.user_id ? asString(item.user_id) : null,
    accountId: item.account_id ? asString(item.account_id) : null,
    severity: asString(item.severity) as FraudEvent["severity"],
    ruleName: asString(item.rule_name ?? item.ruleName),
    status: asString(item.status) as FraudEvent["status"],
    payload:
      typeof item.payload === "object" && item.payload !== null
        ? (item.payload as Record<string, unknown>)
        : undefined,
    detectedAt: asString(item.detected_at ?? item.detectedAt)
  }));
}

export async function listAuditLogs(
  client?: BankingSupabaseClient | null
): Promise<AuditLog[]> {
  const rows = await fallbackOrQuery<Record<string, unknown>[]>(
    "audit_logs",
    mockAuditLogs as unknown as Record<string, unknown>[],
    "*",
    client
  );

  return rows.map((item) => ({
    id: asString(item.id),
    userId: item.user_id ? asString(item.user_id) : null,
    action: asString(item.action),
    entity: asString(item.entity),
    entityId: item.entity_id ? asString(item.entity_id) : null,
    timestamp: asString(item.timestamp)
  }));
}

export async function listAuthenticatedAuditLogs(
  client?: BankingSupabaseClient | null
): Promise<AuditLog[]> {
  if (!hasSupabaseEnv() || !client) {
    return mockAuditLogs;
  }

  const userId = await requireAuthenticatedUserId(client);
  const privilegedClient = createServiceRoleSupabaseClient() ?? client;
  const { data, error } = await privilegedClient
    .from("audit_logs")
    .select("*")
    .eq("user_id", userId)
    .order("timestamp", { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as Record<string, unknown>[];

  return rows.map((item) => ({
    id: asString(item.id),
    userId: item.user_id ? asString(item.user_id) : null,
    action: asString(item.action),
    entity: asString(item.entity),
    entityId: item.entity_id ? asString(item.entity_id) : null,
    timestamp: asString(item.timestamp)
  }));
}

export async function listUsers(
  client?: BankingSupabaseClient | null
): Promise<UserProfile[]> {
  const rows = await fallbackOrQuery<Record<string, unknown>[]>(
    "users",
    mockUsers as unknown as Record<string, unknown>[],
    "*",
    client
  );

  return rows.map((item) => ({
    id: asString(item.id),
    email: asString(item.email),
    name: asString(item.name),
    role: asString(item.role) as UserProfile["role"],
    createdAt: asString(item.created_at ?? item.createdAt)
  }));
}

export async function listFinancialGoals(
  client?: BankingSupabaseClient | null
): Promise<FinancialGoal[]> {
  const rows = await fallbackOrQuery<Record<string, unknown>[]>(
    "financial_goals",
    mockDashboardSnapshot.financialGoals as unknown as Record<string, unknown>[],
    "*",
    client
  );

  return rows.map((item) => ({
    id: asString(item.id),
    userId: asString(item.user_id ?? item.userId),
    name: asString(item.name),
    currentAmount: asNumber(item.current_amount ?? item.currentAmount),
    targetAmount: asNumber(item.target_amount ?? item.targetAmount),
    targetDate: asString(item.target_date ?? item.targetDate)
  }));
}

export async function listAuthenticatedFinancialGoals(
  client?: BankingSupabaseClient | null
): Promise<FinancialGoal[]> {
  if (!hasSupabaseEnv() || !client) {
    return mockDashboardSnapshot.financialGoals;
  }

  const userId = await requireAuthenticatedUserId(client);
  const privilegedClient = createServiceRoleSupabaseClient() ?? client;
  const { data, error } = await privilegedClient
    .from("financial_goals")
    .select("*")
    .eq("user_id", userId)
    .order("target_date", { ascending: true });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as Record<string, unknown>[];

  return rows.map((item) => ({
    id: asString(item.id),
    userId: asString(item.user_id ?? item.userId),
    name: asString(item.name),
    currentAmount: asNumber(item.current_amount ?? item.currentAmount),
    targetAmount: asNumber(item.target_amount ?? item.targetAmount),
    targetDate: asString(item.target_date ?? item.targetDate)
  }));
}

export async function getDashboardSnapshot(
  client?: BankingSupabaseClient | null
): Promise<DashboardSnapshot> {
  if (!hasSupabaseEnv()) {
    return mockDashboardSnapshot;
  }

  const [accounts, transactions, notifications, bills, goals] = await Promise.all([
    listAccounts(client),
    listTransactions(client),
    listNotifications(client),
    listBills(client),
    listFinancialGoals(client)
  ]);

  const netWorth = accounts.reduce((sum, account) => sum + account.balance, 0);
  const monthToDateSpend = transactions
    .filter((item) => item.direction === "debit")
    .reduce((sum, item) => sum + item.amount, 0);
  const upcomingBills = bills.reduce((sum, bill) => sum + bill.amount, 0);
  const inflows = transactions
    .filter((item) => item.direction === "credit")
    .reduce((sum, item) => sum + item.amount, 0);

  return {
    netWorth,
    monthToDateSpend,
    upcomingBills,
    cashFlow: inflows - monthToDateSpend,
    accounts,
    recentTransactions: transactions.slice(0, 8),
    financialGoals: goals,
    notifications
  };
}

export async function getAuthenticatedDashboardSnapshot(
  client?: BankingSupabaseClient | null
): Promise<DashboardSnapshot> {
  if (!hasSupabaseEnv() || !client) {
    return mockDashboardSnapshot;
  }

  const [accounts, transactions, notifications, bills, goals] = await Promise.all([
    listAuthenticatedAccounts(client),
    listAuthenticatedTransactions(client),
    listAuthenticatedNotifications(client),
    listAuthenticatedBills(client),
    listAuthenticatedFinancialGoals(client)
  ]);

  const netWorth = accounts.reduce((sum, account) => sum + account.balance, 0);
  const monthToDateSpend = transactions
    .filter((item) => item.direction === "debit")
    .reduce((sum, item) => sum + item.amount, 0);
  const upcomingBills = bills.reduce((sum, bill) => sum + bill.amount, 0);
  const inflows = transactions
    .filter((item) => item.direction === "credit")
    .reduce((sum, item) => sum + item.amount, 0);

  return {
    netWorth,
    monthToDateSpend,
    upcomingBills,
    cashFlow: inflows - monthToDateSpend,
    accounts,
    recentTransactions: transactions.slice(0, 8),
    financialGoals: goals,
    notifications
  };
}

export async function createTransfer(
  input: unknown,
  client?: BankingSupabaseClient | null
) {
  const payload = transferInputSchema.parse(input);

  if (!hasSupabaseEnv() || !client) {
    return {
      id: "transfer-preview",
      status: "completed",
      ...payload
    };
  }

  const userId = await requireAuthenticatedUserId(client);
  const accountIds =
    payload.rail === "internal" && payload.toAccountId
      ? [payload.fromAccountId, payload.toAccountId]
      : [payload.fromAccountId];
  const { data: accounts, error: accountsError } = await client
    .from("accounts")
    .select("id, user_id, balance, available_balance, currency, status")
    .in("id", accountIds);

  if (accountsError) {
    throw accountsError;
  }

  const fromAccount = accounts?.find((account) => account.id === payload.fromAccountId);

  if (!fromAccount) {
    throw new Error("Transfer source account could not be found.");
  }

  if (fromAccount.user_id !== userId) {
    throw new Error("You can only transfer money from your own accounts.");
  }

  if (fromAccount.status !== "active") {
    throw new Error("Only active accounts can be used for transfers.");
  }

  const availableBalance = Number(fromAccount.available_balance ?? fromAccount.balance ?? 0);

  if (availableBalance < payload.amount) {
    throw new Error("Insufficient available balance.");
  }

  const completedAt = new Date().toISOString();
  const nextFromBalance = Number((Number(fromAccount.balance) - payload.amount).toFixed(2));

  if (payload.rail === "internal") {
    if (!payload.toAccountId) {
      throw new Error("Destination account is required for internal transfers.");
    }

    if (payload.fromAccountId === payload.toAccountId) {
      throw new Error("Source and destination accounts must be different.");
    }

    const toAccount = accounts?.find((account) => account.id === payload.toAccountId);

    if (!toAccount) {
      throw new Error("Transfer destination account could not be found.");
    }

    if (toAccount.user_id !== userId) {
      throw new Error("Internal transfers are limited to your own accounts.");
    }

    if (toAccount.status !== "active") {
      throw new Error("Only active accounts can be used for transfers.");
    }

    if (fromAccount.currency !== toAccount.currency) {
      throw new Error("Cross-currency transfers are not supported.");
    }

    const nextToBalance = Number((Number(toAccount.balance) + payload.amount).toFixed(2));
    const { data: transferRow, error: transferError } = await client
      .from("transfers")
      .insert({
        user_id: userId,
        from_account: payload.fromAccountId,
        to_account: payload.toAccountId,
        amount: payload.amount,
        memo: payload.memo ?? null,
        rail: "internal",
        external_destination: null,
        status: "completed",
        created_at: completedAt,
        completed_at: completedAt
      })
      .select("id, status")
      .single();

    if (transferError) {
      throw transferError;
    }

    const { error: updateFromError } = await client
      .from("accounts")
      .update({
        balance: nextFromBalance,
        available_balance: nextFromBalance
      })
      .eq("id", payload.fromAccountId)
      .eq("user_id", userId);

    if (updateFromError) {
      throw updateFromError;
    }

    const { error: updateToError } = await client
      .from("accounts")
      .update({
        balance: nextToBalance,
        available_balance: nextToBalance
      })
      .eq("id", payload.toAccountId)
      .eq("user_id", userId);

    if (updateToError) {
      throw updateToError;
    }

    const { error: transactionInsertError } = await client.from("transactions").insert([
      {
        account_id: payload.fromAccountId,
        amount: payload.amount,
        direction: "debit",
        type: "transfer",
        category: "Transfers",
        description: payload.memo || "Internal transfer to owned account",
        merchant_name: null,
        posted_at: completedAt,
        running_balance: nextFromBalance,
        counterparty_account_id: payload.toAccountId
      },
      {
        account_id: payload.toAccountId,
        amount: payload.amount,
        direction: "credit",
        type: "transfer",
        category: "Transfers",
        description: payload.memo || "Internal transfer from owned account",
        merchant_name: null,
        posted_at: completedAt,
        running_balance: nextToBalance,
        counterparty_account_id: payload.fromAccountId
      }
    ]);

    if (transactionInsertError) {
      throw transactionInsertError;
    }

    return {
      id: transferRow.id,
      status: transferRow.status,
      ...payload
    };
  }

  const normalizedDestination = payload.externalDestination?.trim();

  if (!normalizedDestination) {
    throw new Error("External ACH destination is required.");
  }

  const { data: transferRow, error: transferError } = await client
    .from("transfers")
    .insert({
      user_id: userId,
      from_account: payload.fromAccountId,
      to_account: null,
      amount: payload.amount,
      memo: payload.memo ?? null,
      rail: "ach",
      external_destination: normalizedDestination,
      status: "completed",
      created_at: completedAt,
      completed_at: completedAt
    })
    .select("id, status")
    .single();

  if (transferError) {
    throw transferError;
  }

  const { error: updateFromError } = await client
    .from("accounts")
    .update({
      balance: nextFromBalance,
      available_balance: nextFromBalance
    })
    .eq("id", payload.fromAccountId)
    .eq("user_id", userId);

  if (updateFromError) {
    throw updateFromError;
  }

  const { error: transactionInsertError } = await client.from("transactions").insert({
    account_id: payload.fromAccountId,
    amount: payload.amount,
    direction: "debit",
    type: "transfer",
    category: "Transfers",
    description: payload.memo || `External ACH transfer to ${normalizedDestination}`,
    merchant_name: normalizedDestination,
    posted_at: completedAt,
    running_balance: nextFromBalance,
    counterparty_account_id: null
  });

  if (transactionInsertError) {
    throw transactionInsertError;
  }

  return {
    id: transferRow.id,
    status: transferRow.status,
    ...payload
  };
}

export async function quoteTransfer(input: unknown): Promise<TransferQuote> {
  const payload = transferQuoteSchema.parse(input);

  return {
    ...payload,
    estimatedDelivery: payload.rail === "internal" ? "Immediate" : "Same day ACH",
    risk: payload.amount >= 1500 || payload.rail === "ach" ? "review" : "approved"
  };
}

export async function createBillPayment(input: unknown) {
  const payload = billInputSchema.parse(input);

  return payload;
}

export async function updateCardControl(
  input: unknown,
  client?: BankingSupabaseClient | null
) {
  const payload = cardControlSchema.parse(input);

  if (!hasSupabaseEnv() || !client) {
    return payload;
  }

  const userId = await requireAuthenticatedUserId(client);
  const { data: existingCard, error: cardLookupError } = await client
    .from("cards")
    .select("id, user_id, status, spend_limit")
    .eq("id", payload.cardId)
    .maybeSingle();

  if (cardLookupError) {
    throw cardLookupError;
  }

  if (!existingCard || existingCard.user_id !== userId) {
    throw new Error("Card could not be found.");
  }

  const updates =
    payload.action === "freeze"
      ? { status: "blocked" }
      : payload.action === "unfreeze"
        ? { status: "active" }
        : { spend_limit: payload.spendLimit ?? existingCard.spend_limit };

  const { data, error } = await client
    .from("cards")
    .update(updates)
    .eq("id", payload.cardId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id,
    status: data.status,
    spendLimit: data.spend_limit
  };
}

export async function setDeviceTrust(
  input: unknown,
  client?: BankingSupabaseClient | null
) {
  const payload = deviceTrustSchema.parse(input);

  if (!hasSupabaseEnv() || !client) {
    return payload;
  }

  const userId = await requireAuthenticatedUserId(client);
  const { data, error } = await client
    .from("device_sessions")
    .update({
      trusted: payload.trusted,
      last_seen_at: new Date().toISOString()
    })
    .eq("id", payload.deviceSessionId)
    .eq("user_id", userId)
    .select("id, trusted")
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id,
    trusted: data.trusted
  };
}

export async function createMfaChallenge(input: unknown) {
  const payload = mfaChallengeSchema.parse(input);

  return {
    challengeId: "mfa-challenge-01",
    factorType: payload.factorType,
    status: payload.code ? "verified" : "pending",
    trustedDeviceEligible: true
  };
}

export async function scheduleBillPayment(
  input: unknown,
  client?: BankingSupabaseClient | null
) {
  const payload = billInputSchema.parse(input);

  if (!hasSupabaseEnv() || !client) {
    return {
      id: "bill-preview",
      ...payload,
      status: "scheduled"
    };
  }

  const userId = await requireAuthenticatedUserId(client);
  const normalizedPayeeName = payload.payeeName.trim();

  const { data: existingPayee, error: payeeLookupError } = await client
    .from("payees")
    .select("id")
    .eq("user_id", userId)
    .ilike("name", normalizedPayeeName)
    .maybeSingle();

  if (payeeLookupError) {
    throw payeeLookupError;
  }

  let payeeId = existingPayee?.id ?? null;

  if (!payeeId) {
    const { data: newPayee, error: createPayeeError } = await client
      .from("payees")
      .insert({
        user_id: userId,
        name: normalizedPayeeName,
        category: payload.payeeCategory.trim(),
        account_reference: normalizedPayeeName
          .replace(/[^A-Za-z0-9]/g, "")
          .slice(0, 8)
          .toUpperCase(),
        is_internal: false
      })
      .select("id")
      .single();

    if (createPayeeError) {
      throw createPayeeError;
    }

    payeeId = newPayee.id;
  }

  const { data, error } = await client
    .from("bills")
    .insert({
      user_id: userId,
      payee_id: payeeId,
      amount: payload.amount,
      due_date: payload.dueDate,
      frequency: "Monthly",
      status: "scheduled",
      autopay: payload.autopay
    })
    .select("id, status, due_date")
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id,
    status: data.status,
    payeeName: payload.payeeName,
    payeeCategory: payload.payeeCategory,
    amount: payload.amount,
    dueDate: data.due_date,
    autopay: payload.autopay
  };
}

export async function submitBillPayment(
  input: {
    billId: string;
    sourceAccountId: string;
  },
  client?: BankingSupabaseClient | null
) {
  const payload = z
    .object({
      billId: z.string().min(1),
      sourceAccountId: z.string().min(1)
    })
    .parse(input);

  if (!hasSupabaseEnv() || !client) {
    return {
      id: payload.billId,
      status: "paid"
    };
  }

  const userId = await requireAuthenticatedUserId(client);
  const [{ data: bill, error: billError }, { data: account, error: accountError }] =
    await Promise.all([
      client
        .from("bills")
        .select("id, user_id, amount, status, payees(name)")
        .eq("id", payload.billId)
        .maybeSingle(),
      client
        .from("accounts")
        .select("id, user_id, balance, available_balance, account_type, status")
        .eq("id", payload.sourceAccountId)
        .maybeSingle()
    ]);

  if (billError) {
    throw billError;
  }

  if (accountError) {
    throw accountError;
  }

  if (!bill || bill.user_id !== userId) {
    throw new Error("Bill could not be found.");
  }

  if (bill.status === "paid") {
    throw new Error("This bill is already marked as paid.");
  }

  if (!account || account.user_id !== userId) {
    throw new Error("Funding account could not be found.");
  }

  if (account.status !== "active" || account.account_type !== "checking") {
    throw new Error("Bill payments must come from an active checking account.");
  }

  const paymentAmount = Number(bill.amount ?? 0);
  const availableBalance = Number(account.available_balance ?? account.balance ?? 0);

  if (availableBalance < paymentAmount) {
    throw new Error("Insufficient available balance for this bill payment.");
  }

  const nextAccountBalance = Number((Number(account.balance) - paymentAmount).toFixed(2));
  const completedAt = new Date().toISOString();
  const payeeName =
    typeof bill.payees === "object" && bill.payees && "name" in bill.payees
      ? asString((bill.payees as { name?: unknown }).name)
      : "Bill pay";

  const { error: updateAccountError } = await client
    .from("accounts")
    .update({
      balance: nextAccountBalance,
      available_balance: nextAccountBalance
    })
    .eq("id", account.id)
    .eq("user_id", userId);

  if (updateAccountError) {
    throw updateAccountError;
  }

  const { error: updateBillError } = await client
    .from("bills")
    .update({
      status: "paid"
    })
    .eq("id", bill.id)
    .eq("user_id", userId);

  if (updateBillError) {
    throw updateBillError;
  }

  const { error: transactionError } = await client.from("transactions").insert({
    account_id: account.id,
    amount: paymentAmount,
    direction: "debit",
    type: "payment",
    category: "Bills",
    description: `Bill payment to ${payeeName}`,
    merchant_name: payeeName,
    posted_at: completedAt,
    running_balance: nextAccountBalance,
    counterparty_account_id: null
  });

  if (transactionError) {
    throw transactionError;
  }

  return {
    id: bill.id,
    status: "paid"
  };
}

export async function createSupportTicket(
  input: unknown,
  client?: BankingSupabaseClient | null
) {
  const payload = supportTicketSchema.parse(input);

  if (!hasSupabaseEnv() || !client) {
    return {
      id: "support-preview",
      ...payload,
      status: "open"
    };
  }

  const userId = await requireAuthenticatedUserId(client);
  const { data, error } = await client
    .from("support_tickets")
    .insert({
      user_id: userId,
      subject: payload.subject,
      status: "open",
      priority: payload.priority,
      latest_message: payload.message
    })
    .select("id, status")
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id,
    status: data.status,
    ...payload
  };
}

export async function makeLoanPayment(
  input: unknown,
  client?: BankingSupabaseClient | null
) {
  const payload = loanPaymentSchema.parse(input);

  if (!hasSupabaseEnv() || !client) {
    return {
      id: "loan-payment-preview",
      ...payload,
      status: "completed"
    };
  }

  const userId = await requireAuthenticatedUserId(client);
  const privilegedClient = createServiceRoleSupabaseClient() ?? client;

  if (!privilegedClient) {
    throw new Error("Supabase client is not available.");
  }

  const [{ data: loan, error: loanError }, accounts] = await Promise.all([
    privilegedClient
      .from("loans")
      .select("id, user_id, loan_type, balance, status")
      .eq("id", payload.loanId)
      .eq("user_id", userId)
      .maybeSingle(),
    listAuthenticatedAccounts(client)
  ]);

  if (loanError) {
    throw loanError;
  }

  if (!loan) {
    throw new Error("Loan could not be found.");
  }

  const account = accounts.find((item) => item.id === payload.sourceAccountId);

  if (!account) {
    throw new Error("Funding account could not be found.");
  }

  if (account.status !== "active" || account.accountType !== "checking") {
    throw new Error("Loan payments must come from an active checking account.");
  }

  const availableBalance = Number(account.availableBalance ?? account.balance ?? 0);

  if (availableBalance < payload.amount) {
    throw new Error("Insufficient available balance for this payment.");
  }

  const nextAccountBalance = Number((Number(account.balance) - payload.amount).toFixed(2));
  const nextLoanBalance = Math.max(
    Number((Number(loan.balance) - payload.amount).toFixed(2)),
    0
  );
  const completedAt = new Date().toISOString();

  const { error: updateAccountError } = await privilegedClient
    .from("accounts")
    .update({
      balance: nextAccountBalance,
      available_balance: nextAccountBalance
    })
    .eq("id", account.id)
    .eq("user_id", userId);

  if (updateAccountError) {
    throw updateAccountError;
  }

  const { error: updateLoanError } = await privilegedClient
    .from("loans")
    .update({
      balance: nextLoanBalance,
      status: nextLoanBalance === 0 ? "closed" : loan.status
    })
    .eq("id", loan.id)
    .eq("user_id", userId);

  if (updateLoanError) {
    throw updateLoanError;
  }

  const { error: transactionError } = await privilegedClient.from("transactions").insert({
    account_id: account.id,
    amount: payload.amount,
    direction: "debit",
    type: "payment",
    category: "Loans",
    description: `${loan.loan_type} loan payment`,
    merchant_name: null,
    posted_at: completedAt,
    running_balance: nextAccountBalance,
    counterparty_account_id: null
  });

  if (transactionError) {
    throw transactionError;
  }

  return {
    id: loan.id,
    status: nextLoanBalance === 0 ? "closed" : loan.status,
    balance: nextLoanBalance
  };
}

export async function runInsightsAnalysis(
  client?: BankingSupabaseClient | null
): Promise<Array<{ title: string; body: string; tone: "success" | "warning" | "default" }>> {
  const snapshot =
    hasSupabaseEnv() && client
      ? await getAuthenticatedDashboardSnapshot(client)
      : await getDashboardSnapshot(client);
  const diningSpend = snapshot.recentTransactions
    .filter((item) => item.category.toLowerCase() === "dining")
    .reduce((sum, item) => sum + item.amount, 0);
  const topGoal = snapshot.financialGoals[0];

  const insights: Array<{
    title: string;
    body: string;
    tone: "success" | "warning" | "default";
  }> = [
    {
      title: "Cash flow posture",
      body:
        snapshot.cashFlow >= 0
          ? `Your current cash flow is positive by ${snapshot.cashFlow.toFixed(2)} this cycle.`
          : `Your scheduled obligations currently exceed inflows by ${Math.abs(snapshot.cashFlow).toFixed(2)}.`,
      tone: snapshot.cashFlow >= 0 ? "success" : "warning"
    },
    {
      title: "Upcoming commitments",
      body: `${snapshot.notifications.length} recent alerts and ${snapshot.accounts.length} active accounts are contributing to your current banking posture.`,
      tone: "default"
    }
  ];

  if (topGoal) {
    insights.push({
      title: "Goal pacing",
      body: `Your leading goal "${topGoal.name}" is funded at ${(
        (topGoal.currentAmount / topGoal.targetAmount) *
        100
      ).toFixed(0)}% of target.`,
      tone: "success"
    });
  }

  if (diningSpend > 0) {
    insights.push({
      title: "Dining trend",
      body: `Recent dining activity totals ${diningSpend.toFixed(2)} and may be worth tracking with a budget control.`,
      tone: "warning"
    });
  }

  return insights.slice(0, 3);
}

export async function streamNotificationEvents() {
  return [
    "event: notification",
    `data: ${JSON.stringify({
      id: "note-live-01",
      type: "security",
      message: "Realtime security alert delivered.",
      createdAt: new Date().toISOString()
    })}`,
    ""
  ].join("\n");
}

export async function streamComplianceEvents() {
  return [
    "event: compliance",
    `data: ${JSON.stringify({
      id: "audit-live-01",
      action: "audit.streamed",
      entity: "audit_logs",
      timestamp: new Date().toISOString()
    })}`,
    ""
  ].join("\n");
}

export async function streamSupportChat(): Promise<ChatMessage[]> {
  return [
    {
      id: "chat-01",
      author: "agent",
      body: "Support connected. I can help with card controls or transfers.",
      createdAt: new Date().toISOString()
    },
    {
      id: "chat-02",
      author: "system",
      body: "Secure chat is active for this session.",
      createdAt: new Date().toISOString()
    }
  ];
}
