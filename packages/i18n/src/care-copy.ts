import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

export type CareCopy = {
  nav: {
    home: string;
    book: string;
    track: string;
    review: string;
    account: string;
  };
  hero: {
    title: string;
    subtitle: string;
    ctaBook: string;
    ctaTrack: string;
  };
  booking: {
    title: string;
    serviceLabel: string;
    dateLabel: string;
    timeLabel: string;
    nameLabel: string;
    phoneLabel: string;
    emailLabel: string;
    addressLabel: string;
    notesLabel: string;
    submitButton: string;
    confirmationHeading: string;
    confirmationBody: string;
    trackingCodeLabel: string;
  };
  tracking: {
    title: string;
    codeLabel: string;
    phoneLabel: string;
    submitButton: string;
    notFound: string;
    statusLabel: string;
    lastUpdatedLabel: string;
    estimatedLabel: string;
  };
  status: {
    pending: string;
    confirmed: string;
    collected: string;
    inProgress: string;
    readyForDelivery: string;
    outForDelivery: string;
    delivered: string;
    completed: string;
    cancelled: string;
  };
  review: {
    title: string;
    ratingLabel: string;
    textLabel: string;
    photoLabel: string;
    submitButton: string;
    successMessage: string;
    pendingApproval: string;
  };
  serviceTypes: {
    laundry: string;
    drycleaning: string;
    ironing: string;
    alterations: string;
    homeCleaning: string;
    officeCleaning: string;
  };
  staffManager: {
    metadata: {
      title: string;
      description: string;
    };
    hero: {
      eyebrow: string;
      title: string;
      body: string;
    };
    quickLinks: {
      openOperations: string;
      openExpenses: string;
      trackingPage: string;
      createWalkIn: string;
    };
    metrics: {
      activeBookings: { label: string; note: string };
      urgentQueue: { label: string; note: string };
      registeredPieces: { label: string; note: string };
      recordedInflow: { label: string; note: string };
      pendingExpenses: { label: string; note: string };
    };
    urgentPanel: {
      eyebrow: string;
      title: string;
      subtitle: string;
      noSlot: string;
      openBooking: string;
      empty: string;
    };
    pressurePanel: {
      eyebrow: string;
      title: string;
      subtitle: string;
      missingIntake: { label: string; note: string };
      approvedExpenses: { label: string; note: string };
      overallBalance: {
        label: string;
        flowTemplate: string;
      };
    };
    dash: string;
  };
  staffOwner: {
    metadata: {
      title: string;
      description: string;
    };
    hero: {
      eyebrow: string;
      title: string;
      body: string;
    };
    quickLinks: {
      bookings: string;
      finance: string;
      records: string;
      security: string;
      settings: string;
      reviews: string;
      staff: string;
      fieldStaff: string;
      managerExpenses: string;
      riderExpenses: string;
      supportExpenses: string;
    };
    metrics: {
      activeBookings: { label: string; note: string };
      archivedBookings: { label: string; note: string };
      balance: { label: string; flowTemplate: string };
      reviews: { label: string; pendingTemplate: string };
    };
    alertsPanel: {
      eyebrow: string;
      title: string;
      subtitle: string;
      empty: string;
      expensePressure: { title: string; text: string };
      awaitingDecision: { title: string; textTemplate: string };
      refundActivity: { title: string; textTemplate: string };
      delayRisk: { title: string; textTemplate: string };
      strongFlow: { title: string; textTemplate: string };
    };
    forecastPanel: {
      eyebrow: string;
      title: string;
      subtitle: string;
      monthInflow: string;
      monthOutflow: string;
      projectedNet: string;
      flowGrowth: string;
      positiveTemplate: string;
      negativeTemplate: string;
    };
    urgencyPanel: {
      eyebrow: string;
      title: string;
      subtitle: string;
      noPickup: string;
      empty: string;
    };
    brandPanel: {
      eyebrow: string;
      title: string;
      subtitle: string;
      heroBadge: string;
      supportEmail: string;
      supportPhone: string;
      pickupHours: string;
      careDomain: string;
      hubDomain: string;
      notConfigured: string;
      openSettings: string;
    };
    paymentsPanel: {
      eyebrow: string;
      title: string;
      subtitle: string;
      generalPayment: string;
      empty: string;
    };
    expensesPanel: {
      eyebrow: string;
      title: string;
      subtitle: string;
      viewProof: string;
      empty: string;
    };
    reviewsPanel: {
      eyebrow: string;
      title: string;
      subtitle: string;
      approved: string;
      pending: string;
      photoAltTemplate: string;
      empty: string;
    };
    intelligencePanel: {
      eyebrow: string;
      title: string;
      subtitle: string;
      expenseFlags: {
        title: string;
        topTemplate: string;
        emptyText: string;
      };
      delayAlerts: {
        title: string;
        textTemplate: string;
      };
      forecasting: {
        title: string;
      };
      approvalDiscipline: {
        title: string;
        textTemplate: string;
      };
    };
    archivePanel: {
      eyebrow: string;
      cta: string;
    };
    dash: string;
  };
};

const EN: CareCopy = {
  nav: {
    home: "Home",
    book: "Book",
    track: "Track",
    review: "Leave a review",
    account: "Account",
  },
  hero: {
    title: "Care that shows up, every time.",
    subtitle: "Garment care, home cleaning, and workplace upkeep with clearer booking, steadier tracking, and calmer support.",
    ctaBook: "Book a service",
    ctaTrack: "Track a booking",
  },
  booking: {
    title: "Book a service",
    serviceLabel: "Service type",
    dateLabel: "Preferred date",
    timeLabel: "Preferred time",
    nameLabel: "Full name",
    phoneLabel: "Phone number",
    emailLabel: "Email address",
    addressLabel: "Pickup address",
    notesLabel: "Additional notes",
    submitButton: "Request booking",
    confirmationHeading: "Booking request received",
    confirmationBody: "We will confirm your booking shortly. Keep your tracking code safe.",
    trackingCodeLabel: "Your tracking code",
  },
  tracking: {
    title: "Track your booking",
    codeLabel: "Tracking code",
    phoneLabel: "Phone number",
    submitButton: "Check status",
    notFound: "No booking found for that code and phone number.",
    statusLabel: "Current status",
    lastUpdatedLabel: "Last updated",
    estimatedLabel: "Estimated completion",
  },
  status: {
    pending: "Pending",
    confirmed: "Confirmed",
    collected: "Collected",
    inProgress: "In progress",
    readyForDelivery: "Ready for delivery",
    outForDelivery: "Out for delivery",
    delivered: "Delivered",
    completed: "Completed",
    cancelled: "Cancelled",
  },
  review: {
    title: "Share your experience",
    ratingLabel: "Overall rating",
    textLabel: "Your review",
    photoLabel: "Add a photo (optional)",
    submitButton: "Submit review",
    successMessage: "Thank you. Your review has been submitted and is awaiting approval.",
    pendingApproval: "Awaiting approval",
  },
  serviceTypes: {
    laundry: "Laundry",
    drycleaning: "Dry cleaning",
    ironing: "Ironing",
    alterations: "Alterations",
    homeCleaning: "Home cleaning",
    officeCleaning: "Office cleaning",
  },
  staffManager: {
    metadata: {
      title: "Manager Dashboard | Henry Onyx Fabric Care",
      description:
        "Manager command dashboard for intake, live operations, inflow, and expense control.",
    },
    hero: {
      eyebrow: "Manager operations room",
      title: "Run the day. Keep the records truthful.",
      body: "This is the manager's live control layer. Intake, pricing-backed registration, status movement, payment capture, and daily expenses should all be handled from here without confusion.",
    },
    quickLinks: {
      openOperations: "Open operations",
      openExpenses: "Open expenses",
      trackingPage: "Tracking page",
      createWalkIn: "Create walk-in booking",
    },
    metrics: {
      activeBookings: { label: "Active bookings", note: "Current live workload" },
      urgentQueue: { label: "Urgent queue", note: "Needs quick attention" },
      registeredPieces: { label: "Registered pieces", note: "Pricing-backed item records" },
      recordedInflow: { label: "Recorded inflow", note: "Money logged against bookings" },
      pendingExpenses: { label: "Pending expenses", note: "Awaiting owner review" },
    },
    urgentPanel: {
      eyebrow: "Priority",
      title: "Urgent bookings",
      subtitle: "These are the jobs the manager should not ignore.",
      noSlot: "No slot",
      openBooking: "Open booking",
      empty: "No urgent bookings right now.",
    },
    pressurePanel: {
      eyebrow: "Manager truth checks",
      title: "Operational pressure points",
      subtitle: "These indicators help the manager stop hidden mistakes before they become company problems.",
      missingIntake: {
        label: "Garment bookings missing intake",
        note: "Only garment bookings should be flagged here. Service bookings are tracked separately.",
      },
      approvedExpenses: {
        label: "Approved expenses",
        note: "These costs have already been accepted by owner review.",
      },
      overallBalance: {
        label: "Overall balance",
        flowTemplate: "{inflow} in • {outflow} out",
      },
    },
    dash: "—",
  },
  staffOwner: {
    metadata: {
      title: "Owner Dashboard | Henry Onyx Fabric Care",
      description:
        "Owner control room for bookings, finance, security, reviews, and company-wide operations.",
    },
    hero: {
      eyebrow: "Owner command center",
      title: "Master control for the entire care operation.",
      body: "This is the highest layer. You see the real state of the company here: urgency, income, expense pressure, records quality, review health, and security.",
    },
    quickLinks: {
      bookings: "Bookings",
      finance: "Finance",
      records: "Records",
      security: "Security",
      settings: "Settings",
      reviews: "Reviews",
      staff: "Staff",
      fieldStaff: "Field staff",
      managerExpenses: "Manager expenses",
      riderExpenses: "Rider expenses",
      supportExpenses: "Support expenses",
    },
    metrics: {
      activeBookings: { label: "Active bookings", note: "Current operational queue" },
      archivedBookings: { label: "Archived bookings", note: "Older than 30 days" },
      balance: { label: "Balance", flowTemplate: "{inflow} in • {outflow} out" },
      reviews: { label: "Reviews", pendingTemplate: "{count} pending approval" },
    },
    alertsPanel: {
      eyebrow: "Smart alerts",
      title: "Finance and operations anomaly watch",
      subtitle: "This is where the owner catches unusual pressure before it becomes damage.",
      empty: "No major anomalies are visible right now.",
      expensePressure: {
        title: "Expense pressure is above inflow",
        text: "Total outflow is already higher than inflow. The owner should check approvals, high-cost activity, and recoverable revenue immediately.",
      },
      awaitingDecision: {
        title: "Expenses awaiting owner decision",
        textTemplate: "{count} expense entries are still recorded and waiting for approval or voiding.",
      },
      refundActivity: {
        title: "Unusual refund activity detected",
        textTemplate: "Recent refund-linked expenses are visible in the system. Refund pressure is currently {amount} from {count} item(s).",
      },
      delayRisk: {
        title: "Booking delay risk is rising",
        textTemplate: "{overdue} overdue booking(s) and {urgent} urgent booking(s) are currently visible. This can damage service trust if not handled fast.",
      },
      strongFlow: {
        title: "Recent flow looks strong",
        textTemplate: "Live current-month inflow is outpacing outflow by {percent} on recent tracked activity. Keep the system disciplined so growth stays clean.",
      },
    },
    forecastPanel: {
      eyebrow: "Forecast",
      title: "Short-range operational projection",
      subtitle: "A live run-rate estimate based on current month tracked activity.",
      monthInflow: "Month inflow (live)",
      monthOutflow: "Month outflow (live)",
      projectedNet: "Projected month-end net",
      flowGrowth: "Flow growth signal",
      positiveTemplate: "If the current live run-rate holds, care could close the month around {amount} net.",
      negativeTemplate: "If the current live run-rate holds, care may close the month under pressure at about {amount} net.",
    },
    urgencyPanel: {
      eyebrow: "Urgency",
      title: "Orders demanding attention",
      subtitle: "The owner should notice pressure instantly, even if the manager is running the day.",
      noPickup: "No pickup date",
      empty: "No urgent bookings at the moment.",
    },
    brandPanel: {
      eyebrow: "Brand state",
      title: "Live company presentation",
      subtitle: "What the public side is currently pulling from settings.",
      heroBadge: "Hero badge",
      supportEmail: "Support email",
      supportPhone: "Support phone",
      pickupHours: "Pickup hours",
      careDomain: "Care domain",
      hubDomain: "Hub domain",
      notConfigured: "Not configured yet",
      openSettings: "Open settings",
    },
    paymentsPanel: {
      eyebrow: "Cash movement",
      title: "Recent payments",
      subtitle: "Quick read on inflow.",
      generalPayment: "General payment",
      empty: "No recent payments yet.",
    },
    expensesPanel: {
      eyebrow: "Cost pressure",
      title: "Recent expenses",
      subtitle: "Owner should always understand where money is going.",
      viewProof: "View proof",
      empty: "No recent expenses yet.",
    },
    reviewsPanel: {
      eyebrow: "Review health",
      title: "Recent customer voice",
      subtitle: "Strong service brands protect trust, not just workflow.",
      approved: "approved",
      pending: "pending",
      photoAltTemplate: "Review photo from {name}",
      empty: "No reviews available yet.",
    },
    intelligencePanel: {
      eyebrow: "Intelligence",
      title: "What the owner should track next",
      subtitle: "The company becomes more productive when insight is turned into action.",
      expenseFlags: {
        title: "Smart expense red flags",
        topTemplate: "Top recent expense category is {category} at {amount}.",
        emptyText: "No major category pressure is visible yet.",
      },
      delayAlerts: {
        title: "Booking delay alerts",
        textTemplate: "{count} overdue booking(s) are visible in the active care queue.",
      },
      forecasting: {
        title: "Operational forecasting",
      },
      approvalDiscipline: {
        title: "Approval discipline",
        textTemplate: "{count} expense record(s) are currently waiting for owner action.",
      },
    },
    archivePanel: {
      eyebrow: "Archive policy",
      cta: "Open archive-aware records",
    },
    dash: "—",
  },
};

const FR: DeepPartial<CareCopy> = {
  nav: {
    home: "Accueil",
    book: "Réserver",
    track: "Suivre",
    review: "Laisser un avis",
    account: "Compte",
  },
  hero: {
    title: "Un soin qui arrive toujours.",
    subtitle: "Entretien vêtements, nettoyage à domicile et entretien bureau avec une réservation plus claire, un suivi plus stable et un support plus serein.",
    ctaBook: "Réserver un service",
    ctaTrack: "Suivre une réservation",
  },
  booking: {
    title: "Réserver un service",
    serviceLabel: "Type de service",
    dateLabel: "Date souhaitée",
    timeLabel: "Heure souhaitée",
    nameLabel: "Nom complet",
    phoneLabel: "Numéro de téléphone",
    emailLabel: "Adresse e-mail",
    addressLabel: "Adresse de collecte",
    notesLabel: "Notes supplémentaires",
    submitButton: "Demander une réservation",
    confirmationHeading: "Demande de réservation reçue",
    confirmationBody: "Nous confirmerons votre réservation sous peu. Conservez votre code de suivi.",
    trackingCodeLabel: "Votre code de suivi",
  },
  tracking: {
    title: "Suivre votre réservation",
    codeLabel: "Code de suivi",
    phoneLabel: "Numéro de téléphone",
    submitButton: "Vérifier le statut",
    notFound: "Aucune réservation trouvée pour ce code et numéro de téléphone.",
    statusLabel: "Statut actuel",
    lastUpdatedLabel: "Dernière mise à jour",
    estimatedLabel: "Fin estimée",
  },
  status: {
    pending: "En attente",
    confirmed: "Confirmé",
    collected: "Collecté",
    inProgress: "En cours",
    readyForDelivery: "Prêt pour livraison",
    outForDelivery: "En cours de livraison",
    delivered: "Livré",
    completed: "Terminé",
    cancelled: "Annulé",
  },
  review: {
    title: "Partagez votre expérience",
    ratingLabel: "Note globale",
    textLabel: "Votre avis",
    photoLabel: "Ajouter une photo (optionnel)",
    submitButton: "Soumettre l'avis",
    successMessage: "Merci. Votre avis a été soumis et attend approbation.",
    pendingApproval: "En attente d'approbation",
  },
  serviceTypes: {
    laundry: "Lavage",
    drycleaning: "Nettoyage à sec",
    ironing: "Repassage",
    alterations: "Retouches",
    homeCleaning: "Ménage",
    officeCleaning: "Nettoyage de bureau",
  },
  staffManager: {
    metadata: {
      title: "Tableau de bord du responsable | Henry Onyx Fabric Care",
      description:
        "Tableau de commande du responsable pour la prise en charge, les opérations en direct, les entrées et le contrôle des dépenses.",
    },
    hero: {
      eyebrow: "Salle d'opérations du responsable",
      title: "Dirigez la journée. Gardez les registres exacts.",
      body: "Voici la couche de contrôle en direct du responsable. La prise en charge, l'enregistrement adossé à la tarification, le suivi des statuts, la saisie des paiements et les dépenses quotidiennes doivent tous être gérés depuis ici, sans confusion.",
    },
    quickLinks: {
      openOperations: "Ouvrir les opérations",
      openExpenses: "Ouvrir les dépenses",
      trackingPage: "Page de suivi",
      createWalkIn: "Créer une réservation sur place",
    },
    metrics: {
      activeBookings: { label: "Réservations actives", note: "Charge de travail en cours" },
      urgentQueue: { label: "File urgente", note: "Nécessite une attention rapide" },
      registeredPieces: { label: "Pièces enregistrées", note: "Enregistrements adossés à la tarification" },
      recordedInflow: { label: "Entrées enregistrées", note: "Argent comptabilisé sur les réservations" },
      pendingExpenses: { label: "Dépenses en attente", note: "En attente de revue du propriétaire" },
    },
    urgentPanel: {
      eyebrow: "Priorité",
      title: "Réservations urgentes",
      subtitle: "Ce sont les missions que le responsable ne doit pas ignorer.",
      noSlot: "Aucun créneau",
      openBooking: "Ouvrir la réservation",
      empty: "Aucune réservation urgente pour le moment.",
    },
    pressurePanel: {
      eyebrow: "Vérifications du responsable",
      title: "Points de pression opérationnels",
      subtitle: "Ces indicateurs aident le responsable à arrêter les erreurs cachées avant qu'elles ne deviennent des problèmes pour l'entreprise.",
      missingIntake: {
        label: "Réservations vêtements sans prise en charge",
        note: "Seules les réservations vêtements doivent être signalées ici. Les réservations de service sont suivies séparément.",
      },
      approvedExpenses: {
        label: "Dépenses approuvées",
        note: "Ces coûts ont déjà été acceptés lors de la revue du propriétaire.",
      },
      overallBalance: {
        label: "Solde global",
        flowTemplate: "{inflow} entrant • {outflow} sortant",
      },
    },
    dash: "–",
  },
  staffOwner: {
    metadata: {
      title: "Tableau du propriétaire | Henry Onyx Fabric Care",
      description:
        "Salle de commande du propriétaire pour les réservations, les finances, la sécurité, les avis et les opérations à l'échelle de l'entreprise.",
    },
    hero: {
      eyebrow: "Centre de commandement du propriétaire",
      title: "Contrôle maître pour toute l'opération de soin.",
      body: "C'est la couche la plus haute. Vous voyez ici l'état réel de l'entreprise : urgence, revenus, pression sur les dépenses, qualité des registres, santé des avis et sécurité.",
    },
    quickLinks: {
      bookings: "Réservations",
      finance: "Finances",
      records: "Registres",
      security: "Sécurité",
      settings: "Paramètres",
      reviews: "Avis",
      staff: "Équipe",
      fieldStaff: "Personnel de terrain",
      managerExpenses: "Dépenses du responsable",
      riderExpenses: "Dépenses des coursiers",
      supportExpenses: "Dépenses du support",
    },
    metrics: {
      activeBookings: { label: "Réservations actives", note: "File opérationnelle actuelle" },
      archivedBookings: { label: "Réservations archivées", note: "Plus de 30 jours" },
      balance: { label: "Solde", flowTemplate: "{inflow} entrant • {outflow} sortant" },
      reviews: { label: "Avis", pendingTemplate: "{count} en attente d'approbation" },
    },
    alertsPanel: {
      eyebrow: "Alertes intelligentes",
      title: "Surveillance des anomalies financières et opérationnelles",
      subtitle: "C'est ici que le propriétaire détecte la pression inhabituelle avant qu'elle ne devienne un dommage.",
      empty: "Aucune anomalie majeure n'est visible pour le moment.",
      expensePressure: {
        title: "La pression des dépenses dépasse les entrées",
        text: "Le total des sorties est déjà supérieur aux entrées. Le propriétaire doit vérifier les approbations, l'activité coûteuse et les revenus récupérables immédiatement.",
      },
      awaitingDecision: {
        title: "Dépenses en attente de décision du propriétaire",
        textTemplate: "{count} entrées de dépenses sont toujours enregistrées et attendent une approbation ou une annulation.",
      },
      refundActivity: {
        title: "Activité de remboursement inhabituelle détectée",
        textTemplate: "Des dépenses récentes liées à des remboursements sont visibles dans le système. La pression actuelle de remboursement est de {amount} sur {count} élément(s).",
      },
      delayRisk: {
        title: "Le risque de retard sur les réservations augmente",
        textTemplate: "{overdue} réservation(s) en retard et {urgent} réservation(s) urgente(s) sont actuellement visibles. Cela peut nuire à la confiance si rien n'est fait rapidement.",
      },
      strongFlow: {
        title: "Le flux récent semble solide",
        textTemplate: "Les entrées en direct du mois en cours dépassent les sorties de {percent} sur l'activité récente. Maintenez la discipline pour que la croissance reste saine.",
      },
    },
    forecastPanel: {
      eyebrow: "Prévision",
      title: "Projection opérationnelle à court terme",
      subtitle: "Estimation en direct du rythme basé sur l'activité suivie du mois en cours.",
      monthInflow: "Entrées du mois (en direct)",
      monthOutflow: "Sorties du mois (en direct)",
      projectedNet: "Net projeté de fin de mois",
      flowGrowth: "Signal de croissance du flux",
      positiveTemplate: "Si le rythme actuel se maintient, care pourrait clôturer le mois avec un net d'environ {amount}.",
      negativeTemplate: "Si le rythme actuel se maintient, care pourrait clôturer le mois sous pression à environ {amount} net.",
    },
    urgencyPanel: {
      eyebrow: "Urgence",
      title: "Commandes exigeant de l'attention",
      subtitle: "Le propriétaire doit ressentir la pression instantanément, même si le responsable mène la journée.",
      noPickup: "Aucune date de collecte",
      empty: "Aucune réservation urgente pour le moment.",
    },
    brandPanel: {
      eyebrow: "État de la marque",
      title: "Présentation de l'entreprise en direct",
      subtitle: "Ce que le côté public tire actuellement des paramètres.",
      heroBadge: "Badge principal",
      supportEmail: "E-mail du support",
      supportPhone: "Téléphone du support",
      pickupHours: "Horaires de collecte",
      careDomain: "Domaine care",
      hubDomain: "Domaine hub",
      notConfigured: "Pas encore configuré",
      openSettings: "Ouvrir les paramètres",
    },
    paymentsPanel: {
      eyebrow: "Mouvement de trésorerie",
      title: "Paiements récents",
      subtitle: "Lecture rapide des entrées.",
      generalPayment: "Paiement général",
      empty: "Aucun paiement récent pour le moment.",
    },
    expensesPanel: {
      eyebrow: "Pression des coûts",
      title: "Dépenses récentes",
      subtitle: "Le propriétaire doit toujours savoir où va l'argent.",
      viewProof: "Voir la preuve",
      empty: "Aucune dépense récente pour le moment.",
    },
    reviewsPanel: {
      eyebrow: "Santé des avis",
      title: "Voix récente des clients",
      subtitle: "Les marques de service solides protègent la confiance, pas seulement le flux de travail.",
      approved: "approuvé",
      pending: "en attente",
      photoAltTemplate: "Photo d'avis de {name}",
      empty: "Aucun avis disponible pour le moment.",
    },
    intelligencePanel: {
      eyebrow: "Renseignement",
      title: "Ce que le propriétaire devrait suivre ensuite",
      subtitle: "L'entreprise gagne en productivité lorsque l'analyse se transforme en action.",
      expenseFlags: {
        title: "Signaux d'alerte intelligents sur les dépenses",
        topTemplate: "La principale catégorie de dépenses récente est {category} à {amount}.",
        emptyText: "Aucune pression majeure de catégorie n'est encore visible.",
      },
      delayAlerts: {
        title: "Alertes de retard sur les réservations",
        textTemplate: "{count} réservation(s) en retard sont visibles dans la file active de care.",
      },
      forecasting: {
        title: "Prévision opérationnelle",
      },
      approvalDiscipline: {
        title: "Discipline d'approbation",
        textTemplate: "{count} enregistrement(s) de dépenses attendent actuellement une action du propriétaire.",
      },
    },
    archivePanel: {
      eyebrow: "Politique d'archivage",
      cta: "Ouvrir les registres avec archive",
    },
    dash: "–",
  },
};

const ES: DeepPartial<CareCopy> = {
  nav: {
    home: "Inicio",
    book: "Reservar",
    track: "Seguimiento",
    review: "Dejar una reseña",
    account: "Cuenta",
  },
  hero: {
    title: "El cuidado que llega, siempre.",
    subtitle: "Cuidado de ropa, limpieza del hogar y mantenimiento del lugar de trabajo con reservas más claras, seguimiento más estable y soporte más tranquilo.",
    ctaBook: "Reservar un servicio",
    ctaTrack: "Seguir una reserva",
  },
  booking: {
    title: "Reservar un servicio",
    serviceLabel: "Tipo de servicio",
    dateLabel: "Fecha preferida",
    timeLabel: "Hora preferida",
    nameLabel: "Nombre completo",
    phoneLabel: "Número de teléfono",
    emailLabel: "Correo electrónico",
    addressLabel: "Dirección de recogida",
    notesLabel: "Notas adicionales",
    submitButton: "Solicitar reserva",
    confirmationHeading: "Solicitud de reserva recibida",
    confirmationBody: "Confirmaremos tu reserva en breve. Guarda tu código de seguimiento.",
    trackingCodeLabel: "Tu código de seguimiento",
  },
  tracking: {
    title: "Seguir tu reserva",
    codeLabel: "Código de seguimiento",
    phoneLabel: "Número de teléfono",
    submitButton: "Verificar estado",
    notFound: "No se encontró ninguna reserva para ese código y número de teléfono.",
    statusLabel: "Estado actual",
    lastUpdatedLabel: "Última actualización",
    estimatedLabel: "Finalización estimada",
  },
  status: {
    pending: "Pendiente",
    confirmed: "Confirmado",
    collected: "Recogido",
    inProgress: "En progreso",
    readyForDelivery: "Listo para entrega",
    outForDelivery: "En camino",
    delivered: "Entregado",
    completed: "Completado",
    cancelled: "Cancelado",
  },
  review: {
    title: "Comparte tu experiencia",
    ratingLabel: "Calificación general",
    textLabel: "Tu reseña",
    photoLabel: "Agregar una foto (opcional)",
    submitButton: "Enviar reseña",
    successMessage: "Gracias. Tu reseña ha sido enviada y está esperando aprobación.",
    pendingApproval: "Esperando aprobación",
  },
  serviceTypes: {
    laundry: "Lavandería",
    drycleaning: "Limpieza en seco",
    ironing: "Planchado",
    alterations: "Arreglos",
    homeCleaning: "Limpieza del hogar",
    officeCleaning: "Limpieza de oficina",
  },
  staffManager: {
    metadata: {
      title: "Panel del gerente | Henry Onyx Fabric Care",
      description:
        "Panel de mando del gerente para recepción, operaciones en vivo, entradas y control de gastos.",
    },
    hero: {
      eyebrow: "Sala de operaciones del gerente",
      title: "Lleva el día. Mantén los registros veraces.",
      body: "Esta es la capa de control en vivo del gerente. La recepción, el registro respaldado por precios, el movimiento de estado, la captura de pagos y los gastos diarios deben gestionarse desde aquí sin confusión.",
    },
    quickLinks: {
      openOperations: "Abrir operaciones",
      openExpenses: "Abrir gastos",
      trackingPage: "Página de seguimiento",
      createWalkIn: "Crear reserva sin cita",
    },
    metrics: {
      activeBookings: { label: "Reservas activas", note: "Carga de trabajo actual" },
      urgentQueue: { label: "Cola urgente", note: "Requiere atención rápida" },
      registeredPieces: { label: "Piezas registradas", note: "Registros respaldados por precios" },
      recordedInflow: { label: "Entradas registradas", note: "Dinero contabilizado por reservas" },
      pendingExpenses: { label: "Gastos pendientes", note: "Esperando revisión del propietario" },
    },
    urgentPanel: {
      eyebrow: "Prioridad",
      title: "Reservas urgentes",
      subtitle: "Estos son los trabajos que el gerente no debe ignorar.",
      noSlot: "Sin horario",
      openBooking: "Abrir reserva",
      empty: "Ninguna reserva urgente en este momento.",
    },
    pressurePanel: {
      eyebrow: "Comprobaciones del gerente",
      title: "Puntos de presión operativos",
      subtitle: "Estos indicadores ayudan al gerente a detener errores ocultos antes de que se conviertan en problemas para la empresa.",
      missingIntake: {
        label: "Reservas de prendas sin recepción",
        note: "Solo se deben señalar aquí las reservas de prendas. Las reservas de servicio se rastrean por separado.",
      },
      approvedExpenses: {
        label: "Gastos aprobados",
        note: "Estos costos ya fueron aceptados en la revisión del propietario.",
      },
      overallBalance: {
        label: "Saldo total",
        flowTemplate: "{inflow} entrada • {outflow} salida",
      },
    },
    dash: "—",
  },
  staffOwner: {
    metadata: {
      title: "Panel del propietario | Henry Onyx Fabric Care",
      description:
        "Sala de control del propietario para reservas, finanzas, seguridad, reseñas y operaciones de toda la empresa.",
    },
    hero: {
      eyebrow: "Centro de mando del propietario",
      title: "Control maestro de toda la operación de cuidado.",
      body: "Esta es la capa más alta. Aquí ves el estado real de la empresa: urgencia, ingresos, presión de gastos, calidad de registros, salud de reseñas y seguridad.",
    },
    quickLinks: {
      bookings: "Reservas",
      finance: "Finanzas",
      records: "Registros",
      security: "Seguridad",
      settings: "Ajustes",
      reviews: "Reseñas",
      staff: "Personal",
      fieldStaff: "Personal de campo",
      managerExpenses: "Gastos del gerente",
      riderExpenses: "Gastos de repartidores",
      supportExpenses: "Gastos de soporte",
    },
    metrics: {
      activeBookings: { label: "Reservas activas", note: "Cola operativa actual" },
      archivedBookings: { label: "Reservas archivadas", note: "Más de 30 días" },
      balance: { label: "Saldo", flowTemplate: "{inflow} entrada • {outflow} salida" },
      reviews: { label: "Reseñas", pendingTemplate: "{count} pendientes de aprobación" },
    },
    alertsPanel: {
      eyebrow: "Alertas inteligentes",
      title: "Vigilancia de anomalías financieras y operativas",
      subtitle: "Aquí es donde el propietario detecta la presión inusual antes de que se convierta en daño.",
      empty: "No hay anomalías importantes visibles en este momento.",
      expensePressure: {
        title: "La presión de gastos supera los ingresos",
        text: "La salida total ya es mayor que la entrada. El propietario debe revisar inmediatamente las aprobaciones, la actividad de alto coste y los ingresos recuperables.",
      },
      awaitingDecision: {
        title: "Gastos esperando decisión del propietario",
        textTemplate: "{count} entradas de gastos siguen registradas y esperan aprobación o anulación.",
      },
      refundActivity: {
        title: "Actividad inusual de reembolsos detectada",
        textTemplate: "Hay gastos recientes vinculados a reembolsos visibles en el sistema. La presión actual de reembolso es de {amount} en {count} elemento(s).",
      },
      delayRisk: {
        title: "El riesgo de retraso en reservas está aumentando",
        textTemplate: "{overdue} reserva(s) vencida(s) y {urgent} reserva(s) urgente(s) están visibles actualmente. Esto puede dañar la confianza del servicio si no se gestiona rápido.",
      },
      strongFlow: {
        title: "El flujo reciente se ve fuerte",
        textTemplate: "La entrada en vivo del mes actual supera a la salida en {percent} sobre la actividad rastreada reciente. Mantén el sistema disciplinado para que el crecimiento sea limpio.",
      },
    },
    forecastPanel: {
      eyebrow: "Previsión",
      title: "Proyección operativa a corto plazo",
      subtitle: "Estimación en vivo del ritmo basada en la actividad rastreada del mes actual.",
      monthInflow: "Entradas del mes (en vivo)",
      monthOutflow: "Salidas del mes (en vivo)",
      projectedNet: "Neto proyectado de fin de mes",
      flowGrowth: "Señal de crecimiento del flujo",
      positiveTemplate: "Si el ritmo actual se mantiene, care podría cerrar el mes con un neto de aproximadamente {amount}.",
      negativeTemplate: "Si el ritmo actual se mantiene, care podría cerrar el mes bajo presión con aproximadamente {amount} neto.",
    },
    urgencyPanel: {
      eyebrow: "Urgencia",
      title: "Pedidos que requieren atención",
      subtitle: "El propietario debe sentir la presión al instante, incluso si el gerente lleva el día.",
      noPickup: "Sin fecha de recogida",
      empty: "No hay reservas urgentes en este momento.",
    },
    brandPanel: {
      eyebrow: "Estado de la marca",
      title: "Presentación de la empresa en vivo",
      subtitle: "Lo que el lado público está tomando actualmente de los ajustes.",
      heroBadge: "Insignia principal",
      supportEmail: "Correo de soporte",
      supportPhone: "Teléfono de soporte",
      pickupHours: "Horario de recogida",
      careDomain: "Dominio care",
      hubDomain: "Dominio hub",
      notConfigured: "Aún no configurado",
      openSettings: "Abrir ajustes",
    },
    paymentsPanel: {
      eyebrow: "Movimiento de efectivo",
      title: "Pagos recientes",
      subtitle: "Lectura rápida de las entradas.",
      generalPayment: "Pago general",
      empty: "Aún no hay pagos recientes.",
    },
    expensesPanel: {
      eyebrow: "Presión de costes",
      title: "Gastos recientes",
      subtitle: "El propietario siempre debe saber a dónde va el dinero.",
      viewProof: "Ver comprobante",
      empty: "Aún no hay gastos recientes.",
    },
    reviewsPanel: {
      eyebrow: "Salud de reseñas",
      title: "Voz reciente del cliente",
      subtitle: "Las marcas de servicio fuertes protegen la confianza, no solo el flujo de trabajo.",
      approved: "aprobado",
      pending: "pendiente",
      photoAltTemplate: "Foto de reseña de {name}",
      empty: "Aún no hay reseñas disponibles.",
    },
    intelligencePanel: {
      eyebrow: "Inteligencia",
      title: "Lo que el propietario debería seguir a continuación",
      subtitle: "La empresa se vuelve más productiva cuando la visión se convierte en acción.",
      expenseFlags: {
        title: "Señales rojas inteligentes de gastos",
        topTemplate: "La categoría principal de gasto reciente es {category} con {amount}.",
        emptyText: "Aún no se ve presión importante por categoría.",
      },
      delayAlerts: {
        title: "Alertas de retraso en reservas",
        textTemplate: "{count} reserva(s) vencida(s) están visibles en la cola activa de care.",
      },
      forecasting: {
        title: "Pronóstico operativo",
      },
      approvalDiscipline: {
        title: "Disciplina de aprobación",
        textTemplate: "{count} registro(s) de gastos están esperando actualmente la acción del propietario.",
      },
    },
    archivePanel: {
      eyebrow: "Política de archivo",
      cta: "Abrir registros con archivo",
    },
    dash: "—",
  },
};

const PT: DeepPartial<CareCopy> = {
  nav: {
    home: "Início",
    book: "Reservar",
    track: "Rastrear",
    review: "Deixar avaliação",
    account: "Conta",
  },
  hero: {
    title: "O cuidado que aparece, sempre.",
    subtitle: "Cuidado de roupas, limpeza doméstica e manutenção do escritório com reservas mais claras, rastreamento mais estável e suporte mais tranquilo.",
    ctaBook: "Reservar um serviço",
    ctaTrack: "Rastrear uma reserva",
  },
  booking: {
    title: "Reservar um serviço",
    serviceLabel: "Tipo de serviço",
    dateLabel: "Data preferida",
    timeLabel: "Horário preferido",
    nameLabel: "Nome completo",
    phoneLabel: "Número de telefone",
    emailLabel: "Endereço de e-mail",
    addressLabel: "Endereço de coleta",
    notesLabel: "Notas adicionais",
    submitButton: "Solicitar reserva",
    confirmationHeading: "Solicitação de reserva recebida",
    confirmationBody: "Confirmaremos sua reserva em breve. Guarde seu código de rastreamento.",
    trackingCodeLabel: "Seu código de rastreamento",
  },
  tracking: {
    title: "Rastrear sua reserva",
    codeLabel: "Código de rastreamento",
    phoneLabel: "Número de telefone",
    submitButton: "Verificar status",
    notFound: "Nenhuma reserva encontrada para esse código e número de telefone.",
    statusLabel: "Status atual",
    lastUpdatedLabel: "Última atualização",
    estimatedLabel: "Conclusão estimada",
  },
  status: {
    pending: "Pendente",
    confirmed: "Confirmado",
    collected: "Coletado",
    inProgress: "Em andamento",
    readyForDelivery: "Pronto para entrega",
    outForDelivery: "Em rota de entrega",
    delivered: "Entregue",
    completed: "Concluído",
    cancelled: "Cancelado",
  },
  review: {
    title: "Compartilhe sua experiência",
    ratingLabel: "Avaliação geral",
    textLabel: "Sua avaliação",
    photoLabel: "Adicionar uma foto (opcional)",
    submitButton: "Enviar avaliação",
    successMessage: "Obrigado. Sua avaliação foi enviada e está aguardando aprovação.",
    pendingApproval: "Aguardando aprovação",
  },
  serviceTypes: {
    laundry: "Lavanderia",
    drycleaning: "Lavagem a seco",
    ironing: "Passagem a ferro",
    alterations: "Ajustes",
    homeCleaning: "Limpeza residencial",
    officeCleaning: "Limpeza de escritório",
  },
  staffManager: {
    metadata: {
      title: "Painel do gerente | Henry Onyx Fabric Care",
      description:
        "Painel de comando do gerente para recepção, operações ao vivo, entradas e controle de despesas.",
    },
    hero: {
      eyebrow: "Sala de operações do gerente",
      title: "Conduza o dia. Mantenha os registros verdadeiros.",
      body: "Esta é a camada de controle ao vivo do gerente. Recepção, registro respaldado por preços, movimento de status, captura de pagamentos e despesas diárias devem ser tratados aqui sem confusão.",
    },
    quickLinks: {
      openOperations: "Abrir operações",
      openExpenses: "Abrir despesas",
      trackingPage: "Página de rastreamento",
      createWalkIn: "Criar reserva sem agendamento",
    },
    metrics: {
      activeBookings: { label: "Reservas ativas", note: "Carga de trabalho atual" },
      urgentQueue: { label: "Fila urgente", note: "Requer atenção rápida" },
      registeredPieces: { label: "Peças registradas", note: "Registros respaldados por preços" },
      recordedInflow: { label: "Entradas registradas", note: "Dinheiro contabilizado nas reservas" },
      pendingExpenses: { label: "Despesas pendentes", note: "Aguardando revisão do proprietário" },
    },
    urgentPanel: {
      eyebrow: "Prioridade",
      title: "Reservas urgentes",
      subtitle: "Estes são os trabalhos que o gerente não deve ignorar.",
      noSlot: "Sem horário",
      openBooking: "Abrir reserva",
      empty: "Nenhuma reserva urgente no momento.",
    },
    pressurePanel: {
      eyebrow: "Verificações do gerente",
      title: "Pontos de pressão operacionais",
      subtitle: "Esses indicadores ajudam o gerente a interromper erros ocultos antes que se tornem problemas da empresa.",
      missingIntake: {
        label: "Reservas de roupas sem recepção",
        note: "Apenas reservas de roupas devem ser sinalizadas aqui. Reservas de serviço são rastreadas separadamente.",
      },
      approvedExpenses: {
        label: "Despesas aprovadas",
        note: "Estes custos já foram aceitos na revisão do proprietário.",
      },
      overallBalance: {
        label: "Saldo geral",
        flowTemplate: "{inflow} entrada • {outflow} saída",
      },
    },
    dash: "—",
  },
  staffOwner: {
    metadata: {
      title: "Painel do proprietário | Henry Onyx Fabric Care",
      description:
        "Sala de controle do proprietário para reservas, finanças, segurança, avaliações e operações de toda a empresa.",
    },
    hero: {
      eyebrow: "Centro de comando do proprietário",
      title: "Controle mestre de toda a operação de cuidado.",
      body: "Esta é a camada mais alta. Aqui você vê o estado real da empresa: urgência, receita, pressão de despesas, qualidade dos registros, saúde das avaliações e segurança.",
    },
    quickLinks: {
      bookings: "Reservas",
      finance: "Finanças",
      records: "Registros",
      security: "Segurança",
      settings: "Configurações",
      reviews: "Avaliações",
      staff: "Equipe",
      fieldStaff: "Equipe de campo",
      managerExpenses: "Despesas do gerente",
      riderExpenses: "Despesas dos entregadores",
      supportExpenses: "Despesas do suporte",
    },
    metrics: {
      activeBookings: { label: "Reservas ativas", note: "Fila operacional atual" },
      archivedBookings: { label: "Reservas arquivadas", note: "Mais de 30 dias" },
      balance: { label: "Saldo", flowTemplate: "{inflow} entrada • {outflow} saída" },
      reviews: { label: "Avaliações", pendingTemplate: "{count} aguardando aprovação" },
    },
    alertsPanel: {
      eyebrow: "Alertas inteligentes",
      title: "Monitoramento de anomalias financeiras e operacionais",
      subtitle: "É aqui que o proprietário detecta a pressão incomum antes que ela se torne dano.",
      empty: "Nenhuma anomalia importante visível no momento.",
      expensePressure: {
        title: "A pressão de despesas está acima da entrada",
        text: "A saída total já é maior que a entrada. O proprietário deve verificar imediatamente aprovações, atividade de alto custo e receita recuperável.",
      },
      awaitingDecision: {
        title: "Despesas aguardando decisão do proprietário",
        textTemplate: "{count} entradas de despesas ainda estão registradas aguardando aprovação ou anulação.",
      },
      refundActivity: {
        title: "Atividade incomum de reembolso detectada",
        textTemplate: "Despesas recentes vinculadas a reembolsos estão visíveis no sistema. A pressão atual de reembolso é de {amount} em {count} item(ns).",
      },
      delayRisk: {
        title: "O risco de atraso nas reservas está aumentando",
        textTemplate: "{overdue} reserva(s) atrasada(s) e {urgent} reserva(s) urgente(s) estão atualmente visíveis. Isso pode prejudicar a confiança do serviço se não for tratado rápido.",
      },
      strongFlow: {
        title: "O fluxo recente parece forte",
        textTemplate: "A entrada ao vivo do mês atual supera a saída em {percent} na atividade recente rastreada. Mantenha o sistema disciplinado para que o crescimento permaneça limpo.",
      },
    },
    forecastPanel: {
      eyebrow: "Previsão",
      title: "Projeção operacional de curto prazo",
      subtitle: "Estimativa em tempo real da taxa baseada na atividade rastreada do mês atual.",
      monthInflow: "Entrada do mês (ao vivo)",
      monthOutflow: "Saída do mês (ao vivo)",
      projectedNet: "Líquido projetado de fim de mês",
      flowGrowth: "Sinal de crescimento de fluxo",
      positiveTemplate: "Se a taxa atual ao vivo se mantiver, care pode fechar o mês com cerca de {amount} líquido.",
      negativeTemplate: "Se a taxa atual ao vivo se mantiver, care pode fechar o mês sob pressão com cerca de {amount} líquido.",
    },
    urgencyPanel: {
      eyebrow: "Urgência",
      title: "Pedidos exigindo atenção",
      subtitle: "O proprietário deve perceber a pressão instantaneamente, mesmo que o gerente esteja conduzindo o dia.",
      noPickup: "Sem data de coleta",
      empty: "Nenhuma reserva urgente no momento.",
    },
    brandPanel: {
      eyebrow: "Estado da marca",
      title: "Apresentação ao vivo da empresa",
      subtitle: "O que o lado público está puxando atualmente das configurações.",
      heroBadge: "Selo principal",
      supportEmail: "E-mail de suporte",
      supportPhone: "Telefone de suporte",
      pickupHours: "Horário de coleta",
      careDomain: "Domínio care",
      hubDomain: "Domínio hub",
      notConfigured: "Ainda não configurado",
      openSettings: "Abrir configurações",
    },
    paymentsPanel: {
      eyebrow: "Movimento de caixa",
      title: "Pagamentos recentes",
      subtitle: "Leitura rápida das entradas.",
      generalPayment: "Pagamento geral",
      empty: "Ainda não há pagamentos recentes.",
    },
    expensesPanel: {
      eyebrow: "Pressão de custos",
      title: "Despesas recentes",
      subtitle: "O proprietário deve sempre saber para onde o dinheiro está indo.",
      viewProof: "Ver comprovante",
      empty: "Ainda não há despesas recentes.",
    },
    reviewsPanel: {
      eyebrow: "Saúde das avaliações",
      title: "Voz recente do cliente",
      subtitle: "Marcas de serviço fortes protegem a confiança, não apenas o fluxo de trabalho.",
      approved: "aprovado",
      pending: "pendente",
      photoAltTemplate: "Foto de avaliação de {name}",
      empty: "Ainda não há avaliações disponíveis.",
    },
    intelligencePanel: {
      eyebrow: "Inteligência",
      title: "O que o proprietário deve acompanhar a seguir",
      subtitle: "A empresa torna-se mais produtiva quando a visão se transforma em ação.",
      expenseFlags: {
        title: "Sinais de alerta inteligentes de despesas",
        topTemplate: "A principal categoria de despesa recente é {category} em {amount}.",
        emptyText: "Nenhuma pressão importante de categoria está visível ainda.",
      },
      delayAlerts: {
        title: "Alertas de atraso nas reservas",
        textTemplate: "{count} reserva(s) atrasada(s) estão visíveis na fila ativa de care.",
      },
      forecasting: {
        title: "Previsão operacional",
      },
      approvalDiscipline: {
        title: "Disciplina de aprovação",
        textTemplate: "{count} registro(s) de despesa estão atualmente aguardando ação do proprietário.",
      },
    },
    archivePanel: {
      eyebrow: "Política de arquivamento",
      cta: "Abrir registros com arquivo",
    },
    dash: "—",
  },
};

const AR: DeepPartial<CareCopy> = {
  nav: {
    home: "الرئيسية",
    book: "احجز",
    track: "تتبع",
    review: "اترك تقييماً",
    account: "الحساب",
  },
  hero: {
    title: "رعاية تصل في كل مرة.",
    subtitle: "رعاية الملابس وتنظيف المنازل وصيانة مكان العمل مع حجز أوضح وتتبع أكثر استقراراً ودعم أكثر هدوءاً.",
    ctaBook: "احجز خدمة",
    ctaTrack: "تتبع حجزاً",
  },
  booking: {
    title: "احجز خدمة",
    serviceLabel: "نوع الخدمة",
    dateLabel: "التاريخ المفضل",
    timeLabel: "الوقت المفضل",
    nameLabel: "الاسم الكامل",
    phoneLabel: "رقم الهاتف",
    emailLabel: "البريد الإلكتروني",
    addressLabel: "عنوان الاستلام",
    notesLabel: "ملاحظات إضافية",
    submitButton: "طلب حجز",
    confirmationHeading: "تم استلام طلب الحجز",
    confirmationBody: "سنؤكد حجزك قريباً. احتفظ برمز التتبع الخاص بك.",
    trackingCodeLabel: "رمز التتبع الخاص بك",
  },
  tracking: {
    title: "تتبع حجزك",
    codeLabel: "رمز التتبع",
    phoneLabel: "رقم الهاتف",
    submitButton: "فحص الحالة",
    notFound: "لم يتم العثور على حجز لهذا الرمز ورقم الهاتف.",
    statusLabel: "الحالة الحالية",
    lastUpdatedLabel: "آخر تحديث",
    estimatedLabel: "الإتمام المتوقع",
  },
  status: {
    pending: "قيد الانتظار",
    confirmed: "مؤكد",
    collected: "تم الاستلام",
    inProgress: "قيد التنفيذ",
    readyForDelivery: "جاهز للتسليم",
    outForDelivery: "في الطريق للتسليم",
    delivered: "تم التوصيل",
    completed: "مكتمل",
    cancelled: "ملغي",
  },
  review: {
    title: "شارك تجربتك",
    ratingLabel: "التقييم العام",
    textLabel: "تقييمك",
    photoLabel: "إضافة صورة (اختياري)",
    submitButton: "إرسال التقييم",
    successMessage: "شكراً. تم إرسال تقييمك وهو في انتظار الموافقة.",
    pendingApproval: "في انتظار الموافقة",
  },
  serviceTypes: {
    laundry: "غسيل الملابس",
    drycleaning: "التنظيف الجاف",
    ironing: "كي الملابس",
    alterations: "تعديلات",
    homeCleaning: "تنظيف المنزل",
    officeCleaning: "تنظيف المكتب",
  },
  staffManager: {
    metadata: {
      title: "لوحة قيادة المدير | Henry Onyx Fabric Care",
      description:
        "لوحة قيادة المدير للاستلام والعمليات المباشرة والتدفقات الواردة وضبط المصروفات.",
    },
    hero: {
      eyebrow: "غرفة عمليات المدير",
      title: "أدِر اليوم. حافظ على سجلات صادقة.",
      body: "هذه طبقة التحكم المباشرة للمدير. يجب التعامل من هنا مع الاستلام والتسجيل المدعوم بالتسعير ونقل الحالات وتسجيل المدفوعات والمصروفات اليومية دون أي ارتباك.",
    },
    quickLinks: {
      openOperations: "فتح العمليات",
      openExpenses: "فتح المصروفات",
      trackingPage: "صفحة التتبع",
      createWalkIn: "إنشاء حجز فوري",
    },
    metrics: {
      activeBookings: { label: "الحجوزات النشطة", note: "حجم العمل الحالي" },
      urgentQueue: { label: "الطابور العاجل", note: "يتطلب اهتماماً سريعاً" },
      registeredPieces: { label: "القطع المسجلة", note: "سجلات مدعومة بالتسعير" },
      recordedInflow: { label: "التدفقات المسجلة", note: "أموال مقيدة على الحجوزات" },
      pendingExpenses: { label: "المصروفات المعلقة", note: "بانتظار مراجعة المالك" },
    },
    urgentPanel: {
      eyebrow: "الأولوية",
      title: "حجوزات عاجلة",
      subtitle: "هذه هي المهام التي يجب ألا يتجاهلها المدير.",
      noSlot: "لا توجد فترة",
      openBooking: "فتح الحجز",
      empty: "لا توجد حجوزات عاجلة الآن.",
    },
    pressurePanel: {
      eyebrow: "مراجعات صدق المدير",
      title: "نقاط ضغط تشغيلية",
      subtitle: "تساعد هذه المؤشرات المدير على إيقاف الأخطاء الخفية قبل أن تصبح مشاكل للشركة.",
      missingIntake: {
        label: "حجوزات الملابس بدون استلام",
        note: "يجب الإشارة هنا إلى حجوزات الملابس فقط. حجوزات الخدمة تُتابع بشكل منفصل.",
      },
      approvedExpenses: {
        label: "المصروفات المعتمدة",
        note: "تم قبول هذه التكاليف بالفعل في مراجعة المالك.",
      },
      overallBalance: {
        label: "الرصيد الإجمالي",
        flowTemplate: "{inflow} داخل • {outflow} خارج",
      },
    },
    dash: "—",
  },
  staffOwner: {
    metadata: {
      title: "لوحة المالك | Henry Onyx Fabric Care",
      description:
        "غرفة تحكم المالك للحجوزات والمالية والأمان والتقييمات وعمليات الشركة بالكامل.",
    },
    hero: {
      eyebrow: "مركز قيادة المالك",
      title: "التحكم الرئيسي في عملية العناية بأكملها.",
      body: "هذه هي الطبقة الأعلى. ترى هنا الحالة الحقيقية للشركة: العجلة، الدخل، ضغط النفقات، جودة السجلات، صحة التقييمات، والأمان.",
    },
    quickLinks: {
      bookings: "الحجوزات",
      finance: "المالية",
      records: "السجلات",
      security: "الأمان",
      settings: "الإعدادات",
      reviews: "التقييمات",
      staff: "الفريق",
      fieldStaff: "موظفو الميدان",
      managerExpenses: "نفقات المدير",
      riderExpenses: "نفقات السائقين",
      supportExpenses: "نفقات الدعم",
    },
    metrics: {
      activeBookings: { label: "الحجوزات النشطة", note: "قائمة الانتظار التشغيلية الحالية" },
      archivedBookings: { label: "الحجوزات المؤرشفة", note: "أقدم من 30 يومًا" },
      balance: { label: "الرصيد", flowTemplate: "{inflow} داخل • {outflow} خارج" },
      reviews: { label: "التقييمات", pendingTemplate: "{count} بانتظار الموافقة" },
    },
    alertsPanel: {
      eyebrow: "تنبيهات ذكية",
      title: "مراقبة الشذوذ المالي والتشغيلي",
      subtitle: "هنا يكتشف المالك الضغط غير المعتاد قبل أن يتحول إلى ضرر.",
      empty: "لا توجد حالات شذوذ كبيرة مرئية الآن.",
      expensePressure: {
        title: "ضغط النفقات أعلى من الدخل",
        text: "إجمالي الصادر أعلى بالفعل من الوارد. يجب على المالك مراجعة الموافقات والنشاط مرتفع التكلفة والإيرادات القابلة للاسترداد على الفور.",
      },
      awaitingDecision: {
        title: "نفقات تنتظر قرار المالك",
        textTemplate: "لا تزال {count} قيدًا للنفقات مسجلة وتنتظر الموافقة أو الإلغاء.",
      },
      refundActivity: {
        title: "تم اكتشاف نشاط استرداد غير معتاد",
        textTemplate: "النفقات الأخيرة المرتبطة بالاسترداد مرئية في النظام. ضغط الاسترداد الحالي هو {amount} من {count} عنصر.",
      },
      delayRisk: {
        title: "خطر تأخير الحجوزات يتزايد",
        textTemplate: "{overdue} حجز متأخر و {urgent} حجز عاجل مرئي حاليًا. قد يضر هذا بثقة الخدمة إذا لم تتم معالجته بسرعة.",
      },
      strongFlow: {
        title: "التدفق الأخير يبدو قويًا",
        textTemplate: "الوارد المباشر للشهر الحالي يتجاوز الصادر بنسبة {percent} على النشاط المتتبع مؤخرًا. حافظ على انضباط النظام لكي يبقى النمو نظيفًا.",
      },
    },
    forecastPanel: {
      eyebrow: "التنبؤ",
      title: "إسقاط تشغيلي قصير المدى",
      subtitle: "تقدير حي للمعدل بناءً على نشاط الشهر الحالي المتتبع.",
      monthInflow: "وارد الشهر (مباشر)",
      monthOutflow: "صادر الشهر (مباشر)",
      projectedNet: "صافي نهاية الشهر المتوقع",
      flowGrowth: "إشارة نمو التدفق",
      positiveTemplate: "إذا استمر المعدل الحالي، فقد تنهي care الشهر بصافٍ يقارب {amount}.",
      negativeTemplate: "إذا استمر المعدل الحالي، فقد تنهي care الشهر تحت ضغط بصافٍ يقارب {amount}.",
    },
    urgencyPanel: {
      eyebrow: "العجلة",
      title: "طلبات تتطلب الاهتمام",
      subtitle: "يجب أن يلاحظ المالك الضغط على الفور، حتى لو كان المدير يدير اليوم.",
      noPickup: "لا يوجد تاريخ استلام",
      empty: "لا توجد حجوزات عاجلة في الوقت الحالي.",
    },
    brandPanel: {
      eyebrow: "حالة العلامة التجارية",
      title: "عرض الشركة المباشر",
      subtitle: "ما يسحبه الجانب العام حاليًا من الإعدادات.",
      heroBadge: "شارة الواجهة",
      supportEmail: "البريد الإلكتروني للدعم",
      supportPhone: "هاتف الدعم",
      pickupHours: "ساعات الاستلام",
      careDomain: "نطاق care",
      hubDomain: "نطاق hub",
      notConfigured: "لم يتم تكوينه بعد",
      openSettings: "فتح الإعدادات",
    },
    paymentsPanel: {
      eyebrow: "حركة النقد",
      title: "المدفوعات الأخيرة",
      subtitle: "قراءة سريعة للوارد.",
      generalPayment: "دفع عام",
      empty: "لا توجد مدفوعات حديثة بعد.",
    },
    expensesPanel: {
      eyebrow: "ضغط التكاليف",
      title: "النفقات الأخيرة",
      subtitle: "يجب أن يعرف المالك دائمًا أين يذهب المال.",
      viewProof: "عرض الإثبات",
      empty: "لا توجد نفقات حديثة بعد.",
    },
    reviewsPanel: {
      eyebrow: "صحة التقييمات",
      title: "صوت العميل الأخير",
      subtitle: "علامات الخدمة القوية تحمي الثقة، وليس مجرد سير العمل.",
      approved: "موافق عليه",
      pending: "قيد الانتظار",
      photoAltTemplate: "صورة تقييم من {name}",
      empty: "لا توجد تقييمات متاحة بعد.",
    },
    intelligencePanel: {
      eyebrow: "الذكاء",
      title: "ما يجب على المالك تتبعه بعد ذلك",
      subtitle: "تصبح الشركة أكثر إنتاجية عندما تتحول الرؤية إلى عمل.",
      expenseFlags: {
        title: "إشارات حمراء ذكية للنفقات",
        topTemplate: "أعلى فئة نفقات حديثة هي {category} بقيمة {amount}.",
        emptyText: "لا يوجد ضغط فئة كبير مرئي بعد.",
      },
      delayAlerts: {
        title: "تنبيهات تأخير الحجوزات",
        textTemplate: "{count} حجز متأخر مرئي في قائمة care النشطة.",
      },
      forecasting: {
        title: "التنبؤ التشغيلي",
      },
      approvalDiscipline: {
        title: "انضباط الموافقة",
        textTemplate: "{count} سجل نفقات ينتظر حاليًا إجراء المالك.",
      },
    },
    archivePanel: {
      eyebrow: "سياسة الأرشيف",
      cta: "فتح السجلات مع الأرشيف",
    },
    dash: "—",
  },
};

const IG: DeepPartial<CareCopy> = {
  nav: {
    home: "Ụlọ",
    book: "Dee",
    track: "Śle",
    review: "Hapụ nnyocha",
    account: "Akaụntụ",
  },
  hero: {
    title: "Nlekọta na-abịa, n'oge ọ bụla.",
    subtitle: "Nlekọta akwa, ịkọcha ụlọ, na ọrụ ọkwa, nwere ndeede dị mfe, śle nke ọma, na nkwado dị jụụ.",
    ctaBook: "Dee ọrụ",
    ctaTrack: "Śle ndeede",
  },
  booking: {
    title: "Dee ọrụ",
    serviceLabel: "Ụdị ọrụ",
    dateLabel: "Ụbọchị ọ masịrị",
    timeLabel: "Oge ọ masịrị",
    nameLabel: "Aha zuru oke",
    phoneLabel: "Nọmba ekwentị",
    emailLabel: "Adreesị ozi-email",
    addressLabel: "Adreesị iwepu",
    notesLabel: "Ntụaka ndị ọzọ",
    submitButton: "Rịọ ndeede",
    confirmationHeading: "Rịọ ndeede natara",
    confirmationBody: "Anyị ga-ekwe nkwenye ndeede gị n'oge na-adịghị anya. Debe koodu śle gị.",
    trackingCodeLabel: "Koodu śle gị",
  },
  tracking: {
    title: "Śle ndeede gị",
    codeLabel: "Koodu śle",
    phoneLabel: "Nọmba ekwentị",
    submitButton: "Lelee ọnọdụ",
    notFound: "Enweghị ndeede maka koodu na nọmba ekwentị ahụ.",
    statusLabel: "Ọnọdụ ugbu a",
    lastUpdatedLabel: "Emelitere ikpeazụ",
    estimatedLabel: "Mmecha a tọrọ atọ",
  },
  status: {
    pending: "Na-atọ",
    confirmed: "Kwenyere",
    collected: "Achịkọtara",
    inProgress: "Na-aga n'ihu",
    readyForDelivery: "Dị njikere maka nnyefe",
    outForDelivery: "Na-aga n'ụzọ",
    delivered: "Enyela",
    completed: "Emechara",
    cancelled: "Kagbuo",
  },
  review: {
    title: "Kọọ ahụmahụ gị",
    ratingLabel: "Nkwupụta niile",
    textLabel: "Nnyocha gị",
    photoLabel: "Tinye foto (ọ dịghị mkpa)",
    submitButton: "Tinye nnyocha",
    successMessage: "Daalụ. A tinyela nnyocha gị ma ọ na-atọ ugwo.",
    pendingApproval: "Na-atọ ugwo",
  },
  serviceTypes: {
    laundry: "Ịsa akwa",
    drycleaning: "Ịkọcha ọkụ",
    ironing: "Igwu akwa",
    alterations: "Mgbanwe",
    homeCleaning: "Ịkọcha ụlọ",
    officeCleaning: "Ịkọcha ọfịs",
  },
  staffManager: {
    metadata: {
      title: "Dashboard Onye Nlekọta | Henry Onyx Fabric Care",
      description:
        "Dashboard nke onye nlekọta maka nnata, ọrụ ndụ, mbata ego, na njikwa mmefu.",
    },
    hero: {
      eyebrow: "Ụlọ ọrụ onye nlekọta",
      title: "Were ụbọchị ahụ na-edu. Mee ka ndekọ kwesị ntụkwasị obi.",
      body: "Nke a bụ akwa njikwa ndụ nke onye nlekọta. Nnata, ndebanye aha kwado site n'ọnụahịa, mmegharị ọnọdụ, ịnata ụgwọ, na mmefu kwa ụbọchị kwesịrị ka edobere ebe a n'enweghị mgbagwoju anya.",
    },
    quickLinks: {
      openOperations: "Mepee ọrụ",
      openExpenses: "Mepee mmefu",
      trackingPage: "Ibe nleba anya",
      createWalkIn: "Mepụta ndeede mbịa nso",
    },
    metrics: {
      activeBookings: { label: "Ndeede na-arụ ọrụ", note: "Ibu ọrụ ndụ ugbu a" },
      urgentQueue: { label: "Ahịrị ngwa ngwa", note: "Chọrọ nlebara anya ọsọ ọsọ" },
      registeredPieces: { label: "Ihe edebanyere aha", note: "Ndekọ kwado site n'ọnụahịa" },
      recordedInflow: { label: "Ego mbata edekọrọ", note: "Ego edere n'isi ndeede" },
      pendingExpenses: { label: "Mmefu na-echere", note: "Na-echere nyocha onye nwe" },
    },
    urgentPanel: {
      eyebrow: "Ihe mbu",
      title: "Ndeede ngwa ngwa",
      subtitle: "Ndị a bụ ọrụ onye nlekọta ekwesịghị ileghara anya.",
      noSlot: "Enweghị oge",
      openBooking: "Mepee ndeede",
      empty: "Enweghị ndeede ngwa ngwa ugbu a.",
    },
    pressurePanel: {
      eyebrow: "Nyocha ezi okwu onye nlekọta",
      title: "Isi ihe mgbu n'ọrụ",
      subtitle: "Ihe ndị a na-eme ka onye nlekọta kwụsị ndị ọrụ ọjọọ zoro ezo tupu ha aghọọ nsogbu nye ụlọ ọrụ.",
      missingIntake: {
        label: "Ndeede uwe na-enweghị nnata",
        note: "Naanị ndeede uwe ka a ga-egosipụta ebe a. Ndeede ọrụ ka a na-eso ya iche.",
      },
      approvedExpenses: {
        label: "Mmefu enabatara",
        note: "Ego ndị a anabatala n'oge nyocha onye nwe.",
      },
      overallBalance: {
        label: "Mkpokọta nguzo ego",
        flowTemplate: "{inflow} mbata • {outflow} mfu",
      },
    },
    dash: "—",
  },
  staffOwner: {
    metadata: {
      title: "Dashboard onye nwe | Henry Onyx Fabric Care",
      description:
        "Ụlọ ọrụ njikwa onye nwe maka ndokwa, ego, nchekwa, nyocha, na ọrụ ụlọ ọrụ niile.",
    },
    hero: {
      eyebrow: "Ebe njikwa onye nwe",
      title: "Njikwa isi maka ọrụ nlekọta dum.",
      body: "Nke a bụ ọkwa kachasị elu. Ị ga-ahụ ebe a ọnọdụ nke ụlọ ọrụ: ọsọ ọsọ, ego mbata, nrụgide mmefu, ogo ndekọ, ahụike nyocha, na nchekwa.",
    },
    quickLinks: {
      bookings: "Ndokwa",
      finance: "Ego",
      records: "Ndekọ",
      security: "Nchekwa",
      settings: "Ntọala",
      reviews: "Nyocha",
      staff: "Ndị ọrụ",
      fieldStaff: "Ndị ọrụ ọhịa",
      managerExpenses: "Mmefu njikwa",
      riderExpenses: "Mmefu ndị na-agba ụgbọ",
      supportExpenses: "Mmefu nkwado",
    },
    metrics: {
      activeBookings: { label: "Ndokwa na-arụ ọrụ", note: "Ahịrị ọrụ ugbu a" },
      archivedBookings: { label: "Ndokwa achebere", note: "Karịa ụbọchị 30" },
      balance: { label: "Nguzo ego", flowTemplate: "{inflow} mbata • {outflow} mfu" },
      reviews: { label: "Nyocha", pendingTemplate: "{count} na-eche nkwado" },
    },
    alertsPanel: {
      eyebrow: "Mkpọtụ amamihe",
      title: "Nlebara anya nke ihe na-adịghị mma n'ego na ọrụ",
      subtitle: "Ebe a ka onye nwe na-achọpụta nrụgide pụrụ iche tupu ọ ghọọ mmebi.",
      empty: "Enweghị ihe pụrụ iche na-egosi ugbu a.",
      expensePressure: {
        title: "Nrụgide mmefu karịrị mbata ego",
        text: "Mfu niile dị elu karịa mbata ugbu a. Onye nwe kwesịrị ịlele nkwado, ọrụ ọnụ ahịa dị elu, na ego nwere ike enweta ozugbo.",
      },
      awaitingDecision: {
        title: "Mmefu na-eche mkpebi onye nwe",
        textTemplate: "Ndekọ mmefu {count} ka dere ma na-eche nkwado ma ọ bụ nkagbu.",
      },
      refundActivity: {
        title: "A chọpụtara ọrụ nloghachi pụrụ iche",
        textTemplate: "Mmefu ọhụrụ jikọtara na nloghachi na-egosi na sistemu. Nrụgide nloghachi ugbu a bụ {amount} site n'ihe {count}.",
      },
      delayRisk: {
        title: "Ihe ize ndụ igbu oge na ndokwa na-arị elu",
        textTemplate: "Ndokwa {overdue} agafeela ma {urgent} dị ngwa ngwa na-egosi ugbu a. Nke a nwere ike imebi ntụkwasị obi ozi ma ọ bụrụ na adịghị edozi ya ngwa ngwa.",
      },
      strongFlow: {
        title: "Mbufe nso nso a yiri ike",
        textTemplate: "Mbata ọnwa ugbu a na-eburu ụzọ mfu site na {percent} na ọrụ a na-eso. Debe sistemu ahụike ka uto ahụ dị ọcha.",
      },
    },
    forecastPanel: {
      eyebrow: "Amụma",
      title: "Atụmatụ ọrụ obere oge",
      subtitle: "Atụmatụ ọsọ ọsọ dabere na ọrụ ọnwa ugbu a a na-eso.",
      monthInflow: "Mbata ọnwa (ndụ)",
      monthOutflow: "Mfu ọnwa (ndụ)",
      projectedNet: "Net njedebe ọnwa atụrụ",
      flowGrowth: "Akara uto mbufe",
      positiveTemplate: "Ọ bụrụ na ọsọ ọsọ ugbu a ka dị, care nwere ike imechi ọnwa na ihe dị ka {amount} net.",
      negativeTemplate: "Ọ bụrụ na ọsọ ọsọ ugbu a ka dị, care nwere ike imechi ọnwa n'okpuru nrụgide na ihe dị ka {amount} net.",
    },
    urgencyPanel: {
      eyebrow: "Ọsọ ọsọ",
      title: "Iwu na-achọ nlebara anya",
      subtitle: "Onye nwe kwesịrị ịhụ nrụgide ozugbo, ọbụlagodi ma ọ bụrụ na onye njikwa na-eduzi ụbọchị.",
      noPickup: "Enweghị ụbọchị nbubata",
      empty: "Enweghị ndokwa dị ngwa ngwa ugbu a.",
    },
    brandPanel: {
      eyebrow: "Ọnọdụ akara",
      title: "Ngosipụta ụlọ ọrụ ndụ",
      subtitle: "Ihe akụkụ ọha na-adọpụta ugbu a site na ntọala.",
      heroBadge: "Akara isi",
      supportEmail: "Email nkwado",
      supportPhone: "Ekwentị nkwado",
      pickupHours: "Awa nbubata",
      careDomain: "Ngalaba care",
      hubDomain: "Ngalaba hub",
      notConfigured: "Edobeghị ka",
      openSettings: "Mepee ntọala",
    },
    paymentsPanel: {
      eyebrow: "Mmegharị ego",
      title: "Ụgwọ ọhụrụ",
      subtitle: "Ngụta ngwa ngwa nke mbata.",
      generalPayment: "Ụgwọ izugbe",
      empty: "Enweghị ụgwọ ọhụrụ ugbu a.",
    },
    expensesPanel: {
      eyebrow: "Nrụgide ọnụ ahịa",
      title: "Mmefu ọhụrụ",
      subtitle: "Onye nwe kwesịrị ịmara mgbe niile ebe ego na-aga.",
      viewProof: "Hụ akaebe",
      empty: "Enweghị mmefu ọhụrụ ugbu a.",
    },
    reviewsPanel: {
      eyebrow: "Ahụike nyocha",
      title: "Olu ndị ahịa ọhụrụ",
      subtitle: "Akara ozi siri ike na-echekwa ntụkwasị obi, ọ bụghị naanị usoro ọrụ.",
      approved: "akwadoro",
      pending: "na-eche",
      photoAltTemplate: "Foto nyocha sitere na {name}",
      empty: "Enweghị nyocha dị ugbu a.",
    },
    intelligencePanel: {
      eyebrow: "Ọgụgụ isi",
      title: "Ihe onye nwe kwesịrị ịlebara anya ọzọ",
      subtitle: "Ụlọ ọrụ na-arịwanye elu mgbe a tụgharịrị nghọta n'ime omume.",
      expenseFlags: {
        title: "Akara amamihe nke mmefu",
        topTemplate: "Otu mmefu nke isi ọhụrụ bụ {category} na {amount}.",
        emptyText: "Enwebeghị nrụgide udi dị mkpa.",
      },
      delayAlerts: {
        title: "Mkpọtụ igbu oge ndokwa",
        textTemplate: "Ndokwa {count} agafeela ka na-egosi na ahịrị care na-arụ ọrụ.",
      },
      forecasting: {
        title: "Amụma ọrụ",
      },
      approvalDiscipline: {
        title: "Iwu nkwado",
        textTemplate: "Ndekọ mmefu {count} na-eche ihe onye nwe ga-eme ugbu a.",
      },
    },
    archivePanel: {
      eyebrow: "Iwu nchekwa",
      cta: "Mepee ndekọ na-amata nchekwa",
    },
    dash: "—",
  },
};

const YO: DeepPartial<CareCopy> = {
  nav: {
    home: "Ile",
    book: "Gbe",
    track: "Tẹle",
    review: "Fi ero silẹ",
    account: "Akọọlẹ",
  },
  hero: {
    title: "Abojuto ti o han gbangba, nigbagbogbo.",
    subtitle: "Itọju aṣọ, mimọ ile, ati itọju ibi iṣẹ pẹlu ifiṣura ti o rọrun, itọpa ti o duro, ati atilẹyin ti o dakẹ.",
    ctaBook: "Gbe iṣẹ",
    ctaTrack: "Tẹle ifiṣura",
  },
  booking: {
    title: "Gbe iṣẹ",
    serviceLabel: "Iru iṣẹ",
    dateLabel: "Ọjọ ayanfẹ",
    timeLabel: "Akoko ayanfẹ",
    nameLabel: "Orukọ kíkún",
    phoneLabel: "Nọmba foonu",
    emailLabel: "Adirẹsi imeeli",
    addressLabel: "Adirẹsi gbigba",
    notesLabel: "Awọn akọsilẹ miiran",
    submitButton: "Beere ifiṣura",
    confirmationHeading: "Beere ifiṣura ti gba",
    confirmationBody: "A ó jẹrisi ifiṣura rẹ laipẹ. Pa koodu itọpa rẹ pamọ.",
    trackingCodeLabel: "Koodu itọpa rẹ",
  },
  tracking: {
    title: "Tẹle ifiṣura rẹ",
    codeLabel: "Koodu itọpa",
    phoneLabel: "Nọmba foonu",
    submitButton: "Ṣayẹwo ipo",
    notFound: "Ko si ifiṣura fun koodu ati nọmba foonu yẹn.",
    statusLabel: "Ipo lọwọlọwọ",
    lastUpdatedLabel: "Ìgbẹ̀yìn ìmúdójúìwọ̀n",
    estimatedLabel: "Ipari ti a reti",
  },
  status: {
    pending: "Nduro",
    confirmed: "Ti jẹrisi",
    collected: "Ti gba",
    inProgress: "Ni ilọsiwaju",
    readyForDelivery: "Ṣetan fun ifiṣẹ",
    outForDelivery: "Wa ọna ifiṣẹ",
    delivered: "Ti fi jiṣẹ",
    completed: "Ti pari",
    cancelled: "Ti fagilee",
  },
  review: {
    title: "Pin iriri rẹ",
    ratingLabel: "Idiyele gbogbogbo",
    textLabel: "Atunwo rẹ",
    photoLabel: "Fi fọto kun (aṣayan)",
    submitButton: "Fi atunwo silẹ",
    successMessage: "E dupe. Atunwo rẹ ti fi silẹ ati pe o n duro fun ifọwọsi.",
    pendingApproval: "Nduro fun ifọwọsi",
  },
  serviceTypes: {
    laundry: "Fifọ aṣọ",
    drycleaning: "Mimọ gbigbẹ",
    ironing: "Airin aṣọ",
    alterations: "Atunṣe aṣọ",
    homeCleaning: "Mimọ ile",
    officeCleaning: "Mimọ ọfiisi",
  },
  staffManager: {
    metadata: {
      title: "Pẹpẹ Onítọ́jú | Henry Onyx Fabric Care",
      description:
        "Pẹpẹ ìdarí onítọ́jú fún gbígbà, iṣẹ́ alaaye, owó tó ń wọlé, àti ìṣàkóso owó tí ó ń jáde.",
    },
    hero: {
      eyebrow: "Yàrá iṣẹ́ onítọ́jú",
      title: "Darí ọjọ́. Pa àkọsílẹ̀ mọ́ nínú òtítọ́.",
      body: "Eyi ni ìpele ìdarí alaaye fún onítọ́jú. Gbígbà, ìfiwérèsìlẹ̀ tí ó dúró lórí ìdíyelé, ìṣípayá ipò, gbígba owó, àti àwọn owó ojoojúmọ́, gbogbo wọn yẹ kí a ṣàkóso nibí láìsí ìdàrúdàpọ̀.",
    },
    quickLinks: {
      openOperations: "Ṣii iṣẹ́",
      openExpenses: "Ṣii owó tí ó ń jáde",
      trackingPage: "Ojú-ìwé ìtọpa",
      createWalkIn: "Ṣẹda ifiṣura tó bá dé",
    },
    metrics: {
      activeBookings: { label: "Ifiṣura tó ń lọ", note: "Ẹrù iṣẹ́ àtìpótì lọ́wọ́" },
      urgentQueue: { label: "Ìlà kíákíá", note: "Béèrè fún àfiyèsí kíákíá" },
      registeredPieces: { label: "Àwọn ohun tí a forúkọ sílẹ̀", note: "Àkọsílẹ̀ ìtọpa-ìdíyelé" },
      recordedInflow: { label: "Owó wíwọlé tí a kọ", note: "Owó tí a kọ sí orí ifiṣura" },
      pendingExpenses: { label: "Owó tí ó ń jáde tí ó ń dúró", note: "Ń dúró de àyẹ̀wò onílé" },
    },
    urgentPanel: {
      eyebrow: "Iṣẹ́ pàtàkì",
      title: "Ifiṣura kíákíá",
      subtitle: "Awọn wọ̀nyí ni iṣẹ́ tí onítọ́jú kò gbọdọ̀ fojú parẹ́.",
      noSlot: "Kò sí àkókò",
      openBooking: "Ṣii ifiṣura",
      empty: "Kò sí ifiṣura kíákíá ní àkókò yìí.",
    },
    pressurePanel: {
      eyebrow: "Àwọn ìbéèrè òtítọ́ ti onítọ́jú",
      title: "Àwọn ibi ìpọ́njú iṣẹ́",
      subtitle: "Àwọn ìtọkasí wọnyi ràn onítọ́jú lọ́wọ́ láti dá àwọn àṣìṣe tí a fipamọ́ dúró ṣáájú kí wọ́n tó di ìṣòro fún iléeṣẹ́.",
      missingIntake: {
        label: "Ifiṣura aṣọ tí kò ní ìgbawọlé",
        note: "Kìkì ifiṣura aṣọ ni a gbọdọ̀ tọkasí níbí. Ifiṣura iṣẹ́ ni a ń tọpa lọ́tọ̀ọ̀tọ̀.",
      },
      approvedExpenses: {
        label: "Owó tí a fọwọsi",
        note: "A ti gba awọn ìnáwó wọ̀nyí lákọ̀ọ́kọ́ nínú àyẹ̀wò onílé.",
      },
      overallBalance: {
        label: "Iyókù gbogbogbo",
        flowTemplate: "{inflow} wíwọlé • {outflow} jíjáde",
      },
    },
    dash: "—",
  },
  staffOwner: {
    metadata: {
      title: "Pátákó onílé | Henry Onyx Fabric Care",
      description:
        "Iyàrá ìdarí onílé fún ìbúkún ìwé, ìnáwó, ààbò, àyẹ̀wò, àti àwọn iṣẹ́ ilé-iṣẹ́ jákèjádò.",
    },
    hero: {
      eyebrow: "Ilé ìpàṣẹ onílé",
      title: "Ìdarí gíga jùlọ fún gbogbo iṣẹ́ ìtọ́jú.",
      body: "Èyí ni ìpele tó ga jùlọ. O rí ipò àdánidá ti ilé-iṣẹ́ níbí: ìyára, owó ìjẹrẹ́, ipá ìnáwó, dídára àwọn àkọsílẹ̀, ìlera àyẹ̀wò, àti ààbò.",
    },
    quickLinks: {
      bookings: "Ìwé ìbúkún",
      finance: "Ìnáwó",
      records: "Àkọsílẹ̀",
      security: "Ààbò",
      settings: "Ètò",
      reviews: "Àyẹ̀wò",
      staff: "Òṣìṣẹ́",
      fieldStaff: "Òṣìṣẹ́ pápá",
      managerExpenses: "Ìnáwó alábòójútó",
      riderExpenses: "Ìnáwó òṣìṣẹ́ kíkó-jíjáde",
      supportExpenses: "Ìnáwó ìtìlẹ́yìn",
    },
    metrics: {
      activeBookings: { label: "Ìbúkún ìwé ti ń ṣiṣẹ́", note: "Ìlà iṣẹ́ tó wà ní bayìí" },
      archivedBookings: { label: "Ìbúkún ìwé tí a kó sí ọ́gba", note: "Ju ọjọ́ 30 lọ" },
      balance: { label: "Iyókù", flowTemplate: "{inflow} wíwọlé • {outflow} jíjáde" },
      reviews: { label: "Àyẹ̀wò", pendingTemplate: "{count} ń dúró fún ìfọwọsi" },
    },
    alertsPanel: {
      eyebrow: "Àwọn ìkìlọ̀ ọlọ́gbọ́n",
      title: "Ìṣọ́ àwọn àìbámu nínú ìnáwó àti iṣẹ́",
      subtitle: "Ibí yìí ni onílé ti máa ń mọ̀ nípa ipá tí kò ṣe déédéé kí ó tó di ìbàjẹ́.",
      empty: "Kò sí àìbámu pàtàkì tí a rí ní bayìí.",
      expensePressure: {
        title: "Ipá ìnáwó ti ga ju ti ìjẹrẹ́ lọ",
        text: "Owó tí a ná ti pọ̀ ju owó tí ó wọlé lọ. Onílé gbọ́dọ̀ ṣe àyẹ̀wò àwọn ìfọwọsi, iṣẹ́ tí ó gbówó lórí, àti owó tí a lè gba padà lẹ́sẹ̀kẹsẹ̀.",
      },
      awaitingDecision: {
        title: "Àwọn ìnáwó ń dúró fún ìpinnu onílé",
        textTemplate: "Àwọn àkọsílẹ̀ ìnáwó {count} ṣì wà tí ó ń dúró fún ìfọwọsi tàbí ìparẹ́.",
      },
      refundActivity: {
        title: "A rí iṣẹ́ ìdápadà tí kò ṣe déédéé",
        textTemplate: "Àwọn ìnáwó tó wà nípa ìdápadà ń farahàn nínú ètò. Ipá ìdápadà ní bayìí ni {amount} láti inú {count}.",
      },
      delayRisk: {
        title: "Ewu ìdádúró ìbúkún ìwé ń pọ̀ sí i",
        textTemplate: "Ìbúkún ìwé {overdue} tí ó ti pẹ́ àti {urgent} tí ó yára nílò ìfọkànsí ní bayìí. Èyí lè ba ìgbẹ́kẹ̀lé iṣẹ́ jẹ́ tí kò bá ṣe sí lẹ́sẹ̀kẹsẹ̀.",
      },
      strongFlow: {
        title: "Ṣíṣàn aipẹ dára gan",
        textTemplate: "Owó wíwọlé fún oṣù yìí ti ga ju jíjáde lọ pẹ̀lú {percent} lórí iṣẹ́ tí a ti tọ́pa. Pa ètò mọ́ ní ìbámu kí ìdàgbàsókè náà má jẹ́ mímọ́.",
      },
    },
    forecastPanel: {
      eyebrow: "Àsọtẹ́lẹ̀",
      title: "Àsọtẹ́lẹ̀ iṣẹ́ àkókò kúkúrú",
      subtitle: "Àfojúsùn ìṣàn ní àkókò gangan dá lórí iṣẹ́ oṣù yìí.",
      monthInflow: "Wíwọlé oṣù (gangan)",
      monthOutflow: "Jíjáde oṣù (gangan)",
      projectedNet: "Òdo òpin oṣù tí a ṣe àsọtẹ́lẹ̀",
      flowGrowth: "Àmì ìdàgbàsókè ìṣàn",
      positiveTemplate: "Bí ìṣàn báyìí bá dúró, care lè parí oṣù pẹ̀lú nǹkan bí {amount} òdo.",
      negativeTemplate: "Bí ìṣàn báyìí bá dúró, care lè parí oṣù lábẹ́ ipá pẹ̀lú nǹkan bí {amount} òdo.",
    },
    urgencyPanel: {
      eyebrow: "Ìyára",
      title: "Àwọn àṣẹ tí ó nílò ìfọkànsí",
      subtitle: "Onílé gbọ́dọ̀ rí ipá lẹ́sẹ̀kẹsẹ̀, kódà tí alábòójútó bá ń darí ọjọ́ náà.",
      noPickup: "Kò sí ọjọ́ kíkó",
      empty: "Kò sí ìbúkún ìwé kánjúkánjú ní àkókò yìí.",
    },
    brandPanel: {
      eyebrow: "Ipò àmì-ìdánimọ̀",
      title: "Ìfihàn ilé-iṣẹ́ ní àkókò gangan",
      subtitle: "Ohun tí ẹgbẹ́ gbogbo gbo ń fà jáde lọ́wọ́lọ́wọ́ nínú ètò.",
      heroBadge: "Àmì gíga",
      supportEmail: "Imeeli ìtìlẹ́yìn",
      supportPhone: "Tẹlifóònù ìtìlẹ́yìn",
      pickupHours: "Wákàtí kíkó",
      careDomain: "Ìpínlẹ̀ care",
      hubDomain: "Ìpínlẹ̀ hub",
      notConfigured: "A kò tíì ṣètò",
      openSettings: "Ṣí ètò",
    },
    paymentsPanel: {
      eyebrow: "Ìṣíṣe owó",
      title: "Àwọn ìsanwó aipẹ",
      subtitle: "Kíkà yìí láti mọ̀ ìjẹrẹ́ kíákíá.",
      generalPayment: "Ìsanwó gbogbogbo",
      empty: "Kò sí ìsanwó aipẹ síbẹ̀.",
    },
    expensesPanel: {
      eyebrow: "Ipá iye owó",
      title: "Àwọn ìnáwó aipẹ",
      subtitle: "Onílé gbọ́dọ̀ máa mọ̀ ibi tí owó ti ń lọ nígbà gbogbo.",
      viewProof: "Wo ẹ̀rí",
      empty: "Kò sí ìnáwó aipẹ síbẹ̀.",
    },
    reviewsPanel: {
      eyebrow: "Ìlera àyẹ̀wò",
      title: "Ohùn àwọn oníbàárà aipẹ",
      subtitle: "Àwọn àmì iṣẹ́ tó lágbára ń pa ìgbẹ́kẹ̀lé mọ́, kì í ṣe ètò iṣẹ́ kiki.",
      approved: "ti fọwọsi",
      pending: "ń dúró",
      photoAltTemplate: "Fọ́tò àyẹ̀wò láti ọwọ́ {name}",
      empty: "Kò sí àyẹ̀wò tí ó wà síbẹ̀.",
    },
    intelligencePanel: {
      eyebrow: "Ọgbọ́n",
      title: "Ohun tí onílé yẹ kí ó tẹ̀lé tókàn",
      subtitle: "Ilé-iṣẹ́ máa ń ní ìdàgbàsókè púpọ̀ nígbà tí ọgbọ́n bá di iṣẹ́.",
      expenseFlags: {
        title: "Àwọn àmì ọlọ́gbọ́n ti ìnáwó",
        topTemplate: "Ipele ìnáwó aipẹ tó ga jùlọ ni {category} ní {amount}.",
        emptyText: "A kò tíì rí ipá ipele pàtàkì.",
      },
      delayAlerts: {
        title: "Àwọn ìkìlọ̀ ìdádúró ìbúkún ìwé",
        textTemplate: "Ìbúkún ìwé {count} tí ó ti pẹ́ ń farahàn nínú ìlà care ti ń ṣiṣẹ́.",
      },
      forecasting: {
        title: "Àsọtẹ́lẹ̀ iṣẹ́",
      },
      approvalDiscipline: {
        title: "Ìbámu ìfọwọsi",
        textTemplate: "Àkọsílẹ̀ ìnáwó {count} ń dúró fún ìṣe onílé lọ́wọ́lọ́wọ́.",
      },
    },
    archivePanel: {
      eyebrow: "Ìlànà àpamọ́wọ́",
      cta: "Ṣí àkọsílẹ̀ tó mọ àpamọ́wọ́",
    },
    dash: "—",
  },
};

const HA: DeepPartial<CareCopy> = {
  nav: {
    home: "Gida",
    book: "Yi Ajiya",
    track: "Bi Didiga",
    review: "Bar ra'ayi",
    account: "Asusun",
  },
  hero: {
    title: "Kula da ke zuwa, koyaushe.",
    subtitle: "Kula da tufafi, tsaftace gida, da kula da wurin aiki tare da ajiya mai sauƙi, bin didiga mai inganci, da taimako mai nutsuwa.",
    ctaBook: "Yi ajiyar sabis",
    ctaTrack: "Bi didiga ajiya",
  },
  booking: {
    title: "Yi ajiyar sabis",
    serviceLabel: "Nau'in sabis",
    dateLabel: "Ranar da ake so",
    timeLabel: "Lokacin da ake so",
    nameLabel: "Cikakken suna",
    phoneLabel: "Lambar wayar salula",
    emailLabel: "Adireshin imel",
    addressLabel: "Adireshin karɓa",
    notesLabel: "Ƙarin bayani",
    submitButton: "Nemi ajiya",
    confirmationHeading: "An karɓi buƙatar ajiya",
    confirmationBody: "Za mu tabbatar da ajiyarka nan ba da jimawa ba. Kiyaye lambar bin-didiga.",
    trackingCodeLabel: "Lambar bin-didiga",
  },
  tracking: {
    title: "Bi didiga ajiyarka",
    codeLabel: "Lambar bin-didiga",
    phoneLabel: "Lambar wayar salula",
    submitButton: "Duba halin",
    notFound: "Ba a sami ajiya ba ga wannan lambar da wayar salula.",
    statusLabel: "Halin yanzu",
    lastUpdatedLabel: "Ƙarshen sabuntawa",
    estimatedLabel: "Ƙarshen da aka kiyasta",
  },
  status: {
    pending: "A tsallake",
    confirmed: "An tabbatar",
    collected: "An tattara",
    inProgress: "Ana ci gaba",
    readyForDelivery: "Shirye don isar da shi",
    outForDelivery: "Yana kan hanya",
    delivered: "An isar da shi",
    completed: "An gama",
    cancelled: "An soke",
  },
  review: {
    title: "Raba kwarewar ka",
    ratingLabel: "Gabaɗaya tantancewa",
    textLabel: "Ra'ayinka",
    photoLabel: "Ƙara hoto (zaɓi)",
    submitButton: "Aika ra'ayi",
    successMessage: "Na gode. An aika ra'ayinka kuma yana jiran amincewar.",
    pendingApproval: "Yana jiran amincewa",
  },
  serviceTypes: {
    laundry: "Wanke tufafi",
    drycleaning: "Tsabtace bushe",
    ironing: "Yin pressing",
    alterations: "Gyaggyarawa",
    homeCleaning: "Tsabtace gida",
    officeCleaning: "Tsabtace ofis",
  },
  staffManager: {
    metadata: {
      title: "Dashbod na Manaja | Henry Onyx Fabric Care",
      description:
        "Dashbod na umarni ga manaja domin shigarwa, ayyukan kai tsaye, kuɗin shiga, da sarrafa kashe kuɗi.",
    },
    hero: {
      eyebrow: "Ɗakin ayyukan manaja",
      title: "Jagoranci yini. Riƙe bayanai cikin gaskiya.",
      body: "Wannan shi ne sashin sarrafawa na kai-tsaye na manaja. Karɓa, rajistar da farashi ke goyon baya, motsi na hali, ɗaukar biyan kuɗi, da kuɗin yau da kullum dukkansu ya kamata a tafiyar da su a nan ba tare da rikicewa ba.",
    },
    quickLinks: {
      openOperations: "Buɗe ayyuka",
      openExpenses: "Buɗe kashe kuɗi",
      trackingPage: "Shafin bin didiga",
      createWalkIn: "Ƙirƙira ajiyar shigowa",
    },
    metrics: {
      activeBookings: { label: "Ajiyar masu aiki", note: "Aikin yanzu mai gudana" },
      urgentQueue: { label: "Layi mai gaggawa", note: "Yana buƙatar kulawa nan da nan" },
      registeredPieces: { label: "Tufafi da aka rijista", note: "Bayanai da farashi ya goyi baya" },
      recordedInflow: { label: "Kuɗin shiga da aka rubuta", note: "Kuɗin da aka rubuta a kan ajiyar" },
      pendingExpenses: { label: "Kashe kuɗi a tsare", note: "Suna jiran sake duba na mai shi" },
    },
    urgentPanel: {
      eyebrow: "Fifiko",
      title: "Ajiya masu gaggawa",
      subtitle: "Waɗannan su ne ayyukan da manaja bai kamata ya yi watsi da su ba.",
      noSlot: "Babu lokaci",
      openBooking: "Buɗe ajiya",
      empty: "Babu ajiya mai gaggawa a yanzu.",
    },
    pressurePanel: {
      eyebrow: "Binciken gaskiya na manaja",
      title: "Wuraren matsi na ayyuka",
      subtitle: "Waɗannan alamomi suna taimaka wa manaja ya dakatar da kurakurai na ɓoye kafin su zama matsala ga kamfani.",
      missingIntake: {
        label: "Ajiyar tufafi marasa karɓa",
        note: "Sai ajiyar tufafi kaɗai ya kamata a alamta a nan. Ajiyar sabis ana bi su daban.",
      },
      approvedExpenses: {
        label: "Kashe kuɗi da aka amince da su",
        note: "An riga an amince da waɗannan kuɗaɗen a sake duba na mai shi.",
      },
      overallBalance: {
        label: "Daidaiton gabaɗaya",
        flowTemplate: "{inflow} shigowa • {outflow} fitowa",
      },
    },
    dash: "—",
  },
  staffOwner: {
    metadata: {
      title: "Dashboard na mai shi | Henry Onyx Fabric Care",
      description:
        "Dakin kula da mai shi don adireshin ajiyar, kuɗi, tsaro, sake duba, da ayyukan kamfani gabaɗaya.",
    },
    hero: {
      eyebrow: "Cibiyar umarni ta mai shi",
      title: "Kulawa ta gaba ɗaya ga dukkan ayyukan kulawa.",
      body: "Wannan ita ce mataki mafi girma. A nan kake gani yanayin kamfani na gaskiya: gaggawa, shigowar kuɗi, matsi na kashe kuɗi, ingancin bayanai, lafiyar sake duba, da tsaro.",
    },
    quickLinks: {
      bookings: "Ajiya",
      finance: "Kuɗi",
      records: "Bayanai",
      security: "Tsaro",
      settings: "Saituna",
      reviews: "Sake duba",
      staff: "Ma'aikata",
      fieldStaff: "Ma'aikata na fili",
      managerExpenses: "Kashe kuɗin manaja",
      riderExpenses: "Kashe kuɗin matuƙa",
      supportExpenses: "Kashe kuɗin tallafi",
    },
    metrics: {
      activeBookings: { label: "Ajiyar da ke aiki", note: "Layin aiki na yanzu" },
      archivedBookings: { label: "Ajiyar da aka adana", note: "Tsofaffi fiye da kwana 30" },
      balance: { label: "Daidaito", flowTemplate: "{inflow} shigowa • {outflow} fitowa" },
      reviews: { label: "Sake duba", pendingTemplate: "{count} suna jiran amincewa" },
    },
    alertsPanel: {
      eyebrow: "Faɗakarwar wayo",
      title: "Sa ido a kan rashin daidaito a kuɗi da aiki",
      subtitle: "A nan ne mai shi yakan gane matsi mara kyau kafin ya zama lahani.",
      empty: "Babu manyan rashin daidaito da ake gani yanzu.",
      expensePressure: {
        title: "Matsin kashe kuɗi ya wuce na shigowar kuɗi",
        text: "Jimlar fitowa ya riga ya zama mafi girma fiye da shigowa. Mai shi ya kamata ya duba amincewa, ayyuka masu tsada, da kuɗin da za a iya dawowa nan da nan.",
      },
      awaitingDecision: {
        title: "Kashe kuɗi suna jiran shawarar mai shi",
        textTemplate: "Bayanai {count} na kashe kuɗi har yanzu suna jiran amincewa ko sokewa.",
      },
      refundActivity: {
        title: "An gano aikin mayar da kuɗi mara kyau",
        textTemplate: "Kashe kuɗin da ke da alaƙa da mayar da kuɗi a kwanan baya suna bayyana a tsarin. Matsin mayar da kuɗi a yanzu shi ne {amount} daga abubuwa {count}.",
      },
      delayRisk: {
        title: "Hadarin jinkirta ajiya yana ƙaruwa",
        textTemplate: "Ajiya {overdue} da suka wuce lokaci da {urgent} masu gaggawa ana gani a yanzu. Wannan na iya lalata amincewa idan ba a kula da shi nan da nan ba.",
      },
      strongFlow: {
        title: "Tafiyar kuɗi ta baya-bayan nan tana da ƙarfi",
        textTemplate: "Shigowar wata na yanzu ya zarce fitowa da {percent} a kan ayyukan da aka bibiya. Kiyaye tsarin tare da horo don ci gaba ya zama tsabta.",
      },
    },
    forecastPanel: {
      eyebrow: "Hasashe",
      title: "Hasashe na aiki na ɗan gajeren lokaci",
      subtitle: "Ƙiyasin gudu na ainihi bisa ayyukan wannan wata.",
      monthInflow: "Shigowar wata (kai tsaye)",
      monthOutflow: "Fitowar wata (kai tsaye)",
      projectedNet: "Tsabar kuɗin ƙarshen wata da aka hasashe",
      flowGrowth: "Alamar ci gaban gudu",
      positiveTemplate: "Idan gudun yanzu ya ci gaba, care na iya rufe wata da kusan {amount} tsabar kuɗi.",
      negativeTemplate: "Idan gudun yanzu ya ci gaba, care na iya rufe wata a ƙarƙashin matsi tare da kusan {amount} tsabar kuɗi.",
    },
    urgencyPanel: {
      eyebrow: "Gaggawa",
      title: "Umarni masu buƙatar kulawa",
      subtitle: "Mai shi ya kamata ya ji matsin nan da nan, ko da manaja ne ke gudanar da yini.",
      noPickup: "Babu ranar ɗauka",
      empty: "Babu ajiya mai gaggawa a yanzu.",
    },
    brandPanel: {
      eyebrow: "Yanayin alama",
      title: "Gabatarwar kamfani kai tsaye",
      subtitle: "Abin da ɓangaren jama'a ke ɗauka a yanzu daga saituna.",
      heroBadge: "Lambar tutu",
      supportEmail: "Imel na tallafi",
      supportPhone: "Wayar tallafi",
      pickupHours: "Awannin ɗauka",
      careDomain: "Yankin care",
      hubDomain: "Yankin hub",
      notConfigured: "Ba a daidaita ba tukuna",
      openSettings: "Buɗe saituna",
    },
    paymentsPanel: {
      eyebrow: "Motsi na kuɗi",
      title: "Biyan kuɗin kwanan nan",
      subtitle: "Karatun gaggawa na shigowa.",
      generalPayment: "Biyan kuɗi gabaɗaya",
      empty: "Babu biyan kuɗi na kwanan nan har yanzu.",
    },
    expensesPanel: {
      eyebrow: "Matsin farashi",
      title: "Kashe kuɗi na kwanan nan",
      subtitle: "Mai shi ya kamata ya san inda kuɗin ke zuwa kullum.",
      viewProof: "Duba shaida",
      empty: "Babu kashe kuɗi na kwanan nan har yanzu.",
    },
    reviewsPanel: {
      eyebrow: "Lafiyar sake duba",
      title: "Muryar abokin ciniki ta kwanan nan",
      subtitle: "Manyan tambarin sabis suna kare amincewa, ba kawai tafiyar aiki ba.",
      approved: "an amince",
      pending: "yana jira",
      photoAltTemplate: "Hoton sake duba daga {name}",
      empty: "Babu sake duba da ke akwai har yanzu.",
    },
    intelligencePanel: {
      eyebrow: "Hankali",
      title: "Abin da mai shi ya kamata ya bi sannan",
      subtitle: "Kamfani yana zama mafi inganci lokacin da fahimta ya zama aiki.",
      expenseFlags: {
        title: "Tutoci na hankali na kashe kuɗi",
        topTemplate: "Babban rukunin kashe kuɗi na kwanan nan shi ne {category} a {amount}.",
        emptyText: "Babu manyan matsin rukuni da ake gani tukuna.",
      },
      delayAlerts: {
        title: "Faɗakarwar jinkirta ajiya",
        textTemplate: "Ajiya {count} da suka wuce lokaci ana gani a layin care mai aiki.",
      },
      forecasting: {
        title: "Hasashe na aiki",
      },
      approvalDiscipline: {
        title: "Horon amincewa",
        textTemplate: "Bayanai {count} na kashe kuɗi suna jiran aikin mai shi a yanzu.",
      },
    },
    archivePanel: {
      eyebrow: "Manufar adanawa",
      cta: "Buɗe bayanai masu sani da adanawa",
    },
    dash: "—",
  },
};

const DE: DeepPartial<CareCopy> = {
  nav: {
    home: "Start",
    book: "Buchen",
    track: "Verfolgen",
    review: "Bewertung abgeben",
    account: "Konto",
  },
  hero: {
    title: "Pflege, die immer da ist.",
    subtitle: "Wäschepflege, Hausreinigung und Büropflege mit klarer Buchung, stabilem Tracking und ruhigem Support.",
    ctaBook: "Dienst buchen",
    ctaTrack: "Buchung verfolgen",
  },
  booking: {
    title: "Dienst buchen",
    serviceLabel: "Dienstart",
    dateLabel: "Bevorzugtes Datum",
    timeLabel: "Bevorzugte Uhrzeit",
    nameLabel: "Vollständiger Name",
    phoneLabel: "Telefonnummer",
    emailLabel: "E-Mail-Adresse",
    addressLabel: "Abholadresse",
    notesLabel: "Zusätzliche Notizen",
    submitButton: "Buchung anfordern",
    confirmationHeading: "Buchungsanfrage erhalten",
    confirmationBody: "Wir bestätigen Ihre Buchung in Kürze. Bewahren Sie Ihren Tracking-Code auf.",
    trackingCodeLabel: "Ihr Tracking-Code",
  },
  tracking: {
    title: "Buchung verfolgen",
    codeLabel: "Tracking-Code",
    phoneLabel: "Telefonnummer",
    submitButton: "Status prüfen",
    notFound: "Keine Buchung für diesen Code und diese Telefonnummer gefunden.",
    statusLabel: "Aktueller Status",
    lastUpdatedLabel: "Zuletzt aktualisiert",
    estimatedLabel: "Voraussichtliche Fertigstellung",
  },
  status: {
    pending: "Ausstehend",
    confirmed: "Bestätigt",
    collected: "Abgeholt",
    inProgress: "In Bearbeitung",
    readyForDelivery: "Versandbereit",
    outForDelivery: "Unterwegs",
    delivered: "Geliefert",
    completed: "Abgeschlossen",
    cancelled: "Storniert",
  },
  review: {
    title: "Teilen Sie Ihre Erfahrung",
    ratingLabel: "Gesamtbewertung",
    textLabel: "Ihre Bewertung",
    photoLabel: "Foto hinzufügen (optional)",
    submitButton: "Bewertung absenden",
    successMessage: "Vielen Dank. Ihre Bewertung wurde eingereicht und wartet auf Genehmigung.",
    pendingApproval: "Ausstehende Genehmigung",
  },
  serviceTypes: {
    laundry: "Wäsche",
    drycleaning: "Chemische Reinigung",
    ironing: "Bügeln",
    alterations: "Änderungen",
    homeCleaning: "Hausreinigung",
    officeCleaning: "Büroreinigung",
  },
  staffManager: {
    metadata: {
      title: "Manager-Dashboard | Henry Onyx Fabric Care",
      description:
        "Manager-Befehlsdashboard für Annahme, Live-Betrieb, Eingänge und Ausgabenkontrolle.",
    },
    hero: {
      eyebrow: "Manager-Operationsraum",
      title: "Den Tag steuern. Die Aufzeichnungen wahrheitsgetreu halten.",
      body: "Dies ist die Live-Steuerungsebene des Managers. Annahme, preisgestützte Registrierung, Statusbewegungen, Zahlungserfassung und tägliche Ausgaben sollten von hier aus ohne Verwirrung gehandhabt werden.",
    },
    quickLinks: {
      openOperations: "Betrieb öffnen",
      openExpenses: "Ausgaben öffnen",
      trackingPage: "Tracking-Seite",
      createWalkIn: "Laufkundschafts-Buchung erstellen",
    },
    metrics: {
      activeBookings: { label: "Aktive Buchungen", note: "Aktuelle Live-Arbeitslast" },
      urgentQueue: { label: "Dringende Warteschlange", note: "Benötigt schnelle Aufmerksamkeit" },
      registeredPieces: { label: "Registrierte Stücke", note: "Preisgestützte Artikel-Aufzeichnungen" },
      recordedInflow: { label: "Erfasster Zufluss", note: "Geld zu Buchungen erfasst" },
      pendingExpenses: { label: "Ausstehende Ausgaben", note: "Wartet auf Inhaber-Prüfung" },
    },
    urgentPanel: {
      eyebrow: "Priorität",
      title: "Dringende Buchungen",
      subtitle: "Dies sind die Aufträge, die der Manager nicht ignorieren sollte.",
      noSlot: "Kein Slot",
      openBooking: "Buchung öffnen",
      empty: "Im Moment keine dringenden Buchungen.",
    },
    pressurePanel: {
      eyebrow: "Manager-Wahrheitschecks",
      title: "Operative Druckpunkte",
      subtitle: "Diese Indikatoren helfen dem Manager, verborgene Fehler zu stoppen, bevor sie zu Unternehmensproblemen werden.",
      missingIntake: {
        label: "Kleidungsstückbuchungen ohne Annahme",
        note: "Nur Kleidungsstückbuchungen sollten hier gekennzeichnet werden. Servicebuchungen werden separat verfolgt.",
      },
      approvedExpenses: {
        label: "Genehmigte Ausgaben",
        note: "Diese Kosten wurden bereits in der Inhaber-Prüfung akzeptiert.",
      },
      overallBalance: {
        label: "Gesamtsaldo",
        flowTemplate: "{inflow} ein • {outflow} aus",
      },
    },
    dash: "—",
  },
  staffOwner: {
    metadata: {
      title: "Inhaber-Dashboard | Henry Onyx Fabric Care",
      description:
        "Steuerzentrale des Inhabers für Buchungen, Finanzen, Sicherheit, Bewertungen und unternehmensweite Abläufe.",
    },
    hero: {
      eyebrow: "Kommandozentrale des Inhabers",
      title: "Hauptsteuerung für den gesamten Pflegebetrieb.",
      body: "Dies ist die höchste Ebene. Hier siehst du den tatsächlichen Zustand des Unternehmens: Dringlichkeit, Einnahmen, Ausgabendruck, Datenqualität, Bewertungslage und Sicherheit.",
    },
    quickLinks: {
      bookings: "Buchungen",
      finance: "Finanzen",
      records: "Datensätze",
      security: "Sicherheit",
      settings: "Einstellungen",
      reviews: "Bewertungen",
      staff: "Personal",
      fieldStaff: "Außendienst",
      managerExpenses: "Manager-Ausgaben",
      riderExpenses: "Fahrer-Ausgaben",
      supportExpenses: "Support-Ausgaben",
    },
    metrics: {
      activeBookings: { label: "Aktive Buchungen", note: "Aktuelle Betriebs-Warteschlange" },
      archivedBookings: { label: "Archivierte Buchungen", note: "Älter als 30 Tage" },
      balance: { label: "Saldo", flowTemplate: "{inflow} ein • {outflow} aus" },
      reviews: { label: "Bewertungen", pendingTemplate: "{count} warten auf Freigabe" },
    },
    alertsPanel: {
      eyebrow: "Intelligente Warnungen",
      title: "Überwachung von Finanz- und Betriebsanomalien",
      subtitle: "Hier erkennt der Inhaber ungewöhnlichen Druck, bevor er zu Schaden wird.",
      empty: "Derzeit sind keine größeren Anomalien sichtbar.",
      expensePressure: {
        title: "Ausgabendruck übersteigt Einnahmen",
        text: "Der Gesamtabfluss ist bereits höher als der Zufluss. Der Inhaber sollte Genehmigungen, kostspielige Aktivitäten und rückforderbare Einnahmen sofort prüfen.",
      },
      awaitingDecision: {
        title: "Ausgaben warten auf Entscheidung des Inhabers",
        textTemplate: "{count} Ausgabeneinträge sind weiterhin erfasst und warten auf Freigabe oder Stornierung.",
      },
      refundActivity: {
        title: "Ungewöhnliche Rückerstattungsaktivität erkannt",
        textTemplate: "Aktuelle rückerstattungsbezogene Ausgaben sind im System sichtbar. Der aktuelle Rückerstattungsdruck beträgt {amount} aus {count} Posten.",
      },
      delayRisk: {
        title: "Risiko von Buchungsverzögerungen steigt",
        textTemplate: "{overdue} überfällige Buchung(en) und {urgent} dringende Buchung(en) sind derzeit sichtbar. Dies kann das Servicevertrauen schädigen, wenn nicht schnell gehandelt wird.",
      },
      strongFlow: {
        title: "Aktueller Fluss sieht stark aus",
        textTemplate: "Der Live-Zufluss des laufenden Monats übertrifft den Abfluss um {percent} auf Basis der jüngsten Aktivität. Halte das System diszipliniert, damit das Wachstum sauber bleibt.",
      },
    },
    forecastPanel: {
      eyebrow: "Prognose",
      title: "Kurzfristige Betriebsprojektion",
      subtitle: "Eine Live-Hochrechnung basierend auf der erfassten Aktivität des aktuellen Monats.",
      monthInflow: "Monatszufluss (live)",
      monthOutflow: "Monatsabfluss (live)",
      projectedNet: "Prognostiziertes Monatsnetto",
      flowGrowth: "Wachstumssignal des Flusses",
      positiveTemplate: "Wenn die aktuelle Live-Rate hält, könnte care den Monat mit etwa {amount} netto abschließen.",
      negativeTemplate: "Wenn die aktuelle Live-Rate hält, könnte care den Monat unter Druck mit etwa {amount} netto abschließen.",
    },
    urgencyPanel: {
      eyebrow: "Dringlichkeit",
      title: "Aufträge, die Aufmerksamkeit erfordern",
      subtitle: "Der Inhaber sollte den Druck sofort spüren, auch wenn der Manager den Tag leitet.",
      noPickup: "Kein Abholdatum",
      empty: "Derzeit keine dringenden Buchungen.",
    },
    brandPanel: {
      eyebrow: "Markenstatus",
      title: "Live-Unternehmenspräsentation",
      subtitle: "Was die öffentliche Seite derzeit aus den Einstellungen zieht.",
      heroBadge: "Hauptabzeichen",
      supportEmail: "Support-E-Mail",
      supportPhone: "Support-Telefon",
      pickupHours: "Abholzeiten",
      careDomain: "Care-Domain",
      hubDomain: "Hub-Domain",
      notConfigured: "Noch nicht konfiguriert",
      openSettings: "Einstellungen öffnen",
    },
    paymentsPanel: {
      eyebrow: "Geldbewegung",
      title: "Aktuelle Zahlungen",
      subtitle: "Schneller Überblick über Zuflüsse.",
      generalPayment: "Allgemeine Zahlung",
      empty: "Noch keine aktuellen Zahlungen.",
    },
    expensesPanel: {
      eyebrow: "Kostendruck",
      title: "Aktuelle Ausgaben",
      subtitle: "Der Inhaber sollte immer wissen, wohin das Geld fließt.",
      viewProof: "Beleg ansehen",
      empty: "Noch keine aktuellen Ausgaben.",
    },
    reviewsPanel: {
      eyebrow: "Bewertungs-Gesundheit",
      title: "Aktuelle Kundenstimme",
      subtitle: "Starke Servicemarken schützen Vertrauen, nicht nur den Arbeitsablauf.",
      approved: "freigegeben",
      pending: "ausstehend",
      photoAltTemplate: "Bewertungsfoto von {name}",
      empty: "Noch keine Bewertungen verfügbar.",
    },
    intelligencePanel: {
      eyebrow: "Intelligenz",
      title: "Was der Inhaber als Nächstes verfolgen sollte",
      subtitle: "Das Unternehmen wird produktiver, wenn Erkenntnisse in Handeln umgewandelt werden.",
      expenseFlags: {
        title: "Intelligente Ausgaben-Warnflaggen",
        topTemplate: "Die wichtigste aktuelle Ausgabenkategorie ist {category} mit {amount}.",
        emptyText: "Noch kein größerer Kategoriedruck sichtbar.",
      },
      delayAlerts: {
        title: "Buchungsverzögerungs-Warnungen",
        textTemplate: "{count} überfällige Buchung(en) sind in der aktiven care-Warteschlange sichtbar.",
      },
      forecasting: {
        title: "Betriebsprognose",
      },
      approvalDiscipline: {
        title: "Freigabe-Disziplin",
        textTemplate: "{count} Ausgabendatensatz/-sätze warten derzeit auf eine Aktion des Inhabers.",
      },
    },
    archivePanel: {
      eyebrow: "Archivierungsrichtlinie",
      cta: "Archivbewusste Datensätze öffnen",
    },
    dash: "—",
  },
};

const ZH: DeepPartial<CareCopy> = {
  nav: {
    home: "首页",
    book: "预订",
    track: "追踪",
    review: "留下评价",
    account: "账户",
  },
  hero: {
    title: "每次都准时到达的护理服务。",
    subtitle: "服装护理、家庭清洁和办公室维护，预订更清晰，追踪更稳定，支持更从容。",
    ctaBook: "预订服务",
    ctaTrack: "追踪预订",
  },
  booking: {
    title: "预订服务",
    serviceLabel: "服务类型",
    dateLabel: "首选日期",
    timeLabel: "首选时间",
    nameLabel: "全名",
    phoneLabel: "电话号码",
    emailLabel: "电子邮件地址",
    addressLabel: "取件地址",
    notesLabel: "附加说明",
    submitButton: "申请预订",
    confirmationHeading: "预订请求已收到",
    confirmationBody: "我们将很快确认您的预订。请妥善保管您的追踪码。",
    trackingCodeLabel: "您的追踪码",
  },
  tracking: {
    title: "追踪您的预订",
    codeLabel: "追踪码",
    phoneLabel: "电话号码",
    submitButton: "查询状态",
    notFound: "未找到该追踪码和电话号码对应的预订。",
    statusLabel: "当前状态",
    lastUpdatedLabel: "最后更新",
    estimatedLabel: "预计完成时间",
  },
  status: {
    pending: "待处理",
    confirmed: "已确认",
    collected: "已取件",
    inProgress: "进行中",
    readyForDelivery: "准备派送",
    outForDelivery: "派送中",
    delivered: "已送达",
    completed: "已完成",
    cancelled: "已取消",
  },
  review: {
    title: "分享您的体验",
    ratingLabel: "总体评分",
    textLabel: "您的评价",
    photoLabel: "添加照片（可选）",
    submitButton: "提交评价",
    successMessage: "感谢您。您的评价已提交，正在等待审核。",
    pendingApproval: "待审核",
  },
  serviceTypes: {
    laundry: "洗衣",
    drycleaning: "干洗",
    ironing: "熨烫",
    alterations: "修改",
    homeCleaning: "家庭清洁",
    officeCleaning: "办公室清洁",
  },
  staffManager: {
    metadata: {
      title: "经理仪表板 | Henry Onyx Fabric Care",
      description: "经理指挥仪表板，用于收件、实时运营、收入和支出管理。",
    },
    hero: {
      eyebrow: "经理运营室",
      title: "管好每一天。如实记录数据。",
      body: "这是经理的实时控制层。收件、价格支撑的登记、状态推进、付款记录和日常支出都应在此处毫不混乱地处理。",
    },
    quickLinks: {
      openOperations: "打开运营",
      openExpenses: "打开支出",
      trackingPage: "追踪页面",
      createWalkIn: "创建临时预订",
    },
    metrics: {
      activeBookings: { label: "活跃预订", note: "当前实时工作量" },
      urgentQueue: { label: "紧急队列", note: "需要立即关注" },
      registeredPieces: { label: "已登记件数", note: "价格支撑的物品记录" },
      recordedInflow: { label: "已记录收入", note: "已对应预订记账的款项" },
      pendingExpenses: { label: "待处理支出", note: "等待业主审核" },
    },
    urgentPanel: {
      eyebrow: "优先级",
      title: "紧急预订",
      subtitle: "这些是经理不能忽视的工作。",
      noSlot: "无时段",
      openBooking: "打开预订",
      empty: "目前没有紧急预订。",
    },
    pressurePanel: {
      eyebrow: "经理真相检查",
      title: "运营压力点",
      subtitle: "这些指标帮助经理在隐藏错误演变为公司问题之前及时阻止。",
      missingIntake: {
        label: "缺少收件的衣物预订",
        note: "此处只应标记衣物预订。服务预订单独追踪。",
      },
      approvedExpenses: {
        label: "已批准支出",
        note: "这些费用已在业主审核中获得批准。",
      },
      overallBalance: {
        label: "总体余额",
        flowTemplate: "{inflow} 入 • {outflow} 出",
      },
    },
    dash: "—",
  },
  staffOwner: {
    metadata: {
      title: "业主仪表板 | Henry Onyx Fabric Care",
      description: "业主控制中心,用于预订、财务、安全、评价及全公司运营。",
    },
    hero: {
      eyebrow: "业主指挥中心",
      title: "整个护理运营的主控制台。",
      body: "这是最高层。您可以在此处看到公司的真实状态:紧急情况、收入、支出压力、记录质量、评价健康度和安全。",
    },
    quickLinks: {
      bookings: "预订",
      finance: "财务",
      records: "记录",
      security: "安全",
      settings: "设置",
      reviews: "评价",
      staff: "员工",
      fieldStaff: "现场员工",
      managerExpenses: "经理支出",
      riderExpenses: "骑手支出",
      supportExpenses: "支持支出",
    },
    metrics: {
      activeBookings: { label: "活跃预订", note: "当前运营队列" },
      archivedBookings: { label: "归档预订", note: "超过 30 天" },
      balance: { label: "余额", flowTemplate: "{inflow} 入 • {outflow} 出" },
      reviews: { label: "评价", pendingTemplate: "{count} 待批准" },
    },
    alertsPanel: {
      eyebrow: "智能警报",
      title: "财务和运营异常监控",
      subtitle: "这里是业主在异常压力造成损害之前发现它的地方。",
      empty: "目前没有发现重大异常。",
      expensePressure: {
        title: "支出压力高于收入",
        text: "总支出已超过收入。业主应立即检查审批、高成本活动和可恢复收入。",
      },
      awaitingDecision: {
        title: "支出等待业主决定",
        textTemplate: "{count} 项支出条目仍在记录中,等待批准或作废。",
      },
      refundActivity: {
        title: "检测到异常退款活动",
        textTemplate: "系统中可见与退款相关的近期支出。当前退款压力为 {amount},来自 {count} 项。",
      },
      delayRisk: {
        title: "预订延迟风险正在上升",
        textTemplate: "目前可见 {overdue} 项逾期预订和 {urgent} 项紧急预订。如不迅速处理,可能损害服务信任。",
      },
      strongFlow: {
        title: "近期流量表现强劲",
        textTemplate: "本月实时流入超出流出 {percent},基于近期跟踪活动。保持系统纪律,让增长保持干净。",
      },
    },
    forecastPanel: {
      eyebrow: "预测",
      title: "短期运营预测",
      subtitle: "基于本月跟踪活动的实时运行率估算。",
      monthInflow: "本月流入(实时)",
      monthOutflow: "本月流出(实时)",
      projectedNet: "预计月末净额",
      flowGrowth: "流量增长信号",
      positiveTemplate: "如果当前实时运行率保持,care 可能在本月末以约 {amount} 净额结束。",
      negativeTemplate: "如果当前实时运行率保持,care 可能在本月末以约 {amount} 净额承压结束。",
    },
    urgencyPanel: {
      eyebrow: "紧急",
      title: "需要关注的订单",
      subtitle: "即使经理在管理日常,业主也应立即察觉压力。",
      noPickup: "无取件日期",
      empty: "目前没有紧急预订。",
    },
    brandPanel: {
      eyebrow: "品牌状态",
      title: "实时公司展示",
      subtitle: "公开端当前从设置中拉取的内容。",
      heroBadge: "主徽章",
      supportEmail: "支持邮箱",
      supportPhone: "支持电话",
      pickupHours: "取件时间",
      careDomain: "care 域名",
      hubDomain: "hub 域名",
      notConfigured: "尚未配置",
      openSettings: "打开设置",
    },
    paymentsPanel: {
      eyebrow: "现金流动",
      title: "近期付款",
      subtitle: "快速查看流入。",
      generalPayment: "一般付款",
      empty: "暂无近期付款。",
    },
    expensesPanel: {
      eyebrow: "成本压力",
      title: "近期支出",
      subtitle: "业主应始终了解资金的去向。",
      viewProof: "查看凭证",
      empty: "暂无近期支出。",
    },
    reviewsPanel: {
      eyebrow: "评价健康度",
      title: "近期客户声音",
      subtitle: "强大的服务品牌保护信任,而不仅仅是工作流程。",
      approved: "已批准",
      pending: "待处理",
      photoAltTemplate: "{name} 的评价照片",
      empty: "暂无评价。",
    },
    intelligencePanel: {
      eyebrow: "智能",
      title: "业主接下来应该跟进什么",
      subtitle: "当洞察转化为行动时,公司会变得更有效率。",
      expenseFlags: {
        title: "智能支出预警",
        topTemplate: "近期最高支出类别为 {category},金额 {amount}。",
        emptyText: "尚未看到主要类别压力。",
      },
      delayAlerts: {
        title: "预订延迟警报",
        textTemplate: "活跃的 care 队列中可见 {count} 项逾期预订。",
      },
      forecasting: {
        title: "运营预测",
      },
      approvalDiscipline: {
        title: "审批纪律",
        textTemplate: "{count} 项支出记录目前正在等待业主操作。",
      },
    },
    archivePanel: {
      eyebrow: "归档政策",
      cta: "打开归档感知记录",
    },
    dash: "—",
  },
};

const HI: DeepPartial<CareCopy> = {
  nav: {
    home: "होम",
    book: "बुक करें",
    track: "ट्रैक करें",
    review: "समीक्षा दें",
    account: "खाता",
  },
  hero: {
    title: "हर बार देखभाल जो पहुंचती है।",
    subtitle: "कपड़ों की देखभाल, घर की सफाई और कार्यस्थल की देखभाल, स्पष्ट बुकिंग, स्थिर ट्रैकिंग और शांत सहायता के साथ।",
    ctaBook: "सेवा बुक करें",
    ctaTrack: "बुकिंग ट्रैक करें",
  },
  booking: {
    title: "सेवा बुक करें",
    serviceLabel: "सेवा का प्रकार",
    dateLabel: "पसंदीदा तिथि",
    timeLabel: "पसंदीदा समय",
    nameLabel: "पूरा नाम",
    phoneLabel: "फ़ोन नंबर",
    emailLabel: "ईमेल पता",
    addressLabel: "पिकअप पता",
    notesLabel: "अतिरिक्त नोट्स",
    submitButton: "बुकिंग अनुरोध करें",
    confirmationHeading: "बुकिंग अनुरोध प्राप्त हुआ",
    confirmationBody: "हम जल्द ही आपकी बुकिंग की पुष्टि करेंगे। अपना ट्रैकिंग कोड सुरक्षित रखें।",
    trackingCodeLabel: "आपका ट्रैकिंग कोड",
  },
  tracking: {
    title: "अपनी बुकिंग ट्रैक करें",
    codeLabel: "ट्रैकिंग कोड",
    phoneLabel: "फ़ोन नंबर",
    submitButton: "स्थिति जांचें",
    notFound: "उस कोड और फ़ोन नंबर के लिए कोई बुकिंग नहीं मिली।",
    statusLabel: "वर्तमान स्थिति",
    lastUpdatedLabel: "अंतिम अपडेट",
    estimatedLabel: "अनुमानित समापन",
  },
  status: {
    pending: "लंबित",
    confirmed: "पुष्टि की गई",
    collected: "एकत्र किया गया",
    inProgress: "प्रगति में",
    readyForDelivery: "डिलीवरी के लिए तैयार",
    outForDelivery: "डिलीवरी पर",
    delivered: "डिलीवर किया गया",
    completed: "पूर्ण",
    cancelled: "रद्द",
  },
  review: {
    title: "अपना अनुभव साझा करें",
    ratingLabel: "कुल रेटिंग",
    textLabel: "आपकी समीक्षा",
    photoLabel: "फ़ोटो जोड़ें (वैकल्पिक)",
    submitButton: "समीक्षा सबमिट करें",
    successMessage: "धन्यवाद। आपकी समीक्षा सबमिट की गई है और अनुमोदन की प्रतीक्षा में है।",
    pendingApproval: "अनुमोदन की प्रतीक्षा में",
  },
  serviceTypes: {
    laundry: "लॉन्ड्री",
    drycleaning: "ड्राई क्लीनिंग",
    ironing: "इस्त्री",
    alterations: "बदलाव",
    homeCleaning: "घर की सफाई",
    officeCleaning: "कार्यालय सफाई",
  },
  staffManager: {
    metadata: {
      title: "मैनेजर डैशबोर्ड | Henry Onyx Fabric Care",
      description:
        "इनटेक, लाइव संचालन, आवक और व्यय नियंत्रण के लिए मैनेजर कमांड डैशबोर्ड।",
    },
    hero: {
      eyebrow: "मैनेजर संचालन कक्ष",
      title: "दिन को संभालें। रिकॉर्ड को सच्चा रखें।",
      body: "यह मैनेजर की लाइव नियंत्रण परत है। इनटेक, मूल्य-समर्थित पंजीकरण, स्थिति परिवर्तन, भुगतान कैप्चर और दैनिक व्यय सब कुछ यहीं से बिना भ्रम के संभाला जाना चाहिए।",
    },
    quickLinks: {
      openOperations: "संचालन खोलें",
      openExpenses: "व्यय खोलें",
      trackingPage: "ट्रैकिंग पृष्ठ",
      createWalkIn: "वॉक-इन बुकिंग बनाएँ",
    },
    metrics: {
      activeBookings: { label: "सक्रिय बुकिंग", note: "वर्तमान लाइव कार्यभार" },
      urgentQueue: { label: "अत्यावश्यक कतार", note: "त्वरित ध्यान की आवश्यकता" },
      registeredPieces: { label: "पंजीकृत वस्तुएँ", note: "मूल्य-समर्थित आइटम रिकॉर्ड" },
      recordedInflow: { label: "दर्ज आवक", note: "बुकिंग के विरुद्ध दर्ज धन" },
      pendingExpenses: { label: "लंबित व्यय", note: "मालिक की समीक्षा का इंतज़ार" },
    },
    urgentPanel: {
      eyebrow: "प्राथमिकता",
      title: "अत्यावश्यक बुकिंग",
      subtitle: "ये वे काम हैं जिन्हें मैनेजर को नज़रअंदाज़ नहीं करना चाहिए।",
      noSlot: "कोई स्लॉट नहीं",
      openBooking: "बुकिंग खोलें",
      empty: "अभी कोई अत्यावश्यक बुकिंग नहीं।",
    },
    pressurePanel: {
      eyebrow: "मैनेजर सत्यता जाँच",
      title: "संचालन दबाव बिंदु",
      subtitle: "ये संकेतक मैनेजर को छिपी हुई गलतियों को कंपनी की समस्याओं में बदलने से पहले रोकने में मदद करते हैं।",
      missingIntake: {
        label: "इनटेक से वंचित वस्त्र बुकिंग",
        note: "केवल वस्त्र बुकिंग को यहाँ चिह्नित किया जाना चाहिए। सेवा बुकिंग अलग से ट्रैक की जाती है।",
      },
      approvedExpenses: {
        label: "स्वीकृत व्यय",
        note: "इन लागतों को मालिक की समीक्षा द्वारा पहले ही स्वीकार किया जा चुका है।",
      },
      overallBalance: {
        label: "कुल शेष",
        flowTemplate: "{inflow} आवक • {outflow} जावक",
      },
    },
    dash: "—",
  },
  staffOwner: {
    metadata: {
      title: "मालिक डैशबोर्ड | Henry Onyx Fabric Care",
      description:
        "बुकिंग, वित्त, सुरक्षा, समीक्षा और कंपनी-व्यापी संचालन के लिए मालिक का नियंत्रण कक्ष।",
    },
    hero: {
      eyebrow: "मालिक कमांड सेंटर",
      title: "पूरे केयर ऑपरेशन के लिए मास्टर नियंत्रण।",
      body: "यह सर्वोच्च परत है। आप यहां कंपनी की वास्तविक स्थिति देखते हैं: अत्यावश्यकता, आय, व्यय दबाव, रिकॉर्ड गुणवत्ता, समीक्षा स्वास्थ्य और सुरक्षा।",
    },
    quickLinks: {
      bookings: "बुकिंग",
      finance: "वित्त",
      records: "रिकॉर्ड",
      security: "सुरक्षा",
      settings: "सेटिंग्स",
      reviews: "समीक्षाएं",
      staff: "स्टाफ",
      fieldStaff: "फील्ड स्टाफ",
      managerExpenses: "मैनेजर व्यय",
      riderExpenses: "राइडर व्यय",
      supportExpenses: "सपोर्ट व्यय",
    },
    metrics: {
      activeBookings: { label: "सक्रिय बुकिंग", note: "वर्तमान परिचालन कतार" },
      archivedBookings: { label: "संग्रहित बुकिंग", note: "30 दिनों से पुरानी" },
      balance: { label: "शेष", flowTemplate: "{inflow} आवक • {outflow} जावक" },
      reviews: { label: "समीक्षाएं", pendingTemplate: "{count} स्वीकृति के लिए लंबित" },
    },
    alertsPanel: {
      eyebrow: "स्मार्ट अलर्ट",
      title: "वित्त और संचालन विसंगति निगरानी",
      subtitle: "यहीं मालिक असामान्य दबाव को नुकसान बनने से पहले पकड़ता है।",
      empty: "अभी कोई बड़ी विसंगति दिखाई नहीं दे रही है।",
      expensePressure: {
        title: "व्यय दबाव आय से अधिक है",
        text: "कुल जावक पहले से ही आवक से अधिक है। मालिक को तुरंत अनुमोदन, उच्च-लागत गतिविधि और वसूली योग्य राजस्व की जांच करनी चाहिए।",
      },
      awaitingDecision: {
        title: "मालिक के निर्णय की प्रतीक्षा में व्यय",
        textTemplate: "{count} व्यय प्रविष्टियां अभी भी दर्ज हैं और अनुमोदन या रद्द करने की प्रतीक्षा कर रही हैं।",
      },
      refundActivity: {
        title: "असामान्य रिफंड गतिविधि का पता चला",
        textTemplate: "सिस्टम में हाल के रिफंड-संबंधित व्यय दिखाई दे रहे हैं। वर्तमान रिफंड दबाव {count} आइटम से {amount} है।",
      },
      delayRisk: {
        title: "बुकिंग में देरी का जोखिम बढ़ रहा है",
        textTemplate: "वर्तमान में {overdue} बकाया बुकिंग और {urgent} अत्यावश्यक बुकिंग दिखाई दे रही हैं। यदि शीघ्रता से निपटाया नहीं गया तो यह सेवा विश्वास को नुकसान पहुंचा सकता है।",
      },
      strongFlow: {
        title: "हाल का प्रवाह मजबूत दिखता है",
        textTemplate: "वर्तमान महीने का लाइव आवक हाल की ट्रैक की गई गतिविधि पर जावक से {percent} आगे है। सिस्टम को अनुशासित रखें ताकि विकास साफ रहे।",
      },
    },
    forecastPanel: {
      eyebrow: "पूर्वानुमान",
      title: "लघु-अवधि परिचालन प्रक्षेपण",
      subtitle: "वर्तमान महीने की ट्रैक की गई गतिविधि के आधार पर लाइव रन-रेट अनुमान।",
      monthInflow: "महीने का आवक (लाइव)",
      monthOutflow: "महीने का जावक (लाइव)",
      projectedNet: "अनुमानित महीने का अंत शुद्ध",
      flowGrowth: "प्रवाह वृद्धि संकेत",
      positiveTemplate: "यदि वर्तमान लाइव रन-रेट बना रहता है, तो care महीने को लगभग {amount} शुद्ध के साथ समाप्त कर सकता है।",
      negativeTemplate: "यदि वर्तमान लाइव रन-रेट बना रहता है, तो care महीने को लगभग {amount} शुद्ध के दबाव में समाप्त कर सकता है।",
    },
    urgencyPanel: {
      eyebrow: "अत्यावश्यकता",
      title: "ध्यान की मांग करने वाले ऑर्डर",
      subtitle: "भले ही मैनेजर दिन चला रहा हो, मालिक को तुरंत दबाव महसूस करना चाहिए।",
      noPickup: "कोई पिकअप तिथि नहीं",
      empty: "इस समय कोई अत्यावश्यक बुकिंग नहीं।",
    },
    brandPanel: {
      eyebrow: "ब्रांड स्थिति",
      title: "लाइव कंपनी प्रस्तुति",
      subtitle: "सार्वजनिक पक्ष वर्तमान में सेटिंग्स से क्या खींच रहा है।",
      heroBadge: "हीरो बैज",
      supportEmail: "सपोर्ट ईमेल",
      supportPhone: "सपोर्ट फोन",
      pickupHours: "पिकअप घंटे",
      careDomain: "Care डोमेन",
      hubDomain: "Hub डोमेन",
      notConfigured: "अभी कॉन्फ़िगर नहीं किया गया",
      openSettings: "सेटिंग्स खोलें",
    },
    paymentsPanel: {
      eyebrow: "नकद गतिविधि",
      title: "हाल के भुगतान",
      subtitle: "आवक पर त्वरित नज़र।",
      generalPayment: "सामान्य भुगतान",
      empty: "अभी तक कोई हाल का भुगतान नहीं।",
    },
    expensesPanel: {
      eyebrow: "लागत दबाव",
      title: "हाल के व्यय",
      subtitle: "मालिक को हमेशा पता होना चाहिए कि पैसा कहां जा रहा है।",
      viewProof: "प्रमाण देखें",
      empty: "अभी तक कोई हाल का व्यय नहीं।",
    },
    reviewsPanel: {
      eyebrow: "समीक्षा स्वास्थ्य",
      title: "हाल की ग्राहक आवाज़",
      subtitle: "मजबूत सेवा ब्रांड केवल कार्यप्रवाह की रक्षा नहीं करते — वे विश्वास की रक्षा करते हैं।",
      approved: "स्वीकृत",
      pending: "लंबित",
      photoAltTemplate: "{name} से समीक्षा फोटो",
      empty: "अभी तक कोई समीक्षा उपलब्ध नहीं।",
    },
    intelligencePanel: {
      eyebrow: "बुद्धिमत्ता",
      title: "मालिक को आगे क्या ट्रैक करना चाहिए",
      subtitle: "जब अंतर्दृष्टि कार्रवाई में बदल जाती है तो कंपनी अधिक उत्पादक हो जाती है।",
      expenseFlags: {
        title: "स्मार्ट व्यय रेड फ्लैग",
        topTemplate: "शीर्ष हाल की व्यय श्रेणी {amount} पर {category} है।",
        emptyText: "अभी तक कोई बड़ा श्रेणी दबाव दिखाई नहीं दे रहा है।",
      },
      delayAlerts: {
        title: "बुकिंग में देरी अलर्ट",
        textTemplate: "सक्रिय care कतार में {count} बकाया बुकिंग दिखाई दे रही हैं।",
      },
      forecasting: {
        title: "परिचालन पूर्वानुमान",
      },
      approvalDiscipline: {
        title: "अनुमोदन अनुशासन",
        textTemplate: "{count} व्यय रिकॉर्ड वर्तमान में मालिक की कार्रवाई की प्रतीक्षा कर रहे हैं।",
      },
    },
    archivePanel: {
      eyebrow: "संग्रह नीति",
      cta: "संग्रह-जागरूक रिकॉर्ड खोलें",
    },
    dash: "—",
  },
};

const IT: DeepPartial<CareCopy> = {
  "nav": {
    "home": "Casa",
    "book": "Prenota",
    "track": "Traccia",
    "review": "Lascia una recensione",
    "account": "Conto"
  },
  "hero": {
    "title": "Cura che si manifesta, ogni volta.",
    "subtitle": "Cura dei capi, pulizia della casa e manutenzione del posto di lavoro con prenotazioni più chiare, monitoraggio più costante e supporto più tranquillo.",
    "ctaBook": "Prenota un servizio",
    "ctaTrack": "Tieni traccia di una prenotazione"
  },
  "booking": {
    "title": "Prenota un servizio",
    "serviceLabel": "Tipo di servizio",
    "dateLabel": "Data preferita",
    "timeLabel": "Orario preferito",
    "nameLabel": "Nome completo",
    "phoneLabel": "Numero di telefono",
    "emailLabel": "Indirizzo e-mail",
    "addressLabel": "Indirizzo di ritiro",
    "notesLabel": "Note aggiuntive",
    "submitButton": "Richiedi la prenotazione",
    "confirmationHeading": "Richiesta di prenotazione ricevuta",
    "confirmationBody": "Confermeremo la tua prenotazione a breve. Mantieni il tuo codice di monitoraggio al sicuro.",
    "trackingCodeLabel": "Il tuo codice di monitoraggio"
  },
  "tracking": {
    "title": "Tieni traccia della tua prenotazione",
    "codeLabel": "Codice di monitoraggio",
    "phoneLabel": "Numero di telefono",
    "submitButton": "Controlla lo stato",
    "notFound": "Nessuna prenotazione trovata per quel codice e numero di telefono.",
    "statusLabel": "Stato attuale",
    "lastUpdatedLabel": "Ultimo aggiornamento",
    "estimatedLabel": "Completamento stimato"
  },
  "status": {
    "pending": "In sospeso",
    "confirmed": "Confermato",
    "collected": "Raccolto",
    "inProgress": "In corso",
    "readyForDelivery": "Pronto per la consegna",
    "outForDelivery": "In consegna",
    "delivered": "Consegnato",
    "completed": "Completato",
    "cancelled": "Annullato"
  },
  "review": {
    "title": "Condividi la tua esperienza",
    "ratingLabel": "Valutazione complessiva",
    "textLabel": "La tua recensione",
    "photoLabel": "Aggiungi una foto (facoltativo)",
    "submitButton": "Invia recensione",
    "successMessage": "Grazie. La tua recensione è stata inviata ed è in attesa di approvazione.",
    "pendingApproval": "In attesa di approvazione"
  },
  "serviceTypes": {
    "laundry": "Lavanderia",
    "drycleaning": "Lavaggio a secco",
    "ironing": "Stiratura",
    "alterations": "Alterazioni",
    "homeCleaning": "Pulizia della casa",
    "officeCleaning": "Pulizia dell'ufficio"
  },
  staffManager: {
    metadata: {
      title: "Dashboard del Manager | Henry Onyx Fabric Care",
      description:
        "Dashboard di comando del manager per accettazione, operazioni in tempo reale, entrate e controllo delle spese.",
    },
    hero: {
      eyebrow: "Sala operativa del manager",
      title: "Gestisci la giornata. Mantieni i registri veritieri.",
      body: "Questo è il livello di controllo in tempo reale del manager. Accettazione, registrazione supportata dai prezzi, avanzamento dello stato, registrazione dei pagamenti e spese quotidiane devono essere gestiti tutti da qui senza confusione.",
    },
    quickLinks: {
      openOperations: "Apri operazioni",
      openExpenses: "Apri spese",
      trackingPage: "Pagina di monitoraggio",
      createWalkIn: "Crea prenotazione walk-in",
    },
    metrics: {
      activeBookings: { label: "Prenotazioni attive", note: "Carico di lavoro attuale in tempo reale" },
      urgentQueue: { label: "Coda urgente", note: "Richiede attenzione rapida" },
      registeredPieces: { label: "Pezzi registrati", note: "Registrazioni di articoli supportate dai prezzi" },
      recordedInflow: { label: "Entrate registrate", note: "Denaro registrato sulle prenotazioni" },
      pendingExpenses: { label: "Spese in sospeso", note: "In attesa della revisione del proprietario" },
    },
    urgentPanel: {
      eyebrow: "Priorità",
      title: "Prenotazioni urgenti",
      subtitle: "Questi sono i lavori che il manager non deve ignorare.",
      noSlot: "Nessuno slot",
      openBooking: "Apri prenotazione",
      empty: "Nessuna prenotazione urgente al momento.",
    },
    pressurePanel: {
      eyebrow: "Verifiche di verità del manager",
      title: "Punti di pressione operativi",
      subtitle: "Questi indicatori aiutano il manager a fermare errori nascosti prima che diventino problemi aziendali.",
      missingIntake: {
        label: "Prenotazioni di capi senza accettazione",
        note: "Solo le prenotazioni di capi devono essere segnalate qui. Le prenotazioni di servizio sono tracciate separatamente.",
      },
      approvedExpenses: {
        label: "Spese approvate",
        note: "Questi costi sono già stati accettati nella revisione del proprietario.",
      },
      overallBalance: {
        label: "Saldo complessivo",
        flowTemplate: "{inflow} in entrata • {outflow} in uscita",
      },
    },
    dash: "—",
  },
  staffOwner: {
    metadata: {
      title: "Dashboard proprietario | Henry Onyx Fabric Care",
      description:
        "Sala di controllo del proprietario per prenotazioni, finanza, sicurezza, recensioni e operazioni aziendali.",
    },
    hero: {
      eyebrow: "Centro di comando del proprietario",
      title: "Controllo principale per l'intera operazione di care.",
      body: "Questo è il livello più alto. Qui vedi lo stato reale dell'azienda: urgenza, entrate, pressione delle spese, qualità dei record, salute delle recensioni e sicurezza.",
    },
    quickLinks: {
      bookings: "Prenotazioni",
      finance: "Finanza",
      records: "Record",
      security: "Sicurezza",
      settings: "Impostazioni",
      reviews: "Recensioni",
      staff: "Personale",
      fieldStaff: "Personale sul campo",
      managerExpenses: "Spese del responsabile",
      riderExpenses: "Spese dei corrieri",
      supportExpenses: "Spese del supporto",
    },
    metrics: {
      activeBookings: { label: "Prenotazioni attive", note: "Coda operativa attuale" },
      archivedBookings: { label: "Prenotazioni archiviate", note: "Più vecchie di 30 giorni" },
      balance: { label: "Saldo", flowTemplate: "{inflow} in entrata • {outflow} in uscita" },
      reviews: { label: "Recensioni", pendingTemplate: "{count} in attesa di approvazione" },
    },
    alertsPanel: {
      eyebrow: "Avvisi intelligenti",
      title: "Monitoraggio anomalie finanziarie e operative",
      subtitle: "È qui che il proprietario coglie pressioni insolite prima che diventino danni.",
      empty: "Nessuna anomalia importante visibile al momento.",
      expensePressure: {
        title: "La pressione delle spese supera le entrate",
        text: "L'uscita totale è già superiore all'entrata. Il proprietario dovrebbe verificare immediatamente approvazioni, attività ad alto costo e ricavi recuperabili.",
      },
      awaitingDecision: {
        title: "Spese in attesa della decisione del proprietario",
        textTemplate: "{count} voci di spesa risultano ancora registrate e in attesa di approvazione o annullamento.",
      },
      refundActivity: {
        title: "Rilevata attività di rimborso insolita",
        textTemplate: "Sono visibili nel sistema spese recenti collegate a rimborsi. La pressione attuale dei rimborsi è di {amount} su {count} voce/i.",
      },
      delayRisk: {
        title: "Il rischio di ritardo sulle prenotazioni aumenta",
        textTemplate: "Sono attualmente visibili {overdue} prenotazione/i in ritardo e {urgent} prenotazione/i urgente/i. Questo può danneggiare la fiducia se non gestito rapidamente.",
      },
      strongFlow: {
        title: "Il flusso recente sembra forte",
        textTemplate: "L'entrata live del mese corrente supera l'uscita di {percent} sull'attività recente tracciata. Mantieni il sistema disciplinato perché la crescita resti pulita.",
      },
    },
    forecastPanel: {
      eyebrow: "Previsione",
      title: "Proiezione operativa a breve termine",
      subtitle: "Una stima live del ritmo basata sull'attività tracciata del mese corrente.",
      monthInflow: "Entrata del mese (live)",
      monthOutflow: "Uscita del mese (live)",
      projectedNet: "Netto previsto a fine mese",
      flowGrowth: "Segnale di crescita del flusso",
      positiveTemplate: "Se l'attuale ritmo live tiene, care potrebbe chiudere il mese con circa {amount} netto.",
      negativeTemplate: "Se l'attuale ritmo live tiene, care potrebbe chiudere il mese sotto pressione con circa {amount} netto.",
    },
    urgencyPanel: {
      eyebrow: "Urgenza",
      title: "Ordini che richiedono attenzione",
      subtitle: "Il proprietario dovrebbe percepire la pressione all'istante, anche se il responsabile sta gestendo la giornata.",
      noPickup: "Nessuna data di ritiro",
      empty: "Nessuna prenotazione urgente al momento.",
    },
    brandPanel: {
      eyebrow: "Stato del marchio",
      title: "Presentazione live dell'azienda",
      subtitle: "Ciò che la parte pubblica sta attualmente estraendo dalle impostazioni.",
      heroBadge: "Distintivo principale",
      supportEmail: "Email di supporto",
      supportPhone: "Telefono di supporto",
      pickupHours: "Orari di ritiro",
      careDomain: "Dominio care",
      hubDomain: "Dominio hub",
      notConfigured: "Non ancora configurato",
      openSettings: "Apri impostazioni",
    },
    paymentsPanel: {
      eyebrow: "Movimento di cassa",
      title: "Pagamenti recenti",
      subtitle: "Lettura rapida delle entrate.",
      generalPayment: "Pagamento generale",
      empty: "Ancora nessun pagamento recente.",
    },
    expensesPanel: {
      eyebrow: "Pressione dei costi",
      title: "Spese recenti",
      subtitle: "Il proprietario dovrebbe sempre sapere dove va il denaro.",
      viewProof: "Visualizza prova",
      empty: "Ancora nessuna spesa recente.",
    },
    reviewsPanel: {
      eyebrow: "Salute delle recensioni",
      title: "Voce recente del cliente",
      subtitle: "I marchi di servizio forti proteggono la fiducia, non solo il flusso di lavoro.",
      approved: "approvato",
      pending: "in attesa",
      photoAltTemplate: "Foto recensione da {name}",
      empty: "Ancora nessuna recensione disponibile.",
    },
    intelligencePanel: {
      eyebrow: "Intelligenza",
      title: "Cosa il proprietario dovrebbe monitorare in seguito",
      subtitle: "L'azienda diventa più produttiva quando l'analisi si trasforma in azione.",
      expenseFlags: {
        title: "Segnali rossi intelligenti sulle spese",
        topTemplate: "La principale categoria di spesa recente è {category} con {amount}.",
        emptyText: "Ancora nessuna pressione di categoria importante visibile.",
      },
      delayAlerts: {
        title: "Avvisi di ritardo sulle prenotazioni",
        textTemplate: "{count} prenotazione/i in ritardo sono visibili nella coda care attiva.",
      },
      forecasting: {
        title: "Previsione operativa",
      },
      approvalDiscipline: {
        title: "Disciplina di approvazione",
        textTemplate: "{count} record di spesa sono attualmente in attesa dell'azione del proprietario.",
      },
    },
    archivePanel: {
      eyebrow: "Politica di archiviazione",
      cta: "Apri record con archivio",
    },
    dash: "—",
  },
};

const LOCALE_OVERRIDES: Partial<Record<AppLocale, DeepPartial<CareCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  ar: AR,
  ig: IG,
  yo: YO,
  ha: HA,
  de: DE,
  it: IT,
  zh: ZH,
  hi: HI,
};

export function getCareCopy(locale: AppLocale): CareCopy {
  const overrides = LOCALE_OVERRIDES[locale];
  if (overrides) {
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as CareCopy;
  }
  return EN;
}
