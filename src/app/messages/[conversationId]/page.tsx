import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { getConversationForUser } from "@/lib/data";
import { ChatWindow } from "@/components/chat-window";
import { markMessagesReadSilent } from "@/lib/actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Conversation" };
}

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const session = await requireUser();
  const { conversationId } = await params;

  const conversation = await getConversationForUser(conversationId, session.user.id);
  if (!conversation || !conversation.other) notFound();

  await markMessagesReadSilent(conversationId, session.user.id);

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-4 flex items-center gap-2 text-sm text-muted">
        <Link href="/messages" className="inline-flex items-center gap-1 transition-colors hover:text-foreground">
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
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
          Messages
        </Link>
      </div>

      <ChatWindow
        conversationId={conversation.id}
        myUserId={session.user.id}
        other={conversation.other}
        messages={conversation.messages.map((message) => ({
          id: message.id,
          senderId: message.senderId,
          encryptedContent: message.encryptedContent,
          nonce: message.nonce,
          createdAt: message.createdAt.toISOString(),
        }))}
      />
    </section>
  );
}