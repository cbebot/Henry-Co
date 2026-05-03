import { FileUp, MessageCircle, Sparkles } from "lucide-react";
import { HenryCoMonogram } from "@henryco/ui/brand";

type Props = {
  projectName: string;
  /** Resolved team name(s) for the welcome line, e.g. "Adaeze and Ife". */
  teamLabel?: string | null;
};

/**
 * The very first impression of the messaging surface for a new client.
 * Spec: large monogram at low opacity, headline, supporting line,
 * three feature labels, and a generated welcome message from the team.
 *
 * The welcome message is normally seeded via the SQL trigger added in
 * 20260503140000_studio_messaging.sql; this empty state is rendered
 * only when no messages exist yet (e.g. trigger didn't fire because
 * the project transitioned outside the studio_projects insert/update).
 */
export function EmptyThreadState({ projectName, teamLabel }: Props) {
  const welcomeBody = teamLabel
    ? `Welcome to ${projectName}. Your Studio team is ${teamLabel}. We will keep everything organised here — questions, updates, files, and decisions all in one place. Feel free to ask anything.`
    : `Welcome to ${projectName}. We will keep everything organised here — questions, updates, files, and decisions all in one place. Feel free to ask anything.`;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <div className="relative" aria-hidden>
        <div className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-[radial-gradient(circle_at_center,rgba(212,177,78,0.12),transparent_60%)] blur-2xl" />
        <HenryCoMonogram
          accent="#d4b14e"
          size={112}
          className="text-[#d4b14e] opacity-25"
        />
      </div>
      <h2 className="mt-6 max-w-md text-balance text-[20px] font-semibold tracking-[-0.005em] text-[#F5F4EE] sm:text-[22px]">
        Your project conversation starts here.
      </h2>
      <p className="mt-3 max-w-md text-balance text-[14px] leading-relaxed text-white/65">
        Everything about{" "}
        <span className="font-medium text-[#d4b14e]">{projectName}</span> —
        questions, updates, files, and decisions — in one organised place.
      </p>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[12px] text-white/55">
        <FeatureLabel icon={Sparkles} label="Real-time updates" />
        <FeatureLabel icon={FileUp} label="File sharing" />
        <FeatureLabel icon={MessageCircle} label="Direct team access" />
      </div>

      <div className="mt-10 w-full max-w-[420px] rounded-[16px] rounded-bl-[4px] border border-white/[0.06] bg-[#0F1524] p-4 text-left">
        <div className="text-[12px] font-medium uppercase tracking-[0.10em] text-[#d4b14e]">
          HenryCo Studio
          <span className="ml-2 text-[10px] font-medium tracking-[0.10em] text-white/35">
            Welcome
          </span>
        </div>
        <p className="mt-1.5 text-[14px] leading-relaxed text-[#F5F4EE]">
          {welcomeBody}
        </p>
      </div>
    </div>
  );
}

function FeatureLabel({
  icon: Icon,
  label,
}: {
  icon: typeof Sparkles;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-[#d4b14e]" aria-hidden />
      <span>{label}</span>
    </span>
  );
}
