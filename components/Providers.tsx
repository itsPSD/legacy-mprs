"use client";

import { SessionProvider } from "next-auth/react";
import { RouteGuard } from "./RouteGuard";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <RouteGuard>{children}</RouteGuard>
    </SessionProvider>
  );
}
