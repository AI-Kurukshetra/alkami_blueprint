# Architecture

## Monorepo Layout
- `app`, `components`, and `lib`: unified customer and admin banking portal built as a single root-level Next.js 14 App Router app.
- `packages/ui`: shared design system primitives and layout shells.
- `packages/config`: env schemas, navigation config, and product metadata.
- `packages/database`: Supabase clients, query services, and fallback mock data.
- `packages/types`: banking domain types and enums.
- `packages/utils`: formatting helpers and shared utilities.
- `supabase`: schema migrations, policies, seed data, and edge functions.

## Runtime Architecture
### Client Layer
- Next.js server components render both retail and `/admin` shells from a single deployment.
- TanStack Query hydrates client-side interactions for mutation-heavy flows.
- Tailwind CSS and shared UI primitives keep retail and operator surfaces consistent.

### API Layer
- Route handlers under `app/api/*` expose banking resources.
- Route handlers under `app/api/admin/*` expose operator workflows.
- Zod validates all API inputs and response shaping boundaries.

### Data Layer
- Supabase Postgres stores customer, account, payment, and compliance data.
- Supabase Auth manages identities and session lifecycle.
- Supabase Storage holds statements and document artifacts.
- Supabase RLS enforces tenant boundaries by default.
- Supabase Edge Functions host fraud and insights workflows.
- Shared query services return typed fallback data until Supabase environment variables and authenticated request context are available.

## Security Model
- Public schema tables are mapped to `auth.users` via `public.users.id`.
- RLS defaults to deny; policies explicitly grant per-user or admin access.
- `public.is_admin()` is used by policies for staff overrides.
- Audit logs, device sessions, and fraud events provide traceability.
- MFA and trusted-device flows are exposed through unified auth routes and reflected in schema and docs.

## Deployment Model
- Vercel hosts the unified root-level Next.js deployment.
- Supabase hosts database, auth, storage, and edge functions.
- GitHub Actions runs lint, typecheck, test, and build before deployment.

## Performance Targets
- API p95 under 300 ms for standard read flows.
- Page load under 2 seconds on broadband for dashboard and account pages.
- 99.9% uptime through managed hosting and observability integration.
