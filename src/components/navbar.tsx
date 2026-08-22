import Link from "next/link";
import { requireUserOrNull } from "@/lib/auth-helpers";
import { LogoutButton } from "@/components/logout-button";
import { Logo } from "@/components/logo";
import { MobileMenu } from "@/components/mobile-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { UserProfileButton } from "@/components/user-profile-button";
import {
  getUnreadNotificationCount,
  getRecentNotifications,
} from "@/lib/data";

function NavLinks({
  user,
  mobile = false,
}: {
  user: boolean;
  mobile?: boolean;
}) {
  const linkClass = mobile
    ? "flex w-full items-center justify-start rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-border/40 hover:text-foreground"
    : "btn btn-ghost";
  const ctaClass = mobile
    ? "mt-1 flex w-full items-center justify-center rounded-xl bg-accent px-3 py-2.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
    : "btn btn-primary btn-sm";

  return (
    <>
      <Link href="/explore" className={linkClass}>
        Explore
      </Link>
      <Link href="/search" className={linkClass}>
        Search
      </Link>

      {user && (
        <Link href="/dashboard" className={linkClass}>
          Dashboard
        </Link>
      )}

      {user && (
        <Link href="/dashboard/articles/new" className={ctaClass}>
          Write
        </Link>
      )}

      {!user && (
        <>
          <Link href="/login" className={linkClass}>
            Sign in
          </Link>
          <Link href="/register" className={ctaClass}>
            Get started
          </Link>
        </>
      )}
    </>
  );
}

export async function Navbar() {
  const sessionUser = await requireUserOrNull();
  const user = sessionUser
    ? {
        id: sessionUser.id,
        name: sessionUser.name,
        image: sessionUser.image,
        username: sessionUser.username,
      }
    : null;
  const [unread, notifications] = user
    ? await Promise.all([getUnreadNotificationCount(user.id), getRecentNotifications(user.id)])
    : [0, [] as Awaited<ReturnType<typeof getRecentNotifications>>];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <nav className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Logo />
        </div>

        <div className="hidden items-center gap-1 md:flex">
          <ThemeToggle />
          <NavLinks user={Boolean(user)} />
        </div>

        {user && (
          <div className="hidden items-center gap-1 md:flex">
            <Link
              href="/messages"
              aria-label="Messages"
              className="btn btn-ghost relative"
              title="Messages"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
            </Link>
            <NotificationBell unread={unread} notifications={notifications} />
            <UserProfileButton
              name={user.name ?? "User"}
              image={user.image ?? null}
              username={user.username ?? null}
            />
          </div>
        )}

        {!user && (
          <div className="hidden items-center gap-1 md:flex">
            <Link href="/login" className="btn btn-ghost">
              Sign in
            </Link>
            <Link href="/register" className="btn btn-primary btn-sm">
              Get started
            </Link>
          </div>
        )}

        <MobileMenu>
          <div className="flex items-center justify-between border-b border-border pb-3">
            <ThemeToggle />
          </div>
          <NavLinks user={Boolean(user)} mobile />
          {user && (
            <>
              <Link
                href="/dashboard/activity"
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-border/40 hover:text-foreground"
              >
                Activity
                {unread > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-xs font-semibold text-white">
                    {unread}
                  </span>
                )}
              </Link>
              <Link
                href="/messages"
                className="flex w-full items-center justify-start rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-border/40 hover:text-foreground"
              >
                Messages
              </Link>
              <Link
                href={`/u/${user.username ?? "me"}`}
                className="flex w-full items-center justify-start rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-border/40 hover:text-foreground"
              >
                My profile
              </Link>
              <LogoutButton mobile />
            </>
          )}
        </MobileMenu>
      </nav>
    </header>
  );
}
