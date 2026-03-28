"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import type { ApiAttendanceRecord } from "@/lib/api/types";
import { SearchWithClear } from "@/components/SearchWithClear";

function statusLabel(code: string) {
  const c = code.toLowerCase();
  if (c === "present") return "Present";
  if (c === "late") return "Late";
  if (c === "absent") return "Absent";
  return code;
}

export function AttendancePageContent() {
  const [records, setRecords] = useState<ApiAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    apiFetch<{ success: boolean; data: ApiAttendanceRecord[] }>("/api/attendance")
      .then((res) => {
        if (res.success && Array.isArray(res.data)) setRecords(res.data);
      })
      .catch((e: unknown) =>
        setErr(e instanceof Error ? e.message : "Failed to load attendance"),
      )
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return records;
    return records.filter((r) => {
      const name = r.event?.event_name ?? "";
      return name.toLowerCase().includes(t);
    });
  }, [records, q]);

  return (
    <>
      <header className="main__header">
        <div className="main__header-row">
          <h1 className="main__title">Attendance</h1>
        </div>
        <div className="main__divider" role="presentation" />
      </header>

      <div className="main__grid-wrap">
        {err ? (
          <p style={{ color: "#b91c1c", padding: "0 1.5rem" }} role="alert">
            {err}
          </p>
        ) : null}
        <section className="attendance-shell" aria-label="My events attendance">
          <div className="attendance-top">
            <h2 className="attendance-subtitle">My Events</h2>
            <SearchWithClear role="search" value={q} onChange={setQ} />
          </div>

          {loading ? <p style={{ padding: "0 1rem" }}>Loading…</p> : null}

          <div className="table-wrap" aria-label="Attendance list">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th scope="col">Event Name</th>
                  <th scope="col">Date</th>
                  <th scope="col">Status</th>
                  <th scope="col">E-certificate</th>
                  <th scope="col" className="col-open" />
                </tr>
              </thead>
              <tbody>
                {!loading && filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="cell-muted">
                      No attendance records yet.
                    </td>
                  </tr>
                ) : null}
                {filtered.map((r) => {
                  const ev = r.event;
                  const dateStr = ev?.event_date
                    ? new Date(ev.event_date).toLocaleDateString()
                    : "—";
                  const name = ev?.event_name ?? "—";
                  return (
                    <tr key={r.attendance_record_id}>
                      <td>{name}</td>
                      <td className="cell-muted">{dateStr}</td>
                      <td className="cell-muted">{statusLabel(r.attendance_status_code)}</td>
                      <td className="cert">—</td>
                      <td className="col-open">
                        <Link
                          href={`/attendance/details?event_id=${encodeURIComponent(r.event_id)}`}
                          className="open-btn open-btn--primary"
                        >
                          Open
                          <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                            <path
                              d="M9 6l6 6-6 6"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
