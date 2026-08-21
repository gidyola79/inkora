"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateUserKeyPair, savePrivateKey, getPrivateKeyJwk } from "@/lib/e2ee";

export function E2eeSetup({ hasPublicKey }: { hasPublicKey: boolean }) {
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [hasKey, setHasKey] = useState(hasPublicKey && Boolean(getPrivateKeyJwk()));
  const router = useRouter();

  async function handleSetup() {
    if (hasKey) {
      setMessage("Encryption is already set up on this device.");
      return;
    }
    setStatus("working");
    setMessage("");
    try {
      const { publicKey, privateKeyJwk } = await generateUserKeyPair();
      const response = await fetch("/api/me/public-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicKey }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || "Couldn't save your public key.");
      }
      savePrivateKey(privateKeyJwk);
      setHasKey(true);
      setStatus("done");
      setMessage("End-to-end encryption enabled. Your private key is stored only on this device.");
      router.refresh();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Couldn't set up encryption.");
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="font-medium">End-to-end encrypted messaging</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">
        Generate a key pair so you can send and receive encrypted messages. Your private key is
        generated in your browser and stored only on this device — it never leaves your computer.
        Clearing browser data removes it (re-set up to get a fresh key pair).
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSetup}
          disabled={status === "working" || hasKey}
          className={`btn btn-sm ${hasKey ? "btn-outline" : "btn-primary"}`}
        >
          {hasKey ? "Encryption active" : status === "working" ? "Generating keys…" : "Set up encryption"}
        </button>
        {status === "done" && (
          <span className="text-sm text-accent">✓ Enabled</span>
        )}
        {message && <p className="w-full text-sm text-muted">{message}</p>}
      </div>
    </div>
  );
}