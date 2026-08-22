"use client";

import { useOptimistic, useTransition } from "react";
import { toggleShowOnlineStatusAction } from "@/lib/actions";

export function OnlineToggle({ enabled }: { enabled: boolean }) {
  const [pending, start] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(enabled, (c) => !c);
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3">
      <div>
        <p className="text-sm font-medium">Show online status</p>
        <p className="text-xs text-muted">Let others see when you are online in messages.</p>
      </div>
      <button
        disabled={pending}
        onClick={() => {
          setOptimistic(null as unknown as boolean);
          start(async () => {
            await toggleShowOnlineStatusAction();
          });
        }}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${optimistic ? "bg-accent" : "bg-border"}`}
        aria-label={optimistic ? "Online status visible" : "Online status hidden"}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${optimistic ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </div>
  );
}
