import Link from "next/link";

export const metadata = {
  title: "FAQ",
  description: "Quick answers about writing and reading on Inkora.",
};

const FAQS = [
  {
    q: "What is Inkora?",
    a: "Inkora is a home for ideas worth sharing. Anyone can read every published article; create a free account to write, follow writers you like, comment, and chat privately.",
  },
  {
    q: "Is it free?",
    a: "Yes. Reading, writing, publishing, flashcards, and messaging are all free while Inkora is in its early days.",
  },
  {
    q: "How do I find people to follow?",
    a: "Open Explore from the menu. You can search by name or username - with or without the @ - and follow anyone whose work interests you.",
  },
  {
    q: "Are my messages really private?",
    a: "Yes. Chat is end-to-end encrypted on your device: messages are scrambled before they ever leave your browser and only you and the recipient can read them. Not even Inkora can.",
  },
  {
    q: "I forgot my password. What now?",
    a: 'Click "Forgot password?" on the sign-in page, enter your email, and we\'ll send you a reset link. It expires in an hour.',
  },
  {
    q: "Can I delete my account?",
    a: `Yes. Go to your profile settings and use the danger zone at the bottom. This permanently erases your articles, comments, flashcards, and messages.`,
  },
];

export default function FaqPage() {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <header className="mb-8">
        <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          Frequently asked questions
        </h1>
        <p className="mt-2 text-muted">
          Short answers to the things people ask us most.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        {FAQS.map((faq) => (
          <details
            key={faq.q}
            className="group card overflow-hidden p-0 [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-medium transition-colors hover:bg-border/30">
              {faq.q}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180"
                aria-hidden="true"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </summary>
            <p className="border-t border-border px-5 py-4 text-sm leading-relaxed text-muted">
              {faq.a}
            </p>
          </details>
        ))}
      </div>

      <p className="mt-10 text-sm text-muted">
        Still stuck?{" "}
        <Link href="/register" className="font-medium text-accent underline-offset-4 hover:underline">
          Create an account
        </Link>{" "}
        and explore for yourself - or write to us through the contact form coming soon.
      </p>
    </section>
  );
}
