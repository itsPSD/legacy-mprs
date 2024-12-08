"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const isFirstMount = useRef(true);

  useEffect(() => {
    // Skip check for these paths
    const publicPaths = ["/login", "/update-profile"];
    if (publicPaths.includes(pathname)) {
      return;
    }

    if (status === "loading" || !isFirstMount.current) {
      return;
    }

    // If authenticated but profile incomplete, redirect to update-profile
    if (status === "authenticated" && session?.user) {
      const { characterName, cid } = session.user;

      if (characterName === null || cid === null) {
        router.push("/update-profile");
      }
    }

    isFirstMount.current = false;
  }, [session, status, pathname, router]);

  // Effect to update session when on update-profile page
  useEffect(() => {
    if (pathname === "/update-profile") {
      // Force session refresh
      update();
    }
  }, [pathname, update]);

  return <>{children}</>;
}
