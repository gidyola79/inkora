import Link from "next/link";
import { getPublishedArticles } from "@/lib/data";
import { ArticleCard } from "@/components/article-card";
import { EmptyState } from "@/components/empty-state";

export const metadata = {
  title: "Home",
};

export default async function Home() {
  const articles = await getPublishedArticles();

  return (
    <>
      <section className="border-b border-border bg-gradient-to-b from-accent/10 to-background">
        <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-3.5 w-3.5"
              aria-hidden="true"
            >
              <path d="M12 3c-4 0-8 3.5-8 8.5 0 3 1.5 5.5 4 7 0-4 1-5.5 4-6.5-4 2.5-4 6.5-4 6.5s0 2 4 2 8-3.5 8-9C20 6 16 3 12 3Z" />
            </svg>
            Write. Publish. Be Heard.
          </p>
          <h1 className="max-w-2xl font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            A home for ideas worth sharing
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
            Inkora is where writers publish their stories, essays, and ideas —
            and readers discover work worth their time.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/search" className="btn btn-primary">
              Browse articles
            </Link>
            <Link href="/register" className="btn btn-outline">
              Start writing
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
              Latest writing
            </h2>
            <p className="mt-1 text-sm text-muted">
              The newest stories from authors on Inkora.
            </p>
          </div>
          <Link
            href="/search"
            className="inline-flex items-center gap-1 text-sm font-medium text-accent transition-colors hover:gap-1.5"
          >
            View all
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </header>

        {articles.length === 0 ? (
          <EmptyState
            title="No published articles yet"
            description="Fresh ideas are on the way. Check back soon, or be the first to publish."
            action={
              <Link href="/register" className="btn btn-primary btn-sm">
                Start writing
              </Link>
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}