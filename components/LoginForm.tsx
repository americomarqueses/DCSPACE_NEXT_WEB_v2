"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { loginRequest } from "@/lib/api/client";
import {
  buildDisplayName,
  DEV_LOGIN_PASSWORD_FALLBACK_HINT,
  fetchDevLoginHints,
  isLoginHintsUiEnabled,
  resolveDevPasswordHint,
  type DevLoginHintUser,
} from "@/lib/dev/loginTestHelper";
import { saveSession } from "@/lib/auth/session";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPw, setShowPw] = useState(false);
  const [role, setRole] = useState<"student" | "faculty">("student");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [hintsOpen, setHintsOpen] = useState(false);
  const [hintsLoading, setHintsLoading] = useState(false);
  const [hintsErr, setHintsErr] = useState<string | null>(null);
  const [hintsUsers, setHintsUsers] = useState<DevLoginHintUser[]>([]);
  const [passwordHintLine, setPasswordHintLine] = useState(DEV_LOGIN_PASSWORD_FALLBACK_HINT);

  async function toggleLoginHints() {
    if (hintsOpen) {
      setHintsOpen(false);
      return;
    }
    setHintsOpen(true);
    setHintsLoading(true);
    setHintsErr(null);
    const res = await fetchDevLoginHints();
    setHintsLoading(false);
    if (!res.success || !res.data) {
      setHintsErr(
        res.message ??
          "Login hints are only available when the API runs in development (`next dev`).",
      );
      setHintsUsers([]);
      return;
    }
    setHintsUsers(res.data.users);
    setPasswordHintLine(resolveDevPasswordHint(res.data.password_hint));
  }

  return (
    <main className="page">
      <section className="layout" aria-label="Login layout">
        <aside className="brand" aria-label="Brand section">
          <div className="brand__logo-wrap">
            <Image
              className="brand__logo"
              src="/assets/logo-dc-space.png"
              alt="DC Space logo"
              width={430}
              height={200}
              priority
            />
          </div>
          <div className="brand__headline">TAP. ATTEND. GET CERTIFIED.</div>
          <div className="brand__sub">
            An AI-assisted RFID system designed to simplify event tracking and automate certificate
            issuance.
          </div>
        </aside>

        <section className="card" aria-label="Login card">
          <button className="btn google" type="button" aria-label="Continue with Google">
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
              <path
                fill="#FFC107"
                d="M43.611 20.083H42V20H24v8h11.303C33.653 32.657 29.236 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.967 3.033l5.657-5.657C34.72 6.053 29.617 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z"
              />
              <path
                fill="#FF3D00"
                d="M6.306 14.691l6.571 4.819C14.655 16.108 19.001 12 24 12c3.059 0 5.842 1.154 7.967 3.033l5.657-5.657C34.72 6.053 29.617 4 24 4 16.318 4 9.656 8.336 6.306 14.691z"
              />
              <path
                fill="#4CAF50"
                d="M24 44c5.112 0 9.828-1.967 13.377-5.158l-6.174-5.227C29.297 35.091 26.756 36 24 36c-5.215 0-9.619-3.317-11.297-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
              />
              <path
                fill="#1976D2"
                d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.1 5.615h.001l6.174 5.227C36.941 39.243 44 34 44 24c0-1.341-.138-2.651-.389-3.917z"
              />
            </svg>
            <span>Continue with SDCA Gmail Account</span>
          </button>

          <div className="divider" aria-hidden>
            OR
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              const form = e.currentTarget;
              const fd = new FormData(form);
              const emailVal = String(fd.get("email") ?? email);
              const password = String(fd.get("password") ?? "");
              setLoading(true);
              try {
                const { token, user } = await loginRequest(emailVal, password);
                saveSession(token, user);
                const next = searchParams.get("callbackUrl");
                router.push(next && next.startsWith("/") ? next : "/dashboard");
              } catch (err) {
                setError(err instanceof Error ? err.message : "Sign in failed");
              } finally {
                setLoading(false);
              }
            }}
            autoComplete="on"
          >
            {error ? (
              <p className="field" style={{ color: "#b91c1c", marginBottom: "0.5rem" }}>
                {error}
              </p>
            ) : null}
            <label className="field field--password">
              <span className="sr-only">Email</span>
              <span className="icon-left" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 6.5c0-1.105.895-2 2-2h12c1.105 0 2 .895 2 2v11c0 1.105-.895 2-2 2H6c-1.105 0-2-.895-2-2v-11Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6.2 7.1 12 11.2l5.8-4.1"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <input
                className="input"
                name="email"
                type="email"
                placeholder="Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="field">
              <span className="sr-only">Password</span>
              <span className="icon-left" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M7 10V8.2C7 5.88 8.79 4 11 4h2c2.21 0 4 1.88 4 4.2V10"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M6.5 10h11A2.5 2.5 0 0 1 20 12.5v5A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-5A2.5 2.5 0 0 1 6.5 10Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>

              <input
                id="password"
                className="input"
                name="password"
                type={showPw ? "text" : "password"}
                placeholder="Password"
                autoComplete="current-password"
                required
              />

              <button
                className="btn eye"
                type="button"
                aria-label={showPw ? "Hide password" : "Show password"}
                onClick={() => setShowPw((s) => !s)}
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M2.3 12s3.4-7 9.7-7 9.7 7 9.7 7-3.4 7-9.7 7-9.7-7-9.7-7Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 15.4a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                </svg>
              </button>
            </label>

            <div className="actions">
              <Link className="link" href="#" aria-label="Forgot password">
                FORGOT PASSWORD?
              </Link>
            </div>

            <button className="btn primary" type="submit" disabled={loading}>
              {loading ? "Signing in…" : "SIGN IN"}
            </button>
          </form>

          {isLoginHintsUiEnabled() ? (
            <div style={{ marginTop: "1rem", fontSize: "0.875rem" }}>
              <p style={{ margin: "0 0 0.35rem", fontSize: "0.8rem", opacity: 0.75 }}>
                Passwords are not listed here—only hashes are stored. Use the password from
                registration or your seed script.
              </p>
              <p style={{ margin: "0 0 0.5rem", fontSize: "0.8rem", opacity: 0.75 }}>
                {passwordHintLine}
              </p>
              <button
                type="button"
                className="link"
                onClick={() => void toggleLoginHints()}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                {hintsOpen ? "Hide" : "Show"} accounts from database (dev)
              </button>
              {hintsOpen ? (
                <div
                  style={{
                    marginTop: "0.75rem",
                    padding: "0.75rem",
                    border: "1px solid rgba(0,0,0,0.12)",
                    borderRadius: "6px",
                    maxHeight: "220px",
                    overflowY: "auto",
                  }}
                >
                  {hintsLoading ? <p>Loading…</p> : null}
                  {hintsErr ? (
                    <p style={{ color: "#b45309", margin: 0 }}>{hintsErr}</p>
                  ) : null}
                  {!hintsLoading && !hintsErr && hintsUsers.length === 0 ? (
                    <p style={{ margin: 0, opacity: 0.8 }}>No users found.</p>
                  ) : null}
                  {!hintsLoading && !hintsErr && hintsUsers.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                      {hintsUsers.map((u) => (
                        <li key={u.email} style={{ marginBottom: "0.35rem" }}>
                          <button
                            type="button"
                            onClick={() => setEmail(u.email)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: 0,
                              textAlign: "left",
                              color: "inherit",
                              textDecoration: "underline",
                            }}
                          >
                            {u.email}
                          </button>
                          <span style={{ opacity: 0.85 }}>
                            {" "}
                            — {buildDisplayName(u)} ({u.role_code})
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="below">
            Don&apos;t have an account?
            <Link href="#" aria-label="Register here">
              REGISTER HERE
            </Link>
          </div>

          <div className="role" role="group" aria-label="Role selection">
            <button
              className="btn role__btn"
              type="button"
              aria-pressed={role === "student"}
              onClick={() => setRole("student")}
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M12 3 2.5 8l9.5 5 9.5-5L12 3Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path
                  d="M5.5 10.5V16c0 1.4 3 3.5 6.5 3.5s6.5-2.1 6.5-3.5v-5.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              Student
            </button>
            <button
              className="btn role__btn"
              type="button"
              aria-pressed={role === "faculty"}
              onClick={() => setRole("faculty")}
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="1.8" />
                <path
                  d="M16.6 10.2a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M4 20v-1.2c0-2.1 3-4 5-4s5 1.9 5 4V20"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path
                  d="M14.4 20v-1c0-1.7 2.1-3.2 3.6-3.2S22 17.3 22 19v1"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              Faculty
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
