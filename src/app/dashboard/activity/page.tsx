import type { Metadata } from "next";
import { requireUser } from "@/lib/auth-helpers";
import { getUserNotifications } from "@/lib/data";
import { markNotificationsReadAction, cleanupReadNotificationsAction } from "@/lib/actions";
import { NotificationsToggle } from "@/components/notifications-toggle";
import { NotificationItem } from "@/components/notification-item";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Activity" };

export default async function ActivityPage() {
  const session = await requireUser();

  const [notifications, user] = await Promise.all([
    getUserNotifications(session.user.id),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { notificationsEnabled: true },
    }),
  ]);

  await cleanupReadNotificationsAction();

  const hasUnread = notifications.some((n) => !n.readAt);

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Activity</h1>
        <div className="flex items-center gap-2">
          <NotificationsToggle enabled={Boolean(user?.notificationsEnabled)} />
          {hasUnread && (
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
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              id={notification.id}
              type={notification.type}
              actor={notification.actor}
              article={notification.article}
              message={notification.message}
              readAt={notification.readAt?.toISOString() ?? null}
              createdAt={notification.createdAt.toISOString()}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
