import LoginForm from "@/components/marketplace/login-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[1.05fr,0.95fr]">
        <section className="market-panel rounded-[2.25rem] p-8 sm:p-10">
          <p className="market-kicker">Marketplace access</p>
          <h1 className="market-display mt-5">Premium commerce with a single HenryCo identity.</h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-[var(--market-muted)]">
            Sign in once to unlock tracked orders, verified payments, seller onboarding, dispute history, saved addresses, followed stores, and future unified-account compatibility across HenryCo services.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              "Buyer-ready order history",
              "Seller application tracking",
              "Operator-grade trust rails",
            ].map((item) => (
              <div key={item} className="market-soft rounded-[1.5rem] px-4 py-5 text-sm font-semibold text-[var(--market-ink)]">
                {item}
              </div>
            ))}
          </div>
        </section>
        <LoginForm />
      </div>
    </div>
  );
}
