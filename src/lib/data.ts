import { prisma } from "@/lib/prisma";
import type { ArticleStatus } from "@/generated/prisma/enums";
import type { ArticleGetPayload } from "@/generated/prisma/models";

const authorSelect = {
  id: true,
  name: true,
  image: true,
  username: true,
} as const;

export type ArticleWithAuthor = ArticleGetPayload<{
  include: { author: { select: typeof authorSelect } };
}>;

const commentAuthorSelect = {
  id: true,
  name: true,
  image: true,
  username: true,
} as const;

export type CommentWithAuthor = NonNullable<
  Awaited<ReturnType<typeof getComments>>
>[number];

export async function getPublishedArticles(): Promise<ArticleWithAuthor[]> {
  return prisma.article.findMany({
    where: { status: "PUBLISHED" },
    include: { author: { select: authorSelect } },
    orderBy: { publishedAt: "desc" },
  });
}

export async function getPublishedArticleBySlug(
  slug: string
): Promise<ArticleWithAuthor | null> {
  return prisma.article.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
    },
    include: { author: { select: authorSelect } },
  });
}

export async function searchPublishedArticles(query: string): Promise<ArticleWithAuthor[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  return prisma.article.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        { title: { contains: trimmed, mode: "insensitive" } },
        { excerpt: { contains: trimmed, mode: "insensitive" } },
        { content: { contains: trimmed, mode: "insensitive" } },
        { author: { name: { contains: trimmed, mode: "insensitive" } } },
        { author: { username: { contains: trimmed, mode: "insensitive" } } },
      ],
    },
    include: { author: { select: authorSelect } },
    orderBy: { publishedAt: "desc" },
  });
}

export async function getDashboardCounts(userId: string) {
  const [total, drafts, published] = await Promise.all([
    prisma.article.count({ where: { authorId: userId } }),
    prisma.article.count({ where: { authorId: userId, status: "DRAFT" } }),
    prisma.article.count({ where: { authorId: userId, status: "PUBLISHED" } }),
  ]);

  return { total, drafts, published };
}

export async function getUserArticles(userId: string, status?: ArticleStatus) {
  return prisma.article.findMany({
    where: {
      authorId: userId,
      ...(status ? { status } : {}),
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getArticleById(id: string): Promise<ArticleWithAuthor | null> {
  return prisma.article.findUnique({
    where: { id },
    include: { author: { select: authorSelect } },
  });
}

export async function getUserArticle(
  userId: string,
  id: string
): Promise<ArticleWithAuthor | null> {
  return prisma.article.findFirst({
    where: {
      id,
      authorId: userId,
    },
    include: { author: { select: authorSelect } },
  });
}

export async function getUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username },
    include: {
      articles: {
        where: { status: "PUBLISHED" },
        include: { author: { select: authorSelect } },
        orderBy: { publishedAt: "desc" },
      },
    },
  });
}

export async function getUserReposts(userId: string) {
  return prisma.repost.findMany({
    where: { userId },
    include: {
      article: {
        include: { author: { select: authorSelect } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getComments(articleId: string) {
  return prisma.comment.findMany({
    where: { articleId },
    include: { author: { select: commentAuthorSelect } },
    orderBy: { createdAt: "asc" },
  });
}

export async function getRepostCount(articleId: string) {
  return prisma.repost.count({ where: { articleId } });
}

export async function hasUserReposted(userId: string, articleId: string) {
  return prisma.repost.findUnique({
    where: { userId_articleId: { userId, articleId } },
  });
}

export async function getFlashcardSetsForUser(userId: string) {
  return prisma.flashcardSet.findMany({
    where: { userId },
    include: {
      article: { select: { id: true, title: true, slug: true } },
      _count: { select: { cards: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getFlashcardSetForUser(id: string, userId: string) {
  return prisma.flashcardSet.findFirst({
    where: { id, userId },
    include: {
      article: { select: { id: true, title: true, slug: true } },
      cards: { orderBy: { order: "asc" } },
    },
  });
}

export async function getFollowStats(userId: string) {
  const [followers, following] = await Promise.all([
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.follow.count({ where: { followerId: userId } }),
  ]);
  return { followers, following };
}

export async function isFollowing(followerId: string, followingId: string) {
  if (!followerId) return false;
  return prisma.follow.findUnique({
    where: {
      followerId_followingId: { followerId, followingId },
    },
  });
}

export async function getUserFollowers(userId: string) {
  return prisma.follow.findMany({
    where: { followingId: userId },
    include: { follower: { select: authorSelect } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getUserFollowing(userId: string) {
  return prisma.follow.findMany({
    where: { followerId: userId },
    include: { following: { select: authorSelect } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getUserNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    include: {
      actor: { select: authorSelect },
      article: { select: { id: true, title: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

export async function getRecentNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    include: {
      actor: { select: authorSelect },
      article: { select: { id: true, title: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
}

export async function getArticleEngagement(articleId: string, userId: string) {
  const [commentCount, repostCount, likeCount, liked, reposted] = await Promise.all([
    prisma.comment.count({ where: { articleId } }),
    prisma.repost.count({ where: { articleId } }),
    prisma.like.count({ where: { articleId } }),
    userId
      ? prisma.like.findUnique({
          where: { userId_articleId: { userId, articleId } },
        })
      : null,
    userId
      ? prisma.repost.findUnique({
          where: { userId_articleId: { userId, articleId } },
        })
      : null,
  ]);

  return {
    commentCount,
    repostCount,
    likeCount,
    liked: Boolean(liked),
    reposted: Boolean(reposted),
  };
}

export async function getExploreUsers(search?: string) {
  const trimmed = search?.trim().replace(/^@+/, "");
  return prisma.user.findMany({
    where: {
      ...(trimmed
        ? {
            OR: [
              { name: { contains: trimmed, mode: "insensitive" } },
              { username: { contains: trimmed, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      _count: { select: { articles: { where: { status: "PUBLISHED" } }, followers: true } },
    },
    orderBy: { name: "asc" },
    take: 60,
  });
}

const conversationPartnerSelect = {
  id: true,
  name: true,
  username: true,
  image: true,
  publicKey: true,
  showOnlineStatus: true,
  lastSeenAt: true,
} as const;

export function isUserOnline(user: { showOnlineStatus: boolean | null; lastSeenAt: Date | null } | null): boolean {
  if (!user || !user.showOnlineStatus || !user.lastSeenAt) return false;
  return Date.now() - new Date(user.lastSeenAt).getTime() < 3 * 60 * 1000;
}

export async function getConversationsForUser(userId: string) {
  const conversations = await prisma.conversation.findMany({
    where: { participants: { some: { userId } } },
    include: {
      participants: {
        include: { user: { select: conversationPartnerSelect } },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return conversations.map((conversation) => {
    const other = conversation.participants.find((p) => p.userId !== userId)?.user ?? null;
    const lastMessage = conversation.messages[0] ?? null;
    return {
      id: conversation.id,
      other,
      lastMessage,
      updatedAt: conversation.updatedAt,
    };
  });
}

export async function getConversationForUser(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      participants: { some: { userId } },
    },
    include: {
      participants: { include: { user: { select: conversationPartnerSelect } } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!conversation) return null;

  const other = conversation.participants.find((p) => p.userId !== userId)?.user ?? null;

  return {
    id: conversation.id,
    other,
    messages: conversation.messages,
  };
}