"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import type { ApiEvent } from "@/lib/api/types";
import { fetchBookmarkEventIds } from "@/lib/bookmarks";

export function DashboardSavedEvents() {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const [ids, allRes] = await Promise.all([
        fetchBookmarkEventIds(),
        apiFetch<{ success: boolean; data: ApiEvent[] }>("/api/events"),
      ]);
      const all = allRes.success && Array.isArray(allRes.data) ? allRes.data : [];
      const idSet = new Set(ids);
      setEvents(all.filter((e) => idSet.has(e.event_id)));
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not load saved events");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onRefresh = () => void load();
    window.addEventListener("dc-refresh-saved", onRefresh);
    return () => window.removeEventListener("dc-refresh-saved", onRefresh);
  }, [load]);

  return (
    <div className="saved-queue-block">
      <h2 className="dashboard-section-title">My Events</h2>
      {err ? (
        <p style={{ color: "#b91c1c" }} role="alert">
          {err}
        </p>
      ) : null}
      {loading ? <p className="saved-queue-empty">Loading…</p> : null}
      <p id="saved-events-empty" className="saved-queue-empty" hidden={loading || events.length > 0}>
        No events saved yet. On Browse Events, use the bookmark on a card to add it here. Open the
        bookmark again to remove it.
      </p>
      <div
        id="saved-events-queue"
        className="event-grid"
        role="region"
        aria-label="My events"
      >
        {!loading &&
          events.map((ev) => {
            const d = new Date(ev.event_date);
            const month = d.toLocaleString("en", { month: "short" }).toUpperCase();
            const day = String(d.getDate());
            const year = String(d.getFullYear());
            const org = ev.organizer
              ? `${ev.organizer.first_name} ${ev.organizer.last_name}`.trim()
              : "";
            const meta = `${ev.start_time}–${ev.end_time}<br />${ev.venue_name}<br />${org}`;
            return (
              <Link
                key={ev.event_id}
                href={`/hover?event_id=${encodeURIComponent(ev.event_id)}`}
                className="card"
                role="button"
                aria-label={`Open ${ev.event_name}`}
              >
                <div className="card__inner">
                  <div className="card__date-col">
                    <div className="card__date">
                      <span className="card__date-month">{month}</span>
                      <span className="card__date-day">{day}</span>
                      <span className="card__date-year">{year}</span>
                    </div>
                  </div>
                  <div className="card__body">
                    <h2 className="card__event-name">{ev.event_name}</h2>
                    <p className="card__meta" dangerouslySetInnerHTML={{ __html: meta }} />
                  </div>
                </div>
              </Link>
            );
          })}
      </div>
    </div>
  );
}
