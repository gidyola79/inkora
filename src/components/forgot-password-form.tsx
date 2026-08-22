"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();

    startTransition(async () => {
      setError(null);
      const { error: forgetError } = await authClient.$fetch("/request-password-reset", {
        method: "POST",
        body: { email, redirectTo: "/reset-password" },
      });
      if (forgetError) {
        setError("Something went wrong. Please try again.");
        return;
      }
      setSent(true);
    });
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-5">
        <p
          role="status"
          className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent"
        >
          If an account exists for that address, a reset link is on its way. Check your inbox
          (and spam folder).
        </p>
        <p className="text-center text-sm text-muted">
          Remembered it after all?{" "}
          <Link href="/login" className="font-medium text-accent underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      {error && (
        <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="label">Email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="glass-input"
        />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="btn-glass-primary mt-1 inline-flex items-center justify-center gap-2"
      >
        {isPending && <Spinner />}
        {isPending ? "Sending…" : "Send reset link"}
      </button>

      <p className="text-center text-sm text-muted">
        <Link href="/login" className="font-medium text-accent underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
