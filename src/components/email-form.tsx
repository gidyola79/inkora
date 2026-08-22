"use client";

import { useActionState, useState } from "react";
import { changeEmailAction } from "@/lib/actions";

const initialState: { success: boolean; message?: string } = { success: false };

export function EmailForm({ currentEmail }: { currentEmail: string }) {
  const [state, formAction, isPending] = useActionState(
    changeEmailAction,
    initialState
  );
  const [password, setPassword] = useState("");

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div>
        <h2 className="font-serif text-lg font-semibold">Email address</h2>
        <p className="mt-1 text-sm text-muted">
          Currently signed in as{" "}
          <span className="font-medium text-foreground">{currentEmail}</span>.
          Changing it requires your password.
        </p>
      </div>

      {state.message && (
        <p
          role={state.success ? "status" : "alert"}
          className={`rounded-xl border px-4 py-3 text-sm ${
            state.success
              ? "border-accent/30 bg-accent/10 text-accent"
              : "border-danger/30 bg-danger/10 text-danger"
          }`}
        >
          {state.message}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="newEmail" className="label">
            New email
          </label>
          <input
            id="newEmail"
            name="newEmail"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="input"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="emailPassword" className="label">
            Current password
          </label>
          <input
            id="emailPassword"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="input"
          />
        </div>
      </div>

      <div className="flex items-center justify-end border-t border-border pt-5">
        <button type="submit" disabled={isPending} className="btn btn-primary">
          {isPending ? "Updating…" : "Update email"}
        </button>
      </div>
    </form>
  );
}
