# API Specification

## Customer APIs

### `GET /api/accounts`
Returns the authenticated user's accounts and balance summary.

### `GET /api/accounts/statements`
Returns available statement documents for the authenticated user.

### `GET /api/transactions?accountId=<uuid>&limit=50`
Returns transaction history scoped to the authenticated user and selected account.

### `GET /api/transactions/export?format=csv|pdf`
Exports filtered transactions as CSV or HTML-based printable output.

### `POST /api/transfers`
Creates a transfer between eligible internal or external destinations.

Request body:
```json
{
  "fromAccountId": "uuid",
  "toAccountId": "uuid",
  "amount": 250.00,
  "memo": "Savings contribution"
}
```

### `POST /api/transfers/quote`
Returns delivery and risk posture for a transfer before execution.

### `GET /api/p2p`
Returns the authenticated user's peer payment contacts and activity.

### `POST /api/p2p`
Creates either a new P2P contact or a send/request money record.

### `GET /api/bills`
Returns scheduled and recurring bills for the authenticated user.

### `POST /api/bills`
Creates a scheduled bill payment.

### `GET /api/bills/reminders`
Returns reminder and escalation metadata for scheduled bills.

### `GET /api/cards`
Returns active cards and controls metadata.

### `POST /api/cards/control`
Updates card freeze or spend-limit controls.

### `GET /api/loans`
Returns active loans and upcoming payment information.

### `GET /api/loans/schedule`
Returns loan payment schedules and amortization previews.

### `GET /api/documents`
Returns the authenticated user's document catalog.

### `GET /api/documents/download?documentId=<uuid>`
Streams a private uploaded document from Supabase Storage.

### `GET /api/budgets`
Returns monthly budget targets and utilization insights.

### `POST /api/budgets`
Creates or updates a monthly budget target.

### `GET /api/savings-rules`
Returns savings automation rules for the authenticated user.

### `POST /api/savings-rules`
Creates a new savings automation rule.

### `PATCH /api/savings-rules`
Pauses or resumes a savings automation rule.

### `GET /api/business`
Returns business profiles and delegated memberships visible to the authenticated user.

### `POST /api/business`
Creates a business profile or adds a delegated business member.

### `GET /api/wires`
Returns domestic wire transfer history for the authenticated user.

### `POST /api/wires`
Initiates a domestic wire transfer and may place it into manual review.

### `GET /api/credit-score`
Returns the current credit profile and historical score snapshots.

### `POST /api/credit-score`
Refreshes the authenticated user's credit profile and appends a new score snapshot.

### `GET /api/wallets`
Returns the authenticated user's digital wallet enrollments.

### `POST /api/wallets`
Starts a new Apple Pay or Google Pay enrollment request.

### `PATCH /api/wallets`
Activates or suspends an existing wallet token.

### `GET /api/notifications`
Returns in-app notifications sorted by recency.

### `GET /api/notifications/stream`
Returns realtime notification events over server-sent events.

### `GET /api/support`
Returns the authenticated user's support tickets.

### `GET /api/support/chat`
Returns the secure chat stream bootstrap payload.

### `GET /api/insights`
Returns AI or rule-based financial insight cards.

### `POST /api/auth/login`
Authenticates a user and indicates MFA/device posture.

### `POST /api/auth/signup`
Creates a user enrollment request and starts MFA onboarding.

### `POST /api/auth/mfa`
Creates or verifies an MFA challenge.

### `GET /api/auth/devices`
Returns tracked user devices.

### `POST /api/auth/devices`
Marks a tracked device as trusted or untrusted.

### `GET /api/compliance/stream`
Streams compliance and audit events for operator workflows.

### `POST /api/telemetry`
Accepts application telemetry and error events.

## Admin APIs

### `GET /api/admin/users`
Returns user records for operators with the `admin` role from the unified app.

### `GET /api/admin/accounts`
Returns account inventory and account status for admin users.

### `GET /api/admin/fraud`
Returns fraud events, severity, and review status.

### `POST /api/admin/fraud`
Runs the fraud rule pipeline across recent customer activity.

### `PATCH /api/admin/fraud`
Updates fraud event states or approves/flags wires that are in review.

### `GET /api/admin/compliance`
Returns audit log entries and compliance event summaries.
