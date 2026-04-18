import type { AppLocale } from "./locales";
import { deepMergeMessages } from "./merge-messages";
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
};

const FR: Partial<AccountCopy> = {
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
};

const DE: Partial<AccountCopy> = {
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
  }
};

const IT: Partial<AccountCopy> = {
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
  }
};

const IG: Partial<AccountCopy> = {
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
};

const YO: Partial<AccountCopy> = {
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
};

const HA: Partial<AccountCopy> = {
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
};

const ZH: Partial<AccountCopy> = {
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
};

const HI: Partial<AccountCopy> = {
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
};

const LOCALE_OVERRIDES: Partial<Record<AppLocale, Partial<AccountCopy>>> = {
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
