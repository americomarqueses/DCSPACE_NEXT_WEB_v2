"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import type { ApiEvent } from "@/lib/api/types";

type AttendanceRow = {
  attendance_record_id: string;
  attendance_status_code: string;
  check_in_at_utc: string | null;
  check_out_at_utc: string | null;
};

type EventWithAttendance = ApiEvent & {
  event_description?: string | null;
  minimum_attendance_minutes: number;
  attendance_records?: AttendanceRow[];
};

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export function AttendanceDetailsContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("event_id");
  const [ev, setEv] = useState<EventWithAttendance | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) {
      setErr("Missing event_id");
      setLoading(false);
      return;
    }
    apiFetch<{ success: boolean; data: EventWithAttendance }>(
      `/api/events/${encodeURIComponent(eventId)}`,
    )
      .then((res) => {
        if (res.success && res.data) setEv(res.data);
      })
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) {
    return <p style={{ padding: "1rem 1.5rem" }}>Loading…</p>;
  }

  if (err || !ev) {
    return (
      <p style={{ padding: "1rem 1.5rem", color: "#b91c1c" }} role="alert">
        {err ?? "Not found"}
      </p>
    );
  }

  const rec = ev.attendance_records?.[0];
  const day = new Date(ev.event_date).toLocaleDateString(undefined, { dateStyle: "medium" });

  return (
    <>
      <header className="main__header">
        <div className="main__header-row">
          <h1 className="main__title">Attendance</h1>
        </div>
        <div className="main__divider" role="presentation" />
      </header>

      <div className="details-wrap">
        <div className="details-top">
          <div className="event-block">
            <h2 className="event-block__title">{ev.event_name}</h2>
            <p className="event-block__sub">
              Minimum attendance: {ev.minimum_attendance_minutes} minutes
            </p>
          </div>
        </div>

        <div className="details-table-wrap" aria-label="Your attendance">
          <table className="detail-table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Tap IN</th>
                <th scope="col">Tap OUT</th>
                <th scope="col" className="col-status">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {rec ? (
                <tr>
                  <td>{day}</td>
                  <td>{fmtTime(rec.check_in_at_utc)}</td>
                  <td>{fmtTime(rec.check_out_at_utc)}</td>
                  <td className="col-status">
                    <span className="status status--complete">{rec.attendance_status_code}</span>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={4} className="cell-muted">
                    No attendance record for you on this event yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
