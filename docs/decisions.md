# Decision Log

## Decision 1 - Use a pnpm workspace monorepo
Reason:
- Separate customer and admin surfaces without duplicating tooling.
- Share domain types, UI, config, and database access logic.
- Keep CI and deployment orchestration predictable.

Tradeoffs:
- Workspace management adds setup complexity.
- Shared package versioning requires discipline.

## Decision 2 - Use Supabase as the banking backend foundation
Reason:
- Managed Postgres, Auth, Storage, Realtime, and Edge Functions reduce platform overhead.
- RLS enables tenant isolation directly in the data layer.
- Fast delivery for mid-size institutions that need extensibility more than core-ledger replacement.

Tradeoffs:
- Vendor-specific operational patterns.
- Complex workflows still require careful service boundaries and observability.

## Decision 3 - Unify customer and operations routes into one Next.js app
Reason:
- The user explicitly required a single Next.js application rather than separate deployment units.
- Shared auth, API handlers, and deployment configuration are simpler when `/admin` lives in the same app.

Tradeoffs:
- Retail and admin concerns require stricter route-level authorization discipline.
- A single deployment has a larger blast radius if routing or middleware breaks.

## Decision 4 - Use server-rendered route handlers with shared query services
Reason:
- Centralizes validation and policy-aware access patterns.
- Keeps TanStack Query focused on client caching where it adds value.
- Works cleanly with Vercel and Supabase.

Tradeoffs:
- Some duplication between server and client boundaries.
- Requires discipline around env handling to keep builds portable.

## Decision 5 - Model security controls as first-class platform services
Reason:
- Audit logs, device sessions, fraud events, and MFA state are not optional in banking.
- Makes compliance automation and observability easier to extend later.

Tradeoffs:
- Increases schema breadth in Phase 1.
- Requires careful governance of sensitive metadata.

## Decision 6 - Use a typed fallback data layer during the initial increment
Reason:
- Keeps the unified Next.js app renderable before local Supabase credentials and session middleware are wired.
- Lets shared route handlers and UI evolve against stable banking contracts instead of ad hoc mocks.

Tradeoffs:
- The current increment does not yet exercise authenticated live queries end to end.
- Teams must remove fallback usage from critical paths as real data flows are completed.

## Decision 7 - Randomize signup bootstrap data at the database trigger layer
Reason:
- Real Supabase Auth signups should feel like distinct customers instead of clones with identical demo balances and merchants.
- Generating starter data in the trigger keeps user provisioning consistent across local, hosted, and CI environments.

Tradeoffs:
- Randomized onboarding data is less deterministic for snapshot-style tests and debugging.
- Support and analytics flows must avoid assuming every user has the same product mix.

## Decision 8 - Execute Phase 1 customer mutations as server actions backed by RLS-safe Supabase sessions
Reason:
- Transfers, bill payments, card controls, loan payments, support tickets, device trust, and MFA need authenticated user context, not anonymous API calls.
- Server actions keep the form flows simple in Next.js while preserving Supabase session cookies for Row Level Security.
- Extending the transfers schema for ACH keeps Phase 1 execution paths in one ledger-facing workflow instead of faking external rails in the UI.

Tradeoffs:
- Mutation logic now depends on database migrations staying in lockstep with deployed app code.
- Some richer client interactions may later need optimistic UI or TanStack Query invalidation on top of these server actions.

## Decision 9 - Start Phase 2 with personal finance extensions before institution-grade rails
Reason:
- Document portal, budgeting, and savings automation reuse the existing customer session, transaction history, and statement artifacts with low architectural risk.
- These modules add visible product depth quickly while avoiding premature complexity around business accounts, wires, or networked P2P settlement.
- The same typed query layer can expose budget analytics and automation rules without splitting the app into new services yet.

Tradeoffs:
- Phase 2 starts with customer self-service depth rather than the highest operational leverage modules.
- Savings automation remains configuration-first until a scheduled execution worker is added in a later increment.

## Decision 10 - Keep the remaining Phase 2 modules in the same shared query layer
Reason:
- P2P, business onboarding, wires, credit, wallets, fraud automation, and document ingestion all need the same user/session context and Postgres-side policy checks as Phase 1.
- A shared typed query layer keeps customer pages, admin review flows, and API handlers consistent while avoiding duplicated Supabase access code.
- Admin-only review actions can still use the service-role client behind explicit route and server-action authorization.

Tradeoffs:
- The query package now owns more orchestration logic, so later extraction into dedicated workers or edge functions will require careful decomposition.
- Some “scheduled” Phase 2 workflows are currently operator- or user-triggered execution engines rather than background cron jobs.
