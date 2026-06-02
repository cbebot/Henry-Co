import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * LogisticsSupportCopy — i18n surface for the public Logistics /support
 * page. Covers metadata, the "one desk · one thread" hero with three CTAs,
 * the direct channels aside (email/phone/hours/operations labels), the
 * "what helps us help you faster" rail (three items), the account-vs-guest
 * comparison rail (two rows), and the closing escalation block with two
 * CTAs.
 *
 * Pattern A typed-copy module: EN baseline is exhaustive; each locale is a
 * DeepPartial that deep-merges over EN so missing keys fall through to EN
 * silently. Mirrors the shape of `logistics-pricing-copy.ts`.
 */
export type LogisticsSupportCopy = {
  metadata: {
    title: string;
    description: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    body: string;
    ctas: {
      openThread: string;
      emailDispatch: string;
      trackFirst: string;
    };
  };
  channels: {
    eyebrow: string;
    emailLabel: string;
    phoneLabel: string;
    hoursLabel: string;
    operationsLabel: string;
  };
  helps: {
    eyebrow: string;
    items: {
      tracking: {
        title: string;
        body: string;
      };
      phone: {
        title: string;
        body: string;
      };
      observed: {
        title: string;
        body: string;
      };
    };
  };
  accountVsGuest: {
    eyebrow: string;
    account: {
      label: string;
      title: string;
      body: string;
    };
    guest: {
      label: string;
      title: string;
      body: string;
    };
  };
  escalation: {
    eyebrow: string;
    title: string;
    body: string;
    ctas: {
      trackShipment: string;
      accountSupport: string;
    };
  };
};

const LOGISTICS_SUPPORT_COPY_EN: LogisticsSupportCopy = {
  metadata: {
    title: "Support | Henry Onyx Logistics",
    description:
      "Contact Henry Onyx Logistics support or continue a conversation from your HenryCo account.",
  },
  hero: {
    eyebrow: "One desk · One thread",
    title: "Logistics support, kept on one thread.",
    body: "Shipment exceptions, billing questions, routing changes — reach the dispatch desk directly. Account holders should open a logistics-tagged thread so history stays in one place.",
    ctas: {
      openThread: "Open a tagged thread",
      emailDispatch: "Email dispatch",
      trackFirst: "Track first",
    },
  },
  channels: {
    eyebrow: "Direct channels",
    emailLabel: "Email",
    phoneLabel: "Phone",
    hoursLabel: "Hours",
    operationsLabel: "Operations",
  },
  helps: {
    eyebrow: "What helps us help you faster",
    items: {
      tracking: {
        title: "Tracking code first",
        body: "Every dispatched shipment carries a code (HCL-XXXXXX). Open with the code and the rest of the context is one lookup away.",
      },
      phone: {
        title: "Sender or recipient phone",
        body: "Used to verify you and authorise the read on the lane — same as the public track page.",
      },
      observed: {
        title: "What you observed",
        body: "Lane, last status you saw, and the outcome you’re asking for. Skip the apology — just the facts.",
      },
    },
  },
  accountVsGuest: {
    eyebrow: "Account vs guest",
    account: {
      label: "Account",
      title: "Threaded history",
      body: "Tickets land in the HenryCo support center with full lane and milestone context. Replies show up the same way emails would, but with the right shipments attached.",
    },
    guest: {
      label: "Guest",
      title: "Email or phone direct",
      body: "Reach dispatch on the channels above. Include the tracking code so we can verify the shipment without asking you to repeat yourself.",
    },
  },
  escalation: {
    eyebrow: "Before you message",
    title: "Most timing questions resolve from the track page.",
    body: "If the milestone you’re looking for is already there, no thread needed. If it isn’t, this page gets you to the right desk fast.",
    ctas: {
      trackShipment: "Track a shipment",
      accountSupport: "Account support center",
    },
  },
};

const LOGISTICS_SUPPORT_COPY_FR: DeepPartial<LogisticsSupportCopy> = {
  metadata: {
    title: "Assistance | Henry Onyx Logistics",
    description:
      "Contactez l’assistance Henry Onyx Logistics ou poursuivez une conversation depuis votre compte HenryCo.",
  },
  hero: {
    eyebrow: "Un bureau · Un fil",
    title: "L’assistance logistique, regroupée sur un seul fil.",
    body: "Exceptions d’expédition, questions de facturation, modifications d’itinéraire — contactez directement le bureau de répartition. Les titulaires de compte doivent ouvrir un fil étiqueté logistique afin que l’historique reste au même endroit.",
    ctas: {
      openThread: "Ouvrir un fil étiqueté",
      emailDispatch: "Envoyer un e-mail à la répartition",
      trackFirst: "Suivre d’abord",
    },
  },
  channels: {
    eyebrow: "Canaux directs",
    emailLabel: "E-mail",
    phoneLabel: "Téléphone",
    hoursLabel: "Horaires",
    operationsLabel: "Opérations",
  },
  helps: {
    eyebrow: "Ce qui nous aide à vous aider plus vite",
    items: {
      tracking: {
        title: "Code de suivi d’abord",
        body: "Chaque expédition envoyée porte un code (HCL-XXXXXX). Commencez par le code, le reste du contexte est à une consultation près.",
      },
      phone: {
        title: "Téléphone expéditeur ou destinataire",
        body: "Sert à vous vérifier et à autoriser la lecture sur la ligne — comme sur la page de suivi publique.",
      },
      observed: {
        title: "Ce que vous avez observé",
        body: "Ligne, dernier statut vu et résultat demandé. Pas d’excuses — seulement les faits.",
      },
    },
  },
  accountVsGuest: {
    eyebrow: "Compte vs invité",
    account: {
      label: "Compte",
      title: "Historique en fil",
      body: "Les tickets arrivent dans le centre d’assistance HenryCo avec tout le contexte de ligne et de jalon. Les réponses apparaissent comme des e-mails, mais avec les bonnes expéditions associées.",
    },
    guest: {
      label: "Invité",
      title: "E-mail ou téléphone direct",
      body: "Contactez la répartition par les canaux ci-dessus. Indiquez le code de suivi afin que nous puissions vérifier l’expédition sans vous faire répéter.",
    },
  },
  escalation: {
    eyebrow: "Avant d’écrire",
    title: "La plupart des questions de délais se résolvent depuis la page de suivi.",
    body: "Si le jalon que vous cherchez y figure déjà, pas besoin de fil. Sinon, cette page vous mène au bon bureau rapidement.",
    ctas: {
      trackShipment: "Suivre une expédition",
      accountSupport: "Centre d’assistance du compte",
    },
  },
};

const LOGISTICS_SUPPORT_COPY_ES: DeepPartial<LogisticsSupportCopy> = {
  metadata: {
    title: "Soporte | Henry Onyx Logistics",
    description:
      "Contacta con el soporte de Henry Onyx Logistics o continúa una conversación desde tu cuenta HenryCo.",
  },
  hero: {
    eyebrow: "Un mostrador · Un hilo",
    title: "Soporte logístico, en un solo hilo.",
    body: "Excepciones de envío, dudas de facturación, cambios de ruta — contacta directamente con la central de despacho. Los titulares de cuenta deben abrir un hilo etiquetado de logística para mantener todo el historial en un mismo lugar.",
    ctas: {
      openThread: "Abrir un hilo etiquetado",
      emailDispatch: "Enviar correo a despacho",
      trackFirst: "Rastrear primero",
    },
  },
  channels: {
    eyebrow: "Canales directos",
    emailLabel: "Correo",
    phoneLabel: "Teléfono",
    hoursLabel: "Horario",
    operationsLabel: "Operaciones",
  },
  helps: {
    eyebrow: "Lo que nos ayuda a ayudarte más rápido",
    items: {
      tracking: {
        title: "Código de rastreo primero",
        body: "Cada envío despachado lleva un código (HCL-XXXXXX). Empieza por el código y el resto del contexto queda a una consulta de distancia.",
      },
      phone: {
        title: "Teléfono del remitente o destinatario",
        body: "Sirve para verificarte y autorizar la lectura de la ruta — igual que en la página pública de seguimiento.",
      },
      observed: {
        title: "Lo que observaste",
        body: "Ruta, último estado que viste y el resultado que pides. Sin disculpas — solo los hechos.",
      },
    },
  },
  accountVsGuest: {
    eyebrow: "Cuenta vs invitado",
    account: {
      label: "Cuenta",
      title: "Historial en hilo",
      body: "Los tickets llegan al centro de soporte de HenryCo con todo el contexto de ruta e hitos. Las respuestas aparecen igual que un correo, pero con los envíos correctos adjuntos.",
    },
    guest: {
      label: "Invitado",
      title: "Correo o teléfono directo",
      body: "Contacta a despacho por los canales de arriba. Incluye el código de rastreo para que podamos verificar el envío sin pedirte que repitas la información.",
    },
  },
  escalation: {
    eyebrow: "Antes de escribir",
    title: "La mayoría de dudas de tiempo se resuelven en la página de seguimiento.",
    body: "Si el hito que buscas ya está ahí, no hace falta abrir hilo. Si no, esta página te lleva al mostrador correcto rápido.",
    ctas: {
      trackShipment: "Rastrear un envío",
      accountSupport: "Centro de soporte de cuenta",
    },
  },
};

const LOGISTICS_SUPPORT_COPY_PT: DeepPartial<LogisticsSupportCopy> = {
  metadata: {
    title: "Suporte | Henry Onyx Logistics",
    description:
      "Contacte o suporte Henry Onyx Logistics ou continue uma conversa a partir da sua conta HenryCo.",
  },
  hero: {
    eyebrow: "Um balcão · Um fio",
    title: "Suporte logístico, mantido num único fio.",
    body: "Exceções de envio, dúvidas de faturamento, alterações de rota — fale diretamente com a central de despacho. Titulares de conta devem abrir um fio etiquetado de logística para manter o histórico no mesmo lugar.",
    ctas: {
      openThread: "Abrir um fio etiquetado",
      emailDispatch: "Enviar e-mail ao despacho",
      trackFirst: "Rastrear primeiro",
    },
  },
  channels: {
    eyebrow: "Canais diretos",
    emailLabel: "E-mail",
    phoneLabel: "Telefone",
    hoursLabel: "Horário",
    operationsLabel: "Operações",
  },
  helps: {
    eyebrow: "O que nos ajuda a ajudar mais rápido",
    items: {
      tracking: {
        title: "Código de rastreio primeiro",
        body: "Cada envio despachado carrega um código (HCL-XXXXXX). Comece pelo código e o restante do contexto fica a uma consulta de distância.",
      },
      phone: {
        title: "Telefone do remetente ou destinatário",
        body: "Serve para verificar você e autorizar a leitura da rota — igual à página pública de rastreio.",
      },
      observed: {
        title: "O que você observou",
        body: "Rota, último status visto e o resultado que pede. Sem desculpas — apenas os fatos.",
      },
    },
  },
  accountVsGuest: {
    eyebrow: "Conta vs convidado",
    account: {
      label: "Conta",
      title: "Histórico em fio",
      body: "Os tickets chegam ao centro de suporte HenryCo com todo o contexto de rota e marcos. As respostas aparecem como e-mails, mas com os envios certos anexados.",
    },
    guest: {
      label: "Convidado",
      title: "E-mail ou telefone direto",
      body: "Fale com o despacho pelos canais acima. Inclua o código de rastreio para verificarmos o envio sem pedir que você repita a informação.",
    },
  },
  escalation: {
    eyebrow: "Antes de escrever",
    title: "A maioria das dúvidas de prazo se resolve pela página de rastreio.",
    body: "Se o marco que você procura já está lá, não precisa abrir fio. Senão, esta página leva você ao balcão certo rapidamente.",
    ctas: {
      trackShipment: "Rastrear um envio",
      accountSupport: "Central de suporte da conta",
    },
  },
};

const LOGISTICS_SUPPORT_COPY_AR: DeepPartial<LogisticsSupportCopy> = {
  metadata: {
    title: "الدعم | Henry Onyx Logistics",
    description:
      "تواصل مع دعم Henry Onyx Logistics أو تابع محادثة من حسابك في HenryCo.",
  },
  hero: {
    eyebrow: "مكتب واحد · محادثة واحدة",
    title: "دعم لوجستي مجمّع في محادثة واحدة.",
    body: "استثناءات الشحن، أسئلة الفوترة، تغييرات المسار — اتصل مباشرةً بمكتب الإرسال. على أصحاب الحسابات فتح محادثة موسومة باللوجست حتّى يبقى السجل في مكان واحد.",
    ctas: {
      openThread: "فتح محادثة موسومة",
      emailDispatch: "راسل الإرسال بالبريد",
      trackFirst: "تتبّع أولاً",
    },
  },
  channels: {
    eyebrow: "قنوات مباشرة",
    emailLabel: "البريد",
    phoneLabel: "الهاتف",
    hoursLabel: "الساعات",
    operationsLabel: "العمليات",
  },
  helps: {
    eyebrow: "ما يساعدنا على مساعدتك أسرع",
    items: {
      tracking: {
        title: "رمز التتبّع أولاً",
        body: "تحمل كل شحنة مرسلة رمزاً (HCL-XXXXXX). ابدأ بالرمز، وباقي السياق على بعد بحث واحد.",
      },
      phone: {
        title: "هاتف المرسل أو المستلم",
        body: "يستخدم للتحقّق منك والسماح بقراءة الخط — تماماً كصفحة التتبّع العامّة.",
      },
      observed: {
        title: "ما لاحظته",
        body: "الخط وآخر حالة رأيتها والنتيجة التي تطلبها. تجاوز الاعتذار — فقط الحقائق.",
      },
    },
  },
  accountVsGuest: {
    eyebrow: "حساب مقابل ضيف",
    account: {
      label: "حساب",
      title: "سجل في محادثة",
      body: "تصل التذاكر إلى مركز دعم HenryCo بسياق كامل للخط والمعالم. تظهر الردود مثل رسائل البريد، ولكن مع إرفاق الشحنات المناسبة.",
    },
    guest: {
      label: "ضيف",
      title: "بريد أو هاتف مباشر",
      body: "تواصل مع الإرسال عبر القنوات أعلاه. أدرج رمز التتبّع حتّى نتمكّن من التحقّق دون أن نطلب منك تكرار المعلومات.",
    },
  },
  escalation: {
    eyebrow: "قبل أن تراسل",
    title: "معظم أسئلة التوقيت تحلّ عبر صفحة التتبّع.",
    body: "إذا كان المعلم الذي تبحث عنه موجوداً هناك، فلا حاجة لفتح محادثة. وإلّا، فهذه الصفحة توصلك إلى المكتب الصحيح بسرعة.",
    ctas: {
      trackShipment: "تتبّع شحنة",
      accountSupport: "مركز دعم الحساب",
    },
  },
};

const LOGISTICS_SUPPORT_COPY_DE: DeepPartial<LogisticsSupportCopy> = {
  metadata: {
    title: "Support | Henry Onyx Logistics",
    description:
      "Kontaktieren Sie den HenryCo-Logistics-Support oder setzen Sie ein Gespräch aus Ihrem HenryCo-Konto fort.",
  },
  hero: {
    eyebrow: "Ein Schalter · Ein Thread",
    title: "Logistik-Support, gebündelt in einem Thread.",
    body: "Versandausnahmen, Abrechnungsfragen, Routenänderungen — erreichen Sie die Dispositionsstelle direkt. Kontoinhaber sollten einen logistikgetaggten Thread öffnen, damit der Verlauf an einem Ort bleibt.",
    ctas: {
      openThread: "Getaggten Thread öffnen",
      emailDispatch: "Disposition per E-Mail",
      trackFirst: "Zuerst verfolgen",
    },
  },
  channels: {
    eyebrow: "Direkte Kanäle",
    emailLabel: "E-Mail",
    phoneLabel: "Telefon",
    hoursLabel: "Öffnungszeiten",
    operationsLabel: "Operations",
  },
  helps: {
    eyebrow: "Was uns hilft, Ihnen schneller zu helfen",
    items: {
      tracking: {
        title: "Zuerst der Tracking-Code",
        body: "Jede versandte Sendung trägt einen Code (HCL-XXXXXX). Starten Sie mit dem Code und der Rest des Kontexts ist nur eine Abfrage entfernt.",
      },
      phone: {
        title: "Telefonnummer von Absender oder Empfänger",
        body: "Dient zur Verifizierung und zur Freigabe des Zugriffs auf die Linie — wie auf der öffentlichen Tracking-Seite.",
      },
      observed: {
        title: "Was Sie beobachtet haben",
        body: "Linie, zuletzt gesehener Status und das gewünschte Ergebnis. Sparen Sie sich die Entschuldigung — nur die Fakten.",
      },
    },
  },
  accountVsGuest: {
    eyebrow: "Konto vs. Gast",
    account: {
      label: "Konto",
      title: "Verlauf im Thread",
      body: "Tickets landen im HenryCo-Supportcenter mit vollständigem Linien- und Meilenstein-Kontext. Antworten erscheinen wie E-Mails, jedoch mit den passenden Sendungen verknüpft.",
    },
    guest: {
      label: "Gast",
      title: "Direkt per E-Mail oder Telefon",
      body: "Erreichen Sie die Disposition über die oben genannten Kanäle. Fügen Sie den Tracking-Code bei, damit wir die Sendung prüfen können, ohne dass Sie sich wiederholen müssen.",
    },
  },
  escalation: {
    eyebrow: "Bevor Sie schreiben",
    title: "Die meisten Zeitfragen klären sich über die Tracking-Seite.",
    body: "Wenn der gesuchte Meilenstein bereits dort steht, ist kein Thread nötig. Falls nicht, bringt Sie diese Seite schnell zum richtigen Schalter.",
    ctas: {
      trackShipment: "Sendung verfolgen",
      accountSupport: "Konto-Supportcenter",
    },
  },
};

const LOGISTICS_SUPPORT_COPY_IT: DeepPartial<LogisticsSupportCopy> = {
  metadata: {
    title: "Assistenza | Henry Onyx Logistics",
    description:
      "Contatta l’assistenza Henry Onyx Logistics o prosegui una conversazione dal tuo account HenryCo.",
  },
  hero: {
    eyebrow: "Uno sportello · Un thread",
    title: "Assistenza logistica, in un solo thread.",
    body: "Eccezioni di spedizione, domande di fatturazione, modifiche di percorso — contatta direttamente la centrale di smistamento. I titolari di account devono aprire un thread con tag logistics, così la cronologia resta nello stesso posto.",
    ctas: {
      openThread: "Apri un thread con tag",
      emailDispatch: "Scrivi allo smistamento",
      trackFirst: "Traccia prima",
    },
  },
  channels: {
    eyebrow: "Canali diretti",
    emailLabel: "E-mail",
    phoneLabel: "Telefono",
    hoursLabel: "Orari",
    operationsLabel: "Operazioni",
  },
  helps: {
    eyebrow: "Cosa ci aiuta ad aiutarti più velocemente",
    items: {
      tracking: {
        title: "Prima il codice di tracciamento",
        body: "Ogni spedizione inviata porta un codice (HCL-XXXXXX). Inizia dal codice e il resto del contesto è a una ricerca di distanza.",
      },
      phone: {
        title: "Telefono del mittente o destinatario",
        body: "Serve a verificarti e ad autorizzare la lettura della tratta — come nella pagina pubblica di tracciamento.",
      },
      observed: {
        title: "Cosa hai osservato",
        body: "Tratta, ultimo stato visto e l’esito che chiedi. Niente scuse — solo i fatti.",
      },
    },
  },
  accountVsGuest: {
    eyebrow: "Account vs ospite",
    account: {
      label: "Account",
      title: "Cronologia in thread",
      body: "I ticket arrivano al centro assistenza HenryCo con tutto il contesto della tratta e delle milestone. Le risposte appaiono come e-mail, ma con le spedizioni corrette allegate.",
    },
    guest: {
      label: "Ospite",
      title: "E-mail o telefono diretto",
      body: "Contatta lo smistamento dai canali sopra. Includi il codice di tracciamento per verificare la spedizione senza chiederti di ripetere.",
    },
  },
  escalation: {
    eyebrow: "Prima di scrivere",
    title: "La maggior parte dei dubbi sui tempi si risolve dalla pagina di tracciamento.",
    body: "Se la milestone che cerchi è già lì, nessun thread necessario. Altrimenti, questa pagina ti porta rapidamente allo sportello giusto.",
    ctas: {
      trackShipment: "Traccia una spedizione",
      accountSupport: "Centro assistenza account",
    },
  },
};

const LOGISTICS_SUPPORT_COPY_ZH: DeepPartial<LogisticsSupportCopy> = {
  metadata: {
    title: "支持 | Henry Onyx Logistics",
    description: "联系 Henry Onyx Logistics 支持，或从您的 HenryCo 账户继续一条会话。",
  },
  hero: {
    eyebrow: "一个档口 · 一条会话",
    title: "物流支持，汇入一条会话。",
    body: "发货异常、账单问题、路由调整 — 直接联系调度台。账户持有者请创建一个标记为物流的会话，以便历史记录保持在同一位置。",
    ctas: {
      openThread: "打开标记的会话",
      emailDispatch: "邮件联系调度",
      trackFirst: "先查询物流",
    },
  },
  channels: {
    eyebrow: "直达渠道",
    emailLabel: "电子邮件",
    phoneLabel: "电话",
    hoursLabel: "服务时间",
    operationsLabel: "运营",
  },
  helps: {
    eyebrow: "什么能帮我们更快帮助您",
    items: {
      tracking: {
        title: "先提供跟踪代码",
        body: "每个发出的货件都携带一个代码（HCL-XXXXXX）。以代码开始，其余上下文只需一次查询。",
      },
      phone: {
        title: "发货人或收货人电话",
        body: "用于验证您的身份并授权路线查看 — 与公开追踪页面相同。",
      },
      observed: {
        title: "您观察到的情况",
        body: "路线、看到的最后状态，以及您期望的结果。不需道歉 — 只需事实。",
      },
    },
  },
  accountVsGuest: {
    eyebrow: "账户与访客",
    account: {
      label: "账户",
      title: "会话式历史",
      body: "工单将附带完整的路线与里程碑上下文送达 HenryCo 支持中心。回复以邮件的方式出现，但会附上正确的货件。",
    },
    guest: {
      label: "访客",
      title: "直接邮件或电话",
      body: "通过上述渠道联系调度。附上跟踪代码，以便我们无需让您重复信息即可验证货件。",
    },
  },
  escalation: {
    eyebrow: "发送信息之前",
    title: "大多数时间问题可从追踪页面解决。",
    body: "如果您要查看的里程碑已经在那里，则无需创建会话。如果不在，这个页面会带您迅速找到正确的档口。",
    ctas: {
      trackShipment: "追踪货件",
      accountSupport: "账户支持中心",
    },
  },
};

const LOGISTICS_SUPPORT_COPY_HI: DeepPartial<LogisticsSupportCopy> = {
  metadata: {
    title: "सहायता | Henry Onyx Logistics",
    description:
      "Henry Onyx Logistics सहायता से संपर्क करें या अपने HenryCo खाते से बातचीत जारी रखें।",
  },
  hero: {
    eyebrow: "एक डेस्क · एक थ्रेड",
    title: "लॉजिस्टिक्स सहायता, एक थ्रेड पर रखी गई।",
    body: "शिपमेंट अपवाद, बिलिंग प्रश्न, रूटिंग परिवर्तन — सीधे डिस्पैच डेस्क से संपर्क करें। खाताधारकों को लॉजिस्टिक्स-टैग किया हुआ थ्रेड खोलना चाहिए ताकि इतिहास एक ही जगह रहे।",
    ctas: {
      openThread: "टैग किया थ्रेड खोलें",
      emailDispatch: "डिस्पैच को ईमेल करें",
      trackFirst: "पहले ट्रैक करें",
    },
  },
  channels: {
    eyebrow: "सीधे चैनल",
    emailLabel: "ईमेल",
    phoneLabel: "फ़ोन",
    hoursLabel: "समय",
    operationsLabel: "ऑपरेशंस",
  },
  helps: {
    eyebrow: "क्या हमें आपकी तेज़ मदद करने में सहायक होता है",
    items: {
      tracking: {
        title: "पहले ट्रैकिंग कोड",
        body: "हर भेजी गई खेप एक कोड (HCL-XXXXXX) ले कर चलती है। कोड से शुरुआत करें, बाकी संदर्भ एक खोज दूर रहता है।",
      },
      phone: {
        title: "प्रेषक या प्राप्तकर्ता का फ़ोन",
        body: "आपको प्रमाणित करने और रूट की पढ़ने की अनुमति प्रदान करने के लिए उपयोग किया जाता है — जैसे सार्वजनिक ट्रैक पेज में।",
      },
      observed: {
        title: "आपने जो देखा",
        body: "लेन, अंतिम स्थिति जो आपने देखी, और जिस परिणाम की आप मांग कर रहे हैं। माफ़ी छोड़ें — केवल तथ्य।",
      },
    },
  },
  accountVsGuest: {
    eyebrow: "खाता बनाम अतिथि",
    account: {
      label: "खाता",
      title: "थ्रेड इतिहास",
      body: "टिकट HenryCo सहायता केंद्र में पूर्ण लेन और मीलपत्थर संदर्भ के साथ पहुंचते हैं। उत्तर ईमेल जैसे दिखाई देते हैं, लेकिन सही शिपमेंट संलग्न होते हैं।",
    },
    guest: {
      label: "अतिथि",
      title: "सीधे ईमेल या फ़ोन",
      body: "ऊपर दिए गए चैनलों से डिस्पैच से संपर्क करें। ट्रैकिंग कोड शामिल करें ताकि हम आपको बार-बार दोहराए बिना शिपमेंट का सत्यापन कर सकें।",
    },
  },
  escalation: {
    eyebrow: "संदेश भेजने से पहले",
    title: "ज्यादातर समयन संबंधी प्रश्न ट्रैक पेज से हल हो जाते हैं।",
    body: "यदि आप जिस मीलपत्थर की तलाश कर रहे हैं वह पहले से वहां है, तो थ्रेड की जरूरत नहीं। यदि नहीं, तो यह पेज आपको सही डेस्क तक जल्दी पहुंचाएगा।",
    ctas: {
      trackShipment: "एक शिपमेंट ट्रैक करें",
      accountSupport: "खाता सहायता केंद्र",
    },
  },
};

const LOGISTICS_SUPPORT_COPY_IG: DeepPartial<LogisticsSupportCopy> = {
  metadata: {
    title: "Nkwado | Henry Onyx Logistics",
    description:
      "Kpọtụrụ nkwado Henry Onyx Logistics ma ọ bụ gaa n’ihu na mkparịta ụka sitere n’akaụntụ HenryCo gị.",
  },
  hero: {
    eyebrow: "Otu ebe · Otu mkparịta ụka",
    title: "Nkwado logistics, edebere n’otu mkparịta ụka.",
    body: "Ihe iwepu mbupu, ajụjụ ụgwọ, mgbanwe ụzọ — kpọtụrụ ụlọ ọrụ nzipu ozugbo. Ndị nwere akaụntụ kwesịrị imepe mkparịta ụka akara logistics ka akụkọ ihe mere eme nọrọ n’otu ebe.",
    ctas: {
      openThread: "Mepee mkparịta ụka akara",
      emailDispatch: "Zigara nzipu email",
      trackFirst: "Soro buru ụzọ",
    },
  },
  channels: {
    eyebrow: "Ụzọ nzikọrịta ozi",
    emailLabel: "Email",
    phoneLabel: "Ekwentị",
    hoursLabel: "Awa",
    operationsLabel: "Ọrụ",
  },
  helps: {
    eyebrow: "Ihe na-enyere anyị aka inyere gị aka ngwa ngwa",
    items: {
      tracking: {
        title: "Koodu nsochi buru ụzọ",
        body: "Mbupu ọ bụla zigara na-eburu koodu (HCL-XXXXXX). Jiri koodu malite, ihe ndị ọzọ niile dị otu ọmụma ụzọ.",
      },
      phone: {
        title: "Ekwentị onye nzipu ma ọ bụ onye nnata",
        body: "A na-eji ya nyochaa gị ma kwado ọgụgụ na ụzọ ahụ — dị ka peeji nsochi ọha.",
      },
      observed: {
        title: "Ihe ị hụrụ",
        body: "Ụzọ, ọnọdụ ikpeazụ ị hụrụ, na nsonaazụ ị na-arịọ. Wepụ mgbaghara — naanị eziokwu.",
      },
    },
  },
  accountVsGuest: {
    eyebrow: "Akaụntụ vs ọbịa",
    account: {
      label: "Akaụntụ",
      title: "Akụkọ mkparịta ụka",
      body: "Tiketi na-erute ebe nkwado HenryCo nwere ihe ọmụma zuru oke gbasara ụzọ na nke ngalaba. Aza na-apụta dị ka email, mana ya na mbupu ndị kwesịrị ekwesị etinyere.",
    },
    guest: {
      label: "Ọbịa",
      title: "Email ma ọ bụ ekwentị ozugbo",
      body: "Kpọtụrụ nzipu site n’ụzọ ndị dị n’elu. Tinye koodu nsochi ka anyị nweekwa ike ịnyochaa mbupu n’ajụghị gị ka ị maa atụ ọzọ.",
    },
  },
  escalation: {
    eyebrow: "Tupu ị degara ozi",
    title: "Ọtụtụ ajụjụ gbasara oge na-edozi site na peeji nsochi.",
    body: "Ọ bụrụ na ngalaba ị na-achọ adịlarị ebe ahụ, ọ dịghị mkpa imepe mkparịta ụka. Ma ọ bụrụ na ọ dịghị, peeji a na-eweta gị n’oke ebe ziri ezi ngwa ngwa.",
    ctas: {
      trackShipment: "Soro mbupu",
      accountSupport: "Ebe nkwado akaụntụ",
    },
  },
};

const LOGISTICS_SUPPORT_COPY_YO: DeepPartial<LogisticsSupportCopy> = {
  metadata: {
    title: "Ìrànlọ́wọ́ | Henry Onyx Logistics",
    description:
      "Kàn sí ìrànlọ́wọ́ Henry Onyx Logistics tàbí tẹ̀síwájú ìjíròrò láti àkáǹtì HenryCo rẹ.",
  },
  hero: {
    eyebrow: "Tábìlì kan · Ìjíròrò kan",
    title: "Ìrànlọ́wọ́ logistics, tí a fi sí ìjíròrò kan.",
    body: "Ìṣòro fífiránṣẹ́, ìbéèrè owó, àyípadà ọ̀nà — kàn sí tábìlì ìfiránṣẹ́ tààrà. Àwọn olùlò àkáǹtì gbọ́dọ̀ ṣí ìjíròrò tí a ti samì logistics kí ìtàn lè dúró ní ibìkan.",
    ctas: {
      openThread: "Ṣí ìjíròrò samì",
      emailDispatch: "Fi ímeèlì ránṣẹ́ sí ìfiránṣẹ́",
      trackFirst: "Tọpa ní àkọ́kọ́",
    },
  },
  channels: {
    eyebrow: "Àwọn ọ̀nà tààrà",
    emailLabel: "Ímeèlì",
    phoneLabel: "Fóònù",
    hoursLabel: "Wákàtí",
    operationsLabel: "Iṣẹ́",
  },
  helps: {
    eyebrow: "Ohun tó ń ràn wá lọ́wọ́ láti ràn ọ́ lọ́wọ́ kíákíá",
    items: {
      tracking: {
        title: "Kóòdù ìtọpa ní àkọ́kọ́",
        body: "Gbogbo ọjà tí a fi ránṣẹ́ ní kóòdù (HCL-XXXXXX). Bẹ̀rẹ̀ pẹ̀lú kóòdù, àwọn ìyókù wà ní àyẹ̀wò kan.",
      },
      phone: {
        title: "Fóònù olùránṣẹ́ tàbí olùgbàwọ̀le",
        body: "A ń lò ó láti ṣàyẹ̀wò rẹ àti láti gba ìwé ìfàyègbà lórí ọ̀nà náà — gẹ́gẹ́ bí ojú-ìwé ìtọpa àwùjọ.",
      },
      observed: {
        title: "Ohun tí ó rí",
        body: "Ọ̀nà, ipò tó kẹ́yìn tí o rí, àti ohun tí o ń béèrè. Má fi àforíjì sí i — òtítọ́ nìkan.",
      },
    },
  },
  accountVsGuest: {
    eyebrow: "Àkáǹtì vs àlejò",
    account: {
      label: "Àkáǹtì",
      title: "Ìtàn nínú ìjíròrò",
      body: "Àwọn tikẹ́tì máa wọnú àárín ìrànlọ́wọ́ HenryCo pẹ̀lú gbogbo ọ̀rọ̀ ọ̀nà àti àmì ìṣẹ̀lẹ̀. Àwọn ìdáhùn máa hàn bí ímeèlì, ṣùgbọ́n pẹ̀lú àwọn ọjà tó tọ́ tó ti so mọ́.",
    },
    guest: {
      label: "Àlejò",
      title: "Ímeèlì tàbí fóònù tààrà",
      body: "Kàn sí ìfiránṣẹ́ láti àwọn ọ̀nà lókè. Fi kóòdù ìtọpa kún kí a lè ṣàyẹ̀wò ọjà náà láìbéèrè kí o tún sọ àwọn ọ̀rọ̀ rẹ.",
    },
  },
  escalation: {
    eyebrow: "Kí o tó kọ́",
    title: "Ọ̀pọ̀ ìbéèrè nípa àkókò ń yanjú láti ojú-ìwé ìtọpa.",
    body: "Tí àmì ìṣẹ̀lẹ̀ tí o ń wá ti wà níbẹ̀, kò sí ìdí láti ṣí ìjíròrò. Bí kò bá sí, ojú-ìwé yìí máa mú ọ dé tábìlì tó tọ́ kíákíá.",
    ctas: {
      trackShipment: "Tọpa ọjà",
      accountSupport: "Àárín ìrànlọ́wọ́ àkáǹtì",
    },
  },
};

const LOGISTICS_SUPPORT_COPY_HA: DeepPartial<LogisticsSupportCopy> = {
  metadata: {
    title: "Taimako | Henry Onyx Logistics",
    description:
      "Tuntuɓi taimakon Henry Onyx Logistics ko ci gaba da tattaunawa daga asusunka na HenryCo.",
  },
  hero: {
    eyebrow: "Teburi ɗaya · Tattaunawa ɗaya",
    title: "Taimakon logistics, an haɗa shi cikin tattaunawa ɗaya.",
    body: "Banbance-banbancen aikawa, tambayoyin biyan kuɗi, canjin hanya — tuntuɓi sashen aikawa kai tsaye. Masu asusu su buɗe tattaunawar mai alamar logistics don tarihi ya kasance a wuri ɗaya.",
    ctas: {
      openThread: "Buɗe tattaunawa mai alama",
      emailDispatch: "Aika imel zuwa aikawa",
      trackFirst: "Bi sawu da farko",
    },
  },
  channels: {
    eyebrow: "Hanyoyin kai tsaye",
    emailLabel: "Imel",
    phoneLabel: "Waya",
    hoursLabel: "Lokuta",
    operationsLabel: "Ayyuka",
  },
  helps: {
    eyebrow: "Abin da ke taimaka mana taimaka maka da sauri",
    items: {
      tracking: {
        title: "Lambar bibiya da farko",
        body: "Kowace kayan da aka aika tana ɗauke da lamba (HCL-XXXXXX). Fara da lambar, sauran bayanan suna a binciken da ɗaya.",
      },
      phone: {
        title: "Wayar mai aikawa ko mai karɓa",
        body: "Ana amfani da ita don tabbatar da kai da ba da izinin karanta hanyar — kamar shafin bibiya na jama'a.",
      },
      observed: {
        title: "Abin da ka lura",
        body: "Hanya, matsayin ƙarshe da ka gani, da sakamakon da kake nema. Bar uzuri — gaskiya kawai.",
      },
    },
  },
  accountVsGuest: {
    eyebrow: "Asusu vs baƙo",
    account: {
      label: "Asusu",
      title: "Tarihi a tattaunawa",
      body: "Tikiti na zuwa cibiyar taimakon HenryCo tare da cikakken bayanin hanya da matakai. Amsoshi suna bayyana kamar imel, amma tare da abubuwan aikawa daidai.",
    },
    guest: {
      label: "Baƙo",
      title: "Imel ko waya kai tsaye",
      body: "Tuntuɓi aikawa ta hanyoyin da ke sama. Haɗa lambar bibiya don mu tabbatar da aikawa ba tare da neman ka maimaita ba.",
    },
  },
  escalation: {
    eyebrow: "Kafin ka aika saƙo",
    title: "Yawancin tambayoyin lokaci suna warware daga shafin bibiya.",
    body: "Idan matakin da kake nema yana nan, babu buƙatar tattaunawa. Idan ba haka ba, wannan shafin yana kai ka zuwa teburin da ya dace cikin sauri.",
    ctas: {
      trackShipment: "Bi sawun aikawa",
      accountSupport: "Cibiyar taimakon asusu",
    },
  },
};

const LOGISTICS_SUPPORT_LOCALE_MAP: Partial<
  Record<AppLocale, DeepPartial<LogisticsSupportCopy>>
> = {
  fr: LOGISTICS_SUPPORT_COPY_FR,
  es: LOGISTICS_SUPPORT_COPY_ES,
  pt: LOGISTICS_SUPPORT_COPY_PT,
  ar: LOGISTICS_SUPPORT_COPY_AR,
  de: LOGISTICS_SUPPORT_COPY_DE,
  it: LOGISTICS_SUPPORT_COPY_IT,
  zh: LOGISTICS_SUPPORT_COPY_ZH,
  hi: LOGISTICS_SUPPORT_COPY_HI,
  ig: LOGISTICS_SUPPORT_COPY_IG,
  yo: LOGISTICS_SUPPORT_COPY_YO,
  ha: LOGISTICS_SUPPORT_COPY_HA,
};

export function getLogisticsSupportCopy(locale: AppLocale): LogisticsSupportCopy {
  const overrides = LOGISTICS_SUPPORT_LOCALE_MAP[locale];
  if (overrides) {
    return deepMergeMessages(
      LOGISTICS_SUPPORT_COPY_EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as LogisticsSupportCopy;
  }
  return LOGISTICS_SUPPORT_COPY_EN;
}

/** @internal */
export function __dangerouslyGetEnglishLogisticsSupportCopy(): LogisticsSupportCopy {
  return LOGISTICS_SUPPORT_COPY_EN;
}
