import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { getUserArticle } from "@/lib/data";
import { publishArticle, unpublishArticle } from "@/lib/actions";
import { ArticleForm } from "@/components/article-form";
import { StatusBadge } from "@/components/status-badge";
import { DeleteArticleButton } from "@/components/delete-article-button";
import { formatDate } from "@/components/article-card";

export const metadata = {
  title: "Edit article",
};

export default async function EditArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; saved?: string; published?: string; unpublished?: string }>;
}) {
  const session = await requireUser();
  const { id } = await params;
  const { created, saved, published, unpublished } = await searchParams;

  const article = await getUserArticle(session.user.id, id);
  if (!article) {
    notFound();
  }

  const banner = published
    ? { tone: "success", text: "Article published and now live on the public blog." }
    : unpublished
      ? { tone: "default", text: "Article returned to drafts. It is no longer publicly visible." }
      : saved
        ? { tone: "success", text: "Changes saved." }
        : created
          ? { tone: "success", text: "Draft created. Keep editing or publish when ready." }
          : null;

  return (
    <section className="mx-auto w-full max-w-2xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">Edit article</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
            <StatusBadge status={article.status} />
            {article.publishedAt && (
              <span>Published {formatDate(article.publishedAt)}</span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {article.status === "DRAFT" ? (
            <form action={publishArticle}>
              <input type="hidden" name="id" value={article.id} />
              <input type="hidden" name="redirectTo" value={`/dashboard/articles/${article.id}/edit`} />
              <button className="btn btn-primary btn-sm">Publish</button>
            </form>
          ) : (
            <>
              <Link
                href={`/articles/${article.slug}`}
                className="btn btn-outline btn-sm"
              >
                View live
              </Link>
              <form action={unpublishArticle}>
                <input type="hidden" name="id" value={article.id} />
                <input type="hidden" name="redirectTo" value={`/dashboard/articles/${article.id}/edit`} />
                <button className="btn btn-outline btn-sm">Unpublish</button>
              </form>
            </>
          )}

          <DeleteArticleButton articleId={article.id} />
        </div>
      </div>

      {banner && (
        <p
          role="status"
          className={`mb-6 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
            banner.tone === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-border bg-card text-foreground"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 shrink-0"
            aria-hidden="true"
          >
            {banner.tone === "success" ? (
              <>
                <circle cx="12" cy="12" r="10" />
                <path d="m8.5 12.5 2.5 2.5 5-6" />
              </>
            ) : (
              <>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </>
            )}
          </svg>
          {banner.text}
        </p>
      )}

      <ArticleForm
        mode="edit"
        articleId={article.id}
        initialTitle={article.title}
        initialExcerpt={article.excerpt ?? ""}
        initialCoverImageUrl={article.coverImageUrl ?? ""}
        initialContent={article.content}
      />
    </section>
  );
}