import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getUserByUsername,
  getFollowStats,
  isFollowing,
  getUserFollowers,
  getUserFollowing,
} from "@/lib/data";
import { requireUserOrNull } from "@/lib/auth-helpers";
import { FollowButton } from "@/components/follow-button";
import { MessageUserButton } from "@/components/message-user-button";
import { ArticleCard } from "@/components/article-card";
import { BackButton } from "@/components/back-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const user = await getUserByUsername(username);
  if (!user) return { title: "Profile not found" };
  return { title: `${user.name} (@${user.username})` };
}

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { username } = await params;
  const { tab } = await searchParams;

  const user = await getUserByUsername(username);
  if (!user) notFound();

  const currentUser = await requireUserOrNull();
  const isOwnProfile = currentUser?.id === user.id;

  const [followStats, following, followers, followingUsers] = await Promise.all([
    getFollowStats(user.id),
    isFollowing(currentUser?.id ?? "", user.id),
    getUserFollowers(user.id),
    getUserFollowing(user.id),
  ]);

  const activeTab = tab === "followers" ? "followers" : tab === "following" ? "following" : "articles";

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-4">
        <BackButton fallbackHref="/explore" label="Back" />
      </div>
      <div className="card overflow-hidden">
        <div className="h-28 bg-gradient-to-br from-accent/40 via-accent/15 to-card" aria-hidden="true" />
        <div className="flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-card bg-accent/15 text-2xl font-semibold text-accent shadow-sm">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </span>
            <div className="pb-1">
              <h1 className="font-serif text-2xl font-semibold tracking-tight">
                {user.name}
              </h1>
              <p className="text-sm text-muted">@{user.username}</p>
              {user.bio && (
                <p className="mt-1.5 max-w-md text-sm leading-relaxed text-foreground">
                  {user.bio}
                </p>
              )}
              {user.website && (
                <a href={user.website} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-accent underline-offset-4 hover:underline">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                  {user.website.replace(/^https?:\/\//, "")}
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isOwnProfile ? (
              <>
                <MessageUserButton otherUserId={user.id} signedIn={Boolean(currentUser)} />
                <FollowButton
                  targetUserId={user.id}
                  username={user.username ?? user.id}
                  isFollowing={Boolean(following)}
                  followerCount={followStats.followers}
                  signedIn={Boolean(currentUser)}
                />
              </>
            ) : (
              <Link href="/dashboard/profile" className="btn btn-outline btn-sm">
                Edit profile
              </Link>
            )}
          </div>
        </div>
      </div>

      <nav className="mt-8 flex gap-1 overflow-x-auto border-b border-border" aria-label="Profile sections">
        {[
          { key: "articles", label: `Articles (${user.articles.length})`, href: `/u/${username}` },
          { key: "followers", label: `Followers (${followStats.followers})`, href: `/u/${username}?tab=followers` },
          { key: "following", label: `Following (${followStats.following})`, href: `/u/${username}?tab=following` },
        ].map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={`-mb-px shrink-0 rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === item.key
                ? "border border-b-transparent border-border bg-card text-foreground"
                : "text-muted hover:text-foreground"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {activeTab === "articles" && (
        <div className="mt-8">
          {user.articles.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">No published articles yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {user.articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "followers" && (
        <div className="mt-8">
          {followers.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">No followers yet.</p>
          ) : (
            <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
              {followers.map((follow) => (
                <li key={follow.id} className="flex items-center justify-between gap-3 p-4">
                  <Link href={`/u/${follow.follower.username}`} className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-accent/15 text-xs font-semibold text-accent">
                      {follow.follower.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={follow.follower.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        follow.follower.name.charAt(0).toUpperCase()
                      )}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{follow.follower.name}</p>
                      <p className="text-xs text-muted">@{follow.follower.username}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {activeTab === "following" && (
        <div className="mt-8">
          {followingUsers.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">Not following anyone yet.</p>
          ) : (
            <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
              {followingUsers.map((follow) => (
                <li key={follow.id} className="flex items-center justify-between gap-3 p-4">
                  <Link href={`/u/${follow.following.username}`} className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-accent/15 text-xs font-semibold text-accent">
                      {follow.following.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={follow.following.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        follow.following.name.charAt(0).toUpperCase()
                      )}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{follow.following.name}</p>
                      <p className="text-xs text-muted">@{follow.following.username}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}