import type { StudioBrief } from "@/lib/studio/types";

const CHECK_STATUS_LABEL: Record<string, string> = {
  unconfigured: "not verified yet",
  available: "likely available on last check",
  unavailable: "taken or reserved",
  unknown: "could not verify",
  blocked: "needs a different name",
  error: "check failed—retry from the brief",
};

function checkStatusPhrase(status: string) {
  return CHECK_STATUS_LABEL[status] ?? (status.replace(/_/g, " ") || "not yet verified");
}

/** Plain-language recap for proposal / project surfaces */
export function briefDomainSummary(brief: Pick<StudioBrief, "domainIntent"> | null | undefined): {
  title: string;
  body: string;
} | null {
  const di = brief?.domainIntent;
  if (!di) return null;

  if (di.path === "have") {
    return {
      title: "Web address (domain)",
      body: di.desiredLabel
        ? `You plan to use ${di.desiredLabel}. We connect it when the build is ready—no need to buy another name unless you want one.`
        : "You’ll use an existing domain at launch. HenryCo walks you through DNS when the site is ready.",
    };
  }

  if (di.path === "later") {
    return {
      title: "Web address (domain)",
      body: "You asked to decide the domain later with HenryCo. We’ll shortlist options and confirm availability before anything is purchased.",
    };
  }

  const name = di.desiredLabel?.trim() || "your preferred name";
  const backup = di.backupLabel?.trim();
  const fq = di.checkedFqdn ? ` (${di.checkedFqdn})` : "";
  const status = checkStatusPhrase(di.checkStatus);
  const backupPhrase = backup ? ` Backup idea: ${backup}.` : "";
  return {
    title: "Preferred web address",
    body: `Working name: ${name}${fq}. Last check: ${status}.${backupPhrase} Final registration is always confirmed with you before purchase.`,
  };
}
