"use client";

export const DC_AUTH_TOKEN_KEY = "dc_auth_token";
export const DC_AUTH_USER_KEY = "dc_auth_user";

export type AuthUser = {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role_code: string;
};

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(DC_AUTH_TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(DC_AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function saveSession(token: string, user: AuthUser) {
  window.localStorage.setItem(DC_AUTH_TOKEN_KEY, token);
  window.localStorage.setItem(DC_AUTH_USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  window.localStorage.removeItem(DC_AUTH_TOKEN_KEY);
  window.localStorage.removeItem(DC_AUTH_USER_KEY);
}
