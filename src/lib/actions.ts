"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { generateUniqueSlug } from "@/lib/slug";
import { articleFormSchema } from "@/lib/validation";
import { createNotification } from "@/lib/notifications";
import { generateFlashcards } from "@/lib/flashcards";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security-log";

export type ArticleActionState = {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  articleId?: string;
};

const getArticleFormData = (formData: FormData) => ({
  title: formData.get("title"),
  content: formData.get("content"),
  excerpt: formData.get("excerpt"),
  coverImageUrl: formData.get("coverImageUrl"),
});

const getIntent = (formData: FormData) =>
  String(formData.get("intent") ?? "draft") === "publish" ? "publish" : "draft";

function parseArticleForm(formData: FormData) {
  const result = articleFormSchema.safeParse(getArticleFormData(formData));
  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { success: false as const, fieldErrors };
  }
  return { success: true as const, data: result.data };
}

export async function createArticleAction(
  _prevState: ArticleActionState,
  formData: FormData
): Promise<ArticleActionState> {
  const session = await requireUser();

  const parsed = parseArticleForm(formData);
  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the errors below and try again.",
      fieldErrors: parsed.fieldErrors,
    };
  }

  const slug = await generateUniqueSlug(parsed.data.title);

  const intent = getIntent(formData);

  const article = await prisma.article.create({
    data: {
      authorId: session.user.id,
      title: parsed.data.title,
      slug,
      content: parsed.data.content,
      excerpt: parsed.data.excerpt ?? null,
      coverImageUrl: parsed.data.coverImageUrl ?? null,
      status: intent === "publish" ? "PUBLISHED" : "DRAFT",
      publishedAt: intent === "publish" ? new Date() : null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath(`/articles/${article.slug}`);
  redirect(
    intent === "publish"
      ? `/dashboard/articles/${article.id}/edit?published=1`
      : `/dashboard/articles/${article.id}/edit?created=1`
  );
}

export async function updateArticleAction(
  _prevState: ArticleActionState,
  formData: FormData
): Promise<ArticleActionState> {
  const session = await requireUser();

  const id = String(formData.get("id") ?? "");
  const existing = await prisma.article.findFirst({
    where: { id, authorId: session.user.id },
  });

  if (!existing) {
    return { success: false, message: "Article not found or you don't have permission to edit it." };
  }

  const parsed = parseArticleForm(formData);
  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the errors below and try again.",
      fieldErrors: parsed.fieldErrors,
    };
  }

  const titleChanged = parsed.data.title.trim() !== existing.title;
  const slug = titleChanged
    ? await generateUniqueSlug(parsed.data.title, existing.id)
    : existing.slug;

  const publish = getIntent(formData) === "publish";

  const article = await prisma.article.update({
    where: { id: existing.id },
    data: {
      title: parsed.data.title,
      slug,
      content: parsed.data.content,
      excerpt: parsed.data.excerpt ?? null,
      coverImageUrl: parsed.data.coverImageUrl ?? null,
      ...(publish
        ? { status: "PUBLISHED" as const, publishedAt: existing.publishedAt ?? new Date() }
        : {}),
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath(`/articles/${article.slug}`);
  redirect(
    publish
      ? `/dashboard/articles/${article.id}/edit?published=1`
      : `/dashboard/articles/${article.id}/edit?saved=1`
  );
}

export async function publishArticleAction(
  formData: FormData
): Promise<ArticleActionState> {
  const session = await requireUser();

  const id = String(formData.get("id") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "");
  const existing = await prisma.article.findFirst({
    where: { id, authorId: session.user.id },
  });

  if (!existing) {
    return { success: false, message: "Article not found or you don't have permission to publish it." };
  }

  const article = await prisma.article.update({
    where: { id: existing.id },
    data: {
      status: "PUBLISHED",
      publishedAt: existing.publishedAt ?? new Date(),
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath(`/articles/${article.slug}`);
  redirect(redirectTo || `/dashboard/articles/${article.id}/edit?published=1`);
}

export async function unpublishArticleAction(
  formData: FormData
): Promise<ArticleActionState> {
  const session = await requireUser();

  const id = String(formData.get("id") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "");
  const existing = await prisma.article.findFirst({
    where: { id, authorId: session.user.id },
  });

  if (!existing) {
    return { success: false, message: "Article not found or you don't have permission to unpublish it." };
  }

  const article = await prisma.article.update({
    where: { id: existing.id },
    data: {
      status: "DRAFT",
      publishedAt: null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath(`/articles/${article.slug}`);
  redirect(redirectTo || `/dashboard/articles/${article.id}/edit?unpublished=1`);
}

export async function deleteArticleAction(
  formData: FormData
): Promise<ArticleActionState> {
  const session = await requireUser();

  const id = String(formData.get("id") ?? "");
  const existing = await prisma.article.findFirst({
    where: { id, authorId: session.user.id },
  });

  if (!existing) {
    return { success: false, message: "Article not found or you don't have permission to delete it." };
  }

  await prisma.article.delete({ where: { id: existing.id } });

  revalidatePath("/dashboard");
  revalidatePath("/");
  revalidatePath("/search");
  redirect("/dashboard?deleted=1");
}

export async function publishArticle(formData: FormData): Promise<void> {
  await publishArticleAction(formData);
}

export async function unpublishArticle(formData: FormData): Promise<void> {
  await unpublishArticleAction(formData);
}

export async function addCommentAction(formData: FormData): Promise<void> {
  const session = await requireUser();
  const articleId = String(formData.get("articleId") ?? "");
  const content = String(formData.get("content") ?? "").trim();

  if (!content) redirect(`/articles/${formData.get("slug")}#comments`);
  if (content.length > 2000) redirect(`/articles/${formData.get("slug")}#comments`);

  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: { id: true, slug: true, authorId: true },
  });
  if (!article) redirect("/");

  const comment = await prisma.comment.create({
    data: { articleId, authorId: session.user.id, content },
  });

  await createNotification({
    userId: article.authorId,
    actorId: session.user.id,
    type: "COMMENT",
    articleId: article.id,
    commentId: comment.id,
    message: content,
  });

  revalidatePath(`/articles/${article.slug}`);
  revalidatePath("/dashboard");
  redirect(`/articles/${article.slug}?commented=1#comments`);
}

export async function deleteCommentAction(formData: FormData): Promise<void> {
  const session = await requireUser();
  const commentId = String(formData.get("commentId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const comment = await prisma.comment.findFirst({
    where: { id: commentId, authorId: session.user.id },
  });
  if (!comment) redirect(`/articles/${slug}#comments`);

  await prisma.comment.delete({ where: { id: comment.id } });

  revalidatePath(`/articles/${slug}`);
  redirect(`/articles/${slug}#comments`);
}

export async function toggleLikeAction(formData: FormData): Promise<boolean> {
  const session = await requireUser();
  const articleId = String(formData.get("articleId") ?? "");
  const slug = String(formData.get("slug") ?? "");

  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: { id: true, authorId: true },
  });
  if (!article) return false;

  const existing = await prisma.like.findUnique({
    where: { userId_articleId: { userId: session.user.id, articleId } },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
  } else {
    await prisma.like.create({
      data: { articleId, userId: session.user.id },
    });
    await createNotification({
      userId: article.authorId,
      actorId: session.user.id,
      type: "LIKE",
      articleId: article.id,
    });
  }

  revalidatePath(`/articles/${slug}`);
  revalidatePath("/");
  return !existing;
}

export async function toggleRepostAction(formData: FormData): Promise<boolean> {
  const session = await requireUser();
  const articleId = String(formData.get("articleId") ?? "");
  const slug = String(formData.get("slug") ?? "");

  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: { id: true, authorId: true },
  });
  if (!article) return false;

  const existing = await prisma.repost.findUnique({
    where: { userId_articleId: { userId: session.user.id, articleId } },
  });

  if (existing) {
    await prisma.repost.delete({ where: { id: existing.id } });
  } else {
    await prisma.repost.create({
      data: { articleId, userId: session.user.id },
    });
    await createNotification({
      userId: article.authorId,
      actorId: session.user.id,
      type: "REPOST",
      articleId: article.id,
    });
  }

  revalidatePath(`/articles/${slug}`);
  revalidatePath("/dashboard");
  revalidatePath("/");
  return !existing;
}

export async function toggleFollowAction(formData: FormData): Promise<boolean> {
  const session = await requireUser();
  const targetId = String(formData.get("targetId") ?? "");
  if (targetId === session.user.id) return false;

  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, username: true },
  });
  if (!target) return false;

  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: { followerId: session.user.id, followingId: targetId },
    },
  });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
  } else {
    await prisma.follow.create({
      data: { followerId: session.user.id, followingId: targetId },
    });
    await createNotification({
      userId: targetId,
      actorId: session.user.id,
      type: "FOLLOW",
    });
  }

  revalidatePath(`/u/${target.username}`);
  revalidatePath("/explore");
  revalidatePath("/dashboard");
  return !existing;
}

export async function updateProfileAction(
  _prevState: { success: boolean; message?: string },
  formData: FormData
) {
  const session = await requireUser();

  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const bio = String(formData.get("bio") ?? "").trim();
  const image = String(formData.get("image") ?? "").trim();
  const dob = String(formData.get("dob") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const gender = String(formData.get("gender") ?? "").trim();

  if (!/^[a-z0-9_]{3,30}$/.test(username)) {
    return {
      success: false,
      message: "Username must be 3–30 characters using letters, numbers, or underscores.",
    };
  }
  if (bio.length > 160) {
    return { success: false, message: "Bio must be 160 characters or fewer." };
  }
  if (phone && !/^[0-9+\-\s()]{7,20}$/.test(phone)) {
    return { success: false, message: "Phone number doesn't look valid." };
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing && existing.id !== session.user.id) {
    return { success: false, message: "That username is already taken." };
  }

  const parsedDob = dob ? new Date(`${dob}T00:00:00Z`) : null;

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      username,
      bio: bio || null,
      image: image || null,
      dob: parsedDob,
      phone: phone || null,
      gender: gender || null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  revalidatePath(`/u/${username}`);
  revalidatePath("/explore");
  return { success: true, message: "Profile updated." };
}

export async function toggleNotificationsAction(): Promise<boolean> {
  const session = await requireUser();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { notificationsEnabled: true },
  });
  if (!user) return false;

  const next = !user.notificationsEnabled;
  await prisma.user.update({
    where: { id: session.user.id },
    data: { notificationsEnabled: next },
  });
  revalidatePath("/dashboard/activity");
  revalidatePath("/dashboard/profile");
  return next;
}

export async function markNotificationsReadAction(): Promise<void> {
  const session = await requireUser();
  await prisma.notification.updateMany({
    where: { userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/dashboard/activity");
}

export async function markNotificationReadAction(notificationId: string): Promise<void> {
  const session = await requireUser();
  await prisma.notification.updateMany({
    where: { id: notificationId, userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/dashboard/activity");
}

export async function deleteNotificationAction(notificationId: string): Promise<void> {
  const session = await requireUser();
  await prisma.notification.deleteMany({
    where: { id: notificationId, userId: session.user.id },
  });
  revalidatePath("/dashboard/activity");
}

export async function muteUserAction(targetUserId: string): Promise<void> {
  const session = await requireUser();
  if (session.user.id === targetUserId) return;
  await prisma.mutedUser.upsert({
    where: { userId_mutedId: { userId: session.user.id, mutedId: targetUserId } },
    create: { userId: session.user.id, mutedId: targetUserId },
    update: {},
  });
  revalidatePath("/dashboard/activity");
}

export async function unmuteUserAction(targetUserId: string): Promise<void> {
  const session = await requireUser();
  await prisma.mutedUser.deleteMany({
    where: { userId: session.user.id, mutedId: targetUserId },
  });
  revalidatePath("/dashboard/activity");
}

export async function reportNotificationAction(
  notificationId: string,
  reason: string,
  message?: string
): Promise<{ success: boolean }> {
  const session = await requireUser();
  const existing = await prisma.notificationReport.findUnique({
    where: { notificationId_reporterId: { notificationId, reporterId: session.user.id } },
  });
  if (existing) return { success: false };
  await prisma.notificationReport.create({
    data: {
      notificationId,
      reporterId: session.user.id,
      reason: reason || "spam",
      message: message || null,
    },
  });
  logSecurityEvent("notification.reported", { notificationId, reason, userId: session.user.id });
  return { success: true };
}

export async function cleanupReadNotificationsAction(): Promise<number> {
  const session = await requireUser();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const { count } = await prisma.notification.deleteMany({
    where: { userId: session.user.id, readAt: { not: null, lt: sevenDaysAgo } },
  });
  if (count > 0) revalidatePath("/dashboard/activity");
  return count;
}

export type FlashcardActionState = { success: boolean; message?: string };

export async function createFlashcardSetAction(
  _prevState: FlashcardActionState,
  formData: FormData
): Promise<FlashcardActionState> {
  const session = await requireUser();
  const articleId = String(formData.get("articleId") ?? "") || null;
  const title =
    String(formData.get("title") ?? "").trim() ||
    (articleId ? "Study set" : "My flashcards");
  let cards: { front: string; back: string }[] = [];
  try {
    cards = JSON.parse(String(formData.get("cards") ?? ""));
  } catch {
    cards = [];
  }

  const validCards = cards
    .filter((c) => c.front?.trim() && c.back?.trim())
    .slice(0, 100);

  const limit = await consumeRateLimit(`flashcards-create:${session.user.id}`, 30, 3600);
  if (!limit.ok) {
    logSecurityEvent("ratelimit.blocked", {
      route: "createFlashcardSetAction",
      userId: session.user.id,
    });
    return { success: false, message: "Too many sets created recently. Try again later." };
  }

  const set = await prisma.flashcardSet.create({
    data: {
      userId: session.user.id,
      title: title.slice(0, 100),
      articleId,
      cards: {
        create: validCards.map((c, i) => ({
          front: c.front.trim().slice(0, 200),
          back: c.back.trim().slice(0, 500),
          order: i,
        })),
      },
    },
  });

  revalidatePath("/dashboard/flashcards");
  redirect(`/dashboard/flashcards/${set.id}`);
  return { success: true };
}

export async function generateFlashcardSetAction(formData: FormData): Promise<void> {
  const session = await requireUser();
  const articleId = String(formData.get("articleId") ?? "");
  const article = await prisma.article.findFirst({
    where: { id: articleId, status: "PUBLISHED" },
    select: { id: true, title: true, content: true },
  });
  if (!article) redirect("/dashboard/flashcards");

  const limit = await consumeRateLimit(`flashcards-gen:${session.user.id}`, 20, 3600);
  if (!limit.ok) {
    logSecurityEvent("ratelimit.blocked", {
      route: "generateFlashcardSetAction",
      userId: session.user.id,
    });
    redirect("/dashboard/flashcards?rate_limited=1");
  }

  const cards = generateFlashcards(article.content).slice(0, 50);

  const set = await prisma.flashcardSet.create({
    data: {
      userId: session.user.id,
      title: `Flashcards: ${article.title}`.slice(0, 100),
      articleId: article.id,
      cards: {
        create: cards.map((c, i) => ({
          front: c.front,
          back: c.back,
          order: i,
        })),
      },
    },
  });

  revalidatePath("/dashboard/flashcards");
  redirect(`/dashboard/flashcards/${set.id}`);
}

export async function saveFlashcardSetAction(
  _prevState: FlashcardActionState,
  formData: FormData
) {
  const session = await requireUser();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  let cards: { front: string; back: string }[] = [];
  try {
    cards = JSON.parse(String(formData.get("cards") ?? ""));
  } catch {
    cards = [];
  }

  const set = await prisma.flashcardSet.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!set) return { success: false, message: "Set not found." };

  const validCards = cards.filter((c) => c.front?.trim() && c.back?.trim());

  await prisma.$transaction(async (tx) => {
    await tx.flashcard.deleteMany({ where: { setId: set.id } });
    await tx.flashcardSet.update({
      where: { id: set.id },
      data: { title: title.slice(0, 100) || "Untitled set" },
    });
    if (validCards.length > 0) {
      await tx.flashcard.createMany({
        data: validCards.map((c, i) => ({
          setId: set.id,
          front: c.front.trim().slice(0, 200),
          back: c.back.trim().slice(0, 500),
          order: i,
        })),
      });
    }
  });

  revalidatePath("/dashboard/flashcards");
  revalidatePath(`/dashboard/flashcards/${set.id}`);
  return { success: true, message: "Set saved." };
}

export async function deleteFlashcardSetAction(formData: FormData): Promise<void> {
  const session = await requireUser();
  const id = String(formData.get("id") ?? "");
  const set = await prisma.flashcardSet.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!set) return;

  await prisma.flashcardSet.delete({ where: { id: set.id } });
  revalidatePath("/dashboard/flashcards");
  redirect("/dashboard/flashcards?deleted=1");
}

export async function resolveLoginIdentifierAction(
  _prevState: { success: boolean; email?: string; message?: string },
  formData: FormData
) {
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!identifier || !password) {
    return { success: false, message: "Enter your username or email and password." };
  }

  const ip = await getClientIp();
  const limit = await consumeRateLimit(`login-resolve:${ip}`, 10, 900);
  if (!limit.ok) {
    logSecurityEvent("ratelimit.blocked", { route: "resolveLoginIdentifier", ip });
    return {
      success: false,
      message: "Too many attempts. Please wait a few minutes and try again.",
    };
  }

  let email = identifier;
  if (!identifier.includes("@")) {
    const user = await prisma.user.findUnique({
      where: { username: identifier.toLowerCase() },
      select: { email: true },
    });
    // Deliberately vague on purpose: never reveal whether a username exists.
    if (!user) {
      logSecurityEvent("auth.login_failed", { identifier, ip });
      return {
        success: false,
        message: "We couldn't sign you in with those credentials.",
      };
    }
    email = user.email;
  }

  return { success: true, email };
}

export async function getOrCreateConversationAction(formData: FormData): Promise<string | null> {
  const session = await requireUser();
  const otherUserId = String(formData.get("otherUserId") ?? "");
  if (!otherUserId || otherUserId === session.user.id) return null;

  const targetUser = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: { id: true },
  });
  if (!targetUser) return null;

  const limit = await consumeRateLimit(`conversations:${session.user.id}`, 20, 3600);
  if (!limit.ok) return null;

  const existing = await prisma.conversationParticipant.findMany({
    where: { userId: session.user.id },
    include: { conversation: { include: { participants: true } } },
  });

  for (const p of existing) {
    if (p.conversation.participants.some((p2) => p2.userId === otherUserId)) {
      return p.conversationId;
    }
  }

  const conversation = await prisma.conversation.create({
    data: {
      participants: {
        create: [
          { userId: session.user.id },
          { userId: otherUserId },
        ],
      },
    },
  });

  return conversation.id;
}

export async function sendMessageAction(formData: FormData): Promise<void> {
  const session = await requireUser();
  const conversationId = String(formData.get("conversationId") ?? "");
  const encryptedContent = String(formData.get("encryptedContent") ?? "");
  const nonce = String(formData.get("nonce") ?? "");

  if (!encryptedContent || !nonce) return;

  const messageLimit = await consumeRateLimit(`messages:${session.user.id}`, 60, 60);
  if (!messageLimit.ok) {
    logSecurityEvent("ratelimit.blocked", {
      route: "sendMessageAction",
      userId: session.user.id,
    });
    return;
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      participants: { some: { userId: session.user.id } },
    },
    include: { participants: true },
  });
  if (!conversation) return;

  await prisma.message.create({
    data: {
      conversationId,
      senderId: session.user.id,
      encryptedContent,
      nonce,
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  revalidatePath(`/messages/${conversationId}`);
  revalidatePath("/messages");
}

export async function markMessagesReadAction(formData: FormData): Promise<void> {
  const session = await requireUser();
  const conversationId = String(formData.get("conversationId") ?? "");
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, participants: { some: { userId: session.user.id } } },
    select: { id: true },
  });
  if (!conversation) return;

  await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: session.user.id },
      readAt: null,
    },
    data: { readAt: new Date() },
  });
  revalidatePath(`/messages/${conversationId}`);
  revalidatePath("/messages");
}

export async function markMessagesReadSilent(conversationId: string, userId: string): Promise<void> {
  await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: userId },
      readAt: null,
    },
    data: { readAt: new Date() },
  });
}

export async function changeEmailAction(
  _prevState: { success: boolean; message?: string },
  formData: FormData
) {
  const session = await requireUser();

  const newEmail = String(formData.get("newEmail") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    return { success: false, message: "Enter a valid email address." };
  }
  if (newEmail === session.user.email.toLowerCase()) {
    return { success: false, message: "That is already your email." };
  }

  const existing = await prisma.user.findUnique({ where: { email: newEmail } });
  if (existing) {
    return { success: false, message: "That email is already in use by another account." };
  }

  try {
    await auth.api.signInEmail({ body: { email: session.user.email, password } });
  } catch {
    return { success: false, message: "Incorrect password." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { email: newEmail, emailVerified: false },
  });

  // The new address is unverified - send a fresh verification link so the
  // account stays recoverable and the next sign-in can complete.
  try {
    await auth.api.sendVerificationEmail({ body: { email: newEmail, callbackURL: "/" } });
  } catch (error) {
    console.error("[auth] verification email for changed address failed:", error);
  }

  logSecurityEvent("email.changed", { userId: session.user.id });
  revalidatePath("/dashboard/profile");
  return {
    success: true,
    message: `Email updated. We sent a verification link to ${newEmail} - open it to keep full account access.`,
  };
}

export async function deleteAccountAction(
  _prevState: { success: boolean; message?: string },
  formData: FormData
) {
  const session = await requireUser();

  const password = String(formData.get("password") ?? "");
  const confirmed = formData.get("confirm") === "on";

  if (!confirmed) {
    return { success: false, message: "Please confirm you understand this is permanent." };
  }
  if (!password) {
    return { success: false, message: "Enter your password to authorize deletion." };
  }

  try {
    await auth.api.signInEmail({ body: { email: session.user.email, password } });
  } catch {
    return { success: false, message: "Incorrect password." };
  }

  try {
    await prisma.user.delete({
      where: { id: session.user.id },
    });
  } catch (error) {
    console.error("Account deletion failed:", error);
    return { success: false, message: "Could not delete your account. Please try again." };
  }

  logSecurityEvent("account.deleted", { userId: session.user.id });
  return { success: true, message: "Account deleted." };
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function subscribeAction(
  _prevState: { success: boolean; message?: string },
  formData: FormData
) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!EMAIL_PATTERN.test(email)) {
    return { success: false, message: "Enter a valid email address." };
  }

  const ip = await getClientIp();
  const limit = await consumeRateLimit(`subscribe:${ip}`, 5, 3600);
  if (!limit.ok) {
    logSecurityEvent("ratelimit.blocked", { route: "subscribeAction", ip });
    return { success: false, message: "Too many attempts. Please try again later." };
  }

  const existing = await prisma.subscriber.findUnique({ where: { email } });
  if (existing) {
    return {
      success: true,
      message: "You're already on the list. See you in your inbox!",
    };
  }

  try {
    await prisma.subscriber.create({ data: { email } });
  } catch (error) {
    console.error("Newsletter subscription failed:", error);
    return { success: false, message: "Couldn't subscribe right now. Try again shortly." };
  }

  return { success: true, message: "Subscribed! A warm welcome to the Inkora letter." };
}

export async function optInToNewsletterAction(email: string) {
  const ip = await getClientIp();
  const limit = await consumeRateLimit(`optin:${ip}`, 10, 3600);
  if (!limit.ok) return;

  const normalized = email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(normalized)) return;
  await prisma.subscriber.upsert({
    where: { email: normalized },
    update: {},
    create: { email: normalized },
  });
}