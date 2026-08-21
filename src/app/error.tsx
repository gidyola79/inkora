"use client";

import { Logo } from "@/components/logo";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="mx-auto flex w-full max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <div className="mb-6">
        <Logo />
      </div>
      <h1 className="font-serif text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
        An unexpected error occurred while loading this page.
      </p>
      {process.env.NODE_ENV === "development" && error.digest && (
        <p className="mt-2 text-xs text-muted">Digest: {error.digest}</p>
      )}
      <button type="button" onClick={reset} className="btn btn-primary mt-8">
        Try again
      </button>
    </section>
  );
}