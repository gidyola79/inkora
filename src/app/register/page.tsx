import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-helpers";
import { RegisterForm } from "@/components/register-form";
import { AuthShell } from "@/components/auth-shell";

export const metadata = {
  title: "Create account",
};

export default async function RegisterPage() {
  const session = await getSession();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join Inkora and share ideas worth reading."
    >
      <RegisterForm />
    </AuthShell>
  );
}