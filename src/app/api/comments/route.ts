import { getSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user) {
    return Response.json({ error: "Sign in to comment." }, { status: 401 });
  }

  let body: { articleId?: string; content?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const articleId = String(body.articleId ?? "");
  const content = String(body.content ?? "").trim();

  if (!content) {
    return Response.json({ error: "Comment can't be empty." }, { status: 400 });
  }
  if (content.length > 2000) {
    return Response.json(
      { error: "Comment must be 2000 characters or fewer." },
      { status: 400 }
    );
  }

  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: { id: true, slug: true, authorId: true },
  });
  if (!article) {
    return Response.json({ error: "Article not found." }, { status: 404 });
  }

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

  return Response.json({ success: true, comment });
}