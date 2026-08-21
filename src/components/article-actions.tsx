"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toggleLikeAction, toggleRepostAction } from "@/lib/actions";

type ArticleActionsProps = {
  articleId: string;
  slug: string;
  likeCount: number;
  repostCount: number;
  liked: boolean;
  reposted: boolean;
  signedIn: boolean;
};

export function ArticleActions({
  articleId,
  slug,
  likeCount,
  repostCount,
  liked,
  reposted,
  signedIn,
}: ArticleActionsProps) {
  const [pending, startTransition] = useTransition();
  const [optimisticState, setOptimisticState] = useOptimistic(
    { liked, reposted, likeCount, repostCount },
    (state, action: { type: "like" | "repost" }) => {
      if (action.type === "like") {
        return {
          ...state,
          liked: !state.liked,
          likeCount: state.likeCount + (state.liked ? -1 : 1),
        };
      }
      return {
        ...state,
        reposted: !state.reposted,
        repostCount: state.repostCount + (state.reposted ? -1 : 1),
      };
    }
  );
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  function run(action: "like" | "repost") {
    if (!signedIn) {
      router.push(`/login?next=/articles/${slug}`);
      return;
    }
    const formData = new FormData();
    formData.set("articleId", articleId);
    formData.set("slug", slug);
    setOptimisticState({ type: action });
    startTransition(() => {
      if (action === "like") {
        toggleLikeAction(formData);
      } else {
        toggleRepostAction(formData);
      }
    });
  }

  async function share() {
    const url = `${window.location.origin}/articles/${slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: document.title, url });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const actionBase = "inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors disabled:opacity-50";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => run("like")}
        className={`${actionBase} border border-border hover:border-danger/50 hover:text-danger ${
          optimisticState.liked ? "bg-danger/10 text-danger" : "text-muted"
        }`}
        aria-pressed={optimisticState.liked}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={optimisticState.liked ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
        {optimisticState.likeCount}
      </button>

      <button
        type="button"
        disabled={pending}
        onClick={() => run("repost")}
        className={`${actionBase} border border-border hover:border-accent hover:text-accent ${
          optimisticState.reposted ? "bg-accent/10 text-accent" : "text-muted"
        }`}
        aria-pressed={optimisticState.reposted}
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
          <path d="m17 2 4 4-4 4" />
          <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
          <path d="m7 22-4-4 4-4" />
          <path d="M21 13v1a4 4 0 0 1-4 4H3" />
        </svg>
        {optimisticState.repostCount}
      </button>

      <button
        type="button"
        onClick={share}
        className={`${actionBase} border border-border text-muted hover:border-accent hover:text-accent`}
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
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="m8.59 13.51 6.83 3.98" />
          <path d="m15.41 6.51-6.82 3.98" />
        </svg>
        {copied ? "Link copied!" : "Share"}
      </button>

      {!signedIn && (
        <Link
          href={`/login?next=/articles/${slug}`}
          className="ml-auto text-sm text-muted hover:text-accent"
        >
          Sign in to like & repost
        </Link>
      )}
    </div>
  );
}