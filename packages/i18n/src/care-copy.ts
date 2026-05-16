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
      title: "Manager Dashboard | Henry & Co. Fabric Care",
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
      title: "Owner Dashboard | Henry & Co. Fabric Care",
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
      title: "Tableau de bord du responsable | Henry & Co. Fabric Care",
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
    dash: "—",
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
      title: "Panel del gerente | Henry & Co. Fabric Care",
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
      title: "Painel do gerente | Henry & Co. Fabric Care",
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
      title: "لوحة قيادة المدير | Henry & Co. Fabric Care",
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
      title: "Dashboard Onye Nlekọta | Henry & Co. Fabric Care",
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
      title: "Pẹpẹ Onítọ́jú | Henry & Co. Fabric Care",
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
      title: "Dashbod na Manaja | Henry & Co. Fabric Care",
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
      title: "Manager-Dashboard | Henry & Co. Fabric Care",
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
      title: "经理仪表板 | Henry & Co. Fabric Care",
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
      title: "मैनेजर डैशबोर्ड | Henry & Co. Fabric Care",
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
      title: "Dashboard del Manager | Henry & Co. Fabric Care",
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
