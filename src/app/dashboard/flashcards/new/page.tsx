import type { Metadata } from "next";
import Link from "next/link";
import { FlashcardBuilder } from "@/components/flashcard-builder";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "New flashcard set" };

export default async function NewFlashcardSetPage({
  searchParams,
}: {
  searchParams: Promise<{ articleId?: string }>;
}) {
  const { articleId } = await searchParams;

  let initialCards: { front: string; back: string }[] = [];
  let title = "";

  if (articleId) {
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: { id: true, title: true, content: true },
    });
    if (article) {
      title = `Flashcards: ${article.title}`.slice(0, 100);
      const { generateFlashcards } = await import("@/lib/flashcards");
      initialCards = generateFlashcards(article.content);
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center gap-2 text-sm text-muted">
        <Link href="/dashboard/flashcards" className="transition-colors hover:text-foreground">
          Flashcards
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-foreground">New set</span>
      </div>

      <h2 className="font-serif text-xl font-semibold tracking-tight">
        {articleId ? "Review & save your generated cards" : "Create a flashcard set"}
      </h2>
      <p className="text-sm text-muted">
        {articleId
          ? "Cards were generated from the article. Edit, add, or remove cards before saving."
          : "Write your own cards to study anything."}
      </p>

      <FlashcardBuilder
        mode="create"
        articleId={articleId}
        initialTitle={title}
        initialCards={initialCards}
      />
    </section>
  );
}