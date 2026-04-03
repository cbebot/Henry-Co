import { StudioLoginForm } from "@/components/studio/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="mx-auto max-w-[42rem] px-5 py-14 sm:px-8">
      <div className="mb-8 max-w-2xl">
        <div className="studio-kicker">Client and staff access</div>
        <h1 className="studio-heading mt-4">Enter the Studio workspace.</h1>
        <p className="mt-4 text-lg leading-8 text-[var(--studio-ink-soft)]">
          Clients can review proposals and project progress here. Internal teams can manage leads,
          proposals, milestones, payments, revisions, and delivery operations.
        </p>
      </div>
      <StudioLoginForm nextPath={params.next || "/client"} />
    </main>
  );
}
