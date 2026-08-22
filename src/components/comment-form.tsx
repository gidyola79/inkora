"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MentionDropdown, useMentionAutocomplete } from "@/components/mention-autocomplete";

export function CommentForm({
  articleId,
  initialValue = "",
}: {
  articleId: string;
  initialValue?: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [value, setValue] = useState(initialValue);
  const [cursor, setCursor] = useState(initialValue.length);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const { query: mentionQuery, results: mentionResults, loading: mentionLoading } = useMentionAutocomplete(value, cursor);

  function handleMentionSelect(username: string) {
    if (mentionQuery === null) return;
    const before = value.slice(0, cursor);
    const atIdx = before.lastIndexOf("@" + mentionQuery);
    if (atIdx === -1) return;
    const after = value.slice(cursor);
    const next = value.slice(0, atIdx) + "@" + username + " " + after;
    const newPos = atIdx + username.length + 2;
    setValue(next);
    setCursor(newPos);
    requestAnimationFrame(() => {
      if (!textareaRef.current) return;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(newPos, newPos);
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = value.trim();
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
      setValue("");
      setCursor(0);
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
      <div className="relative">
        <textarea
          ref={textareaRef}
          name="content"
          rows={3}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setCursor(e.target.selectionStart ?? e.target.value.length);
          }}
          onSelect={(e) => setCursor((e.target as HTMLTextAreaElement).selectionStart ?? 0)}
          onKeyUp={(e) => setCursor((e.target as HTMLTextAreaElement).selectionStart ?? 0)}
          onClick={(e) => setCursor((e.target as HTMLTextAreaElement).selectionStart ?? 0)}
          placeholder="Share your thoughts… (markdown and @mentions supported)"
          className="input h-auto min-h-[5rem] resize-y py-3 leading-relaxed"
          maxLength={2000}
        />
        {mentionQuery !== null && (
          <MentionDropdown users={mentionResults} loading={mentionLoading} onSelect={handleMentionSelect} onClose={() => {}} />
        )}
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex items-center justify-end">
        <button type="submit" disabled={pending} className="btn btn-primary btn-sm">
          {pending ? "Posting…" : "Post comment"}
        </button>
      </div>
    </form>
  );
}