// HenryCo Account Email Templates
// All templates return plain HTML strings for Resend

import type { AppLocale } from "@henryco/i18n";
import { BRAND_EMAILS, henrySubdomain } from "@henryco/config";
import {
  HENRYCO_EMAIL_TOKENS,
  renderHenryCoEmailFooter,
  renderHenryCoEmailHeader,
} from "@henryco/email";

// V3-07(S2): env-aware account origin so preview/staging emails point at the
// matching base domain rather than always-production `henrycogroup.com`.
const ACCOUNT_ORIGIN = henrySubdomain("account");

const BRAND_COLOR = "#C9A227";
const BG_COLOR = "#FAFAF8";
const DARK_TEXT = "#1A1814";
const MUTED_TEXT = "#6B6560";

function getNumberLocale(locale: AppLocale) {
  if (locale === "fr") return "fr-FR";
  if (locale === "es") return "es-ES";
  if (locale === "pt") return "pt-PT";
  if (locale === "ar") return "ar-EG";
  if (locale === "de") return "de-DE";
  if (locale === "it") return "it-IT";
  return "en-NG";
}

function formatNaira(value: number, locale: AppLocale) {
  return value.toLocaleString(getNumberLocale(locale));
}

function getEmailCopy(locale: AppLocale) {
  if (locale === "fr") {
    return {
      footerManage: "Gerer le compte",
      footerReason: "Vous recevez ceci parce que vous avez un compte HenryCo.",
      welcomeSubject: "Bienvenue chez HenryCo",
      welcomeTitle: (name: string) => `Bienvenue chez Henry & Co., ${name || "vous"} !`,
      welcomeIntro: "Votre compte HenryCo unifie est pret. Depuis ici, vous pouvez tout gerer sur Care, Marketplace, Studio et les autres services.",
      welcomeListIntro: "Voici ce que vous pouvez faire :",
      welcomeList: [
        "Approvisionner votre portefeuille HenryCo pour des paiements rapides",
        "Suivre les commandes, reservations et projets",
        "Gerer vos adresses et moyens de paiement",
        "Obtenir un support unifie sur tous les services",
      ],
      welcomeButton: "Ouvrir votre tableau de bord",
      securitySubject: (event: string) => `Alerte securite : ${event}`,
      securityTitle: "Alerte securite",
      securityIntro: "Nous avons detecte un evenement de securite sur votre compte HenryCo :",
      securityEvent: "Evenement",
      securityAction: "Si ce n'etait pas vous, changez votre mot de passe immediatement et contactez le support.",
      securityButton: "Verifier la securite",
      walletSubject: (amount: number) => `NGN ${formatNaira(amount, locale)} ajoutes a votre portefeuille`,
      walletTitle: "Portefeuille approvisionne",
      walletIntro: (name: string) => `Bonjour ${name || "vous"}, des fonds ont ete ajoutes a votre portefeuille HenryCo.`,
      walletAmount: "Montant ajoute",
      walletBalance: "Nouveau solde",
      walletButton: "Voir le portefeuille",
    };
  }

  if (locale === "es") {
    return {
      footerManage: "Gestionar cuenta",
      footerReason: "Recibes esto porque tienes una cuenta con HenryCo.",
      welcomeSubject: "Bienvenido a HenryCo",
      welcomeTitle: (name: string) => `Bienvenido a Henry & Co., ${name || "alli"}!`,
      welcomeIntro: "Tu cuenta unificada de HenryCo ya esta lista. Desde aqui puedes gestionar Care, Marketplace, Studio y mas.",
      welcomeListIntro: "Esto es lo que puedes hacer:",
      welcomeList: [
        "Recargar tu billetera HenryCo para pagos rapidos",
        "Seguir pedidos, reservas y proyectos",
        "Gestionar direcciones y metodos de pago",
        "Recibir soporte unificado en todos los servicios",
      ],
      welcomeButton: "Ir al panel",
      securitySubject: (event: string) => `Alerta de seguridad: ${event}`,
      securityTitle: "Alerta de seguridad",
      securityIntro: "Detectamos un evento de seguridad en tu cuenta HenryCo:",
      securityEvent: "Evento",
      securityAction: "Si no fuiste tu, cambia tu contrasena de inmediato y contacta con soporte.",
      securityButton: "Revisar seguridad",
      walletSubject: (amount: number) => `NGN ${formatNaira(amount, locale)} agregados a tu billetera`,
      walletTitle: "Billetera recargada",
      walletIntro: (name: string) => `Hola ${name || "alli"}, se agrego dinero a tu billetera HenryCo.`,
      walletAmount: "Monto agregado",
      walletBalance: "Nuevo saldo",
      walletButton: "Ver billetera",
    };
  }

  if (locale === "pt") {
    return {
      footerManage: "Gerir conta",
      footerReason: "Recebeu isto porque tem uma conta HenryCo.",
      welcomeSubject: "Bem-vindo a HenryCo",
      welcomeTitle: (name: string) => `Bem-vindo a Henry & Co., ${name || "voce"}!`,
      welcomeIntro: "A sua conta unificada HenryCo esta pronta. A partir daqui pode gerir Care, Marketplace, Studio e muito mais.",
      welcomeListIntro: "Veja o que pode fazer:",
      welcomeList: [
        "Carregar a carteira HenryCo para pagamentos rapidos",
        "Acompanhar pedidos, reservas e projetos",
        "Gerir moradas e metodos de pagamento",
        "Receber suporte unificado em todos os servicos",
      ],
      welcomeButton: "Ir para o painel",
      securitySubject: (event: string) => `Alerta de seguranca: ${event}`,
      securityTitle: "Alerta de seguranca",
      securityIntro: "Detetamos um evento de seguranca na sua conta HenryCo:",
      securityEvent: "Evento",
      securityAction: "Se nao foi voce, altere a sua palavra-passe imediatamente e contacte o suporte.",
      securityButton: "Rever seguranca",
      walletSubject: (amount: number) => `NGN ${formatNaira(amount, locale)} adicionados a sua carteira`,
      walletTitle: "Carteira carregada",
      walletIntro: (name: string) => `Ola ${name || "voce"}, foi adicionado dinheiro a sua carteira HenryCo.`,
      walletAmount: "Montante adicionado",
      walletBalance: "Novo saldo",
      walletButton: "Ver carteira",
    };
  }

  if (locale === "ar") {
    return {
      footerManage: "إدارة الحساب",
      footerReason: "وصلتك هذه الرسالة لأن لديك حسابًا لدى HenryCo.",
      welcomeSubject: "مرحبًا بك في HenryCo",
      welcomeTitle: (name: string) => `مرحبًا بك في Henry & Co.، ${name || "هناك"}!`,
      welcomeIntro: "حسابك الموحد في HenryCo جاهز الآن. من هنا يمكنك إدارة Care وMarketplace وStudio والمزيد.",
      welcomeListIntro: "يمكنك الآن القيام بما يلي:",
      welcomeList: [
        "تمويل محفظة HenryCo لمدفوعات أسرع",
        "متابعة الطلبات والحجوزات والمشاريع",
        "إدارة العناوين ووسائل الدفع",
        "الحصول على دعم موحد عبر كل الخدمات",
      ],
      welcomeButton: "الذهاب إلى لوحتك",
      securitySubject: (event: string) => `تنبيه أمني: ${event}`,
      securityTitle: "تنبيه أمني",
      securityIntro: "رصدنا حدثًا أمنيًا على حسابك في HenryCo:",
      securityEvent: "الحدث",
      securityAction: "إذا لم تكن أنت، فغيّر كلمة المرور فورًا وتواصل مع الدعم.",
      securityButton: "مراجعة الأمان",
      walletSubject: (amount: number) => `تمت إضافة NGN ${formatNaira(amount, locale)} إلى محفظتك`,
      walletTitle: "تم تمويل المحفظة",
      walletIntro: (name: string) => `مرحبًا ${name || "هناك"}، تمت إضافة أموال إلى محفظة HenryCo الخاصة بك.`,
      walletAmount: "المبلغ المضاف",
      walletBalance: "الرصيد الجديد",
      walletButton: "عرض المحفظة",
    };
  }

  if (locale === "de") {
    return {
      footerManage: "Konto verwalten",
      footerReason: "Sie erhalten diese Nachricht, weil Sie ein HenryCo-Konto besitzen.",
      welcomeSubject: "Willkommen bei HenryCo",
      welcomeTitle: (name: string) => `Willkommen bei Henry & Co., ${name || "da"}!`,
      welcomeIntro: "Ihr einheitliches HenryCo-Konto ist bereit. Von hier aus verwalten Sie Care, Marketplace, Studio und mehr.",
      welcomeListIntro: "Das koennen Sie jetzt tun:",
      welcomeList: [
        "Ihre HenryCo Wallet fuer schnelle Zahlungen aufladen",
        "Bestellungen, Buchungen und Projekte verfolgen",
        "Adressen und Zahlungsmethoden verwalten",
        "Einheitlichen Support ueber alle Services erhalten",
      ],
      welcomeButton: "Zum Dashboard",
      securitySubject: (event: string) => `Sicherheitswarnung: ${event}`,
      securityTitle: "Sicherheitswarnung",
      securityIntro: "Wir haben ein Sicherheitsereignis in Ihrem HenryCo-Konto erkannt:",
      securityEvent: "Ereignis",
      securityAction: "Wenn Sie das nicht waren, aendern Sie sofort Ihr Passwort und kontaktieren Sie den Support.",
      securityButton: "Sicherheit pruefen",
      walletSubject: (amount: number) => `NGN ${formatNaira(amount, locale)} wurden Ihrer Wallet gutgeschrieben`,
      walletTitle: "Wallet aufgeladen",
      walletIntro: (name: string) => `Hallo ${name || "da"}, Ihrem HenryCo Wallet wurden Mittel gutgeschrieben.`,
      walletAmount: "Hinzugefuegter Betrag",
      walletBalance: "Neuer Kontostand",
      walletButton: "Wallet ansehen",
    };
  }

  if (locale === "it") {
    return {
      footerManage: "Gestisci account",
      footerReason: "Hai ricevuto questo messaggio perche hai un account HenryCo.",
      welcomeSubject: "Benvenuto in HenryCo",
      welcomeTitle: (name: string) => `Benvenuto in Henry & Co., ${name || "li"}!`,
      welcomeIntro: "Il tuo account HenryCo unificato e pronto. Da qui puoi gestire Care, Marketplace, Studio e altro ancora.",
      welcomeListIntro: "Ecco cosa puoi fare:",
      welcomeList: [
        "Ricaricare il tuo HenryCo Wallet per pagamenti rapidi",
        "Monitorare ordini, prenotazioni e progetti",
        "Gestire indirizzi e metodi di pagamento",
        "Ottenere supporto unificato su tutti i servizi",
      ],
      welcomeButton: "Vai alla dashboard",
      securitySubject: (event: string) => `Avviso di sicurezza: ${event}`,
      securityTitle: "Avviso di sicurezza",
      securityIntro: "Abbiamo rilevato un evento di sicurezza sul tuo account HenryCo:",
      securityEvent: "Evento",
      securityAction: "Se non eri tu, cambia subito la password e contatta il supporto.",
      securityButton: "Controlla sicurezza",
      walletSubject: (amount: number) => `NGN ${formatNaira(amount, locale)} aggiunti al tuo wallet`,
      walletTitle: "Wallet ricaricato",
      walletIntro: (name: string) => `Ciao ${name || "li"}, del denaro e stato aggiunto al tuo HenryCo Wallet.`,
      walletAmount: "Importo aggiunto",
      walletBalance: "Nuovo saldo",
      walletButton: "Visualizza wallet",
    };
  }

  return {
    footerManage: "Manage account",
    footerReason: "You received this because you have an account with HenryCo.",
    welcomeSubject: "Your HenryCo account is ready",
    welcomeTitle: (name: string) => `Your HenryCo account is ready${name ? `, ${name}` : ""}.`,
    welcomeIntro: "The unified HenryCo account is set up. From here, manage everything across Care, Marketplace, Studio, and more.",
    welcomeListIntro: "What lives in this account:",
    welcomeList: [
      "Fund your HenryCo Wallet for quick payments",
      "Track orders, bookings, and projects",
      "Manage addresses and payment methods",
      "Get unified support across all services",
    ],
    welcomeButton: "Open the dashboard",
    securitySubject: (event: string) => `Security alert: ${event}`,
    securityTitle: "Security alert",
    securityIntro: "A security event was detected on your HenryCo account:",
    securityEvent: "Event",
    securityAction: "If this wasn't you, change your password immediately and contact support.",
    securityButton: "Review security",
    walletSubject: (amount: number) => `NGN ${formatNaira(amount, locale)} added to your wallet`,
    walletTitle: "Wallet funded",
    walletIntro: (name: string) => `${name ? `${name}, money` : "Money"} has been added to your HenryCo Wallet.`,
    walletAmount: "Amount added",
    walletBalance: "New balance",
    walletButton: "View wallet",
  };
}

function layout(content: string, locale: AppLocale = "en") {
  const copy = getEmailCopy(locale);
  const dir = locale === "ar" ? "rtl" : "ltr";
  const t = HENRYCO_EMAIL_TOKENS;
  const brandHeader = renderHenryCoEmailHeader("auth", "dark");
  const brandFooter = renderHenryCoEmailFooter({
    purpose: "auth",
    supportEmail: BRAND_EMAILS.accounts,
    preferencesUrl: `${ACCOUNT_ORIGIN}/settings#email-preferences`,
    reasonLine: copy.footerReason,
  });

  return `<!DOCTYPE html>
<html lang="${locale}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>HenryCo</title>
<style>
  :root { color-scheme: light dark; }
  body { margin: 0; padding: 0; background: ${t.outerBg}; font-family: ${t.bodyFont}; color: ${DARK_TEXT}; -webkit-font-smoothing: antialiased; }
  .wrapper { max-width: 560px; margin: 0 auto; padding: 32px 20px; background: ${BG_COLOR}; }
  .card { background: #FFFFFF; border: 1px solid #ECE8DF; border-radius: 24px; padding: 36px 32px; box-shadow: 0 20px 60px -30px rgba(26,24,20,0.18); }
  h1 { font-family: ${t.headingFont}; font-size: 28px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.2; margin: 0 0 12px; color: ${DARK_TEXT}; }
  p { font-family: ${t.bodyFont}; font-size: 15px; line-height: 1.7; color: #4B4540; margin: 0 0 16px; }
  .btn { display: inline-block; padding: 13px 28px; background: ${BRAND_COLOR}; color: #1A1814 !important; text-decoration: none; font-family: ${t.bodyFont}; font-weight: 700; font-size: 14px; letter-spacing: 0.01em; border-radius: 999px; box-shadow: 0 12px 30px -10px rgba(201,162,39,0.45); }
  .metric { background: #F5F3EF; border: 1px solid #ECE8DF; border-radius: 14px; padding: 16px 18px; margin: 14px 0; }
  .metric-label { font-family: ${t.bodyFont}; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: ${MUTED_TEXT}; }
  .metric-value { font-family: ${t.headingFont}; font-size: 24px; font-weight: 600; letter-spacing: -0.01em; color: ${DARK_TEXT}; margin-top: 6px; }
  ul { font-family: ${t.bodyFont}; color: #4B4540; font-size: 15px; line-height: 1.85; padding-left: 22px; margin: 14px 0; }

  @media (prefers-color-scheme: dark) {
    .wrapper { background: #0B0A08 !important; }
    .card { background: #141210 !important; border-color: #2A2722 !important; box-shadow: 0 30px 90px rgba(0,0,0,0.6) !important; }
    h1 { color: #F6F1E5 !important; }
    p, ul { color: #BDB4A5 !important; }
    .metric { background: #1C1915 !important; border-color: #2A2722 !important; }
    .metric-label { color: #9B9280 !important; }
    .metric-value { color: #F6F1E5 !important; }
  }
</style>
</head>
<body>
${brandHeader}
<div class="wrapper">
  <div class="card">${content}</div>
</div>
${brandFooter}
</body>
</html>`;
}

export function welcomeEmail(name: string, locale: AppLocale = "en") {
  const copy = getEmailCopy(locale);
  return {
    subject: copy.welcomeSubject,
    html: layout(`
      <h1>${copy.welcomeTitle(name)}</h1>
      <p>${copy.welcomeIntro}</p>
      <p>${copy.welcomeListIntro}</p>
      <ul style="color:${MUTED_TEXT};font-size:15px;line-height:2;">
        ${copy.welcomeList.map((item) => `<li>${item}</li>`).join("")}
      </ul>
      <p style="text-align:center;margin-top:24px;">
        <a href="${ACCOUNT_ORIGIN}" class="btn">${copy.welcomeButton}</a>
      </p>
    `, locale),
  };
}

export function securityAlertEmail(event: string, details: string, locale: AppLocale = "en") {
  const copy = getEmailCopy(locale);
  return {
    subject: copy.securitySubject(event),
    html: layout(`
      <h1>${copy.securityTitle}</h1>
      <p>${copy.securityIntro}</p>
      <div class="metric">
        <div class="metric-label">${copy.securityEvent}</div>
        <div class="metric-value" style="font-size:16px;">${event}</div>
      </div>
      <p>${details}</p>
      <p>${copy.securityAction}</p>
      <p style="text-align:center;margin-top:24px;">
        <a href="${ACCOUNT_ORIGIN}/security" class="btn">${copy.securityButton}</a>
      </p>
    `, locale),
  };
}

export function walletFundedEmail(
  name: string,
  amountNaira: number,
  newBalanceNaira: number,
  locale: AppLocale = "en",
) {
  const copy = getEmailCopy(locale);
  return {
    subject: copy.walletSubject(amountNaira),
    html: layout(`
      <h1>${copy.walletTitle}</h1>
      <p>${copy.walletIntro(name)}</p>
      <div class="metric">
        <div class="metric-label">${copy.walletAmount}</div>
        <div class="metric-value" style="color:#10B981;">+NGN ${formatNaira(amountNaira, locale)}</div>
      </div>
      <div class="metric">
        <div class="metric-label">${copy.walletBalance}</div>
        <div class="metric-value">NGN ${formatNaira(newBalanceNaira, locale)}</div>
      </div>
      <p style="text-align:center;margin-top:24px;">
        <a href="${ACCOUNT_ORIGIN}/wallet" class="btn">${copy.walletButton}</a>
      </p>
    `, locale),
  };
}

// PASS 18C — extended copy for the previously English-only templates. Each
// locale provides production-tier translations for fr/es/pt/ar/de/it; zh/hi/
// ig/yo/ha fall back to the English source via the runtime autoTranslate
// cache when the recipient's `customer_profiles.language` resolves to one.
function getExtendedEmailCopy(locale: AppLocale) {
  if (locale === "fr") {
    return {
      paymentSubject: (amountFmt: string) => `Paiement confirmé — NGN ${amountFmt}`,
      paymentTitle: "Paiement confirmé",
      paymentIntro: (name: string) => `Bonjour ${name || "vous"}, votre paiement a été traité.`,
      paymentAmountLabel: "Montant",
      paymentServiceLabel: "Service",
      paymentReceiptCta: "Voir le reçu",
      supportSubject: (subj: string) => `Mise à jour : ${subj}`,
      supportTitle: "Mise à jour du support",
      supportIntro: (name: string) => `Bonjour ${name || "vous"}, une nouvelle mise à jour est disponible pour votre demande :`,
      supportRequestLabel: "Demande",
      supportConversationCta: "Voir la conversation",
      subscriptionSubjectActivated: (plan: string) => `Abonnement activé : ${plan}`,
      subscriptionSubjectCancelled: (plan: string) => `Abonnement annulé : ${plan}`,
      subscriptionSubjectRenewed: (plan: string) => `Abonnement renouvelé : ${plan}`,
      subscriptionSubjectPaused: (plan: string) => `Abonnement suspendu : ${plan}`,
      subscriptionTitle: (action: string) => `Abonnement ${action}`,
      subscriptionBody: (name: string, plan: string, actionPhrase: string) =>
        `Bonjour ${name || "vous"}, votre abonnement <strong>${plan}</strong> ${actionPhrase}.`,
      subscriptionPhraseActivated: "a été activé",
      subscriptionPhraseCancelled: "a été annulé",
      subscriptionPhraseRenewed: "a été renouvelé",
      subscriptionPhrasePaused: "a été suspendu",
      subscriptionManageCta: "Gérer les abonnements",
      digestSubject: "Votre récapitulatif HenryCo de la semaine",
      digestTitle: "Votre semaine chez HenryCo",
      digestIntro: (name: string) => `Bonjour ${name || "vous"}, voici un aperçu de votre compte cette semaine.`,
      digestActivityLabel: "Activités",
      digestNotificationsLabel: "Notifications",
      digestWalletLabel: "Portefeuille",
      digestDashboardCta: "Aller au tableau de bord",
    };
  }

  if (locale === "es") {
    return {
      paymentSubject: (amountFmt: string) => `Pago confirmado — NGN ${amountFmt}`,
      paymentTitle: "Pago confirmado",
      paymentIntro: (name: string) => `Hola ${name || "allí"}, tu pago ha sido procesado.`,
      paymentAmountLabel: "Importe",
      paymentServiceLabel: "Servicio",
      paymentReceiptCta: "Ver recibo",
      supportSubject: (subj: string) => `Actualización: ${subj}`,
      supportTitle: "Actualización de soporte",
      supportIntro: (name: string) => `Hola ${name || "allí"}, hay una nueva actualización en tu solicitud de soporte:`,
      supportRequestLabel: "Solicitud",
      supportConversationCta: "Ver conversación",
      subscriptionSubjectActivated: (plan: string) => `Suscripción activada: ${plan}`,
      subscriptionSubjectCancelled: (plan: string) => `Suscripción cancelada: ${plan}`,
      subscriptionSubjectRenewed: (plan: string) => `Suscripción renovada: ${plan}`,
      subscriptionSubjectPaused: (plan: string) => `Suscripción pausada: ${plan}`,
      subscriptionTitle: (action: string) => `Suscripción ${action}`,
      subscriptionBody: (name: string, plan: string, actionPhrase: string) =>
        `Hola ${name || "allí"}, tu suscripción <strong>${plan}</strong> ${actionPhrase}.`,
      subscriptionPhraseActivated: "se ha activado",
      subscriptionPhraseCancelled: "se ha cancelado",
      subscriptionPhraseRenewed: "se ha renovado",
      subscriptionPhrasePaused: "se ha pausado",
      subscriptionManageCta: "Gestionar suscripciones",
      digestSubject: "Tu resumen semanal de HenryCo",
      digestTitle: "Tu semana en HenryCo",
      digestIntro: (name: string) => `Hola ${name || "allí"}, aquí va un vistazo rápido a tu cuenta esta semana.`,
      digestActivityLabel: "Actividades",
      digestNotificationsLabel: "Notificaciones",
      digestWalletLabel: "Billetera",
      digestDashboardCta: "Ir al panel",
    };
  }

  if (locale === "pt") {
    return {
      paymentSubject: (amountFmt: string) => `Pagamento confirmado — NGN ${amountFmt}`,
      paymentTitle: "Pagamento confirmado",
      paymentIntro: (name: string) => `Olá ${name || "você"}, o seu pagamento foi processado.`,
      paymentAmountLabel: "Valor",
      paymentServiceLabel: "Serviço",
      paymentReceiptCta: "Ver recibo",
      supportSubject: (subj: string) => `Atualização: ${subj}`,
      supportTitle: "Atualização do suporte",
      supportIntro: (name: string) => `Olá ${name || "você"}, há uma nova atualização no seu pedido de suporte:`,
      supportRequestLabel: "Pedido",
      supportConversationCta: "Ver conversa",
      subscriptionSubjectActivated: (plan: string) => `Subscrição ativada: ${plan}`,
      subscriptionSubjectCancelled: (plan: string) => `Subscrição cancelada: ${plan}`,
      subscriptionSubjectRenewed: (plan: string) => `Subscrição renovada: ${plan}`,
      subscriptionSubjectPaused: (plan: string) => `Subscrição pausada: ${plan}`,
      subscriptionTitle: (action: string) => `Subscrição ${action}`,
      subscriptionBody: (name: string, plan: string, actionPhrase: string) =>
        `Olá ${name || "você"}, a sua subscrição <strong>${plan}</strong> ${actionPhrase}.`,
      subscriptionPhraseActivated: "foi ativada",
      subscriptionPhraseCancelled: "foi cancelada",
      subscriptionPhraseRenewed: "foi renovada",
      subscriptionPhrasePaused: "foi pausada",
      subscriptionManageCta: "Gerir subscrições",
      digestSubject: "O seu resumo semanal HenryCo",
      digestTitle: "A sua semana na HenryCo",
      digestIntro: (name: string) => `Olá ${name || "você"}, aqui fica um olhar rápido sobre a sua conta esta semana.`,
      digestActivityLabel: "Atividades",
      digestNotificationsLabel: "Notificações",
      digestWalletLabel: "Carteira",
      digestDashboardCta: "Ir para o painel",
    };
  }

  if (locale === "ar") {
    return {
      paymentSubject: (amountFmt: string) => `تم تأكيد الدفع — NGN ${amountFmt}`,
      paymentTitle: "تم تأكيد الدفع",
      paymentIntro: (name: string) => `مرحبًا ${name || "هناك"}، تمت معالجة دفعتك.`,
      paymentAmountLabel: "المبلغ",
      paymentServiceLabel: "الخدمة",
      paymentReceiptCta: "عرض الإيصال",
      supportSubject: (subj: string) => `تحديث: ${subj}`,
      supportTitle: "تحديث من الدعم",
      supportIntro: (name: string) => `مرحبًا ${name || "هناك"}، هناك تحديث جديد على طلب الدعم الخاص بك:`,
      supportRequestLabel: "الطلب",
      supportConversationCta: "عرض المحادثة",
      subscriptionSubjectActivated: (plan: string) => `تم تفعيل الاشتراك: ${plan}`,
      subscriptionSubjectCancelled: (plan: string) => `تم إلغاء الاشتراك: ${plan}`,
      subscriptionSubjectRenewed: (plan: string) => `تم تجديد الاشتراك: ${plan}`,
      subscriptionSubjectPaused: (plan: string) => `تم إيقاف الاشتراك: ${plan}`,
      subscriptionTitle: (action: string) => `الاشتراك ${action}`,
      subscriptionBody: (name: string, plan: string, actionPhrase: string) =>
        `مرحبًا ${name || "هناك"}، اشتراكك <strong>${plan}</strong> ${actionPhrase}.`,
      subscriptionPhraseActivated: "تم تفعيله",
      subscriptionPhraseCancelled: "تم إلغاؤه",
      subscriptionPhraseRenewed: "تم تجديده",
      subscriptionPhrasePaused: "تم إيقافه",
      subscriptionManageCta: "إدارة الاشتراكات",
      digestSubject: "ملخصك الأسبوعي من HenryCo",
      digestTitle: "أسبوعك في HenryCo",
      digestIntro: (name: string) => `مرحبًا ${name || "هناك"}، إليك لمحة سريعة عن حسابك هذا الأسبوع.`,
      digestActivityLabel: "الأنشطة",
      digestNotificationsLabel: "الإشعارات",
      digestWalletLabel: "المحفظة",
      digestDashboardCta: "اذهب إلى لوحة التحكم",
    };
  }

  if (locale === "de") {
    return {
      paymentSubject: (amountFmt: string) => `Zahlung bestätigt — NGN ${amountFmt}`,
      paymentTitle: "Zahlung bestätigt",
      paymentIntro: (name: string) => `Hallo ${name || "da"}, Ihre Zahlung wurde verarbeitet.`,
      paymentAmountLabel: "Betrag",
      paymentServiceLabel: "Service",
      paymentReceiptCta: "Beleg ansehen",
      supportSubject: (subj: string) => `Update: ${subj}`,
      supportTitle: "Support-Update",
      supportIntro: (name: string) => `Hallo ${name || "da"}, es gibt ein neues Update zu Ihrer Supportanfrage:`,
      supportRequestLabel: "Anfrage",
      supportConversationCta: "Konversation öffnen",
      subscriptionSubjectActivated: (plan: string) => `Abonnement aktiviert: ${plan}`,
      subscriptionSubjectCancelled: (plan: string) => `Abonnement gekündigt: ${plan}`,
      subscriptionSubjectRenewed: (plan: string) => `Abonnement verlängert: ${plan}`,
      subscriptionSubjectPaused: (plan: string) => `Abonnement pausiert: ${plan}`,
      subscriptionTitle: (action: string) => `Abonnement ${action}`,
      subscriptionBody: (name: string, plan: string, actionPhrase: string) =>
        `Hallo ${name || "da"}, Ihr Abonnement <strong>${plan}</strong> ${actionPhrase}.`,
      subscriptionPhraseActivated: "wurde aktiviert",
      subscriptionPhraseCancelled: "wurde gekündigt",
      subscriptionPhraseRenewed: "wurde verlängert",
      subscriptionPhrasePaused: "wurde pausiert",
      subscriptionManageCta: "Abonnements verwalten",
      digestSubject: "Ihre HenryCo-Wochenzusammenfassung",
      digestTitle: "Ihre Woche bei HenryCo",
      digestIntro: (name: string) => `Hallo ${name || "da"}, hier ist ein schneller Blick auf Ihr Konto diese Woche.`,
      digestActivityLabel: "Aktivitäten",
      digestNotificationsLabel: "Benachrichtigungen",
      digestWalletLabel: "Wallet",
      digestDashboardCta: "Zum Dashboard",
    };
  }

  if (locale === "it") {
    return {
      paymentSubject: (amountFmt: string) => `Pagamento confermato — NGN ${amountFmt}`,
      paymentTitle: "Pagamento confermato",
      paymentIntro: (name: string) => `Ciao ${name || "lì"}, il tuo pagamento è stato elaborato.`,
      paymentAmountLabel: "Importo",
      paymentServiceLabel: "Servizio",
      paymentReceiptCta: "Vedi ricevuta",
      supportSubject: (subj: string) => `Aggiornamento: ${subj}`,
      supportTitle: "Aggiornamento supporto",
      supportIntro: (name: string) => `Ciao ${name || "lì"}, c'è un nuovo aggiornamento sulla tua richiesta di supporto:`,
      supportRequestLabel: "Richiesta",
      supportConversationCta: "Vedi conversazione",
      subscriptionSubjectActivated: (plan: string) => `Abbonamento attivato: ${plan}`,
      subscriptionSubjectCancelled: (plan: string) => `Abbonamento annullato: ${plan}`,
      subscriptionSubjectRenewed: (plan: string) => `Abbonamento rinnovato: ${plan}`,
      subscriptionSubjectPaused: (plan: string) => `Abbonamento sospeso: ${plan}`,
      subscriptionTitle: (action: string) => `Abbonamento ${action}`,
      subscriptionBody: (name: string, plan: string, actionPhrase: string) =>
        `Ciao ${name || "lì"}, il tuo abbonamento <strong>${plan}</strong> ${actionPhrase}.`,
      subscriptionPhraseActivated: "è stato attivato",
      subscriptionPhraseCancelled: "è stato annullato",
      subscriptionPhraseRenewed: "è stato rinnovato",
      subscriptionPhrasePaused: "è stato sospeso",
      subscriptionManageCta: "Gestisci abbonamenti",
      digestSubject: "Il tuo riepilogo settimanale HenryCo",
      digestTitle: "La tua settimana in HenryCo",
      digestIntro: (name: string) => `Ciao ${name || "lì"}, ecco uno sguardo rapido al tuo account questa settimana.`,
      digestActivityLabel: "Attività",
      digestNotificationsLabel: "Notifiche",
      digestWalletLabel: "Wallet",
      digestDashboardCta: "Vai alla dashboard",
    };
  }

  return {
    paymentSubject: (amountFmt: string) => `Payment confirmed — NGN ${amountFmt}`,
    paymentTitle: "Payment confirmed",
    paymentIntro: (name: string) => `Hi ${name || "there"}, your payment has been processed.`,
    paymentAmountLabel: "Amount",
    paymentServiceLabel: "Service",
    paymentReceiptCta: "View receipt",
    supportSubject: (subj: string) => `Update on: ${subj}`,
    supportTitle: "Support update",
    supportIntro: (name: string) => `Hi ${name || "there"}, there's a new update on your support request:`,
    supportRequestLabel: "Request",
    supportConversationCta: "View conversation",
    subscriptionSubjectActivated: (plan: string) => `Subscription activated: ${plan}`,
    subscriptionSubjectCancelled: (plan: string) => `Subscription cancelled: ${plan}`,
    subscriptionSubjectRenewed: (plan: string) => `Subscription renewed: ${plan}`,
    subscriptionSubjectPaused: (plan: string) => `Subscription paused: ${plan}`,
    subscriptionTitle: (action: string) => `Subscription ${action}`,
    subscriptionBody: (name: string, plan: string, actionPhrase: string) =>
      `Hi ${name || "there"}, your subscription <strong>${plan}</strong> ${actionPhrase}.`,
    subscriptionPhraseActivated: "has been activated",
    subscriptionPhraseCancelled: "has been cancelled",
    subscriptionPhraseRenewed: "has been renewed",
    subscriptionPhrasePaused: "has been paused",
    subscriptionManageCta: "Manage subscriptions",
    digestSubject: "Your weekly HenryCo summary",
    digestTitle: "Your week at HenryCo",
    digestIntro: (name: string) => `Hi ${name || "there"}, here's a quick look at your account this week.`,
    digestActivityLabel: "Activities",
    digestNotificationsLabel: "Notifications",
    digestWalletLabel: "Wallet",
    digestDashboardCta: "Go to dashboard",
  };
}

export function paymentConfirmationEmail(
  name: string,
  amountNaira: number,
  description: string,
  division: string,
  locale: AppLocale = "en",
) {
  const copy = getExtendedEmailCopy(locale);
  const amountFmt = formatNaira(amountNaira, locale);
  return {
    subject: copy.paymentSubject(amountFmt),
    html: layout(`
      <h1>${copy.paymentTitle}</h1>
      <p>${copy.paymentIntro(name)}</p>
      <div class="metric">
        <div class="metric-label">${copy.paymentAmountLabel}</div>
        <div class="metric-value">NGN ${amountFmt}</div>
      </div>
      <div class="metric">
        <div class="metric-label">${copy.paymentServiceLabel}</div>
        <div class="metric-value" style="font-size:16px;">${division}</div>
      </div>
      <p>${description}</p>
      <p style="text-align:center;margin-top:24px;">
        <a href="${ACCOUNT_ORIGIN}/invoices" class="btn">${copy.paymentReceiptCta}</a>
      </p>
    `, locale),
  };
}

export function supportUpdateEmail(
  name: string,
  subject: string,
  threadId: string,
  locale: AppLocale = "en",
) {
  const copy = getExtendedEmailCopy(locale);
  return {
    subject: copy.supportSubject(subject),
    html: layout(`
      <h1>${copy.supportTitle}</h1>
      <p>${copy.supportIntro(name)}</p>
      <div class="metric">
        <div class="metric-label">${copy.supportRequestLabel}</div>
        <div class="metric-value" style="font-size:16px;">${subject}</div>
      </div>
      <p style="text-align:center;margin-top:24px;">
        <a href="${ACCOUNT_ORIGIN}/support/${threadId}" class="btn">${copy.supportConversationCta}</a>
      </p>
    `, locale),
  };
}

export function subscriptionChangeEmail(
  name: string,
  planName: string,
  action: "activated" | "cancelled" | "renewed" | "paused",
  locale: AppLocale = "en",
) {
  const copy = getExtendedEmailCopy(locale);
  const subjectByAction: Record<typeof action, (plan: string) => string> = {
    activated: copy.subscriptionSubjectActivated,
    cancelled: copy.subscriptionSubjectCancelled,
    renewed: copy.subscriptionSubjectRenewed,
    paused: copy.subscriptionSubjectPaused,
  };
  const phraseByAction: Record<typeof action, string> = {
    activated: copy.subscriptionPhraseActivated,
    cancelled: copy.subscriptionPhraseCancelled,
    renewed: copy.subscriptionPhraseRenewed,
    paused: copy.subscriptionPhrasePaused,
  };

  return {
    subject: subjectByAction[action](planName),
    html: layout(`
      <h1>${copy.subscriptionTitle(action)}</h1>
      <p>${copy.subscriptionBody(name, planName, phraseByAction[action])}</p>
      <p style="text-align:center;margin-top:24px;">
        <a href="${ACCOUNT_ORIGIN}/subscriptions" class="btn">${copy.subscriptionManageCta}</a>
      </p>
    `, locale),
  };
}

export function weeklyDigestEmail(
  name: string,
  stats: { activity: number; notifications: number; walletBalance: number },
  locale: AppLocale = "en",
) {
  const copy = getExtendedEmailCopy(locale);
  return {
    subject: copy.digestSubject,
    html: layout(`
      <h1>${copy.digestTitle}</h1>
      <p>${copy.digestIntro(name)}</p>
      <div style="display:flex;gap:12px;">
        <div class="metric" style="flex:1;text-align:center;">
          <div class="metric-label">${copy.digestActivityLabel}</div>
          <div class="metric-value">${stats.activity}</div>
        </div>
        <div class="metric" style="flex:1;text-align:center;">
          <div class="metric-label">${copy.digestNotificationsLabel}</div>
          <div class="metric-value">${stats.notifications}</div>
        </div>
        <div class="metric" style="flex:1;text-align:center;">
          <div class="metric-label">${copy.digestWalletLabel}</div>
          <div class="metric-value">NGN ${formatNaira(stats.walletBalance, locale)}</div>
        </div>
      </div>
      <p style="text-align:center;margin-top:24px;">
        <a href="${ACCOUNT_ORIGIN}" class="btn">${copy.digestDashboardCta}</a>
      </p>
    `, locale),
  };
}
