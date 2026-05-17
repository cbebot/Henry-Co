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
    smartHomeEmptyFallback: string;
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
    priorityFallback: {
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
    eyebrow: string;
    guidanceTitle: string;
    overviewAria: string;
    volumeAria: string;
    pendingAria: string;
    sideAria: string;
    bySource: string;
    openTotalLabel: string;
    nothingBlocking: string;
    resolveBlockers: string;
    routine: string;
    divisionRepresentedSingular: string;
    divisionRepresentedPlural: string;
    headlineEmpty: string;
    headlineBlockerSingular: string;
    headlineBlockerPlural: string;
    headlineUrgentSingular: string;
    headlineUrgentPlural: string;
    headlineActiveSingular: string;
    headlineActivePlural: string;
    headlineCalmSingular: string;
    headlineCalmPlural: string;
    blurbEmpty: string;
    blurbRisk: string;
    blurbActive: string;
    metaEmpty: string;
    metaCount: string;
  };
  security: {
    title: string;
    description: string;
    heroAriaLabel: string;
    hero: {
      trustScoreLabel: string;
      nextTierPrefix: string;
      nextTierAriaTemplate: string;
      accountActiveSingularTemplate: string;
      accountActivePluralTemplate: string;
      flaggedEventsSingularTemplate: string;
      flaggedEventsPluralTemplate: string;
      statusEyebrow: {
        secure: string;
        watch: string;
        risk: string;
      };
      statusHeadline: {
        secure: string;
        watch: string;
        risk: string;
      };
      statusBlurb: {
        secure: string;
        watch: string;
        risk: string;
      };
    };
    signalsTitle: string;
    signalsMeta: string;
    signalsAriaLabel: string;
    guideTitle: string;
    guideMetaTemplate: string;
    allLanesOpen: string;
    accountActionsTitle: string;
    accountActionsMeta: string;
    changePasswordTitle: string;
    signOutEverywhereTitle: string;
    suspiciousEventFoot: string;
    noSuspiciousEventFoot: string;
    activityAriaLabel: string;
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
  messages: {
    metadata: {
      title: string;
      description: string;
    };
    hero: {
      eyebrow: string;
      ariaLabel: string;
      ariaTiles: string;
      ariaSide: string;
      sideLabel: string;
      sideBody: string;
    };
    headlines: {
      zero: string;
      calmOne: string;
      calmMany: string;
      busy: string;
      overloaded: string;
    };
    blurbs: {
      zero: string;
      calm: string;
      busy: string;
      overloaded: string;
    };
    tiles: {
      openLabel: string;
      openFootEmpty: string;
      openFootActive: string;
      unreadLabel: string;
      unreadFootEmpty: string;
      unreadFootActive: string;
      portalsLabel: string;
      portalsFootEmpty: string;
      portalsFootSingular: string;
      portalsFootPlural: string;
    };
    sideTitle: {
      empty: string;
      singular: string;
      plural: string;
    };
    section: {
      title: string;
      ariaLabel: string;
      metaEmpty: string;
      metaSingular: string;
      metaPlural: string;
    };
    chips: {
      ariaLabel: string;
      allThreads: string;
    };
    empty: {
      eyebrow: string;
      titleAll: string;
      titleFilter: string;
      bodyAll: string;
      bodyFilter: string;
    };
    list: {
      unreadDotLabel: string;
      fallbackTime: string;
    };
    divisionLabels: {
      support: string;
      marketplace: string;
      jobs: string;
      studio: string;
      care: string;
      property: string;
      logistics: string;
      learn: string;
    };
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
  support: {
    metadata: {
      title: string;
      description: string;
    };
    hero: {
      title: string;
      description: string;
      newRequestCta: string;
    };
    summary: {
      openRequestsTemplate: string;
      escalatedTemplate: string;
      escalationNote: string;
    };
    quickHelp: {
      helpCenterLabel: string;
      helpCenterDesc: string;
      contactLabel: string;
      contactDesc: string;
      liveChatLabel: string;
      liveChatDesc: string;
    };
    threads: {
      sectionKicker: string;
      emptyTitle: string;
      emptyDescription: string;
      createCta: string;
    };
    statusLabels: {
      open: string;
      awaitingReply: string;
      inProgress: string;
      resolved: string;
      closed: string;
    };
    priorityLabels: {
      low: string;
      normal: string;
      high: string;
      urgent: string;
    };
  };
  payments: {
    hero: {
      title: string;
      description: string;
      addMethodCta: string;
    };
    empty: {
      title: string;
      description: string;
      cta: string;
    };
    card: {
      savedMethodFallback: string;
      cardLastFourTemplate: string;
    };
    wallet: {
      eyebrow: string;
      body: string;
      manageCta: string;
    };
  };
  savedItems: {
    metadata: {
      title: string;
      description: string;
    };
    hero: {
      title: string;
      description: string;
    };
    summary: {
      activeTemplate: string;
      expiredTemplate: string;
      expiryNote: string;
      savedTemplate: string;
    };
    toolbar: {
      showLabel: string;
      allDivisions: string;
      sortLabel: string;
      sortNewest: string;
      sortOldest: string;
      sortExpiring: string;
    };
    selection: {
      selectedTemplate: string;
      clear: string;
      moving: string;
      moveSelectedToCart: string;
      selectAllOnPage: string;
    };
    empty: {
      title: string;
      description: string;
      browseCta: string;
    };
    card: {
      deselectItem: string;
      selectItem: string;
      savedItemFallback: string;
      expiresToday: string;
      expiresInTemplate: string;
      expiredNotice: string;
      moveToCart: string;
      moving: string;
      removeFromSaved: string;
      openOriginal: string;
    };
    expired: {
      sectionKicker: string;
      sectionNote: string;
    };
  };
  documents: {
    metadata: {
      title: string;
      description: string;
    };
    hero: {
      eyebrow: string;
      title: string;
      body: string;
    };
    toolbar: {
      uploadCta: string;
      filterLabel: string;
      allCategories: string;
      sortLabel: string;
      sortNewest: string;
      sortOldest: string;
    };
    types: {
      document: string;
      receipt: string;
      certificate: string;
      id_document: string;
      contract: string;
      other: string;
    };
    categories: {
      all: string;
      document: string;
      receipt: string;
      certificate: string;
      id_document: string;
      contract: string;
      other: string;
    };
    card: {
      uploadedOnTemplate: string;
      sizeTemplate: string;
      downloadLabel: string;
      noFileAttached: string;
      openOriginal: string;
    };
    empty: {
      title: string;
      description: string;
    };
    summary: {
      countTemplate: string;
      filteredTemplate: string;
    };
    retention: {
      eyebrow: string;
      title: string;
      body: string;
    };
  };
  subscriptions: {
    metadata: {
      title: string;
      description: string;
    };
    hero: {
      eyebrow: string;
      title: string;
      description: string;
    };
    empty: {
      title: string;
      description: string;
    };
    card: {
      planFallback: string;
      tierSeparator: string;
      amountLabel: string;
      cycleLabel: string;
      renewsLabel: string;
      renewsFallback: string;
    };
    statusLabels: {
      active: string;
      paused: string;
      cancelled: string;
      expired: string;
      past_due: string;
      trialing: string;
      grace: string;
      pending: string;
      unknown: string;
    };
    cycleLabels: {
      monthly: string;
      yearly: string;
      annual: string;
      quarterly: string;
      weekly: string;
      biweekly: string;
      daily: string;
      one_time: string;
      notSet: string;
    };
    cta: {
      upgrade: string;
      downgrade: string;
      cancel: string;
      manage: string;
      resume: string;
    };
    paymentIssue: {
      title: string;
      description: string;
      updatePaymentCta: string;
    };
    summary: {
      activeTemplate: string;
      pausedTemplate: string;
      totalTemplate: string;
    };
  };
  referrals: {
    metadata: {
      title: string;
      description: string;
    };
    hero: {
      title: string;
      description: string;
    };
    code: {
      eyebrow: string;
      shareLinkLabel: string;
      copyCodeTitle: string;
      copyLinkTitle: string;
      copyLinkLabel: string;
      copiedToast: string;
      rewardNote: string;
    };
    stats: {
      totalReferred: string;
      signedUp: string;
      qualified: string;
      flagged: string;
      pendingRewards: string;
      releasedRewards: string;
    };
    howItWorks: {
      eyebrow: string;
      step1Title: string;
      step1Body: string;
      step2Title: string;
      step2Body: string;
      step3Title: string;
      step3Body: string;
    };
    policy: {
      eyebrow: string;
      qualifying: string;
      enforcement: string;
      separation: string;
    };
    referralsList: {
      eyebrow: string;
      emptyTitle: string;
      emptyDescription: string;
      refereeFallback: string;
      signedUpTemplate: string;
      qualifiedTemplate: string;
    };
    statusLabels: {
      pending: string;
      converted: string;
      qualified: string;
      flagged: string;
      expired: string;
    };
    flagReasons: {
      selfReferral: string;
      duplicateEmail: string;
      deviceReuse: string;
    };
    rewards: {
      eyebrow: string;
      emptyTitle: string;
      emptyDescription: string;
      referralRewardFallback: string;
      paidTemplate: string;
      statusLabels: {
        held: string;
        pending: string;
        released: string;
        paid: string;
        cancelled: string;
      };
    };
  };
  divisionCare: {
    metadata: {
      title: string;
      description: string;
    };
    hero: {
      eyebrow: string;
      sideKicker: string;
      sideTitle: string;
      sideBody: string;
      breakdownLabel: string;
      tilesAriaLabel: string;
      tileLabels: {
        total: string;
        inFlight: string;
        payment: string;
        completed: string;
      };
      tileFoot: {
        totalEmpty: string;
        totalWithTemplate: string;
        inFlightEmpty: string;
        inFlightWith: string;
        paymentEmpty: string;
        paymentWith: string;
        completedEmpty: string;
        completedWith: string;
      };
      breakdownLabels: {
        inFlight: string;
        scheduled: string;
        payment: string;
        completed: string;
      };
      state: {
        empty: {
          headline: string;
          blurb: string;
          ctaPrimary: string;
          ctaSecondary: string;
        };
        attention: {
          headlineTemplateSingular: string;
          headlineTemplatePlural: string;
          blurb: string;
          ctaPrimary: string;
          ctaSecondary: string;
        };
        active: {
          headlineTemplateSingular: string;
          headlineTemplatePlural: string;
          blurb: string;
          ctaPrimary: string;
          ctaSecondary: string;
        };
        calm: {
          headlineTemplateSingular: string;
          headlineTemplatePlural: string;
          blurb: string;
          ctaPrimary: string;
          ctaSecondary: string;
        };
      };
    };
    sections: {
      glance: string;
      glanceMeta: string;
      bookings: string;
      bookingsEmpty: string;
      bookingsMetaTemplateSingular: string;
      bookingsMetaTemplatePlural: string;
      activity: string;
      activityEmpty: string;
      activityMetaTemplateSingular: string;
      activityMetaTemplatePlural: string;
    };
    empty: {
      title: string;
      body: string;
    };
    glance: {
      nextActionLabel: string;
      serviceLabel: string;
      pickupLabel: string;
      balanceLabel: string;
      trackingLabel: string;
      serviceFallback: string;
    };
    activityAriaLabel: string;
    status: {
      live: string;
      scheduled: string;
      completed: string;
      issue: string;
      payment: string;
    };
    statusValueLabels: {
      booked: string;
      awaiting_payment: string;
      receipt_submitted: string;
      under_review: string;
      delivered: string;
      customer_confirmed: string;
      inspection_completed: string;
      service_completed: string;
      cancelled: string;
      issue: string;
      exception: string;
      rejected: string;
    };
    formatLabels: {
      toBeScheduled: string;
      shortMonths: [string, string, string, string, string, string, string, string, string, string, string, string];
    };
    dashboard: {
      filters: {
        all: string;
        unpaid: string;
        receipt: string;
        active: string;
        completed: string;
        issue: string;
      };
      filtered: string;
      bookingSingular: string;
      bookingPlural: string;
      metrics: {
        visible: string;
        visibleHint: string;
        balance: string;
        balanceHintSomeTemplate: string;
        balanceHintNone: string;
        receiptQueue: string;
        receiptQueueHintSome: string;
        receiptQueueHintNone: string;
        completed: string;
        completedHintSome: string;
        completedHintNone: string;
      };
      linkedBookings: string;
      linkedBookingsDescription: string;
      onThisPage: string;
      selectedBooking: string;
      paymentSnapshot: string;
      receiptVisibility: string;
      nextBestAction: string;
      serviceSummary: string;
      serviceFallback: string;
      addressPending: string;
      updated: string;
      balanceDue: string;
      nextMove: string;
      paginationLabel: string;
      pageLabel: string;
      of: string;
      perPage: string;
      previous: string;
      next: string;
      customerFallback: string;
      scheduledDate: string;
      notScheduled: string;
      timeWindow: string;
      windowPending: string;
      pickupAddress: string;
      returnAddress: string;
      returnAddressFallback: string;
      trackingCode: string;
      quotedTotal: string;
      amountRecorded: string;
      receiptState: string;
      receiptsSubmitted: string;
      lastSubmission: string;
      noReceiptYet: string;
      openLiveBooking: string;
      leaveReview: string;
    };
  };
  divisionProperty: {
    metadata: {
      title: string;
      description: string;
    };
    hero: {
      eyebrow: string;
      ariaLabel: string;
      browseListingsCta: string;
      savedShortlistCta: string;
      tilesAriaLabel: string;
      tileLabels: {
        saved: string;
        inquiries: string;
        viewings: string;
        listings: string;
      };
      tileFoot: {
        savedManagedTemplate: string;
        savedEmpty: string;
        savedWith: string;
        inquiriesEmpty: string;
        inquiriesWith: string;
        viewingsEmpty: string;
        viewingsWith: string;
        listingsEmpty: string;
        listingsWith: string;
      };
      sideAriaLabel: string;
      sideKicker: string;
      sideTitle: string;
      sideBody: string;
      sideBodyMuted: string;
      breakdownAriaLabel: string;
      breakdownLabel: string;
      breakdownLabels: {
        saved: string;
        inquiries: string;
        viewings: string;
        listings: string;
      };
      state: {
        empty: {
          headline: string;
          blurb: string;
        };
        discover: {
          headlineTemplateSingular: string;
          headlineTemplatePlural: string;
          blurb: string;
        };
        active: {
          viewingHeadlineTemplateSingular: string;
          viewingHeadlineTemplatePlural: string;
          inquiryHeadlineTemplateSingular: string;
          inquiryHeadlineTemplatePlural: string;
          blurb: string;
        };
      };
    };
    sections: {
      saved: string;
      savedMetaEmpty: string;
      savedMetaTemplate: string;
      activity: string;
      activityMetaEmpty: string;
      activityMetaTemplateSingular: string;
      activityMetaTemplatePlural: string;
    };
    empty: {
      savedTitle: string;
      savedBody: string;
      activityTitle: string;
      activityBody: string;
    };
    activity: {
      ariaLabel: string;
      titles: {
        inquiry: string;
        viewing: string;
        listing_submitted: string;
        listing_updated: string;
        listing_reviewed: string;
      };
    };
    gallery: {
      ariaLabel: string;
      managedBadge: string;
      featuredBadge: string;
      locationPending: string;
      contactAgent: string;
      savedAtTemplate: string;
      bedSingular: string;
      bedPlural: string;
      bathSingular: string;
      bathPlural: string;
      sizeSqmTemplate: string;
    };
  };
  divisionMarketplace: {
    metadata: {
      title: string;
      description: string;
    };
    hero: {
      eyebrow: string;
      ariaLabel: string;
      sideAriaLabel: string;
      sideKicker: string;
      sideTitle: string;
      sideBody: string;
      breakdownLabel: string;
      breakdownAriaLabel: string;
      tilesAriaLabel: string;
      tileLabels: {
        orders: string;
        disputes: string;
        store: string;
        payouts: string;
      };
      tileFoot: {
        ordersEmpty: string;
        ordersInMotionTemplate: string;
        ordersDeliveredTemplate: string;
        disputesClear: string;
        disputesActiveTemplate: string;
        storeActiveNoName: string;
        storeActiveWithNameTemplate: string;
        storeApplicationTemplate: string;
        storeIdle: string;
        payoutsEmptyNoneSettled: string;
        payoutsSettledTemplate: string;
        payoutsPendingTemplate: string;
      };
      breakdownLabels: {
        inMotion: string;
        openDisputes: string;
        delivered: string;
        pendingPayouts: string;
      };
      state: {
        empty: {
          headline: string;
          blurb: string;
          ctaPrimary: string;
          ctaSecondary: string;
        };
        attention: {
          headlineTemplateSingular: string;
          headlineTemplatePlural: string;
          blurb: string;
          ctaPrimary: string;
          ctaSecondary: string;
        };
        activeOrders: {
          headlineTemplateSingular: string;
          headlineTemplatePlural: string;
          blurb: string;
          ctaPrimary: string;
          ctaSecondary: string;
        };
        activePayouts: {
          headlineTemplateSingular: string;
          headlineTemplatePlural: string;
          blurb: string;
          ctaPrimary: string;
          ctaSecondary: string;
        };
        calmBuyer: {
          headlineTemplateSingular: string;
          headlineTemplatePlural: string;
          blurb: string;
          ctaPrimary: string;
          ctaSecondary: string;
        };
        calmSeller: {
          headlineTemplateSingular: string;
          headlineTemplatePlural: string;
          blurb: string;
          ctaPrimary: string;
          ctaSecondary: string;
        };
      };
    };
    sections: {
      matters: {
        title: string;
        meta: string;
        ariaLabel: string;
        emptyTitle: string;
        emptyBody: string;
      };
      orders: {
        title: string;
        empty: string;
        metaTemplateSingular: string;
        metaTemplatePlural: string;
        emptyTitle: string;
        emptyBody: string;
        ariaLabel: string;
      };
      activity: {
        title: string;
        empty: string;
        metaTemplateSingular: string;
        metaTemplatePlural: string;
        emptyTitle: string;
        emptyBody: string;
        ariaLabel: string;
      };
    };
    matters: {
      disputes: {
        kicker: string;
        titleTemplateSingular: string;
        titleTemplatePlural: string;
        bodyLatestTemplate: string;
        bodyFallback: string;
        cta: string;
      };
      application: {
        kicker: string;
        bodyWithStoreTemplate: string;
        bodyDefault: string;
        bodyReviewSuffixTemplate: string;
        cta: string;
        defaultStatus: string;
      };
      payouts: {
        kicker: string;
        titleTemplate: string;
        bodyTemplateSingular: string;
        bodyTemplatePlural: string;
        cta: string;
      };
    };
    orders: {
      rowTitleTemplate: string;
      rowSubTemplate: string;
      rowAriaLabelTemplate: string;
      statusFallbackDraft: string;
    };
    statusValueLabels: {
      delivered: string;
      completed: string;
      customer_confirmed: string;
      fulfilled: string;
      cancelled: string;
      refunded: string;
      disputed: string;
      exception: string;
      placed: string;
      paid: string;
      awaiting_fulfilment: string;
      confirmed: string;
      queued: string;
    };
    applicationStatusLabels: {
      submitted: string;
      under_review: string;
      approved: string;
      rejected: string;
      pending_documents: string;
      changes_requested: string;
    };
    formatLabels: {
      dash: string;
    };
  };
  divisionJobs: {
    metadata: {
      title: string;
      description: string;
    };
    header: {
      title: string;
      description: string;
      candidateModuleCta: string;
      interviewRoomsCta: string;
      browseLiveRolesCta: string;
    };
    hero: {
      eyebrow: string;
      headline: string;
      body: string;
      statsAriaLabel: string;
      statLabels: {
        applications: string;
        saved: string;
        readiness: string;
        updates: string;
      };
      statDetails: {
        applicationsLeadingTemplate: string;
        applicationsEmpty: string;
        savedSome: string;
        savedEmpty: string;
        updatesLatestTemplate: string;
        updatesEmpty: string;
      };
    };
    sections: {
      nextActionsKicker: string;
      nextActionsTitle: string;
      openTimelineCta: string;
      applicationsKicker: string;
      applicationsTitle: string;
      savedKicker: string;
      savedTitle: string;
      openSavedRolesCta: string;
      recommendedKicker: string;
      recommendedTitle: string;
      browseCatalogCta: string;
      recruiterFeedKicker: string;
      recruiterFeedTitle: string;
      candidateInboxCta: string;
      profileKicker: string;
      profileTitle: string;
      sharedInboxKicker: string;
      sharedInboxTitle: string;
      alertsKicker: string;
      alertsTitle: string;
    };
    empty: {
      applicationsTitle: string;
      applicationsBody: string;
      exploreJobsCta: string;
      savedJobsTitle: string;
      savedJobsBody: string;
      recommendedTitle: string;
      recommendedBody: string;
      recruiterFeedTitle: string;
      recruiterFeedBody: string;
      notificationsTitle: string;
      notificationsBody: string;
      alertsTitle: string;
      alertsBody: string;
      browseRolesCta: string;
    };
    application: {
      progressPercentTemplate: string;
      appliedAtTemplate: string;
      candidateReadiness: string;
      recruiterConfidence: string;
      latestMovement: string;
      nextBestMove: string;
      openTimelineCta: string;
      interviewRoomCta: string;
      viewRoleCta: string;
    };
    savedJob: {
      trustTemplate: string;
      savedAtTemplate: string;
    };
    recommended: {
      compFallback: string;
    };
    stageLabels: {
      applied: string;
      reviewing: string;
      shortlisted: string;
      interview: string;
      offer: string;
      hired: string;
      rejected: string;
    };
    nextStep: {
      labels: {
        applied: string;
        shortlisted: string;
        interview: string;
        offer: string;
        rejected: string;
      };
      bodies: {
        applied: string;
        shortlisted: string;
        interview: string;
        offer: string;
        rejected: string;
      };
    };
    readinessLabels: {
      interviewReady: string;
      strongProfile: string;
      needsProof: string;
      needsStructure: string;
    };
    workModeLabels: {
      remote: string;
      hybrid: string;
      onsite: string;
    };
    employmentTypeLabels: {
      fullTime: string;
      partTime: string;
      contract: string;
      internship: string;
      temporary: string;
    };
    profile: {
      readinessLabel: string;
      skillsMappedLabel: string;
      filesLabel: string;
      improveProfileCta: string;
      openCandidateModuleCta: string;
      checklist: {
        identityLabel: string;
        identityDetail: string;
        storyLabel: string;
        storyDetail: string;
        verificationLabel: string;
        verificationDetail: string;
        proofLabel: string;
        proofDetail: string;
        skillsLabel: string;
        skillsDetail: string;
      };
    };
    nextActions: {
      gapTemplate: string;
      interviewLabel: string;
      offerLabel: string;
      attentionTemplate: string;
      convertSavedLabel: string;
      convertSavedTemplate: string;
      restartLabel: string;
      restartDetail: string;
    };
    alertStatus: {
      active: string;
      paused: string;
    };
    recruiterUpdateTitleTemplate: string;
  };
  divisionLogistics: {
    metadata: {
      title: string;
      description: string;
    };
    hero: {
      ariaLabel: string;
      eyebrow: string;
      brand: string;
      title: string;
      body: string;
      bodyDomain: string;
      ctaNewDelivery: string;
    };
    metrics: {
      ariaLabel: string;
      activeNowLabel: string;
      activeFootSingular: string;
      activeFootPlural: string;
      deliveredMonthLabel: string;
      deliveredMonthFootTemplate: string;
      onTimeRateLabel: string;
      onTimeRateFootEmpty: string;
      onTimeRateFootHasValue: string;
      totalSpendLabel: string;
      totalSpendFoot: string;
    };
    map: {
      noShipmentsAriaLabel: string;
      noShipmentsTitle: string;
      noShipmentsBody: string;
      noShipmentsCta: string;
      pendingAriaLabel: string;
      pendingTitle: string;
      pendingBody: string;
      activeAriaLabel: string;
      altTemplateSingular: string;
      altTemplatePlural: string;
      liveBadgeTemplateSingular: string;
      liveBadgeTemplatePlural: string;
    };
    sections: {
      activeTitle: string;
      activeMetaTemplate: string;
      activeRailAriaLabel: string;
      emptyAriaLabel: string;
      emptyTitle: string;
      emptyBody: string;
      actionsTitle: string;
      actionsMeta: string;
      actionsAriaLabel: string;
      recentTitle: string;
      recentMetaTemplate: string;
      recentAriaLabel: string;
      spendTitle: string;
      spendMeta: string;
      spendFigureAriaLabelTemplate: string;
    };
    statusLabels: {
      quoteRequested: string;
      quoteSent: string;
      pendingPayment: string;
      scheduled: string;
      assigned: string;
      pickupConfirmed: string;
      inTransit: string;
      delayed: string;
      attemptedDelivery: string;
      delivered: string;
      completed: string;
      closed: string;
      cancelled: string;
      refunded: string;
    };
    urgencyLabels: {
      standard: string;
      sameDay: string;
      express: string;
      nextDay: string;
    };
    serviceLabels: {
      scheduled: string;
      sameDay: string;
      interCity: string;
      bulk: string;
    };
    shipment: {
      trackingCodeAriaTemplate: string;
      addressPending: string;
      etaPending: string;
      trackCta: string;
      openTrackingAriaTemplate: string;
      etaAriaTemplate: string;
      etaMinutesInTemplate: string;
      etaMinutesOverdueTemplate: string;
      etaHoursInTemplate: string;
      etaHoursOverdueTemplate: string;
      detailSeparator: string;
    };
    timeline: {
      ariaLabel: string;
      deliveredToTemplate: string;
      receiptCta: string;
    };
    quickActions: {
      ariaLabel: string;
      bookLabel: string;
      bookDesc: string;
      trackLabel: string;
      trackDesc: string;
      quoteLabel: string;
      quoteDesc: string;
      addressesLabel: string;
      addressesDesc: string;
      invoicesLabel: string;
      invoicesDesc: string;
      supportLabel: string;
      supportDesc: string;
    };
    spend: {
      figureAriaLabel: string;
      emptyTick: string;
    };
  };
  divisionStudio: {
    metadata: {
      title: string;
      description: string;
    };
    hero: {
      eyebrowLive: string;
      overviewAriaLabel: string;
      activityAriaLabel: string;
      sideAriaLabel: string;
      sideLabel: string;
      sideTitle: string;
      sideBody: string;
      breakdownAriaLabel: string;
      breakdownLabel: string;
      tiles: {
        activeLabel: string;
        activeFootEmpty: string;
        activeFootHasValue: string;
        pendingLabel: string;
        pendingFootEmpty: string;
        pendingFootHasValue: string;
        proofLabel: string;
        proofFootEmpty: string;
        proofFootHasValue: string;
        deliverablesLabel: string;
        deliverablesFootEmpty: string;
        deliverablesFootHasValue: string;
      };
      breakdown: {
        active: string;
        readyReview: string;
        pendingPayment: string;
        proofSubmitted: string;
      };
      state: {
        empty: {
          headline: string;
          blurb: string;
          ctaPrimary: string;
          ctaSecondary: string;
        };
        attention: {
          headlineTemplateSingular: string;
          headlineTemplatePlural: string;
          blurb: string;
          ctaPrimary: string;
          ctaSecondary: string;
        };
        activeReady: {
          headlineTemplateSingular: string;
          headlineTemplatePlural: string;
          blurb: string;
          ctaPrimary: string;
          ctaSecondary: string;
        };
        activeProjects: {
          headlineTemplateSingular: string;
          headlineTemplatePlural: string;
          blurb: string;
          ctaPrimary: string;
          ctaSecondary: string;
        };
        calm: {
          headlineTemplateSingular: string;
          headlineTemplatePlural: string;
          blurb: string;
          ctaPrimary: string;
          ctaSecondary: string;
        };
      };
    };
    sections: {
      projectsTitle: string;
      projectsAriaLabel: string;
      projectsMetaEmpty: string;
      projectsMetaTemplateSingular: string;
      projectsMetaTemplatePlural: string;
      paymentsTitle: string;
      paymentsAriaLabel: string;
      paymentsMetaEmpty: string;
      paymentsMetaTemplateSingular: string;
      paymentsMetaTemplatePlural: string;
      activityTitle: string;
      activityAriaLabel: string;
      activityMetaEmpty: string;
      activityMetaTemplateSingular: string;
      activityMetaTemplatePlural: string;
    };
    empty: {
      projectsTitle: string;
      projectsBody: string;
      paymentsTitle: string;
      paymentsBody: string;
      activityTitle: string;
      activityBody: string;
    };
    projects: {
      listAriaLabel: string;
      fallbackSubtitle: string;
      milestonesTemplate: string;
      paymentsTemplateSingular: string;
      paymentsTemplatePlural: string;
      deliverablesTemplateSingular: string;
      deliverablesTemplatePlural: string;
      updatedTemplate: string;
      rowAriaLabelTemplate: string;
      fallbackStamp: string;
    };
    projectKindLabels: {
      live: string;
      ready_review: string;
      scheduled: string;
      delivered: string;
      issue: string;
    };
    payments: {
      listAriaLabel: string;
      rowAriaLabelTemplate: string;
      dueTemplate: string;
      updatedTemplate: string;
      subTemplate: string;
    };
    paymentStatusLabels: {
      pending: string;
      paid: string;
      approved: string;
      settled: string;
      proof_uploaded: string;
      proof_submitted: string;
      in_review: string;
      rejected: string;
      overdue: string;
      failed: string;
      pending_deposit: string;
    };
    activity: {
      listAriaLabel: string;
      rowAriaLabelTemplate: string;
    };
  };
  divisionLearn: {
    metadata: {
      title: string;
      description: string;
    };
    hero: {
      ariaLabel: string;
      eyebrow: string;
      sideKicker: string;
      sideTitle: string;
      sideBody: string;
      breakdownLabel: string;
      breakdownAriaLabel: string;
      tilesAriaLabel: string;
      tileLabels: {
        active: string;
        completed: string;
        certificates: string;
        assignments: string;
      };
      tileFoot: {
        activeEmpty: string;
        activeWith: string;
        completedEmpty: string;
        completedWith: string;
        certificatesEmpty: string;
        certificatesWith: string;
        assignmentsEmpty: string;
        assignmentsWith: string;
      };
      breakdownNames: {
        active: string;
        assigned: string;
        certificates: string;
        saved: string;
      };
      openLearnCta: string;
      applyToTeachCta: string;
      state: {
        empty: {
          headline: string;
          blurb: string;
        };
        active: {
          headlineTemplateSingular: string;
          headlineTemplatePlural: string;
          blurb: string;
        };
        calm: {
          headlineTemplateSingular: string;
          headlineTemplatePlural: string;
          blurb: string;
        };
      };
    };
    sections: {
      coursesTitle: string;
      coursesMetaEmpty: string;
      coursesMetaTemplate: string;
      extrasTitle: string;
      extrasMeta: string;
      activityTitle: string;
      activityMetaTemplateSingular: string;
      activityMetaTemplatePlural: string;
      activityMetaEmpty: string;
    };
    empty: {
      coursesTitle: string;
      coursesBody: string;
      activityTitle: string;
      activityBody: string;
    };
    courses: {
      ariaLabel: string;
      completedAtTemplate: string;
      progressPercentTemplate: string;
      statusDelimiter: string;
    };
    extras: {
      ariaLabel: string;
      certificatesTitle: string;
      assignmentsTitle: string;
      savedTitle: string;
      teachingTitle: string;
      statusLabel: string;
      expertiseLabel: string;
      topicsLabel: string;
      openApplicationCta: string;
      applyToTeachCta: string;
      teachingEmpty: string;
    };
    activity: {
      ariaLabel: string;
      fallbackTitle: string;
    };
  };
  settings: {
    pageTitle: string;
    pageDescription: string;
    profileSectionKicker: string;
    notificationsSectionKicker: string;
  };
  addresses: {
    metadata: { title: string; description: string };
    hero: { title: string; description: string };
    card: {
      defaultBadge: string;
      kycVerifiedBadge: string;
      setDefaultCta: string;
      editCta: string;
      deleteCta: string;
      addressSeparator: string;
    };
    deleteConfirm: { prompt: string; confirmCta: string; cancelCta: string };
    empty: { body: string };
    add: {
      cta: string;
      formTitle: string;
      editFormTitleTemplate: string;
      maxedNoticeTemplate: string;
    };
  };
  search: {
    metadata: { title: string; description: string };
    hero: { title: string; description: string };
    placeholder: string;
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
    smartHomeEmptyFallback:
      "Welcome — start with a small first step. Your live signals will appear here as soon as activity lands.",
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
    priorityFallback: {
      low: "Quiet",
      normal: "Routine",
      high: "High",
      urgent: "Urgent",
    },
    eyebrow: "Action queue · live",
    guidanceTitle: "One queue, every division.",
    overviewAria: "Tasks overview",
    volumeAria: "Task volume",
    pendingAria: "Pending tasks",
    sideAria: "How the queue works",
    bySource: "By source",
    openTotalLabel: "Open total",
    nothingBlocking: "Nothing blocking right now",
    resolveBlockers: "Resolve to unblock other lanes",
    routine: "routine",
    divisionRepresentedSingular: "{count} division represented",
    divisionRepresentedPlural: "{count} divisions represented",
    headlineEmpty: "Nothing in the queue.",
    headlineBlockerSingular: "{count} blocker needs clearing.",
    headlineBlockerPlural: "{count} blockers need clearing.",
    headlineUrgentSingular: "{count} urgent task to clear.",
    headlineUrgentPlural: "{count} urgent tasks to clear.",
    headlineActiveSingular: "{count} task to work through.",
    headlineActivePlural: "{count} tasks to work through.",
    headlineCalmSingular: "{count} item on your queue.",
    headlineCalmPlural: "{count} items on your queue.",
    blurbEmpty:
      "Your account is in order — verification, payouts, and review-sensitive lanes are all clear. We'll surface the next move here automatically when it shows up.",
    blurbRisk:
      "These items gate higher-trust actions across HenryCo — wallet withdrawals, marketplace seller approval, employer verification. Clearing them unblocks each lane.",
    blurbActive:
      "Each row routes you to the next action with one tap. Filters, priority chips, and deeplinks are kept consistent across every HenryCo division.",
    metaEmpty: "You're clear. Anything new will appear here as it arrives.",
    metaCount: "{count} open · sorted by priority and blocking state.",
  },
  security: {
    title: "Security",
    description:
      "Review recent security activity, change your password, and end HenryCo sessions when needed.",
    heroAriaLabel: "Security overview",
    hero: {
      trustScoreLabel: "Trust score",
      nextTierPrefix: "Next ·",
      nextTierAriaTemplate: "Next tier {tier}",
      accountActiveSingularTemplate: "Account active {days} day",
      accountActivePluralTemplate: "Account active {days} days",
      flaggedEventsSingularTemplate:
        "{count} flagged event on file · review below",
      flaggedEventsPluralTemplate:
        "{count} flagged events on file · review below",
      statusEyebrow: {
        secure: "Security & access · secure",
        watch: "Security & access · action recommended",
        risk: "Security & access · risk flagged",
      },
      statusHeadline: {
        secure: "Your account is secure.",
        watch: "A couple of moves will tighten your account.",
        risk: "We've flagged activity that needs your eyes.",
      },
      statusBlurb: {
        secure:
          "No suspicious events, verification is healthy, and every higher-trust action HenryCo offers is open to you.",
        watch:
          "Nothing is broken — but a few signals (email confirmation, identity review, duplicate contact match) would lift your trust score and unlock more lanes.",
        risk:
          "Recent events were classified as elevated risk. Review the activity stream below and rotate your password if anything looks unfamiliar.",
      },
    },
    signalsTitle: "Signals",
    signalsMeta:
      "What our verification + scoring engines see on your account right now.",
    signalsAriaLabel: "Security signals",
    guideTitle: "Where you are · what advances you",
    guideMetaTemplate: "Honest scoring, not a marketing number. {tier}.",
    allLanesOpen: "All lanes open",
    accountActionsTitle: "Account actions",
    accountActionsMeta: "Routine controls you own directly.",
    changePasswordTitle: "Change your password",
    signOutEverywhereTitle: "Sign out everywhere",
    suspiciousEventFoot: "Review the activity stream below.",
    noSuspiciousEventFoot: "Nothing flagged in the last review window.",
    activityAriaLabel: "Recent security events",
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
  messages: {
    metadata: {
      title: "Messages · HenryCo",
      description:
        "One inbox across support, marketplace, jobs, studio, care, property, logistics and learn.",
    },
    hero: {
      eyebrow: "HenryCo · unified inbox",
      ariaLabel: "Inbox overview",
      ariaTiles: "Inbox volume",
      ariaSide: "By portal",
      sideLabel: "By portal",
      sideBody:
        "Every portal feeds this one inbox. Support, marketplace orders, jobs interviews, studio projects and care bookings all surface here in chronological order.",
    },
    headlines: {
      zero: "Inbox zero across HenryCo.",
      calmOne: "One thread is waiting on you.",
      calmMany: "{count} threads are open.",
      busy: "{unread} unread · {open} open across your portals.",
      overloaded: "{unread} unread across {open} open threads.",
    },
    blurbs: {
      zero: "Everything across support, marketplace, jobs, studio, care, property, logistics and learn is acknowledged.",
      calm: "A short reply now keeps the loop closed before tomorrow.",
      busy: "Tap a row to open the thread, or filter to one portal at a time.",
      overloaded: "Sweep through divisions one by one — newest threads at the top.",
    },
    tiles: {
      openLabel: "Open",
      openFootEmpty: "Nothing in progress",
      openFootActive: "Threads awaiting movement",
      unreadLabel: "Unread",
      unreadFootEmpty: "Inbox caught up",
      unreadFootActive: "Tap a row to open the thread",
      portalsLabel: "Portals",
      portalsFootEmpty: "Care, Marketplace, Studio, Jobs and more",
      portalsFootSingular: "One division active",
      portalsFootPlural: "{count} divisions represented",
    },
    sideTitle: {
      empty: "Quiet across every division",
      singular: "One division has traffic",
      plural: "{count} divisions in the mix",
    },
    section: {
      title: "Threads",
      ariaLabel: "Inbox threads",
      metaEmpty: "Nothing here yet — every portal feeds this inbox",
      metaSingular: "{count} thread",
      metaPlural: "{count} threads",
    },
    chips: {
      ariaLabel: "Filter inbox by portal",
      allThreads: "All threads",
    },
    empty: {
      eyebrow: "Inbox quiet",
      titleAll: "Nothing waiting on you.",
      titleFilter: "No threads in this portal yet.",
      bodyAll:
        "Support, marketplace, jobs, studio, care, property, logistics and learn all surface here — anything cross-portal lands in this list as soon as it begins.",
      bodyFilter:
        "Switch filter chips to see another portal, or browse all threads to confirm nothing is pending.",
    },
    list: {
      unreadDotLabel: "Unread",
      fallbackTime: "—",
    },
    divisionLabels: {
      support: "Support",
      marketplace: "Marketplace",
      jobs: "Jobs",
      studio: "Studio",
      care: "Care",
      property: "Property",
      logistics: "Logistics",
      learn: "Learn",
    },
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
  support: {
    metadata: {
      title: "Support",
      description: "Get help with any HenryCo service.",
    },
    hero: {
      title: "Support",
      description: "Get help with any HenryCo service.",
      newRequestCta: "New request",
    },
    summary: {
      openRequestsTemplate: "{count} open request(s)",
      escalatedTemplate: "{count} escalated",
      escalationNote:
        "Every message is tracked. If triage marks risk or urgency, staff gets a prioritized queue automatically.",
    },
    quickHelp: {
      helpCenterLabel: "Help Center",
      helpCenterDesc: "Browse FAQs and guides",
      contactLabel: "Contact Us",
      contactDesc: "Email or phone support",
      liveChatLabel: "Live Chat",
      liveChatDesc: "Chat with our team",
    },
    threads: {
      sectionKicker: "Your requests",
      emptyTitle: "No support requests",
      emptyDescription:
        "You haven't created any support requests yet. We're here to help if you need anything.",
      createCta: "Create request",
    },
    statusLabels: {
      open: "Open",
      awaitingReply: "Awaiting reply",
      inProgress: "In progress",
      resolved: "Resolved",
      closed: "Closed",
    },
    priorityLabels: {
      low: "Low",
      normal: "Normal",
      high: "High",
      urgent: "Urgent",
    },
  },
  payments: {
    hero: {
      title: "Payment Methods",
      description: "Manage your saved payment options for quick checkout.",
      addMethodCta: "Add method",
    },
    empty: {
      title: "No payment methods",
      description:
        "Add a debit card, bank account, or other payment method for quick checkout across all HenryCo services.",
      cta: "Add payment method",
    },
    card: {
      savedMethodFallback: "Saved method",
      cardLastFourTemplate: "•••• {last4}",
    },
    wallet: {
      eyebrow: "HenryCo Wallet",
      body: "Your HenryCo Wallet is always available as a payment option.",
      manageCta: "Manage wallet",
    },
  },
  savedItems: {
    metadata: {
      title: "Saved for later",
      description:
        "Items you set aside from any HenryCo cart, kept for 90 days with an expiry warning a week early.",
    },
    hero: {
      title: "Saved for later",
      description:
        "Items you set aside from any HenryCo cart. We'll keep them for 90 days and warn you a week before they expire.",
    },
    summary: {
      activeTemplate: "{count} active",
      expiredTemplate: "{count} expired",
      expiryNote:
        "Items expire 90 days after they're saved. We warn you a week early.",
      savedTemplate: "{count} saved",
    },
    toolbar: {
      showLabel: "Show",
      allDivisions: "All divisions",
      sortLabel: "Sort",
      sortNewest: "Newest first",
      sortOldest: "Oldest first",
      sortExpiring: "Expiring soon",
    },
    selection: {
      selectedTemplate: "{count} selected",
      clear: "Clear",
      moving: "Moving…",
      moveSelectedToCart: "Move selected to cart",
      selectAllOnPage: "Select all on page",
    },
    empty: {
      title: "Nothing saved for later yet",
      description:
        "When you find something you're not ready to buy, save it for later from the cart. We'll keep the price you saw at the time and warn you a week before it expires.",
      browseCta: "Browse",
    },
    card: {
      deselectItem: "Deselect item",
      selectItem: "Select item",
      savedItemFallback: "Saved item",
      expiresToday: "Expires today",
      expiresInTemplate: "Expires in {days} day{plural}",
      expiredNotice: "Expired — restore resets the 90-day window",
      moveToCart: "Move to cart",
      moving: "Moving…",
      removeFromSaved: "Remove from saved items",
      openOriginal: "Open original listing",
    },
    expired: {
      sectionKicker: "Recently expired",
      sectionNote: "Restoring resets the 90-day window.",
    },
  },
  documents: {
    metadata: {
      title: "Documents",
      description:
        "Your receipts, certificates, contracts, and important files — kept private and accessible across every HenryCo division.",
    },
    hero: {
      eyebrow: "Personal Vault",
      title: "Documents",
      body: "Your receipts, certificates, contracts, and important files.",
    },
    toolbar: {
      uploadCta: "Upload document",
      filterLabel: "Filter",
      allCategories: "All categories",
      sortLabel: "Sort",
      sortNewest: "Newest first",
      sortOldest: "Oldest first",
    },
    types: {
      document: "Document",
      receipt: "Receipt",
      certificate: "Certificate",
      id_document: "ID document",
      contract: "Contract",
      other: "Other",
    },
    categories: {
      all: "All",
      document: "Documents",
      receipt: "Receipts",
      certificate: "Certificates",
      id_document: "ID documents",
      contract: "Contracts",
      other: "Other",
    },
    card: {
      uploadedOnTemplate: "Uploaded {date}",
      sizeTemplate: "{size}",
      downloadLabel: "Download",
      noFileAttached: "No file attached",
      openOriginal: "Open document",
    },
    empty: {
      title: "No documents yet",
      description:
        "Your documents, receipts, and certificates from HenryCo services will be stored here.",
    },
    summary: {
      countTemplate: "{count} document{plural}",
      filteredTemplate: "{count} of {total} shown",
    },
    retention: {
      eyebrow: "Privacy & retention",
      title: "Your files stay private",
      body: "Documents are encrypted at rest, visible only to you, and retained for the lifetime of your HenryCo account unless you remove them.",
    },
  },
  subscriptions: {
    metadata: {
      title: "Subscriptions",
      description:
        "Read-only summary of active plans synced from divisions across HenryCo.",
    },
    hero: {
      eyebrow: "Active plans",
      title: "Subscriptions",
      description:
        "Read-only plan summary from divisions that currently sync subscription records into the shared account hub.",
    },
    empty: {
      title: "No synced subscriptions yet",
      description:
        "This can mean you have no active plan, or that the division has not published subscription records into the shared account ledger yet.",
    },
    card: {
      planFallback: "Subscription plan",
      tierSeparator: " · ",
      amountLabel: "Amount",
      cycleLabel: "Cycle",
      renewsLabel: "Renews",
      renewsFallback: "—",
    },
    statusLabels: {
      active: "Active",
      paused: "Paused",
      cancelled: "Cancelled",
      expired: "Expired",
      past_due: "Past due",
      trialing: "Trialing",
      grace: "Grace period",
      pending: "Pending",
      unknown: "Unknown",
    },
    cycleLabels: {
      monthly: "Monthly",
      yearly: "Yearly",
      annual: "Annual",
      quarterly: "Quarterly",
      weekly: "Weekly",
      biweekly: "Every 2 weeks",
      daily: "Daily",
      one_time: "One-time",
      notSet: "Not set",
    },
    cta: {
      upgrade: "Upgrade plan",
      downgrade: "Downgrade plan",
      cancel: "Cancel subscription",
      manage: "Manage in division",
      resume: "Resume subscription",
    },
    paymentIssue: {
      title: "Payment needs attention",
      description:
        "We could not collect the most recent renewal. Update your payment method to keep this subscription active.",
      updatePaymentCta: "Update payment method",
    },
    summary: {
      activeTemplate: "{count} active",
      pausedTemplate: "{count} paused",
      totalTemplate: "{count} plan{plural}",
    },
  },
  referrals: {
    metadata: {
      title: "Referrals",
      description:
        "Invite qualified customers to HenryCo and track rewards through pending, reviewed, and credited states.",
    },
    hero: {
      title: "Referrals",
      description:
        "Invite qualified customers to HenryCo and track rewards through pending, reviewed, and credited states.",
    },
    code: {
      eyebrow: "Your Referral Code",
      shareLinkLabel: "Share Link",
      copyCodeTitle: "Copy code",
      copyLinkTitle: "Copy link",
      copyLinkLabel: "Copy link",
      copiedToast: "Copied!",
      rewardNote:
        "Reward: {amount} per qualified referral. Rewards unlock after the referee completes a paid order within the {days}-day hold window.",
    },
    stats: {
      totalReferred: "Total Referred",
      signedUp: "Signed Up",
      qualified: "Qualified",
      flagged: "Flagged",
      pendingRewards: "Pending Rewards",
      releasedRewards: "Released Rewards",
    },
    howItWorks: {
      eyebrow: "How It Works",
      step1Title: "Share your code",
      step1Body:
        "Share your unique code or link. Friends who visit any HenryCo subdomain with your link get tracked automatically.",
      step2Title: "They transact",
      step2Body:
        "After signup, the referral enters a {days}-day hold window. We track the referred account only once — self-referrals, duplicate households, and recycled signups do not qualify.",
      step3Title: "Rewards clear after qualification",
      step3Body:
        "Qualified referrals credit {amount} to your HenryCo wallet after finance review. Pending rewards are not spendable until cleared.",
    },
    policy: {
      eyebrow: "Referral Policy",
      qualifying:
        "A qualifying conversion means the referred account completed an eligible HenryCo action that passed payment and trust verification.",
      enforcement:
        "HenryCo can hold, reverse, or cancel rewards for self-referrals, duplicate conversion loops, reversals, refunds, or suspicious reward patterns.",
      separation:
        "Your dashboard shows referral matches and reward history separately so tracked signups are not mistaken for credited wallet earnings.",
    },
    referralsList: {
      eyebrow: "Your Referrals",
      emptyTitle: "No referrals yet",
      emptyDescription:
        "Share your referral code to start inviting people. Referrals will appear here once someone signs up with your link.",
      refereeFallback: "Referred signup",
      signedUpTemplate: "Signed up {date}",
      qualifiedTemplate: "Qualified {date}",
    },
    statusLabels: {
      pending: "Awaiting signup",
      converted: "Signed up · hold period",
      qualified: "Qualified · reward unlocked",
      flagged: "Flagged · fraud guard",
      expired: "Expired",
    },
    flagReasons: {
      selfReferral: "Self-referral blocked",
      duplicateEmail: "Duplicate referee email",
      deviceReuse: "Device reuse",
    },
    rewards: {
      eyebrow: "Reward History",
      emptyTitle: "No rewards yet",
      emptyDescription:
        "Credited rewards will appear here after qualifying conversions clear verification and anti-abuse review.",
      referralRewardFallback: "Referral Reward",
      paidTemplate: "Paid {date}",
      statusLabels: {
        held: "Held",
        pending: "Pending",
        released: "Released",
        paid: "Paid",
        cancelled: "Cancelled",
      },
    },
  },
  divisionCare: {
    metadata: {
      title: "Care · linked bookings",
      description: "Track every HenryCo Care booking linked to this account — status, payment verification, and the next operational step in one place.",
    },
    hero: {
      eyebrow: "Care · live",
      sideKicker: "How this room works",
      sideTitle: "Book on Care, follow up here.",
      sideBody: "Every booking made on HenryCo Care mirrors into this room — tracking code, payment status, and the next operational step land here automatically. The dashboard below stays in sync as service progresses.",
      breakdownLabel: "By status",
      tilesAriaLabel: "Care booking summary",
      tileLabels: {
        total: "Bookings",
        inFlight: "In service",
        payment: "Awaiting payment",
        completed: "Completed",
      },
      tileFoot: {
        totalEmpty: "Book your first Care service to start",
        totalWithTemplate: "{count} linked to this account",
        inFlightEmpty: "Nothing actively moving right now",
        inFlightWith: "Live status mirrors below",
        paymentEmpty: "No outstanding payment verification",
        paymentWith: "Submit or check receipt below",
        completedEmpty: "No services completed yet",
        completedWith: "Marked done by the Care team",
      },
      breakdownLabels: {
        inFlight: "In service",
        scheduled: "Scheduled",
        payment: "Awaiting payment",
        completed: "Completed",
      },
      state: {
        empty: {
          headline: "Book your first Care service.",
          blurb: "Care services you book here sync automatically into this room — tracking code, payment status, and the next operational step.",
          ctaPrimary: "Book a service",
          ctaSecondary: "Open tracking",
        },
        attention: {
          headlineTemplateSingular: "{count} action to take.",
          headlineTemplatePlural: "{count} actions to take.",
          blurb: "One or more bookings are waiting on payment verification or a follow-up. Open the booking below to clear it.",
          ctaPrimary: "Review bookings",
          ctaSecondary: "Open tracking",
        },
        active: {
          headlineTemplateSingular: "{count} service in motion.",
          headlineTemplatePlural: "{count} services in motion.",
          blurb: "Live tracking, payment verification, and the next operational step are mirrored from HenryCo Care into this room.",
          ctaPrimary: "Open tracking",
          ctaSecondary: "Book a service",
        },
        calm: {
          headlineTemplateSingular: "{count} booking on record.",
          headlineTemplatePlural: "{count} bookings on record.",
          blurb: "Your Care bookings, tracking codes, receipts, and upcoming actions — all in one place, synced in real time.",
          ctaPrimary: "Book a service",
          ctaSecondary: "Open tracking",
        },
      },
    },
    sections: {
      glance: "Next action",
      glanceMeta: "The most time-sensitive booking surfaces here.",
      bookings: "All bookings",
      bookingsEmpty: "Bookings made while signed in appear here in real time.",
      bookingsMetaTemplateSingular: "{count} booking · filter, paginate, and open any one for the live detail.",
      bookingsMetaTemplatePlural: "{count} bookings · filter, paginate, and open any one for the live detail.",
      activity: "Recent activity",
      activityEmpty: "Status updates, receipts, and reviews surface here as they happen.",
      activityMetaTemplateSingular: "{count} update · most recent first",
      activityMetaTemplatePlural: "{count} updates · most recent first",
    },
    empty: {
      title: "No Care bookings linked yet",
      body: "Bookings you make on Care while signed in land here immediately. Older bookings also surface once their email or phone matches your shared profile.",
    },
    glance: {
      nextActionLabel: "Next action",
      serviceLabel: "Service",
      pickupLabel: "Pickup",
      balanceLabel: "Balance due",
      trackingLabel: "Tracking",
      serviceFallback: "Care service",
    },
    activityAriaLabel: "Care activity",
    status: {
      live: "In service",
      scheduled: "Scheduled",
      completed: "Completed",
      issue: "Action needed",
      payment: "Payment review",
    },
    statusValueLabels: {
      booked: "Booked",
      awaiting_payment: "Awaiting payment",
      receipt_submitted: "Receipt submitted",
      under_review: "Under review",
      delivered: "Delivered",
      customer_confirmed: "Customer confirmed",
      inspection_completed: "Inspection completed",
      service_completed: "Service completed",
      cancelled: "Cancelled",
      issue: "Issue",
      exception: "Exception",
      rejected: "Rejected",
    },
    formatLabels: {
      toBeScheduled: "To be scheduled",
      shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    },
    dashboard: {
      filters: {
        all: "All",
        unpaid: "Balance due",
        receipt: "Receipt / review",
        active: "In progress",
        completed: "Completed",
        issue: "Issues",
      },
      filtered: "filtered",
      bookingSingular: "booking",
      bookingPlural: "bookings",
      metrics: {
        visible: "Visible bookings",
        visibleHint: "Real Care bookings linked to this account.",
        balance: "Outstanding balance",
        balanceHintSomeTemplate: "{count} booking(s) still need payment follow-up.",
        balanceHintNone: "No unpaid Care balance is currently open.",
        receiptQueue: "Receipt queue",
        receiptQueueHintSome: "Bookings with submitted receipts still waiting for verification.",
        receiptQueueHintNone: "No receipt-verification backlog is linked to this account.",
        completed: "Completed",
        completedHintSome: "Completed bookings that can move into review follow-up.",
        completedHintNone: "Completed Care bookings will appear here once service closes.",
      },
      linkedBookings: "Linked Care bookings",
      linkedBookingsDescription: "Your Care bookings, payment status, and upcoming actions.",
      onThisPage: "on this page",
      selectedBooking: "Selected booking",
      paymentSnapshot: "Payment snapshot",
      receiptVisibility: "Receipt visibility",
      nextBestAction: "Next best action",
      serviceSummary: "Service summary",
      serviceFallback: "Care service",
      addressPending: "Address pending",
      updated: "Updated",
      balanceDue: "Balance due",
      nextMove: "Next move",
      paginationLabel: "Care bookings pagination",
      pageLabel: "Page",
      of: "of",
      perPage: "per page",
      previous: "Previous",
      next: "Next",
      customerFallback: "Customer",
      scheduledDate: "Scheduled date",
      notScheduled: "Not scheduled yet",
      timeWindow: "Time window",
      windowPending: "Window pending",
      pickupAddress: "Pickup address",
      returnAddress: "Return / delivery address",
      returnAddressFallback: "Uses pickup address unless changed during booking",
      trackingCode: "Tracking code",
      quotedTotal: "Quoted total",
      amountRecorded: "Amount recorded",
      receiptState: "Receipt state",
      receiptsSubmitted: "Receipts submitted",
      lastSubmission: "Last submission",
      noReceiptYet: "No receipt yet",
      openLiveBooking: "Open live booking",
      leaveReview: "Leave review",
    },
  },
  divisionProperty: {
    metadata: {
      title: "Property · saved & inquiries",
      description: "Your Property shortlist, inquiries, viewings, and listing follow-ups — every action on HenryCo Property mirrors into this account room.",
    },
    hero: {
      eyebrow: "Property · live",
      ariaLabel: "Property overview",
      browseListingsCta: "Browse listings",
      savedShortlistCta: "Saved shortlist",
      tilesAriaLabel: "Property activity",
      tileLabels: {
        saved: "Saved",
        inquiries: "Inquiries",
        viewings: "Viewings",
        listings: "Listings",
      },
      tileFoot: {
        savedManagedTemplate: "{count} HenryCo-managed",
        savedEmpty: "Save listings to build a shortlist",
        savedWith: "Compare and revisit anytime",
        inquiriesEmpty: "No conversations open yet",
        inquiriesWith: "Follow-ups land in this room",
        viewingsEmpty: "Request a viewing on a saved home",
        viewingsWith: "Confirmations sync across devices",
        listingsEmpty: "Submit a listing on Property",
        listingsWith: "Moderation outcomes mirror here",
      },
      sideAriaLabel: "How this room works",
      sideKicker: "How this room works",
      sideTitle: "Discover on Property, follow up here.",
      sideBody:
        "Save a listing, request a viewing, or open an inquiry on HenryCo Property — every action mirrors into this account room so you can pick up where you left off across devices.",
      sideBodyMuted:
        "HenryCo-managed listings flag with a Managed badge — review, inspection, and lease follow-ups are coordinated by the Property team.",
      breakdownAriaLabel: "Activity breakdown",
      breakdownLabel: "By activity",
      breakdownLabels: {
        saved: "Saved",
        inquiries: "Inquiries",
        viewings: "Viewings",
        listings: "Listings",
      },
      state: {
        empty: {
          headline: "Start exploring HenryCo Property.",
          blurb:
            "Discover residential rentals, sale listings, and HenryCo-managed homes. Save your favourites and every inquiry, viewing, or listing follow-up lands here automatically.",
        },
        discover: {
          headlineTemplateSingular: "{count} shortlisted home.",
          headlineTemplatePlural: "{count} shortlisted homes.",
          blurb:
            "Saved homes ready to revisit. Open a listing to request a viewing or send an inquiry, and the follow-up will mirror straight back into this room.",
        },
        active: {
          viewingHeadlineTemplateSingular: "{count} viewing scheduled.",
          viewingHeadlineTemplatePlural: "{count} viewings scheduled.",
          inquiryHeadlineTemplateSingular: "{count} inquiry live.",
          inquiryHeadlineTemplatePlural: "{count} inquiries live.",
          blurb:
            "Your shortlist, inquiries, and viewing schedule live in one room. Pick up where you left off — every action is mirrored from HenryCo Property in real time.",
        },
      },
    },
    sections: {
      saved: "Saved shortlist",
      savedMetaEmpty: "Save listings on HenryCo Property to build your shortlist.",
      savedMetaTemplate: "{saved} saved · {managed} managed by HenryCo",
      activity: "Recent activity",
      activityMetaEmpty: "Inquiries, viewings, and listing reviews mirror here as they happen.",
      activityMetaTemplateSingular: "{count} update · most recent first",
      activityMetaTemplatePlural: "{count} updates · most recent first",
    },
    empty: {
      savedTitle: "No saved properties yet",
      savedBody:
        "Discover residential rentals, sale listings, and HenryCo-managed homes on Property. Anything you save lands here automatically.",
      activityTitle: "No property activity yet",
      activityBody:
        "Open a listing on HenryCo Property to request a viewing or send an inquiry — every step from your first message through review will appear here.",
    },
    activity: {
      ariaLabel: "Property activity",
      titles: {
        inquiry: "Property inquiry",
        viewing: "Viewing request",
        listing_submitted: "Listing submitted",
        listing_updated: "Listing updated",
        listing_reviewed: "Listing review complete",
      },
    },
    gallery: {
      ariaLabel: "Saved properties",
      managedBadge: "Managed",
      featuredBadge: "Featured",
      locationPending: "Location pending",
      contactAgent: "Contact agent",
      savedAtTemplate: "Saved {date}",
      bedSingular: "bed",
      bedPlural: "beds",
      bathSingular: "bath",
      bathPlural: "baths",
      sizeSqmTemplate: "{size} sqm",
    },
  },
  divisionMarketplace: {
    metadata: {
      title: "Marketplace · orders & seller activity",
      description: "Track every HenryCo Marketplace order, dispute, and seller payout linked to this account — buyer activity and seller workspace, mirrored into one room in real time.",
    },
    hero: {
      eyebrow: "Marketplace · live",
      ariaLabel: "Marketplace overview",
      sideAriaLabel: "How this room works",
      sideKicker: "How this room works",
      sideTitle: "Buy and sell — one room.",
      sideBody: "Every order, dispute, and payout request you create on Marketplace mirrors into this room. Seller workspace activity threads in alongside buyer orders, so the two sides of marketplace stay visible at a glance.",
      breakdownLabel: "By status",
      breakdownAriaLabel: "Activity breakdown",
      tilesAriaLabel: "Marketplace activity",
      tileLabels: {
        orders: "Orders",
        disputes: "Disputes",
        store: "Store",
        payouts: "Payouts",
      },
      tileFoot: {
        ordersEmpty: "First order will appear here",
        ordersInMotionTemplate: "{inFlight} in motion · {delivered} delivered",
        ordersDeliveredTemplate: "{delivered} delivered to date",
        disputesClear: "All clear",
        disputesActiveTemplate: "{open} open · {resolving} resolving",
        storeActiveNoName: "Vendor membership active",
        storeActiveWithNameTemplate: "Store: {name}",
        storeApplicationTemplate: "Application: {status}",
        storeIdle: "Not selling yet — apply when ready",
        payoutsEmptyNoneSettled: "No payout requests yet",
        payoutsSettledTemplate: "{count} settled to date",
        payoutsPendingTemplate: "{amount} pending",
      },
      breakdownLabels: {
        inMotion: "In motion",
        openDisputes: "Open disputes",
        delivered: "Delivered",
        pendingPayouts: "Pending payouts",
      },
      state: {
        empty: {
          headline: "Start shopping on HenryCo Marketplace.",
          blurb: "Orders, disputes, seller activity, and payouts mirror into this room as soon as you transact. Browse the marketplace to get the first one rolling.",
          ctaPrimary: "Open marketplace",
          ctaSecondary: "Apply to sell",
        },
        attention: {
          headlineTemplateSingular: "{count} matter needs attention.",
          headlineTemplatePlural: "{count} matters need attention.",
          blurb: "Disputes and exception orders sit at the top of the queue. Open the case to add evidence or accept resolution.",
          ctaPrimary: "Review matters",
          ctaSecondary: "Open marketplace",
        },
        activeOrders: {
          headlineTemplateSingular: "{count} order in motion.",
          headlineTemplatePlural: "{count} orders in motion.",
          blurb: "Live order status, payment state, and seller follow-up mirror into this room from HenryCo Marketplace in real time.",
          ctaPrimary: "Open marketplace",
          ctaSecondary: "Apply to sell",
        },
        activePayouts: {
          headlineTemplateSingular: "{count} payout in review.",
          headlineTemplatePlural: "{count} payouts in review.",
          blurb: "Vendor payout requests are moving through finance verification. Status updates appear here as the team progresses each request.",
          ctaPrimary: "Open seller workspace",
          ctaSecondary: "Open marketplace",
        },
        calmBuyer: {
          headlineTemplateSingular: "{count} order on record.",
          headlineTemplatePlural: "{count} orders on record.",
          blurb: "All your marketplace activity in one room — buyer orders, seller payouts, dispute outcomes, and the latest status from every store.",
          ctaPrimary: "Open marketplace",
          ctaSecondary: "Apply to sell",
        },
        calmSeller: {
          headlineTemplateSingular: "{count} order · seller active.",
          headlineTemplatePlural: "{count} orders · seller active.",
          blurb: "All your marketplace activity in one room — buyer orders, seller payouts, dispute outcomes, and the latest status from every store.",
          ctaPrimary: "Open marketplace",
          ctaSecondary: "Open seller workspace",
        },
      },
    },
    sections: {
      matters: {
        title: "Active matters",
        meta: "Disputes, seller application status, and pending payouts surface here when action is needed.",
        ariaLabel: "Active marketplace matters",
        emptyTitle: "Nothing requires action",
        emptyBody: "All your marketplace activity is moving normally — no open disputes, no payouts in review, and (if applicable) your seller application has cleared.",
      },
      orders: {
        title: "Recent orders",
        empty: "Orders placed on Marketplace appear here in real time.",
        metaTemplateSingular: "{count} order · most recent first",
        metaTemplatePlural: "{count} orders · most recent first",
        emptyTitle: "No orders yet",
        emptyBody: "Place your first order on HenryCo Marketplace — order status, payment state, and any follow-up land here automatically.",
        ariaLabel: "Recent orders",
      },
      activity: {
        title: "Recent activity",
        empty: "Status updates, payments, and reviews mirror here as they happen.",
        metaTemplateSingular: "{count} update · most recent first",
        metaTemplatePlural: "{count} updates · most recent first",
        emptyTitle: "No marketplace activity yet",
        emptyBody: "Order confirmations, dispute updates, and seller payout outcomes will appear here as they happen.",
        ariaLabel: "Marketplace activity",
      },
    },
    matters: {
      disputes: {
        kicker: "Disputes",
        titleTemplateSingular: "{count} case needs action",
        titleTemplatePlural: "{count} cases need action",
        bodyLatestTemplate: "Latest: {ref} · updated {stamp}",
        bodyFallback: "Open the queue to add evidence.",
        cta: "Review cases",
      },
      application: {
        kicker: "Seller application",
        bodyWithStoreTemplate: "Store: {name}",
        bodyDefault: "Application in HenryCo review queue.",
        bodyReviewSuffixTemplate: " · {note}",
        cta: "View status",
        defaultStatus: "submitted",
      },
      payouts: {
        kicker: "Payouts in review",
        titleTemplate: "{amount} pending",
        bodyTemplateSingular: "{count} request awaiting finance verification.",
        bodyTemplatePlural: "{count} requests awaiting finance verification.",
        cta: "Open seller workspace",
      },
    },
    orders: {
      rowTitleTemplate: "Order {orderNo}",
      rowSubTemplate: "{amount} · placed {stamp}",
      rowAriaLabelTemplate: "Order {orderNo} · {status}",
      statusFallbackDraft: "Draft",
    },
    statusValueLabels: {
      delivered: "Delivered",
      completed: "Completed",
      customer_confirmed: "Customer confirmed",
      fulfilled: "Fulfilled",
      cancelled: "Cancelled",
      refunded: "Refunded",
      disputed: "Disputed",
      exception: "Exception",
      placed: "Placed",
      paid: "Paid",
      awaiting_fulfilment: "Awaiting fulfilment",
      confirmed: "Confirmed",
      queued: "Queued",
    },
    applicationStatusLabels: {
      submitted: "submitted",
      under_review: "under review",
      approved: "approved",
      rejected: "rejected",
      pending_documents: "pending documents",
      changes_requested: "changes requested",
    },
    formatLabels: {
      dash: "—",
    },
  },
  divisionJobs: {
    metadata: {
      title: "Jobs · candidate dashboard",
      description: "Track every HenryCo Jobs application, saved role, recruiter update, and profile readiness signal linked to this account.",
    },
    header: {
      title: "Jobs",
      description: "Your applications, saved roles, recruiter updates, and profile strength — all in one place.",
      candidateModuleCta: "Candidate module",
      interviewRoomsCta: "Interview rooms",
      browseLiveRolesCta: "Browse live roles",
    },
    hero: {
      eyebrow: "Your account",
      headline: "Your jobs activity, all in one place.",
      body: "Applications, saved roles, recruiter updates, and profile readiness are linked to your HenryCo account.",
      statsAriaLabel: "Jobs activity summary",
      statLabels: {
        applications: "Active applications",
        saved: "Saved roles",
        readiness: "Profile readiness",
        updates: "Recruiter updates",
      },
      statDetails: {
        applicationsLeadingTemplate: "{stage} is your leading live stage.",
        applicationsEmpty: "No live applications yet.",
        savedSome: "Your shortlist is ready for another review pass.",
        savedEmpty: "Build a shortlist so good roles are easier to revisit.",
        updatesLatestTemplate: "{relative} latest movement.",
        updatesEmpty: "No recruiter updates yet.",
      },
    },
    sections: {
      nextActionsKicker: "Next Actions",
      nextActionsTitle: "What deserves your attention now",
      openTimelineCta: "Open timeline",
      applicationsKicker: "Applications",
      applicationsTitle: "Live hiring movement",
      savedKicker: "Saved Jobs",
      savedTitle: "Shortlist with better context",
      openSavedRolesCta: "Open saved roles",
      recommendedKicker: "Recommended Roles",
      recommendedTitle: "What fits your current signal",
      browseCatalogCta: "Browse catalog",
      recruiterFeedKicker: "Recruiter Feed",
      recruiterFeedTitle: "Messages, stage moves, and alerts",
      candidateInboxCta: "Candidate inbox",
      profileKicker: "Profile Strength",
      profileTitle: "Candidate readiness and CV quality",
      sharedInboxKicker: "Shared Inbox",
      sharedInboxTitle: "Jobs notifications linked to your account",
      alertsKicker: "Alerts",
      alertsTitle: "Saved search intent",
    },
    empty: {
      applicationsTitle: "No applications are live yet",
      applicationsBody: "Saved roles, recruiter updates, and timelines will appear here as soon as you move from browsing into a live application.",
      exploreJobsCta: "Explore jobs",
      savedJobsTitle: "No saved roles yet",
      savedJobsBody: "Save promising roles to keep them on your shortlist across Jobs and your account.",
      recommendedTitle: "Recommendations will sharpen as you use Jobs",
      recommendedBody: "Once your profile, shortlist, and applications deepen, the role suggestions here will get more targeted.",
      recruiterFeedTitle: "No recruiter movement yet",
      recruiterFeedBody: "Application stage changes, shared recruiter notes, and in-app jobs notifications will collect here.",
      notificationsTitle: "No jobs notifications yet",
      notificationsBody: "Future shortlist moves, employer updates, and application changes will land here and inside the Jobs module.",
      alertsTitle: "No jobs alerts are active",
      alertsBody: "Create an alert so new roles matching your criteria appear in your Jobs feed.",
      browseRolesCta: "Browse roles",
    },
    application: {
      progressPercentTemplate: "{percent}% complete",
      appliedAtTemplate: "Applied {date}",
      candidateReadiness: "Candidate readiness",
      recruiterConfidence: "Recruiter confidence",
      latestMovement: "Latest recruiter movement",
      nextBestMove: "Next best move",
      openTimelineCta: "Open timeline",
      interviewRoomCta: "Interview room",
      viewRoleCta: "View role",
    },
    savedJob: {
      trustTemplate: "Trust {score}",
      savedAtTemplate: "Saved {date}",
    },
    recommended: {
      compFallback: "Comp discussed in process",
    },
    stageLabels: {
      applied: "Applied",
      reviewing: "Reviewing",
      shortlisted: "Shortlisted",
      interview: "Interview",
      offer: "Offer",
      hired: "Hired",
      rejected: "Rejected",
    },
    nextStep: {
      labels: {
        applied: "Keep your profile and resume current",
        shortlisted: "Have proof and portfolio context ready",
        interview: "Prepare examples and scheduling blocks",
        offer: "Review scope, timing, and compensation",
        rejected: "Strengthen the next application pack",
      },
      bodies: {
        applied: "Early-stage review benefits from sharper proof, clean contact info, and a current resume.",
        shortlisted: "Shortlist status means you passed the first signal check. Tight proof matters now.",
        interview: "Interview stages move faster when your strongest work proof and availability are easy to scan.",
        offer: "Use the offer stage to close ambiguity, not to guess at responsibilities.",
        rejected: "Use the rejection as signal. Tighten summary, examples, and role fit before applying again.",
      },
    },
    readinessLabels: {
      interviewReady: "Interview-ready",
      strongProfile: "Strong profile",
      needsProof: "Needs proof",
      needsStructure: "Needs structure",
    },
    workModeLabels: {
      remote: "Remote",
      hybrid: "Hybrid",
      onsite: "On-site",
    },
    employmentTypeLabels: {
      fullTime: "Full-time",
      partTime: "Part-time",
      contract: "Contract",
      internship: "Internship",
      temporary: "Temporary",
    },
    profile: {
      readinessLabel: "Readiness",
      skillsMappedLabel: "Skills mapped",
      filesLabel: "Files",
      improveProfileCta: "Improve profile",
      openCandidateModuleCta: "Open candidate module",
      checklist: {
        identityLabel: "Profile basics",
        identityDetail: "Full name, phone, and location are present for recruiter follow-through.",
        storyLabel: "Role story",
        storyDetail: "Headline and summary explain what you do beyond a blank record.",
        verificationLabel: "Identity verification",
        verificationDetail: "Jobs trust stays capped until your HenryCo account has cleared identity review.",
        proofLabel: "Proof of work",
        proofDetail: "Resume plus portfolio evidence makes shortlist movement easier.",
        skillsLabel: "Skills mapped",
        skillsDetail: "At least four skills and preferred functions improve recommendations.",
      },
    },
    nextActions: {
      gapTemplate: "Close the {label} gap",
      interviewLabel: "Prepare for an interview lane",
      offerLabel: "Respond to an active offer",
      attentionTemplate: "{title} at {employer} needs attention now.",
      convertSavedLabel: "Convert a saved role into a live application",
      convertSavedTemplate: "{title} is already on your shortlist and ready for a deeper pass.",
      restartLabel: "Restart your jobs search with stronger filters",
      restartDetail: "Use verified-employer and internal-role filters to build a cleaner shortlist faster.",
    },
    alertStatus: {
      active: "Active",
      paused: "Paused",
    },
    recruiterUpdateTitleTemplate: "{stage} update",
  },
  divisionLogistics: {
    metadata: {
      title: "Logistics · deliveries and shipments",
      description: "Every HenryCo Logistics pickup, drop-off, ETA, and proof of delivery linked to this account — mirrored from the logistics network into one calm room.",
    },
    hero: {
      ariaLabel: "Logistics overview",
      eyebrow: "HenryCo Logistics",
      brand: "HenryCo Logistics",
      title: "Every parcel, one room.",
      body: "Pickups, drop-offs, ETAs and proofs of delivery — all mirrored from the logistics network into your account. Book once on",
      bodyDomain: " logistics.henrycogroup.com",
      ctaNewDelivery: "New delivery",
    },
    metrics: {
      ariaLabel: "Logistics performance",
      activeNowLabel: "Active now",
      activeFootSingular: "shipment in flight",
      activeFootPlural: "shipments in flight",
      deliveredMonthLabel: "Delivered · this month",
      deliveredMonthFootTemplate: "{count} lifetime",
      onTimeRateLabel: "On-time rate",
      onTimeRateFootEmpty: "Awaiting first scheduled delivery",
      onTimeRateFootHasValue: "Of scheduled deliveries",
      totalSpendLabel: "Total spend",
      totalSpendFoot: "Paid lifetime",
    },
    map: {
      noShipmentsAriaLabel: "No shipments yet",
      noShipmentsTitle: "Your map will light up when you book your first delivery",
      noShipmentsBody: "Every active pickup and drop-off pins here automatically. Book once and your shipments mirror back from the logistics site.",
      noShipmentsCta: "Book a delivery",
      pendingAriaLabel: "Map preview",
      pendingTitle: "Geocoding pending",
      pendingBody: "Your active shipments will pin to the map as soon as the pickup and drop-off addresses are geocoded by dispatch.",
      activeAriaLabel: "Active shipments map",
      altTemplateSingular: "Map showing {count} active pickup and drop-off pin",
      altTemplatePlural: "Map showing {count} active pickup and drop-off pins",
      liveBadgeTemplateSingular: "Live · {count} active shipment",
      liveBadgeTemplatePlural: "Live · {count} active shipments",
    },
    sections: {
      activeTitle: "In flight right now",
      activeMetaTemplate: "{count} active · auto-syncs from logistics",
      activeRailAriaLabel: "Active shipments",
      emptyAriaLabel: "No active shipments",
      emptyTitle: "No active shipments",
      emptyBody: "Your past deliveries are below. Book another and it will appear here as soon as the rider confirms pickup.",
      actionsTitle: "Run a delivery",
      actionsMeta: "Shortcuts to common flows",
      actionsAriaLabel: "Logistics quick actions",
      recentTitle: "Recently delivered",
      recentMetaTemplate: "Last {recent} of {lifetime} lifetime",
      recentAriaLabel: "Recent deliveries",
      spendTitle: "Spend · last 6 months",
      spendMeta: "Paid only",
      spendFigureAriaLabelTemplate: "Logistics spend over the last 6 months",
    },
    statusLabels: {
      quoteRequested: "Quote pending",
      quoteSent: "Quote ready",
      pendingPayment: "Awaiting payment",
      scheduled: "Scheduled",
      assigned: "Rider assigned",
      pickupConfirmed: "Picked up",
      inTransit: "In transit",
      delayed: "Delayed",
      attemptedDelivery: "Attempted delivery",
      delivered: "Delivered",
      completed: "Completed",
      closed: "Closed",
      cancelled: "Cancelled",
      refunded: "Refunded",
    },
    urgencyLabels: {
      standard: "Standard",
      sameDay: "Same day",
      express: "Express",
      nextDay: "Next day",
    },
    serviceLabels: {
      scheduled: "Scheduled",
      sameDay: "Same-day",
      interCity: "Inter-city",
      bulk: "Bulk",
    },
    shipment: {
      trackingCodeAriaTemplate: "Tracking code {code}",
      addressPending: "Address pending",
      etaPending: "ETA pending",
      trackCta: "Track shipment",
      openTrackingAriaTemplate: "Open tracking for {code}",
      etaAriaTemplate: "ETA {eta}",
      etaMinutesInTemplate: "in {minutes} min",
      etaMinutesOverdueTemplate: "{minutes} min overdue",
      etaHoursInTemplate: "in {hours}h",
      etaHoursOverdueTemplate: "{hours}h overdue",
      detailSeparator: " · ",
    },
    timeline: {
      ariaLabel: "Recent deliveries",
      deliveredToTemplate: "Delivered to {name}",
      receiptCta: "Receipt",
    },
    quickActions: {
      ariaLabel: "Logistics quick actions",
      bookLabel: "Book a delivery",
      bookDesc: "Pickup & drop-off in a single guided flow.",
      trackLabel: "Track by code",
      trackDesc: "Live status, ETA and rider context.",
      quoteLabel: "Quote first",
      quoteDesc: "Indicative pricing before you commit.",
      addressesLabel: "Saved addresses",
      addressesDesc: "Pickup and drop-off contacts.",
      invoicesLabel: "Receipts & invoices",
      invoicesDesc: "Branded PDFs for every shipment.",
      supportLabel: "Logistics support",
      supportDesc: "Open a thread tagged to your account.",
    },
    spend: {
      figureAriaLabel: "Logistics spend over the last 6 months",
      emptyTick: "—",
    },
  },
  divisionStudio: {
    metadata: {
      title: "Studio · project rooms",
      description: "Track every HenryCo Studio engagement linked to this account — proposals, milestones, payments, deliverables, and activity in one room.",
    },
    hero: {
      eyebrowLive: "Studio · live",
      overviewAriaLabel: "Studio overview",
      activityAriaLabel: "Studio activity",
      sideAriaLabel: "How this room works",
      sideLabel: "How this room works",
      sideTitle: "One project room, real state.",
      sideBody: "Proposals, milestones, payment proofs, deliverables, and communication signals stay connected to the same HenryCo identity you use everywhere else. The dashboard below reflects the Studio team's actual progress, not a status list.",
      breakdownAriaLabel: "Activity breakdown",
      breakdownLabel: "By state",
      tiles: {
        activeLabel: "Active projects",
        activeFootEmpty: "No live workspaces right now",
        activeFootHasValue: "Live workspaces with delivery motion",
        pendingLabel: "Pending payments",
        pendingFootEmpty: "Commercial lane is clear",
        pendingFootHasValue: "Commercial checkpoints still open",
        proofLabel: "Proof submitted",
        proofFootEmpty: "Nothing awaiting review",
        proofFootHasValue: "Payments waiting on Studio review",
        deliverablesLabel: "Deliverables",
        deliverablesFootEmpty: "Files appear here as Studio uploads them",
        deliverablesFootHasValue: "Files and outputs tracked in one place",
      },
      breakdown: {
        active: "Active",
        readyReview: "Ready for review",
        pendingPayment: "Pending payment",
        proofSubmitted: "Proof submitted",
      },
      state: {
        empty: {
          headline: "Start a Studio brief.",
          blurb: "When a proposal or project goes live with your HenryCo identity, the synced Studio room appears here — milestones, payments, deliverables, and the next move all in one place.",
          ctaPrimary: "Start a brief",
          ctaSecondary: "Open Studio",
        },
        attention: {
          headlineTemplateSingular: "{count} overdue payment.",
          headlineTemplatePlural: "{count} overdue payments.",
          blurb: "A payment checkpoint is past due. Open the workspace to upload proof or contact the Studio team.",
          ctaPrimary: "Open payments",
          ctaSecondary: "Open Studio",
        },
        activeReady: {
          headlineTemplateSingular: "{count} project ready for review.",
          headlineTemplatePlural: "{count} projects ready for review.",
          blurb: "Deliverables and revisions are queued for your approval. Open the workspace to review and unblock the next milestone.",
          ctaPrimary: "Open projects",
          ctaSecondary: "Open Studio",
        },
        activeProjects: {
          headlineTemplateSingular: "{count} active project.",
          headlineTemplatePlural: "{count} active projects.",
          blurb: "Live workspaces with milestone movement, payment checkpoints, and deliverables — all mirrored from HenryCo Studio into this room.",
          ctaPrimary: "Open Studio",
          ctaSecondary: "Start a new brief",
        },
        calm: {
          headlineTemplateSingular: "{count} project room on record.",
          headlineTemplatePlural: "{count} project rooms on record.",
          blurb: "Every Studio engagement you have ever started — proposals, milestones, payments, deliverables — kept in one room for fast follow-up.",
          ctaPrimary: "Open Studio",
          ctaSecondary: "Start a new brief",
        },
      },
    },
    sections: {
      projectsTitle: "Project rooms",
      projectsAriaLabel: "Studio projects",
      projectsMetaEmpty: "Workspaces appear here when a Studio engagement goes live.",
      projectsMetaTemplateSingular: "{count} project · sorted by latest movement",
      projectsMetaTemplatePlural: "{count} projects · sorted by latest movement",
      paymentsTitle: "Payment checkpoints",
      paymentsAriaLabel: "Studio payments",
      paymentsMetaEmpty: "Studio payment requests appear here when a proposal or project is live.",
      paymentsMetaTemplateSingular: "{count} checkpoint · proof upload + approval status",
      paymentsMetaTemplatePlural: "{count} checkpoints · proof upload + approval status",
      activityTitle: "Recent activity",
      activityAriaLabel: "Studio activity",
      activityMetaEmpty: "Project updates, payment proofs, and milestone approvals mirror here.",
      activityMetaTemplateSingular: "{count} update · most recent first",
      activityMetaTemplatePlural: "{count} updates · most recent first",
    },
    empty: {
      projectsTitle: "No Studio workspaces linked yet",
      projectsBody: "As soon as a proposal or project is created with your HenryCo identity, the synced Studio room will appear here — milestones, payments, deliverables, and the next move.",
      paymentsTitle: "No payment checkpoints yet",
      paymentsBody: "Commercial milestones — deposit, mid-project, and delivery — surface here once a proposal goes live with you.",
      activityTitle: "No Studio activity yet",
      activityBody: "Project updates, payment proofs, deliverable releases, and milestone approvals will appear here as they happen.",
    },
    projects: {
      listAriaLabel: "Studio projects",
      fallbackSubtitle: "Studio is preparing the next update.",
      milestonesTemplate: "{approved}/{total} milestones",
      paymentsTemplateSingular: "{count} open payment",
      paymentsTemplatePlural: "{count} open payments",
      deliverablesTemplateSingular: "{count} deliverable",
      deliverablesTemplatePlural: "{count} deliverables",
      updatedTemplate: "Updated {stamp}",
      rowAriaLabelTemplate: "{title} · {kind}",
      fallbackStamp: "—",
    },
    projectKindLabels: {
      live: "Live",
      ready_review: "Ready for review",
      scheduled: "Scheduled",
      delivered: "Delivered",
      issue: "Action needed",
    },
    payments: {
      listAriaLabel: "Studio payments",
      rowAriaLabelTemplate: "{label} · {status}",
      dueTemplate: "Due {stamp}",
      updatedTemplate: "Updated {stamp}",
      subTemplate: "{amount} · {method} · {due}",
    },
    paymentStatusLabels: {
      pending: "pending",
      paid: "paid",
      approved: "approved",
      settled: "settled",
      proof_uploaded: "proof uploaded",
      proof_submitted: "proof submitted",
      in_review: "in review",
      rejected: "rejected",
      overdue: "overdue",
      failed: "failed",
      pending_deposit: "pending deposit",
    },
    activity: {
      listAriaLabel: "Studio activity",
      rowAriaLabelTemplate: "{title} · {stamp}",
    },
  },
  divisionLearn: {
    metadata: {
      title: "Learn · learning dashboard",
      description: "Track every HenryCo Learn enrollment, lesson, quiz result, certificate, assigned training, and teaching application linked to this account — catalog on Learn, progress mirrored here.",
    },
    hero: {
      ariaLabel: "Learn overview",
      eyebrow: "Learn · live",
      sideKicker: "How this room works",
      sideTitle: "Catalog on Learn, progress here.",
      sideBody: "Every lesson, quiz, and certificate from HenryCo Learn syncs into this room — pick up where you left off, see your progress at a glance, and keep credentials in one place.",
      breakdownLabel: "By state",
      breakdownAriaLabel: "Learning activity breakdown",
      tilesAriaLabel: "Learning activity",
      tileLabels: {
        active: "Active",
        completed: "Completed",
        certificates: "Certificates",
        assignments: "Assigned",
      },
      tileFoot: {
        activeEmpty: "Enroll to start a course",
        activeWith: "Lesson + quiz progress mirrors here",
        completedEmpty: "Programs you finish appear here",
        completedWith: "Handy for CVs and reporting",
        certificatesEmpty: "Earn one by completing a course",
        certificatesWith: "Verifiable links to each credential",
        assignmentsEmpty: "Nothing assigned right now",
        assignmentsWith: "From your manager or team",
      },
      breakdownNames: {
        active: "Active",
        assigned: "Assigned",
        certificates: "Certificates",
        saved: "Saved",
      },
      openLearnCta: "Open HenryCo Learn",
      applyToTeachCta: "Apply to teach",
      state: {
        empty: {
          headline: "Start your HenryCo Learn journey.",
          blurb: "Browse the catalog, enroll in a course, and every lesson, quiz, and certificate will sync into this room automatically.",
        },
        active: {
          headlineTemplateSingular: "{count} course in progress.",
          headlineTemplatePlural: "{count} courses in progress.",
          blurb: "Pick up where you left off — lessons, quizzes, certificates, and assigned training all sync from HenryCo Learn into this room.",
        },
        calm: {
          headlineTemplateSingular: "{count} course completed.",
          headlineTemplatePlural: "{count} courses completed.",
          blurb: "Your credentials and learning history stay here, handy for CVs, internal reporting, or your own records.",
        },
      },
    },
    sections: {
      coursesTitle: "Continue learning",
      coursesMetaEmpty: "Browse the HenryCo Learn catalog to enroll in your first course.",
      coursesMetaTemplate: "{active} active · {completed} completed",
      extrasTitle: "Credentials, assignments, and teaching",
      extrasMeta: "Certificates, assigned training, saved courses, and instructor application live here.",
      activityTitle: "Recent activity",
      activityMetaTemplateSingular: "{count} update · most recent first",
      activityMetaTemplatePlural: "{count} updates · most recent first",
      activityMetaEmpty: "Lessons, quizzes, certificates, and payments mirror here as they happen.",
    },
    empty: {
      coursesTitle: "No courses linked yet",
      coursesBody: "Browse the catalog on HenryCo Learn and enroll. Your place will appear here automatically.",
      activityTitle: "No Learn activity yet",
      activityBody: "Course progress, quiz results, certificate issuance, and payment receipts surface here as they happen.",
    },
    courses: {
      ariaLabel: "Courses",
      completedAtTemplate: "Completed {date}",
      progressPercentTemplate: "{percent}% complete",
      statusDelimiter: " · ",
    },
    extras: {
      ariaLabel: "Learn extras",
      certificatesTitle: "Certificates",
      assignmentsTitle: "Assigned learning",
      savedTitle: "Saved courses",
      teachingTitle: "Teach with HenryCo",
      statusLabel: "Status",
      expertiseLabel: "Expertise",
      topicsLabel: "Topics",
      openApplicationCta: "Open application",
      applyToTeachCta: "Apply to teach",
      teachingEmpty: "We review teaching applications manually. Apply on HenryCo Learn and status will sync back here.",
    },
    activity: {
      ariaLabel: "Learn activity",
      fallbackTitle: "Learn activity",
    },
  },
  settings: {
    pageTitle: "Settings & Preferences",
    pageDescription:
      "Manage your profile, communication preferences, privacy controls, and manual data request paths.",
    profileSectionKicker: "Profile Information",
    notificationsSectionKicker: "Notification Preferences",
  },
  addresses: {
    metadata: {
      title: "Addresses",
      description:
        "Manage your saved addresses (home, office, shop…) — used across delivery, bookings, and KYC verification.",
    },
    hero: {
      title: "Addresses",
      description:
        "Manage your saved addresses (home, office, shop…) — used across delivery, bookings, and KYC verification.",
    },
    card: {
      defaultBadge: "Default",
      kycVerifiedBadge: "KYC verified",
      setDefaultCta: "Set default",
      editCta: "Edit",
      deleteCta: "Delete",
      addressSeparator: ", ",
    },
    deleteConfirm: {
      prompt: "Delete this address? This cannot be undone.",
      confirmCta: "Delete",
      cancelCta: "Cancel",
    },
    empty: {
      body:
        "You haven't added any addresses yet. Add your first one to enable faster checkout across HenryCo.",
    },
    add: {
      cta: "Add address",
      formTitle: "Add a new address",
      editFormTitleTemplate: "Edit {label}",
      maxedNoticeTemplate:
        "You've added the maximum of {count} address types (home, office, shop, warehouse, alternative 1, alternative 2). Edit or delete one to add a different address.",
    },
  },
  search: {
    metadata: {
      title: "Search Account",
      description: "Search HenryCo account workflows and connected division routes.",
    },
    hero: {
      title: "Search your HenryCo workflows.",
      description:
        "Jump directly to exact account actions and connected division routes without falling back to generic dashboards.",
    },
    placeholder: "Search account: notifications, wallet, invoices, support, jobs applications...",
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
    smartHomeEmptyFallback:
      "Bienvenue — commencez par un petit premier pas. Vos signaux en direct apparaîtront ici dès qu’une activité sera enregistrée.",
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
    priorityFallback: { low: "Calme", normal: "Courant", high: "Élevée", urgent: "Urgente" },
    eyebrow: "File d’action · en direct",
    guidanceTitle: "Une file unique, toutes les divisions.",
    overviewAria: "Aperçu des tâches",
    volumeAria: "Volume de tâches",
    pendingAria: "Tâches en attente",
    sideAria: "Fonctionnement de la file",
    bySource: "Par source",
    openTotalLabel: "Total ouvert",
    nothingBlocking: "Rien ne bloque pour le moment",
    resolveBlockers: "Résolvez pour débloquer les autres voies",
    routine: "courantes",
    divisionRepresentedSingular: "{count} division représentée",
    divisionRepresentedPlural: "{count} divisions représentées",
    headlineEmpty: "Rien dans la file.",
    headlineBlockerSingular: "{count} blocage à lever.",
    headlineBlockerPlural: "{count} blocages à lever.",
    headlineUrgentSingular: "{count} tâche urgente à traiter.",
    headlineUrgentPlural: "{count} tâches urgentes à traiter.",
    headlineActiveSingular: "{count} tâche à traiter.",
    headlineActivePlural: "{count} tâches à traiter.",
    headlineCalmSingular: "{count} élément dans votre file.",
    headlineCalmPlural: "{count} éléments dans votre file.",
    blurbEmpty: "Votre compte est en ordre — vérification, paiements et voies sensibles aux revues sont tous clairs. Nous afficherons automatiquement la prochaine action ici dès qu’elle se présentera.",
    blurbRisk: "Ces éléments verrouillent les actions à haute confiance sur HenryCo — retraits du portefeuille, validation vendeur marketplace, vérification employeur. Les résoudre débloque chaque voie.",
    blurbActive: "Chaque ligne vous mène à la prochaine action en un seul geste. Filtres, étiquettes de priorité et liens profonds restent cohérents dans toutes les divisions HenryCo.",
    metaEmpty: "Tout est clair. Toute nouveauté apparaîtra ici dès son arrivée.",
    metaCount: "{count} en cours · triés par priorité et état bloquant.",
  },
  security: {
    title: "Sécurité",
    description:
      "Examinez l’activité de sécurité récente, modifiez votre mot de passe et terminez les sessions HenryCo si nécessaire.",
    heroAriaLabel: "Aperçu de la sécurité",
    hero: {
      trustScoreLabel: "Score de confiance",
      nextTierPrefix: "Suivant ·",
      nextTierAriaTemplate: "Palier suivant {tier}",
      accountActiveSingularTemplate: "Compte actif depuis {days} jour",
      accountActivePluralTemplate: "Compte actif depuis {days} jours",
      flaggedEventsSingularTemplate:
        "{count} événement signalé enregistré · à examiner ci-dessous",
      flaggedEventsPluralTemplate:
        "{count} événements signalés enregistrés · à examiner ci-dessous",
      statusEyebrow: {
        secure: "Sécurité et accès · sécurisé",
        watch: "Sécurité et accès · action recommandée",
        risk: "Sécurité et accès · risque signalé",
      },
      statusHeadline: {
        secure: "Votre compte est sécurisé.",
        watch:
          "Quelques actions suffiront à renforcer votre compte.",
        risk:
          "Nous avons signalé une activité qui mérite votre attention.",
      },
      statusBlurb: {
        secure:
          "Aucun événement suspect, la vérification est saine, et chaque action à plus forte confiance proposée par HenryCo vous est ouverte.",
        watch:
          "Rien n’est cassé — mais quelques signaux (confirmation d’e-mail, revue d’identité, contact en doublon) augmenteraient votre score de confiance et débloqueraient plus de voies.",
        risk:
          "Des événements récents ont été classés à risque élevé. Examinez le flux d’activité ci-dessous et changez votre mot de passe si quelque chose vous semble inhabituel.",
      },
    },
    signalsTitle: "Signaux",
    signalsMeta:
      "Ce que nos moteurs de vérification et de scoring voient actuellement sur votre compte.",
    signalsAriaLabel: "Signaux de sécurité",
    guideTitle: "Où vous en êtes · ce qui vous fait avancer",
    guideMetaTemplate:
      "Scoring honnête, pas un chiffre marketing. {tier}.",
    allLanesOpen: "Toutes les voies ouvertes",
    accountActionsTitle: "Actions du compte",
    accountActionsMeta: "Contrôles courants que vous maîtrisez directement.",
    changePasswordTitle: "Changer votre mot de passe",
    signOutEverywhereTitle: "Se déconnecter partout",
    suspiciousEventFoot:
      "Examinez le flux d’activité ci-dessous.",
    noSuspiciousEventFoot:
      "Rien de signalé sur la dernière fenêtre de revue.",
    activityAriaLabel: "Événements de sécurité récents",
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
  messages: {
    metadata: {
      title: "Messages · HenryCo",
      description:
        "Une seule boîte de réception pour le support, le marketplace, les emplois, le studio, le care, l’immobilier, la logistique et l’apprentissage.",
    },
    hero: {
      eyebrow: "HenryCo · boîte de réception unifiée",
      ariaLabel: "Aperçu de la boîte de réception",
      ariaTiles: "Volume de la boîte de réception",
      ariaSide: "Par portail",
      sideLabel: "Par portail",
      sideBody:
        "Chaque portail alimente cette boîte de réception unique. Support, commandes du marketplace, entretiens d’embauche, projets studio et réservations care apparaissent ici dans l’ordre chronologique.",
    },
    headlines: {
      zero: "Boîte de réception vide à travers HenryCo.",
      calmOne: "Un fil attend votre réponse.",
      calmMany: "{count} fils sont ouverts.",
      busy: "{unread} non lus · {open} ouverts dans vos portails.",
      overloaded: "{unread} non lus parmi {open} fils ouverts.",
    },
    blurbs: {
      zero: "Tout est acquitté à travers le support, le marketplace, les emplois, le studio, le care, l’immobilier, la logistique et l’apprentissage.",
      calm: "Une courte réponse maintenant ferme la boucle avant demain.",
      busy: "Touchez une ligne pour ouvrir le fil, ou filtrez un portail à la fois.",
      overloaded: "Parcourez les divisions une à une — les fils les plus récents en haut.",
    },
    tiles: {
      openLabel: "Ouverts",
      openFootEmpty: "Rien en cours",
      openFootActive: "Fils en attente d’action",
      unreadLabel: "Non lus",
      unreadFootEmpty: "Boîte de réception à jour",
      unreadFootActive: "Touchez une ligne pour ouvrir le fil",
      portalsLabel: "Portails",
      portalsFootEmpty: "Care, Marketplace, Studio, Jobs et plus",
      portalsFootSingular: "Une division active",
      portalsFootPlural: "{count} divisions représentées",
    },
    sideTitle: {
      empty: "Calme dans toutes les divisions",
      singular: "Une division a du trafic",
      plural: "{count} divisions actives",
    },
    section: {
      title: "Fils",
      ariaLabel: "Fils de la boîte de réception",
      metaEmpty: "Rien ici pour l’instant — chaque portail alimente cette boîte",
      metaSingular: "{count} fil",
      metaPlural: "{count} fils",
    },
    chips: {
      ariaLabel: "Filtrer la boîte de réception par portail",
      allThreads: "Tous les fils",
    },
    empty: {
      eyebrow: "Boîte calme",
      titleAll: "Rien ne vous attend.",
      titleFilter: "Pas encore de fils dans ce portail.",
      bodyAll:
        "Support, marketplace, emplois, studio, care, immobilier, logistique et apprentissage apparaissent ici — tout fil cross-portail s’ajoute à cette liste dès qu’il démarre.",
      bodyFilter:
        "Changez de filtre pour voir un autre portail, ou parcourez tous les fils pour confirmer qu’aucun n’est en attente.",
    },
    list: {
      unreadDotLabel: "Non lu",
      fallbackTime: "—",
    },
    divisionLabels: {
      support: "Support",
      marketplace: "Marketplace",
      jobs: "Emplois",
      studio: "Studio",
      care: "Care",
      property: "Immobilier",
      logistics: "Logistique",
      learn: "Apprentissage",
    },
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
  support: {
    metadata: {
      title: "Assistance",
      description: "Obtenez de l’aide pour n’importe quel service HenryCo.",
    },
    hero: {
      title: "Assistance",
      description: "Obtenez de l’aide pour n’importe quel service HenryCo.",
      newRequestCta: "Nouvelle demande",
    },
    summary: {
      openRequestsTemplate: "{count} demande(s) ouverte(s)",
      escalatedTemplate: "{count} escaladée(s)",
      escalationNote:
        "Chaque message est suivi. Si le triage signale un risque ou une urgence, l’équipe reçoit automatiquement une file prioritaire.",
    },
    quickHelp: {
      helpCenterLabel: "Centre d’aide",
      helpCenterDesc: "Parcourir les FAQ et les guides",
      contactLabel: "Nous contacter",
      contactDesc: "Assistance par e-mail ou téléphone",
      liveChatLabel: "Chat en direct",
      liveChatDesc: "Discutez avec notre équipe",
    },
    threads: {
      sectionKicker: "Vos demandes",
      emptyTitle: "Aucune demande d’assistance",
      emptyDescription:
        "Vous n’avez encore créé aucune demande d’assistance. Nous sommes là si vous avez besoin de quoi que ce soit.",
      createCta: "Créer une demande",
    },
    statusLabels: {
      open: "Ouverte",
      awaitingReply: "En attente de réponse",
      inProgress: "En cours",
      resolved: "Résolue",
      closed: "Clôturée",
    },
    priorityLabels: {
      low: "Faible",
      normal: "Normale",
      high: "Élevée",
      urgent: "Urgente",
    },
  },
  payments: {
    hero: {
      title: "Moyens de paiement",
      description: "Gérez vos options de paiement enregistrées pour un paiement rapide.",
      addMethodCta: "Ajouter un moyen",
    },
    empty: {
      title: "Aucun moyen de paiement",
      description:
        "Ajoutez une carte bancaire, un compte bancaire ou un autre moyen de paiement pour passer rapidement à la caisse dans tous les services HenryCo.",
      cta: "Ajouter un moyen de paiement",
    },
    card: {
      savedMethodFallback: "Moyen enregistré",
      cardLastFourTemplate: "•••• {last4}",
    },
    wallet: {
      eyebrow: "Portefeuille HenryCo",
      body: "Votre portefeuille HenryCo est toujours disponible comme moyen de paiement.",
      manageCta: "Gérer le portefeuille",
    },
  },
  savedItems: {
    metadata: {
      title: "Articles enregistrés",
      description:
        "Articles mis de côté depuis n’importe quel panier HenryCo, conservés 90 jours avec un avertissement une semaine avant l’expiration.",
    },
    hero: {
      title: "Enregistrés pour plus tard",
      description:
        "Les articles que vous avez mis de côté depuis vos paniers HenryCo. Nous les gardons 90 jours et vous prévenons une semaine avant leur expiration.",
    },
    summary: {
      activeTemplate: "{count} actif·s",
      expiredTemplate: "{count} expiré·s",
      expiryNote:
        "Les articles expirent 90 jours après leur enregistrement. Nous vous prévenons une semaine à l’avance.",
      savedTemplate: "{count} enregistré·s",
    },
    toolbar: {
      showLabel: "Afficher",
      allDivisions: "Toutes les divisions",
      sortLabel: "Trier",
      sortNewest: "Plus récents d’abord",
      sortOldest: "Plus anciens d’abord",
      sortExpiring: "Expirant bientôt",
    },
    selection: {
      selectedTemplate: "{count} sélectionné·s",
      clear: "Effacer",
      moving: "Transfert…",
      moveSelectedToCart: "Déplacer la sélection vers le panier",
      selectAllOnPage: "Tout sélectionner sur cette page",
    },
    empty: {
      title: "Rien d’enregistré pour l’instant",
      description:
        "Quand vous trouvez un article que vous n’êtes pas prêt à acheter, enregistrez-le depuis le panier. Nous conservons le prix vu à ce moment-là et vous prévenons une semaine avant son expiration.",
      browseCta: "Parcourir",
    },
    card: {
      deselectItem: "Désélectionner l’article",
      selectItem: "Sélectionner l’article",
      savedItemFallback: "Article enregistré",
      expiresToday: "Expire aujourd’hui",
      expiresInTemplate: "Expire dans {days} jour{plural}",
      expiredNotice: "Expiré — la restauration réinitialise la fenêtre de 90 jours",
      moveToCart: "Déplacer vers le panier",
      moving: "Transfert…",
      removeFromSaved: "Retirer des articles enregistrés",
      openOriginal: "Ouvrir l’annonce d’origine",
    },
    expired: {
      sectionKicker: "Expirés récemment",
      sectionNote: "Restaurer réinitialise la fenêtre de 90 jours.",
    },
  },
  documents: {
    metadata: {
      title: "Documents",
      description:
        "Vos reçus, certificats, contrats et fichiers importants — conservés en privé et accessibles dans toutes les divisions HenryCo.",
    },
    hero: {
      eyebrow: "Coffre personnel",
      title: "Documents",
      body: "Vos reçus, certificats, contrats et fichiers importants.",
    },
    toolbar: {
      uploadCta: "Téléverser un document",
      filterLabel: "Filtrer",
      allCategories: "Toutes les catégories",
      sortLabel: "Trier",
      sortNewest: "Plus récents d’abord",
      sortOldest: "Plus anciens d’abord",
    },
    types: {
      document: "Document",
      receipt: "Reçu",
      certificate: "Certificat",
      id_document: "Pièce d’identité",
      contract: "Contrat",
      other: "Autre",
    },
    categories: {
      all: "Tous",
      document: "Documents",
      receipt: "Reçus",
      certificate: "Certificats",
      id_document: "Pièces d’identité",
      contract: "Contrats",
      other: "Autres",
    },
    card: {
      uploadedOnTemplate: "Téléversé le {date}",
      sizeTemplate: "{size}",
      downloadLabel: "Télécharger",
      noFileAttached: "Aucun fichier joint",
      openOriginal: "Ouvrir le document",
    },
    empty: {
      title: "Aucun document pour le moment",
      description:
        "Vos documents, reçus et certificats issus des services HenryCo seront stockés ici.",
    },
    summary: {
      countTemplate: "{count} document{plural}",
      filteredTemplate: "{count} sur {total} affichés",
    },
    retention: {
      eyebrow: "Confidentialité et conservation",
      title: "Vos fichiers restent privés",
      body: "Les documents sont chiffrés au repos, visibles uniquement par vous et conservés pendant toute la durée de vie de votre compte HenryCo sauf si vous les supprimez.",
    },
  },
  subscriptions: {
    metadata: {
      title: "Abonnements",
      description:
        "Récapitulatif en lecture seule des forfaits actifs synchronisés depuis les divisions HenryCo.",
    },
    hero: {
      eyebrow: "Forfaits actifs",
      title: "Abonnements",
      description:
        "Récapitulatif en lecture seule des forfaits, transmis par les divisions qui synchronisent leurs abonnements vers le hub de compte partagé.",
    },
    empty: {
      title: "Aucun abonnement synchronisé pour le moment",
      description:
        "Cela peut signifier que vous n’avez aucun forfait actif, ou que la division n’a pas encore publié ses abonnements dans le registre partagé du compte.",
    },
    card: {
      planFallback: "Forfait d’abonnement",
      tierSeparator: " · ",
      amountLabel: "Montant",
      cycleLabel: "Fréquence",
      renewsLabel: "Renouvelle",
      renewsFallback: "—",
    },
    statusLabels: {
      active: "Actif",
      paused: "En pause",
      cancelled: "Annulé",
      expired: "Expiré",
      past_due: "Échu",
      trialing: "Période d’essai",
      grace: "Délai de grâce",
      pending: "En attente",
      unknown: "Inconnu",
    },
    cycleLabels: {
      monthly: "Mensuel",
      yearly: "Annuel",
      annual: "Annuel",
      quarterly: "Trimestriel",
      weekly: "Hebdomadaire",
      biweekly: "Toutes les 2 semaines",
      daily: "Quotidien",
      one_time: "Paiement unique",
      notSet: "Non défini",
    },
    cta: {
      upgrade: "Passer à un forfait supérieur",
      downgrade: "Passer à un forfait inférieur",
      cancel: "Annuler l’abonnement",
      manage: "Gérer dans la division",
      resume: "Reprendre l’abonnement",
    },
    paymentIssue: {
      title: "Paiement à régulariser",
      description:
        "Nous n’avons pas pu prélever le dernier renouvellement. Mettez à jour votre moyen de paiement pour garder cet abonnement actif.",
      updatePaymentCta: "Mettre à jour le moyen de paiement",
    },
    summary: {
      activeTemplate: "{count} actif·s",
      pausedTemplate: "{count} en pause",
      totalTemplate: "{count} forfait·s",
    },
  },
  referrals: {
    metadata: {
      title: "Parrainages",
      description:
        "Invitez des clients qualifiés sur HenryCo et suivez les récompenses à travers les états en attente, vérifiés et crédités.",
    },
    hero: {
      title: "Parrainages",
      description:
        "Invitez des clients qualifiés sur HenryCo et suivez les récompenses à travers les états en attente, vérifiés et crédités.",
    },
    code: {
      eyebrow: "Votre code de parrainage",
      shareLinkLabel: "Lien de partage",
      copyCodeTitle: "Copier le code",
      copyLinkTitle: "Copier le lien",
      copyLinkLabel: "Copier le lien",
      copiedToast: "Copié !",
      rewardNote:
        "Récompense : {amount} par parrainage qualifié. Les récompenses sont débloquées après que le filleul a finalisé une commande payée dans la fenêtre de blocage de {days} jours.",
    },
    stats: {
      totalReferred: "Total parrainé",
      signedUp: "Inscrits",
      qualified: "Qualifiés",
      flagged: "Signalés",
      pendingRewards: "Récompenses en attente",
      releasedRewards: "Récompenses débloquées",
    },
    howItWorks: {
      eyebrow: "Comment ça marche",
      step1Title: "Partagez votre code",
      step1Body:
        "Partagez votre code ou lien unique. Les amis qui visitent un sous-domaine HenryCo avec votre lien sont suivis automatiquement.",
      step2Title: "Ils effectuent une transaction",
      step2Body:
        "Après inscription, le parrainage entre dans une fenêtre de blocage de {days} jours. Nous suivons le compte parrainé une seule fois — les auto-parrainages, doublons de foyer et inscriptions recyclées ne se qualifient pas.",
      step3Title: "Les récompenses se libèrent après qualification",
      step3Body:
        "Les parrainages qualifiés créditent {amount} sur votre portefeuille HenryCo après contrôle financier. Les récompenses en attente ne sont pas dépensables avant validation.",
    },
    policy: {
      eyebrow: "Politique de parrainage",
      qualifying:
        "Une conversion qualifiante signifie que le compte parrainé a réalisé une action HenryCo éligible qui a passé la vérification de paiement et de confiance.",
      enforcement:
        "HenryCo peut suspendre, annuler ou révoquer les récompenses en cas d’auto-parrainages, de boucles de conversion en doublon, d’annulations, de remboursements ou de schémas de récompenses suspects.",
      separation:
        "Votre tableau de bord présente les parrainages et l’historique des récompenses séparément afin que les inscriptions suivies ne soient pas confondues avec les gains crédités au portefeuille.",
    },
    referralsList: {
      eyebrow: "Vos parrainages",
      emptyTitle: "Aucun parrainage pour l’instant",
      emptyDescription:
        "Partagez votre code de parrainage pour commencer à inviter. Les parrainages apparaîtront ici dès que quelqu’un s’inscrit avec votre lien.",
      refereeFallback: "Inscription parrainée",
      signedUpTemplate: "Inscrit le {date}",
      qualifiedTemplate: "Qualifié le {date}",
    },
    statusLabels: {
      pending: "En attente d’inscription",
      converted: "Inscrit · période de blocage",
      qualified: "Qualifié · récompense débloquée",
      flagged: "Signalé · contrôle anti-fraude",
      expired: "Expiré",
    },
    flagReasons: {
      selfReferral: "Auto-parrainage bloqué",
      duplicateEmail: "E-mail de filleul en doublon",
      deviceReuse: "Réutilisation d’appareil",
    },
    rewards: {
      eyebrow: "Historique des récompenses",
      emptyTitle: "Aucune récompense pour l’instant",
      emptyDescription:
        "Les récompenses créditées apparaîtront ici après que les conversions qualifiées auront passé la vérification et le contrôle anti-abus.",
      referralRewardFallback: "Récompense de parrainage",
      paidTemplate: "Payé le {date}",
      statusLabels: {
        held: "Bloqué",
        pending: "En attente",
        released: "Débloqué",
        paid: "Payé",
        cancelled: "Annulé",
      },
    },
  },
  divisionCare: {
    metadata: {
      title: "Care · réservations liées",
      description: "Suivez chaque réservation HenryCo Care liée à ce compte — statut, vérification du paiement et prochaine étape opérationnelle au même endroit.",
    },
    hero: {
      eyebrow: "Care · en direct",
      sideKicker: "Comment cette pièce fonctionne",
      sideTitle: "Réservez sur Care, suivez ici.",
      sideBody: "Chaque réservation faite sur HenryCo Care est miroitée dans cette pièce — code de suivi, statut du paiement et prochaine étape opérationnelle y arrivent automatiquement. Le tableau de bord ci-dessous reste synchronisé pendant le service.",
      breakdownLabel: "Par statut",
      tilesAriaLabel: "Résumé des réservations Care",
      tileLabels: {
        total: "Réservations",
        inFlight: "En cours",
        payment: "Paiement à vérifier",
        completed: "Terminées",
      },
      tileFoot: {
        totalEmpty: "Réservez votre premier service Care",
        totalWithTemplate: "{count} lié·e·s à ce compte",
        inFlightEmpty: "Rien d’actif pour le moment",
        inFlightWith: "Statut en direct ci-dessous",
        paymentEmpty: "Aucune vérification de paiement en attente",
        paymentWith: "Soumettre ou vérifier le reçu ci-dessous",
        completedEmpty: "Aucune prestation terminée pour le moment",
        completedWith: "Marquées comme terminées par Care",
      },
      breakdownLabels: {
        inFlight: "En cours",
        scheduled: "Planifiées",
        payment: "Paiement à vérifier",
        completed: "Terminées",
      },
      state: {
        empty: {
          headline: "Réservez votre première prestation Care.",
          blurb: "Les services Care que vous réservez ici se synchronisent automatiquement dans cette pièce — code de suivi, paiement et prochaine étape opérationnelle.",
          ctaPrimary: "Réserver un service",
          ctaSecondary: "Ouvrir le suivi",
        },
        attention: {
          headlineTemplateSingular: "{count} action à mener.",
          headlineTemplatePlural: "{count} actions à mener.",
          blurb: "Une ou plusieurs réservations attendent une preuve de paiement ou un suivi. Ouvrez la réservation concernée ci-dessous.",
          ctaPrimary: "Voir les réservations",
          ctaSecondary: "Ouvrir le suivi",
        },
        active: {
          headlineTemplateSingular: "{count} prestation en cours.",
          headlineTemplatePlural: "{count} prestations en cours.",
          blurb: "Suivi en direct, paiement vérifié et prochaine étape opérationnelle miroirés depuis HenryCo Care dans cette pièce.",
          ctaPrimary: "Ouvrir le suivi",
          ctaSecondary: "Réserver un service",
        },
        calm: {
          headlineTemplateSingular: "{count} réservation liée.",
          headlineTemplatePlural: "{count} réservations liées.",
          blurb: "Vos réservations Care, codes de suivi, reçus et prochaines actions réunis au même endroit — synchronisés en temps réel.",
          ctaPrimary: "Réserver un service",
          ctaSecondary: "Ouvrir le suivi",
        },
      },
    },
    sections: {
      glance: "Prochaine action",
      glanceMeta: "La réservation la plus urgente est mise en avant ici.",
      bookings: "Toutes les réservations",
      bookingsEmpty: "Les réservations faites en étant connecté apparaissent ici en temps réel.",
      bookingsMetaTemplateSingular: "{count} réservation · filtrer, paginer et ouvrir le détail en direct.",
      bookingsMetaTemplatePlural: "{count} réservations · filtrer, paginer et ouvrir le détail en direct.",
      activity: "Activité récente",
      activityEmpty: "Mises à jour de statut, reçus et avis apparaissent ici dès qu’ils se produisent.",
      activityMetaTemplateSingular: "{count} mise à jour · plus récente en premier",
      activityMetaTemplatePlural: "{count} mises à jour · plus récentes en premier",
    },
    empty: {
      title: "Aucune réservation Care liée pour le moment",
      body: "Les réservations faites sur Care en étant connecté apparaîtront ici immédiatement. Les anciennes réservations apparaîtront aussi une fois que leur e-mail ou téléphone correspondra à votre profil partagé.",
    },
    glance: {
      nextActionLabel: "Prochaine action",
      serviceLabel: "Service",
      pickupLabel: "Enlèvement",
      balanceLabel: "Solde dû",
      trackingLabel: "Suivi",
      serviceFallback: "Service Care",
    },
    activityAriaLabel: "Activité Care",
    status: {
      live: "En cours",
      scheduled: "Planifiée",
      completed: "Terminée",
      issue: "Action requise",
      payment: "Paiement à vérifier",
    },
    statusValueLabels: {
      booked: "Réservé",
      awaiting_payment: "Paiement attendu",
      receipt_submitted: "Reçu envoyé",
      under_review: "En revue",
      delivered: "Livré",
      customer_confirmed: "Confirmé par le client",
      inspection_completed: "Inspection terminée",
      service_completed: "Service terminé",
      cancelled: "Annulé",
      issue: "Incident",
      exception: "Exception",
      rejected: "Rejeté",
    },
    formatLabels: {
      toBeScheduled: "À planifier",
      shortMonths: ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."],
    },
    dashboard: {
      filters: {
        all: "Tout",
        unpaid: "Solde dû",
        receipt: "Reçu / revue",
        active: "En cours",
        completed: "Terminées",
        issue: "Incidents",
      },
      filtered: "filtré",
      bookingSingular: "réservation",
      bookingPlural: "réservations",
      metrics: {
        visible: "Réservations visibles",
        visibleHint: "Vraies réservations Care liées à ce compte.",
        balance: "Solde restant",
        balanceHintSomeTemplate: "{count} réservation(s) demandent encore un suivi de paiement.",
        balanceHintNone: "Aucun solde Care impayé n’est ouvert pour le moment.",
        receiptQueue: "File des reçus",
        receiptQueueHintSome: "Des réservations avec reçu envoyé attendent encore une vérification.",
        receiptQueueHintNone: "Aucun retard de vérification de reçu n’est lié à ce compte.",
        completed: "Terminées",
        completedHintSome: "Des réservations terminées peuvent maintenant passer au suivi d’avis.",
        completedHintNone: "Les réservations Care terminées apparaîtront ici à la fin du service.",
      },
      linkedBookings: "Réservations Care liées",
      linkedBookingsDescription: "Vos réservations Care, leur statut de paiement et les prochaines actions.",
      onThisPage: "sur cette page",
      selectedBooking: "Réservation sélectionnée",
      paymentSnapshot: "Aperçu du paiement",
      receiptVisibility: "Visibilité du reçu",
      nextBestAction: "Meilleure action suivante",
      serviceSummary: "Résumé du service",
      serviceFallback: "Service Care",
      addressPending: "Adresse en attente",
      updated: "Mis à jour",
      balanceDue: "Solde dû",
      nextMove: "Prochaine action",
      paginationLabel: "Pagination des réservations Care",
      pageLabel: "Page",
      of: "sur",
      perPage: "par page",
      previous: "Précédent",
      next: "Suivant",
      customerFallback: "Client",
      scheduledDate: "Date prévue",
      notScheduled: "Pas encore planifié",
      timeWindow: "Créneau horaire",
      windowPending: "Créneau en attente",
      pickupAddress: "Adresse de collecte",
      returnAddress: "Adresse de retour / livraison",
      returnAddressFallback: "Utilise l’adresse de collecte sauf modification pendant la réservation",
      trackingCode: "Code de suivi",
      quotedTotal: "Total estimé",
      amountRecorded: "Montant enregistré",
      receiptState: "État du reçu",
      receiptsSubmitted: "Reçus envoyés",
      lastSubmission: "Dernier envoi",
      noReceiptYet: "Aucun reçu pour le moment",
      openLiveBooking: "Ouvrir la réservation en direct",
      leaveReview: "Laisser un avis",
    },
  },
  divisionProperty: {
    metadata: {
      title: "Property · favoris et demandes",
      description: "Votre sélection Property, vos demandes, vos visites et le suivi de vos annonces — chaque action sur HenryCo Property se reflète dans cette pièce du compte.",
    },
    hero: {
      eyebrow: "Property · en direct",
      ariaLabel: "Vue d’ensemble Property",
      browseListingsCta: "Parcourir les annonces",
      savedShortlistCta: "Favoris",
      tilesAriaLabel: "Activité Property",
      tileLabels: {
        saved: "Favoris",
        inquiries: "Demandes",
        viewings: "Visites",
        listings: "Annonces",
      },
      tileFoot: {
        savedManagedTemplate: "{count} gérée·s par HenryCo",
        savedEmpty: "Enregistrez des annonces pour bâtir une sélection",
        savedWith: "Comparez et revenez quand vous voulez",
        inquiriesEmpty: "Aucune conversation en cours",
        inquiriesWith: "Les suivis arrivent dans cette pièce",
        viewingsEmpty: "Demandez une visite pour un bien enregistré",
        viewingsWith: "Les confirmations se synchronisent partout",
        listingsEmpty: "Soumettez une annonce sur Property",
        listingsWith: "Les décisions de modération arrivent ici",
      },
      sideAriaLabel: "Comment cette pièce fonctionne",
      sideKicker: "Comment cette pièce fonctionne",
      sideTitle: "Découvrez sur Property, suivez ici.",
      sideBody:
        "Enregistrez une annonce, demandez une visite ou ouvrez une demande sur HenryCo Property — chaque action se reflète dans cette pièce du compte pour reprendre là où vous en étiez, sur tous vos appareils.",
      sideBodyMuted:
        "Les annonces gérées par HenryCo portent un badge Géré — vérifications, inspections et suivis de bail sont coordonnés par l’équipe Property.",
      breakdownAriaLabel: "Détail d’activité",
      breakdownLabel: "Par activité",
      breakdownLabels: {
        saved: "Favoris",
        inquiries: "Demandes",
        viewings: "Visites",
        listings: "Annonces",
      },
      state: {
        empty: {
          headline: "Commencez à explorer HenryCo Property.",
          blurb:
            "Découvrez les locations résidentielles, les ventes et les biens gérés par HenryCo. Enregistrez vos favoris et chaque demande, visite ou suivi d’annonce arrive ici automatiquement.",
        },
        discover: {
          headlineTemplateSingular: "{count} bien dans la sélection.",
          headlineTemplatePlural: "{count} biens dans la sélection.",
          blurb:
            "Vos biens enregistrés, prêts à être revus. Ouvrez une annonce pour demander une visite ou envoyer une demande — le suivi reviendra directement dans cette pièce.",
        },
        active: {
          viewingHeadlineTemplateSingular: "{count} visite planifiée.",
          viewingHeadlineTemplatePlural: "{count} visites planifiées.",
          inquiryHeadlineTemplateSingular: "{count} demande en cours.",
          inquiryHeadlineTemplatePlural: "{count} demandes en cours.",
          blurb:
            "Vos favoris, demandes et planning de visites vivent dans une seule pièce. Reprenez là où vous en étiez — chaque action est reflétée depuis HenryCo Property en temps réel.",
        },
      },
    },
    sections: {
      saved: "Sélection enregistrée",
      savedMetaEmpty: "Enregistrez des annonces sur HenryCo Property pour bâtir votre sélection.",
      savedMetaTemplate: "{saved} enregistré·s · {managed} géré·s par HenryCo",
      activity: "Activité récente",
      activityMetaEmpty: "Demandes, visites et examens d’annonces se reflètent ici en temps réel.",
      activityMetaTemplateSingular: "{count} mise à jour · plus récente en premier",
      activityMetaTemplatePlural: "{count} mises à jour · plus récente en premier",
    },
    empty: {
      savedTitle: "Aucun bien enregistré pour le moment",
      savedBody:
        "Découvrez les locations résidentielles, les ventes et les biens gérés par HenryCo sur Property. Tout ce que vous enregistrez arrive ici automatiquement.",
      activityTitle: "Aucune activité Property pour le moment",
      activityBody:
        "Ouvrez une annonce sur HenryCo Property pour demander une visite ou envoyer une demande — chaque étape, du premier message à la revue, apparaîtra ici.",
    },
    activity: {
      ariaLabel: "Activité Property",
      titles: {
        inquiry: "Demande immobilière",
        viewing: "Demande de visite",
        listing_submitted: "Annonce soumise",
        listing_updated: "Annonce mise à jour",
        listing_reviewed: "Examen d’annonce terminé",
      },
    },
    gallery: {
      ariaLabel: "Biens enregistrés",
      managedBadge: "Géré",
      featuredBadge: "À la une",
      locationPending: "Localisation à venir",
      contactAgent: "Contacter l’agent",
      savedAtTemplate: "Enregistré le {date}",
      bedSingular: "chambre",
      bedPlural: "chambres",
      bathSingular: "salle de bain",
      bathPlural: "salles de bain",
      sizeSqmTemplate: "{size} m²",
    },
  },
  divisionMarketplace: {
    metadata: {
      title: "Marketplace · commandes et activité vendeur",
      description: "Suivez chaque commande, litige et versement vendeur HenryCo Marketplace lié à ce compte — activité d’achat et espace vendeur, miroirés dans une seule pièce en temps réel.",
    },
    hero: {
      eyebrow: "Marketplace · en direct",
      ariaLabel: "Vue d’ensemble Marketplace",
      sideAriaLabel: "Comment cette pièce fonctionne",
      sideKicker: "Comment cette pièce fonctionne",
      sideTitle: "Acheter et vendre — une seule pièce.",
      sideBody: "Chaque commande, litige et demande de versement créés sur Marketplace est miroité dans cette pièce. L’activité de l’espace vendeur s’y entremêle avec les commandes acheteur, pour que les deux faces du marketplace restent visibles d’un coup d’œil.",
      breakdownLabel: "Par statut",
      breakdownAriaLabel: "Répartition de l’activité",
      tilesAriaLabel: "Activité Marketplace",
      tileLabels: {
        orders: "Commandes",
        disputes: "Litiges",
        store: "Boutique",
        payouts: "Versements",
      },
      tileFoot: {
        ordersEmpty: "La première commande apparaîtra ici",
        ordersInMotionTemplate: "{inFlight} en cours · {delivered} livrée(s)",
        ordersDeliveredTemplate: "{delivered} livrée(s) à ce jour",
        disputesClear: "Tout est clair",
        disputesActiveTemplate: "{open} ouvert(s) · {resolving} en résolution",
        storeActiveNoName: "Adhésion vendeur active",
        storeActiveWithNameTemplate: "Boutique : {name}",
        storeApplicationTemplate: "Candidature : {status}",
        storeIdle: "Pas encore vendeur — postulez quand vous êtes prêt·e",
        payoutsEmptyNoneSettled: "Aucune demande de versement",
        payoutsSettledTemplate: "{count} versé(s) à ce jour",
        payoutsPendingTemplate: "{amount} en attente",
      },
      breakdownLabels: {
        inMotion: "En cours",
        openDisputes: "Litiges ouverts",
        delivered: "Livrées",
        pendingPayouts: "Versements en attente",
      },
      state: {
        empty: {
          headline: "Commencez à acheter sur HenryCo Marketplace.",
          blurb: "Les commandes, litiges, activité vendeur et versements sont miroirés dans cette pièce dès la première transaction. Parcourez la marketplace pour démarrer.",
          ctaPrimary: "Ouvrir Marketplace",
          ctaSecondary: "Devenir vendeur",
        },
        attention: {
          headlineTemplateSingular: "{count} sujet à traiter.",
          headlineTemplatePlural: "{count} sujets à traiter.",
          blurb: "Les litiges et commandes en exception passent en tête de file. Ouvrez le dossier pour ajouter des preuves ou accepter la résolution.",
          ctaPrimary: "Voir les dossiers",
          ctaSecondary: "Ouvrir Marketplace",
        },
        activeOrders: {
          headlineTemplateSingular: "{count} commande en cours.",
          headlineTemplatePlural: "{count} commandes en cours.",
          blurb: "Statut en direct, paiement, et suivi vendeur sont miroirés dans cette pièce depuis HenryCo Marketplace en temps réel.",
          ctaPrimary: "Ouvrir Marketplace",
          ctaSecondary: "Devenir vendeur",
        },
        activePayouts: {
          headlineTemplateSingular: "{count} versement en revue.",
          headlineTemplatePlural: "{count} versements en revue.",
          blurb: "Les demandes de versement vendeur passent par la vérification finance. Les mises à jour de statut s’affichent ici au fur et à mesure.",
          ctaPrimary: "Ouvrir l’espace vendeur",
          ctaSecondary: "Ouvrir Marketplace",
        },
        calmBuyer: {
          headlineTemplateSingular: "{count} commande enregistrée.",
          headlineTemplatePlural: "{count} commandes enregistrées.",
          blurb: "Toute votre activité marketplace dans une seule pièce — commandes acheteur, versements vendeur, issues de litiges et dernier statut de chaque boutique.",
          ctaPrimary: "Ouvrir Marketplace",
          ctaSecondary: "Devenir vendeur",
        },
        calmSeller: {
          headlineTemplateSingular: "{count} commande · vendeur actif.",
          headlineTemplatePlural: "{count} commandes · vendeur actif.",
          blurb: "Toute votre activité marketplace dans une seule pièce — commandes acheteur, versements vendeur, issues de litiges et dernier statut de chaque boutique.",
          ctaPrimary: "Ouvrir Marketplace",
          ctaSecondary: "Ouvrir l’espace vendeur",
        },
      },
    },
    sections: {
      matters: {
        title: "Sujets actifs",
        meta: "Litiges, statut de la candidature vendeur et versements en attente apparaissent ici dès qu’une action est requise.",
        ariaLabel: "Sujets Marketplace actifs",
        emptyTitle: "Rien ne requiert d’action",
        emptyBody: "Toute votre activité marketplace avance normalement — aucun litige ouvert, aucun versement en revue, et (le cas échéant) votre candidature vendeur est validée.",
      },
      orders: {
        title: "Commandes récentes",
        empty: "Les commandes passées sur Marketplace apparaissent ici en temps réel.",
        metaTemplateSingular: "{count} commande · plus récente en premier",
        metaTemplatePlural: "{count} commandes · plus récentes en premier",
        emptyTitle: "Aucune commande pour l’instant",
        emptyBody: "Passez votre première commande sur HenryCo Marketplace — statut, paiement et tout suivi atterrissent ici automatiquement.",
        ariaLabel: "Commandes récentes",
      },
      activity: {
        title: "Activité récente",
        empty: "Mises à jour de statut, paiements et avis se reflètent ici dès qu’ils se produisent.",
        metaTemplateSingular: "{count} mise à jour · plus récente en premier",
        metaTemplatePlural: "{count} mises à jour · plus récentes en premier",
        emptyTitle: "Aucune activité marketplace pour l’instant",
        emptyBody: "Confirmations de commande, mises à jour de litige et résultats de versement vendeur apparaîtront ici en temps réel.",
        ariaLabel: "Activité Marketplace",
      },
    },
    matters: {
      disputes: {
        kicker: "Litiges",
        titleTemplateSingular: "{count} dossier à traiter",
        titleTemplatePlural: "{count} dossiers à traiter",
        bodyLatestTemplate: "Dernier : {ref} · mis à jour {stamp}",
        bodyFallback: "Ouvrez la file pour ajouter des preuves.",
        cta: "Voir les dossiers",
      },
      application: {
        kicker: "Candidature vendeur",
        bodyWithStoreTemplate: "Boutique : {name}",
        bodyDefault: "Candidature dans la file de revue HenryCo.",
        bodyReviewSuffixTemplate: " · {note}",
        cta: "Voir le statut",
        defaultStatus: "soumise",
      },
      payouts: {
        kicker: "Versements en revue",
        titleTemplate: "{amount} en attente",
        bodyTemplateSingular: "{count} demande en attente de vérification finance.",
        bodyTemplatePlural: "{count} demandes en attente de vérification finance.",
        cta: "Ouvrir l’espace vendeur",
      },
    },
    orders: {
      rowTitleTemplate: "Commande {orderNo}",
      rowSubTemplate: "{amount} · passée {stamp}",
      rowAriaLabelTemplate: "Commande {orderNo} · {status}",
      statusFallbackDraft: "Brouillon",
    },
    statusValueLabels: {
      delivered: "Livré",
      completed: "Terminé",
      customer_confirmed: "Confirmé par le client",
      fulfilled: "Honoré",
      cancelled: "Annulé",
      refunded: "Remboursé",
      disputed: "En litige",
      exception: "Exception",
      placed: "Passée",
      paid: "Payée",
      awaiting_fulfilment: "En attente d’expédition",
      confirmed: "Confirmée",
      queued: "En file",
    },
    applicationStatusLabels: {
      submitted: "soumise",
      under_review: "en cours d’examen",
      approved: "approuvée",
      rejected: "rejetée",
      pending_documents: "documents requis",
      changes_requested: "modifications demandées",
    },
    formatLabels: {
      dash: "—",
    },
  },
  divisionJobs: {
    metadata: {
      title: "Emplois · tableau de bord candidat",
      description: "Suivez chaque candidature HenryCo Jobs, poste sauvegardé, mise à jour recruteur et indicateur de préparation de profil lié à ce compte.",
    },
    header: {
      title: "Emplois",
      description: "Vos candidatures, postes sauvegardés, mises à jour recruteurs et solidité de profil — tout au même endroit.",
      candidateModuleCta: "Module candidat",
      interviewRoomsCta: "Salles d’entretien",
      browseLiveRolesCta: "Parcourir les postes en ligne",
    },
    hero: {
      eyebrow: "Votre compte",
      headline: "Votre activité emploi, tout au même endroit.",
      body: "Candidatures, postes sauvegardés, mises à jour recruteurs et préparation de profil sont liés à votre compte HenryCo.",
      statsAriaLabel: "Résumé d’activité emploi",
      statLabels: {
        applications: "Candidatures actives",
        saved: "Postes sauvegardés",
        readiness: "Préparation du profil",
        updates: "Mises à jour recruteurs",
      },
      statDetails: {
        applicationsLeadingTemplate: "{stage} est votre étape active dominante.",
        applicationsEmpty: "Aucune candidature active pour l’instant.",
        savedSome: "Votre présélection est prête pour une nouvelle relecture.",
        savedEmpty: "Constituez une présélection pour retrouver plus facilement les bons postes.",
        updatesLatestTemplate: "{relative} dernier mouvement.",
        updatesEmpty: "Aucune mise à jour recruteur pour l’instant.",
      },
    },
    sections: {
      nextActionsKicker: "Prochaines actions",
      nextActionsTitle: "Ce qui mérite votre attention maintenant",
      openTimelineCta: "Ouvrir la chronologie",
      applicationsKicker: "Candidatures",
      applicationsTitle: "Mouvement d’embauche en direct",
      savedKicker: "Postes sauvegardés",
      savedTitle: "Présélection avec plus de contexte",
      openSavedRolesCta: "Ouvrir les postes sauvegardés",
      recommendedKicker: "Postes recommandés",
      recommendedTitle: "Ce qui correspond à votre signal actuel",
      browseCatalogCta: "Parcourir le catalogue",
      recruiterFeedKicker: "Fil recruteur",
      recruiterFeedTitle: "Messages, changements d’étape et alertes",
      candidateInboxCta: "Boîte candidat",
      profileKicker: "Solidité du profil",
      profileTitle: "Préparation du candidat et qualité du CV",
      sharedInboxKicker: "Boîte partagée",
      sharedInboxTitle: "Notifications emploi liées à votre compte",
      alertsKicker: "Alertes",
      alertsTitle: "Intention de recherche enregistrée",
    },
    empty: {
      applicationsTitle: "Aucune candidature active pour l’instant",
      applicationsBody: "Les postes sauvegardés, les mises à jour recruteurs et les chronologies apparaîtront ici dès que vous passerez de la navigation à une candidature active.",
      exploreJobsCta: "Explorer les emplois",
      savedJobsTitle: "Aucun poste sauvegardé pour l’instant",
      savedJobsBody: "Sauvegardez les postes prometteurs pour les garder sur votre présélection dans Jobs et votre compte.",
      recommendedTitle: "Les recommandations s’affineront avec votre usage",
      recommendedBody: "À mesure que votre profil, votre présélection et vos candidatures s’étoffent, les suggestions ici deviendront plus ciblées.",
      recruiterFeedTitle: "Aucun mouvement recruteur pour l’instant",
      recruiterFeedBody: "Les changements d’étape de candidature, les notes recruteurs partagées et les notifications Jobs in-app se rassembleront ici.",
      notificationsTitle: "Aucune notification emploi pour l’instant",
      notificationsBody: "Les futurs mouvements de présélection, mises à jour employeurs et changements de candidature arriveront ici et dans le module Jobs.",
      alertsTitle: "Aucune alerte emploi active",
      alertsBody: "Créez une alerte pour voir apparaître dans votre fil Jobs les nouveaux postes correspondant à vos critères.",
      browseRolesCta: "Parcourir les postes",
    },
    application: {
      progressPercentTemplate: "{percent}% terminé",
      appliedAtTemplate: "Postulé le {date}",
      candidateReadiness: "Préparation candidat",
      recruiterConfidence: "Confiance recruteur",
      latestMovement: "Dernier mouvement recruteur",
      nextBestMove: "Prochaine meilleure action",
      openTimelineCta: "Ouvrir la chronologie",
      interviewRoomCta: "Salle d’entretien",
      viewRoleCta: "Voir le poste",
    },
    savedJob: {
      trustTemplate: "Confiance {score}",
      savedAtTemplate: "Sauvegardé le {date}",
    },
    recommended: {
      compFallback: "Rémunération abordée durant le processus",
    },
    stageLabels: {
      applied: "Postulé",
      reviewing: "Examen",
      shortlisted: "Présélectionné",
      interview: "Entretien",
      offer: "Offre",
      hired: "Embauché",
      rejected: "Refusé",
    },
    nextStep: {
      labels: {
        applied: "Gardez votre profil et votre CV à jour",
        shortlisted: "Préparez vos preuves et le contexte du portfolio",
        interview: "Préparez des exemples et des créneaux",
        offer: "Examinez la portée, le calendrier et la rémunération",
        rejected: "Renforcez le prochain dossier de candidature",
      },
      bodies: {
        applied: "Aux premières étapes, des preuves plus nettes, des coordonnées propres et un CV à jour aident.",
        shortlisted: "La présélection signifie que vous avez passé le premier filtre. Des preuves précises comptent désormais.",
        interview: "Les entretiens avancent plus vite quand vos meilleures preuves et disponibilités sont faciles à voir.",
        offer: "Utilisez l’étape d’offre pour lever les ambiguïtés, pas pour deviner les responsabilités.",
        rejected: "Tirez parti du refus comme signal. Resserrez le résumé, les exemples et l’adéquation avant de re-postuler.",
      },
    },
    readinessLabels: {
      interviewReady: "Prêt pour l’entretien",
      strongProfile: "Profil solide",
      needsProof: "Preuves à renforcer",
      needsStructure: "Structure à renforcer",
    },
    workModeLabels: {
      remote: "Télétravail",
      hybrid: "Hybride",
      onsite: "Sur site",
    },
    employmentTypeLabels: {
      fullTime: "Temps plein",
      partTime: "Temps partiel",
      contract: "Contrat",
      internship: "Stage",
      temporary: "Temporaire",
    },
    profile: {
      readinessLabel: "Préparation",
      skillsMappedLabel: "Compétences cartographiées",
      filesLabel: "Fichiers",
      improveProfileCta: "Améliorer le profil",
      openCandidateModuleCta: "Ouvrir le module candidat",
      checklist: {
        identityLabel: "Bases du profil",
        identityDetail: "Nom complet, téléphone et localisation présents pour la relance recruteur.",
        storyLabel: "Récit professionnel",
        storyDetail: "Titre et résumé expliquent ce que vous faites au-delà d’une simple fiche.",
        verificationLabel: "Vérification d’identité",
        verificationDetail: "La confiance Jobs reste plafonnée tant que votre identité HenryCo n’est pas validée.",
        proofLabel: "Preuves de travail",
        proofDetail: "CV plus preuves du portfolio facilitent les mouvements en présélection.",
        skillsLabel: "Compétences cartographiées",
        skillsDetail: "Au moins quatre compétences et des fonctions préférées améliorent les recommandations.",
      },
    },
    nextActions: {
      gapTemplate: "Combler la lacune {label}",
      interviewLabel: "Préparer une étape d’entretien",
      offerLabel: "Répondre à une offre active",
      attentionTemplate: "{title} chez {employer} requiert votre attention maintenant.",
      convertSavedLabel: "Convertir un poste sauvegardé en candidature active",
      convertSavedTemplate: "{title} figure déjà dans votre présélection et est prêt pour un examen plus approfondi.",
      restartLabel: "Relancez votre recherche avec des filtres plus stricts",
      restartDetail: "Utilisez les filtres employeur vérifié et poste interne pour bâtir une présélection plus propre, plus vite.",
    },
    alertStatus: {
      active: "Active",
      paused: "En pause",
    },
    recruiterUpdateTitleTemplate: "Mise à jour {stage}",
  },
  divisionLogistics: {
    metadata: {
      title: "Logistique · livraisons et expéditions",
      description: "Chaque enlèvement, dépôt, ETA et preuve de livraison HenryCo Logistics liés à ce compte — reflétés depuis le réseau logistique dans une seule pièce sereine.",
    },
    hero: {
      ariaLabel: "Vue d’ensemble logistique",
      eyebrow: "HenryCo Logistique",
      brand: "HenryCo Logistique",
      title: "Chaque colis, une seule pièce.",
      body: "Enlèvements, dépôts, ETA et preuves de livraison — tout est reflété depuis le réseau logistique dans votre compte. Réservez une fois sur",
      bodyDomain: " logistics.henrycogroup.com",
      ctaNewDelivery: "Nouvelle livraison",
    },
    metrics: {
      ariaLabel: "Performance logistique",
      activeNowLabel: "En cours",
      activeFootSingular: "expédition en route",
      activeFootPlural: "expéditions en route",
      deliveredMonthLabel: "Livré · ce mois",
      deliveredMonthFootTemplate: "{count} au total",
      onTimeRateLabel: "Taux de ponctualité",
      onTimeRateFootEmpty: "En attente de votre première livraison planifiée",
      onTimeRateFootHasValue: "Des livraisons planifiées",
      totalSpendLabel: "Dépenses totales",
      totalSpendFoot: "Payé à vie",
    },
    map: {
      noShipmentsAriaLabel: "Aucune expédition pour l’instant",
      noShipmentsTitle: "Votre carte s’allumera dès votre première livraison",
      noShipmentsBody: "Chaque enlèvement et dépôt actif s’épingle ici automatiquement. Réservez une fois et vos expéditions se reflètent depuis le site logistique.",
      noShipmentsCta: "Réserver une livraison",
      pendingAriaLabel: "Aperçu de la carte",
      pendingTitle: "Géocodage en cours",
      pendingBody: "Vos expéditions actives s’épingleront sur la carte dès que les adresses d’enlèvement et de dépôt seront géocodées par le dispatch.",
      activeAriaLabel: "Carte des expéditions actives",
      altTemplateSingular: "Carte affichant {count} épingle d’enlèvement et de dépôt actif",
      altTemplatePlural: "Carte affichant {count} épingles d’enlèvement et de dépôt actifs",
      liveBadgeTemplateSingular: "En direct · {count} expédition active",
      liveBadgeTemplatePlural: "En direct · {count} expéditions actives",
    },
    sections: {
      activeTitle: "En route maintenant",
      activeMetaTemplate: "{count} actives · synchro auto depuis la logistique",
      activeRailAriaLabel: "Expéditions actives",
      emptyAriaLabel: "Aucune expédition active",
      emptyTitle: "Aucune expédition active",
      emptyBody: "Vos livraisons passées sont en dessous. Réservez-en une autre, elle apparaîtra ici dès que le coursier confirmera l’enlèvement.",
      actionsTitle: "Lancer une livraison",
      actionsMeta: "Raccourcis vers les flux courants",
      actionsAriaLabel: "Actions rapides logistique",
      recentTitle: "Récemment livrées",
      recentMetaTemplate: "Dernières {recent} sur {lifetime} au total",
      recentAriaLabel: "Livraisons récentes",
      spendTitle: "Dépenses · 6 derniers mois",
      spendMeta: "Payé uniquement",
      spendFigureAriaLabelTemplate: "Dépenses logistiques sur les 6 derniers mois",
    },
    statusLabels: {
      quoteRequested: "Devis en attente",
      quoteSent: "Devis prêt",
      pendingPayment: "Paiement attendu",
      scheduled: "Planifiée",
      assigned: "Coursier assigné",
      pickupConfirmed: "Enlevée",
      inTransit: "En transit",
      delayed: "Retardée",
      attemptedDelivery: "Livraison tentée",
      delivered: "Livrée",
      completed: "Terminée",
      closed: "Clôturée",
      cancelled: "Annulée",
      refunded: "Remboursée",
    },
    urgencyLabels: {
      standard: "Standard",
      sameDay: "Jour même",
      express: "Express",
      nextDay: "Lendemain",
    },
    serviceLabels: {
      scheduled: "Planifié",
      sameDay: "Jour même",
      interCity: "Inter-villes",
      bulk: "Volume",
    },
    shipment: {
      trackingCodeAriaTemplate: "Code de suivi {code}",
      addressPending: "Adresse en attente",
      etaPending: "ETA en attente",
      trackCta: "Suivre l’expédition",
      openTrackingAriaTemplate: "Ouvrir le suivi pour {code}",
      etaAriaTemplate: "ETA {eta}",
      etaMinutesInTemplate: "dans {minutes} min",
      etaMinutesOverdueTemplate: "{minutes} min de retard",
      etaHoursInTemplate: "dans {hours} h",
      etaHoursOverdueTemplate: "{hours} h de retard",
      detailSeparator: " · ",
    },
    timeline: {
      ariaLabel: "Livraisons récentes",
      deliveredToTemplate: "Livré à {name}",
      receiptCta: "Reçu",
    },
    quickActions: {
      ariaLabel: "Actions rapides logistique",
      bookLabel: "Réserver une livraison",
      bookDesc: "Enlèvement et dépôt dans un flux guidé.",
      trackLabel: "Suivre par code",
      trackDesc: "Statut en direct, ETA et contexte coursier.",
      quoteLabel: "Demander un devis",
      quoteDesc: "Prix indicatif avant de vous engager.",
      addressesLabel: "Adresses enregistrées",
      addressesDesc: "Contacts d’enlèvement et de dépôt.",
      invoicesLabel: "Reçus et factures",
      invoicesDesc: "PDF de marque pour chaque expédition.",
      supportLabel: "Support logistique",
      supportDesc: "Ouvrir un fil rattaché à votre compte.",
    },
    spend: {
      figureAriaLabel: "Dépenses logistiques sur les 6 derniers mois",
      emptyTick: "—",
    },
  },
  divisionLearn: {
    metadata: {
      title: "Learn · tableau de bord apprentissage",
      description: "Suivez chaque inscription HenryCo Learn, leçon, résultat de quiz, certificat, formation assignée et candidature enseignante liés à ce compte — catalogue sur Learn, progression reflétée ici.",
    },
    hero: {
      ariaLabel: "Vue d’ensemble Learn",
      eyebrow: "Learn · en direct",
      sideKicker: "Comment cette pièce fonctionne",
      sideTitle: "Catalogue sur Learn, progression ici.",
      sideBody: "Chaque leçon, quiz et certificat de HenryCo Learn se synchronise dans cette pièce — reprenez là où vous vous êtes arrêté, visualisez votre progression d’un coup d’œil et gardez vos certifications au même endroit.",
      breakdownLabel: "Par état",
      breakdownAriaLabel: "Répartition de l’activité d’apprentissage",
      tilesAriaLabel: "Activité d’apprentissage",
      tileLabels: {
        active: "Actifs",
        completed: "Terminés",
        certificates: "Certificats",
        assignments: "Assignés",
      },
      tileFoot: {
        activeEmpty: "Inscrivez-vous pour commencer un cours",
        activeWith: "Leçons et quiz reflétés ici",
        completedEmpty: "Vos programmes terminés apparaîtront ici",
        completedWith: "Pratique pour les CV et les rapports",
        certificatesEmpty: "Obtenez-en un en terminant un cours",
        certificatesWith: "Liens vérifiables vers chaque certification",
        assignmentsEmpty: "Rien d’assigné pour l’instant",
        assignmentsWith: "Depuis votre manager ou votre équipe",
      },
      breakdownNames: {
        active: "Actifs",
        assigned: "Assignés",
        certificates: "Certificats",
        saved: "Enregistrés",
      },
      openLearnCta: "Ouvrir HenryCo Learn",
      applyToTeachCta: "Postuler pour enseigner",
      state: {
        empty: {
          headline: "Commencez votre parcours HenryCo Learn.",
          blurb: "Parcourez le catalogue, inscrivez-vous à un cours, et chaque leçon, quiz et certificat se synchronisera ici automatiquement.",
        },
        active: {
          headlineTemplateSingular: "{count} cours en cours.",
          headlineTemplatePlural: "{count} cours en cours.",
          blurb: "Reprenez là où vous vous êtes arrêté — leçons, quiz, certificats et formations assignées sont synchronisés depuis HenryCo Learn dans cette pièce.",
        },
        calm: {
          headlineTemplateSingular: "{count} cours terminé.",
          headlineTemplatePlural: "{count} cours terminés.",
          blurb: "Vos certifications et votre historique d’apprentissage restent ici, pratiques pour les CV, le reporting interne ou vos propres archives.",
        },
      },
    },
    sections: {
      coursesTitle: "Continuer l’apprentissage",
      coursesMetaEmpty: "Parcourez le catalogue HenryCo Learn pour vous inscrire à votre premier cours.",
      coursesMetaTemplate: "{active} actif(s) · {completed} terminé(s)",
      extrasTitle: "Certifications, formations et enseignement",
      extrasMeta: "Certificats, formations assignées, cours enregistrés et candidature enseignante regroupés ici.",
      activityTitle: "Activité récente",
      activityMetaTemplateSingular: "{count} mise à jour · plus récente en premier",
      activityMetaTemplatePlural: "{count} mises à jour · plus récentes en premier",
      activityMetaEmpty: "Leçons, quiz, certificats et paiements se reflètent ici en temps réel.",
    },
    empty: {
      coursesTitle: "Aucun cours lié pour l’instant",
      coursesBody: "Parcourez le catalogue sur HenryCo Learn et inscrivez-vous. Votre place apparaîtra ici automatiquement.",
      activityTitle: "Aucune activité Learn pour l’instant",
      activityBody: "Progression des cours, résultats de quiz, émission de certificats et reçus de paiement apparaissent ici en temps réel.",
    },
    courses: {
      ariaLabel: "Cours",
      completedAtTemplate: "Terminé le {date}",
      progressPercentTemplate: "{percent}% terminé",
      statusDelimiter: " · ",
    },
    extras: {
      ariaLabel: "Compléments Learn",
      certificatesTitle: "Certificats",
      assignmentsTitle: "Formations assignées",
      savedTitle: "Cours enregistrés",
      teachingTitle: "Enseigner avec HenryCo",
      statusLabel: "Statut",
      expertiseLabel: "Expertise",
      topicsLabel: "Sujets",
      openApplicationCta: "Ouvrir la candidature",
      applyToTeachCta: "Postuler pour enseigner",
      teachingEmpty: "Nous examinons les candidatures d’enseignants manuellement. Postulez sur HenryCo Learn et le statut se synchronisera ici.",
    },
    activity: {
      ariaLabel: "Activité Learn",
      fallbackTitle: "Activité Learn",
    },
  },

  divisionStudio: {
    metadata: {
      title: "Studio · salles de projet",
      description: "Suivez chaque collaboration HenryCo Studio liée à ce compte — propositions, jalons, paiements, livrables et activité réunis dans une seule salle.",
    },
    hero: {
      eyebrowLive: "Studio · en direct",
      overviewAriaLabel: "Aperçu Studio",
      activityAriaLabel: "Activité Studio",
      sideAriaLabel: "Comment fonctionne cette salle",
      sideLabel: "Comment fonctionne cette salle",
      sideTitle: "Une seule salle de projet, l’état réel.",
      sideBody: "Les propositions, jalons, justificatifs de paiement, livrables et signaux d’échange restent rattachés à l’identité HenryCo que vous utilisez partout. Le tableau ci-dessous reflète la progression réelle de l’équipe Studio, pas une simple liste d’états.",
      breakdownAriaLabel: "Répartition de l’activité",
      breakdownLabel: "Par état",
      tiles: {
        activeLabel: "Projets actifs",
        activeFootEmpty: "Aucun espace de travail actif pour le moment",
        activeFootHasValue: "Espaces actifs avec dynamique de livraison",
        pendingLabel: "Paiements en attente",
        pendingFootEmpty: "Voie commerciale dégagée",
        pendingFootHasValue: "Points de contrôle commerciaux encore ouverts",
        proofLabel: "Justificatifs déposés",
        proofFootEmpty: "Rien en attente de revue",
        proofFootHasValue: "Paiements en attente de revue Studio",
        deliverablesLabel: "Livrables",
        deliverablesFootEmpty: "Les fichiers apparaissent ici dès leur dépôt par Studio",
        deliverablesFootHasValue: "Fichiers et résultats centralisés au même endroit",
      },
      breakdown: {
        active: "Actif",
        readyReview: "Prêt pour revue",
        pendingPayment: "Paiement en attente",
        proofSubmitted: "Justificatif déposé",
      },
      state: {
        empty: {
          headline: "Lancez un brief Studio.",
          blurb: "Quand une proposition ou un projet démarre avec votre identité HenryCo, la salle Studio synchronisée apparaît ici — jalons, paiements, livrables et prochaine étape regroupés.",
          ctaPrimary: "Lancer un brief",
          ctaSecondary: "Ouvrir Studio",
        },
        attention: {
          headlineTemplateSingular: "{count} paiement en retard.",
          headlineTemplatePlural: "{count} paiements en retard.",
          blurb: "Un point de paiement est en retard. Ouvrez la salle pour téléverser un justificatif ou contacter l’équipe Studio.",
          ctaPrimary: "Ouvrir les paiements",
          ctaSecondary: "Ouvrir Studio",
        },
        activeReady: {
          headlineTemplateSingular: "{count} projet prêt pour revue.",
          headlineTemplatePlural: "{count} projets prêts pour revue.",
          blurb: "Des livrables et révisions attendent votre validation. Ouvrez la salle pour relire et débloquer le prochain jalon.",
          ctaPrimary: "Ouvrir les projets",
          ctaSecondary: "Ouvrir Studio",
        },
        activeProjects: {
          headlineTemplateSingular: "{count} projet actif.",
          headlineTemplatePlural: "{count} projets actifs.",
          blurb: "Espaces actifs avec mouvement de jalons, points de paiement et livrables — reflétés depuis HenryCo Studio dans cette salle.",
          ctaPrimary: "Ouvrir Studio",
          ctaSecondary: "Lancer un nouveau brief",
        },
        calm: {
          headlineTemplateSingular: "{count} salle de projet enregistrée.",
          headlineTemplatePlural: "{count} salles de projet enregistrées.",
          blurb: "Chaque collaboration Studio que vous avez engagée — propositions, jalons, paiements, livrables — conservée dans une salle pour un suivi rapide.",
          ctaPrimary: "Ouvrir Studio",
          ctaSecondary: "Lancer un nouveau brief",
        },
      },
    },
    sections: {
      projectsTitle: "Salles de projet",
      projectsAriaLabel: "Projets Studio",
      projectsMetaEmpty: "Les espaces apparaissent ici dès qu’une collaboration Studio démarre.",
      projectsMetaTemplateSingular: "{count} projet · trié par dernier mouvement",
      projectsMetaTemplatePlural: "{count} projets · triés par dernier mouvement",
      paymentsTitle: "Points de paiement",
      paymentsAriaLabel: "Paiements Studio",
      paymentsMetaEmpty: "Les demandes de paiement Studio apparaissent ici quand une proposition ou un projet démarre.",
      paymentsMetaTemplateSingular: "{count} point · justificatif et statut d’approbation",
      paymentsMetaTemplatePlural: "{count} points · justificatif et statut d’approbation",
      activityTitle: "Activité récente",
      activityAriaLabel: "Activité Studio",
      activityMetaEmpty: "Les mises à jour de projet, justificatifs de paiement et validations de jalons se reflètent ici.",
      activityMetaTemplateSingular: "{count} mise à jour · plus récente en premier",
      activityMetaTemplatePlural: "{count} mises à jour · plus récentes en premier",
    },
    empty: {
      projectsTitle: "Aucune salle Studio reliée pour l’instant",
      projectsBody: "Dès qu’une proposition ou un projet est créé avec votre identité HenryCo, la salle Studio synchronisée apparaîtra ici — jalons, paiements, livrables et prochaine étape.",
      paymentsTitle: "Aucun point de paiement pour l’instant",
      paymentsBody: "Les jalons commerciaux — acompte, mi-projet, livraison — apparaissent ici dès qu’une proposition démarre avec vous.",
      activityTitle: "Aucune activité Studio pour l’instant",
      activityBody: "Mises à jour de projet, justificatifs de paiement, publications de livrables et validations de jalons s’afficheront ici au fil de l’eau.",
    },
    projects: {
      listAriaLabel: "Projets Studio",
      fallbackSubtitle: "Studio prépare la prochaine mise à jour.",
      milestonesTemplate: "{approved}/{total} jalons",
      paymentsTemplateSingular: "{count} paiement ouvert",
      paymentsTemplatePlural: "{count} paiements ouverts",
      deliverablesTemplateSingular: "{count} livrable",
      deliverablesTemplatePlural: "{count} livrables",
      updatedTemplate: "Mis à jour le {stamp}",
      rowAriaLabelTemplate: "{title} · {kind}",
      fallbackStamp: "—",
    },
    projectKindLabels: {
      live: "En cours",
      ready_review: "Prêt pour revue",
      scheduled: "Planifié",
      delivered: "Livré",
      issue: "Action requise",
    },
    payments: {
      listAriaLabel: "Paiements Studio",
      rowAriaLabelTemplate: "{label} · {status}",
      dueTemplate: "Échéance {stamp}",
      updatedTemplate: "Mis à jour le {stamp}",
      subTemplate: "{amount} · {method} · {due}",
    },
    paymentStatusLabels: {
      pending: "en attente",
      paid: "payé",
      approved: "approuvé",
      settled: "réglé",
      proof_uploaded: "justificatif déposé",
      proof_submitted: "justificatif soumis",
      in_review: "en revue",
      rejected: "rejeté",
      overdue: "en retard",
      failed: "échec",
      pending_deposit: "acompte en attente",
    },
    activity: {
      listAriaLabel: "Activité Studio",
      rowAriaLabelTemplate: "{title} · {stamp}",
    },
  },
  settings: {
    pageTitle: "Paramètres et préférences",
    pageDescription:
      "Gérez votre profil, vos préférences de communication, vos contrôles de confidentialité et les demandes manuelles de données.",
    profileSectionKicker: "Informations de profil",
    notificationsSectionKicker: "Préférences de notification",
  },
  addresses: {
    metadata: {
      title: "Adresses",
      description:
        "Gérez vos adresses enregistrées (domicile, bureau, boutique…) — utilisées pour les livraisons, les réservations et la vérification KYC.",
    },
    hero: {
      title: "Adresses",
      description:
        "Gérez vos adresses enregistrées (domicile, bureau, boutique…) — utilisées pour les livraisons, les réservations et la vérification KYC.",
    },
    card: {
      defaultBadge: "Par défaut",
      kycVerifiedBadge: "KYC vérifié",
      setDefaultCta: "Définir par défaut",
      editCta: "Modifier",
      deleteCta: "Supprimer",
      addressSeparator: ", ",
    },
    deleteConfirm: {
      prompt: "Supprimer cette adresse ? Cette action est irréversible.",
      confirmCta: "Supprimer",
      cancelCta: "Annuler",
    },
    empty: {
      body:
        "Vous n'avez encore ajouté aucune adresse. Ajoutez-en une pour accélérer le paiement dans HenryCo.",
    },
    add: {
      cta: "Ajouter une adresse",
      formTitle: "Ajouter une nouvelle adresse",
      editFormTitleTemplate: "Modifier {label}",
      maxedNoticeTemplate:
        "Vous avez atteint le maximum de {count} types d'adresse (domicile, bureau, boutique, entrepôt, alternative 1, alternative 2). Modifiez ou supprimez-en une pour ajouter un autre type.",
    },
  },
  search: {
    metadata: {
      title: "Recherche du compte",
      description: "Recherchez les flux de votre compte HenryCo et les routes des divisions connectées.",
    },
    hero: {
      title: "Recherchez vos flux HenryCo.",
      description:
        "Accédez directement aux actions précises du compte et aux routes des divisions connectées sans passer par des tableaux de bord génériques.",
    },
    placeholder: "Rechercher : notifications, portefeuille, factures, support, candidatures...",
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
    "smartHomeEmptyFallback": "Willkommen — beginnen Sie mit einem kleinen ersten Schritt. Ihre Live-Signale erscheinen hier, sobald Aktivität eingeht.",
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
    },
    "priorityFallback": {
      "low": "Ruhig",
      "normal": "Gewöhnlich",
      "high": "Hoch",
      "urgent": "Dringend"
    },
    "eyebrow": "Aktionswarteschlange · live",
    "guidanceTitle": "Eine Warteschlange, alle Abteilungen.",
    "overviewAria": "Aufgabenübersicht",
    "volumeAria": "Aufgabenvolumen",
    "pendingAria": "Ausstehende Aufgaben",
    "sideAria": "So funktioniert die Warteschlange",
    "bySource": "Nach Quelle",
    "openTotalLabel": "Offen gesamt",
    "nothingBlocking": "Im Moment blockiert nichts",
    "resolveBlockers": "Lösen Sie sie, um weitere Spuren freizugeben",
    "routine": "gewöhnlich",
    "divisionRepresentedSingular": "{count} Abteilung vertreten",
    "divisionRepresentedPlural": "{count} Abteilungen vertreten",
    "headlineEmpty": "Nichts in der Warteschlange.",
    "headlineBlockerSingular": "{count} Blockierung muss beseitigt werden.",
    "headlineBlockerPlural": "{count} Blockierungen müssen beseitigt werden.",
    "headlineUrgentSingular": "{count} dringende Aufgabe zu erledigen.",
    "headlineUrgentPlural": "{count} dringende Aufgaben zu erledigen.",
    "headlineActiveSingular": "{count} Aufgabe zu bearbeiten.",
    "headlineActivePlural": "{count} Aufgaben zu bearbeiten.",
    "headlineCalmSingular": "{count} Eintrag in Ihrer Warteschlange.",
    "headlineCalmPlural": "{count} Einträge in Ihrer Warteschlange.",
    "blurbEmpty": "Ihr Konto ist in Ordnung — Verifizierung, Auszahlungen und prüfungssensible Spuren sind alle frei. Wir zeigen Ihnen den nächsten Schritt hier automatisch an, sobald er anfällt.",
    "blurbRisk": "Diese Elemente blockieren Aktionen mit höherem Vertrauen über HenryCo hinweg — Wallet-Auszahlungen, Marketplace-Verkäufergenehmigung, Arbeitgeberverifizierung. Sie zu klären gibt jede Spur frei.",
    "blurbActive": "Jede Zeile führt Sie mit einem Tipp zur nächsten Aktion. Filter, Prioritäts-Chips und Deeplinks bleiben in allen HenryCo-Abteilungen konsistent.",
    "metaEmpty": "Bei Ihnen ist alles klar. Alles Neue erscheint hier, sobald es eintrifft.",
    "metaCount": "{count} offen · sortiert nach Priorität und Blockierungsstatus."
  },
  "security": {
    "title": "Sicherheit",
    "description": "Überprüfen Sie die letzten Sicherheitsaktivitäten, ändern Sie Ihr Passwort und beenden Sie bei Bedarf HenryCo-Sitzungen.",
    "heroAriaLabel": "Sicherheitsübersicht",
    "hero": {
      "trustScoreLabel": "Vertrauensbewertung",
      "nextTierPrefix": "Nächste ·",
      "nextTierAriaTemplate": "Nächste Stufe {tier}",
      "accountActiveSingularTemplate": "Konto seit {days} Tag aktiv",
      "accountActivePluralTemplate": "Konto seit {days} Tagen aktiv",
      "flaggedEventsSingularTemplate": "{count} markiertes Ereignis erfasst · siehe unten zur Prüfung",
      "flaggedEventsPluralTemplate": "{count} markierte Ereignisse erfasst · siehe unten zur Prüfung",
      "statusEyebrow": {
        "secure": "Sicherheit & Zugang · sicher",
        "watch": "Sicherheit & Zugang · Handlung empfohlen",
        "risk": "Sicherheit & Zugang · Risiko markiert"
      },
      "statusHeadline": {
        "secure": "Ihr Konto ist sicher.",
        "watch": "Mit ein paar Schritten lässt sich Ihr Konto noch besser absichern.",
        "risk": "Wir haben Aktivitäten markiert, die Ihre Aufmerksamkeit erfordern."
      },
      "statusBlurb": {
        "secure": "Keine verdächtigen Ereignisse, die Verifizierung ist gesund, und jede Aktion mit höherem Vertrauen, die HenryCo anbietet, steht Ihnen offen.",
        "watch": "Nichts ist defekt — aber ein paar Signale (E-Mail-Bestätigung, Identitätsprüfung, doppelter Kontaktabgleich) würden Ihre Vertrauensbewertung anheben und weitere Spuren freischalten.",
        "risk": "Aktuelle Ereignisse wurden als erhöhtes Risiko eingestuft. Prüfen Sie den Aktivitätsstrom unten und wechseln Sie Ihr Passwort, falls Ihnen etwas unbekannt vorkommt."
      }
    },
    "signalsTitle": "Signale",
    "signalsMeta": "Was unsere Verifizierungs- und Bewertungs-Engines gerade auf Ihrem Konto sehen.",
    "signalsAriaLabel": "Sicherheitssignale",
    "guideTitle": "Wo Sie stehen · was Sie weiterbringt",
    "guideMetaTemplate": "Ehrliche Bewertung, keine Marketing-Zahl. {tier}.",
    "allLanesOpen": "Alle Spuren offen",
    "accountActionsTitle": "Kontoaktionen",
    "accountActionsMeta": "Gewöhnliche Steuerungen, die Sie direkt selbst in der Hand haben.",
    "changePasswordTitle": "Passwort ändern",
    "signOutEverywhereTitle": "Überall abmelden",
    "suspiciousEventFoot": "Prüfen Sie den Aktivitätsstrom unten.",
    "noSuspiciousEventFoot": "Nichts im letzten Prüffenster markiert.",
    "activityAriaLabel": "Aktuelle Sicherheitsereignisse",
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
  messages: {
    metadata: {
      title: "Nachrichten · HenryCo",
      description:
        "Ein Posteingang für Support, Marketplace, Jobs, Studio, Care, Immobilien, Logistik und Lernen.",
    },
    hero: {
      eyebrow: "HenryCo · vereinheitlichter Posteingang",
      ariaLabel: "Posteingangsübersicht",
      ariaTiles: "Posteingangsvolumen",
      ariaSide: "Nach Portal",
      sideLabel: "Nach Portal",
      sideBody:
        "Jedes Portal speist diesen einen Posteingang. Support, Marketplace-Bestellungen, Vorstellungsgespräche, Studio-Projekte und Care-Buchungen erscheinen hier in chronologischer Reihenfolge.",
    },
    headlines: {
      zero: "Posteingang leer in ganz HenryCo.",
      calmOne: "Ein Thread wartet auf Sie.",
      calmMany: "{count} Threads sind offen.",
      busy: "{unread} ungelesen · {open} offen in Ihren Portalen.",
      overloaded: "{unread} ungelesen in {open} offenen Threads.",
    },
    blurbs: {
      zero: "Alles ist bestätigt — Support, Marketplace, Jobs, Studio, Care, Immobilien, Logistik und Lernen.",
      calm: "Eine kurze Antwort jetzt schließt die Schleife noch heute.",
      busy: "Tippen Sie auf eine Zeile, um den Thread zu öffnen, oder filtern Sie nach einem Portal.",
      overloaded: "Arbeiten Sie die Divisionen nacheinander ab — neueste Threads oben.",
    },
    tiles: {
      openLabel: "Offen",
      openFootEmpty: "Nichts in Bearbeitung",
      openFootActive: "Threads, die Bewegung erwarten",
      unreadLabel: "Ungelesen",
      unreadFootEmpty: "Posteingang aufgeräumt",
      unreadFootActive: "Tippen Sie auf eine Zeile, um den Thread zu öffnen",
      portalsLabel: "Portale",
      portalsFootEmpty: "Care, Marketplace, Studio, Jobs und mehr",
      portalsFootSingular: "Eine Division aktiv",
      portalsFootPlural: "{count} Divisionen vertreten",
    },
    sideTitle: {
      empty: "Ruhig in allen Divisionen",
      singular: "Eine Division hat Verkehr",
      plural: "{count} Divisionen aktiv",
    },
    section: {
      title: "Threads",
      ariaLabel: "Threads im Posteingang",
      metaEmpty: "Noch nichts hier — jedes Portal speist diesen Posteingang",
      metaSingular: "{count} Thread",
      metaPlural: "{count} Threads",
    },
    chips: {
      ariaLabel: "Posteingang nach Portal filtern",
      allThreads: "Alle Threads",
    },
    empty: {
      eyebrow: "Posteingang ruhig",
      titleAll: "Nichts wartet auf Sie.",
      titleFilter: "Noch keine Threads in diesem Portal.",
      bodyAll:
        "Support, Marketplace, Jobs, Studio, Care, Immobilien, Logistik und Lernen tauchen hier auf — alles Cross-Portal landet hier, sobald es beginnt.",
      bodyFilter:
        "Wechseln Sie die Filter-Chips für ein anderes Portal, oder durchsuchen Sie alle Threads, um sicherzugehen, dass nichts ansteht.",
    },
    list: {
      unreadDotLabel: "Ungelesen",
      fallbackTime: "—",
    },
    divisionLabels: {
      support: "Support",
      marketplace: "Marketplace",
      jobs: "Jobs",
      studio: "Studio",
      care: "Care",
      property: "Immobilien",
      logistics: "Logistik",
      learn: "Lernen",
    },
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
  support: {
    metadata: {
      title: "Support",
      description: "Erhalten Sie Unterstützung für jeden HenryCo-Dienst.",
    },
    hero: {
      title: "Support",
      description: "Erhalten Sie Unterstützung für jeden HenryCo-Dienst.",
      newRequestCta: "Neue Anfrage",
    },
    summary: {
      openRequestsTemplate: "{count} offene Anfrage(n)",
      escalatedTemplate: "{count} eskaliert",
      escalationNote:
        "Jede Nachricht wird verfolgt. Wenn die Triage Risiko oder Dringlichkeit erkennt, erhält das Team automatisch eine priorisierte Warteschlange.",
    },
    quickHelp: {
      helpCenterLabel: "Hilfezentrum",
      helpCenterDesc: "FAQs und Anleitungen durchsuchen",
      contactLabel: "Kontakt aufnehmen",
      contactDesc: "Support per E-Mail oder Telefon",
      liveChatLabel: "Live-Chat",
      liveChatDesc: "Chatten Sie mit unserem Team",
    },
    threads: {
      sectionKicker: "Ihre Anfragen",
      emptyTitle: "Keine Support-Anfragen",
      emptyDescription:
        "Sie haben noch keine Support-Anfragen erstellt. Wir sind für Sie da, wenn Sie etwas brauchen.",
      createCta: "Anfrage erstellen",
    },
    statusLabels: {
      open: "Offen",
      awaitingReply: "Wartet auf Antwort",
      inProgress: "In Bearbeitung",
      resolved: "Gelöst",
      closed: "Geschlossen",
    },
    priorityLabels: {
      low: "Niedrig",
      normal: "Normal",
      high: "Hoch",
      urgent: "Dringend",
    },
  },
  payments: {
    hero: {
      title: "Zahlungsmethoden",
      description: "Verwalten Sie Ihre gespeicherten Zahlungsoptionen für einen schnellen Bezahlvorgang.",
      addMethodCta: "Methode hinzufügen",
    },
    empty: {
      title: "Keine Zahlungsmethoden",
      description:
        "Fügen Sie eine Debitkarte, ein Bankkonto oder eine andere Zahlungsmethode hinzu, um in allen HenryCo-Diensten schnell zu bezahlen.",
      cta: "Zahlungsmethode hinzufügen",
    },
    card: {
      savedMethodFallback: "Gespeicherte Methode",
      cardLastFourTemplate: "•••• {last4}",
    },
    wallet: {
      eyebrow: "HenryCo Wallet",
      body: "Ihre HenryCo Wallet steht jederzeit als Zahlungsoption zur Verfügung.",
      manageCta: "Wallet verwalten",
    },
  },
  savedItems: {
    metadata: {
      title: "Gespeicherte Artikel",
      description:
        "Artikel, die Sie aus einem HenryCo-Warenkorb beiseitegelegt haben — 90 Tage aufbewahrt, mit Hinweis eine Woche vor Ablauf.",
    },
    hero: {
      title: "Für später gespeichert",
      description:
        "Artikel, die Sie aus einem HenryCo-Warenkorb beiseitegelegt haben. Wir bewahren sie 90 Tage auf und warnen Sie eine Woche vor Ablauf.",
    },
    summary: {
      activeTemplate: "{count} aktiv",
      expiredTemplate: "{count} abgelaufen",
      expiryNote:
        "Artikel laufen 90 Tage nach dem Speichern ab. Wir warnen Sie eine Woche im Voraus.",
      savedTemplate: "{count} gespeichert",
    },
    toolbar: {
      showLabel: "Anzeigen",
      allDivisions: "Alle Bereiche",
      sortLabel: "Sortieren",
      sortNewest: "Neueste zuerst",
      sortOldest: "Älteste zuerst",
      sortExpiring: "Bald ablaufend",
    },
    selection: {
      selectedTemplate: "{count} ausgewählt",
      clear: "Aufheben",
      moving: "Wird verschoben…",
      moveSelectedToCart: "Auswahl in den Warenkorb verschieben",
      selectAllOnPage: "Alle auf dieser Seite auswählen",
    },
    empty: {
      title: "Noch nichts gespeichert",
      description:
        "Wenn Sie etwas finden, das Sie noch nicht kaufen möchten, speichern Sie es aus dem Warenkorb für später. Wir behalten den Preis bei und warnen Sie eine Woche vor Ablauf.",
      browseCta: "Stöbern",
    },
    card: {
      deselectItem: "Artikel abwählen",
      selectItem: "Artikel auswählen",
      savedItemFallback: "Gespeicherter Artikel",
      expiresToday: "Läuft heute ab",
      expiresInTemplate: "Läuft in {days} Tag{plural} ab",
      expiredNotice: "Abgelaufen — Wiederherstellen setzt die 90-Tage-Frist zurück",
      moveToCart: "In den Warenkorb",
      moving: "Wird verschoben…",
      removeFromSaved: "Aus gespeicherten Artikeln entfernen",
      openOriginal: "Ursprünglichen Eintrag öffnen",
    },
    expired: {
      sectionKicker: "Kürzlich abgelaufen",
      sectionNote: "Wiederherstellen setzt die 90-Tage-Frist zurück.",
    },
  },
  documents: {
    metadata: {
      title: "Dokumente",
      description:
        "Ihre Quittungen, Zertifikate, Verträge und wichtigen Dateien — privat aufbewahrt und in jedem HenryCo-Bereich abrufbar.",
    },
    hero: {
      eyebrow: "Persönlicher Tresor",
      title: "Dokumente",
      body: "Ihre Quittungen, Zertifikate, Verträge und wichtigen Dateien.",
    },
    toolbar: {
      uploadCta: "Dokument hochladen",
      filterLabel: "Filtern",
      allCategories: "Alle Kategorien",
      sortLabel: "Sortieren",
      sortNewest: "Neueste zuerst",
      sortOldest: "Älteste zuerst",
    },
    types: {
      document: "Dokument",
      receipt: "Quittung",
      certificate: "Zertifikat",
      id_document: "Ausweisdokument",
      contract: "Vertrag",
      other: "Sonstiges",
    },
    categories: {
      all: "Alle",
      document: "Dokumente",
      receipt: "Quittungen",
      certificate: "Zertifikate",
      id_document: "Ausweisdokumente",
      contract: "Verträge",
      other: "Sonstige",
    },
    card: {
      uploadedOnTemplate: "Hochgeladen am {date}",
      sizeTemplate: "{size}",
      downloadLabel: "Herunterladen",
      noFileAttached: "Keine Datei angehängt",
      openOriginal: "Dokument öffnen",
    },
    empty: {
      title: "Noch keine Dokumente",
      description:
        "Ihre Dokumente, Quittungen und Zertifikate aus HenryCo-Diensten werden hier gespeichert.",
    },
    summary: {
      countTemplate: "{count} Dokument{plural}",
      filteredTemplate: "{count} von {total} angezeigt",
    },
    retention: {
      eyebrow: "Datenschutz & Aufbewahrung",
      title: "Ihre Dateien bleiben privat",
      body: "Dokumente werden ruhend verschlüsselt, sind nur für Sie sichtbar und bleiben für die Laufzeit Ihres HenryCo-Kontos erhalten, sofern Sie sie nicht entfernen.",
    },
  },
  subscriptions: {
    metadata: {
      title: "Abonnements",
      description:
        "Schreibgeschützte Übersicht aller aktiven Pläne, synchronisiert aus den HenryCo-Bereichen.",
    },
    hero: {
      eyebrow: "Aktive Pläne",
      title: "Abonnements",
      description:
        "Schreibgeschützte Plan-Übersicht aus den Bereichen, die ihre Abonnements derzeit in den gemeinsamen Konto-Hub synchronisieren.",
    },
    empty: {
      title: "Noch keine synchronisierten Abonnements",
      description:
        "Das kann bedeuten, dass Sie keinen aktiven Plan haben oder dass der Bereich seine Abonnements noch nicht in das gemeinsame Konto-Register übertragen hat.",
    },
    card: {
      planFallback: "Abonnement-Plan",
      tierSeparator: " · ",
      amountLabel: "Betrag",
      cycleLabel: "Zyklus",
      renewsLabel: "Erneuert",
      renewsFallback: "—",
    },
    statusLabels: {
      active: "Aktiv",
      paused: "Pausiert",
      cancelled: "Gekündigt",
      expired: "Abgelaufen",
      past_due: "Überfällig",
      trialing: "Testphase",
      grace: "Kulanzfrist",
      pending: "Ausstehend",
      unknown: "Unbekannt",
    },
    cycleLabels: {
      monthly: "Monatlich",
      yearly: "Jährlich",
      annual: "Jährlich",
      quarterly: "Vierteljährlich",
      weekly: "Wöchentlich",
      biweekly: "Alle 2 Wochen",
      daily: "Täglich",
      one_time: "Einmalig",
      notSet: "Nicht festgelegt",
    },
    cta: {
      upgrade: "Plan upgraden",
      downgrade: "Plan herabstufen",
      cancel: "Abonnement kündigen",
      manage: "Im Bereich verwalten",
      resume: "Abonnement fortsetzen",
    },
    paymentIssue: {
      title: "Zahlung erfordert Aufmerksamkeit",
      description:
        "Die letzte Verlängerung konnte nicht eingezogen werden. Aktualisieren Sie Ihre Zahlungsmethode, um dieses Abonnement aktiv zu halten.",
      updatePaymentCta: "Zahlungsmethode aktualisieren",
    },
    summary: {
      activeTemplate: "{count} aktiv",
      pausedTemplate: "{count} pausiert",
      totalTemplate: "{count} Plan{plural}",
    },
  },
  referrals: {
    metadata: {
      title: "Empfehlungen",
      description:
        "Laden Sie qualifizierte Kunden zu HenryCo ein und verfolgen Sie Prämien von ausstehend über geprüft bis gutgeschrieben.",
    },
    hero: {
      title: "Empfehlungen",
      description:
        "Laden Sie qualifizierte Kunden zu HenryCo ein und verfolgen Sie Prämien von ausstehend über geprüft bis gutgeschrieben.",
    },
    code: {
      eyebrow: "Ihr Empfehlungscode",
      shareLinkLabel: "Freigabe-Link",
      copyCodeTitle: "Code kopieren",
      copyLinkTitle: "Link kopieren",
      copyLinkLabel: "Link kopieren",
      copiedToast: "Kopiert!",
      rewardNote:
        "Prämie: {amount} pro qualifizierter Empfehlung. Prämien werden freigegeben, sobald die geworbene Person innerhalb des {days}-Tage-Sperrfensters eine bezahlte Bestellung abschließt.",
    },
    stats: {
      totalReferred: "Insgesamt empfohlen",
      signedUp: "Angemeldet",
      qualified: "Qualifiziert",
      flagged: "Markiert",
      pendingRewards: "Ausstehende Prämien",
      releasedRewards: "Freigegebene Prämien",
    },
    howItWorks: {
      eyebrow: "So funktioniert es",
      step1Title: "Teilen Sie Ihren Code",
      step1Body:
        "Teilen Sie Ihren einzigartigen Code oder Link. Freunde, die mit Ihrem Link eine HenryCo-Subdomain besuchen, werden automatisch erfasst.",
      step2Title: "Sie tätigen einen Umsatz",
      step2Body:
        "Nach der Anmeldung beginnt für die Empfehlung ein Sperrfenster von {days} Tagen. Das geworbene Konto wird nur einmal gezählt — Selbstempfehlungen, Haushaltsduplikate und wiederverwendete Anmeldungen qualifizieren nicht.",
      step3Title: "Prämien werden nach Qualifizierung freigegeben",
      step3Body:
        "Qualifizierte Empfehlungen schreiben nach Finanzprüfung {amount} Ihrer HenryCo-Wallet gut. Ausstehende Prämien sind erst nach Freigabe ausgabefähig.",
    },
    policy: {
      eyebrow: "Empfehlungsrichtlinie",
      qualifying:
        "Eine qualifizierende Conversion bedeutet, dass das geworbene Konto eine berechtigte HenryCo-Aktion abgeschlossen hat, die die Zahlungs- und Vertrauensprüfung bestanden hat.",
      enforcement:
        "HenryCo kann Prämien für Selbstempfehlungen, doppelte Conversion-Schleifen, Stornos, Rückerstattungen oder verdächtige Prämienmuster zurückhalten, rückgängig machen oder stornieren.",
      separation:
        "Ihr Dashboard zeigt Empfehlungen und Prämienverlauf getrennt an, damit erfasste Anmeldungen nicht mit gutgeschriebenen Wallet-Einnahmen verwechselt werden.",
    },
    referralsList: {
      eyebrow: "Ihre Empfehlungen",
      emptyTitle: "Noch keine Empfehlungen",
      emptyDescription:
        "Teilen Sie Ihren Empfehlungscode, um andere einzuladen. Empfehlungen erscheinen hier, sobald sich jemand mit Ihrem Link anmeldet.",
      refereeFallback: "Empfohlene Anmeldung",
      signedUpTemplate: "Angemeldet am {date}",
      qualifiedTemplate: "Qualifiziert am {date}",
    },
    statusLabels: {
      pending: "Warten auf Anmeldung",
      converted: "Angemeldet · Sperrfrist",
      qualified: "Qualifiziert · Prämie freigegeben",
      flagged: "Markiert · Betrugsschutz",
      expired: "Abgelaufen",
    },
    flagReasons: {
      selfReferral: "Selbstempfehlung blockiert",
      duplicateEmail: "Doppelte Empfänger-E-Mail",
      deviceReuse: "Gerätewiederverwendung",
    },
    rewards: {
      eyebrow: "Prämienverlauf",
      emptyTitle: "Noch keine Prämien",
      emptyDescription:
        "Gutgeschriebene Prämien erscheinen hier, nachdem qualifizierende Conversions die Prüfung und den Missbrauchsschutz bestanden haben.",
      referralRewardFallback: "Empfehlungsprämie",
      paidTemplate: "Bezahlt am {date}",
      statusLabels: {
        held: "Gesperrt",
        pending: "Ausstehend",
        released: "Freigegeben",
        paid: "Bezahlt",
        cancelled: "Storniert",
      },
    },
  },
  divisionCare: {
    metadata: {
      title: "Care · verknüpfte Buchungen",
      description: "Verfolgen Sie jede HenryCo-Care-Buchung, die mit diesem Konto verknüpft ist – Status, Zahlungsprüfung und der nächste betriebliche Schritt an einem Ort.",
    },
    hero: {
      eyebrow: "Care · live",
      sideKicker: "So funktioniert dieser Bereich",
      sideTitle: "Auf Care buchen, hier weiterverfolgen.",
      sideBody: "Jede Buchung in HenryCo Care wird in diesen Bereich gespiegelt – Sendungscode, Zahlungsstatus und der nächste betriebliche Schritt landen hier automatisch. Das Dashboard unten bleibt während des Service synchron.",
      breakdownLabel: "Nach Status",
      tilesAriaLabel: "Zusammenfassung der Care-Buchungen",
      tileLabels: {
        total: "Buchungen",
        inFlight: "Im Service",
        payment: "Zahlung ausstehend",
        completed: "Abgeschlossen",
      },
      tileFoot: {
        totalEmpty: "Buchen Sie Ihren ersten Care-Service, um zu starten",
        totalWithTemplate: "{count} mit diesem Konto verknüpft",
        inFlightEmpty: "Aktuell ist nichts in Bewegung",
        inFlightWith: "Live-Status unten gespiegelt",
        paymentEmpty: "Keine offene Zahlungsprüfung",
        paymentWith: "Beleg unten einreichen oder prüfen",
        completedEmpty: "Noch keine abgeschlossenen Services",
        completedWith: "Vom Care-Team als erledigt markiert",
      },
      breakdownLabels: {
        inFlight: "Im Service",
        scheduled: "Geplant",
        payment: "Zahlung ausstehend",
        completed: "Abgeschlossen",
      },
      state: {
        empty: {
          headline: "Buchen Sie Ihren ersten Care-Service.",
          blurb: "Care-Services, die Sie hier buchen, synchronisieren sich automatisch mit diesem Bereich – Sendungscode, Zahlungsstatus und nächster betrieblicher Schritt.",
          ctaPrimary: "Service buchen",
          ctaSecondary: "Tracking öffnen",
        },
        attention: {
          headlineTemplateSingular: "{count} offene Aktion.",
          headlineTemplatePlural: "{count} offene Aktionen.",
          blurb: "Eine oder mehrere Buchungen warten auf Zahlungsprüfung oder Nachverfolgung. Öffnen Sie die Buchung unten, um sie abzuschließen.",
          ctaPrimary: "Buchungen prüfen",
          ctaSecondary: "Tracking öffnen",
        },
        active: {
          headlineTemplateSingular: "{count} Service in Bewegung.",
          headlineTemplatePlural: "{count} Services in Bewegung.",
          blurb: "Live-Tracking, Zahlungsprüfung und der nächste betriebliche Schritt werden aus HenryCo Care in diesen Bereich gespiegelt.",
          ctaPrimary: "Tracking öffnen",
          ctaSecondary: "Service buchen",
        },
        calm: {
          headlineTemplateSingular: "{count} verbuchte Buchung.",
          headlineTemplatePlural: "{count} verbuchte Buchungen.",
          blurb: "Ihre Care-Buchungen, Sendungscodes, Belege und anstehenden Aktionen – alles an einem Ort, in Echtzeit synchronisiert.",
          ctaPrimary: "Service buchen",
          ctaSecondary: "Tracking öffnen",
        },
      },
    },
    sections: {
      glance: "Nächste Aktion",
      glanceMeta: "Die zeitkritischste Buchung wird hier hervorgehoben.",
      bookings: "Alle Buchungen",
      bookingsEmpty: "Buchungen, die im eingeloggten Zustand erfolgen, erscheinen hier in Echtzeit.",
      bookingsMetaTemplateSingular: "{count} Buchung · filtern, paginieren und für die Live-Detailansicht öffnen.",
      bookingsMetaTemplatePlural: "{count} Buchungen · filtern, paginieren und für die Live-Detailansicht öffnen.",
      activity: "Aktuelle Aktivität",
      activityEmpty: "Statusaktualisierungen, Belege und Bewertungen erscheinen hier, sobald sie passieren.",
      activityMetaTemplateSingular: "{count} Aktualisierung · neueste zuerst",
      activityMetaTemplatePlural: "{count} Aktualisierungen · neueste zuerst",
    },
    empty: {
      title: "Noch keine Care-Buchungen verknüpft",
      body: "Buchungen, die Sie in Care eingeloggt vornehmen, erscheinen hier sofort. Ältere Buchungen tauchen ebenfalls auf, sobald deren E-Mail oder Telefonnummer mit Ihrem geteilten Profil übereinstimmt.",
    },
    glance: {
      nextActionLabel: "Nächste Aktion",
      serviceLabel: "Service",
      pickupLabel: "Abholung",
      balanceLabel: "Offener Betrag",
      trackingLabel: "Tracking",
      serviceFallback: "Care-Service",
    },
    activityAriaLabel: "Care-Aktivität",
    status: {
      live: "Im Service",
      scheduled: "Geplant",
      completed: "Abgeschlossen",
      issue: "Handlung erforderlich",
      payment: "Zahlungsprüfung",
    },
    statusValueLabels: {
      booked: "Gebucht",
      awaiting_payment: "Zahlung ausstehend",
      receipt_submitted: "Beleg eingereicht",
      under_review: "In Prüfung",
      delivered: "Geliefert",
      customer_confirmed: "Kundenbestätigt",
      inspection_completed: "Inspektion abgeschlossen",
      service_completed: "Service abgeschlossen",
      cancelled: "Storniert",
      issue: "Vorfall",
      exception: "Ausnahme",
      rejected: "Abgelehnt",
    },
    formatLabels: {
      toBeScheduled: "Noch zu planen",
      shortMonths: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"],
    },
    dashboard: {
      filters: {
        all: "Alle",
        unpaid: "Offener Betrag",
        receipt: "Beleg / Prüfung",
        active: "Laufend",
        completed: "Abgeschlossen",
        issue: "Vorfälle",
      },
      filtered: "gefiltert",
      bookingSingular: "Buchung",
      bookingPlural: "Buchungen",
      metrics: {
        visible: "Sichtbare Buchungen",
        visibleHint: "Echte Care-Buchungen, die mit diesem Konto verknüpft sind.",
        balance: "Ausstehender Betrag",
        balanceHintSomeTemplate: "{count} Buchung(en) benötigen noch eine Zahlungsnachverfolgung.",
        balanceHintNone: "Aktuell ist kein offener Care-Saldo vorhanden.",
        receiptQueue: "Belegwarteschlange",
        receiptQueueHintSome: "Buchungen mit eingereichten Belegen warten noch auf Prüfung.",
        receiptQueueHintNone: "Kein Rückstand bei der Belegprüfung mit diesem Konto verknüpft.",
        completed: "Abgeschlossen",
        completedHintSome: "Abgeschlossene Buchungen, die in die Bewertungsphase übergehen können.",
        completedHintNone: "Abgeschlossene Care-Buchungen erscheinen hier, sobald der Service abschließt.",
      },
      linkedBookings: "Verknüpfte Care-Buchungen",
      linkedBookingsDescription: "Ihre Care-Buchungen, der Zahlungsstatus und anstehende Aktionen.",
      onThisPage: "auf dieser Seite",
      selectedBooking: "Ausgewählte Buchung",
      paymentSnapshot: "Zahlungsübersicht",
      receiptVisibility: "Sichtbarkeit des Belegs",
      nextBestAction: "Beste nächste Aktion",
      serviceSummary: "Service-Zusammenfassung",
      serviceFallback: "Care-Service",
      addressPending: "Adresse steht aus",
      updated: "Aktualisiert",
      balanceDue: "Offener Betrag",
      nextMove: "Nächster Schritt",
      paginationLabel: "Paginierung der Care-Buchungen",
      pageLabel: "Seite",
      of: "von",
      perPage: "pro Seite",
      previous: "Zurück",
      next: "Weiter",
      customerFallback: "Kunde",
      scheduledDate: "Geplantes Datum",
      notScheduled: "Noch nicht geplant",
      timeWindow: "Zeitfenster",
      windowPending: "Zeitfenster steht aus",
      pickupAddress: "Abholadresse",
      returnAddress: "Rückgabe- / Lieferadresse",
      returnAddressFallback: "Verwendet die Abholadresse, sofern bei der Buchung nicht geändert",
      trackingCode: "Sendungscode",
      quotedTotal: "Angebotener Gesamtbetrag",
      amountRecorded: "Erfasster Betrag",
      receiptState: "Belegstatus",
      receiptsSubmitted: "Eingereichte Belege",
      lastSubmission: "Letzte Einreichung",
      noReceiptYet: "Noch kein Beleg",
      openLiveBooking: "Live-Buchung öffnen",
      leaveReview: "Bewertung abgeben",
    },
  },
  divisionProperty: {
    metadata: {
      title: "Property · Merkliste & Anfragen",
      description: "Ihre Property-Merkliste, Anfragen, Besichtigungen und Inseratsverläufe – jede Aktion in HenryCo Property wird in diesen Kontoraum gespiegelt.",
    },
    hero: {
      eyebrow: "Property · live",
      ariaLabel: "Property-Übersicht",
      browseListingsCta: "Angebote durchsuchen",
      savedShortlistCta: "Merkliste",
      tilesAriaLabel: "Property-Aktivität",
      tileLabels: {
        saved: "Gemerkt",
        inquiries: "Anfragen",
        viewings: "Besichtigungen",
        listings: "Inserate",
      },
      tileFoot: {
        savedManagedTemplate: "{count} von HenryCo verwaltet",
        savedEmpty: "Angebote merken, um eine Liste aufzubauen",
        savedWith: "Jederzeit vergleichen und erneut ansehen",
        inquiriesEmpty: "Noch keine offenen Gespräche",
        inquiriesWith: "Folge-Nachrichten landen in diesem Raum",
        viewingsEmpty: "Besichtigung für ein gemerktes Objekt anfragen",
        viewingsWith: "Bestätigungen synchronisieren über alle Geräte",
        listingsEmpty: "Ein Inserat auf Property einreichen",
        listingsWith: "Moderationsergebnisse erscheinen hier",
      },
      sideAriaLabel: "So funktioniert dieser Raum",
      sideKicker: "So funktioniert dieser Raum",
      sideTitle: "Auf Property entdecken, hier weitermachen.",
      sideBody:
        "Inserat merken, Besichtigung anfragen oder Anfrage öffnen auf HenryCo Property — jede Aktion wird in diesen Kontoraum gespiegelt, damit Sie geräteübergreifend dort weitermachen, wo Sie aufgehört haben.",
      sideBodyMuted:
        "Von HenryCo verwaltete Inserate tragen einen Verwaltet-Badge — Prüfung, Inspektion und Mietabwicklung werden vom Property-Team koordiniert.",
      breakdownAriaLabel: "Aktivitätsaufschlüsselung",
      breakdownLabel: "Nach Aktivität",
      breakdownLabels: {
        saved: "Gemerkt",
        inquiries: "Anfragen",
        viewings: "Besichtigungen",
        listings: "Inserate",
      },
      state: {
        empty: {
          headline: "Starten Sie auf HenryCo Property.",
          blurb:
            "Entdecken Sie Mietwohnungen, Verkaufsangebote und von HenryCo verwaltete Objekte. Merken Sie Ihre Favoriten — jede Anfrage, Besichtigung oder Inseratsmeldung landet automatisch hier.",
        },
        discover: {
          headlineTemplateSingular: "{count} gemerktes Zuhause.",
          headlineTemplatePlural: "{count} gemerkte Zuhause.",
          blurb:
            "Gemerkte Objekte, bereit zur erneuten Ansicht. Öffnen Sie ein Inserat, um eine Besichtigung anzufragen oder eine Anfrage zu senden — die Antwort landet direkt in diesem Raum.",
        },
        active: {
          viewingHeadlineTemplateSingular: "{count} Besichtigung geplant.",
          viewingHeadlineTemplatePlural: "{count} Besichtigungen geplant.",
          inquiryHeadlineTemplateSingular: "{count} Anfrage aktiv.",
          inquiryHeadlineTemplatePlural: "{count} Anfragen aktiv.",
          blurb:
            "Ihre Merkliste, Anfragen und Besichtigungstermine in einem Raum. Setzen Sie dort fort, wo Sie aufgehört haben — jede Aktion wird in Echtzeit aus HenryCo Property gespiegelt.",
        },
      },
    },
    sections: {
      saved: "Gemerkte Auswahl",
      savedMetaEmpty: "Inserate auf HenryCo Property merken, um Ihre Liste aufzubauen.",
      savedMetaTemplate: "{saved} gemerkt · {managed} von HenryCo verwaltet",
      activity: "Letzte Aktivität",
      activityMetaEmpty: "Anfragen, Besichtigungen und Inseratsprüfungen erscheinen hier in Echtzeit.",
      activityMetaTemplateSingular: "{count} Aktualisierung · neueste zuerst",
      activityMetaTemplatePlural: "{count} Aktualisierungen · neueste zuerst",
    },
    empty: {
      savedTitle: "Noch keine gemerkten Objekte",
      savedBody:
        "Entdecken Sie Mietwohnungen, Verkaufsangebote und von HenryCo verwaltete Objekte auf Property. Alles, was Sie merken, landet automatisch hier.",
      activityTitle: "Noch keine Property-Aktivität",
      activityBody:
        "Öffnen Sie ein Inserat auf HenryCo Property, um eine Besichtigung anzufragen oder eine Anfrage zu senden — jeder Schritt, von der ersten Nachricht bis zur Prüfung, erscheint hier.",
    },
    activity: {
      ariaLabel: "Property-Aktivität",
      titles: {
        inquiry: "Immobilienanfrage",
        viewing: "Besichtigungsanfrage",
        listing_submitted: "Inserat eingereicht",
        listing_updated: "Inserat aktualisiert",
        listing_reviewed: "Inseratsprüfung abgeschlossen",
      },
    },
    gallery: {
      ariaLabel: "Gemerkte Objekte",
      managedBadge: "Verwaltet",
      featuredBadge: "Hervorgehoben",
      locationPending: "Lage in Klärung",
      contactAgent: "Makler kontaktieren",
      savedAtTemplate: "Gemerkt am {date}",
      bedSingular: "Zimmer",
      bedPlural: "Zimmer",
      bathSingular: "Bad",
      bathPlural: "Bäder",
      sizeSqmTemplate: "{size} m²",
    },
  },
  divisionJobs: {
    metadata: {
      title: "Jobs · Kandidaten-Dashboard",
      description: "Verfolgen Sie jede mit diesem Konto verknüpfte HenryCo-Jobs-Bewerbung, gemerkte Stelle, Recruiter-Aktualisierung und Profilbereitschaft.",
    },
    header: {
      title: "Jobs",
      description: "Ihre Bewerbungen, gemerkten Stellen, Recruiter-Updates und Profilstärke — alles an einem Ort.",
      candidateModuleCta: "Kandidaten-Modul",
      interviewRoomsCta: "Interview-Räume",
      browseLiveRolesCta: "Aktive Stellen durchsuchen",
    },
    hero: {
      eyebrow: "Ihr Konto",
      headline: "Ihre Jobs-Aktivität, alles an einem Ort.",
      body: "Bewerbungen, gemerkte Stellen, Recruiter-Updates und Profilbereitschaft sind mit Ihrem HenryCo-Konto verknüpft.",
      statsAriaLabel: "Jobs-Aktivitätsübersicht",
      statLabels: {
        applications: "Aktive Bewerbungen",
        saved: "Gemerkte Stellen",
        readiness: "Profilbereitschaft",
        updates: "Recruiter-Updates",
      },
      statDetails: {
        applicationsLeadingTemplate: "{stage} ist Ihre führende aktive Phase.",
        applicationsEmpty: "Noch keine aktiven Bewerbungen.",
        savedSome: "Ihre Vorauswahl ist bereit für eine weitere Sichtung.",
        savedEmpty: "Bauen Sie eine Vorauswahl auf, damit gute Stellen leichter wiederzufinden sind.",
        updatesLatestTemplate: "{relative} letzte Bewegung.",
        updatesEmpty: "Noch keine Recruiter-Updates.",
      },
    },
    sections: {
      nextActionsKicker: "Nächste Schritte",
      nextActionsTitle: "Was jetzt Ihre Aufmerksamkeit verdient",
      openTimelineCta: "Zeitleiste öffnen",
      applicationsKicker: "Bewerbungen",
      applicationsTitle: "Live-Bewegung im Einstellungsprozess",
      savedKicker: "Gemerkte Stellen",
      savedTitle: "Vorauswahl mit besserem Kontext",
      openSavedRolesCta: "Gemerkte Stellen öffnen",
      recommendedKicker: "Empfohlene Stellen",
      recommendedTitle: "Was zu Ihrem aktuellen Signal passt",
      browseCatalogCta: "Katalog durchsuchen",
      recruiterFeedKicker: "Recruiter-Feed",
      recruiterFeedTitle: "Nachrichten, Phasenwechsel und Hinweise",
      candidateInboxCta: "Kandidaten-Postfach",
      profileKicker: "Profilstärke",
      profileTitle: "Kandidatenbereitschaft und Lebenslauf-Qualität",
      sharedInboxKicker: "Gemeinsames Postfach",
      sharedInboxTitle: "Mit Ihrem Konto verknüpfte Jobs-Benachrichtigungen",
      alertsKicker: "Benachrichtigungen",
      alertsTitle: "Gespeicherte Sucheintention",
    },
    empty: {
      applicationsTitle: "Noch keine aktiven Bewerbungen",
      applicationsBody: "Gemerkte Stellen, Recruiter-Updates und Zeitleisten erscheinen hier, sobald Sie aus dem Durchsuchen in eine aktive Bewerbung übergehen.",
      exploreJobsCta: "Jobs erkunden",
      savedJobsTitle: "Noch keine gemerkten Stellen",
      savedJobsBody: "Merken Sie sich vielversprechende Stellen, um sie in Jobs und Ihrem Konto in der Vorauswahl zu behalten.",
      recommendedTitle: "Empfehlungen werden mit der Nutzung schärfer",
      recommendedBody: "Sobald Profil, Vorauswahl und Bewerbungen wachsen, werden die Stellenempfehlungen hier zielgenauer.",
      recruiterFeedTitle: "Noch keine Recruiter-Bewegung",
      recruiterFeedBody: "Phasenwechsel von Bewerbungen, geteilte Recruiter-Notizen und In-App-Jobs-Benachrichtigungen sammeln sich hier.",
      notificationsTitle: "Noch keine Jobs-Benachrichtigungen",
      notificationsBody: "Künftige Vorauswahl-Bewegungen, Arbeitgeber-Updates und Bewerbungsänderungen landen hier und im Jobs-Modul.",
      alertsTitle: "Keine aktiven Jobs-Benachrichtigungen",
      alertsBody: "Richten Sie eine Benachrichtigung ein, damit neue passende Stellen in Ihrem Jobs-Feed erscheinen.",
      browseRolesCta: "Stellen durchsuchen",
    },
    application: {
      progressPercentTemplate: "{percent}% abgeschlossen",
      appliedAtTemplate: "Beworben am {date}",
      candidateReadiness: "Kandidatenbereitschaft",
      recruiterConfidence: "Recruiter-Vertrauen",
      latestMovement: "Letzte Recruiter-Bewegung",
      nextBestMove: "Nächster bester Schritt",
      openTimelineCta: "Zeitleiste öffnen",
      interviewRoomCta: "Interview-Raum",
      viewRoleCta: "Stelle ansehen",
    },
    savedJob: {
      trustTemplate: "Vertrauen {score}",
      savedAtTemplate: "Gemerkt am {date}",
    },
    recommended: {
      compFallback: "Vergütung wird im Verlauf besprochen",
    },
    stageLabels: {
      applied: "Beworben",
      reviewing: "Sichtung",
      shortlisted: "Vorausgewählt",
      interview: "Interview",
      offer: "Angebot",
      hired: "Eingestellt",
      rejected: "Abgelehnt",
    },
    nextStep: {
      labels: {
        applied: "Halten Sie Profil und Lebenslauf aktuell",
        shortlisted: "Halten Sie Nachweise und Portfolio-Kontext bereit",
        interview: "Bereiten Sie Beispiele und Terminblöcke vor",
        offer: "Prüfen Sie Umfang, Timing und Vergütung",
        rejected: "Stärken Sie das nächste Bewerbungspaket",
      },
      bodies: {
        applied: "In der Frühphase helfen schärfere Nachweise, saubere Kontaktdaten und ein aktueller Lebenslauf.",
        shortlisted: "Vorauswahl heißt, Sie haben die erste Signalprüfung bestanden. Klare Nachweise zählen jetzt.",
        interview: "Interviewphasen laufen schneller, wenn Ihre besten Arbeitsnachweise und Verfügbarkeit leicht ersichtlich sind.",
        offer: "Nutzen Sie die Angebotsphase, um Unklarheiten zu klären, nicht um Verantwortlichkeiten zu erraten.",
        rejected: "Sehen Sie die Absage als Signal. Verfeinern Sie Zusammenfassung, Beispiele und Rollenpassung vor der nächsten Bewerbung.",
      },
    },
    readinessLabels: {
      interviewReady: "Interview-bereit",
      strongProfile: "Starkes Profil",
      needsProof: "Nachweise nötig",
      needsStructure: "Struktur nötig",
    },
    workModeLabels: {
      remote: "Remote",
      hybrid: "Hybrid",
      onsite: "Vor Ort",
    },
    employmentTypeLabels: {
      fullTime: "Vollzeit",
      partTime: "Teilzeit",
      contract: "Werkvertrag",
      internship: "Praktikum",
      temporary: "Befristet",
    },
    profile: {
      readinessLabel: "Bereitschaft",
      skillsMappedLabel: "Erfasste Fähigkeiten",
      filesLabel: "Dateien",
      improveProfileCta: "Profil verbessern",
      openCandidateModuleCta: "Kandidaten-Modul öffnen",
      checklist: {
        identityLabel: "Profilgrundlagen",
        identityDetail: "Vollständiger Name, Telefon und Standort sind für Recruiter-Folgekontakte vorhanden.",
        storyLabel: "Rollengeschichte",
        storyDetail: "Headline und Zusammenfassung erklären, was Sie tun, über einen leeren Eintrag hinaus.",
        verificationLabel: "Identitätsprüfung",
        verificationDetail: "Das Jobs-Vertrauen bleibt begrenzt, bis Ihr HenryCo-Konto die Identitätsprüfung bestanden hat.",
        proofLabel: "Arbeitsnachweise",
        proofDetail: "Lebenslauf plus Portfolio-Nachweise erleichtern den Sprung in die Vorauswahl.",
        skillsLabel: "Erfasste Fähigkeiten",
        skillsDetail: "Mindestens vier Fähigkeiten und bevorzugte Funktionen verbessern die Empfehlungen.",
      },
    },
    nextActions: {
      gapTemplate: "Lücke {label} schließen",
      interviewLabel: "Auf eine Interviewphase vorbereiten",
      offerLabel: "Auf ein aktives Angebot reagieren",
      attentionTemplate: "{title} bei {employer} braucht jetzt Aufmerksamkeit.",
      convertSavedLabel: "Eine gemerkte Stelle in eine aktive Bewerbung umwandeln",
      convertSavedTemplate: "{title} steht bereits auf Ihrer Vorauswahl und ist bereit für eine vertiefte Sichtung.",
      restartLabel: "Starten Sie die Jobsuche mit strengeren Filtern neu",
      restartDetail: "Filtern Sie nach verifizierten Arbeitgebern und internen Stellen, um eine sauberere Vorauswahl schneller aufzubauen.",
    },
    alertStatus: {
      active: "Aktiv",
      paused: "Pausiert",
    },
    recruiterUpdateTitleTemplate: "{stage}-Aktualisierung",
  },
  divisionMarketplace: {
    metadata: {
      title: "Marketplace · Bestellungen & Verkaufsaktivität",
      description: "Verfolgen Sie jede HenryCo-Marketplace-Bestellung, jeden Streitfall und jede Verkäuferauszahlung, die mit diesem Konto verknüpft ist – Käuferaktivität und Verkäufer-Workspace gespiegelt in einem Raum, in Echtzeit.",
    },
    hero: {
      eyebrow: "Marketplace · live",
      ariaLabel: "Marketplace-Übersicht",
      sideAriaLabel: "So funktioniert dieser Bereich",
      sideKicker: "So funktioniert dieser Bereich",
      sideTitle: "Kaufen und verkaufen – ein Raum.",
      sideBody: "Jede Bestellung, jeder Streitfall und jede Auszahlungsanforderung, die Sie auf Marketplace anlegen, wird in diesen Raum gespiegelt. Aktivität aus dem Verkäufer-Workspace fließt parallel zu den Käuferbestellungen hier ein, sodass beide Seiten des Marketplace auf einen Blick sichtbar bleiben.",
      breakdownLabel: "Nach Status",
      breakdownAriaLabel: "Aktivitätsverteilung",
      tilesAriaLabel: "Marketplace-Aktivität",
      tileLabels: {
        orders: "Bestellungen",
        disputes: "Streitfälle",
        store: "Shop",
        payouts: "Auszahlungen",
      },
      tileFoot: {
        ordersEmpty: "Die erste Bestellung erscheint hier",
        ordersInMotionTemplate: "{inFlight} in Bewegung · {delivered} geliefert",
        ordersDeliveredTemplate: "{delivered} bis heute geliefert",
        disputesClear: "Alles klar",
        disputesActiveTemplate: "{open} offen · {resolving} in Klärung",
        storeActiveNoName: "Verkäufermitgliedschaft aktiv",
        storeActiveWithNameTemplate: "Shop: {name}",
        storeApplicationTemplate: "Bewerbung: {status}",
        storeIdle: "Noch nicht verkaufend – bewerben Sie sich, wenn Sie bereit sind",
        payoutsEmptyNoneSettled: "Noch keine Auszahlungsanforderungen",
        payoutsSettledTemplate: "{count} bis heute ausgezahlt",
        payoutsPendingTemplate: "{amount} ausstehend",
      },
      breakdownLabels: {
        inMotion: "In Bewegung",
        openDisputes: "Offene Streitfälle",
        delivered: "Geliefert",
        pendingPayouts: "Ausstehende Auszahlungen",
      },
      state: {
        empty: {
          headline: "Starten Sie den Einkauf auf HenryCo Marketplace.",
          blurb: "Bestellungen, Streitfälle, Verkäuferaktivität und Auszahlungen werden ab der ersten Transaktion in diesen Raum gespiegelt. Durchsuchen Sie den Marketplace, um zu starten.",
          ctaPrimary: "Marketplace öffnen",
          ctaSecondary: "Als Verkäufer bewerben",
        },
        attention: {
          headlineTemplateSingular: "{count} Vorgang braucht Aufmerksamkeit.",
          headlineTemplatePlural: "{count} Vorgänge brauchen Aufmerksamkeit.",
          blurb: "Streitfälle und Ausnahmebestellungen rücken nach oben. Öffnen Sie den Fall, um Belege zu ergänzen oder die Lösung anzunehmen.",
          ctaPrimary: "Vorgänge prüfen",
          ctaSecondary: "Marketplace öffnen",
        },
        activeOrders: {
          headlineTemplateSingular: "{count} Bestellung in Bewegung.",
          headlineTemplatePlural: "{count} Bestellungen in Bewegung.",
          blurb: "Live-Bestellstatus, Zahlungsstand und Verkäufer-Nachverfolgung werden in Echtzeit aus HenryCo Marketplace in diesen Raum gespiegelt.",
          ctaPrimary: "Marketplace öffnen",
          ctaSecondary: "Als Verkäufer bewerben",
        },
        activePayouts: {
          headlineTemplateSingular: "{count} Auszahlung in Prüfung.",
          headlineTemplatePlural: "{count} Auszahlungen in Prüfung.",
          blurb: "Auszahlungsanforderungen durchlaufen die Finanzprüfung. Statusänderungen erscheinen hier, sobald das Team weiterarbeitet.",
          ctaPrimary: "Verkäufer-Workspace öffnen",
          ctaSecondary: "Marketplace öffnen",
        },
        calmBuyer: {
          headlineTemplateSingular: "{count} Bestellung verbucht.",
          headlineTemplatePlural: "{count} Bestellungen verbucht.",
          blurb: "Ihre gesamte Marketplace-Aktivität in einem Raum – Käuferbestellungen, Verkäuferauszahlungen, Streitfallergebnisse und der aktuelle Status jedes Shops.",
          ctaPrimary: "Marketplace öffnen",
          ctaSecondary: "Als Verkäufer bewerben",
        },
        calmSeller: {
          headlineTemplateSingular: "{count} Bestellung · Verkäufer aktiv.",
          headlineTemplatePlural: "{count} Bestellungen · Verkäufer aktiv.",
          blurb: "Ihre gesamte Marketplace-Aktivität in einem Raum – Käuferbestellungen, Verkäuferauszahlungen, Streitfallergebnisse und der aktuelle Status jedes Shops.",
          ctaPrimary: "Marketplace öffnen",
          ctaSecondary: "Verkäufer-Workspace öffnen",
        },
      },
    },
    sections: {
      matters: {
        title: "Aktive Vorgänge",
        meta: "Streitfälle, Status der Verkäuferbewerbung und ausstehende Auszahlungen erscheinen hier, sobald Handlung nötig ist.",
        ariaLabel: "Aktive Marketplace-Vorgänge",
        emptyTitle: "Nichts erfordert Handlung",
        emptyBody: "Ihre gesamte Marketplace-Aktivität läuft normal – keine offenen Streitfälle, keine Auszahlungen in Prüfung, und (falls zutreffend) Ihre Verkäuferbewerbung ist genehmigt.",
      },
      orders: {
        title: "Aktuelle Bestellungen",
        empty: "Auf Marketplace aufgegebene Bestellungen erscheinen hier in Echtzeit.",
        metaTemplateSingular: "{count} Bestellung · neueste zuerst",
        metaTemplatePlural: "{count} Bestellungen · neueste zuerst",
        emptyTitle: "Noch keine Bestellungen",
        emptyBody: "Geben Sie Ihre erste Bestellung auf HenryCo Marketplace auf – Status, Zahlung und jede Nachverfolgung landen hier automatisch.",
        ariaLabel: "Aktuelle Bestellungen",
      },
      activity: {
        title: "Aktuelle Aktivität",
        empty: "Statusaktualisierungen, Zahlungen und Bewertungen werden hier in Echtzeit gespiegelt.",
        metaTemplateSingular: "{count} Aktualisierung · neueste zuerst",
        metaTemplatePlural: "{count} Aktualisierungen · neueste zuerst",
        emptyTitle: "Noch keine Marketplace-Aktivität",
        emptyBody: "Bestellbestätigungen, Streitfall-Updates und Verkäuferauszahlungsergebnisse erscheinen hier, sobald sie passieren.",
        ariaLabel: "Marketplace-Aktivität",
      },
    },
    matters: {
      disputes: {
        kicker: "Streitfälle",
        titleTemplateSingular: "{count} Fall braucht Handlung",
        titleTemplatePlural: "{count} Fälle brauchen Handlung",
        bodyLatestTemplate: "Zuletzt: {ref} · aktualisiert {stamp}",
        bodyFallback: "Öffnen Sie die Warteschlange, um Belege zu ergänzen.",
        cta: "Fälle prüfen",
      },
      application: {
        kicker: "Verkäuferbewerbung",
        bodyWithStoreTemplate: "Shop: {name}",
        bodyDefault: "Bewerbung in der HenryCo-Prüfwarteschlange.",
        bodyReviewSuffixTemplate: " · {note}",
        cta: "Status ansehen",
        defaultStatus: "eingereicht",
      },
      payouts: {
        kicker: "Auszahlungen in Prüfung",
        titleTemplate: "{amount} ausstehend",
        bodyTemplateSingular: "{count} Anfrage wartet auf Finanzprüfung.",
        bodyTemplatePlural: "{count} Anfragen warten auf Finanzprüfung.",
        cta: "Verkäufer-Workspace öffnen",
      },
    },
    orders: {
      rowTitleTemplate: "Bestellung {orderNo}",
      rowSubTemplate: "{amount} · aufgegeben {stamp}",
      rowAriaLabelTemplate: "Bestellung {orderNo} · {status}",
      statusFallbackDraft: "Entwurf",
    },
    statusValueLabels: {
      delivered: "Geliefert",
      completed: "Abgeschlossen",
      customer_confirmed: "Kundenbestätigt",
      fulfilled: "Erfüllt",
      cancelled: "Storniert",
      refunded: "Erstattet",
      disputed: "Streitfall",
      exception: "Ausnahme",
      placed: "Aufgegeben",
      paid: "Bezahlt",
      awaiting_fulfilment: "Wartet auf Versand",
      confirmed: "Bestätigt",
      queued: "In Warteschlange",
    },
    applicationStatusLabels: {
      submitted: "eingereicht",
      under_review: "in Prüfung",
      approved: "genehmigt",
      rejected: "abgelehnt",
      pending_documents: "Unterlagen ausstehend",
      changes_requested: "Änderungen angefordert",
    },
    formatLabels: {
      dash: "—",
    },
  },
  "divisionLogistics": {
    "metadata": {
      "title": "Logistik · Lieferungen und Sendungen",
      "description": "Jede Abholung, Zustellung, ETA und Liefernachweis von HenryCo Logistik, die mit diesem Konto verknüpft sind — vom Logistiknetz in einen ruhigen Raum gespiegelt."
    },
    "hero": {
      "ariaLabel": "Logistik-Überblick",
      "eyebrow": "HenryCo Logistik",
      "brand": "HenryCo Logistik",
      "title": "Jedes Paket, ein Raum.",
      "body": "Abholungen, Zustellungen, ETAs und Liefernachweise — alles aus dem Logistiknetz in Ihr Konto gespiegelt. Buchen Sie einmal auf",
      "bodyDomain": " logistics.henrycogroup.com",
      "ctaNewDelivery": "Neue Lieferung"
    },
    "metrics": {
      "ariaLabel": "Logistikleistung",
      "activeNowLabel": "Jetzt aktiv",
      "activeFootSingular": "Sendung unterwegs",
      "activeFootPlural": "Sendungen unterwegs",
      "deliveredMonthLabel": "Zugestellt · diesen Monat",
      "deliveredMonthFootTemplate": "{count} insgesamt",
      "onTimeRateLabel": "Pünktlichkeitsrate",
      "onTimeRateFootEmpty": "Warten auf erste geplante Zustellung",
      "onTimeRateFootHasValue": "Der geplanten Zustellungen",
      "totalSpendLabel": "Gesamtausgaben",
      "totalSpendFoot": "Lebenslang gezahlt"
    },
    "map": {
      "noShipmentsAriaLabel": "Noch keine Sendungen",
      "noShipmentsTitle": "Ihre Karte leuchtet auf, sobald Sie Ihre erste Lieferung buchen",
      "noShipmentsBody": "Jede aktive Abholung und Zustellung wird hier automatisch angepinnt. Einmal buchen und Ihre Sendungen spiegeln sich aus der Logistik zurück.",
      "noShipmentsCta": "Lieferung buchen",
      "pendingAriaLabel": "Kartenvorschau",
      "pendingTitle": "Geocodierung läuft",
      "pendingBody": "Ihre aktiven Sendungen werden auf der Karte angepinnt, sobald die Abhol- und Zustelladressen vom Dispatch geocodiert sind.",
      "activeAriaLabel": "Karte der aktiven Sendungen",
      "altTemplateSingular": "Karte mit {count} aktiven Abhol- und Zustell-Pin",
      "altTemplatePlural": "Karte mit {count} aktiven Abhol- und Zustell-Pins",
      "liveBadgeTemplateSingular": "Live · {count} aktive Sendung",
      "liveBadgeTemplatePlural": "Live · {count} aktive Sendungen"
    },
    "sections": {
      "activeTitle": "Jetzt unterwegs",
      "activeMetaTemplate": "{count} aktiv · automatische Synchronisation aus der Logistik",
      "activeRailAriaLabel": "Aktive Sendungen",
      "emptyAriaLabel": "Keine aktiven Sendungen",
      "emptyTitle": "Keine aktiven Sendungen",
      "emptyBody": "Ihre vergangenen Zustellungen sind unten. Buchen Sie eine weitere und sie erscheint hier, sobald der Fahrer die Abholung bestätigt.",
      "actionsTitle": "Lieferung starten",
      "actionsMeta": "Verknüpfungen zu häufigen Abläufen",
      "actionsAriaLabel": "Logistik-Schnellaktionen",
      "recentTitle": "Kürzlich zugestellt",
      "recentMetaTemplate": "Letzte {recent} von {lifetime} insgesamt",
      "recentAriaLabel": "Kürzliche Zustellungen",
      "spendTitle": "Ausgaben · letzte 6 Monate",
      "spendMeta": "Nur bezahlt",
      "spendFigureAriaLabelTemplate": "Logistikausgaben der letzten 6 Monate"
    },
    "statusLabels": {
      "quoteRequested": "Angebot ausstehend",
      "quoteSent": "Angebot bereit",
      "pendingPayment": "Zahlung ausstehend",
      "scheduled": "Geplant",
      "assigned": "Fahrer zugewiesen",
      "pickupConfirmed": "Abgeholt",
      "inTransit": "Unterwegs",
      "delayed": "Verspätet",
      "attemptedDelivery": "Zustellversuch",
      "delivered": "Zugestellt",
      "completed": "Abgeschlossen",
      "closed": "Geschlossen",
      "cancelled": "Storniert",
      "refunded": "Erstattet"
    },
    "urgencyLabels": {
      "standard": "Standard",
      "sameDay": "Am selben Tag",
      "express": "Express",
      "nextDay": "Am nächsten Tag"
    },
    "serviceLabels": {
      "scheduled": "Geplant",
      "sameDay": "Am selben Tag",
      "interCity": "Zwischen Städten",
      "bulk": "Sammelgut"
    },
    "shipment": {
      "trackingCodeAriaTemplate": "Sendungsverfolgungscode {code}",
      "addressPending": "Adresse ausstehend",
      "etaPending": "ETA ausstehend",
      "trackCta": "Sendung verfolgen",
      "openTrackingAriaTemplate": "Verfolgung für {code} öffnen",
      "etaAriaTemplate": "ETA {eta}",
      "etaMinutesInTemplate": "in {minutes} Min.",
      "etaMinutesOverdueTemplate": "{minutes} Min. überfällig",
      "etaHoursInTemplate": "in {hours} Std.",
      "etaHoursOverdueTemplate": "{hours} Std. überfällig",
      "detailSeparator": " · "
    },
    "timeline": {
      "ariaLabel": "Kürzliche Zustellungen",
      "deliveredToTemplate": "Zugestellt an {name}",
      "receiptCta": "Beleg"
    },
    "quickActions": {
      "ariaLabel": "Logistik-Schnellaktionen",
      "bookLabel": "Lieferung buchen",
      "bookDesc": "Abholung und Zustellung in einem geführten Ablauf.",
      "trackLabel": "Per Code verfolgen",
      "trackDesc": "Live-Status, ETA und Fahrer-Kontext.",
      "quoteLabel": "Erst Angebot",
      "quoteDesc": "Richtpreis, bevor Sie sich festlegen.",
      "addressesLabel": "Gespeicherte Adressen",
      "addressesDesc": "Abhol- und Zustellkontakte.",
      "invoicesLabel": "Belege & Rechnungen",
      "invoicesDesc": "Gebrandete PDFs für jede Sendung.",
      "supportLabel": "Logistik-Support",
      "supportDesc": "Einen Thread mit Bezug zu Ihrem Konto öffnen."
    },
    "spend": {
      "figureAriaLabel": "Logistikausgaben der letzten 6 Monate",
      "emptyTick": "—"
    }
  },
  "divisionLearn": {
    "metadata": {
      "title": "Learn · Lern-Dashboard",
      "description": "Verfolgen Sie jede HenryCo-Learn-Einschreibung, Lektion, Quizergebnis, Zertifizierung, zugewiesene Schulung und Lehrbewerbung, die mit diesem Konto verknüpft ist – Katalog auf Learn, Fortschritt hier gespiegelt."
    },
    "hero": {
      "ariaLabel": "Learn-Übersicht",
      "eyebrow": "Learn · live",
      "sideKicker": "So funktioniert dieser Bereich",
      "sideTitle": "Katalog auf Learn, Fortschritt hier.",
      "sideBody": "Jede Lektion, jedes Quiz und jedes Zertifikat aus HenryCo Learn synchronisiert sich in diesen Bereich – nehmen Sie auf, wo Sie aufgehört haben, sehen Sie Ihren Fortschritt auf einen Blick und behalten Sie alle Nachweise an einem Ort.",
      "breakdownLabel": "Nach Status",
      "breakdownAriaLabel": "Aufschlüsselung der Lernaktivität",
      "tilesAriaLabel": "Lernaktivität",
      "tileLabels": {
        "active": "Aktiv",
        "completed": "Abgeschlossen",
        "certificates": "Zertifikate",
        "assignments": "Zugewiesen"
      },
      "tileFoot": {
        "activeEmpty": "Schreiben Sie sich ein, um einen Kurs zu starten",
        "activeWith": "Lektions- und Quiz-Fortschritt wird hier gespiegelt",
        "completedEmpty": "Abgeschlossene Programme erscheinen hier",
        "completedWith": "Praktisch für Lebensläufe und Berichte",
        "certificatesEmpty": "Verdienen Sie eines durch Kursabschluss",
        "certificatesWith": "Verifizierbare Links zu jedem Nachweis",
        "assignmentsEmpty": "Aktuell nichts zugewiesen",
        "assignmentsWith": "Von Ihrem Team oder Vorgesetzten"
      },
      "breakdownNames": {
        "active": "Aktiv",
        "assigned": "Zugewiesen",
        "certificates": "Zertifikate",
        "saved": "Gemerkt"
      },
      "openLearnCta": "HenryCo Learn öffnen",
      "applyToTeachCta": "Als Lehrkraft bewerben",
      "state": {
        "empty": {
          "headline": "Starten Sie Ihre HenryCo-Learn-Reise.",
          "blurb": "Durchsuchen Sie den Katalog, schreiben Sie sich in einen Kurs ein, und jede Lektion, jedes Quiz und jedes Zertifikat synchronisieren sich automatisch in diesen Bereich."
        },
        "active": {
          "headlineTemplateSingular": "{count} Kurs läuft.",
          "headlineTemplatePlural": "{count} Kurse laufen.",
          "blurb": "Nehmen Sie dort auf, wo Sie aufgehört haben – Lektionen, Quizze, Zertifikate und zugewiesene Schulungen synchronisieren sich aus HenryCo Learn in diesen Bereich."
        },
        "calm": {
          "headlineTemplateSingular": "{count} Kurs abgeschlossen.",
          "headlineTemplatePlural": "{count} Kurse abgeschlossen.",
          "blurb": "Ihre Nachweise und Lernhistorie bleiben hier – praktisch für Lebensläufe, internes Reporting oder Ihre eigene Ablage."
        }
      }
    },
    "sections": {
      "coursesTitle": "Lernen fortsetzen",
      "coursesMetaEmpty": "Durchsuchen Sie den HenryCo-Learn-Katalog und schreiben Sie sich in Ihren ersten Kurs ein.",
      "coursesMetaTemplate": "{active} aktiv · {completed} abgeschlossen",
      "extrasTitle": "Nachweise, Zuweisungen und Lehre",
      "extrasMeta": "Zertifikate, zugewiesene Schulungen, gemerkte Kurse und Lehrbewerbung leben hier.",
      "activityTitle": "Neueste Aktivität",
      "activityMetaTemplateSingular": "{count} Aktualisierung · neueste zuerst",
      "activityMetaTemplatePlural": "{count} Aktualisierungen · neueste zuerst",
      "activityMetaEmpty": "Lektionen, Quizze, Zertifikate und Zahlungen werden hier in Echtzeit gespiegelt."
    },
    "empty": {
      "coursesTitle": "Noch keine Kurse verknüpft",
      "coursesBody": "Durchsuchen Sie den Katalog auf HenryCo Learn und schreiben Sie sich ein. Ihr Platz erscheint hier automatisch.",
      "activityTitle": "Noch keine Learn-Aktivität",
      "activityBody": "Kursfortschritt, Quizergebnisse, Zertifikatsausstellung und Zahlungsbelege erscheinen hier in Echtzeit."
    },
    "courses": {
      "ariaLabel": "Kurse",
      "completedAtTemplate": "Abgeschlossen {date}",
      "progressPercentTemplate": "{percent}% abgeschlossen",
      "statusDelimiter": " · "
    },
    "extras": {
      "ariaLabel": "Learn-Ergänzungen",
      "certificatesTitle": "Zertifikate",
      "assignmentsTitle": "Zugewiesene Lerninhalte",
      "savedTitle": "Gemerkte Kurse",
      "teachingTitle": "Mit HenryCo unterrichten",
      "statusLabel": "Status",
      "expertiseLabel": "Fachgebiet",
      "topicsLabel": "Themen",
      "openApplicationCta": "Bewerbung öffnen",
      "applyToTeachCta": "Als Lehrkraft bewerben",
      "teachingEmpty": "Wir prüfen Lehrbewerbungen manuell. Bewerben Sie sich auf HenryCo Learn, der Status wird zurück hierher synchronisiert."
    },
    "activity": {
      "ariaLabel": "Learn-Aktivität",
      "fallbackTitle": "Learn-Aktivität"
    }
  },
  divisionStudio: {
    metadata: {
      title: "Studio · Projekträume",
      description: "Verfolgen Sie jede HenryCo-Studio-Zusammenarbeit, die mit diesem Konto verknüpft ist — Angebote, Meilensteine, Zahlungen, Lieferobjekte und Aktivitäten in einem Raum.",
    },
    hero: {
      eyebrowLive: "Studio · live",
      overviewAriaLabel: "Studio-Übersicht",
      activityAriaLabel: "Studio-Aktivität",
      sideAriaLabel: "So funktioniert dieser Raum",
      sideLabel: "So funktioniert dieser Raum",
      sideTitle: "Ein Projektraum, echter Stand.",
      sideBody: "Angebote, Meilensteine, Zahlungsnachweise, Lieferobjekte und Kommunikationssignale bleiben mit derselben HenryCo-Identität verbunden, die Sie überall verwenden. Das Dashboard unten zeigt den tatsächlichen Fortschritt des Studio-Teams – keine Statusliste.",
      breakdownAriaLabel: "Aktivitätsaufschlüsselung",
      breakdownLabel: "Nach Status",
      tiles: {
        activeLabel: "Aktive Projekte",
        activeFootEmpty: "Derzeit keine aktiven Arbeitsräume",
        activeFootHasValue: "Aktive Arbeitsräume mit Lieferbewegung",
        pendingLabel: "Ausstehende Zahlungen",
        pendingFootEmpty: "Kommerzieller Korridor frei",
        pendingFootHasValue: "Kommerzielle Checkpoints noch offen",
        proofLabel: "Nachweise eingereicht",
        proofFootEmpty: "Nichts wartet auf Prüfung",
        proofFootHasValue: "Zahlungen warten auf Studio-Prüfung",
        deliverablesLabel: "Lieferobjekte",
        deliverablesFootEmpty: "Dateien erscheinen hier, sobald Studio sie hochlädt",
        deliverablesFootHasValue: "Dateien und Ergebnisse an einem Ort verfolgt",
      },
      breakdown: {
        active: "Aktiv",
        readyReview: "Bereit zur Prüfung",
        pendingPayment: "Zahlung ausstehend",
        proofSubmitted: "Nachweis eingereicht",
      },
      state: {
        empty: {
          headline: "Starten Sie ein Studio-Briefing.",
          blurb: "Wenn ein Angebot oder Projekt mit Ihrer HenryCo-Identität live geht, erscheint hier der synchronisierte Studio-Raum — Meilensteine, Zahlungen, Lieferobjekte und der nächste Schritt zusammen.",
          ctaPrimary: "Briefing starten",
          ctaSecondary: "Studio öffnen",
        },
        attention: {
          headlineTemplateSingular: "{count} überfällige Zahlung.",
          headlineTemplatePlural: "{count} überfällige Zahlungen.",
          blurb: "Ein Zahlungscheckpoint ist überfällig. Öffnen Sie den Arbeitsraum, um einen Nachweis hochzuladen oder das Studio-Team zu kontaktieren.",
          ctaPrimary: "Zahlungen öffnen",
          ctaSecondary: "Studio öffnen",
        },
        activeReady: {
          headlineTemplateSingular: "{count} Projekt zur Prüfung bereit.",
          headlineTemplatePlural: "{count} Projekte zur Prüfung bereit.",
          blurb: "Lieferobjekte und Revisionen warten auf Ihre Freigabe. Öffnen Sie den Arbeitsraum, um zu prüfen und den nächsten Meilenstein freizuschalten.",
          ctaPrimary: "Projekte öffnen",
          ctaSecondary: "Studio öffnen",
        },
        activeProjects: {
          headlineTemplateSingular: "{count} aktives Projekt.",
          headlineTemplatePlural: "{count} aktive Projekte.",
          blurb: "Aktive Arbeitsräume mit Meilensteinbewegung, Zahlungscheckpoints und Lieferobjekten — alle aus HenryCo Studio in diesem Raum gespiegelt.",
          ctaPrimary: "Studio öffnen",
          ctaSecondary: "Neues Briefing starten",
        },
        calm: {
          headlineTemplateSingular: "{count} Projektraum erfasst.",
          headlineTemplatePlural: "{count} Projekträume erfasst.",
          blurb: "Jede Studio-Zusammenarbeit, die Sie je begonnen haben — Angebote, Meilensteine, Zahlungen, Lieferobjekte — in einem Raum für schnelles Nachfassen.",
          ctaPrimary: "Studio öffnen",
          ctaSecondary: "Neues Briefing starten",
        },
      },
    },
    sections: {
      projectsTitle: "Projekträume",
      projectsAriaLabel: "Studio-Projekte",
      projectsMetaEmpty: "Arbeitsräume erscheinen hier, sobald eine Studio-Zusammenarbeit live geht.",
      projectsMetaTemplateSingular: "{count} Projekt · sortiert nach letzter Bewegung",
      projectsMetaTemplatePlural: "{count} Projekte · sortiert nach letzter Bewegung",
      paymentsTitle: "Zahlungscheckpoints",
      paymentsAriaLabel: "Studio-Zahlungen",
      paymentsMetaEmpty: "Studio-Zahlungsanfragen erscheinen hier, sobald ein Angebot oder Projekt live ist.",
      paymentsMetaTemplateSingular: "{count} Checkpoint · Nachweisupload und Freigabestatus",
      paymentsMetaTemplatePlural: "{count} Checkpoints · Nachweisupload und Freigabestatus",
      activityTitle: "Aktuelle Aktivität",
      activityAriaLabel: "Studio-Aktivität",
      activityMetaEmpty: "Projektaktualisierungen, Zahlungsnachweise und Meilensteinfreigaben spiegeln hier wider.",
      activityMetaTemplateSingular: "{count} Aktualisierung · neueste zuerst",
      activityMetaTemplatePlural: "{count} Aktualisierungen · neueste zuerst",
    },
    empty: {
      projectsTitle: "Noch keine Studio-Arbeitsräume verknüpft",
      projectsBody: "Sobald ein Angebot oder Projekt mit Ihrer HenryCo-Identität erstellt wird, erscheint hier der synchronisierte Studio-Raum — Meilensteine, Zahlungen, Lieferobjekte und der nächste Schritt.",
      paymentsTitle: "Noch keine Zahlungscheckpoints",
      paymentsBody: "Kommerzielle Meilensteine — Anzahlung, Zwischenstand und Lieferung — erscheinen hier, sobald ein Angebot mit Ihnen live geht.",
      activityTitle: "Noch keine Studio-Aktivität",
      activityBody: "Projektaktualisierungen, Zahlungsnachweise, Lieferveröffentlichungen und Meilensteinfreigaben erscheinen hier, sobald sie eintreten.",
    },
    projects: {
      listAriaLabel: "Studio-Projekte",
      fallbackSubtitle: "Studio bereitet die nächste Aktualisierung vor.",
      milestonesTemplate: "{approved}/{total} Meilensteine",
      paymentsTemplateSingular: "{count} offene Zahlung",
      paymentsTemplatePlural: "{count} offene Zahlungen",
      deliverablesTemplateSingular: "{count} Lieferobjekt",
      deliverablesTemplatePlural: "{count} Lieferobjekte",
      updatedTemplate: "Aktualisiert {stamp}",
      rowAriaLabelTemplate: "{title} · {kind}",
      fallbackStamp: "—",
    },
    projectKindLabels: {
      live: "Live",
      ready_review: "Bereit zur Prüfung",
      scheduled: "Geplant",
      delivered: "Geliefert",
      issue: "Aktion erforderlich",
    },
    payments: {
      listAriaLabel: "Studio-Zahlungen",
      rowAriaLabelTemplate: "{label} · {status}",
      dueTemplate: "Fällig {stamp}",
      updatedTemplate: "Aktualisiert {stamp}",
      subTemplate: "{amount} · {method} · {due}",
    },
    paymentStatusLabels: {
      pending: "ausstehend",
      paid: "bezahlt",
      approved: "freigegeben",
      settled: "abgerechnet",
      proof_uploaded: "Nachweis hochgeladen",
      proof_submitted: "Nachweis eingereicht",
      in_review: "in Prüfung",
      rejected: "abgelehnt",
      overdue: "überfällig",
      failed: "fehlgeschlagen",
      pending_deposit: "Anzahlung ausstehend",
    },
    activity: {
      listAriaLabel: "Studio-Aktivität",
      rowAriaLabelTemplate: "{title} · {stamp}",
    },
  },
  settings: {
    pageTitle: "Einstellungen und Präferenzen",
    pageDescription:
      "Verwalten Sie Ihr Profil, Ihre Kommunikationspräferenzen, Datenschutzeinstellungen und manuelle Datenanfragen.",
    profileSectionKicker: "Profilinformationen",
    notificationsSectionKicker: "Benachrichtigungseinstellungen",
  },
  addresses: {
    metadata: {
      title: "Adressen",
      description:
        "Verwalten Sie Ihre gespeicherten Adressen (Privat, Büro, Geschäft…) — verwendet für Lieferung, Buchungen und KYC-Verifizierung.",
    },
    hero: {
      title: "Adressen",
      description:
        "Verwalten Sie Ihre gespeicherten Adressen (Privat, Büro, Geschäft…) — verwendet für Lieferung, Buchungen und KYC-Verifizierung.",
    },
    card: {
      defaultBadge: "Standard",
      kycVerifiedBadge: "KYC verifiziert",
      setDefaultCta: "Als Standard festlegen",
      editCta: "Bearbeiten",
      deleteCta: "Löschen",
    },
    deleteConfirm: {
      prompt: "Diese Adresse löschen? Dies kann nicht rückgängig gemacht werden.",
      confirmCta: "Löschen",
      cancelCta: "Abbrechen",
    },
    empty: {
      body:
        "Sie haben noch keine Adressen hinzugefügt. Fügen Sie Ihre erste hinzu, um den Checkout über HenryCo zu beschleunigen.",
    },
    add: {
      cta: "Adresse hinzufügen",
      formTitle: "Neue Adresse hinzufügen",
      editFormTitleTemplate: "{label} bearbeiten",
      maxedNoticeTemplate:
        "Sie haben die maximale Anzahl von {count} Adresstypen hinzugefügt (Privat, Büro, Geschäft, Lager, Alternative 1, Alternative 2). Bearbeiten oder löschen Sie eine, um eine andere Adresse hinzuzufügen.",
    },
  },
  search: {
    metadata: {
      title: "Konto durchsuchen",
      description:
        "Durchsuchen Sie HenryCo-Konto-Workflows und verbundene Abteilungs-Routen.",
    },
    hero: {
      title: "Durchsuchen Sie Ihre HenryCo-Workflows.",
      description:
        "Springen Sie direkt zu bestimmten Kontoaktionen und verbundenen Abteilungs-Routen, ohne auf generische Dashboards zurückzufallen.",
    },
    placeholder:
      "Konto durchsuchen: Benachrichtigungen, Wallet, Rechnungen, Support, Stellenbewerbungen…",
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
    "smartHomeEmptyFallback": "Benvenuto — inizia con un piccolo primo passo. I tuoi segnali dal vivo appariranno qui non appena ci sarà attività.",
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
    },
    "priorityFallback": {
      "low": "Calmo",
      "normal": "Ordinario",
      "high": "Alta",
      "urgent": "Urgente"
    },
    "eyebrow": "Coda azioni · in tempo reale",
    "guidanceTitle": "Una sola coda, tutte le divisioni.",
    "overviewAria": "Panoramica delle attività",
    "volumeAria": "Volume delle attività",
    "pendingAria": "Attività in sospeso",
    "sideAria": "Come funziona la coda",
    "bySource": "Per origine",
    "openTotalLabel": "Totale aperti",
    "nothingBlocking": "Nulla blocca al momento",
    "resolveBlockers": "Risolvi per sbloccare le altre corsie",
    "routine": "ordinarie",
    "divisionRepresentedSingular": "{count} divisione rappresentata",
    "divisionRepresentedPlural": "{count} divisioni rappresentate",
    "headlineEmpty": "Nessun elemento in coda.",
    "headlineBlockerSingular": "{count} blocco da risolvere.",
    "headlineBlockerPlural": "{count} blocchi da risolvere.",
    "headlineUrgentSingular": "{count} attività urgente da chiudere.",
    "headlineUrgentPlural": "{count} attività urgenti da chiudere.",
    "headlineActiveSingular": "{count} attività da gestire.",
    "headlineActivePlural": "{count} attività da gestire.",
    "headlineCalmSingular": "{count} elemento nella tua coda.",
    "headlineCalmPlural": "{count} elementi nella tua coda.",
    "blurbEmpty": "Il tuo account è in ordine — verifica, pagamenti e corsie sensibili alle revisioni sono tutti puliti. Ti mostreremo automaticamente qui la prossima mossa appena si presenta.",
    "blurbRisk": "Questi elementi bloccano le azioni a maggiore fiducia in HenryCo — prelievi dal portafoglio, approvazione venditore marketplace, verifica datore di lavoro. Risolverli sblocca ciascuna corsia.",
    "blurbActive": "Ogni riga ti porta alla prossima azione con un solo tocco. Filtri, etichette di priorità e collegamenti restano coerenti in tutte le divisioni HenryCo.",
    "metaEmpty": "Sei a posto. Qualsiasi novità apparirà qui appena arriva.",
    "metaCount": "{count} aperti · ordinati per priorità e stato bloccante."
  },
  "security": {
    "title": "Sicurezza",
    "description": "Controlla l'attività di sicurezza recente, modifica la password e termina le sessioni HenryCo quando necessario.",
    "heroAriaLabel": "Panoramica della sicurezza",
    "hero": {
      "trustScoreLabel": "Punteggio di fiducia",
      "nextTierPrefix": "Prossimo ·",
      "nextTierAriaTemplate": "Livello successivo {tier}",
      "accountActiveSingularTemplate": "Account attivo da {days} giorno",
      "accountActivePluralTemplate": "Account attivo da {days} giorni",
      "flaggedEventsSingularTemplate": "{count} evento segnalato in archivio · controlla sotto",
      "flaggedEventsPluralTemplate": "{count} eventi segnalati in archivio · controlla sotto",
      "statusEyebrow": {
        "secure": "Sicurezza e accesso · protetto",
        "watch": "Sicurezza e accesso · azione consigliata",
        "risk": "Sicurezza e accesso · rischio segnalato"
      },
      "statusHeadline": {
        "secure": "Il tuo account è protetto.",
        "watch": "Bastano poche mosse per rafforzare l'account.",
        "risk": "Abbiamo segnalato un'attività che richiede la tua attenzione."
      },
      "statusBlurb": {
        "secure": "Nessun evento sospetto, la verifica è solida e ogni azione a maggiore fiducia offerta da HenryCo è aperta per te.",
        "watch": "Nulla è rotto — ma alcuni segnali (conferma email, revisione identità, contatti duplicati) farebbero salire il tuo punteggio di fiducia e sbloccherebbero più corsie.",
        "risk": "Eventi recenti sono stati classificati come rischio elevato. Esamina il flusso di attività qui sotto e cambia la password se qualcosa ti sembra estraneo."
      }
    },
    "signalsTitle": "Segnali",
    "signalsMeta": "Quello che i nostri motori di verifica e scoring vedono sul tuo account in questo momento.",
    "signalsAriaLabel": "Segnali di sicurezza",
    "guideTitle": "Dove sei · cosa ti fa avanzare",
    "guideMetaTemplate": "Valutazione onesta, non un numero di marketing. {tier}.",
    "allLanesOpen": "Tutte le corsie aperte",
    "accountActionsTitle": "Azioni sull'account",
    "accountActionsMeta": "Controlli ordinari che gestisci direttamente.",
    "changePasswordTitle": "Cambia la tua password",
    "signOutEverywhereTitle": "Disconnettiti ovunque",
    "suspiciousEventFoot": "Esamina il flusso di attività qui sotto.",
    "noSuspiciousEventFoot": "Nulla segnalato nell'ultima finestra di revisione.",
    "activityAriaLabel": "Eventi di sicurezza recenti",
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
  messages: {
    metadata: {
      title: "Messaggi · HenryCo",
      description:
        "Un’unica casella per supporto, marketplace, lavoro, studio, care, immobili, logistica e formazione.",
    },
    hero: {
      eyebrow: "HenryCo · casella unificata",
      ariaLabel: "Panoramica della casella",
      ariaTiles: "Volume della casella",
      ariaSide: "Per portale",
      sideLabel: "Per portale",
      sideBody:
        "Ogni portale alimenta questa unica casella. Supporto, ordini marketplace, colloqui di lavoro, progetti studio e prenotazioni care compaiono qui in ordine cronologico.",
    },
    headlines: {
      zero: "Casella vuota in tutta HenryCo.",
      calmOne: "Un thread aspetta una tua risposta.",
      calmMany: "{count} thread aperti.",
      busy: "{unread} non letti · {open} aperti nei tuoi portali.",
      overloaded: "{unread} non letti su {open} thread aperti.",
    },
    blurbs: {
      zero: "Tutto è confermato: supporto, marketplace, lavoro, studio, care, immobili, logistica e formazione.",
      calm: "Una breve risposta adesso chiude il ciclo prima di domani.",
      busy: "Tocca una riga per aprire il thread, oppure filtra un portale alla volta.",
      overloaded: "Procedi per divisioni una alla volta — i thread più recenti in alto.",
    },
    tiles: {
      openLabel: "Aperti",
      openFootEmpty: "Niente in corso",
      openFootActive: "Thread in attesa di un’azione",
      unreadLabel: "Non letti",
      unreadFootEmpty: "Casella aggiornata",
      unreadFootActive: "Tocca una riga per aprire il thread",
      portalsLabel: "Portali",
      portalsFootEmpty: "Care, Marketplace, Studio, Jobs e altro",
      portalsFootSingular: "Una divisione attiva",
      portalsFootPlural: "{count} divisioni rappresentate",
    },
    sideTitle: {
      empty: "Calma in ogni divisione",
      singular: "Una divisione ha traffico",
      plural: "{count} divisioni attive",
    },
    section: {
      title: "Thread",
      ariaLabel: "Thread della casella",
      metaEmpty: "Ancora niente — ogni portale alimenta questa casella",
      metaSingular: "{count} thread",
      metaPlural: "{count} thread",
    },
    chips: {
      ariaLabel: "Filtra la casella per portale",
      allThreads: "Tutti i thread",
    },
    empty: {
      eyebrow: "Casella tranquilla",
      titleAll: "Niente in attesa.",
      titleFilter: "Ancora nessun thread in questo portale.",
      bodyAll:
        "Supporto, marketplace, lavoro, studio, care, immobili, logistica e formazione compaiono qui — qualsiasi cosa cross-portale arriva in questa lista appena inizia.",
      bodyFilter:
        "Cambia chip di filtro per vedere un altro portale, o sfoglia tutti i thread per confermare che nulla sia in sospeso.",
    },
    list: {
      unreadDotLabel: "Non letto",
      fallbackTime: "—",
    },
    divisionLabels: {
      support: "Supporto",
      marketplace: "Marketplace",
      jobs: "Lavoro",
      studio: "Studio",
      care: "Care",
      property: "Immobili",
      logistics: "Logistica",
      learn: "Formazione",
    },
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
  support: {
    metadata: {
      title: "Assistenza",
      description: "Ricevi aiuto per qualsiasi servizio HenryCo.",
    },
    hero: {
      title: "Assistenza",
      description: "Ricevi aiuto per qualsiasi servizio HenryCo.",
      newRequestCta: "Nuova richiesta",
    },
    summary: {
      openRequestsTemplate: "{count} richiesta/e aperta/e",
      escalatedTemplate: "{count} priorità alta",
      escalationNote:
        "Ogni messaggio viene tracciato. Se il triage segnala rischio o urgenza, il team riceve automaticamente una coda prioritaria.",
    },
    quickHelp: {
      helpCenterLabel: "Centro assistenza",
      helpCenterDesc: "Sfoglia FAQ e guide",
      contactLabel: "Contattaci",
      contactDesc: "Assistenza via email o telefono",
      liveChatLabel: "Chat dal vivo",
      liveChatDesc: "Chatta con il nostro team",
    },
    threads: {
      sectionKicker: "Le tue richieste",
      emptyTitle: "Nessuna richiesta di assistenza",
      emptyDescription:
        "Non hai ancora creato richieste di assistenza. Siamo qui per aiutarti se hai bisogno di qualcosa.",
      createCta: "Crea richiesta",
    },
    statusLabels: {
      open: "Aperta",
      awaitingReply: "In attesa di risposta",
      inProgress: "In corso",
      resolved: "Risolta",
      closed: "Chiusa",
    },
    priorityLabels: {
      low: "Bassa",
      normal: "Normale",
      high: "Alta",
      urgent: "Urgente",
    },
  },
  payments: {
    hero: {
      title: "Metodi di pagamento",
      description: "Gestisci le tue opzioni di pagamento salvate per un checkout rapido.",
      addMethodCta: "Aggiungi metodo",
    },
    empty: {
      title: "Nessun metodo di pagamento",
      description:
        "Aggiungi una carta di debito, un conto bancario o un altro metodo di pagamento per un checkout rapido in tutti i servizi HenryCo.",
      cta: "Aggiungi metodo di pagamento",
    },
    card: {
      savedMethodFallback: "Metodo salvato",
      cardLastFourTemplate: "•••• {last4}",
    },
    wallet: {
      eyebrow: "Portafoglio HenryCo",
      body: "Il tuo portafoglio HenryCo è sempre disponibile come opzione di pagamento.",
      manageCta: "Gestisci portafoglio",
    },
  },
  savedItems: {
    metadata: {
      title: "Articoli salvati",
      description:
        "Articoli messi da parte da un carrello HenryCo, conservati per 90 giorni con un avviso una settimana prima della scadenza.",
    },
    hero: {
      title: "Salvati per dopo",
      description:
        "Articoli messi da parte da un carrello HenryCo. Li conserviamo per 90 giorni e ti avvisiamo una settimana prima della scadenza.",
    },
    summary: {
      activeTemplate: "{count} attivo/i",
      expiredTemplate: "{count} scaduto/i",
      expiryNote:
        "Gli articoli scadono 90 giorni dopo essere stati salvati. Ti avvisiamo con una settimana di anticipo.",
      savedTemplate: "{count} salvato/i",
    },
    toolbar: {
      showLabel: "Mostra",
      allDivisions: "Tutte le divisioni",
      sortLabel: "Ordina",
      sortNewest: "Più recenti prima",
      sortOldest: "Più vecchi prima",
      sortExpiring: "In scadenza",
    },
    selection: {
      selectedTemplate: "{count} selezionato/i",
      clear: "Annulla",
      moving: "Spostamento…",
      moveSelectedToCart: "Sposta selezionati nel carrello",
      selectAllOnPage: "Seleziona tutto in questa pagina",
    },
    empty: {
      title: "Niente di salvato per dopo",
      description:
        "Quando trovi qualcosa che non sei pronto ad acquistare, salvalo per dopo dal carrello. Manterremo il prezzo che hai visto e ti avviseremo una settimana prima della scadenza.",
      browseCta: "Sfoglia",
    },
    card: {
      deselectItem: "Deseleziona articolo",
      selectItem: "Seleziona articolo",
      savedItemFallback: "Articolo salvato",
      expiresToday: "Scade oggi",
      expiresInTemplate: "Scade tra {days} giorno{plural}",
      expiredNotice: "Scaduto — il ripristino reimposta la finestra di 90 giorni",
      moveToCart: "Sposta nel carrello",
      moving: "Spostamento…",
      removeFromSaved: "Rimuovi dagli articoli salvati",
      openOriginal: "Apri annuncio originale",
    },
    expired: {
      sectionKicker: "Scaduti di recente",
      sectionNote: "Il ripristino reimposta la finestra di 90 giorni.",
    },
  },
  documents: {
    metadata: {
      title: "Documenti",
      description:
        "Le tue ricevute, certificati, contratti e file importanti — custoditi privatamente e accessibili in ogni divisione HenryCo.",
    },
    hero: {
      eyebrow: "Cassaforte personale",
      title: "Documenti",
      body: "Le tue ricevute, certificati, contratti e file importanti.",
    },
    toolbar: {
      uploadCta: "Carica documento",
      filterLabel: "Filtra",
      allCategories: "Tutte le categorie",
      sortLabel: "Ordina",
      sortNewest: "Più recenti prima",
      sortOldest: "Più vecchi prima",
    },
    types: {
      document: "Documento",
      receipt: "Ricevuta",
      certificate: "Certificato",
      id_document: "Documento d’identità",
      contract: "Contratto",
      other: "Altro",
    },
    categories: {
      all: "Tutti",
      document: "Documenti",
      receipt: "Ricevute",
      certificate: "Certificati",
      id_document: "Documenti d’identità",
      contract: "Contratti",
      other: "Altri",
    },
    card: {
      uploadedOnTemplate: "Caricato il {date}",
      sizeTemplate: "{size}",
      downloadLabel: "Scarica",
      noFileAttached: "Nessun file allegato",
      openOriginal: "Apri documento",
    },
    empty: {
      title: "Ancora nessun documento",
      description:
        "I tuoi documenti, ricevute e certificati dei servizi HenryCo saranno conservati qui.",
    },
    summary: {
      countTemplate: "{count} documento{plural}",
      filteredTemplate: "{count} su {total} mostrati",
    },
    retention: {
      eyebrow: "Privacy e conservazione",
      title: "I tuoi file restano privati",
      body: "I documenti sono cifrati a riposo, visibili solo a te e conservati per tutta la durata del tuo account HenryCo, salvo eliminazione.",
    },
  },
  subscriptions: {
    metadata: {
      title: "Abbonamenti",
      description:
        "Riepilogo in sola lettura dei piani attivi sincronizzati dalle divisioni HenryCo.",
    },
    hero: {
      eyebrow: "Piani attivi",
      title: "Abbonamenti",
      description:
        "Riepilogo in sola lettura dei piani, fornito dalle divisioni che attualmente sincronizzano i propri abbonamenti nell’hub di account condiviso.",
    },
    empty: {
      title: "Nessun abbonamento sincronizzato",
      description:
        "Potrebbe significare che non hai piani attivi, oppure che la divisione non ha ancora pubblicato i propri abbonamenti nel registro condiviso del tuo account.",
    },
    card: {
      planFallback: "Piano di abbonamento",
      tierSeparator: " · ",
      amountLabel: "Importo",
      cycleLabel: "Ciclo",
      renewsLabel: "Rinnova",
      renewsFallback: "—",
    },
    statusLabels: {
      active: "Attivo",
      paused: "In pausa",
      cancelled: "Annullato",
      expired: "Scaduto",
      past_due: "Insoluto",
      trialing: "In prova",
      grace: "Periodo di tolleranza",
      pending: "In attesa",
      unknown: "Sconosciuto",
    },
    cycleLabels: {
      monthly: "Mensile",
      yearly: "Annuale",
      annual: "Annuale",
      quarterly: "Trimestrale",
      weekly: "Settimanale",
      biweekly: "Ogni 2 settimane",
      daily: "Quotidiano",
      one_time: "Una tantum",
      notSet: "Non impostato",
    },
    cta: {
      upgrade: "Passa a un piano superiore",
      downgrade: "Passa a un piano inferiore",
      cancel: "Annulla abbonamento",
      manage: "Gestisci nella divisione",
      resume: "Riprendi abbonamento",
    },
    paymentIssue: {
      title: "Pagamento da sistemare",
      description:
        "Non siamo riusciti a incassare l’ultimo rinnovo. Aggiorna il metodo di pagamento per mantenere attivo l’abbonamento.",
      updatePaymentCta: "Aggiorna metodo di pagamento",
    },
    summary: {
      activeTemplate: "{count} attivo·i",
      pausedTemplate: "{count} in pausa",
      totalTemplate: "{count} piano·i",
    },
  },
  referrals: {
    metadata: {
      title: "Referenze",
      description:
        "Invita clienti qualificati su HenryCo e segui i premi attraverso gli stati in sospeso, verificati e accreditati.",
    },
    hero: {
      title: "Referenze",
      description:
        "Invita clienti qualificati su HenryCo e segui i premi attraverso gli stati in sospeso, verificati e accreditati.",
    },
    code: {
      eyebrow: "Il tuo codice referenza",
      shareLinkLabel: "Link di condivisione",
      copyCodeTitle: "Copia codice",
      copyLinkTitle: "Copia link",
      copyLinkLabel: "Copia link",
      copiedToast: "Copiato!",
      rewardNote:
        "Premio: {amount} per ogni referenza qualificata. I premi vengono sbloccati dopo che la persona segnalata completa un ordine pagato entro la finestra di blocco di {days} giorni.",
    },
    stats: {
      totalReferred: "Totale segnalati",
      signedUp: "Iscritti",
      qualified: "Qualificati",
      flagged: "Segnalati per verifica",
      pendingRewards: "Premi in sospeso",
      releasedRewards: "Premi sbloccati",
    },
    howItWorks: {
      eyebrow: "Come funziona",
      step1Title: "Condividi il tuo codice",
      step1Body:
        "Condividi il tuo codice o link unico. Gli amici che visitano un sottodominio HenryCo con il tuo link vengono tracciati automaticamente.",
      step2Title: "Effettuano una transazione",
      step2Body:
        "Dopo l’iscrizione, la referenza entra in una finestra di blocco di {days} giorni. Tracciamo l’account segnalato una sola volta — le auto-referenze, i duplicati di nucleo familiare e le iscrizioni riciclate non si qualificano.",
      step3Title: "I premi si sbloccano dopo la qualifica",
      step3Body:
        "Le referenze qualificate accreditano {amount} sul tuo portafoglio HenryCo dopo la revisione finanziaria. I premi in sospeso non sono spendibili finché non vengono autorizzati.",
    },
    policy: {
      eyebrow: "Politica delle referenze",
      qualifying:
        "Una conversione qualificante significa che l’account segnalato ha completato un’azione HenryCo idonea che ha superato la verifica di pagamento e di affidabilità.",
      enforcement:
        "HenryCo può sospendere, annullare o cancellare i premi in caso di auto-referenze, cicli di conversione duplicati, storni, rimborsi o schemi di premi sospetti.",
      separation:
        "La tua dashboard mostra separatamente le referenze e la cronologia dei premi affinché le iscrizioni tracciate non vengano confuse con guadagni accreditati al portafoglio.",
    },
    referralsList: {
      eyebrow: "Le tue referenze",
      emptyTitle: "Nessuna referenza ancora",
      emptyDescription:
        "Condividi il tuo codice referenza per iniziare a invitare. Le referenze appariranno qui non appena qualcuno si iscrive con il tuo link.",
      refereeFallback: "Iscrizione segnalata",
      signedUpTemplate: "Iscritto il {date}",
      qualifiedTemplate: "Qualificato il {date}",
    },
    statusLabels: {
      pending: "In attesa di iscrizione",
      converted: "Iscritto · periodo di blocco",
      qualified: "Qualificato · premio sbloccato",
      flagged: "Segnalato · controllo antifrode",
      expired: "Scaduto",
    },
    flagReasons: {
      selfReferral: "Auto-referenza bloccata",
      duplicateEmail: "E-mail di referente duplicata",
      deviceReuse: "Riutilizzo del dispositivo",
    },
    rewards: {
      eyebrow: "Cronologia premi",
      emptyTitle: "Nessun premio ancora",
      emptyDescription:
        "I premi accreditati appariranno qui dopo che le conversioni qualificate avranno superato la verifica e il controllo antiabuso.",
      referralRewardFallback: "Premio referenza",
      paidTemplate: "Pagato il {date}",
      statusLabels: {
        held: "Trattenuto",
        pending: "In sospeso",
        released: "Sbloccato",
        paid: "Pagato",
        cancelled: "Annullato",
      },
    },
  },
  divisionCare: {
    metadata: {
      title: "Care · prenotazioni collegate",
      description: "Segui ogni prenotazione HenryCo Care collegata a questo account: stato, verifica del pagamento e prossimo passo operativo in un unico posto.",
    },
    hero: {
      eyebrow: "Care · in diretta",
      sideKicker: "Come funziona questa stanza",
      sideTitle: "Prenota su Care, segui qui.",
      sideBody: "Ogni prenotazione effettuata su HenryCo Care viene rispecchiata in questa stanza: codice di tracciamento, stato del pagamento e prossimo passo operativo arrivano qui automaticamente. La dashboard sotto resta sincronizzata mentre il servizio prosegue.",
      breakdownLabel: "Per stato",
      tilesAriaLabel: "Riepilogo prenotazioni Care",
      tileLabels: {
        total: "Prenotazioni",
        inFlight: "In servizio",
        payment: "In attesa di pagamento",
        completed: "Completate",
      },
      tileFoot: {
        totalEmpty: "Prenota il tuo primo servizio Care per iniziare",
        totalWithTemplate: "{count} collegate a questo account",
        inFlightEmpty: "Nulla è attivo in questo momento",
        inFlightWith: "Stato in diretta rispecchiato sotto",
        paymentEmpty: "Nessuna verifica di pagamento in sospeso",
        paymentWith: "Invia o controlla la ricevuta sotto",
        completedEmpty: "Nessun servizio ancora completato",
        completedWith: "Contrassegnate come completate dal team Care",
      },
      breakdownLabels: {
        inFlight: "In servizio",
        scheduled: "Programmate",
        payment: "In attesa di pagamento",
        completed: "Completate",
      },
      state: {
        empty: {
          headline: "Prenota il tuo primo servizio Care.",
          blurb: "I servizi Care che prenoti qui si sincronizzano automaticamente con questa stanza: codice di tracciamento, stato del pagamento e prossimo passo operativo.",
          ctaPrimary: "Prenota un servizio",
          ctaSecondary: "Apri tracciamento",
        },
        attention: {
          headlineTemplateSingular: "{count} azione da svolgere.",
          headlineTemplatePlural: "{count} azioni da svolgere.",
          blurb: "Una o più prenotazioni attendono verifica del pagamento o un seguito. Apri la prenotazione sotto per risolverla.",
          ctaPrimary: "Rivedi le prenotazioni",
          ctaSecondary: "Apri tracciamento",
        },
        active: {
          headlineTemplateSingular: "{count} servizio in movimento.",
          headlineTemplatePlural: "{count} servizi in movimento.",
          blurb: "Tracciamento in diretta, verifica del pagamento e prossimo passo operativo rispecchiati da HenryCo Care a questa stanza.",
          ctaPrimary: "Apri tracciamento",
          ctaSecondary: "Prenota un servizio",
        },
        calm: {
          headlineTemplateSingular: "{count} prenotazione registrata.",
          headlineTemplatePlural: "{count} prenotazioni registrate.",
          blurb: "Le tue prenotazioni Care, i codici di tracciamento, le ricevute e le azioni in arrivo, tutto in un solo posto, sincronizzato in tempo reale.",
          ctaPrimary: "Prenota un servizio",
          ctaSecondary: "Apri tracciamento",
        },
      },
    },
    sections: {
      glance: "Prossima azione",
      glanceMeta: "Qui viene messa in evidenza la prenotazione più urgente.",
      bookings: "Tutte le prenotazioni",
      bookingsEmpty: "Le prenotazioni effettuate mentre sei connesso appaiono qui in tempo reale.",
      bookingsMetaTemplateSingular: "{count} prenotazione · filtra, sfoglia e aprine una per il dettaglio in diretta.",
      bookingsMetaTemplatePlural: "{count} prenotazioni · filtra, sfoglia e aprine una per il dettaglio in diretta.",
      activity: "Attività recente",
      activityEmpty: "Aggiornamenti di stato, ricevute e recensioni appaiono qui non appena avvengono.",
      activityMetaTemplateSingular: "{count} aggiornamento · più recente prima",
      activityMetaTemplatePlural: "{count} aggiornamenti · più recenti prima",
    },
    empty: {
      title: "Nessuna prenotazione Care collegata per ora",
      body: "Le prenotazioni che effettui su Care mentre sei connesso appariranno qui subito. Le prenotazioni più vecchie compariranno una volta che l’e-mail o il telefono corrisponderanno al tuo profilo condiviso.",
    },
    glance: {
      nextActionLabel: "Prossima azione",
      serviceLabel: "Servizio",
      pickupLabel: "Ritiro",
      balanceLabel: "Saldo dovuto",
      trackingLabel: "Tracciamento",
      serviceFallback: "Servizio Care",
    },
    activityAriaLabel: "Attività Care",
    status: {
      live: "In servizio",
      scheduled: "Programmata",
      completed: "Completata",
      issue: "Azione necessaria",
      payment: "Revisione pagamento",
    },
    statusValueLabels: {
      booked: "Prenotata",
      awaiting_payment: "In attesa di pagamento",
      receipt_submitted: "Ricevuta inviata",
      under_review: "In revisione",
      delivered: "Consegnata",
      customer_confirmed: "Confermata dal cliente",
      inspection_completed: "Ispezione completata",
      service_completed: "Servizio completato",
      cancelled: "Annullata",
      issue: "Problema",
      exception: "Eccezione",
      rejected: "Rifiutata",
    },
    formatLabels: {
      toBeScheduled: "Da programmare",
      shortMonths: ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"],
    },
    dashboard: {
      filters: {
        all: "Tutte",
        unpaid: "Saldo dovuto",
        receipt: "Ricevuta / revisione",
        active: "In corso",
        completed: "Completate",
        issue: "Problemi",
      },
      filtered: "filtrato",
      bookingSingular: "prenotazione",
      bookingPlural: "prenotazioni",
      metrics: {
        visible: "Prenotazioni visibili",
        visibleHint: "Prenotazioni Care reali collegate a questo account.",
        balance: "Saldo residuo",
        balanceHintSomeTemplate: "{count} prenotazione/i richiedono ancora un seguito di pagamento.",
        balanceHintNone: "Nessun saldo Care non pagato è attualmente aperto.",
        receiptQueue: "Coda ricevute",
        receiptQueueHintSome: "Prenotazioni con ricevute inviate in attesa di verifica.",
        receiptQueueHintNone: "Nessun arretrato di verifica ricevute collegato a questo account.",
        completed: "Completate",
        completedHintSome: "Prenotazioni completate che possono passare al follow-up di recensione.",
        completedHintNone: "Le prenotazioni Care completate appariranno qui al termine del servizio.",
      },
      linkedBookings: "Prenotazioni Care collegate",
      linkedBookingsDescription: "Le tue prenotazioni Care, lo stato del pagamento e le azioni in arrivo.",
      onThisPage: "in questa pagina",
      selectedBooking: "Prenotazione selezionata",
      paymentSnapshot: "Panoramica pagamento",
      receiptVisibility: "Visibilità della ricevuta",
      nextBestAction: "Migliore azione successiva",
      serviceSummary: "Riepilogo del servizio",
      serviceFallback: "Servizio Care",
      addressPending: "Indirizzo in sospeso",
      updated: "Aggiornato",
      balanceDue: "Saldo dovuto",
      nextMove: "Prossima mossa",
      paginationLabel: "Paginazione delle prenotazioni Care",
      pageLabel: "Pagina",
      of: "di",
      perPage: "per pagina",
      previous: "Precedente",
      next: "Successivo",
      customerFallback: "Cliente",
      scheduledDate: "Data programmata",
      notScheduled: "Non ancora programmata",
      timeWindow: "Fascia oraria",
      windowPending: "Fascia in sospeso",
      pickupAddress: "Indirizzo di ritiro",
      returnAddress: "Indirizzo di restituzione / consegna",
      returnAddressFallback: "Usa l’indirizzo di ritiro salvo modifiche durante la prenotazione",
      trackingCode: "Codice di tracciamento",
      quotedTotal: "Totale preventivato",
      amountRecorded: "Importo registrato",
      receiptState: "Stato della ricevuta",
      receiptsSubmitted: "Ricevute inviate",
      lastSubmission: "Ultimo invio",
      noReceiptYet: "Nessuna ricevuta ancora",
      openLiveBooking: "Apri prenotazione in diretta",
      leaveReview: "Lascia una recensione",
    },
  },
  divisionProperty: {
    metadata: {
      title: "Property · preferiti e richieste",
      description: "La tua selezione Property, le richieste, le visite e i seguiti degli annunci — ogni azione su HenryCo Property si riflette in questa stanza del conto.",
    },
    hero: {
      eyebrow: "Property · in diretta",
      ariaLabel: "Panoramica Property",
      browseListingsCta: "Sfoglia annunci",
      savedShortlistCta: "Preferiti",
      tilesAriaLabel: "Attività Property",
      tileLabels: {
        saved: "Salvati",
        inquiries: "Richieste",
        viewings: "Visite",
        listings: "Annunci",
      },
      tileFoot: {
        savedManagedTemplate: "{count} gestiti da HenryCo",
        savedEmpty: "Salva annunci per costruire una selezione",
        savedWith: "Confronta e rivedi quando vuoi",
        inquiriesEmpty: "Nessuna conversazione aperta",
        inquiriesWith: "I seguiti arrivano in questa stanza",
        viewingsEmpty: "Richiedi una visita per un immobile salvato",
        viewingsWith: "Le conferme si sincronizzano su tutti i dispositivi",
        listingsEmpty: "Invia un annuncio su Property",
        listingsWith: "Gli esiti della moderazione arrivano qui",
      },
      sideAriaLabel: "Come funziona questa stanza",
      sideKicker: "Come funziona questa stanza",
      sideTitle: "Scopri su Property, segui qui.",
      sideBody:
        "Salva un annuncio, richiedi una visita o apri una richiesta su HenryCo Property — ogni azione si riflette in questa stanza del conto per riprendere da dove avevi lasciato, su tutti i dispositivi.",
      sideBodyMuted:
        "Gli annunci gestiti da HenryCo riportano un badge Gestito — verifiche, ispezioni e seguiti di locazione sono coordinati dal team Property.",
      breakdownAriaLabel: "Ripartizione attività",
      breakdownLabel: "Per attività",
      breakdownLabels: {
        saved: "Salvati",
        inquiries: "Richieste",
        viewings: "Visite",
        listings: "Annunci",
      },
      state: {
        empty: {
          headline: "Inizia a esplorare HenryCo Property.",
          blurb:
            "Scopri locazioni residenziali, annunci di vendita e immobili gestiti da HenryCo. Salva i tuoi preferiti e ogni richiesta, visita o seguito di annuncio arriva qui automaticamente.",
        },
        discover: {
          headlineTemplateSingular: "{count} casa in selezione.",
          headlineTemplatePlural: "{count} case in selezione.",
          blurb:
            "Immobili salvati, pronti per essere rivisti. Apri un annuncio per richiedere una visita o inviare una richiesta — il seguito arriverà direttamente in questa stanza.",
        },
        active: {
          viewingHeadlineTemplateSingular: "{count} visita pianificata.",
          viewingHeadlineTemplatePlural: "{count} visite pianificate.",
          inquiryHeadlineTemplateSingular: "{count} richiesta attiva.",
          inquiryHeadlineTemplatePlural: "{count} richieste attive.",
          blurb:
            "La tua selezione, le richieste e il calendario delle visite vivono in un’unica stanza. Riprendi da dove avevi lasciato — ogni azione è riflessa da HenryCo Property in tempo reale.",
        },
      },
    },
    sections: {
      saved: "Selezione salvata",
      savedMetaEmpty: "Salva annunci su HenryCo Property per costruire la tua selezione.",
      savedMetaTemplate: "{saved} salvati · {managed} gestiti da HenryCo",
      activity: "Attività recente",
      activityMetaEmpty: "Richieste, visite e revisioni degli annunci si riflettono qui in tempo reale.",
      activityMetaTemplateSingular: "{count} aggiornamento · prima il più recente",
      activityMetaTemplatePlural: "{count} aggiornamenti · prima il più recente",
    },
    empty: {
      savedTitle: "Ancora nessun immobile salvato",
      savedBody:
        "Scopri locazioni residenziali, annunci di vendita e immobili gestiti da HenryCo su Property. Tutto ciò che salvi arriva qui automaticamente.",
      activityTitle: "Ancora nessuna attività Property",
      activityBody:
        "Apri un annuncio su HenryCo Property per richiedere una visita o inviare una richiesta — ogni passaggio, dal primo messaggio alla revisione, comparirà qui.",
    },
    activity: {
      ariaLabel: "Attività Property",
      titles: {
        inquiry: "Richiesta immobiliare",
        viewing: "Richiesta di visita",
        listing_submitted: "Annuncio inviato",
        listing_updated: "Annuncio aggiornato",
        listing_reviewed: "Revisione annuncio completata",
      },
    },
    gallery: {
      ariaLabel: "Immobili salvati",
      managedBadge: "Gestito",
      featuredBadge: "In evidenza",
      locationPending: "Posizione in attesa",
      contactAgent: "Contatta l’agente",
      savedAtTemplate: "Salvato il {date}",
      bedSingular: "camera",
      bedPlural: "camere",
      bathSingular: "bagno",
      bathPlural: "bagni",
      sizeSqmTemplate: "{size} m²",
    },
  },
  divisionJobs: {
    metadata: {
      title: "Jobs · cruscotto candidato",
      description: "Tieni traccia di ogni candidatura HenryCo Jobs, ruolo salvato, aggiornamento dei recruiter e segnale di prontezza del profilo legato a questo account.",
    },
    header: {
      title: "Lavori",
      description: "Le tue candidature, i ruoli salvati, gli aggiornamenti dei recruiter e la solidità del profilo — tutto in un solo posto.",
      candidateModuleCta: "Modulo candidato",
      interviewRoomsCta: "Sale colloquio",
      browseLiveRolesCta: "Esplora i ruoli attivi",
    },
    hero: {
      eyebrow: "Il tuo account",
      headline: "La tua attività lavoro, tutto in un solo posto.",
      body: "Candidature, ruoli salvati, aggiornamenti dei recruiter e prontezza del profilo sono collegati al tuo account HenryCo.",
      statsAriaLabel: "Riepilogo attività lavoro",
      statLabels: {
        applications: "Candidature attive",
        saved: "Ruoli salvati",
        readiness: "Prontezza del profilo",
        updates: "Aggiornamenti recruiter",
      },
      statDetails: {
        applicationsLeadingTemplate: "{stage} è la tua fase attiva principale.",
        applicationsEmpty: "Ancora nessuna candidatura attiva.",
        savedSome: "La tua selezione è pronta per un nuovo passaggio di revisione.",
        savedEmpty: "Crea una selezione per ritrovare più facilmente i ruoli buoni.",
        updatesLatestTemplate: "{relative} ultimo movimento.",
        updatesEmpty: "Ancora nessun aggiornamento dei recruiter.",
      },
    },
    sections: {
      nextActionsKicker: "Prossime azioni",
      nextActionsTitle: "Ciò che merita la tua attenzione adesso",
      openTimelineCta: "Apri la cronologia",
      applicationsKicker: "Candidature",
      applicationsTitle: "Movimento di assunzione in diretta",
      savedKicker: "Ruoli salvati",
      savedTitle: "Selezione con più contesto",
      openSavedRolesCta: "Apri ruoli salvati",
      recommendedKicker: "Ruoli consigliati",
      recommendedTitle: "Cosa si allinea al tuo segnale attuale",
      browseCatalogCta: "Sfoglia il catalogo",
      recruiterFeedKicker: "Flusso recruiter",
      recruiterFeedTitle: "Messaggi, cambi di fase e avvisi",
      candidateInboxCta: "Posta candidato",
      profileKicker: "Solidità del profilo",
      profileTitle: "Prontezza del candidato e qualità del CV",
      sharedInboxKicker: "Posta condivisa",
      sharedInboxTitle: "Notifiche Jobs collegate al tuo account",
      alertsKicker: "Avvisi",
      alertsTitle: "Intento di ricerca salvato",
    },
    empty: {
      applicationsTitle: "Ancora nessuna candidatura attiva",
      applicationsBody: "Ruoli salvati, aggiornamenti dei recruiter e cronologie appariranno qui appena passi dalla navigazione a una candidatura attiva.",
      exploreJobsCta: "Esplora i lavori",
      savedJobsTitle: "Ancora nessun ruolo salvato",
      savedJobsBody: "Salva i ruoli promettenti per mantenerli nella tua selezione tra Jobs e il tuo account.",
      recommendedTitle: "Le raccomandazioni miglioreranno con l’uso",
      recommendedBody: "Quando profilo, selezione e candidature si arricchiranno, qui i suggerimenti diventeranno più mirati.",
      recruiterFeedTitle: "Ancora nessun movimento dei recruiter",
      recruiterFeedBody: "Qui si raccoglieranno cambi di fase, note dei recruiter condivise e notifiche Jobs in-app.",
      notificationsTitle: "Ancora nessuna notifica Jobs",
      notificationsBody: "Le prossime mosse di selezione, gli aggiornamenti dei datori di lavoro e le variazioni delle candidature arriveranno qui e nel modulo Jobs.",
      alertsTitle: "Nessun avviso Jobs attivo",
      alertsBody: "Crea un avviso così i nuovi ruoli che corrispondono ai tuoi criteri appariranno nel tuo flusso Jobs.",
      browseRolesCta: "Sfoglia i ruoli",
    },
    application: {
      progressPercentTemplate: "{percent}% completato",
      appliedAtTemplate: "Inviato il {date}",
      candidateReadiness: "Prontezza del candidato",
      recruiterConfidence: "Fiducia del recruiter",
      latestMovement: "Ultimo movimento del recruiter",
      nextBestMove: "Prossima mossa migliore",
      openTimelineCta: "Apri la cronologia",
      interviewRoomCta: "Sala colloquio",
      viewRoleCta: "Vedi il ruolo",
    },
    savedJob: {
      trustTemplate: "Fiducia {score}",
      savedAtTemplate: "Salvato il {date}",
    },
    recommended: {
      compFallback: "Retribuzione discussa nel processo",
    },
    stageLabels: {
      applied: "Inviata",
      reviewing: "In valutazione",
      shortlisted: "Selezionato",
      interview: "Colloquio",
      offer: "Offerta",
      hired: "Assunto",
      rejected: "Respinto",
    },
    nextStep: {
      labels: {
        applied: "Mantieni profilo e CV aggiornati",
        shortlisted: "Tieni pronti i contesti di portfolio e prove",
        interview: "Prepara esempi e fasce orarie",
        offer: "Rivedi ambito, tempistica e retribuzione",
        rejected: "Rafforza il prossimo pacchetto di candidatura",
      },
      bodies: {
        applied: "Nelle prime fasi aiutano prove più nitide, contatti puliti e un CV aggiornato.",
        shortlisted: "Selezione significa che hai superato il primo filtro. Ora contano prove precise.",
        interview: "I colloqui procedono più rapidi se le tue migliori prove di lavoro e la disponibilità sono facili da leggere.",
        offer: "Usa la fase di offerta per togliere ambiguità, non per indovinare le responsabilità.",
        rejected: "Usa il rifiuto come segnale. Affina sintesi, esempi e adeguatezza prima di ricandidarti.",
      },
    },
    readinessLabels: {
      interviewReady: "Pronto per il colloquio",
      strongProfile: "Profilo solido",
      needsProof: "Servono prove",
      needsStructure: "Serve struttura",
    },
    workModeLabels: {
      remote: "Remoto",
      hybrid: "Ibrido",
      onsite: "In sede",
    },
    employmentTypeLabels: {
      fullTime: "Tempo pieno",
      partTime: "Tempo parziale",
      contract: "Contratto",
      internship: "Stage",
      temporary: "Temporaneo",
    },
    profile: {
      readinessLabel: "Prontezza",
      skillsMappedLabel: "Competenze mappate",
      filesLabel: "File",
      improveProfileCta: "Migliora il profilo",
      openCandidateModuleCta: "Apri modulo candidato",
      checklist: {
        identityLabel: "Basi del profilo",
        identityDetail: "Nome completo, telefono e posizione presenti per i contatti dei recruiter.",
        storyLabel: "Storia del ruolo",
        storyDetail: "Headline e sintesi spiegano cosa fai oltre una scheda vuota.",
        verificationLabel: "Verifica dell’identità",
        verificationDetail: "La fiducia Jobs resta limitata finché il tuo account HenryCo non supera la verifica di identità.",
        proofLabel: "Prove di lavoro",
        proofDetail: "Curriculum più prove di portfolio facilitano i movimenti in selezione.",
        skillsLabel: "Competenze mappate",
        skillsDetail: "Almeno quattro competenze e funzioni preferite migliorano le raccomandazioni.",
      },
    },
    nextActions: {
      gapTemplate: "Colma il divario {label}",
      interviewLabel: "Prepara una fase di colloquio",
      offerLabel: "Rispondi a un’offerta attiva",
      attentionTemplate: "{title} presso {employer} richiede ora la tua attenzione.",
      convertSavedLabel: "Converti un ruolo salvato in una candidatura attiva",
      convertSavedTemplate: "{title} è già nella tua selezione ed è pronto per un passaggio più profondo.",
      restartLabel: "Riavvia la ricerca con filtri più rigorosi",
      restartDetail: "Filtra per datori di lavoro verificati e ruoli interni per costruire una selezione più pulita più rapidamente.",
    },
    alertStatus: {
      active: "Attivo",
      paused: "In pausa",
    },
    recruiterUpdateTitleTemplate: "Aggiornamento {stage}",
  },
  divisionMarketplace: {
    metadata: {
      title: "Marketplace · ordini e attività venditore",
      description: "Segui ogni ordine HenryCo Marketplace, contestazione e payout venditore collegato a questo account — attività di acquisto e workspace venditore, rispecchiati in un’unica stanza in tempo reale.",
    },
    hero: {
      eyebrow: "Marketplace · live",
      ariaLabel: "Panoramica Marketplace",
      sideAriaLabel: "Come funziona questa stanza",
      sideKicker: "Come funziona questa stanza",
      sideTitle: "Acquista e vendi — una sola stanza.",
      sideBody: "Ogni ordine, contestazione e richiesta di payout creata su Marketplace si riflette in questa stanza. L’attività del workspace venditore si intreccia agli ordini dell’acquirente, così entrambi i lati del marketplace restano visibili a colpo d’occhio.",
      breakdownLabel: "Per stato",
      breakdownAriaLabel: "Suddivisione dell’attività",
      tilesAriaLabel: "Attività Marketplace",
      tileLabels: {
        orders: "Ordini",
        disputes: "Contestazioni",
        store: "Negozio",
        payouts: "Payout",
      },
      tileFoot: {
        ordersEmpty: "Il primo ordine apparirà qui",
        ordersInMotionTemplate: "{inFlight} in corso · {delivered} consegnati",
        ordersDeliveredTemplate: "{delivered} consegnati a oggi",
        disputesClear: "Tutto a posto",
        disputesActiveTemplate: "{open} aperti · {resolving} in risoluzione",
        storeActiveNoName: "Iscrizione venditore attiva",
        storeActiveWithNameTemplate: "Negozio: {name}",
        storeApplicationTemplate: "Candidatura: {status}",
        storeIdle: "Non vendi ancora — candidati quando sei pronto",
        payoutsEmptyNoneSettled: "Nessuna richiesta di payout",
        payoutsSettledTemplate: "{count} liquidati a oggi",
        payoutsPendingTemplate: "{amount} in attesa",
      },
      breakdownLabels: {
        inMotion: "In corso",
        openDisputes: "Contestazioni aperte",
        delivered: "Consegnati",
        pendingPayouts: "Payout in attesa",
      },
      state: {
        empty: {
          headline: "Inizia a comprare su HenryCo Marketplace.",
          blurb: "Ordini, contestazioni, attività venditore e payout si riflettono in questa stanza dalla prima transazione. Sfoglia il marketplace per iniziare.",
          ctaPrimary: "Apri Marketplace",
          ctaSecondary: "Diventa venditore",
        },
        attention: {
          headlineTemplateSingular: "{count} pratica richiede attenzione.",
          headlineTemplatePlural: "{count} pratiche richiedono attenzione.",
          blurb: "Contestazioni e ordini eccezione vanno in cima alla coda. Apri il caso per aggiungere prove o accettare la risoluzione.",
          ctaPrimary: "Esamina pratiche",
          ctaSecondary: "Apri Marketplace",
        },
        activeOrders: {
          headlineTemplateSingular: "{count} ordine in corso.",
          headlineTemplatePlural: "{count} ordini in corso.",
          blurb: "Stato in tempo reale, pagamento e follow-up venditore si riflettono in questa stanza da HenryCo Marketplace.",
          ctaPrimary: "Apri Marketplace",
          ctaSecondary: "Diventa venditore",
        },
        activePayouts: {
          headlineTemplateSingular: "{count} payout in revisione.",
          headlineTemplatePlural: "{count} payout in revisione.",
          blurb: "Le richieste di payout del venditore passano per la verifica finanziaria. Gli aggiornamenti compaiono qui man mano.",
          ctaPrimary: "Apri workspace venditore",
          ctaSecondary: "Apri Marketplace",
        },
        calmBuyer: {
          headlineTemplateSingular: "{count} ordine registrato.",
          headlineTemplatePlural: "{count} ordini registrati.",
          blurb: "Tutta la tua attività marketplace in una sola stanza — ordini acquirente, payout venditore, esiti delle contestazioni e ultimo stato di ogni negozio.",
          ctaPrimary: "Apri Marketplace",
          ctaSecondary: "Diventa venditore",
        },
        calmSeller: {
          headlineTemplateSingular: "{count} ordine · venditore attivo.",
          headlineTemplatePlural: "{count} ordini · venditore attivo.",
          blurb: "Tutta la tua attività marketplace in una sola stanza — ordini acquirente, payout venditore, esiti delle contestazioni e ultimo stato di ogni negozio.",
          ctaPrimary: "Apri Marketplace",
          ctaSecondary: "Apri workspace venditore",
        },
      },
    },
    sections: {
      matters: {
        title: "Pratiche attive",
        meta: "Contestazioni, stato della candidatura venditore e payout in attesa compaiono qui quando serve un’azione.",
        ariaLabel: "Pratiche Marketplace attive",
        emptyTitle: "Nulla richiede azione",
        emptyBody: "Tutta la tua attività marketplace procede regolarmente — nessuna contestazione aperta, nessun payout in revisione, e (se applicabile) la tua candidatura venditore è approvata.",
      },
      orders: {
        title: "Ordini recenti",
        empty: "Gli ordini effettuati su Marketplace compaiono qui in tempo reale.",
        metaTemplateSingular: "{count} ordine · più recente per primo",
        metaTemplatePlural: "{count} ordini · più recenti per primi",
        emptyTitle: "Ancora nessun ordine",
        emptyBody: "Effettua il tuo primo ordine su HenryCo Marketplace — stato, pagamento ed eventuali follow-up arrivano qui automaticamente.",
        ariaLabel: "Ordini recenti",
      },
      activity: {
        title: "Attività recente",
        empty: "Aggiornamenti di stato, pagamenti e recensioni si riflettono qui in tempo reale.",
        metaTemplateSingular: "{count} aggiornamento · più recente per primo",
        metaTemplatePlural: "{count} aggiornamenti · più recenti per primi",
        emptyTitle: "Nessuna attività marketplace per ora",
        emptyBody: "Conferme d’ordine, aggiornamenti delle contestazioni ed esiti dei payout del venditore appariranno qui in tempo reale.",
        ariaLabel: "Attività Marketplace",
      },
    },
    matters: {
      disputes: {
        kicker: "Contestazioni",
        titleTemplateSingular: "{count} caso richiede azione",
        titleTemplatePlural: "{count} casi richiedono azione",
        bodyLatestTemplate: "Ultimo: {ref} · aggiornato {stamp}",
        bodyFallback: "Apri la coda per aggiungere prove.",
        cta: "Esamina casi",
      },
      application: {
        kicker: "Candidatura venditore",
        bodyWithStoreTemplate: "Negozio: {name}",
        bodyDefault: "Candidatura nella coda di revisione HenryCo.",
        bodyReviewSuffixTemplate: " · {note}",
        cta: "Vedi stato",
        defaultStatus: "inviata",
      },
      payouts: {
        kicker: "Payout in revisione",
        titleTemplate: "{amount} in attesa",
        bodyTemplateSingular: "{count} richiesta in attesa di verifica finanziaria.",
        bodyTemplatePlural: "{count} richieste in attesa di verifica finanziaria.",
        cta: "Apri workspace venditore",
      },
    },
    orders: {
      rowTitleTemplate: "Ordine {orderNo}",
      rowSubTemplate: "{amount} · effettuato {stamp}",
      rowAriaLabelTemplate: "Ordine {orderNo} · {status}",
      statusFallbackDraft: "Bozza",
    },
    statusValueLabels: {
      delivered: "Consegnato",
      completed: "Completato",
      customer_confirmed: "Confermato dal cliente",
      fulfilled: "Evaso",
      cancelled: "Annullato",
      refunded: "Rimborsato",
      disputed: "In contestazione",
      exception: "Eccezione",
      placed: "Inserito",
      paid: "Pagato",
      awaiting_fulfilment: "In attesa di evasione",
      confirmed: "Confermato",
      queued: "In coda",
    },
    applicationStatusLabels: {
      submitted: "inviata",
      under_review: "in revisione",
      approved: "approvata",
      rejected: "rifiutata",
      pending_documents: "documenti in sospeso",
      changes_requested: "modifiche richieste",
    },
    formatLabels: {
      dash: "—",
    },
  },
  divisionLearn: {
    metadata: {
      title: "Learn · dashboard di apprendimento",
      description: "Tieni traccia di ogni iscrizione HenryCo Learn, lezione, esito di quiz, certificato, formazione assegnata e candidatura come docente collegata a questo account — catalogo su Learn, progressi rispecchiati qui.",
    },
    hero: {
      ariaLabel: "Panoramica Learn",
      eyebrow: "Learn · in diretta",
      sideKicker: "Come funziona questa stanza",
      sideTitle: "Catalogo su Learn, progressi qui.",
      sideBody: "Ogni lezione, quiz e certificato di HenryCo Learn si sincronizza in questa stanza — riprendi da dove ti sei fermato, vedi i tuoi progressi a colpo d’occhio e tieni le tue certificazioni in un unico posto.",
      breakdownLabel: "Per stato",
      breakdownAriaLabel: "Suddivisione dell’attività di apprendimento",
      tilesAriaLabel: "Attività di apprendimento",
      tileLabels: {
        active: "Attivi",
        completed: "Completati",
        certificates: "Certificati",
        assignments: "Assegnati",
      },
      tileFoot: {
        activeEmpty: "Iscriviti per iniziare un corso",
        activeWith: "Lezioni e quiz rispecchiati qui",
        completedEmpty: "I programmi che completerai appariranno qui",
        completedWith: "Utile per CV e reportistica",
        certificatesEmpty: "Ottienine uno completando un corso",
        certificatesWith: "Link verificabili per ogni credenziale",
        assignmentsEmpty: "Nulla di assegnato al momento",
        assignmentsWith: "Dal tuo manager o team",
      },
      breakdownNames: {
        active: "Attivi",
        assigned: "Assegnati",
        certificates: "Certificati",
        saved: "Salvati",
      },
      openLearnCta: "Apri HenryCo Learn",
      applyToTeachCta: "Candidati per insegnare",
      state: {
        empty: {
          headline: "Inizia il tuo percorso HenryCo Learn.",
          blurb: "Sfoglia il catalogo, iscriviti a un corso e ogni lezione, quiz e certificato si sincronizzeranno automaticamente in questa stanza.",
        },
        active: {
          headlineTemplateSingular: "{count} corso in corso.",
          headlineTemplatePlural: "{count} corsi in corso.",
          blurb: "Riprendi da dove ti sei fermato — lezioni, quiz, certificati e formazione assegnata si sincronizzano da HenryCo Learn in questa stanza.",
        },
        calm: {
          headlineTemplateSingular: "{count} corso completato.",
          headlineTemplatePlural: "{count} corsi completati.",
          blurb: "Le tue credenziali e la cronologia di apprendimento restano qui, utili per CV, reportistica interna o il tuo archivio personale.",
        },
      },
    },
    sections: {
      coursesTitle: "Continua a imparare",
      coursesMetaEmpty: "Sfoglia il catalogo HenryCo Learn per iscriverti al tuo primo corso.",
      coursesMetaTemplate: "{active} attivi · {completed} completati",
      extrasTitle: "Credenziali, assegnazioni e insegnamento",
      extrasMeta: "Certificati, formazione assegnata, corsi salvati e candidatura come docente vivono qui.",
      activityTitle: "Attività recente",
      activityMetaTemplateSingular: "{count} aggiornamento · più recente per primo",
      activityMetaTemplatePlural: "{count} aggiornamenti · più recenti per primi",
      activityMetaEmpty: "Lezioni, quiz, certificati e pagamenti si rispecchiano qui in tempo reale.",
    },
    empty: {
      coursesTitle: "Nessun corso collegato ancora",
      coursesBody: "Sfoglia il catalogo su HenryCo Learn e iscriviti. Il tuo posto apparirà qui automaticamente.",
      activityTitle: "Nessuna attività Learn ancora",
      activityBody: "Avanzamento dei corsi, esiti di quiz, emissione di certificati e ricevute di pagamento appaiono qui in tempo reale.",
    },
    courses: {
      ariaLabel: "Corsi",
      completedAtTemplate: "Completato il {date}",
      progressPercentTemplate: "{percent}% completato",
      statusDelimiter: " · ",
    },
    extras: {
      ariaLabel: "Extra Learn",
      certificatesTitle: "Certificati",
      assignmentsTitle: "Formazione assegnata",
      savedTitle: "Corsi salvati",
      teachingTitle: "Insegna con HenryCo",
      statusLabel: "Stato",
      expertiseLabel: "Competenza",
      topicsLabel: "Argomenti",
      openApplicationCta: "Apri candidatura",
      applyToTeachCta: "Candidati per insegnare",
      teachingEmpty: "Esaminiamo manualmente le candidature come docenti. Candidati su HenryCo Learn e lo stato si sincronizzerà qui.",
    },
    activity: {
      ariaLabel: "Attività Learn",
      fallbackTitle: "Attività Learn",
    },
  },
  divisionLogistics: {
    metadata: {
      title: "Logistica · consegne e spedizioni",
      description: "Ogni ritiro, consegna, ETA e prova di consegna HenryCo Logistics legati a questo account — riflessi dalla rete logistica in un'unica stanza ordinata.",
    },
    hero: {
      ariaLabel: "Panoramica logistica",
      eyebrow: "HenryCo Logistica",
      brand: "HenryCo Logistica",
      title: "Ogni pacco, un'unica stanza.",
      body: "Ritiri, consegne, ETA e prove di consegna — tutto riflesso dalla rete logistica nel tuo account. Prenota una volta su",
      bodyDomain: " logistics.henrycogroup.com",
      ctaNewDelivery: "Nuova consegna",
    },
    metrics: {
      ariaLabel: "Performance logistica",
      activeNowLabel: "Attive ora",
      activeFootSingular: "spedizione in viaggio",
      activeFootPlural: "spedizioni in viaggio",
      deliveredMonthLabel: "Consegnate · questo mese",
      deliveredMonthFootTemplate: "{count} totali",
      onTimeRateLabel: "Puntualità",
      onTimeRateFootEmpty: "In attesa della prima consegna programmata",
      onTimeRateFootHasValue: "Delle consegne programmate",
      totalSpendLabel: "Spesa totale",
      totalSpendFoot: "Pagato a vita",
    },
    map: {
      noShipmentsAriaLabel: "Nessuna spedizione ancora",
      noShipmentsTitle: "La tua mappa si accenderà alla prima consegna",
      noShipmentsBody: "Ogni ritiro e consegna attivi vengono fissati qui automaticamente. Prenota una volta e le tue spedizioni si riflettono dal sito logistico.",
      noShipmentsCta: "Prenota una consegna",
      pendingAriaLabel: "Anteprima mappa",
      pendingTitle: "Geocodifica in corso",
      pendingBody: "Le tue spedizioni attive verranno fissate sulla mappa non appena gli indirizzi di ritiro e consegna saranno geocodificati dal dispatch.",
      activeAriaLabel: "Mappa delle spedizioni attive",
      altTemplateSingular: "Mappa con {count} pin attivo di ritiro e consegna",
      altTemplatePlural: "Mappa con {count} pin attivi di ritiro e consegna",
      liveBadgeTemplateSingular: "Live · {count} spedizione attiva",
      liveBadgeTemplatePlural: "Live · {count} spedizioni attive",
    },
    sections: {
      activeTitle: "In viaggio ora",
      activeMetaTemplate: "{count} attive · sincronizzazione automatica dalla logistica",
      activeRailAriaLabel: "Spedizioni attive",
      emptyAriaLabel: "Nessuna spedizione attiva",
      emptyTitle: "Nessuna spedizione attiva",
      emptyBody: "Le tue consegne passate sono qui sotto. Prenotane un'altra e apparirà qui non appena il corriere conferma il ritiro.",
      actionsTitle: "Avvia una consegna",
      actionsMeta: "Scorciatoie ai flussi più comuni",
      actionsAriaLabel: "Azioni rapide logistica",
      recentTitle: "Consegnate di recente",
      recentMetaTemplate: "Ultime {recent} su {lifetime} totali",
      recentAriaLabel: "Consegne recenti",
      spendTitle: "Spesa · ultimi 6 mesi",
      spendMeta: "Solo pagate",
      spendFigureAriaLabelTemplate: "Spesa logistica degli ultimi 6 mesi",
    },
    statusLabels: {
      quoteRequested: "Preventivo in attesa",
      quoteSent: "Preventivo pronto",
      pendingPayment: "Pagamento in attesa",
      scheduled: "Programmata",
      assigned: "Corriere assegnato",
      pickupConfirmed: "Ritirata",
      inTransit: "In transito",
      delayed: "In ritardo",
      attemptedDelivery: "Tentativo di consegna",
      delivered: "Consegnata",
      completed: "Completata",
      closed: "Chiusa",
      cancelled: "Annullata",
      refunded: "Rimborsata",
    },
    urgencyLabels: {
      standard: "Standard",
      sameDay: "In giornata",
      express: "Express",
      nextDay: "Giorno successivo",
    },
    serviceLabels: {
      scheduled: "Programmato",
      sameDay: "In giornata",
      interCity: "Tra città",
      bulk: "Sfuso",
    },
    shipment: {
      trackingCodeAriaTemplate: "Codice tracciamento {code}",
      addressPending: "Indirizzo in attesa",
      etaPending: "ETA in attesa",
      trackCta: "Traccia spedizione",
      openTrackingAriaTemplate: "Apri tracciamento per {code}",
      etaAriaTemplate: "ETA {eta}",
      etaMinutesInTemplate: "tra {minutes} min",
      etaMinutesOverdueTemplate: "{minutes} min di ritardo",
      etaHoursInTemplate: "tra {hours} h",
      etaHoursOverdueTemplate: "{hours} h di ritardo",
      detailSeparator: " · ",
    },
    timeline: {
      ariaLabel: "Consegne recenti",
      deliveredToTemplate: "Consegnato a {name}",
      receiptCta: "Ricevuta",
    },
    quickActions: {
      ariaLabel: "Azioni rapide logistica",
      bookLabel: "Prenota una consegna",
      bookDesc: "Ritiro e consegna in un unico flusso guidato.",
      trackLabel: "Traccia con codice",
      trackDesc: "Stato live, ETA e contesto del corriere.",
      quoteLabel: "Preventivo prima",
      quoteDesc: "Prezzo indicativo prima di confermare.",
      addressesLabel: "Indirizzi salvati",
      addressesDesc: "Contatti di ritiro e consegna.",
      invoicesLabel: "Ricevute e fatture",
      invoicesDesc: "PDF brandizzati per ogni spedizione.",
      supportLabel: "Supporto logistica",
      supportDesc: "Apri una conversazione legata al tuo account.",
    },
    spend: {
      figureAriaLabel: "Spesa logistica degli ultimi 6 mesi",
      emptyTick: "—",
    },
  },

  divisionStudio: {
    metadata: {
      title: "Studio · sale di progetto",
      description: "Segui ogni collaborazione HenryCo Studio collegata a questo account — proposte, milestone, pagamenti, deliverable e attività in un’unica sala.",
    },
    hero: {
      eyebrowLive: "Studio · live",
      overviewAriaLabel: "Panoramica Studio",
      activityAriaLabel: "Attività Studio",
      sideAriaLabel: "Come funziona questa sala",
      sideLabel: "Come funziona questa sala",
      sideTitle: "Una sala di progetto, stato reale.",
      sideBody: "Proposte, milestone, prove di pagamento, deliverable e segnali di comunicazione restano collegati alla stessa identità HenryCo che usi ovunque. La dashboard sotto riflette l’avanzamento reale del team Studio, non una semplice lista di stati.",
      breakdownAriaLabel: "Suddivisione attività",
      breakdownLabel: "Per stato",
      tiles: {
        activeLabel: "Progetti attivi",
        activeFootEmpty: "Nessuna sala di lavoro attiva al momento",
        activeFootHasValue: "Sale attive con dinamica di consegna",
        pendingLabel: "Pagamenti in sospeso",
        pendingFootEmpty: "Corsia commerciale libera",
        pendingFootHasValue: "Checkpoint commerciali ancora aperti",
        proofLabel: "Prove caricate",
        proofFootEmpty: "Nulla in attesa di revisione",
        proofFootHasValue: "Pagamenti in attesa di revisione Studio",
        deliverablesLabel: "Deliverable",
        deliverablesFootEmpty: "I file compaiono qui quando Studio li carica",
        deliverablesFootHasValue: "File e output tracciati in un unico posto",
      },
      breakdown: {
        active: "Attivo",
        readyReview: "Pronto per revisione",
        pendingPayment: "Pagamento in sospeso",
        proofSubmitted: "Prova caricata",
      },
      state: {
        empty: {
          headline: "Avvia un brief Studio.",
          blurb: "Quando una proposta o un progetto parte con la tua identità HenryCo, la sala Studio sincronizzata appare qui — milestone, pagamenti, deliverable e prossima mossa insieme.",
          ctaPrimary: "Avvia un brief",
          ctaSecondary: "Apri Studio",
        },
        attention: {
          headlineTemplateSingular: "{count} pagamento scaduto.",
          headlineTemplatePlural: "{count} pagamenti scaduti.",
          blurb: "Un checkpoint di pagamento è scaduto. Apri la sala per caricare la prova o contattare il team Studio.",
          ctaPrimary: "Apri pagamenti",
          ctaSecondary: "Apri Studio",
        },
        activeReady: {
          headlineTemplateSingular: "{count} progetto pronto per revisione.",
          headlineTemplatePlural: "{count} progetti pronti per revisione.",
          blurb: "Deliverable e revisioni attendono la tua approvazione. Apri la sala per rivedere e sbloccare il prossimo milestone.",
          ctaPrimary: "Apri progetti",
          ctaSecondary: "Apri Studio",
        },
        activeProjects: {
          headlineTemplateSingular: "{count} progetto attivo.",
          headlineTemplatePlural: "{count} progetti attivi.",
          blurb: "Sale attive con movimento di milestone, checkpoint di pagamento e deliverable — tutti riflessi da HenryCo Studio in questa sala.",
          ctaPrimary: "Apri Studio",
          ctaSecondary: "Avvia un nuovo brief",
        },
        calm: {
          headlineTemplateSingular: "{count} sala di progetto a registro.",
          headlineTemplatePlural: "{count} sale di progetto a registro.",
          blurb: "Ogni collaborazione Studio che hai mai avviato — proposte, milestone, pagamenti, deliverable — conservata in una sala per un follow-up rapido.",
          ctaPrimary: "Apri Studio",
          ctaSecondary: "Avvia un nuovo brief",
        },
      },
    },
    sections: {
      projectsTitle: "Sale di progetto",
      projectsAriaLabel: "Progetti Studio",
      projectsMetaEmpty: "Le sale appaiono qui quando una collaborazione Studio diventa attiva.",
      projectsMetaTemplateSingular: "{count} progetto · ordinato per ultimo movimento",
      projectsMetaTemplatePlural: "{count} progetti · ordinati per ultimo movimento",
      paymentsTitle: "Checkpoint di pagamento",
      paymentsAriaLabel: "Pagamenti Studio",
      paymentsMetaEmpty: "Le richieste di pagamento Studio appaiono qui quando una proposta o un progetto è attivo.",
      paymentsMetaTemplateSingular: "{count} checkpoint · caricamento prova e stato di approvazione",
      paymentsMetaTemplatePlural: "{count} checkpoint · caricamento prova e stato di approvazione",
      activityTitle: "Attività recente",
      activityAriaLabel: "Attività Studio",
      activityMetaEmpty: "Aggiornamenti di progetto, prove di pagamento e approvazioni di milestone si riflettono qui.",
      activityMetaTemplateSingular: "{count} aggiornamento · più recente per primo",
      activityMetaTemplatePlural: "{count} aggiornamenti · più recenti per primo",
    },
    empty: {
      projectsTitle: "Nessuna sala Studio collegata per ora",
      projectsBody: "Appena una proposta o un progetto viene creato con la tua identità HenryCo, la sala Studio sincronizzata apparirà qui — milestone, pagamenti, deliverable e prossima mossa.",
      paymentsTitle: "Nessun checkpoint di pagamento per ora",
      paymentsBody: "I milestone commerciali — anticipo, metà progetto e consegna — emergono qui quando una proposta diventa attiva con te.",
      activityTitle: "Nessuna attività Studio per ora",
      activityBody: "Aggiornamenti di progetto, prove di pagamento, rilasci di deliverable e approvazioni di milestone appariranno qui appena avvengono.",
    },
    projects: {
      listAriaLabel: "Progetti Studio",
      fallbackSubtitle: "Studio sta preparando il prossimo aggiornamento.",
      milestonesTemplate: "{approved}/{total} milestone",
      paymentsTemplateSingular: "{count} pagamento aperto",
      paymentsTemplatePlural: "{count} pagamenti aperti",
      deliverablesTemplateSingular: "{count} deliverable",
      deliverablesTemplatePlural: "{count} deliverable",
      updatedTemplate: "Aggiornato {stamp}",
      rowAriaLabelTemplate: "{title} · {kind}",
      fallbackStamp: "—",
    },
    projectKindLabels: {
      live: "Live",
      ready_review: "Pronto per revisione",
      scheduled: "Programmato",
      delivered: "Consegnato",
      issue: "Azione necessaria",
    },
    payments: {
      listAriaLabel: "Pagamenti Studio",
      rowAriaLabelTemplate: "{label} · {status}",
      dueTemplate: "Scadenza {stamp}",
      updatedTemplate: "Aggiornato {stamp}",
      subTemplate: "{amount} · {method} · {due}",
    },
    paymentStatusLabels: {
      pending: "in sospeso",
      paid: "pagato",
      approved: "approvato",
      settled: "saldato",
      proof_uploaded: "prova caricata",
      proof_submitted: "prova inviata",
      in_review: "in revisione",
      rejected: "rifiutato",
      overdue: "scaduto",
      failed: "fallito",
      pending_deposit: "anticipo in sospeso",
    },
    activity: {
      listAriaLabel: "Attività Studio",
      rowAriaLabelTemplate: "{title} · {stamp}",
    },
  },
  settings: {
    pageTitle: "Impostazioni e preferenze",
    pageDescription:
      "Gestisci il tuo profilo, le preferenze di comunicazione, i controlli sulla privacy e le richieste manuali di dati.",
    profileSectionKicker: "Informazioni del profilo",
    notificationsSectionKicker: "Preferenze di notifica",
  },
  addresses: {
    metadata: {
      title: "Indirizzi",
      description:
        "Gestisci i tuoi indirizzi salvati (casa, ufficio, negozio…) — usati per consegne, prenotazioni e verifica KYC.",
    },
    hero: {
      title: "Indirizzi",
      description:
        "Gestisci i tuoi indirizzi salvati (casa, ufficio, negozio…) — usati per consegne, prenotazioni e verifica KYC.",
    },
    card: {
      defaultBadge: "Predefinito",
      kycVerifiedBadge: "Verificato KYC",
      setDefaultCta: "Imposta come predefinito",
      editCta: "Modifica",
      deleteCta: "Elimina",
    },
    deleteConfirm: {
      prompt: "Eliminare questo indirizzo? L'operazione non può essere annullata.",
      confirmCta: "Elimina",
      cancelCta: "Annulla",
    },
    empty: {
      body:
        "Non hai ancora aggiunto indirizzi. Aggiungine uno per velocizzare il checkout in tutto HenryCo.",
    },
    add: {
      cta: "Aggiungi indirizzo",
      formTitle: "Aggiungi un nuovo indirizzo",
      editFormTitleTemplate: "Modifica {label}",
      maxedNoticeTemplate:
        "Hai aggiunto il numero massimo di {count} tipi di indirizzi (casa, ufficio, negozio, magazzino, alternativo 1, alternativo 2). Modifica o elimina uno per aggiungerne un altro.",
    },
  },
  search: {
    metadata: {
      title: "Cerca nell'account",
      description:
        "Cerca flussi di lavoro dell'account HenryCo e percorsi collegati delle divisioni.",
    },
    hero: {
      title: "Cerca nei tuoi flussi HenryCo.",
      description:
        "Vai direttamente alle azioni esatte dell'account e ai percorsi collegati delle divisioni, senza ripiegare su dashboard generiche.",
    },
    placeholder: "Cerca nell'account: notifiche, portafoglio, fatture, supporto, candidature lavoro...",
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
    smartHomeEmptyFallback:
      "Nnọọ — bido site na obere nzọụkwụ mbụ. Ihe ịrịba ama ndụ gị ga-apụta ebe a ozugbo arụmọrụ rutere.",
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
    priorityFallback: {
      low: "Dị jụụ",
      normal: "Nke kwesịrị",
      high: "Dị elu",
      urgent: "Achọrọ ngwa ngwa",
    },
    eyebrow: "Ahịrị omume · ndụ ndụ",
    guidanceTitle: "Otu ahịrị, ngalaba niile.",
    overviewAria: "Nlebanya ọrụ",
    volumeAria: "Olu ọrụ",
    pendingAria: "Ọrụ na-atọ",
    sideAria: "Otu ahịrị si arụ ọrụ",
    bySource: "Site n'isi mmalite",
    openTotalLabel: "Mkpokọta meghere",
    nothingBlocking: "Ọ dịghị ihe na-egbochi ugbu a",
    resolveBlockers: "Dozie ka i meghee ụzọ ndị ọzọ",
    routine: "nke kwesịrị",
    divisionRepresentedSingular: "{count} ngalaba na-anọchi anya",
    divisionRepresentedPlural: "{count} ngalaba na-anọchi anya",
    headlineEmpty: "Ọ dịghị ihe nọ n'ahịrị.",
    headlineBlockerSingular: "{count} ihe mgbochi chọrọ ka i kpochapụ.",
    headlineBlockerPlural: "{count} ihe mgbochi chọrọ ka i kpochapụ.",
    headlineUrgentSingular: "{count} ọrụ achọrọ ngwa ngwa ka emechaa.",
    headlineUrgentPlural: "{count} ọrụ achọrọ ngwa ngwa ka emechaa.",
    headlineActiveSingular: "{count} ọrụ ka arụpụta.",
    headlineActivePlural: "{count} ọrụ ka arụpụta.",
    headlineCalmSingular: "{count} ihe nọ n'ahịrị gị.",
    headlineCalmPlural: "{count} ihe nọ n'ahịrị gị.",
    blurbEmpty: "Akaụntụ gị nọ n'usoro — nyocha, ụgwọ, na ụzọ ndị siri ike nyocha niile dị ọcha. Anyị ga-ezipụta omume na-esote ebe a n'onwe ya mgbe ọ pụtara.",
    blurbRisk: "Ihe ndị a na-egbochi omume ntụkwasị obi dị elu na HenryCo — mwepụ akpa ego, nkwado onye na-ere ahịa Marketplace, nyocha onye na-ewe ọrụ. Idozi ha na-emeghe ụzọ ọ bụla.",
    blurbActive: "Ahịrị ọ bụla na-eduga gị na omume na-esote n'otu otu. Nzacha, mkpado isi mkpa, na njikọ na-anọgide kwekọrịtara na ngalaba HenryCo niile.",
    metaEmpty: "I dị ọcha. Ihe ọhụrụ ọ bụla ga-apụta ebe a mgbe ọ rutere.",
    metaCount: "{count} meghere · ahaziri site na isi mkpa na ọnọdụ mgbochi.",
  },
  security: {
    title: "Nchedo",
    description: "Nyochaa omume nchedo ọgbọ ọhụrụ, gbanwee paswọọdụ gị, wee kwụsị nnọkọ HenryCo mgbe achọrọ.",
    heroAriaLabel: "Nlebanya nchedo",
    hero: {
      trustScoreLabel: "Akara ntụkwasị obi",
      nextTierPrefix: "Na-esote ·",
      nextTierAriaTemplate: "Ọkwa na-esote {tier}",
      accountActiveSingularTemplate: "Akaụntụ na-arụ ọrụ ụbọchị {days}",
      accountActivePluralTemplate: "Akaụntụ na-arụ ọrụ ụbọchị {days}",
      flaggedEventsSingularTemplate: "{count} ihe omume akara n'ihe ndekọ · nyochaa n'okpuru",
      flaggedEventsPluralTemplate: "{count} ihe omume akara n'ihe ndekọ · nyochaa n'okpuru",
      statusEyebrow: {
        secure: "Nchedo na nnabata · nchekwa",
        watch: "Nchedo na nnabata · omume akwadoro",
        risk: "Nchedo na nnabata · ihe ize ndụ akara",
      },
      statusHeadline: {
        secure: "Akaụntụ gị nọ n'echekwa.",
        watch: "Ọrụ ole na ole ga-eme akaụntụ gị siri ike karịa.",
        risk: "Anyị akarala omume nke chọrọ anya gị.",
      },
      statusBlurb: {
        secure: "Ọ dịghị ihe omume na-enyo enyo, nyocha nọ n'ezi ọnọdụ, omume ntụkwasị obi ọ bụla HenryCo na-enye meghere gị.",
        watch: "Ọ dịghị ihe gbajiri — mana akara ole na ole (nkwenye email, nyocha njirimara, mkpakọrịta onye kwekọrọ) ga-ebuli akara ntụkwasị obi gị ma meghee ụzọ ndị ọzọ.",
        risk: "Ihe omume na-adịbeghị anya ka echeko dị ka ihe ize ndụ dị elu. Nyochaa ihe ndekọ omume n'okpuru ma gbanwee paswọọdụ ma ọ bụrụ na ihe ọ bụla yiri ihe ọhụrụ.",
      },
    },
    signalsTitle: "Akara",
    signalsMeta: "Ihe igwe nyocha na akara anyị na-ahụ n'akaụntụ gị ugbu a.",
    signalsAriaLabel: "Akara nchedo",
    guideTitle: "Ebe ị nọ · ihe na-akwalite gị",
    guideMetaTemplate: "Ọnụ ọgụgụ eziokwu, ọ bụghị nke ahịa. {tier}.",
    allLanesOpen: "Ụzọ niile meghere",
    accountActionsTitle: "Omume akaụntụ",
    accountActionsMeta: "Ọchịchị ndị nkịtị nke i nwere n'onwe gị.",
    changePasswordTitle: "Gbanwee paswọọdụ gị",
    signOutEverywhereTitle: "Pụọ ebe niile",
    suspiciousEventFoot: "Nyochaa ihe ndekọ omume n'okpuru.",
    noSuspiciousEventFoot: "Ọ dịghị ihe akara na nyocha ikpeazụ.",
    activityAriaLabel: "Ihe omume nchedo na-adịbeghị anya",
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
  messages: {
    metadata: {
      title: "Ozi · HenryCo",
      description:
        "Otu igbe ozi maka nkwado, ahịa, ọrụ, studio, nlekọta, ụlọ, mbufe na mmụta.",
    },
    hero: {
      eyebrow: "HenryCo · igbe ozi jikọtara",
      ariaLabel: "Nlerughari igbe ozi",
      ariaTiles: "Olu igbe ozi",
      ariaSide: "Site na portal",
      sideLabel: "Site na portal",
      sideBody:
        "Portal nke ọ bụla na-eweta n’otu igbe ozi a. Nkwado, iwu ahịa, ajụjụ ọnụ ọrụ, ọrụ studio na ndokwa nlekọta niile na-egosi ebe a n’usoro oge.",
    },
    headlines: {
      zero: "Igbe ozi ọcha n’ofe HenryCo niile.",
      calmOne: "Otu eriri na-eche gị.",
      calmMany: "Eriri {count} ka mepere emepe.",
      busy: "{unread} agụghị agụ · {open} mepere emepe n’ofe portal gị.",
      overloaded: "{unread} agụghị agụ n’ime eriri {open} mepere emepe.",
    },
    blurbs: {
      zero: "Ihe niile akwadoro — nkwado, ahịa, ọrụ, studio, nlekọta, ụlọ, mbufe na mmụta.",
      calm: "Nzaghachi mkpirikpi ugbu a na-emechi akaghị tupu echi.",
      busy: "Pịa ahịrị iji mepee eriri ahụ, ma ọ bụ nyochaa otu portal n’otu oge.",
      overloaded: "Gafee ngalaba n’otu n’otu — eriri kachasị ọhụrụ n’elu.",
    },
    tiles: {
      openLabel: "Mepere emepe",
      openFootEmpty: "Ọ dịghị ihe na-aga n’ihu",
      openFootActive: "Eriri ndị na-eche mmegharị",
      unreadLabel: "Agụghị agụ",
      unreadFootEmpty: "Igbe ozi nọ na ndị",
      unreadFootActive: "Pịa ahịrị iji mepee eriri ahụ",
      portalsLabel: "Portal",
      portalsFootEmpty: "Nlekọta, Ahịa, Studio, Ọrụ na ndị ọzọ",
      portalsFootSingular: "Otu ngalaba na-arụ ọrụ",
      portalsFootPlural: "Ngalaba {count} nọchitere",
    },
    sideTitle: {
      empty: "Dị jụụ na ngalaba ọ bụla",
      singular: "Otu ngalaba nwere okporo ụzọ",
      plural: "Ngalaba {count} dị n’ime ya",
    },
    section: {
      title: "Eriri",
      ariaLabel: "Eriri igbe ozi",
      metaEmpty: "Ọ dịghị ihe ebe a — portal niile na-azụ igbe ozi a",
      metaSingular: "{count} eriri",
      metaPlural: "Eriri {count}",
    },
    chips: {
      ariaLabel: "Nyochaa igbe ozi site na portal",
      allThreads: "Eriri niile",
    },
    empty: {
      eyebrow: "Igbe ozi dị jụụ",
      titleAll: "Ọ dịghị ihe na-eche gị.",
      titleFilter: "Enwebeghị eriri na portal a.",
      bodyAll:
        "Nkwado, ahịa, ọrụ, studio, nlekọta, ụlọ, mbufe na mmụta niile na-egosi ebe a — ihe ọ bụla cross-portal ga-abịa na ndepụta a ozugbo ọ malitere.",
      bodyFilter:
        "Gbanwee chip nyocha iji hụ portal ọzọ, ma ọ bụ chọgharịa eriri niile iji kpebie na ọ dịghị ihe na-eche.",
    },
    list: {
      unreadDotLabel: "Agụghị agụ",
      fallbackTime: "—",
    },
    divisionLabels: {
      support: "Nkwado",
      marketplace: "Ahịa",
      jobs: "Ọrụ",
      studio: "Studio",
      care: "Nlekọta",
      property: "Ụlọ",
      logistics: "Mbufe",
      learn: "Mmụta",
    },
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
  support: {
    metadata: {
      title: "Nkwado",
      description: "Nweta enyemaka maka ọrụ HenryCo ọ bụla.",
    },
    hero: {
      title: "Nkwado",
      description: "Nweta enyemaka maka ọrụ HenryCo ọ bụla.",
      newRequestCta: "Arịrịọ ọhụrụ",
    },
    summary: {
      openRequestsTemplate: "{count} arịrịọ mepere emepe",
      escalatedTemplate: "{count} bulitere elu",
      escalationNote:
        "A na-esochi ozi ọ bụla. Ọ bụrụ na nyocha mbụ akpọtụrụ ihe ize ndụ ma ọ bụ ihe ngwa ngwa, ndị ọrụ na-enweta kwụụ otu mbụ na-akpaghị aka.",
    },
    quickHelp: {
      helpCenterLabel: "Ebe Enyemaka",
      helpCenterDesc: "Chọgharịa ajụjụ ndị a na-ajụkarị na ntuziaka",
      contactLabel: "Kpọtụrụ Anyị",
      contactDesc: "Nkwado site na email ma ọ bụ ekwentị",
      liveChatLabel: "Mkparịta ụka Ndụ",
      liveChatDesc: "Soro ndị otu anyị kparịta ụka",
    },
    threads: {
      sectionKicker: "Arịrịọ gị",
      emptyTitle: "Enweghị arịrịọ nkwado",
      emptyDescription:
        "Ị mebebeghị arịrịọ nkwado ọ bụla. Anyị nọ ebe a iji nyere gị aka ọ bụrụ na ị chọrọ ihe ọ bụla.",
      createCta: "Mepụta arịrịọ",
    },
    statusLabels: {
      open: "Emepere",
      awaitingReply: "Na-eche nzaghachi",
      inProgress: "Na-aga n’ihu",
      resolved: "Edoziri",
      closed: "Emechiri",
    },
    priorityLabels: {
      low: "Dị ala",
      normal: "Nkịtị",
      high: "Dị elu",
      urgent: "Ngwa ngwa",
    },
  },
  payments: {
    hero: {
      title: "Ụzọ ịkwụ ụgwọ",
      description: "Jikwaa ụzọ ịkwụ ụgwọ ndị ị chekwara maka ngwa ngwa ịkwụ ụgwọ.",
      addMethodCta: "Tinye ụzọ",
    },
    empty: {
      title: "Enweghị ụzọ ịkwụ ụgwọ",
      description:
        "Tinye kaadị debit, akaụntụ ụlọakụ, ma ọ bụ ụzọ ịkwụ ụgwọ ọzọ maka ngwa ngwa ịkwụ ụgwọ n’ọrụ HenryCo niile.",
      cta: "Tinye ụzọ ịkwụ ụgwọ",
    },
    card: {
      savedMethodFallback: "Ụzọ echekwara",
      cardLastFourTemplate: "•••• {last4}",
    },
    wallet: {
      eyebrow: "Akpa ego HenryCo",
      body: "Akpa ego HenryCo gị dị mgbe niile dị ka nhọrọ ịkwụ ụgwọ.",
      manageCta: "Jikwaa akpa ego",
    },
  },
  savedItems: {
    metadata: {
      title: "Ihe echekwara",
      description:
        "Ihe ndị i wepụrụ na nkata HenryCo ọ bụla, anyị na-edobere gị ụbọchị iri itoolu ma na-adọ aka na ntị otu izu tupu ha agwụ.",
    },
    hero: {
      title: "Chekwa maka mgbe ọzọ",
      description:
        "Ihe ndị i wepụrụ na nkata HenryCo ọ bụla. Anyị ga-edobere gị ha ụbọchị iri itoolu ma dọọ gị aka na ntị otu izu tupu ha agwụ.",
    },
    summary: {
      activeTemplate: "{count} na-arụ ọrụ",
      expiredTemplate: "{count} agwụla",
      expiryNote:
        "Ihe na-agwụ ụbọchị iri itoolu mgbe e chekwara ha. Anyị na-adọ gị aka na ntị otu izu n’oge.",
      savedTemplate: "{count} echekwara",
    },
    toolbar: {
      showLabel: "Gosi",
      allDivisions: "Ngalaba niile",
      sortLabel: "Hazie",
      sortNewest: "Kacha ọhụrụ buru ụzọ",
      sortOldest: "Kacha ochie buru ụzọ",
      sortExpiring: "Na-agwụ ngwa ngwa",
    },
    selection: {
      selectedTemplate: "Ahọpụtara {count}",
      clear: "Hichaa",
      moving: "Ana-ebufe…",
      moveSelectedToCart: "Bufee ndị ahọpụtara na nkata",
      selectAllOnPage: "Họrọ niile na peeji a",
    },
    empty: {
      title: "O nweghị ihe echekwara maka mgbe ọzọ ka",
      description:
        "Mgbe ị hụrụ ihe ị na-akwadebeghị ịzụ, chekwaa ya na nkata maka mgbe ọzọ. Anyị ga-edebe ọnụahịa ị hụrụ ma dọọ gị aka na ntị otu izu tupu ọ gwụ.",
      browseCta: "Chọgharịa",
    },
    card: {
      deselectItem: "Wepụ nhọrọ",
      selectItem: "Họrọ ihe",
      savedItemFallback: "Ihe echekwara",
      expiresToday: "Na-agwụ taa",
      expiresInTemplate: "Na-agwụ n’ime ụbọchị {days}{plural}",
      expiredNotice: "Agwụla — iweghachi na-eweghachi oge ụbọchị iri itoolu",
      moveToCart: "Bufee na nkata",
      moving: "Ana-ebufe…",
      removeFromSaved: "Wepụ n’ihe echekwara",
      openOriginal: "Mepee ndepụta mbụ",
    },
    expired: {
      sectionKicker: "Ndị gwụrụ na nso nso a",
      sectionNote: "Iweghachi na-eweghachi oge ụbọchị iri itoolu.",
    },
  },
  documents: {
    metadata: {
      title: "Akwụkwọ",
      description:
        "Akwụkwọ nnata gị, asambodo, nkwekọrịta na faịlụ ndị dị mkpa — e debere ha na nzuzo ma na-enweta ha n’ime ngalaba HenryCo niile.",
    },
    hero: {
      eyebrow: "Igbe nchekwa onwe gị",
      title: "Akwụkwọ",
      body: "Akwụkwọ nnata gị, asambodo, nkwekọrịta na faịlụ ndị dị mkpa.",
    },
    toolbar: {
      uploadCta: "Bulite akwụkwọ",
      filterLabel: "Nzacha",
      allCategories: "Ụdị niile",
      sortLabel: "Hazie",
      sortNewest: "Nke ọhụrụ buru ụzọ",
      sortOldest: "Nke ochie buru ụzọ",
    },
    types: {
      document: "Akwụkwọ",
      receipt: "Akwụkwọ nnata",
      certificate: "Asambodo",
      id_document: "Akwụkwọ njirimara",
      contract: "Nkwekọrịta",
      other: "Ọzọ",
    },
    categories: {
      all: "Niile",
      document: "Akwụkwọ",
      receipt: "Akwụkwọ nnata",
      certificate: "Asambodo",
      id_document: "Akwụkwọ njirimara",
      contract: "Nkwekọrịta",
      other: "Ọzọ",
    },
    card: {
      uploadedOnTemplate: "E bulitere na {date}",
      sizeTemplate: "{size}",
      downloadLabel: "Budata",
      noFileAttached: "Enweghị faịlụ etinyere",
      openOriginal: "Mepee akwụkwọ",
    },
    empty: {
      title: "Enwebeghị akwụkwọ",
      description:
        "Akwụkwọ gị, akwụkwọ nnata na asambodo sitere na ọrụ HenryCo ga-anọ ebe a.",
    },
    summary: {
      countTemplate: "{count} akwụkwọ{plural}",
      filteredTemplate: "{count} n’ime {total} egosiri",
    },
    retention: {
      eyebrow: "Nzuzo na nchekwa",
      title: "Faịlụ gị ga-anọ na nzuzo",
      body: "A na-ezo akwụkwọ niile mgbe ezubeghị ọrụ, naanị gị ka ọ na-egosi, anyị na-edebe ha ruo mgbe akaụntụ HenryCo gị dị ndụ ma ọ bụrụ na i wepụghị ha.",
    },
  },
  subscriptions: {
    metadata: {
      title: "Ndenye aha",
      description:
        "Nchịkọta naanị-agụ nke atụmatụ na-arụ ọrụ, ndị si na ngalaba HenryCo dị iche iche bịa.",
    },
    hero: {
      eyebrow: "Atụmatụ na-arụ ọrụ",
      title: "Ndenye aha",
      description:
        "Nchịkọta naanị-agụ nke atụmatụ, sitere na ngalaba ndị na-ezite ndenye aha ha n’ime ebe nchịkọta akaụntụ ahụ.",
    },
    empty: {
      title: "Enwebeghi ndenye aha echekwara",
      description:
        "Nke a nwere ike pụta na i nweghị atụmatụ na-arụ ọrụ, ma ọ bụ na ngalaba ahụ ebipụtabeghị ndenye aha ya n’ime ebe nchịkọta akaụntụ.",
    },
    card: {
      planFallback: "Atụmatụ ndenye aha",
      tierSeparator: " · ",
      amountLabel: "Ego",
      cycleLabel: "Mgbe ọ bụla",
      renewsLabel: "Ọ ga-emelite",
      renewsFallback: "—",
    },
    statusLabels: {
      active: "Na-arụ ọrụ",
      paused: "Akwụsịtụrụ",
      cancelled: "Akagbuola",
      expired: "Agwụla",
      past_due: "Kwesịrị ịkwụ ụgwọ",
      trialing: "N’oge ọnwale",
      grace: "Oge amara",
      pending: "Na-eche",
      unknown: "Amaghị",
    },
    cycleLabels: {
      monthly: "Kwa ọnwa",
      yearly: "Kwa afọ",
      annual: "Kwa afọ",
      quarterly: "Kwa ọnwa atọ",
      weekly: "Kwa izu",
      biweekly: "Kwa izu abụọ",
      daily: "Kwa ụbọchị",
      one_time: "Otu mgbe",
      notSet: "Edobeghị",
    },
    cta: {
      upgrade: "Bulie atụmatụ",
      downgrade: "Wedata atụmatụ",
      cancel: "Kagbuo ndenye aha",
      manage: "Jikwaa na ngalaba",
      resume: "Maliteghachi ndenye aha",
    },
    paymentIssue: {
      title: "Ịkwụ ụgwọ chọrọ nlebara anya",
      description:
        "Anyị enweghị ike ịnata mmelite ikpeazụ ahụ. Melite ụzọ ịkwụ ụgwọ gị iji mee ka ndenye aha a nọgide na-arụ ọrụ.",
      updatePaymentCta: "Melite ụzọ ịkwụ ụgwọ",
    },
    summary: {
      activeTemplate: "{count} na-arụ ọrụ",
      pausedTemplate: "{count} kwụsịtụrụ",
      totalTemplate: "{count} atụmatụ",
    },
  },
  referrals: {
    metadata: {
      title: "Ndị Ezịgara",
      description:
        "Kpọọ ndị ahịa ruru eru gaa HenryCo ma soro ụgwọ ọrụ site na ọnọdụ na-eche, enyochara, na akwụnyere.",
    },
    hero: {
      title: "Ndị Ezịgara",
      description:
        "Kpọọ ndị ahịa ruru eru gaa HenryCo ma soro ụgwọ ọrụ site na ọnọdụ na-eche, enyochara, na akwụnyere.",
    },
    code: {
      eyebrow: "Koodu nzipu gị",
      shareLinkLabel: "Njikọ nkesa",
      copyCodeTitle: "Detuo koodu",
      copyLinkTitle: "Detuo njikọ",
      copyLinkLabel: "Detuo njikọ",
      copiedToast: "Edetuola!",
      rewardNote:
        "Ụgwọ ọrụ: {amount} kwa nzipu ruru eru. A na-emepe ụgwọ ọrụ mgbe onye ezigara mechara ihe nzụta akwụrụ ụgwọ n'ime windo njide ụbọchị {days}.",
    },
    stats: {
      totalReferred: "Ngụkọta Ndị Ezigara",
      signedUp: "Ndị Debara",
      qualified: "Ndị Ruru Eru",
      flagged: "Ndị Akara",
      pendingRewards: "Ụgwọ Ọrụ Na-eche",
      releasedRewards: "Ụgwọ Ọrụ Ewepụtara",
    },
    howItWorks: {
      eyebrow: "Otú Ọ Si Arụ Ọrụ",
      step1Title: "Kekọrịta koodu gị",
      step1Body:
        "Kekọrịta koodu pụrụ iche gị ma ọ bụ njikọ. Ndị enyi na-eji njikọ gị aga ngalaba ọ bụla nke HenryCo ka a na-esoso ozugbo.",
      step2Title: "Ha na-azụ ahịa",
      step2Body:
        "Mgbe ha debanyere aha, nzipu ahụ na-abanye n'ime windo njide nke ụbọchị {days}. Anyị na-eso akaụntụ a kpọrọ naanị otu ugboro — nzipu onwe, ndị ezinụlọ ndabara, na ndebanye aha emejiri arụghị ọrụ ruo eru.",
      step3Title: "Ụgwọ ọrụ na-edebanye mgbe ọ ruru eru",
      step3Body:
        "Nzipu ndị ruru eru na-akwụnye {amount} na obere akpa HenryCo gị mgbe nyochaa ego. Ụgwọ ọrụ na-eche enweghị ike imefu tutu eweputara.",
    },
    policy: {
      eyebrow: "Iwu Nzipu",
      qualifying:
        "Mgbanwe ruru eru pụtara na akaụntụ ezigara mechara omume HenryCo kwesịrị ekwesị nke gabigara ịkwụ ụgwọ na nyocha ntụkwasị obi.",
      enforcement:
        "HenryCo nwere ike ijigide, gbanwee, ma ọ bụ kagbuo ụgwọ ọrụ maka nzipu onwe, akagharị mgbanwe ndabara, mgbagharị, nkwụghachi, ma ọ bụ usoro ụgwọ ọrụ enyo.",
      separation:
        "Dashboard gị na-egosi nzipu na akụkọ ụgwọ ọrụ iche ka a ghara iji ndebanye aha esochiri kwekọọ na ego e debanyere n'obere akpa.",
    },
    referralsList: {
      eyebrow: "Nzipu Gị",
      emptyTitle: "Enwebeghị nzipu ọ bụla",
      emptyDescription:
        "Kekọrịta koodu nzipu gị ka ịmalite ịkpọ ndị mmadụ. Nzipu ga-egosipụta ebe a ozugbo mmadụ jiri njikọ gị debanye aha.",
      refereeFallback: "Ndebanye aha ezigara",
      signedUpTemplate: "Debara aha {date}",
      qualifiedTemplate: "Rurupụrụ {date}",
    },
    statusLabels: {
      pending: "Na-eche ndebanye aha",
      converted: "Debanyere · oge njide",
      qualified: "Rurupụrụ · ụgwọ ọrụ emepere",
      flagged: "Akara · nchekwa aghụghọ",
      expired: "Agafeela",
    },
    flagReasons: {
      selfReferral: "Egbochiri nzipu onwe",
      duplicateEmail: "Ozi-e ezigara emechaa",
      deviceReuse: "Iji ngwaọrụ ọzọ",
    },
    rewards: {
      eyebrow: "Akụkọ Ụgwọ Ọrụ",
      emptyTitle: "Enwebeghị ụgwọ ọrụ",
      emptyDescription:
        "Ụgwọ ọrụ akwụnyere ga-egosipụta ebe a mgbe mgbanwe ndị ruru eru gafee nyocha na nyocha mgbochi mmebi iwu.",
      referralRewardFallback: "Ụgwọ Ọrụ Nzipu",
      paidTemplate: "Akwụrụ {date}",
      statusLabels: {
        held: "Ejigidere",
        pending: "Na-eche",
        released: "Ewepụtara",
        paid: "Akwụrụ",
        cancelled: "Akagburu",
      },
    },
  },
  divisionCare: {
    metadata: {
      title: "Care · ndokwa ejikọrọ",
      description: "Soro nlekọta ọ bụla nke HenryCo Care ejikọrọ na akaụntụ a — ọnọdụ, nyochaa ịkwụ ụgwọ, na nzọụkwụ ọrụ na-esote n'otu ebe.",
    },
    hero: {
      eyebrow: "Care · ozugbo",
      sideKicker: "Otú ụlọ a si arụ ọrụ",
      sideTitle: "Debe na Care, soro ya ebe a.",
      sideBody: "Nlekọta ọ bụla emere na HenryCo Care na-egosi ebe a — koodu nsochi, ọnọdụ ịkwụ ụgwọ na nzọụkwụ ọrụ na-esote na-erute ebe a na-akpaghị aka. Dashboard nke a na-anọgide na-emekọ ihe ka ọrụ na-aga n'ihu.",
      breakdownLabel: "Site n'ọnọdụ",
      tilesAriaLabel: "Nchịkọta ndokwa Care",
      tileLabels: {
        total: "Ndokwa",
        inFlight: "Na-eje ozi",
        payment: "Na-eche ịkwụ ụgwọ",
        completed: "Mechara",
      },
      tileFoot: {
        totalEmpty: "Debe nke mbụ ọrụ Care iji malite",
        totalWithTemplate: "{count} ejikọrọ na akaụntụ a",
        inFlightEmpty: "Ọ dịghị ihe na-eme ugbu a",
        inFlightWith: "Ọnọdụ ozugbo na-egosi n'okpuru",
        paymentEmpty: "Enweghị nyocha ịkwụ ụgwọ na-echere",
        paymentWith: "Zipu ma ọ bụ lelee akwụkwọ ego n'okpuru",
        completedEmpty: "Enweghị ọrụ emechara",
        completedWith: "Otu Care kọwapụtara dị ka emechara",
      },
      breakdownLabels: {
        inFlight: "Na-eje ozi",
        scheduled: "Edebere",
        payment: "Na-eche ịkwụ ụgwọ",
        completed: "Mechara",
      },
      state: {
        empty: {
          headline: "Debe nke mbụ ọrụ Care.",
          blurb: "Ọrụ Care ndị ị debere ebe a na-emekọ na-akpaghị aka n'ụlọ a — koodu nsochi, ọnọdụ ịkwụ ụgwọ na nzọụkwụ ọrụ na-esote.",
          ctaPrimary: "Debe ọrụ",
          ctaSecondary: "Mepee nsochi",
        },
        attention: {
          headlineTemplateSingular: "{count} omume iji mee.",
          headlineTemplatePlural: "{count} omume iji mee.",
          blurb: "Otu ndokwa ma ọ bụ karịa na-echere nyocha ịkwụ ụgwọ ma ọ bụ nlekọta. Mepee ndokwa dị n'okpuru iji wepụ ya.",
          ctaPrimary: "Lelee ndokwa",
          ctaSecondary: "Mepee nsochi",
        },
        active: {
          headlineTemplateSingular: "{count} ọrụ na-aga.",
          headlineTemplatePlural: "{count} ọrụ na-aga.",
          blurb: "Nsochi ozugbo, nyocha ịkwụ ụgwọ, na nzọụkwụ ọrụ na-esote ka egosipụtara site HenryCo Care n'ụlọ a.",
          ctaPrimary: "Mepee nsochi",
          ctaSecondary: "Debe ọrụ",
        },
        calm: {
          headlineTemplateSingular: "{count} ndokwa edekọrọ.",
          headlineTemplatePlural: "{count} ndokwa edekọrọ.",
          blurb: "Ndokwa Care gị, koodu nsochi, akwụkwọ ego na omume na-esote — n'otu ebe, na-emekọ ihe ozugbo.",
          ctaPrimary: "Debe ọrụ",
          ctaSecondary: "Mepee nsochi",
        },
      },
    },
    sections: {
      glance: "Omume na-esote",
      glanceMeta: "Ndokwa kacha mkpa na-egosi ebe a.",
      bookings: "Ndokwa niile",
      bookingsEmpty: "Ndokwa emere mgbe ị banyere na-egosi ebe a ozugbo.",
      bookingsMetaTemplateSingular: "{count} ndokwa · nyochaa, kewaa, mepee maka nkọwa ozugbo.",
      bookingsMetaTemplatePlural: "{count} ndokwa · nyochaa, kewaa, mepee maka nkọwa ozugbo.",
      activity: "Ọrụ na-adịbeghị anya",
      activityEmpty: "Mmelite ọnọdụ, akwụkwọ ego, na nyocha na-egosi ebe a ka ha na-eme.",
      activityMetaTemplateSingular: "{count} mmelite · nke ọhụrụ buru ụzọ",
      activityMetaTemplatePlural: "{count} mmelite · nke ọhụrụ buru ụzọ",
    },
    empty: {
      title: "Enweghị ndokwa Care ejikọrọ ugbu a",
      body: "Ndokwa ị mere na Care mgbe ị banyere ga-egosi ebe a ozugbo. Ndokwa ochie ga-egosipụtakwa ozugbo ozi-e ha ma ọ bụ ekwentị ha dabara na profaịlụ kerịtara gị.",
    },
    glance: {
      nextActionLabel: "Omume na-esote",
      serviceLabel: "Ọrụ",
      pickupLabel: "Mbu",
      balanceLabel: "Ego fọrọ",
      trackingLabel: "Nsochi",
      serviceFallback: "Ọrụ Care",
    },
    activityAriaLabel: "Ọrụ Care",
    status: {
      live: "Na-eje ozi",
      scheduled: "Edebere",
      completed: "Mechara",
      issue: "Achọrọ omume",
      payment: "Nyocha ịkwụ ụgwọ",
    },
    statusValueLabels: {
      booked: "Edebere",
      awaiting_payment: "Na-eche ịkwụ ụgwọ",
      receipt_submitted: "Akwụkwọ ego ezipuru",
      under_review: "Na-enyocha",
      delivered: "Enyefere",
      customer_confirmed: "Onye ahịa kwenyere",
      inspection_completed: "Nyochaa mezuru",
      service_completed: "Ọrụ mechara",
      cancelled: "Akagburu",
      issue: "Nsogbu",
      exception: "Mpụga",
      rejected: "Ajụrụ",
    },
    formatLabels: {
      toBeScheduled: "Aga edebere",
      shortMonths: ["Jan", "Feb", "Maa", "Epr", "Mee", "Jun", "Jul", "Ọgọ", "Sep", "Ọkt", "Nov", "Disem"],
    },
    dashboard: {
      filters: {
        all: "Niile",
        unpaid: "Ego fọrọ",
        receipt: "Akwụkwọ ego / nyocha",
        active: "Na-aga",
        completed: "Mechara",
        issue: "Nsogbu",
      },
      filtered: "nyochara",
      bookingSingular: "ndokwa",
      bookingPlural: "ndokwa",
      metrics: {
        visible: "Ndokwa a na-ahụ",
        visibleHint: "Ndokwa Care ezi okwu ejikọrọ na akaụntụ a.",
        balance: "Ego fọrọ",
        balanceHintSomeTemplate: "{count} ndokwa ka chọrọ nlekọta ịkwụ ụgwọ.",
        balanceHintNone: "Enweghị ego Care a na-akwụghị mepere ugbu a.",
        receiptQueue: "Ahịrị akwụkwọ ego",
        receiptQueueHintSome: "Ndokwa nwere akwụkwọ ego ezipuru ka na-eche nyocha.",
        receiptQueueHintNone: "Enweghị mbubu na nyocha akwụkwọ ego jikọtara na akaụntụ a.",
        completed: "Mechara",
        completedHintSome: "Ndokwa mechara nwere ike ịgaba nlekọta nyocha.",
        completedHintNone: "Ndokwa Care mechara ga-egosi ebe a mgbe ọrụ ahụ mechiri.",
      },
      linkedBookings: "Ndokwa Care ejikọrọ",
      linkedBookingsDescription: "Ndokwa Care gị, ọnọdụ ịkwụ ụgwọ na omume na-esote.",
      onThisPage: "n'ibe a",
      selectedBooking: "Ndokwa a họọrọ",
      paymentSnapshot: "Nchịkọta ịkwụ ụgwọ",
      receiptVisibility: "Mgbasa akwụkwọ ego",
      nextBestAction: "Omume kachasị mma na-esote",
      serviceSummary: "Nchịkọta ọrụ",
      serviceFallback: "Ọrụ Care",
      addressPending: "Adreesị na-eche",
      updated: "Emelitere",
      balanceDue: "Ego fọrọ",
      nextMove: "Mmegharị na-esote",
      paginationLabel: "Pejịnatị ndokwa Care",
      pageLabel: "Ibe",
      of: "nke",
      perPage: "kwa ibe",
      previous: "Gara aga",
      next: "Na-esote",
      customerFallback: "Onye ahịa",
      scheduledDate: "Ụbọchị edebere",
      notScheduled: "Edebebeghị",
      timeWindow: "Oge",
      windowPending: "Oge na-eche",
      pickupAddress: "Adreesị mbu",
      returnAddress: "Adreesị nloghachi / nnyefe",
      returnAddressFallback: "Na-eji adreesị mbu ma ọ bụrụ na agbanwebeghị mgbe ndokwa",
      trackingCode: "Koodu nsochi",
      quotedTotal: "Mkpokọta ekwuru",
      amountRecorded: "Ego edekọrọ",
      receiptState: "Ọnọdụ akwụkwọ ego",
      receiptsSubmitted: "Akwụkwọ ego ezipuru",
      lastSubmission: "Ngosipụta ikpeazụ",
      noReceiptYet: "Enweghị akwụkwọ ego",
      openLiveBooking: "Mepee ndokwa ozugbo",
      leaveReview: "Hapụ nyocha",
    },
  },
  divisionProperty: {
    metadata: {
      title: "Property · ndị edobere & ajụjụ",
      description: "Ndepụta Property gị, ajụjụ, nleta na nsogharị ndepụta — ihe ọ bụla i mere na HenryCo Property na-egosipụta n’ime ụlọ akaụntụ a.",
    },
    hero: {
      eyebrow: "Property · ndụ",
      ariaLabel: "Nchịkọta Property",
      browseListingsCta: "Chọgharịa ndepụta",
      savedShortlistCta: "Edobere",
      tilesAriaLabel: "Mmegharị Property",
      tileLabels: {
        saved: "Edobere",
        inquiries: "Ajụjụ",
        viewings: "Nleta",
        listings: "Ndepụta",
      },
      tileFoot: {
        savedManagedTemplate: "{count} HenryCo na-elekọta",
        savedEmpty: "Dobe ndepụta iji wuo ndepụta ụfọdụ",
        savedWith: "Tụlee ma laghachi mgbe ọ bụla",
        inquiriesEmpty: "Enweghị mkparịta ụka mepere emepe",
        inquiriesWith: "Nsogharị na-eru n’ụlọ a",
        viewingsEmpty: "Rịọ nleta n’ụlọ edobere",
        viewingsWith: "Nkwenye na-emegharị n’akụrụngwa niile",
        listingsEmpty: "Nyefee ndepụta na Property",
        listingsWith: "Nsonaazụ nleba anya na-erute ebe a",
      },
      sideAriaLabel: "Otú ụlọ a si arụ ọrụ",
      sideKicker: "Otú ụlọ a si arụ ọrụ",
      sideTitle: "Chọpụta na Property, soro ya n’ebe a.",
      sideBody:
        "Dobe ndepụta, rịọ nleta, ma ọ bụ mepee ajụjụ na HenryCo Property — ihe ọ bụla i mere na-egosipụta n’ụlọ akaụntụ a ka i nwee ike ịmaliteghachi ebe i kwụsịrị, n’elu ngwaọrụ niile.",
      sideBodyMuted:
        "Ndepụta HenryCo na-elekọta na-egosi akara Elekọta — nleba anya, nyocha, na nsogharị mgbazinye na-anabata site n’òtù Property.",
      breakdownAriaLabel: "Nkewa mmegharị",
      breakdownLabel: "Site n’mmegharị",
      breakdownLabels: {
        saved: "Edobere",
        inquiries: "Ajụjụ",
        viewings: "Nleta",
        listings: "Ndepụta",
      },
      state: {
        empty: {
          headline: "Bido ịchọgharị HenryCo Property.",
          blurb:
            "Chọpụta ụlọ obibi, ndepụta ire ahịa, na ụlọ ndị HenryCo na-elekọta. Dobe ndị ị masịrị, ajụjụ ọ bụla, nleta, ma ọ bụ nsogharị ndepụta na-arute ebe a n’onwe ya.",
        },
        discover: {
          headlineTemplateSingular: "{count} ụlọ n’ndepụta.",
          headlineTemplatePlural: "{count} ụlọ n’ndepụta.",
          blurb:
            "Ụlọ edobere, dị njikere maka ọmụmụ ọzọ. Mepee ndepụta iji rịọ nleta ma ọ bụ zipu ajụjụ — nsogharị ga-alaghachi ozugbo n’ụlọ a.",
        },
        active: {
          viewingHeadlineTemplateSingular: "{count} nleta ahaziri.",
          viewingHeadlineTemplatePlural: "{count} nleta ahaziri.",
          inquiryHeadlineTemplateSingular: "{count} ajụjụ na-arụ ọrụ.",
          inquiryHeadlineTemplatePlural: "{count} ajụjụ na-arụ ọrụ.",
          blurb:
            "Ndepụta gị, ajụjụ, na usoro nleta bi n’ otu ụlọ. Maliteghachi ebe i kwụsịrị — ihe ọ bụla na-egosipụta site na HenryCo Property n’oge mmemme.",
        },
      },
    },
    sections: {
      saved: "Ndepụta edobere",
      savedMetaEmpty: "Dobe ndepụta na HenryCo Property iji wuo ndepụta gị.",
      savedMetaTemplate: "{saved} edobere · {managed} HenryCo na-elekọta",
      activity: "Mmegharị ọhụrụ",
      activityMetaEmpty: "Ajụjụ, nleta, na nyocha ndepụta na-egosipụta ebe a mgbe ha na-eme.",
      activityMetaTemplateSingular: "{count} mmelite · ọhụrụ mbụ",
      activityMetaTemplatePlural: "{count} mmelite · ọhụrụ mbụ",
    },
    empty: {
      savedTitle: "Enweghị ụlọ edobere",
      savedBody:
        "Chọpụta ụlọ obibi, ndepụta ire ahịa, na ụlọ ndị HenryCo na-elekọta na Property. Ihe ọ bụla i dobere na-arute ebe a n’onwe ya.",
      activityTitle: "Enweghị mmegharị Property",
      activityBody:
        "Mepee ndepụta na HenryCo Property iji rịọ nleta ma ọ bụ zipu ajụjụ — nzọụkwụ ọ bụla, site na ozi mbụ ruo nyocha, ga-apụta ebe a.",
    },
    activity: {
      ariaLabel: "Mmegharị Property",
      titles: {
        inquiry: "Ajụjụ ụlọ",
        viewing: "Arịrịọ nleta",
        listing_submitted: "Edepụtara ndepụta",
        listing_updated: "Emelitere ndepụta",
        listing_reviewed: "Nyocha ndepụta agwụla",
      },
    },
    gallery: {
      ariaLabel: "Ụlọ edobere",
      managedBadge: "Elekọta",
      featuredBadge: "Pụtara ìhè",
      locationPending: "Ebe na-echere",
      contactAgent: "Kpọtụrụ onye nnọchite anya",
      savedAtTemplate: "Edobere na {date}",
      bedSingular: "ọnụ ụlọ ihi",
      bedPlural: "ọnụ ụlọ ihi",
      bathSingular: "ime ọma",
      bathPlural: "ime ọma",
      sizeSqmTemplate: "{size} sqm",
    },
  },
  divisionMarketplace: {
    metadata: {
      title: "Marketplace · iwu ahịa na ọrụ onye na-ere",
      description: "Soro iwu HenryCo Marketplace ọ bụla, esemokwu na ụgwọ onye na-ere ejikọtara na akaụntụ a — ọrụ onye na-azụ na ebe ọrụ onye na-ere, na-egosi n’otu ụlọ ozugbo.",
    },
    hero: {
      eyebrow: "Marketplace · ndụ",
      ariaLabel: "Nlebanya Marketplace",
      sideAriaLabel: "Otu ụlọ a si arụ ọrụ",
      sideKicker: "Otu ụlọ a si arụ ọrụ",
      sideTitle: "Zụta ma ree — otu ụlọ.",
      sideBody: "Iwu ahịa, esemokwu na arịrịọ ụgwọ ọ bụla i mepụtara na Marketplace na-egosi n’ụlọ a. Ọrụ ebe onye na-ere na-abanye n’akụkụ iwu ahịa nke onye na-azụ, ka akụkụ abụọ nke marketplace na-adịgide site n’otu ile anya.",
      breakdownLabel: "Site na ọnọdụ",
      breakdownAriaLabel: "Nkewa ọrụ",
      tilesAriaLabel: "Ọrụ Marketplace",
      tileLabels: {
        orders: "Iwu ahịa",
        disputes: "Esemokwu",
        store: "Ụlọ ahịa",
        payouts: "Ụgwọ",
      },
      tileFoot: {
        ordersEmpty: "Iwu mbụ ga-apụta ebe a",
        ordersInMotionTemplate: "{inFlight} na-aga · {delivered} enyefere",
        ordersDeliveredTemplate: "{delivered} enyefere ruo taa",
        disputesClear: "Ihe niile dị mma",
        disputesActiveTemplate: "{open} mepere · {resolving} a na-edozi",
        storeActiveNoName: "Ihe ọmụma onye na-ere dị irè",
        storeActiveWithNameTemplate: "Ụlọ ahịa: {name}",
        storeApplicationTemplate: "Akwụkwọ ọnọdụ: {status}",
        storeIdle: "Ị na-ereghị aka — tinye akwụkwọ mgbe ị dị njikere",
        payoutsEmptyNoneSettled: "Enwebeghị arịrịọ ụgwọ ọ bụla",
        payoutsSettledTemplate: "{count} akwụgharala ruo taa",
        payoutsPendingTemplate: "{amount} ka na-echere",
      },
      breakdownLabels: {
        inMotion: "Na-aga",
        openDisputes: "Esemokwu mepere",
        delivered: "Enyefere",
        pendingPayouts: "Ụgwọ na-echere",
      },
      state: {
        empty: {
          headline: "Malite ịzụ ihe na HenryCo Marketplace.",
          blurb: "Iwu, esemokwu, ọrụ onye na-ere na ụgwọ na-egosi n’ụlọ a ozugbo ị malitere azụmaahịa. Lelee marketplace iji malite.",
          ctaPrimary: "Mepee Marketplace",
          ctaSecondary: "Tinye akwụkwọ ire ihe",
        },
        attention: {
          headlineTemplateSingular: "Okwu {count} chọrọ nlebara anya.",
          headlineTemplatePlural: "Okwu {count} chọrọ nlebara anya.",
          blurb: "Esemokwu na iwu mwepu na-aga n’ihu n’ahịrị. Mepee okwu iji tinye akaebe ma ọ bụ nakwere mgbazi.",
          ctaPrimary: "Lelee okwu",
          ctaSecondary: "Mepee Marketplace",
        },
        activeOrders: {
          headlineTemplateSingular: "Iwu {count} na-aga.",
          headlineTemplatePlural: "Iwu {count} na-aga.",
          blurb: "Ọnọdụ iwu ndụ, ọnọdụ ịkwụ ụgwọ, na nleba anya onye na-ere na-egosi n’ụlọ a site na HenryCo Marketplace ozugbo.",
          ctaPrimary: "Mepee Marketplace",
          ctaSecondary: "Tinye akwụkwọ ire ihe",
        },
        activePayouts: {
          headlineTemplateSingular: "Ụgwọ {count} a na-elele.",
          headlineTemplatePlural: "Ụgwọ {count} a na-elele.",
          blurb: "Arịrịọ ụgwọ ndị na-ere na-aga site na nyocha ego. Ndepụta ọnọdụ na-apụta ebe a ka ndị otu na-arụ ọrụ.",
          ctaPrimary: "Mepee ebe ọrụ onye na-ere",
          ctaSecondary: "Mepee Marketplace",
        },
        calmBuyer: {
          headlineTemplateSingular: "Iwu {count} edebere.",
          headlineTemplatePlural: "Iwu {count} edebere.",
          blurb: "Ọrụ marketplace gị niile n’otu ụlọ — iwu ndị na-azụ, ụgwọ ndị na-ere, ihe si na esemokwu pụta, na ọnọdụ ọhụrụ nke ụlọ ahịa ọ bụla.",
          ctaPrimary: "Mepee Marketplace",
          ctaSecondary: "Tinye akwụkwọ ire ihe",
        },
        calmSeller: {
          headlineTemplateSingular: "Iwu {count} · onye na-ere na-arụ ọrụ.",
          headlineTemplatePlural: "Iwu {count} · onye na-ere na-arụ ọrụ.",
          blurb: "Ọrụ marketplace gị niile n’otu ụlọ — iwu ndị na-azụ, ụgwọ ndị na-ere, ihe si na esemokwu pụta, na ọnọdụ ọhụrụ nke ụlọ ahịa ọ bụla.",
          ctaPrimary: "Mepee Marketplace",
          ctaSecondary: "Mepee ebe ọrụ onye na-ere",
        },
      },
    },
    sections: {
      matters: {
        title: "Okwu na-arụ ọrụ",
        meta: "Esemokwu, ọnọdụ akwụkwọ onye na-ere na ụgwọ na-echere na-apụta ebe a mgbe a chọrọ ihe omume.",
        ariaLabel: "Okwu Marketplace na-arụ ọrụ",
        emptyTitle: "Ọ dịghị ihe chọrọ omume",
        emptyBody: "Ọrụ marketplace gị niile na-aga nke ọma — ọ dịghị esemokwu mepere, ọ dịghị ụgwọ a na-elele, na (ọ bụrụ na ọ dabara) akwụkwọ onye na-ere gị enyerela ohere.",
      },
      orders: {
        title: "Iwu ndị nso",
        empty: "Iwu emere na Marketplace na-egosi ebe a ozugbo.",
        metaTemplateSingular: "Iwu {count} · nke ọhụrụ na mbụ",
        metaTemplatePlural: "Iwu {count} · ndị ọhụrụ na mbụ",
        emptyTitle: "Enwebeghị iwu",
        emptyBody: "Mee iwu mbụ gị na HenryCo Marketplace — ọnọdụ iwu, ọnọdụ ịkwụ ụgwọ na nleba anya ọ bụla na-arịdata ebe a ozugbo.",
        ariaLabel: "Iwu ndị nso",
      },
      activity: {
        title: "Ọrụ ndị nso",
        empty: "Ndepụta ọnọdụ, ịkwụ ụgwọ na nyocha na-egosi ebe a ka ha na-eme.",
        metaTemplateSingular: "Ndepụta {count} · nke ọhụrụ na mbụ",
        metaTemplatePlural: "Ndepụta {count} · ndị ọhụrụ na mbụ",
        emptyTitle: "Enwebeghị ọrụ marketplace",
        emptyBody: "Nkwenye iwu, ndepụta esemokwu na ihe si n’ụgwọ onye na-ere pụta ga-apụta ebe a ka ha na-eme.",
        ariaLabel: "Ọrụ Marketplace",
      },
    },
    matters: {
      disputes: {
        kicker: "Esemokwu",
        titleTemplateSingular: "Okwu {count} chọrọ omume",
        titleTemplatePlural: "Okwu {count} chọrọ omume",
        bodyLatestTemplate: "Nke ọhụrụ: {ref} · emelitere {stamp}",
        bodyFallback: "Mepee ahịrị iji tinye akaebe.",
        cta: "Lelee okwu",
      },
      application: {
        kicker: "Akwụkwọ onye na-ere",
        bodyWithStoreTemplate: "Ụlọ ahịa: {name}",
        bodyDefault: "Akwụkwọ n’ahịrị nyocha HenryCo.",
        bodyReviewSuffixTemplate: " · {note}",
        cta: "Lelee ọnọdụ",
        defaultStatus: "ezigara",
      },
      payouts: {
        kicker: "Ụgwọ a na-elele",
        titleTemplate: "{amount} na-echere",
        bodyTemplateSingular: "Arịrịọ {count} na-echere nyocha ego.",
        bodyTemplatePlural: "Arịrịọ {count} na-echere nyocha ego.",
        cta: "Mepee ebe ọrụ onye na-ere",
      },
    },
    orders: {
      rowTitleTemplate: "Iwu {orderNo}",
      rowSubTemplate: "{amount} · emere {stamp}",
      rowAriaLabelTemplate: "Iwu {orderNo} · {status}",
      statusFallbackDraft: "Nzaghachi",
    },
    statusValueLabels: {
      delivered: "Enyefere",
      completed: "Emechara",
      customer_confirmed: "Onye ahịa kwenyere",
      fulfilled: "Emezuru",
      cancelled: "Akagbuoro",
      refunded: "Nyeghachiri ego",
      disputed: "N’esemokwu",
      exception: "Mwepu",
      placed: "Etinyere",
      paid: "Akwụrụ",
      awaiting_fulfilment: "Na-echere imezu",
      confirmed: "Akwadoro",
      queued: "N’ahịrị",
    },
    applicationStatusLabels: {
      submitted: "ezigara",
      under_review: "n’elele",
      approved: "anabatara",
      rejected: "ajụrụ",
      pending_documents: "akwụkwọ na-echere",
      changes_requested: "a chọrọ mgbanwe",
    },
    formatLabels: {
      dash: "—",
    },
  },
  divisionJobs: {
    metadata: {
      title: "Ọrụ · dashboard onye etinyere",
      description: "Soro tinyobi maka aplikeshọn HenryCo Jobs ọ bụla, ọrụ edobere, nleba anya nke onye na-achọ ndị ọrụ, na akara njikere profaịlụ ejikọtara na akaụntụ a.",
    },
    header: {
      title: "Ọrụ",
      description: "Aplikeshọn gị, ọrụ edobere, nleba anya nke ndị na-achọ ndị ọrụ, na ike profaịlụ — ihe niile n’otu ebe.",
      candidateModuleCta: "Modul onye etinyere",
      interviewRoomsCta: "Ọnụ ụlọ ajụjụ ọnụ",
      browseLiveRolesCta: "Chọgharịa ọrụ na-aga",
    },
    hero: {
      eyebrow: "Akaụntụ gị",
      headline: "Ihe omume ọrụ gị, ihe niile n’otu ebe.",
      body: "Aplikeshọn, ọrụ edobere, nleba anya nke ndị na-achọ ndị ọrụ, na njikere profaịlụ ejikọtara na akaụntụ HenryCo gị.",
      statsAriaLabel: "Nchịkọta ọrụ ọrụ",
      statLabels: {
        applications: "Aplikeshọn na-aga",
        saved: "Ọrụ edobere",
        readiness: "Njikere profaịlụ",
        updates: "Nleba anya ndị na-achọ ndị ọrụ",
      },
      statDetails: {
        applicationsLeadingTemplate: "{stage} bụ ọkwa na-eduga gị ugbu a.",
        applicationsEmpty: "Enwebeghị aplikeshọn na-aga ugbu a.",
        savedSome: "Ndepụta gị dị njikere maka nyocha ọzọ.",
        savedEmpty: "Wuo ndepụta ka ọrụ ndị dị mma dị mfe ịchọta ọzọ.",
        updatesLatestTemplate: "{relative} mmegharị ikpeazụ.",
        updatesEmpty: "Enwebeghị nleba anya ndị na-achọ ndị ọrụ.",
      },
    },
    sections: {
      nextActionsKicker: "Omume Ọzọ",
      nextActionsTitle: "Ihe kwesịrị nlebara anya gị ugbu a",
      openTimelineCta: "Mepee oge eme ihe",
      applicationsKicker: "Aplikeshọn",
      applicationsTitle: "Mmegharị ọrụ na-eme ugbu a",
      savedKicker: "Ọrụ Edobere",
      savedTitle: "Ndepụta nwere ihe ngosi karịa",
      openSavedRolesCta: "Mepee ọrụ edobere",
      recommendedKicker: "Ọrụ a tụrụ aro",
      recommendedTitle: "Ihe dabara na akara gị ugbu a",
      browseCatalogCta: "Chọgharịa katalọgụ",
      recruiterFeedKicker: "Mgbasa Nke Onye Na-achọ Ndị Ọrụ",
      recruiterFeedTitle: "Ozi, mmegharị ọkwa, na nleba anya",
      candidateInboxCta: "Igbe ozi onye etinyere",
      profileKicker: "Ike Profaịlụ",
      profileTitle: "Njikere onye etinyere na ọmarịcha CV",
      sharedInboxKicker: "Igbe Ozi Ekekọrịtara",
      sharedInboxTitle: "Mkpọsa ọrụ jikọtara na akaụntụ gị",
      alertsKicker: "Mkpọsa",
      alertsTitle: "Ebumnobi nchọchọ edobere",
    },
    empty: {
      applicationsTitle: "Enwebeghị aplikeshọn na-aga ugbu a",
      applicationsBody: "Ọrụ edobere, nleba anya ndị na-achọ ndị ọrụ, na oge eme ihe ga-apụta ebe a ozugbo ị gbanwere site na nchọgharị gaa n’aplikeshọn na-aga.",
      exploreJobsCta: "Nyochaa ọrụ",
      savedJobsTitle: "Enwebeghị ọrụ edobere",
      savedJobsBody: "Debe ọrụ ndị dị mma ka ha dịgide na ndepụta gị n’etiti Jobs na akaụntụ gị.",
      recommendedTitle: "Ntụaro ga-amapụta dị ka i ji Jobs",
      recommendedBody: "Mgbe profaịlụ, ndepụta, na aplikeshọn gị mụbawanyere, ntụaro ebe a ga-aka adaba.",
      recruiterFeedTitle: "Enwebeghị mmegharị nke onye na-achọ ndị ọrụ",
      recruiterFeedBody: "Mgbanwe ọkwa aplikeshọn, ndetu ekekọrịtara nke ndị na-achọ ndị ọrụ, na mkpọsa Jobs ga-akpọkọta ebe a.",
      notificationsTitle: "Enwebeghị mkpọsa ọrụ",
      notificationsBody: "Mmegharị ndepụta n’ọdịniihu, nleba anya nke ndị ọrụ, na mgbanwe aplikeshọn ga-arute ebe a na n’ime modul Jobs.",
      alertsTitle: "Enweghị mkpọsa ọrụ na-arụ ọrụ",
      alertsBody: "Mepụta mkpọsa ka ọrụ ọhụụ dabara na ụkpụrụ gị pụta na mgbasa Jobs gị.",
      browseRolesCta: "Chọgharịa ọrụ",
    },
    application: {
      progressPercentTemplate: "{percent}% mezuru",
      appliedAtTemplate: "Tinyere na {date}",
      candidateReadiness: "Njikere onye etinyere",
      recruiterConfidence: "Ntụkwasị obi nke onye na-achọ ndị ọrụ",
      latestMovement: "Mmegharị ikpeazụ nke onye na-achọ ndị ọrụ",
      nextBestMove: "Mmegharị kacha mma",
      openTimelineCta: "Mepee oge eme ihe",
      interviewRoomCta: "Ọnụ ụlọ ajụjụ ọnụ",
      viewRoleCta: "Lee ọrụ",
    },
    savedJob: {
      trustTemplate: "Ntụkwasị obi {score}",
      savedAtTemplate: "Edobere na {date}",
    },
    recommended: {
      compFallback: "A tụlere ụgwọ n’ime usoro",
    },
    stageLabels: {
      applied: "Etinyere",
      reviewing: "Na-enyocha",
      shortlisted: "Họpụtara",
      interview: "Ajụjụ ọnụ",
      offer: "Nye onyinye",
      hired: "Goro",
      rejected: "Jụrụ",
    },
    nextStep: {
      labels: {
        applied: "Mee ka profaịlụ na CV gị bụrụ ọhụụ",
        shortlisted: "Nweekwa ihe akaebe na ihe gbasara portfolio",
        interview: "Kwadebe ihe atụ na oge eme ihe",
        offer: "Nyochaa ọkwa, oge, na ụgwọ",
        rejected: "Mee ka ngwugwu aplikeshọn ọzọ sie ike",
      },
      bodies: {
        applied: "N’ọkwa mbụ, ihe akaebe doro anya, ihe nkwukọrịta dị ọcha, na CV ọhụụ na-enyere aka.",
        shortlisted: "Họpụta pụtara na i gafere nyochaa akara mbụ. Ihe akaebe ziri ezi dị mkpa ugbu a.",
        interview: "Ọkwa ajụjụ ọnụ na-eme ngwa ngwa ma akaebe ọrụ kacha mma na oge gị dị mfe ịhụ.",
        offer: "Jiri ọkwa onyinye iwepu enweghị doro anya, ọ bụghị iche ọrụ.",
        rejected: "Jiri njụ dị ka akara. Mee ka nchịkọta, ihe atụ, na dabara n’ọrụ sie ike tupu i tinye aplikeshọn ọzọ.",
      },
    },
    readinessLabels: {
      interviewReady: "Njikere maka ajụjụ ọnụ",
      strongProfile: "Profaịlụ siri ike",
      needsProof: "Chọrọ ihe akaebe",
      needsStructure: "Chọrọ usoro",
    },
    workModeLabels: {
      remote: "Site n’anya",
      hybrid: "Agwakọta",
      onsite: "N’ebe ọrụ",
    },
    employmentTypeLabels: {
      fullTime: "Oge zuru oke",
      partTime: "Oge nta",
      contract: "Nkwekọrịta",
      internship: "Mmụta na-arụ",
      temporary: "Nwa oge",
    },
    profile: {
      readinessLabel: "Njikere",
      skillsMappedLabel: "Nkà depụtara",
      filesLabel: "Faịlụ",
      improveProfileCta: "Mee ka profaịlụ ka mma",
      openCandidateModuleCta: "Mepee modul onye etinyere",
      checklist: {
        identityLabel: "Ntọala profaịlụ",
        identityDetail: "Aha zuru oke, ekwentị, na ebe dị maka soro onye na-achọ ndị ọrụ.",
        storyLabel: "Akụkọ ọrụ",
        storyDetail: "Aha akara na nchịkọta na-akọwa ihe ị na-eme karịa ngosi efu.",
        verificationLabel: "Nyochaa njirimara",
        verificationDetail: "Ntụkwasị obi Jobs ga-akwụsị ruo mgbe akaụntụ HenryCo gị wepụrụ nyocha njirimara.",
        proofLabel: "Ihe akaebe ọrụ",
        proofDetail: "CV gbakwunyere ihe akaebe portfolio na-eme ka mmegharị họpụta dị mfe.",
        skillsLabel: "Nkà depụtara",
        skillsDetail: "Opekata mpe nkà anọ na ọrụ a họọrọ na-eme ka ntụaro ka mma.",
      },
    },
    nextActions: {
      gapTemplate: "Mechie oghere {label}",
      interviewLabel: "Kwadebe maka ọkwa ajụjụ ọnụ",
      offerLabel: "Zaa onyinye na-arụ ọrụ",
      attentionTemplate: "{title} na {employer} chọrọ nlebara anya gị ugbu a.",
      convertSavedLabel: "Gbanwee ọrụ edobere ka ọ bụrụ aplikeshọn na-aga",
      convertSavedTemplate: "{title} adịzi na ndepụta gị, dịkwa njikere maka ọzọ nyocha.",
      restartLabel: "Bidogharịa nchọchọ ọrụ gị site na nyocha siri ike",
      restartDetail: "Jiri nyocha onye were nyochaa na ọrụ dị n’ime iji wuo ndepụta dị ọcha ngwa ngwa.",
    },
    alertStatus: {
      active: "Na-arụ ọrụ",
      paused: "Akwụsịrị",
    },
    recruiterUpdateTitleTemplate: "Nleba anya {stage}",
  },
  divisionLearn: {
    metadata: {
      title: "Learn · dashboard mmụta",
      description: "Soro nlekọta ndenye aha HenryCo Learn ọ bụla, ihe ọmụmụ, nsonaazụ ule, asambodo, ọzụzụ enyere, na arịrịọ nkuzi ejikọrọ na akaụntụ a — katalọgụ na Learn, ọganihu na-egosi ebe a.",
    },
    hero: {
      ariaLabel: "Nleba anya Learn",
      eyebrow: "Learn · ndụ",
      sideKicker: "Otú ọnụ ụlọ a si arụ ọrụ",
      sideTitle: "Katalọgụ na Learn, ọganihu ebe a.",
      sideBody: "Ihe ọmụmụ, ule na asambodo ọ bụla sitere na HenryCo Learn na-emekọrịta n’ọnụ ụlọ a — bido ebe ị kwụsịrị, hụ ọganihu gị n’otu ile anya, ma debe asambodo gị n’otu ebe.",
      breakdownLabel: "Site na ọnọdụ",
      breakdownAriaLabel: "Nkewa nke ọrụ mmụta",
      tilesAriaLabel: "Ọrụ mmụta",
      tileLabels: {
        active: "Na-arụ ọrụ",
        completed: "Emechara",
        certificates: "Asambodo",
        assignments: "Enyere",
      },
      tileFoot: {
        activeEmpty: "Debanye aha ka ịmalite kọsụ",
        activeWith: "Ihe ọmụmụ na ule na-egosi ebe a",
        completedEmpty: "Mmemme i mechara ga-egosi ebe a",
        completedWith: "Bara uru maka CV na akụkọ",
        certificatesEmpty: "Nweta otu site n’imecha kọsụ",
        certificatesWith: "Njikọ enwere ike ịkwado maka asambodo ọ bụla",
        assignmentsEmpty: "Ọ dịghị ihe enyere ugbu a",
        assignmentsWith: "Sitere n’aka onye nlekọta ma ọ bụ ndị otu gị",
      },
      breakdownNames: {
        active: "Na-arụ ọrụ",
        assigned: "Enyere",
        certificates: "Asambodo",
        saved: "Edobere",
      },
      openLearnCta: "Mepee HenryCo Learn",
      applyToTeachCta: "Tinye akwụkwọ ịkụzi",
      state: {
        empty: {
          headline: "Bido njem HenryCo Learn gị.",
          blurb: "Chọgharịa katalọgụ, debanye aha na kọsụ, ma ihe ọmụmụ, ule na asambodo ọ bụla ga-emekọrịta n’ọnụ ụlọ a na-akpaghị aka.",
        },
        active: {
          headlineTemplateSingular: "Kọsụ {count} na-aga n’ihu.",
          headlineTemplatePlural: "Kọsụ {count} na-aga n’ihu.",
          blurb: "Bido ebe ị kwụsịrị — ihe ọmụmụ, ule, asambodo na ọzụzụ enyere niile na-emekọrịta site na HenryCo Learn n’ọnụ ụlọ a.",
        },
        calm: {
          headlineTemplateSingular: "Kọsụ {count} emechara.",
          headlineTemplatePlural: "Kọsụ {count} emechara.",
          blurb: "Asambodo gị na akụkọ mmụta ga-anọ ebe a, bara uru maka CV, akụkọ ime ụlọ, ma ọ bụ ndekọ nke gị.",
        },
      },
    },
    sections: {
      coursesTitle: "Gaa n’ihu n’ịmụta",
      coursesMetaEmpty: "Chọgharịa katalọgụ HenryCo Learn ka idebanye aha na kọsụ mbụ gị.",
      coursesMetaTemplate: "{active} na-arụ ọrụ · {completed} emechara",
      extrasTitle: "Asambodo, ọzụzụ enyere na nkuzi",
      extrasMeta: "Asambodo, ọzụzụ enyere, kọsụ edobere na arịrịọ onye nkuzi bi ebe a.",
      activityTitle: "Ọrụ na-adịbeghị anya",
      activityMetaTemplateSingular: "Mmelite {count} · nke kacha ọhụrụ na mbụ",
      activityMetaTemplatePlural: "Mmelite {count} · nke kacha ọhụrụ na mbụ",
      activityMetaEmpty: "Ihe ọmụmụ, ule, asambodo na ịkwụ ụgwọ na-egosi ebe a ozugbo ha mere.",
    },
    empty: {
      coursesTitle: "Enwebeghị kọsụ ejikọrọ",
      coursesBody: "Chọgharịa katalọgụ na HenryCo Learn ma debanye aha. Ọnọdụ gị ga-egosi ebe a na-akpaghị aka.",
      activityTitle: "Enwebeghị ọrụ Learn",
      activityBody: "Ọganihu kọsụ, nsonaazụ ule, inye asambodo na akwụkwọ ego ịkwụ ụgwọ na-egosi ebe a ozugbo ha mere.",
    },
    courses: {
      ariaLabel: "Kọsụ",
      completedAtTemplate: "Emechara na {date}",
      progressPercentTemplate: "{percent}% emechara",
      statusDelimiter: " · ",
    },
    extras: {
      ariaLabel: "Mgbakwunye Learn",
      certificatesTitle: "Asambodo",
      assignmentsTitle: "Mmụta enyere",
      savedTitle: "Kọsụ edobere",
      teachingTitle: "Kụzie ya HenryCo",
      statusLabel: "Ọnọdụ",
      expertiseLabel: "Ọkachamara",
      topicsLabel: "Isiokwu",
      openApplicationCta: "Mepee arịrịọ",
      applyToTeachCta: "Tinye akwụkwọ ịkụzi",
      teachingEmpty: "Anyị na-enyocha arịrịọ ndị nkuzi n’aka. Tinye akwụkwọ na HenryCo Learn ma ọnọdụ ga-emekọrịta laghachi ebe a.",
    },
    activity: {
      ariaLabel: "Ọrụ Learn",
      fallbackTitle: "Ọrụ Learn",
    },
  },
  divisionLogistics: {
    metadata: {
      title: "Mbufe · nbubata na nzipu",
      description: "Mbubata, nnyefe, ETA na ihe akaebe nnyefe ọ bụla nke HenryCo Logistics ejikọtara na akaụntụ a — egosi site na netwọkụ mbufe n’ime otu ụlọ dị jụụ.",
    },
    hero: {
      ariaLabel: "Nlebanya mbufe",
      eyebrow: "HenryCo Mbufe",
      brand: "HenryCo Mbufe",
      title: "Akpa ọ bụla, otu ụlọ.",
      body: "Nbubata, nnyefe, ETA na ihe akaebe nnyefe — niile ka egosi site na netwọkụ mbufe n’ime akaụntụ gị. Debe otu ugboro na",
      bodyDomain: " logistics.henrycogroup.com",
      ctaNewDelivery: "Nnyefe ọhụrụ",
    },
    metrics: {
      ariaLabel: "Arụmọrụ mbufe",
      activeNowLabel: "Na-arụ ọrụ ugbu a",
      activeFootSingular: "nzipu nọ n’ụzọ",
      activeFootPlural: "nzipu nọ n’ụzọ",
      deliveredMonthLabel: "Enyefere · n’ọnwa a",
      deliveredMonthFootTemplate: "{count} na mkpokọta",
      onTimeRateLabel: "Ọnụ ọgụgụ oge",
      onTimeRateFootEmpty: "Na-eche nnyefe mbụ ahaziri",
      onTimeRateFootHasValue: "Nke nnyefe ndị ahaziri",
      totalSpendLabel: "Mmefu mkpokọta",
      totalSpendFoot: "Akwụrụ ndụ niile",
    },
    map: {
      noShipmentsAriaLabel: "Enwebeghị nzipu",
      noShipmentsTitle: "Maapụ gị ga-amaliwe oge i debere nnyefe mbụ",
      noShipmentsBody: "Mbubata na nnyefe ọ bụla na-arụ ọrụ na-edenye ebe a na-akpaghị aka. Debe otu ugboro ma nzipu gị ga-egosi site na saịtị mbufe.",
      noShipmentsCta: "Debe nnyefe",
      pendingAriaLabel: "Nlepụta maapụ",
      pendingTitle: "Ngụlite mpaghara na-aga",
      pendingBody: "Nzipu gị na-arụ ọrụ ga-edenye na maapụ ozugbo ndị dispatch gụchara adres mbubata na nnyefe.",
      activeAriaLabel: "Maapụ nzipu na-arụ ọrụ",
      altTemplateSingular: "Maapụ na-egosi {count} mkpado mbubata na nnyefe na-arụ ọrụ",
      altTemplatePlural: "Maapụ na-egosi {count} mkpado mbubata na nnyefe na-arụ ọrụ",
      liveBadgeTemplateSingular: "Ndụ · {count} nzipu na-arụ ọrụ",
      liveBadgeTemplatePlural: "Ndụ · {count} nzipu na-arụ ọrụ",
    },
    sections: {
      activeTitle: "Nọ n’ụzọ ugbu a",
      activeMetaTemplate: "{count} na-arụ ọrụ · mmekọrịta na-emezi onwe site na mbufe",
      activeRailAriaLabel: "Nzipu na-arụ ọrụ",
      emptyAriaLabel: "Enweghị nzipu na-arụ ọrụ",
      emptyTitle: "Enweghị nzipu na-arụ ọrụ",
      emptyBody: "Nnyefe gara aga gị dị n’okpuru. Debe nke ọzọ ma ọ ga-apụta ebe a ozugbo onye na-ebu mbubata kwadoro.",
      actionsTitle: "Bido nnyefe",
      actionsMeta: "Mkpụrụokwu nke usoro a na-emekarị",
      actionsAriaLabel: "Omume ngwa ngwa mbufe",
      recentTitle: "Enyefere na nso nso a",
      recentMetaTemplate: "Ikpeazụ {recent} site na {lifetime} mkpokọta",
      recentAriaLabel: "Nnyefe nso nso a",
      spendTitle: "Mmefu · ọnwa 6 gara aga",
      spendMeta: "Akwụrụ naanị",
      spendFigureAriaLabelTemplate: "Mmefu mbufe n’ime ọnwa 6 gara aga",
    },
    statusLabels: {
      quoteRequested: "Akwụkwọ ọnụ ahịa na-eche",
      quoteSent: "Akwụkwọ ọnụ ahịa dị njikere",
      pendingPayment: "Na-eche ụgwọ",
      scheduled: "Ahaziri",
      assigned: "Enyere onye nzipu",
      pickupConfirmed: "Ebubata",
      inTransit: "Nọ n’ụzọ",
      delayed: "Egbu oge",
      attemptedDelivery: "Anwara inye",
      delivered: "Enyefere",
      completed: "Emechara",
      closed: "Mechiri",
      cancelled: "Kagburu",
      refunded: "Akwụghachiri",
    },
    urgencyLabels: {
      standard: "Nke ọkọlọtọ",
      sameDay: "Otu ụbọchị",
      express: "Ngwa ngwa",
      nextDay: "Echi",
    },
    serviceLabels: {
      scheduled: "Ahaziri",
      sameDay: "Otu ụbọchị",
      interCity: "N’etiti obodo",
      bulk: "Buru ibu",
    },
    shipment: {
      trackingCodeAriaTemplate: "Koodu nleba {code}",
      addressPending: "Adres na-eche",
      etaPending: "ETA na-eche",
      trackCta: "Soro nzipu",
      openTrackingAriaTemplate: "Mepee nleba maka {code}",
      etaAriaTemplate: "ETA {eta}",
      etaMinutesInTemplate: "n’ime nkeji {minutes}",
      etaMinutesOverdueTemplate: "nkeji {minutes} gafere oge",
      etaHoursInTemplate: "n’ime awa {hours}",
      etaHoursOverdueTemplate: "awa {hours} gafere oge",
      detailSeparator: " · ",
    },
    timeline: {
      ariaLabel: "Nnyefe nso nso a",
      deliveredToTemplate: "Enyefere {name}",
      receiptCta: "Nnata ego",
    },
    quickActions: {
      ariaLabel: "Omume ngwa ngwa mbufe",
      bookLabel: "Debe nnyefe",
      bookDesc: "Mbubata na nnyefe n’otu usoro nduzi.",
      trackLabel: "Soro site na koodu",
      trackDesc: "Ọnọdụ ndụ, ETA na ọnọdụ onye nzipu.",
      quoteLabel: "Buru ụzọ rịọ ọnụ ahịa",
      quoteDesc: "Ọnụ ahịa ngosipụta tupu i kwadoo.",
      addressesLabel: "Adres echekwara",
      addressesDesc: "Kọntaktị mbubata na nnyefe.",
      invoicesLabel: "Nnata ego na akwụkwọ ụgwọ",
      invoicesDesc: "PDF nke brand maka nzipu ọ bụla.",
      supportLabel: "Nkwado mbufe",
      supportDesc: "Mepee eserese ejikọrọ na akaụntụ gị.",
    },
    spend: {
      figureAriaLabel: "Mmefu mbufe n’ime ọnwa 6 gara aga",
      emptyTick: "—",
    },
  },

  divisionStudio: {
    metadata: {
      title: "Studio · ọnụ ụlọ ọrụ",
      description: "Soro ọrụ Studio HenryCo ọ bụla ejikọtara na akaụntụ a — atụmatụ, isi ihe, ụgwọ, akụrụngwa nweere, na ọrụ na otu ụlọ.",
    },
    hero: {
      eyebrowLive: "Studio · ndị bi",
      overviewAriaLabel: "Nlebanya Studio",
      activityAriaLabel: "Ọrụ Studio",
      sideAriaLabel: "Otu ụlọ a si arụ ọrụ",
      sideLabel: "Otu ụlọ a si arụ ọrụ",
      sideTitle: "Otu ụlọ ọrụ, ọnọdụ ezi okwu.",
      sideBody: "Atụmatụ, isi ihe, akwụkwọ akaebe ụgwọ, akụrụngwa nweere na ngosipụta nkwekọrịta na-anọgide ejikọtara na njirimara HenryCo ahụ ị na-eji n’ebe ọ bụla. Dashboard dị n’okpuru na-egosi ihe ndị otu Studio na-eme n’ezie, ọ bụghị ndepụta ọnọdụ.",
      breakdownAriaLabel: "Nkewa ọrụ",
      breakdownLabel: "Site n’ọnọdụ",
      tiles: {
        activeLabel: "Ọrụ ndị na-arụ",
        activeFootEmpty: "Onweghi ụlọ ọrụ na-arụ ugbu a",
        activeFootHasValue: "Ụlọ na-arụ na njem mbufe",
        pendingLabel: "Ụgwọ na-echere",
        pendingFootEmpty: "Ụzọ azụmaahịa edoziri",
        pendingFootHasValue: "Isi ihe azụmaahịa ka mepere",
        proofLabel: "Akaebe nyefere",
        proofFootEmpty: "Ọ dịghị ihe na-echere nyochaa",
        proofFootHasValue: "Ụgwọ ndị na-echere nyochaa Studio",
        deliverablesLabel: "Ihe nweere",
        deliverablesFootEmpty: "Faịlụ na-egosipụta ebe a mgbe Studio bulitere",
        deliverablesFootHasValue: "Faịlụ na mmepụta ana-elekọta n’otu ebe",
      },
      breakdown: {
        active: "Na-arụ",
        readyReview: "Njikere maka nyocha",
        pendingPayment: "Ụgwọ na-echere",
        proofSubmitted: "Akaebe nyefere",
      },
      state: {
        empty: {
          headline: "Bido brief Studio.",
          blurb: "Mgbe atụmatụ ma ọ bụ ọrụ malitere site na njirimara HenryCo gị, ụlọ Studio ahụ ejikọtara ga-apụta ebe a — isi ihe, ụgwọ, akụrụngwa na nzọụkwụ ọzọ na otu ebe.",
          ctaPrimary: "Bido brief",
          ctaSecondary: "Mepee Studio",
        },
        attention: {
          headlineTemplateSingular: "{count} ụgwọ gafere oge.",
          headlineTemplatePlural: "{count} ụgwọ gafere oge.",
          blurb: "Otu isi ihe ụgwọ gafere oge ya. Mepee ụlọ ọrụ ibu akaebe ma ọ bụ kpọtụrụ ndị otu Studio.",
          ctaPrimary: "Mepee ụgwọ",
          ctaSecondary: "Mepee Studio",
        },
        activeReady: {
          headlineTemplateSingular: "{count} ọrụ dị njikere maka nyocha.",
          headlineTemplatePlural: "{count} ọrụ dị njikere maka nyocha.",
          blurb: "Ihe nweere na ndegharị na-echere nkwado gị. Mepee ụlọ ọrụ ka ị nyochaa wee mepee isi ihe ọzọ.",
          ctaPrimary: "Mepee ọrụ",
          ctaSecondary: "Mepee Studio",
        },
        activeProjects: {
          headlineTemplateSingular: "{count} ọrụ na-arụ.",
          headlineTemplatePlural: "{count} ọrụ na-arụ.",
          blurb: "Ụlọ ọrụ ndị na-arụ na njem isi ihe, isi ihe ụgwọ, na ihe nweere — niile site na HenryCo Studio na-egosi n’ụlọ a.",
          ctaPrimary: "Mepee Studio",
          ctaSecondary: "Bido brief ọhụrụ",
        },
        calm: {
          headlineTemplateSingular: "{count} ụlọ ọrụ edenyere.",
          headlineTemplatePlural: "{count} ụlọ ọrụ edenyere.",
          blurb: "Ọrụ Studio ọ bụla ị bidoroworo — atụmatụ, isi ihe, ụgwọ, akụrụngwa — debere n’otu ụlọ maka nsochi ngwa ngwa.",
          ctaPrimary: "Mepee Studio",
          ctaSecondary: "Bido brief ọhụrụ",
        },
      },
    },
    sections: {
      projectsTitle: "Ụlọ ọrụ",
      projectsAriaLabel: "Ọrụ Studio",
      projectsMetaEmpty: "Ụlọ ọrụ na-egosipụta ebe a mgbe ọrụ Studio malitere.",
      projectsMetaTemplateSingular: "{count} ọrụ · adọtara site na njem ọhụrụ",
      projectsMetaTemplatePlural: "{count} ọrụ · adọtara site na njem ọhụrụ",
      paymentsTitle: "Isi ihe ụgwọ",
      paymentsAriaLabel: "Ụgwọ Studio",
      paymentsMetaEmpty: "Arịrịọ ụgwọ Studio na-egosipụta ebe a mgbe atụmatụ ma ọ bụ ọrụ malitere.",
      paymentsMetaTemplateSingular: "{count} isi ihe · mbutere akaebe na ọnọdụ nkwado",
      paymentsMetaTemplatePlural: "{count} isi ihe · mbutere akaebe na ọnọdụ nkwado",
      activityTitle: "Ọrụ na-adịbeghị anya",
      activityAriaLabel: "Ọrụ Studio",
      activityMetaEmpty: "Mmelite ọrụ, akaebe ụgwọ na nkwado isi ihe na-egosipụta ebe a.",
      activityMetaTemplateSingular: "{count} mmelite · ọhụrụ ọkachasị buru ụzọ",
      activityMetaTemplatePlural: "{count} mmelite · ọhụrụ ọkachasị buru ụzọ",
    },
    empty: {
      projectsTitle: "Onweghi ụlọ Studio ejikọtara",
      projectsBody: "Mgbe e mepụtara atụmatụ ma ọ bụ ọrụ site na njirimara HenryCo gị, ụlọ Studio ejikọtara ga-apụta ebe a — isi ihe, ụgwọ, akụrụngwa na nzọụkwụ ọzọ.",
      paymentsTitle: "Onweghi isi ihe ụgwọ",
      paymentsBody: "Isi ihe azụmaahịa — ego nkwụnye, ọkara ọrụ, na nnyefe — na-apụta ebe a mgbe atụmatụ malitere ya na gị.",
      activityTitle: "Onweghi ọrụ Studio",
      activityBody: "Mmelite ọrụ, akaebe ụgwọ, mwepụta akụrụngwa na nkwado isi ihe ga-apụta ebe a ka ha na-eme.",
    },
    projects: {
      listAriaLabel: "Ọrụ Studio",
      fallbackSubtitle: "Studio na-akwado mmelite ọzọ.",
      milestonesTemplate: "{approved}/{total} isi ihe",
      paymentsTemplateSingular: "{count} ụgwọ mepere",
      paymentsTemplatePlural: "{count} ụgwọ mepere",
      deliverablesTemplateSingular: "{count} ihe nweere",
      deliverablesTemplatePlural: "{count} ihe nweere",
      updatedTemplate: "Emelitere {stamp}",
      rowAriaLabelTemplate: "{title} · {kind}",
      fallbackStamp: "—",
    },
    projectKindLabels: {
      live: "Na-arụ",
      ready_review: "Njikere maka nyocha",
      scheduled: "Atụmatụrụ",
      delivered: "Enyefere",
      issue: "Achọrọ omume",
    },
    payments: {
      listAriaLabel: "Ụgwọ Studio",
      rowAriaLabelTemplate: "{label} · {status}",
      dueTemplate: "Ga-akwụ {stamp}",
      updatedTemplate: "Emelitere {stamp}",
      subTemplate: "{amount} · {method} · {due}",
    },
    paymentStatusLabels: {
      pending: "na-echere",
      paid: "akwụrụ",
      approved: "akwadoro",
      settled: "edoziri",
      proof_uploaded: "akaebe ebuliri",
      proof_submitted: "akaebe nyefere",
      in_review: "na nyocha",
      rejected: "ajụrụ",
      overdue: "gafere oge",
      failed: "dara",
      pending_deposit: "ego nkwụnye na-echere",
    },
    activity: {
      listAriaLabel: "Ọrụ Studio",
      rowAriaLabelTemplate: "{title} · {stamp}",
    },
  },
  settings: {
    pageTitle: "Ntọala na Mmasị",
    pageDescription:
      "Jikwaa profaịlụ gị, mmasị nkwurịta okwu, njikwa nzuzo, na ụzọ arịrịọ data aka.",
    profileSectionKicker: "Ozi Profaịlụ",
    notificationsSectionKicker: "Mmasị Ọkwa",
  },
  addresses: {
    metadata: {
      title: "Adreesị",
      description:
        "Jikwaa adreesị ndị i chekwara (ụlọ, ụlọ ọrụ, ụlọ ahịa…) — eji ya na nbubata, ndoputa, na nyocha KYC.",
    },
    hero: {
      title: "Adreesị",
      description:
        "Jikwaa adreesị ndị i chekwara (ụlọ, ụlọ ọrụ, ụlọ ahịa…) — eji ya na nbubata, ndoputa, na nyocha KYC.",
    },
    card: {
      defaultBadge: "Ndabara",
      kycVerifiedBadge: "KYC enyochara",
      setDefaultCta: "Mee ka ọ bụrụ ndabara",
      editCta: "Dezie",
      deleteCta: "Hichapụ",
    },
    deleteConfirm: {
      prompt: "Hichapụ adreesị a? A pụghị ime ka ọ laghachi.",
      confirmCta: "Hichapụ",
      cancelCta: "Kagbuo",
    },
    empty: {
      body:
        "I tinyebeghị adreesị ọ bụla. Tinye nke mbụ gị ka i nwee mmechi ngwa ngwa na HenryCo.",
    },
    add: {
      cta: "Tinye adreesị",
      formTitle: "Tinye adreesị ọhụrụ",
      editFormTitleTemplate: "Dezie {label}",
      maxedNoticeTemplate:
        "I tinyego ụdị adreesị {count} kacha (ụlọ, ụlọ ọrụ, ụlọ ahịa, ụlọ nchekwa, ọzọ 1, ọzọ 2). Dezie ma ọ bụ hichapụ otu iji tinye adreesị ọzọ.",
    },
  },
  search: {
    metadata: {
      title: "Chọọ Akaụntụ",
      description: "Chọọ ọrụ akaụntụ HenryCo na ụzọ ngalaba ejikọtara.",
    },
    hero: {
      title: "Chọọ ọrụ HenryCo gị.",
      description:
        "Gaa ozugbo na omume akaụntụ kpọmkwem na ụzọ ngalaba ejikọtara, na-elaghachighị na dashboard izugbe.",
    },
    placeholder: "Chọọ akaụntụ: ọkwa, akpa ego, ụgwọ, nkwado, ngwa Jobs...",
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
    smartHomeEmptyFallback:
      "Káàbọ̀ — bẹ̀rẹ̀ pẹ̀lú ìgbésẹ̀ kékeré àkọ́kọ́. Àwọn àmì ìfìhàn rẹ̀ tààrà yóò farahàn níbí gan-an tí iṣẹ́ kankan bá wáyé.",
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
    priorityFallback: {
      low: "Ẹdàkun",
      normal: "Ṣe déédéé",
      high: "Gíga",
      urgent: "Kiakia",
    },
    eyebrow: "Ila iṣe · ààyè gangan",
    guidanceTitle: "Ila kan, gbogbo ìpín.",
    overviewAria: "Àwòkọ àwọn iṣẹ",
    volumeAria: "Iwọn iṣẹ",
    pendingAria: "Iṣẹ tó ṣẹ́kù",
    sideAria: "Bí ila náà ṣe ń ṣiṣẹ́",
    bySource: "Nípa orísun",
    openTotalLabel: "Apapọ tó ṣí",
    nothingBlocking: "Kò sí ohunkóhun tó ń dí lọwọlọwọ",
    resolveBlockers: "Yanjú láti ṣí àwọn ọ̀nà mìíràn",
    routine: "déédéé",
    divisionRepresentedSingular: "{count} ìpín tí ó dúró",
    divisionRepresentedPlural: "{count} àwọn ìpín tí wọ́n dúró",
    headlineEmpty: "Kò sí ohunkóhun ní ila.",
    headlineBlockerSingular: "{count} ìdíwọ́ láti yanjú.",
    headlineBlockerPlural: "{count} àwọn ìdíwọ́ láti yanjú.",
    headlineUrgentSingular: "{count} iṣẹ́ kíákíá láti parí.",
    headlineUrgentPlural: "{count} àwọn iṣẹ́ kíákíá láti parí.",
    headlineActiveSingular: "{count} iṣẹ́ láti ṣe.",
    headlineActivePlural: "{count} àwọn iṣẹ́ láti ṣe.",
    headlineCalmSingular: "{count} nkan ní ila rẹ.",
    headlineCalmPlural: "{count} àwọn nkan ní ila rẹ.",
    blurbEmpty: "Akọọlẹ rẹ wà nínú ètò — ìjẹ́rìí, ìsanwó, àti àwọn ọ̀nà tó ṣe pàtàkì fún àyẹ̀wò ti yá. A óò fi iṣẹ́ tó ń bọ̀ hàn níbí ní ara rẹ̀ ní gbàrà tó bá hàn.",
    blurbRisk: "Àwọn nkan wọ̀nyí ń dí àwọn iṣẹ́ tó ní ìgbẹ́kẹ̀lé gíga ní HenryCo — ìyọrí láti inú àpamọ́, ìfọwọ́sí olùtà Marketplace, ìjẹ́rìí agbanisíṣẹ́. Yíyanjú wọn ń ṣí ọ̀nà kọ̀ọ̀kan.",
    blurbActive: "Ila kọ̀ọ̀kan ń darí rẹ sí iṣẹ́ tó ń bọ̀ pẹ̀lú àfọwọ́kàn kan. Àwọn àyàn, àmì pàtàkì, àti àwọn ọ̀nà yíyára ó dúró bákan náà ní gbogbo ìpín HenryCo.",
    metaEmpty: "O ti yá. Ohunkóhun tuntun yóò hàn níbí ní gbàrà tó bá dé.",
    metaCount: "{count} ṣí · tí a tò sí ìbámu pàtàkì àti ipò ìdíwọ́.",
  },
  security: {
    title: "Aabo",
    description: "Ṣayẹwo iṣẹ aabo aipẹ, yi ọrọ igbaniwọle rẹ pada, ki o si pari awọn igba HenryCo nigbati o ba nilo.",
    heroAriaLabel: "Àwòkọ aabo",
    hero: {
      trustScoreLabel: "Ikun igbẹkẹle",
      nextTierPrefix: "Tó ń bọ̀ ·",
      nextTierAriaTemplate: "Ipele tó ń bọ̀ {tier}",
      accountActiveSingularTemplate: "Akọọlẹ ti n ṣiṣẹ́ fún ọjọ́ {days}",
      accountActivePluralTemplate: "Akọọlẹ ti n ṣiṣẹ́ fún ọjọ́ {days}",
      flaggedEventsSingularTemplate: "{count} ìṣẹ̀lẹ̀ tí a fi àmì sí nínú àkọsílẹ̀ · ṣàyẹ̀wò ní ìsàlẹ̀",
      flaggedEventsPluralTemplate: "{count} àwọn ìṣẹ̀lẹ̀ tí a fi àmì sí nínú àkọsílẹ̀ · ṣàyẹ̀wò ní ìsàlẹ̀",
      statusEyebrow: {
        secure: "Aabo àti àyè · nílò ààbò",
        watch: "Aabo àti àyè · iṣẹ́ tó dára láti ṣe",
        risk: "Aabo àti àyè · ewu tí a fi àmì sí",
      },
      statusHeadline: {
        secure: "Akọọlẹ rẹ wà ní ààbò.",
        watch: "Àwọn ìṣe díẹ̀ yóò mú akọọlẹ rẹ lágbára.",
        risk: "A ti fi àmì sí iṣẹ́ tó nílò ìtọ́jú rẹ.",
      },
      statusBlurb: {
        secure: "Kò sí ìṣẹ̀lẹ̀ tó sọ̀rọ̀, ìjẹ́rìí dára, àti gbogbo iṣẹ́ tó ní ìgbẹ́kẹ̀lé gíga ti HenryCo ṣí fún ọ.",
        watch: "Kò sí nkan tó bàjẹ́ — ṣùgbọ́n àwọn àmì díẹ̀ (ìfọwọ́sí imeeli, àtúnyẹ̀wò ìdánimọ̀, àwọn olùbáṣèpọ̀ tó pẹ̀ wọn) yóò mú ikun ìgbẹ́kẹ̀lé rẹ pọ̀ sí i kí ó sì ṣí àwọn ọ̀nà mìíràn.",
        risk: "Àwọn ìṣẹ̀lẹ̀ àìpẹ́ ni a ti kà gẹ́gẹ́ bí ewu gíga. Ṣàyẹ̀wò ìṣàn iṣẹ́ ní ìsàlẹ̀ kí o sì yí ọ̀rọ̀ ìgbaniwọlé rẹ padà tí ohunkóhun bá rí àjèjì.",
      },
    },
    signalsTitle: "Àmì",
    signalsMeta: "Ohun tí àwọn ẹrọ ìjẹ́rìí àti ìmọ̀ wa rí lórí akọọlẹ rẹ lọ́wọ́lọ́wọ́.",
    signalsAriaLabel: "Àwọn àmì aabo",
    guideTitle: "Ibi tí o wà · ohun tó ń tì ọ́ síwájú",
    guideMetaTemplate: "Ikun olótítọ́, kì í ṣe nọ́mbà títà. {tier}.",
    allLanesOpen: "Gbogbo ọ̀nà ti ṣí",
    accountActionsTitle: "Àwọn iṣẹ́ akọọlẹ",
    accountActionsMeta: "Àwọn ìṣàkóso lọ́jọ́jọ́ tí o ní ní ara rẹ.",
    changePasswordTitle: "Yí ọrọ ìgbaniwọlé rẹ padà",
    signOutEverywhereTitle: "Jáde kúrò níbi gbogbo",
    suspiciousEventFoot: "Ṣàyẹ̀wò ìṣàn iṣẹ́ ní ìsàlẹ̀.",
    noSuspiciousEventFoot: "Kò sí ohun tí a fi àmì sí nínú àkókò àyẹ̀wò tó kọjá.",
    activityAriaLabel: "Àwọn ìṣẹ̀lẹ̀ aabo àìpẹ́",
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
  messages: {
    metadata: {
      title: "Àwọn ìránṣẹ́ · HenryCo",
      description:
        "Àpótí ìránṣẹ́ kan ṣoṣo fún ìrànlọ́wọ́, ọjà, iṣẹ́, studio, ìtọ́jú, ohun-ìní, ìfijíṣẹ́ àti ẹ̀kọ́.",
    },
    hero: {
      eyebrow: "HenryCo · àpótí ìránṣẹ́ ìṣọ̀kan",
      ariaLabel: "Àkópọ̀ àpótí ìránṣẹ́",
      ariaTiles: "Ìwọ̀n àpótí ìránṣẹ́",
      ariaSide: "Nípasẹ̀ pọ́tà",
      sideLabel: "Nípasẹ̀ pọ́tà",
      sideBody:
        "Pọ́tà kọ̀ọ̀kan ń jẹ àpótí ìránṣẹ́ kan ṣoṣo yìí. Ìrànlọ́wọ́, àṣẹ ọjà, ìfọ̀rọ̀wánilẹ́nuwò iṣẹ́, àwọn iṣẹ́ studio àti àwọn ìpàdé ìtọ́jú gbogbo wọn fara hàn níbí lẹ́ẹ́sẹ̀ akoko.",
    },
    headlines: {
      zero: "Àpótí ìránṣẹ́ ti ṣofo kárí HenryCo.",
      calmOne: "Òkun kan ń dúró dè ọ́.",
      calmMany: "Òkun {count} ti ṣí.",
      busy: "{unread} àìkàrí · {open} ti ṣí kárí àwọn pọ́tà rẹ.",
      overloaded: "{unread} àìkàrí láàrín òkun {open} tí ó ṣí.",
    },
    blurbs: {
      zero: "Gbogbo nǹkan ti gba ní ìrànlọ́wọ́, ọjà, iṣẹ́, studio, ìtọ́jú, ohun-ìní, ìfijíṣẹ́ àti ẹ̀kọ́.",
      calm: "Ìdáhùn ṣókí báyìí máa pa àlọ́ dé kí ọjọ́ ọ̀la tó dé.",
      busy: "Tẹ ìlà kan láti ṣí òkun náà, tàbí ṣe ìyàsọ́tọ̀ sí pọ́tà kan lẹ́ẹ̀kan.",
      overloaded: "Gba àwọn ìpín kọ̀ọ̀kan — òkun tuntun ní òkè.",
    },
    tiles: {
      openLabel: "Ti ṣí",
      openFootEmpty: "Kò sí ohun tó ń lọ",
      openFootActive: "Òkun ń dúró fún ìṣe",
      unreadLabel: "Àìkàrí",
      unreadFootEmpty: "Àpótí ìránṣẹ́ ti pé",
      unreadFootActive: "Tẹ ìlà kan láti ṣí òkun náà",
      portalsLabel: "Pọ́tà",
      portalsFootEmpty: "Ìtọ́jú, Ọjà, Studio, Iṣẹ́ àti àwọn mìíràn",
      portalsFootSingular: "Ìpín kan ń ṣiṣẹ́",
      portalsFootPlural: "Àwọn ìpín {count} ti sọ̀rọ̀",
    },
    sideTitle: {
      empty: "Idakẹjẹ kárí gbogbo ìpín",
      singular: "Ìpín kan ní ìjabọ̀",
      plural: "Àwọn ìpín {count} ń bùkún",
    },
    section: {
      title: "Àwọn òkun",
      ariaLabel: "Òkun àpótí ìránṣẹ́",
      metaEmpty: "Kò sí ohun tí ó wà síbẹ̀ — gbogbo pọ́tà ń jẹ àpótí ìránṣẹ́ yìí",
      metaSingular: "Òkun {count}",
      metaPlural: "Òkun {count}",
    },
    chips: {
      ariaLabel: "Ṣe ìyàsọ́tọ̀ àpótí ìránṣẹ́ nípasẹ̀ pọ́tà",
      allThreads: "Gbogbo òkun",
    },
    empty: {
      eyebrow: "Àpótí ìránṣẹ́ jẹ́",
      titleAll: "Kò sí ohun tó ń dúró dè ọ́.",
      titleFilter: "Kò sí òkun ní pọ́tà yìí síbẹ̀.",
      bodyAll:
        "Ìrànlọ́wọ́, ọjà, iṣẹ́, studio, ìtọ́jú, ohun-ìní, ìfijíṣẹ́ àti ẹ̀kọ́ gbogbo fara hàn níbí — ohunkóhun tí ó ré-pọ́tà yóò dé sí àkójọ yìí kíákíá tí ó bá bẹ̀rẹ̀.",
      bodyFilter:
        "Ṣe ìyípadà àwọn chìpù ìyàsọ́tọ̀ láti rí pọ́tà mìíràn, tàbí ṣàwárí gbogbo òkun láti rí dájú pé kò sí ohun tó dúró.",
    },
    list: {
      unreadDotLabel: "Àìkàrí",
      fallbackTime: "—",
    },
    divisionLabels: {
      support: "Ìrànlọ́wọ́",
      marketplace: "Ọjà",
      jobs: "Iṣẹ́",
      studio: "Studio",
      care: "Ìtọ́jú",
      property: "Ohun-ìní",
      logistics: "Ìfijíṣẹ́",
      learn: "Ẹ̀kọ́",
    },
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
  support: {
    metadata: {
      title: "Ìrànlọ́wọ́",
      description: "Gba ìrànlọ́wọ́ pẹ̀lú iṣẹ́ HenryCo èyíkéyìí.",
    },
    hero: {
      title: "Ìrànlọ́wọ́",
      description: "Gba ìrànlọ́wọ́ pẹ̀lú iṣẹ́ HenryCo èyíkéyìí.",
      newRequestCta: "Ìbéèrè tuntun",
    },
    summary: {
      openRequestsTemplate: "Ìbéèrè {count} tó ṣí",
      escalatedTemplate: "{count} tó gòkè",
      escalationNote:
        "A ń ṣe àkọsílẹ̀ gbogbo ìròyìn. Bí àyẹ̀wò bá rí ewu tàbí kíákíá, àwọn òṣìṣẹ́ ma gba àtòjọ pẹ̀lú ìpilẹ̀ ní àìfọwọ́yi.",
    },
    quickHelp: {
      helpCenterLabel: "Ilé Ìrànlọ́wọ́",
      helpCenterDesc: "Ṣe àyẹ̀wò ìbéèrè àti ìtọ́nisọ́nà",
      contactLabel: "Kàn sí Wa",
      contactDesc: "Ìrànlọ́wọ́ nípa ìmẹ́lì tàbí tẹlifóònù",
      liveChatLabel: "Ìjọ̀rọ̀ Bíi Ìgbà Yìí",
      liveChatDesc: "Bá ẹgbẹ́ wa sọ̀rọ̀",
    },
    threads: {
      sectionKicker: "Àwọn ìbéèrè rẹ",
      emptyTitle: "Kò sí ìbéèrè ìrànlọ́wọ́",
      emptyDescription:
        "O kò tíì dá ìbéèrè ìrànlọ́wọ́ kankan. A wà níbí láti ràn ọ́ lọ́wọ́ bí o bá nílò ohunkóhun.",
      createCta: "Dá ìbéèrè sílẹ̀",
    },
    statusLabels: {
      open: "Ṣíi",
      awaitingReply: "Ń dúró ìdáhùn",
      inProgress: "Ń lọ lọ́wọ́",
      resolved: "Tí yanjú",
      closed: "Tí pa",
    },
    priorityLabels: {
      low: "Kéréje",
      normal: "Déédéé",
      high: "Gíga",
      urgent: "Kíákíá",
    },
  },
  payments: {
    hero: {
      title: "Àwọn ọ̀nà ìsanwó",
      description: "Ṣàkóso àwọn àṣàyàn ìsanwó tí o tọ́jú fún ìsanwó yára.",
      addMethodCta: "Ṣàfikún ọ̀nà",
    },
    empty: {
      title: "Kò sí ọ̀nà ìsanwó",
      description:
        "Ṣàfikún káàdì débítì, àkáǹtì báńkì, tàbí ọ̀nà ìsanwó míràn fún ìsanwó yára kọjá gbogbo iṣẹ́ HenryCo.",
      cta: "Ṣàfikún ọ̀nà ìsanwó",
    },
    card: {
      savedMethodFallback: "Ọ̀nà tí a tọ́jú",
      cardLastFourTemplate: "•••• {last4}",
    },
    wallet: {
      eyebrow: "Àpamọ́wọ́ HenryCo",
      body: "Àpamọ́wọ́ HenryCo rẹ wà nígbà gbogbo gẹ́gẹ́ bí àṣàyàn ìsanwó.",
      manageCta: "Ṣàkóso àpamọ́wọ́",
    },
  },
  savedItems: {
    metadata: {
      title: "Ohun tí a tọ́jú",
      description:
        "Àwọn ohun tí o yà sọ́tọ̀ kúrò nínú apò ọjà HenryCo èyíkéyìí, a máa tọ́jú wọn fún ọjọ́ àádọ́rùnún (90) pẹ̀lú ìmọ̀ràn ọ̀sẹ̀ kan ṣáájú parí.",
    },
    hero: {
      title: "Tọ́jú fún àkókò mìíràn",
      description:
        "Àwọn ohun tí o yà sọ́tọ̀ kúrò nínú apò ọjà HenryCo èyíkéyìí. A máa tọ́jú wọn fún ọjọ́ àádọ́rùnún (90) tí a ó sì kìlọ̀ fún ọ ní ọ̀sẹ̀ kan kí wọ́n tó parí.",
    },
    summary: {
      activeTemplate: "{count} tó ń ṣiṣẹ́",
      expiredTemplate: "{count} tó ti parí",
      expiryNote:
        "Àwọn ohun náà ń parí ọjọ́ àádọ́rùnún (90) lẹ́yìn tí a bá tọ́jú wọn. A kìlọ̀ fún ọ ní ọ̀sẹ̀ kan ṣáájú.",
      savedTemplate: "{count} tí a tọ́jú",
    },
    toolbar: {
      showLabel: "Fihàn",
      allDivisions: "Gbogbo ìpín",
      sortLabel: "To",
      sortNewest: "Tuntun lákọ̀ọ́kọ́",
      sortOldest: "Àtijọ́ lákọ̀ọ́kọ́",
      sortExpiring: "Ó fẹ́rẹ̀ parí",
    },
    selection: {
      selectedTemplate: "{count} tí a yàn",
      clear: "Pa rẹ́",
      moving: "À ń kó…",
      moveSelectedToCart: "Gbé àwọn tí a yàn sí apò ọjà",
      selectAllOnPage: "Yan gbogbo lójú-ìwé",
    },
    empty: {
      title: "Kò sí ohun tí a tọ́jú síbẹ̀",
      description:
        "Nígbà tí o bá rí ohun tí o kò ṣetán láti rà, tọ́jú rẹ̀ kúrò nínú apò ọjà. A ó pa iye owó tí o rí mọ́, a ó sì kìlọ̀ fún ọ ní ọ̀sẹ̀ kan kí ó tó parí.",
      browseCta: "Wo",
    },
    card: {
      deselectItem: "Yọ ohun náà kúrò nínú àyẹ̀wò",
      selectItem: "Yan ohun náà",
      savedItemFallback: "Ohun tí a tọ́jú",
      expiresToday: "Ó parí lónìí",
      expiresInTemplate: "Ó parí ní ọjọ́ {days}{plural}",
      expiredNotice: "Ó ti parí — ìmúpadàbọ̀sípò ń tún àkókò ọjọ́ àádọ́rùnún ṣe",
      moveToCart: "Gbé sí apò ọjà",
      moving: "À ń kó…",
      removeFromSaved: "Yọ kúrò nínú ohun tí a tọ́jú",
      openOriginal: "Ṣí àkọ́sílẹ̀ ìpilẹ̀",
    },
    expired: {
      sectionKicker: "Tí parí láìpẹ́",
      sectionNote: "Ìmúpadàbọ̀sípò ń tún àkókò ọjọ́ àádọ́rùnún ṣe.",
    },
  },
  documents: {
    metadata: {
      title: "Àwọn Àkọsílẹ̀",
      description:
        "Àwọn risiisi rẹ, ìjẹ́rìí, àdéhùn àti fáìlì pàtàkì — a fi pamọ́ ní ìkọ̀kọ̀ tí ó sì wà fún ọ ní gbogbo ẹ̀ka HenryCo.",
    },
    hero: {
      eyebrow: "Àpótí ìpamọ́ ti ara ẹni",
      title: "Àwọn Àkọsílẹ̀",
      body: "Àwọn risiisi rẹ, ìjẹ́rìí, àdéhùn àti fáìlì pàtàkì.",
    },
    toolbar: {
      uploadCta: "Gbé àkọsílẹ̀ wọlé",
      filterLabel: "Yan",
      allCategories: "Gbogbo ẹ̀ka",
      sortLabel: "Tò",
      sortNewest: "Tuntun ní àkọ́kọ́",
      sortOldest: "Àtijọ́ ní àkọ́kọ́",
    },
    types: {
      document: "Àkọsílẹ̀",
      receipt: "Risiisi",
      certificate: "Ìjẹ́rìí",
      id_document: "Ìwé ìdánimọ̀",
      contract: "Àdéhùn",
      other: "Òmíràn",
    },
    categories: {
      all: "Gbogbo",
      document: "Àwọn Àkọsílẹ̀",
      receipt: "Àwọn Risiisi",
      certificate: "Àwọn Ìjẹ́rìí",
      id_document: "Àwọn ìwé ìdánimọ̀",
      contract: "Àwọn àdéhùn",
      other: "Àwọn òmíràn",
    },
    card: {
      uploadedOnTemplate: "A gbé wọlé ní {date}",
      sizeTemplate: "{size}",
      downloadLabel: "Gbà sílẹ̀",
      noFileAttached: "Kò sí fáìlì tí a fi kún",
      openOriginal: "Ṣí àkọsílẹ̀",
    },
    empty: {
      title: "Kò sí àkọsílẹ̀ síbẹ̀",
      description:
        "Àwọn àkọsílẹ̀ rẹ, risiisi àti ìjẹ́rìí láti ọ̀dọ̀ àwọn ìpèsè HenryCo ni a ó tọ́jú síbí.",
    },
    summary: {
      countTemplate: "{count} àkọsílẹ̀{plural}",
      filteredTemplate: "{count} nínú {total} tí a fi hàn",
    },
    retention: {
      eyebrow: "Ìkọ̀kọ̀ àti ìtọ́jú",
      title: "Fáìlì rẹ wà ní ìkọ̀kọ̀",
      body: "A fi àwọn àkọsílẹ̀ pamọ́ pẹ̀lú ààbò, ìwọ nìkan ló lè rí wọn, a ó sì tọ́jú wọn ní gbogbo àkókò tí àkáǹtì HenryCo rẹ bá wà, àyàfi tí o bá yọ wọn kúrò.",
    },
  },
  subscriptions: {
    metadata: {
      title: "Àwọn ìforúkọsílẹ̀",
      description:
        "Àkójọpọ̀ kíkà-nìkan ti àwọn ètò tí ó ń ṣiṣẹ́, tí a kó wá láti àwọn ìpín HenryCo.",
    },
    hero: {
      eyebrow: "Àwọn ètò tí ó ń ṣiṣẹ́",
      title: "Àwọn ìforúkọsílẹ̀",
      description:
        "Àkójọpọ̀ kíkà-nìkan ti àwọn ètò, láti ọ̀dọ̀ àwọn ìpín tí ń kó àwọn ìforúkọsílẹ̀ wọn sí ibùdó àkáǹtì pínpín lọ́wọ́lọ́wọ́.",
    },
    empty: {
      title: "Kò sí ìforúkọsílẹ̀ tí a kó síbẹ̀",
      description:
        "Èyí lè túmọ̀ sí pé o kò ní ètò tí ó ń ṣiṣẹ́, tàbí pé ìpín náà kò tíì gbé àwọn ìforúkọsílẹ̀ rẹ̀ jáde sí ìwé àkáǹtì pínpín.",
    },
    card: {
      planFallback: "Ètò ìforúkọsílẹ̀",
      tierSeparator: " · ",
      amountLabel: "Iye owó",
      cycleLabel: "Yíyípo",
      renewsLabel: "Yóò túnṣe",
      renewsFallback: "—",
    },
    statusLabels: {
      active: "Ń ṣiṣẹ́",
      paused: "Ti dúró",
      cancelled: "Ti fagilé",
      expired: "Ti parí",
      past_due: "Ó ti pẹ́ jù",
      trialing: "Ní àkókò ìdánwò",
      grace: "Àkókò àánú",
      pending: "Ń dúró",
      unknown: "Aimọ̀",
    },
    cycleLabels: {
      monthly: "Lóṣooṣù",
      yearly: "Lódoodún",
      annual: "Lódoodún",
      quarterly: "Ní gbogbo oṣù mẹ́ta",
      weekly: "Lọ́sọ̀sẹ̀",
      biweekly: "Ní gbogbo ọ̀sẹ̀ méjì",
      daily: "Lójoojúmọ́",
      one_time: "Ẹyọkan",
      notSet: "Kò ṣetán",
    },
    cta: {
      upgrade: "Gbé ètò sókè",
      downgrade: "Sọ ètò sílẹ̀",
      cancel: "Fagilé ìforúkọsílẹ̀",
      manage: "Ṣàkóso nínú ìpín",
      resume: "Tún ìforúkọsílẹ̀ bẹ̀rẹ̀",
    },
    paymentIssue: {
      title: "Ìsanwó nílò àfiyèsí",
      description:
        "A kò lè kó ìsanwó ìtúnṣe tuntun. Sọ ọ̀nà ìsanwó rẹ di tuntun láti pa ìforúkọsílẹ̀ yìí mọ́ tí ń ṣiṣẹ́.",
      updatePaymentCta: "Sọ ọ̀nà ìsanwó di tuntun",
    },
    summary: {
      activeTemplate: "{count} ń ṣiṣẹ́",
      pausedTemplate: "{count} ti dúró",
      totalTemplate: "{count} ètò",
    },
  },
  referrals: {
    metadata: {
      title: "Ìfilọ̀ Ẹnìkejì",
      description:
        "Pe àwọn oníbàárà tí ó dára sí HenryCo, kí o sì máa tọpinpin ẹ̀san láti ipo dídúró, sí ìwádìí, sí gbígba.",
    },
    hero: {
      title: "Ìfilọ̀ Ẹnìkejì",
      description:
        "Pe àwọn oníbàárà tí ó dára sí HenryCo, kí o sì máa tọpinpin ẹ̀san láti ipo dídúró, sí ìwádìí, sí gbígba.",
    },
    code: {
      eyebrow: "Kóòdù ìfilọ̀ rẹ",
      shareLinkLabel: "Líńkì pínpín",
      copyCodeTitle: "Daakọ kóòdù",
      copyLinkTitle: "Daakọ líńkì",
      copyLinkLabel: "Daakọ líńkì",
      copiedToast: "A ti daakọ!",
      rewardNote:
        "Ẹ̀san: {amount} fún ìfilọ̀ kọ̀ọ̀kan tí ó dára. A o gba ẹ̀san wọlé lẹ́yìn tí ẹni tí a fi ránṣẹ́ sí parí ètò ìrajà ní àkókò ìpamọ́ ọjọ́ {days}.",
    },
    stats: {
      totalReferred: "Àpapọ̀ Tí A Filọ̀",
      signedUp: "Tí Ó Forúkọsílẹ̀",
      qualified: "Tí Ó Tó",
      flagged: "Tí A Sàmì Sí",
      pendingRewards: "Ẹ̀san Dídúró",
      releasedRewards: "Ẹ̀san Tí A Gbé Jáde",
    },
    howItWorks: {
      eyebrow: "Bí Ó Ti Ń Ṣiṣẹ́",
      step1Title: "Pín kóòdù rẹ",
      step1Body:
        "Pín kóòdù tàbí líńkì alaiẹ̀dà rẹ. A o tọpinpin àwọn ọ̀rẹ́ tí ó bẹ̀rù subdomain HenryCo èyíkéyìí pẹ̀lú líńkì rẹ lójijì.",
      step2Title: "Wọn ń ṣe ìfowópamọ́",
      step2Body:
        "Lẹ́yìn ìforúkọsílẹ̀, ìfilọ̀ náà yóò wọnú àkókò ìpamọ́ ọjọ́ {days}. À ń tọ́jú ìbáṣepọ̀ ẹni tí a fi ránṣẹ́ sí lẹ́ẹ̀kanṣoṣo — ìfilọ̀ ara-ẹni, ẹbí olùpíbarbar, àti àwọn ìforúkọsílẹ̀ tí a yí padà kò tó.",
      step3Title: "Ẹ̀san yóò gba wọlé lẹ́yìn ìjẹrísí",
      step3Body:
        "Ìfilọ̀ tí ó dára yóò fi {amount} sí àpamọ́wọ́ HenryCo rẹ lẹ́yìn àyẹ̀wò ètò ìnáwó. Ẹ̀san dídúró kò ṣeé ná àyàfi tí a bá tu sílẹ̀.",
    },
    policy: {
      eyebrow: "Òfin Ìfilọ̀",
      qualifying:
        "Ìyípadà tí ó dára túmọ̀ sí pé àkáǹtì ẹni tí a fi ránṣẹ́ sí parí iṣẹ́ HenryCo tí ó yẹ tí ó gba ìmúdájú ìsanwó àti ìfọkàntán.",
      enforcement:
        "HenryCo lè dá, yí padà, tàbí kọsílẹ̀ ẹ̀san fún àwọn ìfilọ̀ ara-ẹni, àyípo ìyípadà àdàkọ, àyípadà tó padà, àpadàbọ̀, tàbí àwọn àpẹẹrẹ ẹ̀san tí ó fún ìfura.",
      separation:
        "Dásíbọ̀ọ̀dù rẹ fi àwọn ìfilọ̀ àti ìtàn ẹ̀san hàn lọ́tọ̀ọ̀tọ̀ kí a má ba à dárúkọ àwọn ìforúkọsílẹ̀ tí a tọpinpin gẹ́gẹ́ bí èrè àpamọ́wọ́ tí a ti gba wọlé.",
    },
    referralsList: {
      eyebrow: "Àwọn Ìfilọ̀ Rẹ",
      emptyTitle: "Kò sí ìfilọ̀ kankan síbẹ̀",
      emptyDescription:
        "Pín kóòdù ìfilọ̀ rẹ láti bẹ̀rẹ̀ pípe àwọn ènìyàn. Àwọn ìfilọ̀ yóò farahàn níbí ní kété tí ẹnìkan bá forúkọsílẹ̀ pẹ̀lú líńkì rẹ.",
      refereeFallback: "Ìforúkọsílẹ̀ tí a fi ránṣẹ́",
      signedUpTemplate: "Forúkọsílẹ̀ {date}",
      qualifiedTemplate: "Tó {date}",
    },
    statusLabels: {
      pending: "Ó ń dúró fún ìforúkọsílẹ̀",
      converted: "Ó ti forúkọsílẹ̀ · àkókò ìpamọ́",
      qualified: "Ó tó · ẹ̀san ti ṣílẹ̀",
      flagged: "A sàmì sí · ààbò ẹ̀tàn",
      expired: "Ti pàrẹ́",
    },
    flagReasons: {
      selfReferral: "A dí ìfilọ̀ ara-ẹni",
      duplicateEmail: "Ímeèlì àdàkọ olùpíbarbar",
      deviceReuse: "Lílò ẹ̀rọ ní àtúntò",
    },
    rewards: {
      eyebrow: "Ìtàn Ẹ̀san",
      emptyTitle: "Kò sí ẹ̀san kankan síbẹ̀",
      emptyDescription:
        "Àwọn ẹ̀san tí a gbà yóò farahàn níbí lẹ́yìn tí àwọn ìyípadà tí ó dára bá gba ìmúdájú àti àyẹ̀wò àìtọ́.",
      referralRewardFallback: "Ẹ̀san Ìfilọ̀",
      paidTemplate: "A san {date}",
      statusLabels: {
        held: "Ó dúró",
        pending: "Ó ń dúró",
        released: "A gbé jáde",
        paid: "A san",
        cancelled: "A fagilé",
      },
    },
  },
  divisionCare: {
    metadata: {
      title: "Care · àwọn ìfìpamọ́ tí a sopọ̀",
      description: "Tẹ̀lé ìfìpamọ́ HenryCo Care kọ̀ọ̀kan tí a so mọ́ àkáǹtì yìí — ipò, ìfọwọ́sí ìsanwó àti ìgbéṣe iṣẹ́ tó kàn ní ibi kan.",
    },
    hero: {
      eyebrow: "Care · lójú ẹsẹ̀",
      sideKicker: "Bí yàrá yìí ṣe ń ṣiṣẹ́",
      sideTitle: "Fipamọ́ lórí Care, tẹ̀síwájú níbí.",
      sideBody: "Gbogbo ìfìpamọ́ tí a ṣe lórí HenryCo Care máa ń farahàn nínú yàrá yìí — koodu àtẹ̀lé, ipò ìsanwó, àti ìgbéṣe iṣẹ́ tó kàn dé níbí lọ́nà àdáṣiṣẹ́. Ìpàtẹ́wọ́ jẹ́jẹ́ síyáhò bí iṣẹ́ ṣe ń tẹ̀síwájú.",
      breakdownLabel: "Nípa ipò",
      tilesAriaLabel: "Àkójọ àwọn ìfìpamọ́ Care",
      tileLabels: {
        total: "Àwọn ìfìpamọ́",
        inFlight: "Lórí iṣẹ́",
        payment: "Ń dúró ìsanwó",
        completed: "Ti parí",
      },
      tileFoot: {
        totalEmpty: "Fipamọ́ iṣẹ́ Care àkọ́kọ́ rẹ láti bẹ̀rẹ̀",
        totalWithTemplate: "{count} tí a so mọ́ àkáǹtì yìí",
        inFlightEmpty: "Kò sí ohunkóhun tó ń tẹ̀síwájú lọ́wọ́lọ́wọ́",
        inFlightWith: "Ipò lójú ẹsẹ̀ farahàn nísàlẹ̀",
        paymentEmpty: "Kò sí ìfọwọ́sí ìsanwó tí ń dúró",
        paymentWith: "Fi tàbí ṣàyẹ̀wò ìwé ìgbasọ̀ọ̀rọ̀ nísàlẹ̀",
        completedEmpty: "Kò sí iṣẹ́ tó ti parí síbẹ̀",
        completedWith: "Ẹgbẹ́ Care fọwọ́ sí pé ó parí",
      },
      breakdownLabels: {
        inFlight: "Lórí iṣẹ́",
        scheduled: "Tí a ṣètò",
        payment: "Ń dúró ìsanwó",
        completed: "Ti parí",
      },
      state: {
        empty: {
          headline: "Fipamọ́ iṣẹ́ Care àkọ́kọ́ rẹ.",
          blurb: "Àwọn iṣẹ́ Care tí o bá fipamọ́ níbí máa ń ṣe ìbámu lọ́nà àdáṣiṣẹ́ sí yàrá yìí — koodu àtẹ̀lé, ipò ìsanwó àti ìgbéṣe iṣẹ́ tó kàn.",
          ctaPrimary: "Fipamọ́ iṣẹ́",
          ctaSecondary: "Ṣí àtẹ̀lé",
        },
        attention: {
          headlineTemplateSingular: "{count} ìgbéṣe láti ṣe.",
          headlineTemplatePlural: "{count} ìgbéṣe láti ṣe.",
          blurb: "Ọ̀kan tàbí púpọ̀ àwọn ìfìpamọ́ ń dúró ìfọwọ́sí ìsanwó tàbí ìtẹ̀síwájú. Ṣí ìfìpamọ́ tó wà nísàlẹ̀ láti yanjú.",
          ctaPrimary: "Ṣàyẹ̀wò àwọn ìfìpamọ́",
          ctaSecondary: "Ṣí àtẹ̀lé",
        },
        active: {
          headlineTemplateSingular: "{count} iṣẹ́ ń lọ.",
          headlineTemplatePlural: "{count} iṣẹ́ ń lọ.",
          blurb: "Àtẹ̀lé lójú ẹsẹ̀, ìfọwọ́sí ìsanwó, àti ìgbéṣe iṣẹ́ tó kàn farahàn láti HenryCo Care sí yàrá yìí.",
          ctaPrimary: "Ṣí àtẹ̀lé",
          ctaSecondary: "Fipamọ́ iṣẹ́",
        },
        calm: {
          headlineTemplateSingular: "{count} ìfìpamọ́ ṣì wà.",
          headlineTemplatePlural: "{count} àwọn ìfìpamọ́ ṣì wà.",
          blurb: "Àwọn ìfìpamọ́ Care rẹ, kòódù àtẹ̀lé, ìwé ìgbasọ̀ọ̀rọ̀, àti àwọn ìgbéṣe tó ń bọ̀ — gbogbo rẹ̀ ní ibi kan, tí a sì ń ṣe ìbámu lójú ẹsẹ̀.",
          ctaPrimary: "Fipamọ́ iṣẹ́",
          ctaSecondary: "Ṣí àtẹ̀lé",
        },
      },
    },
    sections: {
      glance: "Ìgbéṣe tó kàn",
      glanceMeta: "Ìfìpamọ́ tó pọn dandan jùlọ farahàn níbí.",
      bookings: "Gbogbo àwọn ìfìpamọ́",
      bookingsEmpty: "Àwọn ìfìpamọ́ tí a ṣe nígbà tí a wọlé farahàn níbí lójú ẹsẹ̀.",
      bookingsMetaTemplateSingular: "{count} ìfìpamọ́ · ṣàyẹ̀wò, pín sí ojú-ìwé, kí o sì ṣí ọ̀kan fún àlàyé lójú ẹsẹ̀.",
      bookingsMetaTemplatePlural: "{count} àwọn ìfìpamọ́ · ṣàyẹ̀wò, pín sí ojú-ìwé, kí o sì ṣí ọ̀kan fún àlàyé lójú ẹsẹ̀.",
      activity: "Iṣẹ́ tuntun",
      activityEmpty: "Àwọn ìmúdójúìwọ̀n ipò, ìwé ìgbasọ̀ọ̀rọ̀ àti àyẹ̀wò farahàn níbí bí wọ́n ṣe ń ṣẹlẹ̀.",
      activityMetaTemplateSingular: "{count} ìmúdójúìwọ̀n · tó kàn tuntun jùlọ ní ìbẹ̀rẹ̀",
      activityMetaTemplatePlural: "{count} àwọn ìmúdójúìwọ̀n · tó kàn tuntun jùlọ ní ìbẹ̀rẹ̀",
    },
    empty: {
      title: "Kò sí àwọn ìfìpamọ́ Care tí a so síbẹ̀",
      body: "Àwọn ìfìpamọ́ tí o bá ṣe lórí Care nígbà tí o wọlé yóò farahàn níbí lójúkan. Àwọn ìfìpamọ́ àtijọ́ yóò tún farahàn lẹ́yìn tí ímeèlì tàbí tẹlifóònù wọn bá bá àkójọ ìṣẹ́tì àkáǹtì tí a pín mu.",
    },
    glance: {
      nextActionLabel: "Ìgbéṣe tó kàn",
      serviceLabel: "Iṣẹ́",
      pickupLabel: "Gbígbé",
      balanceLabel: "Owó tí ó kù",
      trackingLabel: "Àtẹ̀lé",
      serviceFallback: "Iṣẹ́ Care",
    },
    activityAriaLabel: "Iṣẹ́ Care",
    status: {
      live: "Lórí iṣẹ́",
      scheduled: "Tí a ṣètò",
      completed: "Ti parí",
      issue: "Ìgbéṣe nílò",
      payment: "Àyẹ̀wò ìsanwó",
    },
    statusValueLabels: {
      booked: "Tí a fipamọ́",
      awaiting_payment: "Ń dúró ìsanwó",
      receipt_submitted: "A fi ìwé ìgbasọ̀ọ̀rọ̀",
      under_review: "Ní àyẹ̀wò",
      delivered: "A ti firanṣẹ́",
      customer_confirmed: "Oníbàárà fọwọ́ sí",
      inspection_completed: "Àyẹ̀wò ti parí",
      service_completed: "Iṣẹ́ ti parí",
      cancelled: "A fagilé",
      issue: "Ìṣòro",
      exception: "Yàtọ̀",
      rejected: "A kọ̀",
    },
    formatLabels: {
      toBeScheduled: "Láti ṣètò",
      shortMonths: ["Ṣẹ́n", "Èrè", "Ẹr̀n", "Ìgb", "Èbí", "Òkù", "Agẹ", "Ògú", "Owe", "Ọ̀wà", "Bél", "Òpẹ"],
    },
    dashboard: {
      filters: {
        all: "Gbogbo",
        unpaid: "Owó tí ó kù",
        receipt: "Ìwé ìgbasọ̀ọ̀rọ̀ / àyẹ̀wò",
        active: "Ń lọ",
        completed: "Ti parí",
        issue: "Àwọn ìṣòro",
      },
      filtered: "ṣe àyẹ̀wò",
      bookingSingular: "ìfìpamọ́",
      bookingPlural: "àwọn ìfìpamọ́",
      metrics: {
        visible: "Àwọn ìfìpamọ́ tí ó hàn",
        visibleHint: "Àwọn ìfìpamọ́ Care tó tóótó tí a so mọ́ àkáǹtì yìí.",
        balance: "Owó tí ó kù",
        balanceHintSomeTemplate: "{count} ìfìpamọ́ ṣì nílò ìtẹ̀síwájú ìsanwó.",
        balanceHintNone: "Kò sí owó Care tí a kò sanwó tí ó ṣí lọ́wọ́lọ́wọ́.",
        receiptQueue: "Ipò àwọn ìwé ìgbasọ̀ọ̀rọ̀",
        receiptQueueHintSome: "Àwọn ìfìpamọ́ pẹ̀lú ìwé ìgbasọ̀ọ̀rọ̀ tí a fi ṣì ń dúró ìfọwọ́sí.",
        receiptQueueHintNone: "Kò sí ìdíwọ́ ìfọwọ́sí ìwé ìgbasọ̀ọ̀rọ̀ tí a so mọ́ àkáǹtì yìí.",
        completed: "Ti parí",
        completedHintSome: "Àwọn ìfìpamọ́ tí ó parí lè dé ìtẹ̀síwájú àyẹ̀wò.",
        completedHintNone: "Àwọn ìfìpamọ́ Care tí ó parí yóò farahàn níbí nígbà tí iṣẹ́ bá parí.",
      },
      linkedBookings: "Àwọn ìfìpamọ́ Care tí a so",
      linkedBookingsDescription: "Àwọn ìfìpamọ́ Care rẹ, ipò ìsanwó àti àwọn ìgbéṣe tó ń bọ̀.",
      onThisPage: "lórí ojú-ìwé yìí",
      selectedBooking: "Ìfìpamọ́ tí a yan",
      paymentSnapshot: "Ìran ìsanwó",
      receiptVisibility: "Ìran ìwé ìgbasọ̀ọ̀rọ̀",
      nextBestAction: "Ìgbéṣe tó dára jùlọ tó kàn",
      serviceSummary: "Àkójọ iṣẹ́",
      serviceFallback: "Iṣẹ́ Care",
      addressPending: "Àdírẹ́sì ń dúró",
      updated: "A ṣe àtúnṣe",
      balanceDue: "Owó tí ó kù",
      nextMove: "Ìgbéṣe tó kàn",
      paginationLabel: "Pípín àwọn ìfìpamọ́ Care",
      pageLabel: "Ojú-ìwé",
      of: "ti",
      perPage: "fún ojú-ìwé kọ̀ọ̀kan",
      previous: "Ẹ̀yìn",
      next: "Tó kàn",
      customerFallback: "Oníbàárà",
      scheduledDate: "Ọjọ́ tí a ṣètò",
      notScheduled: "Kò tí ì ṣètò",
      timeWindow: "Àkókò",
      windowPending: "Àkókò ń dúró",
      pickupAddress: "Àdírẹ́sì gbígbé",
      returnAddress: "Àdírẹ́sì ìpadàbọ̀ / ìfijíṣẹ́",
      returnAddressFallback: "Lo àdírẹ́sì gbígbé àyàfi tí a yí padà nígbà ìfìpamọ́",
      trackingCode: "Koodu àtẹ̀lé",
      quotedTotal: "Àpapọ̀ tí a sọ",
      amountRecorded: "Owó tí a kọ sílẹ̀",
      receiptState: "Ipò ìwé ìgbasọ̀ọ̀rọ̀",
      receiptsSubmitted: "Ìwé ìgbasọ̀ọ̀rọ̀ tí a fi",
      lastSubmission: "Ìfilọ́ kẹ́yìn",
      noReceiptYet: "Kò sí ìwé ìgbasọ̀ọ̀rọ̀ síbẹ̀",
      openLiveBooking: "Ṣí ìfìpamọ́ lójú ẹsẹ̀",
      leaveReview: "Fi àyẹ̀wò sílẹ̀",
    },
  },
  divisionProperty: {
    metadata: {
      title: "Property · àwọn tí a fipamọ́ àti ìbéèrè",
      description: "Àkójọpọ̀ Property rẹ, àwọn ìbéèrè, àwọn ìbẹ̀wò, àti àwọn ìtẹ̀síwájú ìpolówó — gbogbo ìṣe lórí HenryCo Property ń farahàn nínú yàrá àkáùntì yìí.",
    },
    hero: {
      eyebrow: "Property · taara",
      ariaLabel: "Àkópọ̀ Property",
      browseListingsCta: "Wo àwọn ìpolówó",
      savedShortlistCta: "Àkójọpọ̀",
      tilesAriaLabel: "Ìṣẹ̀lẹ̀ Property",
      tileLabels: {
        saved: "Tí a fipamọ́",
        inquiries: "Ìbéèrè",
        viewings: "Ìbẹ̀wò",
        listings: "Ìpolówó",
      },
      tileFoot: {
        savedManagedTemplate: "{count} tí HenryCo ń darí",
        savedEmpty: "Fipamọ́ àwọn ìpolówó láti kọ́ àkójọpọ̀",
        savedWith: "Ṣe àfojúsùn àti yípadà nígbà gbogbo",
        inquiriesEmpty: "Kò sí ìjíròrò tí ó ṣí",
        inquiriesWith: "Àwọn ìtẹ̀síwájú yóò dé yàrá yìí",
        viewingsEmpty: "Béèrè ìbẹ̀wò sí ilé tí a fipamọ́",
        viewingsWith: "Àwọn ìfìdíhàn ń ṣe àjùmọ̀ṣe káàkiri ẹ̀rọ",
        listingsEmpty: "Fi ìpolówó sí Property",
        listingsWith: "Àbájáde àtúnyẹ̀wò ń farahàn níbí",
      },
      sideAriaLabel: "Bí yàrá yìí ṣe ń ṣiṣẹ́",
      sideKicker: "Bí yàrá yìí ṣe ń ṣiṣẹ́",
      sideTitle: "Ṣàwárí lórí Property, tẹ̀síwájú níbí.",
      sideBody:
        "Fipamọ́ ìpolówó, béèrè ìbẹ̀wò, tàbí ṣí ìbéèrè lórí HenryCo Property — gbogbo ìṣe ń farahàn nínú yàrá àkáùntì yìí kí o lè bẹ̀rẹ̀ lẹ́yìn ibi tí o dúró sí láti orí gbogbo ẹ̀rọ rẹ.",
      sideBodyMuted:
        "Àwọn ìpolówó tí HenryCo ń darí ní àmì Tí ń darí — àtúnyẹ̀wò, àyẹ̀wò, àti ìtẹ̀síwájú àdéhùn ìyálò ni ẹgbẹ́ Property ń ṣe àkójọpọ̀.",
      breakdownAriaLabel: "Ìpín ìṣẹ̀lẹ̀",
      breakdownLabel: "Nípa ìṣẹ̀lẹ̀",
      breakdownLabels: {
        saved: "Tí a fipamọ́",
        inquiries: "Ìbéèrè",
        viewings: "Ìbẹ̀wò",
        listings: "Ìpolówó",
      },
      state: {
        empty: {
          headline: "Bẹ̀rẹ̀ àtikẹ́kọ̀ọ́ HenryCo Property.",
          blurb:
            "Ṣàwárí àwọn ilé ìyálò, àwọn ìpolówó títà, àti àwọn ilé tí HenryCo ń darí. Fipamọ́ àwọn ti ó wù ọ́, gbogbo ìbéèrè, ìbẹ̀wò, tàbí ìtẹ̀síwájú ìpolówó yóò dé níbí lóòòrè.",
        },
        discover: {
          headlineTemplateSingular: "{count} ilé nínú àkójọpọ̀.",
          headlineTemplatePlural: "{count} ilé nínú àkójọpọ̀.",
          blurb:
            "Àwọn ilé tí a fipamọ́, tó ṣetán fún ìṣàyẹ̀wò. Ṣí ìpolówó láti béèrè ìbẹ̀wò tàbí fi ìbéèrè ránṣẹ́ — ìtẹ̀síwájú yóò padà síbí tààrà.",
        },
        active: {
          viewingHeadlineTemplateSingular: "{count} ìbẹ̀wò tí a ṣètò.",
          viewingHeadlineTemplatePlural: "{count} ìbẹ̀wò tí a ṣètò.",
          inquiryHeadlineTemplateSingular: "{count} ìbéèrè tí ó ń lọ.",
          inquiryHeadlineTemplatePlural: "{count} ìbéèrè tí ń lọ.",
          blurb:
            "Àkójọpọ̀, ìbéèrè, àti ètò ìbẹ̀wò rẹ wà nínú yàrá kan. Bẹ̀rẹ̀ lẹ́yìn ibi tí o dúró sí — gbogbo ìṣe ń ṣàfihàn láti HenryCo Property gẹ́gẹ́ bí àkókò gidi.",
        },
      },
    },
    sections: {
      saved: "Àkójọpọ̀ tí a fipamọ́",
      savedMetaEmpty: "Fipamọ́ àwọn ìpolówó lórí HenryCo Property láti kọ́ àkójọpọ̀ rẹ.",
      savedMetaTemplate: "{saved} tí a fipamọ́ · {managed} tí HenryCo ń darí",
      activity: "Ìṣẹ̀lẹ̀ tuntun",
      activityMetaEmpty: "Àwọn ìbéèrè, ìbẹ̀wò, àti àtúnyẹ̀wò ìpolówó ń ṣàfihàn níbí bí wọ́n ti ń ṣẹlẹ̀.",
      activityMetaTemplateSingular: "{count} ìmúdójúìwọ̀n · tuntun jùlọ ní àkọ́kọ́",
      activityMetaTemplatePlural: "{count} ìmúdójúìwọ̀n · tuntun jùlọ ní àkọ́kọ́",
    },
    empty: {
      savedTitle: "Kò sí ilé tí a fipamọ́ síbẹ̀",
      savedBody:
        "Ṣàwárí àwọn ilé ìyálò, àwọn ìpolówó títà, àti àwọn ilé tí HenryCo ń darí lórí Property. Ohunkóhun tí o bá fipamọ́ yóò dé níbí lóòòrè.",
      activityTitle: "Kò sí ìṣẹ̀lẹ̀ Property síbẹ̀",
      activityBody:
        "Ṣí ìpolówó lórí HenryCo Property láti béèrè ìbẹ̀wò tàbí fi ìbéèrè ránṣẹ́ — ipele kọ̀ọ̀kan, láti ọ̀rọ̀ àkọ́kọ́ rẹ títí dé àtúnyẹ̀wò, yóò farahàn níbí.",
    },
    activity: {
      ariaLabel: "Ìṣẹ̀lẹ̀ Property",
      titles: {
        inquiry: "Ìbéèrè ilé",
        viewing: "Ìbéèrè ìbẹ̀wò",
        listing_submitted: "A fi ìpolówó",
        listing_updated: "A mú ìpolówó dáadáa",
        listing_reviewed: "A pari àtúnyẹ̀wò ìpolówó",
      },
    },
    gallery: {
      ariaLabel: "Àwọn ilé tí a fipamọ́",
      managedBadge: "Tí ń darí",
      featuredBadge: "Tí a yàn",
      locationPending: "Ipò ń dúró",
      contactAgent: "Bá aṣojú sọ̀rọ̀",
      savedAtTemplate: "Fipamọ́ ní {date}",
      bedSingular: "yàrá ìbùsùn",
      bedPlural: "yàrá ìbùsùn",
      bathSingular: "yàrá ìwẹ̀",
      bathPlural: "yàrá ìwẹ̀",
      sizeSqmTemplate: "{size} sqm",
    },
  },
  divisionJobs: {
    metadata: {
      title: "Iṣẹ́ · pẹpẹ olùdánwò",
      description: "Tọpinpin gbogbo ìbéèrè HenryCo Jobs, iṣẹ́ tí a fipamọ́, ìròyìn aṣàrokin, àti àmì ìmúrasílẹ̀ profáìlì tí ó so mọ́ àkáǹtì yìí.",
    },
    header: {
      title: "Iṣẹ́",
      description: "Àwọn ìbéèrè rẹ, iṣẹ́ tí a fipamọ́, ìròyìn aṣàrokin, àti agbára profáìlì — gbogbo rẹ̀ ní ibìkan.",
      candidateModuleCta: "Module olùdánwò",
      interviewRoomsCta: "Yàrá ìbéèrè",
      browseLiveRolesCta: "Wo iṣẹ́ tí ó wà ní gbangba",
    },
    hero: {
      eyebrow: "Àkáǹtì rẹ",
      headline: "Iṣẹ́ ìgbòkègbódò rẹ, gbogbo rẹ̀ ní ibìkan.",
      body: "Àwọn ìbéèrè, iṣẹ́ tí a fipamọ́, ìròyìn aṣàrokin, àti ìmúrasílẹ̀ profáìlì ni a ti so mọ́ àkáǹtì HenryCo rẹ.",
      statsAriaLabel: "Ìsọ̀rọ̀ kúkurú nípa ìgbòkègbódò iṣẹ́",
      statLabels: {
        applications: "Àwọn ìbéèrè tí ń ṣiṣẹ́",
        saved: "Iṣẹ́ tí a fipamọ́",
        readiness: "Ìmúrasílẹ̀ profáìlì",
        updates: "Ìròyìn aṣàrokin",
      },
      statDetails: {
        applicationsLeadingTemplate: "{stage} ni ipele rẹ tí ó ń ṣiṣẹ́ jùlọ.",
        applicationsEmpty: "Kò sí ìbéèrè tí ń ṣiṣẹ́ síbẹ̀.",
        savedSome: "Àkójọ rẹ ti ṣetán fún ayẹ̀wò mìíràn.",
        savedEmpty: "Kọ́ àkójọ kí o lè rí àwọn iṣẹ́ rere ní rọ̀rùn lẹ́ẹ̀kan sí i.",
        updatesLatestTemplate: "{relative} ìṣípayá tuntun.",
        updatesEmpty: "Kò sí ìròyìn aṣàrokin síbẹ̀.",
      },
    },
    sections: {
      nextActionsKicker: "Iṣẹ́ Tó Ń Bọ̀",
      nextActionsTitle: "Ohun tí ó tọ́ ìfojúsùn rẹ báyìí",
      openTimelineCta: "Ṣí ìṣàyẹ̀wò àkókò",
      applicationsKicker: "Ìbéèrè",
      applicationsTitle: "Ìṣípayá ìṣàlò tí ń ṣẹlẹ̀",
      savedKicker: "Iṣẹ́ Tí A Fipamọ́",
      savedTitle: "Àkójọ pẹ̀lú ìmọ̀ síwájú",
      openSavedRolesCta: "Ṣí iṣẹ́ tí a fipamọ́",
      recommendedKicker: "Iṣẹ́ Tí A Dámọ̀ràn",
      recommendedTitle: "Ohun tí ó bá àmì rẹ lọ́wọ́lọ́wọ́ mu",
      browseCatalogCta: "Wo kátálọ́gì",
      recruiterFeedKicker: "Èté Aṣàrokin",
      recruiterFeedTitle: "Iṣẹ́ àkọsílẹ̀, ìyípadà ipele, àti ìkìlọ̀",
      candidateInboxCta: "Apá olùdánwò",
      profileKicker: "Agbára Profáìlì",
      profileTitle: "Ìmúrasílẹ̀ olùdánwò àti ìmúdára CV",
      sharedInboxKicker: "Apá Pínpín",
      sharedInboxTitle: "Ìkéde Jobs tí a so mọ́ àkáǹtì rẹ",
      alertsKicker: "Ìkìlọ̀",
      alertsTitle: "Èrò ìwákiri tí a fipamọ́",
    },
    empty: {
      applicationsTitle: "Kò sí ìbéèrè tí ń ṣiṣẹ́ síbẹ̀",
      applicationsBody: "Iṣẹ́ tí a fipamọ́, ìròyìn aṣàrokin, àti àkókò ìṣẹ̀lẹ̀ yóò farahàn níhìn-ín ní kété tí o bá yí padà láti ìwákiri sí ìbéèrè tí ń ṣiṣẹ́.",
      exploreJobsCta: "Ṣàwárí iṣẹ́",
      savedJobsTitle: "Kò sí iṣẹ́ tí a fipamọ́ síbẹ̀",
      savedJobsBody: "Fipamọ́ àwọn iṣẹ́ tí ó dára kí ó lè wà nínú àkójọ rẹ jákèjádò Jobs àti àkáǹtì rẹ.",
      recommendedTitle: "Àwọn ìmọ̀ràn yóò mú dágbá pẹ̀lú lílo Jobs",
      recommendedBody: "Bí profáìlì, àkójọ, àti àwọn ìbéèrè rẹ ti ń dára, àwọn ìmọ̀ràn iṣẹ́ níhìn-ín yóò di ohun tí ó ní àfojúsùn jù.",
      recruiterFeedTitle: "Kò sí ìṣípayá aṣàrokin síbẹ̀",
      recruiterFeedBody: "Ìyípadà ipele ìbéèrè, àkọsílẹ̀ aṣàrokin tí a pín, àti àwọn ìkéde Jobs nínú app yóò ko síhìn-ín.",
      notificationsTitle: "Kò sí àwọn ìkéde Jobs síbẹ̀",
      notificationsBody: "Ìṣípayá àkójọ ọjọ́ iwájú, ìròyìn agbanisíṣẹ́, àti àyípadà ìbéèrè yóò gúnlẹ̀ síbí àti nínú module Jobs.",
      alertsTitle: "Kò sí ìkìlọ̀ Jobs tí ń ṣiṣẹ́",
      alertsBody: "Ṣẹ̀dá ìkìlọ̀ kí àwọn iṣẹ́ tuntun tí ó bá àwọn àmì rẹ mu lè farahàn nínú èté Jobs rẹ.",
      browseRolesCta: "Wo iṣẹ́",
    },
    application: {
      progressPercentTemplate: "{percent}% pé",
      appliedAtTemplate: "Béèrè ní {date}",
      candidateReadiness: "Ìmúrasílẹ̀ olùdánwò",
      recruiterConfidence: "Ìgbàgbọ́ aṣàrokin",
      latestMovement: "Ìṣípayá tuntun aṣàrokin",
      nextBestMove: "Ìgbésẹ̀ tí ó dára jù",
      openTimelineCta: "Ṣí ìṣàyẹ̀wò àkókò",
      interviewRoomCta: "Yàrá ìbéèrè",
      viewRoleCta: "Wo iṣẹ́",
    },
    savedJob: {
      trustTemplate: "Ìgbẹ́kẹ̀lé {score}",
      savedAtTemplate: "Fipamọ́ ní {date}",
    },
    recommended: {
      compFallback: "Owó ipa-yá tí ó wà nínú ètò",
    },
    stageLabels: {
      applied: "Béèrè",
      reviewing: "Ń ṣàyẹ̀wò",
      shortlisted: "A yàn",
      interview: "Ìbéèrè",
      offer: "Ìdásílẹ̀",
      hired: "A gbà",
      rejected: "A kọ̀",
    },
    nextStep: {
      labels: {
        applied: "Pa profáìlì àti CV rẹ mọ́",
        shortlisted: "Mú ẹ̀rí àti àyíká portfolio ṣetán",
        interview: "Mú àwọn àpẹẹrẹ àti àkókò sílẹ̀",
        offer: "Ṣàyẹ̀wò àyíká, àkókò, àti owó",
        rejected: "Mú apò ìbéèrè tókàn lágbára",
      },
      bodies: {
        applied: "Ní ipele àkọ́kọ́, ẹ̀rí tí ó dára, ohun ìbánisọ̀rọ̀ tí ó mọ́, àti CV tuntun ń ràn lọ́wọ́.",
        shortlisted: "Ní a yàn túmọ̀ sí pé o ti kọjá àyẹ̀wò àkọ́kọ́. Ẹ̀rí tí ó dájú máa ka báyìí.",
        interview: "Àwọn ipele ìbéèrè ń lọ ní iyára nígbà tí ẹ̀rí iṣẹ́ tí ó dára jù àti àkókò rẹ rọrùn láti rí.",
        offer: "Lo ipele ìdásílẹ̀ láti yọ ẹ̀rí kúrò, kì í ṣe láti ronú nípa àwọn ojúṣe.",
        rejected: "Lo ìkọ̀sílẹ̀ gẹ́gẹ́ bí àmì. Mú àfojúsùn, àpẹẹrẹ, àti ìbámu pẹ̀lú ipa lágbára kí o tó béèrè lẹ́ẹ̀kan sí i.",
      },
    },
    readinessLabels: {
      interviewReady: "Múratán fún ìbéèrè",
      strongProfile: "Profáìlì tó lágbára",
      needsProof: "Nílò ẹ̀rí",
      needsStructure: "Nílò ètò",
    },
    workModeLabels: {
      remote: "Ìjìnnà",
      hybrid: "Adàpọ̀",
      onsite: "Lókè ojú",
    },
    employmentTypeLabels: {
      fullTime: "Àkókò kíkún",
      partTime: "Àkókò díẹ̀",
      contract: "Adéhùn",
      internship: "Ìkọ́ṣẹ́",
      temporary: "Ìgbà kúkúrú",
    },
    profile: {
      readinessLabel: "Ìmúrasílẹ̀",
      skillsMappedLabel: "Àwọn ìmọ̀ tí a fi sípò",
      filesLabel: "Àwọn fáìlì",
      improveProfileCta: "Mú profáìlì dára síi",
      openCandidateModuleCta: "Ṣí module olùdánwò",
      checklist: {
        identityLabel: "Ìpilẹ̀ profáìlì",
        identityDetail: "Orúkọ kíkún, fóònù, àti ipò wà fún ìbánisọ̀rọ̀ aṣàrokin.",
        storyLabel: "Ìtàn ipa",
        storyDetail: "Akọlé àti ìsọnísókí ṣàlàyé ohun tí o ṣe ju àkọsílẹ̀ òfo lọ.",
        verificationLabel: "Ìfọwọ́sí ìdánimọ̀",
        verificationDetail: "Ìgbẹ́kẹ̀lé Jobs ṣì wà ní ààlà títí àkáǹtì HenryCo rẹ yóò ti kọjá àyẹ̀wò ìdánimọ̀.",
        proofLabel: "Ẹ̀rí iṣẹ́",
        proofDetail: "CV pẹ̀lú ẹ̀rí portfolio ń jẹ́ kí ìṣípayá yíyàn rọrùn.",
        skillsLabel: "Àwọn ìmọ̀ tí a fi sípò",
        skillsDetail: "Ó kéré tán ìmọ̀ mẹ́rin àti àwọn iṣẹ́ tí o fẹ́ jẹ́ kí ìmọ̀ràn dára síi.",
      },
    },
    nextActions: {
      gapTemplate: "Pa ìyàtọ̀ {label} kúrò",
      interviewLabel: "Múrasílẹ̀ fún ipele ìbéèrè",
      offerLabel: "Dáhùn sí ìdásílẹ̀ tí ń ṣiṣẹ́",
      attentionTemplate: "{title} ní {employer} nílò àfiyèsí rẹ báyìí.",
      convertSavedLabel: "Sọ iṣẹ́ tí a fipamọ́ di ìbéèrè tí ń ṣiṣẹ́",
      convertSavedTemplate: "{title} ti wà nínú àkójọ rẹ tẹ́lẹ̀, ó sì ti ṣetán fún ìfojúsùn jíjinlẹ̀.",
      restartLabel: "Bẹ̀rẹ̀ ìwákiri iṣẹ́ rẹ pẹ̀lú àwọn ìṣàfilọ́yàn tí ó lágbára",
      restartDetail: "Lo àwọn ìṣàfilọ́yàn agbanisíṣẹ́ tí a fọwọ́sí àti ipa àkọ́kọ́ láti kọ́ àkójọ tí ó mọ́ ní iyára.",
    },
    alertStatus: {
      active: "Ń ṣiṣẹ́",
      paused: "Dúró",
    },
    recruiterUpdateTitleTemplate: "Ìṣípayá {stage}",
  },
  divisionMarketplace: {
    metadata: {
      title: "Marketplace · àwọn ìbéèrè àti ìgbòkègbodò olùtà",
      description: "Tọpinpin gbogbo ìbéèrè HenryCo Marketplace, ariyanjiyan àti ìfiránṣẹ́ owó olùtà tó so mọ́ àkọọ́lẹ̀ yìí — ìgbòkègbodò olùrà àti ààyè iṣẹ́ olùtà, tí a ń ṣàfihàn nínú yàrá kan ní àkókò gidi.",
    },
    hero: {
      eyebrow: "Marketplace · alààyè",
      ariaLabel: "Ìwòye Marketplace",
      sideAriaLabel: "Bí yàrá yìí ṣe ń ṣiṣẹ́",
      sideKicker: "Bí yàrá yìí ṣe ń ṣiṣẹ́",
      sideTitle: "Rà àti tà — yàrá kan.",
      sideBody: "Gbogbo ìbéèrè, ariyanjiyan àti ìbéèrè ìsanwó tí o dá lórí Marketplace ni a ń ṣàfihàn nínú yàrá yìí. Ìgbòkègbodò ààyè olùtà ń jọṣepọ̀ pẹ̀lú ìbéèrè olùrà, kí àwọn ẹ̀gbẹ́ méjèèjì ti marketplace lè wà ní àfihàn ní wíwo kan.",
      breakdownLabel: "Nípa ipò",
      breakdownAriaLabel: "Pínpín ìgbòkègbodò",
      tilesAriaLabel: "Ìgbòkègbodò Marketplace",
      tileLabels: {
        orders: "Ìbéèrè",
        disputes: "Ariyanjiyan",
        store: "Ilé-ìtajà",
        payouts: "Ìfiránṣẹ́ owó",
      },
      tileFoot: {
        ordersEmpty: "Ìbéèrè àkọ́kọ́ yóò farahàn níbí",
        ordersInMotionTemplate: "{inFlight} ń lọ · {delivered} jíṣẹ́",
        ordersDeliveredTemplate: "{delivered} jíṣẹ́ títí di òní",
        disputesClear: "Gbogbo rẹ̀ jẹ́ kíkún",
        disputesActiveTemplate: "{open} ṣíṣí · {resolving} ń yanjú",
        storeActiveNoName: "Ọmọ-ẹgbẹ́ olùtà ṣiṣẹ́",
        storeActiveWithNameTemplate: "Ilé-ìtajà: {name}",
        storeApplicationTemplate: "Ìbéèrè: {status}",
        storeIdle: "Kò tíì tà — tẹ ìbéèrè nígbà tí o bá ti ṣetán",
        payoutsEmptyNoneSettled: "Kò sí ìbéèrè ìfiránṣẹ́ owó",
        payoutsSettledTemplate: "{count} ti yanjú títí di òní",
        payoutsPendingTemplate: "{amount} ń dúró",
      },
      breakdownLabels: {
        inMotion: "Ń lọ",
        openDisputes: "Ariyanjiyan ṣíṣí",
        delivered: "Jíṣẹ́",
        pendingPayouts: "Ìfiránṣẹ́ owó tó ń dúró",
      },
      state: {
        empty: {
          headline: "Bẹ̀rẹ̀ rírà lórí HenryCo Marketplace.",
          blurb: "Ìbéèrè, ariyanjiyan, ìgbòkègbodò olùtà àti ìfiránṣẹ́ owó ni a ń ṣàfihàn nínú yàrá yìí lẹ́sẹ̀kẹsẹ̀ tí o ba ti ṣe ìṣòwò. Wọ̀ marketplace kí o bẹ̀rẹ̀.",
          ctaPrimary: "Ṣí Marketplace",
          ctaSecondary: "Tẹ ìbéèrè láti tà",
        },
        attention: {
          headlineTemplateSingular: "Ọ̀ràn {count} nílò ìbáwí.",
          headlineTemplatePlural: "Ọ̀ràn {count} nílò ìbáwí.",
          blurb: "Ariyanjiyan àti àwọn ìbéèrè ìyàtọ̀ wà ní orí ìlà. Ṣí ọ̀ràn náà láti fi ẹ̀rí kún tàbí gba ìpinnu.",
          ctaPrimary: "Ṣàyẹ̀wò ọ̀ràn",
          ctaSecondary: "Ṣí Marketplace",
        },
        activeOrders: {
          headlineTemplateSingular: "Ìbéèrè {count} ń lọ.",
          headlineTemplatePlural: "Ìbéèrè {count} ń lọ.",
          blurb: "Ipò ìbéèrè alààyè, ipò ìsanwó àti àtẹ̀lé olùtà ń ṣàfihàn nínú yàrá yìí láti HenryCo Marketplace ní àkókò gidi.",
          ctaPrimary: "Ṣí Marketplace",
          ctaSecondary: "Tẹ ìbéèrè láti tà",
        },
        activePayouts: {
          headlineTemplateSingular: "Ìfiránṣẹ́ owó {count} ń ṣàyẹ̀wò.",
          headlineTemplatePlural: "Ìfiránṣẹ́ owó {count} ń ṣàyẹ̀wò.",
          blurb: "Àwọn ìbéèrè ìfiránṣẹ́ owó olùtà ń kọjá sí ìjẹ́rìí inúná. Àfikún ipò máa ń farahàn níbí bí ẹgbẹ́ ti ń tẹ̀síwájú.",
          ctaPrimary: "Ṣí ààyè olùtà",
          ctaSecondary: "Ṣí Marketplace",
        },
        calmBuyer: {
          headlineTemplateSingular: "Ìbéèrè {count} ti gbé sílẹ̀.",
          headlineTemplatePlural: "Ìbéèrè {count} ti gbé sílẹ̀.",
          blurb: "Gbogbo ìgbòkègbodò marketplace rẹ nínú yàrá kan — ìbéèrè olùrà, ìfiránṣẹ́ owó olùtà, àbájáde ariyanjiyan àti ipò tuntun ti ilé-ìtajà kọ̀ọ̀kan.",
          ctaPrimary: "Ṣí Marketplace",
          ctaSecondary: "Tẹ ìbéèrè láti tà",
        },
        calmSeller: {
          headlineTemplateSingular: "Ìbéèrè {count} · olùtà ṣiṣẹ́.",
          headlineTemplatePlural: "Ìbéèrè {count} · olùtà ṣiṣẹ́.",
          blurb: "Gbogbo ìgbòkègbodò marketplace rẹ nínú yàrá kan — ìbéèrè olùrà, ìfiránṣẹ́ owó olùtà, àbájáde ariyanjiyan àti ipò tuntun ti ilé-ìtajà kọ̀ọ̀kan.",
          ctaPrimary: "Ṣí Marketplace",
          ctaSecondary: "Ṣí ààyè olùtà",
        },
      },
    },
    sections: {
      matters: {
        title: "Ọ̀ràn tó ń ṣiṣẹ́",
        meta: "Ariyanjiyan, ipò ìbéèrè olùtà àti ìfiránṣẹ́ owó tó ń dúró máa farahàn níbí nígbà tí ìṣe bá pọn dandan.",
        ariaLabel: "Ọ̀ràn Marketplace tó ń ṣiṣẹ́",
        emptyTitle: "Kò sí ohun tó pọn dandan",
        emptyBody: "Gbogbo ìgbòkègbodò marketplace rẹ ń lọ déédéé — kò sí ariyanjiyan ṣíṣí, kò sí ìfiránṣẹ́ owó nínú ìyẹ̀wò, àti (bí ó bá kan) ìbéèrè olùtà rẹ ti yọ̀ǹda.",
      },
      orders: {
        title: "Ìbéèrè laipẹ́",
        empty: "Ìbéèrè tí a gbé lórí Marketplace ń farahàn níbí ní àkókò gidi.",
        metaTemplateSingular: "Ìbéèrè {count} · tuntun lóòkan",
        metaTemplatePlural: "Ìbéèrè {count} · tuntun lóòkan",
        emptyTitle: "Kò sí ìbéèrè",
        emptyBody: "Gbé ìbéèrè àkọ́kọ́ rẹ lórí HenryCo Marketplace — ipò ìbéèrè, ipò ìsanwó àti àtẹ̀lé ọ̀tọ̀ọ̀tọ̀ máa balẹ̀ níbí lálárínrín.",
        ariaLabel: "Ìbéèrè laipẹ́",
      },
      activity: {
        title: "Ìgbòkègbodò laipẹ́",
        empty: "Àfikún ipò, ìsanwó àti àyẹ̀wò ń ṣàfihàn níbí bí wọ́n ṣe ń ṣẹlẹ̀.",
        metaTemplateSingular: "Àfikún {count} · tuntun lóòkan",
        metaTemplatePlural: "Àfikún {count} · tuntun lóòkan",
        emptyTitle: "Kò sí ìgbòkègbodò marketplace",
        emptyBody: "Ìjẹ́rìí ìbéèrè, àfikún ariyanjiyan àti àbájáde ìfiránṣẹ́ owó olùtà máa farahàn níbí bí wọ́n ṣe ń ṣẹlẹ̀.",
        ariaLabel: "Ìgbòkègbodò Marketplace",
      },
    },
    matters: {
      disputes: {
        kicker: "Ariyanjiyan",
        titleTemplateSingular: "Ọ̀ràn {count} nílò ìṣe",
        titleTemplatePlural: "Ọ̀ràn {count} nílò ìṣe",
        bodyLatestTemplate: "Tuntun: {ref} · ti dájú {stamp}",
        bodyFallback: "Ṣí ìlà náà láti fi ẹ̀rí kún.",
        cta: "Ṣàyẹ̀wò ọ̀ràn",
      },
      application: {
        kicker: "Ìbéèrè olùtà",
        bodyWithStoreTemplate: "Ilé-ìtajà: {name}",
        bodyDefault: "Ìbéèrè wà ní ìlà àyẹ̀wò HenryCo.",
        bodyReviewSuffixTemplate: " · {note}",
        cta: "Wo ipò",
        defaultStatus: "fi sílẹ̀",
      },
      payouts: {
        kicker: "Ìfiránṣẹ́ owó nínú àyẹ̀wò",
        titleTemplate: "{amount} ń dúró",
        bodyTemplateSingular: "Ìbéèrè {count} ń dúró fún ìjẹ́rìí inúná.",
        bodyTemplatePlural: "Ìbéèrè {count} ń dúró fún ìjẹ́rìí inúná.",
        cta: "Ṣí ààyè olùtà",
      },
    },
    orders: {
      rowTitleTemplate: "Ìbéèrè {orderNo}",
      rowSubTemplate: "{amount} · gbé {stamp}",
      rowAriaLabelTemplate: "Ìbéèrè {orderNo} · {status}",
      statusFallbackDraft: "Àkọsílẹ̀",
    },
    statusValueLabels: {
      delivered: "Jíṣẹ́",
      completed: "Parí",
      customer_confirmed: "Onírà jẹ́rìí",
      fulfilled: "Mú ṣẹ",
      cancelled: "Sọ asánsán",
      refunded: "Padà owó",
      disputed: "N’ariyanjiyan",
      exception: "Ìyàtọ̀",
      placed: "Gbé sí",
      paid: "San",
      awaiting_fulfilment: "Ń dúró ìmúṣẹ",
      confirmed: "Jẹ́rìí",
      queued: "Wà ní ìlà",
    },
    applicationStatusLabels: {
      submitted: "fi sílẹ̀",
      under_review: "n’àyẹ̀wò",
      approved: "yọ̀ǹda",
      rejected: "kọ̀",
      pending_documents: "ìwé tó ń dúró",
      changes_requested: "a béèrè àyípadà",
    },
    formatLabels: {
      dash: "—",
    },
  },
  divisionLearn: {
    metadata: {
      title: "Learn · pátákó ìkẹ́kọ̀ọ́",
      description: "Tọpinpin gbogbo ìforúkọsílẹ̀ HenryCo Learn, ẹ̀kọ́, èsì ìdánwò, ìwé ẹ̀rí, ìdánilẹ́kọ̀ọ́ tí a yàn sí ọ, àti ìbéèrè ìkẹ́kọ̀ọ́ tí a so mọ́ àkáńtì yìí — kátálọ́gì lórí Learn, ìlọsíwájú máa fihàn níbí.",
    },
    hero: {
      ariaLabel: "Ìwòye Learn",
      eyebrow: "Learn · láàyè",
      sideKicker: "Bí yàrá yìí ṣe ń ṣiṣẹ́",
      sideTitle: "Kátálọ́gì lórí Learn, ìlọsíwájú níbí.",
      sideBody: "Gbogbo ẹ̀kọ́, ìdánwò àti ìwé ẹ̀rí láti HenryCo Learn ń bára wọn pé sí yàrá yìí — bẹ̀rẹ̀ ibi tí o ti dúró sí, wo ìlọsíwájú rẹ ní wíwo kan, kí o sì pa àwọn ẹ̀rí rẹ mọ́ ní ibi kan ṣoṣo.",
      breakdownLabel: "Nípa ipò",
      breakdownAriaLabel: "Pípín ìṣẹ́ṣẹ́ ìkẹ́kọ̀ọ́",
      tilesAriaLabel: "Ìṣẹ́ṣẹ́ ìkẹ́kọ̀ọ́",
      tileLabels: {
        active: "Lóorí",
        completed: "Ti parí",
        certificates: "Àwọn ìwé ẹ̀rí",
        assignments: "Tí a yàn",
      },
      tileFoot: {
        activeEmpty: "Forúkọsílẹ̀ kí o bẹ̀rẹ̀ ìdánilẹ́kọ̀ọ́",
        activeWith: "Ìlọsíwájú ẹ̀kọ́ àti ìdánwò máa fihàn níbí",
        completedEmpty: "Àwọn ètò tí o pari máa fihàn níbí",
        completedWith: "Wúlò fún CV àti ìròyìn",
        certificatesEmpty: "Gba ọ̀kan nípa pípari ìdánilẹ́kọ̀ọ́",
        certificatesWith: "Àwọn ìjápọ̀ tí a lè jẹ́rìí fún ẹ̀rí kọ̀ọ̀kan",
        assignmentsEmpty: "Kò sí ohunkóhun tí a yàn nísinsìnyí",
        assignmentsWith: "Láti ọ̀dọ̀ alábòójútó tàbí ẹgbẹ́ rẹ",
      },
      breakdownNames: {
        active: "Lóorí",
        assigned: "Tí a yàn",
        certificates: "Àwọn ìwé ẹ̀rí",
        saved: "Tí a fipamọ́",
      },
      openLearnCta: "Ṣí HenryCo Learn",
      applyToTeachCta: "Béèrè láti kọ́ni",
      state: {
        empty: {
          headline: "Bẹ̀rẹ̀ ìrìnàjò HenryCo Learn rẹ.",
          blurb: "Wo kátálọ́gì, forúkọsílẹ̀ fún ìdánilẹ́kọ̀ọ́, kí gbogbo ẹ̀kọ́, ìdánwò àti ìwé ẹ̀rí máa fúnra wọn bára wọn pé sí yàrá yìí.",
        },
        active: {
          headlineTemplateSingular: "Ìdánilẹ́kọ̀ọ́ {count} ṣì ń lọ.",
          headlineTemplatePlural: "Àwọn ìdánilẹ́kọ̀ọ́ {count} ṣì ń lọ.",
          blurb: "Bẹ̀rẹ̀ ibi tí o ti dúró sí — ẹ̀kọ́, ìdánwò, ìwé ẹ̀rí àti ìdánilẹ́kọ̀ọ́ tí a yàn ń bára wọn pé láti HenryCo Learn sí yàrá yìí.",
        },
        calm: {
          headlineTemplateSingular: "Ìdánilẹ́kọ̀ọ́ {count} ti parí.",
          headlineTemplatePlural: "Àwọn ìdánilẹ́kọ̀ọ́ {count} ti parí.",
          blurb: "Àwọn ẹ̀rí rẹ àti ìtàn ìkẹ́kọ̀ọ́ rẹ máa wà níbí, wúlò fún CV, ìròyìn inú, tàbí àkọsílẹ̀ tirẹ.",
        },
      },
    },
    sections: {
      coursesTitle: "Tẹ̀síwájú láti kọ́",
      coursesMetaEmpty: "Wo kátálọ́gì HenryCo Learn láti forúkọsílẹ̀ fún ìdánilẹ́kọ̀ọ́ àkọ́kọ́ rẹ.",
      coursesMetaTemplate: "{active} lóorí · {completed} ti parí",
      extrasTitle: "Àwọn ẹ̀rí, ìdánilẹ́kọ̀ọ́ tí a yàn àti kíkọ́ni",
      extrasMeta: "Àwọn ìwé ẹ̀rí, ìdánilẹ́kọ̀ọ́ tí a yàn, ìdánilẹ́kọ̀ọ́ tí a fipamọ́ àti ìbéèrè olùkọ́ wà níbí.",
      activityTitle: "Ìṣẹ́ṣẹ́ tuntun",
      activityMetaTemplateSingular: "Ìmúdójúìwọ̀n {count} · tuntun jùlọ ní àkọ́kọ́",
      activityMetaTemplatePlural: "Àwọn ìmúdójúìwọ̀n {count} · tuntun jùlọ ní àkọ́kọ́",
      activityMetaEmpty: "Àwọn ẹ̀kọ́, ìdánwò, ìwé ẹ̀rí àti ìsanwó máa fihàn níbí lójú esan.",
    },
    empty: {
      coursesTitle: "Kò sí ìdánilẹ́kọ̀ọ́ tí a so pọ̀ síbẹ̀",
      coursesBody: "Wo kátálọ́gì lórí HenryCo Learn kí o sì forúkọsílẹ̀. Ipò rẹ máa fihàn níbí fúnra rẹ̀.",
      activityTitle: "Kò sí ìṣẹ́ṣẹ́ Learn síbẹ̀",
      activityBody: "Ìlọsíwájú ìdánilẹ́kọ̀ọ́, èsì ìdánwò, ìfúnni ní ìwé ẹ̀rí àti ìwé ẹ̀rí ìsanwó máa fihàn níbí lójú esan.",
    },
    courses: {
      ariaLabel: "Àwọn ìdánilẹ́kọ̀ọ́",
      completedAtTemplate: "Ti parí {date}",
      progressPercentTemplate: "{percent}% ti parí",
      statusDelimiter: " · ",
    },
    extras: {
      ariaLabel: "Àfikún Learn",
      certificatesTitle: "Àwọn ìwé ẹ̀rí",
      assignmentsTitle: "Ìkẹ́kọ̀ọ́ tí a yàn",
      savedTitle: "Àwọn ìdánilẹ́kọ̀ọ́ tí a fipamọ́",
      teachingTitle: "Kọ́ni pẹ̀lú HenryCo",
      statusLabel: "Ipò",
      expertiseLabel: "Ìmọ̀ pàtàkì",
      topicsLabel: "Àwọn àkọlé",
      openApplicationCta: "Ṣí ìbéèrè",
      applyToTeachCta: "Béèrè láti kọ́ni",
      teachingEmpty: "A ń ṣe àyẹ̀wò àwọn ìbéèrè olùkọ́ pẹ̀lú ọwọ́. Béèrè lórí HenryCo Learn, ipò máa bára pé sí ibí.",
    },
    activity: {
      ariaLabel: "Ìṣẹ́ṣẹ́ Learn",
      fallbackTitle: "Ìṣẹ́ṣẹ́ Learn",
    },
  },

  divisionStudio: {
    metadata: {
      title: "Studio · yara iṣẹ akanṣe",
      description: "Tọpa gbogbo ifowosowopo Studio HenryCo ti o so mọ akọọlẹ yii — awọn idamọran, awọn ami iyege, awọn isanwo, awọn ohun ifijiṣẹ, ati iṣẹ ni yara kanna.",
    },
    hero: {
      eyebrowLive: "Studio · n ṣiṣẹ",
      overviewAriaLabel: "Apejuwe Studio",
      activityAriaLabel: "Iṣẹ Studio",
      sideAriaLabel: "Bawo ni yara yii ṣe n ṣiṣẹ",
      sideLabel: "Bawo ni yara yii ṣe n ṣiṣẹ",
      sideTitle: "Yara akanṣe kan, ipo gidi.",
      sideBody: "Awọn idamọran, awọn ami iyege, awọn ẹri isanwo, awọn ohun ifijiṣẹ, ati awọn ami ibaraẹnisọrọ duro pẹlu idanimọ HenryCo kanna ti o n lo nibi gbogbo. Dasibodu ti o wa nisalẹ n ṣe afihan ilọsiwaju gidi ti ẹgbẹ Studio, kii ṣe akojọ ipo.",
      breakdownAriaLabel: "Pinpin iṣẹ",
      breakdownLabel: "Nipa ipo",
      tiles: {
        activeLabel: "Awọn iṣẹ akanṣe ti n ṣiṣẹ",
        activeFootEmpty: "Ko si yara iṣẹ ti n ṣiṣẹ lọwọlọwọ",
        activeFootHasValue: "Awọn yara ti n ṣiṣẹ pẹlu igbiyanju ifijiṣẹ",
        pendingLabel: "Awọn isanwo ti n duro",
        pendingFootEmpty: "Ọna iṣowo gba laaye",
        pendingFootHasValue: "Awọn aaye iṣayẹwo iṣowo ṣi wa ni ṣiṣi",
        proofLabel: "Awọn ẹri ti a fi silẹ",
        proofFootEmpty: "Ko si ohun ti n duro de atunyẹwo",
        proofFootHasValue: "Awọn isanwo n duro de atunyẹwo Studio",
        deliverablesLabel: "Awọn ohun ifijiṣẹ",
        deliverablesFootEmpty: "Awọn faili han nibi nigbati Studio ba gbe wọn soke",
        deliverablesFootHasValue: "Awọn faili ati awọn abajade ni a tọpa ni aaye kan",
      },
      breakdown: {
        active: "N ṣiṣẹ",
        readyReview: "Ṣetan fun atunyẹwo",
        pendingPayment: "Isanwo n duro",
        proofSubmitted: "Ẹri fi silẹ",
      },
      state: {
        empty: {
          headline: "Bẹrẹ brief Studio kan.",
          blurb: "Nigbati idamọran tabi iṣẹ akanṣe ba bẹrẹ pẹlu idanimọ HenryCo rẹ, yara Studio ti a muṣiṣẹpọ yoo han nibi — awọn ami iyege, isanwo, awọn ohun ifijiṣẹ, ati igbesẹ atẹle papọ.",
          ctaPrimary: "Bẹrẹ brief",
          ctaSecondary: "Ṣii Studio",
        },
        attention: {
          headlineTemplateSingular: "{count} isanwo ti pẹ.",
          headlineTemplatePlural: "{count} awọn isanwo ti pẹ.",
          blurb: "Aaye iṣayẹwo isanwo kan ti pẹ. Ṣii yara iṣẹ lati gbe ẹri soke tabi kan si ẹgbẹ Studio.",
          ctaPrimary: "Ṣii isanwo",
          ctaSecondary: "Ṣii Studio",
        },
        activeReady: {
          headlineTemplateSingular: "{count} iṣẹ akanṣe ṣetan fun atunyẹwo.",
          headlineTemplatePlural: "{count} awọn iṣẹ akanṣe ṣetan fun atunyẹwo.",
          blurb: "Awọn ohun ifijiṣẹ ati awọn atunṣe n duro de ifọwọsi rẹ. Ṣii yara iṣẹ lati ṣe atunyẹwo ati ṣii ami iyege t’o tẹle.",
          ctaPrimary: "Ṣii awọn iṣẹ akanṣe",
          ctaSecondary: "Ṣii Studio",
        },
        activeProjects: {
          headlineTemplateSingular: "{count} iṣẹ akanṣe n ṣiṣẹ.",
          headlineTemplatePlural: "{count} awọn iṣẹ akanṣe n ṣiṣẹ.",
          blurb: "Awọn yara ti n ṣiṣẹ pẹlu igbiyanju ami iyege, awọn aaye iṣayẹwo isanwo, ati awọn ohun ifijiṣẹ — gbogbo wọn ni a fihan lati HenryCo Studio sinu yara yii.",
          ctaPrimary: "Ṣii Studio",
          ctaSecondary: "Bẹrẹ brief tuntun",
        },
        calm: {
          headlineTemplateSingular: "{count} yara iṣẹ akanṣe wa ninu igbasilẹ.",
          headlineTemplatePlural: "{count} awọn yara iṣẹ akanṣe wa ninu igbasilẹ.",
          blurb: "Gbogbo ifowosowopo Studio ti o ti bẹrẹ ri — awọn idamọran, awọn ami iyege, awọn isanwo, awọn ohun ifijiṣẹ — ti a tọju ni yara kan fun isale-itẹlera kiakia.",
          ctaPrimary: "Ṣii Studio",
          ctaSecondary: "Bẹrẹ brief tuntun",
        },
      },
    },
    sections: {
      projectsTitle: "Awọn yara iṣẹ akanṣe",
      projectsAriaLabel: "Awọn iṣẹ akanṣe Studio",
      projectsMetaEmpty: "Awọn yara iṣẹ han nibi nigbati ifowosowopo Studio ba bẹrẹ.",
      projectsMetaTemplateSingular: "{count} iṣẹ akanṣe · ṣe lẹsẹsẹ nipa iṣipopada tuntun",
      projectsMetaTemplatePlural: "{count} awọn iṣẹ akanṣe · ṣe lẹsẹsẹ nipa iṣipopada tuntun",
      paymentsTitle: "Awọn aaye iṣayẹwo isanwo",
      paymentsAriaLabel: "Awọn isanwo Studio",
      paymentsMetaEmpty: "Awọn ibeere isanwo Studio han nibi nigbati idamọran tabi iṣẹ akanṣe ba bẹrẹ.",
      paymentsMetaTemplateSingular: "{count} aaye iṣayẹwo · ifiweranṣẹ ẹri ati ipo ifọwọsi",
      paymentsMetaTemplatePlural: "{count} awọn aaye iṣayẹwo · ifiweranṣẹ ẹri ati ipo ifọwọsi",
      activityTitle: "Iṣẹ aipẹ",
      activityAriaLabel: "Iṣẹ Studio",
      activityMetaEmpty: "Awọn imudojuiwọn iṣẹ akanṣe, awọn ẹri isanwo, ati awọn ifọwọsi ami iyege ni a fihan nibi.",
      activityMetaTemplateSingular: "{count} imudojuiwọn · tuntun julọ ni akọkọ",
      activityMetaTemplatePlural: "{count} awọn imudojuiwọn · tuntun julọ ni akọkọ",
    },
    empty: {
      projectsTitle: "Ko si yara Studio ti a so mọ sibẹsibẹ",
      projectsBody: "Ni kete ti a ba ṣẹda idamọran tabi iṣẹ akanṣe pẹlu idanimọ HenryCo rẹ, yara Studio ti a muṣiṣẹpọ yoo han nibi — awọn ami iyege, isanwo, awọn ohun ifijiṣẹ, ati igbesẹ atẹle.",
      paymentsTitle: "Ko si aaye iṣayẹwo isanwo sibẹsibẹ",
      paymentsBody: "Awọn ami iyege iṣowo — ifiranṣẹ, agbedemeji iṣẹ akanṣe, ati ifijiṣẹ — n han nibi ni kete ti idamọran ba bẹrẹ pẹlu rẹ.",
      activityTitle: "Ko si iṣẹ Studio sibẹsibẹ",
      activityBody: "Awọn imudojuiwọn iṣẹ akanṣe, awọn ẹri isanwo, awọn idasilẹ ohun ifijiṣẹ, ati awọn ifọwọsi ami iyege yoo han nibi bi wọn ṣe n ṣẹlẹ.",
    },
    projects: {
      listAriaLabel: "Awọn iṣẹ akanṣe Studio",
      fallbackSubtitle: "Studio n murasilẹ imudojuiwọn t’o tẹle.",
      milestonesTemplate: "{approved}/{total} awọn ami iyege",
      paymentsTemplateSingular: "{count} isanwo ṣiṣi",
      paymentsTemplatePlural: "{count} awọn isanwo ṣiṣi",
      deliverablesTemplateSingular: "{count} ohun ifijiṣẹ",
      deliverablesTemplatePlural: "{count} awọn ohun ifijiṣẹ",
      updatedTemplate: "Imudojuiwọn {stamp}",
      rowAriaLabelTemplate: "{title} · {kind}",
      fallbackStamp: "—",
    },
    projectKindLabels: {
      live: "N ṣiṣẹ",
      ready_review: "Ṣetan fun atunyẹwo",
      scheduled: "Ti ṣeto",
      delivered: "Ti firanṣẹ",
      issue: "Iṣe nilo",
    },
    payments: {
      listAriaLabel: "Awọn isanwo Studio",
      rowAriaLabelTemplate: "{label} · {status}",
      dueTemplate: "Ọjọ ipari {stamp}",
      updatedTemplate: "Imudojuiwọn {stamp}",
      subTemplate: "{amount} · {method} · {due}",
    },
    paymentStatusLabels: {
      pending: "n duro",
      paid: "ti sanwo",
      approved: "ti fọwọsi",
      settled: "ti yanju",
      proof_uploaded: "ẹri ti gbejade",
      proof_submitted: "ẹri ti fi silẹ",
      in_review: "ninu atunyẹwo",
      rejected: "ti kọ",
      overdue: "ti pẹ",
      failed: "ti kuna",
      pending_deposit: "ifiranṣẹ n duro",
    },
    activity: {
      listAriaLabel: "Iṣẹ Studio",
      rowAriaLabelTemplate: "{title} · {stamp}",
    },
  },
  divisionLogistics: {
    metadata: {
      title: "Èro̩ ọkọ̀ · ìfijíṣẹ́ àti àkànlò",
      description: "Gbogbo gbígbé, ìfijíṣẹ́, ETA àti ẹ̀rí ìfijíṣẹ́ HenryCo Logistics tí a so mọ́ àkántì yìí — tó ń farahàn láti orí nẹ́tíwọ́ọ̀kì èro̩ ọkọ̀ sínú yàrá ìdákẹ́jẹ́ẹ́ ọ̀kan.",
    },
    hero: {
      ariaLabel: "Àkópọ̀ èro̩ ọkọ̀",
      eyebrow: "HenryCo Èro̩ ọkọ̀",
      brand: "HenryCo Èro̩ ọkọ̀",
      title: "Gbogbo ìpamọ́, yàrá kan ṣoṣo.",
      body: "Gbígbé, ìfijíṣẹ́, ETA àti ẹ̀rí ìfijíṣẹ́ — gbogbo wọn ń farahàn láti orí nẹ́tíwọ́ọ̀kì èro̩ ọkọ̀ sínú àkántì rẹ. Búkù lẹ́ẹ̀kan ní",
      bodyDomain: " logistics.henrycogroup.com",
      ctaNewDelivery: "Ìfijíṣẹ́ tuntun",
    },
    metrics: {
      ariaLabel: "Ìṣẹ̀ṣe èro̩ ọkọ̀",
      activeNowLabel: "Ń ṣiṣẹ́ báyìí",
      activeFootSingular: "àkànlò ní ọ̀nà",
      activeFootPlural: "àkànlò ní ọ̀nà",
      deliveredMonthLabel: "A fi jíṣẹ́ · oṣù yìí",
      deliveredMonthFootTemplate: "{count} lápapọ̀",
      onTimeRateLabel: "Ìwọ̀n àkókò",
      onTimeRateFootEmpty: "Ń dúró de ìfijíṣẹ́ àkọ́kọ́ tí a ṣètò",
      onTimeRateFootHasValue: "Lára àwọn ìfijíṣẹ́ tí a ṣètò",
      totalSpendLabel: "Iye ìnáwó",
      totalSpendFoot: "Tí a san láìpé",
    },
    map: {
      noShipmentsAriaLabel: "Kò sí àkànlò síbẹ̀",
      noShipmentsTitle: "Máàpù rẹ yóò tan nígbà tí o bá búkù ìfijíṣẹ́ àkọ́kọ́",
      noShipmentsBody: "Gbígbé àti ìfijíṣẹ́ tí ń ṣiṣẹ́ kọ̀ọ̀kan máa ń kọ̀wé síhìn-ín lọ́nà ìṣẹ̀dálẹ̀. Búkù lẹ́ẹ̀kan tí àkànlò rẹ yóò farahàn láti orí ojú-ìwé èro̩ ọkọ̀.",
      noShipmentsCta: "Búkù ìfijíṣẹ́",
      pendingAriaLabel: "Ìfihàn máàpù",
      pendingTitle: "Ìṣàmúrasílẹ̀ ipò ń lọ",
      pendingBody: "Àkànlò rẹ tó ń ṣiṣẹ́ yóò farahàn lórí máàpù gbàrà tí àwọn dispatch bá ti tóójú àwọn àdírẹ́ẹ̀sì gbígbé àti ìfijíṣẹ́.",
      activeAriaLabel: "Máàpù àkànlò tó ń ṣiṣẹ́",
      altTemplateSingular: "Máàpù tó ń fi {count} àmì gbígbé àti ìfijíṣẹ́ hàn",
      altTemplatePlural: "Máàpù tó ń fi {count} àmì gbígbé àti ìfijíṣẹ́ hàn",
      liveBadgeTemplateSingular: "Láàyè · àkànlò {count} ń ṣiṣẹ́",
      liveBadgeTemplatePlural: "Láàyè · àkànlò {count} ń ṣiṣẹ́",
    },
    sections: {
      activeTitle: "Ní ọ̀nà báyìí",
      activeMetaTemplate: "{count} ń ṣiṣẹ́ · ó ń sopọ̀ ara láti orí èro̩ ọkọ̀",
      activeRailAriaLabel: "Àkànlò tó ń ṣiṣẹ́",
      emptyAriaLabel: "Kò sí àkànlò tó ń ṣiṣẹ́",
      emptyTitle: "Kò sí àkànlò tó ń ṣiṣẹ́",
      emptyBody: "Àwọn ìfijíṣẹ́ rẹ tó ti kọjá wà nísàlẹ̀. Búkù òmíràn, yóò sì farahàn níhìn-ín gbàrà tí òṣìṣẹ́ bá ti fọwọ́ sí gbígbé.",
      actionsTitle: "Bẹ̀rẹ̀ ìfijíṣẹ́",
      actionsMeta: "Ọ̀nà yíyára sí ọ̀pọ̀lọpọ̀ ìṣàn",
      actionsAriaLabel: "Ìṣe yíyára èro̩ ọkọ̀",
      recentTitle: "Tí a fi jíṣẹ́ láìpẹ́",
      recentMetaTemplate: "{recent} tó kẹ́yìn nínú {lifetime} lápapọ̀",
      recentAriaLabel: "Ìfijíṣẹ́ àìpẹ́",
      spendTitle: "Ìnáwó · oṣù 6 tó kọjá",
      spendMeta: "Tí a san nìkan",
      spendFigureAriaLabelTemplate: "Ìnáwó èro̩ ọkọ̀ nínú oṣù 6 tó kọjá",
    },
    statusLabels: {
      quoteRequested: "Ìpèsè iye owó ń dúró",
      quoteSent: "Ìpèsè iye owó ti ṣetán",
      pendingPayment: "Ń dúró de ìsanwó",
      scheduled: "Ti ṣètò",
      assigned: "Òṣìṣẹ́ ti yàn",
      pickupConfirmed: "Ti gbé",
      inTransit: "Ní ọ̀nà",
      delayed: "Pẹ́",
      attemptedDelivery: "A gbìyànjú ìfijíṣẹ́",
      delivered: "A fi jíṣẹ́",
      completed: "A parí",
      closed: "Ti pa",
      cancelled: "A fagilé",
      refunded: "A san padà",
    },
    urgencyLabels: {
      standard: "Àpẹẹrẹ",
      sameDay: "Ọjọ́ kan náà",
      express: "Yíyára",
      nextDay: "Ọjọ́ tó kàn",
    },
    serviceLabels: {
      scheduled: "Ti ṣètò",
      sameDay: "Ọjọ́ kan náà",
      interCity: "Láàrin ìlú",
      bulk: "Lọ́pọ̀",
    },
    shipment: {
      trackingCodeAriaTemplate: "Kóòdù àfọ́nà {code}",
      addressPending: "Àdírẹ́ẹ̀sì ń dúró",
      etaPending: "ETA ń dúró",
      trackCta: "Tẹ̀lé àkànlò",
      openTrackingAriaTemplate: "Ṣí àfọ́nà fún {code}",
      etaAriaTemplate: "ETA {eta}",
      etaMinutesInTemplate: "ní ìṣẹ́jú {minutes}",
      etaMinutesOverdueTemplate: "ìṣẹ́jú {minutes} ti kọjá",
      etaHoursInTemplate: "ní wákàtí {hours}",
      etaHoursOverdueTemplate: "wákàtí {hours} ti kọjá",
      detailSeparator: " · ",
    },
    timeline: {
      ariaLabel: "Ìfijíṣẹ́ àìpẹ́",
      deliveredToTemplate: "A fi jíṣẹ́ {name}",
      receiptCta: "Ìwé ìgbàwọlé",
    },
    quickActions: {
      ariaLabel: "Ìṣe yíyára èro̩ ọkọ̀",
      bookLabel: "Búkù ìfijíṣẹ́",
      bookDesc: "Gbígbé àti ìfijíṣẹ́ nínú ìṣàn ìtọ́sọ́nà kan ṣoṣo.",
      trackLabel: "Tẹ̀lé pẹ̀lú kóòdù",
      trackDesc: "Ipò láàyè, ETA àti àyíká òṣìṣẹ́.",
      quoteLabel: "Kọ́kọ́ béèrè iye owó",
      quoteDesc: "Iye àpẹẹrẹ kí ó tó ṣèdíwọ̀.",
      addressesLabel: "Àdírẹ́ẹ̀sì tí a fi pamọ́",
      addressesDesc: "Ìbáraẹnisọ̀rọ̀ gbígbé àti ìfijíṣẹ́.",
      invoicesLabel: "Ìwé ìgbàwọlé àti ìwé ìbéèrè",
      invoicesDesc: "PDF tí a fi àmì lé fún àkànlò kọ̀ọ̀kan.",
      supportLabel: "Ìtìlẹ́yìn èro̩ ọkọ̀",
      supportDesc: "Ṣí ìjíròrò tí a so mọ́ àkántì rẹ.",
    },
    spend: {
      figureAriaLabel: "Ìnáwó èro̩ ọkọ̀ nínú oṣù 6 tó kọjá",
      emptyTick: "—",
    },
  },
  settings: {
    pageTitle: "Àwọn Ètò àti Àyàn",
    pageDescription:
      "Ṣàkóso profáìlì rẹ, àyàn ìbáraẹnisọ̀rọ̀, àkóso àṣírí, àti àwọn ọ̀nà ìbéèrè data ọwọ́.",
    profileSectionKicker: "Ìwífún Profáìlì",
    notificationsSectionKicker: "Àyàn Ìfitónilétí",
  },
  addresses: {
    metadata: {
      title: "Àwọn àdírẹ́sì",
      description:
        "Ṣàkóso àwọn àdírẹ́sì tí o ti fipamọ́ (ilé, ọ́fíìsì, ṣọ́ọ̀bù…) — a lò ó ní ìfijíṣẹ́, ìpèsè, àti ìjẹ́rìí KYC.",
    },
    hero: {
      title: "Àwọn àdírẹ́sì",
      description:
        "Ṣàkóso àwọn àdírẹ́sì tí o ti fipamọ́ (ilé, ọ́fíìsì, ṣọ́ọ̀bù…) — a lò ó ní ìfijíṣẹ́, ìpèsè, àti ìjẹ́rìí KYC.",
    },
    card: {
      defaultBadge: "Aṣàfihàn",
      kycVerifiedBadge: "KYC ti jẹ́rìsí",
      setDefaultCta: "Ṣe àfihàn",
      editCta: "Ṣàtúnṣe",
      deleteCta: "Pa rẹ́",
    },
    deleteConfirm: {
      prompt: "Pa àdírẹ́sì yìí rẹ́? A kò lè dá a padà.",
      confirmCta: "Pa rẹ́",
      cancelCta: "Fagilee",
    },
    empty: {
      body:
        "O kò tíì fi àdírẹ́sì kankan kún. Fi àkọ́kọ́ rẹ kún kí ìpari rírà yá ní gbogbo HenryCo.",
    },
    add: {
      cta: "Fi àdírẹ́sì kún",
      formTitle: "Fi àdírẹ́sì tuntun kún",
      editFormTitleTemplate: "Ṣàtúnṣe {label}",
      maxedNoticeTemplate:
        "O ti fi opin {count} oríṣi àdírẹ́sì (ilé, ọ́fíìsì, ṣọ́ọ̀bù, ilé ìpamọ́, mìíràn 1, mìíràn 2) kún. Ṣàtúnṣe tàbí pa ọ̀kan rẹ́ láti fi mìíràn kún.",
    },
  },
  search: {
    metadata: {
      title: "Wá Akọọlẹ",
      description: "Wá àwọn ọ̀nà iṣẹ́ akọọlẹ HenryCo àti àwọn ọ̀nà ìpín tí a so pọ̀.",
    },
    hero: {
      title: "Wá àwọn ọ̀nà iṣẹ́ HenryCo rẹ.",
      description:
        "Lọ tààrà sí àwọn iṣẹ́ akọọlẹ tó pé àti àwọn ọ̀nà ìpín tí a so pọ̀, láìpadà sí àwọn ìbẹ̀tẹ̀ gbogbogbò.",
    },
    placeholder: "Wá akọọlẹ: àwọn ìfitónilétí, àpamọ́, ìwé owó, atilẹyin, Jobs ìbéèrè...",
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
    smartHomeEmptyFallback:
      "Barka da zuwa — fara da ƙaramin mataki na farko. Sigina kai tsaye naka za su bayyana a nan da zarar wani aiki ya zo.",
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
    priorityFallback: {
      low: "Shirun",
      normal: "Na yau da kullum",
      high: "Babba",
      urgent: "Gaggawa",
    },
    eyebrow: "Layin aiki · kai tsaye",
    guidanceTitle: "Layi ɗaya, kowace sashe.",
    overviewAria: "Kallon ayyuka",
    volumeAria: "Yawan ayyuka",
    pendingAria: "Ayyuka da ke jira",
    sideAria: "Yadda layin ke aiki",
    bySource: "Bisa tushe",
    openTotalLabel: "Adadin buɗe",
    nothingBlocking: "Babu abin da ke toshe a yanzu",
    resolveBlockers: "Warware don buɗe sauran hanyoyi",
    routine: "na yau da kullum",
    divisionRepresentedSingular: "Sashe {count} aka wakilta",
    divisionRepresentedPlural: "Sassa {count} aka wakilta",
    headlineEmpty: "Babu komai a layi.",
    headlineBlockerSingular: "Toshi {count} yana buƙatar warwarewa.",
    headlineBlockerPlural: "Toshe-toshe {count} suna buƙatar warwarewa.",
    headlineUrgentSingular: "Aiki na gaggawa {count} don kammala.",
    headlineUrgentPlural: "Ayyuka na gaggawa {count} don kammala.",
    headlineActiveSingular: "Aiki {count} don gudanarwa.",
    headlineActivePlural: "Ayyuka {count} don gudanarwa.",
    headlineCalmSingular: "Abu {count} a layinka.",
    headlineCalmPlural: "Abubuwa {count} a layinka.",
    blurbEmpty: "Asusunka yana cikin tsari — tabbatarwa, biyan kuɗi, da hanyoyi masu mahimmancin sake duba duk sun share. Za mu nuna mataki na gaba a nan kai tsaye lokacin da ya bayyana.",
    blurbRisk: "Wadannan abubuwa suna toshe ayyukan amana mafi girma a HenryCo — fitar da kuɗi daga jakar, amincewar mai siyarwa na Marketplace, tabbatar da mai aiki. Warware su yana buɗe kowace hanya.",
    blurbActive: "Kowane layi yana kai ka zuwa aiki na gaba da taɓawa ɗaya. Tace, alamomin fifiko, da hanyoyin haɗi sun kasance daidai a duk sassan HenryCo.",
    metaEmpty: "Ka share. Duk wani sabon abu zai bayyana a nan da zarar ya iso.",
    metaCount: "{count} buɗe · an tsara su bisa fifiko da yanayin toshewa.",
  },
  security: {
    title: "Tsaro",
    description: "Duba ayyukan tsaro na kwanan nan, canza kalmar sirri, kuma ƙare zaman HenryCo idan ya zama dole.",
    heroAriaLabel: "Kallon tsaro",
    hero: {
      trustScoreLabel: "Makin amana",
      nextTierPrefix: "Na gaba ·",
      nextTierAriaTemplate: "Matsayi na gaba {tier}",
      accountActiveSingularTemplate: "Asusu na aiki kwana {days}",
      accountActivePluralTemplate: "Asusu na aiki kwanaki {days}",
      flaggedEventsSingularTemplate: "Lamarin {count} da aka yi wa alama a fayil · duba ƙasa",
      flaggedEventsPluralTemplate: "Lamura {count} da aka yi wa alama a fayil · duba ƙasa",
      statusEyebrow: {
        secure: "Tsaro da samun dama · amintacce",
        watch: "Tsaro da samun dama · ana ba da shawarar aiki",
        risk: "Tsaro da samun dama · an yi wa alama",
      },
      statusHeadline: {
        secure: "Asusunka yana cikin tsaro.",
        watch: "Wasu matakai kaɗan za su ƙarfafa asusunka.",
        risk: "Mun yi wa wani aiki alama da yake buƙatar idanunka.",
      },
      statusBlurb: {
        secure: "Babu lamuran da ake tuhuma, tabbatarwa tana cikin koshin lafiya, kuma kowane aikin amana mafi girma da HenryCo ke bayarwa yana buɗe a gare ka.",
        watch: "Babu abin da ya karye — amma 'yan alamomi (tabbatar da imel, sake duba shaida, daidaita lambar tuntuɓa) za su ɗaga makin amanarka kuma su buɗe ƙarin hanyoyi.",
        risk: "An rarraba lamuran kwanan nan a matsayin haɗari mai girma. Duba rafin ayyukan da ke ƙasa kuma canza kalmar sirri idan wani abu ya yi maka kamar baƙo.",
      },
    },
    signalsTitle: "Alamomi",
    signalsMeta: "Abin da injinan tabbatarwa da makin namu ke gani a asusunka a yanzu.",
    signalsAriaLabel: "Alamomin tsaro",
    guideTitle: "Inda kake · abin da ke ci gaba da kai gaba",
    guideMetaTemplate: "Makin gaskiya, ba lambar talla ba. {tier}.",
    allLanesOpen: "Duk hanyoyi a buɗe",
    accountActionsTitle: "Ayyukan asusu",
    accountActionsMeta: "Sarrafawa na yau da kullum da kake yi kanka.",
    changePasswordTitle: "Canza kalmar sirrinka",
    signOutEverywhereTitle: "Fita daga ko'ina",
    suspiciousEventFoot: "Duba rafin ayyukan da ke ƙasa.",
    noSuspiciousEventFoot: "Babu abin da aka yi wa alama a cikin taga sake duba na ƙarshe.",
    activityAriaLabel: "Lamuran tsaro na kwanan nan",
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
  messages: {
    metadata: {
      title: "Saƙonni · HenryCo",
      description:
        "Akwati ɗaya na saƙonni don tallafi, kasuwa, ayyuka, studio, kulawa, kadara, kayan aiki da koyo.",
    },
    hero: {
      eyebrow: "HenryCo · akwati ɗaya na saƙonni",
      ariaLabel: "Bayyani na akwatin saƙonni",
      ariaTiles: "Yawan saƙonnin akwati",
      ariaSide: "Ta portal",
      sideLabel: "Ta portal",
      sideBody:
        "Kowane portal yana ciyar da wannan akwati guda. Tallafi, umarnin kasuwa, hira ta aiki, ayyukan studio da rajistar kulawa duka suna bayyana a nan a tsarin lokaci.",
    },
    headlines: {
      zero: "Akwatin saƙonni babu kome a duk HenryCo.",
      calmOne: "Zare ɗaya yana jiranka.",
      calmMany: "Zare {count} suna a buɗe.",
      busy: "{unread} ba a karanta ba · {open} a buɗe a portal ɗinka.",
      overloaded: "{unread} ba a karanta ba a cikin zare {open} da suka buɗe.",
    },
    blurbs: {
      zero: "An tabbatar da komai — tallafi, kasuwa, ayyuka, studio, kulawa, kadara, kayan aiki da koyo.",
      calm: "Amsa gajeriyar yanzu zai rufe da'irar kafin gobe.",
      busy: "Latsa layi don buɗe zare, ko tace portal ɗaya a lokaci.",
      overloaded: "Bi sassan ɗaya bayan ɗaya — zare na ƙarshe a saman.",
    },
    tiles: {
      openLabel: "A buɗe",
      openFootEmpty: "Babu mai gudana",
      openFootActive: "Zare suna jiran motsi",
      unreadLabel: "Ba a karanta ba",
      unreadFootEmpty: "Akwatin saƙonni ya cika",
      unreadFootActive: "Latsa layi don buɗe zare",
      portalsLabel: "Portal",
      portalsFootEmpty: "Kulawa, Kasuwa, Studio, Ayyuka da sauransu",
      portalsFootSingular: "Sashe ɗaya na aiki",
      portalsFootPlural: "Sassa {count} sun wakilta",
    },
    sideTitle: {
      empty: "Shiru a duk sassan",
      singular: "Sashe ɗaya na da motsi",
      plural: "Sassa {count} sun haɗu",
    },
    section: {
      title: "Zare",
      ariaLabel: "Zare na akwatin saƙonni",
      metaEmpty: "Babu kome a nan tukuna — kowane portal yana ciyar da wannan akwati",
      metaSingular: "Zare {count}",
      metaPlural: "Zare {count}",
    },
    chips: {
      ariaLabel: "Tace akwatin saƙonni ta portal",
      allThreads: "Dukan zare",
    },
    empty: {
      eyebrow: "Akwatin saƙonni shiru",
      titleAll: "Babu wani abu da yake jiranka.",
      titleFilter: "Babu zare a wannan portal tukuna.",
      bodyAll:
        "Tallafi, kasuwa, ayyuka, studio, kulawa, kadara, kayan aiki da koyo duka suna bayyana a nan — duk wani cross-portal yana zuwa wannan jeri da zarar ya fara.",
      bodyFilter:
        "Sauya chip ɗin tace don ganin wani portal, ko duba duka zare don tabbatar ba a sa wani abu a jira ba.",
    },
    list: {
      unreadDotLabel: "Ba a karanta ba",
      fallbackTime: "—",
    },
    divisionLabels: {
      support: "Tallafi",
      marketplace: "Kasuwa",
      jobs: "Ayyuka",
      studio: "Studio",
      care: "Kulawa",
      property: "Kadara",
      logistics: "Kayan aiki",
      learn: "Koyo",
    },
  },
  wallet: {
    hero: {
      ariaLabel: "Ma'aunin walat",
      eyebrow: "Walat HenryCo · kai tsaye",
      availableLabel: "Ma'aunin da yake samuwa",
      balanceAriaTemplate: "Ma'aunin da yake samuwa {amount} {currency}",
      settlementFallback: "An sasanta shi cikin kuɗin gida a farashin HenryCo na yini.",
      ctas: { fund: "Ƙara kuɗi", withdraw: "Cire kuɗi" },
      tiles: {
        verifiedLabel: "Ma'aunin da aka tabbatar",
        verifiedFoot: "Ana iya amfani da shi a duk ayyukan HenryCo",
        pendingFundingLabel: "Kuɗin shigarwa da yake jiran",
        pendingFundingFoot: "Yana zama keɓe har sai sashin kuɗi ya tabbatar",
        pendingWithdrawalLabel: "An riƙe don cirewa",
        pendingWithdrawalFoot: "An ajiye har sai biyan kuɗi ya kammala",
      },
    },
    sections: {
      actionsTitle: "Ayyukan walat",
      actionsMeta: "Ƙarawa, cirewa, biyan kuɗi, daidaitawa",
      pendingTitle: "Ayyuka masu jira",
      pendingMeta: "Sun ware daga ma'aunin da yake samuwa",
      flowTitle: "Yadda kuɗinka ke gudana",
      flowMeta: "Kwana 30 da suka wuce · wata 6 da suka wuce · ta ɓangare",
      fundingTitle: "Buƙatun shigar da kuɗi na kwanan nan",
      fundingMetaTemplate: "{count} cikin bita",
      activityTitle: "Aiki",
      activityMetaTemplate: "Na ƙarshe {count}",
    },
    quickActions: {
      ariaLabel: "Ayyuka masu sauri na walat",
      addFundsLabel: "Ƙara kuɗi",
      addFundsDesc: "Canja-wuri ta banki tare da lodi shaida da tabbatar da nan take.",
      withdrawLabel: "Cire kuɗi",
      withdrawDesc: "Motsa ma'aunin da yake samuwa zuwa asusun banki da aka tabbatar.",
      paymentsLabel: "Biyan kuɗi",
      paymentsDesc: "Kuɗaɗen kwanan nan, mai dawowa da hanyoyin ajiya.",
      receiptsLabel: "Rasidoji & infwa'isoshi",
      receiptsDesc: "PDF masu alama a kowane ɓangare.",
    },
    pendingOps: {
      fundingKicker: "Kuɗin shigarwa da yake jiran",
      fundingDescEmpty: "Kuɗin da ka tura ya rage nan har sai sashin kuɗi ya tabbatar da bayanan banki.",
      fundingDescSingular: "{count} buƙata cikin bita — shaida tana sa layi ya gudana.",
      fundingDescPlural: "{count} buƙatu cikin bita — shaida tana sa layi ya gudana.",
      fundingCta: "Buɗe layin shigar da kuɗi",
      withdrawalKicker: "Cirewa da ke jira",
      withdrawalDescEmpty: "Cirewa suna jira nan yayin bitar — ma'aunin da yake samuwa ba a ƙaddamar da shi sau biyu ba.",
      withdrawalDescSingular: "{count} cirewa da ke jiran biyan kuɗi. An ajiye daga ma'aunin da yake samuwa.",
      withdrawalDescPlural: "{count} cirewa da ke jiran biyan kuɗi. An ajiye daga ma'aunin da yake samuwa.",
      withdrawalCta: "Buɗe layin cirewa",
    },
    spend: {
      figureAriaLabel: "Kashe kuɗi a watanni 6 da suka wuce",
      last30Eyebrow: "Kashe kuɗi · kwana 30 da suka wuce",
      byDivisionEyebrow: "Ta ɓangare",
      distributionAriaLabel: "Rabon kashe kuɗi ta ɓangare",
      trendFlat: "Daidai",
      trendBelowTemplate: "{pct}% ƙasa da kwana 30 da suka wuce",
      trendAboveTemplate: "{pct}% sama da kwana 30 da suka wuce",
      trendTitleTemplate: "vs kwana 30 da suka wuce (₦{amount})",
    },
    trust: {
      ariaLabel: "Shirye-shiryen cirewa",
      heading: "Shirye-shiryen cirewa",
      identityTitle: "An tabbatar da shaidar",
      identityDescDoneTemplate: "{label}. Ana buƙata don biyan cirewa.",
      identityDescTodoTemplate: "{label}. Kammala shi sau ɗaya don buɗe cirewa.",
      identityCta: "Ci gaba →",
      pinTitle: "PIN na cirewa",
      pinDescDone: "An saita PIN na cirewa.",
      pinDescTodo: "Saita PIN mai lambobi 4 don ba da izini ga kowace cirewa.",
      pinCta: "Saita PIN →",
      payoutTitle: "Hanyar biyan kuɗi",
      payoutDescSingular: "Hanya 1 da aka tabbatar tana cikin fayil.",
      payoutDescPluralTemplate: "{count} hanyoyi da aka tabbatar suna cikin fayil.",
      payoutDescEmpty: "Ƙara asusun banki don karɓar cirewa.",
      payoutCtaManage: "Sarrafa →",
      payoutCtaAdd: "Ƙara hanya →",
      verificationLabels: {
        verified: "An tabbatar da shaidar",
        pending: "Tabbatarwa cikin bita",
        rejected: "Tabbatarwa na buƙatar sake ƙaddamarwa",
        notSubmitted: "Ba a ƙaddamar da shaida ba tukuna",
      },
    },
    activity: {
      ariaLabel: "Cinikayya ta walat",
      emptyTitle: "Babu cinikayya tukuna",
      emptyBody: "Cika walat ɗinka, mai cin abinci na aiki zai nuna a nan kowane kuɗi, cire, mai dawowa da kyauta a duk ayyukan HenryCo.",
      fallbackTitle: "Cinikayyar walat",
    },
    funding: {
      proofUploaded: "An loda shaida",
      awaitingProof: "Ana jiran shaida",
      ariaLabelTemplate: "Buƙatar shigar da kuɗi {reference} don ₦{amount}",
    },
    statusLabels: {
      pending: "Ana jiran bita",
      awaiting_proof: "Ana jiran shaida",
      awaiting_review: "Ana jiran bita",
      in_review: "Cikin bita",
      rejected: "An ƙi",
      cancelled: "An soke",
      expired: "Ya ƙare",
      completed: "An tabbatar",
      verified: "An tabbatar",
      approved: "An amince",
      paid: "An biya",
    },
  },
  support: {
    metadata: {
      title: "Tallafi",
      description: "Sami taimako don kowane sabis na HenryCo.",
    },
    hero: {
      title: "Tallafi",
      description: "Sami taimako don kowane sabis na HenryCo.",
      newRequestCta: "Sabuwar buƙata",
    },
    summary: {
      openRequestsTemplate: "Buƙatu {count} a buɗe",
      escalatedTemplate: "{count} an ɗaga",
      escalationNote:
        "Ana bin diddigin kowane saƙo. Idan binciken farko ya kalli haɗari ko gaggawa, ma’aikata sukan sami layi mai fifiko ta atomatik.",
    },
    quickHelp: {
      helpCenterLabel: "Cibiyar Tallafi",
      helpCenterDesc: "Bincika FAQ da jagorori",
      contactLabel: "Tuntube Mu",
      contactDesc: "Tallafi ta imel ko waya",
      liveChatLabel: "Hira ta Kai Tsaye",
      liveChatDesc: "Yi hira da ƙungiyarmu",
    },
    threads: {
      sectionKicker: "Buƙatunku",
      emptyTitle: "Babu buƙatun tallafi",
      emptyDescription:
        "Ba ku kafa buƙatar tallafi ba tukuna. Muna nan don taimaka muku idan kuna buƙatar wani abu.",
      createCta: "Ƙirƙiri buƙata",
    },
    statusLabels: {
      open: "A buɗe",
      awaitingReply: "Ana jiran amsa",
      inProgress: "Ana ci gaba",
      resolved: "An warware",
      closed: "An rufe",
    },
    priorityLabels: {
      low: "Ƙarami",
      normal: "Na yau da kullum",
      high: "Mai girma",
      urgent: "Gaggawa",
    },
  },
  payments: {
    hero: {
      title: "Hanyoyin biya",
      description: "Sarrafa zaɓuɓɓukan biya da kuka adana don saurin kammala biya.",
      addMethodCta: "Ƙara hanya",
    },
    empty: {
      title: "Babu hanyoyin biya",
      description:
        "Ƙara katin debit, asusun banki, ko wata hanyar biya don saurin biya a duk sabis na HenryCo.",
      cta: "Ƙara hanyar biya",
    },
    card: {
      savedMethodFallback: "Hanyar da aka adana",
      cardLastFourTemplate: "•••• {last4}",
    },
    wallet: {
      eyebrow: "Walat HenryCo",
      body: "Walat HenryCo naka koyaushe yana akwai a matsayin zaɓin biya.",
      manageCta: "Sarrafa walat",
    },
  },
  savedItems: {
    metadata: {
      title: "Abubuwan da aka adana",
      description:
        "Abubuwan da ka ajiye daga kowace kwandon HenryCo, ana adana su na kwana 90 tare da gargaɗi mako guda kafin su ƙare.",
    },
    hero: {
      title: "An adana don baya",
      description:
        "Abubuwan da ka ajiye daga kowace kwandon HenryCo. Za mu ajiye su na kwana 90 kuma za mu gargaɗe ka mako guda kafin su ƙare.",
    },
    summary: {
      activeTemplate: "{count} masu aiki",
      expiredTemplate: "{count} sun ƙare",
      expiryNote:
        "Abubuwa suna ƙarewa kwana 90 bayan an adana su. Muna gargaɗi mako guda da wuri.",
      savedTemplate: "{count} an adana",
    },
    toolbar: {
      showLabel: "Nuna",
      allDivisions: "Duk sassan",
      sortLabel: "Tsara",
      sortNewest: "Sabbi farko",
      sortOldest: "Tsofaffi farko",
      sortExpiring: "Suna ƙarewa nan ba da daɗewa ba",
    },
    selection: {
      selectedTemplate: "An zaɓi {count}",
      clear: "Share",
      moving: "Ana matsawa…",
      moveSelectedToCart: "Matsa zaɓaɓɓun zuwa kwando",
      selectAllOnPage: "Zaɓi duka a wannan shafin",
    },
    empty: {
      title: "Babu abin da aka adana don baya tukuna",
      description:
        "Lokacin da ka samu wani abu da ba ka shirye saya ba, adana shi don baya daga kwando. Za mu kiyaye farashin da ka gani kuma za mu gargaɗe ka mako guda kafin ya ƙare.",
      browseCta: "Bincika",
    },
    card: {
      deselectItem: "Cire zaɓin abu",
      selectItem: "Zaɓi abu",
      savedItemFallback: "Abin da aka adana",
      expiresToday: "Yana ƙarewa yau",
      expiresInTemplate: "Yana ƙarewa cikin kwana {days}{plural}",
      expiredNotice: "Ya ƙare — maido yana sake saita lokacin kwana 90",
      moveToCart: "Matsa zuwa kwando",
      moving: "Ana matsawa…",
      removeFromSaved: "Cire daga abubuwan da aka adana",
      openOriginal: "Buɗe asalin lissafin",
    },
    expired: {
      sectionKicker: "Sun ƙare kwanan nan",
      sectionNote: "Maido yana sake saita lokacin kwana 90.",
    },
  },
  documents: {
    metadata: {
      title: "Takardu",
      description:
        "Rasit ɗinka, takaddun shaida, kwangiloli da fayilolin muhimmai — ana ajiyewa cikin sirri kuma ana iya samun su a kowace ɓangare ta HenryCo.",
    },
    hero: {
      eyebrow: "Ma’ajin kanka",
      title: "Takardu",
      body: "Rasit ɗinka, takaddun shaida, kwangiloli da fayilolin muhimmai.",
    },
    toolbar: {
      uploadCta: "Loda takarda",
      filterLabel: "Tace",
      allCategories: "Dukkan rukunoni",
      sortLabel: "Tsara",
      sortNewest: "Sabbi farko",
      sortOldest: "Tsofaffi farko",
    },
    types: {
      document: "Takarda",
      receipt: "Rasit",
      certificate: "Takardar shaida",
      id_document: "Takardar shaida ta sirri",
      contract: "Kwangila",
      other: "Sauran",
    },
    categories: {
      all: "Duka",
      document: "Takardu",
      receipt: "Rasit",
      certificate: "Takaddun shaida",
      id_document: "Takaddun shaida na sirri",
      contract: "Kwangiloli",
      other: "Sauran",
    },
    card: {
      uploadedOnTemplate: "An loda a {date}",
      sizeTemplate: "{size}",
      downloadLabel: "Sauke",
      noFileAttached: "Babu fayil da aka haɗa",
      openOriginal: "Buɗe takarda",
    },
    empty: {
      title: "Babu takardu tukuna",
      description:
        "Takarduka, rasit da takaddun shaida daga sabis ɗin HenryCo za a adana su a nan.",
    },
    summary: {
      countTemplate: "{count} takarda{plural}",
      filteredTemplate: "{count} daga {total} aka nuna",
    },
    retention: {
      eyebrow: "Sirri da ajiya",
      title: "Fayilolinka sun zauna a sirri",
      body: "Ana ɓoye takardu yayin da suke ajiye, kai kaɗai za ka iya ganinsu, kuma za mu ajiye su yayin da asusunka na HenryCo yake aiki sai dai idan ka cire su.",
    },
  },
  subscriptions: {
    metadata: {
      title: "Rajistar biyan kuɗi",
      description:
        "Taƙaitaccen karatu-kawai na tsare-tsaren da ke aiki, da aka kawo daga sassan HenryCo.",
    },
    hero: {
      eyebrow: "Tsare-tsaren da ke aiki",
      title: "Rajistar biyan kuɗi",
      description:
        "Taƙaitaccen tsare-tsare na karatu-kawai daga sassan da a halin yanzu suke daidaita bayanan rajistar biyan kuɗinsu zuwa cibiyar asusu mai raba.",
    },
    empty: {
      title: "Babu rajistar biyan kuɗi da aka daidaita tukuna",
      description:
        "Wannan na iya nufin ba ka da wani tsari mai aiki, ko kuma sashen bai riga ya buga bayanan rajistar biyan kuɗinsa a cikin rikodin asusu mai raba ba.",
    },
    card: {
      planFallback: "Tsarin rajista",
      tierSeparator: " · ",
      amountLabel: "Adadi",
      cycleLabel: "Zagaye",
      renewsLabel: "Za a sabunta",
      renewsFallback: "—",
    },
    statusLabels: {
      active: "Mai aiki",
      paused: "An dakatar",
      cancelled: "An soke",
      expired: "Ya ƙare",
      past_due: "Ya wuce lokacin biya",
      trialing: "A cikin gwaji",
      grace: "Lokacin alheri",
      pending: "Yana jira",
      unknown: "Ba a sani ba",
    },
    cycleLabels: {
      monthly: "Kowane wata",
      yearly: "Kowace shekara",
      annual: "Na shekara",
      quarterly: "Kowane wata uku",
      weekly: "Kowace mako",
      biweekly: "Kowane mako biyu",
      daily: "Kowace rana",
      one_time: "Sau ɗaya",
      notSet: "Ba a saita ba",
    },
    cta: {
      upgrade: "Haɓaka tsari",
      downgrade: "Saukar da tsari",
      cancel: "Soke rajista",
      manage: "Sarrafa a sashe",
      resume: "Ci gaba da rajista",
    },
    paymentIssue: {
      title: "Biyan kuɗi yana buƙatar kulawa",
      description:
        "Ba mu iya karɓar sabuntawar baya-bayan nan ba. Sabunta hanyar biyan kuɗinka don kiyaye wannan rajistar a aiki.",
      updatePaymentCta: "Sabunta hanyar biyan kuɗi",
    },
    summary: {
      activeTemplate: "{count} mai aiki",
      pausedTemplate: "{count} a dakatarwa",
      totalTemplate: "{count} tsari",
    },
  },
  referrals: {
    metadata: {
      title: "Tura Wasu",
      description:
        "Gayyaci abokan ciniki masu cancanta zuwa HenryCo, kuma ka bi diddigin kyaututtuka ta hanyar dakatarwa, sake nazari, da matakan da aka biya.",
    },
    hero: {
      title: "Tura Wasu",
      description:
        "Gayyaci abokan ciniki masu cancanta zuwa HenryCo, kuma ka bi diddigin kyaututtuka ta hanyar dakatarwa, sake nazari, da matakan da aka biya.",
    },
    code: {
      eyebrow: "Lambar tura ka",
      shareLinkLabel: "Hanyar haɗi",
      copyCodeTitle: "Kwafi lambar",
      copyLinkTitle: "Kwafi hanyar haɗi",
      copyLinkLabel: "Kwafi hanyar haɗi",
      copiedToast: "An kwafi!",
      rewardNote:
        "Lada: {amount} ga kowane tura mai cancanta. Ana buɗe lada bayan da mai karɓar tura ya kammala odar da aka biya a cikin tagar riƙe na kwanaki {days}.",
    },
    stats: {
      totalReferred: "Jimillar Wadanda Aka Tura",
      signedUp: "Sun Yi Rajista",
      qualified: "Sun Cancanta",
      flagged: "An Yi Alama",
      pendingRewards: "Ladan Da Ke Tafe",
      releasedRewards: "Ladan Da Aka Saki",
    },
    howItWorks: {
      eyebrow: "Yadda Yake Aiki",
      step1Title: "Raba lambarka",
      step1Body:
        "Raba lambarka ko hanyar haɗinka ta musamman. Ana bi diddigin abokan da ke ziyartar duk wani sashin HenryCo ta hanyar haɗinka ta atomatik.",
      step2Title: "Sun yi mu'amala",
      step2Body:
        "Bayan rajista, turawar tana shiga cikin tagar riƙe na kwanaki {days}. Muna bin diddigin asusun da aka tura sau ɗaya kawai — tura kai, kwafin gida, da sake rajistar da aka sake amfani ba su cancanta ba.",
      step3Title: "Lada na fitowa bayan cancanta",
      step3Body:
        "Turawar da ta cancanta tana ɗora {amount} a walat ɗin HenryCo ka bayan nazarin kuɗi. Ladan da ke tafe ba a iya kashe shi har sai an tabbatar da shi.",
    },
    policy: {
      eyebrow: "Manufar Tura",
      qualifying:
        "Juyawar da ta cancanta na nufin asusun da aka tura ya kammala aikin HenryCo da ya cancanta wanda ya wuce tabbatar da biyan kuɗi da amincewa.",
      enforcement:
        "HenryCo na iya riƙewa, mayar da baya, ko soke lada don tura kai, ƙididdigar juyawa biyu, mayar da baya, mayar da kuɗi, ko alamomin lada na zato.",
      separation:
        "Allon bayanan ka yana nuna turawa da tarihin lada daban don kada a yi kuskuren tantance rajistar da aka bi diddiginsu a matsayin kuɗin walat da aka biya.",
    },
    referralsList: {
      eyebrow: "Turawar Ka",
      emptyTitle: "Babu tura tukuna",
      emptyDescription:
        "Raba lambar tura ka don fara gayyatar mutane. Turawa za su bayyana a nan da zarar wani ya yi rajista da hanyar haɗinka.",
      refereeFallback: "Rajistar da aka tura",
      signedUpTemplate: "An yi rajista {date}",
      qualifiedTemplate: "Ya cancanta {date}",
    },
    statusLabels: {
      pending: "Ana jiran rajista",
      converted: "Ya yi rajista · lokacin riƙewa",
      qualified: "Ya cancanta · an buɗe lada",
      flagged: "An yi alama · kariyar zamba",
      expired: "Ya ƙare",
    },
    flagReasons: {
      selfReferral: "An toshe tura kai",
      duplicateEmail: "Kwafin imel na mai karɓar tura",
      deviceReuse: "Sake amfani da na'ura",
    },
    rewards: {
      eyebrow: "Tarihin Lada",
      emptyTitle: "Babu lada tukuna",
      emptyDescription:
        "Ladan da aka biya za su bayyana a nan bayan juyawar da ta cancanta ta wuce tabbatarwa da bita na rigakafin ɓarna.",
      referralRewardFallback: "Ladan Tura",
      paidTemplate: "An biya {date}",
      statusLabels: {
        held: "An Riƙe",
        pending: "Yana Jiran",
        released: "An Saki",
        paid: "An Biya",
        cancelled: "An Soke",
      },
    },
  },
  divisionCare: {
    metadata: {
      title: "Care · ajiyoyin da aka haɗa",
      description: "Bi kowane ajiyar HenryCo Care da aka haɗa da wannan asusu — matsayi, tabbatar da biya, da matakin aiki na gaba a wuri ɗaya.",
    },
    hero: {
      eyebrow: "Care · kai tsaye",
      sideKicker: "Yadda wannan ɗakin yake aiki",
      sideTitle: "Yi ajiya a Care, biyo baya nan.",
      sideBody: "Kowane ajiyar da aka yi a HenryCo Care yana bayyana a wannan ɗakin — lambar bibiya, matsayin biya, da matakin aiki na gaba suna isowa a nan ta atomatik. Allon kulawa na ƙasa yana ci gaba da daidaitawa yayin da sabis yana ci gaba.",
      breakdownLabel: "Ta matsayi",
      tilesAriaLabel: "Taƙaita ajiyoyin Care",
      tileLabels: {
        total: "Ajiyoyi",
        inFlight: "Cikin sabis",
        payment: "Jiran biya",
        completed: "An kammala",
      },
      tileFoot: {
        totalEmpty: "Yi ajiyar sabis na Care na farko don farawa",
        totalWithTemplate: "{count} a haɗe da wannan asusu",
        inFlightEmpty: "Babu wani abu mai gudana yanzu",
        inFlightWith: "Matsayi kai tsaye yana ƙasa",
        paymentEmpty: "Babu tabbatar da biya da ke jira",
        paymentWith: "Aika ko duba rasit a ƙasa",
        completedEmpty: "Babu sabis da aka kammala tukuna",
        completedWith: "Ƙungiyar Care ta yi alama an kammala",
      },
      breakdownLabels: {
        inFlight: "Cikin sabis",
        scheduled: "An tsara",
        payment: "Jiran biya",
        completed: "An kammala",
      },
      state: {
        empty: {
          headline: "Yi ajiyar sabis na Care na farko.",
          blurb: "Sabis na Care da kuka yi ajiya nan suna haɗawa ta atomatik zuwa wannan ɗakin — lambar bibiya, matsayin biya, da matakin aiki na gaba.",
          ctaPrimary: "Yi ajiyar sabis",
          ctaSecondary: "Buɗe bibiya",
        },
        attention: {
          headlineTemplateSingular: "{count} mataki da za a ɗauka.",
          headlineTemplatePlural: "{count} matakai da za a ɗauka.",
          blurb: "Ajiya ɗaya ko fiye na jiran tabbatar da biya ko biyo baya. Buɗe ajiyar da ke ƙasa don warware ta.",
          ctaPrimary: "Duba ajiyoyi",
          ctaSecondary: "Buɗe bibiya",
        },
        active: {
          headlineTemplateSingular: "{count} sabis yana gudana.",
          headlineTemplatePlural: "{count} sabis suna gudana.",
          blurb: "Bibiya kai tsaye, tabbatar da biya, da matakin aiki na gaba ana nuna su daga HenryCo Care zuwa wannan ɗakin.",
          ctaPrimary: "Buɗe bibiya",
          ctaSecondary: "Yi ajiyar sabis",
        },
        calm: {
          headlineTemplateSingular: "{count} ajiyar da aka rubuta.",
          headlineTemplatePlural: "{count} ajiyoyin da aka rubuta.",
          blurb: "Ajiyoyin Care naka, lambobin bibiya, rasitoci, da matakai masu zuwa — duka a wuri ɗaya, ana daidaitawa ainihin lokaci.",
          ctaPrimary: "Yi ajiyar sabis",
          ctaSecondary: "Buɗe bibiya",
        },
      },
    },
    sections: {
      glance: "Mataki na gaba",
      glanceMeta: "Ajiyar da ta fi gaggawa tana bayyana a nan.",
      bookings: "Duk ajiyoyi",
      bookingsEmpty: "Ajiyoyi da aka yi yayin shiga suna bayyana a nan a ainihin lokaci.",
      bookingsMetaTemplateSingular: "{count} ajiya · tace, kasa shafi, kuma buɗe ɗaya don cikakkun bayanai kai tsaye.",
      bookingsMetaTemplatePlural: "{count} ajiyoyi · tace, kasa shafi, kuma buɗe ɗaya don cikakkun bayanai kai tsaye.",
      activity: "Ayyukan kwanan nan",
      activityEmpty: "Sabuntawar matsayi, rasitoci, da bita suna bayyana a nan yayin da suke faruwa.",
      activityMetaTemplateSingular: "{count} sabuntawa · sabuwa ta farko",
      activityMetaTemplatePlural: "{count} sabuntawa · sababbi na farko",
    },
    empty: {
      title: "Babu ajiyoyin Care da aka haɗa tukuna",
      body: "Ajiyoyin da kuka yi a Care yayin da kuka shiga za su bayyana nan da nan. Ajiyoyi na da kuma za su bayyana idan imel ko wayar su sun dace da bayanan ku da aka raba.",
    },
    glance: {
      nextActionLabel: "Mataki na gaba",
      serviceLabel: "Sabis",
      pickupLabel: "Ɗauka",
      balanceLabel: "Saura biya",
      trackingLabel: "Bibiya",
      serviceFallback: "Sabis na Care",
    },
    activityAriaLabel: "Ayyukan Care",
    status: {
      live: "Cikin sabis",
      scheduled: "An tsara",
      completed: "An kammala",
      issue: "Ana buƙatar mataki",
      payment: "Bita na biya",
    },
    statusValueLabels: {
      booked: "An ajiye",
      awaiting_payment: "Jiran biya",
      receipt_submitted: "An aika rasit",
      under_review: "Ana bita",
      delivered: "An kawo",
      customer_confirmed: "Abokin ciniki ya tabbatar",
      inspection_completed: "Binciken an kammala",
      service_completed: "Sabis ya kammala",
      cancelled: "An soke",
      issue: "Matsala",
      exception: "Banbance",
      rejected: "An ƙi",
    },
    formatLabels: {
      toBeScheduled: "Za a tsara",
      shortMonths: ["Jan", "Fab", "Mar", "Afi", "May", "Yun", "Yul", "Agu", "Sat", "Okt", "Nuw", "Dis"],
    },
    dashboard: {
      filters: {
        all: "Duka",
        unpaid: "Saura biya",
        receipt: "Rasit / bita",
        active: "Yana gudana",
        completed: "An kammala",
        issue: "Matsaloli",
      },
      filtered: "an tace",
      bookingSingular: "ajiya",
      bookingPlural: "ajiyoyi",
      metrics: {
        visible: "Ajiyoyin da ake gani",
        visibleHint: "Ajiyoyin Care na gaske da aka haɗa da wannan asusu.",
        balance: "Sauran biya",
        balanceHintSomeTemplate: "{count} ajiya har yanzu suna buƙatar biyo baya na biya.",
        balanceHintNone: "Babu sauran biya Care da bai biya ba a buɗe yanzu.",
        receiptQueue: "Jerin rasit",
        receiptQueueHintSome: "Ajiyoyi tare da rasit da aka aika har yanzu suna jiran tabbatarwa.",
        receiptQueueHintNone: "Babu jinkirin tabbatar da rasit da aka haɗa da wannan asusu.",
        completed: "An kammala",
        completedHintSome: "Ajiyoyin da aka kammala za su iya wucewa zuwa biyo bayan bita.",
        completedHintNone: "Ajiyoyin Care da aka kammala za su bayyana a nan idan sabis ya rufe.",
      },
      linkedBookings: "Ajiyoyin Care da aka haɗa",
      linkedBookingsDescription: "Ajiyoyin Care naka, matsayin biya da matakai masu zuwa.",
      onThisPage: "a wannan shafi",
      selectedBooking: "Ajiyar da aka zaɓa",
      paymentSnapshot: "Hoton biya",
      receiptVisibility: "Bayyanar rasit",
      nextBestAction: "Mafi kyawun mataki na gaba",
      serviceSummary: "Taƙaitaccen sabis",
      serviceFallback: "Sabis na Care",
      addressPending: "Adireshin yana jira",
      updated: "An sabunta",
      balanceDue: "Saura biya",
      nextMove: "Mataki na gaba",
      paginationLabel: "Rabe shafi na ajiyoyin Care",
      pageLabel: "Shafi",
      of: "na",
      perPage: "kowace shafi",
      previous: "Baya",
      next: "Na gaba",
      customerFallback: "Abokin ciniki",
      scheduledDate: "Ranar tsare",
      notScheduled: "Ba a tsara ba tukuna",
      timeWindow: "Lokaci",
      windowPending: "Lokaci yana jira",
      pickupAddress: "Adireshin ɗauka",
      returnAddress: "Adireshin dawowa / bayarwa",
      returnAddressFallback: "Yana amfani da adireshin ɗauka sai dai an canza yayin ajiya",
      trackingCode: "Lambar bibiya",
      quotedTotal: "Jimillar da aka kawo",
      amountRecorded: "Adadin da aka rubuta",
      receiptState: "Yanayin rasit",
      receiptsSubmitted: "Rasit da aka aika",
      lastSubmission: "Aikin ƙarshe",
      noReceiptYet: "Babu rasit tukuna",
      openLiveBooking: "Buɗe ajiya kai tsaye",
      leaveReview: "Bar bita",
    },
  },
  divisionProperty: {
    metadata: {
      title: "Property · ajiyayyu da tambayoyi",
      description: "Jerin Property naka, tambayoyi, ziyarce-ziyarce da bin diddigin tallace-tallace — kowace mataki a HenryCo Property tana bayyana a wannan dakin asusu.",
    },
    hero: {
      eyebrow: "Property · kai tsaye",
      ariaLabel: "Bayanin Property",
      browseListingsCta: "Duba tallace-tallace",
      savedShortlistCta: "Jerin da aka ajiye",
      tilesAriaLabel: "Aikin Property",
      tileLabels: {
        saved: "An ajiye",
        inquiries: "Tambayoyi",
        viewings: "Ziyarce-ziyarce",
        listings: "Tallace-tallace",
      },
      tileFoot: {
        savedManagedTemplate: "{count} HenryCo na kula da su",
        savedEmpty: "Ajiye tallace-tallace don gina jeri",
        savedWith: "Kwatanta kuma sake bita a kowane lokaci",
        inquiriesEmpty: "Babu tattaunawa a yanzu",
        inquiriesWith: "Amsoshi za su sauka a wannan dakin",
        viewingsEmpty: "Nemi ziyara ga gida da ka ajiye",
        viewingsWith: "Tabbatarwa suna aiki tare a kan dukkan na'urori",
        listingsEmpty: "Tura talla a Property",
        listingsWith: "Sakamakon bita yana bayyana a nan",
      },
      sideAriaLabel: "Yadda wannan ɗaki yake aiki",
      sideKicker: "Yadda wannan ɗaki yake aiki",
      sideTitle: "Gano akan Property, biyo baya a nan.",
      sideBody:
        "Ajiye talla, nemi ziyara, ko buɗe tambaya a HenryCo Property — kowane aiki yana bayyana a wannan dakin asusu domin ka iya ci gaba daga inda ka tsaya a kowane na'ura.",
      sideBodyMuted:
        "Tallace-tallacen da HenryCo ke kulawa suna ɗauke da alamar Mai kulawa — bitar, dubawa, da biyo bayan haya na'urar gudanarwar Property ne ke daidaita.",
      breakdownAriaLabel: "Rabuwar aiki",
      breakdownLabel: "Bisa aiki",
      breakdownLabels: {
        saved: "An ajiye",
        inquiries: "Tambayoyi",
        viewings: "Ziyarce-ziyarce",
        listings: "Tallace-tallace",
      },
      state: {
        empty: {
          headline: "Fara binciken HenryCo Property.",
          blurb:
            "Gano gidaje don haya, tallace-tallacen sayarwa, da gidajen da HenryCo ke kulawa. Ajiye abubuwan da kake so, kuma duk tambaya, ziyara, ko biyo bayan talla zai sauka a nan kai tsaye.",
        },
        discover: {
          headlineTemplateSingular: "{count} gida a jeri.",
          headlineTemplatePlural: "{count} gidaje a jeri.",
          blurb:
            "Gidajen da aka ajiye, a shirye don sake bitar. Buɗe talla don nemi ziyara ko aika tambaya — amsa za ta dawo kai tsaye zuwa wannan dakin.",
        },
        active: {
          viewingHeadlineTemplateSingular: "{count} ziyara aka tsara.",
          viewingHeadlineTemplatePlural: "{count} ziyarce-ziyarce aka tsara.",
          inquiryHeadlineTemplateSingular: "{count} tambaya tana aiki.",
          inquiryHeadlineTemplatePlural: "{count} tambayoyi suna aiki.",
          blurb:
            "Jerin ku, tambayoyi, da jadawalin ziyara suna zaune a daki ɗaya. Ci gaba daga inda ka tsaya — kowane aiki yana bayyana daga HenryCo Property a ainihin lokaci.",
        },
      },
    },
    sections: {
      saved: "Jerin da aka ajiye",
      savedMetaEmpty: "Ajiye tallace-tallace a HenryCo Property don gina jerin ku.",
      savedMetaTemplate: "{saved} an ajiye · {managed} HenryCo na kula",
      activity: "Aikin baya-bayan nan",
      activityMetaEmpty: "Tambayoyi, ziyarce-ziyarce, da bitar tallace-tallace suna bayyana a nan kamar yadda suke faruwa.",
      activityMetaTemplateSingular: "{count} sabuntawa · sabuwar farko",
      activityMetaTemplatePlural: "{count} sabuntawa · sabuwar farko",
    },
    empty: {
      savedTitle: "Babu gidaje da aka ajiye tukuna",
      savedBody:
        "Gano gidaje don haya, tallace-tallacen sayarwa, da gidajen da HenryCo ke kulawa a Property. Duk abin da ka ajiye yana sauka a nan kai tsaye.",
      activityTitle: "Babu aikin Property tukuna",
      activityBody:
        "Buɗe talla a HenryCo Property don nemi ziyara ko aika tambaya — kowace mataki, daga saƙon farko har bitar, za ta bayyana a nan.",
    },
    activity: {
      ariaLabel: "Aikin Property",
      titles: {
        inquiry: "Tambayar gida",
        viewing: "Buƙatar ziyara",
        listing_submitted: "An tura talla",
        listing_updated: "An sabunta talla",
        listing_reviewed: "An kammala bitar talla",
      },
    },
    gallery: {
      ariaLabel: "Gidajen da aka ajiye",
      managedBadge: "Mai kulawa",
      featuredBadge: "Wanda aka zaɓa",
      locationPending: "Wuri ya jira",
      contactAgent: "Tuntuɓi wakili",
      savedAtTemplate: "An ajiye a {date}",
      bedSingular: "ɗaki",
      bedPlural: "ɗakuna",
      bathSingular: "wanka",
      bathPlural: "wanke-wanke",
      sizeSqmTemplate: "{size} sqm",
    },
  },
  divisionJobs: {
    metadata: {
      title: "Ayyuka · dashboard ɗan takara",
      description: "Bibiyar kowace neman aikin HenryCo Jobs, ayyukan da aka ajiye, sabuntawa daga mai daukar ma'aikata, da alamar shirye-shiryen bayanin martaba mai alaƙa da wannan asusu.",
    },
    header: {
      title: "Ayyuka",
      description: "Neman ayyuka, ayyukan ajiye, sabuntawa daga masu daukar ma'aikata, da ƙarfin bayanin martaba — duka a wuri ɗaya.",
      candidateModuleCta: "Modul ɗan takara",
      interviewRoomsCta: "Ɗakunan tambayoyi",
      browseLiveRolesCta: "Bincika ayyukan da ke da rai",
    },
    hero: {
      eyebrow: "Asusunka",
      headline: "Ayyukanka, duka a wuri ɗaya.",
      body: "Neman ayyuka, ayyukan ajiye, sabuntawa daga masu daukar ma'aikata, da shirye-shiryen bayanin martaba an haɗa su da asusunka na HenryCo.",
      statsAriaLabel: "Taƙaitaccen ayyukan aiki",
      statLabels: {
        applications: "Neman ayyuka masu rai",
        saved: "Ayyukan da aka ajiye",
        readiness: "Shirye-shiryen bayanin martaba",
        updates: "Sabuntawa daga masu daukar ma'aikata",
      },
      statDetails: {
        applicationsLeadingTemplate: "{stage} shi ne matakinka mai rai mai jagoranci.",
        applicationsEmpty: "Babu neman ayyuka mai rai tukuna.",
        savedSome: "Jerinka a shirye yake don sake duba.",
        savedEmpty: "Gina jeri don sauƙin samun ayyuka masu kyau.",
        updatesLatestTemplate: "{relative} motsi na ƙarshe.",
        updatesEmpty: "Babu sabuntawa daga masu daukar ma'aikata tukuna.",
      },
    },
    sections: {
      nextActionsKicker: "Ayyuka Na Gaba",
      nextActionsTitle: "Abin da ya cancanci hankalinka yanzu",
      openTimelineCta: "Buɗe layin lokaci",
      applicationsKicker: "Neman Ayyuka",
      applicationsTitle: "Motsin ɗaukar ma'aikata mai rai",
      savedKicker: "Ayyukan Da Aka Ajiye",
      savedTitle: "Jeri tare da mafi kyawun mahallin",
      openSavedRolesCta: "Buɗe ayyukan da aka ajiye",
      recommendedKicker: "Ayyukan Da Aka Ba Da Shawara",
      recommendedTitle: "Abin da ya dace da siginarka ta yanzu",
      browseCatalogCta: "Bincika katalog",
      recruiterFeedKicker: "Tashar Mai Daukar Ma'aikata",
      recruiterFeedTitle: "Saƙonni, canjin mataki, da sanarwa",
      candidateInboxCta: "Akwati ɗan takara",
      profileKicker: "Ƙarfin Bayanin Martaba",
      profileTitle: "Shirye-shiryen ɗan takara da ingancin CV",
      sharedInboxKicker: "Akwati Mai Rabawa",
      sharedInboxTitle: "Sanarwar Jobs masu alaƙa da asusunka",
      alertsKicker: "Sanarwa",
      alertsTitle: "Manufar binciken da aka ajiye",
    },
    empty: {
      applicationsTitle: "Babu neman ayyuka mai rai tukuna",
      applicationsBody: "Ayyukan da aka ajiye, sabuntawa daga masu daukar ma'aikata, da layin lokaci za su bayyana nan da zarar ka koma daga bincike zuwa neman aiki mai rai.",
      exploreJobsCta: "Bincika ayyuka",
      savedJobsTitle: "Babu ayyukan da aka ajiye tukuna",
      savedJobsBody: "Ajiye ayyuka masu alkawari don kiyaye su a jerinka a duk Jobs da asusunka.",
      recommendedTitle: "Shawarwari za su yi kyau yayin amfani da Jobs",
      recommendedBody: "Da zarar bayanin martaba, jeri, da neman ayyukanka suka yi zurfi, shawarwarin ayyuka a nan za su zama mafi ƙayyade.",
      recruiterFeedTitle: "Babu motsi daga mai daukar ma'aikata tukuna",
      recruiterFeedBody: "Canje-canje na matakin neman aiki, bayanan da aka raba daga mai daukar ma'aikata, da sanarwar Jobs a cikin app za su tara nan.",
      notificationsTitle: "Babu sanarwar Jobs tukuna",
      notificationsBody: "Motsi na jeri na gaba, sabuntawa daga ma'aikata, da canje-canje na neman aiki za su iso nan da kuma a cikin modul Jobs.",
      alertsTitle: "Babu sanarwar Jobs mai aiki",
      alertsBody: "Ƙirƙira sanarwa don sabbin ayyukan da suka dace da ka'idodinka su bayyana a cikin tashar Jobs.",
      browseRolesCta: "Bincika ayyuka",
    },
    application: {
      progressPercentTemplate: "{percent}% an kammala",
      appliedAtTemplate: "An nema a {date}",
      candidateReadiness: "Shirye-shiryen ɗan takara",
      recruiterConfidence: "Amincewar mai daukar ma'aikata",
      latestMovement: "Motsi na ƙarshe daga mai daukar ma'aikata",
      nextBestMove: "Mafi kyawun matakin gaba",
      openTimelineCta: "Buɗe layin lokaci",
      interviewRoomCta: "Ɗakin tambayoyi",
      viewRoleCta: "Duba aiki",
    },
    savedJob: {
      trustTemplate: "Amincewa {score}",
      savedAtTemplate: "An ajiye a {date}",
    },
    recommended: {
      compFallback: "An tattauna albashi cikin tsari",
    },
    stageLabels: {
      applied: "An nema",
      reviewing: "Ana dubawa",
      shortlisted: "An zaɓa",
      interview: "Tambayoyi",
      offer: "Bayar",
      hired: "An ɗauka",
      rejected: "An ƙi",
    },
    nextStep: {
      labels: {
        applied: "Ka kiyaye bayanin martaba da CV ɗinka na zamani",
        shortlisted: "Ka shirya hujja da mahallin portfolio",
        interview: "Ka shirya misalai da lokaci",
        offer: "Ka duba iyaka, lokaci, da albashi",
        rejected: "Ka ƙarfafa kunshin neman aiki na gaba",
      },
      bodies: {
        applied: "A matakin farko, hujja mafi kyau, bayanan tuntuɓar mai tsabta, da CV na zamani suna taimakawa.",
        shortlisted: "An zaɓa yana nufin cewa ka wuce gwajin alamar farko. Hujja mai tsanani tana da muhimmanci yanzu.",
        interview: "Matakan tambayoyi suna ci gaba da sauri lokacin da mafi kyawun hujjojinka da samuwanka ke da sauƙin gani.",
        offer: "Yi amfani da matakin bayarwa don kawar da rashin tabbas, ba don tsammanin nauyi ba.",
        rejected: "Yi amfani da ƙin a matsayin alama. Ƙarfafa taƙaitawa, misalai, da daidaiton aiki kafin ka sake nema.",
      },
    },
    readinessLabels: {
      interviewReady: "A shirye don tambayoyi",
      strongProfile: "Bayanin martaba mai ƙarfi",
      needsProof: "Yana buƙatar hujja",
      needsStructure: "Yana buƙatar tsari",
    },
    workModeLabels: {
      remote: "Daga nesa",
      hybrid: "Hauhaɗɗen",
      onsite: "A wuri",
    },
    employmentTypeLabels: {
      fullTime: "Cikakken lokaci",
      partTime: "Lokaci kaɗan",
      contract: "Kwangila",
      internship: "Horarwa",
      temporary: "Na ɗan lokaci",
    },
    profile: {
      readinessLabel: "Shirye-shirye",
      skillsMappedLabel: "Ƙwarewar da aka tsara",
      filesLabel: "Fayiloli",
      improveProfileCta: "Inganta bayanin martaba",
      openCandidateModuleCta: "Buɗe modul ɗan takara",
      checklist: {
        identityLabel: "Tushen bayanin martaba",
        identityDetail: "Cikakken suna, waya, da wuri suna nan don bin diddigi daga mai daukar ma'aikata.",
        storyLabel: "Labarin aiki",
        storyDetail: "Taken da taƙaitawa suna bayyana abin da kake yi fiye da rikodi mara komai.",
        verificationLabel: "Tabbatar da shaidar",
        verificationDetail: "Amincewar Jobs ta dakata har sai asusunka na HenryCo ya wuce binciken shaidar.",
        proofLabel: "Hujjar aiki",
        proofDetail: "CV tare da hujjar portfolio na sa motsi cikin jerin ya yi sauƙi.",
        skillsLabel: "Ƙwarewar da aka tsara",
        skillsDetail: "Aƙalla ƙwarewa huɗu da ayyukan da aka fi so suna inganta shawarwari.",
      },
    },
    nextActions: {
      gapTemplate: "Rufe gibin {label}",
      interviewLabel: "Shiri don matakin tambayoyi",
      offerLabel: "Amsa bayar mai rai",
      attentionTemplate: "{title} a {employer} yana buƙatar hankalinka yanzu.",
      convertSavedLabel: "Mai da aikin da aka ajiye zuwa neman aiki mai rai",
      convertSavedTemplate: "{title} riga yana cikin jerinka kuma a shirye yake don zurfin duba.",
      restartLabel: "Sake fara binciken aikinka tare da matatun masu ƙarfi",
      restartDetail: "Yi amfani da matatun ma'aikata da aka tabbatar da ayyukan ciki don gina jeri mai tsabta da sauri.",
    },
    alertStatus: {
      active: "Mai aiki",
      paused: "Tsaye",
    },
    recruiterUpdateTitleTemplate: "Sabunta {stage}",
  },
  divisionMarketplace: {
    metadata: {
      title: "Marketplace · oda da ayyukan mai sayarwa",
      description: "Bibiya kowanne odar HenryCo Marketplace, rikici da biyan mai sayarwa da aka haɗa da wannan asusun — ayyukan mai siye da wurin aikin mai sayarwa, ana nuna su a ɗaki ɗaya cikin lokaci-lokaci.",
    },
    hero: {
      eyebrow: "Marketplace · kai tsaye",
      ariaLabel: "Bayanin Marketplace",
      sideAriaLabel: "Yadda wannan ɗakin yake aiki",
      sideKicker: "Yadda wannan ɗakin yake aiki",
      sideTitle: "Saye da sayarwa — ɗaki ɗaya.",
      sideBody: "Kowace oda, rikici da buƙatar biyan da kuka ƙirƙira a Marketplace ana nuna su a wannan ɗaki. Ayyukan wurin aikin mai sayarwa yana haɗuwa da odar mai siye, don haka ɓangarorin biyu na marketplace su kasance bayyane a kallon ido.",
      breakdownLabel: "Ta yanayi",
      breakdownAriaLabel: "Rabe-raben ayyuka",
      tilesAriaLabel: "Ayyukan Marketplace",
      tileLabels: {
        orders: "Oda",
        disputes: "Rikice-rikice",
        store: "Shago",
        payouts: "Biyan kuɗi",
      },
      tileFoot: {
        ordersEmpty: "Oda na farko za ta bayyana a nan",
        ordersInMotionTemplate: "{inFlight} cikin tafiya · {delivered} aka kai",
        ordersDeliveredTemplate: "{delivered} aka kai har yau",
        disputesClear: "Komai a fili",
        disputesActiveTemplate: "{open} a buɗe · {resolving} ana warwarewa",
        storeActiveNoName: "Memba na mai sayarwa yana aiki",
        storeActiveWithNameTemplate: "Shago: {name}",
        storeApplicationTemplate: "Aikace-aikace: {status}",
        storeIdle: "Ba a fara sayarwa ba — nemi lokacin da kuka shirya",
        payoutsEmptyNoneSettled: "Babu buƙatar biyan kuɗi",
        payoutsSettledTemplate: "{count} aka warware har yau",
        payoutsPendingTemplate: "{amount} a jira",
      },
      breakdownLabels: {
        inMotion: "Cikin tafiya",
        openDisputes: "Rikice-rikice a buɗe",
        delivered: "Aka kai",
        pendingPayouts: "Biyan da ke jira",
      },
      state: {
        empty: {
          headline: "Fara siye a HenryCo Marketplace.",
          blurb: "Oda, rikice-rikice, ayyukan mai sayarwa da biyan kuɗi suna nunawa a wannan ɗaki da zarar kuka yi mu'amala. Bincika marketplace don farawa.",
          ctaPrimary: "Buɗe Marketplace",
          ctaSecondary: "Nemi sayarwa",
        },
        attention: {
          headlineTemplateSingular: "Maganar {count} tana buƙatar hankali.",
          headlineTemplatePlural: "Magana {count} suna buƙatar hankali.",
          blurb: "Rikice-rikice da odar keɓancewa suna saman jeri. Buɗe lamarin don ƙara shaida ko karɓi warwarewa.",
          ctaPrimary: "Duba lamura",
          ctaSecondary: "Buɗe Marketplace",
        },
        activeOrders: {
          headlineTemplateSingular: "Oda {count} cikin tafiya.",
          headlineTemplatePlural: "Oda {count} cikin tafiya.",
          blurb: "Matsayin oda kai tsaye, matsayin biyan kuɗi da bin diddigin mai sayarwa suna nunawa a wannan ɗaki daga HenryCo Marketplace cikin lokaci-lokaci.",
          ctaPrimary: "Buɗe Marketplace",
          ctaSecondary: "Nemi sayarwa",
        },
        activePayouts: {
          headlineTemplateSingular: "Biyan kuɗi {count} ana bita.",
          headlineTemplatePlural: "Biyan kuɗi {count} ana bita.",
          blurb: "Buƙatun biyan kuɗin mai sayarwa suna wucewa ta tabbacin kuɗi. Sabunta matsayi yana bayyana a nan yayin da tawagar ke ci gaba.",
          ctaPrimary: "Buɗe wurin aikin mai sayarwa",
          ctaSecondary: "Buɗe Marketplace",
        },
        calmBuyer: {
          headlineTemplateSingular: "Oda {count} an yi rikodin.",
          headlineTemplatePlural: "Oda {count} an yi rikodin.",
          blurb: "Dukan ayyukan marketplace ɗinka a ɗaki ɗaya — odar mai siye, biyan mai sayarwa, sakamakon rikici da sabon matsayin kowane shago.",
          ctaPrimary: "Buɗe Marketplace",
          ctaSecondary: "Nemi sayarwa",
        },
        calmSeller: {
          headlineTemplateSingular: "Oda {count} · mai sayarwa yana aiki.",
          headlineTemplatePlural: "Oda {count} · mai sayarwa yana aiki.",
          blurb: "Dukan ayyukan marketplace ɗinka a ɗaki ɗaya — odar mai siye, biyan mai sayarwa, sakamakon rikici da sabon matsayin kowane shago.",
          ctaPrimary: "Buɗe Marketplace",
          ctaSecondary: "Buɗe wurin aikin mai sayarwa",
        },
      },
    },
    sections: {
      matters: {
        title: "Magana masu aiki",
        meta: "Rikice-rikice, matsayin aikace-aikace na mai sayarwa da biyan kuɗi da ke jira suna bayyana a nan idan ana buƙatar mataki.",
        ariaLabel: "Magana Marketplace masu aiki",
        emptyTitle: "Babu wani abu da ke buƙatar mataki",
        emptyBody: "Dukan ayyukan marketplace ɗinka suna gudana ba tare da matsala ba — babu rikice-rikice a buɗe, babu biyan kuɗi a cikin bita, kuma (idan ya dace) aikace-aikacen mai sayarwa naka an amince.",
      },
      orders: {
        title: "Oda kwanan nan",
        empty: "Oda da aka yi a Marketplace suna bayyana a nan cikin lokaci-lokaci.",
        metaTemplateSingular: "Oda {count} · sabuwar ɗaya da fari",
        metaTemplatePlural: "Oda {count} · sabbi da fari",
        emptyTitle: "Babu oda har yanzu",
        emptyBody: "Yi odarka ta farko a HenryCo Marketplace — matsayin oda, matsayin biyan kuɗi da kowanne bin diddigi suna sauka a nan kai tsaye.",
        ariaLabel: "Oda kwanan nan",
      },
      activity: {
        title: "Ayyuka kwanan nan",
        empty: "Sabunta matsayi, biyan kuɗi da bita suna nunawa a nan yayin da suke faruwa.",
        metaTemplateSingular: "Sabunta {count} · sabuwar ɗaya da fari",
        metaTemplatePlural: "Sabunta {count} · sabbi da fari",
        emptyTitle: "Babu ayyukan marketplace har yanzu",
        emptyBody: "Tabbatar oda, sabunta rikice-rikice da sakamakon biyan mai sayarwa za su bayyana a nan yayin da suke faruwa.",
        ariaLabel: "Ayyukan Marketplace",
      },
    },
    matters: {
      disputes: {
        kicker: "Rikice-rikice",
        titleTemplateSingular: "Lamari {count} yana buƙatar mataki",
        titleTemplatePlural: "Lamari {count} suna buƙatar mataki",
        bodyLatestTemplate: "Sabuwa: {ref} · an sabunta {stamp}",
        bodyFallback: "Buɗe jerin don ƙara shaida.",
        cta: "Duba lamura",
      },
      application: {
        kicker: "Aikace-aikacen mai sayarwa",
        bodyWithStoreTemplate: "Shago: {name}",
        bodyDefault: "Aikace-aikace a jerin bita na HenryCo.",
        bodyReviewSuffixTemplate: " · {note}",
        cta: "Duba matsayi",
        defaultStatus: "an gabatar",
      },
      payouts: {
        kicker: "Biyan kuɗi a bita",
        titleTemplate: "{amount} a jira",
        bodyTemplateSingular: "Buƙata {count} tana jiran tabbacin kuɗi.",
        bodyTemplatePlural: "Buƙatu {count} suna jiran tabbacin kuɗi.",
        cta: "Buɗe wurin aikin mai sayarwa",
      },
    },
    orders: {
      rowTitleTemplate: "Oda {orderNo}",
      rowSubTemplate: "{amount} · an saka {stamp}",
      rowAriaLabelTemplate: "Oda {orderNo} · {status}",
      statusFallbackDraft: "Daftari",
    },
    statusValueLabels: {
      delivered: "An kai",
      completed: "An kammala",
      customer_confirmed: "Mai siye ya tabbatar",
      fulfilled: "An cika",
      cancelled: "An soke",
      refunded: "An mayar da kuɗi",
      disputed: "Cikin rikici",
      exception: "Keɓancewa",
      placed: "An saka",
      paid: "An biya",
      awaiting_fulfilment: "Jiran cikawa",
      confirmed: "An tabbatar",
      queued: "Cikin jeri",
    },
    applicationStatusLabels: {
      submitted: "an gabatar",
      under_review: "ana bita",
      approved: "an amince",
      rejected: "an ƙi",
      pending_documents: "takardu na jira",
      changes_requested: "an nemi canje-canje",
    },
    formatLabels: {
      dash: "—",
    },
  },
  divisionLearn: {
    metadata: {
      title: "Learn · allon koyo",
      description: "Bi sawun kowane rajistar HenryCo Learn, darasi, sakamakon jarrabawa, takardar shaida, horon da aka ba ka, da neman koyarwa da ke da alaƙa da wannan asusun — kasida tana Learn, ci gaba yana fitowa anan.",
    },
    hero: {
      ariaLabel: "Bayanin Learn",
      eyebrow: "Learn · kai tsaye",
      sideKicker: "Yadda wannan ɗakin ke aiki",
      sideTitle: "Kasida tana Learn, ci gaba anan.",
      sideBody: "Kowane darasi, jarrabawa da takardar shaida daga HenryCo Learn yana daidaitawa cikin wannan ɗakin — fara inda ka tsaya, duba ci gabanka a kallon kanɗayan, kuma ka adana shaidu a wuri ɗaya.",
      breakdownLabel: "Ta yanayi",
      breakdownAriaLabel: "Rabon ayyukan koyo",
      tilesAriaLabel: "Ayyukan koyo",
      tileLabels: {
        active: "Mai aiki",
        completed: "An kammala",
        certificates: "Takardun shaida",
        assignments: "An ba da",
      },
      tileFoot: {
        activeEmpty: "Yi rajista don fara darasi",
        activeWith: "Ci gaban darasi da jarrabawa yana fitowa anan",
        completedEmpty: "Shirye-shiryen da ka kammala suna fitowa anan",
        completedWith: "Yana da amfani ga CV da rahotanni",
        certificatesEmpty: "Ka samu ɗaya ta kammala darasi",
        certificatesWith: "Hanyoyin haɗi da ake iya tabbatarwa ga kowace shaida",
        assignmentsEmpty: "Babu wani abu da aka ba da yanzu",
        assignmentsWith: "Daga manaja ko ƙungiyarka",
      },
      breakdownNames: {
        active: "Mai aiki",
        assigned: "An ba da",
        certificates: "Takardun shaida",
        saved: "An adana",
      },
      openLearnCta: "Buɗe HenryCo Learn",
      applyToTeachCta: "Nemi koyarwa",
      state: {
        empty: {
          headline: "Fara tafiyarka ta HenryCo Learn.",
          blurb: "Duba kasida, yi rajista a darasi, kuma kowane darasi, jarrabawa da takardar shaida za su daidaita anan ta atomatik.",
        },
        active: {
          headlineTemplateSingular: "Darasi {count} yana ci gaba.",
          headlineTemplatePlural: "Darussa {count} suna ci gaba.",
          blurb: "Fara inda ka tsaya — darussa, jarrabawa, takardun shaida da horon da aka ba ka suna daidaitawa daga HenryCo Learn cikin wannan ɗakin.",
        },
        calm: {
          headlineTemplateSingular: "Darasi {count} an kammala.",
          headlineTemplatePlural: "Darussa {count} an kammala.",
          blurb: "Takardun shaidarka da tarihin koyo na ci gaba zaune anan, mai amfani ga CV, rahoton ciki ko bayananka.",
        },
      },
    },
    sections: {
      coursesTitle: "Ci gaba da koyo",
      coursesMetaEmpty: "Duba kasidar HenryCo Learn don yin rajista a darasinka na farko.",
      coursesMetaTemplate: "{active} mai aiki · {completed} an kammala",
      extrasTitle: "Shaidu, ayyukan da aka ba da koyarwa",
      extrasMeta: "Takardun shaida, horon da aka ba da, darussan da aka adana da neman koyarwa suna zaune anan.",
      activityTitle: "Sabbin ayyuka",
      activityMetaTemplateSingular: "Sabuntawa {count} · sabuwa ta farko",
      activityMetaTemplatePlural: "Sabuntawa {count} · sabbi a farko",
      activityMetaEmpty: "Darussa, jarrabawa, takardun shaida da biyan kuɗi suna fitowa anan a lokaci-lokaci.",
    },
    empty: {
      coursesTitle: "Babu darussa da aka haɗa tukuna",
      coursesBody: "Duba kasidar HenryCo Learn kuma ka yi rajista. Wurinka zai fito anan ta atomatik.",
      activityTitle: "Babu wani aiki na Learn tukuna",
      activityBody: "Ci gaban darasi, sakamakon jarrabawa, bayar da takardar shaida da rasitin biyan kuɗi suna fitowa anan a lokaci-lokaci.",
    },
    courses: {
      ariaLabel: "Darussa",
      completedAtTemplate: "An kammala {date}",
      progressPercentTemplate: "{percent}% an kammala",
      statusDelimiter: " · ",
    },
    extras: {
      ariaLabel: "Ƙarin Learn",
      certificatesTitle: "Takardun shaida",
      assignmentsTitle: "Koyon da aka ba da",
      savedTitle: "Darussan da aka adana",
      teachingTitle: "Koyar da HenryCo",
      statusLabel: "Yanayi",
      expertiseLabel: "Ƙwarewa",
      topicsLabel: "Batutuwa",
      openApplicationCta: "Buɗe neman",
      applyToTeachCta: "Nemi koyarwa",
      teachingEmpty: "Muna bita neman koyarwa da hannu. Ka nema a HenryCo Learn, yanayinta zai daidaita zuwa nan.",
    },
    activity: {
      ariaLabel: "Ayyukan Learn",
      fallbackTitle: "Ayyukan Learn",
    },
  },

  divisionStudio: {
    metadata: {
      title: "Studio · ɗakunan ayyukan aiki",
      description: "Bi diddigi kowanne haɗin gwiwa na HenryCo Studio da ke da alaƙa da wannan asusu — shawarwari, maƙasudai, biyan kuɗi, abubuwan da za a kawo, da ayyuka cikin ɗaki guda.",
    },
    hero: {
      eyebrowLive: "Studio · kai tsaye",
      overviewAriaLabel: "Bayyani na Studio",
      activityAriaLabel: "Ayyukan Studio",
      sideAriaLabel: "Yadda wannan ɗaki ke aiki",
      sideLabel: "Yadda wannan ɗaki ke aiki",
      sideTitle: "Ɗakin ayyuka guda, ainihin matsayi.",
      sideBody: "Shawarwari, maƙasudai, hujjojin biyan kuɗi, abubuwan da za a kawo, da alamomin sadarwa suna ci gaba da haɗuwa da wannan asalin HenryCo da kake amfani da shi a ko’ina. Dashboard ɗin da ke ƙasa yana nuna ainihin ci gaban ƙungiyar Studio, ba jerin matsayi ba.",
      breakdownAriaLabel: "Rabe-raben ayyuka",
      breakdownLabel: "Ta matsayi",
      tiles: {
        activeLabel: "Ayyuka masu aiki",
        activeFootEmpty: "Babu ɗakunan aiki masu aiki yanzu",
        activeFootHasValue: "Ɗakunan aiki masu aiki tare da motsi na bayarwa",
        pendingLabel: "Biyan kuɗi da ke jira",
        pendingFootEmpty: "Layin kasuwanci a sake",
        pendingFootHasValue: "Ƙarshen kasuwanci har yanzu a buɗe",
        proofLabel: "Hujjojin da aka miƙa",
        proofFootEmpty: "Babu abin da ke jira a duba",
        proofFootHasValue: "Biyan kuɗi suna jiran duba Studio",
        deliverablesLabel: "Abubuwan da za a kawo",
        deliverablesFootEmpty: "Fayiloli suna fitowa anan idan Studio ya tura su",
        deliverablesFootHasValue: "Fayiloli da sakamako an bi diddigi a wuri ɗaya",
      },
      breakdown: {
        active: "Mai aiki",
        readyReview: "A shirye don dubawa",
        pendingPayment: "Biyan kuɗi a jira",
        proofSubmitted: "Hujja miƙe",
      },
      state: {
        empty: {
          headline: "Fara brief na Studio.",
          blurb: "Lokacin da shawarwari ko aiki ya fara da asalin HenryCo na ka, ɗakin Studio da aka haɗa zai bayyana anan — maƙasudai, biyan kuɗi, abubuwan da za a kawo, da matakin gaba duka.",
          ctaPrimary: "Fara brief",
          ctaSecondary: "Buɗe Studio",
        },
        attention: {
          headlineTemplateSingular: "{count} biyan kuɗi da ya ƙare.",
          headlineTemplatePlural: "{count} biyan kuɗi da suka ƙare.",
          blurb: "Ƙarshen biyan kuɗi ya wuce. Buɗe ɗakin aiki don tura hujja ko tuntuɓi ƙungiyar Studio.",
          ctaPrimary: "Buɗe biyan kuɗi",
          ctaSecondary: "Buɗe Studio",
        },
        activeReady: {
          headlineTemplateSingular: "{count} aiki a shirye don dubawa.",
          headlineTemplatePlural: "{count} ayyuka a shirye don dubawa.",
          blurb: "Abubuwan da za a kawo da gyare-gyare suna jiran amincewar ka. Buɗe ɗakin aiki don dubawa kuma buɗe maƙasudin gaba.",
          ctaPrimary: "Buɗe ayyuka",
          ctaSecondary: "Buɗe Studio",
        },
        activeProjects: {
          headlineTemplateSingular: "{count} aiki mai aiki.",
          headlineTemplatePlural: "{count} ayyuka masu aiki.",
          blurb: "Ɗakunan aiki masu aiki tare da motsi na maƙasudai, ƙarshen biyan kuɗi, da abubuwan da za a kawo — duk an nuna su daga HenryCo Studio cikin wannan ɗaki.",
          ctaPrimary: "Buɗe Studio",
          ctaSecondary: "Fara sabon brief",
        },
        calm: {
          headlineTemplateSingular: "{count} ɗakin ayyuka cikin tarihi.",
          headlineTemplatePlural: "{count} ɗakunan ayyuka cikin tarihi.",
          blurb: "Kowanne haɗin gwiwa na Studio da ka taɓa fara — shawarwari, maƙasudai, biyan kuɗi, abubuwan da za a kawo — an kiyaye su a ɗaki guda don bi diddigi cikin sauri.",
          ctaPrimary: "Buɗe Studio",
          ctaSecondary: "Fara sabon brief",
        },
      },
    },
    sections: {
      projectsTitle: "Ɗakunan ayyuka",
      projectsAriaLabel: "Ayyukan Studio",
      projectsMetaEmpty: "Ɗakunan aiki suna fitowa anan idan haɗin gwiwa na Studio ya fara.",
      projectsMetaTemplateSingular: "{count} aiki · an tsara ta sabon motsi",
      projectsMetaTemplatePlural: "{count} ayyuka · an tsara ta sabon motsi",
      paymentsTitle: "Ƙarshen biyan kuɗi",
      paymentsAriaLabel: "Biyan kuɗi na Studio",
      paymentsMetaEmpty: "Buƙatun biyan kuɗi na Studio suna fitowa anan idan shawarwari ko aiki ya fara.",
      paymentsMetaTemplateSingular: "{count} ƙarshe · ɗora hujja da matsayin amincewa",
      paymentsMetaTemplatePlural: "{count} ƙarshe · ɗora hujja da matsayin amincewa",
      activityTitle: "Ayyuka na kwanan nan",
      activityAriaLabel: "Ayyukan Studio",
      activityMetaEmpty: "Sabuntawar ayyuka, hujjojin biyan kuɗi, da amincewar maƙasudai suna nunawa anan.",
      activityMetaTemplateSingular: "{count} sabuntawa · sabuwar farko",
      activityMetaTemplatePlural: "{count} sabuntawa · sabuwar farko",
    },
    empty: {
      projectsTitle: "Babu ɗakunan Studio da aka haɗa har yanzu",
      projectsBody: "Da zaran an ƙirƙira shawarwari ko aiki da asalin HenryCo na ka, ɗakin Studio da aka haɗa zai bayyana anan — maƙasudai, biyan kuɗi, abubuwan da za a kawo, da matakin gaba.",
      paymentsTitle: "Babu ƙarshen biyan kuɗi har yanzu",
      paymentsBody: "Maƙasudai na kasuwanci — adibas, tsakanin aiki, da bayarwa — suna fitowa anan idan shawarwari ya fara tare da kai.",
      activityTitle: "Babu ayyukan Studio har yanzu",
      activityBody: "Sabuntawar ayyuka, hujjojin biyan kuɗi, sakin abubuwan da za a kawo, da amincewar maƙasudai za su bayyana anan yayin da suke faruwa.",
    },
    projects: {
      listAriaLabel: "Ayyukan Studio",
      fallbackSubtitle: "Studio yana shirya sabuntawa ta gaba.",
      milestonesTemplate: "{approved}/{total} maƙasudai",
      paymentsTemplateSingular: "{count} biyan kuɗi a buɗe",
      paymentsTemplatePlural: "{count} biyan kuɗi a buɗe",
      deliverablesTemplateSingular: "{count} abin kawo",
      deliverablesTemplatePlural: "{count} abubuwan kawo",
      updatedTemplate: "An sabunta {stamp}",
      rowAriaLabelTemplate: "{title} · {kind}",
      fallbackStamp: "—",
    },
    projectKindLabels: {
      live: "Mai aiki",
      ready_review: "A shirye don dubawa",
      scheduled: "An tsara",
      delivered: "An kawo",
      issue: "Ana buƙatar mataki",
    },
    payments: {
      listAriaLabel: "Biyan kuɗi na Studio",
      rowAriaLabelTemplate: "{label} · {status}",
      dueTemplate: "Ƙarshen {stamp}",
      updatedTemplate: "An sabunta {stamp}",
      subTemplate: "{amount} · {method} · {due}",
    },
    paymentStatusLabels: {
      pending: "a jira",
      paid: "an biya",
      approved: "an amince",
      settled: "an sasanta",
      proof_uploaded: "hujja an ɗora",
      proof_submitted: "hujja an miƙa",
      in_review: "ana dubawa",
      rejected: "an ƙi",
      overdue: "ya ƙare",
      failed: "ya kasa",
      pending_deposit: "adibas a jira",
    },
    activity: {
      listAriaLabel: "Ayyukan Studio",
      rowAriaLabelTemplate: "{title} · {stamp}",
    },
  },
  divisionLogistics: {
    metadata: {
      title: "Sufuri · isar da kaya da jigilarwa",
      description: "Kowane karbar kaya, isarwa, ETA da hujjar isar da kayan HenryCo Logistics da aka haɗa da wannan asusu — ana nuna su daga tashar sufuri zuwa cikin daki ɗaya mai natsuwa.",
    },
    hero: {
      ariaLabel: "Bayyani na sufuri",
      eyebrow: "HenryCo Sufuri",
      brand: "HenryCo Sufuri",
      title: "Kowane kunshi, daki ɗaya.",
      body: "Karbar kaya, isarwa, ETA da hujjojin isarwa — duka ana nuna su daga tashar sufuri zuwa cikin asusunka. Yi rajista sau ɗaya a",
      bodyDomain: " logistics.henrycogroup.com",
      ctaNewDelivery: "Sabuwar isarwa",
    },
    metrics: {
      ariaLabel: "Aikin sufuri",
      activeNowLabel: "Mai aiki yanzu",
      activeFootSingular: "jigilarwa a kan hanya",
      activeFootPlural: "jigilarwa a kan hanya",
      deliveredMonthLabel: "An kai · wannan watan",
      deliveredMonthFootTemplate: "{count} duka",
      onTimeRateLabel: "Adadin lokaci",
      onTimeRateFootEmpty: "Ana jiran isarwar farko da aka tsara",
      onTimeRateFootHasValue: "Daga isarwar da aka tsara",
      totalSpendLabel: "Jimillar kashewa",
      totalSpendFoot: "An biya cikin rayuwa",
    },
    map: {
      noShipmentsAriaLabel: "Babu jigilarwa tukuna",
      noShipmentsTitle: "Taswirarka za ta kunne sa'ad da ka yi rajistar isarwa ta farko",
      noShipmentsBody: "Kowane karbar kaya da isarwa mai aiki ana sa shi a nan ta atomatik. Yi rajista sau ɗaya kuma jigilarwarka za ta nuna daga shafin sufuri.",
      noShipmentsCta: "Yi rajistar isarwa",
      pendingAriaLabel: "Hangen taswira",
      pendingTitle: "Ana shirya wuri",
      pendingBody: "Jigilarwar ka mai aiki za a sa su a taswira da zarar ɓangaren dispatch ya shirya adireshin karbar kaya da isarwa.",
      activeAriaLabel: "Taswirar jigilarwa mai aiki",
      altTemplateSingular: "Taswira tana nuna {count} alamar karbar kaya da isarwa mai aiki",
      altTemplatePlural: "Taswira tana nuna {count} alamomin karbar kaya da isarwa masu aiki",
      liveBadgeTemplateSingular: "Kai tsaye · jigilarwa {count} mai aiki",
      liveBadgeTemplatePlural: "Kai tsaye · jigilarwa {count} masu aiki",
    },
    sections: {
      activeTitle: "A kan hanya yanzu",
      activeMetaTemplate: "{count} masu aiki · ana haɗawa ta atomatik daga sufuri",
      activeRailAriaLabel: "Jigilarwa masu aiki",
      emptyAriaLabel: "Babu jigilarwa mai aiki",
      emptyTitle: "Babu jigilarwa mai aiki",
      emptyBody: "Isarwarka da ta gabata suna ƙasa. Yi rajistar wata kuma za ta bayyana a nan da zarar mai isarwa ya tabbatar da karbar kaya.",
      actionsTitle: "Fara isarwa",
      actionsMeta: "Hanyoyin gajere zuwa hanyoyin gama gari",
      actionsAriaLabel: "Ayyuka masu sauri na sufuri",
      recentTitle: "An kai kwanan nan",
      recentMetaTemplate: "{recent} na ƙarshe daga {lifetime} duka",
      recentAriaLabel: "Isarwar baya-bayan nan",
      spendTitle: "Kashewa · watanni 6 da suka gabata",
      spendMeta: "An biya kawai",
      spendFigureAriaLabelTemplate: "Kashewar sufuri a cikin watanni 6 da suka gabata",
    },
    statusLabels: {
      quoteRequested: "Farashi yana jira",
      quoteSent: "Farashi a shirye",
      pendingPayment: "Ana jiran biyan kuɗi",
      scheduled: "An tsara",
      assigned: "An ba mai isarwa",
      pickupConfirmed: "An ɗauke",
      inTransit: "A kan hanya",
      delayed: "Yana jinkiri",
      attemptedDelivery: "An yi yunkurin isarwa",
      delivered: "An kai",
      completed: "An gama",
      closed: "An rufe",
      cancelled: "An soke",
      refunded: "An mayar da kuɗi",
    },
    urgencyLabels: {
      standard: "Na yau da kullum",
      sameDay: "Rana ɗaya",
      express: "Mai sauri",
      nextDay: "Kashegari",
    },
    serviceLabels: {
      scheduled: "An tsara",
      sameDay: "Rana ɗaya",
      interCity: "Tsakanin garuruwa",
      bulk: "Mai yawa",
    },
    shipment: {
      trackingCodeAriaTemplate: "Lambar bibiyar {code}",
      addressPending: "Adireshi yana jira",
      etaPending: "ETA yana jira",
      trackCta: "Bibi jigilarwa",
      openTrackingAriaTemplate: "Buɗe bibiyar don {code}",
      etaAriaTemplate: "ETA {eta}",
      etaMinutesInTemplate: "a cikin minti {minutes}",
      etaMinutesOverdueTemplate: "minti {minutes} sun shige",
      etaHoursInTemplate: "a cikin awa {hours}",
      etaHoursOverdueTemplate: "awa {hours} sun shige",
      detailSeparator: " · ",
    },
    timeline: {
      ariaLabel: "Isarwar baya-bayan nan",
      deliveredToTemplate: "An kai zuwa ga {name}",
      receiptCta: "Risidi",
    },
    quickActions: {
      ariaLabel: "Ayyuka masu sauri na sufuri",
      bookLabel: "Yi rajistar isarwa",
      bookDesc: "Karbar kaya da isarwa a cikin tsari ɗaya mai jagoranci.",
      trackLabel: "Bibi da lamba",
      trackDesc: "Matsayi kai tsaye, ETA da yanayin mai isarwa.",
      quoteLabel: "Fara da farashi",
      quoteDesc: "Farashin nuni kafin ka tabbatar.",
      addressesLabel: "Adireshin da aka adana",
      addressesDesc: "Lambobin tuntuɓa na karbar kaya da isarwa.",
      invoicesLabel: "Risidoji da takardun biyan kuɗi",
      invoicesDesc: "PDF mai alama don kowane jigilarwa.",
      supportLabel: "Tallafin sufuri",
      supportDesc: "Buɗe tattaunawa da aka haɗa da asusunka.",
    },
    spend: {
      figureAriaLabel: "Kashewar sufuri a cikin watanni 6 da suka gabata",
      emptyTick: "—",
    },
  },
  settings: {
    pageTitle: "Saituna da Zaɓuɓɓuka",
    pageDescription:
      "Sarrafa bayanan martabar ka, zaɓuɓɓukan sadarwa, ikon sirri, da hanyoyin neman bayanai da hannu.",
    profileSectionKicker: "Bayanan Martaba",
    notificationsSectionKicker: "Zaɓuɓɓukan Sanarwa",
  },
  addresses: {
    metadata: {
      title: "Adireshi",
      description:
        "Sarrafa adireshin ka da aka adana (gida, ofis, shago…) — ana amfani da su a isar da kayayyaki, ajiyar lokuta, da tabbatar da KYC.",
    },
    hero: {
      title: "Adireshi",
      description:
        "Sarrafa adireshin ka da aka adana (gida, ofis, shago…) — ana amfani da su a isar da kayayyaki, ajiyar lokuta, da tabbatar da KYC.",
    },
    card: {
      defaultBadge: "Tsoho",
      kycVerifiedBadge: "KYC tabbatacce",
      setDefaultCta: "Sanya tsoho",
      editCta: "Gyara",
      deleteCta: "Share",
    },
    deleteConfirm: {
      prompt: "Share wannan adireshi? Ba za a iya warware shi ba.",
      confirmCta: "Share",
      cancelCta: "Soke",
    },
    empty: {
      body:
        "Ba ka ƙara wani adireshi ba tukuna. Ƙara naka na farko don saurin biyan kuɗi a duk HenryCo.",
    },
    add: {
      cta: "Ƙara adireshi",
      formTitle: "Ƙara sabon adireshi",
      editFormTitleTemplate: "Gyara {label}",
      maxedNoticeTemplate:
        "Ka ƙara mafi yawan irin adireshi {count} (gida, ofis, shago, ɗakin ajiya, madadin 1, madadin 2). Gyara ko share ɗaya don ƙara sabon adireshi.",
    },
  },
  search: {
    metadata: {
      title: "Bincika Asusu",
      description: "Bincika tafiyar aikin asusun HenryCo da hanyoyin sashe da aka haɗa.",
    },
    hero: {
      title: "Bincika tafiyar aikin HenryCo ɗinka.",
      description:
        "Tafi kai tsaye zuwa daidaitattun ayyukan asusu da hanyoyin sashe da aka haɗa, ba tare da koma kan dashboards na gama-gari ba.",
    },
    placeholder: "Bincika asusu: sanarwa, jaka, takardun biya, tallafi, neman Jobs...",
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
    smartHomeEmptyFallback: "欢迎 — 从一个小小的第一步开始。一旦有动态，您的实时信号就会显示在这里。",
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
    priorityFallback: {
      low: "平静",
      normal: "常规",
      high: "高",
      urgent: "紧急",
    },
    eyebrow: "操作队列 · 实时",
    guidanceTitle: "一个队列，覆盖所有业务板块。",
    overviewAria: "任务概览",
    volumeAria: "任务量",
    pendingAria: "待办任务",
    sideAria: "队列工作方式",
    bySource: "按来源",
    openTotalLabel: "未结总数",
    nothingBlocking: "目前没有任何阻塞",
    resolveBlockers: "解决后即可打通其他通道",
    routine: "常规",
    divisionRepresentedSingular: "涉及 {count} 个业务板块",
    divisionRepresentedPlural: "涉及 {count} 个业务板块",
    headlineEmpty: "队列中没有任何事项。",
    headlineBlockerSingular: "需处理 {count} 个阻塞项。",
    headlineBlockerPlural: "需处理 {count} 个阻塞项。",
    headlineUrgentSingular: "需清理 {count} 个紧急任务。",
    headlineUrgentPlural: "需清理 {count} 个紧急任务。",
    headlineActiveSingular: "需处理 {count} 个任务。",
    headlineActivePlural: "需处理 {count} 个任务。",
    headlineCalmSingular: "队列中有 {count} 个事项。",
    headlineCalmPlural: "队列中有 {count} 个事项。",
    blurbEmpty: "您的账户一切就绪 — 验证、付款和敏感审核通道都已畅通。一旦有新动作，我们会自动在这里显示。",
    blurbRisk: "这些事项会阻止 HenryCo 中更高信任等级的操作 — 钱包提现、Marketplace 卖家审批、雇主验证。清理后即可打通各条通道。",
    blurbActive: "每一行都能让您一键直达下一步操作。筛选器、优先级标签和深链接在所有 HenryCo 业务板块中保持一致。",
    metaEmpty: "您已清空。任何新事项到达后会出现在这里。",
    metaCount: "{count} 个未结 · 按优先级和阻塞状态排序。",
  },
  security: {
    title: "安全",
    description: "查看最近的安全活动、更改密码，并在需要时结束 HenryCo 会话。",
    heroAriaLabel: "安全概览",
    hero: {
      trustScoreLabel: "信任评分",
      nextTierPrefix: "下一级 ·",
      nextTierAriaTemplate: "下一等级 {tier}",
      accountActiveSingularTemplate: "账户已活跃 {days} 天",
      accountActivePluralTemplate: "账户已活跃 {days} 天",
      flaggedEventsSingularTemplate: "记录中有 {count} 个被标记事件 · 请查看下方",
      flaggedEventsPluralTemplate: "记录中有 {count} 个被标记事件 · 请查看下方",
      statusEyebrow: {
        secure: "安全与访问 · 安全",
        watch: "安全与访问 · 建议处理",
        risk: "安全与访问 · 标记风险",
      },
      statusHeadline: {
        secure: "您的账户安全无虞。",
        watch: "几步操作即可让您的账户更稳固。",
        risk: "我们标记了一项需要您关注的活动。",
      },
      statusBlurb: {
        secure: "没有可疑事件，验证状态良好，HenryCo 提供的所有高信任操作都对您开放。",
        watch: "没有出错 — 但少数信号（邮箱确认、身份审核、重复联系人匹配）能提升您的信任评分并打通更多通道。",
        risk: "近期事件被归类为高风险。请查看下方的活动记录，如有异常请更换密码。",
      },
    },
    signalsTitle: "信号",
    signalsMeta: "我们的验证和评分引擎目前在您账户上看到的内容。",
    signalsAriaLabel: "安全信号",
    guideTitle: "您的位置 · 下一步推进",
    guideMetaTemplate: "诚实评分，不是营销数字。{tier}。",
    allLanesOpen: "所有通道畅通",
    accountActionsTitle: "账户操作",
    accountActionsMeta: "您可直接掌控的常规控制项。",
    changePasswordTitle: "更改您的密码",
    signOutEverywhereTitle: "全部退出登录",
    suspiciousEventFoot: "请查看下方的活动记录。",
    noSuspiciousEventFoot: "最近的审核窗口内没有任何标记。",
    activityAriaLabel: "近期安全事件",
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
  messages: {
    metadata: {
      title: "消息 · HenryCo",
      description:
        "支持、市场、招聘、工作室、护理、房产、物流和学习的统一收件箱。",
    },
    hero: {
      eyebrow: "HenryCo · 统一收件箱",
      ariaLabel: "收件箱概览",
      ariaTiles: "收件箱数量",
      ariaSide: "按门户",
      sideLabel: "按门户",
      sideBody:
        "每个门户都汇聚到这一个收件箱。支持、市场订单、面试、工作室项目和护理预约都按时间顺序在此呈现。",
    },
    headlines: {
      zero: "整个 HenryCo 收件箱已清空。",
      calmOne: "有一条会话在等你回复。",
      calmMany: "有 {count} 条会话处于打开状态。",
      busy: "{unread} 条未读 · 你的门户中有 {open} 条打开。",
      overloaded: "{open} 条打开会话中有 {unread} 条未读。",
    },
    blurbs: {
      zero: "支持、市场、招聘、工作室、护理、房产、物流和学习的所有事项均已确认。",
      calm: "现在简短回复一句,就能在明天之前结清这一轮。",
      busy: "点击一行打开会话,或一次筛选一个门户。",
      overloaded: "按部门逐一处理 — 最新会话在顶部。",
    },
    tiles: {
      openLabel: "打开",
      openFootEmpty: "没有进行中的事项",
      openFootActive: "等待跟进的会话",
      unreadLabel: "未读",
      unreadFootEmpty: "收件箱已处理完毕",
      unreadFootActive: "点击一行打开会话",
      portalsLabel: "门户",
      portalsFootEmpty: "护理、市场、工作室、招聘等",
      portalsFootSingular: "一个部门活跃",
      portalsFootPlural: "{count} 个部门参与",
    },
    sideTitle: {
      empty: "所有部门均无动态",
      singular: "一个部门有动态",
      plural: "{count} 个部门同时活跃",
    },
    section: {
      title: "会话",
      ariaLabel: "收件箱会话",
      metaEmpty: "暂时没有内容 — 每个门户都汇聚到此收件箱",
      metaSingular: "{count} 条会话",
      metaPlural: "{count} 条会话",
    },
    chips: {
      ariaLabel: "按门户筛选收件箱",
      allThreads: "所有会话",
    },
    empty: {
      eyebrow: "收件箱安静",
      titleAll: "没有等你处理的事项。",
      titleFilter: "此门户下还没有会话。",
      bodyAll:
        "支持、市场、招聘、工作室、护理、房产、物流和学习都会汇聚到这里 — 任何跨门户事项一旦开始就会进入此列表。",
      bodyFilter:
        "切换筛选片以查看其他门户,或浏览所有会话以确认没有遗漏。",
    },
    list: {
      unreadDotLabel: "未读",
      fallbackTime: "—",
    },
    divisionLabels: {
      support: "支持",
      marketplace: "市场",
      jobs: "招聘",
      studio: "工作室",
      care: "护理",
      property: "房产",
      logistics: "物流",
      learn: "学习",
    },
  },
  wallet: {
    hero: {
      ariaLabel: "钱包余额",
      eyebrow: "HenryCo 钱包 · 实时",
      availableLabel: "可用余额",
      balanceAriaTemplate: "可用余额 {amount} {currency}",
      settlementFallback: "按当日 HenryCo 汇率结算为您的本地货币。",
      ctas: { fund: "充值钱包", withdraw: "提现" },
      tiles: {
        verifiedLabel: "已核实余额",
        verifiedFoot: "可在所有 HenryCo 服务中使用",
        pendingFundingLabel: "待入账",
        pendingFundingFoot: "在财务确认前单独保留",
        pendingWithdrawalLabel: "已为提现保留",
        pendingWithdrawalFoot: "在到账完成前保留",
      },
    },
    sections: {
      actionsTitle: "钱包操作",
      actionsMeta: "充值、提现、付款、对账",
      pendingTitle: "待处理操作",
      pendingMeta: "与可用余额分开管理",
      flowTitle: "您的资金流向",
      flowMeta: "近 30 天 · 近 6 个月 · 按部门",
      fundingTitle: "近期充值申请",
      fundingMetaTemplate: "{count} 项审核中",
      activityTitle: "活动",
      activityMetaTemplate: "最近 {count}",
    },
    quickActions: {
      ariaLabel: "钱包快捷操作",
      addFundsLabel: "充值",
      addFundsDesc: "银行转账,凭证上传,即时确认。",
      withdrawLabel: "提现",
      withdrawDesc: "将可用余额转入已核实银行账户。",
      paymentsLabel: "付款",
      paymentsDesc: "最近收费、退款及保存的支付方式。",
      receiptsLabel: "收据与发票",
      receiptsDesc: "覆盖各部门的品牌 PDF。",
    },
    pendingOps: {
      fundingKicker: "待入账",
      fundingDescEmpty: "您转入的资金会保留在此,直到财务确认银行参考号。",
      fundingDescSingular: "{count} 项申请审核中——凭证可推动队列前进。",
      fundingDescPlural: "{count} 项申请审核中——凭证可推动队列前进。",
      fundingCta: "打开充值通道",
      withdrawalKicker: "待提现",
      withdrawalDescEmpty: "提现在财务审核期间在此排队——您的可用余额绝不会被重复承诺。",
      withdrawalDescSingular: "{count} 项提现等待到账。已从可用余额中保留。",
      withdrawalDescPlural: "{count} 项提现等待到账。已从可用余额中保留。",
      withdrawalCta: "打开提现通道",
    },
    spend: {
      figureAriaLabel: "近 6 个月支出",
      last30Eyebrow: "支出 · 近 30 天",
      byDivisionEyebrow: "按部门",
      distributionAriaLabel: "按部门划分的支出分布",
      trendFlat: "持平",
      trendBelowTemplate: "比上一个 30 天低 {pct}%",
      trendAboveTemplate: "比上一个 30 天高 {pct}%",
      trendTitleTemplate: "对比上一个 30 天 (₦{amount})",
    },
    trust: {
      ariaLabel: "提现准备度",
      heading: "提现准备度",
      identityTitle: "身份已核实",
      identityDescDoneTemplate: "{label}。提现到账所需。",
      identityDescTodoTemplate: "{label}。完成一次以解锁提现。",
      identityCta: "继续 →",
      pinTitle: "提现 PIN",
      pinDescDone: "您的提现 PIN 已设置。",
      pinDescTodo: "设置 4 位 PIN 以授权每次提现。",
      pinCta: "设置 PIN →",
      payoutTitle: "收款方式",
      payoutDescSingular: "已核实 1 个收款方式。",
      payoutDescPluralTemplate: "已核实 {count} 个收款方式。",
      payoutDescEmpty: "添加银行账户以接收提现。",
      payoutCtaManage: "管理 →",
      payoutCtaAdd: "添加方式 →",
      verificationLabels: {
        verified: "身份已核实",
        pending: "核实审核中",
        rejected: "核实需要重新提交",
        notSubmitted: "尚未提交身份",
      },
    },
    activity: {
      ariaLabel: "钱包交易",
      emptyTitle: "暂无交易",
      emptyBody: "为钱包充值后,您的活动流将在此显示 HenryCo 各项服务的每笔入账、出账、退款和奖励。",
      fallbackTitle: "钱包交易",
    },
    funding: {
      proofUploaded: "已上传凭证",
      awaitingProof: "等待凭证",
      ariaLabelTemplate: "充值申请 {reference} 金额 ₦{amount}",
    },
    statusLabels: {
      pending: "等待审核",
      awaiting_proof: "等待凭证",
      awaiting_review: "等待审核",
      in_review: "审核中",
      rejected: "已拒绝",
      cancelled: "已取消",
      expired: "已过期",
      completed: "已确认",
      verified: "已确认",
      approved: "已批准",
      paid: "已支付",
    },
  },
  support: {
    metadata: {
      title: "支持",
      description: "获取任何 HenryCo 服务的帮助。",
    },
    hero: {
      title: "支持",
      description: "获取任何 HenryCo 服务的帮助。",
      newRequestCta: "新建请求",
    },
    summary: {
      openRequestsTemplate: "{count} 个未处理请求",
      escalatedTemplate: "{count} 个已升级",
      escalationNote:
        "每条消息都会被记录。如果分流识别到风险或紧急情况,工作人员将自动获得优先队列。",
    },
    quickHelp: {
      helpCenterLabel: "帮助中心",
      helpCenterDesc: "浏览常见问题和指南",
      contactLabel: "联系我们",
      contactDesc: "电子邮件或电话支持",
      liveChatLabel: "在线聊天",
      liveChatDesc: "与我们的团队聊天",
    },
    threads: {
      sectionKicker: "您的请求",
      emptyTitle: "暂无支持请求",
      emptyDescription:
        "您还没有创建任何支持请求。如有需要,我们随时为您提供帮助。",
      createCta: "创建请求",
    },
    statusLabels: {
      open: "未处理",
      awaitingReply: "等待回复",
      inProgress: "进行中",
      resolved: "已解决",
      closed: "已关闭",
    },
    priorityLabels: {
      low: "低",
      normal: "正常",
      high: "高",
      urgent: "紧急",
    },
  },
  payments: {
    hero: {
      title: "支付方式",
      description: "管理您已保存的支付选项,实现快速结账。",
      addMethodCta: "添加方式",
    },
    empty: {
      title: "暂无支付方式",
      description: "添加借记卡、银行账户或其他支付方式,可在所有 HenryCo 服务中快速结账。",
      cta: "添加支付方式",
    },
    card: {
      savedMethodFallback: "已保存的方式",
      cardLastFourTemplate: "•••• {last4}",
    },
    wallet: {
      eyebrow: "HenryCo 钱包",
      body: "您的 HenryCo 钱包始终可作为支付选项使用。",
      manageCta: "管理钱包",
    },
  },
  savedItems: {
    metadata: {
      title: "稍后保存",
      description: "您从任何 HenryCo 购物车中暂存的商品,我们会为您保留 90 天,并在到期前一周提醒。",
    },
    hero: {
      title: "稍后保存",
      description: "您从任何 HenryCo 购物车中暂存的商品。我们会为您保留 90 天,并在到期前一周提醒您。",
    },
    summary: {
      activeTemplate: "{count} 件有效",
      expiredTemplate: "{count} 件已过期",
      expiryNote: "商品自保存之日起 90 天后过期。我们会提前一周提醒您。",
      savedTemplate: "已保存 {count} 件",
    },
    toolbar: {
      showLabel: "显示",
      allDivisions: "所有版块",
      sortLabel: "排序",
      sortNewest: "最新优先",
      sortOldest: "最早优先",
      sortExpiring: "即将过期",
    },
    selection: {
      selectedTemplate: "已选择 {count} 件",
      clear: "清除",
      moving: "正在移动…",
      moveSelectedToCart: "将所选移至购物车",
      selectAllOnPage: "选择本页全部",
    },
    empty: {
      title: "尚未保存任何商品",
      description: "当您发现暂时不想购买的商品时,可从购物车将其保存以备稍后。我们会保留您当时看到的价格,并在到期前一周提醒您。",
      browseCta: "浏览",
    },
    card: {
      deselectItem: "取消选择",
      selectItem: "选择商品",
      savedItemFallback: "已保存商品",
      expiresToday: "今天过期",
      expiresInTemplate: "{days} 天{plural}后过期",
      expiredNotice: "已过期 — 恢复将重置 90 天有效期",
      moveToCart: "移至购物车",
      moving: "正在移动…",
      removeFromSaved: "从保存项移除",
      openOriginal: "打开原始商品",
    },
    expired: {
      sectionKicker: "最近过期",
      sectionNote: "恢复将重置 90 天有效期。",
    },
  },
  documents: {
    metadata: {
      title: "文档",
      description: "您的收据、证书、合同和重要文件——私密保存,可在所有 HenryCo 板块中访问。",
    },
    hero: {
      eyebrow: "个人保险库",
      title: "文档",
      body: "您的收据、证书、合同和重要文件。",
    },
    toolbar: {
      uploadCta: "上传文档",
      filterLabel: "筛选",
      allCategories: "所有类别",
      sortLabel: "排序",
      sortNewest: "最新优先",
      sortOldest: "最早优先",
    },
    types: {
      document: "文档",
      receipt: "收据",
      certificate: "证书",
      id_document: "身份证件",
      contract: "合同",
      other: "其他",
    },
    categories: {
      all: "全部",
      document: "文档",
      receipt: "收据",
      certificate: "证书",
      id_document: "身份证件",
      contract: "合同",
      other: "其他",
    },
    card: {
      uploadedOnTemplate: "上传于 {date}",
      sizeTemplate: "{size}",
      downloadLabel: "下载",
      noFileAttached: "未附加文件",
      openOriginal: "打开文档",
    },
    empty: {
      title: "暂无文档",
      description: "来自 HenryCo 服务的文档、收据和证书将保存在此处。",
    },
    summary: {
      countTemplate: "{count} 份文档{plural}",
      filteredTemplate: "显示 {total} 份中的 {count} 份",
    },
    retention: {
      eyebrow: "隐私与保留",
      title: "您的文件保持私密",
      body: "文档在静态时加密,仅您可见,且在 HenryCo 账户存续期间一直保留,除非您将其删除。",
    },
  },
  subscriptions: {
    metadata: {
      title: "订阅",
      description:
        "来自各 HenryCo 部门、已同步至共享账户中心的活动订阅的只读摘要。",
    },
    hero: {
      eyebrow: "活动订阅",
      title: "订阅",
      description:
        "只读的订阅摘要，来自当前将订阅记录同步至共享账户中心的各个部门。",
    },
    empty: {
      title: "暂无已同步的订阅",
      description:
        "这可能表示您没有任何活动套餐，或该部门尚未将其订阅记录发布到共享账户账本中。",
    },
    card: {
      planFallback: "订阅套餐",
      tierSeparator: " · ",
      amountLabel: "金额",
      cycleLabel: "周期",
      renewsLabel: "续订",
      renewsFallback: "—",
    },
    statusLabels: {
      active: "活动中",
      paused: "已暂停",
      cancelled: "已取消",
      expired: "已过期",
      past_due: "已逾期",
      trialing: "试用中",
      grace: "宽限期",
      pending: "待处理",
      unknown: "未知",
    },
    cycleLabels: {
      monthly: "每月",
      yearly: "每年",
      annual: "年度",
      quarterly: "每季度",
      weekly: "每周",
      biweekly: "每两周",
      daily: "每天",
      one_time: "一次性",
      notSet: "未设置",
    },
    cta: {
      upgrade: "升级套餐",
      downgrade: "降级套餐",
      cancel: "取消订阅",
      manage: "在所属部门管理",
      resume: "恢复订阅",
    },
    paymentIssue: {
      title: "支付需要处理",
      description:
        "我们未能扣款最近一次续订。请更新您的支付方式以保持此订阅处于活动状态。",
      updatePaymentCta: "更新支付方式",
    },
    summary: {
      activeTemplate: "{count} 项活动中",
      pausedTemplate: "{count} 项已暂停",
      totalTemplate: "{count} 项套餐",
    },
  },
  referrals: {
    metadata: {
      title: "推荐",
      description: "邀请符合条件的客户加入 HenryCo,并跟踪奖励从待处理、审核到记入帐户的全过程。",
    },
    hero: {
      title: "推荐",
      description: "邀请符合条件的客户加入 HenryCo,并跟踪奖励从待处理、审核到记入帐户的全过程。",
    },
    code: {
      eyebrow: "您的推荐代码",
      shareLinkLabel: "分享链接",
      copyCodeTitle: "复制代码",
      copyLinkTitle: "复制链接",
      copyLinkLabel: "复制链接",
      copiedToast: "已复制!",
      rewardNote:
        "奖励:每位合格推荐 {amount}。被推荐人在 {days} 天保留期内完成已付款订单后,奖励即可解锁。",
    },
    stats: {
      totalReferred: "推荐总数",
      signedUp: "已注册",
      qualified: "已合格",
      flagged: "已标记",
      pendingRewards: "待处理奖励",
      releasedRewards: "已发放奖励",
    },
    howItWorks: {
      eyebrow: "工作原理",
      step1Title: "分享您的代码",
      step1Body: "分享您的独特代码或链接。通过您的链接访问任何 HenryCo 子域名的朋友都将被自动追踪。",
      step2Title: "他们进行交易",
      step2Body:
        "注册后,该推荐进入 {days} 天保留期。我们仅追踪被推荐帐户一次——自我推荐、家庭重复和重复注册均不符合资格。",
      step3Title: "合格后奖励到账",
      step3Body: "合格推荐在财务审核后将 {amount} 记入您的 HenryCo 钱包。待处理奖励在审核前不可支出。",
    },
    policy: {
      eyebrow: "推荐政策",
      qualifying: "合格转化指被推荐帐户完成了通过支付和信任验证的合格 HenryCo 操作。",
      enforcement:
        "对于自我推荐、重复转化循环、退单、退款或可疑奖励模式,HenryCo 可保留、撤销或取消奖励。",
      separation: "您的仪表板分别显示推荐匹配和奖励历史,以便追踪的注册不会与已记入钱包的收益混淆。",
    },
    referralsList: {
      eyebrow: "您的推荐",
      emptyTitle: "尚无推荐",
      emptyDescription:
        "分享您的推荐代码以开始邀请。一旦有人使用您的链接注册,推荐将在此处显示。",
      refereeFallback: "推荐注册",
      signedUpTemplate: "已于 {date} 注册",
      qualifiedTemplate: "已于 {date} 合格",
    },
    statusLabels: {
      pending: "等待注册",
      converted: "已注册 · 保留期",
      qualified: "已合格 · 奖励已解锁",
      flagged: "已标记 · 反欺诈防护",
      expired: "已过期",
    },
    flagReasons: {
      selfReferral: "已阻止自我推荐",
      duplicateEmail: "被推荐人电子邮件重复",
      deviceReuse: "设备重复使用",
    },
    rewards: {
      eyebrow: "奖励历史",
      emptyTitle: "尚无奖励",
      emptyDescription: "合格转化通过验证和反滥用审查后,记入的奖励将在此处显示。",
      referralRewardFallback: "推荐奖励",
      paidTemplate: "已于 {date} 支付",
      statusLabels: {
        held: "已保留",
        pending: "待处理",
        released: "已发放",
        paid: "已支付",
        cancelled: "已取消",
      },
    },
  },
  divisionCare: {
    metadata: {
      title: "Care · 关联预订",
      description: "在一处跟踪与此账户关联的每一笔 HenryCo Care 预订——状态、付款核验和下一步运营操作。",
    },
    hero: {
      eyebrow: "Care · 实时",
      sideKicker: "此空间的工作方式",
      sideTitle: "在 Care 预订,在此跟进。",
      sideBody: "在 HenryCo Care 完成的每一笔预订都会映射到此空间——跟踪码、付款状态和下一步运营动作会自动出现在这里。下方仪表板将随服务进度持续同步。",
      breakdownLabel: "按状态",
      tilesAriaLabel: "Care 预订摘要",
      tileLabels: {
        total: "预订",
        inFlight: "服务中",
        payment: "待付款",
        completed: "已完成",
      },
      tileFoot: {
        totalEmpty: "完成首笔 Care 服务预订以开始",
        totalWithTemplate: "{count} 笔与此账户关联",
        inFlightEmpty: "当前没有进行中的事项",
        inFlightWith: "实时状态已镜像至下方",
        paymentEmpty: "没有待核验的付款",
        paymentWith: "在下方提交或查看收据",
        completedEmpty: "尚无已完成的服务",
        completedWith: "已由 Care 团队标记为完成",
      },
      breakdownLabels: {
        inFlight: "服务中",
        scheduled: "已排期",
        payment: "待付款",
        completed: "已完成",
      },
      state: {
        empty: {
          headline: "完成你的首笔 Care 服务预订。",
          blurb: "你在此处预订的 Care 服务会自动同步到此空间——跟踪码、付款状态以及下一步运营动作。",
          ctaPrimary: "预订服务",
          ctaSecondary: "打开跟踪",
        },
        attention: {
          headlineTemplateSingular: "{count} 项待处理动作。",
          headlineTemplatePlural: "{count} 项待处理动作。",
          blurb: "有一项或多项预订等待付款核验或后续跟进。打开下方预订进行处理。",
          ctaPrimary: "查看预订",
          ctaSecondary: "打开跟踪",
        },
        active: {
          headlineTemplateSingular: "{count} 项服务进行中。",
          headlineTemplatePlural: "{count} 项服务进行中。",
          blurb: "实时跟踪、付款核验和下一步运营动作均从 HenryCo Care 镜像至此空间。",
          ctaPrimary: "打开跟踪",
          ctaSecondary: "预订服务",
        },
        calm: {
          headlineTemplateSingular: "{count} 笔预订在册。",
          headlineTemplatePlural: "{count} 笔预订在册。",
          blurb: "你的 Care 预订、跟踪码、收据与即将进行的动作——全部集中于一处,实时同步。",
          ctaPrimary: "预订服务",
          ctaSecondary: "打开跟踪",
        },
      },
    },
    sections: {
      glance: "下一步动作",
      glanceMeta: "最紧迫的预订会显示在此。",
      bookings: "所有预订",
      bookingsEmpty: "登录后完成的预订会实时显示在此。",
      bookingsMetaTemplateSingular: "{count} 笔预订 · 筛选、翻页,打开任一笔查看实时详情。",
      bookingsMetaTemplatePlural: "{count} 笔预订 · 筛选、翻页,打开任一笔查看实时详情。",
      activity: "近期活动",
      activityEmpty: "状态更新、收据和评价会在发生时显示在此。",
      activityMetaTemplateSingular: "{count} 项更新 · 最新优先",
      activityMetaTemplatePlural: "{count} 项更新 · 最新优先",
    },
    empty: {
      title: "尚无关联的 Care 预订",
      body: "登录后在 Care 完成的预订会立即出现在此。当旧预订的邮箱或手机号匹配上你的共享资料时,也会显示在此。",
    },
    glance: {
      nextActionLabel: "下一步动作",
      serviceLabel: "服务",
      pickupLabel: "取件",
      balanceLabel: "应付余额",
      trackingLabel: "跟踪",
      serviceFallback: "Care 服务",
    },
    activityAriaLabel: "Care 活动",
    status: {
      live: "服务中",
      scheduled: "已排期",
      completed: "已完成",
      issue: "需处理",
      payment: "付款核验",
    },
    statusValueLabels: {
      booked: "已预订",
      awaiting_payment: "待付款",
      receipt_submitted: "收据已提交",
      under_review: "审核中",
      delivered: "已交付",
      customer_confirmed: "客户已确认",
      inspection_completed: "检查已完成",
      service_completed: "服务已完成",
      cancelled: "已取消",
      issue: "问题",
      exception: "异常",
      rejected: "已拒绝",
    },
    formatLabels: {
      toBeScheduled: "待排期",
      shortMonths: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
    },
    dashboard: {
      filters: {
        all: "全部",
        unpaid: "应付余额",
        receipt: "收据 / 评价",
        active: "进行中",
        completed: "已完成",
        issue: "问题",
      },
      filtered: "已筛选",
      bookingSingular: "笔预订",
      bookingPlural: "笔预订",
      metrics: {
        visible: "可见预订",
        visibleHint: "与此账户关联的真实 Care 预订。",
        balance: "未结余额",
        balanceHintSomeTemplate: "{count} 笔预订仍需跟进付款。",
        balanceHintNone: "当前没有未付的 Care 余额。",
        receiptQueue: "收据队列",
        receiptQueueHintSome: "已提交收据的预订仍在等待核验。",
        receiptQueueHintNone: "此账户没有未核验的收据积压。",
        completed: "已完成",
        completedHintSome: "已完成的预订可进入评价跟进。",
        completedHintNone: "服务关闭后,已完成的 Care 预订将显示在此。",
      },
      linkedBookings: "关联的 Care 预订",
      linkedBookingsDescription: "你的 Care 预订、付款状态以及即将进行的动作。",
      onThisPage: "本页",
      selectedBooking: "已选预订",
      paymentSnapshot: "付款概览",
      receiptVisibility: "收据可见性",
      nextBestAction: "下一步最佳动作",
      serviceSummary: "服务摘要",
      serviceFallback: "Care 服务",
      addressPending: "地址待定",
      updated: "已更新",
      balanceDue: "应付余额",
      nextMove: "下一步",
      paginationLabel: "Care 预订分页",
      pageLabel: "第",
      of: "/",
      perPage: "每页",
      previous: "上一页",
      next: "下一页",
      customerFallback: "客户",
      scheduledDate: "排期日期",
      notScheduled: "尚未排期",
      timeWindow: "时间段",
      windowPending: "时段待定",
      pickupAddress: "取件地址",
      returnAddress: "退回 / 送达地址",
      returnAddressFallback: "若未在预订时更改,默认使用取件地址",
      trackingCode: "跟踪码",
      quotedTotal: "报价总额",
      amountRecorded: "已记金额",
      receiptState: "收据状态",
      receiptsSubmitted: "已提交收据",
      lastSubmission: "最后提交",
      noReceiptYet: "尚未提交收据",
      openLiveBooking: "打开实时预订",
      leaveReview: "留下评价",
    },
  },
  divisionProperty: {
    metadata: {
      title: "Property · 收藏与询盘",
      description: "您的 Property 收藏清单、询盘、看房和房源跟进 — 在 HenryCo Property 上的每一项操作都会同步到此账户房间。",
    },
    hero: {
      eyebrow: "Property · 实时",
      ariaLabel: "Property 概览",
      browseListingsCta: "浏览房源",
      savedShortlistCta: "收藏清单",
      tilesAriaLabel: "Property 活动",
      tileLabels: {
        saved: "已收藏",
        inquiries: "询盘",
        viewings: "看房",
        listings: "房源",
      },
      tileFoot: {
        savedManagedTemplate: "{count} 套由 HenryCo 托管",
        savedEmpty: "收藏房源以建立清单",
        savedWith: "随时对比与回访",
        inquiriesEmpty: "暂无对话",
        inquiriesWith: "后续跟进会进入此房间",
        viewingsEmpty: "为已收藏的房源申请看房",
        viewingsWith: "确认信息跨设备同步",
        listingsEmpty: "在 Property 提交一条房源",
        listingsWith: "审核结果将在此呈现",
      },
      sideAriaLabel: "此房间的运作方式",
      sideKicker: "此房间的运作方式",
      sideTitle: "在 Property 发现,在此跟进。",
      sideBody:
        "在 HenryCo Property 收藏房源、申请看房或发起询盘 — 每一项操作都会同步到此账户房间,让您可以跨设备从停下的地方继续。",
      sideBodyMuted:
        "HenryCo 托管的房源带有“托管”标识 — 审核、勘察与租约跟进均由 Property 团队协调。",
      breakdownAriaLabel: "活动明细",
      breakdownLabel: "按活动分类",
      breakdownLabels: {
        saved: "已收藏",
        inquiries: "询盘",
        viewings: "看房",
        listings: "房源",
      },
      state: {
        empty: {
          headline: "开始探索 HenryCo Property。",
          blurb:
            "发现住宅租赁、出售房源以及由 HenryCo 托管的住宅。收藏您的喜爱,每一项询盘、看房或房源跟进都会自动同步到这里。",
        },
        discover: {
          headlineTemplateSingular: "{count} 套已入清单的住宅。",
          headlineTemplatePlural: "{count} 套已入清单的住宅。",
          blurb:
            "收藏的住宅,随时可回访。打开房源申请看房或发起询盘 — 后续会直接同步回此房间。",
        },
        active: {
          viewingHeadlineTemplateSingular: "已安排 {count} 次看房。",
          viewingHeadlineTemplatePlural: "已安排 {count} 次看房。",
          inquiryHeadlineTemplateSingular: "{count} 项询盘进行中。",
          inquiryHeadlineTemplatePlural: "{count} 项询盘进行中。",
          blurb:
            "您的收藏清单、询盘与看房日程汇聚于一处。从停下的地方继续 — 每一项操作都从 HenryCo Property 实时同步。",
        },
      },
    },
    sections: {
      saved: "已收藏清单",
      savedMetaEmpty: "在 HenryCo Property 收藏房源以建立您的清单。",
      savedMetaTemplate: "已收藏 {saved} 套 · 其中 {managed} 套由 HenryCo 托管",
      activity: "近期活动",
      activityMetaEmpty: "询盘、看房与房源审核会实时在此呈现。",
      activityMetaTemplateSingular: "{count} 条更新 · 最新优先",
      activityMetaTemplatePlural: "{count} 条更新 · 最新优先",
    },
    empty: {
      savedTitle: "尚未收藏任何房源",
      savedBody:
        "在 Property 发现住宅租赁、出售房源以及由 HenryCo 托管的住宅。您收藏的内容会自动同步到这里。",
      activityTitle: "尚无 Property 活动",
      activityBody:
        "在 HenryCo Property 打开房源以申请看房或发送询盘 — 从第一条消息到审核的每一步都会出现在这里。",
    },
    activity: {
      ariaLabel: "Property 活动",
      titles: {
        inquiry: "房产询盘",
        viewing: "看房申请",
        listing_submitted: "已提交房源",
        listing_updated: "已更新房源",
        listing_reviewed: "房源审核完成",
      },
    },
    gallery: {
      ariaLabel: "已收藏房源",
      managedBadge: "托管",
      featuredBadge: "精选",
      locationPending: "位置待定",
      contactAgent: "联系经纪人",
      savedAtTemplate: "于 {date} 收藏",
      bedSingular: "卧室",
      bedPlural: "卧室",
      bathSingular: "卫浴",
      bathPlural: "卫浴",
      sizeSqmTemplate: "{size} 平米",
    },
  },
  divisionJobs: {
    metadata: {
      title: "Jobs · 候选人仪表板",
      description: "在此跟踪与本账户关联的每一次 HenryCo Jobs 申请、收藏职位、招聘方动态和个人资料准备度信号。",
    },
    header: {
      title: "Jobs",
      description: "您的申请、收藏职位、招聘方动态和个人资料强度——一站汇总。",
      candidateModuleCta: "候选人模块",
      interviewRoomsCta: "面试间",
      browseLiveRolesCta: "浏览在线职位",
    },
    hero: {
      eyebrow: "您的账户",
      headline: "您的求职动态,一站汇总。",
      body: "申请、收藏职位、招聘方动态和个人资料准备度均已关联到您的 HenryCo 账户。",
      statsAriaLabel: "求职活动摘要",
      statLabels: {
        applications: "进行中的申请",
        saved: "收藏职位",
        readiness: "资料准备度",
        updates: "招聘方动态",
      },
      statDetails: {
        applicationsLeadingTemplate: "{stage} 是您领先的进行阶段。",
        applicationsEmpty: "暂无进行中的申请。",
        savedSome: "您的备选清单可以再做一轮筛选。",
        savedEmpty: "建立备选清单,以便更易找回合适的职位。",
        updatesLatestTemplate: "{relative} 最新动态。",
        updatesEmpty: "暂无招聘方动态。",
      },
    },
    sections: {
      nextActionsKicker: "下一步行动",
      nextActionsTitle: "现在最值得关注的事项",
      openTimelineCta: "打开时间线",
      applicationsKicker: "申请",
      applicationsTitle: "实时招聘进展",
      savedKicker: "收藏职位",
      savedTitle: "更具情境的备选清单",
      openSavedRolesCta: "打开收藏职位",
      recommendedKicker: "推荐职位",
      recommendedTitle: "与您当前信号匹配的内容",
      browseCatalogCta: "浏览职位库",
      recruiterFeedKicker: "招聘方动态",
      recruiterFeedTitle: "消息、阶段变更与提醒",
      candidateInboxCta: "候选人收件箱",
      profileKicker: "资料强度",
      profileTitle: "候选人准备度与简历质量",
      sharedInboxKicker: "共享收件箱",
      sharedInboxTitle: "与您账户关联的求职通知",
      alertsKicker: "提醒",
      alertsTitle: "已保存的搜索意图",
    },
    empty: {
      applicationsTitle: "暂无进行中的申请",
      applicationsBody: "一旦您从浏览转入正式申请,收藏职位、招聘方动态和时间线将在此显示。",
      exploreJobsCta: "探索职位",
      savedJobsTitle: "暂无收藏职位",
      savedJobsBody: "收藏有潜力的职位,在 Jobs 与账户中保留备选清单。",
      recommendedTitle: "随着 Jobs 的使用,推荐会更精准",
      recommendedBody: "当您的资料、备选清单和申请更深入时,这里的职位建议会更具针对性。",
      recruiterFeedTitle: "暂无招聘方动态",
      recruiterFeedBody: "申请阶段变更、共享的招聘方备注和应用内 Jobs 通知将在此汇集。",
      notificationsTitle: "暂无求职通知",
      notificationsBody: "未来的备选清单变动、雇主更新和申请变更将落到此处和 Jobs 模块内。",
      alertsTitle: "暂无活跃的求职提醒",
      alertsBody: "创建提醒,让符合您条件的新职位出现在 Jobs 信息流中。",
      browseRolesCta: "浏览职位",
    },
    application: {
      progressPercentTemplate: "{percent}% 完成",
      appliedAtTemplate: "{date} 已申请",
      candidateReadiness: "候选人准备度",
      recruiterConfidence: "招聘方信心",
      latestMovement: "最近招聘方动态",
      nextBestMove: "下一最优动作",
      openTimelineCta: "打开时间线",
      interviewRoomCta: "面试间",
      viewRoleCta: "查看职位",
    },
    savedJob: {
      trustTemplate: "信任度 {score}",
      savedAtTemplate: "{date} 已收藏",
    },
    recommended: {
      compFallback: "薪酬将在流程中讨论",
    },
    stageLabels: {
      applied: "已申请",
      reviewing: "审核中",
      shortlisted: "已入围",
      interview: "面试",
      offer: "录用通知",
      hired: "已录用",
      rejected: "已拒绝",
    },
    nextStep: {
      labels: {
        applied: "保持资料和简历的最新",
        shortlisted: "准备好作品和组合的背景信息",
        interview: "准备示例和时间段",
        offer: "审阅范围、时间和薪酬",
        rejected: "强化下一次申请",
      },
      bodies: {
        applied: "早期阶段中,更清晰的证明、整洁的联系方式和最新的简历更有帮助。",
        shortlisted: "入围意味着您已通过首轮信号筛选。此时精炼的证明尤为重要。",
        interview: "当您最强的工作证明和可用时间一目了然时,面试阶段进展更快。",
        offer: "在录用阶段消除模糊,而不是猜测职责。",
        rejected: "把拒绝当作信号。再次申请前,精炼摘要、示例和岗位契合。",
      },
    },
    readinessLabels: {
      interviewReady: "面试就绪",
      strongProfile: "资料强劲",
      needsProof: "需补充证明",
      needsStructure: "需补结构",
    },
    workModeLabels: {
      remote: "远程",
      hybrid: "混合",
      onsite: "现场",
    },
    employmentTypeLabels: {
      fullTime: "全职",
      partTime: "兼职",
      contract: "合同",
      internship: "实习",
      temporary: "临时",
    },
    profile: {
      readinessLabel: "准备度",
      skillsMappedLabel: "已映射技能",
      filesLabel: "文件",
      improveProfileCta: "完善资料",
      openCandidateModuleCta: "打开候选人模块",
      checklist: {
        identityLabel: "资料基础",
        identityDetail: "姓名、电话和位置齐全,便于招聘方跟进。",
        storyLabel: "职业叙述",
        storyDetail: "标题与摘要说明您的工作内容,超越一条空白记录。",
        verificationLabel: "身份验证",
        verificationDetail: "在 HenryCo 账户完成身份审核前,Jobs 信任度保持封顶。",
        proofLabel: "工作证明",
        proofDetail: "简历加作品证据让入围更顺畅。",
        skillsLabel: "已映射技能",
        skillsDetail: "至少四项技能及偏好职能可提升推荐质量。",
      },
    },
    nextActions: {
      gapTemplate: "补足{label}的空缺",
      interviewLabel: "为面试通道做准备",
      offerLabel: "回应一份在线录用",
      attentionTemplate: "{employer} 的 {title} 现在需要您的关注。",
      convertSavedLabel: "将一个收藏职位转为正式申请",
      convertSavedTemplate: "{title} 已在您的备选清单,可进入更深一轮的审阅。",
      restartLabel: "用更严格的筛选重启求职",
      restartDetail: "使用经认证雇主和内部岗位筛选,更快构建更干净的备选清单。",
    },
    alertStatus: {
      active: "活跃",
      paused: "已暂停",
    },
    recruiterUpdateTitleTemplate: "{stage} 更新",
  },
  divisionMarketplace: {
    metadata: {
      title: "Marketplace · 订单与卖家动态",
      description: "跟踪与本账户关联的每一笔 HenryCo Marketplace 订单、争议和卖家结算 —— 买家活动与卖家工作区,实时同步到一个房间。",
    },
    hero: {
      eyebrow: "Marketplace · 实时",
      ariaLabel: "Marketplace 概览",
      sideAriaLabel: "本房间如何运作",
      sideKicker: "本房间如何运作",
      sideTitle: "买与卖 —— 一个房间。",
      sideBody: "您在 Marketplace 上创建的每一笔订单、争议和结算请求都会同步到本房间。卖家工作区动态与买家订单并排呈现,marketplace 的两端一眼可见。",
      breakdownLabel: "按状态",
      breakdownAriaLabel: "活动分类",
      tilesAriaLabel: "Marketplace 动态",
      tileLabels: {
        orders: "订单",
        disputes: "争议",
        store: "店铺",
        payouts: "结算",
      },
      tileFoot: {
        ordersEmpty: "第一笔订单将出现在这里",
        ordersInMotionTemplate: "{inFlight} 进行中 · {delivered} 已送达",
        ordersDeliveredTemplate: "至今已送达 {delivered}",
        disputesClear: "一切正常",
        disputesActiveTemplate: "{open} 处理中 · {resolving} 解决中",
        storeActiveNoName: "卖家会员已激活",
        storeActiveWithNameTemplate: "店铺:{name}",
        storeApplicationTemplate: "申请:{status}",
        storeIdle: "暂未开店 —— 准备好后即可申请",
        payoutsEmptyNoneSettled: "暂无结算请求",
        payoutsSettledTemplate: "至今已结算 {count} 笔",
        payoutsPendingTemplate: "{amount} 待结算",
      },
      breakdownLabels: {
        inMotion: "进行中",
        openDisputes: "未处理争议",
        delivered: "已送达",
        pendingPayouts: "待结算款项",
      },
      state: {
        empty: {
          headline: "在 HenryCo Marketplace 开始购物。",
          blurb: "订单、争议、卖家活动与结算会在您完成交易后同步到本房间。先去 Marketplace 看看,启动第一笔吧。",
          ctaPrimary: "打开 Marketplace",
          ctaSecondary: "申请开店",
        },
        attention: {
          headlineTemplateSingular: "{count} 项事宜需要处理。",
          headlineTemplatePlural: "{count} 项事宜需要处理。",
          blurb: "争议和异常订单会置于队列顶部。打开案例补充证据或接受处理结果。",
          ctaPrimary: "查看事宜",
          ctaSecondary: "打开 Marketplace",
        },
        activeOrders: {
          headlineTemplateSingular: "{count} 笔订单进行中。",
          headlineTemplatePlural: "{count} 笔订单进行中。",
          blurb: "实时订单状态、付款状态和卖家跟进会从 HenryCo Marketplace 实时同步到本房间。",
          ctaPrimary: "打开 Marketplace",
          ctaSecondary: "申请开店",
        },
        activePayouts: {
          headlineTemplateSingular: "{count} 笔结算审核中。",
          headlineTemplatePlural: "{count} 笔结算审核中。",
          blurb: "卖家结算请求正在通过财务审核。状态更新会随团队推进同步显示。",
          ctaPrimary: "打开卖家工作区",
          ctaSecondary: "打开 Marketplace",
        },
        calmBuyer: {
          headlineTemplateSingular: "{count} 笔订单已存档。",
          headlineTemplatePlural: "{count} 笔订单已存档。",
          blurb: "您的全部 marketplace 动态集中在一个房间 —— 买家订单、卖家结算、争议结果以及每家店铺的最新状态。",
          ctaPrimary: "打开 Marketplace",
          ctaSecondary: "申请开店",
        },
        calmSeller: {
          headlineTemplateSingular: "{count} 笔订单 · 卖家在线。",
          headlineTemplatePlural: "{count} 笔订单 · 卖家在线。",
          blurb: "您的全部 marketplace 动态集中在一个房间 —— 买家订单、卖家结算、争议结果以及每家店铺的最新状态。",
          ctaPrimary: "打开 Marketplace",
          ctaSecondary: "打开卖家工作区",
        },
      },
    },
    sections: {
      matters: {
        title: "待办事宜",
        meta: "争议、卖家申请状态和待结算款项会在需要处理时出现在这里。",
        ariaLabel: "Marketplace 待办事宜",
        emptyTitle: "暂无待办",
        emptyBody: "您的 marketplace 动态一切正常 —— 没有未处理争议、没有审核中的结算,(如适用)卖家申请也已通过。",
      },
      orders: {
        title: "近期订单",
        empty: "在 Marketplace 下单后将实时显示在这里。",
        metaTemplateSingular: "{count} 笔订单 · 最新优先",
        metaTemplatePlural: "{count} 笔订单 · 最新优先",
        emptyTitle: "暂无订单",
        emptyBody: "在 HenryCo Marketplace 完成首单 —— 订单状态、付款状态及任何跟进会自动同步到这里。",
        ariaLabel: "近期订单",
      },
      activity: {
        title: "近期动态",
        empty: "状态更新、付款与评价会随发生同步到这里。",
        metaTemplateSingular: "{count} 条更新 · 最新优先",
        metaTemplatePlural: "{count} 条更新 · 最新优先",
        emptyTitle: "暂无 marketplace 动态",
        emptyBody: "订单确认、争议进展和卖家结算结果会在发生时同步到这里。",
        ariaLabel: "Marketplace 动态",
      },
    },
    matters: {
      disputes: {
        kicker: "争议",
        titleTemplateSingular: "{count} 个案例需要处理",
        titleTemplatePlural: "{count} 个案例需要处理",
        bodyLatestTemplate: "最新:{ref} · 更新于 {stamp}",
        bodyFallback: "打开队列以补充证据。",
        cta: "查看案例",
      },
      application: {
        kicker: "卖家申请",
        bodyWithStoreTemplate: "店铺:{name}",
        bodyDefault: "申请正在 HenryCo 审核队列中。",
        bodyReviewSuffixTemplate: " · {note}",
        cta: "查看状态",
        defaultStatus: "已提交",
      },
      payouts: {
        kicker: "结算审核中",
        titleTemplate: "{amount} 待结算",
        bodyTemplateSingular: "{count} 笔申请等待财务核验。",
        bodyTemplatePlural: "{count} 笔申请等待财务核验。",
        cta: "打开卖家工作区",
      },
    },
    orders: {
      rowTitleTemplate: "订单 {orderNo}",
      rowSubTemplate: "{amount} · 下单于 {stamp}",
      rowAriaLabelTemplate: "订单 {orderNo} · {status}",
      statusFallbackDraft: "草稿",
    },
    statusValueLabels: {
      delivered: "已送达",
      completed: "已完成",
      customer_confirmed: "客户已确认",
      fulfilled: "已履约",
      cancelled: "已取消",
      refunded: "已退款",
      disputed: "争议中",
      exception: "异常",
      placed: "已下单",
      paid: "已支付",
      awaiting_fulfilment: "等待履约",
      confirmed: "已确认",
      queued: "排队中",
    },
    applicationStatusLabels: {
      submitted: "已提交",
      under_review: "审核中",
      approved: "已通过",
      rejected: "已拒绝",
      pending_documents: "等待补件",
      changes_requested: "需修改",
    },
    formatLabels: {
      dash: "—",
    },
  },
  divisionLearn: {
    metadata: {
      title: "Learn · 学习仪表盘",
      description: "跟踪与本账号关联的每一次 HenryCo Learn 报名、课时、测验结果、证书、指派培训以及教师申请——目录在 Learn，进度在此映射。",
    },
    hero: {
      ariaLabel: "Learn 概览",
      eyebrow: "Learn · 实时",
      sideKicker: "本空间运作方式",
      sideTitle: "目录在 Learn，进度在此。",
      sideBody: "HenryCo Learn 的每节课程、每次测验和每份证书都会同步到此空间——从上次停下的地方继续，一目了然地查看进度，并将所有凭证集中存放。",
      breakdownLabel: "按状态",
      breakdownAriaLabel: "学习活动分布",
      tilesAriaLabel: "学习活动",
      tileLabels: {
        active: "进行中",
        completed: "已完成",
        certificates: "证书",
        assignments: "已指派",
      },
      tileFoot: {
        activeEmpty: "报名以开始课程",
        activeWith: "课时和测验进度在此映射",
        completedEmpty: "完成的项目将在此呈现",
        completedWith: "便于简历与报告使用",
        certificatesEmpty: "完成课程即可获得一份证书",
        certificatesWith: "每份凭证均提供可验证链接",
        assignmentsEmpty: "目前没有指派任务",
        assignmentsWith: "来自你的主管或团队",
      },
      breakdownNames: {
        active: "进行中",
        assigned: "已指派",
        certificates: "证书",
        saved: "已收藏",
      },
      openLearnCta: "打开 HenryCo Learn",
      applyToTeachCta: "申请成为讲师",
      state: {
        empty: {
          headline: "开启你的 HenryCo Learn 之旅。",
          blurb: "浏览课程目录、报名课程，每节课时、每次测验和每份证书都会自动同步到此空间。",
        },
        active: {
          headlineTemplateSingular: "{count} 门课程进行中。",
          headlineTemplatePlural: "{count} 门课程进行中。",
          blurb: "从上次停下的地方继续——课时、测验、证书和指派培训都从 HenryCo Learn 同步到此空间。",
        },
        calm: {
          headlineTemplateSingular: "{count} 门课程已完成。",
          headlineTemplatePlural: "{count} 门课程已完成。",
          blurb: "你的凭证与学习记录留存于此，便于撰写简历、内部汇报或个人留档。",
        },
      },
    },
    sections: {
      coursesTitle: "继续学习",
      coursesMetaEmpty: "浏览 HenryCo Learn 目录，报名你的第一门课程。",
      coursesMetaTemplate: "{active} 进行中 · {completed} 已完成",
      extrasTitle: "凭证、指派与教学",
      extrasMeta: "证书、指派培训、收藏课程以及讲师申请汇集于此。",
      activityTitle: "最近动态",
      activityMetaTemplateSingular: "{count} 条更新 · 最新优先",
      activityMetaTemplatePlural: "{count} 条更新 · 最新优先",
      activityMetaEmpty: "课时、测验、证书与付款将在此实时映射。",
    },
    empty: {
      coursesTitle: "尚未关联课程",
      coursesBody: "在 HenryCo Learn 浏览目录并报名，你的位置将自动出现在此处。",
      activityTitle: "暂无 Learn 动态",
      activityBody: "课程进度、测验结果、证书发放和付款回执将在此实时呈现。",
    },
    courses: {
      ariaLabel: "课程",
      completedAtTemplate: "{date} 完成",
      progressPercentTemplate: "已完成 {percent}%",
      statusDelimiter: " · ",
    },
    extras: {
      ariaLabel: "Learn 扩展",
      certificatesTitle: "证书",
      assignmentsTitle: "指派学习",
      savedTitle: "收藏课程",
      teachingTitle: "在 HenryCo 教学",
      statusLabel: "状态",
      expertiseLabel: "专长",
      topicsLabel: "主题",
      openApplicationCta: "打开申请",
      applyToTeachCta: "申请成为讲师",
      teachingEmpty: "我们会人工审核讲师申请。请在 HenryCo Learn 提交，状态将同步回此空间。",
    },
    activity: {
      ariaLabel: "Learn 活动",
      fallbackTitle: "Learn 活动",
    },
  },

  divisionStudio: {
    metadata: {
      title: "Studio · 项目工作室",
      description: "跟踪与此账户关联的每一个 HenryCo Studio 协作 — 提案、里程碑、付款、交付物与活动，统一在一个房间内。",
    },
    hero: {
      eyebrowLive: "Studio · 实时",
      overviewAriaLabel: "Studio 概览",
      activityAriaLabel: "Studio 活动",
      sideAriaLabel: "这个房间如何运作",
      sideLabel: "这个房间如何运作",
      sideTitle: "一个项目房间,真实状态。",
      sideBody: "提案、里程碑、付款凭证、交付物和沟通信号都与你在各处使用的同一个 HenryCo 身份相连。下方仪表盘反映 Studio 团队的实际进展,而不是一份状态清单。",
      breakdownAriaLabel: "活动细分",
      breakdownLabel: "按状态",
      tiles: {
        activeLabel: "活跃项目",
        activeFootEmpty: "当前没有在运作的工作室",
        activeFootHasValue: "正在交付的活跃工作室",
        pendingLabel: "待付款项",
        pendingFootEmpty: "商务通道畅通",
        pendingFootHasValue: "仍有未完成的商务节点",
        proofLabel: "已上传凭证",
        proofFootEmpty: "没有等待审核的内容",
        proofFootHasValue: "等待 Studio 审核的付款",
        deliverablesLabel: "交付物",
        deliverablesFootEmpty: "Studio 上传后文件会出现在这里",
        deliverablesFootHasValue: "文件与产出统一追踪",
      },
      breakdown: {
        active: "活跃",
        readyReview: "可供审阅",
        pendingPayment: "待付款",
        proofSubmitted: "凭证已提交",
      },
      state: {
        empty: {
          headline: "启动一个 Studio 简报。",
          blurb: "当一个提案或项目以你的 HenryCo 身份上线时,同步的 Studio 房间会出现在这里 — 里程碑、付款、交付物和下一步行动汇于一处。",
          ctaPrimary: "启动简报",
          ctaSecondary: "打开 Studio",
        },
        attention: {
          headlineTemplateSingular: "{count} 笔逾期付款。",
          headlineTemplatePlural: "{count} 笔逾期付款。",
          blurb: "一个付款节点已逾期。打开工作室上传凭证或联系 Studio 团队。",
          ctaPrimary: "打开付款",
          ctaSecondary: "打开 Studio",
        },
        activeReady: {
          headlineTemplateSingular: "{count} 个项目可供审阅。",
          headlineTemplatePlural: "{count} 个项目可供审阅。",
          blurb: "交付物与修订排队等待你的审批。打开工作室进行审阅并解锁下一个里程碑。",
          ctaPrimary: "打开项目",
          ctaSecondary: "打开 Studio",
        },
        activeProjects: {
          headlineTemplateSingular: "{count} 个活跃项目。",
          headlineTemplatePlural: "{count} 个活跃项目。",
          blurb: "在运作的工作室,涵盖里程碑进度、付款节点和交付物 — 全部从 HenryCo Studio 镜像到此房间。",
          ctaPrimary: "打开 Studio",
          ctaSecondary: "启动新简报",
        },
        calm: {
          headlineTemplateSingular: "已记录 {count} 个项目房间。",
          headlineTemplatePlural: "已记录 {count} 个项目房间。",
          blurb: "你启动过的每一个 Studio 协作 — 提案、里程碑、付款、交付物 — 都保留在一个房间中,便于快速跟进。",
          ctaPrimary: "打开 Studio",
          ctaSecondary: "启动新简报",
        },
      },
    },
    sections: {
      projectsTitle: "项目房间",
      projectsAriaLabel: "Studio 项目",
      projectsMetaEmpty: "当 Studio 协作上线时,工作室会出现在这里。",
      projectsMetaTemplateSingular: "{count} 个项目 · 按最近动向排序",
      projectsMetaTemplatePlural: "{count} 个项目 · 按最近动向排序",
      paymentsTitle: "付款节点",
      paymentsAriaLabel: "Studio 付款",
      paymentsMetaEmpty: "提案或项目上线后,Studio 付款请求会出现在这里。",
      paymentsMetaTemplateSingular: "{count} 个节点 · 凭证上传和审批状态",
      paymentsMetaTemplatePlural: "{count} 个节点 · 凭证上传和审批状态",
      activityTitle: "近期活动",
      activityAriaLabel: "Studio 活动",
      activityMetaEmpty: "项目更新、付款凭证和里程碑审批将在这里镜像呈现。",
      activityMetaTemplateSingular: "{count} 条更新 · 最新在前",
      activityMetaTemplatePlural: "{count} 条更新 · 最新在前",
    },
    empty: {
      projectsTitle: "尚无关联的 Studio 工作室",
      projectsBody: "一旦以你的 HenryCo 身份创建提案或项目,同步的 Studio 房间就会出现在这里 — 里程碑、付款、交付物和下一步行动。",
      paymentsTitle: "尚无付款节点",
      paymentsBody: "商务里程碑 — 定金、中期与交付 — 会在提案与你上线后出现在这里。",
      activityTitle: "尚无 Studio 活动",
      activityBody: "项目更新、付款凭证、交付发布和里程碑审批一旦发生就会在这里出现。",
    },
    projects: {
      listAriaLabel: "Studio 项目",
      fallbackSubtitle: "Studio 正在准备下一次更新。",
      milestonesTemplate: "{approved}/{total} 个里程碑",
      paymentsTemplateSingular: "{count} 笔未结付款",
      paymentsTemplatePlural: "{count} 笔未结付款",
      deliverablesTemplateSingular: "{count} 件交付物",
      deliverablesTemplatePlural: "{count} 件交付物",
      updatedTemplate: "更新于 {stamp}",
      rowAriaLabelTemplate: "{title} · {kind}",
      fallbackStamp: "—",
    },
    projectKindLabels: {
      live: "进行中",
      ready_review: "可供审阅",
      scheduled: "已排期",
      delivered: "已交付",
      issue: "需要处理",
    },
    payments: {
      listAriaLabel: "Studio 付款",
      rowAriaLabelTemplate: "{label} · {status}",
      dueTemplate: "截止 {stamp}",
      updatedTemplate: "更新于 {stamp}",
      subTemplate: "{amount} · {method} · {due}",
    },
    paymentStatusLabels: {
      pending: "待处理",
      paid: "已付",
      approved: "已审批",
      settled: "已结清",
      proof_uploaded: "凭证已上传",
      proof_submitted: "凭证已提交",
      in_review: "审核中",
      rejected: "已拒绝",
      overdue: "已逾期",
      failed: "失败",
      pending_deposit: "定金待付",
    },
    activity: {
      listAriaLabel: "Studio 活动",
      rowAriaLabelTemplate: "{title} · {stamp}",
    },
  },
  divisionLogistics: {
    metadata: {
      title: "物流 · 配送与运单",
      description: "与此账户关联的每一次 HenryCo Logistics 取件、送达、ETA 与签收凭证——从物流网络镜像同步到一个安静的工作间。",
    },
    hero: {
      ariaLabel: "物流概览",
      eyebrow: "HenryCo 物流",
      brand: "HenryCo 物流",
      title: "每一个包裹,一个工作间。",
      body: "取件、送达、ETA 与签收凭证——全部从物流网络镜像同步到您的账户。只需一次在",
      bodyDomain: " logistics.henrycogroup.com",
      ctaNewDelivery: "新建配送",
    },
    metrics: {
      ariaLabel: "物流绩效",
      activeNowLabel: "当前活跃",
      activeFootSingular: "运单在途",
      activeFootPlural: "运单在途",
      deliveredMonthLabel: "本月已送达",
      deliveredMonthFootTemplate: "累计 {count}",
      onTimeRateLabel: "准时率",
      onTimeRateFootEmpty: "等待首次计划配送",
      onTimeRateFootHasValue: "计划配送中",
      totalSpendLabel: "总支出",
      totalSpendFoot: "终身已付",
    },
    map: {
      noShipmentsAriaLabel: "暂无运单",
      noShipmentsTitle: "下首单后地图将亮起",
      noShipmentsBody: "每一笔活跃的取件与送达都会自动钉在这里。下一次单,您的运单就会从物流站点镜像回来。",
      noShipmentsCta: "下单配送",
      pendingAriaLabel: "地图预览",
      pendingTitle: "地理编码进行中",
      pendingBody: "调度方完成取件与送达地址的地理编码后,您的活跃运单将立即钉在地图上。",
      activeAriaLabel: "活跃运单地图",
      altTemplateSingular: "地图显示 {count} 个活跃取件与送达图钉",
      altTemplatePlural: "地图显示 {count} 个活跃取件与送达图钉",
      liveBadgeTemplateSingular: "实时 · {count} 笔活跃运单",
      liveBadgeTemplatePlural: "实时 · {count} 笔活跃运单",
    },
    sections: {
      activeTitle: "当前在途",
      activeMetaTemplate: "{count} 笔活跃 · 自动从物流同步",
      activeRailAriaLabel: "活跃运单",
      emptyAriaLabel: "暂无活跃运单",
      emptyTitle: "暂无活跃运单",
      emptyBody: "您过往的配送在下方。再下一单,等骑手确认取件后即在此显示。",
      actionsTitle: "发起配送",
      actionsMeta: "常用流程的快捷入口",
      actionsAriaLabel: "物流快捷操作",
      recentTitle: "近期送达",
      recentMetaTemplate: "最近 {recent} 笔,共 {lifetime} 笔",
      recentAriaLabel: "近期配送",
      spendTitle: "支出 · 近 6 个月",
      spendMeta: "仅已付",
      spendFigureAriaLabelTemplate: "近 6 个月物流支出",
    },
    statusLabels: {
      quoteRequested: "报价待出",
      quoteSent: "报价已出",
      pendingPayment: "等待付款",
      scheduled: "已排期",
      assigned: "骑手已指派",
      pickupConfirmed: "已取件",
      inTransit: "运输中",
      delayed: "延误",
      attemptedDelivery: "送达未遇",
      delivered: "已送达",
      completed: "已完成",
      closed: "已关闭",
      cancelled: "已取消",
      refunded: "已退款",
    },
    urgencyLabels: {
      standard: "标准",
      sameDay: "当日达",
      express: "加急",
      nextDay: "次日达",
    },
    serviceLabels: {
      scheduled: "排期",
      sameDay: "当日",
      interCity: "跨城",
      bulk: "大批量",
    },
    shipment: {
      trackingCodeAriaTemplate: "跟踪码 {code}",
      addressPending: "地址待补",
      etaPending: "ETA 待出",
      trackCta: "跟踪运单",
      openTrackingAriaTemplate: "打开 {code} 的跟踪",
      etaAriaTemplate: "ETA {eta}",
      etaMinutesInTemplate: "{minutes} 分钟后",
      etaMinutesOverdueTemplate: "逾期 {minutes} 分钟",
      etaHoursInTemplate: "{hours} 小时后",
      etaHoursOverdueTemplate: "逾期 {hours} 小时",
      detailSeparator: " · ",
    },
    timeline: {
      ariaLabel: "近期配送",
      deliveredToTemplate: "已送达 {name}",
      receiptCta: "凭证",
    },
    quickActions: {
      ariaLabel: "物流快捷操作",
      bookLabel: "下单配送",
      bookDesc: "在一个引导流程中完成取件与送达。",
      trackLabel: "按编号跟踪",
      trackDesc: "实时状态、ETA 与骑手上下文。",
      quoteLabel: "先报价",
      quoteDesc: "下单前先看指导价。",
      addressesLabel: "已存地址",
      addressesDesc: "取件与送达联系人。",
      invoicesLabel: "凭证与发票",
      invoicesDesc: "每笔运单的品牌 PDF。",
      supportLabel: "物流支持",
      supportDesc: "开启关联到您账户的对话。",
    },
    spend: {
      figureAriaLabel: "近 6 个月物流支出",
      emptyTick: "—",
    },
  },
  settings: {
    pageTitle: "设置与偏好",
    pageDescription: "管理您的个人资料、通讯偏好、隐私控制以及手动数据请求路径。",
    profileSectionKicker: "个人资料信息",
    notificationsSectionKicker: "通知偏好",
  },
  addresses: {
    metadata: {
      title: "地址",
      description: "管理您保存的地址（家庭、办公室、店铺…） — 用于配送、预订和 KYC 验证。",
    },
    hero: {
      title: "地址",
      description: "管理您保存的地址（家庭、办公室、店铺…） — 用于配送、预订和 KYC 验证。",
    },
    card: {
      defaultBadge: "默认",
      kycVerifiedBadge: "KYC 已验证",
      setDefaultCta: "设为默认",
      editCta: "编辑",
      deleteCta: "删除",
    },
    deleteConfirm: {
      prompt: "删除此地址？此操作无法撤销。",
      confirmCta: "删除",
      cancelCta: "取消",
    },
    empty: {
      body: "您还未添加任何地址。添加第一个地址，在 HenryCo 各处更快完成结算。",
    },
    add: {
      cta: "添加地址",
      formTitle: "添加新地址",
      editFormTitleTemplate: "编辑 {label}",
      maxedNoticeTemplate: "您已添加了上限 {count} 种地址类型（家庭、办公室、店铺、仓库、备用 1、备用 2）。请编辑或删除其中一个以添加另一种地址。",
    },
  },
  search: {
    metadata: {
      title: "搜索账户",
      description: "搜索 HenryCo 账户工作流程以及关联的业务板块路径。",
    },
    hero: {
      title: "搜索您的 HenryCo 工作流程。",
      description: "直接跳转到账户的精确操作和关联的业务板块路径，无需依赖通用仪表板。",
    },
    placeholder: "搜索账户：通知、钱包、发票、支持、Jobs 应聘记录……",
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
    smartHomeEmptyFallback:
      "स्वागत है — एक छोटे पहले कदम से शुरुआत करें। गतिविधि आते ही आपके लाइव संकेत यहाँ दिखाई देंगे।",
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
    priorityFallback: {
      low: "शांत",
      normal: "सामान्य",
      high: "उच्च",
      urgent: "अत्यावश्यक",
    },
    eyebrow: "क्रिया कतार · लाइव",
    guidanceTitle: "एक कतार, हर विभाग।",
    overviewAria: "कार्यों का अवलोकन",
    volumeAria: "कार्य मात्रा",
    pendingAria: "लंबित कार्य",
    sideAria: "कतार कैसे काम करती है",
    bySource: "स्रोत के अनुसार",
    openTotalLabel: "कुल खुले",
    nothingBlocking: "अभी कुछ भी ब्लॉक नहीं कर रहा",
    resolveBlockers: "अन्य लेन खोलने के लिए हल करें",
    routine: "सामान्य",
    divisionRepresentedSingular: "{count} विभाग प्रस्तुत",
    divisionRepresentedPlural: "{count} विभाग प्रस्तुत",
    headlineEmpty: "कतार में कुछ नहीं है।",
    headlineBlockerSingular: "{count} ब्लॉकर हटाने हैं।",
    headlineBlockerPlural: "{count} ब्लॉकर हटाने हैं।",
    headlineUrgentSingular: "{count} अत्यावश्यक कार्य निपटाएं।",
    headlineUrgentPlural: "{count} अत्यावश्यक कार्य निपटाएं।",
    headlineActiveSingular: "{count} कार्य निपटाने हैं।",
    headlineActivePlural: "{count} कार्य निपटाने हैं।",
    headlineCalmSingular: "आपकी कतार में {count} आइटम।",
    headlineCalmPlural: "आपकी कतार में {count} आइटम।",
    blurbEmpty: "आपका खाता ठीक-ठाक है — सत्यापन, भुगतान, और समीक्षा-संवेदनशील लेन सब साफ हैं। अगला कदम सामने आते ही हम यहाँ अपने आप दिखा देंगे।",
    blurbRisk: "ये आइटम HenryCo में उच्च-विश्वास क्रियाओं को रोकते हैं — वॉलेट निकासी, Marketplace विक्रेता अनुमोदन, नियोक्ता सत्यापन। इन्हें हटाने पर हर लेन खुल जाती है।",
    blurbActive: "हर पंक्ति आपको एक टैप में अगली क्रिया तक ले जाती है। फ़िल्टर, प्राथमिकता चिप्स और डीपलिंक हर HenryCo विभाग में एक जैसे रहते हैं।",
    metaEmpty: "आप साफ हैं। कोई नई चीज आते ही यहाँ दिखेगी।",
    metaCount: "{count} खुले · प्राथमिकता और ब्लॉकिंग स्थिति के अनुसार क्रमबद्ध।",
  },
  security: {
    title: "सुरक्षा",
    description: "हाल की सुरक्षा गतिविधि की समीक्षा करें, अपना पासवर्ड बदलें, और जरूरत होने पर HenryCo सत्र समाप्त करें।",
    heroAriaLabel: "सुरक्षा अवलोकन",
    hero: {
      trustScoreLabel: "विश्वास स्कोर",
      nextTierPrefix: "अगला ·",
      nextTierAriaTemplate: "अगला स्तर {tier}",
      accountActiveSingularTemplate: "खाता {days} दिन से सक्रिय",
      accountActivePluralTemplate: "खाता {days} दिनों से सक्रिय",
      flaggedEventsSingularTemplate: "रिकॉर्ड में {count} फ़्लैग की गई घटना · नीचे समीक्षा करें",
      flaggedEventsPluralTemplate: "रिकॉर्ड में {count} फ़्लैग की गई घटनाएँ · नीचे समीक्षा करें",
      statusEyebrow: {
        secure: "सुरक्षा और पहुँच · सुरक्षित",
        watch: "सुरक्षा और पहुँच · कार्रवाई सुझाई गई",
        risk: "सुरक्षा और पहुँच · जोखिम चिह्नित",
      },
      statusHeadline: {
        secure: "आपका खाता सुरक्षित है।",
        watch: "कुछ कदम आपके खाते को और मजबूत करेंगे।",
        risk: "हमने एक गतिविधि चिह्नित की है जिस पर आपकी नज़र चाहिए।",
      },
      statusBlurb: {
        secure: "कोई संदिग्ध घटना नहीं, सत्यापन स्वस्थ है, और HenryCo की हर उच्च-विश्वास क्रिया आपके लिए खुली है।",
        watch: "कुछ टूटा नहीं है — पर कुछ संकेत (ईमेल पुष्टि, पहचान समीक्षा, डुप्लिकेट संपर्क मैच) आपके विश्वास स्कोर को बढ़ाएंगे और और लेन खोलेंगे।",
        risk: "हाल की घटनाओं को उच्च जोखिम के रूप में वर्गीकृत किया गया है। नीचे की गतिविधि स्ट्रीम देखें और कुछ अजीब लगे तो पासवर्ड बदल लें।",
      },
    },
    signalsTitle: "संकेत",
    signalsMeta: "हमारे सत्यापन और स्कोरिंग इंजन इस समय आपके खाते पर क्या देख रहे हैं।",
    signalsAriaLabel: "सुरक्षा संकेत",
    guideTitle: "आप कहाँ हैं · आगे क्या ले जाता है",
    guideMetaTemplate: "ईमानदार स्कोरिंग, कोई मार्केटिंग संख्या नहीं। {tier}।",
    allLanesOpen: "सभी लेन खुली",
    accountActionsTitle: "खाता क्रियाएँ",
    accountActionsMeta: "नियमित नियंत्रण जो सीधे आपके हाथ में हैं।",
    changePasswordTitle: "अपना पासवर्ड बदलें",
    signOutEverywhereTitle: "हर जगह से साइन आउट करें",
    suspiciousEventFoot: "नीचे की गतिविधि स्ट्रीम देखें।",
    noSuspiciousEventFoot: "पिछली समीक्षा अवधि में कुछ भी चिह्नित नहीं।",
    activityAriaLabel: "हाल की सुरक्षा घटनाएँ",
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
  messages: {
    metadata: {
      title: "संदेश · HenryCo",
      description:
        "समर्थन, मार्केटप्लेस, नौकरियाँ, स्टूडियो, केयर, संपत्ति, लॉजिस्टिक्स और सीखने के लिए एक साझा इनबॉक्स।",
    },
    hero: {
      eyebrow: "HenryCo · एकीकृत इनबॉक्स",
      ariaLabel: "इनबॉक्स अवलोकन",
      ariaTiles: "इनबॉक्स मात्रा",
      ariaSide: "पोर्टल के अनुसार",
      sideLabel: "पोर्टल के अनुसार",
      sideBody:
        "हर पोर्टल इसी एक इनबॉक्स में आता है। समर्थन, मार्केटप्लेस ऑर्डर, साक्षात्कार, स्टूडियो प्रोजेक्ट और केयर बुकिंग सभी यहाँ क्रमवार दिखते हैं।",
    },
    headlines: {
      zero: "पूरे HenryCo में इनबॉक्स खाली है।",
      calmOne: "एक थ्रेड आपका इंतज़ार कर रहा है।",
      calmMany: "{count} थ्रेड खुले हैं।",
      busy: "{unread} अपठित · आपके पोर्टलों में {open} खुले।",
      overloaded: "{open} खुले थ्रेडों में {unread} अपठित।",
    },
    blurbs: {
      zero: "समर्थन, मार्केटप्लेस, नौकरियाँ, स्टूडियो, केयर, संपत्ति, लॉजिस्टिक्स और सीखने में सब कुछ स्वीकार किया गया है।",
      calm: "एक छोटा-सा जवाब अभी कल से पहले लूप बंद रखेगा।",
      busy: "थ्रेड खोलने के लिए एक पंक्ति पर टैप करें, या एक बार में एक पोर्टल पर फ़िल्टर करें।",
      overloaded: "विभागों को एक-एक करके निपटाएँ — नवीनतम थ्रेड ऊपर।",
    },
    tiles: {
      openLabel: "खुले",
      openFootEmpty: "कुछ भी प्रगति में नहीं",
      openFootActive: "गतिविधि की प्रतीक्षा में थ्रेड",
      unreadLabel: "अपठित",
      unreadFootEmpty: "इनबॉक्स पूरी तरह से देख लिया गया",
      unreadFootActive: "थ्रेड खोलने के लिए पंक्ति पर टैप करें",
      portalsLabel: "पोर्टल",
      portalsFootEmpty: "केयर, मार्केटप्लेस, स्टूडियो, नौकरियाँ और अधिक",
      portalsFootSingular: "एक विभाग सक्रिय",
      portalsFootPlural: "{count} विभाग शामिल",
    },
    sideTitle: {
      empty: "हर विभाग में शांति",
      singular: "एक विभाग में हलचल",
      plural: "{count} विभाग एक साथ",
    },
    section: {
      title: "थ्रेड",
      ariaLabel: "इनबॉक्स के थ्रेड",
      metaEmpty: "अभी यहाँ कुछ नहीं है — हर पोर्टल इस इनबॉक्स में आता है",
      metaSingular: "{count} थ्रेड",
      metaPlural: "{count} थ्रेड",
    },
    chips: {
      ariaLabel: "इनबॉक्स को पोर्टल के अनुसार फ़िल्टर करें",
      allThreads: "सभी थ्रेड",
    },
    empty: {
      eyebrow: "इनबॉक्स शांत",
      titleAll: "आपका कुछ भी इंतज़ार नहीं कर रहा।",
      titleFilter: "इस पोर्टल में अभी कोई थ्रेड नहीं।",
      bodyAll:
        "समर्थन, मार्केटप्लेस, नौकरियाँ, स्टूडियो, केयर, संपत्ति, लॉजिस्टिक्स और सीखने सब यहाँ दिखते हैं — कोई भी क्रॉस-पोर्टल चीज़ शुरू होते ही इस सूची में आ जाती है।",
      bodyFilter:
        "दूसरा पोर्टल देखने के लिए फ़िल्टर चिप बदलें, या यह सुनिश्चित करने के लिए सभी थ्रेड ब्राउज़ करें कि कुछ बकाया नहीं है।",
    },
    list: {
      unreadDotLabel: "अपठित",
      fallbackTime: "—",
    },
    divisionLabels: {
      support: "समर्थन",
      marketplace: "मार्केटप्लेस",
      jobs: "नौकरियाँ",
      studio: "स्टूडियो",
      care: "केयर",
      property: "संपत्ति",
      logistics: "लॉजिस्टिक्स",
      learn: "सीखें",
    },
  },
  wallet: {
    hero: {
      ariaLabel: "वॉलेट शेष",
      eyebrow: "HenryCo वॉलेट · लाइव",
      availableLabel: "उपलब्ध शेष",
      balanceAriaTemplate: "उपलब्ध शेष {amount} {currency}",
      settlementFallback: "उस दिन की HenryCo दर पर आपकी स्थानीय मुद्रा में निपटाया गया।",
      ctas: { fund: "वॉलेट में जोड़ें", withdraw: "निकालें" },
      tiles: {
        verifiedLabel: "सत्यापित शेष",
        verifiedFoot: "सभी HenryCo सेवाओं में खर्च योग्य",
        pendingFundingLabel: "लंबित जमा",
        pendingFundingFoot: "वित्त की पुष्टि तक अलग रखा गया",
        pendingWithdrawalLabel: "निकासी के लिए होल्ड",
        pendingWithdrawalFoot: "भुगतान पूरा होने तक आरक्षित",
      },
    },
    sections: {
      actionsTitle: "वॉलेट क्रियाएँ",
      actionsMeta: "जोड़ें, निकालें, भुगतान, मिलान",
      pendingTitle: "लंबित कार्य",
      pendingMeta: "आपके उपलब्ध शेष से अलग रखा गया",
      flowTitle: "आपका पैसा कैसे प्रवाहित होता है",
      flowMeta: "पिछले 30 दिन · पिछले 6 महीने · डिवीज़न के अनुसार",
      fundingTitle: "हाल की जमा अनुरोध",
      fundingMetaTemplate: "{count} समीक्षा में",
      activityTitle: "गतिविधि",
      activityMetaTemplate: "नवीनतम {count}",
    },
    quickActions: {
      ariaLabel: "वॉलेट त्वरित क्रियाएँ",
      addFundsLabel: "धन जोड़ें",
      addFundsDesc: "प्रमाण अपलोड और तत्काल पुष्टि के साथ बैंक स्थानांतरण।",
      withdrawLabel: "निकालें",
      withdrawDesc: "उपलब्ध शेष को सत्यापित बैंक खाते में स्थानांतरित करें।",
      paymentsLabel: "भुगतान",
      paymentsDesc: "हाल के शुल्क, रिफ़ंड और सहेजी गई विधियाँ।",
      receiptsLabel: "रसीदें और चालान",
      receiptsDesc: "हर डिवीज़न में ब्रांडेड PDF।",
    },
    pendingOps: {
      fundingKicker: "लंबित जमा",
      fundingDescEmpty: "आपके भेजे गए फ़ंड यहीं रहते हैं जब तक वित्त बैंक संदर्भ की पुष्टि नहीं कर देता।",
      fundingDescSingular: "{count} अनुरोध समीक्षा में — प्रमाण कतार को आगे बढ़ाता है।",
      fundingDescPlural: "{count} अनुरोध समीक्षा में — प्रमाण कतार को आगे बढ़ाता है।",
      fundingCta: "जमा लेन खोलें",
      withdrawalKicker: "लंबित निकासी",
      withdrawalDescEmpty: "निकासी समीक्षा के दौरान यहाँ कतार में रहती हैं — आपका उपलब्ध शेष कभी दो बार वादा नहीं किया जाता।",
      withdrawalDescSingular: "{count} निकासी भुगतान की प्रतीक्षा में। उपलब्ध शेष से आरक्षित।",
      withdrawalDescPlural: "{count} निकासी भुगतान की प्रतीक्षा में। उपलब्ध शेष से आरक्षित।",
      withdrawalCta: "निकासी लेन खोलें",
    },
    spend: {
      figureAriaLabel: "पिछले 6 महीनों का व्यय",
      last30Eyebrow: "व्यय · पिछले 30 दिन",
      byDivisionEyebrow: "डिवीज़न के अनुसार",
      distributionAriaLabel: "डिवीज़न के अनुसार व्यय वितरण",
      trendFlat: "स्थिर",
      trendBelowTemplate: "पिछले 30 दिनों से {pct}% कम",
      trendAboveTemplate: "पिछले 30 दिनों से {pct}% अधिक",
      trendTitleTemplate: "पिछले 30 दिनों की तुलना (₦{amount})",
    },
    trust: {
      ariaLabel: "निकासी तत्परता",
      heading: "निकासी तत्परता",
      identityTitle: "पहचान सत्यापित",
      identityDescDoneTemplate: "{label}। निकासी भुगतान के लिए आवश्यक।",
      identityDescTodoTemplate: "{label}। निकासी अनलॉक करने के लिए एक बार पूरा करें।",
      identityCta: "जारी रखें →",
      pinTitle: "निकासी PIN",
      pinDescDone: "आपका निकासी PIN सेट है।",
      pinDescTodo: "प्रत्येक निकासी को अधिकृत करने के लिए 4-अंकीय PIN सेट करें।",
      pinCta: "PIN सेट करें →",
      payoutTitle: "भुगतान विधि",
      payoutDescSingular: "फ़ाइल पर 1 सत्यापित विधि।",
      payoutDescPluralTemplate: "फ़ाइल पर {count} सत्यापित विधियाँ।",
      payoutDescEmpty: "निकासी प्राप्त करने के लिए बैंक खाता जोड़ें।",
      payoutCtaManage: "प्रबंधित करें →",
      payoutCtaAdd: "विधि जोड़ें →",
      verificationLabels: {
        verified: "पहचान सत्यापित",
        pending: "सत्यापन समीक्षा में",
        rejected: "सत्यापन को एक और प्रस्तुति की आवश्यकता है",
        notSubmitted: "पहचान अभी तक प्रस्तुत नहीं की गई",
      },
    },
    activity: {
      ariaLabel: "वॉलेट लेनदेन",
      emptyTitle: "अभी तक कोई लेनदेन नहीं",
      emptyBody: "अपने वॉलेट में राशि जोड़ें, और आपकी गतिविधि फ़ीड यहाँ HenryCo सेवाओं में हर क्रेडिट, डेबिट, रिफ़ंड और बोनस के साथ भर जाएगी।",
      fallbackTitle: "वॉलेट लेनदेन",
    },
    funding: {
      proofUploaded: "प्रमाण अपलोड किया गया",
      awaitingProof: "प्रमाण की प्रतीक्षा",
      ariaLabelTemplate: "₦{amount} के लिए जमा अनुरोध {reference}",
    },
    statusLabels: {
      pending: "समीक्षा की प्रतीक्षा",
      awaiting_proof: "प्रमाण की प्रतीक्षा",
      awaiting_review: "समीक्षा की प्रतीक्षा",
      in_review: "समीक्षा में",
      rejected: "अस्वीकृत",
      cancelled: "रद्द",
      expired: "समाप्त",
      completed: "पुष्टि की गई",
      verified: "पुष्टि की गई",
      approved: "स्वीकृत",
      paid: "भुगतान किया",
    },
  },
  support: {
    metadata: {
      title: "सहायता",
      description: "किसी भी HenryCo सेवा के लिए सहायता प्राप्त करें।",
    },
    hero: {
      title: "सहायता",
      description: "किसी भी HenryCo सेवा के लिए सहायता प्राप्त करें।",
      newRequestCta: "नया अनुरोध",
    },
    summary: {
      openRequestsTemplate: "{count} खुले अनुरोध",
      escalatedTemplate: "{count} एस्केलेटेड",
      escalationNote:
        "हर संदेश को ट्रैक किया जाता है। यदि ट्राइएज जोखिम या तत्कालता पाता है, तो स्टाफ़ को स्वतः ही प्राथमिकता वाली कतार मिलती है।",
    },
    quickHelp: {
      helpCenterLabel: "सहायता केंद्र",
      helpCenterDesc: "सामान्य प्रश्न और गाइड देखें",
      contactLabel: "संपर्क करें",
      contactDesc: "ईमेल या फ़ोन सहायता",
      liveChatLabel: "लाइव चैट",
      liveChatDesc: "हमारी टीम से चैट करें",
    },
    threads: {
      sectionKicker: "आपके अनुरोध",
      emptyTitle: "कोई सहायता अनुरोध नहीं",
      emptyDescription:
        "आपने अभी तक कोई सहायता अनुरोध नहीं बनाया है। यदि आपको कुछ चाहिए तो हम मदद के लिए यहाँ हैं।",
      createCta: "अनुरोध बनाएँ",
    },
    statusLabels: {
      open: "खुला",
      awaitingReply: "उत्तर की प्रतीक्षा",
      inProgress: "जारी",
      resolved: "हल",
      closed: "बंद",
    },
    priorityLabels: {
      low: "कम",
      normal: "सामान्य",
      high: "उच्च",
      urgent: "तत्काल",
    },
  },
  payments: {
    hero: {
      title: "भुगतान विधियाँ",
      description: "त्वरित चेकआउट के लिए अपने सहेजे गए भुगतान विकल्प प्रबंधित करें।",
      addMethodCta: "विधि जोड़ें",
    },
    empty: {
      title: "कोई भुगतान विधि नहीं",
      description:
        "सभी HenryCo सेवाओं में त्वरित चेकआउट के लिए डेबिट कार्ड, बैंक खाता, या अन्य भुगतान विधि जोड़ें।",
      cta: "भुगतान विधि जोड़ें",
    },
    card: {
      savedMethodFallback: "सहेजी गई विधि",
      cardLastFourTemplate: "•••• {last4}",
    },
    wallet: {
      eyebrow: "HenryCo वॉलेट",
      body: "आपका HenryCo वॉलेट हमेशा भुगतान विकल्प के रूप में उपलब्ध है।",
      manageCta: "वॉलेट प्रबंधित करें",
    },
  },
  savedItems: {
    metadata: {
      title: "बाद के लिए सहेजे गए",
      description:
        "जो वस्तुएँ आपने किसी भी HenryCo कार्ट से अलग रखी हैं — हम उन्हें 90 दिन तक रखते हैं और समाप्ति से एक सप्ताह पहले सूचित करते हैं।",
    },
    hero: {
      title: "बाद के लिए सहेजें",
      description:
        "जो वस्तुएँ आपने किसी भी HenryCo कार्ट से अलग रखी हैं। हम उन्हें 90 दिन तक रखेंगे और समाप्ति से एक सप्ताह पहले आपको चेताएँगे।",
    },
    summary: {
      activeTemplate: "{count} सक्रिय",
      expiredTemplate: "{count} समाप्त",
      expiryNote: "वस्तुएँ सहेजे जाने के 90 दिन बाद समाप्त होती हैं। हम एक सप्ताह पहले चेतावनी देते हैं।",
      savedTemplate: "{count} सहेजे गए",
    },
    toolbar: {
      showLabel: "दिखाएँ",
      allDivisions: "सभी विभाग",
      sortLabel: "क्रमबद्ध करें",
      sortNewest: "सबसे नए पहले",
      sortOldest: "सबसे पुराने पहले",
      sortExpiring: "जल्द समाप्त होने वाले",
    },
    selection: {
      selectedTemplate: "{count} चयनित",
      clear: "साफ़ करें",
      moving: "स्थानांतरण…",
      moveSelectedToCart: "चयनित को कार्ट में ले जाएँ",
      selectAllOnPage: "इस पृष्ठ पर सभी चुनें",
    },
    empty: {
      title: "अभी तक बाद के लिए कुछ नहीं सहेजा",
      description:
        "जब आपको कोई ऐसी चीज़ मिले जिसे आप अभी खरीदने को तैयार नहीं हैं, उसे कार्ट से बाद के लिए सहेजें। हम वह कीमत बनाए रखेंगे जो आपने देखी थी और समाप्ति से एक सप्ताह पहले चेतावनी देंगे।",
      browseCta: "ब्राउज़ करें",
    },
    card: {
      deselectItem: "वस्तु अचयनित करें",
      selectItem: "वस्तु चुनें",
      savedItemFallback: "सहेजी गई वस्तु",
      expiresToday: "आज समाप्त हो रही है",
      expiresInTemplate: "{days} दिन{plural} में समाप्त",
      expiredNotice: "समाप्त — पुनर्स्थापना 90-दिनों की अवधि को रीसेट करती है",
      moveToCart: "कार्ट में ले जाएँ",
      moving: "स्थानांतरण…",
      removeFromSaved: "सहेजी गई वस्तुओं से हटाएँ",
      openOriginal: "मूल लिस्टिंग खोलें",
    },
    expired: {
      sectionKicker: "हाल ही में समाप्त",
      sectionNote: "पुनर्स्थापना 90-दिनों की अवधि को रीसेट करती है।",
    },
  },
  documents: {
    metadata: {
      title: "दस्तावेज़",
      description:
        "आपकी रसीदें, प्रमाणपत्र, अनुबंध और महत्वपूर्ण फ़ाइलें — निजी रूप से सुरक्षित और हर HenryCo डिवीज़न में उपलब्ध।",
    },
    hero: {
      eyebrow: "व्यक्तिगत तिजोरी",
      title: "दस्तावेज़",
      body: "आपकी रसीदें, प्रमाणपत्र, अनुबंध और महत्वपूर्ण फ़ाइलें।",
    },
    toolbar: {
      uploadCta: "दस्तावेज़ अपलोड करें",
      filterLabel: "फ़िल्टर",
      allCategories: "सभी श्रेणियाँ",
      sortLabel: "क्रमबद्ध करें",
      sortNewest: "नवीनतम पहले",
      sortOldest: "पुराने पहले",
    },
    types: {
      document: "दस्तावेज़",
      receipt: "रसीद",
      certificate: "प्रमाणपत्र",
      id_document: "पहचान दस्तावेज़",
      contract: "अनुबंध",
      other: "अन्य",
    },
    categories: {
      all: "सभी",
      document: "दस्तावेज़",
      receipt: "रसीदें",
      certificate: "प्रमाणपत्र",
      id_document: "पहचान दस्तावेज़",
      contract: "अनुबंध",
      other: "अन्य",
    },
    card: {
      uploadedOnTemplate: "{date} को अपलोड किया गया",
      sizeTemplate: "{size}",
      downloadLabel: "डाउनलोड",
      noFileAttached: "कोई फ़ाइल संलग्न नहीं",
      openOriginal: "दस्तावेज़ खोलें",
    },
    empty: {
      title: "अभी कोई दस्तावेज़ नहीं",
      description:
        "HenryCo सेवाओं के आपके दस्तावेज़, रसीदें और प्रमाणपत्र यहाँ संग्रहीत होंगे।",
    },
    summary: {
      countTemplate: "{count} दस्तावेज़{plural}",
      filteredTemplate: "{total} में से {count} दिखाए गए",
    },
    retention: {
      eyebrow: "गोपनीयता और प्रतिधारण",
      title: "आपकी फ़ाइलें निजी रहती हैं",
      body: "दस्तावेज़ विश्राम में एन्क्रिप्ट किए जाते हैं, केवल आपको दिखाई देते हैं और जब तक आप उन्हें न हटाएँ, आपके HenryCo खाते के पूरे जीवनकाल तक संग्रहीत रहते हैं।",
    },
  },
  subscriptions: {
    metadata: {
      title: "सदस्यताएँ",
      description:
        "साझा खाता हब में सिंक की गई सक्रिय योजनाओं का केवल-पठन सारांश, HenryCo की विभिन्न डिवीज़न से।",
    },
    hero: {
      eyebrow: "सक्रिय योजनाएँ",
      title: "सदस्यताएँ",
      description:
        "उन डिवीज़न से योजनाओं का केवल-पठन सारांश, जो वर्तमान में अपनी सदस्यता रिकॉर्ड साझा खाता हब में सिंक कर रही हैं।",
    },
    empty: {
      title: "अभी तक कोई सिंक की गई सदस्यता नहीं",
      description:
        "इसका मतलब हो सकता है कि आपके पास कोई सक्रिय योजना नहीं है, या उस डिवीज़न ने अभी तक सदस्यता रिकॉर्ड साझा खाता बहीखाते में प्रकाशित नहीं किए हैं।",
    },
    card: {
      planFallback: "सदस्यता योजना",
      tierSeparator: " · ",
      amountLabel: "राशि",
      cycleLabel: "चक्र",
      renewsLabel: "नवीनीकरण",
      renewsFallback: "—",
    },
    statusLabels: {
      active: "सक्रिय",
      paused: "रोकी गई",
      cancelled: "रद्द",
      expired: "समाप्त",
      past_due: "बकाया",
      trialing: "ट्रायल में",
      grace: "ग्रेस अवधि",
      pending: "लंबित",
      unknown: "अज्ञात",
    },
    cycleLabels: {
      monthly: "मासिक",
      yearly: "वार्षिक",
      annual: "वार्षिक",
      quarterly: "त्रैमासिक",
      weekly: "साप्ताहिक",
      biweekly: "हर 2 सप्ताह",
      daily: "दैनिक",
      one_time: "एक बार",
      notSet: "सेट नहीं",
    },
    cta: {
      upgrade: "योजना अपग्रेड करें",
      downgrade: "योजना डाउनग्रेड करें",
      cancel: "सदस्यता रद्द करें",
      manage: "डिवीज़न में प्रबंधित करें",
      resume: "सदस्यता फिर से शुरू करें",
    },
    paymentIssue: {
      title: "भुगतान पर ध्यान दें",
      description:
        "हम हाल का नवीनीकरण भुगतान एकत्र नहीं कर सके। इस सदस्यता को सक्रिय रखने के लिए अपनी भुगतान विधि अपडेट करें।",
      updatePaymentCta: "भुगतान विधि अपडेट करें",
    },
    summary: {
      activeTemplate: "{count} सक्रिय",
      pausedTemplate: "{count} रोकी गई",
      totalTemplate: "{count} योजना{plural}",
    },
  },
  referrals: {
    metadata: {
      title: "रेफरल",
      description:
        "HenryCo में योग्य ग्राहकों को आमंत्रित करें और लंबित, समीक्षाधीन, और जमा की गई स्थितियों के माध्यम से पुरस्कारों को ट्रैक करें।",
    },
    hero: {
      title: "रेफरल",
      description:
        "HenryCo में योग्य ग्राहकों को आमंत्रित करें और लंबित, समीक्षाधीन, और जमा की गई स्थितियों के माध्यम से पुरस्कारों को ट्रैक करें।",
    },
    code: {
      eyebrow: "आपका रेफरल कोड",
      shareLinkLabel: "साझा लिंक",
      copyCodeTitle: "कोड कॉपी करें",
      copyLinkTitle: "लिंक कॉपी करें",
      copyLinkLabel: "लिंक कॉपी करें",
      copiedToast: "कॉपी हो गया!",
      rewardNote:
        "पुरस्कार: प्रति योग्य रेफरल {amount}। रेफरी द्वारा {days}-दिवसीय होल्ड विंडो के भीतर भुगतान किया गया ऑर्डर पूरा करने के बाद पुरस्कार अनलॉक होते हैं।",
    },
    stats: {
      totalReferred: "कुल रेफर किए गए",
      signedUp: "साइन अप किए",
      qualified: "योग्य",
      flagged: "चिह्नित",
      pendingRewards: "लंबित पुरस्कार",
      releasedRewards: "जारी पुरस्कार",
    },
    howItWorks: {
      eyebrow: "यह कैसे काम करता है",
      step1Title: "अपना कोड साझा करें",
      step1Body:
        "अपना विशिष्ट कोड या लिंक साझा करें। आपके लिंक के साथ किसी भी HenryCo सबडोमेन पर जाने वाले मित्र स्वचालित रूप से ट्रैक हो जाते हैं।",
      step2Title: "वे लेन-देन करते हैं",
      step2Body:
        "साइन अप के बाद, रेफरल {days}-दिवसीय होल्ड विंडो में प्रवेश करता है। हम रेफर किए गए खाते को केवल एक बार ट्रैक करते हैं — स्व-रेफरल, डुप्लिकेट परिवार, और पुनर्नवीनीकरण साइनअप योग्य नहीं हैं।",
      step3Title: "योग्यता के बाद पुरस्कार जारी होते हैं",
      step3Body:
        "योग्य रेफरल वित्त समीक्षा के बाद {amount} आपके HenryCo वॉलेट में जमा करते हैं। लंबित पुरस्कार जारी होने तक खर्च करने योग्य नहीं हैं।",
    },
    policy: {
      eyebrow: "रेफरल नीति",
      qualifying:
        "एक योग्यता रूपांतरण का अर्थ है कि रेफर किए गए खाते ने एक योग्य HenryCo कार्रवाई पूरी की जो भुगतान और विश्वास सत्यापन में उत्तीर्ण हुई।",
      enforcement:
        "HenryCo स्व-रेफरल, डुप्लिकेट रूपांतरण लूप, उलट, धनवापसी, या संदिग्ध पुरस्कार पैटर्न के लिए पुरस्कार रोक सकता है, उलट सकता है, या रद्द कर सकता है।",
      separation:
        "आपका डैशबोर्ड रेफरल मिलान और पुरस्कार इतिहास अलग से दिखाता है ताकि ट्रैक किए गए साइनअप को जमा वॉलेट कमाई के साथ गलत न समझा जाए।",
    },
    referralsList: {
      eyebrow: "आपके रेफरल",
      emptyTitle: "अभी तक कोई रेफरल नहीं",
      emptyDescription:
        "लोगों को आमंत्रित करना शुरू करने के लिए अपना रेफरल कोड साझा करें। जब कोई आपके लिंक से साइन अप करेगा तो रेफरल यहां दिखाई देंगे।",
      refereeFallback: "रेफर किया गया साइनअप",
      signedUpTemplate: "{date} को साइन अप किया",
      qualifiedTemplate: "{date} को योग्य",
    },
    statusLabels: {
      pending: "साइनअप की प्रतीक्षा",
      converted: "साइन अप किया · होल्ड अवधि",
      qualified: "योग्य · पुरस्कार अनलॉक",
      flagged: "चिह्नित · धोखाधड़ी सुरक्षा",
      expired: "समाप्त",
    },
    flagReasons: {
      selfReferral: "स्व-रेफरल अवरुद्ध",
      duplicateEmail: "डुप्लिकेट रेफरी ईमेल",
      deviceReuse: "डिवाइस का पुन: उपयोग",
    },
    rewards: {
      eyebrow: "पुरस्कार इतिहास",
      emptyTitle: "अभी तक कोई पुरस्कार नहीं",
      emptyDescription:
        "योग्य रूपांतरणों के सत्यापन और दुरुपयोग विरोधी समीक्षा पास करने के बाद जमा पुरस्कार यहां दिखाई देंगे।",
      referralRewardFallback: "रेफरल पुरस्कार",
      paidTemplate: "{date} को भुगतान",
      statusLabels: {
        held: "रोका गया",
        pending: "लंबित",
        released: "जारी",
        paid: "भुगतान किया",
        cancelled: "रद्द",
      },
    },
  },
  divisionCare: {
    metadata: {
      title: "Care · जुड़ी बुकिंग",
      description: "इस खाते से जुड़ी हर HenryCo Care बुकिंग को एक जगह ट्रैक करें — स्थिति, भुगतान सत्यापन और अगला परिचालन कदम।",
    },
    hero: {
      eyebrow: "Care · लाइव",
      sideKicker: "यह स्थान कैसे काम करता है",
      sideTitle: "Care पर बुक करें, यहाँ फॉलो-अप करें।",
      sideBody: "HenryCo Care पर की गई हर बुकिंग इस स्थान में दिखाई देती है — ट्रैकिंग कोड, भुगतान स्थिति और अगला परिचालन कदम यहाँ अपने आप आ जाते हैं। नीचे डैशबोर्ड सेवा बढ़ने के साथ समकालिक रहता है।",
      breakdownLabel: "स्थिति के अनुसार",
      tilesAriaLabel: "Care बुकिंग सारांश",
      tileLabels: {
        total: "बुकिंग",
        inFlight: "सेवा में",
        payment: "भुगतान बाकी",
        completed: "पूर्ण",
      },
      tileFoot: {
        totalEmpty: "शुरू करने के लिए अपनी पहली Care सेवा बुक करें",
        totalWithTemplate: "{count} इस खाते से जुड़ी",
        inFlightEmpty: "अभी कुछ भी सक्रिय नहीं है",
        inFlightWith: "लाइव स्थिति नीचे दिखाई जाती है",
        paymentEmpty: "कोई बकाया भुगतान सत्यापन नहीं",
        paymentWith: "नीचे रसीद भेजें या जाँचें",
        completedEmpty: "अभी कोई सेवा पूरी नहीं हुई",
        completedWith: "Care टीम द्वारा पूर्ण चिह्नित",
      },
      breakdownLabels: {
        inFlight: "सेवा में",
        scheduled: "निर्धारित",
        payment: "भुगतान बाकी",
        completed: "पूर्ण",
      },
      state: {
        empty: {
          headline: "अपनी पहली Care सेवा बुक करें।",
          blurb: "यहाँ आप जो Care सेवाएँ बुक करते हैं, वे स्वचालित रूप से इस स्थान से समकालिक हो जाती हैं — ट्रैकिंग कोड, भुगतान स्थिति और अगला परिचालन कदम।",
          ctaPrimary: "सेवा बुक करें",
          ctaSecondary: "ट्रैकिंग खोलें",
        },
        attention: {
          headlineTemplateSingular: "{count} कार्रवाई करनी है।",
          headlineTemplatePlural: "{count} कार्रवाइयाँ करनी हैं।",
          blurb: "एक या अधिक बुकिंग भुगतान सत्यापन या फॉलो-अप का इंतज़ार कर रही हैं। उसे निपटाने के लिए नीचे बुकिंग खोलें।",
          ctaPrimary: "बुकिंग देखें",
          ctaSecondary: "ट्रैकिंग खोलें",
        },
        active: {
          headlineTemplateSingular: "{count} सेवा प्रगति में।",
          headlineTemplatePlural: "{count} सेवाएँ प्रगति में।",
          blurb: "लाइव ट्रैकिंग, भुगतान सत्यापन और अगला परिचालन कदम HenryCo Care से इस स्थान में दिखाए जाते हैं।",
          ctaPrimary: "ट्रैकिंग खोलें",
          ctaSecondary: "सेवा बुक करें",
        },
        calm: {
          headlineTemplateSingular: "{count} बुकिंग दर्ज।",
          headlineTemplatePlural: "{count} बुकिंगें दर्ज।",
          blurb: "आपकी Care बुकिंग, ट्रैकिंग कोड, रसीदें और आगामी कार्रवाइयाँ — सब एक जगह, वास्तविक समय में समकालिक।",
          ctaPrimary: "सेवा बुक करें",
          ctaSecondary: "ट्रैकिंग खोलें",
        },
      },
    },
    sections: {
      glance: "अगली कार्रवाई",
      glanceMeta: "सबसे ज़रूरी बुकिंग यहाँ दिखती है।",
      bookings: "सभी बुकिंग",
      bookingsEmpty: "साइन-इन रहते हुए की गई बुकिंग यहाँ वास्तविक समय में दिखेंगी।",
      bookingsMetaTemplateSingular: "{count} बुकिंग · छाँटें, पन्ने पलटें और किसी एक को लाइव विवरण के लिए खोलें।",
      bookingsMetaTemplatePlural: "{count} बुकिंगें · छाँटें, पन्ने पलटें और किसी एक को लाइव विवरण के लिए खोलें।",
      activity: "हाल की गतिविधि",
      activityEmpty: "स्थिति अपडेट, रसीदें और समीक्षाएँ जैसे ही होती हैं, यहाँ दिखती हैं।",
      activityMetaTemplateSingular: "{count} अपडेट · नवीनतम पहले",
      activityMetaTemplatePlural: "{count} अपडेट · नवीनतम पहले",
    },
    empty: {
      title: "अभी कोई Care बुकिंग नहीं जुड़ी",
      body: "साइन-इन रहते हुए Care पर की गई बुकिंग तुरंत यहाँ आ जाएगी। पुरानी बुकिंग भी तब दिखेगी जब उनका ईमेल या फ़ोन आपके साझा प्रोफ़ाइल से मेल खाएगा।",
    },
    glance: {
      nextActionLabel: "अगली कार्रवाई",
      serviceLabel: "सेवा",
      pickupLabel: "पिकअप",
      balanceLabel: "बकाया",
      trackingLabel: "ट्रैकिंग",
      serviceFallback: "Care सेवा",
    },
    activityAriaLabel: "Care गतिविधि",
    status: {
      live: "सेवा में",
      scheduled: "निर्धारित",
      completed: "पूर्ण",
      issue: "कार्रवाई आवश्यक",
      payment: "भुगतान समीक्षा",
    },
    statusValueLabels: {
      booked: "बुक",
      awaiting_payment: "भुगतान बाकी",
      receipt_submitted: "रसीद भेजी",
      under_review: "समीक्षा में",
      delivered: "वितरित",
      customer_confirmed: "ग्राहक ने पुष्टि की",
      inspection_completed: "जाँच पूर्ण",
      service_completed: "सेवा पूर्ण",
      cancelled: "रद्द",
      issue: "समस्या",
      exception: "अपवाद",
      rejected: "अस्वीकृत",
    },
    formatLabels: {
      toBeScheduled: "निर्धारित करना है",
      shortMonths: ["जन", "फ़र", "मार्च", "अप्र", "मई", "जून", "जुल", "अग", "सित", "अक्ट", "नव", "दिस"],
    },
    dashboard: {
      filters: {
        all: "सभी",
        unpaid: "बकाया",
        receipt: "रसीद / समीक्षा",
        active: "प्रगति में",
        completed: "पूर्ण",
        issue: "समस्याएँ",
      },
      filtered: "छाँटा",
      bookingSingular: "बुकिंग",
      bookingPlural: "बुकिंगें",
      metrics: {
        visible: "दृश्य बुकिंग",
        visibleHint: "इस खाते से जुड़ी वास्तविक Care बुकिंग।",
        balance: "बकाया राशि",
        balanceHintSomeTemplate: "{count} बुकिंग को अभी भी भुगतान फॉलो-अप चाहिए।",
        balanceHintNone: "अभी कोई बकाया Care शेष नहीं है।",
        receiptQueue: "रसीद कतार",
        receiptQueueHintSome: "जमा की गई रसीदों वाली बुकिंग अभी भी सत्यापन की प्रतीक्षा में हैं।",
        receiptQueueHintNone: "इस खाते से जुड़ा कोई रसीद-सत्यापन बैकलॉग नहीं।",
        completed: "पूर्ण",
        completedHintSome: "पूर्ण बुकिंग समीक्षा फॉलो-अप में आ सकती हैं।",
        completedHintNone: "सेवा बंद होने पर पूर्ण Care बुकिंग यहाँ दिखेंगी।",
      },
      linkedBookings: "जुड़ी Care बुकिंग",
      linkedBookingsDescription: "आपकी Care बुकिंग, भुगतान स्थिति और आगामी कार्रवाइयाँ।",
      onThisPage: "इस पन्ने पर",
      selectedBooking: "चुनी हुई बुकिंग",
      paymentSnapshot: "भुगतान सारांश",
      receiptVisibility: "रसीद की दृश्यता",
      nextBestAction: "अगली सर्वश्रेष्ठ कार्रवाई",
      serviceSummary: "सेवा सारांश",
      serviceFallback: "Care सेवा",
      addressPending: "पता लंबित",
      updated: "अपडेट",
      balanceDue: "बकाया",
      nextMove: "अगला कदम",
      paginationLabel: "Care बुकिंग पेजिनेशन",
      pageLabel: "पन्ना",
      of: "का",
      perPage: "प्रति पन्ना",
      previous: "पिछला",
      next: "अगला",
      customerFallback: "ग्राहक",
      scheduledDate: "निर्धारित तिथि",
      notScheduled: "अभी निर्धारित नहीं",
      timeWindow: "समय खंड",
      windowPending: "खंड लंबित",
      pickupAddress: "पिकअप पता",
      returnAddress: "वापसी / सुपुर्दगी पता",
      returnAddressFallback: "बुकिंग में बदलाव न होने पर पिकअप पता ही उपयोग होता है",
      trackingCode: "ट्रैकिंग कोड",
      quotedTotal: "उद्धृत कुल",
      amountRecorded: "दर्ज राशि",
      receiptState: "रसीद स्थिति",
      receiptsSubmitted: "जमा रसीदें",
      lastSubmission: "अंतिम प्रस्तुति",
      noReceiptYet: "अभी कोई रसीद नहीं",
      openLiveBooking: "लाइव बुकिंग खोलें",
      leaveReview: "समीक्षा छोड़ें",
    },
  },
  divisionProperty: {
    metadata: {
      title: "Property · सहेजे गए और पूछताछ",
      description: "आपकी Property शॉर्टलिस्ट, पूछताछ, अवलोकन और लिस्टिंग फॉलो-अप — HenryCo Property पर हर क्रिया इस खाते के कक्ष में दिखती है।",
    },
    hero: {
      eyebrow: "Property · लाइव",
      ariaLabel: "Property अवलोकन",
      browseListingsCta: "लिस्टिंग देखें",
      savedShortlistCta: "शॉर्टलिस्ट",
      tilesAriaLabel: "Property गतिविधि",
      tileLabels: {
        saved: "सहेजे",
        inquiries: "पूछताछ",
        viewings: "अवलोकन",
        listings: "लिस्टिंग",
      },
      tileFoot: {
        savedManagedTemplate: "{count} HenryCo द्वारा प्रबंधित",
        savedEmpty: "शॉर्टलिस्ट बनाने के लिए लिस्टिंग सहेजें",
        savedWith: "कभी भी तुलना और पुनर्विचार",
        inquiriesEmpty: "अभी कोई बातचीत खुली नहीं",
        inquiriesWith: "फॉलो-अप इस कक्ष में आते हैं",
        viewingsEmpty: "सहेजे गए घर के लिए अवलोकन का अनुरोध करें",
        viewingsWith: "पुष्टियाँ सभी डिवाइसों पर सिंक होती हैं",
        listingsEmpty: "Property पर लिस्टिंग जमा करें",
        listingsWith: "मॉडरेशन परिणाम यहाँ दिखते हैं",
      },
      sideAriaLabel: "यह कक्ष कैसे काम करता है",
      sideKicker: "यह कक्ष कैसे काम करता है",
      sideTitle: "Property पर खोजें, यहाँ फॉलो-अप करें।",
      sideBody:
        "HenryCo Property पर लिस्टिंग सहेजें, अवलोकन का अनुरोध करें या पूछताछ खोलें — हर क्रिया इस खाते के कक्ष में दिखती है ताकि आप सभी डिवाइसों पर वहीं से जारी रख सकें जहाँ छोड़ा था।",
      sideBodyMuted:
        "HenryCo द्वारा प्रबंधित लिस्टिंग पर “प्रबंधित” बैज दिखता है — समीक्षा, निरीक्षण और लीज फॉलो-अप का समन्वय Property टीम करती है।",
      breakdownAriaLabel: "गतिविधि विभाजन",
      breakdownLabel: "गतिविधि के अनुसार",
      breakdownLabels: {
        saved: "सहेजे",
        inquiries: "पूछताछ",
        viewings: "अवलोकन",
        listings: "लिस्टिंग",
      },
      state: {
        empty: {
          headline: "HenryCo Property खोजना शुरू करें।",
          blurb:
            "आवासीय किराये, बिक्री लिस्टिंग और HenryCo-प्रबंधित घर खोजें। अपने पसंदीदा सहेजें, और हर पूछताछ, अवलोकन या लिस्टिंग फॉलो-अप यहाँ स्वतः आ जाता है।",
        },
        discover: {
          headlineTemplateSingular: "{count} शॉर्टलिस्टेड घर।",
          headlineTemplatePlural: "{count} शॉर्टलिस्टेड घर।",
          blurb:
            "सहेजे गए घर, पुनर्विचार के लिए तैयार। लिस्टिंग खोलें, अवलोकन का अनुरोध करें या पूछताछ भेजें — फॉलो-अप सीधे इसी कक्ष में लौटेगा।",
        },
        active: {
          viewingHeadlineTemplateSingular: "{count} अवलोकन निर्धारित।",
          viewingHeadlineTemplatePlural: "{count} अवलोकन निर्धारित।",
          inquiryHeadlineTemplateSingular: "{count} पूछताछ सक्रिय।",
          inquiryHeadlineTemplatePlural: "{count} पूछताछ सक्रिय।",
          blurb:
            "आपकी शॉर्टलिस्ट, पूछताछ और अवलोकन कार्यक्रम एक कक्ष में। वहीं से जारी रखें जहाँ छोड़ा था — हर क्रिया HenryCo Property से वास्तविक समय में मिरर होती है।",
        },
      },
    },
    sections: {
      saved: "सहेजी शॉर्टलिस्ट",
      savedMetaEmpty: "अपनी शॉर्टलिस्ट बनाने के लिए HenryCo Property पर लिस्टिंग सहेजें।",
      savedMetaTemplate: "{saved} सहेजे · {managed} HenryCo द्वारा प्रबंधित",
      activity: "हाल की गतिविधि",
      activityMetaEmpty: "पूछताछ, अवलोकन और लिस्टिंग समीक्षाएँ जब घटित होती हैं तब यहाँ मिरर होती हैं।",
      activityMetaTemplateSingular: "{count} अद्यतन · सबसे नया पहले",
      activityMetaTemplatePlural: "{count} अद्यतन · सबसे नया पहले",
    },
    empty: {
      savedTitle: "अभी कोई सहेजी संपत्ति नहीं",
      savedBody:
        "Property पर आवासीय किराये, बिक्री लिस्टिंग और HenryCo-प्रबंधित घर खोजें। जो भी आप सहेजेंगे वह यहाँ स्वतः आ जाएगा।",
      activityTitle: "अभी कोई Property गतिविधि नहीं",
      activityBody:
        "HenryCo Property पर लिस्टिंग खोलें, अवलोकन का अनुरोध करें या पूछताछ भेजें — आपके पहले संदेश से लेकर समीक्षा तक का हर कदम यहाँ दिखेगा।",
    },
    activity: {
      ariaLabel: "Property गतिविधि",
      titles: {
        inquiry: "संपत्ति पूछताछ",
        viewing: "अवलोकन अनुरोध",
        listing_submitted: "लिस्टिंग जमा",
        listing_updated: "लिस्टिंग अद्यतन",
        listing_reviewed: "लिस्टिंग समीक्षा पूर्ण",
      },
    },
    gallery: {
      ariaLabel: "सहेजी संपत्तियाँ",
      managedBadge: "प्रबंधित",
      featuredBadge: "विशेष",
      locationPending: "स्थान शीघ्र",
      contactAgent: "एजेंट से संपर्क करें",
      savedAtTemplate: "{date} को सहेजा",
      bedSingular: "कमरा",
      bedPlural: "कमरे",
      bathSingular: "बाथरूम",
      bathPlural: "बाथरूम",
      sizeSqmTemplate: "{size} वर्ग मीटर",
    },
  },
  divisionJobs: {
    metadata: {
      title: "जॉब्स · उम्मीदवार डैशबोर्ड",
      description: "इस खाते से जुड़ी हर HenryCo Jobs आवेदन, सहेजी भूमिका, भर्तीकर्ता अपडेट और प्रोफ़ाइल तत्परता संकेत को यहाँ ट्रैक करें।",
    },
    header: {
      title: "जॉब्स",
      description: "आपके आवेदन, सहेजी भूमिकाएँ, भर्तीकर्ता अपडेट और प्रोफ़ाइल मज़बूती — सब एक जगह।",
      candidateModuleCta: "उम्मीदवार मॉड्यूल",
      interviewRoomsCta: "इंटरव्यू कक्ष",
      browseLiveRolesCta: "लाइव भूमिकाएँ देखें",
    },
    hero: {
      eyebrow: "आपका खाता",
      headline: "आपकी जॉब्स गतिविधि, सब एक जगह।",
      body: "आवेदन, सहेजी भूमिकाएँ, भर्तीकर्ता अपडेट और प्रोफ़ाइल तत्परता आपके HenryCo खाते से जुड़े हैं।",
      statsAriaLabel: "जॉब्स गतिविधि सारांश",
      statLabels: {
        applications: "सक्रिय आवेदन",
        saved: "सहेजी भूमिकाएँ",
        readiness: "प्रोफ़ाइल तत्परता",
        updates: "भर्तीकर्ता अपडेट",
      },
      statDetails: {
        applicationsLeadingTemplate: "{stage} आपका प्रमुख सक्रिय चरण है।",
        applicationsEmpty: "अभी कोई सक्रिय आवेदन नहीं।",
        savedSome: "आपकी सूची एक और समीक्षा के लिए तैयार है।",
        savedEmpty: "एक सूची बनाएँ ताकि अच्छी भूमिकाएँ फिर से ढूँढना आसान हो।",
        updatesLatestTemplate: "{relative} नवीनतम हलचल।",
        updatesEmpty: "अभी कोई भर्तीकर्ता अपडेट नहीं।",
      },
    },
    sections: {
      nextActionsKicker: "अगले कदम",
      nextActionsTitle: "अभी जिस पर ध्यान देना चाहिए",
      openTimelineCta: "समयरेखा खोलें",
      applicationsKicker: "आवेदन",
      applicationsTitle: "लाइव भर्ती हलचल",
      savedKicker: "सहेजी भूमिकाएँ",
      savedTitle: "बेहतर संदर्भ के साथ सूची",
      openSavedRolesCta: "सहेजी भूमिकाएँ खोलें",
      recommendedKicker: "अनुशंसित भूमिकाएँ",
      recommendedTitle: "जो आपके वर्तमान संकेत से मेल खाता है",
      browseCatalogCta: "कैटलॉग देखें",
      recruiterFeedKicker: "भर्तीकर्ता फ़ीड",
      recruiterFeedTitle: "संदेश, चरण बदलाव और सूचनाएँ",
      candidateInboxCta: "उम्मीदवार इनबॉक्स",
      profileKicker: "प्रोफ़ाइल मज़बूती",
      profileTitle: "उम्मीदवार तत्परता और CV गुणवत्ता",
      sharedInboxKicker: "साझा इनबॉक्स",
      sharedInboxTitle: "आपके खाते से जुड़ी जॉब्स सूचनाएँ",
      alertsKicker: "सूचनाएँ",
      alertsTitle: "सहेजी खोज मंशा",
    },
    empty: {
      applicationsTitle: "अभी कोई सक्रिय आवेदन नहीं",
      applicationsBody: "सहेजी भूमिकाएँ, भर्तीकर्ता अपडेट और समयरेखाएँ यहाँ तब दिखेंगी जब आप ब्राउज़ से सक्रिय आवेदन में आगे बढ़ेंगे।",
      exploreJobsCta: "जॉब्स ढूँढें",
      savedJobsTitle: "अभी कोई सहेजी भूमिका नहीं",
      savedJobsBody: "उम्मीदवार सूची में आशाजनक भूमिकाएँ सहेजें ताकि वे जॉब्स और आपके खाते दोनों में बनी रहें।",
      recommendedTitle: "जॉब्स के उपयोग के साथ सिफ़ारिशें तेज़ होंगी",
      recommendedBody: "जब प्रोफ़ाइल, सूची और आवेदन गहरे होंगे, यहाँ की भूमिका सिफ़ारिशें अधिक लक्षित होंगी।",
      recruiterFeedTitle: "अभी कोई भर्तीकर्ता हलचल नहीं",
      recruiterFeedBody: "आवेदन चरण बदलाव, साझा भर्तीकर्ता टिप्पणियाँ और इन-ऐप जॉब्स सूचनाएँ यहाँ इकट्ठा होंगी।",
      notificationsTitle: "अभी कोई जॉब्स सूचना नहीं",
      notificationsBody: "भविष्य की सूची हलचल, नियोक्ता अपडेट और आवेदन बदलाव यहाँ और जॉब्स मॉड्यूल में आएँगे।",
      alertsTitle: "कोई जॉब्स अलर्ट सक्रिय नहीं",
      alertsBody: "एक अलर्ट बनाएँ ताकि आपके मानदंडों से मेल खाने वाली नई भूमिकाएँ आपके जॉब्स फ़ीड में दिखें।",
      browseRolesCta: "भूमिकाएँ देखें",
    },
    application: {
      progressPercentTemplate: "{percent}% पूर्ण",
      appliedAtTemplate: "{date} को आवेदन किया",
      candidateReadiness: "उम्मीदवार तत्परता",
      recruiterConfidence: "भर्तीकर्ता विश्वास",
      latestMovement: "नवीनतम भर्तीकर्ता हलचल",
      nextBestMove: "अगला सर्वोत्तम कदम",
      openTimelineCta: "समयरेखा खोलें",
      interviewRoomCta: "इंटरव्यू कक्ष",
      viewRoleCta: "भूमिका देखें",
    },
    savedJob: {
      trustTemplate: "विश्वास {score}",
      savedAtTemplate: "{date} को सहेजा",
    },
    recommended: {
      compFallback: "वेतन प्रक्रिया में चर्चा होगी",
    },
    stageLabels: {
      applied: "आवेदन किया",
      reviewing: "समीक्षा में",
      shortlisted: "शॉर्टलिस्ट",
      interview: "इंटरव्यू",
      offer: "ऑफ़र",
      hired: "नियुक्त",
      rejected: "अस्वीकृत",
    },
    nextStep: {
      labels: {
        applied: "अपनी प्रोफ़ाइल और रिज़्यूमे अद्यतन रखें",
        shortlisted: "प्रमाण और पोर्टफ़ोलियो संदर्भ तैयार रखें",
        interview: "उदाहरण और समय खंड तैयार करें",
        offer: "दायरा, समय और वेतन की समीक्षा करें",
        rejected: "अगला आवेदन पैकेज मज़बूत करें",
      },
      bodies: {
        applied: "प्रारंभिक चरण में स्पष्ट प्रमाण, साफ़ संपर्क जानकारी और ताज़ा रिज़्यूमे काम आते हैं।",
        shortlisted: "शॉर्टलिस्ट का अर्थ है कि आपने पहली स्क्रीनिंग पार कर ली। अब सटीक प्रमाण मायने रखते हैं।",
        interview: "जब आपके सबसे मज़बूत कार्य प्रमाण और उपलब्धता आसानी से दिखें, इंटरव्यू तेज़ी से आगे बढ़ते हैं।",
        offer: "ऑफ़र चरण का उपयोग अस्पष्टता दूर करने के लिए करें, ज़िम्मेदारियों का अनुमान लगाने के लिए नहीं।",
        rejected: "अस्वीकृति को संकेत मानें। फिर से आवेदन से पहले सारांश, उदाहरण और भूमिका अनुकूलता को कसें।",
      },
    },
    readinessLabels: {
      interviewReady: "इंटरव्यू-तैयार",
      strongProfile: "मज़बूत प्रोफ़ाइल",
      needsProof: "प्रमाण आवश्यक",
      needsStructure: "संरचना आवश्यक",
    },
    workModeLabels: {
      remote: "दूरस्थ",
      hybrid: "हाइब्रिड",
      onsite: "ऑनसाइट",
    },
    employmentTypeLabels: {
      fullTime: "पूर्णकालिक",
      partTime: "अंशकालिक",
      contract: "ठेका",
      internship: "इंटर्नशिप",
      temporary: "अस्थायी",
    },
    profile: {
      readinessLabel: "तत्परता",
      skillsMappedLabel: "मैप किए कौशल",
      filesLabel: "फ़ाइलें",
      improveProfileCta: "प्रोफ़ाइल सुधारें",
      openCandidateModuleCta: "उम्मीदवार मॉड्यूल खोलें",
      checklist: {
        identityLabel: "प्रोफ़ाइल मूल",
        identityDetail: "भर्तीकर्ता फ़ॉलोअप के लिए पूरा नाम, फ़ोन और स्थान मौजूद हैं।",
        storyLabel: "भूमिका कहानी",
        storyDetail: "शीर्षक और सारांश यह बताते हैं कि आप क्या करते हैं, खाली रिकॉर्ड से आगे।",
        verificationLabel: "पहचान सत्यापन",
        verificationDetail: "जब तक आपका HenryCo खाता पहचान समीक्षा पास नहीं करता, जॉब्स विश्वास सीमित रहेगा।",
        proofLabel: "कार्य का प्रमाण",
        proofDetail: "रिज़्यूमे और पोर्टफ़ोलियो प्रमाण शॉर्टलिस्ट गति आसान बनाते हैं।",
        skillsLabel: "मैप किए कौशल",
        skillsDetail: "कम से कम चार कौशल और पसंदीदा कार्य सिफ़ारिशें सुधारते हैं।",
      },
    },
    nextActions: {
      gapTemplate: "{label} की कमी पूरी करें",
      interviewLabel: "इंटरव्यू चरण के लिए तैयारी करें",
      offerLabel: "सक्रिय ऑफ़र का जवाब दें",
      attentionTemplate: "{employer} में {title} को अभी आपका ध्यान चाहिए।",
      convertSavedLabel: "एक सहेजी भूमिका को सक्रिय आवेदन में बदलें",
      convertSavedTemplate: "{title} पहले से आपकी सूची में है और गहरे विश्लेषण के लिए तैयार है।",
      restartLabel: "अधिक सख़्त फ़िल्टर के साथ जॉब्स खोज पुनः शुरू करें",
      restartDetail: "सत्यापित-नियोक्ता और आंतरिक-भूमिका फ़िल्टरों का उपयोग कर तेज़ी से साफ़ सूची बनाएँ।",
    },
    alertStatus: {
      active: "सक्रिय",
      paused: "रुका हुआ",
    },
    recruiterUpdateTitleTemplate: "{stage} अपडेट",
  },
  divisionMarketplace: {
    metadata: {
      title: "Marketplace · ऑर्डर और विक्रेता गतिविधि",
      description: "इस खाते से जुड़े हर HenryCo Marketplace ऑर्डर, विवाद और विक्रेता भुगतान को ट्रैक करें — खरीदार गतिविधि और विक्रेता वर्कस्पेस, एक ही कक्ष में रीयल-टाइम में परिलक्षित।",
    },
    hero: {
      eyebrow: "Marketplace · लाइव",
      ariaLabel: "Marketplace अवलोकन",
      sideAriaLabel: "यह कक्ष कैसे काम करता है",
      sideKicker: "यह कक्ष कैसे काम करता है",
      sideTitle: "खरीदें और बेचें — एक ही कक्ष।",
      sideBody: "आपके द्वारा Marketplace पर बनाए गए हर ऑर्डर, विवाद और भुगतान अनुरोध को इस कक्ष में दिखाया जाता है। विक्रेता वर्कस्पेस की गतिविधि खरीदार ऑर्डर के साथ-साथ चलती है, ताकि marketplace के दोनों पहलू एक नज़र में दिख सकें।",
      breakdownLabel: "स्थिति अनुसार",
      breakdownAriaLabel: "गतिविधि विभाजन",
      tilesAriaLabel: "Marketplace गतिविधि",
      tileLabels: {
        orders: "ऑर्डर",
        disputes: "विवाद",
        store: "स्टोर",
        payouts: "भुगतान",
      },
      tileFoot: {
        ordersEmpty: "पहला ऑर्डर यहाँ दिखेगा",
        ordersInMotionTemplate: "{inFlight} गतिमान · {delivered} वितरित",
        ordersDeliveredTemplate: "अब तक {delivered} वितरित",
        disputesClear: "सब ठीक है",
        disputesActiveTemplate: "{open} खुले · {resolving} समाधान में",
        storeActiveNoName: "विक्रेता सदस्यता सक्रिय",
        storeActiveWithNameTemplate: "स्टोर: {name}",
        storeApplicationTemplate: "आवेदन: {status}",
        storeIdle: "अभी बिक्री नहीं — तैयार होने पर आवेदन करें",
        payoutsEmptyNoneSettled: "अभी कोई भुगतान अनुरोध नहीं",
        payoutsSettledTemplate: "अब तक {count} निपटाए गए",
        payoutsPendingTemplate: "{amount} लंबित",
      },
      breakdownLabels: {
        inMotion: "गतिमान",
        openDisputes: "खुले विवाद",
        delivered: "वितरित",
        pendingPayouts: "लंबित भुगतान",
      },
      state: {
        empty: {
          headline: "HenryCo Marketplace पर खरीदारी शुरू करें।",
          blurb: "लेन-देन करते ही ऑर्डर, विवाद, विक्रेता गतिविधि और भुगतान इस कक्ष में परिलक्षित होंगे। शुरू करने के लिए marketplace देखें।",
          ctaPrimary: "Marketplace खोलें",
          ctaSecondary: "बिक्री के लिए आवेदन करें",
        },
        attention: {
          headlineTemplateSingular: "{count} मामला ध्यान चाहता है।",
          headlineTemplatePlural: "{count} मामले ध्यान चाहते हैं।",
          blurb: "विवाद और अपवाद ऑर्डर कतार में शीर्ष पर हैं। साक्ष्य जोड़ने या समाधान स्वीकार करने के लिए केस खोलें।",
          ctaPrimary: "मामले देखें",
          ctaSecondary: "Marketplace खोलें",
        },
        activeOrders: {
          headlineTemplateSingular: "{count} ऑर्डर गतिमान।",
          headlineTemplatePlural: "{count} ऑर्डर गतिमान।",
          blurb: "लाइव ऑर्डर स्थिति, भुगतान स्थिति और विक्रेता फ़ॉलो-अप HenryCo Marketplace से इस कक्ष में रीयल-टाइम में परिलक्षित होते हैं।",
          ctaPrimary: "Marketplace खोलें",
          ctaSecondary: "बिक्री के लिए आवेदन करें",
        },
        activePayouts: {
          headlineTemplateSingular: "{count} भुगतान समीक्षा में।",
          headlineTemplatePlural: "{count} भुगतान समीक्षा में।",
          blurb: "विक्रेता भुगतान अनुरोध वित्त सत्यापन से गुज़र रहे हैं। टीम की प्रगति के साथ स्थिति अपडेट यहाँ दिखते हैं।",
          ctaPrimary: "विक्रेता वर्कस्पेस खोलें",
          ctaSecondary: "Marketplace खोलें",
        },
        calmBuyer: {
          headlineTemplateSingular: "{count} ऑर्डर दर्ज।",
          headlineTemplatePlural: "{count} ऑर्डर दर्ज।",
          blurb: "आपकी सारी marketplace गतिविधि एक कक्ष में — खरीदार ऑर्डर, विक्रेता भुगतान, विवाद परिणाम और हर स्टोर का नवीनतम स्तर।",
          ctaPrimary: "Marketplace खोलें",
          ctaSecondary: "बिक्री के लिए आवेदन करें",
        },
        calmSeller: {
          headlineTemplateSingular: "{count} ऑर्डर · विक्रेता सक्रिय।",
          headlineTemplatePlural: "{count} ऑर्डर · विक्रेता सक्रिय।",
          blurb: "आपकी सारी marketplace गतिविधि एक कक्ष में — खरीदार ऑर्डर, विक्रेता भुगतान, विवाद परिणाम और हर स्टोर का नवीनतम स्तर।",
          ctaPrimary: "Marketplace खोलें",
          ctaSecondary: "विक्रेता वर्कस्पेस खोलें",
        },
      },
    },
    sections: {
      matters: {
        title: "सक्रिय मामले",
        meta: "विवाद, विक्रेता आवेदन स्थिति और लंबित भुगतान यहाँ तब दिखते हैं जब कार्रवाई की आवश्यकता हो।",
        ariaLabel: "Marketplace सक्रिय मामले",
        emptyTitle: "कोई कार्रवाई आवश्यक नहीं",
        emptyBody: "आपकी सारी marketplace गतिविधि सामान्य रूप से चल रही है — कोई खुला विवाद नहीं, कोई समीक्षा में भुगतान नहीं, और (यदि लागू हो) विक्रेता आवेदन स्वीकृत है।",
      },
      orders: {
        title: "हालिया ऑर्डर",
        empty: "Marketplace पर दिए गए ऑर्डर यहाँ रीयल-टाइम में दिखेंगे।",
        metaTemplateSingular: "{count} ऑर्डर · नवीनतम पहले",
        metaTemplatePlural: "{count} ऑर्डर · नवीनतम पहले",
        emptyTitle: "अभी कोई ऑर्डर नहीं",
        emptyBody: "HenryCo Marketplace पर अपना पहला ऑर्डर दें — ऑर्डर स्थिति, भुगतान स्थिति और कोई भी फ़ॉलो-अप यहाँ स्वतः आ जाएगा।",
        ariaLabel: "हालिया ऑर्डर",
      },
      activity: {
        title: "हालिया गतिविधि",
        empty: "स्थिति अपडेट, भुगतान और समीक्षाएँ यहाँ रीयल-टाइम में दिखेंगी।",
        metaTemplateSingular: "{count} अपडेट · नवीनतम पहले",
        metaTemplatePlural: "{count} अपडेट · नवीनतम पहले",
        emptyTitle: "अभी कोई marketplace गतिविधि नहीं",
        emptyBody: "ऑर्डर पुष्टि, विवाद अपडेट और विक्रेता भुगतान परिणाम जैसे ही होंगे, यहाँ दिखेंगे।",
        ariaLabel: "Marketplace गतिविधि",
      },
    },
    matters: {
      disputes: {
        kicker: "विवाद",
        titleTemplateSingular: "{count} केस को कार्रवाई चाहिए",
        titleTemplatePlural: "{count} केसों को कार्रवाई चाहिए",
        bodyLatestTemplate: "नवीनतम: {ref} · अपडेट {stamp}",
        bodyFallback: "साक्ष्य जोड़ने के लिए कतार खोलें।",
        cta: "केस देखें",
      },
      application: {
        kicker: "विक्रेता आवेदन",
        bodyWithStoreTemplate: "स्टोर: {name}",
        bodyDefault: "आवेदन HenryCo समीक्षा कतार में है।",
        bodyReviewSuffixTemplate: " · {note}",
        cta: "स्थिति देखें",
        defaultStatus: "जमा किया गया",
      },
      payouts: {
        kicker: "भुगतान समीक्षा में",
        titleTemplate: "{amount} लंबित",
        bodyTemplateSingular: "{count} अनुरोध वित्त सत्यापन की प्रतीक्षा में।",
        bodyTemplatePlural: "{count} अनुरोध वित्त सत्यापन की प्रतीक्षा में।",
        cta: "विक्रेता वर्कस्पेस खोलें",
      },
    },
    orders: {
      rowTitleTemplate: "ऑर्डर {orderNo}",
      rowSubTemplate: "{amount} · दिया गया {stamp}",
      rowAriaLabelTemplate: "ऑर्डर {orderNo} · {status}",
      statusFallbackDraft: "ड्राफ़्ट",
    },
    statusValueLabels: {
      delivered: "वितरित",
      completed: "पूर्ण",
      customer_confirmed: "ग्राहक द्वारा पुष्टि",
      fulfilled: "पूरा किया गया",
      cancelled: "रद्द",
      refunded: "वापस भुगतान",
      disputed: "विवादित",
      exception: "अपवाद",
      placed: "दिया गया",
      paid: "भुगतान हो गया",
      awaiting_fulfilment: "पूर्ति की प्रतीक्षा में",
      confirmed: "पुष्ट",
      queued: "कतार में",
    },
    applicationStatusLabels: {
      submitted: "जमा किया गया",
      under_review: "समीक्षा में",
      approved: "स्वीकृत",
      rejected: "अस्वीकृत",
      pending_documents: "दस्तावेज़ लंबित",
      changes_requested: "बदलाव अनुरोधित",
    },
    formatLabels: {
      dash: "—",
    },
  },
  divisionLearn: {
    metadata: {
      title: "Learn · सीखने का डैशबोर्ड",
      description: "इस खाते से जुड़ी हर HenryCo Learn नामांकन, पाठ, क्विज़ परिणाम, प्रमाणपत्र, सौंपी गई ट्रेनिंग और शिक्षण आवेदन को ट्रैक करें — कैटलॉग Learn पर, प्रगति यहाँ प्रतिबिंबित।",
    },
    hero: {
      ariaLabel: "Learn अवलोकन",
      eyebrow: "Learn · लाइव",
      sideKicker: "यह कक्ष कैसे काम करता है",
      sideTitle: "कैटलॉग Learn पर, प्रगति यहाँ।",
      sideBody: "HenryCo Learn का हर पाठ, क्विज़ और प्रमाणपत्र इस कक्ष में सिंक होता है — जहाँ छोड़ा था वहीं से शुरू करें, एक नज़र में प्रगति देखें, और अपने सभी प्रमाण एक ही जगह रखें।",
      breakdownLabel: "स्थिति के अनुसार",
      breakdownAriaLabel: "सीखने की गतिविधि का विभाजन",
      tilesAriaLabel: "सीखने की गतिविधि",
      tileLabels: {
        active: "सक्रिय",
        completed: "पूर्ण",
        certificates: "प्रमाणपत्र",
        assignments: "सौंपा",
      },
      tileFoot: {
        activeEmpty: "कोर्स शुरू करने के लिए नामांकन करें",
        activeWith: "पाठ और क्विज़ की प्रगति यहाँ प्रतिबिंबित होती है",
        completedEmpty: "आपके पूर्ण किए कार्यक्रम यहाँ दिखेंगे",
        completedWith: "CV और रिपोर्टिंग के लिए उपयोगी",
        certificatesEmpty: "एक कोर्स पूरा करके अर्जित करें",
        certificatesWith: "प्रत्येक प्रमाण के लिए सत्यापन योग्य लिंक",
        assignmentsEmpty: "अभी कुछ भी सौंपा नहीं गया है",
        assignmentsWith: "आपके प्रबंधक या टीम से",
      },
      breakdownNames: {
        active: "सक्रिय",
        assigned: "सौंपा",
        certificates: "प्रमाणपत्र",
        saved: "सहेजा",
      },
      openLearnCta: "HenryCo Learn खोलें",
      applyToTeachCta: "पढ़ाने के लिए आवेदन करें",
      state: {
        empty: {
          headline: "अपनी HenryCo Learn यात्रा शुरू करें।",
          blurb: "कैटलॉग देखें, कोर्स में नामांकन करें, और हर पाठ, क्विज़ और प्रमाणपत्र स्वतः इस कक्ष में सिंक होगा।",
        },
        active: {
          headlineTemplateSingular: "{count} कोर्स जारी।",
          headlineTemplatePlural: "{count} कोर्स जारी।",
          blurb: "जहाँ छोड़ा था वहीं से शुरू करें — पाठ, क्विज़, प्रमाणपत्र और सौंपी गई ट्रेनिंग सभी HenryCo Learn से इस कक्ष में सिंक होते हैं।",
        },
        calm: {
          headlineTemplateSingular: "{count} कोर्स पूर्ण।",
          headlineTemplatePlural: "{count} कोर्स पूर्ण।",
          blurb: "आपके प्रमाण और सीखने का इतिहास यहीं रहता है — CV, आंतरिक रिपोर्टिंग या अपने रिकॉर्ड के लिए सुविधाजनक।",
        },
      },
    },
    sections: {
      coursesTitle: "सीखना जारी रखें",
      coursesMetaEmpty: "अपने पहले कोर्स में नामांकन के लिए HenryCo Learn कैटलॉग देखें।",
      coursesMetaTemplate: "{active} सक्रिय · {completed} पूर्ण",
      extrasTitle: "प्रमाण, असाइनमेंट और शिक्षण",
      extrasMeta: "प्रमाणपत्र, सौंपी गई ट्रेनिंग, सहेजे गए कोर्स और शिक्षक आवेदन यहाँ रहते हैं।",
      activityTitle: "हाल की गतिविधि",
      activityMetaTemplateSingular: "{count} अद्यतन · नवीनतम पहले",
      activityMetaTemplatePlural: "{count} अद्यतन · नवीनतम पहले",
      activityMetaEmpty: "पाठ, क्विज़, प्रमाणपत्र और भुगतान यहाँ वास्तविक समय में प्रतिबिंबित होते हैं।",
    },
    empty: {
      coursesTitle: "अभी कोई कोर्स लिंक नहीं है",
      coursesBody: "HenryCo Learn पर कैटलॉग देखें और नामांकन करें। आपकी जगह यहाँ स्वतः दिखाई देगी।",
      activityTitle: "अभी तक कोई Learn गतिविधि नहीं",
      activityBody: "कोर्स प्रगति, क्विज़ परिणाम, प्रमाणपत्र जारी होना और भुगतान रसीदें यहाँ वास्तविक समय में प्रकट होती हैं।",
    },
    courses: {
      ariaLabel: "कोर्स",
      completedAtTemplate: "{date} को पूर्ण",
      progressPercentTemplate: "{percent}% पूर्ण",
      statusDelimiter: " · ",
    },
    extras: {
      ariaLabel: "Learn अतिरिक्त",
      certificatesTitle: "प्रमाणपत्र",
      assignmentsTitle: "सौंपी गई पढ़ाई",
      savedTitle: "सहेजे गए कोर्स",
      teachingTitle: "HenryCo के साथ पढ़ाएँ",
      statusLabel: "स्थिति",
      expertiseLabel: "विशेषज्ञता",
      topicsLabel: "विषय",
      openApplicationCta: "आवेदन खोलें",
      applyToTeachCta: "पढ़ाने के लिए आवेदन करें",
      teachingEmpty: "हम शिक्षण आवेदनों की समीक्षा मैन्युअल रूप से करते हैं। HenryCo Learn पर आवेदन करें, स्थिति यहाँ वापस सिंक हो जाएगी।",
    },
    activity: {
      ariaLabel: "Learn गतिविधि",
      fallbackTitle: "Learn गतिविधि",
    },
  },
  divisionStudio: {
    metadata: {
      title: "Studio · प्रोजेक्ट कक्ष",
      description: "इस खाते से जुड़ा हर HenryCo Studio सहयोग ट्रैक करें — प्रस्ताव, माइलस्टोन, भुगतान, डिलिवरेबल और गतिविधि एक ही कक्ष में।",
    },
    hero: {
      eyebrowLive: "Studio · लाइव",
      overviewAriaLabel: "Studio अवलोकन",
      activityAriaLabel: "Studio गतिविधि",
      sideAriaLabel: "यह कक्ष कैसे काम करता है",
      sideLabel: "यह कक्ष कैसे काम करता है",
      sideTitle: "एक प्रोजेक्ट कक्ष, असली स्थिति।",
      sideBody: "प्रस्ताव, माइलस्टोन, भुगतान प्रमाण, डिलिवरेबल और संवाद संकेत उसी HenryCo पहचान से जुड़े रहते हैं जिसका उपयोग आप हर जगह करते हैं। नीचे का डैशबोर्ड Studio टीम की वास्तविक प्रगति दिखाता है, स्थिति सूची नहीं।",
      breakdownAriaLabel: "गतिविधि विभाजन",
      breakdownLabel: "स्थिति अनुसार",
      tiles: {
        activeLabel: "सक्रिय प्रोजेक्ट",
        activeFootEmpty: "अभी कोई सक्रिय कार्यस्थल नहीं",
        activeFootHasValue: "डिलिवरी गति वाले सक्रिय कार्यस्थल",
        pendingLabel: "लंबित भुगतान",
        pendingFootEmpty: "व्यावसायिक रेखा साफ़",
        pendingFootHasValue: "खुले व्यावसायिक चेकपॉइंट अभी भी हैं",
        proofLabel: "प्रमाण जमा",
        proofFootEmpty: "कुछ भी समीक्षा प्रतीक्षा में नहीं",
        proofFootHasValue: "Studio समीक्षा प्रतीक्षा में भुगतान",
        deliverablesLabel: "डिलिवरेबल",
        deliverablesFootEmpty: "जैसे ही Studio अपलोड करेगा, फ़ाइलें यहाँ आएँगी",
        deliverablesFootHasValue: "फ़ाइलें और परिणाम एक जगह ट्रैक",
      },
      breakdown: {
        active: "सक्रिय",
        readyReview: "समीक्षा के लिए तैयार",
        pendingPayment: "भुगतान लंबित",
        proofSubmitted: "प्रमाण जमा",
      },
      state: {
        empty: {
          headline: "एक Studio ब्रीफ़ शुरू करें।",
          blurb: "जब आपकी HenryCo पहचान के साथ कोई प्रस्ताव या प्रोजेक्ट सक्रिय होगा, सिंक की हुई Studio कक्ष यहाँ दिखेगी — माइलस्टोन, भुगतान, डिलिवरेबल और अगला कदम एक साथ।",
          ctaPrimary: "ब्रीफ़ शुरू करें",
          ctaSecondary: "Studio खोलें",
        },
        attention: {
          headlineTemplateSingular: "{count} भुगतान अतिदेय।",
          headlineTemplatePlural: "{count} भुगतान अतिदेय।",
          blurb: "एक भुगतान चेकपॉइंट देय तिथि पार कर चुका है। प्रमाण अपलोड करने या Studio टीम से संपर्क करने के लिए कक्ष खोलें।",
          ctaPrimary: "भुगतान खोलें",
          ctaSecondary: "Studio खोलें",
        },
        activeReady: {
          headlineTemplateSingular: "{count} प्रोजेक्ट समीक्षा के लिए तैयार।",
          headlineTemplatePlural: "{count} प्रोजेक्ट समीक्षा के लिए तैयार।",
          blurb: "डिलिवरेबल और संशोधन आपके अनुमोदन की प्रतीक्षा में हैं। कक्ष खोलकर समीक्षा करें और अगला माइलस्टोन अनलॉक करें।",
          ctaPrimary: "प्रोजेक्ट खोलें",
          ctaSecondary: "Studio खोलें",
        },
        activeProjects: {
          headlineTemplateSingular: "{count} सक्रिय प्रोजेक्ट।",
          headlineTemplatePlural: "{count} सक्रिय प्रोजेक्ट।",
          blurb: "माइलस्टोन गति, भुगतान चेकपॉइंट और डिलिवरेबल वाले सक्रिय कार्यस्थल — सब HenryCo Studio से इस कक्ष में प्रतिबिंबित।",
          ctaPrimary: "Studio खोलें",
          ctaSecondary: "नया ब्रीफ़ शुरू करें",
        },
        calm: {
          headlineTemplateSingular: "{count} प्रोजेक्ट कक्ष दर्ज।",
          headlineTemplatePlural: "{count} प्रोजेक्ट कक्ष दर्ज।",
          blurb: "आपने जो भी Studio सहयोग शुरू किया — प्रस्ताव, माइलस्टोन, भुगतान, डिलिवरेबल — तेज़ फ़ॉलोअप के लिए एक कक्ष में रखा गया।",
          ctaPrimary: "Studio खोलें",
          ctaSecondary: "नया ब्रीफ़ शुरू करें",
        },
      },
    },
    sections: {
      projectsTitle: "प्रोजेक्ट कक्ष",
      projectsAriaLabel: "Studio प्रोजेक्ट",
      projectsMetaEmpty: "जब Studio सहयोग सक्रिय होगा, कार्यस्थल यहाँ दिखेंगे।",
      projectsMetaTemplateSingular: "{count} प्रोजेक्ट · नवीनतम गति अनुसार",
      projectsMetaTemplatePlural: "{count} प्रोजेक्ट · नवीनतम गति अनुसार",
      paymentsTitle: "भुगतान चेकपॉइंट",
      paymentsAriaLabel: "Studio भुगतान",
      paymentsMetaEmpty: "जब प्रस्ताव या प्रोजेक्ट सक्रिय होगा, Studio भुगतान अनुरोध यहाँ दिखेंगे।",
      paymentsMetaTemplateSingular: "{count} चेकपॉइंट · प्रमाण अपलोड और अनुमोदन स्थिति",
      paymentsMetaTemplatePlural: "{count} चेकपॉइंट · प्रमाण अपलोड और अनुमोदन स्थिति",
      activityTitle: "हाल की गतिविधि",
      activityAriaLabel: "Studio गतिविधि",
      activityMetaEmpty: "प्रोजेक्ट अपडेट, भुगतान प्रमाण और माइलस्टोन अनुमोदन यहाँ प्रतिबिंबित होते हैं।",
      activityMetaTemplateSingular: "{count} अपडेट · नवीनतम पहले",
      activityMetaTemplatePlural: "{count} अपडेट · नवीनतम पहले",
    },
    empty: {
      projectsTitle: "अभी कोई Studio कार्यस्थल जुड़ा नहीं",
      projectsBody: "जैसे ही आपकी HenryCo पहचान के साथ प्रस्ताव या प्रोजेक्ट बनेगा, सिंक की हुई Studio कक्ष यहाँ दिखेगी — माइलस्टोन, भुगतान, डिलिवरेबल और अगला कदम।",
      paymentsTitle: "अभी कोई भुगतान चेकपॉइंट नहीं",
      paymentsBody: "व्यावसायिक माइलस्टोन — जमा राशि, मध्य-प्रोजेक्ट और डिलिवरी — जब आपके साथ प्रस्ताव सक्रिय होगा तब यहाँ आएँगे।",
      activityTitle: "अभी कोई Studio गतिविधि नहीं",
      activityBody: "प्रोजेक्ट अपडेट, भुगतान प्रमाण, डिलिवरेबल रिलीज़ और माइलस्टोन अनुमोदन जैसे ही होंगे यहाँ आएँगे।",
    },
    projects: {
      listAriaLabel: "Studio प्रोजेक्ट",
      fallbackSubtitle: "Studio अगला अपडेट तैयार कर रहा है।",
      milestonesTemplate: "{approved}/{total} माइलस्टोन",
      paymentsTemplateSingular: "{count} खुला भुगतान",
      paymentsTemplatePlural: "{count} खुले भुगतान",
      deliverablesTemplateSingular: "{count} डिलिवरेबल",
      deliverablesTemplatePlural: "{count} डिलिवरेबल",
      updatedTemplate: "अद्यतन {stamp}",
      rowAriaLabelTemplate: "{title} · {kind}",
      fallbackStamp: "—",
    },
    projectKindLabels: {
      live: "लाइव",
      ready_review: "समीक्षा के लिए तैयार",
      scheduled: "अनुसूचित",
      delivered: "वितरित",
      issue: "कार्रवाई आवश्यक",
    },
    payments: {
      listAriaLabel: "Studio भुगतान",
      rowAriaLabelTemplate: "{label} · {status}",
      dueTemplate: "देय {stamp}",
      updatedTemplate: "अद्यतन {stamp}",
      subTemplate: "{amount} · {method} · {due}",
    },
    paymentStatusLabels: {
      pending: "लंबित",
      paid: "भुगतान हो गया",
      approved: "स्वीकृत",
      settled: "निपटाया",
      proof_uploaded: "प्रमाण अपलोड",
      proof_submitted: "प्रमाण जमा",
      in_review: "समीक्षा में",
      rejected: "अस्वीकृत",
      overdue: "अतिदेय",
      failed: "विफल",
      pending_deposit: "जमा राशि लंबित",
    },
    activity: {
      listAriaLabel: "Studio गतिविधि",
      rowAriaLabelTemplate: "{title} · {stamp}",
    },
  },
  divisionLogistics: {
    metadata: {
      title: "लॉजिस्टिक्स · डिलीवरी और शिपमेंट",
      description: "इस खाते से जुड़े HenryCo Logistics के हर पिकअप, ड्रॉप-ऑफ, ETA और डिलीवरी प्रमाण — लॉजिस्टिक्स नेटवर्क से एक शांत कमरे में दर्पण-समान।",
    },
    hero: {
      ariaLabel: "लॉजिस्टिक्स अवलोकन",
      eyebrow: "HenryCo लॉजिस्टिक्स",
      brand: "HenryCo लॉजिस्टिक्स",
      title: "हर पार्सल, एक कमरा।",
      body: "पिकअप, ड्रॉप-ऑफ, ETA और डिलीवरी प्रमाण — सब लॉजिस्टिक्स नेटवर्क से आपके खाते में दर्पण-समान। एक बार बुक करें",
      bodyDomain: " logistics.henrycogroup.com",
      ctaNewDelivery: "नई डिलीवरी",
    },
    metrics: {
      ariaLabel: "लॉजिस्टिक्स प्रदर्शन",
      activeNowLabel: "अभी सक्रिय",
      activeFootSingular: "शिपमेंट रास्ते में",
      activeFootPlural: "शिपमेंट रास्ते में",
      deliveredMonthLabel: "वितरित · इस माह",
      deliveredMonthFootTemplate: "कुल {count}",
      onTimeRateLabel: "समय पर दर",
      onTimeRateFootEmpty: "पहली निर्धारित डिलीवरी की प्रतीक्षा में",
      onTimeRateFootHasValue: "निर्धारित डिलीवरी में से",
      totalSpendLabel: "कुल खर्च",
      totalSpendFoot: "जीवनकाल भुगतान",
    },
    map: {
      noShipmentsAriaLabel: "अभी कोई शिपमेंट नहीं",
      noShipmentsTitle: "पहली डिलीवरी बुक करते ही आपका मानचित्र जग उठेगा",
      noShipmentsBody: "हर सक्रिय पिकअप और ड्रॉप-ऑफ यहाँ स्वचालित रूप से पिन हो जाता है। एक बार बुक करें और आपके शिपमेंट लॉजिस्टिक्स साइट से दर्पण-समान दिखेंगे।",
      noShipmentsCta: "डिलीवरी बुक करें",
      pendingAriaLabel: "मानचित्र पूर्वावलोकन",
      pendingTitle: "जियोकोडिंग जारी",
      pendingBody: "जैसे ही डिस्पैच पिकअप और ड्रॉप-ऑफ पते जियोकोड कर देगा, आपके सक्रिय शिपमेंट मानचित्र पर पिन हो जाएँगे।",
      activeAriaLabel: "सक्रिय शिपमेंट मानचित्र",
      altTemplateSingular: "{count} सक्रिय पिकअप और ड्रॉप-ऑफ पिन दिखाने वाला मानचित्र",
      altTemplatePlural: "{count} सक्रिय पिकअप और ड्रॉप-ऑफ पिन दिखाने वाला मानचित्र",
      liveBadgeTemplateSingular: "लाइव · {count} सक्रिय शिपमेंट",
      liveBadgeTemplatePlural: "लाइव · {count} सक्रिय शिपमेंट",
    },
    sections: {
      activeTitle: "अभी रास्ते में",
      activeMetaTemplate: "{count} सक्रिय · लॉजिस्टिक्स से स्वतः समन्वय",
      activeRailAriaLabel: "सक्रिय शिपमेंट",
      emptyAriaLabel: "कोई सक्रिय शिपमेंट नहीं",
      emptyTitle: "कोई सक्रिय शिपमेंट नहीं",
      emptyBody: "आपकी पिछली डिलीवरी नीचे हैं। एक और बुक करें — राइडर के पिकअप पुष्टि करते ही यहाँ दिखेगी।",
      actionsTitle: "डिलीवरी शुरू करें",
      actionsMeta: "सामान्य प्रवाहों के शॉर्टकट",
      actionsAriaLabel: "लॉजिस्टिक्स त्वरित क्रियाएँ",
      recentTitle: "हाल में वितरित",
      recentMetaTemplate: "{lifetime} में से अंतिम {recent}",
      recentAriaLabel: "हालिया डिलीवरी",
      spendTitle: "खर्च · पिछले 6 माह",
      spendMeta: "केवल भुगतान",
      spendFigureAriaLabelTemplate: "पिछले 6 महीनों का लॉजिस्टिक्स खर्च",
    },
    statusLabels: {
      quoteRequested: "उद्धरण लंबित",
      quoteSent: "उद्धरण तैयार",
      pendingPayment: "भुगतान प्रतीक्षित",
      scheduled: "निर्धारित",
      assigned: "राइडर नियुक्त",
      pickupConfirmed: "उठा लिया",
      inTransit: "ट्रांज़िट में",
      delayed: "विलंबित",
      attemptedDelivery: "डिलीवरी प्रयास",
      delivered: "वितरित",
      completed: "पूर्ण",
      closed: "बंद",
      cancelled: "रद्द",
      refunded: "धन वापसी",
    },
    urgencyLabels: {
      standard: "मानक",
      sameDay: "उसी दिन",
      express: "एक्सप्रेस",
      nextDay: "अगले दिन",
    },
    serviceLabels: {
      scheduled: "निर्धारित",
      sameDay: "उसी दिन",
      interCity: "अंतर-शहर",
      bulk: "बल्क",
    },
    shipment: {
      trackingCodeAriaTemplate: "ट्रैकिंग कोड {code}",
      addressPending: "पता लंबित",
      etaPending: "ETA लंबित",
      trackCta: "शिपमेंट ट्रैक करें",
      openTrackingAriaTemplate: "{code} के लिए ट्रैकिंग खोलें",
      etaAriaTemplate: "ETA {eta}",
      etaMinutesInTemplate: "{minutes} मिनट में",
      etaMinutesOverdueTemplate: "{minutes} मिनट विलंब",
      etaHoursInTemplate: "{hours} घंटे में",
      etaHoursOverdueTemplate: "{hours} घंटे विलंब",
      detailSeparator: " · ",
    },
    timeline: {
      ariaLabel: "हालिया डिलीवरी",
      deliveredToTemplate: "{name} को वितरित",
      receiptCta: "रसीद",
    },
    quickActions: {
      ariaLabel: "लॉजिस्टिक्स त्वरित क्रियाएँ",
      bookLabel: "डिलीवरी बुक करें",
      bookDesc: "एक निर्देशित प्रवाह में पिकअप और ड्रॉप-ऑफ।",
      trackLabel: "कोड से ट्रैक करें",
      trackDesc: "लाइव स्थिति, ETA और राइडर संदर्भ।",
      quoteLabel: "पहले उद्धरण",
      quoteDesc: "प्रतिबद्धता से पहले संकेतक मूल्य।",
      addressesLabel: "सहेजे पते",
      addressesDesc: "पिकअप और ड्रॉप-ऑफ संपर्क।",
      invoicesLabel: "रसीदें और इनवॉइस",
      invoicesDesc: "हर शिपमेंट के लिए ब्रांडेड PDF।",
      supportLabel: "लॉजिस्टिक्स समर्थन",
      supportDesc: "अपने खाते से जुड़ा थ्रेड खोलें।",
    },
    spend: {
      figureAriaLabel: "पिछले 6 महीनों का लॉजिस्टिक्स खर्च",
      emptyTick: "—",
    },
  },
  settings: {
    pageTitle: "सेटिंग्स और प्राथमिकताएँ",
    pageDescription:
      "अपनी प्रोफ़ाइल, संचार प्राथमिकताएँ, गोपनीयता नियंत्रण और मैन्युअल डेटा अनुरोध प्रबंधित करें।",
    profileSectionKicker: "प्रोफ़ाइल जानकारी",
    notificationsSectionKicker: "अधिसूचना प्राथमिकताएँ",
  },
  addresses: {
    metadata: {
      title: "पते",
      description:
        "अपने सहेजे गए पते (घर, कार्यालय, दुकान…) प्रबंधित करें — डिलीवरी, बुकिंग और KYC सत्यापन में काम आते हैं।",
    },
    hero: {
      title: "पते",
      description:
        "अपने सहेजे गए पते (घर, कार्यालय, दुकान…) प्रबंधित करें — डिलीवरी, बुकिंग और KYC सत्यापन में काम आते हैं।",
    },
    card: {
      defaultBadge: "डिफ़ॉल्ट",
      kycVerifiedBadge: "KYC सत्यापित",
      setDefaultCta: "डिफ़ॉल्ट बनाएं",
      editCta: "संपादित करें",
      deleteCta: "हटाएं",
    },
    deleteConfirm: {
      prompt: "इस पते को हटाएं? इसे वापस नहीं किया जा सकता।",
      confirmCta: "हटाएं",
      cancelCta: "रद्द करें",
    },
    empty: {
      body:
        "आपने अभी तक कोई पता नहीं जोड़ा है। HenryCo में तेज़ चेकआउट के लिए अपना पहला पता जोड़ें।",
    },
    add: {
      cta: "पता जोड़ें",
      formTitle: "नया पता जोड़ें",
      editFormTitleTemplate: "{label} संपादित करें",
      maxedNoticeTemplate:
        "आपने {count} पते के प्रकार (घर, कार्यालय, दुकान, गोदाम, वैकल्पिक 1, वैकल्पिक 2) की अधिकतम सीमा जोड़ ली है। दूसरा पता जोड़ने के लिए एक को संपादित या हटाएं।",
    },
  },
  search: {
    metadata: {
      title: "खाता खोजें",
      description: "HenryCo खाता वर्कफ़्लो और जुड़े विभाग मार्ग खोजें।",
    },
    hero: {
      title: "अपने HenryCo वर्कफ़्लो खोजें।",
      description:
        "सामान्य डैशबोर्ड पर लौटे बिना सीधे खाते की सटीक क्रियाओं और जुड़े विभाग मार्गों पर जाएँ।",
    },
    placeholder: "खाता खोजें: सूचनाएँ, वॉलेट, इनवॉइस, सहायता, Jobs आवेदन...",
  },
};

const LOCALE_OVERRIDES: Partial<Record<AppLocale, DeepPartial<AccountCopy>>> = {
  fr: FR,
  // Promoted-bundle locales are authored as untyped JSON-style consts; cast to
  // DeepPartial here so that tuple-shaped slots (e.g. shortMonths) accept the
  // inferred string[] without forcing `as const` on every literal upstream.
  es: ACCOUNT_COPY_ES as DeepPartial<AccountCopy>,
  pt: ACCOUNT_COPY_PT as DeepPartial<AccountCopy>,
  ar: ACCOUNT_COPY_AR as DeepPartial<AccountCopy>,
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
