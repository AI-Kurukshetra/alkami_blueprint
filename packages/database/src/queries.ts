import { z } from "zod";
import type {
  Account,
  AuditLog,
  Bill,
  ChatMessage,
  Card,
  DashboardSnapshot,
  DeviceSession,
  FinancialGoal,
  FraudEvent,
  Loan,
  LoanWithSchedule,
  NotificationItem,
  StatementDocument,
  SupportTicket,
  TransferQuote,
  Transaction,
  UserProfile
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
  mockCards,
  mockDashboardSnapshot,
  mockDeviceSessions,
  mockDocuments,
  mockFraudEvents,
  mockLoanDetails,
  mockLoans,
  mockNotifications,
  mockSupportTickets,
  mockTransactions,
  mockUsers
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
  const snapshot = await getDashboardSnapshot(client);
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
