import { z } from "zod";

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000")
});

export const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional()
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getPublicEnv(): PublicEnv {
  return publicEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL
  });
}

export const customerNavigation = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/accounts", label: "Accounts" },
  { href: "/documents", label: "Documents" },
  { href: "/transactions", label: "Transactions" },
  { href: "/transfers", label: "Transfers" },
  { href: "/p2p", label: "P2P" },
  { href: "/bills", label: "Bills" },
  { href: "/cards", label: "Cards" },
  { href: "/loans", label: "Loans" },
  { href: "/business", label: "Business" },
  { href: "/wires", label: "Wires" },
  { href: "/budgeting", label: "Budgeting" },
  { href: "/savings", label: "Savings" },
  { href: "/credit", label: "Credit" },
  { href: "/wallets", label: "Wallets" },
  { href: "/insights", label: "Insights" },
  { href: "/support", label: "Support" },
  { href: "/settings", label: "Settings" }
] as const;

export const adminNavigation = [
  { href: "/admin/users", label: "Users" },
  { href: "/admin/accounts", label: "Accounts" },
  { href: "/admin/fraud", label: "Fraud" },
  { href: "/admin/compliance", label: "Compliance" }
] as const;

export const platformMetadata = {
  name: "NextGen Digital Banking Experience Platform",
  supportEmail: "operations@nextgen-bank.dev"
} as const;
