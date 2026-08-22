"use client";

import { useActionState } from "react";
import { subscribeAction } from "@/lib/actions";

const initialState: { success: boolean; message?: string } = { success: false };

export function NewsletterForm() {
  const [state, formAction, isPending] = useActionState(subscribeAction, initialState);

  return (
    <div className="max-w-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
        The Inkora letter
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        One thoughtful email now and then - new writing, features, and ideas worth
        your time. No spam, ever.
      </p>
      <form action={formAction} className="mt-4 flex gap-2">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="input h-10 flex-1"
        />
        <button
          type="submit"
          disabled={isPending}
          className="btn btn-primary btn-sm whitespace-nowrap"
        >
          {isPending ? "…" : "Subscribe"}
        </button>
      </form>
      {state.message && (
        <p
          role={state.success ? "status" : "alert"}
          className={`mt-2 text-xs ${state.success ? "text-accent" : "text-danger"}`}
        >
          {state.message}
        </p>
      )}
    </div>
  );
}
