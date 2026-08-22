"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { markNotificationReadAction } from "@/lib/actions";
import { formatDate } from "@/components/article-card";

type Actor = { id: string; name: string; image: string | null; username: string | null } | null;
type Article = { id: string; title: string; slug: string } | null;

type Notification = {
  id: string;
  type: string;
  actor: Actor;
  article: Article;
  message: string | null;
  readAt: Date | null;
  createdAt: Date;
};

const typeVerb: Record<string, string> = {
  FOLLOW: "started following you",
  LIKE: "liked your article",
  REPOST: "reposted your article",
  COMMENT: "commented on your article",
  MENTION: "mentioned you",
  ANNOUNCEMENT: "",
};

export function NotificationBell({
  unread,
  notifications,
}: {
  unread: number;
  notifications: Notification[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  async function handleMarkRead(id: string) {
    await markNotificationReadAction(id);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="btn btn-ghost relative"
        aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-black/10">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            <Link
              href="/dashboard/activity"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-accent hover:underline"
            >
              View all
            </Link>
          </div>

          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">
              No notifications yet.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {notifications.map((n) => {
                const verb = typeVerb[n.type] ?? "updated";
                const href = n.article
                  ? `/articles/${n.article.slug}`
                  : n.actor
                    ? `/u/${n.actor.username}`
                    : "#";

                return (
                  <li
                    key={n.id}
                    className={`border-b border-border last:border-b-0 ${
                      n.readAt ? "opacity-60" : ""
                    }`}
                  >
                    <Link
                      href={href}
                      onClick={() => {
                        setOpen(false);
                        if (!n.readAt) handleMarkRead(n.id);
                      }}
                      className="flex gap-3 px-4 py-3 transition-colors hover:bg-border/30"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-snug">
                          <span className="font-medium">
                            {n.actor ? n.actor.name : "Inkora"}
                          </span>{" "}
                          {verb}
                          {n.article && (
                            <>
                              {" "}
                              <span className="text-accent">
                                &ldquo;{n.article.title}&rdquo;
                              </span>
                            </>
                          )}
                        </p>
                        {n.message && (
                          <p className="mt-1 truncate text-xs text-muted">
                            {n.message}
                          </p>
                        )}
                        <p className="mt-0.5 text-xs text-muted">
                          {formatDate(n.createdAt)}
                        </p>
                      </div>
                      {!n.readAt && (
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
