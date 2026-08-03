import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/clippers/auth";
import { login } from "@/lib/clippers/actions";
import { AuthForm } from "@/components/clippers/forms";

export default async function LoginPage() {
  const user = await getUser();
  if (user)
    redirect(user.role === "admin" ? "/clippers/admin" : "/clippers/dashboard");
  return (
    <div className="mx-auto max-w-sm py-16">
      <h1 className="text-2xl font-bold">Log in</h1>
      <div className="mt-8">
        <AuthForm action={login} mode="login" />
      </div>
      <p className="mt-6 text-sm text-white/50">
        New here?{" "}
        <Link href="/clippers/signup" className="text-cf-orange hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
