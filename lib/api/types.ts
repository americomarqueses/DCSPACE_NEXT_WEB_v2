/** Shapes returned by DCSPACE_NEXT_API (subset used by the web app). */

export type ApiUserRef = {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
};

export type ApiEvent = {
  event_id: string;
  reference_code: string;
  event_name: string;
  event_description?: string | null;
  event_date: string;
  venue_name: string;
  event_type_code: string;
  event_status_code: string;
  start_time: string;
  end_time: string;
  total_duration_minutes: number;
  minimum_attendance_minutes: number;
  organizer_user_id: string;
  organizer?: ApiUserRef;
  school?: { school_name: string; school_code: string };
  course?: { course_name: string; course_code: string };
};

export type ApiAttendanceRecord = {
  attendance_record_id: string;
  event_id: string;
  attendance_status_code: string;
  event?: ApiEvent;
};

export type ApiCertificate = {
  certificate_id: string;
  reference_code: string;
  issued_at_utc: string;
  certificate_url: string;
  event?: ApiEvent;
};
