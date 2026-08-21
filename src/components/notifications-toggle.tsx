"use client";

import { useOptimistic, useTransition } from "react";
import { toggleNotificationsAction } from "@/lib/actions";

export function NotificationsToggle({ enabled }: { enabled: boolean }) {
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(enabled, (current) => !current);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        setOptimistic(null);
        startTransition(() => {
          toggleNotificationsAction();
        });
      }}
      aria-pressed={optimistic}
      title={optimistic ? "Notifications are on" : "Notifications are off"}
      className={`btn btn-sm ${optimistic ? "btn-outline" : "btn-ghost"}`}
    >
      {optimistic ? "Notifications: On" : "Notifications: Off"}
    </button>
  );
}