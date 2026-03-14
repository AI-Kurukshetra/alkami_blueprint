"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@banking/ui";

export function AdminFraudAutomationButton({
  tab,
  filter
}: {
  tab: string;
  filter: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleClick() {
    setLocalError(null);

    const response = await fetch("/api/admin/fraud", {
      method: "POST"
    });
    const payload = (await response.json()) as
      | { data?: { created?: number; reviewed?: number }; error?: string }
      | undefined;

    if (!response.ok) {
      setLocalError(payload?.error ?? "Unable to run fraud automation.");
      startTransition(() => {
        router.replace(
          `/admin/fraud?tab=${encodeURIComponent(tab)}&filter=${encodeURIComponent(filter)}&error=${encodeURIComponent(
            payload?.error ?? "Unable to run fraud automation."
          )}`
        );
        router.refresh();
      });
      return;
    }

    const created = payload?.data?.created ?? 0;
    const reviewed = payload?.data?.reviewed ?? 0;
    const message = `Fraud automation reviewed ${reviewed} signal${reviewed === 1 ? "" : "s"} and created ${created} new event${created === 1 ? "" : "s"}.`;

    startTransition(() => {
      router.replace(
        `/admin/fraud?tab=${encodeURIComponent(tab)}&filter=${encodeURIComponent(filter)}&message=${encodeURIComponent(message)}`
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Button
        aria-busy={isPending}
        disabled={isPending}
        onClick={() => void handleClick()}
        type="button"
      >
        <span className="inline-flex items-center gap-2">
          {isPending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
          ) : null}
          {isPending ? "Scanning signals..." : "Run fraud automation"}
        </span>
      </Button>
      {localError ? <p className="text-sm text-rose-600">{localError}</p> : null}
    </div>
  );
}
