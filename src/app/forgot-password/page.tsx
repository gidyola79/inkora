import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-helpers";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { AuthShell } from "@/components/auth-shell";

export const metadata = {
  title: "Forgot password",
};

export default async function ForgotPasswordPage() {
  const session = await getSession();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter the email you signed up with and we'll send you a reset link."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
