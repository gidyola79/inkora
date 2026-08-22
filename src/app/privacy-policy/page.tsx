import Link from "next/link";

export const metadata = {
  title: "Privacy Policy",
  description: "How Inkora collects, uses, and protects your data.",
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

export default function PrivacyPolicyPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <header>
        <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-muted">Last updated: {LAST_UPDATED}</p>
        <p className="mt-4 leading-relaxed text-muted">
          This policy explains what information Inkora collects when you use
          inkorablog.vercel.app (&quot;Inkora&quot;, &quot;we&quot;, &quot;us&quot;), why we collect it, and the choices you have.
          By using Inkora you agree to this policy and our{" "}
          <Link href="/terms-of-service" className="font-medium text-accent underline-offset-4 hover:underline">
            Terms of Service
          </Link>
          .
        </p>
      </header>

      <Section title="Information we collect">
        <ul className="list-disc space-y-1.5 pl-5">
          <li><strong>Account details</strong> - your name, email address, username, password (stored only as a cryptographic hash), and any profile details you add such as a photo or bio.</li>
          <li><strong>Content</strong> - the articles, comments, flashcard sets, and reactions you create.</li>
          <li><strong>Messages</strong> - direct messages between users are end-to-end encrypted. We store only scrambled ciphertext and cannot read them.</li>
          <li><strong>Newsletter subscriptions</strong> - if you subscribe (at sign-up or in the footer), we store your email address for that purpose.</li>
          <li><strong>Usage data</strong> - standard server logs such as IP address, browser type, and pages visited, used for security and reliability.</li>
        </ul>
      </Section>

      <Section title="How we use your information">
        <p>We use your data to operate Inkora: creating and securing your account, showing your content to other readers, sending service emails (verification, welcome, and password-reset messages), delivering the newsletter if you asked for it, notifying you about activity on your articles, and keeping the platform safe from abuse.</p>
      </Section>

      <Section title="Third-party services">
        <p>We rely on a small number of providers to run Inkora:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li><strong>Vercel</strong> - application hosting and delivery.</li>
          <li><strong>Render</strong> - database hosting for your account and content.</li>
          <li><strong>Cloudinary</strong> - storage and delivery of images you upload, such as article covers and profile pictures.</li>
          <li><strong>Brevo</strong> - delivery of transactional email (verification, welcome, password reset) and newsletter messages.</li>
        </ul>
        <p>These providers process data only on our instructions to provide their services.</p>
      </Section>

      <Section title="End-to-end encryption">
        <p>Private chats are encrypted in your browser using keys generated on your device. Your private key never leaves your device except in encrypted form protected by your password. We cannot recover your messages, so please keep your password safe.</p>
      </Section>

      <Section title="Cookies and sessions">
        <p>Inkora uses a single session cookie to keep you signed in. We do not use advertising or cross-site tracking cookies.</p>
      </Section>

      <Section title="Data retention and deletion">
        <p>You can delete your account at any time from your profile settings. Deleting your account permanently removes your articles, comments, flashcards, follows, notifications, and messages. Newsletter subscribers can unsubscribe by writing to us; we remove the address promptly.</p>
      </Section>

      <Section title="Your rights">
        <p>Where applicable law grants you rights of access, correction, export, or erasure of your personal data, you can exercise most of them directly through the app, or contact us for help.</p>
      </Section>

      <Section title="Children">
        <p>Inkora is not directed at children under 13, and we do not knowingly collect their personal information.</p>
      </Section>

      <Section title="Changes to this policy">
        <p>If we change this policy materially, we will announce it on the site and update the date above.</p>
      </Section>

      <Section title="Contact">
        <p>Questions about privacy? Reach us at our support address listed on the site, or raise an issue on our public repository.</p>
      </Section>
    </article>
  );
}
