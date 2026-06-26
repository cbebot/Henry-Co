import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * MarketplaceSellerApplicationCopy — i18n surface for the protected seller
 * onboarding work-unit ("mkt-seller-application").
 *
 * Covers: the seller-application overview page (shell title/description,
 * status CTAs, status cards, empty state), the start/verification/review
 * step shells, and the seller-application wizard client component (step
 * labels, autosave status, form fields + placeholders, document
 * requirements + upload states, the agreement, the review summary, the
 * blocked-submission banner, and the navigation/submit buttons).
 *
 * Pattern A typed-copy module: EN baseline is exhaustive; each locale is a
 * DeepPartial that deep-merges over EN so missing keys fall back to EN
 * silently. The brand word "HenryCo" stays verbatim in every locale.
 *
 * Locale policy: EN + fr/es/pt/ar/de/it/zh are authored; ig/yo/ha/hi are
 * intentionally omitted and fall back to EN (human-translation only).
 */
export type MarketplaceSellerApplicationCopy = {
  overview: {
    shellTitle: string;
    shellDescription: string;
    actions: {
      continueOnboarding: string;
      continueApplication: string;
      startApplication: string;
    };
    statusCard: {
      defaultReviewNote: string;
      submittedPrefix: string;
    };
    cards: {
      protectedDraft: { title: string; body: string };
      ownerVisibility: { title: string; body: string };
      vendorHandoff: { title: string; body: string };
    };
    empty: {
      title: string;
      body: string;
      ctaLabel: string;
    };
  };
  reviewPage: {
    shellTitle: string;
    shellDescription: string;
  };
  startPage: {
    shellTitle: string;
    shellDescription: string;
  };
  verificationPage: {
    shellTitle: string;
    shellDescription: string;
  };
  wizard: {
    documents: {
      businessRegistration: { label: string; help: string };
      founderIdentity: { label: string; help: string };
      payoutProof: { label: string; help: string };
    };
    plan: {
      kicker: string;
      custom: string;
      free: string;
      monthlyFee: (amount: string) => string;
      summarySuffix: string;
    };
    steps: {
      storeIdentity: string;
      verification: string;
      review: string;
    };
    autosave: {
      saving: string;
      savedAt: (time: string) => string;
      idle: string;
    };
    draftSaveFailed: string;
    start: {
      storeName: string;
      storeSlug: string;
      legalName: string;
      operatingPhone: string;
      categoryFocus: string;
      categoryPlaceholder: string;
      guidance: string;
    };
    verification: {
      storyLabel: string;
      storyPlaceholder: string;
      postureTitle: string;
      postureSubtitle: string;
      posturePoint1: string;
      posturePoint2: string;
      posturePoint3: string;
      requiredBadge: string;
      recommendedBadge: string;
      uploaded: string;
      noFileYet: string;
      acceptedFormats: string;
      reviewFile: string;
      replaceFile: string;
      uploadFile: string;
      uploading: string;
      uploadingIndicatorLabel: string;
      agreement: string;
    };
    review: {
      storeNamePending: string;
      categoryPending: string;
      storyPending: string;
      documentPending: string;
      blockedPrefix: string;
      blockedSuffix: string;
      submissionNote: string;
    };
    nav: {
      back: string;
      previous: string;
      continue: string;
      submitting: string;
      submitted: string;
      submit: string;
    };
    toast: {
      submittedTitle: string;
      submittedBody: string;
      submissionFailed: string;
      submissionBlockedTitle: string;
      documentUploadedTitle: string;
      uploadFailedTitle: string;
      uploadFailed: string;
    };
  };
};

const EN: MarketplaceSellerApplicationCopy = {
  overview: {
    shellTitle: "Seller application",
    shellDescription:
      "Seller onboarding now lives in the protected account area so drafts, verification, moderation notes, and approval state stay structured instead of spilling into public clutter.",
    actions: {
      continueOnboarding: "Continue vendor onboarding",
      continueApplication: "Continue application",
      startApplication: "Start application",
    },
    statusCard: {
      defaultReviewNote:
        "Your application is in the workflow. Updates will appear here and in the notifications center.",
      submittedPrefix: "Submitted",
    },
    cards: {
      protectedDraft: {
        title: "Protected draft flow",
        body: "Store identity, verification, and review progress now live inside the account workspace instead of the public site.",
      },
      ownerVisibility: {
        title: "Owner and admin visibility",
        body: "Submission triggers the internal approval queue and the owner-alert path immediately.",
      },
      vendorHandoff: {
        title: "Vendor handoff",
        body: "Approved sellers move into vendor onboarding before product submission opens.",
      },
    },
    empty: {
      title: "No seller application is active yet.",
      body: "Start the protected onboarding flow to draft your store profile, add verification context, and move into moderation with real progress visibility.",
      ctaLabel: "Start seller application",
    },
  },
  reviewPage: {
    shellTitle: "Seller review",
    shellDescription:
      "Step 3 confirms the application before it enters moderation and owner-alert workflows.",
  },
  startPage: {
    shellTitle: "Seller application",
    shellDescription:
      "Step 1 focuses on store identity, business basics, and category focus before moderation work begins.",
  },
  verificationPage: {
    shellTitle: "Seller verification",
    shellDescription:
      "Step 2 captures the trust story, KYC context, and service standards that determine whether the store is ready for approval.",
  },
  wizard: {
    documents: {
      businessRegistration: {
        label: "Business registration or operating proof",
        help: "Recommended. This accelerates approval for registered entities and reduces follow-up.",
      },
      founderIdentity: {
        label: "Founder identity / KYC document",
        help: "Required before trust review can close. Upload a clear government-issued ID or approved KYC file.",
      },
      payoutProof: {
        label: "Payout account proof",
        help: "Required before payout-sensitive seller permissions can unlock.",
      },
    },
    plan: {
      kicker: "Plan selected from pricing",
      custom: "Custom",
      free: "Free",
      monthlyFee: (amount: string) => `NGN ${amount}/month`,
      summarySuffix:
        " You can confirm or change this when vendor onboarding opens after approval.",
    },
    steps: {
      storeIdentity: "Store identity",
      verification: "Verification",
      review: "Review",
    },
    autosave: {
      saving: "Saving draft...",
      savedAt: (time: string) => `Draft saved at ${time}.`,
      idle: "Drafts autosave while you work.",
    },
    draftSaveFailed: "Draft save failed.",
    start: {
      storeName: "Store name",
      storeSlug: "Store slug",
      legalName: "Legal business name",
      operatingPhone: "Operating phone",
      categoryFocus: "Category focus",
      categoryPlaceholder: "Premium home, founder office, elevated style...",
      guidance:
        "Store identity is what the moderation and owner review queue will see first. Keep the name, legal entity, and category focus precise so approval and trust-routing do not stall.",
    },
    verification: {
      storyLabel: "Store story and trust angle",
      storyPlaceholder:
        "Explain what you sell, why buyers should trust the store, and the service standard you can maintain.",
      postureTitle: "Verification posture",
      postureSubtitle: "Live trust gating",
      posturePoint1:
        "Founder identity and payout proof are mandatory before submission can enter the serious review lane.",
      posturePoint2:
        "Business registration is recommended for faster approval and fewer clarification requests.",
      posturePoint3:
        "Uploaded evidence is recorded into HenryCo documents and linked to the seller moderation workflow.",
      requiredBadge: "Required",
      recommendedBadge: "Recommended",
      uploaded: "Uploaded",
      noFileYet: "No file uploaded yet",
      acceptedFormats: "Accepted formats: JPG, PNG, WebP, PDF. Max 10 MB.",
      reviewFile: "Review file",
      replaceFile: "Replace file",
      uploadFile: "Upload file",
      uploading: "Uploading...",
      uploadingIndicatorLabel: "Uploading seller document",
      agreement:
        "I accept HenryCo Marketplace moderation, trust, payout-protection, and response-standard requirements.",
    },
    review: {
      storeNamePending: "Store name pending",
      categoryPending: "Category focus not added yet",
      storyPending: "Store story still needs to be completed before submission.",
      documentPending: "Pending",
      blockedPrefix:
        "Submission is still blocked until the required proof set is complete: ",
      blockedSuffix: ".",
      submissionNote:
        "Submission routes the application into the live moderation queue, records the verification evidence in HenryCo documents, and triggers owner/admin alerts. Publishing access stays locked until approval is complete.",
    },
    nav: {
      back: "Back",
      previous: "Previous",
      continue: "Continue",
      submitting: "Submitting...",
      submitted: "Submitted",
      submit: "Submit seller application",
    },
    toast: {
      submittedTitle: "Seller application submitted",
      submittedBody: "HenryCo review has started.",
      submissionFailed: "Application submission failed.",
      submissionBlockedTitle: "Submission blocked",
      documentUploadedTitle: "Document uploaded",
      uploadFailedTitle: "Upload failed",
      uploadFailed: "Upload failed.",
    },
  },
};

const FR: DeepPartial<MarketplaceSellerApplicationCopy> = {
  overview: {
    shellTitle: "Candidature vendeur",
    shellDescription:
      "L'intégration des vendeurs se déroule désormais dans l'espace de compte protégé afin que les brouillons, la vérification, les notes de modération et l'état d'approbation restent structurés au lieu de se disperser dans le désordre public.",
    actions: {
      continueOnboarding: "Poursuivre l'intégration vendeur",
      continueApplication: "Poursuivre la candidature",
      startApplication: "Commencer la candidature",
    },
    statusCard: {
      defaultReviewNote:
        "Votre candidature est en cours de traitement. Les mises à jour apparaîtront ici et dans le centre de notifications.",
      submittedPrefix: "Soumise le",
    },
    cards: {
      protectedDraft: {
        title: "Flux de brouillon protégé",
        body: "L'identité de la boutique, la vérification et l'avancement de l'examen se trouvent désormais dans l'espace de travail du compte plutôt que sur le site public.",
      },
      ownerVisibility: {
        title: "Visibilité propriétaire et administrateur",
        body: "La soumission déclenche immédiatement la file d'approbation interne et le canal d'alerte du propriétaire.",
      },
      vendorHandoff: {
        title: "Transfert vers le vendeur",
        body: "Les vendeurs approuvés passent à l'intégration vendeur avant l'ouverture de la soumission de produits.",
      },
    },
    empty: {
      title: "Aucune candidature vendeur n'est encore active.",
      body: "Démarrez le flux d'intégration protégé pour rédiger le profil de votre boutique, ajouter le contexte de vérification et passer à la modération avec une visibilité réelle de la progression.",
      ctaLabel: "Démarrer la candidature vendeur",
    },
  },
  reviewPage: {
    shellTitle: "Examen vendeur",
    shellDescription:
      "L'étape 3 confirme la candidature avant son entrée dans les flux de modération et d'alerte du propriétaire.",
  },
  startPage: {
    shellTitle: "Candidature vendeur",
    shellDescription:
      "L'étape 1 porte sur l'identité de la boutique, les bases de l'entreprise et le domaine de catégorie avant le début du travail de modération.",
  },
  verificationPage: {
    shellTitle: "Vérification vendeur",
    shellDescription:
      "L'étape 2 recueille l'histoire de confiance, le contexte KYC et les normes de service qui déterminent si la boutique est prête à être approuvée.",
  },
  wizard: {
    documents: {
      businessRegistration: {
        label: "Immatriculation de l'entreprise ou preuve d'activité",
        help: "Recommandé. Cela accélère l'approbation des entités enregistrées et réduit les relances.",
      },
      founderIdentity: {
        label: "Identité du fondateur / document KYC",
        help: "Requis avant la clôture de l'examen de confiance. Téléversez une pièce d'identité officielle claire ou un fichier KYC approuvé.",
      },
      payoutProof: {
        label: "Preuve du compte de versement",
        help: "Requis avant le déverrouillage des autorisations vendeur sensibles aux versements.",
      },
    },
    plan: {
      kicker: "Forfait sélectionné depuis la tarification",
      custom: "Sur mesure",
      free: "Gratuit",
      monthlyFee: (amount: string) => `NGN ${amount}/mois`,
      summarySuffix:
        " Vous pourrez le confirmer ou le modifier à l'ouverture de l'intégration vendeur après approbation.",
    },
    steps: {
      storeIdentity: "Identité de la boutique",
      verification: "Vérification",
      review: "Examen",
    },
    autosave: {
      saving: "Enregistrement du brouillon...",
      savedAt: (time: string) => `Brouillon enregistré à ${time}.`,
      idle: "Les brouillons s'enregistrent automatiquement pendant votre travail.",
    },
    draftSaveFailed: "Échec de l'enregistrement du brouillon.",
    start: {
      storeName: "Nom de la boutique",
      storeSlug: "Identifiant de la boutique",
      legalName: "Raison sociale légale",
      operatingPhone: "Téléphone d'exploitation",
      categoryFocus: "Domaine de catégorie",
      categoryPlaceholder: "Maison haut de gamme, bureau de fondateur, style raffiné...",
      guidance:
        "L'identité de la boutique est ce que la file de modération et d'examen du propriétaire verra en premier. Gardez le nom, l'entité juridique et le domaine de catégorie précis pour que l'approbation et le routage de confiance ne soient pas bloqués.",
    },
    verification: {
      storyLabel: "Histoire de la boutique et angle de confiance",
      storyPlaceholder:
        "Expliquez ce que vous vendez, pourquoi les acheteurs devraient faire confiance à la boutique et la norme de service que vous pouvez maintenir.",
      postureTitle: "Posture de vérification",
      postureSubtitle: "Filtrage de confiance en direct",
      posturePoint1:
        "L'identité du fondateur et la preuve de versement sont obligatoires avant que la soumission puisse entrer dans le circuit d'examen approfondi.",
      posturePoint2:
        "L'immatriculation de l'entreprise est recommandée pour une approbation plus rapide et moins de demandes de clarification.",
      posturePoint3:
        "Les preuves téléversées sont enregistrées dans les documents HenryCo et liées au flux de modération vendeur.",
      requiredBadge: "Requis",
      recommendedBadge: "Recommandé",
      uploaded: "Téléversé",
      noFileYet: "Aucun fichier téléversé pour l'instant",
      acceptedFormats: "Formats acceptés : JPG, PNG, WebP, PDF. Max 10 Mo.",
      reviewFile: "Examiner le fichier",
      replaceFile: "Remplacer le fichier",
      uploadFile: "Téléverser un fichier",
      uploading: "Téléversement...",
      uploadingIndicatorLabel: "Téléversement du document vendeur",
      agreement:
        "J'accepte les exigences de modération, de confiance, de protection des versements et de norme de réponse de HenryCo Marketplace.",
    },
    review: {
      storeNamePending: "Nom de la boutique en attente",
      categoryPending: "Domaine de catégorie pas encore ajouté",
      storyPending: "L'histoire de la boutique doit encore être complétée avant la soumission.",
      documentPending: "En attente",
      blockedPrefix:
        "La soumission reste bloquée tant que l'ensemble des preuves requises n'est pas complet : ",
      blockedSuffix: ".",
      submissionNote:
        "La soumission achemine la candidature vers la file de modération en direct, enregistre les preuves de vérification dans les documents HenryCo et déclenche les alertes propriétaire/administrateur. L'accès à la publication reste verrouillé jusqu'à l'approbation complète.",
    },
    nav: {
      back: "Retour",
      previous: "Précédent",
      continue: "Continuer",
      submitting: "Soumission...",
      submitted: "Soumise",
      submit: "Soumettre la candidature vendeur",
    },
    toast: {
      submittedTitle: "Candidature vendeur soumise",
      submittedBody: "L'examen HenryCo a commencé.",
      submissionFailed: "Échec de la soumission de la candidature.",
      submissionBlockedTitle: "Soumission bloquée",
      documentUploadedTitle: "Document téléversé",
      uploadFailedTitle: "Échec du téléversement",
      uploadFailed: "Échec du téléversement.",
    },
  },
};

const ES: DeepPartial<MarketplaceSellerApplicationCopy> = {
  overview: {
    shellTitle: "Solicitud de vendedor",
    shellDescription:
      "La incorporación de vendedores ahora se realiza en el área de cuenta protegida para que los borradores, la verificación, las notas de moderación y el estado de aprobación se mantengan estructurados en lugar de dispersarse en el desorden público.",
    actions: {
      continueOnboarding: "Continuar la incorporación de vendedor",
      continueApplication: "Continuar la solicitud",
      startApplication: "Iniciar solicitud",
    },
    statusCard: {
      defaultReviewNote:
        "Tu solicitud está en el flujo de trabajo. Las actualizaciones aparecerán aquí y en el centro de notificaciones.",
      submittedPrefix: "Enviada el",
    },
    cards: {
      protectedDraft: {
        title: "Flujo de borrador protegido",
        body: "La identidad de la tienda, la verificación y el progreso de la revisión ahora viven dentro del espacio de trabajo de la cuenta en lugar del sitio público.",
      },
      ownerVisibility: {
        title: "Visibilidad de propietario y administrador",
        body: "El envío activa de inmediato la cola de aprobación interna y la ruta de alerta del propietario.",
      },
      vendorHandoff: {
        title: "Transferencia al vendedor",
        body: "Los vendedores aprobados pasan a la incorporación de vendedor antes de que se abra el envío de productos.",
      },
    },
    empty: {
      title: "Aún no hay ninguna solicitud de vendedor activa.",
      body: "Inicia el flujo de incorporación protegido para redactar el perfil de tu tienda, añadir contexto de verificación y pasar a moderación con visibilidad real del progreso.",
      ctaLabel: "Iniciar solicitud de vendedor",
    },
  },
  reviewPage: {
    shellTitle: "Revisión de vendedor",
    shellDescription:
      "El paso 3 confirma la solicitud antes de que entre en los flujos de moderación y alerta del propietario.",
  },
  startPage: {
    shellTitle: "Solicitud de vendedor",
    shellDescription:
      "El paso 1 se centra en la identidad de la tienda, los datos básicos del negocio y el enfoque de categoría antes de que comience el trabajo de moderación.",
  },
  verificationPage: {
    shellTitle: "Verificación de vendedor",
    shellDescription:
      "El paso 2 recoge la historia de confianza, el contexto KYC y los estándares de servicio que determinan si la tienda está lista para la aprobación.",
  },
  wizard: {
    documents: {
      businessRegistration: {
        label: "Registro mercantil o prueba de actividad",
        help: "Recomendado. Acelera la aprobación de entidades registradas y reduce el seguimiento.",
      },
      founderIdentity: {
        label: "Identidad del fundador / documento KYC",
        help: "Requerido antes de cerrar la revisión de confianza. Sube una identificación oficial clara o un archivo KYC aprobado.",
      },
      payoutProof: {
        label: "Prueba de la cuenta de pago",
        help: "Requerido antes de desbloquear los permisos de vendedor sensibles a los pagos.",
      },
    },
    plan: {
      kicker: "Plan seleccionado desde los precios",
      custom: "Personalizado",
      free: "Gratis",
      monthlyFee: (amount: string) => `NGN ${amount}/mes`,
      summarySuffix:
        " Podrás confirmarlo o cambiarlo cuando se abra la incorporación de vendedor tras la aprobación.",
    },
    steps: {
      storeIdentity: "Identidad de la tienda",
      verification: "Verificación",
      review: "Revisión",
    },
    autosave: {
      saving: "Guardando borrador...",
      savedAt: (time: string) => `Borrador guardado a las ${time}.`,
      idle: "Los borradores se guardan automáticamente mientras trabajas.",
    },
    draftSaveFailed: "Error al guardar el borrador.",
    start: {
      storeName: "Nombre de la tienda",
      storeSlug: "Identificador de la tienda",
      legalName: "Razón social legal",
      operatingPhone: "Teléfono operativo",
      categoryFocus: "Enfoque de categoría",
      categoryPlaceholder: "Hogar premium, oficina de fundador, estilo refinado...",
      guidance:
        "La identidad de la tienda es lo primero que verá la cola de moderación y revisión del propietario. Mantén el nombre, la entidad legal y el enfoque de categoría precisos para que la aprobación y el enrutamiento de confianza no se estanquen.",
    },
    verification: {
      storyLabel: "Historia de la tienda y enfoque de confianza",
      storyPlaceholder:
        "Explica qué vendes, por qué los compradores deberían confiar en la tienda y el estándar de servicio que puedes mantener.",
      postureTitle: "Postura de verificación",
      postureSubtitle: "Control de confianza en vivo",
      posturePoint1:
        "La identidad del fundador y la prueba de pago son obligatorias antes de que el envío pueda entrar en el carril de revisión seria.",
      posturePoint2:
        "Se recomienda el registro mercantil para una aprobación más rápida y menos solicitudes de aclaración.",
      posturePoint3:
        "Las pruebas subidas se registran en los documentos de HenryCo y se vinculan al flujo de moderación de vendedores.",
      requiredBadge: "Requerido",
      recommendedBadge: "Recomendado",
      uploaded: "Subido",
      noFileYet: "Aún no se ha subido ningún archivo",
      acceptedFormats: "Formatos aceptados: JPG, PNG, WebP, PDF. Máx. 10 MB.",
      reviewFile: "Revisar archivo",
      replaceFile: "Reemplazar archivo",
      uploadFile: "Subir archivo",
      uploading: "Subiendo...",
      uploadingIndicatorLabel: "Subiendo documento de vendedor",
      agreement:
        "Acepto los requisitos de moderación, confianza, protección de pagos y estándar de respuesta de HenryCo Marketplace.",
    },
    review: {
      storeNamePending: "Nombre de la tienda pendiente",
      categoryPending: "Enfoque de categoría aún no añadido",
      storyPending: "La historia de la tienda todavía debe completarse antes del envío.",
      documentPending: "Pendiente",
      blockedPrefix:
        "El envío sigue bloqueado hasta que el conjunto de pruebas requerido esté completo: ",
      blockedSuffix: ".",
      submissionNote:
        "El envío dirige la solicitud a la cola de moderación en vivo, registra las pruebas de verificación en los documentos de HenryCo y activa las alertas de propietario/administrador. El acceso de publicación permanece bloqueado hasta que la aprobación esté completa.",
    },
    nav: {
      back: "Atrás",
      previous: "Anterior",
      continue: "Continuar",
      submitting: "Enviando...",
      submitted: "Enviada",
      submit: "Enviar solicitud de vendedor",
    },
    toast: {
      submittedTitle: "Solicitud de vendedor enviada",
      submittedBody: "La revisión de HenryCo ha comenzado.",
      submissionFailed: "Error al enviar la solicitud.",
      submissionBlockedTitle: "Envío bloqueado",
      documentUploadedTitle: "Documento subido",
      uploadFailedTitle: "Error de subida",
      uploadFailed: "Error de subida.",
    },
  },
};

const PT: DeepPartial<MarketplaceSellerApplicationCopy> = {
  overview: {
    shellTitle: "Candidatura de vendedor",
    shellDescription:
      "A integração de vendedores agora acontece na área de conta protegida para que rascunhos, verificação, notas de moderação e estado de aprovação permaneçam estruturados em vez de se dispersarem na desordem pública.",
    actions: {
      continueOnboarding: "Continuar a integração de vendedor",
      continueApplication: "Continuar a candidatura",
      startApplication: "Iniciar candidatura",
    },
    statusCard: {
      defaultReviewNote:
        "A sua candidatura está em fluxo de trabalho. As atualizações aparecerão aqui e no centro de notificações.",
      submittedPrefix: "Enviada em",
    },
    cards: {
      protectedDraft: {
        title: "Fluxo de rascunho protegido",
        body: "A identidade da loja, a verificação e o progresso da análise agora ficam dentro do espaço de trabalho da conta em vez do site público.",
      },
      ownerVisibility: {
        title: "Visibilidade do proprietário e do administrador",
        body: "O envio aciona imediatamente a fila de aprovação interna e o caminho de alerta do proprietário.",
      },
      vendorHandoff: {
        title: "Transferência para o vendedor",
        body: "Os vendedores aprovados passam para a integração de vendedor antes de o envio de produtos abrir.",
      },
    },
    empty: {
      title: "Ainda não há nenhuma candidatura de vendedor ativa.",
      body: "Inicie o fluxo de integração protegido para redigir o perfil da sua loja, adicionar contexto de verificação e avançar para a moderação com visibilidade real do progresso.",
      ctaLabel: "Iniciar candidatura de vendedor",
    },
  },
  reviewPage: {
    shellTitle: "Análise do vendedor",
    shellDescription:
      "O passo 3 confirma a candidatura antes de entrar nos fluxos de moderação e alerta do proprietário.",
  },
  startPage: {
    shellTitle: "Candidatura de vendedor",
    shellDescription:
      "O passo 1 foca-se na identidade da loja, nos fundamentos do negócio e no foco de categoria antes de começar o trabalho de moderação.",
  },
  verificationPage: {
    shellTitle: "Verificação do vendedor",
    shellDescription:
      "O passo 2 captura a história de confiança, o contexto KYC e os padrões de serviço que determinam se a loja está pronta para aprovação.",
  },
  wizard: {
    documents: {
      businessRegistration: {
        label: "Registo comercial ou prova de atividade",
        help: "Recomendado. Acelera a aprovação de entidades registadas e reduz o acompanhamento.",
      },
      founderIdentity: {
        label: "Identidade do fundador / documento KYC",
        help: "Obrigatório antes de encerrar a análise de confiança. Carregue um documento de identificação oficial nítido ou um ficheiro KYC aprovado.",
      },
      payoutProof: {
        label: "Prova da conta de pagamento",
        help: "Obrigatório antes de desbloquear as permissões de vendedor sensíveis a pagamentos.",
      },
    },
    plan: {
      kicker: "Plano selecionado a partir dos preços",
      custom: "Personalizado",
      free: "Grátis",
      monthlyFee: (amount: string) => `NGN ${amount}/mês`,
      summarySuffix:
        " Poderá confirmá-lo ou alterá-lo quando a integração de vendedor abrir após a aprovação.",
    },
    steps: {
      storeIdentity: "Identidade da loja",
      verification: "Verificação",
      review: "Análise",
    },
    autosave: {
      saving: "A guardar rascunho...",
      savedAt: (time: string) => `Rascunho guardado às ${time}.`,
      idle: "Os rascunhos guardam-se automaticamente enquanto trabalha.",
    },
    draftSaveFailed: "Falha ao guardar o rascunho.",
    start: {
      storeName: "Nome da loja",
      storeSlug: "Identificador da loja",
      legalName: "Designação social legal",
      operatingPhone: "Telefone operacional",
      categoryFocus: "Foco de categoria",
      categoryPlaceholder: "Casa premium, escritório de fundador, estilo requintado...",
      guidance:
        "A identidade da loja é o que a fila de moderação e análise do proprietário verá primeiro. Mantenha o nome, a entidade legal e o foco de categoria precisos para que a aprovação e o encaminhamento de confiança não fiquem bloqueados.",
    },
    verification: {
      storyLabel: "História da loja e ângulo de confiança",
      storyPlaceholder:
        "Explique o que vende, por que os compradores devem confiar na loja e o padrão de serviço que consegue manter.",
      postureTitle: "Postura de verificação",
      postureSubtitle: "Controlo de confiança ao vivo",
      posturePoint1:
        "A identidade do fundador e a prova de pagamento são obrigatórias antes de o envio poder entrar na faixa de análise aprofundada.",
      posturePoint2:
        "O registo comercial é recomendado para uma aprovação mais rápida e menos pedidos de esclarecimento.",
      posturePoint3:
        "As provas carregadas são registadas nos documentos da HenryCo e ligadas ao fluxo de moderação de vendedores.",
      requiredBadge: "Obrigatório",
      recommendedBadge: "Recomendado",
      uploaded: "Carregado",
      noFileYet: "Ainda não foi carregado nenhum ficheiro",
      acceptedFormats: "Formatos aceites: JPG, PNG, WebP, PDF. Máx. 10 MB.",
      reviewFile: "Rever ficheiro",
      replaceFile: "Substituir ficheiro",
      uploadFile: "Carregar ficheiro",
      uploading: "A carregar...",
      uploadingIndicatorLabel: "A carregar documento de vendedor",
      agreement:
        "Aceito os requisitos de moderação, confiança, proteção de pagamentos e padrão de resposta do HenryCo Marketplace.",
    },
    review: {
      storeNamePending: "Nome da loja pendente",
      categoryPending: "Foco de categoria ainda não adicionado",
      storyPending: "A história da loja ainda precisa de ser concluída antes do envio.",
      documentPending: "Pendente",
      blockedPrefix:
        "O envio continua bloqueado até que o conjunto de provas obrigatório esteja completo: ",
      blockedSuffix: ".",
      submissionNote:
        "O envio encaminha a candidatura para a fila de moderação ao vivo, regista as provas de verificação nos documentos da HenryCo e aciona os alertas de proprietário/administrador. O acesso de publicação permanece bloqueado até que a aprovação esteja concluída.",
    },
    nav: {
      back: "Voltar",
      previous: "Anterior",
      continue: "Continuar",
      submitting: "A enviar...",
      submitted: "Enviada",
      submit: "Enviar candidatura de vendedor",
    },
    toast: {
      submittedTitle: "Candidatura de vendedor enviada",
      submittedBody: "A análise da HenryCo começou.",
      submissionFailed: "Falha ao enviar a candidatura.",
      submissionBlockedTitle: "Envio bloqueado",
      documentUploadedTitle: "Documento carregado",
      uploadFailedTitle: "Falha no carregamento",
      uploadFailed: "Falha no carregamento.",
    },
  },
};

const AR: DeepPartial<MarketplaceSellerApplicationCopy> = {
  overview: {
    shellTitle: "طلب البائع",
    shellDescription:
      "أصبح إعداد البائعين الآن في منطقة الحساب المحمية حتى تبقى المسودات والتحقق وملاحظات الإشراف وحالة الموافقة منظمة بدلاً من أن تتناثر في الفوضى العامة.",
    actions: {
      continueOnboarding: "متابعة إعداد البائع",
      continueApplication: "متابعة الطلب",
      startApplication: "بدء الطلب",
    },
    statusCard: {
      defaultReviewNote:
        "طلبك قيد المعالجة. ستظهر التحديثات هنا وفي مركز الإشعارات.",
      submittedPrefix: "أُرسل في",
    },
    cards: {
      protectedDraft: {
        title: "مسار المسودة المحمي",
        body: "أصبحت هوية المتجر والتحقق وتقدم المراجعة الآن داخل مساحة عمل الحساب بدلاً من الموقع العام.",
      },
      ownerVisibility: {
        title: "رؤية المالك والمسؤول",
        body: "يؤدي الإرسال على الفور إلى تشغيل قائمة انتظار الموافقة الداخلية ومسار تنبيه المالك.",
      },
      vendorHandoff: {
        title: "تسليم البائع",
        body: "ينتقل البائعون المعتمدون إلى إعداد البائع قبل فتح إرسال المنتجات.",
      },
    },
    empty: {
      title: "لا يوجد طلب بائع نشط بعد.",
      body: "ابدأ مسار الإعداد المحمي لصياغة ملف متجرك وإضافة سياق التحقق والانتقال إلى الإشراف مع رؤية حقيقية للتقدم.",
      ctaLabel: "بدء طلب البائع",
    },
  },
  reviewPage: {
    shellTitle: "مراجعة البائع",
    shellDescription:
      "تؤكد الخطوة 3 الطلب قبل دخوله إلى مسارات الإشراف وتنبيه المالك.",
  },
  startPage: {
    shellTitle: "طلب البائع",
    shellDescription:
      "تركز الخطوة 1 على هوية المتجر وأساسيات العمل ومجال الفئة قبل بدء عمل الإشراف.",
  },
  verificationPage: {
    shellTitle: "التحقق من البائع",
    shellDescription:
      "تلتقط الخطوة 2 قصة الثقة وسياق اعرف عميلك ومعايير الخدمة التي تحدد ما إذا كان المتجر جاهزًا للموافقة.",
  },
  wizard: {
    documents: {
      businessRegistration: {
        label: "تسجيل الشركة أو إثبات النشاط",
        help: "موصى به. يسرّع ذلك الموافقة على الكيانات المسجلة ويقلل من المتابعة.",
      },
      founderIdentity: {
        label: "هوية المؤسس / مستند اعرف عميلك",
        help: "مطلوب قبل إغلاق مراجعة الثقة. حمّل بطاقة هوية حكومية واضحة أو ملف اعرف عميلك معتمد.",
      },
      payoutProof: {
        label: "إثبات حساب الدفع",
        help: "مطلوب قبل فتح أذونات البائع الحساسة للدفع.",
      },
    },
    plan: {
      kicker: "الخطة المختارة من التسعير",
      custom: "مخصص",
      free: "مجاني",
      monthlyFee: (amount: string) => `NGN ${amount}/شهريًا`,
      summarySuffix:
        " يمكنك تأكيد ذلك أو تغييره عند فتح إعداد البائع بعد الموافقة.",
    },
    steps: {
      storeIdentity: "هوية المتجر",
      verification: "التحقق",
      review: "المراجعة",
    },
    autosave: {
      saving: "جارٍ حفظ المسودة...",
      savedAt: (time: string) => `حُفظت المسودة في ${time}.`,
      idle: "تُحفظ المسودات تلقائيًا أثناء عملك.",
    },
    draftSaveFailed: "فشل حفظ المسودة.",
    start: {
      storeName: "اسم المتجر",
      storeSlug: "معرّف المتجر",
      legalName: "الاسم القانوني للنشاط التجاري",
      operatingPhone: "هاتف التشغيل",
      categoryFocus: "مجال الفئة",
      categoryPlaceholder: "منزل فاخر، مكتب مؤسس، أسلوب راقٍ...",
      guidance:
        "هوية المتجر هي أول ما ستراه قائمة انتظار الإشراف ومراجعة المالك. حافظ على دقة الاسم والكيان القانوني ومجال الفئة حتى لا تتعطل الموافقة وتوجيه الثقة.",
    },
    verification: {
      storyLabel: "قصة المتجر وزاوية الثقة",
      storyPlaceholder:
        "اشرح ما الذي تبيعه ولماذا يجب أن يثق المشترون بالمتجر ومعيار الخدمة الذي يمكنك الحفاظ عليه.",
      postureTitle: "وضع التحقق",
      postureSubtitle: "بوابة ثقة مباشرة",
      posturePoint1:
        "هوية المؤسس وإثبات الدفع إلزاميان قبل أن يتمكن الإرسال من دخول مسار المراجعة الجادة.",
      posturePoint2:
        "يُوصى بتسجيل الشركة لموافقة أسرع وطلبات توضيح أقل.",
      posturePoint3:
        "تُسجَّل الأدلة المحمّلة في مستندات HenryCo وتُربط بسير عمل إشراف البائعين.",
      requiredBadge: "مطلوب",
      recommendedBadge: "موصى به",
      uploaded: "تم التحميل",
      noFileYet: "لم يتم تحميل أي ملف بعد",
      acceptedFormats: "الصيغ المقبولة: JPG وPNG وWebP وPDF. بحد أقصى 10 ميغابايت.",
      reviewFile: "مراجعة الملف",
      replaceFile: "استبدال الملف",
      uploadFile: "تحميل ملف",
      uploading: "جارٍ التحميل...",
      uploadingIndicatorLabel: "جارٍ تحميل مستند البائع",
      agreement:
        "أوافق على متطلبات الإشراف والثقة وحماية المدفوعات ومعيار الاستجابة في HenryCo Marketplace.",
    },
    review: {
      storeNamePending: "اسم المتجر قيد الانتظار",
      categoryPending: "لم تتم إضافة مجال الفئة بعد",
      storyPending: "لا تزال قصة المتجر بحاجة إلى الإكمال قبل الإرسال.",
      documentPending: "قيد الانتظار",
      blockedPrefix:
        "لا يزال الإرسال محظورًا حتى تكتمل مجموعة الأدلة المطلوبة: ",
      blockedSuffix: ".",
      submissionNote:
        "يوجّه الإرسال الطلب إلى قائمة انتظار الإشراف المباشرة، ويسجّل أدلة التحقق في مستندات HenryCo، ويُطلق تنبيهات المالك/المسؤول. يبقى الوصول إلى النشر مقفلاً حتى اكتمال الموافقة.",
    },
    nav: {
      back: "رجوع",
      previous: "السابق",
      continue: "متابعة",
      submitting: "جارٍ الإرسال...",
      submitted: "تم الإرسال",
      submit: "إرسال طلب البائع",
    },
    toast: {
      submittedTitle: "تم إرسال طلب البائع",
      submittedBody: "بدأت مراجعة HenryCo.",
      submissionFailed: "فشل إرسال الطلب.",
      submissionBlockedTitle: "تم حظر الإرسال",
      documentUploadedTitle: "تم تحميل المستند",
      uploadFailedTitle: "فشل التحميل",
      uploadFailed: "فشل التحميل.",
    },
  },
};

const DE: DeepPartial<MarketplaceSellerApplicationCopy> = {
  overview: {
    shellTitle: "Verkäuferantrag",
    shellDescription:
      "Das Verkäufer-Onboarding findet jetzt im geschützten Kontobereich statt, damit Entwürfe, Verifizierung, Moderationsnotizen und Genehmigungsstatus strukturiert bleiben, statt im öffentlichen Durcheinander zu landen.",
    actions: {
      continueOnboarding: "Verkäufer-Onboarding fortsetzen",
      continueApplication: "Antrag fortsetzen",
      startApplication: "Antrag starten",
    },
    statusCard: {
      defaultReviewNote:
        "Ihr Antrag befindet sich im Workflow. Aktualisierungen erscheinen hier und im Benachrichtigungscenter.",
      submittedPrefix: "Eingereicht am",
    },
    cards: {
      protectedDraft: {
        title: "Geschützter Entwurfsablauf",
        body: "Shop-Identität, Verifizierung und Prüffortschritt befinden sich jetzt im Konto-Arbeitsbereich statt auf der öffentlichen Website.",
      },
      ownerVisibility: {
        title: "Sichtbarkeit für Inhaber und Administrator",
        body: "Die Einreichung löst sofort die interne Genehmigungswarteschlange und den Inhaber-Alarmpfad aus.",
      },
      vendorHandoff: {
        title: "Übergabe an den Verkäufer",
        body: "Genehmigte Verkäufer wechseln zum Verkäufer-Onboarding, bevor die Produkteinreichung geöffnet wird.",
      },
    },
    empty: {
      title: "Es ist noch kein Verkäuferantrag aktiv.",
      body: "Starten Sie den geschützten Onboarding-Ablauf, um Ihr Shop-Profil zu entwerfen, Verifizierungskontext hinzuzufügen und mit echter Fortschrittstransparenz in die Moderation zu wechseln.",
      ctaLabel: "Verkäuferantrag starten",
    },
  },
  reviewPage: {
    shellTitle: "Verkäuferprüfung",
    shellDescription:
      "Schritt 3 bestätigt den Antrag, bevor er in die Moderations- und Inhaber-Alarm-Workflows gelangt.",
  },
  startPage: {
    shellTitle: "Verkäuferantrag",
    shellDescription:
      "Schritt 1 konzentriert sich auf Shop-Identität, geschäftliche Grundlagen und Kategorieschwerpunkt, bevor die Moderationsarbeit beginnt.",
  },
  verificationPage: {
    shellTitle: "Verkäuferverifizierung",
    shellDescription:
      "Schritt 2 erfasst die Vertrauensgeschichte, den KYC-Kontext und die Servicestandards, die bestimmen, ob der Shop zur Genehmigung bereit ist.",
  },
  wizard: {
    documents: {
      businessRegistration: {
        label: "Gewerbeanmeldung oder Betriebsnachweis",
        help: "Empfohlen. Dies beschleunigt die Genehmigung für registrierte Unternehmen und reduziert Rückfragen.",
      },
      founderIdentity: {
        label: "Gründeridentität / KYC-Dokument",
        help: "Erforderlich, bevor die Vertrauensprüfung abgeschlossen werden kann. Laden Sie einen klaren amtlichen Ausweis oder eine genehmigte KYC-Datei hoch.",
      },
      payoutProof: {
        label: "Nachweis des Auszahlungskontos",
        help: "Erforderlich, bevor auszahlungssensible Verkäuferberechtigungen freigeschaltet werden können.",
      },
    },
    plan: {
      kicker: "Aus der Preisgestaltung gewählter Plan",
      custom: "Individuell",
      free: "Kostenlos",
      monthlyFee: (amount: string) => `NGN ${amount}/Monat`,
      summarySuffix:
        " Sie können dies bestätigen oder ändern, sobald das Verkäufer-Onboarding nach der Genehmigung beginnt.",
    },
    steps: {
      storeIdentity: "Shop-Identität",
      verification: "Verifizierung",
      review: "Prüfung",
    },
    autosave: {
      saving: "Entwurf wird gespeichert...",
      savedAt: (time: string) => `Entwurf um ${time} gespeichert.`,
      idle: "Entwürfe werden automatisch gespeichert, während Sie arbeiten.",
    },
    draftSaveFailed: "Speichern des Entwurfs fehlgeschlagen.",
    start: {
      storeName: "Shop-Name",
      storeSlug: "Shop-Slug",
      legalName: "Juristischer Firmenname",
      operatingPhone: "Betriebstelefon",
      categoryFocus: "Kategorieschwerpunkt",
      categoryPlaceholder: "Premium-Zuhause, Gründerbüro, gehobener Stil...",
      guidance:
        "Die Shop-Identität ist das Erste, was die Moderations- und Inhaberprüfungswarteschlange sieht. Halten Sie Name, juristische Einheit und Kategorieschwerpunkt präzise, damit Genehmigung und Vertrauens-Routing nicht ins Stocken geraten.",
    },
    verification: {
      storyLabel: "Shop-Geschichte und Vertrauensaspekt",
      storyPlaceholder:
        "Erklären Sie, was Sie verkaufen, warum Käufer dem Shop vertrauen sollten und welchen Servicestandard Sie halten können.",
      postureTitle: "Verifizierungshaltung",
      postureSubtitle: "Live-Vertrauensprüfung",
      posturePoint1:
        "Gründeridentität und Auszahlungsnachweis sind verpflichtend, bevor die Einreichung in die ernsthafte Prüfspur gelangen kann.",
      posturePoint2:
        "Die Gewerbeanmeldung wird für schnellere Genehmigung und weniger Klärungsanfragen empfohlen.",
      posturePoint3:
        "Hochgeladene Nachweise werden in HenryCo-Dokumenten erfasst und mit dem Verkäufer-Moderations-Workflow verknüpft.",
      requiredBadge: "Erforderlich",
      recommendedBadge: "Empfohlen",
      uploaded: "Hochgeladen",
      noFileYet: "Noch keine Datei hochgeladen",
      acceptedFormats: "Akzeptierte Formate: JPG, PNG, WebP, PDF. Max. 10 MB.",
      reviewFile: "Datei prüfen",
      replaceFile: "Datei ersetzen",
      uploadFile: "Datei hochladen",
      uploading: "Wird hochgeladen...",
      uploadingIndicatorLabel: "Verkäuferdokument wird hochgeladen",
      agreement:
        "Ich akzeptiere die Anforderungen von HenryCo Marketplace an Moderation, Vertrauen, Auszahlungsschutz und Reaktionsstandard.",
    },
    review: {
      storeNamePending: "Shop-Name ausstehend",
      categoryPending: "Kategorieschwerpunkt noch nicht hinzugefügt",
      storyPending: "Die Shop-Geschichte muss vor der Einreichung noch vervollständigt werden.",
      documentPending: "Ausstehend",
      blockedPrefix:
        "Die Einreichung ist weiterhin blockiert, bis der erforderliche Nachweissatz vollständig ist: ",
      blockedSuffix: ".",
      submissionNote:
        "Die Einreichung leitet den Antrag in die Live-Moderationswarteschlange, erfasst die Verifizierungsnachweise in HenryCo-Dokumenten und löst Inhaber-/Administrator-Benachrichtigungen aus. Der Veröffentlichungszugriff bleibt gesperrt, bis die Genehmigung abgeschlossen ist.",
    },
    nav: {
      back: "Zurück",
      previous: "Vorherige",
      continue: "Weiter",
      submitting: "Wird eingereicht...",
      submitted: "Eingereicht",
      submit: "Verkäuferantrag einreichen",
    },
    toast: {
      submittedTitle: "Verkäuferantrag eingereicht",
      submittedBody: "Die HenryCo-Prüfung hat begonnen.",
      submissionFailed: "Einreichung des Antrags fehlgeschlagen.",
      submissionBlockedTitle: "Einreichung blockiert",
      documentUploadedTitle: "Dokument hochgeladen",
      uploadFailedTitle: "Upload fehlgeschlagen",
      uploadFailed: "Upload fehlgeschlagen.",
    },
  },
};

const IT: DeepPartial<MarketplaceSellerApplicationCopy> = {
  overview: {
    shellTitle: "Candidatura venditore",
    shellDescription:
      "L'onboarding dei venditori avviene ora nell'area account protetta, così bozze, verifica, note di moderazione e stato di approvazione restano strutturati invece di disperdersi nel disordine pubblico.",
    actions: {
      continueOnboarding: "Continua l'onboarding venditore",
      continueApplication: "Continua la candidatura",
      startApplication: "Avvia candidatura",
    },
    statusCard: {
      defaultReviewNote:
        "La tua candidatura è in lavorazione. Gli aggiornamenti appariranno qui e nel centro notifiche.",
      submittedPrefix: "Inviata il",
    },
    cards: {
      protectedDraft: {
        title: "Flusso di bozza protetto",
        body: "L'identità del negozio, la verifica e lo stato di avanzamento della revisione si trovano ora nell'area di lavoro dell'account invece che sul sito pubblico.",
      },
      ownerVisibility: {
        title: "Visibilità per titolare e amministratore",
        body: "L'invio attiva immediatamente la coda di approvazione interna e il percorso di avviso al titolare.",
      },
      vendorHandoff: {
        title: "Passaggio al venditore",
        body: "I venditori approvati passano all'onboarding venditore prima dell'apertura dell'invio dei prodotti.",
      },
    },
    empty: {
      title: "Nessuna candidatura venditore è ancora attiva.",
      body: "Avvia il flusso di onboarding protetto per redigere il profilo del tuo negozio, aggiungere il contesto di verifica e passare alla moderazione con una reale visibilità dei progressi.",
      ctaLabel: "Avvia candidatura venditore",
    },
  },
  reviewPage: {
    shellTitle: "Revisione venditore",
    shellDescription:
      "Il passaggio 3 conferma la candidatura prima che entri nei flussi di moderazione e di avviso al titolare.",
  },
  startPage: {
    shellTitle: "Candidatura venditore",
    shellDescription:
      "Il passaggio 1 si concentra sull'identità del negozio, sulle basi aziendali e sul focus di categoria prima dell'inizio del lavoro di moderazione.",
  },
  verificationPage: {
    shellTitle: "Verifica venditore",
    shellDescription:
      "Il passaggio 2 raccoglie la storia di fiducia, il contesto KYC e gli standard di servizio che determinano se il negozio è pronto per l'approvazione.",
  },
  wizard: {
    documents: {
      businessRegistration: {
        label: "Registrazione dell'attività o prova operativa",
        help: "Consigliato. Accelera l'approvazione per le entità registrate e riduce i follow-up.",
      },
      founderIdentity: {
        label: "Identità del fondatore / documento KYC",
        help: "Obbligatorio prima della chiusura della revisione di fiducia. Carica un documento d'identità ufficiale chiaro o un file KYC approvato.",
      },
      payoutProof: {
        label: "Prova del conto di pagamento",
        help: "Obbligatorio prima dello sblocco delle autorizzazioni venditore sensibili ai pagamenti.",
      },
    },
    plan: {
      kicker: "Piano selezionato dai prezzi",
      custom: "Personalizzato",
      free: "Gratuito",
      monthlyFee: (amount: string) => `NGN ${amount}/mese`,
      summarySuffix:
        " Potrai confermarlo o modificarlo quando l'onboarding venditore si aprirà dopo l'approvazione.",
    },
    steps: {
      storeIdentity: "Identità del negozio",
      verification: "Verifica",
      review: "Revisione",
    },
    autosave: {
      saving: "Salvataggio bozza...",
      savedAt: (time: string) => `Bozza salvata alle ${time}.`,
      idle: "Le bozze si salvano automaticamente mentre lavori.",
    },
    draftSaveFailed: "Salvataggio della bozza non riuscito.",
    start: {
      storeName: "Nome del negozio",
      storeSlug: "Slug del negozio",
      legalName: "Ragione sociale legale",
      operatingPhone: "Telefono operativo",
      categoryFocus: "Focus di categoria",
      categoryPlaceholder: "Casa premium, ufficio del fondatore, stile raffinato...",
      guidance:
        "L'identità del negozio è la prima cosa che vedrà la coda di moderazione e revisione del titolare. Mantieni precisi il nome, l'entità legale e il focus di categoria affinché l'approvazione e l'instradamento di fiducia non si blocchino.",
    },
    verification: {
      storyLabel: "Storia del negozio e angolo di fiducia",
      storyPlaceholder:
        "Spiega cosa vendi, perché gli acquirenti dovrebbero fidarsi del negozio e lo standard di servizio che puoi mantenere.",
      postureTitle: "Posizione di verifica",
      postureSubtitle: "Controllo della fiducia in tempo reale",
      posturePoint1:
        "L'identità del fondatore e la prova di pagamento sono obbligatorie prima che l'invio possa entrare nella corsia di revisione approfondita.",
      posturePoint2:
        "La registrazione dell'attività è consigliata per un'approvazione più rapida e meno richieste di chiarimento.",
      posturePoint3:
        "Le prove caricate vengono registrate nei documenti HenryCo e collegate al flusso di moderazione dei venditori.",
      requiredBadge: "Obbligatorio",
      recommendedBadge: "Consigliato",
      uploaded: "Caricato",
      noFileYet: "Nessun file ancora caricato",
      acceptedFormats: "Formati accettati: JPG, PNG, WebP, PDF. Max 10 MB.",
      reviewFile: "Esamina file",
      replaceFile: "Sostituisci file",
      uploadFile: "Carica file",
      uploading: "Caricamento...",
      uploadingIndicatorLabel: "Caricamento documento venditore",
      agreement:
        "Accetto i requisiti di moderazione, fiducia, protezione dei pagamenti e standard di risposta di HenryCo Marketplace.",
    },
    review: {
      storeNamePending: "Nome del negozio in sospeso",
      categoryPending: "Focus di categoria non ancora aggiunto",
      storyPending: "La storia del negozio deve ancora essere completata prima dell'invio.",
      documentPending: "In sospeso",
      blockedPrefix:
        "L'invio è ancora bloccato finché il set di prove richiesto non è completo: ",
      blockedSuffix: ".",
      submissionNote:
        "L'invio instrada la candidatura nella coda di moderazione in tempo reale, registra le prove di verifica nei documenti HenryCo e attiva gli avvisi per titolare/amministratore. L'accesso alla pubblicazione resta bloccato fino al completamento dell'approvazione.",
    },
    nav: {
      back: "Indietro",
      previous: "Precedente",
      continue: "Continua",
      submitting: "Invio in corso...",
      submitted: "Inviata",
      submit: "Invia candidatura venditore",
    },
    toast: {
      submittedTitle: "Candidatura venditore inviata",
      submittedBody: "La revisione HenryCo è iniziata.",
      submissionFailed: "Invio della candidatura non riuscito.",
      submissionBlockedTitle: "Invio bloccato",
      documentUploadedTitle: "Documento caricato",
      uploadFailedTitle: "Caricamento non riuscito",
      uploadFailed: "Caricamento non riuscito.",
    },
  },
};

const ZH: DeepPartial<MarketplaceSellerApplicationCopy> = {
  overview: {
    shellTitle: "卖家申请",
    shellDescription:
      "卖家入驻现已移至受保护的账户区域，使草稿、验证、审核备注和审批状态保持有序，而不会散落在公开的杂乱信息中。",
    actions: {
      continueOnboarding: "继续卖家入驻",
      continueApplication: "继续申请",
      startApplication: "开始申请",
    },
    statusCard: {
      defaultReviewNote:
        "您的申请正在处理流程中。更新将显示在此处以及通知中心。",
      submittedPrefix: "提交于",
    },
    cards: {
      protectedDraft: {
        title: "受保护的草稿流程",
        body: "店铺身份、验证和审核进度现已位于账户工作区内，而不在公开网站上。",
      },
      ownerVisibility: {
        title: "所有者和管理员可见性",
        body: "提交会立即触发内部审批队列和所有者提醒路径。",
      },
      vendorHandoff: {
        title: "卖家交接",
        body: "已获批准的卖家在产品提交开放前进入卖家入驻流程。",
      },
    },
    empty: {
      title: "目前还没有进行中的卖家申请。",
      body: "启动受保护的入驻流程，起草您的店铺资料、添加验证背景，并在拥有真实进度可见性的情况下进入审核。",
      ctaLabel: "开始卖家申请",
    },
  },
  reviewPage: {
    shellTitle: "卖家审核",
    shellDescription:
      "第 3 步在申请进入审核和所有者提醒流程之前对其进行确认。",
  },
  startPage: {
    shellTitle: "卖家申请",
    shellDescription:
      "第 1 步在审核工作开始前侧重于店铺身份、业务基础信息和类目重点。",
  },
  verificationPage: {
    shellTitle: "卖家验证",
    shellDescription:
      "第 2 步采集信任故事、KYC 背景和服务标准，以确定店铺是否已准备好接受审批。",
  },
  wizard: {
    documents: {
      businessRegistration: {
        label: "营业注册或经营证明",
        help: "建议提供。这会加快已注册实体的审批速度并减少后续跟进。",
      },
      founderIdentity: {
        label: "创始人身份 / KYC 文件",
        help: "信任审核结束前必填。请上传清晰的政府签发证件或经批准的 KYC 文件。",
      },
      payoutProof: {
        label: "收款账户证明",
        help: "在解锁与收款相关的敏感卖家权限前必填。",
      },
    },
    plan: {
      kicker: "从定价中选择的套餐",
      custom: "定制",
      free: "免费",
      monthlyFee: (amount: string) => `NGN ${amount}/月`,
      summarySuffix:
        "您可以在审批通过后卖家入驻开放时确认或更改此项。",
    },
    steps: {
      storeIdentity: "店铺身份",
      verification: "验证",
      review: "审核",
    },
    autosave: {
      saving: "正在保存草稿...",
      savedAt: (time: string) => `草稿已于 ${time} 保存。`,
      idle: "草稿会在您工作时自动保存。",
    },
    draftSaveFailed: "草稿保存失败。",
    start: {
      storeName: "店铺名称",
      storeSlug: "店铺标识",
      legalName: "法定企业名称",
      operatingPhone: "运营电话",
      categoryFocus: "类目重点",
      categoryPlaceholder: "高端家居、创始人办公室、精致风格……",
      guidance:
        "店铺身份是审核和所有者审查队列最先看到的内容。请使名称、法律实体和类目重点保持精确，以免审批和信任路由停滞。",
    },
    verification: {
      storyLabel: "店铺故事与信任角度",
      storyPlaceholder:
        "说明您销售什么、买家为何应信任该店铺，以及您能够保持的服务标准。",
      postureTitle: "验证态势",
      postureSubtitle: "实时信任把关",
      posturePoint1:
        "在提交进入正式审核通道之前，创始人身份和收款证明为必填项。",
      posturePoint2:
        "建议提供营业注册，以加快审批并减少澄清请求。",
      posturePoint3:
        "上传的证据将记录到 HenryCo 文档中，并与卖家审核流程关联。",
      requiredBadge: "必填",
      recommendedBadge: "建议",
      uploaded: "已上传",
      noFileYet: "尚未上传文件",
      acceptedFormats: "接受的格式：JPG、PNG、WebP、PDF。最大 10 MB。",
      reviewFile: "查看文件",
      replaceFile: "替换文件",
      uploadFile: "上传文件",
      uploading: "正在上传...",
      uploadingIndicatorLabel: "正在上传卖家文档",
      agreement:
        "我接受 HenryCo Marketplace 的审核、信任、收款保护和响应标准要求。",
    },
    review: {
      storeNamePending: "店铺名称待定",
      categoryPending: "尚未添加类目重点",
      storyPending: "提交前仍需完成店铺故事。",
      documentPending: "待定",
      blockedPrefix:
        "在所需证明集齐全之前，提交仍被阻止：",
      blockedSuffix: "。",
      submissionNote:
        "提交会将申请送入实时审核队列，将验证证据记录到 HenryCo 文档中，并触发所有者/管理员提醒。在审批完成之前，发布访问权限将保持锁定。",
    },
    nav: {
      back: "返回",
      previous: "上一步",
      continue: "继续",
      submitting: "正在提交...",
      submitted: "已提交",
      submit: "提交卖家申请",
    },
    toast: {
      submittedTitle: "卖家申请已提交",
      submittedBody: "HenryCo 审核已开始。",
      submissionFailed: "申请提交失败。",
      submissionBlockedTitle: "提交被阻止",
      documentUploadedTitle: "文档已上传",
      uploadFailedTitle: "上传失败",
      uploadFailed: "上传失败。",
    },
  },
};

const LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<MarketplaceSellerApplicationCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  ar: AR,
  de: DE,
  it: IT,
  zh: ZH,
};
// ig, yo, ha, hi are intentionally OMITTED -> fall back to EN (human-translation only).

export function getMarketplaceSellerApplicationCopy(
  locale: AppLocale,
): MarketplaceSellerApplicationCopy {
  const o = LOCALE_MAP[locale];
  if (o)
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      o as unknown as Record<string, unknown>,
    ) as unknown as MarketplaceSellerApplicationCopy;
  return EN;
}
