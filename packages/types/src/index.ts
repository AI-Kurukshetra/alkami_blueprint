export type UserRole = "customer" | "admin";

export type AccountType = "checking" | "savings" | "money_market" | "credit";
export type RecordStatus = "active" | "inactive" | "blocked" | "closed";
export type TransactionDirection = "debit" | "credit";
export type TransactionType =
  | "purchase"
  | "deposit"
  | "payment"
  | "transfer"
  | "fee"
  | "refund"
  | "interest"
  | "withdrawal";
export type TransferStatus = "pending" | "completed" | "failed" | "cancelled";
export type BillStatus = "scheduled" | "paid" | "overdue" | "cancelled";
export type CardType = "debit" | "credit";
export type LoanType = "mortgage" | "auto" | "personal" | "student";
export type SupportStatus = "open" | "pending" | "resolved";
export type FraudSeverity = "low" | "medium" | "high" | "critical";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface Account {
  id: string;
  userId: string;
  accountType: AccountType;
  nickname: string;
  accountNumber: string;
  balance: number;
  availableBalance: number;
  currency: string;
  status: RecordStatus;
  createdAt: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  direction: TransactionDirection;
  type: TransactionType;
  category: string;
  description: string;
  merchantName: string | null;
  postedAt: string;
}

export interface Transfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  status: TransferStatus;
  memo: string | null;
  createdAt: string;
}

export interface Bill {
  id: string;
  userId: string;
  payeeName: string;
  amount: number;
  dueDate: string;
  status: BillStatus;
  frequency: string;
}

export interface Card {
  id: string;
  userId: string;
  accountId: string;
  cardType: CardType;
  network: string;
  last4: string;
  status: RecordStatus;
  spendLimit: number | null;
}

export interface Loan {
  id: string;
  userId: string;
  loanType: LoanType;
  balance: number;
  originalAmount: number;
  interestRate: number;
  nextPaymentDate: string;
  status: RecordStatus;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface DeviceSession {
  id: string;
  userId: string;
  deviceFingerprint: string;
  userAgent: string;
  trusted: boolean;
  lastSeenAt: string;
  createdAt: string;
}

export interface StatementDocument {
  id: string;
  userId: string;
  documentType: string;
  storagePath: string;
  status: string;
  createdAt: string;
}

export interface P2PContact {
  id: string;
  userId: string;
  displayName: string;
  handle: string;
  destinationReference: string;
  status: "active" | "pending" | "blocked";
  createdAt: string;
}

export interface P2PTransfer {
  id: string;
  userId: string;
  contactId: string;
  fromAccountId: string;
  amount: number;
  direction: "sent" | "requested";
  status: TransferStatus;
  note: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface BusinessProfile {
  id: string;
  userId: string;
  businessName: string;
  legalName: string;
  industry: string;
  taxIdMasked: string;
  status: "active" | "pending_review" | "inactive";
  createdAt: string;
}

export interface BusinessMembership {
  id: string;
  businessProfileId: string;
  userId: string;
  membershipRole: "owner" | "operator" | "viewer";
  status: "active" | "invited" | "disabled";
  createdAt: string;
}

export interface BudgetTarget {
  id: string;
  userId: string;
  category: string;
  limitAmount: number;
  period: "monthly";
  alertThreshold: number;
  active: boolean;
  createdAt: string;
}

export interface BudgetInsight {
  category: string;
  limitAmount: number;
  spentAmount: number;
  remainingAmount: number;
  utilization: number;
  status: "on_track" | "watch" | "over_budget";
}

export interface SavingsRule {
  id: string;
  userId: string;
  sourceAccountId: string;
  destinationAccountId: string;
  ruleType: "roundup" | "recurring" | "percentage";
  amount: number;
  cadence: "weekly" | "biweekly" | "monthly" | "per_transaction";
  active: boolean;
  nextRunAt: string | null;
  createdAt: string;
}

export interface WireTransfer {
  id: string;
  userId: string;
  fromAccountId: string;
  beneficiaryName: string;
  beneficiaryBank: string;
  routingNumberMasked: string;
  accountNumberLast4: string;
  amount: number;
  purpose: string;
  status: TransferStatus;
  reviewStatus: "pending_review" | "approved" | "flagged";
  createdAt: string;
  submittedAt: string | null;
}

export interface CreditProfile {
  id: string;
  userId: string;
  provider: string;
  score: number;
  scoreBand: "excellent" | "good" | "fair" | "poor";
  updatedAt: string;
}

export interface CreditScoreSnapshot {
  id: string;
  userId: string;
  score: number;
  reasonCodes: string[];
  recordedAt: string;
}

export interface WalletToken {
  id: string;
  userId: string;
  cardId: string;
  provider: "apple_pay" | "google_pay";
  deviceLabel: string;
  status: "active" | "suspended" | "pending";
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  status: SupportStatus;
  priority: "low" | "medium" | "high";
  latestMessage: string;
  createdAt: string;
}

export interface FraudEvent {
  id: string;
  userId: string | null;
  accountId: string | null;
  severity: FraudSeverity;
  ruleName: string;
  status: "open" | "reviewing" | "closed";
  payload?: Record<string, unknown>;
  detectedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  timestamp: string;
}

export interface FinancialGoal {
  id: string;
  userId: string;
  name: string;
  currentAmount: number;
  targetAmount: number;
  targetDate: string;
}

export interface LoanPaymentScheduleItem {
  installment: number;
  paymentDate: string;
  principal: number;
  interest: number;
  balance: number;
}

export interface LoanWithSchedule extends Loan {
  monthlyPayment: number;
  amortization: LoanPaymentScheduleItem[];
}

export interface TransferQuote {
  fromAccountId: string;
  toAccountId?: string;
  externalDestination?: string;
  amount: number;
  memo?: string;
  rail: "internal" | "ach";
  estimatedDelivery: string;
  risk: "approved" | "review";
}

export interface ChatMessage {
  id: string;
  author: "customer" | "agent" | "system";
  body: string;
  createdAt: string;
}

export interface DashboardSnapshot {
  netWorth: number;
  monthToDateSpend: number;
  upcomingBills: number;
  cashFlow: number;
  accounts: Account[];
  recentTransactions: Transaction[];
  financialGoals: FinancialGoal[];
  notifications: NotificationItem[];
}
