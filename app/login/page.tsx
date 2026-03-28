import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Login | DC Space",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="page">Loading…</main>}>
      <LoginForm />
    </Suspense>
  );
}
