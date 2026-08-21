import { searchPublishedArticles } from "@/lib/data";
import { searchQuerySchema } from "@/lib/validation";
import { ArticleCard } from "@/components/article-card";
import { SearchBar } from "@/components/search-bar";
import { EmptyState } from "@/components/empty-state";

export const metadata = {
  title: "Search",
  description: "Search published articles on Inkora.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = searchQuerySchema.safeParse({ q }).success ? (q ?? "") : "";
  const results = query ? await searchPublishedArticles(query) : [];

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
      <header className="mb-8">
        <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          Search
        </h1>
        <p className="mt-2 text-muted">
          Find published articles by title or excerpt.
        </p>
      </header>

      <SearchBar initialValue={query} />

      <div className="mt-10">
        {query === "" ? (
          <EmptyState
            title="Search Inkora"
            description="Type a keyword above to search published articles."
          />
        ) : results.length === 0 ? (
          <EmptyState
            title="No results found"
            description={`Nothing matched “${query}”. Try a different keyword.`}
          />
        ) : (
          <>
            <p className="mb-6 text-sm text-muted">
              {results.length} {results.length === 1 ? "result" : "results"} for{" "}
              <span className="font-medium text-foreground">“{query}”</span>
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}