# Development Tasks

## Phase 1 - MVP

### Infrastructure
- [x] Setup monorepo
- [x] Setup Next.js app
- [x] Configure Supabase project structure
- [x] Setup environment variable contracts
- [x] Setup shared packages
- [x] Setup CI pipeline
- [x] Add Supabase local development scripts
- [x] Provision Vercel deployment configuration

### Auth
- [x] Define Supabase Auth integration layer
- [x] Build login UI
- [x] Build signup UI
- [x] Implement MFA enrollment and challenge flows
- [x] Implement trusted-device management
- [x] Randomize post-signup banking bootstrap data

### Accounts
- [x] Design accounts schema
- [x] Build account dashboard shell
- [x] Build accounts API route
- [x] Connect live Supabase balances to UI
- [x] Add statements download flow

### Transactions
- [x] Design transaction schema
- [x] Build transaction history UI
- [x] Build transactions API route
- [x] Add advanced search and filtering
- [x] Add CSV and PDF export

### Transfers
- [x] Design transfers schema
- [x] Build transfer API route
- [x] Build transfer UI
- [x] Add internal and external transfer orchestration
- [x] Add transfer risk controls
- [x] Persist internal transfer mutations and balance updates
- [x] Execute external ACH transfers end to end

### Bills
- [x] Design payees schema
- [x] Build bill payment UI
- [x] Build bills API route
- [x] Add autopay orchestration
- [x] Add bill reminders and due-date escalation
- [x] Replace Add payee CTA with payee creation flow
- [x] Replace static bill pay shell with bill scheduling and payment submission

### Cards
- [x] Design cards schema
- [x] Build card controls UI
- [x] Build cards API route
- [x] Add card freeze and spend-control mutations
- [x] Wire card freeze/unfreeze and spend-limit controls to persisted mutations

### Loans
- [x] Design loans schema
- [x] Build loan dashboard UI
- [x] Build loans API route
- [x] Add payment scheduling and amortization details
- [x] Replace Make payment CTA with loan payment mutation flow

### Notifications
- [x] Design notifications schema
- [x] Build notification service foundation
- [x] Build notifications API route
- [x] Build notification UI
- [x] Add realtime notification delivery

### Support
- [x] Design support ticket schema
- [x] Build support portal UI
- [x] Build support API route
- [x] Add live chat streaming
- [x] Replace Open ticket CTA with ticket creation flow

### Security and Observability
- [x] Design audit logging model
- [x] Design fraud event model
- [x] Add RLS policies
- [x] Add fraud-monitor edge function stub
- [x] Add AI insights edge function stub
- [x] Implement compliance log streaming
- [x] Implement app telemetry and error tracking
- [x] Replace Manage MFA CTA with real enrollment and preference management

### Phase 1 Remediation
- [x] Convert statement download CTAs into generated downloadable statement files
- [x] Replace Run analysis CTA with rerunnable server-side insights generation
- [x] Replace remaining disabled Phase 1 CTA placeholders with working flows

### Testing
- [x] Add Vitest configuration
- [x] Add Playwright configuration
- [x] Add smoke tests for shared utilities
- [x] Add end-to-end auth and dashboard coverage

## Phase 2 - Expanded Platform
- [ ] P2P payments
- [ ] Business accounts
- [ ] Document portal
- [ ] Wire transfers
- [ ] Budgeting tools
- [ ] Credit score monitoring
- [ ] Fraud detection automation
- [ ] Digital wallets
- [ ] Savings automation

## Phase 3 - Advanced Platform
- [ ] AI financial insights production service
- [ ] Open banking APIs
- [ ] Real-time payment rails
- [ ] AI chatbot
- [ ] Behavioral analytics
- [ ] Crypto wallets
- [ ] Compliance automation
