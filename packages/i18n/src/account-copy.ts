import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";
import {
  ACCOUNT_COPY_AR,
  ACCOUNT_COPY_ES,
  ACCOUNT_COPY_PT,
} from "./account-copy-promoted";

export type AccountCopy = {
  trustTierLabels: {
    basic: string;
    verified: string;
    trusted: string;
    premium_verified: string;
  };
  common: {
    source: string;
    viewAll: string;
    unread: string;
    defaultBadge: string;
    noReceiptYet: string;
    unknownCustomer: string;
    page: string;
    of: string;
    perPage: string;
    previous: string;
    next: string;
    filtered: string;
    bookingSingular: string;
    bookingPlural: string;
    justNow: string;
  };
  overview: {
    welcomeBack: string;
    description: string;
    walletBalance: string;
    walletHint: string;
    notifications: string;
    allCaughtUp: string;
    unreadMessages: string;
    activeSubscriptions: string;
    noActivePlans: string;
    syncedPlans: string;
    trustTier: string;
    scoreLabel: string;
    businessActionsUnlocked: string;
    moreVerificationNeeded: string;
    invoices: string;
    pending: string;
    allSettled: string;
    support: string;
    newReplies: string;
    openRequests: string;
    noOpenRequests: string;
    referrals: string;
    inviteAndEarn: string;
    shareHenryCo: string;
    transactions: string;
    viewHistory: string;
    walletActivity: string;
    blockingLabel: string;
    highPriorityLabel: string;
    actionCenterHint: string;
    attentionKicker: string;
    attentionTitle: string;
    pendingWalletVerification: string;
    pendingWalletVerificationDetail: string;
    unreadNotificationsAttention: string;
    unreadNotificationsAttentionDetail: string;
    activePlansInMotion: string;
    activePlansInMotionDetail: string;
    unlockTier: string;
    nextTierFallback: string;
    quickActions: string;
    addMoney: string;
    getHelp: string;
    bookCare: string;
    shop: string;
    actionCenter: string;
    actionCenterDescription: string;
    noUrgentTasks: string;
    viewTaskQueue: string;
    smartRecommendations: string;
    smartRecommendationsEmpty: string;
    recommendationReason: string;
    recentActivity: string;
    noRecentActivity: string;
    recentNotifications: string;
    noNotifications: string;
    yourServices: string;
    careService: string;
    careServiceDescription: string;
    marketplaceService: string;
    marketplaceServiceDescription: string;
    jobsService: string;
    jobsServiceDescription: string;
    studioService: string;
    studioServiceDescription: string;
    recommendationTitles: {
      trustNext: string;
      profileNext: string;
      jobsSaved: string;
    };
    recommendationDescriptions: {
      trustNext: string;
      profileNext: string;
      jobsSaved: string;
      fallback: string;
    };
  };
  tasks: {
    title: string;
    description: string;
    queueTitle: string;
    queueBody: string;
    emptyTitle: string;
    emptyDescription: string;
    blocking: string;
    priorityLabels: {
      low: string;
      normal: string;
      high: string;
      urgent: string;
    };
    taskTitles: {
      trust: string;
      walletFunding: string;
      support: string;
      notifications: string;
    };
    taskDescriptions: {
      trustFallback: string;
      walletFunding: string;
      support: string;
      notifications: string;
    };
  };
  security: {
    title: string;
    description: string;
    trustProfile: string;
    trustDescription: string;
    trustScore: string;
    signalLabels: {
      emailVerified: string;
      identityStatus: string;
      trustedPhone: string;
      profileCompletion: string;
      suspiciousEvents: string;
      contactReview: string;
    };
    signalValues: {
      confirmed: string;
      needsAttention: string;
      verified: string;
      underReview: string;
      needsResubmission: string;
      notSubmitted: string;
      present: string;
      missing: string;
      manualReview: string;
      clear: string;
    };
    whyYouAreHere: string;
    topTrustLaneReached: string;
    topTrustLaneDescription: string;
    baselineReason: string;
    whatUnlocks: string;
    regionalContext: string;
    accountStatus: string;
    needsReview: string;
    secure: string;
    email: string;
    accountHistory: string;
    historyDays: string;
    operationalAccess: string;
    higherTrustAvailable: string;
    moreVerificationNeeded: string;
    trustGuide: string;
    whatCurrentStateMeans: string;
    whatCurrentStateBody: string;
    whatToDoNext: string;
    whatToDoNextBody: string;
    currentRestrictions: string;
    noRestrictions: string;
    recentActivity: string;
    recentActivityDescription: string;
    emptyTitle: string;
    emptyDescription: string;
    risk: string;
    blockedActions: {
      jobs: string;
      marketplace: string;
      property: string;
      payouts: string;
      staff: string;
      financial: string;
      overlap: string;
    };
    reasons: {
      verificationApproved: string;
      verificationPending: string;
      verificationRejected: string;
      verificationMissing: string;
      emailVerified: string;
      identityVerified: string;
      documentsUnderReview: string;
      verificationNeedsAttention: string;
      phonePresent: string;
      profileStrong: string;
      accountHistory: string;
      transactionHistory: string;
      noRiskSignals: string;
    };
    requirements: {
      verified: {
        verification: string;
        email: string;
        identity: string;
        phone: string;
        profile: string;
        overlap: string;
      };
      trusted: {
        verification: string;
        age: string;
        transactions: string;
        suspicious: string;
        overlap: string;
      };
      premium: {
        verification: string;
        age: string;
        transactions: string;
        activity: string;
        overlap: string;
      };
    };
  };
  changePassword: {
    passwordsDoNotMatch: string;
    passwordTooShort: string;
    success: string;
    unavailable: string;
    newPassword: string;
    confirmNewPassword: string;
    minPlaceholder: string;
    repeatPlaceholder: string;
    updating: string;
    updatePassword: string;
  };
  globalSignOut: {
    title: string;
    description: string;
    note: string;
    unavailable: string;
    ending: string;
    endAllSessions: string;
  };
  errorBoundary: {
    kicker: string;
    title: string;
    description: string;
    reload: string;
    contactSupport: string;
  };
  activity: {
    title: string;
    description: string;
    emptyTitle: string;
    emptyDescription: string;
    statusLabels: {
      pending: string;
      open: string;
      updated: string;
      completed: string;
      resolved: string;
      paid: string;
      failed: string;
      active: string;
      refunded: string;
    };
    filters: {
      heading: string;
      reset: string;
      fromLabel: string;
      toLabel: string;
      amountFromLabel: string;
      amountToLabel: string;
      divisionEyebrow: string;
      typeEyebrow: string;
      statusEyebrow: string;
      pdfNote: string;
      downloadLabel: string;
      downloadFilename: string;
      shareTitle: string;
      typeLabels: {
        payment: string;
        wallet_credit: string;
        wallet_debit: string;
        refund: string;
        withdrawal: string;
        fee: string;
      };
    };
  };
  notifications: {
    metadata: {
      title: string;
      description: string;
    };
    hero: {
      eyebrow: string;
      ariaOverview: string;
      ariaVolume: string;
      ariaByDivision: string;
      headlineZero: string;
      headlineOne: string;
      headlineFew: string;
      headlineMany: string;
      blurbZero: string;
      blurbStale: string;
      blurbToday: string;
      tileUnreadLabel: string;
      tileUnreadFoot: string;
      tileTodayLabel: string;
      tileTodayFoot: string;
      tileWeekLabel: string;
      tileWeekFoot: string;
      byDivision: string;
      emptyDivisions: string;
      lastActivityFallback: string;
      justNow: string;
      minutesAgo: string;
      hoursAgo: string;
      daysAgo: string;
    };
    inbox: {
      heading: string;
      meta: string;
    };
    filters: {
      all: string;
      unread: string;
      allSources: string;
      activeFilter: string;
    };
    feed: {
      unreadSectionKicker: string;
      unreadSectionTitle: string;
      recentSectionKicker: string;
      recentSectionTitle: string;
      unreadBadge: string;
      openMessageBoard: string;
    };
    swipe: {
      archive: string;
      delete: string;
      markRead: string;
      markUnread: string;
    };
    emptyState: {
      inboxTitle: string;
      inboxBody: string;
      filterTitle: string;
      filterBody: string;
    };
    markAllRead: {
      label: string;
      pending: string;
      spinner: string;
    };
    footer: {
      recentlyDeleted: string;
    };
  };
  calendar: {
    metaTitle: string;
    metaDescription: string;
    heroAriaLabel: string;
    heroEyebrow: string;
    tileVolumeAriaLabel: string;
    tileEventsLabel: string;
    tileEventsFoot: string;
    tilePortalsLabel: string;
    tilePortalsFootEmpty: string;
    tilePortalsFootSingular: string;
    tilePortalsFootPlural: string;
    tileNextLabel: string;
    tileNextEmpty: string;
    sideAriaLabel: string;
    sideLabel: string;
    sideTitleEmpty: string;
    sideTitleSingular: string;
    sideTitlePlural: string;
    sideBody: string;
    agendaTitle: string;
    agendaAriaLabel: string;
    agendaMetaEmpty: string;
    agendaMetaSingular: string;
    agendaMetaPlural: string;
    emptyEyebrow: string;
    emptyTitle: string;
    emptyBody: string;
    dayMetaSingular: string;
    dayMetaPlural: string;
    eventTimeAriaLabel: string;
    eventCta: string;
    headline: {
      empty: string;
      calmOne: string;
      calmMany: string;
      busy: string;
      packed: string;
    };
    blurb: {
      empty: string;
      calm: string;
      busyOrPacked: string;
    };
    kindLabels: {
      care_booking: string;
      property_viewing: string;
      jobs_interview: string;
      learn_class: string;
      studio_milestone: string;
      logistics_pickup: string;
      logistics_delivery: string;
      room_session: string;
    };
    dayLabels: {
      today: string;
      tomorrow: string;
      yesterday: string;
    };
    portalLabels: {
      care: string;
      property: string;
      jobs: string;
      studio: string;
      learn: string;
      logistics: string;
    };
  };
  invoices: {
    metadata: {
      title: string;
      description: string;
    };
    hero: {
      eyebrow: string;
      ariaOverview: string;
      ariaTotals: string;
      ariaByDivision: string;
      headlineEmpty: string;
      headlineWithReceipts: string;
      blurb: string;
      totalPaidLabel: string;
      thisMonthLabel: string;
      thisMonthFoot: string;
      outstandingLabel: string;
      paidCountUnit: string;
      pendingCountUnit: string;
      overdueCountUnit: string;
      byDivision: string;
      byDivisionEmpty: string;
    };
    section: {
      title: string;
      receiptsOnFileSingular: string;
      receiptsOnFilePlural: string;
    };
    empty: {
      title: string;
      description: string;
    };
    statuses: {
      paid: string;
      pending: string;
      overdue: string;
      draft: string;
      cancelled: string;
      refunded: string;
      fallback: string;
    };
    list: {
      ariaLabel: string;
      fallbackTitle: string;
      rowAriaLabel: string;
    };
    divisions: {
      account: string;
      wallet: string;
      marketplace: string;
      studio: string;
      jobs: string;
      learn: string;
      property: string;
      logistics: string;
      care: string;
      fallback: string;
    };
    footerNote: string;
  };
  wallet: {
    hero: {
      ariaLabel: string;
      eyebrow: string;
      availableLabel: string;
      balanceAriaTemplate: string;
      settlementFallback: string;
      ctas: {
        fund: string;
        withdraw: string;
      };
      tiles: {
        verifiedLabel: string;
        verifiedFoot: string;
        pendingFundingLabel: string;
        pendingFundingFoot: string;
        pendingWithdrawalLabel: string;
        pendingWithdrawalFoot: string;
      };
    };
    sections: {
      actionsTitle: string;
      actionsMeta: string;
      pendingTitle: string;
      pendingMeta: string;
      flowTitle: string;
      flowMeta: string;
      fundingTitle: string;
      fundingMetaTemplate: string;
      activityTitle: string;
      activityMetaTemplate: string;
    };
    quickActions: {
      ariaLabel: string;
      addFundsLabel: string;
      addFundsDesc: string;
      withdrawLabel: string;
      withdrawDesc: string;
      paymentsLabel: string;
      paymentsDesc: string;
      receiptsLabel: string;
      receiptsDesc: string;
    };
    pendingOps: {
      fundingKicker: string;
      fundingDescEmpty: string;
      fundingDescSingular: string;
      fundingDescPlural: string;
      fundingCta: string;
      withdrawalKicker: string;
      withdrawalDescEmpty: string;
      withdrawalDescSingular: string;
      withdrawalDescPlural: string;
      withdrawalCta: string;
    };
    spend: {
      figureAriaLabel: string;
      last30Eyebrow: string;
      byDivisionEyebrow: string;
      distributionAriaLabel: string;
      trendFlat: string;
      trendBelowTemplate: string;
      trendAboveTemplate: string;
      trendTitleTemplate: string;
    };
    trust: {
      ariaLabel: string;
      heading: string;
      identityTitle: string;
      identityDescDoneTemplate: string;
      identityDescTodoTemplate: string;
      identityCta: string;
      pinTitle: string;
      pinDescDone: string;
      pinDescTodo: string;
      pinCta: string;
      payoutTitle: string;
      payoutDescSingular: string;
      payoutDescPluralTemplate: string;
      payoutDescEmpty: string;
      payoutCtaManage: string;
      payoutCtaAdd: string;
      verificationLabels: {
        verified: string;
        pending: string;
        rejected: string;
        notSubmitted: string;
      };
    };
    activity: {
      ariaLabel: string;
      emptyTitle: string;
      emptyBody: string;
      fallbackTitle: string;
    };
    funding: {
      proofUploaded: string;
      awaitingProof: string;
      ariaLabelTemplate: string;
    };
    statusLabels: {
      pending: string;
      awaiting_proof: string;
      awaiting_review: string;
      in_review: string;
      rejected: string;
      cancelled: string;
      expired: string;
      completed: string;
      verified: string;
      approved: string;
      paid: string;
    };
  };
};

const EN: AccountCopy = {
  trustTierLabels: {
    basic: "Basic",
    verified: "Verified",
    trusted: "Trusted",
    premium_verified: "Premium Verified",
  },
  common: {
    source: "Source",
    viewAll: "View all",
    unread: "Unread",
    defaultBadge: "Default",
    noReceiptYet: "No receipt yet",
    unknownCustomer: "Customer",
    page: "Page",
    of: "of",
    perPage: "per page",
    previous: "Previous",
    next: "Next",
    filtered: "filtered",
    bookingSingular: "booking",
    bookingPlural: "bookings",
    justNow: "Just now",
  },
  overview: {
    welcomeBack: "Welcome back",
    description: "Your HenryCo command center — everything across all divisions, one place.",
    walletBalance: "Wallet Balance",
    walletHint: "Shared wallet · Use across HenryCo services",
    notifications: "Notifications",
    allCaughtUp: "All caught up",
    unreadMessages: "Unread messages",
    activeSubscriptions: "Active Subscriptions",
    noActivePlans: "No synced active plans",
    syncedPlans: "Synced active plans",
    trustTier: "Trust Tier",
    scoreLabel: "Score",
    businessActionsUnlocked: "Business actions unlocked",
    moreVerificationNeeded: "More verification needed",
    invoices: "Invoices",
    pending: "pending",
    allSettled: "All settled",
    support: "Support",
    newReplies: "with new replies",
    openRequests: "Open requests",
    noOpenRequests: "No open requests",
    referrals: "Referrals",
    inviteAndEarn: "Invite & earn",
    shareHenryCo: "Share HenryCo with others",
    transactions: "Transactions",
    viewHistory: "View history",
    walletActivity: "Wallet activity & payments",
    blockingLabel: "blocking",
    highPriorityLabel: "high-priority next steps",
    actionCenterHint:
      "Your Action Center is prioritized from live trust, wallet, support, and notification signals.",
    attentionKicker: "What Needs Your Attention",
    attentionTitle: "In progress, waiting on you, or still unresolved",
    pendingWalletVerification: "Pending wallet verification",
    pendingWalletVerificationDetail:
      "Your wallet proof is still waiting for finance confirmation.",
    unreadNotificationsAttention: "Unread notifications",
    unreadNotificationsAttentionDetail: "Unread updates are still waiting for your review.",
    activePlansInMotion: "Active plans in motion",
    activePlansInMotionDetail: "Subscriptions are currently running on this account.",
    unlockTier: "Unlock {tier}",
    nextTierFallback:
      "Your next trust tier needs stronger verification and cleaner account history.",
    quickActions: "Quick Actions",
    addMoney: "Add money",
    getHelp: "Get help",
    bookCare: "Book care",
    shop: "Shop",
    actionCenter: "Action Center",
    actionCenterDescription:
      "Start with blocking items first, then clear high-priority steps to keep your account fully operational.",
    noUrgentTasks:
      "No urgent account tasks right now. You are in a healthy operating state.",
    viewTaskQueue: "View full task queue",
    smartRecommendations: "Smart Recommendations",
    smartRecommendationsEmpty:
      "Keep using HenryCo services and recommendations will adapt to your activity.",
    recommendationReason:
      "Suggested from your account activity and trust state ({confidence} confidence)",
    recentActivity: "Recent Activity",
    noRecentActivity: "No recent activity yet",
    recentNotifications: "Notifications",
    noNotifications: "No notifications yet",
    yourServices: "Your Services",
    careService: "Care",
    careServiceDescription: "Fabric care, cleaning & upkeep",
    marketplaceService: "Marketplace",
    marketplaceServiceDescription: "Shop products & sell online",
    jobsService: "Jobs",
    jobsServiceDescription: "Applications, saved roles & recruiter updates",
    studioService: "Studio",
    studioServiceDescription: "Creative & design services",
    recommendationTitles: {
      trustNext: "Complete your trust verification",
      profileNext: "Finish your profile",
      jobsSaved: "Follow up on saved roles",
    },
    recommendationDescriptions: {
      trustNext: "Unlock more actions across HenryCo.",
      profileNext:
        "A complete profile improves support and service continuity.",
      jobsSaved: "Revisit the roles you already saved and act on them.",
      fallback:
        "Keep using HenryCo services and recommendations will adapt to your activity.",
    },
  },
  tasks: {
    title: "Tasks",
    description: "Prioritized actions across account, trust, wallet, and support.",
    queueTitle: "How this queue works",
    queueBody:
      "Blocking tasks can prevent access to important workflows. High-priority items are next-best actions to keep your account healthy and avoid delays.",
    emptyTitle: "No active tasks",
    emptyDescription:
      "You’re currently clear. Tasks will appear here when action is needed.",
    blocking: "blocking",
    priorityLabels: {
      low: "low",
      normal: "normal",
      high: "high",
      urgent: "urgent",
    },
    taskTitles: {
      trust: "Complete trust verification steps",
      walletFunding: "Follow up on pending wallet funding",
      support: "Reply to open support threads",
      notifications: "Review unread notifications",
    },
    taskDescriptions: {
      trustFallback: "Upgrade trust tier to unlock more capabilities.",
      walletFunding: "Your proof is waiting for finance confirmation.",
      support: "Open support conversations still need your attention.",
      notifications: "Unread updates are waiting for review.",
    },
  },
  security: {
    title: "Security",
    description:
      "Review recent security activity, change your password, and end HenryCo sessions when needed.",
    trustProfile: "Trust Profile",
    trustDescription:
      "Trust is operational across the account. It now controls higher-value business actions, moderation posture, and stronger eligibility across HenryCo modules.",
    trustScore: "Account trust score",
    signalLabels: {
      emailVerified: "Verified email",
      identityStatus: "Identity status",
      trustedPhone: "Trusted phone",
      profileCompletion: "Profile completion",
      suspiciousEvents: "Suspicious events",
      contactReview: "Contact review",
    },
    signalValues: {
      confirmed: "Confirmed",
      needsAttention: "Needs attention",
      verified: "Verified",
      underReview: "Under review",
      needsResubmission: "Needs resubmission",
      notSubmitted: "Not submitted",
      present: "Present",
      missing: "Missing",
      manualReview: "Manual review",
      clear: "Clear",
    },
    whyYouAreHere: "Why you are here",
    topTrustLaneReached: "Top trust lane reached",
    topTrustLaneDescription:
      "This account already meets the current highest trust lane available in the shared dashboard.",
    baselineReason: "Your baseline account profile is active.",
    whatUnlocks: "What unlocks {tier}",
    regionalContext: "Regional context",
    accountStatus: "Account status",
    needsReview: "Needs review",
    secure: "Secure",
    email: "Email",
    accountHistory: "Account history",
    historyDays: "{days} days of account history",
    operationalAccess: "Operational access",
    higherTrustAvailable:
      "Higher-trust business and payout actions available",
    moreVerificationNeeded: "More verification needed",
    trustGuide: "Trust state guide",
    whatCurrentStateMeans: "What your current state means",
    whatCurrentStateBody:
      "This state determines access to higher-value workflows and business actions across HenryCo.",
    whatToDoNext: "What to do next",
    whatToDoNextBody:
      "Complete the listed requirements to unlock the next trust lane.",
    currentRestrictions: "Currently restricted actions",
    noRestrictions:
      "No trust-based restrictions are currently blocking your core account workflows.",
    recentActivity: "Recent Security Activity",
    recentActivityDescription:
      "Sign-ins, sign-outs, device fingerprints, and suspicious access signals are recorded here so session continuity remains reviewable even before separate per-device revoke controls ship.",
    emptyTitle: "No recent security activity",
    emptyDescription:
      "Sign-ins, session closures, alerts, and sensitive account changes will appear here.",
    risk: "risk",
    blockedActions: {
      jobs: "Create verified jobs or higher-trust listings",
      marketplace: "Access full marketplace seller privileges",
      property:
        "Publish property-owner workflows without added identity review",
      payouts:
        "Use payout and finance-sensitive actions without review",
      staff:
        "Use staff-sensitive or finance-sensitive elevation paths without stronger identity proof",
      financial: "Use sensitive financial workflows without review",
      overlap:
        "Use higher-trust seller, property-publishing, or payout workflows until contact review clears",
    },
    reasons: {
      verificationApproved: "Identity verification is approved.",
      verificationPending:
        "Identity verification has been submitted and is under review.",
      verificationRejected:
        "Identity verification needs more information before higher-trust actions can unlock.",
      verificationMissing:
        "Identity verification has not been completed yet.",
      emailVerified: "Email ownership is verified.",
      identityVerified:
        "Document-backed identity verification is complete.",
      documentsUnderReview:
        "Identity documents are currently under review.",
      verificationNeedsAttention:
        "Identity verification needs attention before the strongest trust lanes can unlock.",
      phonePresent: "A contact phone is on file.",
      profileStrong:
        "Profile completion is strong enough for verified workflows.",
      accountHistory: "Account history spans {days} days.",
      transactionHistory: "Verified transaction history exists.",
      noRiskSignals:
        "No recent high-risk security events were found.",
    },
    requirements: {
      verified: {
        verification:
          "Complete identity verification so trust-based lanes stop relying on optimistic profile signals.",
        email: "Verify your email address.",
        identity:
          "Complete identity verification for seller, property, payout, and finance-sensitive workflows.",
        phone: "Add a usable phone number.",
        profile: "Complete more of your profile and add proof documents.",
        overlap:
          "A shared contact detail needs manual trust review before higher-trust actions unlock.",
      },
      trusted: {
        verification:
          "Identity verification approval is required before trusted seller, employer, property, and payout lanes can unlock.",
        age: "Build more account age before trusted status unlocks.",
        transactions:
          "Complete at least one verified transaction or funding cycle.",
        suspicious:
          "Keep the account clear of suspicious access warnings.",
        overlap:
          "Resolve contact overlap review before trusted seller, payout, or property lanes unlock.",
      },
      premium: {
        verification:
          "Premium trust is reserved for accounts that have already passed identity verification.",
        age: "Maintain a longer clean account history.",
        transactions: "Build a stronger verified transaction record.",
        activity: "Use more HenryCo divisions with clean outcomes.",
        overlap:
          "Keep duplicate-contact review clear before premium trust can be granted.",
      },
    },
  },
  changePassword: {
    passwordsDoNotMatch: "Passwords do not match",
    passwordTooShort: "Password must be at least 8 characters",
    success: "Your password has been updated.",
    unavailable:
      "We couldn’t update your password right now. Please try again.",
    newPassword: "New password",
    confirmNewPassword: "Confirm new password",
    minPlaceholder: "Min. 8 characters",
    repeatPlaceholder: "Repeat new password",
    updating: "Updating password...",
    updatePassword: "Update password",
  },
  globalSignOut: {
    title: "End every HenryCo session",
    description:
      "This signs the current account out across HenryCo divisions and devices, then returns you to the account login surface.",
    note:
      "Recent device and session activity stays visible below even though live per-device revocation is not yet exposed as a separate control.",
    unavailable:
      "We couldn’t end every HenryCo session right now. Try again in a moment.",
    ending: "Ending all sessions...",
    endAllSessions: "Sign out all HenryCo sessions",
  },
  errorBoundary: {
    kicker: "Account runtime",
    title: "This account surface hit a client or rendering fault",
    description:
      "The failure has been captured for investigation. Reload this surface and continue from the last stable state.",
    reload: "Reload this view",
    contactSupport: "Contact support",
  },
  activity: {
    title: "Activity",
    description: "Everything you’ve done across all HenryCo divisions.",
    emptyTitle: "No activity yet",
    emptyDescription:
      "Your cross-division activity will appear here as you use HenryCo services.",
    statusLabels: {
      pending: "Pending",
      open: "Open",
      updated: "Updated",
      completed: "Completed",
      resolved: "Resolved",
      paid: "Paid",
      failed: "Failed",
      active: "Active",
      refunded: "Refunded",
    },
    filters: {
      heading: "Filter & download",
      reset: "Reset",
      fromLabel: "From",
      toLabel: "To",
      amountFromLabel: "Amount from (₦)",
      amountToLabel: "Amount to (₦)",
      divisionEyebrow: "Division",
      typeEyebrow: "Type",
      statusEyebrow: "Status",
      pdfNote:
        "The PDF carries every filter you set above as part of the document header — what you see is what you download.",
      downloadLabel: "Download statement",
      downloadFilename: "HenryCo-Transaction-History.pdf",
      shareTitle: "HenryCo Transaction History",
      typeLabels: {
        payment: "payment",
        wallet_credit: "wallet credit",
        wallet_debit: "wallet debit",
        refund: "refund",
        withdrawal: "withdrawal",
        fee: "fee",
      },
    },
  },
  notifications: {
    metadata: {
      title: "Notifications",
      description: "Every HenryCo update — wallet, support, jobs, marketplace, care, and more — in one live inbox.",
    },
    hero: {
      eyebrow: "HenryCo · live notifications",
      ariaOverview: "Notifications overview",
      ariaVolume: "Notification volume",
      ariaByDivision: "By division",
      headlineZero: "Inbox zero across HenryCo.",
      headlineOne: "One thing wants your attention.",
      headlineFew: "{count} notifications to triage.",
      headlineMany: "{count} updates across your divisions.",
      blurbZero: "Anything HenryCo sends arrives here in real time — wallet, support, jobs, marketplace, care, and more.",
      blurbStale: "Older items have stacked up. Swipe to archive, tap to open, or jump straight to a thread.",
      blurbToday: "{count} arrived today. Use the filters to focus on a single division, or sweep through unread only.",
      tileUnreadLabel: "Unread",
      tileUnreadFoot: "Awaiting your eyes",
      tileTodayLabel: "Today",
      tileTodayFoot: "Arrived in the last 24h",
      tileWeekLabel: "This week",
      tileWeekFoot: "Last activity {when}",
      byDivision: "By division",
      emptyDivisions: "Nothing has arrived yet.",
      lastActivityFallback: "no recent activity",
      justNow: "just now",
      minutesAgo: "{count}m ago",
      hoursAgo: "{count}h ago",
      daysAgo: "{count}d ago",
    },
    inbox: {
      heading: "Inbox",
      meta: "Tap to open, swipe to archive — filters work across every division.",
    },
    filters: {
      all: "All",
      unread: "Unread",
      allSources: "All sources",
      activeFilter: "active filter",
    },
    feed: {
      unreadSectionKicker: "Unread",
      unreadSectionTitle: "Needs your attention",
      recentSectionKicker: "Recent",
      recentSectionTitle: "Cleared or reviewed activity",
      unreadBadge: "Unread",
      openMessageBoard: "Open message board",
    },
    swipe: {
      archive: "Archive",
      delete: "Delete",
      markRead: "Mark as read",
      markUnread: "Mark as unread",
    },
    emptyState: {
      inboxTitle: "All caught up.",
      inboxBody: "Activity from across HenryCo surfaces here as it happens.",
      filterTitle: "No activity in this view.",
      filterBody: "Try a different filter.",
    },
    markAllRead: {
      label: "Mark all read",
      pending: "Marking all read...",
      spinner: "Marking all read",
    },
    footer: {
      recentlyDeleted: "Recently deleted",
    },
  },
  calendar: {
    metaTitle: "Calendar · HenryCo",
    metaDescription:
      "Cross-portal agenda — care bookings, property viewings, jobs interviews, studio milestones, learn classes, logistics windows.",
    heroAriaLabel: "Calendar overview",
    heroEyebrow: "HenryCo · cross-portal calendar",
    tileVolumeAriaLabel: "Calendar volume",
    tileEventsLabel: "Events",
    tileEventsFoot: "Next 28 days",
    tilePortalsLabel: "Portals",
    tilePortalsFootEmpty: "Care, property, jobs, studio, learn, logistics",
    tilePortalsFootSingular: "One division scheduled",
    tilePortalsFootPlural: "{count} divisions scheduled",
    tileNextLabel: "Next up",
    tileNextEmpty: "Nothing scheduled in the window",
    sideAriaLabel: "By portal",
    sideLabel: "By portal",
    sideTitleEmpty: "No scheduling yet",
    sideTitleSingular: "One portal active",
    sideTitlePlural: "{count} portals in the mix",
    sideBody:
      "Bookings, viewings, interviews, milestones, classes and dispatch windows all surface here in chronological order.",
    agendaTitle: "Agenda",
    agendaAriaLabel: "Scheduled events by day",
    agendaMetaEmpty: "Nothing scheduled in the 28-day window",
    agendaMetaSingular: "{count} event · next 28 days",
    agendaMetaPlural: "{count} events · next 28 days",
    emptyEyebrow: "Calendar quiet",
    emptyTitle: "Nothing scheduled in the next 28 days.",
    emptyBody:
      "Anything you book — a care pickup, a property viewing, a hiring interview, a learn class, a studio milestone, a logistics window — will land in this agenda automatically. Filter chips will appear once portals begin scheduling.",
    dayMetaSingular: "{count} event",
    dayMetaPlural: "{count} events",
    eventTimeAriaLabel: "Event time",
    eventCta: "Open",
    headline: {
      empty: "Nothing scheduled in the next 28 days.",
      calmOne: "One thing on the agenda.",
      calmMany: "{count} events in the next 28 days.",
      busy: "{count} events scheduled across {portals} portals.",
      packed: "{count} events queued — block focus time wisely.",
    },
    blurb: {
      empty:
        "Care bookings, property viewings, jobs interviews, studio milestones, learn classes and logistics windows all surface here.",
      calm: "Tap a card to jump to its portal. The agenda will refresh automatically as new scheduling lands.",
      busyOrPacked:
        "Filter chips at the top of the agenda narrow to a single portal — useful when one division is loud.",
    },
    kindLabels: {
      care_booking: "Care booking",
      property_viewing: "Property viewing",
      jobs_interview: "Interview",
      learn_class: "Live class",
      studio_milestone: "Studio milestone",
      logistics_pickup: "Pickup window",
      logistics_delivery: "Delivery window",
      room_session: "Room session",
    },
    dayLabels: {
      today: "Today",
      tomorrow: "Tomorrow",
      yesterday: "Yesterday",
    },
    portalLabels: {
      care: "Care",
      property: "Property",
      jobs: "Jobs",
      studio: "Studio",
      learn: "Learn",
      logistics: "Logistics",
    },
  },
  invoices: {
    metadata: {
      title: "Invoices & Receipts",
      description: "Your payment history and downloadable receipts.",
    },
    hero: {
      eyebrow: "Invoices · receipts",
      ariaOverview: "Invoices overview",
      ariaTotals: "Financial totals",
      ariaByDivision: "By division",
      headlineEmpty: "Receipts will land here.",
      headlineWithReceipts: "Every receipt, one place.",
      blurb:
        "Every payment across HenryCo arrives here as a branded, downloadable PDF — care bookings, marketplace orders, studio invoices, logistics shipments, learn certificates.",
      totalPaidLabel: "Total paid · lifetime",
      thisMonthLabel: "Paid · this month",
      thisMonthFoot: "Receipts dated this calendar month",
      outstandingLabel: "Outstanding",
      paidCountUnit: "receipts",
      pendingCountUnit: "pending",
      overdueCountUnit: "overdue",
      byDivision: "By division",
      byDivisionEmpty: "No invoices yet.",
    },
    section: {
      title: "All invoices",
      receiptsOnFileSingular: "receipt on file",
      receiptsOnFilePlural: "receipts on file",
    },
    empty: {
      title: "No invoices yet",
      description:
        "Your invoices and receipts will appear here after making payments across HenryCo services.",
    },
    statuses: {
      paid: "Paid",
      pending: "Pending",
      overdue: "Overdue",
      draft: "Draft",
      cancelled: "Cancelled",
      refunded: "Refunded",
      fallback: "Status pending",
    },
    list: {
      ariaLabel: "Invoices",
      fallbackTitle: "Invoice {number}",
      rowAriaLabel: "Invoice {number} for ₦{amount}",
    },
    divisions: {
      account: "Account",
      wallet: "Wallet",
      marketplace: "Marketplace",
      studio: "Studio",
      jobs: "Jobs",
      learn: "Learn",
      property: "Property",
      logistics: "Logistics",
      care: "Care",
      fallback: "Account",
    },
    footerNote: "Receipts download as branded PDFs.",
  },
  wallet: {
    hero: {
      ariaLabel: "Wallet balance",
      eyebrow: "HenryCo wallet · live",
      availableLabel: "Available balance",
      balanceAriaTemplate: "Available balance {amount} {currency}",
      settlementFallback: "Settled into your local currency at the day's HenryCo rate.",
      ctas: { fund: "Fund wallet", withdraw: "Withdraw" },
      tiles: {
        verifiedLabel: "Verified balance",
        verifiedFoot: "Spendable across HenryCo services",
        pendingFundingLabel: "Pending funding",
        pendingFundingFoot: "Sits separately until finance confirms",
        pendingWithdrawalLabel: "Held for withdrawal",
        pendingWithdrawalFoot: "Reserved until payout clears",
      },
    },
    sections: {
      actionsTitle: "Wallet actions",
      actionsMeta: "Add, withdraw, pay, reconcile",
      pendingTitle: "Pending operations",
      pendingMeta: "Kept separate from your available balance",
      flowTitle: "How your money flows",
      flowMeta: "Last 30 days · last 6 months · by division",
      fundingTitle: "Recent funding requests",
      fundingMetaTemplate: "{count} in review",
      activityTitle: "Activity",
      activityMetaTemplate: "Latest {count}",
    },
    quickActions: {
      ariaLabel: "Wallet quick actions",
      addFundsLabel: "Add funds",
      addFundsDesc: "Bank transfer with proof upload and instant confirmation.",
      withdrawLabel: "Withdraw",
      withdrawDesc: "Move available balance to a verified bank account.",
      paymentsLabel: "Payments",
      paymentsDesc: "Recent charges, refunds and saved methods.",
      receiptsLabel: "Receipts & invoices",
      receiptsDesc: "Branded PDFs across every division.",
    },
    pendingOps: {
      fundingKicker: "Pending funding",
      fundingDescEmpty: "Funds you transfer in stay here until finance confirms the bank reference.",
      fundingDescSingular: "{count} request sitting in review — proof keeps the queue moving.",
      fundingDescPlural: "{count} requests sitting in review — proof keeps the queue moving.",
      fundingCta: "Open funding lane",
      withdrawalKicker: "Pending withdrawals",
      withdrawalDescEmpty: "Withdrawals queue up here while finance reviews them — your available balance is never double-promised.",
      withdrawalDescSingular: "{count} withdrawal awaiting payout. Reserved off your available balance.",
      withdrawalDescPlural: "{count} withdrawals awaiting payout. Reserved off your available balance.",
      withdrawalCta: "Open withdrawal lane",
    },
    spend: {
      figureAriaLabel: "Spend over the last 6 months",
      last30Eyebrow: "Spend · last 30 days",
      byDivisionEyebrow: "By division",
      distributionAriaLabel: "Spend distribution by division",
      trendFlat: "Flat",
      trendBelowTemplate: "{pct}% below prior 30d",
      trendAboveTemplate: "{pct}% above prior 30d",
      trendTitleTemplate: "vs prior 30 days (₦{amount})",
    },
    trust: {
      ariaLabel: "Withdrawal readiness",
      heading: "Withdrawal readiness",
      identityTitle: "Identity verified",
      identityDescDoneTemplate: "{label}. Required for withdrawal payouts.",
      identityDescTodoTemplate: "{label}. Complete it once to unlock withdrawals.",
      identityCta: "Continue →",
      pinTitle: "Withdrawal PIN",
      pinDescDone: "Your withdrawal PIN is set.",
      pinDescTodo: "Set a 4-digit PIN to authorise every withdrawal.",
      pinCta: "Set PIN →",
      payoutTitle: "Payout method",
      payoutDescSingular: "1 verified method on file.",
      payoutDescPluralTemplate: "{count} verified methods on file.",
      payoutDescEmpty: "Add a bank account to receive withdrawals.",
      payoutCtaManage: "Manage →",
      payoutCtaAdd: "Add method →",
      verificationLabels: {
        verified: "Identity verified",
        pending: "Verification in review",
        rejected: "Verification needs another submission",
        notSubmitted: "Identity not yet submitted",
      },
    },
    activity: {
      ariaLabel: "Wallet transactions",
      emptyTitle: "No transactions yet",
      emptyBody: "Top up your wallet and your activity feed will populate here with every credit, debit, refund and bonus across HenryCo services.",
      fallbackTitle: "Wallet transaction",
    },
    funding: {
      proofUploaded: "Proof uploaded",
      awaitingProof: "Awaiting proof",
      ariaLabelTemplate: "Funding request {reference} for ₦{amount}",
    },
    statusLabels: {
      pending: "Awaiting review",
      awaiting_proof: "Awaiting proof",
      awaiting_review: "Awaiting review",
      in_review: "In review",
      rejected: "Rejected",
      cancelled: "Cancelled",
      expired: "Expired",
      completed: "Confirmed",
      verified: "Confirmed",
      approved: "Approved",
      paid: "Paid out",
    },
  },
};

const FR: DeepPartial<AccountCopy> = {
  trustTierLabels: {
    basic: "Basique",
    verified: "Vérifié",
    trusted: "Fiable",
    premium_verified: "Premium vérifié",
  },
  common: {
    source: "Source",
    viewAll: "Voir tout",
    unread: "Non lu",
    defaultBadge: "Par défaut",
    noReceiptYet: "Aucun reçu pour l’instant",
    unknownCustomer: "Client",
    page: "Page",
    of: "sur",
    perPage: "par page",
    previous: "Précédent",
    next: "Suivant",
    filtered: "filtré",
    bookingSingular: "réservation",
    bookingPlural: "réservations",
    justNow: "À l’instant",
  },
  overview: {
    welcomeBack: "Bon retour",
    description:
      "Votre centre de commande HenryCo — tout, dans toutes les divisions, au même endroit.",
    walletBalance: "Solde du portefeuille",
    walletHint: "Portefeuille partagé · Utilisable dans tous les services HenryCo",
    notifications: "Notifications",
    allCaughtUp: "Tout est à jour",
    unreadMessages: "Messages non lus",
    activeSubscriptions: "Abonnements actifs",
    noActivePlans: "Aucun abonnement actif synchronisé",
    syncedPlans: "Abonnements actifs synchronisés",
    trustTier: "Niveau de confiance",
    scoreLabel: "Score",
    businessActionsUnlocked: "Actions business débloquées",
    moreVerificationNeeded: "Plus de vérification nécessaire",
    invoices: "Factures",
    pending: "en attente",
    allSettled: "Tout est réglé",
    support: "Support",
    newReplies: "avec de nouvelles réponses",
    openRequests: "Demandes ouvertes",
    noOpenRequests: "Aucune demande ouverte",
    referrals: "Parrainages",
    inviteAndEarn: "Inviter et gagner",
    shareHenryCo: "Partager HenryCo avec d’autres",
    transactions: "Transactions",
    viewHistory: "Voir l’historique",
    walletActivity: "Activité du portefeuille et paiements",
    blockingLabel: "bloquant",
    highPriorityLabel: "prochaines étapes prioritaires",
    actionCenterHint:
      "Votre centre d’action est priorisé à partir des signaux en direct de confiance, portefeuille, support et notifications.",
    attentionKicker: "Ce qui demande votre attention",
    attentionTitle: "En cours, en attente de vous, ou encore non résolu",
    pendingWalletVerification: "Vérification du portefeuille en attente",
    pendingWalletVerificationDetail:
      "Votre preuve de portefeuille attend encore la confirmation de la finance.",
    unreadNotificationsAttention: "Notifications non lues",
    unreadNotificationsAttentionDetail:
      "Des mises à jour non lues attendent encore votre revue.",
    activePlansInMotion: "Abonnements en cours",
    activePlansInMotionDetail:
      "Des abonnements sont actuellement actifs sur ce compte.",
    unlockTier: "Débloquer {tier}",
    nextTierFallback:
      "Votre prochain niveau de confiance exige une vérification plus solide et un historique plus propre.",
    quickActions: "Actions rapides",
    addMoney: "Ajouter de l’argent",
    getHelp: "Obtenir de l’aide",
    bookCare: "Réserver Care",
    shop: "Acheter",
    actionCenter: "Centre d’action",
    actionCenterDescription:
      "Commencez par les éléments bloquants, puis videz les étapes prioritaires pour garder votre compte pleinement opérationnel.",
    noUrgentTasks:
      "Aucune tâche urgente pour le moment. Votre compte est dans un état sain.",
    viewTaskQueue: "Voir la file complète",
    smartRecommendations: "Recommandations intelligentes",
    smartRecommendationsEmpty:
      "Continuez à utiliser les services HenryCo et les recommandations s’adapteront à votre activité.",
    recommendationReason:
      "Suggéré à partir de votre activité de compte et de votre état de confiance ({confidence} de confiance)",
    recentActivity: "Activité récente",
    noRecentActivity: "Aucune activité récente",
    recentNotifications: "Notifications",
    noNotifications: "Aucune notification",
    yourServices: "Vos services",
    careService: "Care",
    careServiceDescription: "Entretien textile, nettoyage et suivi",
    marketplaceService: "Marketplace",
    marketplaceServiceDescription: "Acheter des produits et vendre en ligne",
    jobsService: "Jobs",
    jobsServiceDescription:
      "Candidatures, rôles sauvegardés et mises à jour recruteur",
    studioService: "Studio",
    studioServiceDescription: "Services créatifs et design",
    recommendationTitles: {
      trustNext: "Finalisez votre vérification de confiance",
      profileNext: "Complétez votre profil",
      jobsSaved: "Revenez sur vos rôles sauvegardés",
    },
    recommendationDescriptions: {
      trustNext: "Débloquez davantage d’actions sur HenryCo.",
      profileNext:
        "Un profil complet améliore la continuité du support et des services.",
      jobsSaved:
        "Reprenez les rôles que vous avez déjà sauvegardés et passez à l’action.",
      fallback:
        "Continuez à utiliser HenryCo et les recommandations s’adapteront à votre activité.",
    },
  },
  tasks: {
    title: "Tâches",
    description:
      "Actions priorisées sur le compte, la confiance, le portefeuille et le support.",
    queueTitle: "Comment fonctionne cette file",
    queueBody:
      "Les tâches bloquantes peuvent empêcher l’accès à des flux importants. Les éléments prioritaires sont les meilleures prochaines actions pour garder votre compte sain et éviter les retards.",
    emptyTitle: "Aucune tâche active",
    emptyDescription:
      "Rien n’est en attente pour le moment. Les tâches apparaîtront ici quand une action sera nécessaire.",
    blocking: "bloquant",
    priorityLabels: {
      low: "faible",
      normal: "normal",
      high: "élevée",
      urgent: "urgente",
    },
    taskTitles: {
      trust: "Finaliser les étapes de vérification de confiance",
      walletFunding: "Faire le suivi d’un financement portefeuille en attente",
      support: "Répondre aux échanges de support ouverts",
      notifications: "Vérifier les notifications non lues",
    },
    taskDescriptions: {
      trustFallback:
        "Améliorez le niveau de confiance pour débloquer plus de capacités.",
      walletFunding:
        "Votre preuve attend encore la confirmation de la finance.",
      support:
        "Des conversations de support ouvertes demandent encore votre attention.",
      notifications:
        "Des mises à jour non lues attendent encore une revue.",
    },
  },
  security: {
    title: "Sécurité",
    description:
      "Examinez l’activité de sécurité récente, modifiez votre mot de passe et terminez les sessions HenryCo si nécessaire.",
    trustProfile: "Profil de confiance",
    trustDescription:
      "La confiance est opérationnelle sur tout le compte. Elle contrôle maintenant des actions business à plus forte valeur, la posture de modération et l’éligibilité renforcée dans les modules HenryCo.",
    trustScore: "Score de confiance du compte",
    signalLabels: {
      emailVerified: "E-mail vérifié",
      identityStatus: "Statut d’identité",
      trustedPhone: "Téléphone de confiance",
      profileCompletion: "Complétion du profil",
      suspiciousEvents: "Événements suspects",
      contactReview: "Revue des contacts",
    },
    signalValues: {
      confirmed: "Confirmé",
      needsAttention: "Attention requise",
      verified: "Vérifié",
      underReview: "En revue",
      needsResubmission: "Nouvelle soumission requise",
      notSubmitted: "Non soumis",
      present: "Présent",
      missing: "Manquant",
      manualReview: "Revue manuelle",
      clear: "Clair",
    },
    whyYouAreHere: "Pourquoi vous êtes ici",
    topTrustLaneReached: "Voie de confiance maximale atteinte",
    topTrustLaneDescription:
      "Ce compte remplit déjà la voie de confiance la plus élevée actuellement disponible dans le tableau partagé.",
    baselineReason: "Votre profil de compte de base est actif.",
    whatUnlocks: "Ce qui débloque {tier}",
    regionalContext: "Contexte régional",
    accountStatus: "État du compte",
    needsReview: "Nécessite une revue",
    secure: "Sécurisé",
    email: "E-mail",
    accountHistory: "Historique du compte",
    historyDays: "{days} jours d’historique",
    operationalAccess: "Accès opérationnel",
    higherTrustAvailable:
      "Actions business et paiements à plus forte confiance disponibles",
    moreVerificationNeeded: "Plus de vérification nécessaire",
    trustGuide: "Guide d’état de confiance",
    whatCurrentStateMeans: "Ce que signifie votre état actuel",
    whatCurrentStateBody:
      "Cet état détermine l’accès aux flux à plus forte valeur et aux actions business dans HenryCo.",
    whatToDoNext: "Que faire ensuite",
    whatToDoNextBody:
      "Complétez les exigences listées pour débloquer la prochaine voie de confiance.",
    currentRestrictions: "Actions actuellement restreintes",
    noRestrictions:
      "Aucune restriction liée à la confiance ne bloque actuellement vos flux principaux.",
    recentActivity: "Activité de sécurité récente",
    recentActivityDescription:
      "Les connexions, déconnexions, empreintes d’appareil et signaux d’accès suspects sont enregistrés ici afin que la continuité de session reste vérifiable avant l’arrivée d’un contrôle séparé par appareil.",
    emptyTitle: "Aucune activité de sécurité récente",
    emptyDescription:
      "Les connexions, fermetures de session, alertes et changements sensibles du compte apparaîtront ici.",
    risk: "risque",
    blockedActions: {
      jobs:
        "Créer des offres vérifiées ou des annonces à plus forte confiance",
      marketplace:
        "Accéder à l’ensemble des privilèges vendeur marketplace",
      property:
        "Publier des flux propriétaires sans revue d’identité supplémentaire",
      payouts:
        "Utiliser les actions de paiement et de finance sensible sans revue",
      staff:
        "Utiliser les voies sensibles staff ou finance sans preuve d’identité plus forte",
      financial:
        "Utiliser les flux financiers sensibles sans revue",
      overlap:
        "Utiliser les flux vendeur à plus forte confiance, publication property ou payout tant que la revue de contact n’est pas levée",
    },
    reasons: {
      verificationApproved: "La vérification d’identité est approuvée.",
      verificationPending:
        "La vérification d’identité a été soumise et est en revue.",
      verificationRejected:
        "La vérification d’identité nécessite plus d’informations avant de débloquer les actions à plus forte confiance.",
      verificationMissing:
        "La vérification d’identité n’a pas encore été terminée.",
      emailVerified: "La propriété de l’e-mail est vérifiée.",
      identityVerified:
        "La vérification d’identité appuyée par document est complète.",
      documentsUnderReview:
        "Les documents d’identité sont actuellement en revue.",
      verificationNeedsAttention:
        "La vérification d’identité nécessite votre attention avant les voies de confiance les plus fortes.",
      phonePresent: "Un téléphone de contact est enregistré.",
      profileStrong:
        "La complétion du profil est assez forte pour les flux vérifiés.",
      accountHistory: "L’historique du compte couvre {days} jours.",
      transactionHistory:
        "Un historique de transactions vérifiées existe.",
      noRiskSignals:
        "Aucun événement de sécurité à haut risque récent n’a été trouvé.",
    },
    requirements: {
      verified: {
        verification:
          "Terminez la vérification d’identité afin que les voies de confiance ne reposent plus sur des signaux de profil optimistes.",
        email: "Vérifiez votre adresse e-mail.",
        identity:
          "Terminez la vérification d’identité pour les flux vendeur, property, payout et finance sensible.",
        phone: "Ajoutez un numéro de téléphone utilisable.",
        profile: "Complétez davantage votre profil et ajoutez des preuves documentaires.",
        overlap:
          "Un détail de contact partagé nécessite une revue manuelle avant de débloquer les actions à plus forte confiance.",
      },
      trusted: {
        verification:
          "L’approbation de la vérification d’identité est requise avant de débloquer les voies vendeur, employeur, property et payout de confiance.",
        age: "Accumulez davantage d’ancienneté de compte avant le statut de confiance.",
        transactions:
          "Complétez au moins une transaction ou un cycle de financement vérifié.",
        suspicious:
          "Gardez le compte sans alertes d’accès suspect.",
        overlap:
          "Résolvez la revue de chevauchement de contact avant les voies vendeur, payout ou property de confiance.",
      },
      premium: {
        verification:
          "La confiance premium est réservée aux comptes déjà passés par la vérification d’identité.",
        age: "Maintenez un historique plus long et plus propre.",
        transactions:
          "Construisez un historique de transactions vérifiées plus solide.",
        activity:
          "Utilisez davantage de divisions HenryCo avec des résultats propres.",
        overlap:
          "Gardez la revue des doublons de contact claire avant l’attribution de la confiance premium.",
      },
    },
  },
  changePassword: {
    passwordsDoNotMatch: "Les mots de passe ne correspondent pas",
    passwordTooShort:
      "Le mot de passe doit contenir au moins 8 caractères",
    success: "Votre mot de passe a été mis à jour.",
    unavailable:
      "Impossible de mettre à jour votre mot de passe pour le moment. Veuillez réessayer.",
    newPassword: "Nouveau mot de passe",
    confirmNewPassword: "Confirmer le nouveau mot de passe",
    minPlaceholder: "Min. 8 caractères",
    repeatPlaceholder: "Répétez le nouveau mot de passe",
    updating: "Mise à jour du mot de passe...",
    updatePassword: "Mettre à jour le mot de passe",
  },
  globalSignOut: {
    title: "Terminer toutes les sessions HenryCo",
    description:
      "Cela déconnecte le compte actuel sur toutes les divisions et tous les appareils HenryCo, puis vous renvoie vers l’écran de connexion du compte.",
    note:
      "L’activité récente des appareils et des sessions reste visible ci-dessous, même si la révocation appareil par appareil n’est pas encore exposée séparément.",
    unavailable:
      "Impossible de terminer toutes les sessions HenryCo pour le moment. Réessayez dans un instant.",
    ending: "Fin de toutes les sessions...",
    endAllSessions: "Déconnecter toutes les sessions HenryCo",
  },
  errorBoundary: {
    kicker: "Exécution du compte",
    title:
      "Cette surface du compte a rencontré une erreur de rendu ou côté client",
    description:
      "L’échec a été capturé pour investigation. Rechargez cette vue et reprenez depuis le dernier état stable.",
    reload: "Recharger cette vue",
    contactSupport: "Contacter le support",
  },
  activity: {
    title: "Activité",
    description: "Tout ce que vous avez fait dans les divisions HenryCo.",
    emptyTitle: "Aucune activité pour le moment",
    emptyDescription:
      "Votre activité inter-division apparaîtra ici au fur et à mesure de votre utilisation des services HenryCo.",
    statusLabels: {
      pending: "En attente",
      open: "Ouvert",
      updated: "Mis à jour",
      completed: "Terminé",
      resolved: "Résolu",
      paid: "Payé",
      failed: "Échoué",
      active: "Actif",
      refunded: "Remboursé",
    },
    filters: {
      heading: "Filtrer et télécharger",
      reset: "Réinitialiser",
      fromLabel: "Du",
      toLabel: "Au",
      amountFromLabel: "Montant minimum (₦)",
      amountToLabel: "Montant maximum (₦)",
      divisionEyebrow: "Division",
      typeEyebrow: "Type",
      statusEyebrow: "Statut",
      pdfNote:
        "Le PDF intègre tous les filtres définis ci-dessus dans l’en-tête du document — ce que vous voyez est ce que vous téléchargez.",
      downloadLabel: "Télécharger le relevé",
      downloadFilename: "HenryCo-Historique-Transactions.pdf",
      shareTitle: "Historique des transactions HenryCo",
      typeLabels: {
        payment: "paiement",
        wallet_credit: "crédit portefeuille",
        wallet_debit: "débit portefeuille",
        refund: "remboursement",
        withdrawal: "retrait",
        fee: "frais",
      },
    },
  },
  calendar: {
    metaTitle: "Calendrier · HenryCo",
    metaDescription:
      "Agenda multi-portails — rendez-vous Care, visites de biens, entretiens Jobs, jalons Studio, cours Learn, créneaux logistiques.",
    heroAriaLabel: "Aperçu du calendrier",
    heroEyebrow: "HenryCo · calendrier multi-portails",
    tileVolumeAriaLabel: "Volume du calendrier",
    tileEventsLabel: "Événements",
    tileEventsFoot: "28 prochains jours",
    tilePortalsLabel: "Portails",
    tilePortalsFootEmpty: "Care, immobilier, jobs, studio, learn, logistique",
    tilePortalsFootSingular: "Une division programmée",
    tilePortalsFootPlural: "{count} divisions programmées",
    tileNextLabel: "Prochain",
    tileNextEmpty: "Rien de prévu dans la fenêtre",
    sideAriaLabel: "Par portail",
    sideLabel: "Par portail",
    sideTitleEmpty: "Aucune planification pour l’instant",
    sideTitleSingular: "Un portail actif",
    sideTitlePlural: "{count} portails en jeu",
    sideBody:
      "Réservations, visites, entretiens, jalons, cours et créneaux d’expédition apparaissent ici par ordre chronologique.",
    agendaTitle: "Agenda",
    agendaAriaLabel: "Événements programmés par jour",
    agendaMetaEmpty: "Rien de prévu dans la fenêtre de 28 jours",
    agendaMetaSingular: "{count} événement · 28 prochains jours",
    agendaMetaPlural: "{count} événements · 28 prochains jours",
    emptyEyebrow: "Calendrier calme",
    emptyTitle: "Rien de prévu dans les 28 prochains jours.",
    emptyBody:
      "Tout ce que vous réservez — un retrait Care, une visite de bien, un entretien d’embauche, un cours Learn, un jalon Studio, un créneau logistique — atterrira ici automatiquement. Les filtres apparaîtront dès que les portails commenceront à planifier.",
    dayMetaSingular: "{count} événement",
    dayMetaPlural: "{count} événements",
    eventTimeAriaLabel: "Heure de l’événement",
    eventCta: "Ouvrir",
    headline: {
      empty: "Rien de prévu dans les 28 prochains jours.",
      calmOne: "Un seul élément à l’agenda.",
      calmMany: "{count} événements dans les 28 prochains jours.",
      busy: "{count} événements programmés sur {portals} portails.",
      packed: "{count} événements en file — bloquez votre temps de concentration.",
    },
    blurb: {
      empty:
        "Réservations Care, visites de biens, entretiens Jobs, jalons Studio, cours Learn et créneaux logistiques apparaissent tous ici.",
      calm: "Touchez une carte pour rejoindre son portail. L’agenda se rafraîchit automatiquement quand de nouvelles planifications arrivent.",
      busyOrPacked:
        "Les filtres en haut de l’agenda restreignent à un portail — utile quand une division est bruyante.",
    },
    kindLabels: {
      care_booking: "Réservation Care",
      property_viewing: "Visite de bien",
      jobs_interview: "Entretien",
      learn_class: "Cours en direct",
      studio_milestone: "Jalon Studio",
      logistics_pickup: "Créneau d’enlèvement",
      logistics_delivery: "Créneau de livraison",
      room_session: "Session de salle",
    },
    dayLabels: {
      today: "Aujourd’hui",
      tomorrow: "Demain",
      yesterday: "Hier",
    },
    portalLabels: {
      care: "Care",
      property: "Immobilier",
      jobs: "Jobs",
      studio: "Studio",
      learn: "Learn",
      logistics: "Logistique",
    },
  },
  notifications: {
    metadata: {
      title: "Notifications",
      description: "Toutes les mises à jour HenryCo — portefeuille, support, jobs, marketplace, care, et plus — dans une boîte de réception en direct.",
    },
    hero: {
      eyebrow: "HenryCo · notifications en direct",
      ariaOverview: "Aperçu des notifications",
      ariaVolume: "Volume des notifications",
      ariaByDivision: "Par division",
      headlineZero: "Boîte vide à travers HenryCo.",
      headlineOne: "Un élément attend votre attention.",
      headlineFew: "{count} notifications à trier.",
      headlineMany: "{count} mises à jour à travers vos divisions.",
      blurbZero: "Tout ce que HenryCo envoie arrive ici en temps réel — portefeuille, support, jobs, marketplace, care, et plus.",
      blurbStale: "Des éléments plus anciens se sont accumulés. Glissez pour archiver, touchez pour ouvrir, ou sautez directement vers un fil.",
      blurbToday: "{count} sont arrivées aujourd’hui. Utilisez les filtres pour vous concentrer sur une seule division, ou balayez uniquement les non lues.",
      tileUnreadLabel: "Non lues",
      tileUnreadFoot: "En attente de votre regard",
      tileTodayLabel: "Aujourd’hui",
      tileTodayFoot: "Arrivées dans les dernières 24h",
      tileWeekLabel: "Cette semaine",
      tileWeekFoot: "Dernière activité {when}",
      byDivision: "Par division",
      emptyDivisions: "Rien n’est encore arrivé.",
      lastActivityFallback: "aucune activité récente",
      justNow: "à l’instant",
      minutesAgo: "il y a {count} min",
      hoursAgo: "il y a {count} h",
      daysAgo: "il y a {count} j",
    },
    inbox: {
      heading: "Boîte de réception",
      meta: "Touchez pour ouvrir, glissez pour archiver — les filtres fonctionnent dans toutes les divisions.",
    },
    filters: {
      all: "Tout",
      unread: "Non lues",
      allSources: "Toutes les sources",
      activeFilter: "filtre actif",
    },
    feed: {
      unreadSectionKicker: "Non lues",
      unreadSectionTitle: "Demande votre attention",
      recentSectionKicker: "Récent",
      recentSectionTitle: "Activité effacée ou revue",
      unreadBadge: "Non lu",
      openMessageBoard: "Ouvrir le fil de messages",
    },
    swipe: {
      archive: "Archiver",
      delete: "Supprimer",
      markRead: "Marquer comme lu",
      markUnread: "Marquer comme non lu",
    },
    emptyState: {
      inboxTitle: "Tout est à jour.",
      inboxBody: "L’activité de l’ensemble de HenryCo apparaît ici en temps réel.",
      filterTitle: "Aucune activité dans cette vue.",
      filterBody: "Essayez un filtre différent.",
    },
    markAllRead: {
      label: "Tout marquer comme lu",
      pending: "Marquage en cours...",
      spinner: "Marquage en cours",
    },
    footer: {
      recentlyDeleted: "Supprimées récemment",
    },
  },
  invoices: {
    metadata: {
      title: "Factures et reçus",
      description: "Votre historique de paiements et vos reçus téléchargeables.",
    },
    hero: {
      eyebrow: "Factures · reçus",
      ariaOverview: "Aperçu des factures",
      ariaTotals: "Totaux financiers",
      ariaByDivision: "Par division",
      headlineEmpty: "Vos reçus apparaîtront ici.",
      headlineWithReceipts: "Tous vos reçus, au même endroit.",
      blurb:
        "Chaque paiement effectué sur HenryCo arrive ici sous forme de PDF de marque téléchargeable — réservations Care, commandes Marketplace, factures Studio, expéditions Logistics, certificats Learn.",
      totalPaidLabel: "Payé · à vie",
      thisMonthLabel: "Payé · ce mois",
      thisMonthFoot: "Reçus datés du mois en cours",
      outstandingLabel: "En attente",
      paidCountUnit: "reçus",
      pendingCountUnit: "en attente",
      overdueCountUnit: "en retard",
      byDivision: "Par division",
      byDivisionEmpty: "Aucune facture pour le moment.",
    },
    section: {
      title: "Toutes les factures",
      receiptsOnFileSingular: "reçu enregistré",
      receiptsOnFilePlural: "reçus enregistrés",
    },
    empty: {
      title: "Aucune facture pour le moment",
      description:
        "Vos factures et reçus apparaîtront ici après vos paiements dans les services HenryCo.",
    },
    statuses: {
      paid: "Payée",
      pending: "En attente",
      overdue: "En retard",
      draft: "Brouillon",
      cancelled: "Annulée",
      refunded: "Remboursée",
      fallback: "Statut en attente",
    },
    list: {
      ariaLabel: "Factures",
      fallbackTitle: "Facture {number}",
      rowAriaLabel: "Facture {number} pour ₦{amount}",
    },
    divisions: {
      account: "Compte",
      wallet: "Portefeuille",
      marketplace: "Marketplace",
      studio: "Studio",
      jobs: "Jobs",
      learn: "Learn",
      property: "Property",
      logistics: "Logistics",
      care: "Care",
      fallback: "Compte",
    },
    footerNote: "Les reçus se téléchargent en PDF de marque.",
  },
  wallet: {
    hero: {
      ariaLabel: "Solde du portefeuille",
      eyebrow: "Portefeuille HenryCo · en direct",
      availableLabel: "Solde disponible",
      balanceAriaTemplate: "Solde disponible {amount} {currency}",
      settlementFallback: "Réglé dans votre devise locale au taux HenryCo du jour.",
      ctas: { fund: "Approvisionner", withdraw: "Retirer" },
      tiles: {
        verifiedLabel: "Solde vérifié",
        verifiedFoot: "Utilisable dans tous les services HenryCo",
        pendingFundingLabel: "Approvisionnement en attente",
        pendingFundingFoot: "Reste isolé jusqu’à confirmation par la finance",
        pendingWithdrawalLabel: "Retenu pour retrait",
        pendingWithdrawalFoot: "Réservé jusqu’au paiement effectif",
      },
    },
    sections: {
      actionsTitle: "Actions du portefeuille",
      actionsMeta: "Ajouter, retirer, payer, rapprocher",
      pendingTitle: "Opérations en attente",
      pendingMeta: "Séparées de votre solde disponible",
      flowTitle: "Comment circule votre argent",
      flowMeta: "30 derniers jours · 6 derniers mois · par division",
      fundingTitle: "Demandes d’approvisionnement récentes",
      fundingMetaTemplate: "{count} en cours d’examen",
      activityTitle: "Activité",
      activityMetaTemplate: "{count} dernières",
    },
    quickActions: {
      ariaLabel: "Actions rapides du portefeuille",
      addFundsLabel: "Ajouter des fonds",
      addFundsDesc: "Virement bancaire avec preuve et confirmation immédiate.",
      withdrawLabel: "Retirer",
      withdrawDesc: "Transférer le solde disponible vers un compte vérifié.",
      paymentsLabel: "Paiements",
      paymentsDesc: "Débits récents, remboursements et moyens enregistrés.",
      receiptsLabel: "Reçus et factures",
      receiptsDesc: "PDF de marque pour toutes les divisions.",
    },
    pendingOps: {
      fundingKicker: "Approvisionnement en attente",
      fundingDescEmpty: "Les fonds que vous transférez restent ici jusqu’à confirmation de la référence bancaire par la finance.",
      fundingDescSingular: "{count} demande en cours d’examen — la preuve fait avancer la file.",
      fundingDescPlural: "{count} demandes en cours d’examen — la preuve fait avancer la file.",
      fundingCta: "Ouvrir la voie d’approvisionnement",
      withdrawalKicker: "Retraits en attente",
      withdrawalDescEmpty: "Les retraits patientent ici pendant l’examen — votre solde disponible n’est jamais promis deux fois.",
      withdrawalDescSingular: "{count} retrait en attente de paiement. Réservé sur votre solde disponible.",
      withdrawalDescPlural: "{count} retraits en attente de paiement. Réservés sur votre solde disponible.",
      withdrawalCta: "Ouvrir la voie de retrait",
    },
    spend: {
      figureAriaLabel: "Dépenses sur les 6 derniers mois",
      last30Eyebrow: "Dépenses · 30 derniers jours",
      byDivisionEyebrow: "Par division",
      distributionAriaLabel: "Répartition des dépenses par division",
      trendFlat: "Stable",
      trendBelowTemplate: "{pct}% en dessous des 30j précédents",
      trendAboveTemplate: "{pct}% au-dessus des 30j précédents",
      trendTitleTemplate: "vs 30 jours précédents (₦{amount})",
    },
    trust: {
      ariaLabel: "Préparation au retrait",
      heading: "Préparation au retrait",
      identityTitle: "Identité vérifiée",
      identityDescDoneTemplate: "{label}. Requis pour les paiements de retrait.",
      identityDescTodoTemplate: "{label}. Complétez-la une fois pour débloquer les retraits.",
      identityCta: "Continuer →",
      pinTitle: "Code PIN de retrait",
      pinDescDone: "Votre code PIN de retrait est configuré.",
      pinDescTodo: "Définissez un PIN à 4 chiffres pour autoriser chaque retrait.",
      pinCta: "Définir le PIN →",
      payoutTitle: "Mode de paiement",
      payoutDescSingular: "1 mode vérifié enregistré.",
      payoutDescPluralTemplate: "{count} modes vérifiés enregistrés.",
      payoutDescEmpty: "Ajoutez un compte bancaire pour recevoir les retraits.",
      payoutCtaManage: "Gérer →",
      payoutCtaAdd: "Ajouter un mode →",
      verificationLabels: {
        verified: "Identité vérifiée",
        pending: "Vérification en cours d’examen",
        rejected: "La vérification nécessite une nouvelle soumission",
        notSubmitted: "Identité non encore soumise",
      },
    },
    activity: {
      ariaLabel: "Transactions du portefeuille",
      emptyTitle: "Aucune transaction pour l’instant",
      emptyBody: "Approvisionnez votre portefeuille et votre flux affichera ici chaque crédit, débit, remboursement et bonus dans les services HenryCo.",
      fallbackTitle: "Transaction du portefeuille",
    },
    funding: {
      proofUploaded: "Preuve téléversée",
      awaitingProof: "En attente de preuve",
      ariaLabelTemplate: "Demande d’approvisionnement {reference} de ₦{amount}",
    },
    statusLabels: {
      pending: "En attente d’examen",
      awaiting_proof: "En attente de preuve",
      awaiting_review: "En attente d’examen",
      in_review: "En cours d’examen",
      rejected: "Refusé",
      cancelled: "Annulé",
      expired: "Expiré",
      completed: "Confirmé",
      verified: "Confirmé",
      approved: "Approuvé",
      paid: "Payé",
    },
  },
};

const DE: DeepPartial<AccountCopy> = {
  "trustTierLabels": {
    "basic": "Einfach",
    "verified": "Verifiziert",
    "trusted": "Vertrauenswürdig",
    "premium_verified": "Premium-verifiziert"
  },
  "common": {
    "source": "Quelle",
    "viewAll": "Alle anzeigen",
    "unread": "Ungelesen",
    "defaultBadge": "Standard",
    "noReceiptYet": "Noch keine Quittung",
    "unknownCustomer": "Kunde",
    "page": "Seite",
    "of": "von",
    "perPage": "pro Seite",
    "previous": "Zurück",
    "next": "Als nächstes",
    "filtered": "gefiltert",
    "bookingSingular": "Buchung",
    "bookingPlural": "Buchungen",
    "justNow": "Gerade eben"
  },
  "overview": {
    "welcomeBack": "Willkommen zurück",
    "description": "Ihre HenryCo-Kommandozentrale – alles über alle Abteilungen hinweg an einem Ort.",
    "walletBalance": "Wallet-Guthaben",
    "walletHint": "Gemeinsame Geldbörse · Verwendung für alle HenryCo-Dienste",
    "notifications": "Benachrichtigungen",
    "allCaughtUp": "Alles eingeholt",
    "unreadMessages": "Ungelesene Nachrichten",
    "activeSubscriptions": "Aktive Abonnements",
    "noActivePlans": "Keine synchronisierten aktiven Pläne",
    "syncedPlans": "Synchronisierte aktive Pläne",
    "trustTier": "Vertrauensstufe",
    "scoreLabel": "Punktzahl",
    "businessActionsUnlocked": "Geschäftsaktionen freigeschaltet",
    "moreVerificationNeeded": "Weitere Überprüfung erforderlich",
    "invoices": "Rechnungen",
    "pending": "ausstehend",
    "allSettled": "Alles geklärt",
    "support": "Unterstützung",
    "newReplies": "mit neuen Antworten",
    "openRequests": "Offene Anfragen",
    "noOpenRequests": "Keine offenen Anfragen",
    "referrals": "Empfehlungen",
    "inviteAndEarn": "Einladen und verdienen",
    "shareHenryCo": "Teilen Sie HenryCo mit anderen",
    "transactions": "Transaktionen",
    "viewHistory": "Verlauf anzeigen",
    "walletActivity": "Wallet-Aktivität und Zahlungen",
    "blockingLabel": "Blockierung",
    "highPriorityLabel": "nächste Schritte mit hoher Priorität",
    "actionCenterHint": "Ihr Action Center wird anhand von Live-Vertrauens-, Wallet-, Support- und Benachrichtigungssignalen priorisiert.",
    "attentionKicker": "Was Ihre Aufmerksamkeit erfordert",
    "attentionTitle": "In Bearbeitung, auf Sie wartend oder noch ungelöst",
    "pendingWalletVerification": "Ausstehende Wallet-Verifizierung",
    "pendingWalletVerificationDetail": "Ihr Wallet-Beweis wartet noch auf die Finanzbestätigung.",
    "unreadNotificationsAttention": "Ungelesene Benachrichtigungen",
    "unreadNotificationsAttentionDetail": "Ungelesene Updates warten immer noch auf Ihre Bewertung.",
    "activePlansInMotion": "Aktive Pläne in Bewegung",
    "activePlansInMotionDetail": "Derzeit laufen Abonnements für dieses Konto.",
    "unlockTier": "Entsperren Sie {tier}",
    "nextTierFallback": "Ihre nächste Vertrauensstufe benötigt eine stärkere Verifizierung und einen saubereren Kontoverlauf.",
    "quickActions": "Schnelle Aktionen",
    "addMoney": "Geld hinzufügen",
    "getHelp": "Holen Sie sich Hilfe",
    "bookCare": "Buchpflege",
    "shop": "Einkaufen",
    "actionCenter": "Aktionszentrum",
    "actionCenterDescription": "Beginnen Sie zunächst mit dem Blockieren von Elementen und erledigen Sie dann Schritte mit hoher Priorität, um die volle Funktionsfähigkeit Ihres Kontos aufrechtzuerhalten.",
    "noUrgentTasks": "Im Moment gibt es keine dringenden Kontoaufgaben. Sie befinden sich in einem gesunden Betriebszustand.",
    "viewTaskQueue": "Vollständige Aufgabenwarteschlange anzeigen",
    "smartRecommendations": "Intelligente Empfehlungen",
    "smartRecommendationsEmpty": "Nutzen Sie weiterhin die Dienste von HenryCo und die Empfehlungen passen sich Ihrer Aktivität an.",
    "recommendationReason": "Empfohlen aus Ihrer Kontoaktivität und Ihrem Vertrauensstatus ({confidence} Vertrauen)",
    "recentActivity": "Letzte Aktivität",
    "noRecentActivity": "Noch keine aktuelle Aktivität",
    "recentNotifications": "Benachrichtigungen",
    "noNotifications": "Noch keine Benachrichtigungen",
    "yourServices": "Ihre Dienstleistungen",
    "careService": "Pflege",
    "careServiceDescription": "Stoffpflege, Reinigung und Instandhaltung",
    "marketplaceService": "Marktplatz",
    "marketplaceServiceDescription": "Kaufen Sie Produkte und verkaufen Sie sie online",
    "jobsService": "Jobs",
    "jobsServiceDescription": "Bewerbungen, gespeicherte Rollen und Personalvermittler-Updates",
    "studioService": "Studio",
    "studioServiceDescription": "Kreativ- und Designdienstleistungen",
    "recommendationTitles": {
      "trustNext": "Schließen Sie Ihre Vertrauensüberprüfung ab",
      "profileNext": "Vervollständigen Sie Ihr Profil",
      "jobsSaved": "Verfolgen Sie gespeicherte Rollen"
    },
    "recommendationDescriptions": {
      "trustNext": "Schalten Sie weitere Aktionen über HenryCo frei.",
      "profileNext": "Ein vollständiges Profil verbessert den Support und die Servicekontinuität.",
      "jobsSaved": "Besuchen Sie die bereits gespeicherten Rollen noch einmal und handeln Sie danach.",
      "fallback": "Nutzen Sie weiterhin die Dienste von HenryCo und die Empfehlungen passen sich Ihrer Aktivität an."
    }
  },
  "tasks": {
    "title": "Aufgaben",
    "description": "Priorisierte Aktionen für Konto, Vertrauen, Wallet und Support.",
    "queueTitle": "So funktioniert diese Warteschlange",
    "queueBody": "Durch das Blockieren von Aufgaben kann der Zugriff auf wichtige Arbeitsabläufe verhindert werden. Elemente mit hoher Priorität sind die nächstbesten Maßnahmen, um Ihr Konto gesund zu halten und Verzögerungen zu vermeiden.",
    "emptyTitle": "Keine aktiven Aufgaben",
    "emptyDescription": "Sie sind derzeit im Klaren. Hier werden Aufgaben angezeigt, wenn Handlungsbedarf besteht.",
    "blocking": "Blockierung",
    "priorityLabels": {
      "low": "niedrig",
      "normal": "normal",
      "high": "hoch",
      "urgent": "dringend"
    },
    "taskTitles": {
      "trust": "Führen Sie die Schritte zur Vertrauensüberprüfung durch",
      "walletFunding": "Verfolgen Sie die ausstehende Wallet-Finanzierung",
      "support": "Auf offene Support-Threads antworten",
      "notifications": "Überprüfen Sie ungelesene Benachrichtigungen"
    },
    "taskDescriptions": {
      "trustFallback": "Erweitern Sie die Vertrauensstufe, um weitere Funktionen freizuschalten.",
      "walletFunding": "Ihr Nachweis wartet auf eine Finanzbestätigung.",
      "support": "Offene Supportgespräche erfordern weiterhin Ihre Aufmerksamkeit.",
      "notifications": "Ungelesene Updates warten auf Überprüfung."
    }
  },
  "security": {
    "title": "Sicherheit",
    "description": "Überprüfen Sie die letzten Sicherheitsaktivitäten, ändern Sie Ihr Passwort und beenden Sie bei Bedarf HenryCo-Sitzungen.",
    "trustProfile": "Vertrauensprofil",
    "trustDescription": "Vertrauen ist im gesamten Konto wirksam. Es steuert jetzt höherwertige Geschäftsaktionen, die Moderationshaltung und eine stärkere Berechtigung für alle HenryCo-Module.",
    "trustScore": "Vertrauensbewertung des Kontos",
    "signalLabels": {
      "emailVerified": "Bestätigte E-Mail",
      "identityStatus": "Identitätsstatus",
      "trustedPhone": "Vertrauenswürdiges Telefon",
      "profileCompletion": "Profilvervollständigung",
      "suspiciousEvents": "Verdächtige Ereignisse",
      "contactReview": "Kontaktbewertung"
    },
    "signalValues": {
      "confirmed": "Bestätigt",
      "needsAttention": "Braucht Aufmerksamkeit",
      "verified": "Verifiziert",
      "underReview": "Wird überprüft",
      "needsResubmission": "Muss erneut eingereicht werden",
      "notSubmitted": "Nicht eingereicht",
      "present": "Anwesend",
      "missing": "Fehlt",
      "manualReview": "Manuelle Überprüfung",
      "clear": "Klar"
    },
    "whyYouAreHere": "Warum Sie hier sind",
    "topTrustLaneReached": "Top-Trust-Lane erreicht",
    "topTrustLaneDescription": "Dieses Konto entspricht bereits der derzeit höchsten Vertrauensebene, die im freigegebenen Dashboard verfügbar ist.",
    "baselineReason": "Ihr Basiskontoprofil ist aktiv.",
    "whatUnlocks": "Was {tier} freischaltet",
    "regionalContext": "Regionaler Kontext",
    "accountStatus": "Kontostatus",
    "needsReview": "Muss überprüft werden",
    "secure": "Sicher",
    "email": "E-Mail",
    "accountHistory": "Kontoverlauf",
    "historyDays": "{days} Tage Kontoverlauf",
    "operationalAccess": "Betriebszugang",
    "higherTrustAvailable": "Geschäfts- und Auszahlungsaktionen mit höherem Vertrauen verfügbar",
    "moreVerificationNeeded": "Weitere Überprüfung erforderlich",
    "trustGuide": "Vertrauen Sie dem Staatsführer",
    "whatCurrentStateMeans": "Was Ihr aktueller Zustand bedeutet",
    "whatCurrentStateBody": "Dieser Status bestimmt den Zugriff auf höherwertige Workflows und Geschäftsaktionen in HenryCo.",
    "whatToDoNext": "Was als nächstes zu tun ist",
    "whatToDoNextBody": "Erfüllen Sie die aufgeführten Anforderungen, um die nächste Vertrauensspur freizuschalten.",
    "currentRestrictions": "Derzeit eingeschränkte Aktionen",
    "noRestrictions": "Derzeit blockieren keine vertrauenswürdigen Einschränkungen die Arbeitsabläufe Ihres Kernkontos.",
    "recentActivity": "Aktuelle Sicherheitsaktivitäten",
    "recentActivityDescription": "Anmeldungen, Abmeldungen, Gerätefingerabdrücke und verdächtige Zugriffssignale werden hier aufgezeichnet, sodass die Sitzungskontinuität auch vor der Auslieferung separater Sperrkontrollen pro Gerät überprüfbar bleibt.",
    "emptyTitle": "Keine aktuellen Sicherheitsaktivitäten",
    "emptyDescription": "Hier werden Anmeldungen, Sitzungsschließungen, Warnungen und vertrauliche Kontoänderungen angezeigt.",
    "risk": "Risiko",
    "blockedActions": {
      "jobs": "Erstellen Sie verifizierte Jobs oder Einträge mit höherer Vertrauenswürdigkeit",
      "marketplace": "Greifen Sie auf alle Marktplatz-Verkäuferprivilegien zu",
      "property": "Veröffentlichen Sie Workflows für Immobilieneigentümer ohne zusätzliche Identitätsprüfung",
      "payouts": "Nutzen Sie auszahlungs- und finanzsensible Maßnahmen ohne Prüfung",
      "staff": "Nutzen Sie mitarbeiter- oder finanzrelevante Höhenpfade ohne stärkeren Identitätsnachweis",
      "financial": "Nutzen Sie sensible Finanzabläufe ohne Überprüfung",
      "overlap": "Verwenden Sie vertrauenswürdigere Verkäufer-, Immobilienveröffentlichungs- oder Auszahlungsabläufe, bis die Kontaktüberprüfung abgeschlossen ist"
    },
    "reasons": {
      "verificationApproved": "Die Identitätsüberprüfung ist genehmigt.",
      "verificationPending": "Die Identitätsüberprüfung wurde eingereicht und wird derzeit überprüft.",
      "verificationRejected": "Für die Identitätsüberprüfung sind weitere Informationen erforderlich, bevor Aktionen mit höherer Vertrauenswürdigkeit entsperrt werden können.",
      "verificationMissing": "Die Identitätsüberprüfung ist noch nicht abgeschlossen.",
      "emailVerified": "E-Mail-Inhaberschaft wird bestätigt.",
      "identityVerified": "Die dokumentengestützte Identitätsüberprüfung ist abgeschlossen.",
      "documentsUnderReview": "Ausweisdokumente werden derzeit geprüft.",
      "verificationNeedsAttention": "Die Identitätsüberprüfung erfordert Aufmerksamkeit, bevor die stärksten Vertrauenswege freigeschaltet werden können.",
      "phonePresent": "Eine Kontakttelefonnummer ist hinterlegt.",
      "profileStrong": "Die Profilvervollständigung ist stark genug für verifizierte Arbeitsabläufe.",
      "accountHistory": "Der Kontoverlauf umfasst {days} Tage.",
      "transactionHistory": "Verifizierter Transaktionsverlauf vorhanden.",
      "noRiskSignals": "Es wurden keine aktuellen Sicherheitsvorfälle mit hohem Risiko gefunden."
    },
    "requirements": {
      "verified": {
        "verification": "Vollständige Identitätsüberprüfung, damit sich vertrauensbasierte Lanes nicht mehr auf optimistische Profilsignale verlassen.",
        "email": "Bestätigen Sie Ihre E-Mail-Adresse.",
        "identity": "Vollständige Identitätsüberprüfung für Verkäufer-, Eigentums-, Auszahlungs- und finanzsensible Arbeitsabläufe.",
        "phone": "Fügen Sie eine verwendbare Telefonnummer hinzu.",
        "profile": "Vervollständigen Sie Ihr Profil weiter und fügen Sie Nachweisdokumente hinzu.",
        "overlap": "Ein freigegebenes Kontaktdetail erfordert eine manuelle Vertrauensprüfung, bevor Aktionen mit höherer Vertrauenswürdigkeit freigeschaltet werden."
      },
      "trusted": {
        "verification": "Bevor vertrauenswürdige Verkäufer, Arbeitgeber, Immobilien und Auszahlungskanäle entsperrt werden können, ist eine Genehmigung der Identitätsprüfung erforderlich.",
        "age": "Bauen Sie ein höheres Kontoalter auf, bevor der Vertrauensstatus freigeschaltet wird.",
        "transactions": "Schließen Sie mindestens eine verifizierte Transaktion oder einen verifizierten Finanzierungszyklus ab.",
        "suspicious": "Halten Sie das Konto frei von verdächtigen Zugriffswarnungen.",
        "overlap": "Beheben Sie die Überprüfung von Kontaktüberschneidungen, bevor vertrauenswürdige Verkäufer, Auszahlungen oder Immobilienspuren freigeschaltet werden."
      },
      "premium": {
        "verification": "Premium Trust ist Konten vorbehalten, die die Identitätsprüfung bereits bestanden haben.",
        "age": "Sorgen Sie für einen längeren, sauberen Kontoverlauf.",
        "transactions": "Erstellen Sie einen stärker verifizierten Transaktionsdatensatz.",
        "activity": "Verwenden Sie mehr HenryCo-Divisionen mit sauberen Ergebnissen.",
        "overlap": "Halten Sie die Überprüfung doppelter Kontakte frei, bevor Premium-Vertrauen gewährt werden kann."
      }
    }
  },
  "changePassword": {
    "passwordsDoNotMatch": "Passwörter stimmen nicht überein",
    "passwordTooShort": "Das Passwort muss mindestens 8 Zeichen lang sein",
    "success": "Ihr Passwort wurde aktualisiert.",
    "unavailable": "Wir konnten Ihr Passwort derzeit nicht aktualisieren. Bitte versuchen Sie es erneut.",
    "newPassword": "Neues Passwort",
    "confirmNewPassword": "Bestätigen Sie das neue Passwort",
    "minPlaceholder": "Min. 8 Zeichen",
    "repeatPlaceholder": "Neues Passwort wiederholen",
    "updating": "Passwort wird aktualisiert...",
    "updatePassword": "Passwort aktualisieren"
  },
  "globalSignOut": {
    "title": "Beenden Sie jede HenryCo-Sitzung",
    "description": "Dadurch wird das aktuelle Konto über HenryCo Abteilungen und Geräte hinweg abgemeldet und Sie kehren dann zur Konto-Anmeldeoberfläche zurück.",
    "note": "Aktuelle Geräte- und Sitzungsaktivitäten bleiben unten sichtbar, auch wenn der Live-Widerruf pro Gerät noch nicht als separates Steuerelement angezeigt wird.",
    "unavailable": "Wir konnten derzeit nicht jede HenryCo-Sitzung beenden. Versuchen Sie es gleich noch einmal.",
    "ending": "Alle Sitzungen werden beendet...",
    "endAllSessions": "Melden Sie alle HenryCo Sitzungen ab"
  },
  "errorBoundary": {
    "kicker": "Kontolaufzeit",
    "title": "Bei dieser Kontooberfläche ist ein Client- oder Renderingfehler aufgetreten",
    "description": "Der Fehler wurde zur Untersuchung erfasst. Laden Sie diese Oberfläche neu und fahren Sie mit dem letzten stabilen Zustand fort.",
    "reload": "Laden Sie diese Ansicht neu",
    "contactSupport": "Kontaktieren Sie den Support"
  },
  "activity": {
    "title": "Aktivität",
    "description": "Alles, was Sie über alle HenryCo-Bereiche hinweg getan haben.",
    "emptyTitle": "Noch keine Aktivität",
    "emptyDescription": "Ihre bereichsübergreifende Aktivität erscheint hier, sobald Sie HenryCo-Dienste nutzen.",
    "statusLabels": {
      "pending": "Ausstehend",
      "open": "Offen",
      "updated": "Aktualisiert",
      "completed": "Abgeschlossen",
      "resolved": "Gelöst",
      "paid": "Bezahlt",
      "failed": "Fehlgeschlagen",
      "active": "Aktiv",
      "refunded": "Erstattet"
    },
    "filters": {
      "heading": "Filtern und herunterladen",
      "reset": "Zurücksetzen",
      "fromLabel": "Von",
      "toLabel": "Bis",
      "amountFromLabel": "Betrag ab (₦)",
      "amountToLabel": "Betrag bis (₦)",
      "divisionEyebrow": "Bereich",
      "typeEyebrow": "Typ",
      "statusEyebrow": "Status",
      "pdfNote": "Das PDF übernimmt jeden Filter aus dem Dokumentkopf — was Sie sehen, laden Sie herunter.",
      "downloadLabel": "Auszug herunterladen",
      "downloadFilename": "HenryCo-Transaktionsverlauf.pdf",
      "shareTitle": "HenryCo Transaktionsverlauf",
      "typeLabels": {
        "payment": "Zahlung",
        "wallet_credit": "Wallet-Gutschrift",
        "wallet_debit": "Wallet-Belastung",
        "refund": "Rückerstattung",
        "withdrawal": "Auszahlung",
        "fee": "Gebühr"
      }
    }
  },
  calendar: {
    metaTitle: "Kalender · HenryCo",
    metaDescription:
      "Portalübergreifende Agenda — Care-Buchungen, Besichtigungen, Bewerbungsgespräche, Studio-Meilensteine, Learn-Kurse, Logistikfenster.",
    heroAriaLabel: "Kalenderübersicht",
    heroEyebrow: "HenryCo · portalübergreifender Kalender",
    tileVolumeAriaLabel: "Kalendervolumen",
    tileEventsLabel: "Termine",
    tileEventsFoot: "Nächste 28 Tage",
    tilePortalsLabel: "Portale",
    tilePortalsFootEmpty: "Care, Immobilien, Jobs, Studio, Learn, Logistik",
    tilePortalsFootSingular: "Eine Abteilung geplant",
    tilePortalsFootPlural: "{count} Abteilungen geplant",
    tileNextLabel: "Als Nächstes",
    tileNextEmpty: "Nichts im Zeitfenster geplant",
    sideAriaLabel: "Nach Portal",
    sideLabel: "Nach Portal",
    sideTitleEmpty: "Noch keine Planung",
    sideTitleSingular: "Ein Portal aktiv",
    sideTitlePlural: "{count} Portale im Mix",
    sideBody:
      "Buchungen, Besichtigungen, Gespräche, Meilensteine, Kurse und Versandfenster erscheinen hier in chronologischer Reihenfolge.",
    agendaTitle: "Agenda",
    agendaAriaLabel: "Geplante Termine nach Tag",
    agendaMetaEmpty: "Nichts im 28-Tage-Fenster geplant",
    agendaMetaSingular: "{count} Termin · nächste 28 Tage",
    agendaMetaPlural: "{count} Termine · nächste 28 Tage",
    emptyEyebrow: "Kalender ruhig",
    emptyTitle: "Nichts in den nächsten 28 Tagen geplant.",
    emptyBody:
      "Alles was Sie buchen — eine Care-Abholung, eine Besichtigung, ein Bewerbungsgespräch, einen Learn-Kurs, einen Studio-Meilenstein, ein Logistikfenster — landet automatisch in dieser Agenda. Filter-Chips erscheinen, sobald Portale mit der Planung beginnen.",
    dayMetaSingular: "{count} Termin",
    dayMetaPlural: "{count} Termine",
    eventTimeAriaLabel: "Terminzeit",
    eventCta: "Öffnen",
    headline: {
      empty: "Nichts in den nächsten 28 Tagen geplant.",
      calmOne: "Ein Eintrag auf der Agenda.",
      calmMany: "{count} Termine in den nächsten 28 Tagen.",
      busy: "{count} Termine geplant über {portals} Portale.",
      packed: "{count} Termine in der Warteschlange — planen Sie Fokuszeit klug ein.",
    },
    blurb: {
      empty:
        "Care-Buchungen, Besichtigungen, Bewerbungsgespräche, Studio-Meilensteine, Learn-Kurse und Logistikfenster erscheinen alle hier.",
      calm: "Tippen Sie auf eine Karte, um zum zugehörigen Portal zu springen. Die Agenda aktualisiert sich automatisch, sobald neue Planungen eintreffen.",
      busyOrPacked:
        "Filter-Chips oben in der Agenda grenzen auf ein einzelnes Portal ein — nützlich, wenn eine Abteilung laut ist.",
    },
    kindLabels: {
      care_booking: "Care-Buchung",
      property_viewing: "Besichtigung",
      jobs_interview: "Vorstellungsgespräch",
      learn_class: "Live-Kurs",
      studio_milestone: "Studio-Meilenstein",
      logistics_pickup: "Abholfenster",
      logistics_delivery: "Lieferfenster",
      room_session: "Raum-Sitzung",
    },
    dayLabels: {
      today: "Heute",
      tomorrow: "Morgen",
      yesterday: "Gestern",
    },
    portalLabels: {
      care: "Care",
      property: "Immobilien",
      jobs: "Jobs",
      studio: "Studio",
      learn: "Learn",
      logistics: "Logistik",
    },
  },
  notifications: {
    metadata: {
      title: "Benachrichtigungen",
      description: "Jedes HenryCo-Update – Wallet, Support, Jobs, Marktplatz, Care und mehr – in einem Live-Posteingang.",
    },
    hero: {
      eyebrow: "HenryCo · Live-Benachrichtigungen",
      ariaOverview: "Benachrichtigungsübersicht",
      ariaVolume: "Benachrichtigungsvolumen",
      ariaByDivision: "Nach Bereich",
      headlineZero: "Posteingang null bei HenryCo.",
      headlineOne: "Eine Sache braucht Ihre Aufmerksamkeit.",
      headlineFew: "{count} Benachrichtigungen zu sortieren.",
      headlineMany: "{count} Updates aus Ihren Bereichen.",
      blurbZero: "Alles, was HenryCo sendet, kommt hier in Echtzeit an – Wallet, Support, Jobs, Marktplatz, Care und mehr.",
      blurbStale: "Ältere Einträge haben sich angesammelt. Wischen zum Archivieren, tippen zum Öffnen oder direkt zu einem Thread springen.",
      blurbToday: "Heute sind {count} eingetroffen. Nutzen Sie die Filter, um sich auf einen einzelnen Bereich zu konzentrieren, oder durchlaufen Sie nur Ungelesenes.",
      tileUnreadLabel: "Ungelesen",
      tileUnreadFoot: "Wartet auf Ihren Blick",
      tileTodayLabel: "Heute",
      tileTodayFoot: "Eingetroffen in den letzten 24h",
      tileWeekLabel: "Diese Woche",
      tileWeekFoot: "Letzte Aktivität {when}",
      byDivision: "Nach Bereich",
      emptyDivisions: "Noch nichts eingetroffen.",
      lastActivityFallback: "keine aktuelle Aktivität",
      justNow: "gerade eben",
      minutesAgo: "vor {count} Min.",
      hoursAgo: "vor {count} Std.",
      daysAgo: "vor {count} T.",
    },
    inbox: {
      heading: "Posteingang",
      meta: "Tippen zum Öffnen, wischen zum Archivieren – Filter wirken über alle Bereiche.",
    },
    filters: {
      all: "Alle",
      unread: "Ungelesen",
      allSources: "Alle Quellen",
      activeFilter: "aktiver Filter",
    },
    feed: {
      unreadSectionKicker: "Ungelesen",
      unreadSectionTitle: "Erfordert Ihre Aufmerksamkeit",
      recentSectionKicker: "Aktuell",
      recentSectionTitle: "Erledigte oder geprüfte Aktivität",
      unreadBadge: "Ungelesen",
      openMessageBoard: "Nachrichtenboard öffnen",
    },
    swipe: {
      archive: "Archivieren",
      delete: "Löschen",
      markRead: "Als gelesen markieren",
      markUnread: "Als ungelesen markieren",
    },
    emptyState: {
      inboxTitle: "Alles erledigt.",
      inboxBody: "Aktivitäten aus ganz HenryCo erscheinen hier, sobald sie eintreffen.",
      filterTitle: "Keine Aktivität in dieser Ansicht.",
      filterBody: "Versuchen Sie einen anderen Filter.",
    },
    markAllRead: {
      label: "Alle als gelesen markieren",
      pending: "Markiere alle als gelesen ...",
      spinner: "Markiere alle als gelesen",
    },
    footer: {
      recentlyDeleted: "Kürzlich gelöscht",
    },
  },
  "invoices": {
    "metadata": {
      "title": "Rechnungen & Belege",
      "description": "Ihr Zahlungsverlauf und herunterladbare Belege."
    },
    "hero": {
      "eyebrow": "Rechnungen · Belege",
      "ariaOverview": "Übersicht der Rechnungen",
      "ariaTotals": "Finanzielle Summen",
      "ariaByDivision": "Nach Division",
      "headlineEmpty": "Belege landen hier.",
      "headlineWithReceipts": "Jeder Beleg, ein Ort.",
      "blurb": "Jede Zahlung in HenryCo erscheint hier als markenbezogene, herunterladbare PDF — Care-Buchungen, Marketplace-Bestellungen, Studio-Rechnungen, Logistics-Sendungen, Learn-Zertifikate.",
      "totalPaidLabel": "Gesamt bezahlt · lebenslang",
      "thisMonthLabel": "Bezahlt · diesen Monat",
      "thisMonthFoot": "Belege aus diesem Kalendermonat",
      "outstandingLabel": "Offen",
      "paidCountUnit": "Belege",
      "pendingCountUnit": "ausstehend",
      "overdueCountUnit": "überfällig",
      "byDivision": "Nach Division",
      "byDivisionEmpty": "Noch keine Rechnungen."
    },
    "section": {
      "title": "Alle Rechnungen",
      "receiptsOnFileSingular": "Beleg gespeichert",
      "receiptsOnFilePlural": "Belege gespeichert"
    },
    "empty": {
      "title": "Noch keine Rechnungen",
      "description": "Ihre Rechnungen und Belege erscheinen hier, sobald Sie Zahlungen in HenryCo-Diensten tätigen."
    },
    "statuses": {
      "paid": "Bezahlt",
      "pending": "Ausstehend",
      "overdue": "Überfällig",
      "draft": "Entwurf",
      "cancelled": "Storniert",
      "refunded": "Erstattet",
      "fallback": "Status ausstehend"
    },
    "list": {
      "ariaLabel": "Rechnungen",
      "fallbackTitle": "Rechnung {number}",
      "rowAriaLabel": "Rechnung {number} über ₦{amount}"
    },
    "divisions": {
      "account": "Konto",
      "wallet": "Wallet",
      "marketplace": "Marketplace",
      "studio": "Studio",
      "jobs": "Jobs",
      "learn": "Learn",
      "property": "Property",
      "logistics": "Logistics",
      "care": "Care",
      "fallback": "Konto"
    },
    "footerNote": "Belege werden als markenbezogene PDFs heruntergeladen."
  },
  wallet: {
    hero: {
      ariaLabel: "Wallet-Saldo",
      eyebrow: "HenryCo Wallet · live",
      availableLabel: "Verfügbarer Saldo",
      balanceAriaTemplate: "Verfügbarer Saldo {amount} {currency}",
      settlementFallback: "Wird zum HenryCo-Tageskurs in Ihre Lokalwährung abgerechnet.",
      ctas: { fund: "Wallet aufladen", withdraw: "Auszahlen" },
      tiles: {
        verifiedLabel: "Verifizierter Saldo",
        verifiedFoot: "Übergreifend in HenryCo-Diensten nutzbar",
        pendingFundingLabel: "Ausstehende Einzahlung",
        pendingFundingFoot: "Bleibt separat, bis Finance bestätigt",
        pendingWithdrawalLabel: "Für Auszahlung reserviert",
        pendingWithdrawalFoot: "Bis zur Auszahlung gesperrt",
      },
    },
    sections: {
      actionsTitle: "Wallet-Aktionen",
      actionsMeta: "Einzahlen, auszahlen, bezahlen, abgleichen",
      pendingTitle: "Ausstehende Vorgänge",
      pendingMeta: "Vom verfügbaren Saldo getrennt gehalten",
      flowTitle: "So fließt Ihr Geld",
      flowMeta: "Letzte 30 Tage · letzte 6 Monate · nach Division",
      fundingTitle: "Aktuelle Einzahlungsanfragen",
      fundingMetaTemplate: "{count} in Prüfung",
      activityTitle: "Aktivität",
      activityMetaTemplate: "Letzte {count}",
    },
    quickActions: {
      ariaLabel: "Schnellaktionen Wallet",
      addFundsLabel: "Geld einzahlen",
      addFundsDesc: "Banküberweisung mit Beleg-Upload und sofortiger Bestätigung.",
      withdrawLabel: "Auszahlen",
      withdrawDesc: "Verfügbaren Saldo auf ein verifiziertes Bankkonto übertragen.",
      paymentsLabel: "Zahlungen",
      paymentsDesc: "Aktuelle Belastungen, Rückerstattungen und gespeicherte Methoden.",
      receiptsLabel: "Belege & Rechnungen",
      receiptsDesc: "Marken-PDFs über alle Divisionen.",
    },
    pendingOps: {
      fundingKicker: "Ausstehende Einzahlung",
      fundingDescEmpty: "Eingezahlte Beträge bleiben hier, bis Finance die Bankreferenz bestätigt hat.",
      fundingDescSingular: "{count} Anfrage in Prüfung — ein Beleg hält die Warteschlange in Bewegung.",
      fundingDescPlural: "{count} Anfragen in Prüfung — Belege halten die Warteschlange in Bewegung.",
      fundingCta: "Einzahlungsspur öffnen",
      withdrawalKicker: "Ausstehende Auszahlungen",
      withdrawalDescEmpty: "Auszahlungen warten hier während der Finance-Prüfung — Ihr verfügbarer Saldo wird nie doppelt zugesagt.",
      withdrawalDescSingular: "{count} Auszahlung wartet auf Auszahlung. Vom verfügbaren Saldo reserviert.",
      withdrawalDescPlural: "{count} Auszahlungen warten auf Auszahlung. Vom verfügbaren Saldo reserviert.",
      withdrawalCta: "Auszahlungsspur öffnen",
    },
    spend: {
      figureAriaLabel: "Ausgaben der letzten 6 Monate",
      last30Eyebrow: "Ausgaben · letzte 30 Tage",
      byDivisionEyebrow: "Nach Division",
      distributionAriaLabel: "Ausgabenverteilung nach Division",
      trendFlat: "Unverändert",
      trendBelowTemplate: "{pct}% unter den letzten 30 Tagen",
      trendAboveTemplate: "{pct}% über den letzten 30 Tagen",
      trendTitleTemplate: "vs. letzte 30 Tage (₦{amount})",
    },
    trust: {
      ariaLabel: "Auszahlungsbereitschaft",
      heading: "Auszahlungsbereitschaft",
      identityTitle: "Identität verifiziert",
      identityDescDoneTemplate: "{label}. Für Auszahlungen erforderlich.",
      identityDescTodoTemplate: "{label}. Einmal abschließen, um Auszahlungen freizuschalten.",
      identityCta: "Fortfahren →",
      pinTitle: "Auszahlungs-PIN",
      pinDescDone: "Ihre Auszahlungs-PIN ist eingerichtet.",
      pinDescTodo: "Legen Sie eine 4-stellige PIN fest, um jede Auszahlung zu autorisieren.",
      pinCta: "PIN festlegen →",
      payoutTitle: "Auszahlungsmethode",
      payoutDescSingular: "1 verifizierte Methode hinterlegt.",
      payoutDescPluralTemplate: "{count} verifizierte Methoden hinterlegt.",
      payoutDescEmpty: "Fügen Sie ein Bankkonto hinzu, um Auszahlungen zu erhalten.",
      payoutCtaManage: "Verwalten →",
      payoutCtaAdd: "Methode hinzufügen →",
      verificationLabels: {
        verified: "Identität verifiziert",
        pending: "Verifizierung in Prüfung",
        rejected: "Verifizierung benötigt erneute Einreichung",
        notSubmitted: "Identität noch nicht eingereicht",
      },
    },
    activity: {
      ariaLabel: "Wallet-Transaktionen",
      emptyTitle: "Noch keine Transaktionen",
      emptyBody: "Laden Sie Ihre Wallet auf, und Ihr Aktivitätsfeed zeigt hier jede Gutschrift, Belastung, Rückerstattung und jeden Bonus über alle HenryCo-Dienste.",
      fallbackTitle: "Wallet-Transaktion",
    },
    funding: {
      proofUploaded: "Beleg hochgeladen",
      awaitingProof: "Beleg ausstehend",
      ariaLabelTemplate: "Einzahlungsanfrage {reference} über ₦{amount}",
    },
    statusLabels: {
      pending: "Wartet auf Prüfung",
      awaiting_proof: "Beleg ausstehend",
      awaiting_review: "Wartet auf Prüfung",
      in_review: "In Prüfung",
      rejected: "Abgelehnt",
      cancelled: "Storniert",
      expired: "Abgelaufen",
      completed: "Bestätigt",
      verified: "Bestätigt",
      approved: "Genehmigt",
      paid: "Ausgezahlt",
    },
  },
};

const IT: DeepPartial<AccountCopy> = {
  "trustTierLabels": {
    "basic": "Essenziale",
    "verified": "Verificato",
    "trusted": "Affidabile",
    "premium_verified": "Premium verificato"
  },
  "common": {
    "source": "Fonte",
    "viewAll": "Visualizza tutto",
    "unread": "Non letto",
    "defaultBadge": "Predefinito",
    "noReceiptYet": "Nessuna ricevuta ancora",
    "unknownCustomer": "Cliente",
    "page": "Pagina",
    "of": "di",
    "perPage": "per pagina",
    "previous": "Precedente",
    "next": "Avanti",
    "filtered": "filtrato",
    "bookingSingular": "prenotazione",
    "bookingPlural": "prenotazioni",
    "justNow": "Proprio adesso"
  },
  "overview": {
    "welcomeBack": "Bentornato",
    "description": "Il tuo centro di comando HenryCo: tutto in tutte le divisioni, in un unico posto.",
    "walletBalance": "Saldo del portafoglio",
    "walletHint": "Portafoglio condiviso · Utilizzo tra i servizi HenryCo",
    "notifications": "Notifiche",
    "allCaughtUp": "Tutto preso",
    "unreadMessages": "Messaggi non letti",
    "activeSubscriptions": "Abbonamenti attivi",
    "noActivePlans": "Nessun piano attivo sincronizzato",
    "syncedPlans": "Piani attivi sincronizzati",
    "trustTier": "Livello di fiducia",
    "scoreLabel": "Punteggio",
    "businessActionsUnlocked": "Azioni aziendali sbloccate",
    "moreVerificationNeeded": "Sono necessarie ulteriori verifiche",
    "invoices": "Fatture",
    "pending": "in sospeso",
    "allSettled": "Tutto sistemato",
    "support": "Supporto",
    "newReplies": "con nuove risposte",
    "openRequests": "Richieste aperte",
    "noOpenRequests": "Nessuna richiesta aperta",
    "referrals": "Referral",
    "inviteAndEarn": "Invita e guadagna",
    "shareHenryCo": "Condividi HenryCo con altri",
    "transactions": "Transazioni",
    "viewHistory": "Visualizza la cronologia",
    "walletActivity": "Attività e pagamenti del portafoglio",
    "blockingLabel": "blocco",
    "highPriorityLabel": "passaggi successivi ad alta priorità",
    "actionCenterHint": "Il tuo Centro operativo ha la priorità in base ai segnali di fiducia in tempo reale, portafoglio, supporto e notifica.",
    "attentionKicker": "Cosa richiede la tua attenzione",
    "attentionTitle": "In corso, in attesa di te o ancora irrisolto",
    "pendingWalletVerification": "In attesa di verifica del portafoglio",
    "pendingWalletVerificationDetail": "La prova del tuo portafoglio è ancora in attesa della conferma del finanziamento.",
    "unreadNotificationsAttention": "Notifiche non lette",
    "unreadNotificationsAttentionDetail": "Gli aggiornamenti non letti sono ancora in attesa della tua revisione.",
    "activePlansInMotion": "Piani attivi in movimento",
    "activePlansInMotionDetail": "Gli abbonamenti sono attualmente in corso su questo account.",
    "unlockTier": "Sblocca {tier}",
    "nextTierFallback": "Il tuo prossimo livello di fiducia richiede una verifica più forte e una cronologia dell'account più pulita.",
    "quickActions": "Azioni rapide",
    "addMoney": "Aggiungi soldi",
    "getHelp": "Ottieni aiuto",
    "bookCare": "Cura del libro",
    "shop": "Negozio",
    "actionCenter": "Centro operativo",
    "actionCenterDescription": "Inizia innanzitutto bloccando gli elementi, quindi completa i passaggi ad alta priorità per mantenere il tuo account pienamente operativo.",
    "noUrgentTasks": "Nessuna attività urgente sull'account in questo momento. Ti trovi in ​​uno stato operativo sano.",
    "viewTaskQueue": "Visualizza la coda completa delle attività",
    "smartRecommendations": "Raccomandazioni intelligenti",
    "smartRecommendationsEmpty": "Continua a utilizzare i servizi HenryCo e i consigli si adatteranno alla tua attività.",
    "recommendationReason": "Suggerito dall'attività del tuo account e dallo stato di attendibilità ({confidence} confidenza)",
    "recentActivity": "Attività recente",
    "noRecentActivity": "Nessuna attività recente ancora",
    "recentNotifications": "Notifiche",
    "noNotifications": "Nessuna notifica ancora",
    "yourServices": "I tuoi servizi",
    "careService": "Cura",
    "careServiceDescription": "Cura, pulizia e manutenzione dei tessuti",
    "marketplaceService": "Mercato",
    "marketplaceServiceDescription": "Acquista prodotti e vendi online",
    "jobsService": "Lavori",
    "jobsServiceDescription": "Candidature, ruoli salvati e aggiornamenti del reclutatore",
    "studioService": "Studio",
    "studioServiceDescription": "Servizi creativi e di progettazione",
    "recommendationTitles": {
      "trustNext": "Completa la verifica della fiducia",
      "profileNext": "Completa il tuo profilo",
      "jobsSaved": "Segui i ruoli salvati"
    },
    "recommendationDescriptions": {
      "trustNext": "Sblocca più azioni su HenryCo.",
      "profileNext": "Un profilo completo migliora il supporto e la continuità del servizio.",
      "jobsSaved": "Rivisita i ruoli che hai già salvato e agisci di conseguenza.",
      "fallback": "Continua a utilizzare i servizi HenryCo e i consigli si adatteranno alla tua attività."
    }
  },
  "tasks": {
    "title": "Compiti",
    "description": "Azioni prioritarie tra account, trust, portafoglio e supporto.",
    "queueTitle": "Come funziona questa coda",
    "queueBody": "Il blocco delle attività può impedire l'accesso a flussi di lavoro importanti. Gli elementi ad alta priorità rappresentano le azioni migliori per mantenere integro il tuo account ed evitare ritardi.",
    "emptyTitle": "Nessuna attività attiva",
    "emptyDescription": "Al momento sei libero. Le attività verranno visualizzate qui quando è necessaria un'azione.",
    "blocking": "blocco",
    "priorityLabels": {
      "low": "basso",
      "normal": "normale",
      "high": "alto",
      "urgent": "urgente"
    },
    "taskTitles": {
      "trust": "Completa i passaggi di verifica dell'attendibilità",
      "walletFunding": "Segui i finanziamenti del portafoglio in sospeso",
      "support": "Rispondi per aprire le discussioni di supporto",
      "notifications": "Esamina le notifiche non lette"
    },
    "taskDescriptions": {
      "trustFallback": "Aggiorna il livello di fiducia per sbloccare più funzionalità.",
      "walletFunding": "La tua prova è in attesa di conferma finanziaria.",
      "support": "Le conversazioni aperte di supporto richiedono ancora la tua attenzione.",
      "notifications": "Gli aggiornamenti non letti sono in attesa di revisione."
    }
  },
  "security": {
    "title": "Sicurezza",
    "description": "Controlla l'attività di sicurezza recente, modifica la password e termina le sessioni HenryCo quando necessario.",
    "trustProfile": "Profilo di fiducia",
    "trustDescription": "La fiducia è operativa in tutto l'account. Ora controlla le azioni aziendali di valore più elevato, la postura di moderazione e un'idoneità più forte per i moduli HenryCo.",
    "trustScore": "Punteggio di affidabilità dell'account",
    "signalLabels": {
      "emailVerified": "E-mail verificata",
      "identityStatus": "Stato dell'identità",
      "trustedPhone": "Telefono fidato",
      "profileCompletion": "Completamento del profilo",
      "suspiciousEvents": "Eventi sospetti",
      "contactReview": "Revisione dei contatti"
    },
    "signalValues": {
      "confirmed": "Confermato",
      "needsAttention": "Ha bisogno di attenzione",
      "verified": "Verificato",
      "underReview": "In corso di revisione",
      "needsResubmission": "Necessita di nuovo invio",
      "notSubmitted": "Non inviato",
      "present": "Presente",
      "missing": "Mancante",
      "manualReview": "Revisione manuale",
      "clear": "Chiaro"
    },
    "whyYouAreHere": "Perché sei qui",
    "topTrustLaneReached": "Corsia di attendibilità superiore raggiunta",
    "topTrustLaneDescription": "Questo account soddisfa già la corsia di attendibilità più elevata attualmente disponibile nel dashboard condiviso.",
    "baselineReason": "Il profilo del tuo account di base è attivo.",
    "whatUnlocks": "Cosa sblocca {tier}",
    "regionalContext": "Contesto regionale",
    "accountStatus": "Stato dell'account",
    "needsReview": "Necessita di revisione",
    "secure": "Sicuro",
    "email": "E-mail",
    "accountHistory": "Cronologia del conto",
    "historyDays": "{days} giorni di cronologia dell'account",
    "operationalAccess": "Accesso operativo",
    "higherTrustAvailable": "Sono disponibili azioni commerciali e di pagamento con maggiore fiducia",
    "moreVerificationNeeded": "Sono necessarie ulteriori verifiche",
    "trustGuide": "Guida allo stato di fiducia",
    "whatCurrentStateMeans": "Cosa significa il tuo stato attuale",
    "whatCurrentStateBody": "Questo stato determina l'accesso a flussi di lavoro e azioni aziendali di valore superiore in HenryCo.",
    "whatToDoNext": "Cosa fare dopo",
    "whatToDoNextBody": "Completa i requisiti elencati per sbloccare la corsia di fiducia successiva.",
    "currentRestrictions": "Azioni attualmente limitate",
    "noRestrictions": "Nessuna restrizione basata sulla fiducia sta attualmente bloccando i flussi di lavoro principali del tuo account.",
    "recentActivity": "Attività di sicurezza recente",
    "recentActivityDescription": "Gli accessi, le disconnessioni, le impronte digitali del dispositivo e i segnali di accesso sospetto vengono registrati qui in modo che la continuità della sessione rimanga verificabile anche prima che vengano spediti controlli di revoca separati per dispositivo.",
    "emptyTitle": "Nessuna attività di sicurezza recente",
    "emptyDescription": "Qui verranno visualizzati gli accessi, le chiusure delle sessioni, gli avvisi e le modifiche sensibili dell'account.",
    "risk": "rischio",
    "blockedActions": {
      "jobs": "Crea lavori verificati o elenchi di maggiore affidabilità",
      "marketplace": "Accedi ai privilegi completi del venditore del marketplace",
      "property": "Pubblica i flussi di lavoro dei proprietari di immobili senza aggiungere alcuna verifica dell'identità",
      "payouts": "Utilizza azioni sensibili ai pagamenti e alle finanze senza revisione",
      "staff": "Utilizza percorsi di elevazione sensibili al personale o alle finanze senza una prova di identità più forte",
      "financial": "Utilizza flussi di lavoro finanziari sensibili senza revisione",
      "overlap": "Utilizza flussi di lavoro per venditori, pubblicazioni di proprietà o pagamenti con maggiore fiducia finché la revisione dei contatti non viene cancellata"
    },
    "reasons": {
      "verificationApproved": "La verifica dell'identità è approvata.",
      "verificationPending": "La verifica dell'identità è stata inviata ed è in fase di revisione.",
      "verificationRejected": "La verifica dell'identità richiede più informazioni prima che le azioni con attendibilità più elevata possano essere sbloccate.",
      "verificationMissing": "La verifica dell'identità non è stata ancora completata.",
      "emailVerified": "La proprietà dell'email è verificata.",
      "identityVerified": "La verifica dell'identità supportata dal documento è completata.",
      "documentsUnderReview": "I documenti d'identità sono attualmente in fase di revisione.",
      "verificationNeedsAttention": "La verifica dell'identità richiede attenzione prima che le corsie di fiducia più forti possano sbloccarsi.",
      "phonePresent": "C'è un numero di telefono in archivio.",
      "profileStrong": "Il completamento del profilo è sufficientemente efficace per i flussi di lavoro verificati.",
      "accountHistory": "La cronologia dell'account dura da {days} giorni.",
      "transactionHistory": "Esiste una cronologia delle transazioni verificate.",
      "noRiskSignals": "Non è stato trovato alcun evento recente ad alto rischio per la sicurezza."
    },
    "requirements": {
      "verified": {
        "verification": "Verifica completa dell'identità in modo che le corsie basate sulla fiducia smettano di fare affidamento su segnali di profilo ottimistici.",
        "email": "Verifica il tuo indirizzo email.",
        "identity": "Verifica completa dell'identità per flussi di lavoro sensibili a venditori, proprietà, pagamenti e aspetti finanziari.",
        "phone": "Aggiungi un numero di telefono utilizzabile.",
        "profile": "Completa di più il tuo profilo e aggiungi documenti di prova.",
        "overlap": "Un dettaglio di contatto condiviso necessita di una revisione manuale dell'attendibilità prima che si sblocchino le azioni con attendibilità più elevata."
      },
      "trusted": {
        "verification": "È necessaria l'approvazione della verifica dell'identità prima che le corsie di venditore, datore di lavoro, proprietà e pagamento attendibili possano essere sbloccate.",
        "age": "Aumenta l'età dell'account prima che lo stato attendibile venga sbloccato.",
        "transactions": "Completa almeno una transazione verificata o un ciclo di finanziamento.",
        "suspicious": "Mantieni l'account libero da avvisi di accesso sospetto.",
        "overlap": "Risolvi la revisione della sovrapposizione dei contatti prima dello sblocco del venditore affidabile, del pagamento o delle corsie di proprietà."
      },
      "premium": {
        "verification": "La fiducia Premium è riservata agli account che hanno già superato la verifica dell'identità.",
        "age": "Mantieni una cronologia dell'account pulita più a lungo.",
        "transactions": "Crea un record di transazioni verificato più forte.",
        "activity": "Utilizza più divisioni HenryCo con risultati puliti.",
        "overlap": "Mantieni chiara la revisione dei contatti duplicati prima che possa essere concessa la fiducia premium."
      }
    }
  },
  "changePassword": {
    "passwordsDoNotMatch": "Le password non corrispondono",
    "passwordTooShort": "La password deve contenere almeno 8 caratteri",
    "success": "La tua password è stata aggiornata.",
    "unavailable": "Non è possibile aggiornare la tua password in questo momento. Per favore riprova.",
    "newPassword": "Nuova password",
    "confirmNewPassword": "Conferma la nuova password",
    "minPlaceholder": "minimo 8 caratteri",
    "repeatPlaceholder": "Ripeti la nuova password",
    "updating": "Aggiornamento password...",
    "updatePassword": "Aggiorna password"
  },
  "globalSignOut": {
    "title": "Termina ogni HenryCo sessione",
    "description": "In questo modo l'account corrente verrà disconnesso da tutte le divisioni e dispositivi HenryCo, quindi verrai riportato alla superficie di accesso dell'account.",
    "note": "L'attività recente del dispositivo e della sessione rimane visibile di seguito anche se la revoca in tempo reale per dispositivo non è ancora esposta come controllo separato.",
    "unavailable": "Non è possibile terminare ogni sessione di HenryCo in questo momento. Riprova tra un attimo.",
    "ending": "Fine di tutte le sessioni...",
    "endAllSessions": "Esci da tutte le sessioni HenryCo"
  },
  "errorBoundary": {
    "kicker": "Durata dell'account",
    "title": "La superficie dell'account ha riscontrato un errore nel client o nel rendering",
    "description": "Il guasto è stato catturato per le indagini. Ricarica questa superficie e continua dall'ultimo stato stabile.",
    "reload": "Ricarica questa visualizzazione",
    "contactSupport": "Contatta l'assistenza"
  },
  "activity": {
    "title": "Attività",
    "description": "Tutto ciò che hai fatto in tutte le divisioni HenryCo.",
    "emptyTitle": "Nessuna attività al momento",
    "emptyDescription": "La tua attività tra le divisioni apparirà qui man mano che usi i servizi HenryCo.",
    "statusLabels": {
      "pending": "In attesa",
      "open": "Aperto",
      "updated": "Aggiornato",
      "completed": "Completato",
      "resolved": "Risolto",
      "paid": "Pagato",
      "failed": "Fallito",
      "active": "Attivo",
      "refunded": "Rimborsato"
    },
    "filters": {
      "heading": "Filtra e scarica",
      "reset": "Ripristina",
      "fromLabel": "Da",
      "toLabel": "A",
      "amountFromLabel": "Importo da (₦)",
      "amountToLabel": "Importo a (₦)",
      "divisionEyebrow": "Divisione",
      "typeEyebrow": "Tipo",
      "statusEyebrow": "Stato",
      "pdfNote": "Il PDF riporta ogni filtro impostato sopra nell'intestazione del documento — ciò che vedi è ciò che scarichi.",
      "downloadLabel": "Scarica l'estratto",
      "downloadFilename": "HenryCo-Storico-Transazioni.pdf",
      "shareTitle": "Storico transazioni HenryCo",
      "typeLabels": {
        "payment": "pagamento",
        "wallet_credit": "accredito portafoglio",
        "wallet_debit": "addebito portafoglio",
        "refund": "rimborso",
        "withdrawal": "prelievo",
        "fee": "commissione"
      }
    }
  },
  notifications: {
    metadata: {
      title: "Notifiche",
      description: "Ogni aggiornamento HenryCo — wallet, supporto, lavori, marketplace, care e altro — in una casella in tempo reale.",
    },
    hero: {
      eyebrow: "HenryCo · notifiche in tempo reale",
      ariaOverview: "Panoramica notifiche",
      ariaVolume: "Volume notifiche",
      ariaByDivision: "Per divisione",
      headlineZero: "Casella azzerata su HenryCo.",
      headlineOne: "Una cosa attende la tua attenzione.",
      headlineFew: "{count} notifiche da gestire.",
      headlineMany: "{count} aggiornamenti tra le tue divisioni.",
      blurbZero: "Tutto ciò che HenryCo invia arriva qui in tempo reale — wallet, supporto, lavori, marketplace, care e altro.",
      blurbStale: "Elementi più vecchi si sono accumulati. Scorri per archiviare, tocca per aprire o vai direttamente a un thread.",
      blurbToday: "Oggi sono arrivate {count}. Usa i filtri per concentrarti su una singola divisione o sfoglia solo i non letti.",
      tileUnreadLabel: "Non lette",
      tileUnreadFoot: "In attesa del tuo sguardo",
      tileTodayLabel: "Oggi",
      tileTodayFoot: "Arrivate nelle ultime 24h",
      tileWeekLabel: "Questa settimana",
      tileWeekFoot: "Ultima attività {when}",
      byDivision: "Per divisione",
      emptyDivisions: "Nulla è ancora arrivato.",
      lastActivityFallback: "nessuna attività recente",
      justNow: "proprio ora",
      minutesAgo: "{count} min fa",
      hoursAgo: "{count} h fa",
      daysAgo: "{count} g fa",
    },
    inbox: {
      heading: "Casella",
      meta: "Tocca per aprire, scorri per archiviare — i filtri funzionano su tutte le divisioni.",
    },
    filters: {
      all: "Tutte",
      unread: "Non lette",
      allSources: "Tutte le fonti",
      activeFilter: "filtro attivo",
    },
    feed: {
      unreadSectionKicker: "Non lette",
      unreadSectionTitle: "Richiede la tua attenzione",
      recentSectionKicker: "Recente",
      recentSectionTitle: "Attività evasa o revisionata",
      unreadBadge: "Non letto",
      openMessageBoard: "Apri bacheca messaggi",
    },
    swipe: {
      archive: "Archivia",
      delete: "Elimina",
      markRead: "Segna come letto",
      markUnread: "Segna come non letto",
    },
    emptyState: {
      inboxTitle: "Tutto sotto controllo.",
      inboxBody: "L’attività di tutto HenryCo appare qui non appena accade.",
      filterTitle: "Nessuna attività in questa vista.",
      filterBody: "Prova un filtro diverso.",
    },
    markAllRead: {
      label: "Segna tutto come letto",
      pending: "Segno tutto come letto...",
      spinner: "Segno tutto come letto",
    },
    footer: {
      recentlyDeleted: "Eliminate di recente",
    },
  },
  calendar: {
    metaTitle: "Calendario · HenryCo",
    metaDescription:
      "Agenda multi-portale — prenotazioni Care, visite immobiliari, colloqui Jobs, traguardi Studio, lezioni Learn, finestre logistiche.",
    heroAriaLabel: "Panoramica del calendario",
    heroEyebrow: "HenryCo · calendario multi-portale",
    tileVolumeAriaLabel: "Volume del calendario",
    tileEventsLabel: "Eventi",
    tileEventsFoot: "Prossimi 28 giorni",
    tilePortalsLabel: "Portali",
    tilePortalsFootEmpty: "Care, immobiliare, jobs, studio, learn, logistica",
    tilePortalsFootSingular: "Una divisione pianificata",
    tilePortalsFootPlural: "{count} divisioni pianificate",
    tileNextLabel: "Prossimo",
    tileNextEmpty: "Nulla pianificato nella finestra",
    sideAriaLabel: "Per portale",
    sideLabel: "Per portale",
    sideTitleEmpty: "Ancora nessuna pianificazione",
    sideTitleSingular: "Un portale attivo",
    sideTitlePlural: "{count} portali in gioco",
    sideBody:
      "Prenotazioni, visite, colloqui, traguardi, lezioni e finestre di spedizione appaiono qui in ordine cronologico.",
    agendaTitle: "Agenda",
    agendaAriaLabel: "Eventi pianificati per giorno",
    agendaMetaEmpty: "Nulla pianificato nella finestra di 28 giorni",
    agendaMetaSingular: "{count} evento · prossimi 28 giorni",
    agendaMetaPlural: "{count} eventi · prossimi 28 giorni",
    emptyEyebrow: "Calendario tranquillo",
    emptyTitle: "Nulla pianificato nei prossimi 28 giorni.",
    emptyBody:
      "Tutto ciò che prenoti — un ritiro Care, una visita immobiliare, un colloquio, una lezione Learn, un traguardo Studio, una finestra logistica — atterrerà automaticamente in questa agenda. I filtri appariranno non appena i portali inizieranno a pianificare.",
    dayMetaSingular: "{count} evento",
    dayMetaPlural: "{count} eventi",
    eventTimeAriaLabel: "Orario dell’evento",
    eventCta: "Apri",
    headline: {
      empty: "Nulla pianificato nei prossimi 28 giorni.",
      calmOne: "Un solo elemento in agenda.",
      calmMany: "{count} eventi nei prossimi 28 giorni.",
      busy: "{count} eventi pianificati su {portals} portali.",
      packed: "{count} eventi in coda — pianifica saggiamente il tempo di focus.",
    },
    blurb: {
      empty:
        "Prenotazioni Care, visite immobiliari, colloqui Jobs, traguardi Studio, lezioni Learn e finestre logistiche appaiono tutti qui.",
      calm: "Tocca una scheda per saltare al suo portale. L’agenda si aggiorna automaticamente all’arrivo di nuove pianificazioni.",
      busyOrPacked:
        "I filtri in cima all’agenda restringono a un singolo portale — utile quando una divisione è rumorosa.",
    },
    kindLabels: {
      care_booking: "Prenotazione Care",
      property_viewing: "Visita immobiliare",
      jobs_interview: "Colloquio",
      learn_class: "Lezione dal vivo",
      studio_milestone: "Traguardo Studio",
      logistics_pickup: "Finestra di ritiro",
      logistics_delivery: "Finestra di consegna",
      room_session: "Sessione in sala",
    },
    dayLabels: {
      today: "Oggi",
      tomorrow: "Domani",
      yesterday: "Ieri",
    },
    portalLabels: {
      care: "Care",
      property: "Immobiliare",
      jobs: "Jobs",
      studio: "Studio",
      learn: "Learn",
      logistics: "Logistica",
    },
  },
  invoices: {
    metadata: {
      title: "Fatture e ricevute",
      description: "Lo storico dei tuoi pagamenti e le ricevute scaricabili.",
    },
    hero: {
      eyebrow: "Fatture · ricevute",
      ariaOverview: "Panoramica delle fatture",
      ariaTotals: "Totali finanziari",
      ariaByDivision: "Per divisione",
      headlineEmpty: "Le ricevute appariranno qui.",
      headlineWithReceipts: "Ogni ricevuta, in un solo posto.",
      blurb:
        "Ogni pagamento su HenryCo atterra qui come PDF di marca scaricabile — prenotazioni Care, ordini Marketplace, fatture Studio, spedizioni Logistics, certificati Learn.",
      totalPaidLabel: "Pagato · a vita",
      thisMonthLabel: "Pagato · questo mese",
      thisMonthFoot: "Ricevute datate in questo mese di calendario",
      outstandingLabel: "In sospeso",
      paidCountUnit: "ricevute",
      pendingCountUnit: "in sospeso",
      overdueCountUnit: "scadute",
      byDivision: "Per divisione",
      byDivisionEmpty: "Ancora nessuna fattura.",
    },
    section: {
      title: "Tutte le fatture",
      receiptsOnFileSingular: "ricevuta archiviata",
      receiptsOnFilePlural: "ricevute archiviate",
    },
    empty: {
      title: "Ancora nessuna fattura",
      description:
        "Le tue fatture e ricevute appariranno qui dopo aver effettuato pagamenti nei servizi HenryCo.",
    },
    statuses: {
      paid: "Pagata",
      pending: "In sospeso",
      overdue: "Scaduta",
      draft: "Bozza",
      cancelled: "Annullata",
      refunded: "Rimborsata",
      fallback: "Stato in sospeso",
    },
    list: {
      ariaLabel: "Fatture",
      fallbackTitle: "Fattura {number}",
      rowAriaLabel: "Fattura {number} per ₦{amount}",
    },
    divisions: {
      account: "Account",
      wallet: "Wallet",
      marketplace: "Marketplace",
      studio: "Studio",
      jobs: "Jobs",
      learn: "Learn",
      property: "Property",
      logistics: "Logistics",
      care: "Care",
      fallback: "Account",
    },
    footerNote: "Le ricevute si scaricano come PDF di marca.",
  },
  wallet: {
    hero: {
      ariaLabel: "Saldo del portafoglio",
      eyebrow: "Portafoglio HenryCo · live",
      availableLabel: "Saldo disponibile",
      balanceAriaTemplate: "Saldo disponibile {amount} {currency}",
      settlementFallback: "Liquidato nella tua valuta locale al tasso HenryCo del giorno.",
      ctas: { fund: "Ricarica portafoglio", withdraw: "Preleva" },
      tiles: {
        verifiedLabel: "Saldo verificato",
        verifiedFoot: "Spendibile in tutti i servizi HenryCo",
        pendingFundingLabel: "Ricarica in attesa",
        pendingFundingFoot: "Resta separata fino alla conferma di Finance",
        pendingWithdrawalLabel: "Trattenuto per prelievo",
        pendingWithdrawalFoot: "Riservato fino al completamento del pagamento",
      },
    },
    sections: {
      actionsTitle: "Azioni del portafoglio",
      actionsMeta: "Aggiungi, preleva, paga, concilia",
      pendingTitle: "Operazioni in sospeso",
      pendingMeta: "Tenute separate dal tuo saldo disponibile",
      flowTitle: "Come fluisce il tuo denaro",
      flowMeta: "Ultimi 30 giorni · ultimi 6 mesi · per divisione",
      fundingTitle: "Richieste di ricarica recenti",
      fundingMetaTemplate: "{count} in revisione",
      activityTitle: "Attività",
      activityMetaTemplate: "Ultime {count}",
    },
    quickActions: {
      ariaLabel: "Azioni rapide del portafoglio",
      addFundsLabel: "Aggiungi fondi",
      addFundsDesc: "Bonifico con caricamento prova e conferma immediata.",
      withdrawLabel: "Preleva",
      withdrawDesc: "Sposta il saldo disponibile su un conto bancario verificato.",
      paymentsLabel: "Pagamenti",
      paymentsDesc: "Addebiti recenti, rimborsi e metodi salvati.",
      receiptsLabel: "Ricevute e fatture",
      receiptsDesc: "PDF di marca per tutte le divisioni.",
    },
    pendingOps: {
      fundingKicker: "Ricarica in attesa",
      fundingDescEmpty: "I fondi che trasferisci restano qui finché Finance non conferma il riferimento bancario.",
      fundingDescSingular: "{count} richiesta in revisione — la prova fa avanzare la coda.",
      fundingDescPlural: "{count} richieste in revisione — la prova fa avanzare la coda.",
      fundingCta: "Apri corsia ricarica",
      withdrawalKicker: "Prelievi in attesa",
      withdrawalDescEmpty: "I prelievi attendono qui durante la revisione di Finance — il tuo saldo disponibile non viene mai promesso due volte.",
      withdrawalDescSingular: "{count} prelievo in attesa di pagamento. Riservato sul saldo disponibile.",
      withdrawalDescPlural: "{count} prelievi in attesa di pagamento. Riservati sul saldo disponibile.",
      withdrawalCta: "Apri corsia prelievo",
    },
    spend: {
      figureAriaLabel: "Spesa degli ultimi 6 mesi",
      last30Eyebrow: "Spesa · ultimi 30 giorni",
      byDivisionEyebrow: "Per divisione",
      distributionAriaLabel: "Distribuzione della spesa per divisione",
      trendFlat: "Stabile",
      trendBelowTemplate: "{pct}% sotto i 30g precedenti",
      trendAboveTemplate: "{pct}% sopra i 30g precedenti",
      trendTitleTemplate: "vs 30 giorni precedenti (₦{amount})",
    },
    trust: {
      ariaLabel: "Idoneità al prelievo",
      heading: "Idoneità al prelievo",
      identityTitle: "Identità verificata",
      identityDescDoneTemplate: "{label}. Richiesta per i pagamenti di prelievo.",
      identityDescTodoTemplate: "{label}. Completala una volta per sbloccare i prelievi.",
      identityCta: "Continua →",
      pinTitle: "PIN di prelievo",
      pinDescDone: "Il tuo PIN di prelievo è impostato.",
      pinDescTodo: "Imposta un PIN a 4 cifre per autorizzare ogni prelievo.",
      pinCta: "Imposta PIN →",
      payoutTitle: "Metodo di pagamento",
      payoutDescSingular: "1 metodo verificato in archivio.",
      payoutDescPluralTemplate: "{count} metodi verificati in archivio.",
      payoutDescEmpty: "Aggiungi un conto bancario per ricevere i prelievi.",
      payoutCtaManage: "Gestisci →",
      payoutCtaAdd: "Aggiungi metodo →",
      verificationLabels: {
        verified: "Identità verificata",
        pending: "Verifica in revisione",
        rejected: "La verifica richiede un altro invio",
        notSubmitted: "Identità non ancora inviata",
      },
    },
    activity: {
      ariaLabel: "Transazioni del portafoglio",
      emptyTitle: "Ancora nessuna transazione",
      emptyBody: "Ricarica il tuo portafoglio e il flusso di attività mostrerà ogni accredito, addebito, rimborso e bonus tra i servizi HenryCo.",
      fallbackTitle: "Transazione del portafoglio",
    },
    funding: {
      proofUploaded: "Prova caricata",
      awaitingProof: "In attesa di prova",
      ariaLabelTemplate: "Richiesta di ricarica {reference} per ₦{amount}",
    },
    statusLabels: {
      pending: "In attesa di revisione",
      awaiting_proof: "In attesa di prova",
      awaiting_review: "In attesa di revisione",
      in_review: "In revisione",
      rejected: "Rifiutato",
      cancelled: "Annullato",
      expired: "Scaduto",
      completed: "Confermato",
      verified: "Confermato",
      approved: "Approvato",
      paid: "Pagato",
    },
  },
};

const IG: DeepPartial<AccountCopy> = {
  trustTierLabels: {
    basic: "Ntọala",
    verified: "Emechara",
    trusted: "Ntụkwasị obi",
    premium_verified: "Premium Emechara",
  },
  common: {
    source: "Isi mmalite",
    viewAll: "Lelee niile",
    unread: "Aghọtaghị",
    defaultBadge: "Ndabara",
    noReceiptYet: "Ọ dịghị ọnụego",
    unknownCustomer: "Onye ahịa",
    page: "Peeji",
    of: "nke",
    perPage: "n'otu peeji",
    previous: "Nke gara aga",
    next: "Ọzọ",
    filtered: "Etọlere",
    bookingSingular: "ndekọ",
    bookingPlural: "ndekọ",
    justNow: "Ugbu a",
  },
  overview: {
    welcomeBack: "Nnọọ ọzọ",
    description: "Ọdụ ọchịchọ HenryCo gị — ihe niile n'ịdị ìhè niile, otu ebe.",
    walletBalance: "Ego nọ n'akpa gị",
    walletHint: "Akpa ego nkekọrịta · Jiri n'ọrụ HenryCo",
    notifications: "Ọkwa",
    allCaughtUp: "Niile dị mma",
    unreadMessages: "Ozi aghọtaghị",
    activeSubscriptions: "Ndebanye nọ na-arụ ọrụ",
    noActivePlans: "Ọ dịghị atụmatụ ndekọ nọ na-arụ ọrụ",
    syncedPlans: "Atụmatụ ndekọ nọ na-arụ ọrụ",
    trustTier: "Ọkwa ntụkwasị obi",
    scoreLabel: "Ọnụ ọgụgụ",
    businessActionsUnlocked: "Omume azụmahịa mepere emepe",
    moreVerificationNeeded: "Achọrọ nyocha ọzọ",
    invoices: "Ụgwọ ọrụ",
    pending: "na-atọ",
    allSettled: "Niile kwụọtara",
    support: "Nkwado",
    newReplies: "nwere ọzaazị ọhụrụ",
    openRequests: "Arịọ mepere emepe",
    noOpenRequests: "Ọ dịghị arịọ mepere emepe",
    referrals: "Ndu",
    inviteAndEarn: "Kpọọ ndị ọzọ ma rite",
    shareHenryCo: "Kekọrịta HenryCo na ndị ọzọ",
    transactions: "Azụmahịa",
    viewHistory: "Lelee akụkọ ihe mere eme",
    walletActivity: "Arụmọrụ akpa ego & ọnụọgụ",
    blockingLabel: "na-egbochi",
    highPriorityLabel: "nzọụkwụ isi na-abịa n'ihu nke dị mkpa",
    actionCenterHint: "A na-ahazị Ebe Omume gị site na ntụkwasị obi dị ndụ, akpa ego, nkwado, na ọkwa.",
    attentionKicker: "Ihe chọrọ uche gị",
    attentionTitle: "Na-aga n'ihu, na-atọ gị, ma ọ bụ ka emegharịghị",
    pendingWalletVerification: "Na-atọ nyocha akpa ego",
    pendingWalletVerificationDetail: "Ihe ndịichi akpa ego gị ka na-atọ nkwenye ego.",
    unreadNotificationsAttention: "Ọkwa aghọtaghị",
    unreadNotificationsAttentionDetail: "Mmelite aghọtaghị ka na-atọ nyocha gị.",
    activePlansInMotion: "Atụmatụ ndị na-arụ ọrụ",
    activePlansInMotionDetail: "Ndebanye nọ ugbu a na-arụ ọrụ n'akaụntụ a.",
    unlockTier: "Mepe {tier}",
    nextTierFallback: "Ọkwa ntụkwasị obi gị ọzọ chọrọ nyocha siri ike na akụkọ ihe mere eme akaụntụ dị ọcha.",
    quickActions: "Omume ngwa ngwa",
    addMoney: "Tinye ego",
    getHelp: "Nweta enyemaka",
    bookCare: "Dee nlekọta",
    shop: "Ịzụ ahịa",
    actionCenter: "Ebe Omume",
    actionCenterDescription: "Bido na ihe ndị na-egbochi nke mbụ, wee hichapụ nzọụkwụ ndị dị isi ike iji jigide akaụntụ gị na-arụ ọrụ nke ọma.",
    noUrgentTasks: "Ọ dịghị ọrụ akaụntụ ndị na-achọ ngwa ngwa ugbu a. Ị nọ n'ọnọdụ arụ ọrụ dị mma.",
    viewTaskQueue: "Lelee ahịrị ọrụ zuru oke",
    smartRecommendations: "Ndụmọdụ nzụlite",
    smartRecommendationsEmpty: "Nọgide na-eji ọrụ HenryCo ma ndụmọdụ ga-atọ dị na arụmọrụ gị.",
    recommendationReason: "A tụrụ aro site na arụmọrụ akaụntụ gị na ọnọdụ ntụkwasị obi ({confidence} ntụkwasị obi)",
    recentActivity: "Omume ọgbọ ọhụrụ",
    noRecentActivity: "Ọ dịghị omume ọgbọ ọhụrụ ka",
    recentNotifications: "Ọkwa",
    noNotifications: "Ọ dịghị ọkwa ka",
    yourServices: "Ọrụ gị",
    careService: "Care",
    careServiceDescription: "Nlekọta akwa, ịkọcha, na ọrụ ọkwa",
    marketplaceService: "Marketplace",
    marketplaceServiceDescription: "Zụọ ihe ma ree n'ntanetị",
    jobsService: "Jobs",
    jobsServiceDescription: "Nzụtara, ọrụ chekwabara, & mmelite onye ọchọ ọrụ",
    studioService: "Studio",
    studioServiceDescription: "Ọrụ mmepụta na nhazi",
    recommendationTitles: {
      trustNext: "Mezuo nyocha ntụkwasị obi gị",
      profileNext: "Nọchite profaịlụ gị",
      jobsSaved: "Sochie ọrụ i chekwabara",
    },
    recommendationDescriptions: {
      trustNext: "Mepe omume ọzọ na HenryCo.",
      profileNext: "Profaịlụ zuru oke na-emezi nkwado na-aga n'ihu ọrụ.",
      jobsSaved: "Laghachi na ọrụ i chekwabara ma mee ihe.",
      fallback: "Nọgide na-eji ọrụ HenryCo ma ndụmọdụ ga-atọ dị na arụmọrụ gị.",
    },
  },
  tasks: {
    title: "Ọrụ",
    description: "Omume ndị dị isi n'akaụntụ, ntụkwasị obi, akpa ego, na nkwado.",
    queueTitle: "Otu ahịrị a si arụ ọrụ",
    queueBody: "Ọrụ ndị na-egbochi nwere ike igbochi nnabata n'ihe arụ ọrụ dị mkpa. Ihe ndị dị isi ike bụ omume kachasị mma iji jigide akaụntụ gị n'ezi ọnọdụ ma zere ndakwasị.",
    emptyTitle: "Ọ dịghị ọrụ na-arụ ọrụ",
    emptyDescription: "I nọ n'ọnọdụ dị mma ugbu a. Ọrụ ga-apụta ebe a mgbe achọrọ omume.",
    blocking: "na-egbochi",
    priorityLabels: {
      low: "ala",
      normal: "nkịtị",
      high: "elu",
      urgent: "na-achọ ngwa ngwa",
    },
    taskTitles: {
      trust: "Mezuo nzọụkwụ nyocha ntụkwasị obi",
      walletFunding: "Sochie ego akpa ego na-atọ",
      support: "Zaa wịrị nkwado mepere emepe",
      notifications: "Nyochaa ọkwa aghọtaghị",
    },
    taskDescriptions: {
      trustFallback: "Kwalite ọkwa ntụkwasị obi iji mepe ihe ndị ọzọ.",
      walletFunding: "Ihe ndịichi gị na-atọ nkwenye ego.",
      support: "Mkparịta ụka nkwado mepere emepe ka achọrọ uche gị.",
      notifications: "Mmelite aghọtaghị na-atọ nyocha.",
    },
  },
  security: {
    title: "Nchedo",
    description: "Nyochaa omume nchedo ọgbọ ọhụrụ, gbanwee paswọọdụ gị, wee kwụsị nnọkọ HenryCo mgbe achọrọ.",
    trustProfile: "Profaịlụ Ntụkwasị Obi",
    trustDescription: "Ntụkwasị obi na-arụ ọrụ n'akaụntụ. Ugbu a na-achịkwa omume azụmahịa nwere ọnụahịa dị elu, ọnọdụ nlekọta, na ikike siri ike n'ọcha HenryCo niile.",
    trustScore: "Ọnụ ọgụgụ ntụkwasị obi akaụntụ",
    signalLabels: {
      emailVerified: "Email emechara nyocha",
      identityStatus: "Ọnọdụ nnabata",
      trustedPhone: "Ekwentị ntụkwasị obi",
      profileCompletion: "Mmezuo profaịlụ",
      suspiciousEvents: "Ihe omume ndị na-atọ egwu",
      contactReview: "Nyocha kpọtụrụ ọnụ",
    },
    signalValues: {
      confirmed: "Kwenyere",
      needsAttention: "Chọrọ uche",
      verified: "Emechara nyocha",
      underReview: "Na-enyocha",
      needsResubmission: "Chọrọ izipu ọzọ",
      notSubmitted: "Eziputabeghị",
      present: "Nọ ebe a",
      missing: "Efuola",
      manualReview: "Nyocha aka",
      clear: "Dị ọcha",
    },
    whyYouAreHere: "Ihe mere i nọ ebe a",
    topTrustLaneReached: "Etọrọ ụzọ ntụkwasị obi kasị elu",
    topTrustLaneDescription: "Akaụntụ a eruola ụzọ ntụkwasị obi kasị elu dị ugbu a na dashboard nkekọrịta.",
    baselineReason: "Profaịlụ akaụntụ ntọala gị na-arụ ọrụ.",
    whatUnlocks: "Ihe na-emepe {tier}",
    regionalContext: "Ọnọdụ mpaghara",
    accountStatus: "Ọnọdụ akaụntụ",
    needsReview: "Chọrọ nyocha",
    secure: "Echekwabara",
    email: "Email",
    accountHistory: "Akụkọ ihe mere eme akaụntụ",
    historyDays: "Akụkọ ihe mere eme akaụntụ nke ụbọchị {days}",
    operationalAccess: "Nnabata arụ ọrụ",
    higherTrustAvailable: "Omume azụmahịa dị elu na ọnụọgụ dị",
    moreVerificationNeeded: "Achọrọ nyocha ọzọ",
    trustGuide: "Nduzi ọnọdụ ntụkwasị obi",
    whatCurrentStateMeans: "Ihe ọnọdụ gị ugbu a pụtara",
    whatCurrentStateBody: "Ọnọdụ a na-ekpebi nnabata ihe arụ ọrụ dị elu na omume azụmahịa n'HenryCo.",
    whatToDoNext: "Ihe ị ga-emee ọzọ",
    whatToDoNextBody: "Mezuo ihe ndị e depụtara iji mepe ụzọ ntụkwasị obi ọzọ.",
    currentRestrictions: "Omume e gbochiri ugbu a",
    noRestrictions: "Ọ dịghị mmachi dabere na ntụkwasị obi na-egbochi ihe arụ ọrụ akaụntụ gị isi ugbu a.",
    recentActivity: "Omume Nchedo Ọgbọ Ọhụrụ",
    recentActivityDescription: "A na-edebanye ịbanye, ịpụ, ihe nzacha ngwaọrụ, na ọkwa nnabata ndị na-atọ egwu ebe a ka ọganihu nnọkọ nọgide na-enwe ike inyocha.",
    emptyTitle: "Ọ dịghị omume nchedo ọgbọ ọhụrụ",
    emptyDescription: "Ịbanye, nkwụsị nnọkọ, ịdọ aka ná ntị, na mgbanwe akaụntụ ndị dị nwayọọ ga-apụta ebe a.",
    risk: "ihe ize ndụ",
    blockedActions: {
      jobs: "Mepụta ọrụ emechara nyocha ma ọ bụ ndepụta dị elu ntụkwasị obi",
      marketplace: "Nnabata ikike ire ahịa zuru oke nke ọchịchọ",
      property: "Bipụtara ihe arụ ọrụ onye nwe ụlọ na-enweghị nyocha nnabata ọzọ",
      payouts: "Jiri omume ọnụọgụ na ego ndị mmetụta enweghị nyocha",
      staff: "Jiri ụzọ ịkwawanye ndị ọrụ ndị mmetụta enweghị ihe akaike nnabata siri ike",
      financial: "Jiri ihe arụ ọrụ ego ndị mmetụta enweghị nyocha",
      overlap: "Jiri onye ire ahịa dị elu ntụkwasị obi, bipụtara ụlọ, ma ọ bụ ihe arụ ọrụ ọnụọgụ ruo mgbe enyocha ọnụnọ kpọtụrụ",
    },
    reasons: {
      verificationApproved: "E kwenyere nyocha nnabata.",
      verificationPending: "Eziputara nyocha nnabata ma ọ na-enyocha.",
      verificationRejected: "Nyocha nnabata chọrọ ozi ndị ọzọ tupu emesi omume dị elu ntụkwasị obi.",
      verificationMissing: "Emechagheị nyocha nnabata.",
      emailVerified: "A nawaanyere ownership email.",
      identityVerified: "A mezuola nyocha nnabata nke akwụkwọ.",
      documentsUnderReview: "Akwụkwọ nnabata na-enyocha ugbu a.",
      verificationNeedsAttention: "Nyocha nnabata chọrọ uche tupu emesia ụzọ ntụkwasị obi siri ike.",
      phonePresent: "Ekwentị kpọtụrụ ọnụ nọ n'akwụkwọ.",
      profileStrong: "Mmezuo profaịlụ siri ike maka ihe arụ ọrụ emechara nyocha.",
      accountHistory: "Akụkọ ihe mere eme akaụntụ na-aga nke ụbọchị {days}.",
      transactionHistory: "Akụkọ azụmahịa emechara nyocha dị.",
      noRiskSignals: "Enweghị ihe omume nchedo dị elu ihe ize ndụ ọgbọ ọhụrụ.",
    },
    requirements: {
      verified: {
        verification: "Mezuo nyocha nnabata ka ụzọ dabere na ntụkwasị obi kwụsị ịdabere na ọkwa profaịlụ ndị na-atọ obi ụtọ.",
        email: "Nyochaa adreesị email gị.",
        identity: "Mezuo nyocha nnabata maka onye ire ahịa, ụlọ, ọnụọgụ, na ihe arụ ọrụ ndị mmetụta ego.",
        phone: "Tinye nọmba ekwentị enwere ike iji.",
        profile: "Mezuọ profaịlụ gị ma tinye akwụkwọ ndịichi.",
        overlap: "Ihe nkọwa kpọtụrụ ọnụ nkekọrịta chọrọ nyocha ntụkwasị obi aka tupu emesia omume dị elu ntụkwasị obi.",
      },
      trusted: {
        verification: "Achọrọ nkwenye nyocha nnabata tupu ụzọ onye ire ahịa ntụkwasị obi, onye ọrụ, ụlọ, na ọnụọgụ mee imepe.",
        age: "Wuo oge akaụntụ ọzọ tupu ọnọdụ ntụkwasị obi mee imepe.",
        transactions: "Mezuo opekata mpe otu azụmahịa emechara nyocha ma ọ bụ okirikiri ego.",
        suspicious: "Jide akaụntụ n'ọcha ịdọ aka ná ntị nnabata ndị na-atọ egwu.",
        overlap: "Dozie nyocha nnụchiko kpọtụrụ ọnụ tupu ụzọ onye ire ahịa ntụkwasị obi, ọnụọgụ, ma ọ bụ ụlọ mee imepe.",
      },
      premium: {
        verification: "A echekwabara ntụkwasị obi premium maka akaụntụ ndị eruola nyocha nnabata.",
        age: "Jide akụkọ ihe mere eme akaụntụ dị ọcha ogologo oge.",
        transactions: "Wuo ndekọ azụmahịa emechara nyocha siri ike.",
        activity: "Jiri ịdị ìhè HenryCo ndị ọzọ na nsonaazụ dị ọcha.",
        overlap: "Jide nyocha kpọtụrụ ọnụ nkekọrịta dị ọcha tupu emesi ntụkwasị obi premium.",
      },
    },
  },
  changePassword: {
    passwordsDoNotMatch: "Paswọọdụ ndị ahaghị ọnụ",
    passwordTooShort: "Paswọọdụ ga-enwerịrị opekata mpe mkpụrụedemede 8",
    success: "Emelitela paswọọdụ gị.",
    unavailable: "Enweghị ike imeli paswọọdụ gị ugbu a. Biko nwalee ọzọ.",
    newPassword: "Paswọọdụ ọhụrụ",
    confirmNewPassword: "Kwenye paswọọdụ ọhụrụ",
    minPlaceholder: "Opekata mpe mkpụrụedemede 8",
    repeatPlaceholder: "Poọtaazị paswọọdụ ọhụrụ",
    updating: "Na-emelite paswọọdụ...",
    updatePassword: "Melite paswọọdụ",
  },
  globalSignOut: {
    title: "Kwụsị nnọkọ HenryCo niile",
    description: "Nke a na-apụ akaụntụ ugbu a n'ịdị ìhè HenryCo niile na ngwaọrụ, wee laghachi gị n'ebe ịbanye akaụntụ.",
    note: "Omume ngwaọrụ na nnọkọ ọgbọ ọhụrụ ka na-apụta n'okpuru n'agbanyeghị na a naweghị imepe nkwụsị ndị ọ bụ onye isi n'ngwaọrụ ọ bụla dị ka ihe njikwa dị iche.",
    unavailable: "Enweghị ike ikwụsị nnọkọ HenryCo niile ugbu a. Nwalee ọzọ n'oge na-adịghị anya.",
    ending: "Na-akwụsị nnọkọ niile...",
    endAllSessions: "Pụọ n'nnọkọ HenryCo niile",
  },
  errorBoundary: {
    kicker: "Oge arụmọrụ akaụntụ",
    title: "Ebe a na-arụ ọrụ n'akaụntụ a nwetara nsogbu onye ahịa ma ọ bụ ntọpụta",
    description: "A jidere ọdịda ahụ maka nyocha. Ọjọọ ebe a ma gaa n'ihu site na ọnọdụ kwụ ọtọ ikpeazụ.",
    reload: "Ọjọọ nlele a",
    contactSupport: "Kpọọ nkwado",
  },
  activity: {
    title: "Mmemme",
    description: "Ihe niile ị mere n'ime ngalaba HenryCo niile.",
    emptyTitle: "Enwebeghị mmemme",
    emptyDescription:
      "Mmemme gị n'etiti ngalaba ga-apụta ebe a ka ị na-eji ọrụ HenryCo.",
    statusLabels: {
      pending: "Na-eche",
      open: "Mepere emepe",
      updated: "Mwughari",
      completed: "Emechara",
      resolved: "Edozila",
      paid: "Akwụ ụgwọ",
      failed: "Daa",
      active: "Na-arụ ọrụ",
      refunded: "Kwụghachiri ego",
    },
    filters: {
      heading: "Nyochaa ma budata",
      reset: "Tọgharịa",
      fromLabel: "Site",
      toLabel: "Ruo",
      amountFromLabel: "Ego site (₦)",
      amountToLabel: "Ego ruo (₦)",
      divisionEyebrow: "Ngalaba",
      typeEyebrow: "Ụdị",
      statusEyebrow: "Ọnọdụ",
      pdfNote:
        "PDF ahụ na-eburu nyocha ọ bụla ị tọrọ n'elu dị ka akụkụ nke isi okwu — ihe ị na-ahụ bụ ihe ị na-ebudata.",
      downloadLabel: "Budata akwụkwọ",
      downloadFilename: "HenryCo-Akụkọ-Azụmahịa.pdf",
      shareTitle: "Akụkọ Azụmahịa HenryCo",
      typeLabels: {
        payment: "ịkwụ ụgwọ",
        wallet_credit: "kredit obere akpa ego",
        wallet_debit: "debit obere akpa ego",
        refund: "ịkwụghachi ego",
        withdrawal: "iwepụ ego",
        fee: "ụgwọ",
      },
    },
  },
  notifications: {
    metadata: {
      title: "Ọkwa",
      description: "Mmelite HenryCo ọ bụla — obere akpa ego, nkwado, ọrụ, ahịa, nlekọta, na ihe ndị ọzọ — n’otu igbe ozi nke na-eru ugbu a.",
    },
    hero: {
      eyebrow: "HenryCo · ọkwa dị ndụ",
      ariaOverview: "Nlebanya ọkwa",
      ariaVolume: "Olu ọkwa",
      ariaByDivision: "Site na ngalaba",
      headlineZero: "Igbe ozi efu n’ofe HenryCo.",
      headlineOne: "Otu ihe chọrọ nlebara anya gị.",
      headlineFew: "{count} ọkwa ka a ga-elebanụ.",
      headlineMany: "{count} mmelite n’ofe ngalaba gị niile.",
      blurbZero: "Ihe ọ bụla HenryCo zigara na-aba ebe a n’oge ozugbo — obere akpa ego, nkwado, ọrụ, ahịa, nlekọta, na ihe ndị ọzọ.",
      blurbStale: "Ihe ndị ochie achịkọtawo onwe ha. Sụa iji chekwaa, pịa iji mepee, ma ọ bụ jegharịa ozugbo n’eriri.",
      blurbToday: "{count} batara taa. Jiri nzacha lekwasị anya n’otu ngalaba, ma ọ bụ gafee naanị ndị a na-agụghị agụ.",
      tileUnreadLabel: "A gụghị agụ",
      tileUnreadFoot: "Na-eche anya gị",
      tileTodayLabel: "Taa",
      tileTodayFoot: "Batara n’ime awa 24 gara aga",
      tileWeekLabel: "Izu a",
      tileWeekFoot: "Mmemme ikpeazụ {when}",
      byDivision: "Site na ngalaba",
      emptyDivisions: "Ọ dịbeghị ihe rutere.",
      lastActivityFallback: "enweghị mmemme ọhụrụ",
      justNow: "kemgbe ugbu a",
      minutesAgo: "{count} nkeji gara aga",
      hoursAgo: "{count} awa gara aga",
      daysAgo: "{count} ụbọchị gara aga",
    },
    inbox: {
      heading: "Igbe ozi",
      meta: "Pịa iji mepee, sụa iji chekwaa — nzacha na-arụ ọrụ n’ofe ngalaba ọ bụla.",
    },
    filters: {
      all: "Niile",
      unread: "A gụghị agụ",
      allSources: "Isi mmalite niile",
      activeFilter: "nzacha na-arụ ọrụ",
    },
    feed: {
      unreadSectionKicker: "A gụghị agụ",
      unreadSectionTitle: "Chọrọ nlebara anya gị",
      recentSectionKicker: "Nke ọhụrụ",
      recentSectionTitle: "Ihe edobere ma ọ bụ enyochara",
      unreadBadge: "A gụghị agụ",
      openMessageBoard: "Mepee bọọdụ ozi",
    },
    swipe: {
      archive: "Chekwaa",
      delete: "Hichapụ",
      markRead: "Kaa dị ka agụrụ",
      markUnread: "Kaa dị ka a gụghị",
    },
    emptyState: {
      inboxTitle: "Ihe niile dị mma.",
      inboxBody: "Mmemme sitere n’ofe HenryCo na-apụta ebe a ozugbo ọ na-eme.",
      filterTitle: "Enweghị mmemme n’ọnọdụ a.",
      filterBody: "Nwaa nzacha ọzọ.",
    },
    markAllRead: {
      label: "Kaa niile dị ka agụrụ",
      pending: "Ka m na-akakwa niile...",
      spinner: "Na-akakwa niile",
    },
    footer: {
      recentlyDeleted: "Ndị ehichapụrụ na nso nso a",
    },
  },
  calendar: {
    metaTitle: "Kalịnda · HenryCo",
    metaDescription:
      "Eserese ihe omume ụlọ ọrụ niile — ndokwa Care, nleta ụlọ, ajụjụ ọnụ Jobs, akara Studio, klas Learn, oge mbufe Logistics.",
    heroAriaLabel: "Nchịkọta kalịnda",
    heroEyebrow: "HenryCo · kalịnda ụlọ ọrụ niile",
    tileVolumeAriaLabel: "Olu kalịnda",
    tileEventsLabel: "Ihe omume",
    tileEventsFoot: "Ụbọchị 28 na-abịa",
    tilePortalsLabel: "Ọnụ ụzọ",
    tilePortalsFootEmpty: "Care, ụlọ, jobs, studio, learn, logistics",
    tilePortalsFootSingular: "Otu ngalaba edobere",
    tilePortalsFootPlural: "Ngalaba {count} edobere",
    tileNextLabel: "Nke na-esote",
    tileNextEmpty: "O nweghị ihe edobere n'oge a",
    sideAriaLabel: "Site n'ọnụ ụzọ",
    sideLabel: "Site n'ọnụ ụzọ",
    sideTitleEmpty: "Enwebeghị ndokwa",
    sideTitleSingular: "Otu ọnụ ụzọ na-arụ ọrụ",
    sideTitlePlural: "Ọnụ ụzọ {count} n'ọrụ",
    sideBody:
      "Ndokwa, nleta, ajụjụ ọnụ, akara, klas na oge mbufe niile na-apụta ebe a n'usoro oge.",
    agendaTitle: "Ihe atụmatụ",
    agendaAriaLabel: "Ihe omume edobere site n'ụbọchị",
    agendaMetaEmpty: "O nweghị ihe edobere n'oge ụbọchị 28",
    agendaMetaSingular: "Ihe omume {count} · ụbọchị 28 na-abịa",
    agendaMetaPlural: "Ihe omume {count} · ụbọchị 28 na-abịa",
    emptyEyebrow: "Kalịnda dị jụụ",
    emptyTitle: "O nweghị ihe edobere n'ụbọchị 28 na-abịa.",
    emptyBody:
      "Ihe ọ bụla ị debere — nbutere Care, nleta ụlọ, ajụjụ ọnụ ọrụ, klas Learn, akara Studio, oge mbufe Logistics — ga-aba ebe a n'onwe ya. Filter ga-apụta ozugbo ọnụ ụzọ malitere ndokwa.",
    dayMetaSingular: "Ihe omume {count}",
    dayMetaPlural: "Ihe omume {count}",
    eventTimeAriaLabel: "Oge omume",
    eventCta: "Mepee",
    headline: {
      empty: "O nweghị ihe edobere n'ụbọchị 28 na-abịa.",
      calmOne: "Otu ihe na ihe atụmatụ.",
      calmMany: "Ihe omume {count} n'ụbọchị 28 na-abịa.",
      busy: "Ihe omume {count} edobere n'ọnụ ụzọ {portals}.",
      packed: "Ihe omume {count} n'usoro — chebe oge ntụgharị uche nke ọma.",
    },
    blurb: {
      empty:
        "Ndokwa Care, nleta ụlọ, ajụjụ ọnụ Jobs, akara Studio, klas Learn na oge mbufe Logistics niile na-apụta ebe a.",
      calm: "Pịa kaadị iji bụga ọnụ ụzọ ya. Ihe atụmatụ ga-emelite n'onwe ya ka ndokwa ọhụrụ rute.",
      busyOrPacked:
        "Filter dị n'elu ihe atụmatụ na-amachi otu ọnụ ụzọ — bara uru mgbe otu ngalaba dị mkpọtụ.",
    },
    kindLabels: {
      care_booking: "Ndokwa Care",
      property_viewing: "Nleta ụlọ",
      jobs_interview: "Ajụjụ ọnụ",
      learn_class: "Klas dị ndụ",
      studio_milestone: "Akara Studio",
      logistics_pickup: "Oge nbutere",
      logistics_delivery: "Oge nnyefe",
      room_session: "Oge ime ụlọ",
    },
    dayLabels: {
      today: "Taa",
      tomorrow: "Echi",
      yesterday: "Ụnyaahụ",
    },
    portalLabels: {
      care: "Care",
      property: "Ụlọ",
      jobs: "Jobs",
      studio: "Studio",
      learn: "Learn",
      logistics: "Logistics",
    },
  },
  invoices: {
    metadata: {
      title: "Ụgwọ ọrụ na akwụkwọ nnata",
      description: "Akụkọ ịkwụ ụgwọ gị na akwụkwọ nnata e nwere ike ibudata.",
    },
    hero: {
      eyebrow: "Ụgwọ ọrụ · akwụkwọ nnata",
      ariaOverview: "Nchịkọta ụgwọ ọrụ",
      ariaTotals: "Ngụkọta ego",
      ariaByDivision: "Site na ngalaba",
      headlineEmpty: "Akwụkwọ nnata ga-eru ebe a.",
      headlineWithReceipts: "Akwụkwọ nnata ọ bụla, otu ebe.",
      blurb:
        "Ịkwụ ụgwọ ọ bụla na HenryCo na-arute ebe a dị ka PDF nwere akara nke a ga-ebudata — ndokwa Care, iwu Marketplace, ụgwọ Studio, mbupu Logistics, akwụkwọ Learn.",
      totalPaidLabel: "Ego e kwụrụ · ndụ niile",
      thisMonthLabel: "Kwụrụ · ọnwa a",
      thisMonthFoot: "Akwụkwọ nnata nke ọnwa a",
      outstandingLabel: "Na-akwụ",
      paidCountUnit: "akwụkwọ nnata",
      pendingCountUnit: "na-echere",
      overdueCountUnit: "egbula oge",
      byDivision: "Site na ngalaba",
      byDivisionEmpty: "Enwebeghị ụgwọ ọrụ.",
    },
    section: {
      title: "Ụgwọ ọrụ niile",
      receiptsOnFileSingular: "akwụkwọ nnata edebere",
      receiptsOnFilePlural: "akwụkwọ nnata edebere",
    },
    empty: {
      title: "Enwebeghị ụgwọ ọrụ",
      description:
        "Ụgwọ ọrụ na akwụkwọ nnata gị ga-apụta ebe a mgbe ị kwụchara ụgwọ na ọrụ HenryCo.",
    },
    statuses: {
      paid: "Akwụgoro",
      pending: "Na-echere",
      overdue: "Egbula oge",
      draft: "Akwụkwọ mbụ",
      cancelled: "Akagburu",
      refunded: "Akwụghachi",
      fallback: "Ọnọdụ na-echere",
    },
    list: {
      ariaLabel: "Ụgwọ ọrụ",
      fallbackTitle: "Ụgwọ ọrụ {number}",
      rowAriaLabel: "Ụgwọ ọrụ {number} maka ₦{amount}",
    },
    divisions: {
      account: "Akaụntụ",
      wallet: "Obere akpa ego",
      marketplace: "Marketplace",
      studio: "Studio",
      jobs: "Jobs",
      learn: "Learn",
      property: "Ụlọ",
      logistics: "Logistics",
      care: "Care",
      fallback: "Akaụntụ",
    },
    footerNote: "Akwụkwọ nnata na-ebudata dị ka PDF nwere akara.",
  },
  wallet: {
    hero: {
      ariaLabel: "Ego dị n'obere akpa",
      eyebrow: "Obere akpa ego HenryCo · na-aga",
      availableLabel: "Ego dị nri",
      balanceAriaTemplate: "Ego dị nri {amount} {currency}",
      settlementFallback: "A na-akwụ ya na ego obodo gị site na ọnụego HenryCo ụbọchị.",
      ctas: { fund: "Tinye ego", withdraw: "Wepụ" },
      tiles: {
        verifiedLabel: "Ego enyochara",
        verifiedFoot: "Enwere ike iji ya na ọrụ HenryCo niile",
        pendingFundingLabel: "Ego ana-eche",
        pendingFundingFoot: "Ọ na-anọ iche ruo mgbe ego kwado",
        pendingWithdrawalLabel: "Edebere maka mpụta",
        pendingWithdrawalFoot: "Edebere ruo mgbe ịkwụ ụgwọ zuru",
      },
    },
    sections: {
      actionsTitle: "Omume obere akpa ego",
      actionsMeta: "Tinye, wepụ, kwụọ, megharịa",
      pendingTitle: "Arụmọrụ ana-eche",
      pendingMeta: "Edobere iche site na ego gị dị nri",
      flowTitle: "Otú ego gị si aga",
      flowMeta: "Ụbọchị 30 gara aga · ọnwa 6 gara aga · site na ngalaba",
      fundingTitle: "Arịrịọ itinye ego ọhụrụ",
      fundingMetaTemplate: "{count} na nyocha",
      activityTitle: "Mmemme",
      activityMetaTemplate: "Ndị ikpeazụ {count}",
    },
    quickActions: {
      ariaLabel: "Omume ngwa ngwa obere akpa ego",
      addFundsLabel: "Tinye ego",
      addFundsDesc: "Mbufe ụlọ akụ na nbulite ihe akaebe na nkwado ozugbo.",
      withdrawLabel: "Wepụ",
      withdrawDesc: "Bufee ego dị nri n'akaụntụ ụlọ akụ enyochara.",
      paymentsLabel: "Ịkwụ ụgwọ",
      paymentsDesc: "Ego e gbara, nlọghachi azụ na ụzọ echekwara.",
      receiptsLabel: "Akwụkwọ nnata & invoice",
      receiptsDesc: "PDF nwere akara n'ofe ngalaba ọ bụla.",
    },
    pendingOps: {
      fundingKicker: "Ego ana-eche",
      fundingDescEmpty: "Ego ị tinyere na-anọ ebe a ruo mgbe ego nyochara ntụaka ụlọ akụ.",
      fundingDescSingular: "{count} arịrịọ nọ na nyocha — ihe akaebe na-eme ka kwụụ na-aga n'ihu.",
      fundingDescPlural: "{count} arịrịọ nọ na nyocha — ihe akaebe na-eme ka kwụụ na-aga n'ihu.",
      fundingCta: "Mepee ụzọ itinye ego",
      withdrawalKicker: "Mpụta ana-eche",
      withdrawalDescEmpty: "Mpụta na-eche ebe a mgbe ego na-eme nyocha — ego gị dị nri anaghị ekwe nkwa ugboro abụọ.",
      withdrawalDescSingular: "{count} mpụta na-eche ịkwụ ụgwọ. Edebere site na ego gị dị nri.",
      withdrawalDescPlural: "{count} mpụta na-eche ịkwụ ụgwọ. Edebere site na ego gị dị nri.",
      withdrawalCta: "Mepee ụzọ mpụta",
    },
    spend: {
      figureAriaLabel: "Mmefu n'ọnwa 6 gara aga",
      last30Eyebrow: "Mmefu · ụbọchị 30 gara aga",
      byDivisionEyebrow: "Site na ngalaba",
      distributionAriaLabel: "Nkesa mmefu site na ngalaba",
      trendFlat: "Nke a na-agbanwe",
      trendBelowTemplate: "{pct}% n'okpuru ụbọchị 30 gara aga",
      trendAboveTemplate: "{pct}% n'elu ụbọchị 30 gara aga",
      trendTitleTemplate: "vs ụbọchị 30 gara aga (₦{amount})",
    },
    trust: {
      ariaLabel: "Njikere mpụta",
      heading: "Njikere mpụta",
      identityTitle: "Enyochara njirimara",
      identityDescDoneTemplate: "{label}. Achọrọ maka ịkwụ ụgwọ mpụta.",
      identityDescTodoTemplate: "{label}. Mechaa ya otu ugboro iji mepee mpụta.",
      identityCta: "Gaa n'ihu →",
      pinTitle: "PIN mpụta",
      pinDescDone: "Edobere PIN mpụta gị.",
      pinDescTodo: "Debe PIN ọnụọgụ 4 iji kwado mpụta ọ bụla.",
      pinCta: "Debe PIN →",
      payoutTitle: "Ụzọ ịkwụ ụgwọ",
      payoutDescSingular: "Otu ụzọ enyochara dị na fail.",
      payoutDescPluralTemplate: "{count} ụzọ enyochara dị na fail.",
      payoutDescEmpty: "Tinye akaụntụ ụlọ akụ iji nata mpụta.",
      payoutCtaManage: "Jikwaa →",
      payoutCtaAdd: "Tinye ụzọ →",
      verificationLabels: {
        verified: "Enyochara njirimara",
        pending: "Nyocha nọ na nyocha",
        rejected: "Nyocha chọrọ ntinye ọzọ",
        notSubmitted: "A nyebeghị njirimara",
      },
    },
    activity: {
      ariaLabel: "Azụmahịa obere akpa ego",
      emptyTitle: "Enwebeghị azụmahịa",
      emptyBody: "Tinye ego n'obere akpa gị, ndepụta mmemme gị ga-egosi ebe a kredit, debit, nlọghachi azụ na bonus ọ bụla n'ofe ọrụ HenryCo.",
      fallbackTitle: "Azụmahịa obere akpa ego",
    },
    funding: {
      proofUploaded: "Ebugoro ihe akaebe",
      awaitingProof: "Na-echere ihe akaebe",
      ariaLabelTemplate: "Arịrịọ itinye ego {reference} maka ₦{amount}",
    },
    statusLabels: {
      pending: "Na-eche nyocha",
      awaiting_proof: "Na-echere ihe akaebe",
      awaiting_review: "Na-eche nyocha",
      in_review: "Na nyocha",
      rejected: "Ajụrụ",
      cancelled: "Akagburu",
      expired: "Agwụla",
      completed: "Akwadoro",
      verified: "Akwadoro",
      approved: "Akwadoro",
      paid: "A kwụrụ",
    },
  },
};

const YO: DeepPartial<AccountCopy> = {
  trustTierLabels: {
    basic: "Ipilẹ",
    verified: "Ti jẹrisi",
    trusted: "Igbẹkẹle",
    premium_verified: "Premium Ti jẹrisi",
  },
  common: {
    source: "Orisun",
    viewAll: "Wo gbogbo",
    unread: "Ti a ko ka",
    defaultBadge: "Aiyipada",
    noReceiptYet: "Ko si gbigba silẹ sibẹ",
    unknownCustomer: "Alabara",
    page: "Oju-iwe",
    of: "ninu",
    perPage: "fun oju-iwe kọọkan",
    previous: "Tẹlẹ",
    next: "Tẹle",
    filtered: "Ti ṣe àlẹmọ",
    bookingSingular: "ifiṣura",
    bookingPlural: "awọn ifiṣura",
    justNow: "Ṣẹṣẹ",
  },
  overview: {
    welcomeBack: "Kaabo pada",
    description: "Ile-iṣẹ aṣẹ HenryCo rẹ — ohun gbogbo kọja gbogbo awọn ẹka, ibi kan.",
    walletBalance: "Iwọntunwọnsi apamọ",
    walletHint: "Apamọ ti a pin · Lo kọja awọn iṣẹ HenryCo",
    notifications: "Awọn iwifunni",
    allCaughtUp: "Gbogbo ohun dara",
    unreadMessages: "Awọn ifiranṣẹ ti a ko ka",
    activeSubscriptions: "Awọn ọmọ ẹgbẹ ti nṣiṣẹ",
    noActivePlans: "Ko si awọn ero ti nṣiṣẹ ti o ni amuṣiṣẹpọ",
    syncedPlans: "Awọn ero ti nṣiṣẹ ti o ni amuṣiṣẹpọ",
    trustTier: "Ipele igbẹkẹle",
    scoreLabel: "Ikun",
    businessActionsUnlocked: "Awọn iṣẹ iṣowo ti ṣii",
    moreVerificationNeeded: "Ijẹrisi diẹ sii ni a nilo",
    invoices: "Awọn iwe-ẹri",
    pending: "duro",
    allSettled: "Gbogbo ti yanjuù",
    support: "Atilẹyin",
    newReplies: "pẹlu awọn idahun tuntun",
    openRequests: "Awọn ibeere ti ṣii",
    noOpenRequests: "Ko si awọn ibeere ti ṣii",
    referrals: "Awọn itọkasi",
    inviteAndEarn: "Pe ati gba ere",
    shareHenryCo: "Pin HenryCo pẹlu awọn omiiran",
    transactions: "Awọn iṣowo",
    viewHistory: "Wo itan",
    walletActivity: "Iṣẹ apamọ & awọn isanwo",
    blockingLabel: "dina",
    highPriorityLabel: "awọn igbesẹ pataki ti n bọ",
    actionCenterHint: "Ile-iṣẹ Iṣe rẹ ni a fi pataki si lati awọn ami igbẹkẹle laaye, apamọ, atilẹyin, ati iwifunni.",
    attentionKicker: "Ohun ti Nilo Akiyesi Rẹ",
    attentionTitle: "Ti nlọ, nduro lọdọ rẹ, tabi ti ko yanju sibẹ",
    pendingWalletVerification: "Ijẹrisi apamọ ti nduro",
    pendingWalletVerificationDetail: "Ẹri apamọ rẹ tun nduro jẹrisi owo.",
    unreadNotificationsAttention: "Awọn iwifunni ti a ko ka",
    unreadNotificationsAttentionDetail: "Awọn imudojuiwọn ti a ko ka tun nduro atunyẹwo rẹ.",
    activePlansInMotion: "Awọn ero ti nṣiṣẹ ni iṣipopada",
    activePlansInMotionDetail: "Awọn ọmọ ẹgbẹ ti nṣiṣẹ lọwọlọwọ lori akọọlẹ yii.",
    unlockTier: "Ṣii {tier}",
    nextTierFallback: "Ipele igbẹkẹle rẹ ti n bọ nilo ijẹrisi to lagbara ati itan akọọlẹ ti o mọ.",
    quickActions: "Awọn iṣe iyara",
    addMoney: "Fi owo kun",
    getHelp: "Gba iranlọwọ",
    bookCare: "Ṣeto abojuto",
    shop: "Ra",
    actionCenter: "Ile-iṣẹ Iṣe",
    actionCenterDescription: "Bẹrẹ pẹlu awọn ohun ti o dina ni akọkọ, lẹhinna pa awọn igbesẹ pataki mọ lati jẹ ki akọọlẹ rẹ ṣiṣẹ ni kikun.",
    noUrgentTasks: "Ko si awọn iṣẹ akọọlẹ ti o yara ni bayi. O wa ni ipo iṣẹ ti o ni ilera.",
    viewTaskQueue: "Wo ila-duro iṣẹ ni kikun",
    smartRecommendations: "Awọn iṣeduro ọlọgbọn",
    smartRecommendationsEmpty: "Tẹsiwaju lilo awọn iṣẹ HenryCo ati awọn iṣeduro yoo ṣe deede si iṣẹ rẹ.",
    recommendationReason: "Ti daba lati iṣẹ akọọlẹ rẹ ati ipo igbẹkẹle ({confidence} igbẹkẹle)",
    recentActivity: "Iṣẹ Aipẹ",
    noRecentActivity: "Ko si iṣẹ aipẹ sibẹ",
    recentNotifications: "Awọn iwifunni",
    noNotifications: "Ko si awọn iwifunni sibẹ",
    yourServices: "Awọn iṣẹ rẹ",
    careService: "Care",
    careServiceDescription: "Abojuto asọ, mimọ & itọju",
    marketplaceService: "Marketplace",
    marketplaceServiceDescription: "Ra awọn ọja & ta lori ayelujara",
    jobsService: "Jobs",
    jobsServiceDescription: "Awọn ohun elo, awọn ipa ti a fi pamọ & awọn imudojuiwọn olugba",
    studioService: "Studio",
    studioServiceDescription: "Awọn iṣẹ ẹda & apẹrẹ",
    recommendationTitles: {
      trustNext: "Pari ijẹrisi igbẹkẹle rẹ",
      profileNext: "Pari profaili rẹ",
      jobsSaved: "Tẹle awọn ipa ti a fi pamọ",
    },
    recommendationDescriptions: {
      trustNext: "Ṣii awọn iṣe diẹ sii kọja HenryCo.",
      profileNext: "Profaili pipe mu atilẹyin dara ati itesiwaju iṣẹ.",
      jobsSaved: "Pada wo awọn ipa ti o ti fi pamọ tẹlẹ ki o si ṣe lori wọn.",
      fallback: "Tẹsiwaju lilo awọn iṣẹ HenryCo ati awọn iṣeduro yoo ṣe deede si iṣẹ rẹ.",
    },
  },
  tasks: {
    title: "Awọn iṣẹ",
    description: "Awọn iṣe ti o ni pataki kọja akọọlẹ, igbẹkẹle, apamọ, ati atilẹyin.",
    queueTitle: "Bi ila-duro yii ṣe n ṣiṣẹ",
    queueBody: "Awọn iṣẹ dena le ṣe idiwọ iraye si awọn ṣiṣẹ pataki. Awọn nkan pataki jẹ awọn iṣe ti o dara julọ ti n bọ lati jẹ ki akọọlẹ rẹ ni ilera ati yago fun awọn idaduro.",
    emptyTitle: "Ko si awọn iṣẹ ti nṣiṣẹ",
    emptyDescription: "O ṣe kedere lọwọlọwọ. Awọn iṣẹ yoo han nibi nigbati iṣe ba nilo.",
    blocking: "dina",
    priorityLabels: {
      low: "kekere",
      normal: "deede",
      high: "giga",
      urgent: "kiakia",
    },
    taskTitles: {
      trust: "Pari awọn igbesẹ ijẹrisi igbẹkẹle",
      walletFunding: "Tẹle owó apamọ ti nduro",
      support: "Dahun si awọn ẹrọ atilẹyin ti ṣii",
      notifications: "Ṣayẹwo awọn iwifunni ti a ko ka",
    },
    taskDescriptions: {
      trustFallback: "Ṣe imudara ipele igbẹkẹle lati ṣii awọn agbara diẹ sii.",
      walletFunding: "Ẹri rẹ nduro jẹrisi owo.",
      support: "Awọn ibaraẹnisọrọ atilẹyin ti ṣii tun nilo akiyesi rẹ.",
      notifications: "Awọn imudojuiwọn ti a ko ka nduro atunyẹwo.",
    },
  },
  security: {
    title: "Aabo",
    description: "Ṣayẹwo iṣẹ aabo aipẹ, yi ọrọ igbaniwọle rẹ pada, ki o si pari awọn igba HenryCo nigbati o ba nilo.",
    trustProfile: "Profaili Igbẹkẹle",
    trustDescription: "Igbẹkẹle n ṣiṣẹ kọja akọọlẹ. O n ṣakoso awọn iṣe iṣowo iye giga, iduro ilana, ati ẹtọ to lagbara kọja awọn modulu HenryCo.",
    trustScore: "Ikun igbẹkẹle akọọlẹ",
    signalLabels: {
      emailVerified: "Imeeli ti jẹrisi",
      identityStatus: "Ipo idanimo",
      trustedPhone: "Foonu igbẹkẹle",
      profileCompletion: "Ipari profaili",
      suspiciousEvents: "Awọn iṣẹlẹ ifura",
      contactReview: "Atunyẹwo olubasọrọ",
    },
    signalValues: {
      confirmed: "Ti jẹrisi",
      needsAttention: "Nilo akiyesi",
      verified: "Ti jẹrisi",
      underReview: "Labẹ atunyẹwo",
      needsResubmission: "Nilo atunto",
      notSubmitted: "Ti ko fi silẹ",
      present: "Wa nibẹ",
      missing: "Nsonu",
      manualReview: "Atunyẹwo afọwọṣe",
      clear: "Mimọ",
    },
    whyYouAreHere: "Idi ti o wa nibi",
    topTrustLaneReached: "Ọna igbẹkẹle oke ti de",
    topTrustLaneDescription: "Akọọlẹ yii ti pade ọna igbẹkẹle ti o ga julọ lọwọlọwọ ti o wa ninu dashboard ti a pin.",
    baselineReason: "Profaili akọọlẹ ipilẹ rẹ nṣiṣẹ.",
    whatUnlocks: "Ohun ti ṣii {tier}",
    regionalContext: "Ọrọ-aje agbegbe",
    accountStatus: "Ipo akọọlẹ",
    needsReview: "Nilo atunyẹwo",
    secure: "Ailewu",
    email: "Imeeli",
    accountHistory: "Itan akọọlẹ",
    historyDays: "Itan akọọlẹ ọjọ {days}",
    operationalAccess: "Iraye si iṣẹ",
    higherTrustAvailable: "Awọn iṣe iṣowo igbẹkẹle giga ati isanwo wa",
    moreVerificationNeeded: "Ijẹrisi diẹ sii ni a nilo",
    trustGuide: "Itọsọna ipo igbẹkẹle",
    whatCurrentStateMeans: "Ohun ti ipo rẹ lọwọlọwọ tumọ si",
    whatCurrentStateBody: "Ipo yii pinnu iraye si awọn ṣiṣẹ iye giga ati awọn iṣe iṣowo kọja HenryCo.",
    whatToDoNext: "Ohun ti o yẹ ki o ṣe nigbamii",
    whatToDoNextBody: "Pari awọn ibeere ti a ṣe akojọ lati ṣii ọna igbẹkẹle ti n bọ.",
    currentRestrictions: "Awọn iṣe ti ni ihamọ lọwọlọwọ",
    noRestrictions: "Ko si awọn ihamọ ti o da lori igbẹkẹle ti n dina awọn ṣiṣẹ akọọlẹ akọkọ rẹ lọwọlọwọ.",
    recentActivity: "Iṣẹ Aabo Aipẹ",
    recentActivityDescription: "Awọn iwọle, iwọde, awọn itẹwe ika ẹrọ, ati awọn ami iraye si ifura ni a gbasilẹ nibi ki itesiwaju igba naa wa ni atunyẹwo.",
    emptyTitle: "Ko si iṣẹ aabo aipẹ",
    emptyDescription: "Awọn iwọle, pipade igba, awọn itaniji, ati awọn iyipada akọọlẹ ifura yoo han nibi.",
    risk: "ewu",
    blockedActions: {
      jobs: "Ṣẹda awọn iṣẹ ti jẹrisi tabi awọn akojọ igbẹkẹle giga",
      marketplace: "Wọle si awọn anfani olutaja ọja ni kikun",
      property: "Ṣe atẹjade awọn ṣiṣẹ onile laisi atunyẹwo idanimo ti a ṣafikun",
      payouts: "Lo awọn iṣe ifura isanwo ati owo laisi atunyẹwo",
      staff: "Lo awọn ọna igbega ifura oṣiṣẹ tabi owo laisi ẹri idanimo to lagbara",
      financial: "Lo awọn ṣiṣẹ owo ifura laisi atunyẹwo",
      overlap: "Lo olutaja igbẹkẹle giga, atẹjade ohun-ini, tabi awọn ṣiṣẹ isanwo titi atunyẹwo olubasọrọ ba gbona",
    },
    reasons: {
      verificationApproved: "Ijẹrisi idanimo ti fọwọsi.",
      verificationPending: "Ijẹrisi idanimo ti fi silẹ ati pe o wa labẹ atunyẹwo.",
      verificationRejected: "Ijẹrisi idanimo nilo alaye diẹ sii ṣaaju ki awọn iṣe igbẹkẹle giga le ṣii.",
      verificationMissing: "Ijẹrisi idanimo ko ti pari.",
      emailVerified: "Nini imeeli ti jẹrisi.",
      identityVerified: "Ijẹrisi idanimo ti atilẹyin iwe ti pari.",
      documentsUnderReview: "Awọn iwe idanimo wa labẹ atunyẹwo lọwọlọwọ.",
      verificationNeedsAttention: "Ijẹrisi idanimo nilo akiyesi ṣaaju ki awọn ọna igbẹkẹle to lagbara le ṣii.",
      phonePresent: "Foonu olubasọrọ wa ni faili.",
      profileStrong: "Ipari profaili lagbara to fun awọn ṣiṣẹ ti jẹrisi.",
      accountHistory: "Itan akọọlẹ na si ọjọ {days}.",
      transactionHistory: "Itan iṣowo ti jẹrisi wa.",
      noRiskSignals: "Ko si awọn iṣẹlẹ aabo ewu giga aipẹ ti a ri.",
    },
    requirements: {
      verified: {
        verification: "Pari ijẹrisi idanimo ki awọn ọna ti o da lori igbẹkẹle ki o dẹkun gbigbekele awọn ami profaili ireti.",
        email: "Jẹrisi adirẹsi imeeli rẹ.",
        identity: "Pari ijẹrisi idanimo fun olutaja, ohun-ini, isanwo, ati awọn ṣiṣẹ ifura owo.",
        phone: "Fi nọmba foonu ti o le lo kun.",
        profile: "Pari diẹ sii ti profaili rẹ ki o si fi awọn iwe ẹri kun.",
        overlap: "Alaye olubasọrọ ti a pin nilo atunyẹwo igbẹkẹle afọwọṣe ṣaaju ki awọn iṣe igbẹkẹle giga le ṣii.",
      },
      trusted: {
        verification: "Fọwọsi ijẹrisi idanimo ni a nilo ṣaaju ki olutaja igbẹkẹle, agbanisiṣẹ, ohun-ini, ati awọn ọna isanwo le ṣii.",
        age: "Kọ ọjọ ori akọọlẹ diẹ sii ṣaaju ki ipo igbẹkẹle le ṣii.",
        transactions: "Pari o kere ju iṣowo kan ti jẹrisi tabi iyika owo.",
        suspicious: "Jẹ ki akọọlẹ naa mọ ti awọn ikilọ iraye si ifura.",
        overlap: "Yanjuu atunyẹwo ẹrọ olubasọrọ ṣaaju olutaja igbẹkẹle, isanwo, tabi awọn ọna ohun-ini ṣii.",
      },
      premium: {
        verification: "Igbẹkẹle premium ti wa ni ipamọ fun awọn akọọlẹ ti o ti kọja ijẹrisi idanimo.",
        age: "Ṣetọju itan akọọlẹ mọ to gun.",
        transactions: "Kọ igbasilẹ iṣowo ti jẹrisi to lagbara.",
        activity: "Lo awọn ẹka HenryCo diẹ sii pẹlu awọn abajade mọ.",
        overlap: "Jẹ ki atunyẹwo olubasọrọ ẹlẹgbẹ ki o mọ ṣaaju ki igbẹkẹle premium le fun.",
      },
    },
  },
  changePassword: {
    passwordsDoNotMatch: "Awọn ọrọ igbaniwọle ko baamu",
    passwordTooShort: "Ọrọ igbaniwọle gbọdọ jẹ o kere ju awọn kikọ 8",
    success: "Ọrọ igbaniwọle rẹ ti ni imudojuiwọn.",
    unavailable: "A ko le ṣe imudojuiwọn ọrọ igbaniwọle rẹ ni bayi. Jọwọ tún gbiyanju.",
    newPassword: "Ọrọ igbaniwọle tuntun",
    confirmNewPassword: "Jẹrisi ọrọ igbaniwọle tuntun",
    minPlaceholder: "O kere ju awọn kikọ 8",
    repeatPlaceholder: "Tun ọrọ igbaniwọle tuntun",
    updating: "Imudojuiwọn ọrọ igbaniwọle...",
    updatePassword: "Ṣe imudojuiwọn ọrọ igbaniwọle",
  },
  globalSignOut: {
    title: "Pari gbogbo igba HenryCo",
    description: "Eyi fọwọsi akọọlẹ lọwọlọwọ jade kọja awọn ẹka ati ẹrọ HenryCo, lẹhinna pada si dada iwọle akọọlẹ.",
    note: "Iṣẹ ẹrọ ati igba aipẹ wa han ni isalẹ botilẹjẹpe ipadabọ ẹrọ kọọkan laaye ko ti han bi iṣakoso ọtọ.",
    unavailable: "A ko le pari gbogbo igba HenryCo ni bayi. Tún gbiyanju ni iṣẹju kan.",
    ending: "Ipari gbogbo awọn igba...",
    endAllSessions: "Jade kuro ninu gbogbo awọn igba HenryCo",
  },
  errorBoundary: {
    kicker: "Akoko ṣiṣẹ akọọlẹ",
    title: "Dada akọọlẹ yii lu aṣiṣe alabara tabi fifun",
    description: "Ikuna ti gba fun iwadii. Ṣe atunbẹrẹ dada yii ki o tẹsiwaju lati ipo iduroṣinṣin ikẹhin.",
    reload: "Tun ṣe agbele iwo yii",
    contactSupport: "Kan si atilẹyin",
  },
  activity: {
    title: "Iṣẹ",
    description: "Gbogbo ohun ti o ti ṣe kọja gbogbo awọn ẹka HenryCo.",
    emptyTitle: "Ko si iṣẹ kankan sibẹsibẹ",
    emptyDescription:
      "Iṣẹ rẹ kọja awọn ẹka yoo han nibi bi o ṣe nlo awọn iṣẹ HenryCo.",
    statusLabels: {
      pending: "Ti n duro",
      open: "Ṣii",
      updated: "Ti tunṣe",
      completed: "Ti pari",
      resolved: "Ti yanju",
      paid: "Ti san",
      failed: "Kuna",
      active: "Ti n ṣiṣẹ",
      refunded: "Ti dapadabọ",
    },
    filters: {
      heading: "Sẹsẹ ki o si gba lori awo",
      reset: "Tun ṣeto",
      fromLabel: "Lati",
      toLabel: "Si",
      amountFromLabel: "Owo lati (₦)",
      amountToLabel: "Owo si (₦)",
      divisionEyebrow: "Ẹka",
      typeEyebrow: "Iru",
      statusEyebrow: "Ipo",
      pdfNote:
        "PDF naa gbe gbogbo sẹsẹ ti o ṣeto lókè gẹgẹ bi apakan ti ori iwe-irohin — ohun ti o ri ni ohun ti o gba.",
      downloadLabel: "Gba akọsilẹ lori awo",
      downloadFilename: "HenryCo-Itan-Idunadura.pdf",
      shareTitle: "Itan Idunadura HenryCo",
      typeLabels: {
        payment: "isanwo",
        wallet_credit: "kirẹditi apo owo",
        wallet_debit: "debiti apo owo",
        refund: "ipadabọ owo",
        withdrawal: "yiyọ owo",
        fee: "owo iṣẹ",
      },
    },
  },
  calendar: {
    metaTitle: "Kàlẹ́ńdà · HenryCo",
    metaDescription:
      "Ìṣètò gbogbo ìpín — ìwé ìṣètò Care, àbẹ̀wò ohun ìní, ìfọ̀rọ̀wánilẹ́nuwò Jobs, àmì ìlọsíwájú Studio, kíláàsì Learn, àkókò ìfijíṣẹ́ Logistics.",
    heroAriaLabel: "Àkọtán kàlẹ́ńdà",
    heroEyebrow: "HenryCo · kàlẹ́ńdà gbogbo ìpín",
    tileVolumeAriaLabel: "Iye kàlẹ́ńdà",
    tileEventsLabel: "Àwọn ìṣẹ̀lẹ̀",
    tileEventsFoot: "Ọjọ́ 28 tó ńbọ̀",
    tilePortalsLabel: "Àwọn ẹnu-ọ̀nà",
    tilePortalsFootEmpty: "Care, ilé, jobs, studio, learn, logistics",
    tilePortalsFootSingular: "Ìpín kan ti gbero",
    tilePortalsFootPlural: "Ìpín {count} ti gbero",
    tileNextLabel: "Èyí tó ńbọ̀",
    tileNextEmpty: "Kò sí ohunkóhun tí a gbero nínú àkókò yìí",
    sideAriaLabel: "Nípa ẹnu-ọ̀nà",
    sideLabel: "Nípa ẹnu-ọ̀nà",
    sideTitleEmpty: "Kò sí ìṣètò síbẹ̀",
    sideTitleSingular: "Ẹnu-ọ̀nà kan ńṣiṣẹ́",
    sideTitlePlural: "Ẹnu-ọ̀nà {count} nínú àpapọ̀",
    sideBody:
      "Ìwé ìṣètò, àbẹ̀wò, ìfọ̀rọ̀wánilẹ́nuwò, àmì, kíláàsì àti àkókò ìfijíṣẹ́ gbogbo wọn ńfara hàn níbí ní ìlànà àkókò.",
    agendaTitle: "Ìṣètò ọjọ́",
    agendaAriaLabel: "Àwọn ìṣẹ̀lẹ̀ tó ti gbero ní ọjọ́-ọjọ́",
    agendaMetaEmpty: "Kò sí ohunkóhun tí a gbero nínú àkókò ọjọ́ 28",
    agendaMetaSingular: "Ìṣẹ̀lẹ̀ {count} · ọjọ́ 28 tó ńbọ̀",
    agendaMetaPlural: "Ìṣẹ̀lẹ̀ {count} · ọjọ́ 28 tó ńbọ̀",
    emptyEyebrow: "Kàlẹ́ńdà jẹ́ jẹ́ẹ́",
    emptyTitle: "Kò sí ohunkóhun tí a gbero nínú ọjọ́ 28 tó ńbọ̀.",
    emptyBody:
      "Ohunkóhun tí o bá ṣètò — gbígbéwá Care, àbẹ̀wò ohun ìní, ìfọ̀rọ̀wánilẹ́nuwò iṣẹ́, kíláàsì Learn, àmì Studio, àkókò Logistics — yóò dé sí ìṣètò yìí lẹ́sẹ̀kẹsẹ̀. Àwọn ọ̀nà àfọ̀dí yóò fara hàn lẹ́yìn tí àwọn ẹnu-ọ̀nà bá bẹ̀rẹ̀ sí gbero.",
    dayMetaSingular: "Ìṣẹ̀lẹ̀ {count}",
    dayMetaPlural: "Ìṣẹ̀lẹ̀ {count}",
    eventTimeAriaLabel: "Àkókò ìṣẹ̀lẹ̀",
    eventCta: "Ṣí",
    headline: {
      empty: "Kò sí ohunkóhun tí a gbero nínú ọjọ́ 28 tó ńbọ̀.",
      calmOne: "Nǹkan kan ṣoṣo ní ìṣètò.",
      calmMany: "Ìṣẹ̀lẹ̀ {count} nínú ọjọ́ 28 tó ńbọ̀.",
      busy: "Ìṣẹ̀lẹ̀ {count} tí a gbero káàkiri ẹnu-ọ̀nà {portals}.",
      packed: "Ìṣẹ̀lẹ̀ {count} ńdúró — yan àkókò ìdarí ọkàn lọ́nà ọgbọ́n.",
    },
    blurb: {
      empty:
        "Ìwé ìṣètò Care, àbẹ̀wò ohun ìní, ìfọ̀rọ̀wánilẹ́nuwò Jobs, àmì Studio, kíláàsì Learn àti àkókò Logistics gbogbo wọn ńfara hàn níbí.",
      calm: "Tẹ kádì kan láti fò sí ẹnu-ọ̀nà rẹ̀. Ìṣètò ọjọ́ yóò ṣẹ̀dá rẹ̀ ní àdánidá bí ìṣètò tuntun bá dé.",
      busyOrPacked:
        "Àwọn ọ̀nà àfọ̀dí lókè ìṣètò ńdín sí ẹnu-ọ̀nà kan ṣoṣo — kò sí àfojúsùn nígbà tí ìpín kan bá ńpariwo.",
    },
    kindLabels: {
      care_booking: "Ìwé Care",
      property_viewing: "Àbẹ̀wò ohun ìní",
      jobs_interview: "Ìfọ̀rọ̀wánilẹ́nuwò",
      learn_class: "Kíláàsì alààyè",
      studio_milestone: "Àmì Studio",
      logistics_pickup: "Àkókò gbígbéwá",
      logistics_delivery: "Àkókò ìfijíṣẹ́",
      room_session: "Ìpàdé yàrá",
    },
    dayLabels: {
      today: "Òní",
      tomorrow: "Ọ̀la",
      yesterday: "Àná",
    },
    portalLabels: {
      care: "Care",
      property: "Ohun ìní",
      jobs: "Jobs",
      studio: "Studio",
      learn: "Learn",
      logistics: "Logistics",
    },
  },
  notifications: {
    metadata: {
      title: "Awọn ìfìtónilétí",
      description: "Gbogbo ìmúdójúìwọ̀n HenryCo — àpò owó, àtìlẹyìn, iṣẹ́, ọjà, ìtọ́jú àti púpọ̀ sí i — ní àpótí ìfìtónilétí kan ṣàṣàn.",
    },
    hero: {
      eyebrow: "HenryCo · ìfìtónilétí olówó-ìlàyé",
      ariaOverview: "Àkójọpọ̀ ìfìtónilétí",
      ariaVolume: "Ìwọ̀n ìfìtónilétí",
      ariaByDivision: "Nípa ẹ̀ka",
      headlineZero: "Àpótí ìfìtónilétí ófẹ́ ní gbogbo HenryCo.",
      headlineOne: "Ohun kan ń wá ìfetísílẹ̀ rẹ.",
      headlineFew: "Ìfìtónilétí {count} láti yàmọ́.",
      headlineMany: "Ìmúdójúìwọ̀n {count} ní àwọn ẹ̀ka rẹ.",
      blurbZero: "Ohunkóhun tí HenryCo bá fi ránṣẹ́ ń dé síbí ní àkókò gidi — àpò owó, àtìlẹyìn, iṣẹ́, ọjà, ìtọ́jú àti púpọ̀ sí i.",
      blurbStale: "Àwọn ohun atijọ́ ti kọ́ra. Fà láti gbalé, tẹ̀ láti ṣílẹ̀, tàbí lọ tààrà sí òdòdó kan.",
      blurbToday: "{count} dé lónìí. Lo àwọn àyẹ̀wò láti dojúkọ ẹ̀ka kan ṣoṣo, tàbí gba inú àwọn tí a kò ka nìkan.",
      tileUnreadLabel: "Aìka",
      tileUnreadFoot: "Ń dúró fún ojú rẹ",
      tileTodayLabel: "Lónìí",
      tileTodayFoot: "Wọlé ní wákàtí 24 tó kẹ́yìn",
      tileWeekLabel: "Ọsẹ̀ yìí",
      tileWeekFoot: "Iṣẹ́-òyè tó kẹ́yìn {when}",
      byDivision: "Nípa ẹ̀ka",
      emptyDivisions: "Kò sí ohun tó dé tẹ́lẹ̀.",
      lastActivityFallback: "kò sí iṣẹ́-òyè tuntun",
      justNow: "ní bayìí",
      minutesAgo: "ìṣẹ́jú {count} sẹ́yìn",
      hoursAgo: "wákàtí {count} sẹ́yìn",
      daysAgo: "ọjọ́ {count} sẹ́yìn",
    },
    inbox: {
      heading: "Àpótí ìfìtónilétí",
      meta: "Tẹ̀ láti ṣílẹ̀, fà láti gbalé — àwọn àyẹ̀wò ṣiṣẹ́ ní gbogbo ẹ̀ka.",
    },
    filters: {
      all: "Gbogbo",
      unread: "Aìka",
      allSources: "Gbogbo orísun",
      activeFilter: "àyẹ̀wò tó ń ṣiṣẹ́",
    },
    feed: {
      unreadSectionKicker: "Aìka",
      unreadSectionTitle: "Ń wá ìfetísílẹ̀ rẹ",
      recentSectionKicker: "Tuntun",
      recentSectionTitle: "Iṣẹ́ tí a ti yọ́ tàbí ṣàyẹ̀wò",
      unreadBadge: "Aìka",
      openMessageBoard: "Ṣílẹ̀ pápá ìránṣẹ́",
    },
    swipe: {
      archive: "Gbalé",
      delete: "Pa rẹ́",
      markRead: "Sàmì sí gẹ́gẹ́ bí àkà",
      markUnread: "Sàmì sí gẹ́gẹ́ bí aìka",
    },
    emptyState: {
      inboxTitle: "Gbogbo rẹ̀ ti pé.",
      inboxBody: "Iṣẹ́-òyè láti gbogbo HenryCo yóò fi ara rẹ̀ hàn níhìn-ín bí ó ṣe ń ṣẹlẹ̀.",
      filterTitle: "Kò sí iṣẹ́-òyè nínú ìwò yìí.",
      filterBody: "Gbìyànjú àyẹ̀wò mìíràn.",
    },
    markAllRead: {
      label: "Sàmì sí gbogbo gẹ́gẹ́ bí àkà",
      pending: "Ń sàmì sí gbogbo gẹ́gẹ́ bí àkà...",
      spinner: "Ń sàmì sí gbogbo gẹ́gẹ́ bí àkà",
    },
    footer: {
      recentlyDeleted: "Tí a pa rẹ́ láìpẹ́",
    },
  },
  invoices: {
    metadata: {
      title: "Awọn iwe-ẹri àti àwọn risiti",
      description: "Ìtàn ìsanwó rẹ àti àwọn risiti tó ṣeé gbasilẹ.",
    },
    hero: {
      eyebrow: "Awọn iwe-ẹri · risiti",
      ariaOverview: "Akopọ àwọn iwe-ẹri",
      ariaTotals: "Àpapọ̀ owó",
      ariaByDivision: "Nípa ẹ̀ka",
      headlineEmpty: "Àwọn risiti rẹ yóò han níhìn-ín.",
      headlineWithReceipts: "Gbogbo risiti, ní ibìkan.",
      blurb:
        "Gbogbo ìsanwó nínú HenryCo ń dé sí ibí gẹ́gẹ́ bí PDF tí ó ní àmì-iṣòwò àti tí ó ṣeé gbasilẹ — ìwé Care, àṣẹ Marketplace, owó Studio, ìfijiṣẹ́ Logistics, ìjẹ́rìí Learn.",
      totalPaidLabel: "Àpapọ̀ tí a sanwó · ní ìgbà ayé",
      thisMonthLabel: "Sanwó · oṣù yìí",
      thisMonthFoot: "Àwọn risiti ti oṣù kálẹ́ńdà yìí",
      outstandingLabel: "Tí ó kù",
      paidCountUnit: "risiti",
      pendingCountUnit: "ní ìdúró",
      overdueCountUnit: "tí ó ti pẹ́",
      byDivision: "Nípa ẹ̀ka",
      byDivisionEmpty: "Kò sí iwe-ẹri síbẹ̀.",
    },
    section: {
      title: "Gbogbo iwe-ẹri",
      receiptsOnFileSingular: "risiti tó wà",
      receiptsOnFilePlural: "risiti tó wà",
    },
    empty: {
      title: "Kò sí iwe-ẹri síbẹ̀",
      description:
        "Awọn iwe-ẹri àti risiti rẹ yóò han níhìn-ín lẹ́yìn tí o bá ṣe ìsanwó nínú àwọn iṣẹ́ HenryCo.",
    },
    statuses: {
      paid: "Tí a sanwó",
      pending: "Ní ìdúró",
      overdue: "Tí ó ti pẹ́",
      draft: "Àkọsílẹ̀ àkọ́kọ́",
      cancelled: "Tí a fagilé",
      refunded: "Tí a dá owó padà",
      fallback: "Ipò ní ìdúró",
    },
    list: {
      ariaLabel: "Awọn iwe-ẹri",
      fallbackTitle: "Iwe-ẹri {number}",
      rowAriaLabel: "Iwe-ẹri {number} fún ₦{amount}",
    },
    divisions: {
      account: "Àkáǹtì",
      wallet: "Àpamọ́wọ́",
      marketplace: "Marketplace",
      studio: "Studio",
      jobs: "Jobs",
      learn: "Learn",
      property: "Ohun-ìní",
      logistics: "Logistics",
      care: "Care",
      fallback: "Àkáǹtì",
    },
    footerNote: "Àwọn risiti ń gbasilẹ gẹ́gẹ́ bí PDF tí ó ní àmì-iṣòwò.",
  },
  wallet: {
    hero: {
      ariaLabel: "Iwọntunwọnsi àpamọ́wọ́",
      eyebrow: "Àpamọ́wọ́ HenryCo · taara",
      availableLabel: "Iwọntunwọnsi tó wà",
      balanceAriaTemplate: "Iwọntunwọnsi tó wà {amount} {currency}",
      settlementFallback: "A ti yanjú ní owó ilẹ̀ rẹ ní oṣuwọn HenryCo lójú ọjọ́.",
      ctas: { fund: "Fi owó kún", withdraw: "Yọ owó kúrò" },
      tiles: {
        verifiedLabel: "Iwọntunwọnsi tí a ti jẹrisi",
        verifiedFoot: "Lè lò ní gbogbo ọrọ̀ iṣẹ́ HenryCo",
        pendingFundingLabel: "Ìfowóran tí ó dúró",
        pendingFundingFoot: "Ó dúró sípá títí ìṣúná-ìnáwó yóò fi jẹrisi",
        pendingWithdrawalLabel: "A pamọ́ fún yíyọ kúrò",
        pendingWithdrawalFoot: "A pamọ́ títí ìsanwó yóò fi parí",
      },
    },
    sections: {
      actionsTitle: "Ìṣe àpamọ́wọ́",
      actionsMeta: "Fikún, yọ kúrò, sanwó, ṣe àtúnṣe",
      pendingTitle: "Iṣẹ́ tó dúró",
      pendingMeta: "Yapa kúrò ní iwọntunwọnsi tó wà",
      flowTitle: "Bí owó rẹ ṣe ń ṣàn",
      flowMeta: "Ọjọ́ 30 sẹ́yìn · oṣù 6 sẹ́yìn · ní ìpín",
      fundingTitle: "Awọn ìbéèrè ìfowóran tuntun",
      fundingMetaTemplate: "{count} nínú àyẹ̀wò",
      activityTitle: "Iṣẹ́",
      activityMetaTemplate: "{count} tó ṣẹ̀ṣẹ̀",
    },
    quickActions: {
      ariaLabel: "Ìṣe yara àpamọ́wọ́",
      addFundsLabel: "Fi owó kún",
      addFundsDesc: "Gbígbé owó báńkì pẹ̀lú ẹ̀rí àti ìjẹ́risí lẹ́sẹ̀kẹsẹ̀.",
      withdrawLabel: "Yọ owó kúrò",
      withdrawDesc: "Gbé iwọntunwọnsi tó wà lọ sí àkáǹtì báńkì tí a ti jẹrisi.",
      paymentsLabel: "Ìsanwó",
      paymentsDesc: "Iye-ní-iye láìpẹ́, ìpadàbọ̀-owó àti ọnà tí a tọju.",
      receiptsLabel: "Risiti & infóìsì",
      receiptsDesc: "PDF tí ó ní àmì-iṣòwò ní gbogbo ìpín.",
    },
    pendingOps: {
      fundingKicker: "Ìfowóran tí ó dúró",
      fundingDescEmpty: "Owó tí o gbé wá á dúró níbí títí ìṣúná-ìnáwó yóò fi jẹrisi ìtọ́ka báńkì.",
      fundingDescSingular: "{count} ìbéèrè nínú àyẹ̀wò — ẹ̀rí ń jẹ́ kí ìlà náà tẹ̀síwájú.",
      fundingDescPlural: "{count} ìbéèrè nínú àyẹ̀wò — ẹ̀rí ń jẹ́ kí ìlà náà tẹ̀síwájú.",
      fundingCta: "Ṣí ìlà ìfowóran",
      withdrawalKicker: "Yíyọ kúrò tó dúró",
      withdrawalDescEmpty: "Yíyọ kúrò ń dúró níbí lákòókò àyẹ̀wò — iwọntunwọnsi rẹ tó wà kò ní fẹjọ́n méjì.",
      withdrawalDescSingular: "{count} yíyọ kúrò tó ń dúró ìsanwó. A pamọ́ ní iwọntunwọnsi tó wà.",
      withdrawalDescPlural: "{count} yíyọ kúrò tó ń dúró ìsanwó. A pamọ́ ní iwọntunwọnsi tó wà.",
      withdrawalCta: "Ṣí ìlà yíyọ kúrò",
    },
    spend: {
      figureAriaLabel: "Ìnáwó ní oṣù 6 sẹ́yìn",
      last30Eyebrow: "Ìnáwó · ọjọ́ 30 sẹ́yìn",
      byDivisionEyebrow: "Ní ìpín",
      distributionAriaLabel: "Pínpín ìnáwó ní ìpín",
      trendFlat: "Tẹ́ẹ́rẹ́",
      trendBelowTemplate: "{pct}% nísàlẹ̀ ọjọ́ 30 ṣáájú",
      trendAboveTemplate: "{pct}% lókè ọjọ́ 30 ṣáájú",
      trendTitleTemplate: "vs ọjọ́ 30 ṣáájú (₦{amount})",
    },
    trust: {
      ariaLabel: "Ìmúrasílẹ̀ fún yíyọ kúrò",
      heading: "Ìmúrasílẹ̀ fún yíyọ kúrò",
      identityTitle: "A ti jẹrisi ìdánimọ̀",
      identityDescDoneTemplate: "{label}. A nílò fún ìsanwó yíyọ kúrò.",
      identityDescTodoTemplate: "{label}. Parí rẹ̀ lẹ́ẹ̀kan láti ṣí yíyọ kúrò.",
      identityCta: "Tẹ̀síwájú →",
      pinTitle: "PIN yíyọ kúrò",
      pinDescDone: "A ti gbé PIN yíyọ kúrò rẹ kalẹ̀.",
      pinDescTodo: "Ṣètò PIN olónọ́mbà 4 láti fún àṣẹ fún yíyọ kúrò kọ̀ọ̀kan.",
      pinCta: "Ṣètò PIN →",
      payoutTitle: "Ọnà ìsanwó",
      payoutDescSingular: "Ọnà 1 tí a ti jẹrisi wà ní fáìlì.",
      payoutDescPluralTemplate: "{count} ọnà tí a ti jẹrisi wà ní fáìlì.",
      payoutDescEmpty: "Fi àkáǹtì báńkì kún láti gba yíyọ kúrò.",
      payoutCtaManage: "Ṣàkóso →",
      payoutCtaAdd: "Fi ọnà kún →",
      verificationLabels: {
        verified: "A ti jẹrisi ìdánimọ̀",
        pending: "Ìjẹ́risi nínú àyẹ̀wò",
        rejected: "Ìjẹ́risi nílò ìfisùn-síle míì",
        notSubmitted: "A kò tíì fi ìdánimọ̀ síle",
      },
    },
    activity: {
      ariaLabel: "Owó-iṣẹ́ àpamọ́wọ́",
      emptyTitle: "Kò sí owó-iṣẹ́ síbẹ̀",
      emptyBody: "Fi owó kún àpamọ́wọ́ rẹ, ìfunni-iṣẹ́ rẹ yóò fi gbogbo gbígba, gbígbé, ìpadàbọ̀ àti ẹ̀bùn hàn níbí ní ọrọ̀ iṣẹ́ HenryCo.",
      fallbackTitle: "Owó-iṣẹ́ àpamọ́wọ́",
    },
    funding: {
      proofUploaded: "A ti gbé ẹ̀rí sókè",
      awaitingProof: "Ń dúró fún ẹ̀rí",
      ariaLabelTemplate: "Ìbéèrè ìfowóran {reference} fún ₦{amount}",
    },
    statusLabels: {
      pending: "Ń dúró àyẹ̀wò",
      awaiting_proof: "Ń dúró fún ẹ̀rí",
      awaiting_review: "Ń dúró àyẹ̀wò",
      in_review: "Nínú àyẹ̀wò",
      rejected: "Kọ",
      cancelled: "Fagilé",
      expired: "Tí pari",
      completed: "A ti jẹrisi",
      verified: "A ti jẹrisi",
      approved: "A ti fàṣẹ̀sí",
      paid: "Ti sanwó",
    },
  },
};

const HA: DeepPartial<AccountCopy> = {
  trustTierLabels: {
    basic: "Asali",
    verified: "An tabbatar",
    trusted: "Amintacce",
    premium_verified: "Premium An tabbatar",
  },
  common: {
    source: "Madogara",
    viewAll: "Duba duka",
    unread: "Ba a karanta ba",
    defaultBadge: "Tsoho",
    noReceiptYet: "Babu rasit har yanzu",
    unknownCustomer: "Abokin ciniki",
    page: "Shafi",
    of: "daga",
    perPage: "kowane shafi",
    previous: "Na baya",
    next: "Na gaba",
    filtered: "An tace",
    bookingSingular: "ajiya",
    bookingPlural: "ajiyoyi",
    justNow: "Yanzu haka",
  },
  overview: {
    welcomeBack: "Barka da dawowa",
    description: "Cibiyar umarni ta HenryCo — komai a cikin dukkan sassan, wuri guda.",
    walletBalance: "Ma'auni na Jakar",
    walletHint: "Jakar da aka raba · Yi amfani a duk sabis na HenryCo",
    notifications: "Sanarwa",
    allCaughtUp: "Komai yana da kyau",
    unreadMessages: "Saƙonni da ba a karanta ba",
    activeSubscriptions: "Kuɗin mamba masu aiki",
    noActivePlans: "Babu shirye-shirye masu aiki masu daidaitawa",
    syncedPlans: "Shirye-shiryen masu aiki masu daidaitawa",
    trustTier: "Matsayi na Amana",
    scoreLabel: "Maki",
    businessActionsUnlocked: "An buɗe ayyukan kasuwanci",
    moreVerificationNeeded: "Ana buƙatar ƙarin tabbatarwa",
    invoices: "Lissafin kuɗi",
    pending: "na jira",
    allSettled: "Komai an sasanta",
    support: "Tallafi",
    newReplies: "tare da sabon amsoshi",
    openRequests: "Buƙatun buɗaɗɗe",
    noOpenRequests: "Babu buƙatun buɗaɗɗe",
    referrals: "Jagororin",
    inviteAndEarn: "Gayyata da kuma samu",
    shareHenryCo: "Raba HenryCo da wasu",
    transactions: "Ma'amaloli",
    viewHistory: "Duba tarihi",
    walletActivity: "Ayyukan jakar & biyan kuɗi",
    blockingLabel: "toshe",
    highPriorityLabel: "matakai na gaba masu muhimmanci",
    actionCenterHint: "An ba Cibiyar Ayyuka fifiko daga amana mai rai, jakar, tallafi, da siginar sanarwa.",
    attentionKicker: "Abin da Yake Buƙatar Kulawarku",
    attentionTitle: "Ana ci gaba, yana jiranka, ko har yanzu ba a warware ba",
    pendingWalletVerification: "Tabbatarwan jakar da ke jira",
    pendingWalletVerificationDetail: "Tabbatarwar jakar ku tana jiran tabbacin kuɗi.",
    unreadNotificationsAttention: "Sanarwa da ba a karanta ba",
    unreadNotificationsAttentionDetail: "Sabuntawar da ba a karanta ba tana jiran dubanka.",
    activePlansInMotion: "Shirye-shirye masu aiki cikin motsi",
    activePlansInMotionDetail: "Kuɗin mamba suna aiki a wannan asusun.",
    unlockTier: "Buɗe {tier}",
    nextTierFallback: "Matsayin amana na gaba yana buƙatar tabbatarwa mai ƙarfi da tarihin asusun mai tsafta.",
    quickActions: "Ayyuka masu sauri",
    addMoney: "Ƙara kuɗi",
    getHelp: "Sami taimako",
    bookCare: "Yi ajiyar kulawa",
    shop: "Siya",
    actionCenter: "Cibiyar Ayyuka",
    actionCenterDescription: "Fara da toshe abubuwa da farko, sannan share matakai masu muhimmanci don kiyaye asusunka yana aiki gaba ɗaya.",
    noUrgentTasks: "Babu ayyukan asusun masu gaggawa yanzu. Kuna cikin ƙoshin lafiya na aiki.",
    viewTaskQueue: "Duba layin jiran aikin cikakke",
    smartRecommendations: "Shawarwari masu wayo",
    smartRecommendationsEmpty: "Ci gaba da amfani da sabis na HenryCo kuma shawarwari za su daidaita da ayyukanku.",
    recommendationReason: "An ba da shawarar daga ayyukan asusunka da yanayin amana ({confidence} amana)",
    recentActivity: "Ayyuka na Kwanan Nan",
    noRecentActivity: "Babu ayyuka na kwanan nan har yanzu",
    recentNotifications: "Sanarwa",
    noNotifications: "Babu sanarwa har yanzu",
    yourServices: "Sabisanku",
    careService: "Care",
    careServiceDescription: "Kulawa da tufafi, tsabtace & kula",
    marketplaceService: "Marketplace",
    marketplaceServiceDescription: "Saya kaya & sayarwa akan layi",
    jobsService: "Jobs",
    jobsServiceDescription: "Aikace-aikace, rawar da aka ajiye & sabuntawar mai daukar ma'aikata",
    studioService: "Studio",
    studioServiceDescription: "Sabis na ƙirƙira & ƙira",
    recommendationTitles: {
      trustNext: "Kammala tabbatarwarka ta amana",
      profileNext: "Gama bayanan martaba ka",
      jobsSaved: "Bi sawun rawar da aka ajiye",
    },
    recommendationDescriptions: {
      trustNext: "Buɗe ƙarin ayyuka a cikin HenryCo.",
      profileNext: "Cikakken bayanan martaba yana inganta tallafi da ci gaban sabis.",
      jobsSaved: "Dawo ka duba rawar da ka riga ka ajiye ka yi aiki a kansu.",
      fallback: "Ci gaba da amfani da sabis na HenryCo kuma shawarwari za su daidaita da ayyukanku.",
    },
  },
  tasks: {
    title: "Ayyuka",
    description: "Ayyuka masu fifiko a duk asusun, amana, jakar, da tallafi.",
    queueTitle: "Yadda wannan layin jira ke aiki",
    queueBody: "Toshe ayyuka na iya hana samun damar workflows masu muhimmanci. Abubuwa masu fifiko su ne mafi kyawun ayyuka na gaba don kiyaye asusunka yana da lafiya da kuma kauce wa jinkiri.",
    emptyTitle: "Babu ayyuka masu aiki",
    emptyDescription: "A halin yanzu kuna da kyau. Ayyuka za su bayyana a nan lokacin da ake buƙatar aiki.",
    blocking: "toshe",
    priorityLabels: {
      low: "ƙasa",
      normal: "al'ada",
      high: "sama",
      urgent: "gaggawa",
    },
    taskTitles: {
      trust: "Kammala matakai na tabbatarwar amana",
      walletFunding: "Bi sawun kuɗin jakar da ke jira",
      support: "Amsa zaren tallafi masu buɗe",
      notifications: "Duba sanarwa da ba a karanta ba",
    },
    taskDescriptions: {
      trustFallback: "Haɓaka matsayin amana don buɗe ƙarin iyawa.",
      walletFunding: "Tabbatarwarku tana jiran tabbacin kuɗi.",
      support: "Zare tallafi masu buɗe har yanzu suna buƙatar kulawarku.",
      notifications: "Sabuntawar da ba a karanta ba tana jiran dubawa.",
    },
  },
  security: {
    title: "Tsaro",
    description: "Duba ayyukan tsaro na kwanan nan, canza kalmar sirri, kuma ƙare zaman HenryCo idan ya zama dole.",
    trustProfile: "Bayanan Martaba na Amana",
    trustDescription: "Amana tana aiki a duk asusun. Yanzu tana sarrafa ayyukan kasuwanci masu ƙimar sama, matsayin kulawa, da cancantar ƙarfi a duk modules na HenryCo.",
    trustScore: "Iya maki amana na asusun",
    signalLabels: {
      emailVerified: "Imel da aka tabbatar",
      identityStatus: "Yanayin ID",
      trustedPhone: "Wayar amintacciya",
      profileCompletion: "Kammala bayanan martaba",
      suspiciousEvents: "Abubuwan da ake zargi",
      contactReview: "Duba hulɗa",
    },
    signalValues: {
      confirmed: "An tabbatar",
      needsAttention: "Yana buƙatar kulawa",
      verified: "An tabbatar",
      underReview: "Ana dubawa",
      needsResubmission: "Yana buƙatar sake aiko",
      notSubmitted: "Ba a aiko ba",
      present: "Yana nan",
      missing: "Ba ya nan",
      manualReview: "Duba da hannu",
      clear: "Sarari",
    },
    whyYouAreHere: "Dalilin da ya sa kuke nan",
    topTrustLaneReached: "An kai tashar amana ta sama",
    topTrustLaneDescription: "Wannan asusun ya riga ya cika mafi girman tashar amana ta yanzu da ake samu a cikin dashboard ɗin da aka raba.",
    baselineReason: "Bayanan martaba na asusun ku na asali yana aiki.",
    whatUnlocks: "Abin da ke buɗe {tier}",
    regionalContext: "Mahallin yankin",
    accountStatus: "Yanayin asusun",
    needsReview: "Yana buƙatar dubawa",
    secure: "Tsaro",
    email: "Imel",
    accountHistory: "Tarihin asusun",
    historyDays: "Tarihin asusun na kwanaki {days}",
    operationalAccess: "Samun damar aiki",
    higherTrustAvailable: "Kasuwanci mai amana mai girma da ayyukan biya suna samuwa",
    moreVerificationNeeded: "Ana buƙatar ƙarin tabbatarwa",
    trustGuide: "Jagorar yanayin amana",
    whatCurrentStateMeans: "Abin da yanayin ku na yanzu ke nufi",
    whatCurrentStateBody: "Wannan yanayi yana ƙayyade samun damar workflows masu ƙima mai girma da ayyukan kasuwanci a HenryCo.",
    whatToDoNext: "Abin da za ku yi na gaba",
    whatToDoNextBody: "Kammala buƙatun da aka jera don buɗe tashar amana ta gaba.",
    currentRestrictions: "Ayyuka da aka iyakance a halin yanzu",
    noRestrictions: "Babu iyakance bisa amana da ke toshe workflows na asusun ku na asali a halin yanzu.",
    recentActivity: "Ayyukan Tsaro na Kwanan Nan",
    recentActivityDescription: "Shigowa, fita, yatsan rantsuwar na'ura, da siginar samun damar da ake zargi ana yin rikodin su a nan don ci gaban zama ya kasance mai iya dubawa.",
    emptyTitle: "Babu ayyukan tsaro na kwanan nan",
    emptyDescription: "Shigowa, rufe zama, faɗakarwa, da canje-canjen asusun masu kima za su bayyana a nan.",
    risk: "haɗari",
    blockedActions: {
      jobs: "Ƙirƙira ayyuka da aka tabbatar ko jerin sunayen masu amana mai girma",
      marketplace: "Samun damar cikakkun gata masu siyarwa na kasuwa",
      property: "Buga workflows na masu gidaje ba tare da ƙarin duba shaida ba",
      payouts: "Yi amfani da ayyukan biya da na kudi masu mahimmanci ba tare da dubawa ba",
      staff: "Yi amfani da hanyoyin ɗagawa masu mahimmanci ga ma'aikata ko kuɗi ba tare da ƙarfin shaida ba",
      financial: "Yi amfani da workflows na kuɗi masu mahimmanci ba tare da dubawa ba",
      overlap: "Yi amfani da mai siyarwa mai amana mai girma, buga dukiya, ko workflows na biya har sai dubawan hulɗa ya wuce",
    },
    reasons: {
      verificationApproved: "An amince da tabbatarwar shaida.",
      verificationPending: "An aiko tabbatarwar shaida kuma tana karkashin dubawa.",
      verificationRejected: "Tabbatarwar shaida tana buƙatar ƙarin bayani kafin a iya buɗe ayyuka masu amana mai girma.",
      verificationMissing: "Ba a gama tabbatarwar shaida ba tukuna.",
      emailVerified: "An tabbatar da mallakar imel.",
      identityVerified: "An kammala tabbatarwar shaida da takardun.",
      documentsUnderReview: "Ana dubawa a takardar shaida a halin yanzu.",
      verificationNeedsAttention: "Tabbatarwar shaida tana buƙatar kulawa kafin a iya buɗe mafi ƙarfin tashohin amana.",
      phonePresent: "Ana da wayar hulɗa.",
      profileStrong: "Kammala bayanan martaba ya isa ƙarfi don workflows da aka tabbatar.",
      accountHistory: "Tarihin asusun ya kai kwanaki {days}.",
      transactionHistory: "Tarihin ma'amaloli da aka tabbatar yana nan.",
      noRiskSignals: "Ba a gano wasu abubuwan tsaro masu haɗari kwanan nan ba.",
    },
    requirements: {
      verified: {
        verification: "Kammala tabbatarwar shaida don tashohin da suka danganci amana su daina dogaro da siginar bayanan martaba masu kyakkyawar fata.",
        email: "Tabbatar da adireshin imel ɗinku.",
        identity: "Cikakken tabbatarwar shaida don mai siyarwa, dukiya, biya, da workflows masu mahimmanci na kuɗi.",
        phone: "Ƙara lambar waya mai amfani.",
        profile: "Kammala ƙarin bayanan martaba ku kuma ƙara takardun shaida.",
        overlap: "Cikakkun hulɗar da aka raba tana buƙatar duba amana da hannu kafin a buɗe ayyuka masu amana mai girma.",
      },
      trusted: {
        verification: "Ana buƙatar amincewa da tabbatarwar shaida kafin a iya buɗe mai siyarwa mai amana, mai daukar ma'aikata, dukiya, da tashohin biya.",
        age: "Gina ƙarin shekarun asusun kafin a buɗe yanayin amana.",
        transactions: "Kammala aƙalla ma'amalar da aka tabbatar ɗaya ko zagayen kuɗi.",
        suspicious: "Kiyaye asusun ba tare da gargaɗin samun damar da ake zargi ba.",
        overlap: "Warware dubawan ɓangarorin hulɗa kafin a buɗe mai siyarwa mai amana, biya, ko tashohin dukiya.",
      },
      premium: {
        verification: "Amana na premium an tanadin ta ne ga asusukan da sun riga sun wuce tabbatarwar shaida.",
        age: "Kiyaye tarihin asusun mai tsafta na tsawon lokaci.",
        transactions: "Gina ƙarin tarihin ma'amaloli da aka tabbatar.",
        activity: "Yi amfani da ƙarin sassan HenryCo tare da sakamakon tsafta.",
        overlap: "Kiyaye dubawan hulɗar da aka raba ta kasance sarari kafin a ba da amana na premium.",
      },
    },
  },
  changePassword: {
    passwordsDoNotMatch: "Kalmomin sirri ba su dace ba",
    passwordTooShort: "Kalmar sirri dole ta kasance aƙalla harafi 8",
    success: "An sabunta kalmar sirrinka.",
    unavailable: "Ba za mu iya sabunta kalmar sirrinka yanzu ba. Da fatan za a sake gwadawa.",
    newPassword: "Kalmar sirri ta sabuwa",
    confirmNewPassword: "Tabbatar da kalmar sirri ta sabuwa",
    minPlaceholder: "Min. harafi 8",
    repeatPlaceholder: "Maimaita kalmar sirri ta sabuwa",
    updating: "Ana sabunta kalmar sirri...",
    updatePassword: "Sabunta kalmar sirri",
  },
  globalSignOut: {
    title: "Ƙare kowane zaman HenryCo",
    description: "Wannan yana fitar da asusun yanzu a duk sassan HenryCo da na'urorin, sannan ya mayar da ku zuwa ɓangaren shiga asusun.",
    note: "Ayyukan na'ura da zama na kwanan nan suna bayyane a ƙasa ko da an fitar da sarrafa guda ɗaya ta kowane na'ura tukuna.",
    unavailable: "Ba za mu iya ƙare kowane zaman HenryCo yanzu ba. Da fatan za a sake gwadawa nan ba da jimawa ba.",
    ending: "Ana ƙarewa duk zaman...",
    endAllSessions: "Fita daga duk zaman HenryCo",
  },
  errorBoundary: {
    kicker: "Lokacin aiki na asusun",
    title: "Wannan ɓangaren asusun ya sami kuskuren abokin ciniki ko bayyanawa",
    description: "An kama gazawa don bincike. Sake loda wannan ɓangaren ku ci gaba daga yanayin da ya kwanta na ƙarshe.",
    reload: "Sake loda wannan ra'ayi",
    contactSupport: "Tuntuɓi tallafi",
  },
  activity: {
    title: "Aiki",
    description: "Duk abin da kuka yi a sassan HenryCo gaba ɗaya.",
    emptyTitle: "Babu aiki tukuna",
    emptyDescription:
      "Aikinku tsakanin sassa zai bayyana a nan yayin da kuke amfani da ayyukan HenryCo.",
    statusLabels: {
      pending: "Ana jira",
      open: "A bayyane",
      updated: "An sabunta",
      completed: "An kammala",
      resolved: "An warware",
      paid: "An biya",
      failed: "Ya gaza",
      active: "Mai aiki",
      refunded: "An mayar da kuɗi",
    },
    filters: {
      heading: "Tace da sauke",
      reset: "Sake saiti",
      fromLabel: "Daga",
      toLabel: "Zuwa",
      amountFromLabel: "Adadi daga (₦)",
      amountToLabel: "Adadi zuwa (₦)",
      divisionEyebrow: "Sashe",
      typeEyebrow: "Nau'i",
      statusEyebrow: "Matsayi",
      pdfNote:
        "PDF ɗin yana ɗauke da kowane tacewa da kuka saita a sama a matsayin sashen kan takarda — abin da kuke gani shi ne kuke saukewa.",
      downloadLabel: "Sauke bayanin asusu",
      downloadFilename: "HenryCo-Tarihin-Mu'amaloli.pdf",
      shareTitle: "Tarihin Mu'amaloli na HenryCo",
      typeLabels: {
        payment: "biyan kuɗi",
        wallet_credit: "ƙarin walat",
        wallet_debit: "cire walat",
        refund: "mayar da kuɗi",
        withdrawal: "cire kuɗi",
        fee: "kuɗin sabis",
      },
    },
  },
  calendar: {
    metaTitle: "Kalanda · HenryCo",
    metaDescription:
      "Tsarin rana na duk rabe-raben — ajiyar Care, ziyarar gida, hira da Jobs, mahimman lokutan Studio, azuzuwan Learn, taga isar Logistics.",
    heroAriaLabel: "Bayyani na kalanda",
    heroEyebrow: "HenryCo · kalanda na duk rabe-raben",
    tileVolumeAriaLabel: "Adadin kalanda",
    tileEventsLabel: "Abubuwan da suka faru",
    tileEventsFoot: "Kwana 28 masu zuwa",
    tilePortalsLabel: "Ƙofofi",
    tilePortalsFootEmpty: "Care, gida, jobs, studio, learn, logistics",
    tilePortalsFootSingular: "Sashe ɗaya da aka tsara",
    tilePortalsFootPlural: "Sassa {count} da aka tsara",
    tileNextLabel: "Mai zuwa",
    tileNextEmpty: "Babu wani abu da aka tsara cikin lokacin",
    sideAriaLabel: "Ta ƙofa",
    sideLabel: "Ta ƙofa",
    sideTitleEmpty: "Babu tsari tukuna",
    sideTitleSingular: "Ƙofa ɗaya tana aiki",
    sideTitlePlural: "Ƙofofi {count} cikin haɗuwa",
    sideBody:
      "Ajiya, ziyarce-ziyarce, hira, mahimman lokuta, azuzuwa da tagar isarwa duk suna bayyana a nan a tsarin lokaci.",
    agendaTitle: "Tsari",
    agendaAriaLabel: "Abubuwan da aka tsara kwana-kwana",
    agendaMetaEmpty: "Babu wani abu da aka tsara cikin kwana 28",
    agendaMetaSingular: "Aukuwa {count} · kwana 28 masu zuwa",
    agendaMetaPlural: "Abubuwa {count} · kwana 28 masu zuwa",
    emptyEyebrow: "Kalanda yana shiru",
    emptyTitle: "Babu abin da aka tsara cikin kwana 28 masu zuwa.",
    emptyBody:
      "Duk abin da ka tsara — ɗaukar Care, ziyarar gida, hirar aiki, ajin Learn, mahimmin lokacin Studio, tagar Logistics — zai shigo nan ta atomatik. Tatataccen tace zai bayyana yayin da ƙofofin suka fara tsarawa.",
    dayMetaSingular: "Aukuwa {count}",
    dayMetaPlural: "Abubuwa {count}",
    eventTimeAriaLabel: "Lokacin aukuwa",
    eventCta: "Buɗe",
    headline: {
      empty: "Babu abin da aka tsara cikin kwana 28 masu zuwa.",
      calmOne: "Abu ɗaya cikin tsari.",
      calmMany: "Abubuwa {count} cikin kwana 28 masu zuwa.",
      busy: "Abubuwa {count} aka tsara ta ƙofofi {portals}.",
      packed: "Abubuwa {count} cikin layi — tsara lokacin maida hankali da hikima.",
    },
    blurb: {
      empty:
        "Ajiyar Care, ziyarar gida, hirar Jobs, mahimman lokutan Studio, azuzuwan Learn da tagar Logistics duk suna bayyana a nan.",
      calm: "Latsa kati don tsallakawa zuwa ƙofarsa. Tsarin zai sabunta da kansa yayin sabbin tsare-tsare suna shigowa.",
      busyOrPacked:
        "Tace a saman tsari yana taƙaita zuwa ƙofa ɗaya — yana da amfani lokacin da rabe-raben ke yin hayaniya.",
    },
    kindLabels: {
      care_booking: "Ajiyar Care",
      property_viewing: "Ziyarar gida",
      jobs_interview: "Hira",
      learn_class: "Aji kai tsaye",
      studio_milestone: "Mahimmin lokaci Studio",
      logistics_pickup: "Tagar ɗauka",
      logistics_delivery: "Tagar isarwa",
      room_session: "Zaman ɗaki",
    },
    dayLabels: {
      today: "Yau",
      tomorrow: "Gobe",
      yesterday: "Jiya",
    },
    portalLabels: {
      care: "Care",
      property: "Gida",
      jobs: "Jobs",
      studio: "Studio",
      learn: "Learn",
      logistics: "Logistics",
    },
  },
  notifications: {
    metadata: {
      title: "Sanarwa",
      description: "Kowane sabunta na HenryCo — walat, tallafi, ayyuka, kasuwa, kulawa, da ƙari — a cikin akwatin sako kai tsaye.",
    },
    hero: {
      eyebrow: "HenryCo · sanarwa kai tsaye",
      ariaOverview: "Bayyani na sanarwa",
      ariaVolume: "Yawan sanarwa",
      ariaByDivision: "Ta sashe",
      headlineZero: "Akwatin sako babu kome a HenryCo.",
      headlineOne: "Akwai abu ɗaya da ke buƙatar hankalin ka.",
      headlineFew: "Sanarwa {count} su jira hankalin ka.",
      headlineMany: "Sabunta {count} a sassan ka.",
      blurbZero: "Duk abin da HenryCo ke aikawa yana isa nan kai tsaye — walat, tallafi, ayyuka, kasuwa, kulawa, da ƙari.",
      blurbStale: "Tsofaffin abubuwa sun haɗu. Yi shafa don adanawa, danna don buɗewa, ko tafi kai tsaye zuwa tattaunawa.",
      blurbToday: "{count} sun isa yau. Yi amfani da masu tace don mai da hankali kan sashe ɗaya kawai, ko ka bi waɗanda ba a karanta ba kawai.",
      tileUnreadLabel: "Ba a karanta ba",
      tileUnreadFoot: "Suna jiran idanun ka",
      tileTodayLabel: "Yau",
      tileTodayFoot: "Sun zo a sa'o'i 24 da suka wuce",
      tileWeekLabel: "Wannan mako",
      tileWeekFoot: "Aikin ƙarshe {when}",
      byDivision: "Ta sashe",
      emptyDivisions: "Babu abin da ya zo har yanzu.",
      lastActivityFallback: "babu sabon aiki",
      justNow: "yanzu nan",
      minutesAgo: "minti {count} da suka wuce",
      hoursAgo: "sa'o'i {count} da suka wuce",
      daysAgo: "kwana {count} da suka wuce",
    },
    inbox: {
      heading: "Akwatin sako",
      meta: "Danna don buɗewa, shafa don adanawa — masu tace na aiki a kowane sashe.",
    },
    filters: {
      all: "Duka",
      unread: "Ba a karanta ba",
      allSources: "Dukan tushe",
      activeFilter: "matace mai aiki",
    },
    feed: {
      unreadSectionKicker: "Ba a karanta ba",
      unreadSectionTitle: "Yana buƙatar hankalin ka",
      recentSectionKicker: "Na kwanan nan",
      recentSectionTitle: "Aikin da aka share ko duba",
      unreadBadge: "Ba a karanta ba",
      openMessageBoard: "Buɗe allon saƙo",
    },
    swipe: {
      archive: "Adana",
      delete: "Share",
      markRead: "Yi alamar a matsayin an karanta",
      markUnread: "Yi alamar a matsayin ba a karanta ba",
    },
    emptyState: {
      inboxTitle: "Duk an gama.",
      inboxBody: "Ayyuka daga duk faɗin HenryCo suna bayyana nan yayin da suke faruwa.",
      filterTitle: "Babu aiki a wannan kallo.",
      filterBody: "Gwada matace daban.",
    },
    markAllRead: {
      label: "Yi alamar duka a karanta",
      pending: "Ana yiwa duka alamar a karanta...",
      spinner: "Ana yiwa duka alamar a karanta",
    },
    footer: {
      recentlyDeleted: "An share kwanan nan",
    },
  },
  invoices: {
    metadata: {
      title: "Lissafin kuɗi da rasidoji",
      description: "Tarihin biyan kuɗin ku da rasidoji da za a iya saukarwa.",
    },
    hero: {
      eyebrow: "Lissafin kuɗi · rasidoji",
      ariaOverview: "Bayanin lissafin kuɗi",
      ariaTotals: "Jimillar kuɗi",
      ariaByDivision: "Ta sashe",
      headlineEmpty: "Rasidojin ku za su sauka nan.",
      headlineWithReceipts: "Kowane rasidi, wuri ɗaya.",
      blurb:
        "Kowane biya a cikin HenryCo yana zuwa nan a matsayin PDF mai alama mai saukarwa — ajiyar Care, oda na Marketplace, lissafin Studio, jigilar Logistics, takaddun Learn.",
      totalPaidLabel: "Jimillar da aka biya · rayuwa",
      thisMonthLabel: "An biya · wannan watan",
      thisMonthFoot: "Rasidoji daga wannan watan kalandar",
      outstandingLabel: "Sauran",
      paidCountUnit: "rasidoji",
      pendingCountUnit: "ana jira",
      overdueCountUnit: "sun ƙare",
      byDivision: "Ta sashe",
      byDivisionEmpty: "Babu lissafi tukuna.",
    },
    section: {
      title: "Duk lissafin kuɗi",
      receiptsOnFileSingular: "rasidi a ajiye",
      receiptsOnFilePlural: "rasidoji a ajiye",
    },
    empty: {
      title: "Babu lissafi tukuna",
      description:
        "Lissafin kuɗin ku da rasidoji za su bayyana nan bayan biyan kuɗi a ayyukan HenryCo.",
    },
    statuses: {
      paid: "An biya",
      pending: "Ana jira",
      overdue: "Sun ƙare",
      draft: "Daftarin farko",
      cancelled: "An soke",
      refunded: "An dawo da kuɗi",
      fallback: "Yanayin jira",
    },
    list: {
      ariaLabel: "Lissafin kuɗi",
      fallbackTitle: "Lissafi {number}",
      rowAriaLabel: "Lissafi {number} na ₦{amount}",
    },
    divisions: {
      account: "Asusu",
      wallet: "Walat",
      marketplace: "Marketplace",
      studio: "Studio",
      jobs: "Jobs",
      learn: "Learn",
      property: "Kadara",
      logistics: "Logistics",
      care: "Care",
      fallback: "Asusu",
    },
    footerNote: "Rasidoji suna saukarwa a matsayin PDF mai alama.",
  },
};

const ZH: DeepPartial<AccountCopy> = {
  trustTierLabels: {
    basic: "基础",
    verified: "已验证",
    trusted: "可信",
    premium_verified: "高级已验证",
  },
  common: {
    source: "来源",
    viewAll: "查看全部",
    unread: "未读",
    defaultBadge: "默认",
    noReceiptYet: "暂无收据",
    unknownCustomer: "客户",
    page: "页",
    of: "共",
    perPage: "每页",
    previous: "上一页",
    next: "下一页",
    filtered: "已筛选",
    bookingSingular: "预约",
    bookingPlural: "预约",
    justNow: "刚刚",
  },
  overview: {
    welcomeBack: "欢迎回来",
    description: "您的 HenryCo 指挥中心 — 所有部门的一切，尽在一处。",
    walletBalance: "钱包余额",
    walletHint: "共享钱包 · 可在 HenryCo 所有服务中使用",
    notifications: "通知",
    allCaughtUp: "全部已处理",
    unreadMessages: "未读消息",
    activeSubscriptions: "活跃订阅",
    noActivePlans: "没有已同步的活跃计划",
    syncedPlans: "已同步的活跃计划",
    trustTier: "信任等级",
    scoreLabel: "评分",
    businessActionsUnlocked: "已解锁商业操作",
    moreVerificationNeeded: "需要更多验证",
    invoices: "发票",
    pending: "待处理",
    allSettled: "全部已结算",
    support: "支持",
    newReplies: "有新回复",
    openRequests: "未解决请求",
    noOpenRequests: "没有未解决请求",
    referrals: "推荐",
    inviteAndEarn: "邀请即赚取",
    shareHenryCo: "与他人分享 HenryCo",
    transactions: "交易",
    viewHistory: "查看历史",
    walletActivity: "钱包活动及付款",
    blockingLabel: "阻塞",
    highPriorityLabel: "高优先级后续步骤",
    actionCenterHint: "您的操作中心根据实时信任、钱包、支持和通知信号优先排序。",
    attentionKicker: "需要您关注的事项",
    attentionTitle: "进行中、等待您处理或尚未解决",
    pendingWalletVerification: "钱包验证待处理",
    pendingWalletVerificationDetail: "您的钱包证明仍在等待财务确认。",
    unreadNotificationsAttention: "未读通知",
    unreadNotificationsAttentionDetail: "未读更新仍在等待您的审核。",
    activePlansInMotion: "活跃计划进行中",
    activePlansInMotionDetail: "订阅目前正在此账户上运行。",
    unlockTier: "解锁 {tier}",
    nextTierFallback: "您的下一个信任等级需要更强的验证和更清洁的账户历史记录。",
    quickActions: "快速操作",
    addMoney: "添加资金",
    getHelp: "获取帮助",
    bookCare: "预约护理",
    shop: "购物",
    actionCenter: "操作中心",
    actionCenterDescription: "先从阻塞项目开始，然后清除高优先级步骤，以保持账户完全正常运行。",
    noUrgentTasks: "目前没有紧急账户任务。您处于健康运营状态。",
    viewTaskQueue: "查看完整任务队列",
    smartRecommendations: "智能推荐",
    smartRecommendationsEmpty: "继续使用 HenryCo 服务，推荐将根据您的活动进行调整。",
    recommendationReason: "根据您的账户活动和信任状态建议（{confidence} 置信度）",
    recentActivity: "最近活动",
    noRecentActivity: "暂无最近活动",
    recentNotifications: "通知",
    noNotifications: "暂无通知",
    yourServices: "您的服务",
    careService: "Care",
    careServiceDescription: "织物护理、清洁与保养",
    marketplaceService: "Marketplace",
    marketplaceServiceDescription: "购买产品并在线销售",
    jobsService: "Jobs",
    jobsServiceDescription: "申请、已保存职位及招聘动态",
    studioService: "Studio",
    studioServiceDescription: "创意与设计服务",
    recommendationTitles: {
      trustNext: "完成信任验证",
      profileNext: "完善您的个人资料",
      jobsSaved: "跟进已保存的职位",
    },
    recommendationDescriptions: {
      trustNext: "解锁 HenryCo 中的更多操作。",
      profileNext: "完整的个人资料可提升支持和服务连续性。",
      jobsSaved: "重新查看您已保存的职位并采取行动。",
      fallback: "继续使用 HenryCo 服务，推荐将根据您的活动进行调整。",
    },
  },
  tasks: {
    title: "任务",
    description: "跨账户、信任、钱包和支持的优先操作。",
    queueTitle: "此队列如何运作",
    queueBody: "阻塞任务可能会阻止访问重要工作流程。高优先级项目是保持账户健康、避免延误的最佳后续操作。",
    emptyTitle: "没有活跃任务",
    emptyDescription: "您目前状态良好。当需要采取行动时，任务将显示在此处。",
    blocking: "阻塞",
    priorityLabels: {
      low: "低",
      normal: "普通",
      high: "高",
      urgent: "紧急",
    },
    taskTitles: {
      trust: "完成信任验证步骤",
      walletFunding: "跟进待处理的钱包充值",
      support: "回复未解决的支持话题",
      notifications: "查看未读通知",
    },
    taskDescriptions: {
      trustFallback: "升级信任等级以解锁更多功能。",
      walletFunding: "您的证明正在等待财务确认。",
      support: "未解决的支持对话仍需您的关注。",
      notifications: "未读更新正在等待审核。",
    },
  },
  security: {
    title: "安全",
    description: "查看最近的安全活动、更改密码，并在需要时结束 HenryCo 会话。",
    trustProfile: "信任档案",
    trustDescription: "信任在整个账户中正常运行。它现在控制更高价值的商业操作、内容审核立场以及在所有 HenryCo 模块中更强的资格。",
    trustScore: "账户信任评分",
    signalLabels: {
      emailVerified: "已验证邮箱",
      identityStatus: "身份状态",
      trustedPhone: "受信任手机",
      profileCompletion: "资料完整度",
      suspiciousEvents: "可疑事件",
      contactReview: "联系人审核",
    },
    signalValues: {
      confirmed: "已确认",
      needsAttention: "需要关注",
      verified: "已验证",
      underReview: "审核中",
      needsResubmission: "需要重新提交",
      notSubmitted: "未提交",
      present: "已存在",
      missing: "缺失",
      manualReview: "人工审核",
      clear: "清晰",
    },
    whyYouAreHere: "您在这里的原因",
    topTrustLaneReached: "已达到最高信任通道",
    topTrustLaneDescription: "此账户已满足共享仪表板中当前可用的最高信任通道。",
    baselineReason: "您的基础账户档案处于活跃状态。",
    whatUnlocks: "解锁 {tier} 的条件",
    regionalContext: "地区背景",
    accountStatus: "账户状态",
    needsReview: "需要审核",
    secure: "安全",
    email: "邮箱",
    accountHistory: "账户历史",
    historyDays: "{days} 天的账户历史",
    operationalAccess: "运营访问权限",
    higherTrustAvailable: "可使用更高信任的商业和提现操作",
    moreVerificationNeeded: "需要更多验证",
    trustGuide: "信任状态指南",
    whatCurrentStateMeans: "您当前状态的含义",
    whatCurrentStateBody: "此状态决定了对 HenryCo 中更高价值工作流程和商业操作的访问权限。",
    whatToDoNext: "下一步该怎么做",
    whatToDoNextBody: "完成列出的要求以解锁下一个信任通道。",
    currentRestrictions: "当前受限操作",
    noRestrictions: "目前没有基于信任的限制阻止您的核心账户工作流程。",
    recentActivity: "近期安全活动",
    recentActivityDescription: "登录、退出、设备指纹和可疑访问信号记录在此，以便在单独的每设备撤销控件发布之前，会话连续性仍可审查。",
    emptyTitle: "没有近期安全活动",
    emptyDescription: "登录、会话关闭、警报和敏感账户更改将显示在此处。",
    risk: "风险",
    blockedActions: {
      jobs: "创建已验证职位或更高信任度的列表",
      marketplace: "访问完整的市场卖家特权",
      property: "在未添加身份审核的情况下发布房产所有者工作流程",
      payouts: "在未审核的情况下使用付款和敏感财务操作",
      staff: "在没有更强身份证明的情况下使用对员工或财务敏感的提升路径",
      financial: "在未审核的情况下使用敏感财务工作流程",
      overlap: "使用更高信任的卖家、房产发布或付款工作流程，直到联系人审核通过",
    },
    reasons: {
      verificationApproved: "身份验证已获批准。",
      verificationPending: "身份验证已提交，正在审核中。",
      verificationRejected: "身份验证需要更多信息，才能解锁更高信任度的操作。",
      verificationMissing: "身份验证尚未完成。",
      emailVerified: "邮箱所有权已验证。",
      identityVerified: "文件支持的身份验证已完成。",
      documentsUnderReview: "身份文件目前正在审核中。",
      verificationNeedsAttention: "身份验证需要关注，才能解锁最强的信任通道。",
      phonePresent: "联系电话已存档。",
      profileStrong: "资料完整度足以满足已验证工作流程的要求。",
      accountHistory: "账户历史跨度为 {days} 天。",
      transactionHistory: "已验证的交易历史存在。",
      noRiskSignals: "未发现近期高风险安全事件。",
    },
    requirements: {
      verified: {
        verification: "完成身份验证，以便基于信任的通道不再依赖乐观的档案信号。",
        email: "验证您的电子邮件地址。",
        identity: "完成卖家、房产、付款和财务敏感工作流程的身份验证。",
        phone: "添加可用的电话号码。",
        profile: "完善更多个人资料并添加证明文件。",
        overlap: "共享的联系人详情需要人工信任审核，然后才能解锁更高信任度的操作。",
      },
      trusted: {
        verification: "需要获得身份验证批准，才能解锁受信任的卖家、雇主、房产和付款通道。",
        age: "在可信状态解锁之前，积累更多账户年龄。",
        transactions: "完成至少一笔已验证的交易或充值周期。",
        suspicious: "保持账户不受可疑访问警告的影响。",
        overlap: "在受信任的卖家、付款或房产通道解锁之前，解决联系人重叠审核问题。",
      },
      premium: {
        verification: "高级信任专为已通过身份验证的账户保留。",
        age: "保持更长的清洁账户历史记录。",
        transactions: "建立更强的已验证交易记录。",
        activity: "使用更多 HenryCo 部门并获得干净的结果。",
        overlap: "在授予高级信任之前，保持重复联系人审核清晰。",
      },
    },
  },
  changePassword: {
    passwordsDoNotMatch: "密码不匹配",
    passwordTooShort: "密码至少需要 8 个字符",
    success: "您的密码已更新。",
    unavailable: "我们目前无法更新您的密码。请重试。",
    newPassword: "新密码",
    confirmNewPassword: "确认新密码",
    minPlaceholder: "至少 8 个字符",
    repeatPlaceholder: "重复新密码",
    updating: "正在更新密码...",
    updatePassword: "更新密码",
  },
  globalSignOut: {
    title: "结束所有 HenryCo 会话",
    description: "这将在所有 HenryCo 部门和设备上注销当前账户，然后将您返回到账户登录界面。",
    note: "近期设备和会话活动仍然在下方可见，尽管实时按设备撤销尚未作为单独控件公开。",
    unavailable: "我们目前无法结束所有 HenryCo 会话。请稍后重试。",
    ending: "正在结束所有会话...",
    endAllSessions: "退出所有 HenryCo 会话",
  },
  errorBoundary: {
    kicker: "账户运行时",
    title: "此账户界面遇到客户端或渲染故障",
    description: "故障已被捕获以供调查。请重新加载此界面并从最后稳定状态继续。",
    reload: "重新加载此视图",
    contactSupport: "联系支持",
  },
  activity: {
    title: "活动",
    description: "您在所有 HenryCo 部门所做的一切。",
    emptyTitle: "暂无活动",
    emptyDescription:
      "当您使用 HenryCo 服务时,您跨部门的活动将显示在此处。",
    statusLabels: {
      pending: "待处理",
      open: "未结",
      updated: "已更新",
      completed: "已完成",
      resolved: "已解决",
      paid: "已支付",
      failed: "失败",
      active: "进行中",
      refunded: "已退款",
    },
    filters: {
      heading: "筛选并下载",
      reset: "重置",
      fromLabel: "起始",
      toLabel: "结束",
      amountFromLabel: "金额起 (₦)",
      amountToLabel: "金额止 (₦)",
      divisionEyebrow: "部门",
      typeEyebrow: "类型",
      statusEyebrow: "状态",
      pdfNote:
        "PDF 将您在上方设置的每一项筛选作为文档头的一部分一并携带 — 所见即所得。",
      downloadLabel: "下载对账单",
      downloadFilename: "HenryCo-交易历史.pdf",
      shareTitle: "HenryCo 交易历史",
      typeLabels: {
        payment: "支付",
        wallet_credit: "钱包入账",
        wallet_debit: "钱包扣款",
        refund: "退款",
        withdrawal: "提现",
        fee: "手续费",
      },
    },
  },
  calendar: {
    metaTitle: "日历 · HenryCo",
    metaDescription:
      "跨门户日程 — Care 预约、房产看房、Jobs 面试、Studio 里程碑、Learn 课程、Logistics 窗口。",
    heroAriaLabel: "日历概览",
    heroEyebrow: "HenryCo · 跨门户日历",
    tileVolumeAriaLabel: "日历容量",
    tileEventsLabel: "事件",
    tileEventsFoot: "未来 28 天",
    tilePortalsLabel: "门户",
    tilePortalsFootEmpty: "Care、房产、Jobs、Studio、Learn、Logistics",
    tilePortalsFootSingular: "一个部门已排期",
    tilePortalsFootPlural: "{count} 个部门已排期",
    tileNextLabel: "下一个",
    tileNextEmpty: "窗口内未排期",
    sideAriaLabel: "按门户",
    sideLabel: "按门户",
    sideTitleEmpty: "尚未排期",
    sideTitleSingular: "一个门户活跃",
    sideTitlePlural: "{count} 个门户参与",
    sideBody:
      "预约、看房、面试、里程碑、课程和派送窗口都将按时间顺序显示在此处。",
    agendaTitle: "议程",
    agendaAriaLabel: "按日分组的预定事件",
    agendaMetaEmpty: "28 天窗口内未排期",
    agendaMetaSingular: "{count} 个事件 · 未来 28 天",
    agendaMetaPlural: "{count} 个事件 · 未来 28 天",
    emptyEyebrow: "日历安静",
    emptyTitle: "未来 28 天内未排期。",
    emptyBody:
      "您预订的任何内容 — Care 取件、房产看房、招聘面试、Learn 课程、Studio 里程碑、Logistics 窗口 — 都将自动出现在此议程中。门户开始排期后将显示过滤标签。",
    dayMetaSingular: "{count} 个事件",
    dayMetaPlural: "{count} 个事件",
    eventTimeAriaLabel: "事件时间",
    eventCta: "打开",
    headline: {
      empty: "未来 28 天内未排期。",
      calmOne: "议程中仅有一项。",
      calmMany: "未来 28 天内共 {count} 个事件。",
      busy: "{count} 个事件分布在 {portals} 个门户中。",
      packed: "{count} 个事件排队中 — 合理安排专注时间。",
    },
    blurb: {
      empty:
        "Care 预约、房产看房、Jobs 面试、Studio 里程碑、Learn 课程和 Logistics 窗口都将显示在这里。",
      calm: "点击卡片跳转到对应门户。议程会随着新排期到来自动刷新。",
      busyOrPacked:
        "议程顶部的过滤标签可缩小到单一门户 — 当某个部门较为繁忙时很有用。",
    },
    kindLabels: {
      care_booking: "Care 预约",
      property_viewing: "房产看房",
      jobs_interview: "面试",
      learn_class: "直播课程",
      studio_milestone: "Studio 里程碑",
      logistics_pickup: "取件窗口",
      logistics_delivery: "派送窗口",
      room_session: "房间会话",
    },
    dayLabels: {
      today: "今天",
      tomorrow: "明天",
      yesterday: "昨天",
    },
    portalLabels: {
      care: "Care",
      property: "房产",
      jobs: "Jobs",
      studio: "Studio",
      learn: "Learn",
      logistics: "Logistics",
    },
  },
  notifications: {
    metadata: {
      title: "通知",
      description: "HenryCo 的每一次更新——钱包、支持、招聘、市场、护理及更多——尽在一个实时收件箱中。",
    },
    hero: {
      eyebrow: "HenryCo · 实时通知",
      ariaOverview: "通知概览",
      ariaVolume: "通知数量",
      ariaByDivision: "按部门",
      headlineZero: "HenryCo 收件箱已清零。",
      headlineOne: "有一件事需要您的关注。",
      headlineFew: "{count} 条通知待处理。",
      headlineMany: "您的各部门有 {count} 条更新。",
      blurbZero: "HenryCo 发送的任何内容都会实时到达此处——钱包、支持、招聘、市场、护理及更多。",
      blurbStale: "旧条目已堆积。滑动以归档,点击以打开,或直接跳转到某个会话。",
      blurbToday: "今天到达 {count} 条。使用筛选器专注于单个部门,或仅快速浏览未读。",
      tileUnreadLabel: "未读",
      tileUnreadFoot: "等待您查看",
      tileTodayLabel: "今天",
      tileTodayFoot: "过去 24 小时内到达",
      tileWeekLabel: "本周",
      tileWeekFoot: "最近活动 {when}",
      byDivision: "按部门",
      emptyDivisions: "尚未收到任何内容。",
      lastActivityFallback: "无最近活动",
      justNow: "刚刚",
      minutesAgo: "{count} 分钟前",
      hoursAgo: "{count} 小时前",
      daysAgo: "{count} 天前",
    },
    inbox: {
      heading: "收件箱",
      meta: "点击打开,滑动归档——筛选器适用于所有部门。",
    },
    filters: {
      all: "全部",
      unread: "未读",
      allSources: "所有来源",
      activeFilter: "活动筛选",
    },
    feed: {
      unreadSectionKicker: "未读",
      unreadSectionTitle: "需要您关注",
      recentSectionKicker: "最近",
      recentSectionTitle: "已处理或已查阅的活动",
      unreadBadge: "未读",
      openMessageBoard: "打开消息板",
    },
    swipe: {
      archive: "归档",
      delete: "删除",
      markRead: "标记为已读",
      markUnread: "标记为未读",
    },
    emptyState: {
      inboxTitle: "全部处理完毕。",
      inboxBody: "整个 HenryCo 的活动将在发生时显示在此处。",
      filterTitle: "此视图中无活动。",
      filterBody: "请尝试其他筛选条件。",
    },
    markAllRead: {
      label: "全部标记为已读",
      pending: "正在全部标记为已读...",
      spinner: "正在全部标记为已读",
    },
    footer: {
      recentlyDeleted: "最近删除",
    },
  },
  invoices: {
    metadata: {
      title: "发票与收据",
      description: "您的付款历史与可下载的收据。",
    },
    hero: {
      eyebrow: "发票 · 收据",
      ariaOverview: "发票概览",
      ariaTotals: "财务汇总",
      ariaByDivision: "按部门",
      headlineEmpty: "收据将到达此处。",
      headlineWithReceipts: "每张收据，集中一处。",
      blurb:
        "HenryCo 中的每一笔付款都会以带品牌、可下载的 PDF 形式到达此处 — Care 预订、Marketplace 订单、Studio 发票、Logistics 货运、Learn 证书。",
      totalPaidLabel: "总支付 · 终身",
      thisMonthLabel: "已支付 · 本月",
      thisMonthFoot: "本日历月内的收据",
      outstandingLabel: "待付",
      paidCountUnit: "张收据",
      pendingCountUnit: "待处理",
      overdueCountUnit: "逾期",
      byDivision: "按部门",
      byDivisionEmpty: "暂无发票。",
    },
    section: {
      title: "全部发票",
      receiptsOnFileSingular: "张存档收据",
      receiptsOnFilePlural: "张存档收据",
    },
    empty: {
      title: "暂无发票",
      description: "您在 HenryCo 服务中完成付款后，发票和收据将出现在此。",
    },
    statuses: {
      paid: "已支付",
      pending: "待处理",
      overdue: "逾期",
      draft: "草稿",
      cancelled: "已取消",
      refunded: "已退款",
      fallback: "状态待定",
    },
    list: {
      ariaLabel: "发票",
      fallbackTitle: "发票 {number}",
      rowAriaLabel: "发票 {number} ₦{amount}",
    },
    divisions: {
      account: "账户",
      wallet: "钱包",
      marketplace: "Marketplace",
      studio: "Studio",
      jobs: "Jobs",
      learn: "Learn",
      property: "房产",
      logistics: "Logistics",
      care: "Care",
      fallback: "账户",
    },
    footerNote: "收据以带品牌的 PDF 形式下载。",
  },
};

const HI: DeepPartial<AccountCopy> = {
  trustTierLabels: {
    basic: "बुनियादी",
    verified: "सत्यापित",
    trusted: "विश्वसनीय",
    premium_verified: "प्रीमियम सत्यापित",
  },
  common: {
    source: "स्रोत",
    viewAll: "सब देखें",
    unread: "अपठित",
    defaultBadge: "डिफ़ॉल्ट",
    noReceiptYet: "अभी तक कोई रसीद नहीं",
    unknownCustomer: "ग्राहक",
    page: "पृष्ठ",
    of: "का",
    perPage: "प्रति पृष्ठ",
    previous: "पिछला",
    next: "अगला",
    filtered: "फ़िल्टर किया गया",
    bookingSingular: "बुकिंग",
    bookingPlural: "बुकिंग",
    justNow: "अभी-अभी",
  },
  overview: {
    welcomeBack: "वापस स्वागत है",
    description: "आपका HenryCo कमांड सेंटर — सभी डिवीजनों में सब कुछ, एक जगह।",
    walletBalance: "वॉलेट शेष",
    walletHint: "साझा वॉलेट · HenryCo सेवाओं में उपयोग करें",
    notifications: "सूचनाएं",
    allCaughtUp: "सब कुछ ठीक है",
    unreadMessages: "अपठित संदेश",
    activeSubscriptions: "सक्रिय सदस्यताएं",
    noActivePlans: "कोई सिंक की गई सक्रिय योजना नहीं",
    syncedPlans: "सिंक की गई सक्रिय योजनाएं",
    trustTier: "विश्वास स्तर",
    scoreLabel: "स्कोर",
    businessActionsUnlocked: "व्यावसायिक क्रियाएं अनलॉक हैं",
    moreVerificationNeeded: "अधिक सत्यापन की आवश्यकता है",
    invoices: "चालान",
    pending: "लंबित",
    allSettled: "सब निपटा",
    support: "सहायता",
    newReplies: "नए जवाब के साथ",
    openRequests: "खुले अनुरोध",
    noOpenRequests: "कोई खुला अनुरोध नहीं",
    referrals: "रेफरल",
    inviteAndEarn: "आमंत्रित करें और कमाएं",
    shareHenryCo: "HenryCo को दूसरों के साथ साझा करें",
    transactions: "लेनदेन",
    viewHistory: "इतिहास देखें",
    walletActivity: "वॉलेट गतिविधि और भुगतान",
    blockingLabel: "ब्लॉकिंग",
    highPriorityLabel: "उच्च-प्राथमिकता के अगले चरण",
    actionCenterHint: "आपका एक्शन सेंटर लाइव ट्रस्ट, वॉलेट, सपोर्ट और नोटिफिकेशन सिग्नल से प्राथमिकता पाता है।",
    attentionKicker: "आपको क्या ध्यान देना चाहिए",
    attentionTitle: "प्रगति में, आपका इंतज़ार हो रहा है, या अभी भी अनसुलझा",
    pendingWalletVerification: "वॉलेट सत्यापन लंबित",
    pendingWalletVerificationDetail: "आपका वॉलेट प्रमाण अभी भी वित्त पुष्टि की प्रतीक्षा कर रहा है।",
    unreadNotificationsAttention: "अपठित सूचनाएं",
    unreadNotificationsAttentionDetail: "अपठित अपडेट अभी भी आपकी समीक्षा का इंतजार कर रहे हैं।",
    activePlansInMotion: "सक्रिय योजनाएं चल रही हैं",
    activePlansInMotionDetail: "इस खाते पर वर्तमान में सदस्यताएं चल रही हैं।",
    unlockTier: "{tier} अनलॉक करें",
    nextTierFallback: "आपके अगले विश्वास स्तर के लिए मजबूत सत्यापन और स्वच्छ खाता इतिहास की आवश्यकता है।",
    quickActions: "त्वरित क्रियाएं",
    addMoney: "पैसे जोड़ें",
    getHelp: "मदद लें",
    bookCare: "केयर बुक करें",
    shop: "खरीदारी करें",
    actionCenter: "एक्शन सेंटर",
    actionCenterDescription: "पहले ब्लॉकिंग आइटम से शुरू करें, फिर उच्च-प्राथमिकता वाले चरणों को साफ करें ताकि आपका खाता पूरी तरह से चालू रहे।",
    noUrgentTasks: "अभी कोई अत्यावश्यक खाता कार्य नहीं है। आप एक स्वस्थ परिचालन स्थिति में हैं।",
    viewTaskQueue: "पूर्ण कार्य कतार देखें",
    smartRecommendations: "स्मार्ट अनुशंसाएं",
    smartRecommendationsEmpty: "HenryCo सेवाओं का उपयोग करते रहें और अनुशंसाएं आपकी गतिविधि के अनुसार अनुकूलित होंगी।",
    recommendationReason: "आपकी खाता गतिविधि और विश्वास स्थिति ({confidence} विश्वास) से सुझाया गया",
    recentActivity: "हाल की गतिविधि",
    noRecentActivity: "अभी तक कोई हाल की गतिविधि नहीं",
    recentNotifications: "सूचनाएं",
    noNotifications: "अभी तक कोई सूचना नहीं",
    yourServices: "आपकी सेवाएं",
    careService: "Care",
    careServiceDescription: "कपड़े की देखभाल, सफाई और रखरखाव",
    marketplaceService: "Marketplace",
    marketplaceServiceDescription: "उत्पाद खरीदें और ऑनलाइन बेचें",
    jobsService: "Jobs",
    jobsServiceDescription: "आवेदन, सहेजे गए रोल और भर्तीकर्ता अपडेट",
    studioService: "Studio",
    studioServiceDescription: "रचनात्मक और डिज़ाइन सेवाएं",
    recommendationTitles: {
      trustNext: "अपना विश्वास सत्यापन पूरा करें",
      profileNext: "अपनी प्रोफाइल पूरी करें",
      jobsSaved: "सहेजे गए रोल का अनुसरण करें",
    },
    recommendationDescriptions: {
      trustNext: "HenryCo में अधिक क्रियाएं अनलॉक करें।",
      profileNext: "एक पूर्ण प्रोफाइल समर्थन और सेवा निरंतरता में सुधार करती है।",
      jobsSaved: "उन रोल पर वापस जाएं जो आपने पहले ही सहेजे हैं और उन पर कार्य करें।",
      fallback: "HenryCo सेवाओं का उपयोग करते रहें और अनुशंसाएं आपकी गतिविधि के अनुसार अनुकूलित होंगी।",
    },
  },
  tasks: {
    title: "कार्य",
    description: "खाता, विश्वास, वॉलेट और सहायता में प्राथमिकता वाली क्रियाएं।",
    queueTitle: "यह कतार कैसे काम करती है",
    queueBody: "ब्लॉकिंग कार्य महत्वपूर्ण वर्कफ़्लो तक पहुंच रोक सकते हैं। उच्च-प्राथमिकता वाले आइटम अगली सर्वोत्तम क्रियाएं हैं जो आपके खाते को स्वस्थ रखती हैं।",
    emptyTitle: "कोई सक्रिय कार्य नहीं",
    emptyDescription: "आप अभी स्पष्ट हैं। जब कार्रवाई की आवश्यकता होगी तो यहां कार्य दिखाई देंगे।",
    blocking: "ब्लॉकिंग",
    priorityLabels: {
      low: "कम",
      normal: "सामान्य",
      high: "उच्च",
      urgent: "अत्यावश्यक",
    },
    taskTitles: {
      trust: "विश्वास सत्यापन चरण पूरे करें",
      walletFunding: "लंबित वॉलेट फंडिंग का अनुसरण करें",
      support: "खुले सहायता थ्रेड का उत्तर दें",
      notifications: "अपठित सूचनाओं की समीक्षा करें",
    },
    taskDescriptions: {
      trustFallback: "अधिक क्षमताओं को अनलॉक करने के लिए विश्वास स्तर अपग्रेड करें।",
      walletFunding: "आपका प्रमाण वित्त पुष्टि का इंतजार कर रहा है।",
      support: "खुली सहायता बातचीत को अभी भी आपके ध्यान की जरूरत है।",
      notifications: "अपठित अपडेट समीक्षा का इंतजार कर रहे हैं।",
    },
  },
  security: {
    title: "सुरक्षा",
    description: "हाल की सुरक्षा गतिविधि की समीक्षा करें, अपना पासवर्ड बदलें, और जरूरत होने पर HenryCo सत्र समाप्त करें।",
    trustProfile: "विश्वास प्रोफाइल",
    trustDescription: "विश्वास पूरे खाते में चालू है। यह अब उच्च-मूल्य व्यावसायिक क्रियाओं, मॉडरेशन स्थिति और HenryCo मॉड्यूल में मजबूत पात्रता को नियंत्रित करता है।",
    trustScore: "खाता विश्वास स्कोर",
    signalLabels: {
      emailVerified: "सत्यापित ईमेल",
      identityStatus: "पहचान स्थिति",
      trustedPhone: "विश्वसनीय फोन",
      profileCompletion: "प्रोफाइल पूर्णता",
      suspiciousEvents: "संदिग्ध घटनाएं",
      contactReview: "संपर्क समीक्षा",
    },
    signalValues: {
      confirmed: "पुष्टि की गई",
      needsAttention: "ध्यान चाहिए",
      verified: "सत्यापित",
      underReview: "समीक्षाधीन",
      needsResubmission: "पुनः सबमिट करना है",
      notSubmitted: "सबमिट नहीं किया गया",
      present: "मौजूद",
      missing: "गायब",
      manualReview: "मैनुअल समीक्षा",
      clear: "स्पष्ट",
    },
    whyYouAreHere: "आप यहाँ क्यों हैं",
    topTrustLaneReached: "शीर्ष विश्वास लेन तक पहुंचा",
    topTrustLaneDescription: "यह खाता पहले से ही साझा डैशबोर्ड में वर्तमान में उपलब्ध उच्चतम विश्वास लेन को पूरा करता है।",
    baselineReason: "आपकी बेसलाइन खाता प्रोफाइल सक्रिय है।",
    whatUnlocks: "{tier} क्या अनलॉक करता है",
    regionalContext: "क्षेत्रीय संदर्भ",
    accountStatus: "खाता स्थिति",
    needsReview: "समीक्षा की जरूरत है",
    secure: "सुरक्षित",
    email: "ईमेल",
    accountHistory: "खाता इतिहास",
    historyDays: "खाता इतिहास के {days} दिन",
    operationalAccess: "परिचालन पहुंच",
    higherTrustAvailable: "उच्च-विश्वास व्यावसायिक और भुगतान क्रियाएं उपलब्ध हैं",
    moreVerificationNeeded: "अधिक सत्यापन की आवश्यकता है",
    trustGuide: "विश्वास स्थिति मार्गदर्शिका",
    whatCurrentStateMeans: "आपकी वर्तमान स्थिति का अर्थ",
    whatCurrentStateBody: "यह स्थिति HenryCo में उच्च-मूल्य वर्कफ़्लो और व्यावसायिक क्रियाओं तक पहुंच निर्धारित करती है।",
    whatToDoNext: "आगे क्या करना है",
    whatToDoNextBody: "अगली विश्वास लेन को अनलॉक करने के लिए सूचीबद्ध आवश्यकताएं पूरी करें।",
    currentRestrictions: "वर्तमान में प्रतिबंधित क्रियाएं",
    noRestrictions: "वर्तमान में कोई विश्वास-आधारित प्रतिबंध नहीं हैं जो आपके मुख्य खाते के वर्कफ़्लो को अवरुद्ध कर रहे हों।",
    recentActivity: "हाल की सुरक्षा गतिविधि",
    recentActivityDescription: "साइन-इन, साइन-आउट, डिवाइस फिंगरप्रिंट और संदिग्ध एक्सेस सिग्नल यहां दर्ज किए जाते हैं ताकि सत्र निरंतरता समीक्षा योग्य रहे।",
    emptyTitle: "कोई हाल की सुरक्षा गतिविधि नहीं",
    emptyDescription: "साइन-इन, सत्र बंद होना, अलर्ट और संवेदनशील खाता बदलाव यहां दिखाई देंगे।",
    risk: "जोखिम",
    blockedActions: {
      jobs: "सत्यापित नौकरियां या उच्च-विश्वास लिस्टिंग बनाएं",
      marketplace: "पूर्ण मार्केटप्लेस विक्रेता विशेषाधिकार प्राप्त करें",
      property: "अतिरिक्त पहचान समीक्षा के बिना संपत्ति-मालिक वर्कफ़्लो प्रकाशित करें",
      payouts: "बिना समीक्षा के भुगतान और वित्त-संवेदनशील क्रियाओं का उपयोग करें",
      staff: "मजबूत पहचान प्रमाण के बिना कर्मचारी-संवेदनशील या वित्त-संवेदनशील एलिवेशन पथों का उपयोग करें",
      financial: "बिना समीक्षा के संवेदनशील वित्तीय वर्कफ़्लो का उपयोग करें",
      overlap: "संपर्क समीक्षा स्पष्ट होने तक उच्च-विश्वास विक्रेता, संपत्ति-प्रकाशन या भुगतान वर्कफ़्लो का उपयोग करें",
    },
    reasons: {
      verificationApproved: "पहचान सत्यापन स्वीकृत है।",
      verificationPending: "पहचान सत्यापन सबमिट किया गया है और समीक्षाधीन है।",
      verificationRejected: "उच्च-विश्वास क्रियाओं को अनलॉक करने से पहले पहचान सत्यापन को अधिक जानकारी की आवश्यकता है।",
      verificationMissing: "पहचान सत्यापन अभी तक पूरा नहीं हुआ है।",
      emailVerified: "ईमेल स्वामित्व सत्यापित है।",
      identityVerified: "दस्तावेज़-समर्थित पहचान सत्यापन पूरा हो गया है।",
      documentsUnderReview: "पहचान दस्तावेज़ वर्तमान में समीक्षाधीन हैं।",
      verificationNeedsAttention: "सबसे मजबूत विश्वास लेन अनलॉक होने से पहले पहचान सत्यापन पर ध्यान देना होगा।",
      phonePresent: "एक संपर्क फोन फाइल पर है।",
      profileStrong: "प्रोफाइल पूर्णता सत्यापित वर्कफ़्लो के लिए पर्याप्त मजबूत है।",
      accountHistory: "खाता इतिहास {days} दिनों तक फैला हुआ है।",
      transactionHistory: "सत्यापित लेनदेन इतिहास मौजूद है।",
      noRiskSignals: "कोई हाल की उच्च-जोखिम सुरक्षा घटनाएं नहीं मिलीं।",
    },
    requirements: {
      verified: {
        verification: "पहचान सत्यापन पूरा करें ताकि विश्वास-आधारित लेन आशावादी प्रोफाइल संकेतों पर निर्भर करना बंद कर दें।",
        email: "अपना ईमेल पता सत्यापित करें।",
        identity: "विक्रेता, संपत्ति, भुगतान और वित्त-संवेदनशील वर्कफ़्लो के लिए पहचान सत्यापन पूरा करें।",
        phone: "एक उपयोग योग्य फोन नंबर जोड़ें।",
        profile: "अपनी प्रोफाइल का अधिक हिस्सा पूरा करें और प्रमाण दस्तावेज़ जोड़ें।",
        overlap: "एक साझा संपर्क विवरण को उच्च-विश्वास क्रियाओं के अनलॉक होने से पहले मैनुअल विश्वास समीक्षा की आवश्यकता है।",
      },
      trusted: {
        verification: "विश्वसनीय विक्रेता, नियोक्ता, संपत्ति और भुगतान लेन अनलॉक होने से पहले पहचान सत्यापन अनुमोदन की आवश्यकता है।",
        age: "विश्वसनीय स्थिति अनलॉक होने से पहले अधिक खाता आयु बनाएं।",
        transactions: "कम से कम एक सत्यापित लेनदेन या फंडिंग चक्र पूरा करें।",
        suspicious: "खाते को संदिग्ध एक्सेस चेतावनियों से मुक्त रखें।",
        overlap: "विश्वसनीय विक्रेता, भुगतान या संपत्ति लेन अनलॉक होने से पहले संपर्क ओवरलैप समीक्षा हल करें।",
      },
      premium: {
        verification: "प्रीमियम विश्वास उन खातों के लिए आरक्षित है जो पहले से ही पहचान सत्यापन पास कर चुके हैं।",
        age: "लंबे समय तक साफ खाता इतिहास बनाए रखें।",
        transactions: "एक मजबूत सत्यापित लेनदेन रिकॉर्ड बनाएं।",
        activity: "स्वच्छ परिणामों के साथ अधिक HenryCo डिवीजनों का उपयोग करें।",
        overlap: "प्रीमियम विश्वास दिए जाने से पहले डुप्लिकेट-संपर्क समीक्षा स्पष्ट रखें।",
      },
    },
  },
  changePassword: {
    passwordsDoNotMatch: "पासवर्ड मेल नहीं खाते",
    passwordTooShort: "पासवर्ड कम से कम 8 अक्षरों का होना चाहिए",
    success: "आपका पासवर्ड अपडेट किया गया है।",
    unavailable: "हम अभी आपका पासवर्ड अपडेट नहीं कर सके। कृपया पुनः प्रयास करें।",
    newPassword: "नया पासवर्ड",
    confirmNewPassword: "नया पासवर्ड पुष्टि करें",
    minPlaceholder: "न्यूनतम 8 अक्षर",
    repeatPlaceholder: "नया पासवर्ड दोहराएं",
    updating: "पासवर्ड अपडेट हो रहा है...",
    updatePassword: "पासवर्ड अपडेट करें",
  },
  globalSignOut: {
    title: "सभी HenryCo सत्र समाप्त करें",
    description: "यह वर्तमान खाते को सभी HenryCo डिवीजनों और उपकरणों पर साइन आउट करता है, फिर आपको खाता लॉगिन सतह पर वापस करता है।",
    note: "हाल की डिवाइस और सत्र गतिविधि नीचे दिखती रहती है, हालांकि लाइव प्रति-डिवाइस रद्दीकरण अभी तक एक अलग नियंत्रण के रूप में उजागर नहीं किया गया है।",
    unavailable: "हम अभी सभी HenryCo सत्र समाप्त नहीं कर सके। कुछ देर बाद पुनः प्रयास करें।",
    ending: "सभी सत्र समाप्त हो रहे हैं...",
    endAllSessions: "सभी HenryCo सत्रों से साइन आउट करें",
  },
  errorBoundary: {
    kicker: "खाता रनटाइम",
    title: "इस खाता सतह पर क्लाइंट या रेंडरिंग दोष आया",
    description: "विफलता को जांच के लिए कैप्चर किया गया है। इस सतह को पुनः लोड करें और अंतिम स्थिर स्थिति से जारी रखें।",
    reload: "इस दृश्य को पुनः लोड करें",
    contactSupport: "सहायता से संपर्क करें",
  },
  activity: {
    title: "गतिविधि",
    description: "HenryCo के सभी डिवीजनों में आपने जो कुछ भी किया है।",
    emptyTitle: "अभी तक कोई गतिविधि नहीं",
    emptyDescription:
      "जैसे ही आप HenryCo सेवाओं का उपयोग करेंगे, आपकी क्रॉस-डिवीजन गतिविधि यहाँ दिखाई देगी।",
    statusLabels: {
      pending: "लंबित",
      open: "खुला",
      updated: "अद्यतन",
      completed: "पूर्ण",
      resolved: "हल किया गया",
      paid: "भुगतान किया गया",
      failed: "विफल",
      active: "सक्रिय",
      refunded: "वापस किया गया",
    },
    filters: {
      heading: "फ़िल्टर करें और डाउनलोड करें",
      reset: "रीसेट करें",
      fromLabel: "से",
      toLabel: "तक",
      amountFromLabel: "राशि से (₦)",
      amountToLabel: "राशि तक (₦)",
      divisionEyebrow: "डिवीजन",
      typeEyebrow: "प्रकार",
      statusEyebrow: "स्थिति",
      pdfNote:
        "PDF आपके द्वारा ऊपर सेट किए गए हर फ़िल्टर को दस्तावेज़ शीर्षलेख के हिस्से के रूप में रखता है — जो आप देखते हैं वही डाउनलोड करते हैं।",
      downloadLabel: "विवरण डाउनलोड करें",
      downloadFilename: "HenryCo-लेन-देन-इतिहास.pdf",
      shareTitle: "HenryCo लेन-देन इतिहास",
      typeLabels: {
        payment: "भुगतान",
        wallet_credit: "वॉलेट क्रेडिट",
        wallet_debit: "वॉलेट डेबिट",
        refund: "धन-वापसी",
        withdrawal: "निकासी",
        fee: "शुल्क",
      },
    },
  },
  calendar: {
    metaTitle: "कैलेंडर · HenryCo",
    metaDescription:
      "क्रॉस-पोर्टल एजेंडा — Care बुकिंग, संपत्ति देखना, Jobs साक्षात्कार, Studio मील के पत्थर, Learn कक्षाएं, Logistics विंडो।",
    heroAriaLabel: "कैलेंडर अवलोकन",
    heroEyebrow: "HenryCo · क्रॉस-पोर्टल कैलेंडर",
    tileVolumeAriaLabel: "कैलेंडर मात्रा",
    tileEventsLabel: "घटनाएं",
    tileEventsFoot: "अगले 28 दिन",
    tilePortalsLabel: "पोर्टल",
    tilePortalsFootEmpty: "Care, संपत्ति, jobs, studio, learn, logistics",
    tilePortalsFootSingular: "एक डिवीजन निर्धारित",
    tilePortalsFootPlural: "{count} डिवीजन निर्धारित",
    tileNextLabel: "अगला",
    tileNextEmpty: "विंडो में कुछ भी निर्धारित नहीं",
    sideAriaLabel: "पोर्टल द्वारा",
    sideLabel: "पोर्टल द्वारा",
    sideTitleEmpty: "अभी तक कोई शेड्यूल नहीं",
    sideTitleSingular: "एक पोर्टल सक्रिय",
    sideTitlePlural: "{count} पोर्टल मिश्रण में",
    sideBody:
      "बुकिंग, देखना, साक्षात्कार, मील के पत्थर, कक्षाएं और प्रेषण विंडो सभी यहां कालक्रम के अनुसार सामने आते हैं।",
    agendaTitle: "एजेंडा",
    agendaAriaLabel: "दिन के अनुसार निर्धारित घटनाएं",
    agendaMetaEmpty: "28-दिन की विंडो में कुछ भी निर्धारित नहीं",
    agendaMetaSingular: "{count} घटना · अगले 28 दिन",
    agendaMetaPlural: "{count} घटनाएं · अगले 28 दिन",
    emptyEyebrow: "कैलेंडर शांत",
    emptyTitle: "अगले 28 दिनों में कुछ भी निर्धारित नहीं।",
    emptyBody:
      "आप जो कुछ भी बुक करते हैं — Care पिकअप, संपत्ति देखना, भर्ती साक्षात्कार, Learn कक्षा, Studio मील का पत्थर, Logistics विंडो — स्वचालित रूप से इस एजेंडा में आ जाएगा। पोर्टल शेड्यूलिंग शुरू करने पर फ़िल्टर चिप्स दिखाई देंगे।",
    dayMetaSingular: "{count} घटना",
    dayMetaPlural: "{count} घटनाएं",
    eventTimeAriaLabel: "घटना का समय",
    eventCta: "खोलें",
    headline: {
      empty: "अगले 28 दिनों में कुछ भी निर्धारित नहीं।",
      calmOne: "एजेंडा में एक चीज़।",
      calmMany: "अगले 28 दिनों में {count} घटनाएं।",
      busy: "{portals} पोर्टलों में {count} घटनाएं निर्धारित।",
      packed: "{count} घटनाएं कतार में — फोकस समय को बुद्धिमानी से तय करें।",
    },
    blurb: {
      empty:
        "Care बुकिंग, संपत्ति देखना, Jobs साक्षात्कार, Studio मील के पत्थर, Learn कक्षाएं और Logistics विंडो सभी यहां सामने आते हैं।",
      calm: "इसके पोर्टल पर जाने के लिए एक कार्ड टैप करें। नया शेड्यूलिंग आने पर एजेंडा स्वचालित रूप से रीफ़्रेश हो जाएगा।",
      busyOrPacked:
        "एजेंडा के शीर्ष पर फ़िल्टर चिप्स एकल पोर्टल तक सीमित करते हैं — जब एक डिवीजन ज़ोर से हो तो उपयोगी।",
    },
    kindLabels: {
      care_booking: "Care बुकिंग",
      property_viewing: "संपत्ति देखना",
      jobs_interview: "साक्षात्कार",
      learn_class: "लाइव कक्षा",
      studio_milestone: "Studio मील का पत्थर",
      logistics_pickup: "पिकअप विंडो",
      logistics_delivery: "डिलीवरी विंडो",
      room_session: "कक्ष सत्र",
    },
    dayLabels: {
      today: "आज",
      tomorrow: "कल",
      yesterday: "बीता कल",
    },
    portalLabels: {
      care: "Care",
      property: "संपत्ति",
      jobs: "Jobs",
      studio: "Studio",
      learn: "Learn",
      logistics: "Logistics",
    },
  },
  notifications: {
    metadata: {
      title: "सूचनाएँ",
      description: "HenryCo का हर अपडेट — वॉलेट, सहायता, नौकरियाँ, मार्केटप्लेस, केयर और अधिक — एक लाइव इनबॉक्स में।",
    },
    hero: {
      eyebrow: "HenryCo · लाइव सूचनाएँ",
      ariaOverview: "सूचनाओं का अवलोकन",
      ariaVolume: "सूचनाओं की मात्रा",
      ariaByDivision: "विभाग के अनुसार",
      headlineZero: "HenryCo में इनबॉक्स ज़ीरो।",
      headlineOne: "एक बात आपका ध्यान चाहती है।",
      headlineFew: "{count} सूचनाएँ निपटाने के लिए।",
      headlineMany: "आपके विभागों में {count} अपडेट।",
      blurbZero: "HenryCo जो कुछ भी भेजता है वह यहाँ रीयल-टाइम में आता है — वॉलेट, सहायता, नौकरियाँ, मार्केटप्लेस, केयर और अधिक।",
      blurbStale: "पुरानी प्रविष्टियाँ जमा हो गई हैं। आर्काइव करने के लिए स्वाइप करें, खोलने के लिए टैप करें, या सीधे किसी थ्रेड पर जाएँ।",
      blurbToday: "आज {count} आईं। एकल विभाग पर ध्यान केंद्रित करने के लिए फ़िल्टर का उपयोग करें, या केवल अनरीड को देखें।",
      tileUnreadLabel: "अनरीड",
      tileUnreadFoot: "आपकी नज़र की प्रतीक्षा में",
      tileTodayLabel: "आज",
      tileTodayFoot: "पिछले 24 घंटे में आईं",
      tileWeekLabel: "इस हफ्ते",
      tileWeekFoot: "अंतिम गतिविधि {when}",
      byDivision: "विभाग के अनुसार",
      emptyDivisions: "अभी तक कुछ नहीं आया।",
      lastActivityFallback: "कोई हाल की गतिविधि नहीं",
      justNow: "अभी",
      minutesAgo: "{count} मिनट पहले",
      hoursAgo: "{count} घंटे पहले",
      daysAgo: "{count} दिन पहले",
    },
    inbox: {
      heading: "इनबॉक्स",
      meta: "खोलने के लिए टैप करें, आर्काइव करने के लिए स्वाइप करें — फ़िल्टर हर विभाग में काम करते हैं।",
    },
    filters: {
      all: "सभी",
      unread: "अनरीड",
      allSources: "सभी स्रोत",
      activeFilter: "सक्रिय फ़िल्टर",
    },
    feed: {
      unreadSectionKicker: "अनरीड",
      unreadSectionTitle: "आपके ध्यान की ज़रूरत है",
      recentSectionKicker: "हाल का",
      recentSectionTitle: "साफ़ की गई या समीक्षा की गई गतिविधि",
      unreadBadge: "अनरीड",
      openMessageBoard: "मैसेज बोर्ड खोलें",
    },
    swipe: {
      archive: "आर्काइव करें",
      delete: "हटाएँ",
      markRead: "पढ़ा हुआ के रूप में चिह्नित करें",
      markUnread: "अनरीड के रूप में चिह्नित करें",
    },
    emptyState: {
      inboxTitle: "सब निपटा लिया।",
      inboxBody: "HenryCo की गतिविधि यहाँ रीयल-टाइम में दिखेगी।",
      filterTitle: "इस दृश्य में कोई गतिविधि नहीं।",
      filterBody: "कोई अलग फ़िल्टर आज़माएँ।",
    },
    markAllRead: {
      label: "सभी को पढ़ा हुआ चिह्नित करें",
      pending: "सभी को पढ़ा हुआ चिह्नित कर रहे हैं...",
      spinner: "सभी को पढ़ा हुआ चिह्नित कर रहे हैं",
    },
    footer: {
      recentlyDeleted: "हाल ही में हटाए गए",
    },
  },
  invoices: {
    metadata: {
      title: "चालान और रसीदें",
      description: "आपका भुगतान इतिहास और डाउनलोड करने योग्य रसीदें।",
    },
    hero: {
      eyebrow: "चालान · रसीदें",
      ariaOverview: "चालान अवलोकन",
      ariaTotals: "वित्तीय कुल",
      ariaByDivision: "विभाग के अनुसार",
      headlineEmpty: "आपकी रसीदें यहाँ पहुँचेंगी।",
      headlineWithReceipts: "हर रसीद, एक ही जगह।",
      blurb:
        "HenryCo में हर भुगतान यहाँ ब्रांडेड, डाउनलोड करने योग्य PDF के रूप में पहुँचता है — Care बुकिंग, Marketplace ऑर्डर, Studio चालान, Logistics शिपमेंट, Learn प्रमाणपत्र।",
      totalPaidLabel: "कुल भुगतान · आजीवन",
      thisMonthLabel: "भुगतान · इस माह",
      thisMonthFoot: "इस कैलेंडर माह की रसीदें",
      outstandingLabel: "बकाया",
      paidCountUnit: "रसीदें",
      pendingCountUnit: "लंबित",
      overdueCountUnit: "अतिदेय",
      byDivision: "विभाग के अनुसार",
      byDivisionEmpty: "अभी तक कोई चालान नहीं।",
    },
    section: {
      title: "सभी चालान",
      receiptsOnFileSingular: "रसीद दर्ज",
      receiptsOnFilePlural: "रसीदें दर्ज",
    },
    empty: {
      title: "अभी तक कोई चालान नहीं",
      description:
        "HenryCo सेवाओं में भुगतान करने के बाद आपके चालान और रसीदें यहाँ दिखेंगी।",
    },
    statuses: {
      paid: "भुगतान हुआ",
      pending: "लंबित",
      overdue: "अतिदेय",
      draft: "मसौदा",
      cancelled: "रद्द",
      refunded: "रिफंड हुआ",
      fallback: "स्थिति लंबित",
    },
    list: {
      ariaLabel: "चालान",
      fallbackTitle: "चालान {number}",
      rowAriaLabel: "₦{amount} का चालान {number}",
    },
    divisions: {
      account: "खाता",
      wallet: "वॉलेट",
      marketplace: "Marketplace",
      studio: "Studio",
      jobs: "Jobs",
      learn: "Learn",
      property: "संपत्ति",
      logistics: "Logistics",
      care: "Care",
      fallback: "खाता",
    },
    footerNote: "रसीदें ब्रांडेड PDF के रूप में डाउनलोड होती हैं।",
  },
};

const LOCALE_OVERRIDES: Partial<Record<AppLocale, DeepPartial<AccountCopy>>> = {
  fr: FR,
  es: ACCOUNT_COPY_ES,
  pt: ACCOUNT_COPY_PT,
  ar: ACCOUNT_COPY_AR,
  ig: IG,
  yo: YO,
  ha: HA,
  de: DE,
  it: IT,
  zh: ZH,
  hi: HI,
};

export function getAccountCopy(locale: AppLocale): AccountCopy {
  const overrides = LOCALE_OVERRIDES[locale];
  if (!overrides) return EN;
  return deepMergeMessages(
    EN as unknown as Record<string, unknown>,
    overrides as unknown as Record<string, unknown>,
  ) as unknown as AccountCopy;
}

export function formatAccountTemplate(
  template: string,
  values: Record<string, string | number>,
) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template,
  );
}
