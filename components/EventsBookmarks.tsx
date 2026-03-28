"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { fetchBookmarkEventIds, addBookmark, removeBookmark } from "@/lib/bookmarks";
import { getStoredUser } from "@/lib/auth/session";

type Ctx = { saved: Set<string>; toggle: (id: string) => void; loading: boolean };

const EventsBookmarkContext = createContext<Ctx | null>(null);

export function useEventBookmark() {
  const v = useContext(EventsBookmarkContext);
  if (!v) throw new Error("useEventBookmark outside provider");
  return v;
}

export function EventsBookmarks({ children }: { children: React.ReactNode }) {
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const user = getStoredUser();
    if (!user) {
      setSaved(new Set());
      setLoading(false);
      return;
    }
    try {
      const ids = await fetchBookmarkEventIds();
      setSaved(new Set(ids));
    } catch {
      setSaved(new Set());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggle = useCallback(
    async (id: string) => {
      const user = getStoredUser();
      if (!user) return;
      const isSaved = saved.has(id);
      try {
        if (isSaved) {
          await removeBookmark(id);
          setSaved((prev) => {
            const n = new Set(prev);
            n.delete(id);
            return n;
          });
        } else {
          await addBookmark(id);
          setSaved((prev) => new Set(prev).add(id));
        }
        window.dispatchEvent(new Event("dc-refresh-saved"));
      } catch {
        /* keep UI stable; could toast */
      }
    },
    [saved],
  );

  return (
    <EventsBookmarkContext.Provider value={{ saved, toggle, loading }}>
      {children}
    </EventsBookmarkContext.Provider>
  );
}

export function EventBookmarkButton({ eventId }: { eventId: string }) {
  const { saved, toggle, loading } = useEventBookmark();
  const isSaved = saved.has(eventId);

  return (
    <button
      type="button"
      className={`bookmark ${isSaved ? "bookmark--solid" : "bookmark--outline"}`}
      data-event-id={eventId}
      aria-pressed={isSaved}
      disabled={loading}
      aria-label={isSaved ? "Remove from saved events" : "Save event to dashboard"}
      title={isSaved ? "Remove from saved" : "Save event"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void toggle(eventId);
      }}
    >
      <svg viewBox="0 0 16 20" fill="none" aria-hidden>
        <path d="M3 2H13V18L8 14.7L3 18V2Z" />
      </svg>
    </button>
  );
}
