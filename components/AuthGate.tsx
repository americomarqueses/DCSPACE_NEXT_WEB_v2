"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getStoredToken } from "@/lib/auth/session";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      const next = encodeURIComponent(pathname || "/dashboard");
      router.replace(`/login?callbackUrl=${next}`);
      return;
    }
    setReady(true);
  }, [router, pathname]);

  if (!ready) {
    return (
      <div className="main" style={{ padding: "2rem" }}>
        <p>Loading…</p>
      </div>
    );
  }

  return <>{children}</>;
}
