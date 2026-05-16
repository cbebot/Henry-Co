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
