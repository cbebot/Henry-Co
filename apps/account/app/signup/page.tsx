import SignupForm from "@/components/auth/SignupForm";
import Logo from "@/components/brand/Logo";

export const metadata = { title: "Create Account — Henry & Co." };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const loginHref = params.next ? `/login?next=${encodeURIComponent(params.next)}` : "/login";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--acct-bg)] px-4 py-8">
      <div className="w-full max-w-lg acct-fade-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center">
            <Logo size={48} />
          </div>
          <h1 className="acct-display text-2xl">Create your account</h1>
          <p className="mt-1.5 text-sm text-[var(--acct-muted)]">
            Join the HenryCo ecosystem
          </p>
        </div>

        <SignupForm />

        <p className="mt-6 text-center text-xs text-[var(--acct-muted)]">
          Already have an account?{" "}
          <a href={loginHref} className="font-medium text-[var(--acct-gold)] hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
