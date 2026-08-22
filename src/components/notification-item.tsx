"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  deleteNotificationAction,
  muteUserAction,
  reportNotificationAction,
  markNotificationReadAction,
} from "@/lib/actions";
import { formatDate } from "@/components/article-card";

type Actor = { id: string; name: string; image: string | null; username: string | null } | null;
type Article = { id: string; title: string; slug: string } | null;

export type NotificationItemProps = {
  id: string;
  type: string;
  actor: Actor;
  article: Article;
  message: string | null;
  readAt: string | null;
  createdAt: string;
};

const typeLabel: Record<string, { verb: string; icon: React.ReactNode }> = {
  FOLLOW: {
    verb: "started following you",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
    ),
  },
  LIKE: {
    verb: "liked your article",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
    ),
  },
  REPOST: {
    verb: "reposted your article",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="m17 2 4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" /><path d="m7 22-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" /></svg>
    ),
  },
  COMMENT: {
    verb: "commented on your article",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
    ),
  },
  MENTION: {
    verb: "mentioned you",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
    ),
  },
  ANNOUNCEMENT: {
    verb: "",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="m3 11 18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></svg>
    ),
  },
};

export function NotificationItem({
  id,
  type,
  actor,
  article,
  message,
  readAt,
  createdAt,
}: NotificationItemProps) {
  const ref = useRef<HTMLLIElement>(null);
  const [isRead, setIsRead] = useState(!!readAt);
  const [open, setOpen] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [muted, setMuted] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [showReportMenu, setShowReportMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const markRead = useCallback(async () => {
    if (!isRead) {
      setIsRead(true);
      await markNotificationReadAction(id);
    }
  }, [id, isRead]);

  useEffect(() => {
    if (isRead || !ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          markRead();
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [isRead, markRead]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowReportMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (deleted) return null;

  const meta = typeLabel[type] ?? {
    verb: "updated",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><circle cx="12" cy="12" r="10" /></svg>
    ),
  };

  const href = article
    ? `/articles/${article.slug}`
    : actor
      ? `/u/${actor.username}`
      : "#";

  async function handleDelete() {
    setOpen(false);
    setDeleted(true);
    await deleteNotificationAction(id);
  }

  async function handleMute() {
    if (!actor) return;
    setOpen(false);
    setMuted(true);
    await muteUserAction(actor.id);
  }

  async function handleReport(reason: string) {
    setShowReportMenu(false);
    setOpen(false);
    await reportNotificationAction(id, reason);
    setReportSent(true);
  }

  return (
    <li
      ref={ref}
      className={`flex items-start gap-4 p-5 ${isRead ? "opacity-60" : ""}`}
    >
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
        {meta.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-relaxed">
          {actor ? (
            <Link
              href={`/u/${actor.username}`}
              className="font-medium text-foreground hover:text-accent"
            >
              {actor.name}
            </Link>
          ) : (
            <span className="font-medium">Inkora</span>
          )}{" "}
          {meta.verb}{" "}
          {article && (
            <Link
              href={href}
              className="font-medium text-accent hover:underline"
            >
              &ldquo;{article.title}&rdquo;
            </Link>
          )}
        </p>
        {message && (
          <p className="mt-2 whitespace-pre-wrap break-words rounded-xl border border-border bg-background/70 px-3 py-2 text-sm leading-relaxed text-muted">
            {message}
          </p>
        )}
        {muted && (
          <p className="mt-1 text-xs text-muted">Notifications from this person muted.</p>
        )}
        {reportSent && (
          <p className="mt-1 text-xs text-muted">Report sent. Thank you.</p>
        )}
        <p className="mt-0.5 text-xs text-muted">
          {formatDate(new Date(createdAt))}
        </p>
      </div>
      <div className="relative shrink-0" ref={menuRef}>
        {!isRead && (
          <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-accent" aria-label="Unread" />
        )}
        <button
          onClick={() => { setOpen(!open); setShowReportMenu(false); }}
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-border/50 hover:text-foreground"
          aria-label="Notification options"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <circle cx="12" cy="5" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="19" r="1.5" />
          </svg>
        </button>
        {open && (
          <div className="absolute right-0 z-30 mt-1 w-52 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
            <button
              onClick={handleDelete}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-border/40"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
              Delete
            </button>
            {actor && (
              <button
                onClick={handleMute}
                disabled={muted}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-border/40 disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M18.36 19.36L5.64 5.64" /><path d="M14.54 9.46a5 5 0 0 1 0 7.07" /><path d="M9.46 14.54a5 5 0 0 0 0-7.07" /></svg>
                {muted ? "Muted" : `Mute ${actor.name}`}
              </button>
            )}
            {!showReportMenu ? (
              <button
                onClick={() => setShowReportMenu(true)}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-border/40"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" x2="4" y1="22" y2="15" /></svg>
                Report
              </button>
            ) : (
              <div className="border-t border-border">
                <p className="px-4 py-1.5 text-xs font-medium text-muted">Why report?</p>
                {["spam", "harassment", "inappropriate", "other"].map((reason) => (
                  <button
                    key={reason}
                    onClick={() => handleReport(reason)}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm capitalize text-foreground transition-colors hover:bg-border/40"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
