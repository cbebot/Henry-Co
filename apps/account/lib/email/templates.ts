// HenryCo Account Email Templates
// All templates return plain HTML strings for Resend

import type { AppLocale } from "@henryco/i18n";
import {
  HENRYCO_EMAIL_TOKENS,
  renderHenryCoEmailFooter,
  renderHenryCoEmailHeader,
} from "@henryco/email";

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
    supportEmail: "accounts@henrycogroup.com",
    preferencesUrl: "https://account.henrycogroup.com/settings#email-preferences",
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
        <a href="https://account.henrycogroup.com" class="btn">${copy.welcomeButton}</a>
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
        <a href="https://account.henrycogroup.com/security" class="btn">${copy.securityButton}</a>
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
        <a href="https://account.henrycogroup.com/wallet" class="btn">${copy.walletButton}</a>
      </p>
    `, locale),
  };
}

export function paymentConfirmationEmail(name: string, amountNaira: number, description: string, division: string) {
  return {
    subject: `Payment confirmed — NGN ${amountNaira.toLocaleString()}`,
    html: layout(`
      <h1>Payment confirmed</h1>
      <p>Hi ${name || "there"}, your payment has been processed.</p>
      <div class="metric">
        <div class="metric-label">Amount</div>
        <div class="metric-value">NGN ${amountNaira.toLocaleString()}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Service</div>
        <div class="metric-value" style="font-size:16px;">${division}</div>
      </div>
      <p>${description}</p>
      <p style="text-align:center;margin-top:24px;">
        <a href="https://account.henrycogroup.com/invoices" class="btn">View receipt</a>
      </p>
    `),
  };
}

export function supportUpdateEmail(name: string, subject: string, threadId: string) {
  return {
    subject: `Update on: ${subject}`,
    html: layout(`
      <h1>Support update</h1>
      <p>Hi ${name || "there"}, there's a new update on your support request:</p>
      <div class="metric">
        <div class="metric-label">Request</div>
        <div class="metric-value" style="font-size:16px;">${subject}</div>
      </div>
      <p style="text-align:center;margin-top:24px;">
        <a href="https://account.henrycogroup.com/support/${threadId}" class="btn">View conversation</a>
      </p>
    `),
  };
}

export function subscriptionChangeEmail(name: string, planName: string, action: "activated" | "cancelled" | "renewed" | "paused") {
  const actionText: Record<string, string> = {
    activated: "has been activated",
    cancelled: "has been cancelled",
    renewed: "has been renewed",
    paused: "has been paused",
  };

  return {
    subject: `Subscription ${action}: ${planName}`,
    html: layout(`
      <h1>Subscription ${action}</h1>
      <p>Hi ${name || "there"}, your subscription <strong>${planName}</strong> ${actionText[action]}.</p>
      <p style="text-align:center;margin-top:24px;">
        <a href="https://account.henrycogroup.com/subscriptions" class="btn">Manage subscriptions</a>
      </p>
    `),
  };
}

export function weeklyDigestEmail(
  name: string,
  stats: { activity: number; notifications: number; walletBalance: number }
) {
  return {
    subject: "Your weekly HenryCo summary",
    html: layout(`
      <h1>Your week at HenryCo</h1>
      <p>Hi ${name || "there"}, here's a quick look at your account this week.</p>
      <div style="display:flex;gap:12px;">
        <div class="metric" style="flex:1;text-align:center;">
          <div class="metric-label">Activities</div>
          <div class="metric-value">${stats.activity}</div>
        </div>
        <div class="metric" style="flex:1;text-align:center;">
          <div class="metric-label">Notifications</div>
          <div class="metric-value">${stats.notifications}</div>
        </div>
        <div class="metric" style="flex:1;text-align:center;">
          <div class="metric-label">Wallet</div>
          <div class="metric-value">NGN ${stats.walletBalance.toLocaleString()}</div>
        </div>
      </div>
      <p style="text-align:center;margin-top:24px;">
        <a href="https://account.henrycogroup.com" class="btn">Go to dashboard</a>
      </p>
    `),
  };
}
