import { getSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ commentId: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return Response.json({ error: "Sign in to delete comments." }, { status: 401 });
  }

  const { commentId } = await params;
  const comment = await prisma.comment.findFirst({
    where: { id: commentId, authorId: session.user.id },
    include: { article: { select: { slug: true } } },
  });

  if (!comment) {
    return Response.json({ error: "Comment not found." }, { status: 404 });
  }

  await prisma.comment.delete({ where: { id: comment.id } });

  revalidatePath(`/articles/${comment.article.slug}`);

  return Response.json({ success: true });
}