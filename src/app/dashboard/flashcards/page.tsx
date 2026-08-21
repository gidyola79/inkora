import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { getFlashcardSetsForUser } from "@/lib/data";
import { generateFlashcardSetAction } from "@/lib/actions";
import { formatDate } from "@/components/article-card";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Flashcards" };

export default async function FlashcardsPage() {
  const session = await requireUser();
  const sets = await getFlashcardSetsForUser(session.user.id);
  const published = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, title: true },
    orderBy: { publishedAt: "desc" },
    take: 20,
  });

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-xl font-semibold tracking-tight">
          Your flashcard sets
        </h2>
        <Link href="/dashboard/flashcards/new" className="btn btn-primary btn-sm">
          New set
        </Link>
      </div>

      {published.length > 0 && (
        <form
          action={generateFlashcardSetAction}
          className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-4"
        >
          <p className="text-sm font-medium">Generate from an article:</p>
          <select name="articleId" className="input min-w-0 flex-1 sm:max-w-xs">
            {published.map((article) => (
              <option key={article.id} value={article.id}>
                {article.title}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-outline btn-sm">
            Generate
          </button>
        </form>
      )}

      {sets.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">
          No flashcard sets yet. Create one or generate it from any published article.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {sets.map((set) => (
            <li key={set.id}>
              <Link
                href={`/dashboard/flashcards/${set.id}`}
                className="card flex flex-col gap-3 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{set.title}</p>
                    <p className="text-xs text-muted">
                      {set._count.cards} card{set._count.cards === 1 ? "" : "s"}
                      {set.article && (
                        <>
                          {" "}
                          · from “{set.article.title}”
                        </>
                      )}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
                    Updated {formatDate(set.updatedAt)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}