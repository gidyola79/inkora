"use client";

import { useEffect } from "react";

export function PresenceHeartbeat() {
  useEffect(() => {
    let stopped = false;
    async function beat() {
      try {
        await fetch("/api/presence", { method: "POST" });
      } catch {}
    }
    beat();
    const id = setInterval(() => {
      if (!stopped) beat();
    }, 30_000);
    function onVisible() {
      if (document.visibilityState === "visible") beat();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  return null;
}
