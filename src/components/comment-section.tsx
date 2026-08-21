"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MarkdownRenderer } from "@/components/markdown";
import { CommentForm } from "@/components/comment-form";

type SerializedComment = {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    username: string | null;
    image: string | null;
  };
};

export function CommentSection({
  articleId,
  comments,
  quoteText,
  signedIn,
  currentUserId,
}: {
  articleId: string;
  comments: SerializedComment[];
  quoteText?: string | null;
  signedIn: boolean;
  currentUserId?: string;
}) {
  const [quoteActive, setQuoteActive] = useState(false);
  const router = useRouter();

  async function handleDelete(commentId: string) {
    await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <section id="comments" className="mt-12 scroll-mt-24">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-2xl font-semibold tracking-tight">
          Comments
          <span className="ml-2 align-middle text-sm font-normal text-muted">
            {comments.length}
          </span>
        </h2>
        {quoteText && (
          <button
            type="button"
            onClick={() => {
              setQuoteActive(true);
              document.getElementById("comment-form")?.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }}
            className="btn btn-outline btn-sm"
          >
            Quote this blog
          </button>
        )}
      </div>

      {signedIn ? (
        <div
          id="comment-form"
          className="mb-8 rounded-2xl border border-border bg-card p-5 scroll-mt-24"
        >
          <CommentForm
            articleId={articleId}
            initialValue={quoteActive && quoteText ? quoteText : ""}
          />
        </div>
      ) : (
        <div className="mb-8 rounded-2xl border border-border bg-card p-5 text-center text-sm text-muted">
          <Link href="/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>{" "}
          to join the conversation.
        </div>
      )}

      {comments.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">
          No comments yet. Start the conversation!
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {comments.map((comment) => (
            <li key={comment.id} className="flex flex-col gap-3 py-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-accent/15 text-xs font-semibold text-accent">
                    {comment.author.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={comment.author.image}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      comment.author.name.charAt(0).toUpperCase()
                    )}
                  </span>
                  <div className="flex flex-wrap items-center gap-x-2 text-sm">
                    <span className="font-medium text-foreground">
                      {comment.author.username ? (
                        <Link
                          href={`/u/${comment.author.username}`}
                          className="hover:text-accent"
                        >
                          {comment.author.name}
                        </Link>
                      ) : (
                        comment.author.name
                      )}
                    </span>
                    <span className="text-xs text-muted">
                      {new Date(comment.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                {currentUserId === comment.author.id && (
                  <button
                    type="button"
                    onClick={() => handleDelete(comment.id)}
                    className="text-xs text-muted transition-colors hover:text-danger"
                  >
                    Delete
                  </button>
                )}
              </div>
              <MarkdownRenderer className="text-[0.95rem]">{comment.content}</MarkdownRenderer>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}