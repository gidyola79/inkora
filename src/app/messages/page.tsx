import type { Metadata } from "next";
import { requireUser } from "@/lib/auth-helpers";
import { getConversationsForUser, isUserOnline } from "@/lib/data";
import { ConversationList } from "@/components/conversation-list";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  const session = await requireUser();
  const conversations = await getConversationsForUser(session.user.id);

  const enriched = conversations.map((c) => ({
    ...c,
    otherOnline: isUserOnline(c.other as unknown as { showOnlineStatus: boolean | null; lastSeenAt: Date | null }),
  }));

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-serif text-3xl font-semibold tracking-tight">Messages</h1>
      <p className="mt-2 text-sm text-muted">Encrypted conversations with other writers.</p>
      <ConversationList conversations={enriched as never} myId={session.user.id} />
    </section>
  );
}