import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/profile-form";
import { EmailForm } from "@/components/email-form";
import { PasswordForm } from "@/components/password-form";
import { DangerZone } from "@/components/danger-zone";
import { E2eeSetup } from "@/components/e2ee-setup";
import { OnlineToggle } from "@/components/online-toggle";

export const metadata: Metadata = { title: "Profile settings" };

export default async function ProfileSettingsPage() {
  const session = await requireUser();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
      select: {
      name: true,
      username: true,
      bio: true,
      image: true,
      dob: true,
      phone: true,
      gender: true,
      publicKey: true,
      showOnlineStatus: true,
    },
  });

  if (!user) return null;

  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-6 flex items-center gap-2 text-sm text-muted">
        <Link href="/dashboard" className="transition-colors hover:text-foreground">
          Dashboard
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-foreground">Profile</span>
      </div>

      <h1 className="font-serif text-3xl font-semibold tracking-tight">
        Profile settings
      </h1>
      <p className="mt-2 text-sm text-muted">
        Manage how others see you and how you sign in.
      </p>

      <div className="card mt-8 p-6">
        <ProfileForm
          name={user.name}
          username={user.username ?? ""}
          bio={user.bio ?? ""}
          image={user.image ?? ""}
          dob={
            user.dob
              ? new Date(user.dob.getTime() - user.dob.getTimezoneOffset() * 60000)
                  .toISOString()
                  .slice(0, 10)
              : ""
          }
          phone={user.phone ?? ""}
          gender={user.gender ?? ""}
        />
      </div>

      <div className="card mt-6 p-6">
        <EmailForm currentEmail={session.user.email} />
      </div>

      <div className="card mt-6 p-6">
        <PasswordForm />
      </div>

      <div className="mt-6">
        <E2eeSetup hasPublicKey={Boolean(user.publicKey)} />
      </div>

      <div className="mt-6">
        <OnlineToggle enabled={Boolean(user.showOnlineStatus)} />
      </div>

      <div className="card mt-6 border-danger/40 p-6">
        <DangerZone />
      </div>
    </section>
  );
}