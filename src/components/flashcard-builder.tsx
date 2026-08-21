"use client";

import { useState, useActionState } from "react";
import { createFlashcardSetAction, saveFlashcardSetAction } from "@/lib/actions";
import type { FlashcardActionState } from "@/lib/actions";

type Card = { front: string; back: string };

type FlashcardBuilderProps = {
  mode: "create" | "edit";
  setId?: string;
  articleId?: string;
  initialTitle?: string;
  initialCards?: Card[];
};

const emptyState: FlashcardActionState = { success: false };

export function FlashcardBuilder({
  mode,
  setId,
  articleId,
  initialTitle = "",
  initialCards = [],
}: FlashcardBuilderProps) {
  const action = mode === "create" ? createFlashcardSetAction : saveFlashcardSetAction;
  const [state, formAction, isPending] = useActionState(action, emptyState);
  const [title, setTitle] = useState(initialTitle);
  const [cards, setCards] = useState<Card[]>(initialCards);

  function updateCard(index: number, field: "front" | "back", value: string) {
    setCards((current) =>
      current.map((card, i) => (i === index ? { ...card, [field]: value } : card))
    );
  }

  function addCard() {
    setCards((current) => [...current, { front: "", back: "" }]);
  }

  function removeCard(index: number) {
    setCards((current) => current.filter((_, i) => i !== index));
  }

  function moveCard(index: number, direction: -1 | 1) {
    setCards((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="cards" value={JSON.stringify(cards)} />
      {mode === "edit" && setId && <input type="hidden" name="id" value={setId} />}
      {mode === "create" && articleId && (
        <input type="hidden" name="articleId" value={articleId} />
      )}

      {state.message && (
        <p
          role="status"
          className={`rounded-xl border px-4 py-3 text-sm ${
            state.success
              ? "border-accent/30 bg-accent/10 text-accent"
              : "border-danger/30 bg-danger/10 text-danger"
          }`}
        >
          {state.message}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="title" className="label">
          Set title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. React hooks"
          className="input"
        />
      </div>

      {cards.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 py-10 text-center">
          <p className="text-sm text-muted">No cards yet. Add one below.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {cards.map((card, index) => (
            <li key={index} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">
                  Card {index + 1}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveCard(index, -1)}
                    disabled={index === 0}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-border/50 hover:text-foreground disabled:opacity-30"
                    aria-label="Move card up"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="m18 15-6-6-6 6" /></svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveCard(index, 1)}
                    disabled={index === cards.length - 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-border/50 hover:text-foreground disabled:opacity-30"
                    aria-label="Move card down"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="m6 9 6 6 6-6" /></svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeCard(index)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                    aria-label="Remove card"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <textarea
                  value={card.front}
                  onChange={(event) => updateCard(index, "front", event.target.value)}
                  placeholder="Front (question)"
                  rows={3}
                  className="input h-auto resize-y py-3 text-sm"
                />
                <textarea
                  value={card.back}
                  onChange={(event) => updateCard(index, "back", event.target.value)}
                  placeholder="Back (answer)"
                  rows={3}
                  className="input h-auto resize-y py-3 text-sm"
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={addCard}
        className="btn btn-outline self-start"
      >
        + Add card
      </button>

      <div className="flex items-center justify-end border-t border-border pt-5">
        <button type="submit" disabled={isPending} className="btn btn-primary">
          {isPending
            ? "Saving…"
            : mode === "create"
              ? "Create set"
              : "Save set"}
        </button>
      </div>
    </form>
  );
}