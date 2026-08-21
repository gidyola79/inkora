"use client";

import { useOptimistic, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toggleFollowAction } from "@/lib/actions";

export function FollowButton({
  targetUserId,
  username,
  isFollowing,
  followerCount,
  signedIn,
}: {
  targetUserId: string;
  username: string;
  isFollowing: boolean;
  followerCount: number;
  signedIn: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const [optimistic, setOptimistic] = useOptimistic(
    { isFollowing, followerCount },
    (state) => ({
      isFollowing: !state.isFollowing,
      followerCount: state.followerCount + (state.isFollowing ? -1 : 1),
    })
  );

  function handleClick() {
    if (!signedIn) {
      router.push(`/login?next=/u/${username}`);
      return;
    }
    const formData = new FormData();
    formData.set("targetId", targetUserId);
    setOptimistic(null);
    startTransition(() => {
      toggleFollowAction(formData);
    });
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={handleClick}
        className={`btn btn-sm ${
          optimistic.isFollowing ? "btn-outline" : "btn-primary"
        }`}
        aria-pressed={optimistic.isFollowing}
      >
        {optimistic.isFollowing ? "Following" : "Follow"}
      </button>
      <Link
        href={`/u/${username}?tab=followers`}
        className="text-sm text-muted transition-colors hover:text-foreground"
      >
        {optimistic.followerCount} followers
      </Link>
    </div>
  );
}