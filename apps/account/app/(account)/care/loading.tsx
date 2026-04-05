export default function CareLoading() {
  return (
    <div className="space-y-6">
      <div className="acct-card h-28 animate-pulse" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="acct-card h-28 animate-pulse" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="acct-card h-[38rem] animate-pulse" />
        <div className="acct-card h-[38rem] animate-pulse" />
      </div>
    </div>
  );
}
