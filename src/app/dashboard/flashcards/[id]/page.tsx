import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { getFlashcardSetForUser } from "@/lib/data";
import { FlashcardBuilder } from "@/components/flashcard-builder";
import { FlashcardStudy } from "@/components/flashcard-study";
import { DeleteSetButton } from "@/components/delete-set-button";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Flashcard set" };
}

export default async function FlashcardSetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const session = await requireUser();
  const { id } = await params;
  const { view } = await searchParams;

  const set = await getFlashcardSetForUser(id, session.user.id);
  if (!set) notFound();

  const studyMode = view === "study";

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Link href="/dashboard/flashcards" className="transition-colors hover:text-foreground">
            Flashcards
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-foreground">{set.title}</span>
        </div>
        <div className="flex items-center gap-2">
          {set.cards.length > 0 && (
            <Link
              href={`/dashboard/flashcards/${set.id}?view=study`}
              className={`btn btn-sm ${studyMode ? "btn-primary" : "btn-outline"}`}
            >
              Study
            </Link>
          )}
          <Link
            href={`/dashboard/flashcards/${set.id}`}
            className={`btn btn-sm ${studyMode ? "btn-outline" : "btn-primary"}`}
          >
            Edit
          </Link>
          <DeleteSetButton setId={set.id} />
        </div>
      </div>

      <h2 className="font-serif text-2xl font-semibold tracking-tight">{set.title}</h2>
      <p className="text-sm text-muted">
        {set.cards.length} card{set.cards.length === 1 ? "" : "s"}
        {set.article && (
          <>
            {" "}
            · from{" "}
            <Link href={`/articles/${set.article.slug}`} className="text-accent hover:underline">
              {set.article.title}
            </Link>
          </>
        )}
      </p>

      {studyMode ? (
        <FlashcardStudy
          cards={set.cards.map((card) => ({ front: card.front, back: card.back }))}
        />
      ) : (
        <FlashcardBuilder
          mode="edit"
          setId={set.id}
          initialTitle={set.title}
          initialCards={set.cards.map((card) => ({
            front: card.front,
            back: card.back,
          }))}
        />
      )}
    </section>
  );
}