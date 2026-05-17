import type { AppLocale } from "./locales";
import { deepMergeMessages } from "./merge-messages";

export type PropertyTrustCopy = {
  meta: {
    title: string;
    description: string;
  };
  page: {
    kicker: string;
    title: string;
    description: string;
  };
  trustRails: {
    sectionKicker: string;
    items: Array<{ title: string; body: string }>;
  };
  statusGuide: {
    sectionKicker: string;
    items: Array<{ title: string; body: string }>;
  };
  expectations: {
    sectionKicker: string;
    columns: Array<{
      heading: string;
      bullets: string[];
    }>;
  };
  policy: {
    sectionKicker: string;
    cards: Array<{ title: string; body: string }>;
  };
  nextSteps: {
    kicker: string;
    items: string[];
  };
};

const EN: PropertyTrustCopy = {
  meta: {
    title: "Trust standards | HenryCo Property",
    description:
      "How HenryCo Property governs listing submissions, documents, inspections, managed operations, and publication safety.",
  },
  page: {
    kicker: "Trust",
    title: "Governed before it is public.",
    description:
      "Documents are path-specific, inspections are real workflows, and managed vs non-managed publication is not blurred together. Calm, but serious.",
  },
  trustRails: {
    sectionKicker: "Core trust rails",
    items: [
      {
        title: "The public site is not an open dump",
        body:
          "A listing does not go live just because somebody filled a form. HenryCo holds every submission privately first, then decides whether the documents, authority, identity, and property reality are strong enough for public release.",
      },
      {
        title: "Documents depend on the listing path",
        body:
          "Owner-listed, agent-led, managed, commercial, land, and inspection-sensitive submissions do not carry the same evidence burden. HenryCo asks for the documents that actually explain the path instead of hiding requirements until later.",
      },
      {
        title: "Inspection is operational, not decorative",
        body:
          "If a listing needs an inspection, that becomes a tracked workflow. It can be requested, scheduled, completed, waived, failed, or cancelled, and publication should not pretend the check is done when it is not.",
      },
    ],
  },
  statusGuide: {
    sectionKicker: "What the listing states mean",
    items: [
      {
        title: "Awaiting documents",
        body:
          "HenryCo still needs stronger authority, ownership, management, or supporting evidence before the listing can move deeper into review.",
      },
      {
        title: "Awaiting eligibility",
        body:
          "Identity, duplicate-contact review, or another trust prerequisite is still unresolved. The listing is held privately until that is cleared.",
      },
      {
        title: "Inspection requested or scheduled",
        body:
          "HenryCo has decided that a site check matters for this listing path. The listing is not treated as fully trusted until that inspection rail is closed properly.",
      },
      {
        title: "Under review, approved, or published",
        body:
          "Once the trust gates are satisfied, the listing can move into editorial review, approval, and then public visibility if the remaining quality checks pass.",
      },
    ],
  },
  expectations: {
    sectionKicker: "Two-sided expectations",
    columns: [
      {
        heading: "What HenryCo checks",
        bullets: [
          "Whether the submitter appears authorised to market, manage, or request inspection for the property.",
          "Whether the media, pricing, occupancy reality, and location context are serious enough for a premium platform.",
          "Whether the account trust posture is strong enough for higher-risk listing paths.",
          "Whether a managed listing is truly asking for HenryCo operations, not just a badge.",
        ],
      },
      {
        heading: "What owners and agents should expect",
        bullets: [
          "Direct uploads are better than pasted document links because staff need a reviewable file trail.",
          "If a listing is weak, HenryCo may request better proof, stronger copy, or clearer readiness details before it moves.",
          "Managed and non-managed listings are different paths; approval for one should not silently imply the other.",
          "If a listing gets held or escalated, the goal is cleaner publication truth, not bureaucratic noise.",
        ],
      },
    ],
  },
  policy: {
    sectionKicker: "Policy clarifications",
    cards: [
      {
        title: "Managed vs non-managed",
        body:
          "Managed listings imply HenryCo operational involvement after acceptance. Non-managed listings can still be reviewed and published, but the owner or agent remains responsible for the operating reality after first contact.",
      },
      {
        title: "Duplicate-contact resistance",
        body:
          "If the same email or phone appears across multiple HenryCo accounts or submissions, the listing may stay in manual review until the ownership picture is clearer.",
      },
      {
        title: "Inspection and viewing continuity",
        body:
          "HenryCo treats inspections and viewings as tracked workflows. Requests, schedules, and follow-up should remain visible to staff and to the account history instead of vanishing into chat.",
      },
    ],
  },
  nextSteps: {
    kicker: "What happens next after submission",
    items: [
      "Submitters see a private listing record first, not instant publication.",
      "HenryCo reviews the evidence, the trust posture, and whether the listing belongs on a managed, non-managed, or inspection-sensitive rail.",
      "If more information is needed, the listing can move into corrections, document hold, eligibility hold, or escalation before publication.",
      "Only after those checks are coherent should the listing move toward approval and public release.",
    ],
  },
};

const FR: Partial<PropertyTrustCopy> = {
  meta: {
    title: "Standards de confiance | HenryCo Property",
    description:
      "Comment HenryCo Property régit les soumissions d'annonces, les documents, les inspections, les opérations gérées et la sécurité de publication.",
  },
  page: {
    kicker: "Confiance",
    title: "Gouverné avant d'être public.",
    description:
      "Les documents sont spécifiques au parcours, les inspections sont de vrais workflows, et la publication gérée vs non gérée n'est pas mélangée. Calme, mais sérieux.",
  },
  trustRails: {
    sectionKicker: "Rails de confiance principaux",
    items: [
      {
        title: "Le site public n'est pas une décharge ouverte",
        body:
          "Une annonce n'est pas publiée simplement parce que quelqu'un a rempli un formulaire. HenryCo conserve chaque soumission en privé d'abord, puis décide si les documents, l'autorité, l'identité et la réalité de la propriété sont suffisamment solides pour une diffusion publique.",
      },
      {
        title: "Les documents dépendent du parcours d'annonce",
        body:
          "Les soumissions d'un propriétaire, d'un agent, d'une gestion, d'un commerce, d'un terrain ou d'une inspection ne portent pas le même fardeau de preuves. HenryCo demande les documents qui expliquent vraiment le parcours au lieu de cacher les exigences.",
      },
      {
        title: "L'inspection est opérationnelle, pas décorative",
        body:
          "Si une annonce nécessite une inspection, cela devient un workflow suivi. Elle peut être demandée, planifiée, terminée, abandonnée, échouée ou annulée, et la publication ne doit pas prétendre que la vérification est faite quand elle ne l'est pas.",
      },
    ],
  },
  statusGuide: {
    sectionKicker: "Ce que signifient les états de l'annonce",
    items: [
      {
        title: "En attente de documents",
        body:
          "HenryCo a encore besoin d'une autorité, d'une propriété, d'une gestion ou de preuves supplémentaires avant que l'annonce puisse avancer dans l'examen.",
      },
      {
        title: "En attente d'éligibilité",
        body:
          "L'identité, l'examen des contacts en double ou un autre prérequis de confiance est encore en attente. L'annonce est conservée en privé jusqu'à ce que ce soit résolu.",
      },
      {
        title: "Inspection demandée ou planifiée",
        body:
          "HenryCo a décidé qu'une vérification sur place est importante pour ce parcours d'annonce. L'annonce n'est pas considérée comme entièrement fiable jusqu'à ce que le rail d'inspection soit correctement fermé.",
      },
      {
        title: "En cours d'examen, approuvé ou publié",
        body:
          "Une fois les portes de confiance satisfaites, l'annonce peut passer en examen éditorial, approbation, puis visibilité publique si les contrôles de qualité restants passent.",
      },
    ],
  },
  expectations: {
    sectionKicker: "Attentes bilatérales",
    columns: [
      {
        heading: "Ce que HenryCo vérifie",
        bullets: [
          "Si le soumetteur semble autorisé à commercialiser, gérer ou demander une inspection pour la propriété.",
          "Si les médias, le prix, la réalité d'occupation et le contexte de localisation sont suffisamment sérieux pour une plateforme premium.",
          "Si la posture de confiance du compte est suffisamment forte pour les parcours d'annonces à risque plus élevé.",
          "Si une annonce gérée demande vraiment les opérations HenryCo, pas seulement un badge.",
        ],
      },
      {
        heading: "Ce que les propriétaires et agents doivent attendre",
        bullets: [
          "Les téléchargements directs sont meilleurs que les liens de documents collés car le personnel a besoin d'une piste de fichiers vérifiable.",
          "Si une annonce est faible, HenryCo peut demander de meilleures preuves, une meilleure rédaction ou des détails de préparation plus clairs avant qu'elle avance.",
          "Les annonces gérées et non gérées sont des parcours différents ; l'approbation de l'une ne doit pas implicitement impliquer l'autre.",
          "Si une annonce est retenue ou escaladée, l'objectif est une vérité de publication plus propre, pas du bruit bureaucratique.",
        ],
      },
    ],
  },
  policy: {
    sectionKicker: "Précisions sur les politiques",
    cards: [
      {
        title: "Géré vs non géré",
        body:
          "Les annonces gérées impliquent l'implication opérationnelle de HenryCo après acceptation. Les annonces non gérées peuvent encore être examinées et publiées, mais le propriétaire ou l'agent reste responsable de la réalité opérationnelle après le premier contact.",
      },
      {
        title: "Résistance aux contacts en double",
        body:
          "Si le même e-mail ou téléphone apparaît sur plusieurs comptes ou soumissions HenryCo, l'annonce peut rester en examen manuel jusqu'à ce que la situation de propriété soit plus claire.",
      },
      {
        title: "Continuité des inspections et des visites",
        body:
          "HenryCo traite les inspections et les visites comme des workflows suivis. Les demandes, les planifications et les suivis doivent rester visibles pour le personnel et l'historique du compte au lieu de disparaître dans le chat.",
      },
    ],
  },
  nextSteps: {
    kicker: "Ce qui se passe après la soumission",
    items: [
      "Les soumetteurs voient d'abord un dossier d'annonce privé, pas une publication instantanée.",
      "HenryCo examine les preuves, la posture de confiance et si l'annonce appartient à un rail géré, non géré ou sensible à l'inspection.",
      "Si plus d'informations sont nécessaires, l'annonce peut passer en corrections, en attente de documents, en attente d'éligibilité ou en escalade avant la publication.",
      "Ce n'est qu'après que ces vérifications sont cohérentes que l'annonce doit passer vers l'approbation et la diffusion publique.",
    ],
  },
};

const ES: Partial<PropertyTrustCopy> = {
  meta: {
    title: "Estándares de confianza | HenryCo Property",
    description:
      "Cómo HenryCo Property rige las presentaciones de listados, documentos, inspecciones, operaciones gestionadas y seguridad de publicación.",
  },
  page: {
    kicker: "Confianza",
    title: "Gobernado antes de ser público.",
    description:
      "Los documentos son específicos del camino, las inspecciones son flujos de trabajo reales, y la publicación gestionada vs no gestionada no se mezcla. Calmado, pero serio.",
  },
  trustRails: {
    sectionKicker: "Rieles de confianza principales",
    items: [
      {
        title: "El sitio público no es un vertedero abierto",
        body:
          "Un listado no se publica solo porque alguien llenó un formulario. HenryCo retiene cada presentación de forma privada primero, luego decide si los documentos, la autoridad, la identidad y la realidad de la propiedad son suficientemente sólidos para la publicación.",
      },
      {
        title: "Los documentos dependen del camino del listado",
        body:
          "Las presentaciones de propietarios, agentes, gestionados, comerciales, terrenos y sensibles a inspección no tienen la misma carga de evidencia. HenryCo pide los documentos que realmente explican el camino.",
      },
      {
        title: "La inspección es operacional, no decorativa",
        body:
          "Si un listado necesita inspección, eso se convierte en un flujo de trabajo rastreado. Puede solicitarse, programarse, completarse, renunciarse, fallar o cancelarse, y la publicación no debe fingir que la verificación está hecha cuando no lo está.",
      },
    ],
  },
  statusGuide: {
    sectionKicker: "Qué significan los estados del listado",
    items: [
      {
        title: "Esperando documentos",
        body:
          "HenryCo aún necesita más autoridad, propiedad, gestión o evidencia de respaldo antes de que el listado pueda avanzar en la revisión.",
      },
      {
        title: "Esperando elegibilidad",
        body:
          "La identidad, la revisión de contactos duplicados u otro prerrequisito de confianza aún está sin resolver. El listado se mantiene en privado hasta que se resuelva.",
      },
      {
        title: "Inspección solicitada o programada",
        body:
          "HenryCo ha decidido que una verificación en el sitio importa para este camino del listado. El listado no se trata como completamente confiable hasta que el riel de inspección se cierra correctamente.",
      },
      {
        title: "Bajo revisión, aprobado o publicado",
        body:
          "Una vez que se satisfacen las puertas de confianza, el listado puede pasar a revisión editorial, aprobación y luego visibilidad pública si pasan los controles de calidad restantes.",
      },
    ],
  },
  expectations: {
    sectionKicker: "Expectativas bilaterales",
    columns: [
      {
        heading: "Qué verifica HenryCo",
        bullets: [
          "Si el presentador parece autorizado para comercializar, gestionar o solicitar inspección de la propiedad.",
          "Si los medios, el precio, la realidad de ocupación y el contexto de ubicación son suficientemente serios para una plataforma premium.",
          "Si la postura de confianza de la cuenta es suficientemente fuerte para caminos de listado de mayor riesgo.",
          "Si un listado gestionado realmente solicita las operaciones de HenryCo, no solo una insignia.",
        ],
      },
      {
        heading: "Qué deben esperar propietarios y agentes",
        bullets: [
          "Las cargas directas son mejores que los enlaces de documentos pegados porque el personal necesita un rastro de archivos revisable.",
          "Si un listado es débil, HenryCo puede solicitar mejores pruebas, mejor redacción o detalles de preparación más claros antes de que avance.",
          "Los listados gestionados y no gestionados son caminos diferentes; la aprobación de uno no debe implicar silenciosamente al otro.",
          "Si un listado se retiene o escala, el objetivo es una verdad de publicación más limpia, no ruido burocrático.",
        ],
      },
    ],
  },
  policy: {
    sectionKicker: "Aclaraciones de políticas",
    cards: [
      {
        title: "Gestionado vs no gestionado",
        body:
          "Los listados gestionados implican la participación operacional de HenryCo después de la aceptación. Los listados no gestionados aún pueden revisarse y publicarse, pero el propietario o agente sigue siendo responsable de la realidad operacional tras el primer contacto.",
      },
      {
        title: "Resistencia a contactos duplicados",
        body:
          "Si el mismo correo electrónico o teléfono aparece en múltiples cuentas o presentaciones de HenryCo, el listado puede permanecer en revisión manual hasta que el panorama de propiedad sea más claro.",
      },
      {
        title: "Continuidad de inspecciones y visitas",
        body:
          "HenryCo trata las inspecciones y visitas como flujos de trabajo rastreados. Las solicitudes, horarios y seguimientos deben permanecer visibles para el personal y el historial de cuentas en lugar de desaparecer en el chat.",
      },
    ],
  },
  nextSteps: {
    kicker: "Qué sucede después de la presentación",
    items: [
      "Los presentadores ven primero un registro de listado privado, no una publicación instantánea.",
      "HenryCo revisa la evidencia, la postura de confianza y si el listado pertenece a un riel gestionado, no gestionado o sensible a inspección.",
      "Si se necesita más información, el listado puede pasar a correcciones, retención de documentos, retención de elegibilidad o escalada antes de la publicación.",
      "Solo después de que esas verificaciones sean coherentes debe el listado moverse hacia la aprobación y la publicación.",
    ],
  },
};

const PT: Partial<PropertyTrustCopy> = {
  meta: {
    title: "Padrões de confiança | HenryCo Property",
    description:
      "Como a HenryCo Property governa envios de listagens, documentos, inspeções, operações gerenciadas e segurança de publicação.",
  },
  page: {
    kicker: "Confiança",
    title: "Governado antes de ser público.",
    description:
      "Os documentos são específicos do caminho, as inspeções são fluxos de trabalho reais e a publicação gerenciada vs não gerenciada não é confundida. Calmo, mas sério.",
  },
  trustRails: {
    sectionKicker: "Trilhos de confiança principais",
    items: [
      {
        title: "O site público não é um lixão aberto",
        body:
          "Uma listagem não fica ao vivo só porque alguém preencheu um formulário. A HenryCo mantém cada envio em particular primeiro, então decide se os documentos, autoridade, identidade e realidade da propriedade são suficientemente sólidos para divulgação pública.",
      },
      {
        title: "Os documentos dependem do caminho da listagem",
        body:
          "Envios de proprietários, agentes, gerenciados, comerciais, terrenos e sensíveis a inspeção não carregam o mesmo fardo de evidências. A HenryCo pede os documentos que realmente explicam o caminho.",
      },
      {
        title: "A inspeção é operacional, não decorativa",
        body:
          "Se uma listagem precisa de inspeção, isso se torna um fluxo de trabalho rastreado. Pode ser solicitada, agendada, concluída, dispensada, falhar ou cancelada, e a publicação não deve fingir que a verificação está feita quando não está.",
      },
    ],
  },
  statusGuide: {
    sectionKicker: "O que significam os estados da listagem",
    items: [
      {
        title: "Aguardando documentos",
        body:
          "A HenryCo ainda precisa de mais autoridade, propriedade, gestão ou evidências de suporte antes que a listagem possa avançar na revisão.",
      },
      {
        title: "Aguardando elegibilidade",
        body:
          "Identidade, revisão de contato duplicado ou outro pré-requisito de confiança ainda está não resolvido. A listagem é mantida em particular até que isso seja resolvido.",
      },
      {
        title: "Inspeção solicitada ou agendada",
        body:
          "A HenryCo decidiu que uma verificação no local importa para este caminho de listagem. A listagem não é tratada como totalmente confiável até que o trilho de inspeção seja fechado corretamente.",
      },
      {
        title: "Em revisão, aprovada ou publicada",
        body:
          "Depois que os portões de confiança são satisfeitos, a listagem pode passar para revisão editorial, aprovação e depois visibilidade pública se as verificações de qualidade restantes passarem.",
      },
    ],
  },
  expectations: {
    sectionKicker: "Expectativas bilaterais",
    columns: [
      {
        heading: "O que a HenryCo verifica",
        bullets: [
          "Se o remetente parece autorizado a comercializar, gerenciar ou solicitar inspeção da propriedade.",
          "Se a mídia, preços, realidade de ocupação e contexto de localização são sérios o suficiente para uma plataforma premium.",
          "Se a postura de confiança da conta é suficientemente forte para caminhos de listagem de maior risco.",
          "Se uma listagem gerenciada está realmente pedindo operações da HenryCo, não apenas um distintivo.",
        ],
      },
      {
        heading: "O que proprietários e agentes devem esperar",
        bullets: [
          "Uploads diretos são melhores do que links de documentos colados porque a equipe precisa de um rastro de arquivos revisável.",
          "Se uma listagem é fraca, a HenryCo pode solicitar melhores provas, texto mais forte ou detalhes de prontidão mais claros antes de avançar.",
          "Listagens gerenciadas e não gerenciadas são caminhos diferentes; a aprovação de uma não deve implicar silenciosamente a outra.",
          "Se uma listagem for retida ou escalada, o objetivo é uma verdade de publicação mais limpa, não ruído burocrático.",
        ],
      },
    ],
  },
  policy: {
    sectionKicker: "Esclarecimentos de política",
    cards: [
      {
        title: "Gerenciado vs não gerenciado",
        body:
          "Listagens gerenciadas implicam envolvimento operacional da HenryCo após aceitação. Listagens não gerenciadas ainda podem ser revisadas e publicadas, mas o proprietário ou agente permanece responsável pela realidade operacional após o primeiro contato.",
      },
      {
        title: "Resistência a contatos duplicados",
        body:
          "Se o mesmo e-mail ou telefone aparecer em várias contas ou envios da HenryCo, a listagem pode permanecer em revisão manual até que a situação de propriedade fique mais clara.",
      },
      {
        title: "Continuidade de inspeções e visitas",
        body:
          "A HenryCo trata inspeções e visitas como fluxos de trabalho rastreados. Solicitações, agendamentos e acompanhamentos devem permanecer visíveis para a equipe e para o histórico da conta em vez de desaparecerem no chat.",
      },
    ],
  },
  nextSteps: {
    kicker: "O que acontece depois do envio",
    items: [
      "Os remetentes veem primeiro um registro de listagem privado, não uma publicação instantânea.",
      "A HenryCo analisa as evidências, a postura de confiança e se a listagem pertence a um trilho gerenciado, não gerenciado ou sensível a inspeção.",
      "Se mais informações forem necessárias, a listagem pode passar para correções, retenção de documentos, retenção de elegibilidade ou escalada antes da publicação.",
      "Somente após essas verificações serem coerentes a listagem deve avançar para aprovação e publicação.",
    ],
  },
};

const AR: Partial<PropertyTrustCopy> = {
  meta: {
    title: "معايير الثقة | HenryCo Property",
    description:
      "كيف تحكم HenryCo Property تقديمات الإعلانات والوثائق والتفتيش والعمليات المُدارة وأمان النشر.",
  },
  page: {
    kicker: "الثقة",
    title: "مُحكَم قبل أن يصبح عامًا.",
    description:
      "الوثائق مخصصة للمسار، والتفتيش سير عمل حقيقي، ولا يتم خلط النشر المُدار مع غير المُدار. هادئ لكن جدي.",
  },
  trustRails: {
    sectionKicker: "ريل الثقة الأساسية",
    items: [
      {
        title: "الموقع العام ليس مكب نفايات مفتوحًا",
        body:
          "لا ينشر الإعلان فقط لأن شخصًا ما ملأ نموذجًا. تحتفظ HenryCo بكل تقديم بشكل خاص أولًا، ثم تقرر ما إذا كانت الوثائق والسلطة والهوية وواقع الملكية قوية بما يكفي للنشر العام.",
      },
      {
        title: "الوثائق تعتمد على مسار الإعلان",
        body:
          "التقديمات من قبل المالك والوكيل والمُدار والتجاري والأرض والحساسة للتفتيش لا تحمل نفس عبء الأدلة. تطلب HenryCo الوثائق التي تشرح المسار بالفعل بدلًا من إخفاء المتطلبات.",
      },
      {
        title: "التفتيش عملياتي وليس ديكوريًا",
        body:
          "إذا احتاج الإعلان إلى تفتيش، يصبح ذلك سير عمل تتبع. يمكن طلبه وجدولته وإكماله والتنازل عنه وفشله أو إلغاؤه، ولا يجب أن يتظاهر النشر بأن الفحص تم عندما لا يكون كذلك.",
      },
    ],
  },
  statusGuide: {
    sectionKicker: "ماذا تعني حالات الإعلان",
    items: [
      {
        title: "في انتظار الوثائق",
        body:
          "لا تزال HenryCo بحاجة إلى سلطة أقوى أو ملكية أو إدارة أو أدلة داعمة قبل أن يتمكن الإعلان من التقدم في المراجعة.",
      },
      {
        title: "في انتظار الأهلية",
        body:
          "الهوية أو مراجعة الاتصال المكرر أو شرط مسبق آخر للثقة لا يزال غير محلول. يُحتفظ بالإعلان بشكل خاص حتى يتم ذلك.",
      },
      {
        title: "التفتيش مطلوب أو مجدول",
        body:
          "قررت HenryCo أن التحقق الميداني مهم لمسار هذا الإعلان. لا يُعامل الإعلان باعتباره موثوقًا بالكامل حتى يتم إغلاق ريل التفتيش بشكل صحيح.",
      },
      {
        title: "قيد المراجعة أو معتمد أو منشور",
        body:
          "بمجرد استيفاء بوابات الثقة، يمكن للإعلان الانتقال إلى المراجعة التحريرية والموافقة ثم الظهور العام إذا اجتازت فحوصات الجودة المتبقية.",
      },
    ],
  },
  expectations: {
    sectionKicker: "توقعات ثنائية الجانب",
    columns: [
      {
        heading: "ما تتحقق منه HenryCo",
        bullets: [
          "ما إذا كان المقدِّم يبدو مفوضًا بالتسويق أو الإدارة أو طلب التفتيش للعقار.",
          "ما إذا كانت وسائل الإعلام والتسعير وواقع الإشغال وسياق الموقع جديين بما يكفي لمنصة متميزة.",
          "ما إذا كانت وضعية الثقة في الحساب قوية بما يكفي لمسارات الإعلانات الأعلى مخاطرة.",
          "ما إذا كان الإعلان المُدار يطلب بالفعل عمليات HenryCo، وليس فقط شارة.",
        ],
      },
      {
        heading: "ما يجب أن يتوقعه الملاك والوكلاء",
        bullets: [
          "التحميلات المباشرة أفضل من روابط الوثائق الملصوقة لأن الموظفين يحتاجون إلى مسار ملفات قابل للمراجعة.",
          "إذا كان الإعلان ضعيفًا، قد تطلب HenryCo أدلة أفضل أو نصًا أقوى أو تفاصيل جاهزية أوضح قبل المضي.",
          "الإعلانات المُدارة وغير المُدارة مسارات مختلفة؛ لا يجب أن تعني الموافقة على أحدهما الآخر ضمنيًا.",
          "إذا تم تعليق إعلان أو تصعيده، فالهدف هو حقيقة نشر أنظف، وليس ضوضاء بيروقراطية.",
        ],
      },
    ],
  },
  policy: {
    sectionKicker: "توضيحات السياسات",
    cards: [
      {
        title: "مُدار مقابل غير مُدار",
        body:
          "الإعلانات المُدارة تعني مشاركة تشغيلية لـ HenryCo بعد القبول. يمكن للإعلانات غير المُدارة أن تُراجع وتُنشر، لكن المالك أو الوكيل يظل مسؤولًا عن الواقع التشغيلي بعد الاتصال الأول.",
      },
      {
        title: "مقاومة الاتصال المكرر",
        body:
          "إذا ظهر نفس البريد الإلكتروني أو الهاتف عبر حسابات أو تقديمات HenryCo متعددة، قد يبقى الإعلان في مراجعة يدوية حتى تتضح صورة الملكية.",
      },
      {
        title: "استمرارية التفتيش والمعاينة",
        body:
          "تعامل HenryCo التفتيش والمعاينات كسير عمل تتبع. يجب أن تظل الطلبات والجداول والمتابعة مرئية للموظفين ولتاريخ الحساب بدلًا من الاختفاء في الدردشة.",
      },
    ],
  },
  nextSteps: {
    kicker: "ما الذي يحدث بعد التقديم",
    items: [
      "يرى المقدِّمون سجل إعلان خاص أولًا، وليس نشرًا فوريًا.",
      "تراجع HenryCo الأدلة ووضعية الثقة وما إذا كان الإعلان ينتمي إلى ريل مُدار أو غير مُدار أو حساس للتفتيش.",
      "إذا كانت هناك حاجة لمزيد من المعلومات، يمكن للإعلان الانتقال إلى التصحيحات أو تعليق الوثائق أو تعليق الأهلية أو التصعيد قبل النشر.",
      "فقط بعد أن تكون تلك الفحوصات متماسكة، يجب أن ينتقل الإعلان نحو الموافقة والإصدار العام.",
    ],
  },
};

const DE: Partial<PropertyTrustCopy> = {
  meta: {
    title: "Vertrauensstandards | HenryCo Property",
    description:
      "Wie HenryCo Property Inserateinreichungen, Dokumente, Inspektionen, verwaltete Abläufe und Veröffentlichungssicherheit regelt.",
  },
  page: {
    kicker: "Vertrauen",
    title: "Geregelt bevor es öffentlich ist.",
    description:
      "Dokumente sind pfadspezifisch, Inspektionen sind echte Workflows und verwaltete vs. nicht verwaltete Veröffentlichung wird nicht vermischt. Ruhig, aber ernst.",
  },
  trustRails: {
    sectionKicker: "Kern-Vertrauensschienen",
    items: [
      {
        title: "Die öffentliche Website ist kein offener Müllplatz",
        body:
          "Ein Inserat geht nicht live, nur weil jemand ein Formular ausgefüllt hat. HenryCo hält jede Einreichung zunächst privat und entscheidet dann, ob Dokumente, Befugnis, Identität und Immobilienwirklichkeit stark genug für die öffentliche Freigabe sind.",
      },
      {
        title: "Dokumente hängen vom Inseratpfad ab",
        body:
          "Einreichungen von Eigentümern, Agenten, verwalteten, gewerblichen, Grundstücks- und inspektionsempfindlichen Quellen tragen nicht die gleiche Beweislast. HenryCo fragt nach Dokumenten, die den Pfad tatsächlich erklären.",
      },
      {
        title: "Inspektion ist operativ, nicht dekorativ",
        body:
          "Wenn ein Inserat eine Inspektion benötigt, wird das ein verfolgter Workflow. Er kann angefordert, geplant, abgeschlossen, verzichtet, gescheitert oder abgebrochen werden, und die Veröffentlichung sollte nicht so tun, als ob die Prüfung abgeschlossen ist, wenn sie es nicht ist.",
      },
    ],
  },
  statusGuide: {
    sectionKicker: "Was die Inseratstatus bedeuten",
    items: [
      {
        title: "Warten auf Dokumente",
        body:
          "HenryCo benötigt noch stärkere Befugnis, Eigentümerschaft, Verwaltung oder Belege, bevor das Inserat tiefer in die Überprüfung eintreten kann.",
      },
      {
        title: "Warten auf Berechtigung",
        body:
          "Identität, doppelte Kontaktprüfung oder eine andere Vertrauensvoraussetzung ist noch ungelöst. Das Inserat wird privat gehalten, bis das geklärt ist.",
      },
      {
        title: "Inspektion angefragt oder geplant",
        body:
          "HenryCo hat entschieden, dass eine Ortsbesichtigung für diesen Inseratpfad wichtig ist. Das Inserat gilt nicht als vollständig vertrauenswürdig, bis die Inspektionsschiene ordnungsgemäß abgeschlossen ist.",
      },
      {
        title: "In Prüfung, genehmigt oder veröffentlicht",
        body:
          "Sobald die Vertrauenstore erfüllt sind, kann das Inserat in redaktionelle Prüfung, Genehmigung und dann öffentliche Sichtbarkeit übergehen, wenn die verbleibenden Qualitätsprüfungen bestanden werden.",
      },
    ],
  },
  expectations: {
    sectionKicker: "Beidseitige Erwartungen",
    columns: [
      {
        heading: "Was HenryCo prüft",
        bullets: [
          "Ob der Einreicher anscheinend berechtigt ist, die Immobilie zu vermarkten, zu verwalten oder eine Inspektion anzufordern.",
          "Ob Medien, Preisgestaltung, Belegungsrealität und Standortkontext für eine Premium-Plattform ernst genug sind.",
          "Ob die Vertrauenshaltung des Kontos stark genug für risikobehaftete Inseratpfade ist.",
          "Ob ein verwaltetes Inserat tatsächlich HenryCo-Operationen anfordert, nicht nur ein Abzeichen.",
        ],
      },
      {
        heading: "Was Eigentümer und Agenten erwarten sollten",
        bullets: [
          "Direkte Uploads sind besser als eingefügte Dokumentlinks, da das Personal eine prüfbare Datei-Spur benötigt.",
          "Wenn ein Inserat schwach ist, kann HenryCo bessere Nachweise, stärkeren Text oder klarere Bereitschaftsdetails anfordern, bevor es voranschreitet.",
          "Verwaltete und nicht verwaltete Inserate sind verschiedene Pfade; die Genehmigung eines sollte nicht stillschweigend das andere implizieren.",
          "Wenn ein Inserat gehalten oder eskaliert wird, ist das Ziel eine sauberere Veröffentlichungswahrheit, kein bürokratisches Rauschen.",
        ],
      },
    ],
  },
  policy: {
    sectionKicker: "Richtlinienklarstellungen",
    cards: [
      {
        title: "Verwaltet vs. nicht verwaltet",
        body:
          "Verwaltete Inserate implizieren HenryCo-Beteiligung nach der Annahme. Nicht verwaltete Inserate können weiterhin geprüft und veröffentlicht werden, aber der Eigentümer oder Agent bleibt nach dem ersten Kontakt für die betriebliche Realität verantwortlich.",
      },
      {
        title: "Doppelkontakt-Resistenz",
        body:
          "Wenn dieselbe E-Mail oder Telefonnummer in mehreren HenryCo-Konten oder Einreichungen vorkommt, kann das Inserat in manueller Prüfung bleiben, bis das Eigentumsbild klarer ist.",
      },
      {
        title: "Inspektions- und Besichtigungskontinuität",
        body:
          "HenryCo behandelt Inspektionen und Besichtigungen als verfolgte Workflows. Anfragen, Zeitpläne und Nachverfolgungen sollten für das Personal und den Kontohistorie sichtbar bleiben, anstatt im Chat zu verschwinden.",
      },
    ],
  },
  nextSteps: {
    kicker: "Was nach der Einreichung passiert",
    items: [
      "Einreicher sehen zuerst einen privaten Inseratdatensatz, keine sofortige Veröffentlichung.",
      "HenryCo prüft die Nachweise, die Vertrauenshaltung und ob das Inserat auf einem verwalteten, nicht verwalteten oder inspektionsempfindlichen Gleis liegt.",
      "Wenn mehr Informationen benötigt werden, kann das Inserat in Korrekturen, Dokumentensperre, Berechtigungssperre oder Eskalation vor der Veröffentlichung eintreten.",
      "Erst wenn diese Prüfungen kohärent sind, sollte das Inserat in Richtung Genehmigung und öffentliche Freigabe übergehen.",
    ],
  },
};

const IT: Partial<PropertyTrustCopy> = {
  meta: {
    title: "Standard di fiducia | HenryCo Property",
    description:
      "Come HenryCo Property governa le presentazioni di annunci, i documenti, le ispezioni, le operazioni gestite e la sicurezza della pubblicazione.",
  },
  page: {
    kicker: "Fiducia",
    title: "Governato prima di essere pubblico.",
    description:
      "I documenti sono specifici del percorso, le ispezioni sono flussi di lavoro reali e la pubblicazione gestita vs non gestita non è confusa. Calmo, ma serio.",
  },
  trustRails: {
    sectionKicker: "Binari di fiducia principali",
    items: [
      {
        title: "Il sito pubblico non è una discarica aperta",
        body:
          "Un annuncio non va online solo perché qualcuno ha compilato un modulo. HenryCo conserva ogni presentazione in privato prima, poi decide se documenti, autorità, identità e realtà della proprietà sono abbastanza solidi per la pubblicazione pubblica.",
      },
      {
        title: "I documenti dipendono dal percorso dell'annuncio",
        body:
          "Le presentazioni di proprietari, agenti, gestiti, commerciali, terreni e sensibili all'ispezione non portano lo stesso onere probatorio. HenryCo chiede i documenti che spiegano davvero il percorso.",
      },
      {
        title: "L'ispezione è operativa, non decorativa",
        body:
          "Se un annuncio necessita di ispezione, diventa un flusso di lavoro tracciato. Può essere richiesta, pianificata, completata, rinunciata, fallita o annullata, e la pubblicazione non dovrebbe fingere che il controllo sia fatto quando non lo è.",
      },
    ],
  },
  statusGuide: {
    sectionKicker: "Cosa significano gli stati dell'annuncio",
    items: [
      {
        title: "In attesa di documenti",
        body:
          "HenryCo ha ancora bisogno di una migliore autorità, proprietà, gestione o prove di supporto prima che l'annuncio possa avanzare nella revisione.",
      },
      {
        title: "In attesa di idoneità",
        body:
          "L'identità, la revisione dei contatti duplicati o un altro prerequisito di fiducia è ancora irrisolto. L'annuncio è tenuto in privato fino a quando non viene chiarito.",
      },
      {
        title: "Ispezione richiesta o pianificata",
        body:
          "HenryCo ha deciso che un controllo in loco è importante per questo percorso di annuncio. L'annuncio non è considerato pienamente attendibile fino a quando il binario di ispezione non è chiuso correttamente.",
      },
      {
        title: "In revisione, approvato o pubblicato",
        body:
          "Una volta soddisfatte le porte di fiducia, l'annuncio può passare alla revisione editoriale, all'approvazione e poi alla visibilità pubblica se i controlli di qualità rimanenti vengono superati.",
      },
    ],
  },
  expectations: {
    sectionKicker: "Aspettative bilaterali",
    columns: [
      {
        heading: "Cosa verifica HenryCo",
        bullets: [
          "Se il presentatore sembra autorizzato a commercializzare, gestire o richiedere ispezioni per la proprietà.",
          "Se media, prezzi, realtà occupazionale e contesto di posizione sono abbastanza seri per una piattaforma premium.",
          "Se la postura di fiducia dell'account è abbastanza forte per percorsi di annunci a rischio più elevato.",
          "Se un annuncio gestito sta davvero richiedendo le operazioni di HenryCo, non solo un badge.",
        ],
      },
      {
        heading: "Cosa devono aspettarsi proprietari e agenti",
        bullets: [
          "I caricamenti diretti sono migliori dei link ai documenti incollati perché il personale ha bisogno di una traccia di file verificabile.",
          "Se un annuncio è debole, HenryCo può richiedere prove migliori, testi più forti o dettagli di prontezza più chiari prima di procedere.",
          "Gli annunci gestiti e non gestiti sono percorsi diversi; l'approvazione di uno non dovrebbe implicare silenziosamente l'altro.",
          "Se un annuncio viene trattenuto o escalato, l'obiettivo è una verità di pubblicazione più pulita, non rumore burocratico.",
        ],
      },
    ],
  },
  policy: {
    sectionKicker: "Chiarimenti politici",
    cards: [
      {
        title: "Gestito vs non gestito",
        body:
          "Gli annunci gestiti implicano il coinvolgimento operativo di HenryCo dopo l'accettazione. Gli annunci non gestiti possono essere comunque esaminati e pubblicati, ma il proprietario o l'agente rimane responsabile della realtà operativa dopo il primo contatto.",
      },
      {
        title: "Resistenza ai contatti duplicati",
        body:
          "Se la stessa email o telefono appare in più account o presentazioni HenryCo, l'annuncio potrebbe rimanere in revisione manuale fino a quando la situazione proprietaria non è più chiara.",
      },
      {
        title: "Continuità di ispezioni e visite",
        body:
          "HenryCo tratta ispezioni e visite come flussi di lavoro tracciati. Richieste, pianificazioni e follow-up devono rimanere visibili al personale e alla cronologia dell'account anziché scomparire nella chat.",
      },
    ],
  },
  nextSteps: {
    kicker: "Cosa succede dopo la presentazione",
    items: [
      "I presentatori vedono prima un record di annuncio privato, non una pubblicazione immediata.",
      "HenryCo esamina le prove, la postura di fiducia e se l'annuncio appartiene a un binario gestito, non gestito o sensibile all'ispezione.",
      "Se sono necessarie ulteriori informazioni, l'annuncio può passare a correzioni, blocco documenti, blocco idoneità o escalation prima della pubblicazione.",
      "Solo dopo che tali controlli sono coerenti l'annuncio dovrebbe procedere verso l'approvazione e il rilascio pubblico.",
    ],
  },
};

const ZH: Partial<PropertyTrustCopy> = {
  meta: {
    title: "信任标准 | HenryCo Property",
    description: "HenryCo Property如何管理挂牌提交、文件、检查、管理操作和发布安全。",
  },
  page: {
    kicker: "信任",
    title: "在公开之前受到管治。",
    description: "文件是路径特定的，检查是真实的工作流程，受管理与非受管理的发布不会混淆。平静但严肃。",
  },
  trustRails: {
    sectionKicker: "核心信任轨道",
    items: [
      {
        title: "公共网站不是公开的垃圾场",
        body:
          "挂牌不会仅仅因为有人填写了表格就上线。HenryCo首先私下保留每份提交，然后决定文件、权威、身份和房产现实是否足够强大，可以公开发布。",
      },
      {
        title: "文件取决于挂牌路径",
        body:
          "业主挂牌、代理主导、受管理、商业、土地和检查敏感的提交不具有相同的证据负担。HenryCo要求真正解释路径的文件。",
      },
      {
        title: "检查是操作性的，而非装饰性的",
        body:
          "如果挂牌需要检查，这将成为一个跟踪工作流程。它可以被请求、安排、完成、放弃、失败或取消，发布不应该假装检查已经完成，当它实际上没有。",
      },
    ],
  },
  statusGuide: {
    sectionKicker: "挂牌状态的含义",
    items: [
      {
        title: "等待文件",
        body: "HenryCo仍然需要更强的权威、所有权、管理或支持证据，挂牌才能深入审核。",
      },
      {
        title: "等待资格",
        body: "身份、重复联系审核或另一个信任先决条件仍未解决。挂牌在私下保留直到解决。",
      },
      {
        title: "已请求或安排检查",
        body: "HenryCo已决定现场检查对此挂牌路径很重要。在检查轨道正确关闭之前，挂牌不被视为完全可信。",
      },
      {
        title: "审核中、已批准或已发布",
        body: "一旦信任门槛满足，挂牌可以进入编辑审核、批准，然后如果剩余质量检查通过，则进入公开可见。",
      },
    ],
  },
  expectations: {
    sectionKicker: "双边期望",
    columns: [
      {
        heading: "HenryCo检查什么",
        bullets: [
          "提交者是否似乎被授权营销、管理或请求检查房产。",
          "媒体、定价、入住现实和位置背景是否对高端平台足够严肃。",
          "账户信任姿态是否足够强大，适用于更高风险的挂牌路径。",
          "受管理的挂牌是否真的在请求HenryCo运营，而不仅仅是徽章。",
        ],
      },
      {
        heading: "业主和代理应该期望什么",
        bullets: [
          "直接上传优于粘贴的文档链接，因为工作人员需要可审核的文件记录。",
          "如果挂牌薄弱，HenryCo可能在推进之前要求更好的证明、更强的文案或更清晰的准备细节。",
          "受管理和非受管理的挂牌是不同的路径；批准其中一个不应默默暗示另一个。",
          "如果挂牌被搁置或升级，目标是更清晰的发布真相，而不是官僚主义噪音。",
        ],
      },
    ],
  },
  policy: {
    sectionKicker: "政策说明",
    cards: [
      {
        title: "受管理与非受管理",
        body: "受管理的挂牌意味着接受后HenryCo的运营参与。非受管理的挂牌仍然可以被审核和发布，但业主或代理在首次联系后仍然负责运营现实。",
      },
      {
        title: "重复联系抵抗",
        body: "如果相同的电子邮件或电话出现在多个HenryCo账户或提交中，挂牌可能留在手动审核中，直到所有权情况更清晰。",
      },
      {
        title: "检查和看房连续性",
        body: "HenryCo将检查和看房视为跟踪工作流程。请求、安排和跟进应该对工作人员和账户历史保持可见，而不是消失在聊天中。",
      },
    ],
  },
  nextSteps: {
    kicker: "提交后会发生什么",
    items: [
      "提交者首先看到私人挂牌记录，而不是即时发布。",
      "HenryCo审查证据、信任姿态，以及挂牌是否属于受管理、非受管理或检查敏感轨道。",
      "如果需要更多信息，挂牌可以进入更正、文件搁置、资格搁置或升级，然后再发布。",
      "只有在这些检查一致之后，挂牌才应该向批准和公开发布推进。",
    ],
  },
};

const HI: Partial<PropertyTrustCopy> = {
  meta: {
    title: "विश्वास मानक | HenryCo Property",
    description:
      "HenryCo Property कैसे लिस्टिंग सबमिशन, दस्तावेज़, निरीक्षण, प्रबंधित संचालन और प्रकाशन सुरक्षा को नियंत्रित करती है।",
  },
  page: {
    kicker: "विश्वास",
    title: "सार्वजनिक होने से पहले नियंत्रित।",
    description:
      "दस्तावेज़ पथ-विशिष्ट हैं, निरीक्षण वास्तविक वर्कफ़्लो हैं, और प्रबंधित बनाम गैर-प्रबंधित प्रकाशन को मिलाया नहीं जाता। शांत, लेकिन गंभीर।",
  },
  trustRails: {
    sectionKicker: "मुख्य विश्वास रेल",
    items: [
      {
        title: "सार्वजनिक साइट खुला डंप नहीं है",
        body:
          "कोई लिस्टिंग सिर्फ इसलिए सार्वजनिक नहीं होती कि किसी ने फ़ॉर्म भरा। HenryCo पहले हर सबमिशन को निजी रखती है, फिर तय करती है कि दस्तावेज़, अधिकार, पहचान और संपत्ति की वास्तविकता सार्वजनिक रिलीज़ के लिए पर्याप्त मजबूत है या नहीं।",
      },
      {
        title: "दस्तावेज़ लिस्टिंग पथ पर निर्भर हैं",
        body:
          "मालिक-सूचीबद्ध, एजेंट-नेतृत्व, प्रबंधित, वाणिज्यिक, भूमि और निरीक्षण-संवेदनशील सबमिशन एक ही साक्ष्य बोझ नहीं उठाते। HenryCo उन दस्तावेज़ों के लिए पूछती है जो वास्तव में पथ समझाते हैं।",
      },
      {
        title: "निरीक्षण परिचालनात्मक है, सजावटी नहीं",
        body:
          "यदि किसी लिस्टिंग को निरीक्षण की आवश्यकता है, तो यह एक ट्रैक किए गए वर्कफ़्लो बन जाता है। इसे अनुरोध किया जा सकता है, निर्धारित किया जा सकता है, पूर्ण किया जा सकता है, माफ किया जा सकता है, विफल या रद्द किया जा सकता है, और प्रकाशन को यह नहीं दिखाना चाहिए कि जांच हो गई जब वह नहीं हुई।",
      },
    ],
  },
  statusGuide: {
    sectionKicker: "लिस्टिंग स्थिति का अर्थ",
    items: [
      {
        title: "दस्तावेज़ों की प्रतीक्षा",
        body:
          "HenryCo को अभी भी मजबूत अधिकार, स्वामित्व, प्रबंधन या सहायक साक्ष्य की आवश्यकता है इससे पहले कि लिस्टिंग समीक्षा में गहरे जा सके।",
      },
      {
        title: "पात्रता की प्रतीक्षा",
        body:
          "पहचान, डुप्लिकेट-संपर्क समीक्षा, या कोई अन्य विश्वास पूर्वापेक्षा अभी भी अनसुलझी है। लिस्टिंग को तब तक निजी रखा जाता है जब तक इसे हल नहीं किया जाता।",
      },
      {
        title: "निरीक्षण अनुरोध किया गया या निर्धारित किया गया",
        body:
          "HenryCo ने तय किया है कि इस लिस्टिंग पथ के लिए साइट जांच महत्वपूर्ण है। निरीक्षण रेल ठीक से बंद होने तक लिस्टिंग को पूरी तरह से विश्वसनीय नहीं माना जाता।",
      },
      {
        title: "समीक्षाधीन, स्वीकृत या प्रकाशित",
        body:
          "एक बार विश्वास द्वार संतुष्ट होने के बाद, लिस्टिंग संपादकीय समीक्षा, अनुमोदन और फिर सार्वजनिक दृश्यता में जा सकती है यदि शेष गुणवत्ता जांच पास हो जाती है।",
      },
    ],
  },
  expectations: {
    sectionKicker: "द्विपक्षीय अपेक्षाएं",
    columns: [
      {
        heading: "HenryCo क्या जांचती है",
        bullets: [
          "क्या सबमिटर संपत्ति के लिए मार्केटिंग, प्रबंधन या निरीक्षण अनुरोध करने के लिए अधिकृत प्रतीत होता है।",
          "क्या मीडिया, मूल्य निर्धारण, अधिभोग वास्तविकता और स्थान संदर्भ एक प्रीमियम प्लेटफ़ॉर्म के लिए पर्याप्त गंभीर है।",
          "क्या खाता विश्वास मुद्रा उच्च-जोखिम लिस्टिंग पथों के लिए पर्याप्त मजबूत है।",
          "क्या एक प्रबंधित लिस्टिंग वास्तव में HenryCo संचालन मांग रही है, न कि केवल एक बैज।",
        ],
      },
      {
        heading: "मालिक और एजेंट क्या उम्मीद करें",
        bullets: [
          "प्रत्यक्ष अपलोड चिपकाए गए दस्तावेज़ लिंक से बेहतर हैं क्योंकि कर्मचारियों को समीक्षा योग्य फ़ाइल ट्रेल की आवश्यकता होती है।",
          "यदि कोई लिस्टिंग कमजोर है, तो HenryCo बेहतर प्रमाण, मजबूत कॉपी या आगे बढ़ने से पहले स्पष्ट तत्परता विवरण मांग सकती है।",
          "प्रबंधित और गैर-प्रबंधित लिस्टिंग अलग-अलग पथ हैं; एक की स्वीकृति चुपचाप दूसरे को नहीं समझना चाहिए।",
          "यदि कोई लिस्टिंग रोकी जाती है या बढ़ाई जाती है, तो लक्ष्य स्वच्छ प्रकाशन सत्य है, नौकरशाही शोर नहीं।",
        ],
      },
    ],
  },
  policy: {
    sectionKicker: "नीति स्पष्टीकरण",
    cards: [
      {
        title: "प्रबंधित बनाम गैर-प्रबंधित",
        body:
          "प्रबंधित लिस्टिंग स्वीकृति के बाद HenryCo की परिचालन भागीदारी का संकेत देती है। गैर-प्रबंधित लिस्टिंग अभी भी समीक्षा और प्रकाशित की जा सकती है, लेकिन मालिक या एजेंट पहले संपर्क के बाद परिचालन वास्तविकता के लिए जिम्मेदार रहता है।",
      },
      {
        title: "डुप्लिकेट-संपर्क प्रतिरोध",
        body:
          "यदि एक ही ईमेल या फ़ोन कई HenryCo खातों या सबमिशन में दिखाई देता है, तो लिस्टिंग मैन्युअल समीक्षा में तब तक रह सकती है जब तक स्वामित्व की तस्वीर स्पष्ट न हो।",
      },
      {
        title: "निरीक्षण और देखने की निरंतरता",
        body:
          "HenryCo निरीक्षण और दर्शन को ट्रैक किए गए वर्कफ़्लो के रूप में मानती है। अनुरोध, कार्यक्रम और अनुवर्ती कार्रवाई कर्मचारियों और खाता इतिहास के लिए दृश्यमान रहनी चाहिए बजाय चैट में गायब होने के।",
      },
    ],
  },
  nextSteps: {
    kicker: "सबमिशन के बाद क्या होता है",
    items: [
      "सबमिटर्स पहले एक निजी लिस्टिंग रिकॉर्ड देखते हैं, तत्काल प्रकाशन नहीं।",
      "HenryCo साक्ष्य, विश्वास मुद्रा की समीक्षा करती है, और चाहे लिस्टिंग प्रबंधित, गैर-प्रबंधित या निरीक्षण-संवेदनशील रेल पर हो।",
      "यदि अधिक जानकारी की आवश्यकता है, तो लिस्टिंग प्रकाशन से पहले सुधार, दस्तावेज़ होल्ड, पात्रता होल्ड या एस्केलेशन में जा सकती है।",
      "केवल उन जांचों के सुसंगत होने के बाद लिस्टिंग को अनुमोदन और सार्वजनिक रिलीज़ की ओर जाना चाहिए।",
    ],
  },
};

const IG: Partial<PropertyTrustCopy> = {
  meta: {
    title: "Ọkọlọtọ Ntụkwasị Obi | HenryCo Property",
    description:
      "Otu HenryCo Property si achịkwa nbugo ngosi, akwụkwọ, nyocha, ọrụ nlekọta, na nchedo nke mbipụta.",
  },
  page: {
    kicker: "Ntụkwasị Obi",
    title: "Echikwa ya tupu ọ bụrụ ọhaneze.",
    description:
      "Akwụkwọ na-abụkarị maka ụzọ, nyocha bụ ọrụ n'ezie, na mbipụta nlekọta vs. ọbụna nlekọta anaghị agwakọ. Jụụ, ma dị njikere.",
  },
  trustRails: {
    sectionKicker: "Ọkọlọtọ Ntụkwasị Obi Nke Mbụ",
    items: [
      {
        title: "Saịtị ọhaneze abụghị ebe ntụpọ mepere emepe",
        body:
          "Ngosi anaghị aga n'ọha naanị n'ihi na onye dere fomu. HenryCo na-echekwa nbugo ọ bụla n'iziizi tupu, wee jụọ ma akwụkwọ, ike, njirimara, na eziokwu ụlọ adị ike nke ọma maka mbipụta n'ọha.",
      },
      {
        title: "Akwụkwọ na-adabere na ụzọ ngosi",
        body:
          "Nbugo site n'aka onye nwe, onye nnọchiteanya anya, nlekọta, azụmahịa, ala, na nke dị mma maka nyocha anaghị ebute ihe akaebe otu. HenryCo na-arịọ akwụkwọ ndị na-akọwa ụzọ n'iziizi.",
      },
      {
        title: "Nyocha bụ ọrụ, ọbụghị ihe maka ịdọ anya",
        body:
          "Ọ bụrụ na ngosi chọrọ nyocha, ọ na-aghọ ọrụ a na-aso śle. Enwere ike ịrịọ ya, ịhazi ya, ịzụ ya, ichepụ ya, ya ọ daa ma ọ bụ kagbuo ya, na mbipụta ekwesịghị ime ka o dị ka nyocha gasịrị mgbe ọ gachịghị.",
      },
    ],
  },
  statusGuide: {
    sectionKicker: "Ihe ọnọdụ ngosi pụtara",
    items: [
      {
        title: "Na-atọ akwụkwọ",
        body:
          "HenryCo ka chọrọ ike, nwe ihe, nlekọta, ma ọ bụ ihe akaebe nke ọzọ tupu ngosi nwere ike ịga n'ihu n'inyocha.",
      },
      {
        title: "Na-atọ isi nke ya",
        body:
          "Njirimara, nyocha kọntaktị nke abụọ, ma ọ bụ ihe ndị ọzọ dị mkpa maka ntụkwasị obi ka adịghị ekwu. Ngosi na-echekwa n'iziizi ruo mgbe ọ dochie ya.",
      },
      {
        title: "Nyocha arịọrọ ma ọ bụ haziri ya",
        body:
          "HenryCo ekwuola na ọleghele saịtị dị mkpa maka ụzọ ngosi a. Eneleghị ngosi dị ka ntụkwasị obi zuru oke ruo mgbe ọkọlọtọ nyocha mechiri nke ọma.",
      },
      {
        title: "N'okpuru nyocha, kwadoro, ma ọ bụ ebipụtara",
        body:
          "Ozugbo ọnọdụ ntụkwasị obi jupụtara, ngosi nwere ike ịga n'ihu na nyocha ọkachasị mma, nkwado, wee nọọrọ n'ọha ọ bụrụ na nyocha ndị ọzọ gawụ.",
      },
    ],
  },
  expectations: {
    sectionKicker: "Atụmanya abụọ ọnụ",
    columns: [
      {
        heading: "Ihe HenryCo na-enyocha",
        bullets: [
          "Ma onye nbugo dị ka onye nyere ikike iji na-azụ ahịa, ijikwa, ma ọ bụ ịrịọ nyocha maka ihe onwunwe.",
          "Ma ihe mgbasa ozi, ọnụ ahịa, eziokwu nọọrọ, na ọnọdụ ọdịnaala dị mkpa maka ikpo ọkọ dị elu.",
          "Ma ọnọdụ ntụkwasị obi akaụntụ dị ike nke ọma maka ụzọ ngosi ndị dị ize ndụ.",
          "Ma ngosi nlekọta na-arịọ n'iziizi maka ọrụ HenryCo, ọbụghị naanị akara.",
        ],
      },
      {
        heading: "Ihe ndị nwe ụlọ na ndị nnọchiteanya anya kwesịrị ịtọ atọ",
        bullets: [
          "Nbugopụta ozugbo ka mma karịa njikọ akwụkwọ etinyere n'ihi na ndị ọrụ chọrọ ọkọlọtọ faịlụ enwere ike lele.",
          "Ọ bụrụ na ngosi adịghị ike, HenryCo nwere ike ịrịọ ihe akaebe mma, odee siri ike, ma ọ bụ nkọwa ọdịnaya dị mfe tupu ọ gawụ.",
          "Ngosi ndị a na-alekọta na ndị a na-alekọtaghị bụ ụzọ dị iche; nkwado otu ekwesịghị imeputara nke ọzọ n'iziizi.",
          "Ọ bụrụ na ngosi ewezigara ma ọ bụ ọ sọọ elu, ebumnuche bụ eziokwu mbipụta dị ọcha, ọbụghị ụdachi ọchịchọ.",
        ],
      },
    ],
  },
  policy: {
    sectionKicker: "Nkọwa Iwu",
    cards: [
      {
        title: "Nlekọta vs. ọbụna nlekọta",
        body:
          "Ngosi ndị a na-alekọta na-egosi nnabata HenryCo n'ọrụ mgbe nkwado. Ngosi ndị a na-alekọtaghị nwere ike inyocha ma bipụta, ma onye nwe ma ọ bụ onye nnọchiteanya anya ka nọ n'isi ihe maka eziokwu ọrụ mgbe kọntaktị mbụ gasịrị.",
      },
      {
        title: "Ngbochi kọntaktị abụọ",
        body:
          "Ọ bụrụ na otu ozi-email ma ọ bụ ekwentị pụtara n'ọtụtụ akaụntụ HenryCo ma ọ bụ nbugo, ngosi nwere ike ịnọ n'inyocha aka ruo mgbe ọnọdụ nwe ihe pụtara ìhè.",
      },
      {
        title: "Nọgidere nke nyocha na nlele",
        body:
          "HenryCo na-ele nyocha na nlele anya dị ka ọrụ a na-aso śle. Arịrịọ, ihe oge, na nchịkọta kwesịrị ịnọ n'anya ndị ọrụ na akụkọ akaụntụ kama ọ fụọ n'ụlọ ọkụ.",
      },
    ],
  },
  nextSteps: {
    kicker: "Ihe ga-eme mgbe nbugo gasịrị",
    items: [
      "Ndị na-ebugo na-ahụ ihe ndekọ ngosi nzuzo mbụ, ọbụghị mbipụta ozugbo.",
      "HenryCo na-enyocha ihe akaebe, ọnọdụ ntụkwasị obi, na ma ngosi bụ nke nlekọta, ọbụna nlekọta, ma ọ bụ ọkọlọtọ nyocha.",
      "Ọ bụrụ na o di mkpa ọzọ, ngosi nwere ike ịga na mkpebi, nchekwa akwụkwọ, nchekwa isi nke ya, ma ọ bụ ọsọ elu tupu mbipụta.",
      "Naanị mgbe nyocha ndị ahụ di mma ka ngosi kwesịrị ịgagharị n'aka nkwado na mbipụta n'ọha.",
    ],
  },
};

const YO: Partial<PropertyTrustCopy> = {
  meta: {
    title: "Awọn ipilẹṣẹ igbẹkẹle | HenryCo Property",
    description:
      "Bii HenryCo Property ṣe n ṣakoso awọn ifisilẹ atẹjade, awọn iwe aṣẹ, awọn ayẹwo, awọn iṣẹ ti a ṣakoso, ati aabo itusilẹ.",
  },
  page: {
    kicker: "Igbẹkẹle",
    title: "Ti a ṣakoso ṣaaju ki o to di gbangba.",
    description:
      "Awọn iwe aṣẹ jẹ pato si ipa-ọna, awọn ayẹwo jẹ awọn ṣiṣe iṣẹ gidi, ati itusilẹ ti a ṣakoso vs ti ko ṣakoso ko ni dapọ. Idakẹjẹ, ṣugbọn pataki.",
  },
  trustRails: {
    sectionKicker: "Awọn ọna igbẹkẹle akọkọ",
    items: [
      {
        title: "Aaye gbangba kii ṣe ibi egbin ti o ṣii",
        body:
          "Atẹjade ko ni itusilẹ nitori ẹnikan fọwọsí fọọmu. HenryCo pa gbogbo ifisilẹ lọ ni ikọkọ ni akọkọ, lẹhinna pinnu boya awọn iwe aṣẹ, aṣẹ, idanimọ, ati otitọ ohun-ini lagbara to fun itusilẹ gbangba.",
      },
      {
        title: "Awọn iwe aṣẹ da lori ipa-ọna atẹjade",
        body:
          "Awọn ifisilẹ ti onile, aṣoju, ti a ṣakoso, iṣowo, ilẹ, ati ifura-ayẹwo ko gbe ẹru ẹri kanna. HenryCo beere awọn iwe aṣẹ ti o ṣalaye ipa-ọna gangan.",
      },
      {
        title: "Ayẹwo jẹ iṣẹ, kii ṣe ohun ọṣọ",
        body:
          "Ti atẹjade ba nilo ayẹwo, o di iṣẹ ti a tẹle. O le beere, ṣeto, pari, fi silẹ, kuna, tabi fagile, ati itusilẹ ko yẹ ki o ṣe bi ẹnipe ayẹwo ti pari nigbati ko ti pari.",
      },
    ],
  },
  statusGuide: {
    sectionKicker: "Ohun ti awọn ipo atẹjade tumọ si",
    items: [
      {
        title: "Nduro fun awọn iwe aṣẹ",
        body:
          "HenryCo tun nilo aṣẹ, nini, iṣakoso, tabi ẹri atilẹyin to lagbara ṣaaju ki atẹjade le lọ siwaju si atunyẹwo.",
      },
      {
        title: "Nduro fun ẹtọ",
        body:
          "Idanimọ, atunyẹwo olubasọrọ ẹlẹẹkeji, tabi ipilẹṣẹ igbẹkẹle miiran ko ti yanjú. Atẹjade wa ni ikọkọ titi ti eyi ba ti waye.",
      },
      {
        title: "Ayẹwo ti beere tabi ti ṣeto",
        body:
          "HenryCo ti pinnu pe ayẹwo aaye ṣe pataki fun ipa-ọna atẹjade yii. Atẹjade ko ni a ka si igbẹkẹle patapata titi ti ipa-ọna ayẹwo ba ti pa ni deede.",
      },
      {
        title: "Labẹ atunyẹwo, fọwọsi, tabi ti ṣe itusilẹ",
        body:
          "Ni kete ti awọn ẹnu-bode igbẹkẹle ba pade, atẹjade le lọ sinu atunyẹwo olootu, ifọwọsi, ati lẹhinna iranwo gbangba ti awọn idanwo didara to ku ba kọja.",
      },
    ],
  },
  expectations: {
    sectionKicker: "Awọn ireti ẹgbẹ meji",
    columns: [
      {
        heading: "Ohun ti HenryCo ṣayẹwo",
        bullets: [
          "Boya ẹni ti o fi silẹ dabi ẹni ti a fun ni aṣẹ lati ta, ṣakoso, tabi beere ayẹwo fun ohun-ini.",
          "Boya media, idiyele, otitọ ìdójúkọ, ati akoonu ipo jẹ to ṣe pataki fun iru ẹrọ alayọrin to.",
          "Boya ipo igbẹkẹle akọọlẹ lagbara to fun awọn ipa-ọna atẹjade ewu ti o ga.",
          "Boya atẹjade ti a ṣakoso n beere awọn iṣẹ HenryCo gangan, kii ṣe aami nikan.",
        ],
      },
      {
        heading: "Ohun ti awọn onile ati aṣoju yẹ ki o reti",
        bullets: [
          "Awọn ifisilẹ taara dara ju awọn ọna asopọ iwe aṣẹ ti a fi sọpọ lọ nitori awọn oṣiṣẹ nilo itọpa faili ti o le ṣayẹwo.",
          "Ti atẹjade ba jẹ alailagbara, HenryCo le beere ẹri to dara julọ, ọrọ to lagbara julọ, tabi awọn alaye sese to han julọ ṣaaju ki o to lọ siwaju.",
          "Awọn atẹjade ti a ṣakoso ati ti ko ṣakoso jẹ awọn ipa-ọna oriṣiriṣi; ifọwọsi ọkan ko yẹ ki o tọka si ekeji ni ikọkọ.",
          "Ti atẹjade ba wa ni idaduro tabi ti a gbe soke, idi ni otitọ itusilẹ ti o mọ julọ, kii ṣe ariwo ìjọba.",
        ],
      },
    ],
  },
  policy: {
    sectionKicker: "Awọn alaye eto imulo",
    cards: [
      {
        title: "Ti a ṣakoso vs ti ko ṣakoso",
        body:
          "Awọn atẹjade ti a ṣakoso tumọ si ikopa iṣẹ HenryCo lẹhin gbigba. Awọn atẹjade ti ko ṣakoso tun le ṣayẹwo ati tẹjade, ṣugbọn onile tabi aṣoju jẹ ki o jẹ ẹni to jẹ iduro fun otitọ iṣẹ lẹhin olubasọrọ akọkọ.",
      },
      {
        title: "Atako si olubasọrọ ẹlẹẹkeji",
        body:
          "Ti imeeli kanna tabi foonu ba han kọja awọn akọọlẹ tabi awọn ifisilẹ HenryCo pupọ, atẹjade le wa ni atunyẹwo afọwọṣe titi ti aworan nini ba di alaye diẹ sii.",
      },
      {
        title: "Tẹsiwaju ti awọn ayẹwo ati wiwo",
        body:
          "HenryCo tọju awọn ayẹwo ati awọn wiwo bi awọn iṣẹ ti a tẹle. Awọn ibeere, awọn jadede, ati atẹle yẹ ki o wa ni iran awọn oṣiṣẹ ati itan-akọọlẹ akọọlẹ dipo ki o parẹ sinu ibaraẹnisọrọ.",
      },
    ],
  },
  nextSteps: {
    kicker: "Ohun ti o ṣẹlẹ lẹhin ifisilẹ",
    items: [
      "Awọn ẹni ti o fi silẹ ri igbasilẹ atẹjade ikọkọ ni akọkọ, kii ṣe itusilẹ lẹsẹkẹsẹ.",
      "HenryCo ṣayẹwo ẹri, ipo igbẹkẹle, ati boya atẹjade jẹ ti ipa-ọna ti a ṣakoso, ti ko ṣakoso, tabi ọkan ti o ni ifura-ayẹwo.",
      "Ti alaye diẹ sii ba nilo, atẹjade le lọ si awọn atunṣe, idaduro iwe aṣẹ, idaduro ẹtọ, tabi igbega ṣaaju itusilẹ.",
      "Nikan lẹhin ti awọn idanwo wọnyẹn ba ni ibaramu ni atẹjade yẹ ki o lọ si ifọwọsi ati itusilẹ gbangba.",
    ],
  },
};

const HA: Partial<PropertyTrustCopy> = {
  meta: {
    title: "Ma'aunin amana | HenryCo Property",
    description:
      "Yadda HenryCo Property ke sarrafa gabatarwa na jera kadarori, takaddun shaida, duba-duba, ayyukan gudanarwa, da amincin buga rubutu.",
  },
  page: {
    kicker: "Amana",
    title: "An sarrafa shi kafin ya zama na jama'a.",
    description:
      "Takaddun shaida na musamman ne ga kowannensu, duba-duba ayyuka ne na ainihi, kuma buga rubutu na gudanarwa da wanda ba na gudanarwa ba ba a cakuɗa su tare. Mai natsuwa, amma mai mahimmanci.",
  },
  trustRails: {
    sectionKicker: "Kayan aikin amana na asali",
    items: [
      {
        title: "Gidan yanar sadarwa na jama'a ba buɗaɗɗiyar wurin juji ba ne",
        body:
          "Jera kadarori ba ta zama ta bainar jama'a kawai saboda wani ya cika fom. HenryCo na riƙe kowane gabatarwa a sirri da farko, sannan ta yanke shawara ko takaddun shaida, iko, shaida, da gaskiyar kadar sun isa don sakin jama'a.",
      },
      {
        title: "Takaddun shaida suna dogara ne akan hanyar jera kadarori",
        body:
          "Gabatarwar masu mallakin kadarori, wakilan, masu gudanarwa, kasuwanci, ƙasa, da masu kula da duba-duba ba su ɗauke nauyin shaida ɗaya ba. HenryCo na roƙon takaddun shaida waɗanda a zahiri suna bayyana hanya.",
      },
      {
        title: "Duba-duba na aiki ne, ba na ƙawa ba",
        body:
          "Idan jera kadarori tana buƙatar duba-duba, wannan ya zama aikin da ake bin ta. Ana iya roƙon shi, tsara shi, kammala shi, maye shi, gazawa shi, ko soke shi, kuma buga rubutu bai kamata ya yi kamar an gama binciken lokacin da ba a yi ba.",
      },
    ],
  },
  statusGuide: {
    sectionKicker: "Abin da jihohin jera kadarori ke nufi",
    items: [
      {
        title: "Ana jiran takaddun shaida",
        body:
          "HenryCo tana bukatar iko mai karfi, mallakar kadarori, gudanarwa, ko shaida mai tallafi kafin jera kadarori ta iya ci gaba zuwa cikin binciken.",
      },
      {
        title: "Ana jiran cancanta",
        body:
          "Shaida, sake duba taɗin tuntuɓa biyu, ko wani buƙata na amana bai warware ba. Ana riƙe jera kadarori a sirri har sai wannan ya warware.",
      },
      {
        title: "An roƙi ko tsara duba-duba",
        body:
          "HenryCo ta yanke shawara cewa binciken wurin yana da mahimmanci ga wannan hanyar jera kadarori. Ba a ɗaukar jera kadarori a matsayin ingantacciyar gaba ɗaya har sai hanyar duba-duba ta rufe yadda yakamata.",
      },
      {
        title: "Ƙarƙashin bincike, an yarda, ko an buga rubutu",
        body:
          "Da zarar an cika ƙofofi na amana, jera kadarori za ta iya ci gaba zuwa binciken edita, yarda, sannan kuma bayyanuwar jama'a idan sauran gwajin inganci suka wuce.",
      },
    ],
  },
  expectations: {
    sectionKicker: "Tsammanin bangarori biyu",
    columns: [
      {
        heading: "Abin da HenryCo ke bincika",
        bullets: [
          "Ko wanda ya gabatar yana da izini a fili don tallata, sarrafa, ko roƙon duba-duba na kadarori.",
          "Ko kafofin watsa labarai, tsadar farashi, gaskiyar zama, da yanayin wurin sun isa don dandali na farko.",
          "Ko matsayin amana na asusun ya isa ga hanyoyin jera kadarori masu hadari mafi girma.",
          "Ko jera kadarori ta gudanarwa tana roƙon ayyukan HenryCo a zahiri, ba alamar kawai ba.",
        ],
      },
      {
        heading: "Abin da masu mallakin gida da wakilan ya kamata su tsammani",
        bullets: [
          "Loda kai tsaye ya fi kyau fiye da hanyoyin haɗin takaddun da aka liƙa saboda ma'aikata suna buƙatar sawun fayil ɗin da za'a iya bincika.",
          "Idan jera kadarori tana da raunin, HenryCo na iya roƙon shaidar mafi kyau, rubutu mai ƙarfi, ko cikakkun bayanan shirye-shirye kafin ta ci gaba.",
          "Jera kadarori masu gudanarwa da marasa gudanarwa hanyoyi daban-daban ne; yarda da ɗaya bai kamata ya nuna ɗayan a cikin sirri ba.",
          "Idan jera kadarori ta kasance a tsayawa ko ta tashi, manufar ita ce gaskiyar buga rubutu mai tsabta, ba ƙarfin mulki ba.",
        ],
      },
    ],
  },
  policy: {
    sectionKicker: "Bayani akan manufofi",
    cards: [
      {
        title: "Na gudanarwa da wanda ba na gudanarwa ba",
        body:
          "Jera kadarori masu gudanarwa na nuna shiga ayyukan HenryCo bayan karɓa. Jera kadarori marasa gudanarwa ana iya bincika su kuma a buga su, amma mai mallakin gida ko wakili ya kasance mai alhakin gaskiyar aiki bayan taɗin farko.",
      },
      {
        title: "Tsayin daka ga taɗin biyu",
        body:
          "Idan imel ɗaya ko wayar salula ta bayyana a asusun HenryCo da yawa ko gabatarwa, jera kadarori na iya kasancewa a cikin bincike na hannu har sai hoto na mallakar kadarori ya zama mafi bayyana.",
      },
      {
        title: "Ci gaba da duba-duba da kallo",
        body:
          "HenryCo na kula da duba-duba da kallonni a matsayin ayyukan da ake bin ta. Roƙo, jadawalin, da bi-biye yakamata su kasance a bayyane ga ma'aikata da tarihin asusun maimakon ɓacewa cikin hira.",
      },
    ],
  },
  nextSteps: {
    kicker: "Abin da zai faru bayan gabatarwa",
    items: [
      "Masu gabatarwa suna ganin rikodin jera kadarori mai sirri da farko, ba buga rubutu nan take ba.",
      "HenryCo tana bincika shaida, matsayin amana, da ko jera kadarori ta kasance a hanyar gudanarwa, ba na gudanarwa, ko mai kula da duba-duba.",
      "Idan karin bayani yana da buƙata, jera kadarori na iya tafiya cikin gyara, riƙe takardun shaida, riƙe cancanta, ko hawa kafin a buga rubutu.",
      "Kawai bayan waɗannan gwajin sun zama masu jituwa ne za a iya matsar da jera kadarori zuwa yarda da sakin jama'a.",
    ],
  },
};

const LOCALE_OVERRIDES: Partial<Record<AppLocale, Partial<PropertyTrustCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  ar: AR,
  de: DE,
  it: IT,
  zh: ZH,
  hi: HI,
  ig: IG,
  yo: YO,
  ha: HA,
};

export function getPropertyTrustCopy(locale: AppLocale): PropertyTrustCopy {
  const overrides = LOCALE_OVERRIDES[locale];
  if (overrides) {
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as PropertyTrustCopy;
  }
  return EN;
}
