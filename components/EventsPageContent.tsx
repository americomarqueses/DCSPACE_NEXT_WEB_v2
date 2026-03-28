"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import type { ApiEvent } from "@/lib/api/types";
import { EventBookmarkButton, EventsBookmarks } from "@/components/EventsBookmarks";
import { SearchWithClear } from "@/components/SearchWithClear";

function formatEventWhen(iso: string, start: string, end: string) {
  try {
    const d = new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
    return `${d} · ${start}–${end}`;
  } catch {
    return `${iso} · ${start}–${end}`;
  }
}

function organizerLabel(ev: ApiEvent) {
  const o = ev.organizer;
  if (!o) return "Organizer";
  return `${o.first_name} ${o.last_name}`.trim() || o.email;
}

export function EventsPageContent() {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    apiFetch<{ success: boolean; data: ApiEvent[] }>("/api/events")
      .then((res) => {
        if (res.success && Array.isArray(res.data)) setEvents(res.data);
      })
      .catch((e: unknown) =>
        setErr(e instanceof Error ? e.message : "Failed to load events"),
      )
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return events;
    return events.filter(
      (ev) =>
        ev.event_name.toLowerCase().includes(t) ||
        ev.venue_name.toLowerCase().includes(t) ||
        organizerLabel(ev).toLowerCase().includes(t),
    );
  }, [events, q]);

  return (
    <EventsBookmarks>
      <header className="main__header">
        <div className="main__header-row">
          <h1 className="main__title">Browse Events</h1>
          <div className="main__tools">
            <button type="button" className="main__tool" aria-label="Layout">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="4" y="4" width="7" height="7" rx="1.5" />
                <rect x="13" y="4" width="7" height="7" rx="1.5" />
                <rect x="4" y="13" width="7" height="7" rx="1.5" />
                <rect x="13" y="13" width="7" height="7" rx="1.5" />
              </svg>
            </button>
            <button type="button" className="main__tool" aria-label="Refresh">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-2.64-6.36" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 3v6h-6" />
              </svg>
            </button>
          </div>
        </div>
        <div className="main__divider" role="presentation" />
      </header>

      <section className="main__detail-wrap">
        {err ? (
          <p style={{ color: "#b91c1c", marginBottom: "0.75rem" }} role="alert">
            {err}
          </p>
        ) : null}
        {loading ? <p style={{ marginBottom: "0.75rem" }}>Loading events…</p> : null}

        <SearchWithClear value={q} onChange={setQ} />

        <div className="list">
          {!loading && !err && filtered.length === 0 ? (
            <p style={{ opacity: 0.85 }}>No events match your search.</p>
          ) : null}
          {filtered.map((ev, i) => (
            <article
              key={ev.event_id}
              className={`event-card ${i % 2 === 0 ? "event-card--cream" : "event-card--white"}`}
              data-event-id={ev.event_id}
            >
              <div
                className="event-card__media"
                role="img"
                aria-label="Event publication material"
              >
                {ev.reference_code}
              </div>
              <div className="event-card__body">
                <EventBookmarkButton eventId={ev.event_id} />
                <h2 className="event-name">{ev.event_name}</h2>
                <p className="event-meta">{formatEventWhen(ev.event_date, ev.start_time, ev.end_time)}</p>
                <p className="event-meta">{ev.venue_name}</p>
                <p className="event-meta">{organizerLabel(ev)}</p>
                <div className="event-card__actions">
                  <Link
                    className="event-card__cta"
                    href={`/hover?event_id=${encodeURIComponent(ev.event_id)}`}
                  >
                    <span className="cta__label--details">View Details</span>
                    <span className="cta__label--join">Join</span>
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 6l6 6-6 6"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </EventsBookmarks>
  );
}
