"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, type ButtonProps } from "@banking/ui";

export function PortalActionButton({
  endpoint,
  method = "POST",
  body,
  pendingLabel,
  successPath,
  successMessage,
  errorPath,
  errorMessage,
  children,
  ...props
}: ButtonProps & {
  endpoint: string;
  method?: "POST" | "PATCH";
  body?: Record<string, unknown>;
  pendingLabel: string;
  successPath: string;
  successMessage: string;
  errorPath: string;
  errorMessage: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleClick() {
    setLocalError(null);

    const response = await fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json"
      },
      body: body ? JSON.stringify(body) : undefined
    });
    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      const message = payload.error ?? errorMessage;
      setLocalError(message);
      startTransition(() => {
        router.replace(
          `${errorPath}?error=${encodeURIComponent(message)}`
        );
        router.refresh();
      });
      return;
    }

    startTransition(() => {
      router.replace(
        `${successPath}?message=${encodeURIComponent(successMessage)}`
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Button
        {...props}
        aria-busy={isPending}
        disabled={isPending || props.disabled}
        onClick={() => void handleClick()}
        type="button"
      >
        <span className="inline-flex items-center gap-2">
          {isPending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
          ) : null}
          {isPending ? pendingLabel : children}
        </span>
      </Button>
      {localError ? <p className="text-sm text-rose-600">{localError}</p> : null}
    </div>
  );
}
