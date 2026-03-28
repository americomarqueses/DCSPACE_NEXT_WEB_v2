import { apiFetch } from "@/lib/api/client";
import { getStoredUser } from "@/lib/auth/session";

export async function fetchBookmarkEventIds(): Promise<string[]> {
  const user = getStoredUser();
  if (!user) return [];
  const res = await apiFetch<{ success: boolean; data: string[] }>(
    `/api/events/bookmarks?user_id=${encodeURIComponent(user.user_id)}`,
  );
  return res.success && Array.isArray(res.data) ? res.data : [];
}

export async function addBookmark(eventId: string): Promise<void> {
  const user = getStoredUser();
  if (!user) throw new Error("Not signed in");
  await apiFetch("/api/events/bookmarks", {
    method: "POST",
    body: JSON.stringify({ user_id: user.user_id, event_id: eventId }),
  });
}

export async function removeBookmark(eventId: string): Promise<void> {
  const user = getStoredUser();
  if (!user) throw new Error("Not signed in");
  await apiFetch("/api/events/bookmarks", {
    method: "DELETE",
    body: JSON.stringify({ user_id: user.user_id, event_id: eventId }),
  });
}
