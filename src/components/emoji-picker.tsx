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
        <div
          role="dialog"
          aria-label="Choose an emoji"
          className="absolute bottom-full right-0 z-20 mb-2 max-h-[min(42vh,20rem)] w-72 max-w-[calc(100vw-1rem)] overflow-y-auto overscroll-contain rounded-xl border border-border bg-card p-2 shadow-lg sm:w-64"
        >
          <div className="grid grid-cols-7 gap-0.5 sm:grid-cols-8">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onPick(emoji);
                  setOpen(false);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-md text-lg leading-none transition-colors hover:bg-border/60"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
