"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { DashboardSavedEvents } from "@/components/DashboardSavedEvents";

type DashboardApiResponse = {
  success: boolean;
  data: {
    metrics: unknown;
    upcoming_events: unknown[];
  };
};

export function DashboardPageContent() {
  const [dash, setDash] = useState<DashboardApiResponse["data"] | null>(null);
  const [dashErr, setDashErr] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<DashboardApiResponse>("/api/dashboard")
      .then((res) => {
        if (res.success && res.data) setDash(res.data);
      })
      .catch((e: unknown) =>
        setDashErr(e instanceof Error ? e.message : "Failed to load dashboard"),
      );
  }, []);

  return (
    <>
      <header className="main__header">
        <div className="main__header-row">
          <h1 className="main__title">Dashboard</h1>
          <div className="main__tools">
            <button type="button" className="main__tool" aria-label="Layout">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="4" y="4" width="7" height="7" rx="1.5" />
                <rect x="13" y="4" width="7" height="7" rx="1.5" />
                <rect x="4" y="13" width="7" height="7" rx="1.5" />
                <rect x="13" y="13" width="7" height="7" rx="1.5" />
              </svg>
            </button>
            <button
              type="button"
              className="main__tool"
              aria-label="Refresh"
              onClick={() => window.dispatchEvent(new Event("dc-refresh-saved"))}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-2.64-6.36" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 3v6h-6" />
              </svg>
            </button>
          </div>
        </div>
        <div className="main__divider" role="presentation" />
      </header>

      {dashErr ? (
        <p style={{ padding: "0 1.5rem", color: "#b91c1c" }} role="alert">
          {dashErr}
        </p>
      ) : null}
      {dash ? (
        <p style={{ padding: "0 1.5rem", opacity: 0.85 }}>
          Connected to API — upcoming events:{" "}
          {Array.isArray(dash.upcoming_events) ? dash.upcoming_events.length : 0}
        </p>
      ) : null}

      <div className="main__grid-wrap">
        <DashboardSavedEvents />
      </div>
    </>
  );
}
