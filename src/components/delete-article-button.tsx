"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteArticleAction } from "@/lib/actions";

export function DeleteArticleButton({ articleId }: { articleId: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      setError(null);
      const formData = new FormData();
      formData.set("id", articleId);
      const result = await deleteArticleAction(formData);
      if (!result.success) {
        setError(result.message ?? "Something went wrong.");
      }
      dialogRef.current?.close();
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="btn btn-sm btn-danger-outline"
      >
        Delete
      </button>

      <dialog
        ref={dialogRef}
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-border bg-card p-6 text-foreground backdrop:bg-black/40"
      >
        <h2 className="font-serif text-lg font-semibold">Delete article?</h2>
        <p className="mt-2 text-sm text-muted">
          This action cannot be undone. The article will be permanently removed from your
          dashboard and, if published, from the public blog.
        </p>

        {error && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="btn btn-sm btn-outline"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="btn btn-sm bg-danger text-white hover:bg-danger/90 disabled:opacity-50"
          >
            {isPending ? "Deleting…" : "Delete permanently"}
          </button>
        </div>
      </dialog>
    </>
  );
}