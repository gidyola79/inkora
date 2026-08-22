"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

const initialState = { success: false, message: undefined as string | undefined };

export function PasswordForm() {
  const [state, setState] = useState(initialState);
  const [pending, setPending] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword.length < 8) {
      setState({ success: false, message: "New password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setState({ success: false, message: "New passwords don't match." });
      return;
    }

    setPending(true);
    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      if (result.error) {
        setState({ success: false, message: result.error.message ?? "Could not update your password." });
        return;
      }
      setState({
        success: true,
        message: "Password updated. You were signed out of all other devices.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setState({ success: false, message: "Something went wrong. Please try again." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h2 className="font-serif text-lg font-semibold">Change password</h2>
        <p className="mt-1 text-sm text-muted">
          Updating your password signs you out everywhere except this device.
        </p>
      </div>

      {state.message && (
        <p
          role="status"
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
        <div className="flex flex-col gap-2 sm:col-span-2">
          <label htmlFor="currentPassword" className="label">
            Current password
          </label>
          <input
            id="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="input"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="newPassword" className="label">
            New password
          </label>
          <input
            id="newPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="input"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="confirmPassword" className="label">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="input"
          />
        </div>
      </div>

      <div className="flex items-center justify-end border-t border-border pt-5">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? "Updating…" : "Update password"}
        </button>
      </div>
    </form>
  );
}
