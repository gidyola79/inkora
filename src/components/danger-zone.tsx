"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { deleteAccountAction } from "@/lib/actions";

const initialState: { success: boolean; message?: string } = { success: false };

export function DangerZone() {
  const [state, formAction, isPending] = useActionState(
    deleteAccountAction,
    initialState
  );
  const [confirmChecked, setConfirmChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      const timeout = setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div>
        <h2 className="font-serif text-lg font-semibold text-danger">
          Delete account
        </h2>
        <p className="mt-1 text-sm text-muted">
          Permanently deletes your profile, articles, comments, likes, follows,
          flashcard sets, and messages. This cannot be undone.
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
          {state.success
            ? "Your account has been deleted. Redirecting you home…"
            : state.message}
        </p>
      )}

      {!state.success && (
        <>
          <label className="flex cursor-pointer items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              name="confirm"
              checked={confirmChecked}
              onChange={(event) => setConfirmChecked(event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[var(--danger)]"
            />
            <span>
              I understand that deleting my account removes all of my content
              permanently and cannot be reversed.
            </span>
          </label>

          <div className="flex flex-col gap-2">
            <label htmlFor="deletePassword" className="label">
              Confirm with your password
            </label>
            <input
              id="deletePassword"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="Your password"
              className="input"
            />
          </div>

          <div className="flex items-center justify-end border-t border-border pt-5">
            <button
              type="submit"
              disabled={!confirmChecked || isPending}
              className="btn btn-sm btn-danger-outline disabled:pointer-events-none disabled:opacity-50"
            >
              {isPending ? "Deleting…" : "Delete my account forever"}
            </button>
          </div>
        </>
      )}
    </form>
  );
}
