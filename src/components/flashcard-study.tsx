"use client";

import { useState } from "react";

export function FlashcardStudy({ cards }: { cards: { front: string; back: string }[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());

  if (cards.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted">No cards in this set yet.</p>
    );
  }

  const card = cards[index];
  const isKnown = known.has(index);

  function next() {
    setFlipped(false);
    setIndex((current) => (current + 1) % cards.length);
  }

  function prev() {
    setFlipped(false);
    setIndex((current) => (current - 1 + cards.length) % cards.length);
  }

  function markKnown() {
    setKnown((current) => new Set(current).add(index));
    next();
  }

  function markUnknown() {
    setKnown((current) => {
      const nextSet = new Set(current);
      nextSet.delete(index);
      return nextSet;
    });
    next();
  }

  const progress = known.size;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between text-sm text-muted">
        <span>
          Card {index + 1} of {cards.length}
        </span>
        <span>
          {progress}/{cards.length} known
        </span>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="group min-h-[16rem] w-full cursor-pointer rounded-2xl border border-border bg-card p-8 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        aria-label="Flip card"
      >
        {flipped ? (
          <>
            <p className="text-xs font-medium uppercase tracking-wide text-accent">Answer</p>
            <p className="mt-3 whitespace-pre-wrap font-serif text-xl leading-relaxed">
              {card.back}
            </p>
          </>
        ) : (
          <>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Question</p>
            <p className="mt-3 whitespace-pre-wrap font-serif text-xl leading-relaxed">
              {card.front}
            </p>
          </>
        )}
        <p className="mt-8 text-xs text-muted group-hover:text-foreground">
          Click to flip
        </p>
      </button>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={prev} className="btn btn-outline btn-sm">
          Previous
        </button>
        {!flipped && (
          <button type="button" onClick={() => setFlipped(true)} className="btn btn-primary btn-sm">
            Show answer
          </button>
        )}
        {flipped && (
          <>
            <button type="button" onClick={markUnknown} className="btn btn-outline btn-sm">
              Still learning
            </button>
            <button
              type="button"
              onClick={markKnown}
              className={`btn btn-sm ${isKnown ? "btn-outline" : "btn-primary"}`}
            >
              {isKnown ? "Known ✓" : "I knew it"}
            </button>
          </>
        )}
        <button type="button" onClick={next} className="btn btn-ghost btn-sm">
          Skip
        </button>
      </div>
    </div>
  );
}