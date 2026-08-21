"use client";

import { useTransition } from "react";
import { deleteFlashcardSetAction } from "@/lib/actions";

export function DeleteSetButton({ setId }: { setId: string }) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm("Delete this flashcard set? This can't be undone.")) return;
    const formData = new FormData();
    formData.set("id", setId);
    startTransition(() => {
      deleteFlashcardSetAction(formData);
    });
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleDelete}
      className="btn btn-danger-outline btn-sm"
    >
      {pending ? "Deleting…" : "Delete set"}
    </button>
  );
}