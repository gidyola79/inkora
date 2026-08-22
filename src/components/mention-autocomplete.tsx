"use client";

import { useEffect, useState } from "react";

type MentionUser = { id: string; name: string; username: string | null; image: string | null };

export function useMentionAutocomplete(value: string, cursor: number) {
  const [query, setQuery] = useState<string | null>(null);
  const [results, setResults] = useState<MentionUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const before = value.slice(0, cursor);
    const m = before.match(/@([a-zA-Z0-9_]{0,30})$/);
    if (!m) {
      setQuery(null);
      setResults([]);
      return;
    }
    const q = m[1];
    // trigger search on first letter after @ (allow empty to show recent, but spec says on letter)
    if (q.length < 1) {
      setQuery(null);
      setResults([]);
      return;
    }
    setQuery(q);
  }, [value, cursor]);

  useEffect(() => {
    if (query === null) return;
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
        const data = r.ok ? await r.json() : [];
        if (!cancelled) setResults(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  return { query, results, loading, setQuery };
}

export function MentionDropdown({
  users,
  loading,
  onSelect,
  onClose,
}: {
  users: MentionUser[];
  loading: boolean;
  onSelect: (username: string) => void;
  onClose: () => void;
}) {
  if (loading) return <div className="absolute bottom-full left-0 z-20 mb-2 w-64 rounded-xl border border-border bg-card p-3 text-sm text-muted shadow-lg">Searching…</div>;
  if (users.length === 0) return null;
  return (
    <div className="absolute bottom-full left-0 z-20 mb-2 max-h-56 w-64 overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
      <p className="px-3 py-1.5 text-xs font-medium text-muted">Mention a writer</p>
      {users.map((u) => (
        <button
          key={u.id}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onSelect(u.username ?? "")}
          className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-border/40"
        >
          <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-accent/15 text-xs font-semibold text-accent">
            {u.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={u.image} alt="" className="h-full w-full object-cover" />
            ) : (
              u.name.charAt(0).toUpperCase()
            )}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{u.name}</span>
            {u.username && <span className="block truncate text-xs text-muted">@{u.username}</span>}
          </span>
        </button>
      ))}
      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onClose} className="w-full px-3 py-1.5 text-center text-xs text-muted hover:text-foreground">Close</button>
    </div>
  );
}
