"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { decryptMessage, getPrivateKeyJwk } from "@/lib/e2ee";

type Other = {
  id: string;
  name: string;
  image: string | null;
  username: string | null;
  publicKey: string | null;
  showOnlineStatus: boolean | null;
  lastSeenAt: Date | string | null;
} | null;

type LastMessage = {
  id: string;
  senderId: string;
  encryptedContent: string;
  nonce: string;
  createdAt: Date | string;
  deliveredAt: Date | string | null;
  readAt: Date | string | null;
} | null;

type Conv = {
  id: string;
  other: Other;
  lastMessage: LastMessage;
  updatedAt: Date | string;
  otherOnline: boolean;
};

function Preview({
  lastMessage,
  other,
  myId,
}: {
  lastMessage: LastMessage;
  other: Other;
  myId: string;
}) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    if (!lastMessage) {
      setText(null);
      return;
    }
    if (!other?.publicKey) {
      setText("Message");
      return;
    }
    const jwk = getPrivateKeyJwk();
    if (!jwk) {
      setText("Encrypted message");
      return;
    }
    let cancelled = false;
    decryptMessage(jwk, other.publicKey, lastMessage.encryptedContent, lastMessage.nonce)
      .then((t) => {
        if (cancelled) return;
        if (t.startsWith("data:image/")) setText("📷 Image");
        else setText(t.length > 32 ? t.slice(0, 32) + "…" : t);
      })
      .catch(() => {
        if (!cancelled) setText("Encrypted message");
      });
    return () => {
      cancelled = true;
    };
  }, [lastMessage?.id, other?.publicKey]);

  if (!lastMessage) return <span className="text-xs text-muted">Say hello</span>;
  if (text === null) return <span className="text-xs text-muted">Encrypted message</span>;

  const isMine = lastMessage.senderId === myId;
  return (
    <span className="flex items-center gap-1 truncate text-xs text-muted">
      {isMine && <span className="shrink-0">{text === "📷 Image" ? "You: 📷 Image" : `You: ${text}`}</span>}
      {!isMine && <span className="truncate">{text}</span>}
    </span>
  );
}

function Tick({ lastMessage, myId }: { lastMessage: LastMessage; myId: string }) {
  if (!lastMessage || lastMessage.senderId !== myId) return null;
  const read = Boolean(lastMessage.readAt);
  const delivered = Boolean(lastMessage.deliveredAt);
  if (read) {
    return (
      <span className="shrink-0 text-sky-500" aria-label="Read">
        <svg viewBox="0 0 16 11" className="h-3 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M1 5.5L5 9L11 1" /><path d="M6 5.5L10 9L15 1" />
        </svg>
      </span>
    );
  }
  if (delivered) {
    return (
      <span className="shrink-0 text-muted" aria-label="Delivered">
        <svg viewBox="0 0 16 11" className="h-3 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M1 5.5L5 9L11 1" /><path d="M6 5.5L10 9L15 1" />
        </svg>
      </span>
    );
  }
  return (
    <span className="shrink-0 text-muted" aria-label="Sent">
      <svg viewBox="0 0 16 11" className="h-3 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M1 5.5L5 9L11 1" />
      </svg>
    </span>
  );
}

export function ConversationList({ conversations, myId }: { conversations: Conv[]; myId: string }) {
  if (conversations.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
        <p className="text-sm text-muted">No conversations yet. Open a writer&apos;s profile and send them a message.</p>
        <Link href="/explore" className="btn btn-primary btn-sm mt-4">Explore writers</Link>
      </div>
    );
  }
  return (
    <ul className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card">
      {conversations.map((c) => (
        <li key={c.id}>
          <Link href={`/messages/${c.id}`} className="flex items-center gap-3 p-4 transition-colors hover:bg-border/30">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent/15 text-sm font-semibold text-accent">
              {c.other?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.other.image} alt="" className="h-full w-full object-cover" />
              ) : (
                (c.other?.name ?? "?").charAt(0).toUpperCase()
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium text-foreground">{c.other?.name ?? "Unknown user"}</p>
                <span className="shrink-0 text-xs text-muted">
                  {c.lastMessage ? new Date(c.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : ""}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-1.5">
                <Tick lastMessage={c.lastMessage} myId={myId} />
                <div className="min-w-0 flex-1 truncate">
                  <Preview lastMessage={c.lastMessage} other={c.other} myId={myId} />
                </div>
                {c.otherOnline && <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" title="Online" />}
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
