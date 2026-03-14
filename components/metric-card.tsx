import { Card, CardDescription, CardTitle } from "@banking/ui";

export function MetricCard({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card className="space-y-2">
      <CardDescription>{label}</CardDescription>
      <CardTitle className="text-3xl">{value}</CardTitle>
      <p className="text-sm text-slate-500">{detail}</p>
    </Card>
  );
}

