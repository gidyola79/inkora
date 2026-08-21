"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getOrCreateConversationAction } from "@/lib/actions";

export function MessageUserButton({
  otherUserId,
  signedIn,
}: {
  otherUserId: string;
  signedIn: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleClick() {
    if (!signedIn) {
      router.push("/login");
      return;
    }
    const formData = new FormData();
    formData.set("otherUserId", otherUserId);
    startTransition(async () => {
      const conversationId = await getOrCreateConversationAction(formData);
      if (conversationId) {
        router.push(`/messages/${conversationId}`);
      } else {
        setError("Couldn't start a conversation.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={handleClick}
        className="btn btn-outline btn-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
          <path d="M8 12h8" />
          <path d="M12 8v8" />
        </svg>
        {pending ? "Opening…" : "Message"}
      </button>
      {error && <p className="text-xs text-danger">{error}</p>}
    </>
  );
}