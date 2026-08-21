import Link from "next/link";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <section className="mx-auto flex w-full max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <div className="mb-6">
        <Logo />
      </div>
      <p className="font-serif text-6xl font-semibold text-accent">404</p>
      <h1 className="mt-3 font-serif text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
        This page does not exist, or the article you are looking for has been
        unpublished or removed.
      </p>
      <Link href="/" className="btn btn-primary mt-8">
        Back to home
      </Link>
    </section>
  );
}