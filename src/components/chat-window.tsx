"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendMessageAction } from "@/lib/actions";
import {
  encryptMessage,
  decryptMessage,
  getPrivateKeyJwk,
} from "@/lib/e2ee";
import { EmojiPicker } from "@/components/emoji-picker";

type OtherUser = {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
  publicKey: string | null;
};

type EncryptedMessage = {
  id: string;
  senderId: string;
  encryptedContent: string;
  nonce: string;
  createdAt: string;
};

type DecryptedMessage = EncryptedMessage & { text: string };

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

async function compressImageToDataUrl(file: File, maxDimension = 1280): Promise<string> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable.");
    context.drawImage(bitmap, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    bitmap.close();
  }
}

type ChatWindowProps = {
  conversationId: string;
  myUserId: string;
  other: OtherUser;
  messages: EncryptedMessage[];
};

export function ChatWindow({ conversationId, myUserId, other, messages }: ChatWindowProps) {
  const [decrypted, setDecrypted] = useState<DecryptedMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastMessageId = messages.at(-1)?.id ?? "";

  const privateKeyJwk = typeof window !== "undefined" ? getPrivateKeyJwk() : null;
  const canSend = Boolean(privateKeyJwk && other.publicKey);

  const setupError = !privateKeyJwk
    ? "Encrypted messaging isn't set up on this device. Enable it in your profile settings."
    : !other.publicKey
      ? "This user hasn't set up encrypted messaging yet. Ask them to enable it in their profile settings."
      : null;

  useEffect(() => {
    if (!privateKeyJwk || !other.publicKey) return;

    const myKey = privateKeyJwk;
    const theirPublicKey = other.publicKey;
    let cancelled = false;
    async function run() {
      const result = await Promise.all(
        messages.map(async (message) => {
          try {
            const text = await decryptMessage(
              myKey,
              theirPublicKey,
              message.encryptedContent,
              message.nonce
            );
            return { ...message, text };
          } catch {
            return { ...message, text: "[Unable to decrypt this message]" };
          }
        })
      );
      if (!cancelled) {
        setDecrypted(result);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [privateKeyJwk, other.publicKey, lastMessageId, messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [decrypted.length]);

  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(interval);
  }, [router]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !canSend) return;

    const optimistic: DecryptedMessage = {
      id: `optimistic-${Date.now()}`,
      senderId: myUserId,
      encryptedContent: "",
      nonce: "",
      createdAt: new Date().toISOString(),
      text,
    };
    setDecrypted((current) => [...current, optimistic]);
    setDraft("");
    setSendError(null);

    startTransition(async () => {
      try {
        const { encryptedContent, nonce } = await encryptMessage(
          privateKeyJwk!,
          other.publicKey!,
          text
        );
        const formData = new FormData();
        formData.set("conversationId", conversationId);
        formData.set("encryptedContent", encryptedContent);
        formData.set("nonce", nonce);
        await sendMessageAction(formData);
        router.refresh();
      } catch {
        setSendError("Couldn't encrypt and send that message. Please try again.");
        setDecrypted((current) => current.filter((m) => m.id !== optimistic.id));
      }
    });
  }

  function insertEmojiAtCursor(emoji: string) {
    const textarea = textareaRef.current;
    if (!textarea) {
      setDraft((current) => current + emoji);
      return;
    }
    const start = textarea.selectionStart ?? draft.length;
    const end = textarea.selectionEnd ?? draft.length;
    const next = draft.slice(0, start) + emoji + draft.slice(end);
    setDraft(next);
    requestAnimationFrame(() => {
      textarea.focus();
      const caret = start + emoji.length;
      textarea.setSelectionRange(caret, caret);
    });
  }

  function handleSendImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !canSend || uploadingImage) return;

    setUploadingImage(true);
    setSendError(null);
    startTransition(async () => {
      try {
        if (file.size > MAX_IMAGE_BYTES) {
          throw new Error("Image must be smaller than 10 MB.");
        }
        if (!file.type.startsWith("image/")) {
          throw new Error("Only image files can be sent.");
        }
        const dataUrl = await compressImageToDataUrl(file);
        const { encryptedContent, nonce } = await encryptMessage(
          privateKeyJwk!,
          other.publicKey!,
          dataUrl
        );
        const formData = new FormData();
        formData.set("conversationId", conversationId);
        formData.set("encryptedContent", encryptedContent);
        formData.set("nonce", nonce);
        await sendMessageAction(formData);
        router.refresh();
      } catch (error) {
        setSendError(
          error instanceof Error
            ? error.message
            : "Couldn't encrypt and send that image. Please try again."
        );
      } finally {
        setUploadingImage(false);
      }
    });
  }

  return (
    <div className="flex h-[calc(100dvh-16rem)] min-h-[28rem] flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-accent/15 text-xs font-semibold text-accent">
          {other.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={other.image} alt="" className="h-full w-full object-cover" />
          ) : (
            other.name.charAt(0).toUpperCase()
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {other.username ? (
              <Link href={`/u/${other.username}`} className="hover:text-accent">
                {other.name}
              </Link>
            ) : (
              other.name
            )}
          </p>
          <p className="text-xs text-accent">
            {canSend ? "End-to-end encrypted" : "Encryption not set up"}
          </p>
        </div>
      </div>

      {setupError ? (
        <div className="flex flex-1 items-center justify-center p-6 text-center">
          <div className="max-w-sm">
            <p className="text-sm text-muted">{setupError}</p>
            {!privateKeyJwk && (
              <Link href="/dashboard/profile" className="btn btn-primary btn-sm mt-4">
                Set up encryption
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {decrypted.length === 0 && (
            <p className="py-8 text-center text-sm text-muted">
              No messages yet. Say hello!
            </p>
          )}
          {decrypted.map((message) => {
            const isMine = message.senderId === myUserId;
            const isImage = message.text.startsWith("data:image/");
            return (
              <div
                key={message.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    isMine
                      ? "rounded-br-md bg-accent text-accent-foreground"
                      : "rounded-bl-md bg-border/60 text-foreground"
                  }`}
                >
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={message.text}
                      alt="Shared image"
                      className="max-h-72 w-auto max-w-full rounded-lg"
                    />
                  ) : (
                    <p className="whitespace-pre-wrap break-words">{message.text}</p>
                  )}
                  <p
                    className={`mt-1 text-[10px] ${
                      isMine ? "text-accent-foreground/70" : "text-muted"
                    }`}
                  >
                    {new Date(message.createdAt).toLocaleTimeString(undefined, {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-border p-3">
        <div className="flex items-center gap-1 pb-1">
          <EmojiPicker title="Insert emoji" onPick={insertEmojiAtCursor} disabled={!canSend} />
          <label
            title="Send image"
            aria-label="Send image"
            className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-border/50 hover:text-foreground ${
              !canSend || uploadingImage || pending
                ? "pointer-events-none opacity-50"
                : ""
            }`}
          >
            {uploadingImage ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
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
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
            )}
            <span className="sr-only">Send an encrypted image</span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={!canSend || uploadingImage || pending}
              onChange={handleSendImage}
            />
          </label>
        </div>
        {sendError && (
          <p className="w-full text-xs text-danger">{sendError}</p>
        )}
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={canSend ? "Type an encrypted message…" : "Encryption isn't available yet"}
          disabled={!canSend || pending}
          rows={1}
          className="input min-h-11 flex-1 resize-none py-2.5"
        />
        <button
          type="submit"
          disabled={!canSend || pending || !draft.trim()}
          className="btn btn-primary"
        >
          Send
        </button>
      </form>
    </div>
  );
}