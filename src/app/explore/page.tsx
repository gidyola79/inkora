import type { Metadata } from "next";
import Link from "next/link";
import { getExploreUsers } from "@/lib/data";

export const metadata: Metadata = { title: "Explore" };

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const users = await getExploreUsers(q);

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-serif text-3xl font-semibold tracking-tight">Explore</h1>
      <p className="mt-2 text-sm text-muted">
        Discover writers and their blogs across Inkora.
      </p>

      <form action="/explore" method="get" className="mt-6 flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search people…"
          className="input min-w-0 flex-1"
          aria-label="Search people"
        />
        <button type="submit" className="btn btn-primary">
          Search
        </button>
      </form>

      {users.length === 0 ? (
        <p className="mt-12 py-10 text-center text-sm text-muted">
          No writers found.
        </p>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {users.map((user) => (
            <li key={user.id}>
              <Link
                href={`/u/${user.username}`}
                className="card flex items-center gap-4 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent/15 text-lg font-semibold text-accent">
                  {user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{user.name}</p>
                  <p className="truncate text-sm text-accent">@{user.username}</p>
                  {user.bio && (
                    <p className="mt-1 line-clamp-1 text-xs text-muted">{user.bio}</p>
                  )}
                  <p className="mt-1.5 text-xs text-muted">
                    {user._count.articles} article{user._count.articles === 1 ? "" : "s"}
                    <span aria-hidden="true"> · </span>
                    {user._count.followers} follower{user._count.followers === 1 ? "" : "s"}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}