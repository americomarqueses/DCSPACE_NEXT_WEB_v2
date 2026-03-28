"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { apiFetch, apiUploadForm } from "@/lib/api/client";
import { getStoredUser } from "@/lib/auth/session";

const isDevAutofillEnabled = process.env.NODE_ENV === "development";

type CatalogSchool = {
  school_id: string;
  school_code: string;
  school_name: string;
  courses: { course_id: string; course_code: string; course_name: string }[];
};

function fillOrganizeTestData(
  form: HTMLFormElement,
  courseRef: RefObject<HTMLSelectElement | null>,
  orgRef: RefObject<HTMLInputElement | null>,
  setSchoolCode: (v: string) => void,
  setCourseCode: (v: string) => void,
  schoolCode: string,
  courseCode: string,
) {
  const setField = (name: string, value: string) => {
    const el = form.elements.namedItem(name);
    if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) {
      el.value = value;
    }
  };

  setField("event_name", "QA Test — Organize Workshop");
  setField("event_date", "2026-06-15");
  setField("venue", "Main Auditorium");
  setField("department", "SCMCS");
  setField("start_time", "09:00");
  setField("end_time", "12:00");
  setField("event_type", "workshop");
  setField("duration", "3 hours");
  setField("min_attendance", "60");

  setSchoolCode(schoolCode);
  setCourseCode(courseCode);

  const course = courseRef.current;
  const org = orgRef.current;
  if (course) {
    course.value = courseCode;
    course.dispatchEvent(new Event("change", { bubbles: true }));
  }
  if (org) {
    org.value = "DOMINIXODE";
    org.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

export function OrganizeForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const courseRef = useRef<HTMLSelectElement>(null);
  const orgRef = useRef<HTMLInputElement>(null);
  const combinedRef = useRef<HTMLInputElement>(null);

  const [catalog, setCatalog] = useState<CatalogSchool[]>([]);
  const [catalogErr, setCatalogErr] = useState<string | null>(null);
  const [schoolCode, setSchoolCode] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [submitOk, setSubmitOk] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ success: boolean; data: CatalogSchool[] }>("/api/catalog/schools-courses")
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setCatalog(res.data);
          const s0 = res.data[0].school_code;
          const c0 = res.data[0].courses[0]?.course_code ?? "";
          setSchoolCode(s0);
          setCourseCode(c0);
        } else {
          setCatalogErr("No schools in database. Run seed / prisma db push.");
        }
      })
      .catch((e: unknown) =>
        setCatalogErr(e instanceof Error ? e.message : "Could not load catalog"),
      );
  }, []);

  const coursesForSchool = useMemo(() => {
    const s = catalog.find((x) => x.school_code === schoolCode);
    return s?.courses ?? [];
  }, [catalog, schoolCode]);

  useEffect(() => {
    if (!coursesForSchool.some((c) => c.course_code === courseCode) && coursesForSchool[0]) {
      setCourseCode(coursesForSchool[0].course_code);
    }
  }, [coursesForSchool, courseCode]);

  useEffect(() => {
    function syncCombined() {
      const course = courseRef.current;
      const org = orgRef.current;
      const combined = combinedRef.current;
      if (!course || !org || !combined) return;
      const c = (course.value || "").trim();
      const o = (org.value || "").trim().replace(/^[\s—-]+|[\s—-]+$/g, "");
      combined.value = c && o ? `${c}-${o}` : c || o || "";
    }

    const course = courseRef.current;
    const org = orgRef.current;
    if (!course || !org) return;

    course.addEventListener("change", syncCombined);
    org.addEventListener("input", syncCombined);
    syncCombined();
    return () => {
      course.removeEventListener("change", syncCombined);
      org.removeEventListener("input", syncCombined);
    };
  }, [courseCode, schoolCode]);

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setSubmitErr(null);
      setSubmitOk(null);
      const user = getStoredUser();
      if (!user) {
        setSubmitErr("You must be signed in to create an event.");
        return;
      }
      const form = e.currentTarget;
      const fd = new FormData(form);
      fd.append("school_code", schoolCode);
      fd.append("course_code", courseCode);
      fd.append("organizer_user_id", user.user_id);

      if (!schoolCode || !courseCode) {
        setSubmitErr("Select a school and course.");
        return;
      }

      setSubmitting(true);
      try {
        await apiUploadForm("/api/organize", fd);
        setSubmitOk("Event and attachments saved.");
        form.reset();
        if (catalog[0]) {
          setSchoolCode(catalog[0].school_code);
          setCourseCode(catalog[0].courses[0]?.course_code ?? "");
        }
      } catch (err: unknown) {
        setSubmitErr(err instanceof Error ? err.message : "Submit failed");
      } finally {
        setSubmitting(false);
      }
    },
    [catalog, courseCode, schoolCode],
  );

  return (
    <form
      ref={formRef}
      className="organize-form-shell"
      onSubmit={onSubmit}
      aria-label="Create new event"
    >
      <label className="form-section-label" htmlFor="event-name">
        Event Name
      </label>
      <div className="form-panel">
        {catalogErr ? (
          <p style={{ color: "#b45309", marginBottom: "0.75rem" }} role="alert">
            {catalogErr}
          </p>
        ) : null}
        {submitErr ? (
          <p style={{ color: "#b91c1c", marginBottom: "0.75rem" }} role="alert">
            {submitErr}
          </p>
        ) : null}
        {submitOk ? (
          <p style={{ color: "#15803d", marginBottom: "0.75rem" }} role="status">
            {submitOk}
          </p>
        ) : null}

        <div className="field-event-name">
          <input
            className="input-text"
            id="event-name"
            name="event_name"
            type="text"
            placeholder="Enter event name"
            autoComplete="off"
            required
          />
        </div>

        <div className="form-flow">
          <div className="form-row">
            <span className="form-row__label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
              </svg>
              Date:
            </span>
            <input className="input-inline" type="date" name="event_date" required />
          </div>

          <div className="form-row">
            <span className="form-row__label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path
                  d="M12 21s7-4.35 7-10a7 7 0 10-14 0c0 5.65 7 10 7 10Z"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="11" r="2.5" />
              </svg>
              Venue:
            </span>
            <input
              className="input-inline"
              type="text"
              name="venue"
              placeholder="Location"
              required
            />
          </div>

          <div className="form-row form-row--span2">
            <span className="form-row__label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M5 4h14v16H5V4z" strokeLinejoin="round" />
                <path d="M9 8h6M9 12h6M9 16h4" strokeLinecap="round" />
              </svg>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="12" cy="9" r="4" />
                <path d="M6 21v-1a6 6 0 0112 0v1" strokeLinecap="round" />
              </svg>
              Course &amp; Requesting Organizer:
            </span>
            <div className="course-org-inputs">
              <select
                ref={courseRef}
                className="input-inline"
                id="course-code"
                name="course_code"
                aria-label="Course program"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                required
              >
                {coursesForSchool.length === 0 ? (
                  <option value="">No courses for school</option>
                ) : (
                  coursesForSchool.map((c) => (
                    <option key={c.course_id} value={c.course_code}>
                      {c.course_code} — {c.course_name}
                    </option>
                  ))
                )}
              </select>
              <span className="course-org-sep" aria-hidden>
                —
              </span>
              <input
                ref={orgRef}
                className="input-inline"
                id="organizer-name"
                name="organizer_name"
                type="text"
                placeholder="Org name e.g. DOMINIXODE"
                autoComplete="organization"
                aria-label="Requesting organizer or organization name"
              />
            </div>
            <span className="muted-hint">
              Displays together as <strong>BSIT-DOMINIXODE</strong> (course code + organizer).
            </span>
            <input
              ref={combinedRef}
              type="hidden"
              id="course-organizer-combined"
              name="course_organizer_combined"
              defaultValue=""
            />
          </div>

          <div className="form-row">
            <span className="form-row__label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M4 21V8l8-4 8 4v13" strokeLinejoin="round" />
                <path d="M4 12h16M9 12v9M15 12v9" strokeLinejoin="round" />
              </svg>
              School:
            </span>
            <select
              className="input-inline"
              aria-label="School"
              value={schoolCode}
              onChange={(e) => setSchoolCode(e.target.value)}
              required
            >
              {catalog.length === 0 ? (
                <option value="">Loading…</option>
              ) : (
                catalog.map((s) => (
                  <option key={s.school_id} value={s.school_code}>
                    {s.school_name} ({s.school_code})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="form-row">
            <span className="form-row__label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M4 7h6v10H4V7zm10 3h6v7h-6v-7zM4 20h16v2H4v-2z" strokeLinejoin="round" />
              </svg>
              Department:
            </span>
            <select className="input-inline" name="department" aria-label="Department" defaultValue="">
              <option value="">Select department</option>
              <option value="SASE">SASE</option>
              <option value="SCMCS">SCMCS</option>
              <option value="SIHTM">SIHTM</option>
              <option value="SMLS">SMLS</option>
              <option value="SNAHS">SNAHS</option>
            </select>
          </div>

          <div className="form-row form-row--span2">
            <div className="time-pair">
              <div className="form-row">
                <span className="form-row__label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <circle cx="12" cy="12" r="8" />
                    <path d="M12 8v4l3 2" strokeLinecap="round" />
                  </svg>
                  Start Time:
                </span>
                <div className="time-row">
                  <input type="time" name="start_time" required />
                </div>
              </div>
              <div className="form-row">
                <span className="form-row__label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <circle cx="12" cy="12" r="8" />
                    <path d="M12 8v4l3 2" strokeLinecap="round" />
                  </svg>
                  End Time:
                </span>
                <div className="time-row">
                  <input type="time" name="end_time" required />
                </div>
              </div>
            </div>
          </div>

          <div className="form-row form-row--span2">
            <span className="form-row__label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="9" cy="9" r="3" />
                <circle cx="15" cy="9" r="3" />
                <path d="M3 18c0-3 4-5 9-5s9 2 9 5" strokeLinecap="round" />
              </svg>
              Type of Event:
            </span>
            <input
              className="input-inline"
              type="text"
              name="event_type"
              placeholder="Workshop, seminar..."
              required
            />
          </div>

          <div className="form-row form-row--span2">
            <span className="form-row__label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v6l4 2" strokeLinecap="round" />
              </svg>
              Total Time Duration:
            </span>
            <input className="input-inline" type="text" name="duration" placeholder="e.g. 3 hours" />
          </div>

          <div className="form-row form-row--span2">
            <span className="form-row__label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="12" cy="12" r="9" />
                <path d="M8 12l2.5 2.5L16 9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Minimum Attendance Time Required:
            </span>
            <input
              className="input-inline"
              type="text"
              name="min_attendance"
              defaultValue="0"
            />
            <span className="muted-hint">Minutes, or text like &quot;1 hour&quot; (stored as minutes).</span>
          </div>
        </div>

        <div className="upload-grid">
          <label className="upload-tile">
            <svg className="upload-tile__plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" d="M12 5v14M5 12h14" />
            </svg>
            <span className="upload-tile__text">Add Poster/Pubmat</span>
            <input type="file" name="poster" accept="image/*,.pdf" />
          </label>
          <label className="upload-tile">
            <svg className="upload-tile__plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" d="M12 5v14M5 12h14" />
            </svg>
            <span className="upload-tile__text">Add Registration Form</span>
            <input type="file" name="registration" accept=".pdf,.doc,.docx" />
          </label>
          <label className="upload-tile">
            <svg className="upload-tile__plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" d="M12 5v14M5 12h14" />
            </svg>
            <span className="upload-tile__text">Add Survey Form</span>
            <input type="file" name="survey" accept=".pdf,.doc,.docx" />
          </label>
          <label className="upload-tile">
            <svg className="upload-tile__plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" d="M12 5v14M5 12h14" />
            </svg>
            <span className="upload-tile__text">Add E-Certificate Template</span>
            <input type="file" name="certificate_template" accept=".pdf,.doc,.docx" />
          </label>
        </div>
        <p className="muted-hint" style={{ marginTop: 8 }}>
          Files are stored on the API server under uploads and linked in the database (event assets).
        </p>

        <div className="form-actions">
          {isDevAutofillEnabled ? (
            <button
              type="button"
              className="btn-test-fill"
              onClick={() => {
                const form = formRef.current;
                if (form && catalog[0]) {
                  const sc = catalog[0].school_code;
                  const cc = catalog[0].courses[0]?.course_code ?? "";
                  fillOrganizeTestData(
                    form,
                    courseRef,
                    orgRef,
                    setSchoolCode,
                    setCourseCode,
                    sc,
                    cc,
                  );
                }
              }}
            >
              Fill test data
            </button>
          ) : null}
          <button type="submit" className="btn-submit" disabled={submitting || !catalog.length}>
            {submitting ? "Saving…" : "Submit"}
            <svg viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth="2" />
              <path
                d="M8 12l2.5 3L16 10"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </form>
  );
}
