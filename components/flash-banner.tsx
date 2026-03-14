"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function FlashBanner({
  message,
  tone
}: {
  message?: string;
  tone: "success" | "error" | "info";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visibleMessage, setVisibleMessage] = useState(message);

  useEffect(() => {
    if (message) {
      setVisibleMessage(message);
    }
  }, [message]);

  useEffect(() => {
    if (!message) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("message");
    nextParams.delete("error");
    const nextQuery = nextParams.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;

    router.replace(nextUrl, { scroll: false });
  }, [message, pathname, router, searchParams]);

  if (!visibleMessage) {
    return null;
  }

  const className =
    tone === "success"
      ? "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
      : tone === "error"
        ? "rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        : "rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700";

  return <div className={className}>{visibleMessage}</div>;
}
