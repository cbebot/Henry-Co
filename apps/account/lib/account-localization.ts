import type { Recommendation, TaskItem } from "@henryco/intelligence";
import { formatAccountTemplate, type AccountCopy } from "@henryco/i18n";
import type { AccountTrustProfile, TrustTier } from "@/lib/trust";

export function getLocalizedTrustTierLabel(copy: AccountCopy, tier: TrustTier) {
  return copy.trustTierLabels[tier] || tier;
}

export function getLocalizedTrustReasons(
  copy: AccountCopy,
  trust: AccountTrustProfile,
) {
  const reasons: string[] = [];
  const { signals } = trust;

  if (signals.verificationStatus === "verified") {
    reasons.push(copy.security.reasons.verificationApproved);
  } else if (signals.verificationStatus === "pending") {
    reasons.push(copy.security.reasons.verificationPending);
  } else if (signals.verificationStatus === "rejected") {
    reasons.push(copy.security.reasons.verificationRejected);
  } else {
    reasons.push(copy.security.reasons.verificationMissing);
  }

  if (signals.emailVerified) reasons.push(copy.security.reasons.emailVerified);
  if (signals.identityVerified) reasons.push(copy.security.reasons.identityVerified);
  if (signals.verificationStatus === "pending") reasons.push(copy.security.reasons.documentsUnderReview);
  if (signals.verificationStatus === "rejected") reasons.push(copy.security.reasons.verificationNeedsAttention);
  if (signals.phonePresent) reasons.push(copy.security.reasons.phonePresent);
  if (signals.profileCompletion >= 48) reasons.push(copy.security.reasons.profileStrong);
  if (signals.accountAgeDays >= 30) {
    reasons.push(
      formatAccountTemplate(copy.security.reasons.accountHistory, {
        days: signals.accountAgeDays,
      }),
    );
  }
  if (signals.settledTransactions >= 1) reasons.push(copy.security.reasons.transactionHistory);
  if (signals.suspiciousEvents === 0) reasons.push(copy.security.reasons.noRiskSignals);

  return reasons.length ? reasons : [copy.security.baselineReason];
}

export function getLocalizedTrustRequirements(
  copy: AccountCopy,
  trust: AccountTrustProfile,
) {
  const { signals, nextTier } = trust;
  if (!nextTier) return [];

  if (nextTier === "verified") {
    return [
      signals.verificationStatus !== "verified"
        ? copy.security.requirements.verified.verification
        : null,
      !signals.emailVerified ? copy.security.requirements.verified.email : null,
      !signals.identityVerified ? copy.security.requirements.verified.identity : null,
      !signals.phonePresent ? copy.security.requirements.verified.phone : null,
      signals.profileCompletion < 48 ? copy.security.requirements.verified.profile : null,
      signals.duplicateEmailMatches > 0 || signals.duplicatePhoneMatches > 0
        ? copy.security.requirements.verified.overlap
        : null,
    ].filter(Boolean) as string[];
  }

  if (nextTier === "trusted") {
    return [
      signals.verificationStatus !== "verified"
        ? copy.security.requirements.trusted.verification
        : null,
      signals.accountAgeDays < 30 ? copy.security.requirements.trusted.age : null,
      signals.settledTransactions < 1
        ? copy.security.requirements.trusted.transactions
        : null,
      signals.suspiciousEvents > 0 ? copy.security.requirements.trusted.suspicious : null,
      signals.duplicateEmailMatches > 0 || signals.duplicatePhoneMatches > 0
        ? copy.security.requirements.trusted.overlap
        : null,
    ].filter(Boolean) as string[];
  }

  return [
    signals.verificationStatus !== "verified"
      ? copy.security.requirements.premium.verification
      : null,
    signals.accountAgeDays < 90 ? copy.security.requirements.premium.age : null,
    signals.settledTransactions < 3 ? copy.security.requirements.premium.transactions : null,
    signals.duplicateEmailMatches > 0 || signals.duplicatePhoneMatches > 0
      ? copy.security.requirements.premium.overlap
      : null,
  ].filter(Boolean) as string[];
}

export function localizeAccountTask(
  copy: AccountCopy,
  task: TaskItem,
  localizedRequirements: string[],
) {
  if (task.id.startsWith("trust:")) {
    return {
      ...task,
      title: copy.tasks.taskTitles.trust,
      description: localizedRequirements[0] || copy.tasks.taskDescriptions.trustFallback,
    };
  }

  if (task.id.startsWith("wallet-funding:")) {
    return {
      ...task,
      title: copy.tasks.taskTitles.walletFunding,
      description: copy.tasks.taskDescriptions.walletFunding,
    };
  }

  if (task.id.startsWith("support:")) {
    return {
      ...task,
      title: copy.tasks.taskTitles.support,
      description: copy.tasks.taskDescriptions.support,
    };
  }

  if (task.id.startsWith("notifications:")) {
    return {
      ...task,
      title: copy.tasks.taskTitles.notifications,
      description: copy.tasks.taskDescriptions.notifications,
    };
  }

  return task;
}

export function localizeAccountRecommendation(copy: AccountCopy, item: Recommendation) {
  if (item.id === "trust-next") {
    return {
      ...item,
      title: copy.overview.recommendationTitles.trustNext,
      description: copy.overview.recommendationDescriptions.trustNext,
    };
  }

  if (item.id === "profile-next") {
    return {
      ...item,
      title: copy.overview.recommendationTitles.profileNext,
      description: copy.overview.recommendationDescriptions.profileNext,
    };
  }

  if (item.id === "jobs-saved") {
    return {
      ...item,
      title: copy.overview.recommendationTitles.jobsSaved,
      description: copy.overview.recommendationDescriptions.jobsSaved,
    };
  }

  return {
    ...item,
    description: item.description || copy.overview.recommendationDescriptions.fallback,
  };
}

export function getLocalizedBlockedActions(
  copy: AccountCopy,
  trust: AccountTrustProfile,
) {
  const { flags, signals } = trust;
  return [
    !flags.jobsPostingEligible ? copy.security.blockedActions.jobs : null,
    !flags.marketplaceEligible ? copy.security.blockedActions.marketplace : null,
    !flags.propertyPublishingEligible ? copy.security.blockedActions.property : null,
    !flags.payoutEligible ? copy.security.blockedActions.payouts : null,
    !flags.staffElevationEligible ? copy.security.blockedActions.staff : null,
    signals.suspiciousEvents > 0 ? copy.security.blockedActions.financial : null,
    signals.duplicateEmailMatches > 0 || signals.duplicatePhoneMatches > 0
      ? copy.security.blockedActions.overlap
      : null,
  ].filter(Boolean) as string[];
}
