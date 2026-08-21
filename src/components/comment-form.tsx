"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function CommentForm({
  articleId,
  initialValue = "",
}: {
  articleId: string;
  initialValue?: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const content = String(formData.get("content") ?? "").trim();
    if (!content) {
      setError("Write a comment first.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/comments/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, content }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || "Couldn't post comment.");
      }
      formRef.current?.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't post comment.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3">
      {initialValue && (
        <blockquote className="rounded-xl border-l-2 border-accent/50 bg-border/30 px-4 py-2 text-sm italic text-muted">
          {initialValue}
        </blockquote>
      )}
      <textarea
        name="content"
        rows={3}
        placeholder="Share your thoughts… (markdown and @mentions supported)"
        className="input h-auto min-h-[5rem] resize-y py-3 leading-relaxed"
        maxLength={2000}
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex items-center justify-end">
        <button type="submit" disabled={pending} className="btn btn-primary btn-sm">
          {pending ? "Posting…" : "Post comment"}
        </button>
      </div>
    </form>
  );
}