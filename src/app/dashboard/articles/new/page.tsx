import { requireUser } from "@/lib/auth-helpers";
import { ArticleForm } from "@/components/article-form";

export const metadata = {
  title: "New article",
};

export default async function NewArticlePage() {
  await requireUser();

  return (
    <section className="mx-auto w-full max-w-2xl">
      <h1 className="mb-6 font-serif text-2xl font-semibold tracking-tight">
        New article
      </h1>
      <p className="-mt-4 mb-6 text-sm text-muted">
        Write in markdown and publish when you&apos;re ready.
      </p>
      <ArticleForm mode="create" />
    </section>
  );
}