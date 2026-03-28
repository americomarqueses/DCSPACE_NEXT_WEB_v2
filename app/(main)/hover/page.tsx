import type { Metadata } from "next";
import { Suspense } from "react";
import { HoverPageContent } from "@/components/HoverPageContent";
import "@/styles/pages/hover.css";

export const metadata: Metadata = {
  title: "Event Details — DC Space",
};

export default function HoverPage() {
  return (
    <Suspense fallback={<p style={{ padding: "1rem 1.5rem" }}>Loading…</p>}>
      <HoverPageContent />
    </Suspense>
  );
}
