import { isAppLocale, normalizeLocale, type AppLocale } from "@henryco/i18n";

type KnownNotificationLocalizationKey =
  | "support.request.created"
  | "support.reply.received"
  | "care.booking.available"
  | "wallet.funded"
  | "wallet.funding.pending"
  | "marketplace.order.confirmed"
  | "property.listing.submitted"
  | "property.listing.approved"
  | "property.listing.rejected"
  | "jobs.application.submitted";

type NotificationLocalizationPayload = {
  key?: string | null;
  locale?: string | null;
  params?: Record<string, unknown> | null;
  rendered?: {
    title?: string | null;
    body?: string | null;
  } | null;
};

function asText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNullableText(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

function asObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function safeLocale(value: unknown) {
  const normalized = normalizeLocale(asNullableText(value));
  return isAppLocale(normalized) ? normalized : "en";
}

function subjectFromParams(params: Record<string, unknown>) {
  return asNullableText(params.subject) || asNullableText(params.request_subject) || "your request";
}

function renderKnownNotification(
  key: KnownNotificationLocalizationKey,
  locale: AppLocale,
  params: Record<string, unknown>,
) {
  if (key === "support.request.created") {
    const subject = subjectFromParams(params);

    if (locale === "fr") {
      return {
        title: "Demande d'assistance creee",
        body: `Votre demande "${subject}" a ete envoyee. Nous reviendrons vers vous bientot.`,
      };
    }

    if (locale === "es") {
      return {
        title: "Solicitud de soporte creada",
        body: `Tu solicitud "${subject}" se ha enviado. Te responderemos pronto.`,
      };
    }

    if (locale === "pt") {
      return {
        title: "Solicitacao de suporte criada",
        body: `Seu pedido "${subject}" foi enviado. Falaremos com voce em breve.`,
      };
    }

    if (locale === "ar") {
      return {
        title: "تم إنشاء طلب الدعم",
        body: `تم إرسال طلبك "${subject}". سنعود إليك قريبًا.`,
      };
    }

    if (locale === "de") {
      return {
        title: "Supportanfrage erstellt",
        body: `Deine Anfrage "${subject}" wurde uebermittelt. Wir melden uns in Kuerze.`,
      };
    }

    if (locale === "it") {
      return {
        title: "Richiesta di supporto creata",
        body: `La tua richiesta "${subject}" e stata inviata. Ti risponderemo presto.`,
      };
    }

    return {
      title: "Support request created",
      body: `Your request "${subject}" has been submitted. We'll get back to you soon.`,
    };
  }

  if (key === "support.reply.received") {
    const subject = subjectFromParams(params);
    if (locale === "fr") return { title: "Nouvelle reponse du support", body: `Une reponse a ete ajoutee a votre demande "${subject}".` };
    if (locale === "es") return { title: "Nueva respuesta de soporte", body: `Se agrego una respuesta a tu solicitud "${subject}".` };
    if (locale === "pt") return { title: "Nova resposta do suporte", body: `Uma resposta foi adicionada ao seu pedido "${subject}".` };
    if (locale === "ar") return { title: "رد جديد من الدعم", body: `تمت إضافة رد على طلبك "${subject}".` };
    if (locale === "de") return { title: "Neue Supportantwort", body: `Auf deine Anfrage "${subject}" wurde geantwortet.` };
    if (locale === "it") return { title: "Nuova risposta al supporto", body: `E stata aggiunta una risposta alla tua richiesta "${subject}".` };
    return { title: "Support reply received", body: `A reply has been added to your request "${subject}".` };
  }

  if (key === "care.booking.available") {
    const code = asNullableText(params.tracking_code) || asNullableText(params.code) || "your booking";
    if (locale === "fr") return { title: "Reservation Care disponible", body: `Votre reservation ${code} est maintenant visible dans votre compte.` };
    if (locale === "es") return { title: "Reserva Care disponible", body: `Tu reserva ${code} ya esta visible en tu cuenta.` };
    if (locale === "pt") return { title: "Reserva Care disponivel", body: `Sua reserva ${code} ja esta visivel na sua conta.` };
    if (locale === "ar") return { title: "الحجز متاح في حسابك", body: `حجزك ${code} متاح الآن في حسابك.` };
    if (locale === "de") return { title: "Care-Buchung verfugbar", body: `Deine Buchung ${code} ist jetzt in deinem Konto sichtbar.` };
    if (locale === "it") return { title: "Prenotazione Care disponibile", body: `La tua prenotazione ${code} e ora visibile nel tuo account.` };
    return { title: "Care booking available", body: `Your booking ${code} is now visible in your account.` };
  }

  if (key === "wallet.funded") {
    const amount = asNullableText(params.amount) || asNullableText(params.amount_formatted);
    const amountStr = amount ? ` of ${amount}` : "";
    if (locale === "fr") return { title: "Portefeuille approvisionne", body: `Un depot${amountStr} a ete verifie et ajoute a votre solde.` };
    if (locale === "es") return { title: "Billetera recargada", body: `Un deposito${amountStr} fue verificado y agregado a tu saldo.` };
    if (locale === "pt") return { title: "Carteira carregada", body: `Um deposito${amountStr} foi verificado e adicionado ao seu saldo.` };
    if (locale === "ar") return { title: "تم شحن المحفظة", body: `تم التحقق من الإيداع${amountStr} وإضافته إلى رصيدك.` };
    if (locale === "de") return { title: "Wallet aufgeladen", body: `Eine Einzahlung${amountStr} wurde verifiziert und deinem Guthaben gutgeschrieben.` };
    if (locale === "it") return { title: "Portafoglio ricaricato", body: `Un deposito${amountStr} e stato verificato e aggiunto al tuo saldo.` };
    return { title: "Wallet funded", body: `A deposit${amountStr} has been verified and added to your balance.` };
  }

  if (key === "wallet.funding.pending") {
    if (locale === "fr") return { title: "Depot en attente de verification", body: "Votre demande de depot a ete recue et est en cours de verification." };
    if (locale === "es") return { title: "Deposito pendiente de verificacion", body: "Tu solicitud de deposito fue recibida y esta en verificacion." };
    if (locale === "pt") return { title: "Deposito aguardando verificacao", body: "Seu pedido de deposito foi recebido e esta em verificacao." };
    if (locale === "ar") return { title: "الإيداع قيد المراجعة", body: "تم استلام طلب الإيداع وهو قيد التحقق." };
    if (locale === "de") return { title: "Einzahlung in Prufung", body: "Deine Einzahlungsanforderung wurde empfangen und wird gepruft." };
    if (locale === "it") return { title: "Deposito in verifica", body: "La tua richiesta di deposito e stata ricevuta ed e in fase di verifica." };
    return { title: "Deposit pending verification", body: "Your funding request has been received and is being verified." };
  }

  if (key === "marketplace.order.confirmed") {
    const orderNo = asNullableText(params.order_no) || asNullableText(params.orderNo) || "your order";
    if (locale === "fr") return { title: "Commande confirmee", body: `La commande ${orderNo} est confirmee et en cours de traitement.` };
    if (locale === "es") return { title: "Pedido confirmado", body: `El pedido ${orderNo} esta confirmado y en proceso.` };
    if (locale === "pt") return { title: "Pedido confirmado", body: `O pedido ${orderNo} esta confirmado e em processamento.` };
    if (locale === "ar") return { title: "تم تأكيد الطلب", body: `تم تأكيد طلبك ${orderNo} وهو قيد المعالجة.` };
    if (locale === "de") return { title: "Bestellung bestatigt", body: `Bestellung ${orderNo} ist bestatigt und wird bearbeitet.` };
    if (locale === "it") return { title: "Ordine confermato", body: `L'ordine ${orderNo} e confermato ed e in elaborazione.` };
    return { title: "Order confirmed", body: `Order ${orderNo} is confirmed and being processed.` };
  }

  if (key === "property.listing.submitted") {
    if (locale === "fr") return { title: "Annonce soumise", body: "Votre annonce est en attente de verification par notre equipe." };
    if (locale === "es") return { title: "Anuncio enviado", body: "Tu anuncio esta pendiente de verificacion por nuestro equipo." };
    if (locale === "pt") return { title: "Anuncio enviado", body: "Seu anuncio esta aguardando verificacao pela nossa equipe." };
    if (locale === "ar") return { title: "تم تقديم الإعلان", body: "إعلانك في انتظار المراجعة من قِبل فريقنا." };
    if (locale === "de") return { title: "Inserat eingereicht", body: "Dein Inserat wartet auf Uberprufung durch unser Team." };
    if (locale === "it") return { title: "Annuncio inviato", body: "Il tuo annuncio e in attesa di verifica da parte del nostro team." };
    return { title: "Listing submitted", body: "Your listing is pending review by our team." };
  }

  if (key === "property.listing.approved") {
    if (locale === "fr") return { title: "Annonce approuvee", body: "Votre annonce a ete approuvee et est maintenant visible." };
    if (locale === "es") return { title: "Anuncio aprobado", body: "Tu anuncio fue aprobado y ya esta visible." };
    if (locale === "pt") return { title: "Anuncio aprovado", body: "Seu anuncio foi aprovado e ja esta visivel." };
    if (locale === "ar") return { title: "تمت الموافقة على الإعلان", body: "تمت الموافقة على إعلانك وهو مرئي الآن." };
    if (locale === "de") return { title: "Inserat genehmigt", body: "Dein Inserat wurde genehmigt und ist jetzt sichtbar." };
    if (locale === "it") return { title: "Annuncio approvato", body: "Il tuo annuncio e stato approvato ed e ora visibile." };
    return { title: "Listing approved", body: "Your listing has been approved and is now visible." };
  }

  if (key === "property.listing.rejected") {
    const reason = asNullableText(params.reason);
    if (locale === "fr") return { title: "Annonce non approuvee", body: reason || "Votre annonce necessite des modifications avant approbation." };
    if (locale === "es") return { title: "Anuncio no aprobado", body: reason || "Tu anuncio necesita cambios antes de ser aprobado." };
    if (locale === "pt") return { title: "Anuncio nao aprovado", body: reason || "Seu anuncio precisa de alteracoes antes da aprovacao." };
    if (locale === "ar") return { title: "الإعلان غير مقبول", body: reason || "يحتاج إعلانك إلى تعديلات قبل الموافقة عليه." };
    if (locale === "de") return { title: "Inserat abgelehnt", body: reason || "Dein Inserat muss vor der Genehmigung uberarbeitet werden." };
    if (locale === "it") return { title: "Annuncio non approvato", body: reason || "Il tuo annuncio necessita di modifiche prima dell'approvazione." };
    return { title: "Listing needs changes", body: reason || "Your listing requires updates before it can be approved." };
  }

  if (key === "jobs.application.submitted") {
    const role = asNullableText(params.role) || asNullableText(params.job_title) || "the position";
    if (locale === "fr") return { title: "Candidature envoyee", body: `Votre candidature pour ${role} a ete soumise avec succes.` };
    if (locale === "es") return { title: "Solicitud enviada", body: `Tu solicitud para ${role} fue enviada correctamente.` };
    if (locale === "pt") return { title: "Candidatura enviada", body: `Sua candidatura para ${role} foi enviada com sucesso.` };
    if (locale === "ar") return { title: "تم تقديم الطلب", body: `تم تقديم طلبك لوظيفة ${role} بنجاح.` };
    if (locale === "de") return { title: "Bewerbung eingereicht", body: `Deine Bewerbung fur ${role} wurde erfolgreich eingereicht.` };
    if (locale === "it") return { title: "Candidatura inviata", body: `La tua candidatura per ${role} e stata inviata con successo.` };
    return { title: "Application submitted", body: `Your application for ${role} has been submitted successfully.` };
  }

  return null;
}

function readLocalization(row: Record<string, unknown>): NotificationLocalizationPayload | null {
  const detailPayload = asObject(row.detail_payload);
  const localization = detailPayload.localization;
  if (!localization || typeof localization !== "object" || Array.isArray(localization)) {
    return null;
  }

  return localization as NotificationLocalizationPayload;
}

export function buildNotificationLocalization(input: {
  key: string;
  locale: AppLocale;
  params?: Record<string, unknown>;
  renderedTitle: string;
  renderedBody: string;
}) {
  return {
    key: input.key,
    locale: input.locale,
    params: input.params || {},
    rendered: {
      title: input.renderedTitle,
      body: input.renderedBody,
    },
  };
}

export function resolveNotificationPresentation(input: {
  row: Record<string, unknown>;
  locale: AppLocale;
}) {
  const { row, locale } = input;
  const fallbackTitle = asText(row.title, "Notification");
  const fallbackBody = asText(row.body);
  const localization = readLocalization(row);

  if (!localization?.key) {
    return { title: fallbackTitle, body: fallbackBody };
  }

  const params = asObject(localization.params);
  const rendered = localization.rendered && typeof localization.rendered === "object"
    ? localization.rendered
    : null;
  const key = localization.key as KnownNotificationLocalizationKey;
  const localized = key ? renderKnownNotification(key, locale, params) : null;

  if (localized) {
    return localized;
  }

  return {
    title: asNullableText(rendered?.title) || fallbackTitle,
    body: asNullableText(rendered?.body) || fallbackBody,
  };
}

export function resolveNotificationStoredLocale(row: Record<string, unknown>): AppLocale | null {
  const localization = readLocalization(row);
  if (!localization?.locale) return null;
  return safeLocale(localization.locale);
}
