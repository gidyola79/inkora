import Link from "next/link";
import { Logo } from "@/components/logo";
import { NewsletterForm } from "@/components/newsletter-form";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-start">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-3 text-sm leading-relaxed text-muted">
              A home for ideas worth sharing. Write, publish, and be heard.
            </p>
          </div>

          <NewsletterForm />

          <div className="flex flex-col gap-4 sm:flex-row sm:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                Explore
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link href="/" className="text-muted transition-colors hover:text-foreground">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/search" className="text-muted transition-colors hover:text-foreground">
                    Search
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-muted transition-colors hover:text-foreground">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                Writing
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link
                    href="/register"
                    className="text-muted transition-colors hover:text-foreground"
                  >
                    Start writing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="text-muted transition-colors hover:text-foreground"
                  >
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard"
                    className="text-muted transition-colors hover:text-foreground"
                  >
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                Legal
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link
                    href="/privacy-policy"
                    className="text-muted transition-colors hover:text-foreground"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms-of-service"
                    className="text-muted transition-colors hover:text-foreground"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-border pt-6 text-xs text-muted sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Inkora. All rights reserved.</p>
          <p className="font-serif italic">Write. Publish. Be Heard.</p>
        </div>
      </div>
    </footer>
  );
}
