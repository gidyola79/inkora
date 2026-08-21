import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedArticleBySlug } from "@/lib/data";
import { getArticleEngagement, getComments } from "@/lib/data";
import { requireUserOrNull } from "@/lib/auth-helpers";
import { formatDate, getReadingTime } from "@/components/article-card";
import { MarkdownRenderer } from "@/components/markdown";
import { ArticleActions } from "@/components/article-actions";
import { CommentSection } from "@/components/comment-section";
import { FollowButton } from "@/components/follow-button";
import { isFollowing, getFollowStats } from "@/lib/data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);

  if (!article) {
    return { title: "Article not found" };
  }

  return {
    title: article.title,
    description: article.excerpt ?? undefined,
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const readingTime = getReadingTime(article.content);
  const user = await requireUserOrNull();

  const [engagement, comments, followStats, following] = await Promise.all([
    getArticleEngagement(article.id, user?.id ?? ""),
    getComments(article.id),
    getFollowStats(article.authorId),
    isFollowing(user?.id ?? "", article.authorId),
  ]);

  const isAuthor = user?.id === article.authorId;
  const quoteText = article.excerpt
    ? `> "${article.excerpt}" — ${article.author.name}`
    : undefined;

  const serializedComments = comments.map((comment) => ({
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    author: {
      id: comment.author.id,
      name: comment.author.name,
      username: comment.author.username,
      image: comment.author.image,
    },
  }));

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
      >
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
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </svg>
        Back to home
      </Link>

      <header className="mb-8">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted">
          <span className="inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-accent/15 text-xs font-semibold text-accent">
            {article.author.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={article.author.image}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              article.author.name.charAt(0).toUpperCase()
            )}
          </span>
          {article.author.username ? (
            <Link
              href={`/u/${article.author.username}`}
              className="font-medium text-foreground hover:text-accent"
            >
              {article.author.name}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{article.author.name}</span>
          )}
          <span aria-hidden="true">·</span>
          <time dateTime={article.publishedAt?.toISOString()}>
            {formatDate(article.publishedAt ?? article.createdAt)}
          </time>
          <span aria-hidden="true">·</span>
          <span>{readingTime} min read</span>
        </div>

        <h1 className="font-serif text-3xl font-semibold leading-tight tracking-tight sm:text-4xl md:text-[2.75rem]">
          {article.title}
        </h1>

        {article.excerpt && (
          <p className="mt-5 border-l-2 border-accent/40 pl-4 text-lg leading-relaxed text-muted">
            {article.excerpt}
          </p>
        )}
      </header>

      {article.coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.coverImageUrl}
          alt=""
          className="mb-10 aspect-[16/9] w-full rounded-2xl border border-border object-cover"
        />
      )}

      <MarkdownRenderer>{article.content}</MarkdownRenderer>

      <div className="mt-12 flex flex-col gap-5 border-t border-border pt-8">
        <ArticleActions
          articleId={article.id}
          slug={article.slug}
          likeCount={engagement.likeCount}
          repostCount={engagement.repostCount}
          liked={engagement.liked}
          reposted={engagement.reposted}
          signedIn={Boolean(user)}
        />
      </div>

      <div className="mt-8 flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-accent/15 text-sm font-semibold text-accent">
            {article.author.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={article.author.image}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              article.author.name.charAt(0).toUpperCase()
            )}
          </span>
          <div>
            <Link
              href={article.author.username ? `/u/${article.author.username}` : "#"}
              className="text-sm font-medium hover:text-accent"
            >
              Written by {article.author.name}
            </Link>
            <p className="text-xs text-muted">
              {followStats.followers} follower{followStats.followers === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        {!isAuthor && (
          <FollowButton
            targetUserId={article.authorId}
            username={article.author.username ?? article.author.id}
            isFollowing={Boolean(following)}
            followerCount={followStats.followers}
            signedIn={Boolean(user)}
          />
        )}
      </div>

      <CommentSection
        articleId={article.id}
        comments={serializedComments}
        quoteText={quoteText}
        signedIn={Boolean(user)}
        currentUserId={user?.id}
      />
    </article>
  );
}