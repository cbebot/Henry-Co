import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

export type JobsCopy = {
  nav: {
    browse: string;
    post: string;
    applications: string;
    account: string;
  };
  hero: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    ctaBrowse: string;
    ctaHire: string;
  };
  filters: {
    allRoles: string;
    fullTime: string;
    partTime: string;
    contract: string;
    remote: string;
    onsite: string;
    hybrid: string;
    location: string;
    salary: string;
    experience: string;
    clearAll: string;
  };
  listing: {
    applyNow: string;
    saveJob: string;
    shareJob: string;
    postedAgo: string;
    deadline: string;
    salary: string;
    jobType: string;
    location: string;
    experience: string;
    skills: string;
    aboutRole: string;
    aboutCompany: string;
    viewCompany: string;
  };
  application: {
    title: string;
    resume: string;
    coverLetter: string;
    submit: string;
    submitted: string;
    underReview: string;
    shortlisted: string;
    rejected: string;
    offerMade: string;
  };
  hiring: {
    postJob: string;
    managePostings: string;
    reviewApplications: string;
    closePosting: string;
    editPosting: string;
  };
  empty: {
    noJobs: string;
    noApplications: string;
    noPostings: string;
  };
  // V3 PASS 21 — interview room + verification + offer-letter labels.
  interviewRoom: {
    kicker: string;
    candidateFallback: string;
    employerFallback: string;
    minutes: string;
    iframeTitle: string;
    placeholder: string;
    tabChat: string;
    tabNotes: string;
    chatHint: string;
    notesLabel: string;
    notesPlaceholder: string;
    notesSaving: string;
    notesSavedAt: string;
    notesAutosave: string;
    notesSaveError: string;
  };
  verification: {
    skillTitle: string;
    skillSubtitle: string;
    experienceTitle: string;
    experienceSubtitle: string;
    referenceTitle: string;
    referenceSubtitle: string;
    badgeVerified: string;
    badgePending: string;
    badgeRejected: string;
  };
  offerLetter: {
    title: string;
    subtitle: string;
    statusDraft: string;
    statusSent: string;
    statusSigned: string;
    statusExpired: string;
    statusDeclined: string;
    signCta: string;
    typedFallbackTitle: string;
    typedFallbackPrompt: string;
  };
  salary: {
    rangeLabel: string;
    benchmarkLabel: string;
    p25Label: string;
    p50Label: string;
    p75Label: string;
    sampleLabel: string;
    sourceLabel: string;
    discloseRequiredError: string;
  };
  profileBuilder: {
    sectionBasics: string;
    sectionExperience: string;
    sectionEducation: string;
    sectionSkills: string;
    sectionPortfolio: string;
    fullName: string;
    headline: string;
    summary: string;
    location: string;
    phone: string;
    email: string;
    saving: string;
    savedAt: string;
    autosaveHint: string;
    saveError: string;
    addCta: string;
    rolePlaceholder: string;
    companyPlaceholder: string;
    descriptionPlaceholder: string;
    skillsAddPlaceholder: string;
    removeCta: string;
    removeSkillAria: string;
  };
  candidateProfile: {
    pageTitle: string;
    pageSubtitle: string;
    rightRailTrustTitle: string;
    rightRailVerificationKicker: string;
    rightRailDefaultReadiness: string;
    rightRailOpenVerification: string;
    rightRailDocumentsTitle: string;
    rightRailDocumentsCountSingular: string;
    rightRailDocumentsCountPlural: string;
    rightRailDocumentsHint: string;
    statusVerified: string;
    statusPending: string;
    statusRejected: string;
    statusUnverified: string;
    savedNoticeTitle: string;
    savedNoticeBody: string;
    draftSectionTitle: string;
    draftSectionBody: string;
    editSectionTitle: string;
    editSectionBody: string;
    fieldFullNamePlaceholder: string;
    fieldHeadlinePlaceholder: string;
    fieldSummaryPlaceholder: string;
    fieldLocationPlaceholder: string;
    fieldTimezonePlaceholder: string;
    fieldWorkModesPlaceholder: string;
    fieldRoleTypesPlaceholder: string;
    fieldPreferredFunctionsPlaceholder: string;
    fieldSkillsPlaceholder: string;
    fieldPortfolioLinksPlaceholder: string;
    fieldSalaryExpectationPlaceholder: string;
    fieldAvailabilityPlaceholder: string;
    fieldWorkHistoryPlaceholder: string;
    fieldEducationPlaceholder: string;
    fieldCertificationsPlaceholder: string;
    submitSaving: string;
    submitLabel: string;
  };
  employerHiring: {
    pageTitle: string;
    pageSubtitle: string;
    sectionTitle: string;
    sectionBody: string;
    emptyMessage: string;
    applicantSingular: string;
    applicantPlural: string;
    statusActive: string;
    statusPaused: string;
    statusClosed: string;
  };
  employerCompany: {
    pageTitle: string;
    pageSubtitle: string;
    rightRailVerificationTitle: string;
    rightRailStatusLabel: string;
    rightRailStatusPending: string;
    rightRailStatusPendingCapitalized: string;
    rightRailOpenRoleSingular: string;
    rightRailOpenRolePlural: string;
    rightRailResponseSlaTemplate: string;
    rightRailEmptyProfileBody: string;
    rightRailTipsTitle: string;
    rightRailTipDescription: string;
    rightRailTipPolicies: string;
    rightRailTipVerified: string;
    profileSavedNoticeTitle: string;
    profileSavedNoticeBodyTemplate: string;
    verificationCalloutBodySuffix: string;
    openAccountVerification: string;
    sectionTitle: string;
    sectionBody: string;
    fieldNamePlaceholder: string;
    fieldSlugPlaceholder: string;
    fieldTaglinePlaceholder: string;
    fieldDescriptionPlaceholder: string;
    fieldWebsitePlaceholder: string;
    fieldIndustryPlaceholder: string;
    fieldLocationsPlaceholder: string;
    fieldHeadcountPlaceholder: string;
    fieldRemotePolicyPlaceholder: string;
    fieldBenefitsHeadlinePlaceholder: string;
    fieldCulturePointsPlaceholder: string;
    employerTypeExternal: string;
    employerTypeInternal: string;
    submitSaving: string;
    submitLabel: string;
  };
  employerJobs: {
    pageTitle: string;
    pageSubtitle: string;
    sectionTitle: string;
    postRoleCta: string;
    emptyKicker: string;
    emptyTitle: string;
    emptyBody: string;
    emptyAction: string;
    applicantSingular: string;
    applicantPlural: string;
    roleLineTemplate: string;
    statusApproved: string;
    statusPendingReview: string;
    statusFlagged: string;
    statusDraft: string;
  };
  employerApplicants: {
    pageTitle: string;
    pageSubtitle: string;
    sectionTitle: string;
    tableCandidate: string;
    tableRole: string;
    tableStage: string;
    tableProfile: string;
    tableMatch: string;
    noEmail: string;
    emptyKicker: string;
    emptyTitle: string;
    emptyBody: string;
    stageReviewing: string;
    stageShortlisted: string;
    stageInterview: string;
    stageOffer: string;
    stageHired: string;
    stageRejected: string;
    detailTitle: string;
    detailSubtitle: string;
    detailJobTemplate: string;
    profileStrengthTemplate: string;
    matchConfidenceTemplate: string;
    noCoverNote: string;
    noticeStageUpdatedTitle: string;
    noticeStageUpdatedBody: string;
    noticeNoteAddedTitle: string;
    noticeNoteAddedBody: string;
    stageSectionTitle: string;
    stageNotePlaceholder: string;
    stagePending: string;
    stageSubmit: string;
    noteSectionTitle: string;
    notePlaceholder: string;
    notePending: string;
    noteSubmit: string;
    activitySectionTitle: string;
    activityEmptyKicker: string;
    activityEmptyTitle: string;
    activityEmptyBody: string;
  };
};

const EN: JobsCopy = {
  nav: {
    browse: "Browse jobs",
    post: "Post a job",
    applications: "Applications",
    account: "Account",
  },
  hero: {
    title: "Hiring, verified talent, without the usual noise.",
    subtitle: "Find focused roles from employers who are serious about who they bring in.",
    searchPlaceholder: "Role, skill, or company",
    ctaBrowse: "Browse open jobs",
    ctaHire: "I'm hiring",
  },
  filters: {
    allRoles: "All roles",
    fullTime: "Full-time",
    partTime: "Part-time",
    contract: "Contract",
    remote: "Remote",
    onsite: "On-site",
    hybrid: "Hybrid",
    location: "Location",
    salary: "Salary",
    experience: "Experience",
    clearAll: "Clear all",
  },
  listing: {
    applyNow: "Apply now",
    saveJob: "Save job",
    shareJob: "Share",
    postedAgo: "Posted",
    deadline: "Application deadline",
    salary: "Salary",
    jobType: "Job type",
    location: "Location",
    experience: "Experience required",
    skills: "Skills",
    aboutRole: "About the role",
    aboutCompany: "About the company",
    viewCompany: "View company",
  },
  application: {
    title: "Apply for this role",
    resume: "Resume / CV",
    coverLetter: "Cover letter",
    submit: "Submit application",
    submitted: "Application submitted",
    underReview: "Under review",
    shortlisted: "Shortlisted",
    rejected: "Not progressing",
    offerMade: "Offer made",
  },
  hiring: {
    postJob: "Post a job",
    managePostings: "Manage postings",
    reviewApplications: "Review applications",
    closePosting: "Close posting",
    editPosting: "Edit posting",
  },
  empty: {
    noJobs: "No matching jobs found. Try adjusting your filters.",
    noApplications: "No applications yet.",
    noPostings: "No active job postings.",
  },
  interviewRoom: {
    kicker: "Interview room",
    candidateFallback: "Candidate",
    employerFallback: "Hiring team",
    minutes: "min",
    iframeTitle: "Video interview room",
    placeholder:
      "Room provisioning is pending. Your interviewer will share a meeting link in chat shortly.",
    tabChat: "Chat",
    tabNotes: "Notes",
    chatHint:
      "In-room chat is provided by the video provider. Use it to share links during the call.",
    notesLabel: "Private notes",
    notesPlaceholder:
      "Capture observations. Visible to your hiring team only.",
    notesSaving: "Saving…",
    notesSavedAt: "Saved",
    notesAutosave: "Auto-saves every 30s",
    notesSaveError: "Couldn't save notes.",
  },
  verification: {
    skillTitle: "Verified skills",
    skillSubtitle: "Skills employers can trust at a glance.",
    experienceTitle: "Verified experience",
    experienceSubtitle: "Confirmed roles and tenure.",
    referenceTitle: "Reference checks",
    referenceSubtitle: "Responses captured from your professional references.",
    badgeVerified: "Verified",
    badgePending: "Pending",
    badgeRejected: "Not verified",
  },
  offerLetter: {
    title: "Offer letter",
    subtitle: "Review your offer and sign when ready.",
    statusDraft: "Draft",
    statusSent: "Awaiting your signature",
    statusSigned: "Signed",
    statusExpired: "Expired",
    statusDeclined: "Declined",
    signCta: "Open signature room",
    typedFallbackTitle: "Confirm acceptance",
    typedFallbackPrompt:
      "Type your full name to acknowledge this offer. A signed PDF is kept in your files.",
  },
  salary: {
    rangeLabel: "Posted range",
    benchmarkLabel: "Market benchmark",
    p25Label: "25th percentile",
    p50Label: "Median",
    p75Label: "75th percentile",
    sampleLabel: "Sample size",
    sourceLabel: "Source",
    discloseRequiredError:
      "Salary disclosure is required. Provide a numeric range or a concrete label.",
  },
  profileBuilder: {
    sectionBasics: "Basics",
    sectionExperience: "Experience",
    sectionEducation: "Education",
    sectionSkills: "Skills",
    sectionPortfolio: "Portfolio",
    fullName: "Full name",
    headline: "Headline",
    summary: "Summary",
    location: "Location",
    phone: "Phone",
    email: "Email",
    saving: "Saving…",
    savedAt: "Saved",
    autosaveHint: "Auto-saves every 30s and on blur",
    saveError: "Couldn't save your draft.",
    addCta: "+ Add",
    rolePlaceholder: "Role",
    companyPlaceholder: "Company",
    descriptionPlaceholder: "Describe your contributions",
    skillsAddPlaceholder: "Press Enter to add",
    removeCta: "Remove",
    removeSkillAria: "Remove skill",
  },
  candidateProfile: {
    pageTitle: "Candidate Profile",
    pageSubtitle: "Keep your profile complete so employers can see the best version of you.",
    rightRailTrustTitle: "Profile trust",
    rightRailVerificationKicker: "Verification",
    rightRailDefaultReadiness:
      "Complete your profile to improve how employers see your applications.",
    rightRailOpenVerification: "Open account verification",
    rightRailDocumentsTitle: "Documents",
    rightRailDocumentsCountSingular: "{count} file uploaded to your profile.",
    rightRailDocumentsCountPlural: "{count} files uploaded to your profile.",
    rightRailDocumentsHint:
      "Skills, work history, and portfolio links help employers evaluate your applications.",
    statusVerified: "Verified",
    statusPending: "Pending",
    statusRejected: "Rejected",
    statusUnverified: "Unverified",
    savedNoticeTitle: "Profile saved",
    savedNoticeBody:
      "Your profile has been updated. Changes are visible to employers when you apply.",
    draftSectionTitle: "Profile draft",
    draftSectionBody:
      "Work-in-progress changes auto-save every 30 seconds and on blur. Press 'Save profile' below to publish.",
    editSectionTitle: "Edit your profile",
    editSectionBody:
      "Professional details here are visible to employers when you apply to roles. Phone and email are held by HenryCo for verification and trust scoring only — they are not passed to employers.",
    fieldFullNamePlaceholder: "Full name",
    fieldHeadlinePlaceholder: "Headline",
    fieldSummaryPlaceholder: "Professional summary",
    fieldLocationPlaceholder: "Location",
    fieldTimezonePlaceholder: "Timezone",
    fieldWorkModesPlaceholder: "remote, hybrid, onsite",
    fieldRoleTypesPlaceholder: "full-time, contract",
    fieldPreferredFunctionsPlaceholder: "Product, Operations, Marketing",
    fieldSkillsPlaceholder: "Skills",
    fieldPortfolioLinksPlaceholder: "Portfolio links",
    fieldSalaryExpectationPlaceholder: "Salary expectation",
    fieldAvailabilityPlaceholder: "Availability",
    fieldWorkHistoryPlaceholder: '[{"company":"HenryCo","title":"Operations Lead"}]',
    fieldEducationPlaceholder: '[{"school":"University","degree":"BSc"}]',
    fieldCertificationsPlaceholder: '[{"name":"Project Management"}]',
    submitSaving: "Saving profile...",
    submitLabel: "Save candidate profile",
  },
  employerHiring: {
    pageTitle: "Hiring Pipelines",
    pageSubtitle:
      "Manage your active hiring pipelines, communicate with candidates, and schedule interviews from one workspace.",
    sectionTitle: "All pipelines",
    sectionBody:
      "Each pipeline corresponds to a live or past role. Open a pipeline to review applicants, conversations, and interviews.",
    emptyMessage:
      "No hiring pipelines yet. Pipelines are created automatically when you publish a role.",
    applicantSingular: "applicant",
    applicantPlural: "applicants",
    statusActive: "Active",
    statusPaused: "Paused",
    statusClosed: "Closed",
  },
  employerCompany: {
    pageTitle: "Company Profile",
    pageSubtitle: "Set up your company profile so candidates can learn about your team.",
    rightRailVerificationTitle: "Verification status",
    rightRailStatusLabel: "Status",
    rightRailStatusPending: "pending",
    rightRailStatusPendingCapitalized: "Pending",
    rightRailOpenRoleSingular: "open role",
    rightRailOpenRolePlural: "open roles",
    rightRailResponseSlaTemplate: "{count} {roleLabel}. You aim to respond to candidates within {hours} hours.",
    rightRailEmptyProfileBody:
      "Create your company profile to begin the verification process and set up your public employer page.",
    rightRailTipsTitle: "Tips for a strong profile",
    rightRailTipDescription: "A clear public description of the team and hiring intent.",
    rightRailTipPolicies: "Working policies, locations, and culture points that remove ambiguity.",
    rightRailTipVerified: "A verified surface that recruiters and candidates can trust.",
    profileSavedNoticeTitle: "Employer profile saved",
    profileSavedNoticeBodyTemplate:
      "{name} has been saved. Your company profile is now in the verification queue.",
    verificationCalloutBodySuffix:
      "Complete account verification before expecting role posting or employer trust upgrades to unlock.",
    openAccountVerification: "Open account verification",
    sectionTitle: "Company details",
    sectionBody:
      "This information appears on your public employer page and helps candidates evaluate your company.",
    fieldNamePlaceholder: "Company name",
    fieldSlugPlaceholder: "company-slug",
    fieldTaglinePlaceholder: "Tagline",
    fieldDescriptionPlaceholder: "Employer description",
    fieldWebsitePlaceholder: "Website",
    fieldIndustryPlaceholder: "Industry",
    fieldLocationsPlaceholder: "Lagos, Abuja, Remote",
    fieldHeadcountPlaceholder: "Headcount",
    fieldRemotePolicyPlaceholder: "Remote policy",
    fieldBenefitsHeadlinePlaceholder: "Benefits headline",
    fieldCulturePointsPlaceholder: "Culture points",
    employerTypeExternal: "External employer",
    employerTypeInternal: "Internal HenryCo hiring",
    submitSaving: "Saving company...",
    submitLabel: "Save employer profile",
  },
  employerJobs: {
    pageTitle: "Employer Jobs",
    pageSubtitle: "Manage your job postings and track applicants.",
    sectionTitle: "Posted roles",
    postRoleCta: "Post role",
    emptyKicker: "No live roles",
    emptyTitle: "Post the first role for this employer.",
    emptyBody:
      "Once a role is created, this list will track moderation state, visibility, and applicant volume.",
    emptyAction: "Open job builder",
    applicantSingular: "applicant",
    applicantPlural: "applicants",
    roleLineTemplate: "{location} · {count} {applicantLabel}",
    statusApproved: "Approved",
    statusPendingReview: "Pending review",
    statusFlagged: "Flagged",
    statusDraft: "Draft",
  },
  employerApplicants: {
    pageTitle: "Applicants",
    pageSubtitle: "Review and move real applicants across your employer pipeline.",
    sectionTitle: "Applicant table",
    tableCandidate: "Candidate",
    tableRole: "Role",
    tableStage: "Stage",
    tableProfile: "Profile",
    tableMatch: "Match",
    noEmail: "No email",
    emptyKicker: "Pipeline is clear",
    emptyTitle: "No applications are in this queue yet.",
    emptyBody:
      "New candidates will appear here as soon as roles start receiving live applications.",
    stageReviewing: "Reviewing",
    stageShortlisted: "Shortlisted",
    stageInterview: "Interview",
    stageOffer: "Offer",
    stageHired: "Hired",
    stageRejected: "Rejected",
    detailTitle: "Applicant Detail",
    detailSubtitle: "Review this candidate, move them through stages, and add notes.",
    detailJobTemplate: "{jobTitle} · {employerName}",
    profileStrengthTemplate: "Profile strength {percent}%",
    matchConfidenceTemplate: "Match confidence {percent}%",
    noCoverNote: "No cover note provided.",
    noticeStageUpdatedTitle: "Stage updated",
    noticeStageUpdatedBody:
      "The candidate's stage has been updated. They'll see the change in their candidate hub.",
    noticeNoteAddedTitle: "Note added",
    noticeNoteAddedBody: "Your note has been saved to this application.",
    stageSectionTitle: "Update stage",
    stageNotePlaceholder: "Context for the move",
    stagePending: "Updating stage...",
    stageSubmit: "Update stage",
    noteSectionTitle: "Internal note",
    notePlaceholder: "Add a private note about this candidate",
    notePending: "Saving note...",
    noteSubmit: "Add note",
    activitySectionTitle: "Activity history",
    activityEmptyKicker: "No activity yet",
    activityEmptyTitle: "No events recorded for this application.",
    activityEmptyBody:
      "Stage changes, notes, and key updates will appear here as you work through the hiring process.",
  },
};

const FR: DeepPartial<JobsCopy> = {
  nav: {
    browse: "Parcourir les offres",
    post: "Publier une offre",
    applications: "Candidatures",
    account: "Compte",
  },
  hero: {
    title: "Recrutement de talents vérifiés, sans le bruit habituel.",
    subtitle: "Trouvez des postes ciblés auprès d'employeurs sérieux dans leur recrutement.",
    searchPlaceholder: "Poste, compétence ou entreprise",
    ctaBrowse: "Voir les offres",
    ctaHire: "Je recrute",
  },
  filters: {
    allRoles: "Tous les postes",
    fullTime: "Temps plein",
    partTime: "Temps partiel",
    contract: "Contrat",
    remote: "Télétravail",
    onsite: "Sur site",
    hybrid: "Hybride",
    location: "Lieu",
    salary: "Salaire",
    experience: "Expérience",
    clearAll: "Tout effacer",
  },
  listing: {
    applyNow: "Postuler",
    saveJob: "Sauvegarder",
    shareJob: "Partager",
    postedAgo: "Publié",
    deadline: "Date limite de candidature",
    salary: "Salaire",
    jobType: "Type de contrat",
    location: "Lieu",
    experience: "Expérience requise",
    skills: "Compétences",
    aboutRole: "À propos du poste",
    aboutCompany: "À propos de l'entreprise",
    viewCompany: "Voir l'entreprise",
  },
  application: {
    title: "Postuler à ce poste",
    resume: "CV",
    coverLetter: "Lettre de motivation",
    submit: "Envoyer la candidature",
    submitted: "Candidature envoyée",
    underReview: "En cours d'examen",
    shortlisted: "Présélectionné",
    rejected: "Non retenu",
    offerMade: "Offre proposée",
  },
  hiring: {
    postJob: "Publier une offre",
    managePostings: "Gérer les offres",
    reviewApplications: "Examiner les candidatures",
    closePosting: "Clôturer l'offre",
    editPosting: "Modifier l'offre",
  },
  empty: {
    noJobs: "Aucun poste trouvé. Ajustez vos filtres.",
    noApplications: "Pas encore de candidatures.",
    noPostings: "Aucune offre active.",
  },
  employerHiring: {
    pageTitle: "Pipelines de recrutement",
    pageSubtitle:
      "Gérez vos pipelines de recrutement actifs, communiquez avec les candidats et planifiez les entretiens depuis un seul espace.",
    sectionTitle: "Tous les pipelines",
    sectionBody:
      "Chaque pipeline correspond à un poste actif ou passé. Ouvrez-en un pour consulter les candidats, les échanges et les entretiens.",
    emptyMessage:
      "Aucun pipeline de recrutement pour l'instant. Les pipelines sont créés automatiquement lorsque vous publiez un poste.",
    applicantSingular: "candidat",
    applicantPlural: "candidats",
    statusActive: "Actif",
    statusPaused: "En pause",
    statusClosed: "Clôturé",
  },
  employerCompany: {
    pageTitle: "Profil de l'entreprise",
    pageSubtitle:
      "Configurez le profil de votre entreprise pour que les candidats puissent en savoir plus sur votre équipe.",
    rightRailVerificationTitle: "Statut de vérification",
    rightRailStatusLabel: "Statut",
    rightRailStatusPending: "en attente",
    rightRailStatusPendingCapitalized: "En attente",
    rightRailOpenRoleSingular: "poste ouvert",
    rightRailOpenRolePlural: "postes ouverts",
    rightRailResponseSlaTemplate:
      "{count} {roleLabel}. Vous visez à répondre aux candidats sous {hours} heures.",
    rightRailEmptyProfileBody:
      "Créez le profil de votre entreprise pour lancer le processus de vérification et configurer votre page employeur publique.",
    rightRailTipsTitle: "Conseils pour un profil solide",
    rightRailTipDescription:
      "Une description publique claire de l'équipe et de l'intention de recrutement.",
    rightRailTipPolicies:
      "Politiques de travail, lieux et éléments de culture qui lèvent toute ambiguïté.",
    rightRailTipVerified:
      "Une présence vérifiée à laquelle recruteurs et candidats peuvent faire confiance.",
    profileSavedNoticeTitle: "Profil employeur enregistré",
    profileSavedNoticeBodyTemplate:
      "{name} a été enregistré. Le profil de votre entreprise est désormais dans la file de vérification.",
    verificationCalloutBodySuffix:
      "Terminez la vérification du compte avant d'attendre la publication d'offres ou des améliorations de confiance employeur.",
    openAccountVerification: "Ouvrir la vérification du compte",
    sectionTitle: "Détails de l'entreprise",
    sectionBody:
      "Ces informations apparaissent sur votre page employeur publique et aident les candidats à évaluer votre entreprise.",
    fieldNamePlaceholder: "Nom de l'entreprise",
    fieldSlugPlaceholder: "slug-entreprise",
    fieldTaglinePlaceholder: "Slogan",
    fieldDescriptionPlaceholder: "Description de l'employeur",
    fieldWebsitePlaceholder: "Site web",
    fieldIndustryPlaceholder: "Secteur",
    fieldLocationsPlaceholder: "Lagos, Abuja, Télétravail",
    fieldHeadcountPlaceholder: "Effectif",
    fieldRemotePolicyPlaceholder: "Politique de télétravail",
    fieldBenefitsHeadlinePlaceholder: "Avantages clés",
    fieldCulturePointsPlaceholder: "Éléments de culture",
    employerTypeExternal: "Employeur externe",
    employerTypeInternal: "Recrutement interne HenryCo",
    submitSaving: "Enregistrement de l'entreprise...",
    submitLabel: "Enregistrer le profil employeur",
  },
  profileBuilder: {
    sectionBasics: "Informations de base",
    sectionExperience: "Expérience",
    sectionEducation: "Formation",
    sectionSkills: "Compétences",
    sectionPortfolio: "Portfolio",
    fullName: "Nom complet",
    headline: "Titre professionnel",
    summary: "Résumé",
    location: "Lieu",
    phone: "Téléphone",
    email: "E-mail",
    saving: "Enregistrement…",
    savedAt: "Enregistré",
    autosaveHint: "Enregistrement automatique toutes les 30 s et à la perte de focus",
    saveError: "Impossible d'enregistrer votre brouillon.",
    addCta: "+ Ajouter",
    rolePlaceholder: "Poste",
    companyPlaceholder: "Entreprise",
    descriptionPlaceholder: "Décrivez vos contributions",
    skillsAddPlaceholder: "Appuyez sur Entrée pour ajouter",
    removeCta: "Supprimer",
    removeSkillAria: "Supprimer la compétence",
  },
  candidateProfile: {
    pageTitle: "Profil du candidat",
    pageSubtitle:
      "Gardez votre profil complet pour que les employeurs voient le meilleur de vous.",
    rightRailTrustTitle: "Confiance du profil",
    rightRailVerificationKicker: "Vérification",
    rightRailDefaultReadiness:
      "Complétez votre profil pour améliorer la perception de vos candidatures par les employeurs.",
    rightRailOpenVerification: "Ouvrir la vérification du compte",
    rightRailDocumentsTitle: "Documents",
    rightRailDocumentsCountSingular: "{count} fichier téléversé sur votre profil.",
    rightRailDocumentsCountPlural: "{count} fichiers téléversés sur votre profil.",
    rightRailDocumentsHint:
      "Les compétences, l'historique professionnel et les liens du portfolio aident les employeurs à évaluer vos candidatures.",
    statusVerified: "Vérifié",
    statusPending: "En attente",
    statusRejected: "Refusé",
    statusUnverified: "Non vérifié",
    savedNoticeTitle: "Profil enregistré",
    savedNoticeBody:
      "Votre profil a été mis à jour. Les modifications sont visibles par les employeurs lors de vos candidatures.",
    draftSectionTitle: "Brouillon du profil",
    draftSectionBody:
      "Les changements en cours s'enregistrent automatiquement toutes les 30 secondes et à la perte de focus. Cliquez sur « Enregistrer le profil » ci-dessous pour publier.",
    editSectionTitle: "Modifier votre profil",
    editSectionBody:
      "Les informations professionnelles ici sont visibles par les employeurs lors de vos candidatures. Le téléphone et l'e-mail sont conservés par HenryCo pour la vérification et la notation de confiance uniquement — ils ne sont pas transmis aux employeurs.",
    fieldFullNamePlaceholder: "Nom complet",
    fieldHeadlinePlaceholder: "Titre professionnel",
    fieldSummaryPlaceholder: "Résumé professionnel",
    fieldLocationPlaceholder: "Lieu",
    fieldTimezonePlaceholder: "Fuseau horaire",
    fieldWorkModesPlaceholder: "télétravail, hybride, sur site",
    fieldRoleTypesPlaceholder: "temps plein, contrat",
    fieldPreferredFunctionsPlaceholder: "Produit, Opérations, Marketing",
    fieldSkillsPlaceholder: "Compétences",
    fieldPortfolioLinksPlaceholder: "Liens du portfolio",
    fieldSalaryExpectationPlaceholder: "Prétentions salariales",
    fieldAvailabilityPlaceholder: "Disponibilité",
    fieldWorkHistoryPlaceholder: '[{"company":"HenryCo","title":"Responsable des opérations"}]',
    fieldEducationPlaceholder: '[{"school":"Université","degree":"Licence"}]',
    fieldCertificationsPlaceholder: '[{"name":"Gestion de projet"}]',
    submitSaving: "Enregistrement du profil...",
    submitLabel: "Enregistrer le profil du candidat",
  },
  employerJobs: {
    pageTitle: "Offres employeur",
    pageSubtitle: "Gérez vos offres d'emploi et suivez les candidatures.",
    sectionTitle: "Offres publiées",
    postRoleCta: "Publier un poste",
    emptyKicker: "Aucun poste actif",
    emptyTitle: "Publiez le premier poste pour cet employeur.",
    emptyBody:
      "Dès qu'un poste est créé, cette liste suit son état de modération, sa visibilité et le volume de candidatures.",
    emptyAction: "Ouvrir l'éditeur d'offre",
    applicantSingular: "candidat",
    applicantPlural: "candidats",
    roleLineTemplate: "{location} · {count} {applicantLabel}",
    statusApproved: "Approuvé",
    statusPendingReview: "En cours d'examen",
    statusFlagged: "Signalé",
    statusDraft: "Brouillon",
  },
  employerApplicants: {
    pageTitle: "Candidats",
    pageSubtitle: "Examinez et déplacez les candidats réels dans votre pipeline employeur.",
    sectionTitle: "Tableau des candidats",
    tableCandidate: "Candidat",
    tableRole: "Poste",
    tableStage: "Étape",
    tableProfile: "Profil",
    tableMatch: "Correspondance",
    noEmail: "Pas d'e-mail",
    emptyKicker: "Pipeline vide",
    emptyTitle: "Aucune candidature dans cette file pour l'instant.",
    emptyBody:
      "De nouveaux candidats apparaîtront ici dès que les offres commenceront à recevoir des candidatures.",
    stageReviewing: "En cours d'examen",
    stageShortlisted: "Présélectionné",
    stageInterview: "Entretien",
    stageOffer: "Offre",
    stageHired: "Embauché",
    stageRejected: "Refusé",
    detailTitle: "Détail du candidat",
    detailSubtitle:
      "Examinez ce candidat, faites-le avancer dans les étapes et ajoutez des notes.",
    detailJobTemplate: "{jobTitle} · {employerName}",
    profileStrengthTemplate: "Solidité du profil {percent} %",
    matchConfidenceTemplate: "Confiance de correspondance {percent} %",
    noCoverNote: "Aucune note de motivation fournie.",
    noticeStageUpdatedTitle: "Étape mise à jour",
    noticeStageUpdatedBody:
      "L'étape du candidat a été mise à jour. Il verra le changement dans son espace candidat.",
    noticeNoteAddedTitle: "Note ajoutée",
    noticeNoteAddedBody: "Votre note a été enregistrée pour cette candidature.",
    stageSectionTitle: "Mettre à jour l'étape",
    stageNotePlaceholder: "Contexte du déplacement",
    stagePending: "Mise à jour de l'étape...",
    stageSubmit: "Mettre à jour l'étape",
    noteSectionTitle: "Note interne",
    notePlaceholder: "Ajouter une note privée sur ce candidat",
    notePending: "Enregistrement de la note...",
    noteSubmit: "Ajouter la note",
    activitySectionTitle: "Historique d'activité",
    activityEmptyKicker: "Pas encore d'activité",
    activityEmptyTitle: "Aucun événement enregistré pour cette candidature.",
    activityEmptyBody:
      "Les changements d'étape, les notes et les mises à jour clés apparaîtront ici au fil du processus de recrutement.",
  },
};

const ES: DeepPartial<JobsCopy> = {
  nav: {
    browse: "Ver ofertas",
    post: "Publicar empleo",
    applications: "Candidaturas",
    account: "Cuenta",
  },
  hero: {
    title: "Contratación de talento verificado, sin el ruido habitual.",
    subtitle: "Encuentra roles enfocados de empleadores serios en su selección.",
    searchPlaceholder: "Rol, habilidad o empresa",
    ctaBrowse: "Ver empleos disponibles",
    ctaHire: "Estoy contratando",
  },
  filters: {
    allRoles: "Todos los roles",
    fullTime: "Tiempo completo",
    partTime: "Tiempo parcial",
    contract: "Contrato",
    remote: "Remoto",
    onsite: "Presencial",
    hybrid: "Híbrido",
    location: "Ubicación",
    salary: "Salario",
    experience: "Experiencia",
    clearAll: "Limpiar todo",
  },
  listing: {
    applyNow: "Postular ahora",
    saveJob: "Guardar empleo",
    shareJob: "Compartir",
    postedAgo: "Publicado",
    deadline: "Fecha límite de postulación",
    salary: "Salario",
    jobType: "Tipo de empleo",
    location: "Ubicación",
    experience: "Experiencia requerida",
    skills: "Habilidades",
    aboutRole: "Sobre el rol",
    aboutCompany: "Sobre la empresa",
    viewCompany: "Ver empresa",
  },
  application: {
    title: "Postular a este rol",
    resume: "Currículum / CV",
    coverLetter: "Carta de presentación",
    submit: "Enviar candidatura",
    submitted: "Candidatura enviada",
    underReview: "En revisión",
    shortlisted: "Preseleccionado",
    rejected: "No avanza",
    offerMade: "Oferta realizada",
  },
  hiring: {
    postJob: "Publicar empleo",
    managePostings: "Gestionar publicaciones",
    reviewApplications: "Revisar candidaturas",
    closePosting: "Cerrar publicación",
    editPosting: "Editar publicación",
  },
  empty: {
    noJobs: "No se encontraron empleos. Ajusta tus filtros.",
    noApplications: "Aún sin candidaturas.",
    noPostings: "Sin publicaciones activas.",
  },
  employerHiring: {
    pageTitle: "Pipelines de contratación",
    pageSubtitle:
      "Gestiona tus pipelines de contratación activos, comunícate con los candidatos y agenda entrevistas desde un único espacio.",
    sectionTitle: "Todos los pipelines",
    sectionBody:
      "Cada pipeline corresponde a un puesto activo o pasado. Abre uno para revisar candidatos, conversaciones y entrevistas.",
    emptyMessage:
      "Aún no hay pipelines de contratación. Los pipelines se crean automáticamente al publicar un puesto.",
    applicantSingular: "candidato",
    applicantPlural: "candidatos",
    statusActive: "Activo",
    statusPaused: "En pausa",
    statusClosed: "Cerrado",
  },
  employerCompany: {
    pageTitle: "Perfil de la empresa",
    pageSubtitle:
      "Configura el perfil de tu empresa para que los candidatos conozcan a tu equipo.",
    rightRailVerificationTitle: "Estado de verificación",
    rightRailStatusLabel: "Estado",
    rightRailStatusPending: "pendiente",
    rightRailStatusPendingCapitalized: "Pendiente",
    rightRailOpenRoleSingular: "puesto abierto",
    rightRailOpenRolePlural: "puestos abiertos",
    rightRailResponseSlaTemplate:
      "{count} {roleLabel}. Tu objetivo es responder a los candidatos en menos de {hours} horas.",
    rightRailEmptyProfileBody:
      "Crea el perfil de tu empresa para iniciar el proceso de verificación y configurar tu página pública de empleador.",
    rightRailTipsTitle: "Consejos para un perfil sólido",
    rightRailTipDescription:
      "Una descripción pública clara del equipo y de la intención de contratación.",
    rightRailTipPolicies:
      "Políticas de trabajo, ubicaciones y puntos de cultura que eliminan ambigüedades.",
    rightRailTipVerified:
      "Una presencia verificada en la que reclutadores y candidatos pueden confiar.",
    profileSavedNoticeTitle: "Perfil del empleador guardado",
    profileSavedNoticeBodyTemplate:
      "{name} se ha guardado. Tu perfil de empresa ya está en la cola de verificación.",
    verificationCalloutBodySuffix:
      "Completa la verificación de la cuenta antes de esperar la publicación de roles o mejoras en la confianza del empleador.",
    openAccountVerification: "Abrir verificación de cuenta",
    sectionTitle: "Detalles de la empresa",
    sectionBody:
      "Esta información aparece en tu página pública de empleador y ayuda a los candidatos a evaluar tu empresa.",
    fieldNamePlaceholder: "Nombre de la empresa",
    fieldSlugPlaceholder: "slug-empresa",
    fieldTaglinePlaceholder: "Eslogan",
    fieldDescriptionPlaceholder: "Descripción del empleador",
    fieldWebsitePlaceholder: "Sitio web",
    fieldIndustryPlaceholder: "Sector",
    fieldLocationsPlaceholder: "Lagos, Abuja, Remoto",
    fieldHeadcountPlaceholder: "Plantilla",
    fieldRemotePolicyPlaceholder: "Política de trabajo remoto",
    fieldBenefitsHeadlinePlaceholder: "Beneficios destacados",
    fieldCulturePointsPlaceholder: "Puntos de cultura",
    employerTypeExternal: "Empleador externo",
    employerTypeInternal: "Contratación interna HenryCo",
    submitSaving: "Guardando empresa...",
    submitLabel: "Guardar perfil del empleador",
  },
  profileBuilder: {
    sectionBasics: "Datos básicos",
    sectionExperience: "Experiencia",
    sectionEducation: "Formación",
    sectionSkills: "Habilidades",
    sectionPortfolio: "Portafolio",
    fullName: "Nombre completo",
    headline: "Titular profesional",
    summary: "Resumen",
    location: "Ubicación",
    phone: "Teléfono",
    email: "Correo electrónico",
    saving: "Guardando…",
    savedAt: "Guardado",
    autosaveHint: "Guardado automático cada 30 s y al perder el foco",
    saveError: "No se pudo guardar tu borrador.",
    addCta: "+ Añadir",
    rolePlaceholder: "Puesto",
    companyPlaceholder: "Empresa",
    descriptionPlaceholder: "Describe tus aportes",
    skillsAddPlaceholder: "Pulsa Intro para añadir",
    removeCta: "Eliminar",
    removeSkillAria: "Eliminar habilidad",
  },
  candidateProfile: {
    pageTitle: "Perfil del candidato",
    pageSubtitle:
      "Mantén tu perfil completo para que los empleadores vean lo mejor de ti.",
    rightRailTrustTitle: "Confianza del perfil",
    rightRailVerificationKicker: "Verificación",
    rightRailDefaultReadiness:
      "Completa tu perfil para mejorar cómo los empleadores ven tus candidaturas.",
    rightRailOpenVerification: "Abrir verificación de cuenta",
    rightRailDocumentsTitle: "Documentos",
    rightRailDocumentsCountSingular: "{count} archivo subido a tu perfil.",
    rightRailDocumentsCountPlural: "{count} archivos subidos a tu perfil.",
    rightRailDocumentsHint:
      "Las habilidades, la trayectoria laboral y los enlaces del portafolio ayudan a los empleadores a evaluar tus candidaturas.",
    statusVerified: "Verificado",
    statusPending: "Pendiente",
    statusRejected: "Rechazado",
    statusUnverified: "Sin verificar",
    savedNoticeTitle: "Perfil guardado",
    savedNoticeBody:
      "Tu perfil ha sido actualizado. Los cambios son visibles para los empleadores cuando te postules.",
    draftSectionTitle: "Borrador del perfil",
    draftSectionBody:
      "Los cambios en curso se guardan automáticamente cada 30 segundos y al perder el foco. Pulsa «Guardar perfil» abajo para publicar.",
    editSectionTitle: "Editar tu perfil",
    editSectionBody:
      "Los datos profesionales aquí son visibles para los empleadores cuando te postules. El teléfono y el correo los conserva HenryCo solo para la verificación y la puntuación de confianza — no se transmiten a los empleadores.",
    fieldFullNamePlaceholder: "Nombre completo",
    fieldHeadlinePlaceholder: "Titular profesional",
    fieldSummaryPlaceholder: "Resumen profesional",
    fieldLocationPlaceholder: "Ubicación",
    fieldTimezonePlaceholder: "Zona horaria",
    fieldWorkModesPlaceholder: "remoto, híbrido, presencial",
    fieldRoleTypesPlaceholder: "tiempo completo, contrato",
    fieldPreferredFunctionsPlaceholder: "Producto, Operaciones, Marketing",
    fieldSkillsPlaceholder: "Habilidades",
    fieldPortfolioLinksPlaceholder: "Enlaces del portafolio",
    fieldSalaryExpectationPlaceholder: "Expectativa salarial",
    fieldAvailabilityPlaceholder: "Disponibilidad",
    fieldWorkHistoryPlaceholder: '[{"company":"HenryCo","title":"Responsable de operaciones"}]',
    fieldEducationPlaceholder: '[{"school":"Universidad","degree":"Licenciatura"}]',
    fieldCertificationsPlaceholder: '[{"name":"Gestión de proyectos"}]',
    submitSaving: "Guardando perfil...",
    submitLabel: "Guardar perfil del candidato",
  },
  employerJobs: {
    pageTitle: "Empleos del empleador",
    pageSubtitle: "Gestiona tus ofertas de empleo y sigue a los candidatos.",
    sectionTitle: "Puestos publicados",
    postRoleCta: "Publicar puesto",
    emptyKicker: "Sin puestos activos",
    emptyTitle: "Publica el primer puesto para este empleador.",
    emptyBody:
      "Una vez creado un puesto, esta lista registrará su estado de moderación, visibilidad y volumen de candidaturas.",
    emptyAction: "Abrir editor de puestos",
    applicantSingular: "candidato",
    applicantPlural: "candidatos",
    roleLineTemplate: "{location} · {count} {applicantLabel}",
    statusApproved: "Aprobado",
    statusPendingReview: "En revisión",
    statusFlagged: "Marcado",
    statusDraft: "Borrador",
  },
  employerApplicants: {
    pageTitle: "Candidatos",
    pageSubtitle:
      "Revisa y mueve a los candidatos reales por tu pipeline de empleador.",
    sectionTitle: "Tabla de candidatos",
    tableCandidate: "Candidato",
    tableRole: "Puesto",
    tableStage: "Etapa",
    tableProfile: "Perfil",
    tableMatch: "Coincidencia",
    noEmail: "Sin correo",
    emptyKicker: "Pipeline despejado",
    emptyTitle: "Aún no hay candidaturas en esta cola.",
    emptyBody:
      "Los nuevos candidatos aparecerán aquí en cuanto los puestos empiecen a recibir candidaturas reales.",
    stageReviewing: "En revisión",
    stageShortlisted: "Preseleccionado",
    stageInterview: "Entrevista",
    stageOffer: "Oferta",
    stageHired: "Contratado",
    stageRejected: "Rechazado",
    detailTitle: "Detalle del candidato",
    detailSubtitle:
      "Revisa a este candidato, hazlo avanzar por las etapas y añade notas.",
    detailJobTemplate: "{jobTitle} · {employerName}",
    profileStrengthTemplate: "Solidez del perfil {percent} %",
    matchConfidenceTemplate: "Confianza de coincidencia {percent} %",
    noCoverNote: "No se proporcionó carta de presentación.",
    noticeStageUpdatedTitle: "Etapa actualizada",
    noticeStageUpdatedBody:
      "La etapa del candidato se ha actualizado. Verá el cambio en su espacio de candidato.",
    noticeNoteAddedTitle: "Nota añadida",
    noticeNoteAddedBody: "Tu nota se ha guardado en esta candidatura.",
    stageSectionTitle: "Actualizar etapa",
    stageNotePlaceholder: "Contexto del movimiento",
    stagePending: "Actualizando etapa...",
    stageSubmit: "Actualizar etapa",
    noteSectionTitle: "Nota interna",
    notePlaceholder: "Añade una nota privada sobre este candidato",
    notePending: "Guardando nota...",
    noteSubmit: "Añadir nota",
    activitySectionTitle: "Historial de actividad",
    activityEmptyKicker: "Aún sin actividad",
    activityEmptyTitle: "No hay eventos registrados para esta candidatura.",
    activityEmptyBody:
      "Los cambios de etapa, notas y actualizaciones clave aparecerán aquí a medida que avances en el proceso de contratación.",
  },
};

const PT: DeepPartial<JobsCopy> = {
  nav: {
    browse: "Ver vagas",
    post: "Publicar vaga",
    applications: "Candidaturas",
    account: "Conta",
  },
  hero: {
    title: "Contratação de talentos verificados, sem o ruído habitual.",
    subtitle: "Encontre vagas focadas de empregadores sérios em suas contratações.",
    searchPlaceholder: "Cargo, habilidade ou empresa",
    ctaBrowse: "Ver vagas abertas",
    ctaHire: "Estou contratando",
  },
  filters: {
    allRoles: "Todos os cargos",
    fullTime: "Tempo integral",
    partTime: "Meio período",
    contract: "Contrato",
    remote: "Remoto",
    onsite: "Presencial",
    hybrid: "Híbrido",
    location: "Localização",
    salary: "Salário",
    experience: "Experiência",
    clearAll: "Limpar tudo",
  },
  listing: {
    applyNow: "Candidatar-se",
    saveJob: "Salvar vaga",
    shareJob: "Compartilhar",
    postedAgo: "Publicado",
    deadline: "Prazo de candidatura",
    salary: "Salário",
    jobType: "Tipo de vaga",
    location: "Localização",
    experience: "Experiência necessária",
    skills: "Habilidades",
    aboutRole: "Sobre a vaga",
    aboutCompany: "Sobre a empresa",
    viewCompany: "Ver empresa",
  },
  application: {
    title: "Candidatar-se a esta vaga",
    resume: "Currículo / CV",
    coverLetter: "Carta de apresentação",
    submit: "Enviar candidatura",
    submitted: "Candidatura enviada",
    underReview: "Em análise",
    shortlisted: "Pré-selecionado",
    rejected: "Não avançou",
    offerMade: "Oferta realizada",
  },
  hiring: {
    postJob: "Publicar vaga",
    managePostings: "Gerenciar publicações",
    reviewApplications: "Revisar candidaturas",
    closePosting: "Encerrar publicação",
    editPosting: "Editar publicação",
  },
  empty: {
    noJobs: "Nenhuma vaga encontrada. Ajuste seus filtros.",
    noApplications: "Sem candidaturas ainda.",
    noPostings: "Sem publicações ativas.",
  },
  employerHiring: {
    pageTitle: "Pipelines de contratação",
    pageSubtitle:
      "Gerencie seus pipelines de contratação ativos, converse com candidatos e agende entrevistas em um único espaço.",
    sectionTitle: "Todos os pipelines",
    sectionBody:
      "Cada pipeline corresponde a uma vaga ativa ou passada. Abra um para revisar candidatos, conversas e entrevistas.",
    emptyMessage:
      "Ainda não há pipelines de contratação. Os pipelines são criados automaticamente quando você publica uma vaga.",
    applicantSingular: "candidato",
    applicantPlural: "candidatos",
    statusActive: "Ativo",
    statusPaused: "Em pausa",
    statusClosed: "Encerrado",
  },
  employerCompany: {
    pageTitle: "Perfil da empresa",
    pageSubtitle:
      "Configure o perfil da sua empresa para que os candidatos conheçam a sua equipa.",
    rightRailVerificationTitle: "Estado da verificação",
    rightRailStatusLabel: "Estado",
    rightRailStatusPending: "pendente",
    rightRailStatusPendingCapitalized: "Pendente",
    rightRailOpenRoleSingular: "vaga aberta",
    rightRailOpenRolePlural: "vagas abertas",
    rightRailResponseSlaTemplate:
      "{count} {roleLabel}. O seu objetivo é responder aos candidatos em até {hours} horas.",
    rightRailEmptyProfileBody:
      "Crie o perfil da sua empresa para iniciar o processo de verificação e configurar a sua página pública de empregador.",
    rightRailTipsTitle: "Dicas para um perfil sólido",
    rightRailTipDescription:
      "Uma descrição pública clara da equipa e da intenção de contratação.",
    rightRailTipPolicies:
      "Políticas de trabalho, locais e pontos de cultura que eliminam ambiguidades.",
    rightRailTipVerified:
      "Uma presença verificada na qual recrutadores e candidatos podem confiar.",
    profileSavedNoticeTitle: "Perfil do empregador guardado",
    profileSavedNoticeBodyTemplate:
      "{name} foi guardado. O perfil da sua empresa está agora na fila de verificação.",
    verificationCalloutBodySuffix:
      "Conclua a verificação da conta antes de esperar a publicação de vagas ou melhorias na confiança do empregador.",
    openAccountVerification: "Abrir verificação da conta",
    sectionTitle: "Detalhes da empresa",
    sectionBody:
      "Estas informações aparecem na sua página pública de empregador e ajudam os candidatos a avaliar a sua empresa.",
    fieldNamePlaceholder: "Nome da empresa",
    fieldSlugPlaceholder: "slug-empresa",
    fieldTaglinePlaceholder: "Slogan",
    fieldDescriptionPlaceholder: "Descrição do empregador",
    fieldWebsitePlaceholder: "Site",
    fieldIndustryPlaceholder: "Setor",
    fieldLocationsPlaceholder: "Lagos, Abuja, Remoto",
    fieldHeadcountPlaceholder: "Quadro de pessoal",
    fieldRemotePolicyPlaceholder: "Política de trabalho remoto",
    fieldBenefitsHeadlinePlaceholder: "Benefícios em destaque",
    fieldCulturePointsPlaceholder: "Pontos de cultura",
    employerTypeExternal: "Empregador externo",
    employerTypeInternal: "Contratação interna HenryCo",
    submitSaving: "A guardar empresa...",
    submitLabel: "Guardar perfil do empregador",
  },
  profileBuilder: {
    sectionBasics: "Informações básicas",
    sectionExperience: "Experiência",
    sectionEducation: "Formação",
    sectionSkills: "Competências",
    sectionPortfolio: "Portefólio",
    fullName: "Nome completo",
    headline: "Título profissional",
    summary: "Resumo",
    location: "Localização",
    phone: "Telefone",
    email: "E-mail",
    saving: "A guardar…",
    savedAt: "Guardado",
    autosaveHint: "Guarda automática a cada 30 s e ao perder o foco",
    saveError: "Não foi possível guardar o seu rascunho.",
    addCta: "+ Adicionar",
    rolePlaceholder: "Cargo",
    companyPlaceholder: "Empresa",
    descriptionPlaceholder: "Descreva os seus contributos",
    skillsAddPlaceholder: "Prima Enter para adicionar",
    removeCta: "Remover",
    removeSkillAria: "Remover competência",
  },
  candidateProfile: {
    pageTitle: "Perfil do candidato",
    pageSubtitle:
      "Mantenha o seu perfil completo para que os empregadores vejam o seu melhor.",
    rightRailTrustTitle: "Confiança do perfil",
    rightRailVerificationKicker: "Verificação",
    rightRailDefaultReadiness:
      "Conclua o seu perfil para melhorar a forma como os empregadores avaliam as suas candidaturas.",
    rightRailOpenVerification: "Abrir verificação da conta",
    rightRailDocumentsTitle: "Documentos",
    rightRailDocumentsCountSingular: "{count} ficheiro carregado no seu perfil.",
    rightRailDocumentsCountPlural: "{count} ficheiros carregados no seu perfil.",
    rightRailDocumentsHint:
      "Competências, histórico profissional e links do portefólio ajudam os empregadores a avaliar as suas candidaturas.",
    statusVerified: "Verificado",
    statusPending: "Pendente",
    statusRejected: "Rejeitado",
    statusUnverified: "Não verificado",
    savedNoticeTitle: "Perfil guardado",
    savedNoticeBody:
      "O seu perfil foi atualizado. As alterações ficam visíveis para os empregadores quando se candidata.",
    draftSectionTitle: "Rascunho do perfil",
    draftSectionBody:
      "As alterações em curso são guardadas automaticamente a cada 30 segundos e ao perder o foco. Prima «Guardar perfil» abaixo para publicar.",
    editSectionTitle: "Editar o seu perfil",
    editSectionBody:
      "Os dados profissionais aqui são visíveis para os empregadores quando se candidata. O telefone e o e-mail são mantidos pela HenryCo apenas para verificação e pontuação de confiança — não são transmitidos aos empregadores.",
    fieldFullNamePlaceholder: "Nome completo",
    fieldHeadlinePlaceholder: "Título profissional",
    fieldSummaryPlaceholder: "Resumo profissional",
    fieldLocationPlaceholder: "Localização",
    fieldTimezonePlaceholder: "Fuso horário",
    fieldWorkModesPlaceholder: "remoto, híbrido, presencial",
    fieldRoleTypesPlaceholder: "tempo integral, contrato",
    fieldPreferredFunctionsPlaceholder: "Produto, Operações, Marketing",
    fieldSkillsPlaceholder: "Competências",
    fieldPortfolioLinksPlaceholder: "Links do portefólio",
    fieldSalaryExpectationPlaceholder: "Expectativa salarial",
    fieldAvailabilityPlaceholder: "Disponibilidade",
    fieldWorkHistoryPlaceholder: '[{"company":"HenryCo","title":"Líder de operações"}]',
    fieldEducationPlaceholder: '[{"school":"Universidade","degree":"Licenciatura"}]',
    fieldCertificationsPlaceholder: '[{"name":"Gestão de projetos"}]',
    submitSaving: "A guardar perfil...",
    submitLabel: "Guardar perfil do candidato",
  },
  employerJobs: {
    pageTitle: "Vagas do empregador",
    pageSubtitle: "Gerencie suas vagas publicadas e acompanhe os candidatos.",
    sectionTitle: "Vagas publicadas",
    postRoleCta: "Publicar vaga",
    emptyKicker: "Sem vagas ativas",
    emptyTitle: "Publique a primeira vaga para este empregador.",
    emptyBody:
      "Após criar uma vaga, esta lista mostrará o estado de moderação, visibilidade e volume de candidaturas.",
    emptyAction: "Abrir editor de vagas",
    applicantSingular: "candidato",
    applicantPlural: "candidatos",
    roleLineTemplate: "{location} · {count} {applicantLabel}",
    statusApproved: "Aprovada",
    statusPendingReview: "Em análise",
    statusFlagged: "Sinalizada",
    statusDraft: "Rascunho",
  },
  employerApplicants: {
    pageTitle: "Candidatos",
    pageSubtitle:
      "Reveja e mova candidatos reais ao longo do seu pipeline de empregador.",
    sectionTitle: "Tabela de candidatos",
    tableCandidate: "Candidato",
    tableRole: "Vaga",
    tableStage: "Etapa",
    tableProfile: "Perfil",
    tableMatch: "Correspondência",
    noEmail: "Sem e-mail",
    emptyKicker: "Pipeline limpa",
    emptyTitle: "Ainda não há candidaturas nesta fila.",
    emptyBody:
      "Novos candidatos aparecerão aqui assim que as vagas começarem a receber candidaturas reais.",
    stageReviewing: "Em análise",
    stageShortlisted: "Pré-selecionado",
    stageInterview: "Entrevista",
    stageOffer: "Oferta",
    stageHired: "Contratado",
    stageRejected: "Rejeitado",
    detailTitle: "Detalhe do candidato",
    detailSubtitle:
      "Reveja este candidato, mova-o entre as etapas e adicione notas.",
    detailJobTemplate: "{jobTitle} · {employerName}",
    profileStrengthTemplate: "Solidez do perfil {percent} %",
    matchConfidenceTemplate: "Confiança de correspondência {percent} %",
    noCoverNote: "Nenhuma carta de apresentação fornecida.",
    noticeStageUpdatedTitle: "Etapa atualizada",
    noticeStageUpdatedBody:
      "A etapa do candidato foi atualizada. Ele verá a mudança no seu espaço de candidato.",
    noticeNoteAddedTitle: "Nota adicionada",
    noticeNoteAddedBody: "A sua nota foi guardada nesta candidatura.",
    stageSectionTitle: "Atualizar etapa",
    stageNotePlaceholder: "Contexto da mudança",
    stagePending: "A atualizar etapa...",
    stageSubmit: "Atualizar etapa",
    noteSectionTitle: "Nota interna",
    notePlaceholder: "Adicione uma nota privada sobre este candidato",
    notePending: "A guardar nota...",
    noteSubmit: "Adicionar nota",
    activitySectionTitle: "Histórico de atividade",
    activityEmptyKicker: "Sem atividade ainda",
    activityEmptyTitle: "Nenhum evento registado para esta candidatura.",
    activityEmptyBody:
      "Mudanças de etapa, notas e atualizações importantes aparecerão aqui à medida que avança no processo de contratação.",
  },
};

const AR: DeepPartial<JobsCopy> = {
  nav: {
    browse: "تصفح الوظائف",
    post: "نشر وظيفة",
    applications: "الطلبات",
    account: "الحساب",
  },
  hero: {
    title: "توظيف مواهب موثقة، بدون الضوضاء المعتادة.",
    subtitle: "اعثر على وظائف مركزة من أصحاب عمل جادين في اختياراتهم.",
    searchPlaceholder: "المنصب، المهارة، أو الشركة",
    ctaBrowse: "تصفح الوظائف المتاحة",
    ctaHire: "أنا أوظف",
  },
  filters: {
    allRoles: "جميع الأدوار",
    fullTime: "دوام كامل",
    partTime: "دوام جزئي",
    contract: "عقد",
    remote: "عن بُعد",
    onsite: "في الموقع",
    hybrid: "هجين",
    location: "الموقع",
    salary: "الراتب",
    experience: "الخبرة",
    clearAll: "مسح الكل",
  },
  listing: {
    applyNow: "تقدم الآن",
    saveJob: "حفظ الوظيفة",
    shareJob: "مشاركة",
    postedAgo: "نُشر",
    deadline: "الموعد النهائي للتقديم",
    salary: "الراتب",
    jobType: "نوع الوظيفة",
    location: "الموقع",
    experience: "الخبرة المطلوبة",
    skills: "المهارات",
    aboutRole: "عن الدور",
    aboutCompany: "عن الشركة",
    viewCompany: "عرض الشركة",
  },
  application: {
    title: "التقدم لهذا الدور",
    resume: "السيرة الذاتية",
    coverLetter: "خطاب التقديم",
    submit: "إرسال الطلب",
    submitted: "تم إرسال الطلب",
    underReview: "قيد المراجعة",
    shortlisted: "في القائمة المختصرة",
    rejected: "لم يتقدم",
    offerMade: "تم تقديم عرض",
  },
  hiring: {
    postJob: "نشر وظيفة",
    managePostings: "إدارة الإعلانات",
    reviewApplications: "مراجعة الطلبات",
    closePosting: "إغلاق الإعلان",
    editPosting: "تعديل الإعلان",
  },
  empty: {
    noJobs: "لم يتم العثور على وظائف مطابقة. جرب تعديل فلاترك.",
    noApplications: "لا توجد طلبات بعد.",
    noPostings: "لا توجد إعلانات وظيفية نشطة.",
  },
  employerHiring: {
    pageTitle: "خطوط التوظيف",
    pageSubtitle:
      "أدر خطوط التوظيف النشطة، وتواصل مع المرشحين، وحدد مواعيد المقابلات من مكان عمل واحد.",
    sectionTitle: "كل الخطوط",
    sectionBody:
      "كل خط توظيف يقابل دورًا نشطًا أو سابقًا. افتح خطًا لمراجعة المرشحين والمحادثات والمقابلات.",
    emptyMessage:
      "لا توجد خطوط توظيف بعد. تُنشأ الخطوط تلقائيًا عند نشر دور.",
    applicantSingular: "مرشح",
    applicantPlural: "مرشحون",
    statusActive: "نشط",
    statusPaused: "متوقف",
    statusClosed: "مغلق",
  },
  employerCompany: {
    pageTitle: "ملف الشركة",
    pageSubtitle: "أعد ملف شركتك ليتعرف المرشحون على فريقك.",
    rightRailVerificationTitle: "حالة التحقق",
    rightRailStatusLabel: "الحالة",
    rightRailStatusPending: "قيد الانتظار",
    rightRailStatusPendingCapitalized: "قيد الانتظار",
    rightRailOpenRoleSingular: "وظيفة مفتوحة",
    rightRailOpenRolePlural: "وظائف مفتوحة",
    rightRailResponseSlaTemplate:
      "{count} {roleLabel}. تهدف إلى الرد على المرشحين خلال {hours} ساعة.",
    rightRailEmptyProfileBody:
      "أنشئ ملف شركتك لبدء عملية التحقق وإعداد صفحة صاحب العمل العامة الخاصة بك.",
    rightRailTipsTitle: "نصائح لملف قوي",
    rightRailTipDescription: "وصف عام واضح للفريق ونية التوظيف.",
    rightRailTipPolicies: "سياسات العمل والمواقع وعناصر الثقافة التي تزيل أي غموض.",
    rightRailTipVerified: "حضور موثق يمكن للمسؤولين والمرشحين الوثوق به.",
    profileSavedNoticeTitle: "تم حفظ ملف صاحب العمل",
    profileSavedNoticeBodyTemplate:
      "تم حفظ {name}. ملف شركتك الآن في قائمة انتظار التحقق.",
    verificationCalloutBodySuffix:
      "أكمل التحقق من الحساب قبل أن تتوقع فتح إمكانية نشر الوظائف أو ترقيات ثقة صاحب العمل.",
    openAccountVerification: "فتح التحقق من الحساب",
    sectionTitle: "تفاصيل الشركة",
    sectionBody:
      "تظهر هذه المعلومات على صفحتك العامة كصاحب عمل وتساعد المرشحين على تقييم شركتك.",
    fieldNamePlaceholder: "اسم الشركة",
    fieldSlugPlaceholder: "slug-الشركة",
    fieldTaglinePlaceholder: "الشعار",
    fieldDescriptionPlaceholder: "وصف صاحب العمل",
    fieldWebsitePlaceholder: "الموقع الإلكتروني",
    fieldIndustryPlaceholder: "القطاع",
    fieldLocationsPlaceholder: "لاغوس، أبوجا، عن بُعد",
    fieldHeadcountPlaceholder: "عدد الموظفين",
    fieldRemotePolicyPlaceholder: "سياسة العمل عن بُعد",
    fieldBenefitsHeadlinePlaceholder: "أبرز المزايا",
    fieldCulturePointsPlaceholder: "عناصر الثقافة",
    employerTypeExternal: "صاحب عمل خارجي",
    employerTypeInternal: "توظيف داخلي في HenryCo",
    submitSaving: "جارٍ حفظ الشركة...",
    submitLabel: "حفظ ملف صاحب العمل",
  },
  profileBuilder: {
    sectionBasics: "المعلومات الأساسية",
    sectionExperience: "الخبرة",
    sectionEducation: "التعليم",
    sectionSkills: "المهارات",
    sectionPortfolio: "ملف الأعمال",
    fullName: "الاسم الكامل",
    headline: "العنوان المهني",
    summary: "نبذة",
    location: "الموقع",
    phone: "الهاتف",
    email: "البريد الإلكتروني",
    saving: "جارٍ الحفظ…",
    savedAt: "تم الحفظ",
    autosaveHint: "حفظ تلقائي كل 30 ثانية وعند فقدان التركيز",
    saveError: "تعذّر حفظ مسودتك.",
    addCta: "+ إضافة",
    rolePlaceholder: "المنصب",
    companyPlaceholder: "الشركة",
    descriptionPlaceholder: "صف مساهماتك",
    skillsAddPlaceholder: "اضغط Enter للإضافة",
    removeCta: "إزالة",
    removeSkillAria: "إزالة المهارة",
  },
  candidateProfile: {
    pageTitle: "ملف المرشّح",
    pageSubtitle: "حافظ على اكتمال ملفك الشخصي ليرى أصحاب العمل أفضل صورة عنك.",
    rightRailTrustTitle: "ثقة الملف الشخصي",
    rightRailVerificationKicker: "التحقق",
    rightRailDefaultReadiness:
      "أكمل ملفك الشخصي لتحسين نظرة أصحاب العمل إلى طلباتك.",
    rightRailOpenVerification: "فتح التحقق من الحساب",
    rightRailDocumentsTitle: "المستندات",
    rightRailDocumentsCountSingular: "تم رفع {count} ملف إلى ملفك الشخصي.",
    rightRailDocumentsCountPlural: "تم رفع {count} ملفات إلى ملفك الشخصي.",
    rightRailDocumentsHint:
      "تساعد المهارات وتاريخ العمل وروابط المعرض أصحاب العمل في تقييم طلباتك.",
    statusVerified: "موثّق",
    statusPending: "قيد الانتظار",
    statusRejected: "مرفوض",
    statusUnverified: "غير موثّق",
    savedNoticeTitle: "تم حفظ الملف الشخصي",
    savedNoticeBody:
      "تم تحديث ملفك الشخصي. التغييرات مرئية لأصحاب العمل عند التقديم.",
    draftSectionTitle: "مسودة الملف الشخصي",
    draftSectionBody:
      "يتم حفظ التغييرات قيد التنفيذ تلقائيًا كل 30 ثانية وعند فقدان التركيز. اضغط «حفظ الملف الشخصي» بالأسفل للنشر.",
    editSectionTitle: "تعديل ملفك الشخصي",
    editSectionBody:
      "التفاصيل المهنية هنا مرئية لأصحاب العمل عند التقديم على الوظائف. تحتفظ HenryCo بالهاتف والبريد الإلكتروني للتحقق وحساب درجة الثقة فقط — ولا يتم تمريرها إلى أصحاب العمل.",
    fieldFullNamePlaceholder: "الاسم الكامل",
    fieldHeadlinePlaceholder: "العنوان المهني",
    fieldSummaryPlaceholder: "ملخّص مهني",
    fieldLocationPlaceholder: "الموقع",
    fieldTimezonePlaceholder: "المنطقة الزمنية",
    fieldWorkModesPlaceholder: "عن بُعد، هجين، في الموقع",
    fieldRoleTypesPlaceholder: "دوام كامل، عقد",
    fieldPreferredFunctionsPlaceholder: "المنتج، العمليات، التسويق",
    fieldSkillsPlaceholder: "المهارات",
    fieldPortfolioLinksPlaceholder: "روابط المعرض",
    fieldSalaryExpectationPlaceholder: "الراتب المتوقع",
    fieldAvailabilityPlaceholder: "التوفر",
    fieldWorkHistoryPlaceholder: '[{"company":"HenryCo","title":"قائد العمليات"}]',
    fieldEducationPlaceholder: '[{"school":"جامعة","degree":"بكالوريوس"}]',
    fieldCertificationsPlaceholder: '[{"name":"إدارة المشاريع"}]',
    submitSaving: "جارٍ حفظ الملف الشخصي...",
    submitLabel: "حفظ ملف المرشّح",
  },
  employerJobs: {
    pageTitle: "وظائف صاحب العمل",
    pageSubtitle: "أدِر إعلانات الوظائف لديك وتابع المتقدمين.",
    sectionTitle: "الوظائف المنشورة",
    postRoleCta: "نشر وظيفة",
    emptyKicker: "لا توجد وظائف نشطة",
    emptyTitle: "انشر أول وظيفة لصاحب العمل هذا.",
    emptyBody:
      "بمجرد إنشاء وظيفة، ستعرض هذه القائمة حالة المراجعة والظهور وعدد المتقدمين.",
    emptyAction: "فتح أداة إنشاء الوظائف",
    applicantSingular: "متقدم",
    applicantPlural: "متقدمين",
    roleLineTemplate: "{location} · {count} {applicantLabel}",
    statusApproved: "معتمدة",
    statusPendingReview: "قيد المراجعة",
    statusFlagged: "مُعلَّمة",
    statusDraft: "مسودة",
  },
  employerApplicants: {
    pageTitle: "المتقدمون",
    pageSubtitle:
      "راجع المتقدمين الحقيقيين وانقلهم عبر مسار التوظيف لديك.",
    sectionTitle: "جدول المتقدمين",
    tableCandidate: "المرشح",
    tableRole: "الدور",
    tableStage: "المرحلة",
    tableProfile: "الملف الشخصي",
    tableMatch: "التطابق",
    noEmail: "لا يوجد بريد إلكتروني",
    emptyKicker: "المسار خالٍ",
    emptyTitle: "لا توجد طلبات في هذا الطابور بعد.",
    emptyBody:
      "سيظهر المرشحون الجدد هنا فور أن تبدأ الوظائف في تلقي الطلبات الحقيقية.",
    stageReviewing: "قيد المراجعة",
    stageShortlisted: "ضمن القائمة المختصرة",
    stageInterview: "مقابلة",
    stageOffer: "عرض",
    stageHired: "تم التوظيف",
    stageRejected: "مرفوض",
    detailTitle: "تفاصيل المتقدم",
    detailSubtitle:
      "راجع هذا المرشح وحرّكه عبر المراحل وأضِف الملاحظات.",
    detailJobTemplate: "{jobTitle} · {employerName}",
    profileStrengthTemplate: "قوة الملف الشخصي {percent}٪",
    matchConfidenceTemplate: "ثقة التطابق {percent}٪",
    noCoverNote: "لم يتم تقديم رسالة تعريفية.",
    noticeStageUpdatedTitle: "تم تحديث المرحلة",
    noticeStageUpdatedBody:
      "تم تحديث مرحلة المرشح. سيرى التغيير في مساحة المرشح الخاصة به.",
    noticeNoteAddedTitle: "تمت إضافة ملاحظة",
    noticeNoteAddedBody: "تم حفظ ملاحظتك على هذا الطلب.",
    stageSectionTitle: "تحديث المرحلة",
    stageNotePlaceholder: "سياق النقل",
    stagePending: "جارٍ تحديث المرحلة...",
    stageSubmit: "تحديث المرحلة",
    noteSectionTitle: "ملاحظة داخلية",
    notePlaceholder: "أضِف ملاحظة خاصة عن هذا المرشح",
    notePending: "جارٍ حفظ الملاحظة...",
    noteSubmit: "إضافة ملاحظة",
    activitySectionTitle: "سجل النشاط",
    activityEmptyKicker: "لا يوجد نشاط بعد",
    activityEmptyTitle: "لم يتم تسجيل أحداث لهذا الطلب.",
    activityEmptyBody:
      "ستظهر هنا تغييرات المراحل والملاحظات والتحديثات الرئيسية أثناء سيرك في عملية التوظيف.",
  },
};

const IG: DeepPartial<JobsCopy> = {
  nav: {
    browse: "Lelee ọrụ",
    post: "Dee ọrụ",
    applications: "Arịrịọ",
    account: "Akaụntụ",
  },
  hero: {
    title: "Ịchụ ndị ọrụ amara, na-enweghị ọtọ.",
    subtitle: "Hụ ọrụ kwụsịrị kwụsị site n'aka ndị ọchịchị jụrụ ogu.",
    searchPlaceholder: "Ọrụ, nka, ma ọ bụ ụlọ ọrụ",
    ctaBrowse: "Lelee ọrụ ndị dị mfe",
    ctaHire: "Achọrọ m ndị ọrụ",
  },
  filters: {
    allRoles: "Ọrụ niile",
    fullTime: "Oge zuru oke",
    partTime: "Oge ụfọdụ",
    contract: "Nkwekọrịta",
    remote: "Ọrụ site n'ụlọ",
    onsite: "N'ebe ọrụ dị",
    hybrid: "Ngwakọta",
    location: "Ọnọdụ",
    salary: "Ụgwọ",
    experience: "Ahụmahụ",
    clearAll: "Hichapụ ihe niile",
  },
  listing: {
    applyNow: "Rịọ ugbu a",
    saveJob: "Chekwa ọrụ",
    shareJob: "Kee",
    postedAgo: "Edere",
    deadline: "Ụbọchị ikpeazụ ị nwerụ arịrịọ",
    salary: "Ụgwọ",
    jobType: "Ụdị ọrụ",
    location: "Ọnọdụ",
    experience: "Ahụmahụ dị mkpa",
    skills: "Nka",
    aboutRole: "Maka ọrụ a",
    aboutCompany: "Maka ụlọ ọrụ",
    viewCompany: "Hụ ụlọ ọrụ",
  },
  application: {
    title: "Rịọ ọrụ a",
    resume: "CV",
    coverLetter: "Akwụkwọ ozi",
    submit: "Zipu arịrịọ",
    submitted: "Eziputara arịrịọ",
    underReview: "Na-atụle",
    shortlisted: "Họpụtara",
    rejected: "Agaghị n'ihu",
    offerMade: "Enyela ofee",
  },
  hiring: {
    postJob: "Dee ọrụ",
    managePostings: "Jikwaa nkwupụta",
    reviewApplications: "Lelee arịrịọ",
    closePosting: "Mechie nkwupụta",
    editPosting: "Dezie nkwupụta",
  },
  empty: {
    noJobs: "Enweghị ọrụ dabara. Gbanwee ndọta gị.",
    noApplications: "Enweghị arịrịọ ọ bụla.",
    noPostings: "Enweghị nkwupụta ọrụ dị ndụ.",
  },
  employerHiring: {
    pageTitle: "Akara ịchụ ndị ọrụ",
    pageSubtitle:
      "Jikwaa akara ịchụ ndị ọrụ gị na-arụ ọrụ, kparịta ụka na ndị nwere mmasị, ma hazie nzukọ ajụjụ ọnụ site n'otu ebe ọrụ.",
    sectionTitle: "Akara niile",
    sectionBody:
      "Akara nke ọ bụla na-egosi ọrụ dị ndụ ma ọ bụ ọrụ gara aga. Mepee otu iji lelee ndị nwere mmasị, mkparịta ụka, na ajụjụ ọnụ.",
    emptyMessage:
      "Enweghị akara ịchụ ndị ọrụ ọ bụla. A na-emepụta akara n'onwe ya mgbe ị bipụtara ọrụ.",
    applicantSingular: "onye nwere mmasị",
    applicantPlural: "ndị nwere mmasị",
    statusActive: "Na-arụ ọrụ",
    statusPaused: "Akwụsịrị",
    statusClosed: "Emechiri",
  },
  employerCompany: {
    pageTitle: "Profaịlụ ụlọ ọrụ",
    pageSubtitle:
      "Hazie profaịlụ ụlọ ọrụ gị ka ndị na-achọ ọrụ mata banyere ndị otu gị.",
    rightRailVerificationTitle: "Ọnọdụ nyocha",
    rightRailStatusLabel: "Ọnọdụ",
    rightRailStatusPending: "na-eche",
    rightRailStatusPendingCapitalized: "Na-eche",
    rightRailOpenRoleSingular: "ọrụ na-emeghe",
    rightRailOpenRolePlural: "ọrụ na-emeghe",
    rightRailResponseSlaTemplate:
      "{count} {roleLabel}. Ị na-achọ ịzaghachi ndị na-achọ ọrụ n'ime awa {hours}.",
    rightRailEmptyProfileBody:
      "Mepụta profaịlụ ụlọ ọrụ gị iji malite usoro nyocha wee hazie ibe ọchịchị ọha gị.",
    rightRailTipsTitle: "Ndụmọdụ maka profaịlụ siri ike",
    rightRailTipDescription:
      "Nkọwa doro anya nke ọha banyere ndị otu na ebumnuche ịchụ ndị ọrụ.",
    rightRailTipPolicies:
      "Iwu ọrụ, ebe a na-arụ ọrụ, na isi ihe omenala na-ewepụ enweghị nghọta.",
    rightRailTipVerified:
      "Ihu nyochara nke ndị na-achọ ndị ọrụ na ndị na-achọ ọrụ nwere ike ịtụkwasị obi.",
    profileSavedNoticeTitle: "Edebere profaịlụ ọchịchị",
    profileSavedNoticeBodyTemplate:
      "Edebela {name}. Profaịlụ ụlọ ọrụ gị nọ ugbu a n'usoro nyocha.",
    verificationCalloutBodySuffix:
      "Mechaa nyocha akaụntụ tupu ị tụgharị atụ na ibipụta ọrụ ma ọ bụ nkwalite ntụkwasị obi ọchịchị ga-emeghe.",
    openAccountVerification: "Mepee nyocha akaụntụ",
    sectionTitle: "Nkọwa ụlọ ọrụ",
    sectionBody:
      "Ozi a na-apụta na ibe ọchịchị ọha gị ma na-enyere ndị na-achọ ọrụ aka ịkpebi banyere ụlọ ọrụ gị.",
    fieldNamePlaceholder: "Aha ụlọ ọrụ",
    fieldSlugPlaceholder: "slug-ulọ-ọrụ",
    fieldTaglinePlaceholder: "Okwu mkpọrọgwụ",
    fieldDescriptionPlaceholder: "Nkọwa ọchịchị",
    fieldWebsitePlaceholder: "Webụsaịtị",
    fieldIndustryPlaceholder: "Ngalaba",
    fieldLocationsPlaceholder: "Lagos, Abuja, Ọrụ site n'ụlọ",
    fieldHeadcountPlaceholder: "Ọnụọgụgụ ndị ọrụ",
    fieldRemotePolicyPlaceholder: "Iwu ọrụ site n'ụlọ",
    fieldBenefitsHeadlinePlaceholder: "Uru pụtara ìhè",
    fieldCulturePointsPlaceholder: "Isi ihe omenala",
    employerTypeExternal: "Ọchịchị mpụga",
    employerTypeInternal: "Ọrụ ime ụlọ HenryCo",
    submitSaving: "Na-edebe ụlọ ọrụ...",
    submitLabel: "Debe profaịlụ ọchịchị",
  },
  profileBuilder: {
    sectionBasics: "Ihe ndị bụ isi",
    sectionExperience: "Ahụmahụ",
    sectionEducation: "Agụmakwụkwọ",
    sectionSkills: "Nkà",
    sectionPortfolio: "Pọtfọlio",
    fullName: "Aha zuru ezu",
    headline: "Aha akwụkwọ ọrụ",
    summary: "Nchịkọta",
    location: "Ebe ị nọ",
    phone: "Ekwentị",
    email: "Email",
    saving: "Na-edebe…",
    savedAt: "Edebere",
    autosaveHint: "Na-edebe akpaaka kwa sekọnd 30 na mgbe ọ kụlachara",
    saveError: "Enweghị ike idebe ihe edeturu gị.",
    addCta: "+ Tinye",
    rolePlaceholder: "Ọkwa",
    companyPlaceholder: "Ụlọ ọrụ",
    descriptionPlaceholder: "Kọwaa onyinye gị",
    skillsAddPlaceholder: "Pịa Enter iji tinye",
    removeCta: "Wepụ",
    removeSkillAria: "Wepụ nkà",
  },
  candidateProfile: {
    pageTitle: "Profaịlụ Onye Tinyere Akwụkwọ",
    pageSubtitle:
      "Mee ka profaịlụ gị zuo oke ka ndị ọchịchị wee hụ ụdị gị kachasị mma.",
    rightRailTrustTitle: "Ntụkwasị obi profaịlụ",
    rightRailVerificationKicker: "Nyochaa",
    rightRailDefaultReadiness:
      "Mechaa profaịlụ gị iji meziwanye otú ndị ọchịchị si elele arịrịọ gị.",
    rightRailOpenVerification: "Mepee nyocha akaụntụ",
    rightRailDocumentsTitle: "Akwụkwọ",
    rightRailDocumentsCountSingular: "Etinyere {count} faịlụ na profaịlụ gị.",
    rightRailDocumentsCountPlural: "Etinyere {count} faịlụ na profaịlụ gị.",
    rightRailDocumentsHint:
      "Nkà, akụkọ ihe mere eme ọrụ, na njikọ pọtfọlio na-enyere ndị ọchịchị aka ileba arịrịọ gị.",
    statusVerified: "Akwadoro",
    statusPending: "Na-eche",
    statusRejected: "Ajụrụ",
    statusUnverified: "Akwadobeghị",
    savedNoticeTitle: "Edebere profaịlụ",
    savedNoticeBody:
      "Emelitela profaịlụ gị. Mgbanwe na-egosi ndị ọchịchị mgbe ị na-etinye akwụkwọ.",
    draftSectionTitle: "Ihe edeturu profaịlụ",
    draftSectionBody:
      "Mgbanwe ndị na-aga n'ihu na-edebe akpaaka kwa sekọnd 30 na mgbe ọ kụlachara. Pịa 'Debe profaịlụ' n'okpuru iji bipụta.",
    editSectionTitle: "Dezie profaịlụ gị",
    editSectionBody:
      "Nkọwa ọrụ ebe a na-egosi ndị ọchịchị mgbe ị na-etinye akwụkwọ. Ekwentị na email bụ nke HenryCo na-edebe maka nyocha na akara ntụkwasị obi naanị — a naghị enye ya ndị ọchịchị.",
    fieldFullNamePlaceholder: "Aha zuru ezu",
    fieldHeadlinePlaceholder: "Aha akwụkwọ ọrụ",
    fieldSummaryPlaceholder: "Nchịkọta ọrụ",
    fieldLocationPlaceholder: "Ebe ị nọ",
    fieldTimezonePlaceholder: "Mpaghara oge",
    fieldWorkModesPlaceholder: "n'ụlọ, ngwakọ, n'ọrụ",
    fieldRoleTypesPlaceholder: "oge zuru oke, nkwekọrịta",
    fieldPreferredFunctionsPlaceholder: "Ngwaahịa, Ọrụ, Mgbasa ozi",
    fieldSkillsPlaceholder: "Nkà",
    fieldPortfolioLinksPlaceholder: "Njikọ pọtfọlio",
    fieldSalaryExpectationPlaceholder: "Ụgwọ ọnwa atụrụ anya",
    fieldAvailabilityPlaceholder: "Inwe ohere",
    fieldWorkHistoryPlaceholder: '[{"company":"HenryCo","title":"Onye ndu ọrụ"}]',
    fieldEducationPlaceholder: '[{"school":"Mahadum","degree":"BSc"}]',
    fieldCertificationsPlaceholder: '[{"name":"Njikwa ọrụ"}]',
    submitSaving: "Na-edebe profaịlụ...",
    submitLabel: "Debe profaịlụ onye tinyere akwụkwọ",
  },
  employerJobs: {
    pageTitle: "Ọrụ Ọchịchị",
    pageSubtitle: "Jikwaa ọrụ ị bipụtara ma soro ndị na-achọ ọrụ.",
    sectionTitle: "Ọrụ ndị e bipụtara",
    postRoleCta: "Bipụta ọrụ",
    emptyKicker: "Enweghị ọrụ na-arụ ọrụ",
    emptyTitle: "Bipụta ọrụ mbụ maka onye ọrụ a.",
    emptyBody:
      "Mgbe e mepụtara ọrụ, ndepụta a ga-egosi ọnọdụ nlele, ọhụụ na ọnụọgụ ndị tinyere akwụkwọ.",
    emptyAction: "Mepee ihe nrụzi ọrụ",
    applicantSingular: "onye tinyere akwụkwọ",
    applicantPlural: "ndị tinyere akwụkwọ",
    roleLineTemplate: "{location} · {count} {applicantLabel}",
    statusApproved: "Akwadoro",
    statusPendingReview: "Na-eche nlele",
    statusFlagged: "Akpọrọ aha",
    statusDraft: "Ihe edeturu",
  },
  employerApplicants: {
    pageTitle: "Ndị Tinyere Akwụkwọ",
    pageSubtitle:
      "Lelee ma kpụgharịa ndị tinyere akwụkwọ ezigbo n'ime usoro ọrụ ọchịchị gị.",
    sectionTitle: "Tebụl ndị tinyere akwụkwọ",
    tableCandidate: "Onye nwere mmasị",
    tableRole: "Ọrụ",
    tableStage: "Ọkwa",
    tableProfile: "Profaịlụ",
    tableMatch: "Nkwekọ",
    noEmail: "Enweghị email",
    emptyKicker: "Usoro doro anya",
    emptyTitle: "Enweghị arịrịọ ọ bụla nọ n'usoro a.",
    emptyBody:
      "Ndị nwere mmasị ọhụrụ ga-apụta ebe a ozugbo ọrụ malitere ịnata arịrịọ.",
    stageReviewing: "Na-atụle",
    stageShortlisted: "Họpụtara",
    stageInterview: "Ajụjụ ọnụ",
    stageOffer: "Ofee",
    stageHired: "Ewerela",
    stageRejected: "Ajụrụ",
    detailTitle: "Nkọwa onye tinyere akwụkwọ",
    detailSubtitle:
      "Lelee onye nwere mmasị a, kpụgharịa ya site na ọkwa, ma gbakwunye ndetu.",
    detailJobTemplate: "{jobTitle} · {employerName}",
    profileStrengthTemplate: "Ike profaịlụ {percent}%",
    matchConfidenceTemplate: "Ntụkwasị obi nkwekọ {percent}%",
    noCoverNote: "Enyeghị akwụkwọ ozi mkpuchi.",
    noticeStageUpdatedTitle: "Emelitere ọkwa",
    noticeStageUpdatedBody:
      "Emelitere ọkwa onye nwere mmasị. Ọ ga-ahụ mgbanwe a na mpaghara onye nwere mmasị nke ya.",
    noticeNoteAddedTitle: "Agbakwunyere ndetu",
    noticeNoteAddedBody: "Edebela ndetu gị na arịrịọ a.",
    stageSectionTitle: "Melite ọkwa",
    stageNotePlaceholder: "Ihe gbasara mgbanwe a",
    stagePending: "Na-emelite ọkwa...",
    stageSubmit: "Melite ọkwa",
    noteSectionTitle: "Ndetu ime",
    notePlaceholder: "Tinye ndetu nzuzo banyere onye nwere mmasị a",
    notePending: "Na-edebe ndetu...",
    noteSubmit: "Tinye ndetu",
    activitySectionTitle: "Akụkọ ihe omume",
    activityEmptyKicker: "Enweghị ihe omume ọ bụla",
    activityEmptyTitle: "Edeghị ihe omume ọ bụla maka arịrịọ a.",
    activityEmptyBody:
      "Mgbanwe ọkwa, ndetu, na mmelite dị mkpa ga-apụta ebe a ka ị na-arụ ọrụ site na usoro ịchụ ọrụ.",
  },
};

const YO: DeepPartial<JobsCopy> = {
  nav: {
    browse: "Wo awọn iṣẹ",
    post: "Firanṣẹ iṣẹ",
    applications: "Awọn ìbéèrè",
    account: "Akọọlẹ",
  },
  hero: {
    title: "Gbigba ẹgbẹ amọja, laisi ariwo ti o wọpọ.",
    subtitle: "Wa awọn ipa idojukọ lati ọdọ awọn agbanisiṣẹ to ṣe pataki nipa gbigba wọn.",
    searchPlaceholder: "Ipa, ẹgbẹ, tabi ile-iṣẹ",
    ctaBrowse: "Wo awọn iṣẹ ti o ṣii",
    ctaHire: "Mo n gba ẹgbẹ",
  },
  filters: {
    allRoles: "Gbogbo awọn ipa",
    fullTime: "Akoko kikun",
    partTime: "Akoko apakan",
    contract: "Adehun",
    remote: "Lati ibikan",
    onsite: "Ni ibi",
    hybrid: "Idapọ",
    location: "Ipo",
    salary: "Owo-iṣẹ",
    experience: "Iriri",
    clearAll: "Mọ gbogbo",
  },
  listing: {
    applyNow: "Beere bayi",
    saveJob: "Fi iṣẹ pamọ",
    shareJob: "Pin",
    postedAgo: "Ti firanṣẹ",
    deadline: "Ọjọ ikẹhin fun ìbéèrè",
    salary: "Owo-iṣẹ",
    jobType: "Iru iṣẹ",
    location: "Ipo",
    experience: "Iriri ti a nilo",
    skills: "Awọn ẹgbẹ",
    aboutRole: "Nipa ipa naa",
    aboutCompany: "Nipa ile-iṣẹ",
    viewCompany: "Wo ile-iṣẹ",
  },
  application: {
    title: "Beere fun ipa yii",
    resume: "CV",
    coverLetter: "Lẹta ibọwọ",
    submit: "Fi ìbéèrè ranṣẹ",
    submitted: "Ìbéèrè ti firanṣẹ",
    underReview: "Ni atunyẹwo",
    shortlisted: "Ti yan",
    rejected: "Ko nlọsiwaju",
    offerMade: "Ìfunni ti ṣe",
  },
  hiring: {
    postJob: "Firanṣẹ iṣẹ",
    managePostings: "Ṣakoso awọn atẹjade",
    reviewApplications: "Wo awọn ìbéèrè",
    closePosting: "Pa atẹjade",
    editPosting: "Ṣatunṣe atẹjade",
  },
  empty: {
    noJobs: "Ko si iṣẹ ti o baamu. Gbiyanju lati ṣatunṣe àlẹmọ rẹ.",
    noApplications: "Ko si ìbéèrè sibẹsibẹ.",
    noPostings: "Ko si atẹjade iṣẹ ti nṣiṣẹ.",
  },
  employerHiring: {
    pageTitle: "Awọn ọna gbigba iṣẹ",
    pageSubtitle:
      "Ṣakoso awọn ọna gbigba iṣẹ rẹ ti nṣiṣẹ, ba awọn olubẹwẹ sọrọ, ki o si ṣeto awọn ifọrọwanilẹnuwo lati ibi iṣẹ kanṣoṣo.",
    sectionTitle: "Gbogbo awọn ọna",
    sectionBody:
      "Ọna kọọkan baamu ipa kan ti nṣiṣẹ tabi ti tẹlẹ. Ṣii ọna lati ṣayẹwo awọn olubẹwẹ, awọn ibaraẹnisọrọ, ati awọn ifọrọwanilẹnuwo.",
    emptyMessage:
      "Ko si ọna gbigba iṣẹ sibẹsibẹ. A ṣẹda awọn ọna laifọwọyi nigbati o ba tẹjade ipa kan.",
    applicantSingular: "olubẹwẹ",
    applicantPlural: "awọn olubẹwẹ",
    statusActive: "Nṣiṣẹ",
    statusPaused: "Duro",
    statusClosed: "Ti pa",
  },
  employerCompany: {
    pageTitle: "Profaili ile-iṣẹ",
    pageSubtitle:
      "Ṣeto profaili ile-iṣẹ rẹ ki awọn olubẹwẹ le mọ nipa ẹgbẹ rẹ.",
    rightRailVerificationTitle: "Ipo ìfìdíhanrọ̀",
    rightRailStatusLabel: "Ipo",
    rightRailStatusPending: "ndúró",
    rightRailStatusPendingCapitalized: "Ndúró",
    rightRailOpenRoleSingular: "ipa ṣíṣí",
    rightRailOpenRolePlural: "awọn ipa ṣíṣí",
    rightRailResponseSlaTemplate:
      "{count} {roleLabel}. O nlo lati dahun fun awọn olubẹwẹ laarin wakati {hours}.",
    rightRailEmptyProfileBody:
      "Da profaili ile-iṣẹ rẹ silẹ lati bẹrẹ ìlànà ìfìdíhanrọ̀ ati ṣeto ojú-ìwé agbanisiṣẹ ọlá-jùmọ̀.",
    rightRailTipsTitle: "Awọn imọran fun profaili to lagbara",
    rightRailTipDescription:
      "Apejuwe ọlá-jùmọ̀ kedere ti ẹgbẹ ati ìpinnu láti gba ẹnikẹni síṣẹ́.",
    rightRailTipPolicies:
      "Awọn ìlànà iṣẹ, awọn ipo, ati awọn ìṣe àṣà tí ó mú ìṣòro kúrò.",
    rightRailTipVerified:
      "Ìjókòó tí a fìdí múlẹ̀ tí àwọn olùforíniṣẹ́ àti olubẹwẹ lè gbẹ́kẹ̀lé.",
    profileSavedNoticeTitle: "Profaili agbanisiṣẹ ti fipamọ",
    profileSavedNoticeBodyTemplate:
      "A ti fi {name} pamọ. Profaili ile-iṣẹ rẹ ti wa ní ìlà ìfìdíhanrọ̀ báyìí.",
    verificationCalloutBodySuffix:
      "Pari ìfìdíhanrọ̀ ákántì ṣáájú kí o tó dúró de ìfìjáde ipa tàbí àwọn àyípadà ìgbẹ́kẹ̀lé agbanisiṣẹ.",
    openAccountVerification: "Ṣí ìfìdíhanrọ̀ ákántì",
    sectionTitle: "Awọn ẹ̀kúnrẹ́rẹ́ ile-iṣẹ",
    sectionBody:
      "Ìfítónilétí yìí farahàn lori ojú-ìwé agbanisiṣẹ ọlá-jùmọ̀ rẹ ó sì ràn àwọn olubẹwẹ lọ́wọ́ láti ṣàyẹ̀wò ile-iṣẹ rẹ.",
    fieldNamePlaceholder: "Orúkọ ile-iṣẹ",
    fieldSlugPlaceholder: "slug-ile-iṣẹ",
    fieldTaglinePlaceholder: "Òrò ìpolówó",
    fieldDescriptionPlaceholder: "Apejuwe agbanisiṣẹ",
    fieldWebsitePlaceholder: "Wẹ́bùsáìtì",
    fieldIndustryPlaceholder: "Eka",
    fieldLocationsPlaceholder: "Lagos, Abuja, Lati ibikan",
    fieldHeadcountPlaceholder: "Iye àwọn òṣìṣẹ́",
    fieldRemotePolicyPlaceholder: "Ìlànà iṣẹ́ latibikan",
    fieldBenefitsHeadlinePlaceholder: "Anfani pàtàkì",
    fieldCulturePointsPlaceholder: "Awọn ìṣe àṣà",
    employerTypeExternal: "Agbanisiṣẹ ode",
    employerTypeInternal: "Ìgbaniṣiṣẹ́ inú HenryCo",
    submitSaving: "Ńfi ile-iṣẹ pamọ...",
    submitLabel: "Fi profaili agbanisiṣẹ pamọ",
  },
  employerJobs: {
    pageTitle: "Awọn iṣẹ agbanisiṣẹ",
    pageSubtitle: "Ṣakoso awọn ipolongo iṣẹ rẹ ki o ṣe ìtọpinpin awọn olubẹwẹ.",
    sectionTitle: "Awọn ipa tí a tẹjáde",
    postRoleCta: "Tẹ iṣẹ tuntun jáde",
    emptyKicker: "Kò sí ipa tó ń ṣiṣẹ́",
    emptyTitle: "Tẹ ipa àkọ́kọ́ jáde fún agbanisiṣẹ yìí.",
    emptyBody:
      "Lẹ́yìn tí a bá dá ipa kan sílẹ̀, àkọsílẹ̀ yìí á ṣàfihàn ipò àtúnyẹ̀wò, hiho, àti iye olubẹwẹ.",
    emptyAction: "Ṣí olùtọ́ ipa",
    applicantSingular: "olubẹwẹ",
    applicantPlural: "olubẹwẹ",
    roleLineTemplate: "{location} · {count} {applicantLabel}",
    statusApproved: "Fọwọsi",
    statusPendingReview: "N duro de àtúnyẹ̀wò",
    statusFlagged: "Tí a sàmì sí",
    statusDraft: "Àkọpamọ́",
  },
  employerApplicants: {
    pageTitle: "Awọn olubẹwẹ",
    pageSubtitle:
      "Ṣe àyẹ̀wò kí o sì mú àwọn olubẹwẹ tòótọ́ kọjá ọ̀nà ìgbaniṣiṣẹ́ rẹ.",
    sectionTitle: "Tábìlì àwọn olubẹwẹ",
    tableCandidate: "Olubẹwẹ",
    tableRole: "Ipa",
    tableStage: "Ipele",
    tableProfile: "Profaili",
    tableMatch: "Ìbámu",
    noEmail: "Kò sí ímẹ̀ìlì",
    emptyKicker: "Ọ̀nà mọ́",
    emptyTitle: "Kò sí ìbéèrè kankan nínú ààyè yìí síbẹ̀.",
    emptyBody:
      "Awọn olubẹwẹ tuntun á farahàn níbí ní gbàrà tí àwọn ipa bá bẹ̀rẹ̀ sí gba àwọn ìbéèrè tòótọ́.",
    stageReviewing: "Ní àtúnyẹ̀wò",
    stageShortlisted: "Tí a yan",
    stageInterview: "Ìfọ̀rọ̀wánilẹ́nuwò",
    stageOffer: "Ìfunni",
    stageHired: "Tí a gbà",
    stageRejected: "Tí a kọ̀",
    detailTitle: "Àlàyé olubẹwẹ",
    detailSubtitle:
      "Ṣe àyẹ̀wò olubẹwẹ yìí, mú u kọjá àwọn ipele, kí o sì fi àwọn àkọsílẹ̀ kún.",
    detailJobTemplate: "{jobTitle} · {employerName}",
    profileStrengthTemplate: "Agbára profaili {percent}%",
    matchConfidenceTemplate: "Ìgbẹ́kẹ̀lé ìbámu {percent}%",
    noCoverNote: "Kò sí lẹ́tà ìbọ̀wọ̀ kan tí a pèsè.",
    noticeStageUpdatedTitle: "A ti ṣe àtúnṣe ipele",
    noticeStageUpdatedBody:
      "A ti ṣe àtúnṣe ipele olubẹwẹ. Yóò rí ìyípadà náà ní àyè olubẹwẹ rẹ̀.",
    noticeNoteAddedTitle: "A ti fi àkọsílẹ̀ kún",
    noticeNoteAddedBody: "A ti fi àkọsílẹ̀ rẹ pamọ́ sí ìbéèrè yìí.",
    stageSectionTitle: "Ṣe àtúnṣe ipele",
    stageNotePlaceholder: "Ìdí fún ìṣíṣẹ́ náà",
    stagePending: "Ńṣe àtúnṣe ipele...",
    stageSubmit: "Ṣe àtúnṣe ipele",
    noteSectionTitle: "Àkọsílẹ̀ inú",
    notePlaceholder: "Fi àkọsílẹ̀ ìkọ̀kọ̀ kún nípa olubẹwẹ yìí",
    notePending: "Ńpa àkọsílẹ̀ mọ́...",
    noteSubmit: "Fi àkọsílẹ̀ kún",
    activitySectionTitle: "Ìtàn ìṣẹ̀lẹ̀",
    activityEmptyKicker: "Kò sí ìṣẹ̀lẹ̀ síbẹ̀",
    activityEmptyTitle: "Kò sí ìṣẹ̀lẹ̀ kankan tí a kọ sílẹ̀ fún ìbéèrè yìí.",
    activityEmptyBody:
      "Àwọn ìyípadà ipele, àkọsílẹ̀, àti àwọn àtúnṣe pàtàkì á farahàn níbí bí o ṣe ń ṣiṣẹ́ kọjá ìlànà ìgbaniṣiṣẹ́.",
  },
  candidateProfile: {
    pageTitle: "Profaili Olùbẹ̀wẹ̀",
    pageSubtitle:
      "Jẹ́ kí profaili rẹ pé kí àwọn agbanisíṣẹ́ rí ọ̀nà tó dára jùlọ tó o lè fihàn.",
    rightRailTrustTitle: "Ìgbẹ́kẹ̀lé profaili",
    rightRailVerificationKicker: "Ìdánilójú",
    rightRailDefaultReadiness:
      "Pari profaili rẹ kí ó lè dára sí i bí àwọn agbanisíṣẹ́ ṣe ń wo àwọn ìbéèrè rẹ.",
    rightRailOpenVerification: "Ṣí ìdánilójú akọọlẹ",
    rightRailDocumentsTitle: "Àwọn àkọsílẹ̀",
    rightRailDocumentsCountSingular: "A gbé fáìlì {count} kalẹ̀ sí profaili rẹ.",
    rightRailDocumentsCountPlural: "A gbé fáìlì {count} kalẹ̀ sí profaili rẹ.",
    rightRailDocumentsHint:
      "Àwọn ọgbọ́n, ìtàn iṣẹ́, àti àwọn ìjápọ̀ àkójọ iṣẹ́ ń ràn àwọn agbanisíṣẹ́ lọ́wọ́ láti ṣàyẹ̀wò àwọn ìbéèrè rẹ.",
    statusVerified: "Tí a dánilójú",
    statusPending: "N duro",
    statusRejected: "Tí a kọ̀",
    statusUnverified: "Aì dánilójú",
    savedNoticeTitle: "A pa profaili mọ́",
    savedNoticeBody:
      "A ti ṣe àtúnṣe profaili rẹ. Àwọn ìyípadà han fún àwọn agbanisíṣẹ́ nígbà tí o bá ń bẹ̀rẹ̀ ìbéèrè.",
    draftSectionTitle: "Àkọpamọ́ profaili",
    draftSectionBody:
      "Àwọn ìyípadà tí ó wà lọ́wọ́lọ́wọ́ ń pa ara wọn mọ́ ní gbogbo ìṣẹ́jú 30 àti nígbà tí o bá kúrò ní ààyè. Tẹ ‘Pa profaili mọ́’ nísàlẹ̀ láti tẹ̀jáde.",
    editSectionTitle: "Ṣàtúnṣe profaili rẹ",
    editSectionBody:
      "Àwọn ẹ̀kúnrẹ́rẹ́ iṣẹ́ níhìn-ín han fún àwọn agbanisíṣẹ́ nígbà tí o bá ń bẹ̀rẹ̀ ìbéèrè fún ipa. HenryCo ní fóònù àti ímẹ̀ìlì rẹ fún ìdánilójú àti àmì ìgbẹ́kẹ̀lé nìkan — kì í ṣe fún àwọn agbanisíṣẹ́.",
    fieldFullNamePlaceholder: "Orúkọ kíkún",
    fieldHeadlinePlaceholder: "Àkọ́sórí",
    fieldSummaryPlaceholder: "Àkópọ̀ iṣẹ́",
    fieldLocationPlaceholder: "Ibi tí o wà",
    fieldTimezonePlaceholder: "Agbègbè àkókò",
    fieldWorkModesPlaceholder: "látòkèèrè, àdàlú, ní ọ́físì",
    fieldRoleTypesPlaceholder: "àkókò kíkún, àdéhùn",
    fieldPreferredFunctionsPlaceholder: "Ọjà, Iṣiṣẹ́, Títanìkàlẹ̀",
    fieldSkillsPlaceholder: "Àwọn ọgbọ́n",
    fieldPortfolioLinksPlaceholder: "Àwọn ìjápọ̀ àkójọ iṣẹ́",
    fieldSalaryExpectationPlaceholder: "Owó-oṣù tí a ń retí",
    fieldAvailabilityPlaceholder: "Wíwà",
    fieldWorkHistoryPlaceholder: '[{"company":"HenryCo","title":"Olórí iṣẹ́"}]',
    fieldEducationPlaceholder: '[{"school":"Yunifásítì","degree":"BSc"}]',
    fieldCertificationsPlaceholder: '[{"name":"Ìṣàkóso iṣẹ́"}]',
    submitSaving: "Ń pa profaili mọ́...",
    submitLabel: "Pa profaili olùbẹ̀wẹ̀ mọ́",
  },
};

const HA: DeepPartial<JobsCopy> = {
  nav: {
    browse: "Duba ayyuka",
    post: "Sanya aikin",
    applications: "Aikace-aikace",
    account: "Asusun",
  },
  hero: {
    title: "Daukar ma'aikata tabbatattu, ba tare da hayaniyar da aka saba ba.",
    subtitle: "Sami matsayi mai mayar da hankali daga masu daukar ma'aikata masu girma a zaɓin su.",
    searchPlaceholder: "Matsayi, ƙwarewa, ko kamfani",
    ctaBrowse: "Duba ayyukan da suke buɗe",
    ctaHire: "Ina daukar ma'aikata",
  },
  filters: {
    allRoles: "Duk matsayi",
    fullTime: "Cikakken lokaci",
    partTime: "Rabin lokaci",
    contract: "Kwantiragin",
    remote: "Nesa",
    onsite: "A wurin",
    hybrid: "Haɗin",
    location: "Wuri",
    salary: "Albashi",
    experience: "Gogewa",
    clearAll: "Share duka",
  },
  listing: {
    applyNow: "Nemi yanzu",
    saveJob: "Adana aikin",
    shareJob: "Raba",
    postedAgo: "An buga",
    deadline: "Ƙarshen rana don nema",
    salary: "Albashi",
    jobType: "Nau'in aiki",
    location: "Wuri",
    experience: "Gogewa da ake buƙata",
    skills: "Ƙwarewa",
    aboutRole: "Game da matsayi",
    aboutCompany: "Game da kamfani",
    viewCompany: "Duba kamfani",
  },
  application: {
    title: "Nemi wannan matsayi",
    resume: "CV",
    coverLetter: "Wasiƙar gabatarwa",
    submit: "Aika nema",
    submitted: "An aika nema",
    underReview: "Ana duba",
    shortlisted: "An zaɓa",
    rejected: "Ba zai ci gaba ba",
    offerMade: "An yi tayin",
  },
  hiring: {
    postJob: "Sanya aikin",
    managePostings: "Sarrafa sanarwa",
    reviewApplications: "Duba aikace-aikace",
    closePosting: "Rufe sanarwa",
    editPosting: "Gyara sanarwa",
  },
  empty: {
    noJobs: "Ba a sami ayyuka masu dacewa ba. Gwada canza tacewa.",
    noApplications: "Babu aikace-aikace tukuna.",
    noPostings: "Babu sanarwar aiki mai aiki.",
  },
  employerHiring: {
    pageTitle: "Layukan daukar ma'aikata",
    pageSubtitle:
      "Sarrafa layukan daukar ma'aikata masu aiki, sadarwa da masu nema, da tsara hira daga wuri ɗaya.",
    sectionTitle: "Dukkan layuka",
    sectionBody:
      "Kowane layi yana wakiltar matsayi mai aiki ko na baya. Buɗe layi don duba masu nema, tattaunawa, da hirarraki.",
    emptyMessage:
      "Babu layukan daukar ma'aikata tukuna. Ana ƙirƙirar layuka ta atomatik lokacin da ka buga matsayi.",
    applicantSingular: "mai nema",
    applicantPlural: "masu nema",
    statusActive: "Mai aiki",
    statusPaused: "An dakatar",
    statusClosed: "An rufe",
  },
  employerCompany: {
    pageTitle: "Bayanan kamfani",
    pageSubtitle:
      "Saita bayanan kamfaninka don masu nema su iya sanin game da tawagarka.",
    rightRailVerificationTitle: "Matsayin tabbatarwa",
    rightRailStatusLabel: "Matsayi",
    rightRailStatusPending: "ana jira",
    rightRailStatusPendingCapitalized: "Ana jira",
    rightRailOpenRoleSingular: "matsayi a buɗe",
    rightRailOpenRolePlural: "matsayi a buɗe",
    rightRailResponseSlaTemplate:
      "{count} {roleLabel}. Burinka shi ne ka amsa wa masu nema cikin awa {hours}.",
    rightRailEmptyProfileBody:
      "Ƙirƙira bayanan kamfaninka don fara aikin tabbatarwa da kuma saita shafin ma'aikacin jama'ar ka.",
    rightRailTipsTitle: "Shawarwari don ingantaccen bayani",
    rightRailTipDescription:
      "Bayani na jama'a a fili game da tawagar da niyyar daukar ma'aikata.",
    rightRailTipPolicies:
      "Ƙa'idodin aiki, wurare, da abubuwan al'ada da ke kawar da rashin tabbas.",
    rightRailTipVerified:
      "Kasancewar da aka tabbatar wadda masu daukar ma'aikata da masu nema za su iya amincewa da ita.",
    profileSavedNoticeTitle: "An adana bayanan ma'aikaci",
    profileSavedNoticeBodyTemplate:
      "An adana {name}. Bayanan kamfaninka yanzu yana cikin jerin jiran tabbatarwa.",
    verificationCalloutBodySuffix:
      "Kammala tabbatar da asusu kafin ka yi tsammanin sakin matsayi ko inganta amincewar ma'aikaci.",
    openAccountVerification: "Buɗe tabbatar da asusu",
    sectionTitle: "Cikakkun bayanan kamfani",
    sectionBody:
      "Wannan bayanin yana bayyana akan shafin ma'aikacin jama'ar ka kuma yana taimaka wa masu nema su kimanta kamfaninka.",
    fieldNamePlaceholder: "Sunan kamfani",
    fieldSlugPlaceholder: "slug-kamfani",
    fieldTaglinePlaceholder: "Taken",
    fieldDescriptionPlaceholder: "Bayanin ma'aikaci",
    fieldWebsitePlaceholder: "Yanar gizo",
    fieldIndustryPlaceholder: "Sashe",
    fieldLocationsPlaceholder: "Lagos, Abuja, Nesa",
    fieldHeadcountPlaceholder: "Adadin ma'aikata",
    fieldRemotePolicyPlaceholder: "Manufar aiki na nesa",
    fieldBenefitsHeadlinePlaceholder: "Manyan amfanin",
    fieldCulturePointsPlaceholder: "Abubuwan al'ada",
    employerTypeExternal: "Ma'aikaci na waje",
    employerTypeInternal: "Daukar ma'aikata na cikin HenryCo",
    submitSaving: "Ana adana kamfani...",
    submitLabel: "Adana bayanan ma'aikaci",
  },
  employerJobs: {
    pageTitle: "Ayyukan ma'aikaci",
    pageSubtitle: "Sarrafa tallace-tallacen ayyukanka kuma ka bibiyi masu nema.",
    sectionTitle: "Ayyukan da aka wallafa",
    postRoleCta: "Wallafa aiki",
    emptyKicker: "Babu ayyukan aiki",
    emptyTitle: "Wallafa aiki na farko don wannan ma'aikaci.",
    emptyBody:
      "Da zarar an ƙirƙira aiki, wannan jeri zai bibiyi yanayin tantancewa, ganuwa, da yawan masu nema.",
    emptyAction: "Buɗe mai gina aiki",
    applicantSingular: "mai nema",
    applicantPlural: "masu nema",
    roleLineTemplate: "{location} · {count} {applicantLabel}",
    statusApproved: "An amince",
    statusPendingReview: "Ana jiran tantancewa",
    statusFlagged: "An yiwa alama",
    statusDraft: "Zane",
  },
  employerApplicants: {
    pageTitle: "Masu nema",
    pageSubtitle:
      "Duba kuma matsar da masu nema na gaske ta hanyar tarukan ma'aikaci naka.",
    sectionTitle: "Teburin masu nema",
    tableCandidate: "Mai nema",
    tableRole: "Matsayi",
    tableStage: "Mataki",
    tableProfile: "Bayani",
    tableMatch: "Daidaitawa",
    noEmail: "Babu imel",
    emptyKicker: "Tarukan a buɗe yake",
    emptyTitle: "Babu wasu aikace-aikace a wannan layi tukuna.",
    emptyBody:
      "Sabbin masu nema za su bayyana a nan da zaran ayyuka suka fara karɓar aikace-aikace na gaske.",
    stageReviewing: "Ana dubawa",
    stageShortlisted: "An zaɓa",
    stageInterview: "Hira",
    stageOffer: "Tayi",
    stageHired: "An ɗauka",
    stageRejected: "An ƙi",
    detailTitle: "Bayanin mai nema",
    detailSubtitle:
      "Duba wannan mai nema, ka matsar da shi ta matakai, kuma ka ƙara bayanai.",
    detailJobTemplate: "{jobTitle} · {employerName}",
    profileStrengthTemplate: "Ƙarfin bayani {percent}%",
    matchConfidenceTemplate: "Amincin daidaitawa {percent}%",
    noCoverNote: "Babu wasiƙar gabatarwa da aka samar.",
    noticeStageUpdatedTitle: "An sabunta mataki",
    noticeStageUpdatedBody:
      "An sabunta matakin mai nema. Zai ga sauyin a sararin mai nema nasa.",
    noticeNoteAddedTitle: "An ƙara bayani",
    noticeNoteAddedBody: "An adana bayaninka a wannan neman.",
    stageSectionTitle: "Sabunta mataki",
    stageNotePlaceholder: "Mahallin canjin",
    stagePending: "Ana sabunta mataki...",
    stageSubmit: "Sabunta mataki",
    noteSectionTitle: "Bayani na ciki",
    notePlaceholder: "Ƙara bayani na sirri game da wannan mai nema",
    notePending: "Ana adana bayani...",
    noteSubmit: "Ƙara bayani",
    activitySectionTitle: "Tarihin ayyuka",
    activityEmptyKicker: "Babu ayyuka tukuna",
    activityEmptyTitle: "Babu wasu abubuwan da aka rubuta don wannan neman.",
    activityEmptyBody:
      "Canje-canjen matakai, bayanai, da muhimman sabuntawa za su bayyana a nan yayin da kake aiki ta hanyar tsarin ɗaukar ma'aikata.",
  },
  candidateProfile: {
    pageTitle: "Bayanin Mai Nema",
    pageSubtitle:
      "Ka cika bayanin ka don ma'aikata su ga mafi kyawun siffarka.",
    rightRailTrustTitle: "Amincin bayanin",
    rightRailVerificationKicker: "Tantancewa",
    rightRailDefaultReadiness:
      "Ka cika bayanin ka don inganta yadda ma'aikata suke duba aikace-aikacenka.",
    rightRailOpenVerification: "Buɗe tantance asusu",
    rightRailDocumentsTitle: "Takardu",
    rightRailDocumentsCountSingular: "An ɗora fayil {count} a bayanin ka.",
    rightRailDocumentsCountPlural: "An ɗora fayiloli {count} a bayanin ka.",
    rightRailDocumentsHint:
      "Ƙwarewa, tarihin aiki, da hanyoyin haɗin fayil suna taimaka wa ma'aikata su tantance aikace-aikacenka.",
    statusVerified: "An tantance",
    statusPending: "Ana jira",
    statusRejected: "An ƙi",
    statusUnverified: "Ba a tantance ba",
    savedNoticeTitle: "An adana bayanin",
    savedNoticeBody:
      "An sabunta bayanin ka. Canje-canjen suna bayyana ga ma'aikata yayin da kake nema.",
    draftSectionTitle: "Daftarin bayanin",
    draftSectionBody:
      "Canje-canjen da ake yi yanzu suna adana kansu kowane sakan 30 da lokacin da ka bar maɓallin. Danna ‘Adana bayanin’ a ƙasa don wallafa.",
    editSectionTitle: "Gyara bayanin ka",
    editSectionBody:
      "Bayanan sana'a a nan suna bayyana ga ma'aikata lokacin da kake neman ayyuka. HenryCo na riƙe da waya da imel don tantancewa da kimar amincewa kawai — ba a aika su ga ma'aikata ba.",
    fieldFullNamePlaceholder: "Cikakken suna",
    fieldHeadlinePlaceholder: "Kanun bayani",
    fieldSummaryPlaceholder: "Taƙaitaccen sana'a",
    fieldLocationPlaceholder: "Wuri",
    fieldTimezonePlaceholder: "Yankin lokaci",
    fieldWorkModesPlaceholder: "nesa, hadi, a ofis",
    fieldRoleTypesPlaceholder: "cikakken lokaci, kwangila",
    fieldPreferredFunctionsPlaceholder: "Samfuri, Ayyuka, Talla",
    fieldSkillsPlaceholder: "Ƙwarewa",
    fieldPortfolioLinksPlaceholder: "Hanyoyin haɗin fayil",
    fieldSalaryExpectationPlaceholder: "Albashin da ake tsammanin",
    fieldAvailabilityPlaceholder: "Samuwa",
    fieldWorkHistoryPlaceholder: '[{"company":"HenryCo","title":"Jagoran ayyuka"}]',
    fieldEducationPlaceholder: '[{"school":"Jami\'a","degree":"BSc"}]',
    fieldCertificationsPlaceholder: '[{"name":"Gudanar da ayyuka"}]',
    submitSaving: "Ana adana bayani...",
    submitLabel: "Adana bayanin mai nema",
  },
};

const DE: DeepPartial<JobsCopy> = {
  nav: {
    browse: "Jobs durchsuchen",
    post: "Job veröffentlichen",
    applications: "Bewerbungen",
    account: "Konto",
  },
  hero: {
    title: "Einstellung geprüfter Talente, ohne den üblichen Lärm.",
    subtitle: "Finden Sie fokussierte Stellen von Arbeitgebern, die bei der Einstellung ernst machen.",
    searchPlaceholder: "Stelle, Fähigkeit oder Unternehmen",
    ctaBrowse: "Offene Stellen ansehen",
    ctaHire: "Ich stelle ein",
  },
  filters: {
    allRoles: "Alle Stellen",
    fullTime: "Vollzeit",
    partTime: "Teilzeit",
    contract: "Vertrag",
    remote: "Remote",
    onsite: "Vor Ort",
    hybrid: "Hybrid",
    location: "Standort",
    salary: "Gehalt",
    experience: "Erfahrung",
    clearAll: "Alle löschen",
  },
  listing: {
    applyNow: "Jetzt bewerben",
    saveJob: "Job speichern",
    shareJob: "Teilen",
    postedAgo: "Veröffentlicht",
    deadline: "Bewerbungsfrist",
    salary: "Gehalt",
    jobType: "Jobtyp",
    location: "Standort",
    experience: "Erforderliche Erfahrung",
    skills: "Fähigkeiten",
    aboutRole: "Über die Stelle",
    aboutCompany: "Über das Unternehmen",
    viewCompany: "Unternehmen ansehen",
  },
  application: {
    title: "Für diese Stelle bewerben",
    resume: "Lebenslauf / CV",
    coverLetter: "Anschreiben",
    submit: "Bewerbung einreichen",
    submitted: "Bewerbung eingereicht",
    underReview: "In Prüfung",
    shortlisted: "In der engeren Auswahl",
    rejected: "Nicht weiterverfolgt",
    offerMade: "Angebot gemacht",
  },
  hiring: {
    postJob: "Job veröffentlichen",
    managePostings: "Veröffentlichungen verwalten",
    reviewApplications: "Bewerbungen prüfen",
    closePosting: "Veröffentlichung schließen",
    editPosting: "Veröffentlichung bearbeiten",
  },
  empty: {
    noJobs: "Keine passenden Jobs gefunden. Passen Sie Ihre Filter an.",
    noApplications: "Noch keine Bewerbungen.",
    noPostings: "Keine aktiven Stellenanzeigen.",
  },
  employerHiring: {
    pageTitle: "Einstellungspipelines",
    pageSubtitle:
      "Verwalten Sie Ihre aktiven Einstellungspipelines, kommunizieren Sie mit Bewerbern und planen Sie Interviews aus einem Arbeitsbereich.",
    sectionTitle: "Alle Pipelines",
    sectionBody:
      "Jede Pipeline entspricht einer aktiven oder vergangenen Stelle. Öffnen Sie eine Pipeline, um Bewerber, Gespräche und Interviews einzusehen.",
    emptyMessage:
      "Noch keine Einstellungspipelines. Pipelines werden automatisch erstellt, sobald Sie eine Stelle veröffentlichen.",
    applicantSingular: "Bewerber",
    applicantPlural: "Bewerber",
    statusActive: "Aktiv",
    statusPaused: "Pausiert",
    statusClosed: "Geschlossen",
  },
  employerCompany: {
    pageTitle: "Unternehmensprofil",
    pageSubtitle:
      "Richten Sie Ihr Unternehmensprofil ein, damit Bewerber Ihr Team kennenlernen können.",
    rightRailVerificationTitle: "Verifizierungsstatus",
    rightRailStatusLabel: "Status",
    rightRailStatusPending: "ausstehend",
    rightRailStatusPendingCapitalized: "Ausstehend",
    rightRailOpenRoleSingular: "offene Stelle",
    rightRailOpenRolePlural: "offene Stellen",
    rightRailResponseSlaTemplate:
      "{count} {roleLabel}. Sie streben an, Bewerbern innerhalb von {hours} Stunden zu antworten.",
    rightRailEmptyProfileBody:
      "Erstellen Sie Ihr Unternehmensprofil, um den Verifizierungsprozess zu starten und Ihre öffentliche Arbeitgeberseite einzurichten.",
    rightRailTipsTitle: "Tipps für ein starkes Profil",
    rightRailTipDescription:
      "Eine klare öffentliche Beschreibung des Teams und der Einstellungsabsicht.",
    rightRailTipPolicies:
      "Arbeitsrichtlinien, Standorte und Kulturpunkte, die Mehrdeutigkeit beseitigen.",
    rightRailTipVerified:
      "Eine verifizierte Präsenz, der Recruiter und Bewerber vertrauen können.",
    profileSavedNoticeTitle: "Arbeitgeberprofil gespeichert",
    profileSavedNoticeBodyTemplate:
      "{name} wurde gespeichert. Ihr Unternehmensprofil befindet sich nun in der Verifizierungswarteschlange.",
    verificationCalloutBodySuffix:
      "Schließen Sie die Kontoverifizierung ab, bevor Sie mit der Stellenveröffentlichung oder Upgrades des Arbeitgebervertrauens rechnen.",
    openAccountVerification: "Kontoverifizierung öffnen",
    sectionTitle: "Unternehmensdetails",
    sectionBody:
      "Diese Informationen erscheinen auf Ihrer öffentlichen Arbeitgeberseite und helfen Bewerbern, Ihr Unternehmen zu bewerten.",
    fieldNamePlaceholder: "Unternehmensname",
    fieldSlugPlaceholder: "unternehmens-slug",
    fieldTaglinePlaceholder: "Slogan",
    fieldDescriptionPlaceholder: "Arbeitgeberbeschreibung",
    fieldWebsitePlaceholder: "Webseite",
    fieldIndustryPlaceholder: "Branche",
    fieldLocationsPlaceholder: "Lagos, Abuja, Remote",
    fieldHeadcountPlaceholder: "Mitarbeiterzahl",
    fieldRemotePolicyPlaceholder: "Remote-Richtlinie",
    fieldBenefitsHeadlinePlaceholder: "Leistungen im Überblick",
    fieldCulturePointsPlaceholder: "Kulturpunkte",
    employerTypeExternal: "Externer Arbeitgeber",
    employerTypeInternal: "Interne HenryCo-Einstellung",
    submitSaving: "Unternehmen wird gespeichert...",
    submitLabel: "Arbeitgeberprofil speichern",
  },
  employerJobs: {
    pageTitle: "Arbeitgeber-Stellen",
    pageSubtitle: "Verwalten Sie Ihre Stellenausschreibungen und behalten Sie Bewerbungen im Blick.",
    sectionTitle: "Veröffentlichte Stellen",
    postRoleCta: "Stelle veröffentlichen",
    emptyKicker: "Keine aktiven Stellen",
    emptyTitle: "Veröffentlichen Sie die erste Stelle für diesen Arbeitgeber.",
    emptyBody:
      "Sobald eine Stelle erstellt ist, zeigt diese Liste Moderationsstatus, Sichtbarkeit und Bewerberaufkommen.",
    emptyAction: "Stellenbaukasten öffnen",
    applicantSingular: "Bewerber",
    applicantPlural: "Bewerber",
    roleLineTemplate: "{location} · {count} {applicantLabel}",
    statusApproved: "Genehmigt",
    statusPendingReview: "In Prüfung",
    statusFlagged: "Markiert",
    statusDraft: "Entwurf",
  },
  employerApplicants: {
    pageTitle: "Bewerbungen",
    pageSubtitle:
      "Überprüfen Sie echte Bewerbungen und bewegen Sie sie durch Ihre Arbeitgeber-Pipeline.",
    sectionTitle: "Bewerbungsübersicht",
    tableCandidate: "Kandidat",
    tableRole: "Stelle",
    tableStage: "Stufe",
    tableProfile: "Profil",
    tableMatch: "Übereinstimmung",
    noEmail: "Keine E-Mail",
    emptyKicker: "Pipeline ist leer",
    emptyTitle: "Noch keine Bewerbungen in dieser Warteschlange.",
    emptyBody:
      "Neue Kandidaten erscheinen hier, sobald Stellen echte Bewerbungen erhalten.",
    stageReviewing: "In Prüfung",
    stageShortlisted: "In engerer Auswahl",
    stageInterview: "Interview",
    stageOffer: "Angebot",
    stageHired: "Eingestellt",
    stageRejected: "Abgelehnt",
    detailTitle: "Bewerberdetail",
    detailSubtitle:
      "Bewerten Sie diesen Kandidaten, bewegen Sie ihn durch die Stufen und fügen Sie Notizen hinzu.",
    detailJobTemplate: "{jobTitle} · {employerName}",
    profileStrengthTemplate: "Profilstärke {percent} %",
    matchConfidenceTemplate: "Match-Konfidenz {percent} %",
    noCoverNote: "Kein Anschreiben vorhanden.",
    noticeStageUpdatedTitle: "Stufe aktualisiert",
    noticeStageUpdatedBody:
      "Die Stufe des Kandidaten wurde aktualisiert. Er sieht die Änderung in seinem Kandidatenbereich.",
    noticeNoteAddedTitle: "Notiz hinzugefügt",
    noticeNoteAddedBody: "Ihre Notiz wurde zu dieser Bewerbung gespeichert.",
    stageSectionTitle: "Stufe aktualisieren",
    stageNotePlaceholder: "Kontext für den Wechsel",
    stagePending: "Stufe wird aktualisiert...",
    stageSubmit: "Stufe aktualisieren",
    noteSectionTitle: "Interne Notiz",
    notePlaceholder: "Private Notiz zu diesem Kandidaten hinzufügen",
    notePending: "Notiz wird gespeichert...",
    noteSubmit: "Notiz hinzufügen",
    activitySectionTitle: "Aktivitätsverlauf",
    activityEmptyKicker: "Noch keine Aktivität",
    activityEmptyTitle: "Für diese Bewerbung sind keine Ereignisse erfasst.",
    activityEmptyBody:
      "Stufenwechsel, Notizen und wichtige Aktualisierungen erscheinen hier, während Sie den Einstellungsprozess durchlaufen.",
  },
  candidateProfile: {
    pageTitle: "Bewerberprofil",
    pageSubtitle:
      "Halten Sie Ihr Profil vollständig, damit Arbeitgeber die beste Version von Ihnen sehen.",
    rightRailTrustTitle: "Profilvertrauen",
    rightRailVerificationKicker: "Verifizierung",
    rightRailDefaultReadiness:
      "Vervollständigen Sie Ihr Profil, um die Wahrnehmung Ihrer Bewerbungen durch Arbeitgeber zu verbessern.",
    rightRailOpenVerification: "Kontoverifizierung öffnen",
    rightRailDocumentsTitle: "Dokumente",
    rightRailDocumentsCountSingular: "{count} Datei in Ihr Profil hochgeladen.",
    rightRailDocumentsCountPlural: "{count} Dateien in Ihr Profil hochgeladen.",
    rightRailDocumentsHint:
      "Fähigkeiten, Berufserfahrung und Portfolio-Links helfen Arbeitgebern, Ihre Bewerbungen zu bewerten.",
    statusVerified: "Verifiziert",
    statusPending: "Ausstehend",
    statusRejected: "Abgelehnt",
    statusUnverified: "Nicht verifiziert",
    savedNoticeTitle: "Profil gespeichert",
    savedNoticeBody:
      "Ihr Profil wurde aktualisiert. Änderungen sind für Arbeitgeber sichtbar, wenn Sie sich bewerben.",
    draftSectionTitle: "Profilentwurf",
    draftSectionBody:
      "Laufende Änderungen werden alle 30 Sekunden und beim Verlassen des Feldes automatisch gespeichert. Drücken Sie unten auf „Profil speichern“, um zu veröffentlichen.",
    editSectionTitle: "Profil bearbeiten",
    editSectionBody:
      "Berufliche Angaben hier sind für Arbeitgeber sichtbar, wenn Sie sich auf Stellen bewerben. Telefon und E-Mail werden von HenryCo nur zur Verifizierung und Vertrauensbewertung gespeichert — sie werden nicht an Arbeitgeber weitergegeben.",
    fieldFullNamePlaceholder: "Vollständiger Name",
    fieldHeadlinePlaceholder: "Schlagzeile",
    fieldSummaryPlaceholder: "Berufliche Zusammenfassung",
    fieldLocationPlaceholder: "Standort",
    fieldTimezonePlaceholder: "Zeitzone",
    fieldWorkModesPlaceholder: "remote, hybrid, vor Ort",
    fieldRoleTypesPlaceholder: "Vollzeit, Vertrag",
    fieldPreferredFunctionsPlaceholder: "Produkt, Operations, Marketing",
    fieldSkillsPlaceholder: "Fähigkeiten",
    fieldPortfolioLinksPlaceholder: "Portfolio-Links",
    fieldSalaryExpectationPlaceholder: "Gehaltsvorstellung",
    fieldAvailabilityPlaceholder: "Verfügbarkeit",
    fieldWorkHistoryPlaceholder: '[{"company":"HenryCo","title":"Operations-Leiter"}]',
    fieldEducationPlaceholder: '[{"school":"Universität","degree":"BSc"}]',
    fieldCertificationsPlaceholder: '[{"name":"Projektmanagement"}]',
    submitSaving: "Profil wird gespeichert...",
    submitLabel: "Bewerberprofil speichern",
  },
};

const ZH: DeepPartial<JobsCopy> = {
  nav: {
    browse: "浏览职位",
    post: "发布职位",
    applications: "申请",
    account: "账户",
  },
  hero: {
    title: "招募经过验证的人才，没有通常的干扰。",
    subtitle: "从认真筛选人才的雇主处发现专注的职位。",
    searchPlaceholder: "职位、技能或公司",
    ctaBrowse: "浏览空缺职位",
    ctaHire: "我在招聘",
  },
  filters: {
    allRoles: "所有职位",
    fullTime: "全职",
    partTime: "兼职",
    contract: "合同",
    remote: "远程",
    onsite: "现场",
    hybrid: "混合",
    location: "地点",
    salary: "薪资",
    experience: "经验",
    clearAll: "清除所有",
  },
  listing: {
    applyNow: "立即申请",
    saveJob: "保存职位",
    shareJob: "分享",
    postedAgo: "已发布",
    deadline: "申请截止日期",
    salary: "薪资",
    jobType: "工作类型",
    location: "地点",
    experience: "所需经验",
    skills: "技能",
    aboutRole: "关于此职位",
    aboutCompany: "关于公司",
    viewCompany: "查看公司",
  },
  application: {
    title: "申请此职位",
    resume: "简历 / CV",
    coverLetter: "求职信",
    submit: "提交申请",
    submitted: "申请已提交",
    underReview: "审核中",
    shortlisted: "已入围",
    rejected: "未推进",
    offerMade: "已发出邀约",
  },
  hiring: {
    postJob: "发布职位",
    managePostings: "管理发布",
    reviewApplications: "查看申请",
    closePosting: "关闭发布",
    editPosting: "编辑发布",
  },
  empty: {
    noJobs: "未找到匹配的职位。请尝试调整筛选条件。",
    noApplications: "还没有申请。",
    noPostings: "没有活跃的职位发布。",
  },
  employerHiring: {
    pageTitle: "招聘流程",
    pageSubtitle: "在一个工作区中管理活跃招聘流程、与候选人沟通并安排面试。",
    sectionTitle: "全部流程",
    sectionBody: "每条流程对应一个活跃或已结束的职位。打开流程以查看候选人、对话和面试。",
    emptyMessage: "暂无招聘流程。发布职位后将自动创建流程。",
    applicantSingular: "位申请人",
    applicantPlural: "位申请人",
    statusActive: "进行中",
    statusPaused: "已暂停",
    statusClosed: "已关闭",
  },
  employerCompany: {
    pageTitle: "公司资料",
    pageSubtitle: "完善公司资料，让候选人了解你的团队。",
    rightRailVerificationTitle: "认证状态",
    rightRailStatusLabel: "状态",
    rightRailStatusPending: "待审核",
    rightRailStatusPendingCapitalized: "待审核",
    rightRailOpenRoleSingular: "个空缺职位",
    rightRailOpenRolePlural: "个空缺职位",
    rightRailResponseSlaTemplate:
      "{count} {roleLabel}。您计划在 {hours} 小时内回复候选人。",
    rightRailEmptyProfileBody: "创建公司资料以启动认证流程并设置公开雇主页面。",
    rightRailTipsTitle: "打造优质资料的建议",
    rightRailTipDescription: "对团队及招聘意向的清晰公开描述。",
    rightRailTipPolicies: "工作政策、办公地点和文化要点，消除模糊。",
    rightRailTipVerified: "招聘者和候选人都能信赖的认证形象。",
    profileSavedNoticeTitle: "雇主资料已保存",
    profileSavedNoticeBodyTemplate: "{name} 已保存。您的公司资料已进入认证队列。",
    verificationCalloutBodySuffix: "请先完成账户认证，再期待职位发布或雇主信任升级解锁。",
    openAccountVerification: "打开账户认证",
    sectionTitle: "公司详情",
    sectionBody: "这些信息将显示在您的公开雇主页面上，帮助候选人评估您的公司。",
    fieldNamePlaceholder: "公司名称",
    fieldSlugPlaceholder: "公司-slug",
    fieldTaglinePlaceholder: "标语",
    fieldDescriptionPlaceholder: "雇主介绍",
    fieldWebsitePlaceholder: "网站",
    fieldIndustryPlaceholder: "行业",
    fieldLocationsPlaceholder: "拉各斯、阿布贾、远程",
    fieldHeadcountPlaceholder: "员工人数",
    fieldRemotePolicyPlaceholder: "远程办公政策",
    fieldBenefitsHeadlinePlaceholder: "核心福利",
    fieldCulturePointsPlaceholder: "文化要点",
    employerTypeExternal: "外部雇主",
    employerTypeInternal: "HenryCo 内部招聘",
    submitSaving: "正在保存公司...",
    submitLabel: "保存雇主资料",
  },
  employerJobs: {
    pageTitle: "雇主职位",
    pageSubtitle: "管理你发布的职位并跟踪候选人。",
    sectionTitle: "已发布的职位",
    postRoleCta: "发布职位",
    emptyKicker: "暂无在招职位",
    emptyTitle: "为此雇主发布第一个职位。",
    emptyBody: "创建职位后，此列表将显示审核状态、可见性以及候选人数量。",
    emptyAction: "打开职位编辑器",
    applicantSingular: "候选人",
    applicantPlural: "候选人",
    roleLineTemplate: "{location} · {count} {applicantLabel}",
    statusApproved: "已批准",
    statusPendingReview: "审核中",
    statusFlagged: "已标记",
    statusDraft: "草稿",
  },
  employerApplicants: {
    pageTitle: "申请人",
    pageSubtitle: "审核并在你的雇主流水线中推进真实申请人。",
    sectionTitle: "申请人表格",
    tableCandidate: "候选人",
    tableRole: "职位",
    tableStage: "阶段",
    tableProfile: "档案",
    tableMatch: "匹配度",
    noEmail: "无邮箱",
    emptyKicker: "队列已清空",
    emptyTitle: "此队列中暂无申请。",
    emptyBody: "当职位开始收到真实申请时，新候选人将出现在此处。",
    stageReviewing: "审核中",
    stageShortlisted: "入围",
    stageInterview: "面试",
    stageOffer: "录用通知",
    stageHired: "已入职",
    stageRejected: "已拒绝",
    detailTitle: "申请人详情",
    detailSubtitle: "审核此候选人，在阶段间移动，并添加笔记。",
    detailJobTemplate: "{jobTitle} · {employerName}",
    profileStrengthTemplate: "档案强度 {percent}%",
    matchConfidenceTemplate: "匹配置信度 {percent}%",
    noCoverNote: "未提供求职信。",
    noticeStageUpdatedTitle: "阶段已更新",
    noticeStageUpdatedBody: "候选人的阶段已更新。他们将在候选人中心看到变化。",
    noticeNoteAddedTitle: "已添加笔记",
    noticeNoteAddedBody: "你的笔记已保存到此申请。",
    stageSectionTitle: "更新阶段",
    stageNotePlaceholder: "变更说明",
    stagePending: "正在更新阶段...",
    stageSubmit: "更新阶段",
    noteSectionTitle: "内部笔记",
    notePlaceholder: "添加关于此候选人的私人笔记",
    notePending: "正在保存笔记...",
    noteSubmit: "添加笔记",
    activitySectionTitle: "活动历史",
    activityEmptyKicker: "暂无活动",
    activityEmptyTitle: "此申请暂无记录的事件。",
    activityEmptyBody: "随着你推进招聘流程，阶段变更、笔记和关键更新将显示在此处。",
  },
  candidateProfile: {
    pageTitle: "候选人资料",
    pageSubtitle: "保持资料完整，让雇主看到最好的你。",
    rightRailTrustTitle: "资料信任度",
    rightRailVerificationKicker: "认证",
    rightRailDefaultReadiness: "完善资料以提升雇主对你申请的评价。",
    rightRailOpenVerification: "打开账户认证",
    rightRailDocumentsTitle: "文件",
    rightRailDocumentsCountSingular: "已上传 {count} 个文件至你的资料。",
    rightRailDocumentsCountPlural: "已上传 {count} 个文件至你的资料。",
    rightRailDocumentsHint: "技能、工作经历和作品集链接有助于雇主评估你的申请。",
    statusVerified: "已认证",
    statusPending: "待处理",
    statusRejected: "已拒绝",
    statusUnverified: "未认证",
    savedNoticeTitle: "资料已保存",
    savedNoticeBody: "你的资料已更新。申请时雇主可见这些更改。",
    draftSectionTitle: "资料草稿",
    draftSectionBody: "进行中的更改每 30 秒以及失去焦点时自动保存。点击下方“保存资料”发布。",
    editSectionTitle: "编辑资料",
    editSectionBody:
      "此处的职业信息在你申请职位时对雇主可见。电话和邮箱仅由 HenryCo 用于认证和信任评分 — 不会传递给雇主。",
    fieldFullNamePlaceholder: "全名",
    fieldHeadlinePlaceholder: "标题",
    fieldSummaryPlaceholder: "职业简介",
    fieldLocationPlaceholder: "所在地",
    fieldTimezonePlaceholder: "时区",
    fieldWorkModesPlaceholder: "远程、混合、现场",
    fieldRoleTypesPlaceholder: "全职、合同",
    fieldPreferredFunctionsPlaceholder: "产品、运营、市场",
    fieldSkillsPlaceholder: "技能",
    fieldPortfolioLinksPlaceholder: "作品集链接",
    fieldSalaryExpectationPlaceholder: "期望薪资",
    fieldAvailabilityPlaceholder: "可用时间",
    fieldWorkHistoryPlaceholder: '[{"company":"HenryCo","title":"运营主管"}]',
    fieldEducationPlaceholder: '[{"school":"大学","degree":"学士"}]',
    fieldCertificationsPlaceholder: '[{"name":"项目管理"}]',
    submitSaving: "正在保存资料...",
    submitLabel: "保存候选人资料",
  },
};

const HI: DeepPartial<JobsCopy> = {
  nav: {
    browse: "नौकरियां देखें",
    post: "नौकरी पोस्ट करें",
    applications: "आवेदन",
    account: "खाता",
  },
  hero: {
    title: "सत्यापित प्रतिभा की भर्ती, सामान्य शोर के बिना।",
    subtitle: "उन नियोक्ताओं से केंद्रित भूमिकाएं खोजें जो भर्ती में गंभीर हैं।",
    searchPlaceholder: "भूमिका, कौशल, या कंपनी",
    ctaBrowse: "खुली नौकरियां देखें",
    ctaHire: "मैं भर्ती कर रहा हूं",
  },
  filters: {
    allRoles: "सभी भूमिकाएं",
    fullTime: "पूर्णकालिक",
    partTime: "अंशकालिक",
    contract: "अनुबंध",
    remote: "रिमोट",
    onsite: "साइट पर",
    hybrid: "हाइब्रिड",
    location: "स्थान",
    salary: "वेतन",
    experience: "अनुभव",
    clearAll: "सब साफ करें",
  },
  listing: {
    applyNow: "अभी आवेदन करें",
    saveJob: "नौकरी सहेजें",
    shareJob: "शेयर करें",
    postedAgo: "पोस्ट किया",
    deadline: "आवेदन की अंतिम तिथि",
    salary: "वेतन",
    jobType: "नौकरी का प्रकार",
    location: "स्थान",
    experience: "आवश्यक अनुभव",
    skills: "कौशल",
    aboutRole: "भूमिका के बारे में",
    aboutCompany: "कंपनी के बारे में",
    viewCompany: "कंपनी देखें",
  },
  application: {
    title: "इस भूमिका के लिए आवेदन करें",
    resume: "रेज़्युमे / CV",
    coverLetter: "कवर लेटर",
    submit: "आवेदन सबमिट करें",
    submitted: "आवेदन सबमिट किया गया",
    underReview: "समीक्षाधीन",
    shortlisted: "शॉर्टलिस्ट किया गया",
    rejected: "आगे नहीं बढ़ा",
    offerMade: "ऑफर दिया गया",
  },
  hiring: {
    postJob: "नौकरी पोस्ट करें",
    managePostings: "पोस्टिंग प्रबंधित करें",
    reviewApplications: "आवेदन देखें",
    closePosting: "पोस्टिंग बंद करें",
    editPosting: "पोस्टिंग संपादित करें",
  },
  empty: {
    noJobs: "कोई मिलान नौकरी नहीं मिली। अपने फिल्टर समायोजित करें।",
    noApplications: "अभी तक कोई आवेदन नहीं।",
    noPostings: "कोई सक्रिय नौकरी पोस्टिंग नहीं।",
  },
  employerHiring: {
    pageTitle: "भर्ती पाइपलाइन",
    pageSubtitle:
      "एक ही कार्यक्षेत्र से अपनी सक्रिय भर्ती पाइपलाइनों का प्रबंधन करें, उम्मीदवारों से संवाद करें और साक्षात्कार निर्धारित करें।",
    sectionTitle: "सभी पाइपलाइनें",
    sectionBody:
      "प्रत्येक पाइपलाइन एक सक्रिय या पिछली भूमिका से संबंधित है। आवेदकों, बातचीतों और साक्षात्कारों की समीक्षा के लिए कोई पाइपलाइन खोलें।",
    emptyMessage:
      "अभी तक कोई भर्ती पाइपलाइन नहीं है। जब आप कोई भूमिका प्रकाशित करते हैं तो पाइपलाइनें स्वचालित रूप से बन जाती हैं।",
    applicantSingular: "आवेदक",
    applicantPlural: "आवेदक",
    statusActive: "सक्रिय",
    statusPaused: "रोका गया",
    statusClosed: "बंद",
  },
  employerCompany: {
    pageTitle: "कंपनी प्रोफ़ाइल",
    pageSubtitle:
      "अपनी कंपनी की प्रोफ़ाइल तैयार करें ताकि उम्मीदवार आपकी टीम के बारे में जान सकें।",
    rightRailVerificationTitle: "सत्यापन स्थिति",
    rightRailStatusLabel: "स्थिति",
    rightRailStatusPending: "लंबित",
    rightRailStatusPendingCapitalized: "लंबित",
    rightRailOpenRoleSingular: "खुली भूमिका",
    rightRailOpenRolePlural: "खुली भूमिकाएं",
    rightRailResponseSlaTemplate:
      "{count} {roleLabel}। आपका लक्ष्य उम्मीदवारों को {hours} घंटे के भीतर उत्तर देना है।",
    rightRailEmptyProfileBody:
      "सत्यापन प्रक्रिया शुरू करने और अपना सार्वजनिक नियोक्ता पृष्ठ सेट करने के लिए अपनी कंपनी की प्रोफ़ाइल बनाएं।",
    rightRailTipsTitle: "मज़बूत प्रोफ़ाइल के लिए सुझाव",
    rightRailTipDescription:
      "टीम और भर्ती के इरादे का स्पष्ट सार्वजनिक विवरण।",
    rightRailTipPolicies:
      "कार्य नीतियां, स्थान और सांस्कृतिक बिंदु जो अस्पष्टता हटाते हैं।",
    rightRailTipVerified:
      "एक सत्यापित उपस्थिति जिस पर भर्तीकर्ता और उम्मीदवार भरोसा कर सकते हैं।",
    profileSavedNoticeTitle: "नियोक्ता प्रोफ़ाइल सहेज ली गई",
    profileSavedNoticeBodyTemplate:
      "{name} सहेज लिया गया है। आपकी कंपनी की प्रोफ़ाइल अब सत्यापन कतार में है।",
    verificationCalloutBodySuffix:
      "भूमिका प्रकाशन या नियोक्ता विश्वास उन्नयन को अनलॉक होने की उम्मीद करने से पहले खाता सत्यापन पूरा करें।",
    openAccountVerification: "खाता सत्यापन खोलें",
    sectionTitle: "कंपनी विवरण",
    sectionBody:
      "यह जानकारी आपके सार्वजनिक नियोक्ता पृष्ठ पर दिखाई देती है और उम्मीदवारों को आपकी कंपनी का मूल्यांकन करने में मदद करती है।",
    fieldNamePlaceholder: "कंपनी का नाम",
    fieldSlugPlaceholder: "कंपनी-slug",
    fieldTaglinePlaceholder: "टैगलाइन",
    fieldDescriptionPlaceholder: "नियोक्ता विवरण",
    fieldWebsitePlaceholder: "वेबसाइट",
    fieldIndustryPlaceholder: "उद्योग",
    fieldLocationsPlaceholder: "लागोस, अबुजा, रिमोट",
    fieldHeadcountPlaceholder: "कर्मचारियों की संख्या",
    fieldRemotePolicyPlaceholder: "रिमोट कार्य नीति",
    fieldBenefitsHeadlinePlaceholder: "प्रमुख लाभ",
    fieldCulturePointsPlaceholder: "सांस्कृतिक बिंदु",
    employerTypeExternal: "बाहरी नियोक्ता",
    employerTypeInternal: "आंतरिक HenryCo भर्ती",
    submitSaving: "कंपनी सहेजी जा रही है...",
    submitLabel: "नियोक्ता प्रोफ़ाइल सहेजें",
  },
  employerJobs: {
    pageTitle: "नियोक्ता की नौकरियाँ",
    pageSubtitle: "अपनी नौकरी पोस्टिंग प्रबंधित करें और आवेदकों पर नज़र रखें.",
    sectionTitle: "प्रकाशित भूमिकाएँ",
    postRoleCta: "भूमिका पोस्ट करें",
    emptyKicker: "कोई सक्रिय भूमिका नहीं",
    emptyTitle: "इस नियोक्ता के लिए पहली भूमिका पोस्ट करें.",
    emptyBody:
      "एक बार भूमिका बनाने के बाद, यह सूची मॉडरेशन स्थिति, दृश्यता और आवेदकों की संख्या दिखाएगी.",
    emptyAction: "नौकरी बिल्डर खोलें",
    applicantSingular: "आवेदक",
    applicantPlural: "आवेदक",
    roleLineTemplate: "{location} · {count} {applicantLabel}",
    statusApproved: "स्वीकृत",
    statusPendingReview: "समीक्षाधीन",
    statusFlagged: "चिह्नित",
    statusDraft: "मसौदा",
  },
  employerApplicants: {
    pageTitle: "आवेदक",
    pageSubtitle:
      "अपनी नियोक्ता पाइपलाइन में वास्तविक आवेदकों की समीक्षा करें और उन्हें आगे बढ़ाएँ.",
    sectionTitle: "आवेदक तालिका",
    tableCandidate: "उम्मीदवार",
    tableRole: "भूमिका",
    tableStage: "चरण",
    tableProfile: "प्रोफ़ाइल",
    tableMatch: "मिलान",
    noEmail: "कोई ईमेल नहीं",
    emptyKicker: "पाइपलाइन साफ़ है",
    emptyTitle: "इस कतार में अभी कोई आवेदन नहीं है.",
    emptyBody:
      "जैसे ही भूमिकाएँ वास्तविक आवेदन प्राप्त करना शुरू करेंगी, नए उम्मीदवार यहाँ दिखाई देंगे.",
    stageReviewing: "समीक्षाधीन",
    stageShortlisted: "शॉर्टलिस्ट किया गया",
    stageInterview: "साक्षात्कार",
    stageOffer: "प्रस्ताव",
    stageHired: "नियुक्त",
    stageRejected: "अस्वीकृत",
    detailTitle: "आवेदक विवरण",
    detailSubtitle:
      "इस उम्मीदवार की समीक्षा करें, उन्हें चरणों के माध्यम से आगे बढ़ाएँ और नोट जोड़ें.",
    detailJobTemplate: "{jobTitle} · {employerName}",
    profileStrengthTemplate: "प्रोफ़ाइल मज़बूती {percent}%",
    matchConfidenceTemplate: "मिलान विश्वास {percent}%",
    noCoverNote: "कोई कवर नोट प्रदान नहीं किया गया.",
    noticeStageUpdatedTitle: "चरण अद्यतन किया गया",
    noticeStageUpdatedBody:
      "उम्मीदवार का चरण अद्यतन कर दिया गया है. वे अपने उम्मीदवार हब में परिवर्तन देखेंगे.",
    noticeNoteAddedTitle: "नोट जोड़ा गया",
    noticeNoteAddedBody: "आपका नोट इस आवेदन में सहेज लिया गया है.",
    stageSectionTitle: "चरण अद्यतन करें",
    stageNotePlaceholder: "बदलाव का संदर्भ",
    stagePending: "चरण अद्यतन हो रहा है...",
    stageSubmit: "चरण अद्यतन करें",
    noteSectionTitle: "आंतरिक नोट",
    notePlaceholder: "इस उम्मीदवार के बारे में निजी नोट जोड़ें",
    notePending: "नोट सहेजा जा रहा है...",
    noteSubmit: "नोट जोड़ें",
    activitySectionTitle: "गतिविधि इतिहास",
    activityEmptyKicker: "अभी कोई गतिविधि नहीं",
    activityEmptyTitle: "इस आवेदन के लिए कोई इवेंट दर्ज नहीं है.",
    activityEmptyBody:
      "जब आप भर्ती प्रक्रिया से गुज़रेंगे, तो चरण बदलाव, नोट और मुख्य अद्यतन यहाँ दिखाई देंगे.",
  },
  candidateProfile: {
    pageTitle: "उम्मीदवार प्रोफ़ाइल",
    pageSubtitle:
      "अपनी प्रोफ़ाइल पूरी रखें ताकि नियोक्ता आपका सर्वोत्तम रूप देख सकें.",
    rightRailTrustTitle: "प्रोफ़ाइल विश्वसनीयता",
    rightRailVerificationKicker: "सत्यापन",
    rightRailDefaultReadiness:
      "अपनी प्रोफ़ाइल पूरी करें ताकि नियोक्ता आपके आवेदनों को बेहतर तरीके से देखें.",
    rightRailOpenVerification: "खाता सत्यापन खोलें",
    rightRailDocumentsTitle: "दस्तावेज़",
    rightRailDocumentsCountSingular: "{count} फ़ाइल आपकी प्रोफ़ाइल पर अपलोड की गई.",
    rightRailDocumentsCountPlural: "{count} फ़ाइलें आपकी प्रोफ़ाइल पर अपलोड की गईं.",
    rightRailDocumentsHint:
      "कौशल, कार्य इतिहास और पोर्टफ़ोलियो लिंक नियोक्ताओं को आपके आवेदनों का मूल्यांकन करने में मदद करते हैं.",
    statusVerified: "सत्यापित",
    statusPending: "लंबित",
    statusRejected: "अस्वीकृत",
    statusUnverified: "असत्यापित",
    savedNoticeTitle: "प्रोफ़ाइल सहेजी गई",
    savedNoticeBody:
      "आपकी प्रोफ़ाइल अपडेट कर दी गई है. आवेदन करते समय बदलाव नियोक्ताओं को दिखाई देते हैं.",
    draftSectionTitle: "प्रोफ़ाइल मसौदा",
    draftSectionBody:
      "चल रहे बदलाव हर 30 सेकंड और फ़ोकस खोने पर स्वतः सहेजे जाते हैं. प्रकाशित करने के लिए नीचे ‘प्रोफ़ाइल सहेजें’ दबाएँ.",
    editSectionTitle: "अपनी प्रोफ़ाइल संपादित करें",
    editSectionBody:
      "यहाँ की पेशेवर जानकारी आवेदन करते समय नियोक्ताओं को दिखाई देती है. फ़ोन और ईमेल HenryCo केवल सत्यापन और विश्वास स्कोरिंग के लिए रखता है — इन्हें नियोक्ताओं को नहीं भेजा जाता.",
    fieldFullNamePlaceholder: "पूरा नाम",
    fieldHeadlinePlaceholder: "शीर्षक",
    fieldSummaryPlaceholder: "पेशेवर सारांश",
    fieldLocationPlaceholder: "स्थान",
    fieldTimezonePlaceholder: "समय क्षेत्र",
    fieldWorkModesPlaceholder: "रिमोट, हाइब्रिड, ऑनसाइट",
    fieldRoleTypesPlaceholder: "पूर्णकालिक, अनुबंध",
    fieldPreferredFunctionsPlaceholder: "उत्पाद, संचालन, मार्केटिंग",
    fieldSkillsPlaceholder: "कौशल",
    fieldPortfolioLinksPlaceholder: "पोर्टफ़ोलियो लिंक",
    fieldSalaryExpectationPlaceholder: "वेतन अपेक्षा",
    fieldAvailabilityPlaceholder: "उपलब्धता",
    fieldWorkHistoryPlaceholder: '[{"company":"HenryCo","title":"संचालन प्रमुख"}]',
    fieldEducationPlaceholder: '[{"school":"विश्वविद्यालय","degree":"BSc"}]',
    fieldCertificationsPlaceholder: '[{"name":"परियोजना प्रबंधन"}]',
    submitSaving: "प्रोफ़ाइल सहेजी जा रही है...",
    submitLabel: "उम्मीदवार प्रोफ़ाइल सहेजें",
  },
};

const IT: DeepPartial<JobsCopy> = {
  "nav": {
    "browse": "Sfoglia i lavori",
    "post": "Pubblica un lavoro",
    "applications": "Applicazioni",
    "account": "Conto"
  },
  "hero": {
    "title": "Assumere talenti verificati, senza il solito rumore.",
    "subtitle": "Trova ruoli mirati da datori di lavoro che prendono sul serio le persone che assumono.",
    "searchPlaceholder": "Ruolo, competenza o azienda",
    "ctaBrowse": "Sfoglia i lavori aperti",
    "ctaHire": "Sto assumendo"
  },
  "filters": {
    "allRoles": "Tutti i ruoli",
    "fullTime": "A tempo pieno",
    "partTime": "Part-time",
    "contract": "Contratto",
    "remote": "Remoto",
    "onsite": "Sul posto",
    "hybrid": "Ibrido",
    "location": "Posizione",
    "salary": "Stipendio",
    "experience": "Esperienza",
    "clearAll": "Cancella tutto"
  },
  "listing": {
    "applyNow": "Candidati ora",
    "saveJob": "Salva lavoro",
    "shareJob": "Condividi",
    "postedAgo": "Pubblicato",
    "deadline": "Scadenza per la domanda",
    "salary": "Stipendio",
    "jobType": "Tipo di lavoro",
    "location": "Posizione",
    "experience": "Esperienza richiesta",
    "skills": "Abilità",
    "aboutRole": "Sul ruolo",
    "aboutCompany": "Informazioni sull'azienda",
    "viewCompany": "Visualizza azienda"
  },
  "application": {
    "title": "Candidati per questo ruolo",
    "resume": "Curriculum vitae/curriculum vitae",
    "coverLetter": "Lettera di presentazione",
    "submit": "Invia domanda",
    "submitted": "Domanda presentata",
    "underReview": "In corso di revisione",
    "shortlisted": "Selezionato",
    "rejected": "Non progredendo",
    "offerMade": "Offerta fatta"
  },
  "hiring": {
    "postJob": "Pubblica un lavoro",
    "managePostings": "Gestisci i post",
    "reviewApplications": "Esaminare le applicazioni",
    "closePosting": "Chiudi la pubblicazione",
    "editPosting": "Modifica pubblicazione"
  },
  "empty": {
    "noJobs": "Nessun lavoro corrispondente trovato. Prova a modificare i filtri.",
    "noApplications": "Nessuna candidatura ancora.",
    "noPostings": "Nessuna offerta di lavoro attiva."
  },
  "employerHiring": {
    "pageTitle": "Pipeline di assunzione",
    "pageSubtitle":
      "Gestisci le tue pipeline di assunzione attive, comunica con i candidati e pianifica i colloqui da un unico spazio di lavoro.",
    "sectionTitle": "Tutte le pipeline",
    "sectionBody":
      "Ogni pipeline corrisponde a un ruolo attivo o passato. Apri una pipeline per esaminare candidati, conversazioni e colloqui.",
    "emptyMessage":
      "Nessuna pipeline di assunzione per ora. Le pipeline vengono create automaticamente quando pubblichi un ruolo.",
    "applicantSingular": "candidato",
    "applicantPlural": "candidati",
    "statusActive": "Attiva",
    "statusPaused": "In pausa",
    "statusClosed": "Chiusa"
  },
  "employerCompany": {
    "pageTitle": "Profilo aziendale",
    "pageSubtitle":
      "Imposta il profilo della tua azienda così i candidati possono conoscere il tuo team.",
    "rightRailVerificationTitle": "Stato di verifica",
    "rightRailStatusLabel": "Stato",
    "rightRailStatusPending": "in attesa",
    "rightRailStatusPendingCapitalized": "In attesa",
    "rightRailOpenRoleSingular": "ruolo aperto",
    "rightRailOpenRolePlural": "ruoli aperti",
    "rightRailResponseSlaTemplate":
      "{count} {roleLabel}. Punti a rispondere ai candidati entro {hours} ore.",
    "rightRailEmptyProfileBody":
      "Crea il profilo della tua azienda per avviare il processo di verifica e impostare la tua pagina datore di lavoro pubblica.",
    "rightRailTipsTitle": "Suggerimenti per un profilo solido",
    "rightRailTipDescription":
      "Una descrizione pubblica chiara del team e dell'intento di assunzione.",
    "rightRailTipPolicies":
      "Politiche di lavoro, sedi e punti culturali che eliminano ogni ambiguità.",
    "rightRailTipVerified":
      "Una presenza verificata di cui recruiter e candidati possono fidarsi.",
    "profileSavedNoticeTitle": "Profilo datore di lavoro salvato",
    "profileSavedNoticeBodyTemplate":
      "{name} è stato salvato. Il profilo della tua azienda è ora nella coda di verifica.",
    "verificationCalloutBodySuffix":
      "Completa la verifica dell'account prima di aspettarti che la pubblicazione dei ruoli o gli upgrade di fiducia del datore di lavoro si sblocchino.",
    "openAccountVerification": "Apri verifica dell'account",
    "sectionTitle": "Dettagli aziendali",
    "sectionBody":
      "Queste informazioni appaiono sulla tua pagina datore di lavoro pubblica e aiutano i candidati a valutare la tua azienda.",
    "fieldNamePlaceholder": "Nome dell'azienda",
    "fieldSlugPlaceholder": "slug-azienda",
    "fieldTaglinePlaceholder": "Tagline",
    "fieldDescriptionPlaceholder": "Descrizione del datore di lavoro",
    "fieldWebsitePlaceholder": "Sito web",
    "fieldIndustryPlaceholder": "Settore",
    "fieldLocationsPlaceholder": "Lagos, Abuja, Remoto",
    "fieldHeadcountPlaceholder": "Organico",
    "fieldRemotePolicyPlaceholder": "Politica di lavoro da remoto",
    "fieldBenefitsHeadlinePlaceholder": "Benefit principali",
    "fieldCulturePointsPlaceholder": "Punti culturali",
    "employerTypeExternal": "Datore di lavoro esterno",
    "employerTypeInternal": "Assunzione interna HenryCo",
    "submitSaving": "Salvataggio azienda...",
    "submitLabel": "Salva profilo datore di lavoro"
  },
  "employerJobs": {
    "pageTitle": "Lavori del datore di lavoro",
    "pageSubtitle": "Gestisci le tue offerte di lavoro e tieni traccia dei candidati.",
    "sectionTitle": "Ruoli pubblicati",
    "postRoleCta": "Pubblica ruolo",
    "emptyKicker": "Nessun ruolo attivo",
    "emptyTitle": "Pubblica il primo ruolo per questo datore di lavoro.",
    "emptyBody":
      "Una volta creato un ruolo, questo elenco mostrerà stato di moderazione, visibilità e volume di candidati.",
    "emptyAction": "Apri il costruttore di ruoli",
    "applicantSingular": "candidato",
    "applicantPlural": "candidati",
    "roleLineTemplate": "{location} · {count} {applicantLabel}",
    "statusApproved": "Approvato",
    "statusPendingReview": "In revisione",
    "statusFlagged": "Segnalato",
    "statusDraft": "Bozza"
  },
  "employerApplicants": {
    "pageTitle": "Candidati",
    "pageSubtitle":
      "Esamina e sposta i candidati reali lungo la tua pipeline da datore di lavoro.",
    "sectionTitle": "Tabella dei candidati",
    "tableCandidate": "Candidato",
    "tableRole": "Ruolo",
    "tableStage": "Fase",
    "tableProfile": "Profilo",
    "tableMatch": "Corrispondenza",
    "noEmail": "Nessuna email",
    "emptyKicker": "Pipeline libera",
    "emptyTitle": "Nessuna candidatura in questa coda al momento.",
    "emptyBody":
      "I nuovi candidati appariranno qui non appena i ruoli inizieranno a ricevere candidature reali.",
    "stageReviewing": "In esame",
    "stageShortlisted": "In lista ristretta",
    "stageInterview": "Colloquio",
    "stageOffer": "Offerta",
    "stageHired": "Assunto",
    "stageRejected": "Rifiutato",
    "detailTitle": "Dettaglio candidato",
    "detailSubtitle":
      "Esamina questo candidato, fallo avanzare tra le fasi e aggiungi note.",
    "detailJobTemplate": "{jobTitle} · {employerName}",
    "profileStrengthTemplate": "Solidità del profilo {percent} %",
    "matchConfidenceTemplate": "Fiducia di corrispondenza {percent} %",
    "noCoverNote": "Nessuna lettera di presentazione fornita.",
    "noticeStageUpdatedTitle": "Fase aggiornata",
    "noticeStageUpdatedBody":
      "La fase del candidato è stata aggiornata. Vedrà la modifica nel suo spazio candidato.",
    "noticeNoteAddedTitle": "Nota aggiunta",
    "noticeNoteAddedBody": "La tua nota è stata salvata in questa candidatura.",
    "stageSectionTitle": "Aggiorna fase",
    "stageNotePlaceholder": "Contesto dello spostamento",
    "stagePending": "Aggiornamento fase in corso...",
    "stageSubmit": "Aggiorna fase",
    "noteSectionTitle": "Nota interna",
    "notePlaceholder": "Aggiungi una nota privata su questo candidato",
    "notePending": "Salvataggio nota in corso...",
    "noteSubmit": "Aggiungi nota",
    "activitySectionTitle": "Cronologia attività",
    "activityEmptyKicker": "Ancora nessuna attività",
    "activityEmptyTitle": "Nessun evento registrato per questa candidatura.",
    "activityEmptyBody":
      "Cambi di fase, note e aggiornamenti chiave appariranno qui mentre porti avanti il processo di assunzione."
  },
  "candidateProfile": {
    "pageTitle": "Profilo del candidato",
    "pageSubtitle":
      "Mantieni il tuo profilo completo affinché i datori di lavoro vedano la versione migliore di te.",
    "rightRailTrustTitle": "Affidabilità del profilo",
    "rightRailVerificationKicker": "Verifica",
    "rightRailDefaultReadiness":
      "Completa il tuo profilo per migliorare il modo in cui i datori di lavoro vedono le tue candidature.",
    "rightRailOpenVerification": "Apri la verifica dell'account",
    "rightRailDocumentsTitle": "Documenti",
    "rightRailDocumentsCountSingular": "{count} file caricato sul tuo profilo.",
    "rightRailDocumentsCountPlural": "{count} file caricati sul tuo profilo.",
    "rightRailDocumentsHint":
      "Competenze, storia professionale e link del portfolio aiutano i datori di lavoro a valutare le tue candidature.",
    "statusVerified": "Verificato",
    "statusPending": "In sospeso",
    "statusRejected": "Rifiutato",
    "statusUnverified": "Non verificato",
    "savedNoticeTitle": "Profilo salvato",
    "savedNoticeBody":
      "Il tuo profilo è stato aggiornato. Le modifiche sono visibili ai datori di lavoro quando ti candidi.",
    "draftSectionTitle": "Bozza del profilo",
    "draftSectionBody":
      "Le modifiche in corso si salvano automaticamente ogni 30 secondi e quando perdi il focus. Premi «Salva profilo» qui sotto per pubblicare.",
    "editSectionTitle": "Modifica il tuo profilo",
    "editSectionBody":
      "I dettagli professionali qui sono visibili ai datori di lavoro quando ti candidi per un ruolo. Telefono ed e-mail sono conservati da HenryCo solo per verifica e punteggio di affidabilità — non vengono trasmessi ai datori di lavoro.",
    "fieldFullNamePlaceholder": "Nome completo",
    "fieldHeadlinePlaceholder": "Titolo",
    "fieldSummaryPlaceholder": "Riepilogo professionale",
    "fieldLocationPlaceholder": "Località",
    "fieldTimezonePlaceholder": "Fuso orario",
    "fieldWorkModesPlaceholder": "remoto, ibrido, in sede",
    "fieldRoleTypesPlaceholder": "tempo pieno, contratto",
    "fieldPreferredFunctionsPlaceholder": "Prodotto, Operazioni, Marketing",
    "fieldSkillsPlaceholder": "Competenze",
    "fieldPortfolioLinksPlaceholder": "Link del portfolio",
    "fieldSalaryExpectationPlaceholder": "Aspettativa salariale",
    "fieldAvailabilityPlaceholder": "Disponibilità",
    "fieldWorkHistoryPlaceholder": "[{\"company\":\"HenryCo\",\"title\":\"Responsabile operazioni\"}]",
    "fieldEducationPlaceholder": "[{\"school\":\"Università\",\"degree\":\"BSc\"}]",
    "fieldCertificationsPlaceholder": "[{\"name\":\"Project Management\"}]",
    "submitSaving": "Salvataggio profilo...",
    "submitLabel": "Salva profilo del candidato"
  }
};

const LOCALE_OVERRIDES: Partial<Record<AppLocale, DeepPartial<JobsCopy>>> = {
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

export function getJobsCopy(locale: AppLocale): JobsCopy {
  const overrides = LOCALE_OVERRIDES[locale];
  if (overrides) {
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as JobsCopy;
  }
  return EN;
}
