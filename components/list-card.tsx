import { Badge, Card, CardDescription, CardTitle } from "@banking/ui";

export function ListCard({
  title,
  description,
  items
}: {
  title: string;
  description: string;
  items: Array<{ title: string; value: string; badge?: { label: string; tone?: "default" | "success" | "warning" | "danger" } }>;
}) {
  return (
    <Card className="space-y-4">
      <div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
            key={`${item.title}-${item.value}`}
          >
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-900">{item.title}</p>
              <p className="text-sm text-slate-500">{item.value}</p>
            </div>
            {item.badge ? <Badge tone={item.badge.tone}>{item.badge.label}</Badge> : null}
          </div>
        ))}
      </div>
    </Card>
  );
}

