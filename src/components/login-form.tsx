"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";
import { resolveLoginIdentifierAction } from "@/lib/actions";

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

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const identifier = String(formData.get("identifier") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    startTransition(async () => {
      setError(null);

      const email = identifier.includes("@")
        ? identifier
        : await resolveLoginIdentifier(identifier);

      if (!email) return;

      const { error: signInError } = await signIn.email({ email, password });
      if (signInError) {
        setError(signInError.message ?? "Incorrect username/email or password.");
        return;
      }
      router.push(next);
      router.refresh();
    });
  }

  async function resolveLoginIdentifier(identifier: string): Promise<string | null> {
    const formData = new FormData();
    formData.set("identifier", identifier);
    formData.set("password", "x");
    const state = await resolveLoginIdentifierAction({ success: false }, formData);
    if (!state.success || !state.email) {
      setError(state.message ?? "That username doesn't exist.");
      return null;
    }
    return state.email;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      {error && (
        <p
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>
          <span>{error}</span>
        </p>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="label">Username or email</span>
        <div className="relative">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <input
            type="text"
            name="identifier"
            required
            autoComplete="username"
            placeholder="you@example.com or your-username"
            className="glass-input pl-10"
          />
        </div>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="label">Password</span>
        <div className="relative">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          >
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            required
            autoComplete="current-password"
            placeholder="Your password"
            className="glass-input pl-10 pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition-colors hover:bg-border/50 hover:text-foreground"
          >
            {showPassword ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a13.16 13.16 0 0 1-1.67 2.68" />
                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 8 10 8a9.74 9.74 0 0 0 5.39-1.61" />
                <path d="M2 2l20 20" />
                <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="btn-glass-primary mt-1 inline-flex items-center justify-center gap-2"
      >
        {isPending && <Spinner />}
        {isPending ? "Signing in…" : "Sign in"}
      </button>

      <p className="text-center text-sm text-muted">
        New to Inkora?{" "}
        <Link
          href="/register"
          className="font-medium text-accent underline-offset-4 transition-colors hover:underline"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}