import { listUsers } from "@banking/database";
import { Badge, Card, CardDescription, CardTitle, PageHeader } from "@banking/ui";
import { formatDate } from "@banking/utils";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

export default async function AdminUsersPage() {
  const supabase = await createSupabaseServerClient();
  const users = await listUsers(supabase);

  return (
    <div className="space-y-6">
      <PageHeader
        description="Customer and staff profile inventory for operations teams."
        eyebrow="Admin"
        title="User management"
      />
      <Card className="space-y-4">
        <CardTitle>User directory</CardTitle>
        <CardDescription>RLS-aware queries are exposed through the same unified web app.</CardDescription>
        <div className="space-y-3">
          {users.map((user) => (
            <div className="flex flex-col gap-3 rounded-2xl bg-slate-50 px-4 py-4 md:flex-row md:items-center md:justify-between" key={user.id}>
              <div>
                <p className="font-medium text-slate-950">{user.name}</p>
                <p className="text-sm text-slate-500">{user.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={user.role === "admin" ? "warning" : "default"}>{user.role}</Badge>
                <p className="text-sm text-slate-500">{formatDate(user.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
