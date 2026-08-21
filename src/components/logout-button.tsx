"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

export function LogoutButton({ mobile = false }: { mobile?: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      await signOut();
      router.push("/");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isPending}
      className={
        mobile
          ? "flex w-full items-center justify-start rounded-xl px-3 py-2.5 text-left text-sm font-medium text-muted transition-colors hover:bg-border/40 hover:text-foreground disabled:opacity-50"
          : "btn btn-ghost disabled:opacity-50"
      }
    >
      {isPending ? "Signing out…" : "Sign out"}
    </button>
  );
}