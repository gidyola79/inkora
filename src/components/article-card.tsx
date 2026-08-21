import Link from "next/link";
import type { ArticleWithAuthor } from "@/lib/data";

export function formatDate(date: Date | null | undefined) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function getReadingTime(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return minutes;
}

export function ArticleCard({ article }: { article: ArticleWithAuthor }) {
  const readingTime = getReadingTime(article.content);
  const href = `/articles/${article.slug}`;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <Link href={href} className="block overflow-hidden" aria-label={article.title}>
        {article.coverImageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={article.coverImageUrl}
            alt=""
            className="aspect-[16/9] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex aspect-[16/9] w-full items-center justify-center bg-gradient-to-br from-accent/20 via-card to-card">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-10 w-10 text-accent/40 transition-transform duration-300 group-hover:scale-110"
              aria-hidden="true"
            >
              <path d="M12 3c-4 0-8 3.5-8 8.5 0 3 1.5 5.5 4 7 0-4 1-5.5 4-6.5-4 2.5-4 6.5-4 6.5s0 2 4 2 8-3.5 8-9C20 6 16 3 12 3Z" />
            </svg>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="font-medium text-foreground">{article.author.name}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={article.publishedAt?.toISOString()}>
            {formatDate(article.publishedAt ?? article.createdAt)}
          </time>
          <span aria-hidden="true">·</span>
          <span>{readingTime} min read</span>
        </div>

        <h2 className="text-xl font-semibold leading-snug">
          <Link
            href={href}
            className="text-foreground transition-colors group-hover:text-accent"
          >
            {article.title}
          </Link>
        </h2>

        {article.excerpt && (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted">
            {article.excerpt}
          </p>
        )}

        <div className="mt-auto pt-2">
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-sm font-medium text-accent transition-colors hover:gap-1.5"
          >
            Read article
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
        </div>
      </div>
    </article>
  );
}