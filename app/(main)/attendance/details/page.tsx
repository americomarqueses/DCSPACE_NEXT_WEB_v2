import type { Metadata } from "next";
import { Suspense } from "react";
import { AttendanceDetailsContent } from "@/components/AttendanceDetailsContent";
import "@/styles/pages/attendance-details.css";

export const metadata: Metadata = {
  title: "Attendance details — DC Space",
};

export default function AttendanceDetailsPage() {
  return (
    <Suspense fallback={<p style={{ padding: "1rem 1.5rem" }}>Loading…</p>}>
      <AttendanceDetailsContent />
    </Suspense>
  );
}
