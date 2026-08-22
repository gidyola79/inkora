"use client";

import { useEffect, useRef, useState, useActionState } from "react";
import { createArticleAction, updateArticleAction } from "@/lib/actions";
import type { ArticleActionState } from "@/lib/actions";
import { MarkdownEditor } from "@/components/markdown-editor";

const initialState: ArticleActionState = { success: false };

type ArticleFormProps = {
  mode: "create" | "edit";
  articleId?: string;
  initialTitle?: string;
  initialExcerpt?: string;
  initialCoverImageUrl?: string;
  initialContent?: string;
};

export function ArticleForm({
  mode,
  articleId,
  initialTitle = "",
  initialExcerpt = "",
  initialCoverImageUrl = "",
  initialContent = "",
}: ArticleFormProps) {
  const action = mode === "create" ? createArticleAction : updateArticleAction;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [dirty, setDirty] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState(initialCoverImageUrl);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  function markDirty() {
    setDirty(true);
  }

  async function handleCoverUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be smaller than 5 MB.");
      return;
    }

    const body = new FormData();
    body.append("file", file);
    body.append("kind", "cover");

    setUploading(true);
    setUploadError(null);
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body,
      });
      const result = await response.json();
      if (!response.ok || !result.url) {
        throw new Error(result.error || "Upload failed.");
      }
      setCoverImageUrl(result.url);
      markDirty();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-6"
      onChange={markDirty}
    >
      {articleId && <input type="hidden" name="id" value={articleId} />}

      {state.message && !state.success && (
        <p
          role="alert"
          className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {state.message}
        </p>
      )}

      {dirty && (
        <p className="flex items-center gap-1.5 text-xs text-muted">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>
          Unsaved changes — don&apos;t leave this page yet.
        </p>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="title" className="label">
          Title
        </label>
        <input
          id="title"
          type="text"
          name="title"
          defaultValue={initialTitle}
          placeholder="A headline worth reading"
          aria-invalid={Boolean(state.fieldErrors?.title)}
          className="input text-base font-medium"
        />
        {state.fieldErrors?.title && (
          <p className="text-sm text-danger">{state.fieldErrors.title}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="excerpt" className="label">
          Excerpt <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id="excerpt"
          type="text"
          name="excerpt"
          defaultValue={initialExcerpt}
          placeholder="A short summary shown on cards and in search"
          className="input"
        />
        {state.fieldErrors?.excerpt && (
          <p className="text-sm text-danger">{state.fieldErrors.excerpt}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="coverImageUrl" className="label">
          Cover image <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id="coverImageUrl"
          type="hidden"
          name="coverImageUrl"
          value={coverImageUrl}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="btn btn-outline btn-sm shrink-0 cursor-pointer">
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
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
            {uploading ? "Uploading…" : "Upload image"}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleCoverUpload}
              disabled={uploading}
            />
          </label>
          <span className="text-xs text-muted">or paste an image URL</span>
          <input
            type="url"
            value={coverImageUrl.startsWith("data:") ? "" : coverImageUrl}
            onChange={(event) => {
              setCoverImageUrl(event.target.value);
              markDirty();
            }}
            placeholder="https://example.com/image.jpg"
            className="input min-w-0 flex-1"
          />
        </div>
        {uploadError && <p className="text-sm text-danger">{uploadError}</p>}
        {coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImageUrl}
            alt="Cover preview"
            className="aspect-[16/9] w-full max-w-md rounded-xl border border-border object-cover"
          />
        )}
        {state.fieldErrors?.coverImageUrl && (
          <p className="text-sm text-danger">{state.fieldErrors.coverImageUrl}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="content" className="label">
          Content
        </label>
        <MarkdownEditor
          name="content"
          initialValue={initialContent}
          placeholder={
            "Write your story…\n\nMarkdown is supported: # headings, **bold**, ~sub~, ^sup^, > quotes, - lists"
          }
        />
        {state.fieldErrors?.content && (
          <p className="text-sm text-danger">{state.fieldErrors.content}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
        <button
          type="submit"
          name="intent"
          value="draft"
          disabled={isPending}
          className="btn btn-outline"
        >
          {isPending
            ? "Saving…"
            : mode === "create"
              ? "Save draft"
              : "Save changes"}
        </button>

        <button
          type="submit"
          name="intent"
          value="publish"
          disabled={isPending}
          className="btn btn-primary"
        >
          {isPending ? "Publishing…" : "Publish"}
        </button>
      </div>
    </form>
  );
}