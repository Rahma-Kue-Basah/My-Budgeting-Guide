"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthModalOverlay } from "@/features/auth/auth-modal-page";
import { PublicLanding } from "@/features/home/public-landing";

function LandingContent() {
  const searchParams = useSearchParams();
  const auth = searchParams.get("auth");

  return (
    <>
      <PublicLanding />
      {auth === "login" || auth === "signup" ? (
        <AuthModalOverlay mode={auth} />
      ) : null}
    </>
  );
}

export default function LandingPage() {
  return (
    <Suspense>
      <LandingContent />
    </Suspense>
  );
}
