import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { getConversationsForUser } from "@/lib/data";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  const session = await requireUser();
  const conversations = await getConversationsForUser(session.user.id);

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-serif text-3xl font-semibold tracking-tight">Messages</h1>
      <p className="mt-2 text-sm text-muted">
        Encrypted conversations with other writers.
      </p>

      {conversations.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
          <p className="text-sm text-muted">
            No conversations yet. Open a writer&apos;s profile and send them a message.
          </p>
          <Link href="/explore" className="btn btn-primary btn-sm mt-4">
            Explore writers
          </Link>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card">
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <Link
                href={`/messages/${conversation.id}`}
                className="flex items-center gap-3 p-4 transition-colors hover:bg-border/30"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent/15 text-sm font-semibold text-accent">
                  {conversation.other?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={conversation.other.image}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (conversation.other?.name ?? "?").charAt(0).toUpperCase()
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-foreground">
                      {conversation.other?.name ?? "Unknown user"}
                    </p>
                    <span className="shrink-0 text-xs text-muted">
                      {conversation.lastMessage
                        ? new Date(conversation.updatedAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })
                        : ""}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {conversation.lastMessage
                      ? conversation.other?.publicKey
                        ? "Encrypted message"
                        : "Message"
                      : "Say hello"}
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