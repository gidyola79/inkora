import { getSession } from "@/lib/auth-helpers";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { AuthShell } from "@/components/auth-shell";

export const metadata = {
  title: "Reset password",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const session = await getSession();
  if (session?.user) {
    return (
      <AuthShell
        title="Reset password"
        subtitle="You're already signed in. Change your password from settings instead."
      >
        <p className="text-center text-sm text-muted">
          Go to your{" "}
          <a href="/dashboard/profile" className="font-medium text-accent underline-offset-4 hover:underline">
            profile settings
          </a>
          .
        </p>
      </AuthShell>
    );
  }

  const { token } = await searchParams;

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Pick something strong - at least 8 characters."
    >
      <ResetPasswordForm token={token ?? ""} />
    </AuthShell>
  );
}
