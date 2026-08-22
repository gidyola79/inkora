"use client";

import { useEffect, useRef, useState } from "react";

const EMOJIS: string[] = [
  "😀", "😂", "🥹", "😊", "😍", "🤔", "😎", "🥳",
  "😴", "🤯", "😭", "😡", "🫠", "🤗", "🤫", "🫡",
  "👍", "👎", "👏", "🙏", "💪", "🤝", "👀", "🧠",
  "🔥", "✨", "💯", "❤️", "🧡", "💛", "💚", "💙",
  "💜", "🖤", "🎉", "🎊", "🎁", "☕", "📚", "✍️",
  "🚀", "🌟", "⚡", "🐱", "🐶", "🦄", "🍕", "🌈",
];

export function EmojiPicker({
  onPick,
  disabled,
  title = "Emoji",
}: {
  onPick: (emoji: string) => void;
  disabled?: boolean;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        title={title}
        aria-label={title}
        aria-expanded={open}
        disabled={disabled}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-border/50 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
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
          <circle cx="12" cy="12" r="10" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
          <line x1="9" x2="9.01" y1="9" y2="9" />
          <line x1="15" x2="15.01" y1="9" y2="9" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10 sm:hidden" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            role="dialog"
            aria-label="Choose an emoji"
            className="fixed bottom-4 left-1/2 z-20 max-h-[min(48dvh,22rem)] w-[min(22rem,calc(100vw-1rem))] -translate-x-1/2 overflow-y-auto overscroll-contain rounded-2xl border border-border bg-card p-3 shadow-2xl sm:absolute sm:bottom-full sm:left-auto sm:right-0 sm:w-72 sm:max-w-[calc(100vw-1rem)] sm:translate-x-0 sm:p-2 sm:shadow-lg"
          >
            <div className="mb-2 hidden text-center text-xs font-medium text-muted sm:block">Tap to insert — scroll for more</div>
            <div className="grid grid-cols-8 gap-1 sm:grid-cols-8 sm:gap-0.5">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onPick(emoji);
                  setOpen(false);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-xl leading-none transition-colors hover:bg-border/60 active:scale-95 sm:h-8 sm:w-8 sm:text-lg"
              >
                {emoji}
              </button>
            ))}
          </div>
          <button onClick={() => setOpen(false)} className="btn btn-ghost btn-sm mt-3 w-full sm:hidden">Close</button>
        </div>
        </>
      )}
    </div>
  );
}
