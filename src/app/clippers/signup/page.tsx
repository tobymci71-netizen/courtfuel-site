import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/clippers/auth";
import { signup } from "@/lib/clippers/actions";
import { AuthForm } from "@/components/clippers/forms";

export default async function SignupPage() {
  if (await getUser()) redirect("/clippers/dashboard");
  return (
    <div className="mx-auto max-w-sm py-16">
      <h1 className="text-2xl font-bold">Join the clipping program</h1>
      <p className="mt-2 text-sm text-white/60">
        Create an account, then submit your TikTok for approval.
      </p>
      <div className="mt-8">
        <AuthForm action={signup} mode="signup" />
      </div>
      <p className="mt-6 text-sm text-white/50">
        Already in?{" "}
        <Link href="/clippers/login" className="text-cf-orange hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
