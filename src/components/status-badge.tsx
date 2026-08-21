import type { ArticleStatus } from "@/generated/prisma/enums";

const statusStyles: Record<ArticleStatus, string> = {
  DRAFT: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
  PUBLISHED: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
};

export function StatusBadge({ status }: { status: ArticleStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[status]}`}
    >
      {status === "PUBLISHED" ? "Published" : "Draft"}
    </span>
  );
}