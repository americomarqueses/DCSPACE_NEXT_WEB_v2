"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import type { ApiAttendanceRecord, ApiCertificate, ApiEvent } from "@/lib/api/types";
import { clearSession, getStoredUser } from "@/lib/auth/session";

type MeResponse = {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role_code: string;
  school?: { school_name: string; school_code: string } | null;
};

function initials(u: { first_name: string; last_name: string }) {
  const a = u.first_name?.[0] ?? "";
  const b = u.last_name?.[0] ?? "";
  return `${a}${b}`.toUpperCase() || "?";
}

export function MyProfileContent() {
  const router = useRouter();
  const [tab, setTab] = useState<"attended" | "organized" | "certs">("organized");
  const [sortAsc, setSortAsc] = useState(true);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [attendance, setAttendance] = useState<ApiAttendanceRecord[]>([]);
  const [certs, setCerts] = useState<ApiCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const sessionUser = getStoredUser();
    if (!sessionUser) {
      setLoading(false);
      return;
    }
    setErr(null);
    try {
      const [meRes, evRes, attRes, certRes] = await Promise.all([
        apiFetch<{ success: boolean; data: MeResponse }>("/api/auth/me"),
        apiFetch<{ success: boolean; data: ApiEvent[] }>("/api/events"),
        apiFetch<{ success: boolean; data: ApiAttendanceRecord[] }>("/api/attendance"),
        apiFetch<{ success: boolean; data: ApiCertificate[] }>("/api/certificates"),
      ]);
      if (meRes.success && meRes.data) setMe(meRes.data);
      if (evRes.success && Array.isArray(evRes.data)) setEvents(evRes.data);
      if (attRes.success && Array.isArray(attRes.data)) setAttendance(attRes.data);
      if (certRes.success && Array.isArray(certRes.data)) setCerts(certRes.data);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sessionUser = getStoredUser();
  const organized = events.filter((e) => e.organizer_user_id === sessionUser?.user_id);

  const attendedRows = attendance
    .map((a) => a.event)
    .filter((x): x is ApiEvent => Boolean(x));

  const tableRows =
    tab === "organized"
      ? organized.map((e) => ({
          name: e.event_name,
          date: new Date(e.event_date).toLocaleDateString(),
          status: e.event_status_code,
        }))
      : tab === "attended"
        ? attendedRows.map((e) => ({
            name: e.event_name,
            date: new Date(e.event_date).toLocaleDateString(),
            status: e.event_status_code,
          }))
        : certs.map((c) => ({
            name: c.event?.event_name ?? c.reference_code,
            date: new Date(c.issued_at_utc).toLocaleDateString(),
            status: "issued",
          }));

  const sortedRows = [...tableRows].sort((a, b) =>
    sortAsc ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date),
  );

  function logout() {
    clearSession();
    router.push("/login");
  }

  return (
    <div className="main--profile">
      <header className="profile-page-header">
        <h1 className="profile-page-header__title">My Profile</h1>
        <div className="profile-page-header__tools">
          <button type="button" className="profile-logout" onClick={logout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M12 2v10" />
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
            </svg>
            Log out
          </button>
        </div>
      </header>

      <div className="profile-page__inner">
        {err ? (
          <p style={{ color: "#b91c1c", padding: "0 1rem" }} role="alert">
            {err}
          </p>
        ) : null}
        {loading ? <p style={{ padding: "0 1rem" }}>Loading…</p> : null}

        <div className="profile-hero-strip">
          <hr className="profile-hero-strip__rule" />
        </div>

        <section className="profile-summary" aria-labelledby="profile-summary-heading">
          <h2 id="profile-summary-heading" className="visually-hidden">
            Profile summary
          </h2>
          <div className="profile-summary__photo" aria-hidden>
            <span className="profile-summary__initials">
              {me ? initials(me) : "—"}
            </span>
          </div>
          <div className="profile-summary__fields">
            <p className="profile-summary__name">
              {me ? `${me.first_name} ${me.last_name}`.trim() : "—"}
            </p>
            <p className="profile-summary__line">
              <span>Email:</span> {me?.email ?? "—"}
            </p>
            <p className="profile-summary__line">
              <span>Role:</span> {me?.role_code ?? "—"}
            </p>
            <p className="profile-summary__line">
              <span>School:</span> {me?.school?.school_name ?? "—"}
            </p>
          </div>
        </section>

        <div className="profile-tabs" role="tablist" aria-label="Profile sections">
          <button
            type="button"
            className={`profile-tab${tab === "attended" ? " is-active" : ""}`}
            role="tab"
            aria-selected={tab === "attended"}
            onClick={() => setTab("attended")}
          >
            Events Attended ({attendance.length})
          </button>
          <button
            type="button"
            className={`profile-tab${tab === "organized" ? " is-active" : ""}`}
            role="tab"
            aria-selected={tab === "organized"}
            onClick={() => setTab("organized")}
          >
            Events Organized ({organized.length})
          </button>
          <button
            type="button"
            className={`profile-tab${tab === "certs" ? " is-active" : ""}`}
            role="tab"
            aria-selected={tab === "certs"}
            onClick={() => setTab("certs")}
          >
            Certificates ({certs.length})
          </button>
        </div>

        <div className="profile-panel">
          <div className="profile-table-wrap">
            <table className="profile-table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Date</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="cell-muted">
                      No rows yet.
                    </td>
                  </tr>
                ) : (
                  sortedRows.map((row, i) => (
                    <tr key={`${row.name}-${row.date}-${i}`}>
                      <td>{row.name}</td>
                      <td>{row.date}</td>
                      <td>
                        <span className="profile-table__status">{row.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="profile-panel__footer">
            <div className="profile-sort" role="group" aria-label="Sort order">
              <button
                type="button"
                className={`profile-sort__btn${sortAsc ? " is-active" : ""}`}
                aria-pressed={sortAsc}
                onClick={() => setSortAsc(true)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10l4-4 4 4M16 14l-4 4-4-4" />
                </svg>
                Ascending
              </button>
              <button
                type="button"
                className={`profile-sort__btn${!sortAsc ? " is-active" : ""}`}
                aria-pressed={!sortAsc}
                onClick={() => setSortAsc(false)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 14l4 4 4-4M16 10l-4-4-4 4" />
                </svg>
                Descending
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
