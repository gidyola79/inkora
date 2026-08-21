import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireUser();

  const tabs = [
    { label: "Articles", href: "/dashboard" },
    { label: "Flashcards", href: "/dashboard/flashcards" },
    { label: "Activity", href: "/dashboard/activity" },
    { label: "Profile", href: "/dashboard/profile" },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted">
            Welcome back, <span className="font-medium text-foreground">{session.user.name}</span>.
          </p>
        </div>
        <Link href="/dashboard/articles/new" className="btn btn-primary w-full sm:w-auto">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
          Write a new article
        </Link>
      </header>

      <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-border" aria-label="Dashboard sections">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="-mb-px shrink-0 rounded-t-lg px-4 py-2 text-sm font-medium transition-colors text-muted hover:text-foreground"
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}