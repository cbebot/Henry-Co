import { PropertyLoginForm } from "@/components/property/login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="mx-auto max-w-[42rem] px-5 py-14 sm:px-8">
      <div className="mb-8 max-w-2xl">
        <div className="property-kicker">Property access</div>
        <h1 className="property-heading mt-4">Enter the HenryCo Property workspace.</h1>
        <p className="mt-4 text-lg leading-8 text-[var(--property-ink-soft)]">
          Sign in to save properties, track inquiries, manage viewing requests, submit listings,
          and keep your future HenryCo account history connected across property workflows.
        </p>
      </div>
      <PropertyLoginForm nextPath={params.next || "/account"} />
    </main>
  );
}
