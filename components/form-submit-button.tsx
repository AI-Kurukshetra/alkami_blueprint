"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@banking/ui";

export function FormSubmitButton({
  children,
  pendingLabel = "Working...",
  ...props
}: ButtonProps & {
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button aria-busy={pending} disabled={pending || props.disabled} {...props}>
      <span className="inline-flex items-center gap-2">
        {pending ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
        ) : null}
        {pending ? pendingLabel : children}
      </span>
    </Button>
  );
}
