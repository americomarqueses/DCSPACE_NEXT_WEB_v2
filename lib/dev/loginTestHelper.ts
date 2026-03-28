import { getApiBaseUrl } from "@/lib/api/config";

export type DevLoginHintUser = {
  email: string;
  first_name: string;
  last_name: string;
  role_code: string;
};

export type DevLoginHintsResponse = {
  success: boolean;
  message?: string;
  data?: { users: DevLoginHintUser[]; password_hint: string | null };
};

/** Shown when API omits a custom hint or before the first successful fetch. Matches dc-space/back-end/prisma/seed.ts. */
export const DEV_LOGIN_PASSWORD_FALLBACK_HINT =
  "If you used dc-space/back-end prisma/seed.ts, seeded accounts use Password123! (same password for all).";

export function resolveDevPasswordHint(apiHint: string | null | undefined): string {
  const t = apiHint?.trim();
  return t ? t : DEV_LOGIN_PASSWORD_FALLBACK_HINT;
}

export function isLoginHintsUiEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SHOW_LOGIN_HINTS === "true";
}

export function buildDisplayName(user: Pick<DevLoginHintUser, "first_name" | "last_name">): string {
  return `${user.first_name} ${user.last_name}`.trim();
}

export async function fetchDevLoginHints(): Promise<DevLoginHintsResponse> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/api/dev/login-hints`, { method: "GET" });
  let json: DevLoginHintsResponse;
  try {
    json = (await res.json()) as DevLoginHintsResponse;
  } catch {
    return { success: false, message: `HTTP ${res.status}` };
  }
  if (!res.ok) {
    return {
      success: false,
      message: json.message ?? `HTTP ${res.status}`,
    };
  }
  return json;
}
