import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-helpers";
import { LoginForm } from "@/components/login-form";
import { AuthShell } from "@/components/auth-shell";

export const metadata = {
  title: "Sign in",
};

export default async function LoginPage() {
  const session = await getSession();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to write and publish on Inkora.">
      <LoginForm />
    </AuthShell>
  );
}