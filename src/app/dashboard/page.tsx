import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import {
  getDashboardCounts,
  getUserArticles,
  getUserReposts,
  getFlashcardSetsForUser,
} from "@/lib/data";
import { publishArticle, unpublishArticle } from "@/lib/actions";
import { StatusBadge } from "@/components/status-badge";
import { DeleteArticleButton } from "@/components/delete-article-button";
import { EmptyState } from "@/components/empty-state";
import { formatDate } from "@/components/article-card";
import type { ArticleStatus } from "@/generated/prisma/enums";

export const metadata = {
  title: "Dashboard",
};

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-semibold leading-none text-foreground">{value}</p>
        <p className="mt-1.5 truncate text-xs font-medium uppercase tracking-wide text-muted">
          {label}
        </p>
      </div>
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requireUser();
  const { status } = await searchParams;

  const filter: ArticleStatus | undefined =
    status === "draft" ? "DRAFT" : status === "published" ? "PUBLISHED" : undefined;

  const [counts, articles, reposts, flashcardSets] = await Promise.all([
    getDashboardCounts(session.user.id),
    getUserArticles(session.user.id, filter),
    getUserReposts(session.user.id),
    getFlashcardSetsForUser(session.user.id),
  ]);

  const tabs = [
    { label: `All (${counts.total})`, href: "/dashboard", active: filter === undefined },
    { label: `Drafts (${counts.drafts})`, href: "/dashboard?status=draft", active: filter === "DRAFT" },
    { label: `Published (${counts.published})`, href: "/dashboard?status=published", active: filter === "PUBLISHED" },
  ];

  return (
    <section className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat
          label="Total articles"
          value={counts.total}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
              <path d="M12 3c-4 0-8 3.5-8 8.5 0 3 1.5 5.5 4 7 0-4 1-5.5 4-6.5-4 2.5-4 6.5-4 6.5s0 2 4 2 8-3.5 8-9C20 6 16 3 12 3Z" />
            </svg>
          }
        />
        <Stat
          label="Drafts"
          value={counts.drafts}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
              <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z" />
              <path d="M15 3v6h6" />
              <path d="M8 13h8" />
              <path d="M8 17h5" />
            </svg>
          }
        />
        <Stat
          label="Published"
          value={counts.published}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          }
        />
      </div>

      <nav
        className="flex gap-1 overflow-x-auto border-b border-border"
        aria-label="Article filters"
      >
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`-mb-px shrink-0 rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab.active
                ? "border border-b-transparent border-border bg-card text-foreground"
                : "text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {articles.length === 0 ? (
        <EmptyState
          title={filter ? `No ${filter === "DRAFT" ? "drafts" : "published articles"} yet` : "No articles yet"}
          description="Start writing to see your articles here."
          action={
            <Link href="/dashboard/articles/new" className="btn btn-primary btn-sm">
              Write a new article
            </Link>
          }
        />
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
          {articles.map((article) => (
            <li
              key={article.id}
              className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
            >
              <div className="min-w-0">
                <Link
                  href={`/dashboard/articles/${article.id}/edit`}
                  className="font-medium text-foreground transition-colors hover:text-accent"
                >
                  {article.title}
                </Link>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                  <StatusBadge status={article.status} />
                  <span>Updated {formatDate(article.updatedAt)}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {article.status === "DRAFT" ? (
                  <form action={publishArticle}>
                    <input type="hidden" name="id" value={article.id} />
                    <input type="hidden" name="redirectTo" value="/dashboard" />
                    <button className="btn btn-primary btn-sm">Publish</button>
                  </form>
                ) : (
                  <>
                    <Link
                      href={`/articles/${article.slug}`}
                      className="btn btn-outline btn-sm"
                    >
                      View
                    </Link>
                    <form action={unpublishArticle}>
                      <input type="hidden" name="id" value={article.id} />
                      <input type="hidden" name="redirectTo" value="/dashboard" />
                      <button className="btn btn-outline btn-sm">Unpublish</button>
                    </form>
                  </>
                )}

                <Link
                  href={`/dashboard/articles/${article.id}/edit`}
                  className="btn btn-outline btn-sm"
                >
                  Edit
                </Link>

                <DeleteArticleButton articleId={article.id} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-serif text-lg font-semibold tracking-tight">
              Your reposts
            </h3>
            <span className="text-xs text-muted">{reposts.length}</span>
          </div>
          {reposts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              Articles you repost will appear here.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {reposts.map((repost) => (
                <li key={repost.id} className="py-3">
                  <Link
                    href={`/articles/${repost.article.slug}`}
                    className="text-sm font-medium text-foreground transition-colors hover:text-accent"
                  >
                    {repost.article.title}
                  </Link>
                  <p className="text-xs text-muted">
                    by {repost.article.author.name} · reposted{" "}
                    {formatDate(repost.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-serif text-lg font-semibold tracking-tight">
              Flashcard sets
            </h3>
            <Link
              href="/dashboard/flashcards"
              className="text-xs font-medium text-accent hover:underline"
            >
              View all
            </Link>
          </div>
          {flashcardSets.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              No flashcard sets yet. Create one to study any article.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {flashcardSets.slice(0, 5).map((set) => (
                <li key={set.id} className="py-3">
                  <Link
                    href={`/dashboard/flashcards/${set.id}`}
                    className="text-sm font-medium text-foreground transition-colors hover:text-accent"
                  >
                    {set.title}
                  </Link>
                  <p className="text-xs text-muted">
                    {set._count.cards} card{set._count.cards === 1 ? "" : "s"} · updated{" "}
                    {formatDate(set.updatedAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}