"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth-client";
import { optInToNewsletterAction } from "@/lib/actions";
import { PASSWORD_RULES } from "@/lib/password-rules";

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

function RequirementRow({ met, label }: { met: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      {met ? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5 text-accent"
          aria-hidden="true"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : (
        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-muted/60" aria-hidden="true" />
      )}
      <span className={met ? "text-accent" : undefined}>{label}</span>
    </li>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [isPending, startTransition] = useTransition();

  const metCount = PASSWORD_RULES.filter((rule) => rule.test(password)).length;
  const allRulesMet = metCount === PASSWORD_RULES.length;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (name.trim().length < 2) {
      setError("Please enter your name.");
      return;
    }
    if (!allRulesMet) {
      setError(
        "Password must be at least 8 characters and include a letter, a number, and a special character."
      );
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!termsAgreed) {
      setError("Please agree to the Terms of Service and Privacy Policy to continue.");
      return;
    }

    startTransition(async () => {
      setError(null);
      const { error } = await signUp.email({ name, email, password });
      if (error) {
        setError(error.message ?? "Something went wrong. Please try again.");
        return;
      }
      if (newsletterOptIn) {
        try {
          await optInToNewsletterAction(email);
        } catch {
          // Newsletter opt-in is best-effort; never block registration on it.
        }
      }
      router.push("/dashboard");
      router.refresh();
    });
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
        <span className="label">Name</span>
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
            name="name"
            required
            autoComplete="name"
            placeholder="Jane Doe"
            className="glass-input pl-10"
          />
        </div>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="label">Email</span>
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
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
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
            type="password"
            name="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="new-password"
            placeholder="Create a strong password"
            className="glass-input pl-10"
            aria-describedby="password-rules"
          />
        </div>
      </label>

      <div id="password-rules" className="rounded-xl border border-border bg-background/50 p-4" hidden={password.length === 0}>
        <div className="mb-3 flex items-center justify-between text-xs text-muted">
          <span>Password strength</span>
          <span>{metCount}/{PASSWORD_RULES.length}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-border/70" role="progressbar" aria-valuenow={metCount} aria-valuemin={0} aria-valuemax={PASSWORD_RULES.length}>
          <div
            className={`h-full rounded-full transition-all duration-300 ${allRulesMet ? "bg-accent" : "bg-muted-foreground/50"}`}
            style={{ width: `${(metCount / PASSWORD_RULES.length) * 100}%` }}
          />
        </div>
        <ul className="mt-3 grid grid-cols-1 gap-1.5 text-xs text-muted sm:grid-cols-2">
          {PASSWORD_RULES.map((rule) => (
            <RequirementRow key={rule.label} met={rule.test(password)} label={rule.label} />
          ))}
        </ul>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="label">Confirm password</span>
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
            type="password"
            name="confirmPassword"
            required
            autoComplete="new-password"
            placeholder="Repeat your password"
            className="glass-input pl-10"
          />
        </div>
      </label>

      <div className="flex items-start gap-2.5">
        <input
          id="terms-consent"
          type="checkbox"
          checked={termsAgreed}
          onChange={(event) => setTermsAgreed(event.target.checked)}
          required
          className="mt-0.5 h-4 w-4 shrink-0 accent-[color:var(--accent)]"
        />
        <span className="text-sm leading-relaxed text-muted">
          <label htmlFor="terms-consent" className="cursor-pointer">
            I agree to the{" "}
          </label>
          <Link
            href="/terms-of-service"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            Terms of Service
          </Link>
          <label htmlFor="terms-consent" className="cursor-pointer">
            {" "}and{" "}
          </label>
          <Link
            href="/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            Privacy Policy
          </Link>
          <label htmlFor="terms-consent" className="cursor-pointer">.</label>
        </span>
      </div>

      <div className="flex items-start gap-2.5">
        <input
          id="newsletter-optin"
          type="checkbox"
          checked={newsletterOptIn}
          onChange={(event) => setNewsletterOptIn(event.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[color:var(--accent)]"
        />
        <label htmlFor="newsletter-optin" className="cursor-pointer text-sm leading-relaxed text-muted">
          Send me the occasional Inkora letter with new writing and product updates.
          Optional - you can unsubscribe anytime.
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="btn-glass-primary mt-1 inline-flex items-center justify-center gap-2"
      >
        {isPending && <Spinner />}
        {isPending ? "Creating account…" : "Create account"}
      </button>

      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-accent underline-offset-4 transition-colors hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
