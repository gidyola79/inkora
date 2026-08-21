"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SearchBar({ initialValue = "" }: { initialValue?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialValue);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-xl flex-col gap-2 sm:flex-row"
      role="search"
    >
      <input
        type="search"
        name="q"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search published articles…"
        aria-label="Search published articles"
        className="input h-12 rounded-full px-5"
      />
      <button
        type="submit"
        className="btn btn-primary h-12 shrink-0 px-6 sm:max-w-none"
      >
        Search
      </button>
    </form>
  );
}