"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  type MouseEvent,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

const NavigationOverlayContext = createContext<{
  beginNavigation: () => void;
} | null>(null);

export function NavigationOverlayProvider({
  children
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  const value = useMemo(
    () => ({
      beginNavigation: () => setIsNavigating(true)
    }),
    []
  );

  return (
    <NavigationOverlayContext.Provider value={value}>
      {children}
      {isNavigating ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/6 px-4 backdrop-blur-[1px]">
        <div className="w-full max-w-xs rounded-[24px] border border-slate-200/90 bg-white/92 px-5 py-5 text-center shadow-[0_18px_60px_rgba(15,23,42,0.12)]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sky-50/80">
            <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-sky-600 border-r-sky-100" />
          </div>
          <p className="mt-4 text-xl font-semibold tracking-[0.04em] text-slate-950">
            Loading
          </p>
        </div>
      </div>
      ) : null}
    </NavigationOverlayContext.Provider>
  );
}

export function AppShellNavLink({
  href,
  className,
  children
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const context = useContext(NavigationOverlayContext);
  const isActive =
    pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    if (href === pathname) {
      return;
    }

    context?.beginNavigation();
  }

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={className}
      data-active={isActive ? "true" : "false"}
      href={href}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
}
