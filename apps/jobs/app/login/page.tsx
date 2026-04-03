import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--jobs-accent)] text-xl font-bold text-white shadow-lg">
            H
          </div>
          <h1 className="mt-4 jobs-heading !text-[2.5rem]">Sign in to HenryCo Jobs</h1>
          <p className="mt-2 text-sm text-[var(--jobs-muted)]">Candidate, employer, recruiter, and internal hiring access start here.</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
