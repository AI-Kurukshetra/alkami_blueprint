"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NavigationOverlayProvider } from "@banking/ui";
import type { ReactNode } from "react";
import { useState } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationOverlayProvider>{children}</NavigationOverlayProvider>
    </QueryClientProvider>
  );
}
