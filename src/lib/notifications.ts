import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@/generated/prisma/enums";

type CreateNotificationParams = {
  userId: string;
  actorId?: string;
  type: NotificationType;
  articleId?: string;
  commentId?: string;
  message?: string;
};

export async function createNotification({
  userId,
  actorId,
  type,
  articleId,
  commentId,
  message,
}: CreateNotificationParams) {
  if (actorId && actorId === userId) return;

  const recipient = await prisma.user.findUnique({
    where: { id: userId },
    select: { notificationsEnabled: true },
  });
  if (!recipient || !recipient.notificationsEnabled) return;

  if (actorId) {
    const muted = await prisma.mutedUser.findUnique({
      where: { userId_mutedId: { userId, mutedId: actorId } },
    });
    if (muted) return;
  }

  await prisma.notification.create({
    data: {
      userId,
      actorId: actorId ?? null,
      type,
      articleId: articleId ?? null,
      commentId: commentId ?? null,
      message: message ?? null,
    },
  });
}

export async function getMutedUserIds(userId: string): Promise<Set<string>> {
  const rows = await prisma.mutedUser.findMany({
    where: { userId },
    select: { mutedId: true },
  });
  return new Set(rows.map((r) => r.mutedId));
}