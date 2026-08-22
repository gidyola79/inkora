"use client";

import { useRouter } from "next/navigation";

export function BackButton({ fallbackHref = "/", label = "Back" }: { fallbackHref?: string; label?: string }) {
  const router = useRouter();
  function handleClick() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }
  return (
    <button type="button" onClick={handleClick} className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
      {label}
    </button>
  );
}
