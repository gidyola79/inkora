import Link from "next/link";

export const metadata = {
  title: "Terms of Service",
  description: "The rules for using Inkora.",
};

export const LAST_UPDATED = "August 22, 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-serif text-xl font-semibold">{title}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-muted">{children}</div>
    </section>
  );
}

export default function TermsOfServicePage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <header>
        <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-muted">Last updated: {LAST_UPDATED}</p>
        <p className="mt-4 leading-relaxed text-muted">
          Welcome to Inkora. These terms govern your use of inkorablog.vercel.app. By
          creating an account or using the site you agree to them and to our{" "}
          <Link href="/privacy-policy" className="font-medium text-accent underline-offset-4 hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </header>

      <Section title="1. Accounts">
        <p>You must provide accurate registration information and keep your password confidential. You are responsible for everything that happens under your account. You must be at least 13 years old to use Inkora.</p>
      </Section>

      <Section title="2. Your content">
        <p>You keep full ownership of everything you write and upload. By publishing on Inkora, you grant us a worldwide, non-exclusive, royalty-free license to store, display, and distribute your content on the platform - for example, showing your articles to readers and rendering your images.</p>
        <p>You are responsible for having the rights to the content you post, including images.</p>
      </Section>

      <Section title="3. Acceptable use">
        <p>You agree not to:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>post unlawful, hateful, harassing, sexually explicit, or infringing content;</li>
          <li>impersonate others or misrepresent your affiliation;</li>
          <li>scrape, reverse-engineer, or disrupt the service or its infrastructure;</li>
          <li>send spam or use Inkora to phish or spread malware;</li>
          <li>attempt to read other users&apos; encrypted messages.</li>
        </ul>
        <p>We may remove content or suspend accounts that breach these rules.</p>
      </Section>

      <Section title="4. Private messaging">
        <p>Inkora chat is end-to-end encrypted. We provide this feature as-is; because we cannot read your messages, we also cannot recover them if you lose access to your device or password.</p>
      </Section>

      <Section title="5. Newsletters and email">
        <p>By creating an account you agree to receive essential transactional email (such as verification and password resets). Marketing emails, including the Inkora letter, are sent only if you opt in, and every message tells you how to stop receiving them.</p>
      </Section>

      <Section title="6. Termination">
        <p>You may stop using Inkora and delete your account at any time. We may suspend or terminate accounts that violate these terms or that create risk or legal exposure for us.</p>
      </Section>

      <Section title="7. Disclaimers">
        <p>Inkora is provided &quot;as is&quot; without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose, and non-infringement. We do not guarantee uninterrupted or error-free operation.</p>
      </Section>

      <Section title="8. Limitation of liability">
        <p>To the maximum extent permitted by law, Inkora and its operators will not be liable for indirect, incidental, special, consequential, or punitive damages, or any loss of data, profits, or goodwill arising from your use of the service.</p>
      </Section>

      <Section title="9. Changes to the service or terms">
        <p>We may update Inkora or these terms over time. When changes are material we will announce them on the site. Continuing to use Inkora after changes take effect means you accept the revised terms.</p>
      </Section>

      <Section title="10. Contact">
        <p>Questions about these terms? Contact us through the channels listed on the site.</p>
      </Section>
    </article>
  );
}
