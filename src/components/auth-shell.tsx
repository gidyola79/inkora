import Link from "next/link";
import { Logo } from "@/components/logo";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="auth-scene flex flex-col">
      <div aria-hidden="true">
        <div className="auth-blob auth-blob-1" />
        <div className="auth-blob auth-blob-2" />
        <div className="auth-blob auth-blob-3" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <Link
          href="/"
          className="text-sm font-medium text-muted transition-colors hover:text-foreground"
        >
          Back home
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-16 pt-6 sm:pb-24">
        <div className="w-full max-w-md">
          <div className="glass-panel p-7 sm:p-9">
            <h1 className="mb-1.5 font-serif text-[1.7rem] font-semibold leading-tight tracking-tight">
              {title}
            </h1>
            <p className="mb-7 text-sm leading-relaxed text-muted">{subtitle}</p>
            {children}
          </div>

          <p className="mt-6 text-center text-xs text-muted">
            Inkora — ideas worth reading, written well.
          </p>
        </div>
      </main>
    </div>
  );
}