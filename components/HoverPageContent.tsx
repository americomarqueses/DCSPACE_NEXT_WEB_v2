"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import type { ApiEvent } from "@/lib/api/types";

type EventDetail = ApiEvent & {
  event_description?: string | null;
};

export function HoverPageContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("event_id");
  const [ev, setEv] = useState<EventDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) {
      setErr("Missing event_id in URL. Open an event from Browse Events.");
      setLoading(false);
      return;
    }
    apiFetch<{ success: boolean; data: EventDetail }>(
      `/api/events/${encodeURIComponent(eventId)}`,
    )
      .then((res) => {
        if (res.success && res.data) setEv(res.data);
      })
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : "Failed to load event"))
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) {
    return (
      <p style={{ padding: "1rem 1.5rem" }} role="status">
        Loading event…
      </p>
    );
  }

  if (err || !ev) {
    return (
      <p style={{ padding: "1rem 1.5rem", color: "#b91c1c" }} role="alert">
        {err ?? "Event not found."}
      </p>
    );
  }

  const when = `${new Date(ev.event_date).toLocaleDateString(undefined, { dateStyle: "full" })} · ${ev.start_time}–${ev.end_time}`;
  const organizer = ev.organizer
    ? `${ev.organizer.first_name} ${ev.organizer.last_name}`.trim()
    : "—";

  return (
    <>
      <header className="main__header">
        <div className="main__header-row">
          <h1 className="main__title">Event details</h1>
        </div>
      </header>

      <section className="content">
        <h2 className="upcoming">{ev.event_name}</h2>
        <div className="tag">{ev.reference_code}</div>

        <div className="event-block">
          <div className="calendar" aria-hidden>
            <svg viewBox="0 0 64 64">
              <rect x="6" y="10" width="52" height="48" rx="5" />
              <rect x="6" y="20" width="52" height="7" rx="1" />
              <rect x="18" y="5" width="6" height="14" rx="3" />
              <rect x="40" y="5" width="6" height="14" rx="3" />
              <rect x="14" y="33" width="8" height="8" rx="1.5" />
              <rect x="28" y="33" width="8" height="8" rx="1.5" />
              <rect x="42" y="33" width="8" height="8" rx="1.5" />
              <rect x="14" y="45" width="8" height="8" rx="1.5" />
              <rect x="28" y="45" width="8" height="8" rx="1.5" />
              <rect x="42" y="45" width="8" height="8" rx="1.5" />
            </svg>
          </div>

          <div className="event-main">
            <h2>{ev.event_name}</h2>
            <div className="meta">
              <div className="meta-row">
                <svg viewBox="0 0 24 24">
                  <rect x="3" y="5" width="18" height="16" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="8" y1="3" x2="8" y2="7" />
                  <line x1="16" y1="3" x2="16" y2="7" />
                </svg>
                {when}
              </div>
              <div className="meta-row">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="8" />
                  <path d="M12 8v4l2.8 1.8" />
                </svg>
                {ev.venue_name}
              </div>
              <div className="meta-row">
                <svg viewBox="0 0 24 24">
                  <path d="M12 21s6-5.7 6-10a6 6 0 1 0-12 0c0 4.3 6 10 6 10Z" />
                  <circle cx="12" cy="11" r="2.4" />
                </svg>
                {organizer}
              </div>
            </div>

            <p className="description">
              {ev.event_description?.trim() ||
                "No description provided for this event yet."}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
