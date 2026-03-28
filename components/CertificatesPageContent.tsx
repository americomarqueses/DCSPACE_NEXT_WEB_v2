"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import type { ApiCertificate } from "@/lib/api/types";

function CertBadge() {
  return (
    <div className="cert-card__badge" aria-hidden>
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" role="img">
        <rect x="16" y="10" width="32" height="40" rx="4" fill="currentColor" />
        <rect x="21" y="16" width="22" height="2.5" rx="1.25" fill="#fdf5e6" />
        <rect x="21" y="22" width="16" height="2.5" rx="1.25" fill="#fdf5e6" />
        <circle cx="32" cy="35" r="6" fill="#fdf5e6" />
        <path d="M29 40l-2 8 5-3 5 3-2-8" fill="#fdf5e6" />
      </svg>
    </div>
  );
}

export function CertificatesPageContent() {
  const [certs, setCerts] = useState<ApiCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ success: boolean; data: ApiCertificate[] }>("/api/certificates")
      .then((res) => {
        if (res.success && Array.isArray(res.data)) setCerts(res.data);
      })
      .catch((e: unknown) =>
        setErr(e instanceof Error ? e.message : "Failed to load certificates"),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <header className="main__header">
        <div className="main__header-row">
          <h1 className="main__title">My Certificates</h1>
        </div>
        <div className="main__divider" role="presentation" />
      </header>

      <div className="main__grid-wrap">
        {err ? (
          <p style={{ color: "#b91c1c", padding: "0 1.5rem" }} role="alert">
            {err}
          </p>
        ) : null}
        {loading ? <p style={{ padding: "0 1.5rem" }}>Loading…</p> : null}
        <div className="cert-grid" aria-label="Your certificates">
          {!loading && !err && certs.length === 0 ? (
            <p style={{ padding: "0 1.5rem" }}>No certificates yet.</p>
          ) : null}
          {certs.map((c) => {
            const issued = new Date(c.issued_at_utc).toLocaleDateString(undefined, {
              dateStyle: "medium",
            });
            const title = c.event?.event_name ?? c.reference_code;
            return (
              <article key={c.certificate_id} className="cert-card">
                <CertBadge />
                <div className="cert-card__divider" role="presentation" />
                <div className="cert-card__footer">
                  <div>
                    <p className="cert-card__title">{title}</p>
                    <p className="cert-card__date">Issued: {issued}</p>
                  </div>
                  {c.certificate_url ? (
                    <a
                      href={c.certificate_url}
                      className="cert-card__view"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View
                    </a>
                  ) : (
                    <button type="button" className="cert-card__view" disabled>
                      View
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </>
  );
}
