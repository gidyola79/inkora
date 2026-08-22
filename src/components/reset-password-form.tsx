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

export function ResetPasswordForm({ token }: { token: string }) {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    startTransition(async () => {
      setError(null);
      const { error: resetError } = await authClient.$fetch("/reset-password", {
        method: "POST",
        body: { newPassword, token },
      });
      if (resetError) {
        setError(
          resetError.message ??
            "That link is invalid or has expired. Request a new one."
        );
        return;
      }
      setSuccess(true);
    });
  }

  if (success) {
    return (
      <div className="flex flex-col gap-5">
        <p
          role="status"
          className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent"
        >
          Password updated. Sign in with your new password.
        </p>
        <p className="text-center text-sm text-muted">
          <Link href="/login" className="font-medium text-accent underline-offset-4 hover:underline">
            Go to sign in
          </Link>
        </p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex flex-col gap-5">
        <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          This reset link is missing its token. Request a fresh one.
        </p>
        <p className="text-center text-sm text-muted">
          <Link href="/forgot-password" className="font-medium text-accent underline-offset-4 hover:underline">
            Request a new link
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
        <span className="label">New password</span>
        <input
          type={showPassword ? "text" : "password"}
          name="newPassword"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          className="glass-input"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="label">Confirm new password</span>
        <input
          type={showPassword ? "text" : "password"}
          name="confirmPassword"
          required
          autoComplete="new-password"
          placeholder="Repeat your new password"
          className="glass-input"
        />
      </label>

      <label className="flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={showPassword}
          onChange={(event) => setShowPassword(event.target.checked)}
          className="h-4 w-4 accent-[color:var(--accent)]"
        />
        Show passwords
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="btn-glass-primary mt-1 inline-flex items-center justify-center gap-2"
      >
        {isPending && <Spinner />}
        {isPending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
