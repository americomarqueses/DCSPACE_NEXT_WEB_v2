"use client";

import { getApiBaseUrl } from "./config";
import { getStoredToken } from "@/lib/auth/session";

export type ApiErrorBody = { success?: boolean; message?: string; error?: string };

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const base = getApiBaseUrl();
  const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  const token = init.token !== undefined ? init.token : getStoredToken();

  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body && typeof init.body === "string") {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const rest = { ...init } as RequestInit & { token?: string | null };
  delete rest.token;
  const res = await fetch(url, { ...rest, headers });

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const err = data as ApiErrorBody;
    const message = err?.message ?? err?.error ?? res.statusText ?? "Request failed";
    throw new Error(message);
  }

  return data as T;
}

export async function loginRequest(email: string, password: string) {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = (await res.json()) as {
    success?: boolean;
    message?: string;
    data?: { token: string; user: import("@/lib/auth/session").AuthUser };
  };
  if (!res.ok || !data.success || !data.data) {
    throw new Error(data.message ?? "Login failed");
  }
  return data.data;
}

/** POST multipart (e.g. organize with files). Do not set Content-Type; browser sets boundary. */
export async function apiUploadForm<T>(
  path: string,
  formData: FormData,
  init: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const base = getApiBaseUrl();
  const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  const token = init.token !== undefined ? init.token : getStoredToken();

  const headers = new Headers(init.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const rest = { ...init } as RequestInit & { token?: string | null };
  delete rest.token;
  const res = await fetch(url, { ...rest, method: "POST", body: formData, headers });

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const err = data as ApiErrorBody;
    const message = err?.message ?? err?.error ?? res.statusText ?? "Request failed";
    throw new Error(message);
  }

  return data as T;
}
