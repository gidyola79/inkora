import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { getUserNotifications } from "@/lib/data";
import { markNotificationsReadAction } from "@/lib/actions";
import { NotificationsToggle } from "@/components/notifications-toggle";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/components/article-card";

export const metadata: Metadata = { title: "Activity" };

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

export default async function ActivityPage() {
  const session = await requireUser();
  const [notifications, user] = await Promise.all([
    getUserNotifications(session.user.id),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { notificationsEnabled: true },
    }),
  ]);

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Activity</h1>
        <div className="flex items-center gap-2">
          <NotificationsToggle enabled={Boolean(user?.notificationsEnabled)} />
          {notifications.some((n) => !n.readAt) && (
            <form action={markNotificationsReadAction}>
              <button type="submit" className="btn btn-outline btn-sm">
                Mark all read
              </button>
            </form>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">
          No activity yet. Likes, reposts, comments, and new followers will show up here.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
          {notifications.map((notification) => {
            const meta = typeLabel[notification.type] ?? {
              verb: "updated",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><circle cx="12" cy="12" r="10" /></svg>
              ),
            };
            const href = notification.article
              ? `/articles/${notification.article.slug}`
              : notification.actor
                ? `/u/${notification.actor.username}`
                : "#";

            return (
              <li
                key={notification.id}
                className={`flex items-start gap-4 p-5 ${
                  notification.readAt ? "opacity-60" : ""
                }`}
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                  {meta.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-relaxed">
                    {notification.actor ? (
                      <Link
                        href={`/u/${notification.actor.username}`}
                        className="font-medium text-foreground hover:text-accent"
                      >
                        {notification.actor.name}
                      </Link>
                    ) : (
                      <span className="font-medium">Inkora</span>
                    )}{" "}
                    {meta.verb}{" "}
                    {notification.article && (
                      <Link
                        href={href}
                        className="font-medium text-accent hover:underline"
                      >
                        “{notification.article.title}”
                      </Link>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {formatDate(notification.createdAt)}
                  </p>
                </div>
                {!notification.readAt && (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" aria-label="Unread" />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}