// surface:marketplace_trust — V3-MKT-TRUST-01 instant publish (typed Pattern-A copy).
//
// Every word a seller or the owner reads about the publish gate lives here. The
// gate emits CODES (`contact_details`, `probation_listing_cap`); this module is
// the only place a code becomes a sentence, which keeps the gate free of English
// and `i18n:check:strict` green.
//
// English is the source of truth — every key exists in EN. Other locales are a
// DeepPartial merged over EN, so a missing key falls back instead of rendering
// blank. ig / yo / ha / hi are deliberately absent from the locale map (never
// machine-translated) and fall through to English.
//
// Placeholders: {brand} is filled from company config at render time, {reasons}
// with the localized reason labels, {cap} / {used} / {done} / {needed} with
// numbers from the store state, {amount} with a formatted price.
//
// TONE: a seller is told what happened and what to do next, in plain words. A
// reason names the problem; its fix names the action. No blame, no jargon.

import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/** Kept in lockstep with the gate's reason vocabulary by a test in the marketplace app. */
export type MarketplaceTrustReasonKey =
  | "prohibited_goods"
  | "counterfeit_claim"
  | "hate_speech"
  | "known_bad_image"
  | "contact_details"
  | "off_platform_payment"
  | "incomplete_listing"
  | "listing_too_long"
  | "price_invalid"
  | "image_not_first_party"
  | "plan_listing_limit"
  | "probation_listing_cap"
  | "probation_daily_cap"
  | "probation_price_cap"
  | "seller_not_active"
  | "listing_conflict"
  | "restricted_item_review"
  | "profanity"
  | "contact_suspected"
  | "scam_language"
  | "duplicate_image_other_seller"
  | "high_risk_category_probation"
  | "risk_hold_active"
  | "enforcement_hold_active"
  | "ai_flagged_scam"
  | "ai_flagged_nsfw"
  | "ai_flagged_abuse"
  | "ai_flagged_other"
  | "gate_unavailable"
  | "shared_image"
  | "duplicate_image_same_seller"
  | "urgency_language"
  | "pickup_address"
  | "thin_listing";

export type MarketplaceTrustCopy = {
  result: {
    publishedTitle: string;
    publishedBody: string;
    updatedTitle: string;
    updatedBody: string;
    heldTitle: string;
    /** "{reasons}" */
    heldBody: string;
    rejectedTitle: string;
    /** "{reasons}" */
    rejectedBody: string;
    draftTitle: string;
    draftBody: string;
    /** A live listing whose edit was not applied. */
    keptLiveTitle: string;
    /** "{reasons}" */
    keptLiveHeldBody: string;
    /** "{reasons}" */
    keptLiveRejectedBody: string;
    reasonSeparator: string;
  };
  action: {
    publishNow: string;
    publishing: string;
    publishUpdate: string;
    saveDraft: string;
    savingDraft: string;
    formIntro: string;
    /** Checkbox on the edit form of a live listing. */
    reviewOnHold: string;
    /** "Save draft" on a live listing takes it offline. */
    unpublishDraft: string;
  };
  status: {
    live: string;
    held: string;
    hidden: string;
    draft: string;
    rejected: string;
  };
  reasons: Record<MarketplaceTrustReasonKey, { label: string; fix: string }>;
  probation: {
    kicker: string;
    title: string;
    body: string;
    /** "{used} of {cap}" */
    liveListings: string;
    /** "{cap}" */
    dailyListings: string;
    /** "{amount}" */
    priceCeiling: string;
    categoryNote: string;
    graduationTitle: string;
    stepIdentity: string;
    stepIdentityDone: string;
    /** "{done} of {needed}" */
    stepOrders: string;
    /** "{done} of {needed}" */
    stepDays: string;
    verifyCta: string;
  };
  payout: {
    blockedTitle: string;
    identityBody: string;
    riskHoldBody: string;
    notActiveBody: string;
    unavailableBody: string;
    verifyCta: string;
    financeIdentityBlocked: string;
    financeRiskBlocked: string;
  };
  onboarding: {
    openedTitle: string;
    openedBody: string;
    documentsOptional: string;
    optionalBadge: string;
    reviewNote: string;
    submitLabel: string;
    heldBody: string;
    /** "{reasons}" */
    rejectedBody: string;
    handleTaken: string;
  };
  hide: {
    noticeTitle: string;
    /** "{title}", "{reasons}" */
    noticeBody: string;
    fixHint: string;
    reviewHint: string;
    reportsReason: string;
    riskReason: string;
  };
  buyer: {
    itemUnavailableTitle: string;
    itemUnavailableBody: string;
  };
  owner: {
    kicker: string;
    title: string;
    body: string;
    decisionsTitle: string;
    decisionsEmpty: string;
    hidesTitle: string;
    hidesEmpty: string;
    columnListing: string;
    columnOutcome: string;
    columnReasons: string;
    columnSource: string;
    columnWhen: string;
    outcomePublish: string;
    outcomeHold: string;
    outcomeReject: string;
    sourceEngine: string;
    sourceStaff: string;
    sourceCatalogue: string;
    sourceBackfill: string;
    sourceRescan: string;
    restore: string;
    uphold: string;
    notePlaceholder: string;
    restored: string;
    restoredBody: string;
    upheld: string;
    upheldBody: string;
    actionFailed: string;
    actionFailedBody: string;
    unavailable: string;
    /** A decision about a store opening rather than a listing. */
    subjectStore: string;
    /** The database refused a restore because the acting account is not marketplace staff. */
    staffRoleRequired: string;
    /** A seller application was not approved: its handle belongs to another store. */
    storeHandleTaken: string;
  };
};

const EN: MarketplaceTrustCopy = {
  result: {
    publishedTitle: "Your listing is live.",
    publishedBody: "Buyers can see it now. Edit it any time — a clean edit stays live.",
    updatedTitle: "Your changes are live.",
    updatedBody: "The listing stayed live while it was updated.",
    heldTitle: "Saved. One of our team takes a look first.",
    heldBody: "Your listing is not live yet: {reasons}. You will hear from us as soon as it is decided.",
    rejectedTitle: "This listing was not published.",
    rejectedBody: "Fix this and publish again: {reasons}",
    draftTitle: "Draft saved.",
    draftBody: "The listing stays private until you publish it.",
    keptLiveTitle: "Your live listing is unchanged.",
    keptLiveHeldBody: "These edits need a review before they can go live: {reasons}. Change them and publish again, or choose to send them for review.",
    keptLiveRejectedBody: "These edits were not applied. {reasons}",
    reasonSeparator: "; ",
  },
  action: {
    publishNow: "Publish now",
    publishing: "Publishing",
    publishUpdate: "Publish changes",
    saveDraft: "Save draft",
    savingDraft: "Saving draft",
    formIntro: "Listings that pass our checks go live the moment you publish. Anything that needs a second look is told to you straight away.",
    reviewOnHold: "If my edits need a review, take this listing offline until it is decided",
    unpublishDraft: "Take offline and save as draft",
  },
  status: {
    live: "Live",
    held: "In review",
    hidden: "Taken down for review",
    draft: "Draft",
    rejected: "Not published",
  },
  reasons: {
    prohibited_goods: {
      label: "Prohibited item",
      fix: "This item cannot be sold on {brand} Marketplace. Remove it from your catalogue.",
    },
    counterfeit_claim: {
      label: "Described as a copy",
      fix: "Listings described as copies, replicas or fakes are not allowed. List genuine goods and describe them as they are.",
    },
    hate_speech: {
      label: "Hateful language",
      fix: "Remove the hateful or abusive wording.",
    },
    known_bad_image: {
      label: "Blocked photo",
      fix: "One of the photos is on our blocked list. Replace it with your own photo of the item.",
    },
    contact_details: {
      label: "Contact details in the listing",
      fix: "Remove phone numbers, emails, links and messaging handles. Buyers reach you through {brand} messages, which protects both of you.",
    },
    off_platform_payment: {
      label: "Payment outside {brand}",
      fix: "Remove any request to pay by transfer, cash, crypto or outside checkout. Payment goes through {brand} so the order is protected.",
    },
    incomplete_listing: {
      label: "Listing is incomplete",
      fix: "Add a clear title, a sentence or two of description and at least one photo.",
    },
    listing_too_long: {
      label: "Text too long",
      fix: "Shorten the text and publish again. A title or name fits in 300 characters, a description or story in 20,000, and any other field in 1,000.",
    },
    price_invalid: {
      label: "Price needs fixing",
      fix: "Enter a whole-number price above zero. A previous price must be higher than the selling price.",
    },
    image_not_first_party: {
      label: "Photo not uploaded here",
      fix: "Add photos with the upload button. Links to images hosted elsewhere are not accepted.",
    },
    plan_listing_limit: {
      label: "Plan listing allowance is full",
      fix: "Remove a listing or move to a larger plan to add more.",
    },
    probation_listing_cap: {
      label: "New-store listing limit reached",
      fix: "A new store can have {cap} live listings. The limit lifts when your store graduates.",
    },
    probation_daily_cap: {
      label: "New-store daily limit reached",
      fix: "A new store can publish {cap} listings in 24 hours. Publish this one tomorrow.",
    },
    probation_price_cap: {
      label: "Above the new-store price limit",
      fix: "A new store can list items up to {amount}. The limit lifts when your store graduates.",
    },
    seller_not_active: {
      label: "Store is not active",
      fix: "Your store cannot publish right now. Contact support and we will sort it out.",
    },
    listing_conflict: {
      label: "Product handle already in use",
      fix: "That product handle belongs to another listing. Choose a different one.",
    },
    restricted_item_review: {
      label: "Restricted item check",
      fix: "This item may be restricted, so our team confirms it before it goes live.",
    },
    profanity: {
      label: "Language check",
      fix: "The wording includes strong language. Rewrite it and it publishes straight away.",
    },
    contact_suspected: {
      label: "Possible contact details",
      fix: "Something here looks like a link, a handle or a number. Remove it and the listing publishes straight away.",
    },
    scam_language: {
      label: "Wording we screen for buyer safety",
      fix: "Some phrases match patterns we check before buyers see them. Our team reviews the listing.",
    },
    duplicate_image_other_seller: {
      label: "Photo already used by another store",
      fix: "A photo matches one from another store. Use your own photos of the item.",
    },
    high_risk_category_probation: {
      label: "Category checked for new stores",
      fix: "Listings in this category are confirmed by our team while your store is new.",
    },
    risk_hold_active: {
      label: "Account review in progress",
      fix: "Our team is reviewing your account. Listings publish once the review is complete.",
    },
    enforcement_hold_active: {
      label: "Listing under review",
      fix: "This listing was taken down for review. Our team decides whether it returns.",
    },
    ai_flagged_scam: {
      label: "Flagged for a closer look",
      fix: "Our checks flagged this listing for a quick review by our team.",
    },
    ai_flagged_nsfw: {
      label: "Flagged for a closer look",
      fix: "Our checks flagged this listing for a quick review by our team.",
    },
    ai_flagged_abuse: {
      label: "Flagged for a closer look",
      fix: "Our checks flagged this listing for a quick review by our team.",
    },
    ai_flagged_other: {
      label: "Flagged for a closer look",
      fix: "Our checks flagged this listing for a quick review by our team.",
    },
    gate_unavailable: {
      label: "Checks could not finish",
      fix: "We could not complete the checks just now. Your listing is saved and queued for review.",
    },
    shared_image: {
      label: "Photo also used by another store",
      fix: "Your own photos of the item earn more trust from buyers.",
    },
    duplicate_image_same_seller: {
      label: "Photo reused across your listings",
      fix: "A fresh photo for each listing helps buyers tell them apart.",
    },
    urgency_language: {
      label: "Pressure wording",
      fix: "Clear facts sell better than pressure.",
    },
    pickup_address: {
      label: "Address in the listing",
      fix: "Buyers get delivery and pickup details at checkout.",
    },
    thin_listing: {
      label: "Listing could say more",
      fix: "A SKU, a delivery note and a lead time help buyers decide.",
    },
  },
  probation: {
    kicker: "New store",
    title: "You are selling. A few limits apply while your store is new.",
    body: "Your listings go live as soon as they pass our checks. These limits lift on their own when your store graduates.",
    liveListings: "{used} of {cap} live listings",
    dailyListings: "Up to {cap} new listings every 24 hours",
    priceCeiling: "Up to {amount} per listing",
    categoryNote: "Phones, electronics, jewellery, luxury, beauty and health listings are confirmed by our team first.",
    graduationTitle: "What lifts the limits",
    stepIdentity: "Verify your identity",
    stepIdentityDone: "Identity verified",
    stepOrders: "{done} of {needed} orders delivered",
    stepDays: "{done} of {needed} days selling",
    verifyCta: "Verify identity",
  },
  payout: {
    blockedTitle: "One step before your first payout",
    identityBody: "You can sell without it, and your earnings keep adding up. To withdraw them, verify your identity once.",
    riskHoldBody: "Payouts are paused while our team completes an account review. Your balance is safe.",
    notActiveBody: "Payouts are unavailable because the store is not active. Contact support.",
    unavailableBody: "We could not confirm payout eligibility just now. Try again in a few minutes.",
    verifyCta: "Verify identity",
    financeIdentityBlocked: "This seller has not verified their identity. A payout cannot be approved or released until they do.",
    financeRiskBlocked: "This seller is under an account review. Release the review before approving a payout.",
  },
  onboarding: {
    openedTitle: "Your store is open.",
    openedBody: "Add your first listing now. Identity is checked once, before your first payout.",
    documentsOptional: "Optional for now. You can open your store today and verify your identity before your first payout.",
    optionalBadge: "Optional",
    reviewNote: "Your store opens the moment you submit, as long as it passes our checks. Identity is checked once, before your first payout.",
    submitLabel: "Open my store",
    heldBody: "Your application is with our team. We will confirm your store shortly.",
    rejectedBody: "Change this and submit again: {reasons}",
    handleTaken: "That store handle is taken. Choose another.",
  },
  hide: {
    noticeTitle: "A listing was taken down for review",
    noticeBody: "\"{title}\" is not visible to buyers: {reasons}.",
    fixHint: "Fix it and publish again — it returns as soon as it passes our checks.",
    reviewHint: "Our team is reviewing it. Nothing was deleted, and it returns if the review clears it.",
    reportsReason: "Reported by several buyers",
    riskReason: "Held by our risk team",
  },
  buyer: {
    itemUnavailableTitle: "An item in your cart is no longer available",
    itemUnavailableBody: "It was taken down after you added it. Remove it to check out the rest.",
  },
  owner: {
    kicker: "Marketplace trust",
    title: "Publish gate",
    body: "Every decision the gate made, and every listing it took down. Restoring a listing puts it back live; upholding keeps it down.",
    decisionsTitle: "Recent decisions",
    decisionsEmpty: "No decisions recorded yet.",
    hidesTitle: "Taken down for review",
    hidesEmpty: "Nothing is waiting for you.",
    columnListing: "Listing",
    columnOutcome: "Outcome",
    columnReasons: "Reasons",
    columnSource: "Decided by",
    columnWhen: "When",
    outcomePublish: "Published",
    outcomeHold: "Held",
    outcomeReject: "Refused",
    sourceEngine: "Policy gate",
    sourceStaff: "Staff",
    sourceCatalogue: "Company catalogue",
    sourceBackfill: "Backfill",
    sourceRescan: "Re-scan",
    restore: "Restore",
    uphold: "Keep down",
    notePlaceholder: "Note for the seller (optional)",
    restored: "Listing restored.",
    restoredBody: "It is live again. The seller is told, with your note if you wrote one.",
    upheld: "Listing kept down.",
    upheldBody: "It stays out of the catalogue. The seller is told, with your note if you wrote one.",
    actionFailed: "That did not go through. Nothing was changed.",
    actionFailedBody: "The listing may already have been decided elsewhere. Reload this page and check the list.",
    unavailable: "The gate ledger is not available on this database yet.",
    subjectStore: "Store opening",
    staffRoleRequired: "The database refused this: your account is not on the marketplace staff list. Add the marketplace owner role to your account, then try again.",
    storeHandleTaken: "That store handle already belongs to another store, so nothing was approved. Ask the applicant to choose another handle.",
  },
};

const FR: DeepPartial<MarketplaceTrustCopy> = {
  result: {
    publishedTitle: "Votre annonce est en ligne.",
    publishedBody: "Les acheteurs la voient dès maintenant. Modifiez-la quand vous voulez — une modification conforme reste en ligne.",
    updatedTitle: "Vos modifications sont en ligne.",
    updatedBody: "L'annonce est restée en ligne pendant la mise à jour.",
    heldTitle: "Enregistrée. Notre équipe y jette d'abord un œil.",
    heldBody: "Votre annonce n'est pas encore en ligne : {reasons}. Nous vous prévenons dès que la décision est prise.",
    rejectedTitle: "Cette annonce n'a pas été publiée.",
    rejectedBody: "Corrigez ceci puis publiez à nouveau : {reasons}",
    draftTitle: "Brouillon enregistré.",
    draftBody: "L'annonce reste privée jusqu'à sa publication.",
    keptLiveTitle: "Votre annonce en ligne est inchangée.",
    keptLiveHeldBody: "Ces modifications doivent être vérifiées avant leur mise en ligne : {reasons}. Modifiez-les puis publiez à nouveau, ou choisissez de les envoyer en vérification.",
    keptLiveRejectedBody: "Ces modifications n'ont pas été appliquées. {reasons}",
  },
  action: {
    publishNow: "Publier",
    publishing: "Publication",
    publishUpdate: "Publier les modifications",
    saveDraft: "Enregistrer le brouillon",
    savingDraft: "Enregistrement",
    formIntro: "Les annonces conformes sont en ligne dès la publication. Ce qui demande un second regard vous est signalé tout de suite.",
    reviewOnHold: "Si mes modifications doivent être vérifiées, retirer cette annonce jusqu'à la décision",
    unpublishDraft: "Retirer et enregistrer comme brouillon",
  },
  status: { live: "En ligne", held: "En vérification", hidden: "Retirée pour vérification", draft: "Brouillon", rejected: "Non publiée" },
  reasons: {
    prohibited_goods: { label: "Article interdit", fix: "Cet article ne peut pas être vendu sur {brand} Marketplace. Retirez-le de votre catalogue." },
    counterfeit_claim: { label: "Présenté comme une copie", fix: "Les annonces présentées comme des copies, répliques ou contrefaçons sont interdites. Vendez des articles authentiques et décrivez-les tels quels." },
    hate_speech: { label: "Propos haineux", fix: "Retirez les propos haineux ou injurieux." },
    known_bad_image: { label: "Photo bloquée", fix: "L'une des photos figure sur notre liste de blocage. Remplacez-la par votre propre photo de l'article." },
    contact_details: { label: "Coordonnées dans l'annonce", fix: "Retirez numéros, e-mails, liens et identifiants de messagerie. Les acheteurs vous contactent par la messagerie {brand}, ce qui vous protège tous les deux." },
    off_platform_payment: { label: "Paiement hors {brand}", fix: "Retirez toute demande de paiement par virement, espèces, crypto ou hors du paiement en ligne. Le paiement passe par {brand} pour protéger la commande." },
    incomplete_listing: { label: "Annonce incomplète", fix: "Ajoutez un titre clair, une ou deux phrases de description et au moins une photo." },
    listing_too_long: { label: "Texte trop long", fix: "Raccourcissez le texte puis publiez à nouveau. Un titre ou un nom tient en 300 caractères, une description ou une présentation en 20 000, et tout autre champ en 1 000." },
    price_invalid: { label: "Prix à corriger", fix: "Saisissez un prix entier supérieur à zéro. L'ancien prix doit être plus élevé que le prix de vente." },
    image_not_first_party: { label: "Photo non téléversée ici", fix: "Ajoutez vos photos avec le bouton de téléversement. Les liens vers des images hébergées ailleurs ne sont pas acceptés." },
    plan_listing_limit: { label: "Quota d'annonces du forfait atteint", fix: "Retirez une annonce ou passez à un forfait supérieur." },
    probation_listing_cap: { label: "Limite d'annonces des nouvelles boutiques atteinte", fix: "Une nouvelle boutique peut avoir {cap} annonces en ligne. La limite disparaît quand votre boutique est confirmée." },
    probation_daily_cap: { label: "Limite quotidienne des nouvelles boutiques atteinte", fix: "Une nouvelle boutique peut publier {cap} annonces par 24 heures. Publiez celle-ci demain." },
    probation_price_cap: { label: "Au-dessus du plafond de prix des nouvelles boutiques", fix: "Une nouvelle boutique peut vendre des articles jusqu'à {amount}. Le plafond disparaît quand votre boutique est confirmée." },
    seller_not_active: { label: "Boutique inactive", fix: "Votre boutique ne peut pas publier pour le moment. Contactez l'assistance." },
    listing_conflict: { label: "Identifiant de produit déjà utilisé", fix: "Cet identifiant appartient à une autre annonce. Choisissez-en un autre." },
    restricted_item_review: { label: "Vérification d'article réglementé", fix: "Cet article peut être réglementé : notre équipe le confirme avant la mise en ligne." },
    profanity: { label: "Vérification du langage", fix: "Le texte contient un langage cru. Reformulez et l'annonce est publiée aussitôt." },
    contact_suspected: { label: "Coordonnées possibles", fix: "Un élément ressemble à un lien, un identifiant ou un numéro. Retirez-le et l'annonce est publiée aussitôt." },
    scam_language: { label: "Formulation contrôlée pour la sécurité des acheteurs", fix: "Certaines formulations correspondent à des schémas que nous vérifions. Notre équipe examine l'annonce." },
    duplicate_image_other_seller: { label: "Photo déjà utilisée par une autre boutique", fix: "Une photo correspond à celle d'une autre boutique. Utilisez vos propres photos de l'article." },
    high_risk_category_probation: { label: "Catégorie vérifiée pour les nouvelles boutiques", fix: "Les annonces de cette catégorie sont confirmées par notre équipe tant que votre boutique est nouvelle." },
    risk_hold_active: { label: "Examen du compte en cours", fix: "Notre équipe examine votre compte. Les annonces sont publiées une fois l'examen terminé." },
    enforcement_hold_active: { label: "Annonce en cours d'examen", fix: "Cette annonce a été retirée pour vérification. Notre équipe décide de son retour." },
    ai_flagged_scam: { label: "Signalée pour un examen", fix: "Nos contrôles ont signalé cette annonce pour un examen rapide par notre équipe." },
    ai_flagged_nsfw: { label: "Signalée pour un examen", fix: "Nos contrôles ont signalé cette annonce pour un examen rapide par notre équipe." },
    ai_flagged_abuse: { label: "Signalée pour un examen", fix: "Nos contrôles ont signalé cette annonce pour un examen rapide par notre équipe." },
    ai_flagged_other: { label: "Signalée pour un examen", fix: "Nos contrôles ont signalé cette annonce pour un examen rapide par notre équipe." },
    gate_unavailable: { label: "Contrôles inachevés", fix: "Nous n'avons pas pu terminer les contrôles. Votre annonce est enregistrée et mise en file pour vérification." },
    shared_image: { label: "Photo aussi utilisée par une autre boutique", fix: "Vos propres photos de l'article inspirent davantage confiance aux acheteurs." },
    duplicate_image_same_seller: { label: "Photo réutilisée dans vos annonces", fix: "Une photo distincte par annonce aide les acheteurs à les différencier." },
    urgency_language: { label: "Formulation pressante", fix: "Des faits clairs vendent mieux que la pression." },
    pickup_address: { label: "Adresse dans l'annonce", fix: "Les acheteurs reçoivent les informations de livraison et de retrait au paiement." },
    thin_listing: { label: "L'annonce pourrait en dire plus", fix: "Une référence, une note de livraison et un délai aident les acheteurs à décider." },
  },
  probation: {
    kicker: "Nouvelle boutique",
    title: "Vous vendez. Quelques limites s'appliquent tant que votre boutique est nouvelle.",
    body: "Vos annonces sont en ligne dès qu'elles passent nos contrôles. Ces limites disparaissent d'elles-mêmes quand votre boutique est confirmée.",
    liveListings: "{used} annonces en ligne sur {cap}",
    dailyListings: "Jusqu'à {cap} nouvelles annonces par 24 heures",
    priceCeiling: "Jusqu'à {amount} par annonce",
    categoryNote: "Les annonces de téléphones, électronique, bijoux, luxe, beauté et santé sont d'abord confirmées par notre équipe.",
    graduationTitle: "Ce qui lève les limites",
    stepIdentity: "Vérifiez votre identité",
    stepIdentityDone: "Identité vérifiée",
    stepOrders: "{done} commandes livrées sur {needed}",
    stepDays: "{done} jours de vente sur {needed}",
    verifyCta: "Vérifier mon identité",
  },
  payout: {
    blockedTitle: "Une étape avant votre premier versement",
    identityBody: "Vous pouvez vendre sans cela, et vos gains continuent de s'accumuler. Pour les retirer, vérifiez votre identité une fois.",
    riskHoldBody: "Les versements sont suspendus pendant que notre équipe termine un examen du compte. Votre solde est en sécurité.",
    notActiveBody: "Les versements sont indisponibles car la boutique n'est pas active. Contactez l'assistance.",
    unavailableBody: "Nous n'avons pas pu confirmer l'éligibilité au versement. Réessayez dans quelques minutes.",
    verifyCta: "Vérifier mon identité",
    financeIdentityBlocked: "Ce vendeur n'a pas vérifié son identité. Un versement ne peut être approuvé ni libéré avant cela.",
    financeRiskBlocked: "Ce vendeur fait l'objet d'un examen de compte. Levez l'examen avant d'approuver un versement.",
  },
  onboarding: {
    openedTitle: "Votre boutique est ouverte.",
    openedBody: "Ajoutez votre première annonce. L'identité est vérifiée une seule fois, avant votre premier versement.",
    documentsOptional: "Facultatif pour l'instant. Ouvrez votre boutique aujourd'hui et vérifiez votre identité avant votre premier versement.",
    optionalBadge: "Facultatif",
    reviewNote: "Votre boutique ouvre dès l'envoi si elle passe nos contrôles. L'identité est vérifiée une seule fois, avant votre premier versement.",
    submitLabel: "Ouvrir ma boutique",
    heldBody: "Votre demande est entre les mains de notre équipe. Nous confirmons votre boutique sous peu.",
    rejectedBody: "Modifiez ceci puis envoyez à nouveau : {reasons}",
    handleTaken: "Cet identifiant de boutique est déjà pris. Choisissez-en un autre.",
  },
  hide: {
    noticeTitle: "Une annonce a été retirée pour vérification",
    noticeBody: "« {title} » n'est plus visible par les acheteurs : {reasons}.",
    fixHint: "Corrigez-la et publiez à nouveau — elle revient dès qu'elle passe nos contrôles.",
    reviewHint: "Notre équipe l'examine. Rien n'a été supprimé, et elle revient si l'examen la valide.",
    reportsReason: "Signalée par plusieurs acheteurs",
    riskReason: "Retenue par notre équipe des risques",
  },
  buyer: {
    itemUnavailableTitle: "Un article de votre panier n'est plus disponible",
    itemUnavailableBody: "Il a été retiré après son ajout. Supprimez-le pour commander le reste.",
  },
  owner: {
    kicker: "Confiance Marketplace",
    title: "Contrôle de publication",
    body: "Chaque décision du contrôle et chaque annonce retirée. Restaurer remet l'annonce en ligne ; maintenir la laisse retirée.",
    decisionsTitle: "Décisions récentes",
    decisionsEmpty: "Aucune décision enregistrée.",
    hidesTitle: "Retirées pour vérification",
    hidesEmpty: "Rien ne vous attend.",
    columnListing: "Annonce",
    columnOutcome: "Résultat",
    columnReasons: "Motifs",
    columnSource: "Décidé par",
    columnWhen: "Quand",
    outcomePublish: "Publiée",
    outcomeHold: "Retenue",
    outcomeReject: "Refusée",
    sourceEngine: "Contrôle automatique",
    sourceStaff: "Équipe",
    sourceCatalogue: "Catalogue de l'entreprise",
    sourceBackfill: "Reprise",
    sourceRescan: "Nouvelle analyse",
    restore: "Restaurer",
    uphold: "Maintenir retirée",
    notePlaceholder: "Note pour le vendeur (facultatif)",
    restored: "Annonce restaurée.",
    restoredBody: "Elle est de nouveau en ligne. Le vendeur est prévenu, avec votre note si vous en avez écrit une.",
    upheld: "Annonce maintenue retirée.",
    upheldBody: "Elle reste hors du catalogue. Le vendeur est prévenu, avec votre note si vous en avez écrit une.",
    actionFailed: "L'action n'a pas abouti. Rien n'a été modifié.",
    actionFailedBody: "L'annonce a peut-être déjà été traitée ailleurs. Rechargez cette page et vérifiez la liste.",
    unavailable: "Le registre du contrôle n'est pas encore disponible sur cette base.",
    subjectStore: "Ouverture de boutique",
    staffRoleRequired: "La base de données a refusé : votre compte ne figure pas dans l'équipe Marketplace. Ajoutez le rôle de propriétaire Marketplace à votre compte, puis réessayez.",
    storeHandleTaken: "Cet identifiant de boutique appartient déjà à une autre boutique : rien n'a été approuvé. Demandez au candidat d'en choisir un autre.",
  },
};

const ES: DeepPartial<MarketplaceTrustCopy> = {
  result: {
    publishedTitle: "Tu anuncio está publicado.",
    publishedBody: "Los compradores ya lo ven. Edítalo cuando quieras: una edición correcta sigue publicada.",
    updatedTitle: "Tus cambios están publicados.",
    updatedBody: "El anuncio siguió publicado mientras se actualizaba.",
    heldTitle: "Guardado. Nuestro equipo lo revisa primero.",
    heldBody: "Tu anuncio aún no está publicado: {reasons}. Te avisamos en cuanto se decida.",
    rejectedTitle: "Este anuncio no se publicó.",
    rejectedBody: "Corrige esto y vuelve a publicar: {reasons}",
    draftTitle: "Borrador guardado.",
    draftBody: "El anuncio sigue privado hasta que lo publiques.",
    keptLiveTitle: "Tu anuncio publicado no ha cambiado.",
    keptLiveHeldBody: "Estos cambios necesitan revisión antes de publicarse: {reasons}. Modifícalos y vuelve a publicar, o elige enviarlos a revisión.",
    keptLiveRejectedBody: "Estos cambios no se aplicaron. {reasons}",
  },
  action: {
    publishNow: "Publicar ahora",
    publishing: "Publicando",
    publishUpdate: "Publicar cambios",
    saveDraft: "Guardar borrador",
    savingDraft: "Guardando borrador",
    formIntro: "Los anuncios que pasan nuestras comprobaciones se publican al instante. Lo que necesita una segunda mirada se te indica enseguida.",
    reviewOnHold: "Si mis cambios necesitan revisión, retirar este anuncio hasta que se decida",
    unpublishDraft: "Retirar y guardar como borrador",
  },
  status: { live: "Publicado", held: "En revisión", hidden: "Retirado para revisión", draft: "Borrador", rejected: "No publicado" },
  reasons: {
    prohibited_goods: { label: "Artículo prohibido", fix: "Este artículo no puede venderse en {brand} Marketplace. Retíralo de tu catálogo." },
    counterfeit_claim: { label: "Descrito como copia", fix: "No se permiten anuncios descritos como copias, réplicas o falsificaciones. Vende artículos auténticos y descríbelos tal como son." },
    hate_speech: { label: "Lenguaje de odio", fix: "Elimina el texto ofensivo o de odio." },
    known_bad_image: { label: "Foto bloqueada", fix: "Una de las fotos está en nuestra lista de bloqueo. Sustitúyela por tu propia foto del artículo." },
    contact_details: { label: "Datos de contacto en el anuncio", fix: "Elimina teléfonos, correos, enlaces y usuarios de mensajería. Los compradores te escriben por los mensajes de {brand}, lo que os protege a ambos." },
    off_platform_payment: { label: "Pago fuera de {brand}", fix: "Elimina cualquier petición de pago por transferencia, efectivo, cripto o fuera del pago en línea. El pago pasa por {brand} para proteger el pedido." },
    incomplete_listing: { label: "Anuncio incompleto", fix: "Añade un título claro, una o dos frases de descripción y al menos una foto." },
    listing_too_long: { label: "Texto demasiado largo", fix: "Acorta el texto y publica de nuevo. Un título o un nombre caben en 300 caracteres, una descripción o una historia en 20.000, y cualquier otro campo en 1.000." },
    price_invalid: { label: "Precio por corregir", fix: "Introduce un precio entero mayor que cero. El precio anterior debe ser superior al de venta." },
    image_not_first_party: { label: "Foto no subida aquí", fix: "Añade las fotos con el botón de subida. No se aceptan enlaces a imágenes alojadas en otro sitio." },
    plan_listing_limit: { label: "Cupo de anuncios del plan completo", fix: "Retira un anuncio o pasa a un plan mayor." },
    probation_listing_cap: { label: "Límite de anuncios de tienda nueva alcanzado", fix: "Una tienda nueva puede tener {cap} anuncios publicados. El límite desaparece cuando tu tienda se consolida." },
    probation_daily_cap: { label: "Límite diario de tienda nueva alcanzado", fix: "Una tienda nueva puede publicar {cap} anuncios cada 24 horas. Publica este mañana." },
    probation_price_cap: { label: "Por encima del precio máximo de tienda nueva", fix: "Una tienda nueva puede vender artículos de hasta {amount}. El límite desaparece cuando tu tienda se consolida." },
    seller_not_active: { label: "Tienda inactiva", fix: "Tu tienda no puede publicar ahora. Contacta con soporte." },
    listing_conflict: { label: "Identificador de producto en uso", fix: "Ese identificador pertenece a otro anuncio. Elige otro." },
    restricted_item_review: { label: "Comprobación de artículo restringido", fix: "Este artículo puede estar restringido; nuestro equipo lo confirma antes de publicarlo." },
    profanity: { label: "Revisión del lenguaje", fix: "El texto incluye lenguaje fuerte. Reescríbelo y se publica al momento." },
    contact_suspected: { label: "Posibles datos de contacto", fix: "Algo parece un enlace, un usuario o un número. Elimínalo y el anuncio se publica al momento." },
    scam_language: { label: "Texto que revisamos por seguridad del comprador", fix: "Algunas frases coinciden con patrones que comprobamos. Nuestro equipo revisa el anuncio." },
    duplicate_image_other_seller: { label: "Foto ya usada por otra tienda", fix: "Una foto coincide con la de otra tienda. Usa tus propias fotos del artículo." },
    high_risk_category_probation: { label: "Categoría revisada para tiendas nuevas", fix: "Los anuncios de esta categoría los confirma nuestro equipo mientras tu tienda es nueva." },
    risk_hold_active: { label: "Revisión de cuenta en curso", fix: "Nuestro equipo está revisando tu cuenta. Los anuncios se publican al terminar la revisión." },
    enforcement_hold_active: { label: "Anuncio en revisión", fix: "Este anuncio se retiró para revisión. Nuestro equipo decide si vuelve." },
    ai_flagged_scam: { label: "Marcado para revisión", fix: "Nuestras comprobaciones marcaron este anuncio para una revisión rápida del equipo." },
    ai_flagged_nsfw: { label: "Marcado para revisión", fix: "Nuestras comprobaciones marcaron este anuncio para una revisión rápida del equipo." },
    ai_flagged_abuse: { label: "Marcado para revisión", fix: "Nuestras comprobaciones marcaron este anuncio para una revisión rápida del equipo." },
    ai_flagged_other: { label: "Marcado para revisión", fix: "Nuestras comprobaciones marcaron este anuncio para una revisión rápida del equipo." },
    gate_unavailable: { label: "Las comprobaciones no terminaron", fix: "No pudimos completar las comprobaciones. Tu anuncio está guardado y en cola para revisión." },
    shared_image: { label: "Foto usada también por otra tienda", fix: "Tus propias fotos del artículo generan más confianza en los compradores." },
    duplicate_image_same_seller: { label: "Foto repetida en tus anuncios", fix: "Una foto distinta por anuncio ayuda a diferenciarlos." },
    urgency_language: { label: "Texto con presión", fix: "Los datos claros venden mejor que la presión." },
    pickup_address: { label: "Dirección en el anuncio", fix: "Los compradores reciben los datos de entrega y recogida al pagar." },
    thin_listing: { label: "El anuncio podría decir más", fix: "Una referencia, una nota de entrega y un plazo ayudan a decidir." },
  },
  probation: {
    kicker: "Tienda nueva",
    title: "Ya vendes. Se aplican algunos límites mientras tu tienda es nueva.",
    body: "Tus anuncios se publican en cuanto pasan nuestras comprobaciones. Los límites desaparecen solos cuando tu tienda se consolida.",
    liveListings: "{used} de {cap} anuncios publicados",
    dailyListings: "Hasta {cap} anuncios nuevos cada 24 horas",
    priceCeiling: "Hasta {amount} por anuncio",
    categoryNote: "Los anuncios de teléfonos, electrónica, joyería, lujo, belleza y salud los confirma primero nuestro equipo.",
    graduationTitle: "Qué elimina los límites",
    stepIdentity: "Verifica tu identidad",
    stepIdentityDone: "Identidad verificada",
    stepOrders: "{done} de {needed} pedidos entregados",
    stepDays: "{done} de {needed} días vendiendo",
    verifyCta: "Verificar identidad",
  },
  payout: {
    blockedTitle: "Un paso antes de tu primer pago",
    identityBody: "Puedes vender sin ello y tus ganancias se siguen acumulando. Para retirarlas, verifica tu identidad una vez.",
    riskHoldBody: "Los pagos están en pausa mientras nuestro equipo completa una revisión de la cuenta. Tu saldo está seguro.",
    notActiveBody: "Los pagos no están disponibles porque la tienda no está activa. Contacta con soporte.",
    unavailableBody: "No pudimos confirmar si puedes cobrar. Inténtalo de nuevo en unos minutos.",
    verifyCta: "Verificar identidad",
    financeIdentityBlocked: "Este vendedor no ha verificado su identidad. No se puede aprobar ni liberar un pago hasta que lo haga.",
    financeRiskBlocked: "Este vendedor está en revisión de cuenta. Libera la revisión antes de aprobar un pago.",
  },
  onboarding: {
    openedTitle: "Tu tienda está abierta.",
    openedBody: "Añade tu primer anuncio. La identidad se comprueba una vez, antes de tu primer pago.",
    documentsOptional: "Opcional por ahora. Abre tu tienda hoy y verifica tu identidad antes de tu primer pago.",
    optionalBadge: "Opcional",
    reviewNote: "Tu tienda abre en cuanto envías la solicitud, si pasa nuestras comprobaciones. La identidad se comprueba una vez, antes de tu primer pago.",
    submitLabel: "Abrir mi tienda",
    heldBody: "Tu solicitud está con nuestro equipo. Confirmamos tu tienda en breve.",
    rejectedBody: "Cambia esto y envíala de nuevo: {reasons}",
    handleTaken: "Ese identificador de tienda ya existe. Elige otro.",
  },
  hide: {
    noticeTitle: "Un anuncio se retiró para revisión",
    noticeBody: "«{title}» no es visible para los compradores: {reasons}.",
    fixHint: "Corrígelo y vuelve a publicar: regresa en cuanto pase nuestras comprobaciones.",
    reviewHint: "Nuestro equipo lo está revisando. No se borró nada y vuelve si la revisión lo aprueba.",
    reportsReason: "Denunciado por varios compradores",
    riskReason: "Retenido por nuestro equipo de riesgos",
  },
  buyer: {
    itemUnavailableTitle: "Un artículo de tu carrito ya no está disponible",
    itemUnavailableBody: "Se retiró después de que lo añadieras. Quítalo para comprar el resto.",
  },
  owner: {
    kicker: "Confianza de Marketplace",
    title: "Control de publicación",
    body: "Cada decisión del control y cada anuncio retirado. Restaurar lo vuelve a publicar; mantener lo deja retirado.",
    decisionsTitle: "Decisiones recientes",
    decisionsEmpty: "Aún no hay decisiones registradas.",
    hidesTitle: "Retirados para revisión",
    hidesEmpty: "No hay nada pendiente.",
    columnListing: "Anuncio",
    columnOutcome: "Resultado",
    columnReasons: "Motivos",
    columnSource: "Decidido por",
    columnWhen: "Cuándo",
    outcomePublish: "Publicado",
    outcomeHold: "Retenido",
    outcomeReject: "Rechazado",
    sourceEngine: "Control automático",
    sourceStaff: "Equipo",
    sourceCatalogue: "Catálogo de la empresa",
    sourceBackfill: "Recuperación",
    sourceRescan: "Nuevo análisis",
    restore: "Restaurar",
    uphold: "Mantener retirado",
    notePlaceholder: "Nota para el vendedor (opcional)",
    restored: "Anuncio restaurado.",
    restoredBody: "Vuelve a estar publicado. Se avisa al vendedor, con tu nota si escribiste una.",
    upheld: "Anuncio mantenido retirado.",
    upheldBody: "Sigue fuera del catálogo. Se avisa al vendedor, con tu nota si escribiste una.",
    actionFailed: "No se completó. No se cambió nada.",
    actionFailedBody: "Es posible que el anuncio ya se haya resuelto en otro lugar. Recarga esta página y revisa la lista.",
    unavailable: "El registro del control aún no está disponible en esta base de datos.",
    subjectStore: "Apertura de tienda",
    staffRoleRequired: "La base de datos lo rechazó: tu cuenta no está en el equipo de Marketplace. Añade el rol de propietario de Marketplace a tu cuenta y vuelve a intentarlo.",
    storeHandleTaken: "Ese identificador de tienda ya pertenece a otra tienda, así que no se aprobó nada. Pide al solicitante que elija otro.",
  },
};

const PT: DeepPartial<MarketplaceTrustCopy> = {
  result: {
    publishedTitle: "O seu anúncio está no ar.",
    publishedBody: "Os compradores já o veem. Edite quando quiser — uma edição correta continua no ar.",
    updatedTitle: "As suas alterações estão no ar.",
    updatedBody: "O anúncio continuou no ar enquanto era atualizado.",
    heldTitle: "Guardado. A nossa equipa vê primeiro.",
    heldBody: "O seu anúncio ainda não está no ar: {reasons}. Avisamos assim que houver decisão.",
    rejectedTitle: "Este anúncio não foi publicado.",
    rejectedBody: "Corrija isto e publique de novo: {reasons}",
    draftTitle: "Rascunho guardado.",
    draftBody: "O anúncio fica privado até o publicar.",
    keptLiveTitle: "O seu anúncio no ar não foi alterado.",
    keptLiveHeldBody: "Estas alterações precisam de análise antes de ficarem no ar: {reasons}. Altere-as e publique de novo, ou escolha enviá-las para análise.",
    keptLiveRejectedBody: "Estas alterações não foram aplicadas. {reasons}",
  },
  action: {
    publishNow: "Publicar agora",
    publishing: "A publicar",
    publishUpdate: "Publicar alterações",
    saveDraft: "Guardar rascunho",
    savingDraft: "A guardar rascunho",
    formIntro: "Os anúncios que passam nas nossas verificações ficam no ar assim que publica. O que precisa de um segundo olhar é-lhe dito de imediato.",
    reviewOnHold: "Se as minhas alterações precisarem de análise, retirar este anúncio até haver decisão",
    unpublishDraft: "Retirar e guardar como rascunho",
  },
  status: { live: "No ar", held: "Em análise", hidden: "Retirado para análise", draft: "Rascunho", rejected: "Não publicado" },
  reasons: {
    prohibited_goods: { label: "Artigo proibido", fix: "Este artigo não pode ser vendido no {brand} Marketplace. Retire-o do seu catálogo." },
    counterfeit_claim: { label: "Descrito como cópia", fix: "Não são permitidos anúncios descritos como cópias, réplicas ou falsificações. Venda artigos genuínos e descreva-os como são." },
    hate_speech: { label: "Linguagem de ódio", fix: "Remova o texto ofensivo ou de ódio." },
    known_bad_image: { label: "Foto bloqueada", fix: "Uma das fotos está na nossa lista de bloqueio. Substitua-a por uma foto sua do artigo." },
    contact_details: { label: "Contactos no anúncio", fix: "Remova telefones, e-mails, ligações e contas de mensagens. Os compradores falam consigo pelas mensagens {brand}, o que protege ambos." },
    off_platform_payment: { label: "Pagamento fora do {brand}", fix: "Remova qualquer pedido de pagamento por transferência, dinheiro, cripto ou fora do checkout. O pagamento passa pelo {brand} para proteger a encomenda." },
    incomplete_listing: { label: "Anúncio incompleto", fix: "Adicione um título claro, uma ou duas frases de descrição e pelo menos uma foto." },
    listing_too_long: { label: "Texto demasiado longo", fix: "Encurte o texto e publique novamente. Um título ou nome cabe em 300 caracteres, uma descrição ou história em 20 000, e qualquer outro campo em 1000." },
    price_invalid: { label: "Preço por corrigir", fix: "Indique um preço inteiro acima de zero. O preço anterior tem de ser superior ao preço de venda." },
    image_not_first_party: { label: "Foto não carregada aqui", fix: "Adicione fotos com o botão de carregamento. Não são aceites ligações para imagens alojadas noutro sítio." },
    plan_listing_limit: { label: "Limite de anúncios do plano atingido", fix: "Remova um anúncio ou mude para um plano maior." },
    probation_listing_cap: { label: "Limite de anúncios de loja nova atingido", fix: "Uma loja nova pode ter {cap} anúncios no ar. O limite desaparece quando a sua loja é confirmada." },
    probation_daily_cap: { label: "Limite diário de loja nova atingido", fix: "Uma loja nova pode publicar {cap} anúncios em 24 horas. Publique este amanhã." },
    probation_price_cap: { label: "Acima do preço máximo de loja nova", fix: "Uma loja nova pode vender artigos até {amount}. O limite desaparece quando a sua loja é confirmada." },
    seller_not_active: { label: "Loja inativa", fix: "A sua loja não pode publicar agora. Contacte o apoio." },
    listing_conflict: { label: "Identificador de produto já usado", fix: "Esse identificador pertence a outro anúncio. Escolha outro." },
    restricted_item_review: { label: "Verificação de artigo restrito", fix: "Este artigo pode ser restrito; a nossa equipa confirma-o antes de ficar no ar." },
    profanity: { label: "Verificação de linguagem", fix: "O texto tem linguagem forte. Reescreva e é publicado de imediato." },
    contact_suspected: { label: "Possíveis contactos", fix: "Algo parece uma ligação, uma conta ou um número. Remova e o anúncio é publicado de imediato." },
    scam_language: { label: "Texto que verificamos pela segurança do comprador", fix: "Algumas frases coincidem com padrões que verificamos. A nossa equipa analisa o anúncio." },
    duplicate_image_other_seller: { label: "Foto já usada por outra loja", fix: "Uma foto coincide com a de outra loja. Use as suas próprias fotos do artigo." },
    high_risk_category_probation: { label: "Categoria verificada para lojas novas", fix: "Os anúncios desta categoria são confirmados pela nossa equipa enquanto a sua loja é nova." },
    risk_hold_active: { label: "Análise de conta em curso", fix: "A nossa equipa está a analisar a sua conta. Os anúncios são publicados quando a análise terminar." },
    enforcement_hold_active: { label: "Anúncio em análise", fix: "Este anúncio foi retirado para análise. A nossa equipa decide se regressa." },
    ai_flagged_scam: { label: "Assinalado para análise", fix: "As nossas verificações assinalaram este anúncio para uma análise rápida da equipa." },
    ai_flagged_nsfw: { label: "Assinalado para análise", fix: "As nossas verificações assinalaram este anúncio para uma análise rápida da equipa." },
    ai_flagged_abuse: { label: "Assinalado para análise", fix: "As nossas verificações assinalaram este anúncio para uma análise rápida da equipa." },
    ai_flagged_other: { label: "Assinalado para análise", fix: "As nossas verificações assinalaram este anúncio para uma análise rápida da equipa." },
    gate_unavailable: { label: "As verificações não terminaram", fix: "Não foi possível concluir as verificações. O seu anúncio está guardado e em fila para análise." },
    shared_image: { label: "Foto também usada por outra loja", fix: "As suas próprias fotos do artigo geram mais confiança nos compradores." },
    duplicate_image_same_seller: { label: "Foto repetida nos seus anúncios", fix: "Uma foto diferente por anúncio ajuda a distingui-los." },
    urgency_language: { label: "Texto com pressão", fix: "Factos claros vendem melhor do que pressão." },
    pickup_address: { label: "Morada no anúncio", fix: "Os compradores recebem os dados de entrega e recolha no checkout." },
    thin_listing: { label: "O anúncio podia dizer mais", fix: "Uma referência, uma nota de entrega e um prazo ajudam a decidir." },
  },
  probation: {
    kicker: "Loja nova",
    title: "Já está a vender. Aplicam-se alguns limites enquanto a sua loja é nova.",
    body: "Os seus anúncios ficam no ar assim que passam nas nossas verificações. Os limites desaparecem sozinhos quando a sua loja é confirmada.",
    liveListings: "{used} de {cap} anúncios no ar",
    dailyListings: "Até {cap} anúncios novos a cada 24 horas",
    priceCeiling: "Até {amount} por anúncio",
    categoryNote: "Anúncios de telemóveis, eletrónica, joalharia, luxo, beleza e saúde são confirmados primeiro pela nossa equipa.",
    graduationTitle: "O que remove os limites",
    stepIdentity: "Verifique a sua identidade",
    stepIdentityDone: "Identidade verificada",
    stepOrders: "{done} de {needed} encomendas entregues",
    stepDays: "{done} de {needed} dias a vender",
    verifyCta: "Verificar identidade",
  },
  payout: {
    blockedTitle: "Um passo antes do seu primeiro pagamento",
    identityBody: "Pode vender sem isso, e os seus ganhos continuam a acumular. Para os levantar, verifique a sua identidade uma vez.",
    riskHoldBody: "Os pagamentos estão em pausa enquanto a nossa equipa conclui uma análise da conta. O seu saldo está seguro.",
    notActiveBody: "Os pagamentos estão indisponíveis porque a loja não está ativa. Contacte o apoio.",
    unavailableBody: "Não foi possível confirmar a elegibilidade para pagamento. Tente de novo dentro de minutos.",
    verifyCta: "Verificar identidade",
    financeIdentityBlocked: "Este vendedor não verificou a identidade. Um pagamento não pode ser aprovado nem libertado até o fazer.",
    financeRiskBlocked: "Este vendedor está em análise de conta. Liberte a análise antes de aprovar um pagamento.",
  },
  onboarding: {
    openedTitle: "A sua loja está aberta.",
    openedBody: "Adicione o seu primeiro anúncio. A identidade é verificada uma vez, antes do seu primeiro pagamento.",
    documentsOptional: "Opcional por agora. Abra a sua loja hoje e verifique a identidade antes do primeiro pagamento.",
    optionalBadge: "Opcional",
    reviewNote: "A sua loja abre assim que submeter, desde que passe nas nossas verificações. A identidade é verificada uma vez, antes do primeiro pagamento.",
    submitLabel: "Abrir a minha loja",
    heldBody: "A sua candidatura está com a nossa equipa. Confirmamos a sua loja em breve.",
    rejectedBody: "Altere isto e envie de novo: {reasons}",
    handleTaken: "Esse identificador de loja já existe. Escolha outro.",
  },
  hide: {
    noticeTitle: "Um anúncio foi retirado para análise",
    noticeBody: "«{title}» não está visível para os compradores: {reasons}.",
    fixHint: "Corrija e publique de novo — regressa assim que passar nas nossas verificações.",
    reviewHint: "A nossa equipa está a analisá-lo. Nada foi apagado, e regressa se a análise o aprovar.",
    reportsReason: "Denunciado por vários compradores",
    riskReason: "Retido pela nossa equipa de risco",
  },
  buyer: {
    itemUnavailableTitle: "Um artigo do seu carrinho já não está disponível",
    itemUnavailableBody: "Foi retirado depois de o adicionar. Remova-o para finalizar o resto.",
  },
  owner: {
    kicker: "Confiança do Marketplace",
    title: "Controlo de publicação",
    body: "Todas as decisões do controlo e todos os anúncios retirados. Restaurar volta a pô-lo no ar; manter deixa-o retirado.",
    decisionsTitle: "Decisões recentes",
    decisionsEmpty: "Ainda não há decisões registadas.",
    hidesTitle: "Retirados para análise",
    hidesEmpty: "Nada à sua espera.",
    columnListing: "Anúncio",
    columnOutcome: "Resultado",
    columnReasons: "Motivos",
    columnSource: "Decidido por",
    columnWhen: "Quando",
    outcomePublish: "Publicado",
    outcomeHold: "Retido",
    outcomeReject: "Recusado",
    sourceEngine: "Controlo automático",
    sourceStaff: "Equipa",
    sourceCatalogue: "Catálogo da empresa",
    sourceBackfill: "Recuperação",
    sourceRescan: "Nova análise",
    restore: "Restaurar",
    uphold: "Manter retirado",
    notePlaceholder: "Nota para o vendedor (opcional)",
    restored: "Anúncio restaurado.",
    restoredBody: "Está novamente publicado. O vendedor é avisado, com a sua nota se a escreveu.",
    upheld: "Anúncio mantido retirado.",
    upheldBody: "Continua fora do catálogo. O vendedor é avisado, com a sua nota se a escreveu.",
    actionFailed: "Não foi concluído. Nada foi alterado.",
    actionFailedBody: "O anúncio pode já ter sido decidido noutro local. Recarregue esta página e verifique a lista.",
    unavailable: "O registo do controlo ainda não está disponível nesta base de dados.",
    subjectStore: "Abertura de loja",
    staffRoleRequired: "A base de dados recusou: a sua conta não está na equipa do Marketplace. Adicione a função de proprietário do Marketplace à sua conta e tente de novo.",
    storeHandleTaken: "Esse identificador de loja já pertence a outra loja, por isso nada foi aprovado. Peça ao candidato que escolha outro.",
  },
};

const DE: DeepPartial<MarketplaceTrustCopy> = {
  result: {
    publishedTitle: "Ihr Angebot ist online.",
    publishedBody: "Käufer sehen es ab sofort. Bearbeiten Sie es jederzeit – eine einwandfreie Änderung bleibt online.",
    updatedTitle: "Ihre Änderungen sind online.",
    updatedBody: "Das Angebot blieb während der Aktualisierung online.",
    heldTitle: "Gespeichert. Unser Team sieht es sich zuerst an.",
    heldBody: "Ihr Angebot ist noch nicht online: {reasons}. Wir melden uns, sobald entschieden ist.",
    rejectedTitle: "Dieses Angebot wurde nicht veröffentlicht.",
    rejectedBody: "Beheben Sie das und veröffentlichen Sie erneut: {reasons}",
    draftTitle: "Entwurf gespeichert.",
    draftBody: "Das Angebot bleibt privat, bis Sie es veröffentlichen.",
    keptLiveTitle: "Ihr Online-Angebot ist unverändert.",
    keptLiveHeldBody: "Diese Änderungen müssen geprüft werden, bevor sie online gehen: {reasons}. Ändern Sie sie und veröffentlichen Sie erneut, oder senden Sie sie zur Prüfung.",
    keptLiveRejectedBody: "Diese Änderungen wurden nicht übernommen. {reasons}",
  },
  action: {
    publishNow: "Jetzt veröffentlichen",
    publishing: "Wird veröffentlicht",
    publishUpdate: "Änderungen veröffentlichen",
    saveDraft: "Entwurf speichern",
    savingDraft: "Entwurf wird gespeichert",
    formIntro: "Angebote, die unsere Prüfungen bestehen, sind sofort online. Was einen zweiten Blick braucht, erfahren Sie direkt.",
    reviewOnHold: "Wenn meine Änderungen geprüft werden müssen, dieses Angebot bis zur Entscheidung offline nehmen",
    unpublishDraft: "Offline nehmen und als Entwurf speichern",
  },
  status: { live: "Online", held: "In Prüfung", hidden: "Zur Prüfung offline genommen", draft: "Entwurf", rejected: "Nicht veröffentlicht" },
  reasons: {
    prohibited_goods: { label: "Verbotener Artikel", fix: "Dieser Artikel darf auf dem {brand} Marketplace nicht verkauft werden. Entfernen Sie ihn aus Ihrem Katalog." },
    counterfeit_claim: { label: "Als Kopie beschrieben", fix: "Angebote, die als Kopien, Repliken oder Fälschungen beschrieben sind, sind nicht erlaubt. Bieten Sie Originalware an und beschreiben Sie sie zutreffend." },
    hate_speech: { label: "Hasssprache", fix: "Entfernen Sie die hasserfüllten oder beleidigenden Formulierungen." },
    known_bad_image: { label: "Gesperrtes Foto", fix: "Eines der Fotos steht auf unserer Sperrliste. Ersetzen Sie es durch ein eigenes Foto des Artikels." },
    contact_details: { label: "Kontaktdaten im Angebot", fix: "Entfernen Sie Telefonnummern, E-Mails, Links und Messenger-Namen. Käufer erreichen Sie über {brand}-Nachrichten – das schützt beide Seiten." },
    off_platform_payment: { label: "Zahlung außerhalb von {brand}", fix: "Entfernen Sie jede Bitte um Zahlung per Überweisung, bar, Krypto oder außerhalb des Checkouts. Die Zahlung läuft über {brand}, damit die Bestellung geschützt ist." },
    incomplete_listing: { label: "Angebot unvollständig", fix: "Ergänzen Sie einen klaren Titel, ein bis zwei Sätze Beschreibung und mindestens ein Foto." },
    listing_too_long: { label: "Text zu lang", fix: "Kürzen Sie den Text und veröffentlichen Sie erneut. Ein Titel oder Name hat bis zu 300 Zeichen, eine Beschreibung oder Geschichte bis zu 20.000 und jedes andere Feld bis zu 1.000." },
    price_invalid: { label: "Preis korrigieren", fix: "Geben Sie einen ganzzahligen Preis über null ein. Der frühere Preis muss über dem Verkaufspreis liegen." },
    image_not_first_party: { label: "Foto nicht hier hochgeladen", fix: "Fügen Sie Fotos über die Upload-Schaltfläche hinzu. Links zu extern gehosteten Bildern werden nicht akzeptiert." },
    plan_listing_limit: { label: "Angebotskontingent des Tarifs ausgeschöpft", fix: "Entfernen Sie ein Angebot oder wechseln Sie in einen größeren Tarif." },
    probation_listing_cap: { label: "Angebotslimit für neue Shops erreicht", fix: "Ein neuer Shop kann {cap} Angebote online haben. Das Limit entfällt, sobald Ihr Shop etabliert ist." },
    probation_daily_cap: { label: "Tageslimit für neue Shops erreicht", fix: "Ein neuer Shop kann {cap} Angebote in 24 Stunden veröffentlichen. Veröffentlichen Sie dieses morgen." },
    probation_price_cap: { label: "Über dem Preislimit für neue Shops", fix: "Ein neuer Shop kann Artikel bis {amount} anbieten. Das Limit entfällt, sobald Ihr Shop etabliert ist." },
    seller_not_active: { label: "Shop nicht aktiv", fix: "Ihr Shop kann derzeit nicht veröffentlichen. Wenden Sie sich an den Support." },
    listing_conflict: { label: "Produktkennung bereits vergeben", fix: "Diese Kennung gehört zu einem anderen Angebot. Wählen Sie eine andere." },
    restricted_item_review: { label: "Prüfung auf beschränkte Artikel", fix: "Dieser Artikel könnte beschränkt sein; unser Team bestätigt ihn vor der Veröffentlichung." },
    profanity: { label: "Sprachprüfung", fix: "Der Text enthält derbe Sprache. Formulieren Sie um, dann wird sofort veröffentlicht." },
    contact_suspected: { label: "Mögliche Kontaktdaten", fix: "Etwas sieht nach Link, Nutzername oder Nummer aus. Entfernen Sie es, dann wird sofort veröffentlicht." },
    scam_language: { label: "Formulierung, die wir zum Käuferschutz prüfen", fix: "Einige Formulierungen entsprechen Mustern, die wir prüfen. Unser Team sieht sich das Angebot an." },
    duplicate_image_other_seller: { label: "Foto wird bereits von einem anderen Shop genutzt", fix: "Ein Foto stimmt mit dem eines anderen Shops überein. Verwenden Sie eigene Fotos des Artikels." },
    high_risk_category_probation: { label: "Kategorie wird für neue Shops geprüft", fix: "Angebote dieser Kategorie bestätigt unser Team, solange Ihr Shop neu ist." },
    risk_hold_active: { label: "Kontoprüfung läuft", fix: "Unser Team prüft Ihr Konto. Angebote werden nach Abschluss der Prüfung veröffentlicht." },
    enforcement_hold_active: { label: "Angebot in Prüfung", fix: "Dieses Angebot wurde zur Prüfung offline genommen. Unser Team entscheidet, ob es zurückkehrt." },
    ai_flagged_scam: { label: "Zur genaueren Prüfung markiert", fix: "Unsere Prüfungen haben dieses Angebot für eine kurze Prüfung durch unser Team markiert." },
    ai_flagged_nsfw: { label: "Zur genaueren Prüfung markiert", fix: "Unsere Prüfungen haben dieses Angebot für eine kurze Prüfung durch unser Team markiert." },
    ai_flagged_abuse: { label: "Zur genaueren Prüfung markiert", fix: "Unsere Prüfungen haben dieses Angebot für eine kurze Prüfung durch unser Team markiert." },
    ai_flagged_other: { label: "Zur genaueren Prüfung markiert", fix: "Unsere Prüfungen haben dieses Angebot für eine kurze Prüfung durch unser Team markiert." },
    gate_unavailable: { label: "Prüfungen nicht abgeschlossen", fix: "Die Prüfungen konnten gerade nicht abgeschlossen werden. Ihr Angebot ist gespeichert und zur Prüfung eingereiht." },
    shared_image: { label: "Foto wird auch von einem anderen Shop genutzt", fix: "Eigene Fotos des Artikels schaffen bei Käufern mehr Vertrauen." },
    duplicate_image_same_seller: { label: "Foto in mehreren Ihrer Angebote", fix: "Ein eigenes Foto je Angebot hilft Käufern, sie zu unterscheiden." },
    urgency_language: { label: "Drängende Formulierung", fix: "Klare Fakten verkaufen besser als Druck." },
    pickup_address: { label: "Adresse im Angebot", fix: "Käufer erhalten Liefer- und Abholdaten im Checkout." },
    thin_listing: { label: "Das Angebot könnte mehr sagen", fix: "Artikelnummer, Lieferhinweis und Lieferzeit helfen bei der Entscheidung." },
  },
  probation: {
    kicker: "Neuer Shop",
    title: "Sie verkaufen. Solange Ihr Shop neu ist, gelten einige Limits.",
    body: "Ihre Angebote sind online, sobald sie unsere Prüfungen bestehen. Die Limits entfallen von selbst, sobald Ihr Shop etabliert ist.",
    liveListings: "{used} von {cap} Angeboten online",
    dailyListings: "Bis zu {cap} neue Angebote in 24 Stunden",
    priceCeiling: "Bis zu {amount} pro Angebot",
    categoryNote: "Angebote für Telefone, Elektronik, Schmuck, Luxus, Beauty und Gesundheit bestätigt zuerst unser Team.",
    graduationTitle: "Was die Limits aufhebt",
    stepIdentity: "Identität bestätigen",
    stepIdentityDone: "Identität bestätigt",
    stepOrders: "{done} von {needed} Bestellungen zugestellt",
    stepDays: "{done} von {needed} Verkaufstagen",
    verifyCta: "Identität bestätigen",
  },
  payout: {
    blockedTitle: "Ein Schritt vor Ihrer ersten Auszahlung",
    identityBody: "Verkaufen können Sie auch ohne, und Ihre Einnahmen wachsen weiter. Um sie abzuheben, bestätigen Sie einmalig Ihre Identität.",
    riskHoldBody: "Auszahlungen sind pausiert, während unser Team eine Kontoprüfung abschließt. Ihr Guthaben ist sicher.",
    notActiveBody: "Auszahlungen sind nicht verfügbar, weil der Shop nicht aktiv ist. Wenden Sie sich an den Support.",
    unavailableBody: "Die Auszahlungsberechtigung konnte gerade nicht bestätigt werden. Versuchen Sie es in einigen Minuten erneut.",
    verifyCta: "Identität bestätigen",
    financeIdentityBlocked: "Dieser Verkäufer hat seine Identität nicht bestätigt. Eine Auszahlung kann erst danach genehmigt oder freigegeben werden.",
    financeRiskBlocked: "Bei diesem Verkäufer läuft eine Kontoprüfung. Heben Sie die Prüfung auf, bevor Sie eine Auszahlung genehmigen.",
  },
  onboarding: {
    openedTitle: "Ihr Shop ist eröffnet.",
    openedBody: "Legen Sie Ihr erstes Angebot an. Die Identität wird einmal geprüft, vor Ihrer ersten Auszahlung.",
    documentsOptional: "Vorerst optional. Eröffnen Sie Ihren Shop heute und bestätigen Sie Ihre Identität vor der ersten Auszahlung.",
    optionalBadge: "Optional",
    reviewNote: "Ihr Shop öffnet mit dem Absenden, sofern er unsere Prüfungen besteht. Die Identität wird einmal geprüft, vor Ihrer ersten Auszahlung.",
    submitLabel: "Meinen Shop eröffnen",
    heldBody: "Ihre Bewerbung liegt bei unserem Team. Wir bestätigen Ihren Shop in Kürze.",
    rejectedBody: "Ändern Sie das und senden Sie erneut: {reasons}",
    handleTaken: "Diese Shop-Kennung ist vergeben. Wählen Sie eine andere.",
  },
  hide: {
    noticeTitle: "Ein Angebot wurde zur Prüfung offline genommen",
    noticeBody: "„{title}“ ist für Käufer nicht sichtbar: {reasons}.",
    fixHint: "Beheben Sie es und veröffentlichen Sie erneut – es kehrt zurück, sobald es unsere Prüfungen besteht.",
    reviewHint: "Unser Team prüft es. Nichts wurde gelöscht, und es kehrt zurück, wenn die Prüfung es freigibt.",
    reportsReason: "Von mehreren Käufern gemeldet",
    riskReason: "Von unserem Risikoteam zurückgehalten",
  },
  buyer: {
    itemUnavailableTitle: "Ein Artikel in Ihrem Warenkorb ist nicht mehr verfügbar",
    itemUnavailableBody: "Er wurde nach dem Hinzufügen entfernt. Entfernen Sie ihn, um den Rest zu bestellen.",
  },
  owner: {
    kicker: "Marketplace-Vertrauen",
    title: "Veröffentlichungskontrolle",
    body: "Jede Entscheidung der Kontrolle und jedes offline genommene Angebot. Wiederherstellen stellt es online; Bestätigen belässt es offline.",
    decisionsTitle: "Letzte Entscheidungen",
    decisionsEmpty: "Noch keine Entscheidungen erfasst.",
    hidesTitle: "Zur Prüfung offline",
    hidesEmpty: "Nichts wartet auf Sie.",
    columnListing: "Angebot",
    columnOutcome: "Ergebnis",
    columnReasons: "Gründe",
    columnSource: "Entschieden von",
    columnWhen: "Wann",
    outcomePublish: "Veröffentlicht",
    outcomeHold: "Zurückgehalten",
    outcomeReject: "Abgelehnt",
    sourceEngine: "Automatische Kontrolle",
    sourceStaff: "Team",
    sourceCatalogue: "Firmenkatalog",
    sourceBackfill: "Nachlauf",
    sourceRescan: "Neuprüfung",
    restore: "Wiederherstellen",
    uphold: "Offline lassen",
    notePlaceholder: "Hinweis für den Verkäufer (optional)",
    restored: "Angebot wiederhergestellt.",
    restoredBody: "Es ist wieder online. Der Verkäufer wird informiert, mit Ihrer Notiz, falls Sie eine geschrieben haben.",
    upheld: "Angebot bleibt offline.",
    upheldBody: "Es bleibt außerhalb des Katalogs. Der Verkäufer wird informiert, mit Ihrer Notiz, falls Sie eine geschrieben haben.",
    actionFailed: "Das hat nicht geklappt. Es wurde nichts geändert.",
    actionFailedBody: "Über das Angebot wurde möglicherweise bereits an anderer Stelle entschieden. Laden Sie diese Seite neu und prüfen Sie die Liste.",
    unavailable: "Das Kontrollregister ist in dieser Datenbank noch nicht verfügbar.",
    subjectStore: "Shop-Eröffnung",
    staffRoleRequired: "Die Datenbank hat das abgelehnt: Ihr Konto steht nicht auf der Marketplace-Teamliste. Fügen Sie Ihrem Konto die Rolle Marketplace-Inhaber hinzu und versuchen Sie es erneut.",
    storeHandleTaken: "Dieser Shop-Name gehört bereits einem anderen Shop, daher wurde nichts genehmigt. Bitten Sie die Bewerberin oder den Bewerber, einen anderen zu wählen.",
  },
};

const IT: DeepPartial<MarketplaceTrustCopy> = {
  result: {
    publishedTitle: "Il tuo annuncio è online.",
    publishedBody: "Gli acquirenti lo vedono da subito. Modificalo quando vuoi: una modifica corretta resta online.",
    updatedTitle: "Le tue modifiche sono online.",
    updatedBody: "L'annuncio è rimasto online durante l'aggiornamento.",
    heldTitle: "Salvato. Il nostro team lo guarda prima.",
    heldBody: "Il tuo annuncio non è ancora online: {reasons}. Ti avvisiamo appena c'è una decisione.",
    rejectedTitle: "Questo annuncio non è stato pubblicato.",
    rejectedBody: "Correggi e pubblica di nuovo: {reasons}",
    draftTitle: "Bozza salvata.",
    draftBody: "L'annuncio resta privato finché non lo pubblichi.",
    keptLiveTitle: "Il tuo annuncio online è invariato.",
    keptLiveHeldBody: "Queste modifiche richiedono una verifica prima di andare online: {reasons}. Correggile e pubblica di nuovo, oppure scegli di inviarle in verifica.",
    keptLiveRejectedBody: "Queste modifiche non sono state applicate. {reasons}",
  },
  action: {
    publishNow: "Pubblica ora",
    publishing: "Pubblicazione",
    publishUpdate: "Pubblica le modifiche",
    saveDraft: "Salva bozza",
    savingDraft: "Salvataggio bozza",
    formIntro: "Gli annunci che superano i nostri controlli vanno online appena li pubblichi. Ciò che richiede un secondo sguardo ti viene detto subito.",
    reviewOnHold: "Se le mie modifiche richiedono una verifica, rimuovi questo annuncio fino alla decisione",
    unpublishDraft: "Rimuovi e salva come bozza",
  },
  status: { live: "Online", held: "In verifica", hidden: "Rimosso per verifica", draft: "Bozza", rejected: "Non pubblicato" },
  reasons: {
    prohibited_goods: { label: "Articolo vietato", fix: "Questo articolo non può essere venduto su {brand} Marketplace. Rimuovilo dal catalogo." },
    counterfeit_claim: { label: "Descritto come copia", fix: "Non sono ammessi annunci descritti come copie, repliche o falsi. Vendi articoli autentici e descrivili per ciò che sono." },
    hate_speech: { label: "Linguaggio d'odio", fix: "Rimuovi il testo offensivo o d'odio." },
    known_bad_image: { label: "Foto bloccata", fix: "Una delle foto è nella nostra lista di blocco. Sostituiscila con una tua foto dell'articolo." },
    contact_details: { label: "Contatti nell'annuncio", fix: "Rimuovi numeri, e-mail, link e nomi utente. Gli acquirenti ti scrivono dai messaggi {brand}, che tutelano entrambi." },
    off_platform_payment: { label: "Pagamento fuori da {brand}", fix: "Rimuovi ogni richiesta di pagamento con bonifico, contanti, cripto o fuori dal checkout. Il pagamento passa da {brand} per proteggere l'ordine." },
    incomplete_listing: { label: "Annuncio incompleto", fix: "Aggiungi un titolo chiaro, una o due frasi di descrizione e almeno una foto." },
    listing_too_long: { label: "Testo troppo lungo", fix: "Accorcia il testo e pubblica di nuovo. Un titolo o un nome stanno in 300 caratteri, una descrizione o una storia in 20.000 e ogni altro campo in 1.000." },
    price_invalid: { label: "Prezzo da correggere", fix: "Inserisci un prezzo intero maggiore di zero. Il prezzo precedente deve essere superiore a quello di vendita." },
    image_not_first_party: { label: "Foto non caricata qui", fix: "Aggiungi le foto con il pulsante di caricamento. Non si accettano link a immagini ospitate altrove." },
    plan_listing_limit: { label: "Limite annunci del piano raggiunto", fix: "Rimuovi un annuncio o passa a un piano superiore." },
    probation_listing_cap: { label: "Limite annunci per i nuovi negozi raggiunto", fix: "Un nuovo negozio può avere {cap} annunci online. Il limite decade quando il negozio è consolidato." },
    probation_daily_cap: { label: "Limite giornaliero per i nuovi negozi raggiunto", fix: "Un nuovo negozio può pubblicare {cap} annunci in 24 ore. Pubblica questo domani." },
    probation_price_cap: { label: "Oltre il prezzo massimo per i nuovi negozi", fix: "Un nuovo negozio può vendere articoli fino a {amount}. Il limite decade quando il negozio è consolidato." },
    seller_not_active: { label: "Negozio non attivo", fix: "Il tuo negozio non può pubblicare in questo momento. Contatta l'assistenza." },
    listing_conflict: { label: "Identificativo prodotto già in uso", fix: "Quell'identificativo appartiene a un altro annuncio. Scegline un altro." },
    restricted_item_review: { label: "Verifica articolo soggetto a restrizioni", fix: "Questo articolo potrebbe essere soggetto a restrizioni: il nostro team lo conferma prima della pubblicazione." },
    profanity: { label: "Verifica del linguaggio", fix: "Il testo contiene linguaggio forte. Riscrivilo e viene pubblicato subito." },
    contact_suspected: { label: "Possibili contatti", fix: "Qualcosa sembra un link, un nome utente o un numero. Rimuovilo e l'annuncio viene pubblicato subito." },
    scam_language: { label: "Testo che controlliamo per la sicurezza degli acquirenti", fix: "Alcune frasi corrispondono a schemi che verifichiamo. Il nostro team esamina l'annuncio." },
    duplicate_image_other_seller: { label: "Foto già usata da un altro negozio", fix: "Una foto coincide con quella di un altro negozio. Usa le tue foto dell'articolo." },
    high_risk_category_probation: { label: "Categoria verificata per i nuovi negozi", fix: "Gli annunci di questa categoria sono confermati dal nostro team finché il negozio è nuovo." },
    risk_hold_active: { label: "Verifica dell'account in corso", fix: "Il nostro team sta verificando il tuo account. Gli annunci vengono pubblicati al termine." },
    enforcement_hold_active: { label: "Annuncio in verifica", fix: "Questo annuncio è stato rimosso per verifica. Il nostro team decide se torna online." },
    ai_flagged_scam: { label: "Segnalato per un controllo", fix: "I nostri controlli hanno segnalato questo annuncio per una rapida verifica del team." },
    ai_flagged_nsfw: { label: "Segnalato per un controllo", fix: "I nostri controlli hanno segnalato questo annuncio per una rapida verifica del team." },
    ai_flagged_abuse: { label: "Segnalato per un controllo", fix: "I nostri controlli hanno segnalato questo annuncio per una rapida verifica del team." },
    ai_flagged_other: { label: "Segnalato per un controllo", fix: "I nostri controlli hanno segnalato questo annuncio per una rapida verifica del team." },
    gate_unavailable: { label: "Controlli non completati", fix: "Non è stato possibile completare i controlli. Il tuo annuncio è salvato e in coda per la verifica." },
    shared_image: { label: "Foto usata anche da un altro negozio", fix: "Le tue foto dell'articolo ispirano più fiducia agli acquirenti." },
    duplicate_image_same_seller: { label: "Foto riutilizzata nei tuoi annunci", fix: "Una foto diversa per ogni annuncio aiuta a distinguerli." },
    urgency_language: { label: "Testo che mette fretta", fix: "I fatti chiari vendono meglio della fretta." },
    pickup_address: { label: "Indirizzo nell'annuncio", fix: "Gli acquirenti ricevono i dettagli di consegna e ritiro al checkout." },
    thin_listing: { label: "L'annuncio potrebbe dire di più", fix: "Codice articolo, nota di consegna e tempi aiutano a decidere." },
  },
  probation: {
    kicker: "Nuovo negozio",
    title: "Stai vendendo. Finché il negozio è nuovo valgono alcuni limiti.",
    body: "I tuoi annunci vanno online appena superano i nostri controlli. I limiti decadono da soli quando il negozio è consolidato.",
    liveListings: "{used} di {cap} annunci online",
    dailyListings: "Fino a {cap} nuovi annunci ogni 24 ore",
    priceCeiling: "Fino a {amount} per annuncio",
    categoryNote: "Gli annunci di telefoni, elettronica, gioielli, lusso, bellezza e salute sono confermati prima dal nostro team.",
    graduationTitle: "Cosa rimuove i limiti",
    stepIdentity: "Verifica la tua identità",
    stepIdentityDone: "Identità verificata",
    stepOrders: "{done} di {needed} ordini consegnati",
    stepDays: "{done} di {needed} giorni di vendita",
    verifyCta: "Verifica identità",
  },
  payout: {
    blockedTitle: "Un passaggio prima del tuo primo pagamento",
    identityBody: "Puoi vendere anche senza, e i tuoi guadagni continuano a sommarsi. Per prelevarli, verifica la tua identità una volta.",
    riskHoldBody: "I pagamenti sono in pausa mentre il nostro team completa una verifica dell'account. Il tuo saldo è al sicuro.",
    notActiveBody: "I pagamenti non sono disponibili perché il negozio non è attivo. Contatta l'assistenza.",
    unavailableBody: "Non è stato possibile confermare l'idoneità al pagamento. Riprova tra qualche minuto.",
    verifyCta: "Verifica identità",
    financeIdentityBlocked: "Questo venditore non ha verificato l'identità. Un pagamento non può essere approvato né rilasciato finché non lo fa.",
    financeRiskBlocked: "Questo venditore è sotto verifica dell'account. Chiudi la verifica prima di approvare un pagamento.",
  },
  onboarding: {
    openedTitle: "Il tuo negozio è aperto.",
    openedBody: "Aggiungi il tuo primo annuncio. L'identità viene verificata una volta, prima del primo pagamento.",
    documentsOptional: "Facoltativo per ora. Apri il negozio oggi e verifica l'identità prima del primo pagamento.",
    optionalBadge: "Facoltativo",
    reviewNote: "Il negozio apre appena invii la richiesta, se supera i nostri controlli. L'identità viene verificata una volta, prima del primo pagamento.",
    submitLabel: "Apri il mio negozio",
    heldBody: "La tua richiesta è al nostro team. Confermiamo il negozio a breve.",
    rejectedBody: "Modifica e invia di nuovo: {reasons}",
    handleTaken: "Quell'identificativo negozio è già in uso. Scegline un altro.",
  },
  hide: {
    noticeTitle: "Un annuncio è stato rimosso per verifica",
    noticeBody: "«{title}» non è visibile agli acquirenti: {reasons}.",
    fixHint: "Correggilo e pubblica di nuovo: torna online appena supera i nostri controlli.",
    reviewHint: "Il nostro team lo sta esaminando. Nulla è stato eliminato, e torna online se la verifica lo approva.",
    reportsReason: "Segnalato da più acquirenti",
    riskReason: "Trattenuto dal nostro team rischi",
  },
  buyer: {
    itemUnavailableTitle: "Un articolo nel carrello non è più disponibile",
    itemUnavailableBody: "È stato rimosso dopo l'aggiunta. Eliminalo per acquistare il resto.",
  },
  owner: {
    kicker: "Fiducia Marketplace",
    title: "Controllo di pubblicazione",
    body: "Ogni decisione del controllo e ogni annuncio rimosso. Ripristina lo rimette online; mantieni lo lascia rimosso.",
    decisionsTitle: "Decisioni recenti",
    decisionsEmpty: "Nessuna decisione registrata.",
    hidesTitle: "Rimossi per verifica",
    hidesEmpty: "Niente in attesa.",
    columnListing: "Annuncio",
    columnOutcome: "Esito",
    columnReasons: "Motivi",
    columnSource: "Deciso da",
    columnWhen: "Quando",
    outcomePublish: "Pubblicato",
    outcomeHold: "Trattenuto",
    outcomeReject: "Rifiutato",
    sourceEngine: "Controllo automatico",
    sourceStaff: "Team",
    sourceCatalogue: "Catalogo aziendale",
    sourceBackfill: "Recupero",
    sourceRescan: "Nuova analisi",
    restore: "Ripristina",
    uphold: "Mantieni rimosso",
    notePlaceholder: "Nota per il venditore (facoltativa)",
    restored: "Annuncio ripristinato.",
    restoredBody: "È di nuovo online. Il venditore viene avvisato, con la tua nota se ne hai scritta una.",
    upheld: "Annuncio mantenuto rimosso.",
    upheldBody: "Resta fuori dal catalogo. Il venditore viene avvisato, con la tua nota se ne hai scritta una.",
    actionFailed: "Operazione non riuscita. Nulla è stato modificato.",
    actionFailedBody: "L'annuncio potrebbe essere già stato deciso altrove. Ricarica questa pagina e controlla l'elenco.",
    unavailable: "Il registro del controllo non è ancora disponibile su questo database.",
    subjectStore: "Apertura negozio",
    staffRoleRequired: "Il database ha rifiutato: il tuo account non è nel team Marketplace. Aggiungi il ruolo di proprietario Marketplace al tuo account e riprova.",
    storeHandleTaken: "Questo identificativo appartiene già a un altro negozio, quindi non è stato approvato nulla. Chiedi al richiedente di sceglierne un altro.",
  },
};

const AR: DeepPartial<MarketplaceTrustCopy> = {
  result: {
    publishedTitle: "إعلانك منشور الآن.",
    publishedBody: "يراه المشترون من هذه اللحظة. عدّله متى شئت — التعديل السليم يبقى منشورًا.",
    updatedTitle: "تعديلاتك منشورة.",
    updatedBody: "بقي الإعلان منشورًا أثناء التحديث.",
    heldTitle: "تم الحفظ. يراجعه فريقنا أولًا.",
    heldBody: "إعلانك لم يُنشر بعد: {reasons}. نخبرك فور اتخاذ القرار.",
    rejectedTitle: "لم يُنشر هذا الإعلان.",
    rejectedBody: "أصلح التالي ثم انشر من جديد: {reasons}",
    draftTitle: "تم حفظ المسودة.",
    draftBody: "يبقى الإعلان خاصًا حتى تنشره.",
    keptLiveTitle: "إعلانك المنشور لم يتغير.",
    keptLiveHeldBody: "هذه التعديلات تحتاج مراجعة قبل نشرها: {reasons}. عدّلها وانشر من جديد، أو اختر إرسالها للمراجعة.",
    keptLiveRejectedBody: "لم تُطبَّق هذه التعديلات. {reasons}",
    reasonSeparator: "؛ ",
  },
  action: {
    publishNow: "انشر الآن",
    publishing: "جارٍ النشر",
    publishUpdate: "انشر التعديلات",
    saveDraft: "احفظ المسودة",
    savingDraft: "جارٍ حفظ المسودة",
    formIntro: "الإعلانات التي تجتاز فحوصنا تُنشر فور نشرك لها. وما يحتاج نظرة ثانية نخبرك به مباشرة.",
    reviewOnHold: "إذا احتاجت تعديلاتي إلى مراجعة، أزل هذا الإعلان حتى يُتخذ القرار",
    unpublishDraft: "أزله واحفظه كمسودة",
  },
  status: { live: "منشور", held: "قيد المراجعة", hidden: "أُزيل للمراجعة", draft: "مسودة", rejected: "غير منشور" },
  reasons: {
    prohibited_goods: { label: "سلعة محظورة", fix: "لا يمكن بيع هذه السلعة في {brand} Marketplace. احذفها من متجرك." },
    counterfeit_claim: { label: "موصوفة بأنها نسخة", fix: "لا يُسمح بالإعلانات الموصوفة بأنها نسخ أو تقليد أو مزيفة. بِع سلعًا أصلية وصفها كما هي." },
    hate_speech: { label: "خطاب كراهية", fix: "احذف العبارات المسيئة أو المحرضة على الكراهية." },
    known_bad_image: { label: "صورة محظورة", fix: "إحدى الصور ضمن قائمتنا المحظورة. استبدلها بصورة من تصويرك للسلعة." },
    contact_details: { label: "بيانات اتصال في الإعلان", fix: "احذف أرقام الهاتف والبريد والروابط وحسابات المراسلة. يتواصل المشترون معك عبر رسائل {brand}، وهذا يحمي الطرفين." },
    off_platform_payment: { label: "دفع خارج {brand}", fix: "احذف أي طلب للدفع بالتحويل أو نقدًا أو بالعملات الرقمية أو خارج صفحة الدفع. الدفع يتم عبر {brand} لحماية الطلب." },
    incomplete_listing: { label: "الإعلان غير مكتمل", fix: "أضف عنوانًا واضحًا وجملة أو جملتين للوصف وصورة واحدة على الأقل." },
    listing_too_long: { label: "النص طويل جدًا", fix: "اختصر النص ثم انشر مرة أخرى. العنوان أو الاسم حتى 300 حرف، والوصف أو القصة حتى 20,000 حرف، وأي حقل آخر حتى 1,000 حرف." },
    price_invalid: { label: "السعر يحتاج تصحيحًا", fix: "أدخل سعرًا صحيحًا أكبر من صفر. السعر السابق يجب أن يكون أعلى من سعر البيع." },
    image_not_first_party: { label: "صورة غير مرفوعة هنا", fix: "أضف الصور بزر الرفع. لا تُقبل روابط صور مستضافة في مكان آخر." },
    plan_listing_limit: { label: "اكتمل حد إعلانات الباقة", fix: "احذف إعلانًا أو انتقل إلى باقة أكبر." },
    probation_listing_cap: { label: "بلغت حد إعلانات المتاجر الجديدة", fix: "المتجر الجديد يستطيع نشر {cap} إعلانات. يُرفع الحد عند ترسّخ متجرك." },
    probation_daily_cap: { label: "بلغت الحد اليومي للمتاجر الجديدة", fix: "المتجر الجديد يستطيع نشر {cap} إعلانات كل 24 ساعة. انشر هذا غدًا." },
    probation_price_cap: { label: "أعلى من سقف سعر المتاجر الجديدة", fix: "المتجر الجديد يستطيع عرض سلع حتى {amount}. يُرفع السقف عند ترسّخ متجرك." },
    seller_not_active: { label: "المتجر غير نشط", fix: "لا يستطيع متجرك النشر الآن. تواصل مع الدعم." },
    listing_conflict: { label: "معرّف المنتج مستخدم", fix: "هذا المعرّف يخص إعلانًا آخر. اختر معرّفًا مختلفًا." },
    restricted_item_review: { label: "فحص سلعة مقيّدة", fix: "قد تكون هذه السلعة مقيّدة، لذا يؤكدها فريقنا قبل النشر." },
    profanity: { label: "فحص اللغة", fix: "النص يتضمن ألفاظًا حادة. أعد صياغته ويُنشر فورًا." },
    contact_suspected: { label: "بيانات اتصال محتملة", fix: "هناك ما يشبه رابطًا أو حسابًا أو رقمًا. احذفه ويُنشر الإعلان فورًا." },
    scam_language: { label: "صياغة نفحصها لحماية المشترين", fix: "بعض العبارات تطابق أنماطًا نتحقق منها. يراجع فريقنا الإعلان." },
    duplicate_image_other_seller: { label: "صورة يستخدمها متجر آخر", fix: "إحدى الصور تطابق صورة متجر آخر. استخدم صورك الخاصة للسلعة." },
    high_risk_category_probation: { label: "فئة تُراجع للمتاجر الجديدة", fix: "إعلانات هذه الفئة يؤكدها فريقنا ما دام متجرك جديدًا." },
    risk_hold_active: { label: "مراجعة الحساب جارية", fix: "يراجع فريقنا حسابك. تُنشر الإعلانات بعد انتهاء المراجعة." },
    enforcement_hold_active: { label: "الإعلان قيد المراجعة", fix: "أُزيل هذا الإعلان للمراجعة. يقرر فريقنا عودته." },
    ai_flagged_scam: { label: "مُعلَّم لمراجعة أدق", fix: "فحوصنا علّمت هذا الإعلان لمراجعة سريعة من فريقنا." },
    ai_flagged_nsfw: { label: "مُعلَّم لمراجعة أدق", fix: "فحوصنا علّمت هذا الإعلان لمراجعة سريعة من فريقنا." },
    ai_flagged_abuse: { label: "مُعلَّم لمراجعة أدق", fix: "فحوصنا علّمت هذا الإعلان لمراجعة سريعة من فريقنا." },
    ai_flagged_other: { label: "مُعلَّم لمراجعة أدق", fix: "فحوصنا علّمت هذا الإعلان لمراجعة سريعة من فريقنا." },
    gate_unavailable: { label: "لم تكتمل الفحوص", fix: "تعذّر إكمال الفحوص الآن. إعلانك محفوظ وفي قائمة المراجعة." },
    shared_image: { label: "صورة يستخدمها متجر آخر أيضًا", fix: "صورك الخاصة للسلعة تكسب ثقة أكبر من المشترين." },
    duplicate_image_same_seller: { label: "صورة مكررة في إعلاناتك", fix: "صورة مختلفة لكل إعلان تساعد المشترين على التمييز." },
    urgency_language: { label: "صياغة ضاغطة", fix: "الحقائق الواضحة تبيع أفضل من الضغط." },
    pickup_address: { label: "عنوان في الإعلان", fix: "يحصل المشترون على تفاصيل التوصيل والاستلام عند الدفع." },
    thin_listing: { label: "يمكن للإعلان أن يقول أكثر", fix: "رمز المنتج وملاحظة التوصيل والمدة تساعد المشتري على القرار." },
  },
  probation: {
    kicker: "متجر جديد",
    title: "أنت تبيع الآن. تُطبَّق بعض الحدود ما دام متجرك جديدًا.",
    body: "تُنشر إعلاناتك فور اجتيازها فحوصنا. تُرفع هذه الحدود تلقائيًا عند ترسّخ متجرك.",
    liveListings: "{used} من {cap} إعلانات منشورة",
    dailyListings: "حتى {cap} إعلانات جديدة كل 24 ساعة",
    priceCeiling: "حتى {amount} للإعلان",
    categoryNote: "إعلانات الهواتف والإلكترونيات والمجوهرات والسلع الفاخرة والتجميل والصحة يؤكدها فريقنا أولًا.",
    graduationTitle: "ما الذي يرفع الحدود",
    stepIdentity: "وثّق هويتك",
    stepIdentityDone: "تم توثيق الهوية",
    stepOrders: "{done} من {needed} طلبات مُسلَّمة",
    stepDays: "{done} من {needed} يومًا من البيع",
    verifyCta: "توثيق الهوية",
  },
  payout: {
    blockedTitle: "خطوة واحدة قبل أول سحب",
    identityBody: "يمكنك البيع بدونها، وأرباحك تتراكم. لسحبها، وثّق هويتك مرة واحدة.",
    riskHoldBody: "السحوبات متوقفة مؤقتًا ريثما يكمل فريقنا مراجعة الحساب. رصيدك آمن.",
    notActiveBody: "السحوبات غير متاحة لأن المتجر غير نشط. تواصل مع الدعم.",
    unavailableBody: "تعذّر تأكيد أهلية السحب الآن. حاول بعد دقائق.",
    verifyCta: "توثيق الهوية",
    financeIdentityBlocked: "هذا البائع لم يوثّق هويته. لا يمكن اعتماد سحب أو صرفه قبل ذلك.",
    financeRiskBlocked: "هذا البائع قيد مراجعة الحساب. أنهِ المراجعة قبل اعتماد أي سحب.",
  },
  onboarding: {
    openedTitle: "متجرك مفتوح.",
    openedBody: "أضف أول إعلان الآن. تُوثَّق الهوية مرة واحدة قبل أول سحب.",
    documentsOptional: "اختياري الآن. افتح متجرك اليوم ووثّق هويتك قبل أول سحب.",
    optionalBadge: "اختياري",
    reviewNote: "يُفتح متجرك فور الإرسال ما دام يجتاز فحوصنا. تُوثَّق الهوية مرة واحدة قبل أول سحب.",
    submitLabel: "افتح متجري",
    heldBody: "طلبك لدى فريقنا. نؤكد متجرك قريبًا.",
    rejectedBody: "عدّل التالي ثم أرسل من جديد: {reasons}",
    handleTaken: "معرّف المتجر مستخدم. اختر غيره.",
  },
  hide: {
    noticeTitle: "أُزيل إعلان للمراجعة",
    noticeBody: "«{title}» غير ظاهر للمشترين: {reasons}.",
    fixHint: "أصلحه وانشره من جديد — يعود فور اجتيازه فحوصنا.",
    reviewHint: "يراجعه فريقنا. لم يُحذف شيء، ويعود إن أجازته المراجعة.",
    reportsReason: "أبلغ عنه عدة مشترين",
    riskReason: "أوقفه فريق المخاطر لدينا",
  },
  buyer: {
    itemUnavailableTitle: "أحد منتجات سلتك لم يعد متاحًا",
    itemUnavailableBody: "أُزيل بعد إضافته. احذفه لإتمام شراء الباقي.",
  },
  owner: {
    kicker: "ثقة السوق",
    title: "بوابة النشر",
    body: "كل قرار اتخذته البوابة وكل إعلان أزالته. الاستعادة تعيده منشورًا؛ الإبقاء يتركه مُزالًا.",
    decisionsTitle: "أحدث القرارات",
    decisionsEmpty: "لا قرارات مسجلة بعد.",
    hidesTitle: "أُزيلت للمراجعة",
    hidesEmpty: "لا شيء بانتظارك.",
    columnListing: "الإعلان",
    columnOutcome: "النتيجة",
    columnReasons: "الأسباب",
    columnSource: "صاحب القرار",
    columnWhen: "الوقت",
    outcomePublish: "منشور",
    outcomeHold: "موقوف",
    outcomeReject: "مرفوض",
    sourceEngine: "البوابة الآلية",
    sourceStaff: "الفريق",
    sourceCatalogue: "كتالوج الشركة",
    sourceBackfill: "معالجة لاحقة",
    sourceRescan: "إعادة فحص",
    restore: "استعادة",
    uphold: "إبقاء الإزالة",
    notePlaceholder: "ملاحظة للبائع (اختياري)",
    restored: "تمت استعادة الإعلان.",
    restoredBody: "عاد الإعلان إلى العرض. يُبلَّغ البائع، مع ملاحظتك إن كتبت واحدة.",
    upheld: "بقي الإعلان مُزالًا.",
    upheldBody: "يبقى خارج الكتالوج. يُبلَّغ البائع، مع ملاحظتك إن كتبت واحدة.",
    actionFailed: "لم تتم العملية. لم يتغير شيء.",
    actionFailedBody: "ربما تم البتّ في هذا الإعلان من مكان آخر. أعد تحميل الصفحة وراجع القائمة.",
    unavailable: "سجل البوابة غير متاح على قاعدة البيانات هذه بعد.",
    subjectStore: "فتح متجر",
    staffRoleRequired: "رفضت قاعدة البيانات العملية: حسابك ليس ضمن فريق السوق. أضف دور مالك السوق إلى حسابك ثم حاول من جديد.",
    storeHandleTaken: "هذا المعرّف يخص متجرًا آخر، لذلك لم تتم الموافقة على أي شيء. اطلب من المتقدم اختيار معرّف آخر.",
  },
};

const ZH: DeepPartial<MarketplaceTrustCopy> = {
  result: {
    publishedTitle: "您的商品已上架。",
    publishedBody: "买家现在就能看到。随时可以编辑——合规的修改会保持上架。",
    updatedTitle: "您的修改已生效。",
    updatedBody: "更新期间商品保持上架。",
    heldTitle: "已保存。我们的团队会先查看。",
    heldBody: "您的商品尚未上架：{reasons}。一有结果我们会通知您。",
    rejectedTitle: "该商品未发布。",
    rejectedBody: "请修正后重新发布：{reasons}",
    draftTitle: "草稿已保存。",
    draftBody: "发布前商品保持私密。",
    keptLiveTitle: "您已上架的商品未作更改。",
    keptLiveHeldBody: "这些修改需要先审核才能生效：{reasons}。请修改后重新发布，或选择提交审核。",
    keptLiveRejectedBody: "这些修改未被应用。{reasons}",
    reasonSeparator: "；",
  },
  action: {
    publishNow: "立即发布",
    publishing: "发布中",
    publishUpdate: "发布修改",
    saveDraft: "保存草稿",
    savingDraft: "正在保存草稿",
    formIntro: "通过检查的商品在您发布的那一刻即上架。需要再看一眼的，我们会立刻告诉您。",
    reviewOnHold: "如果我的修改需要审核，请在决定前先下架该商品",
    unpublishDraft: "下架并保存为草稿",
  },
  status: { live: "已上架", held: "审核中", hidden: "已下架待审核", draft: "草稿", rejected: "未发布" },
  reasons: {
    prohibited_goods: { label: "禁售商品", fix: "该商品不能在 {brand} Marketplace 销售。请从您的商品中移除。" },
    counterfeit_claim: { label: "被描述为仿品", fix: "不允许发布被描述为复制品、仿品或假货的商品。请销售正品并如实描述。" },
    hate_speech: { label: "仇恨言论", fix: "请删除仇恨或侮辱性文字。" },
    known_bad_image: { label: "被屏蔽的图片", fix: "其中一张图片在我们的屏蔽名单中。请换成您自己拍摄的商品图片。" },
    contact_details: { label: "商品中含联系方式", fix: "请删除电话、邮箱、链接和通讯账号。买家通过 {brand} 消息联系您，这对双方都有保障。" },
    off_platform_payment: { label: "在 {brand} 之外付款", fix: "请删除任何要求转账、现金、加密货币或在结账流程之外付款的内容。付款通过 {brand} 完成，订单才受保护。" },
    incomplete_listing: { label: "商品信息不完整", fix: "请添加清晰的标题、一两句描述和至少一张图片。" },
    listing_too_long: { label: "文字过长", fix: "请缩短文字后重新发布。标题或名称不超过 300 个字符，描述或介绍不超过 20,000 个字符，其他字段不超过 1,000 个字符。" },
    price_invalid: { label: "价格需要修正", fix: "请输入大于零的整数价格。原价必须高于售价。" },
    image_not_first_party: { label: "图片不是在此上传", fix: "请使用上传按钮添加图片。不接受托管在其他地方的图片链接。" },
    plan_listing_limit: { label: "套餐商品额度已满", fix: "请移除一个商品或升级套餐。" },
    probation_listing_cap: { label: "已达新店商品上限", fix: "新店最多可上架 {cap} 个商品。店铺成长后该限制自动取消。" },
    probation_daily_cap: { label: "已达新店每日上限", fix: "新店每 24 小时最多发布 {cap} 个商品。请明天再发布这个。" },
    probation_price_cap: { label: "超过新店价格上限", fix: "新店可上架价格不超过 {amount} 的商品。店铺成长后该限制自动取消。" },
    seller_not_active: { label: "店铺未激活", fix: "您的店铺目前无法发布。请联系客服。" },
    listing_conflict: { label: "商品标识已被使用", fix: "该标识属于另一个商品。请换一个。" },
    restricted_item_review: { label: "受限商品检查", fix: "该商品可能受限，我们的团队确认后才会上架。" },
    profanity: { label: "用语检查", fix: "文字中含有粗俗用语。改写后即可立即发布。" },
    contact_suspected: { label: "疑似联系方式", fix: "这里有内容像是链接、账号或号码。删除后即可立即发布。" },
    scam_language: { label: "为保护买家而筛查的措辞", fix: "部分措辞符合我们会检查的模式。我们的团队会审核该商品。" },
    duplicate_image_other_seller: { label: "图片已被其他店铺使用", fix: "有图片与其他店铺的图片相同。请使用您自己拍摄的商品图片。" },
    high_risk_category_probation: { label: "新店需审核的类目", fix: "店铺为新店期间，该类目的商品由我们的团队确认。" },
    risk_hold_active: { label: "账户审核进行中", fix: "我们的团队正在审核您的账户。审核完成后商品即会发布。" },
    enforcement_hold_active: { label: "商品审核中", fix: "该商品已下架待审核。由我们的团队决定是否恢复。" },
    ai_flagged_scam: { label: "已标记待进一步查看", fix: "我们的检查已将该商品标记，由团队快速审核。" },
    ai_flagged_nsfw: { label: "已标记待进一步查看", fix: "我们的检查已将该商品标记，由团队快速审核。" },
    ai_flagged_abuse: { label: "已标记待进一步查看", fix: "我们的检查已将该商品标记，由团队快速审核。" },
    ai_flagged_other: { label: "已标记待进一步查看", fix: "我们的检查已将该商品标记，由团队快速审核。" },
    gate_unavailable: { label: "检查未能完成", fix: "刚才未能完成检查。您的商品已保存并排队等待审核。" },
    shared_image: { label: "图片也被其他店铺使用", fix: "使用您自己拍摄的商品图片更能赢得买家信任。" },
    duplicate_image_same_seller: { label: "图片在您的多个商品中重复", fix: "每个商品使用不同的图片，便于买家区分。" },
    urgency_language: { label: "催促性措辞", fix: "清楚的事实比催促更能促成交易。" },
    pickup_address: { label: "商品中含地址", fix: "买家会在结账时获得配送和自提信息。" },
    thin_listing: { label: "商品信息可以更充分", fix: "货号、配送说明和发货时效有助于买家做决定。" },
  },
  probation: {
    kicker: "新店",
    title: "您已开始销售。新店期间有一些限制。",
    body: "商品一通过检查即上架。店铺成长后这些限制会自动取消。",
    liveListings: "已上架 {used} / {cap} 个商品",
    dailyListings: "每 24 小时最多发布 {cap} 个新商品",
    priceCeiling: "每个商品最高 {amount}",
    categoryNote: "手机、电子产品、珠宝、奢侈品、美妆和健康类商品先由我们的团队确认。",
    graduationTitle: "如何取消限制",
    stepIdentity: "完成身份验证",
    stepIdentityDone: "身份已验证",
    stepOrders: "已送达 {done} / {needed} 个订单",
    stepDays: "已销售 {done} / {needed} 天",
    verifyCta: "验证身份",
  },
  payout: {
    blockedTitle: "首次提现前还有一步",
    identityBody: "不验证也可以销售，收入会持续累积。提现前请完成一次身份验证。",
    riskHoldBody: "我们的团队正在完成账户审核，提现暂停。您的余额是安全的。",
    notActiveBody: "店铺未激活，无法提现。请联系客服。",
    unavailableBody: "刚才未能确认提现资格。请几分钟后重试。",
    verifyCta: "验证身份",
    financeIdentityBlocked: "该卖家尚未验证身份。在其验证之前不能批准或发放提现。",
    financeRiskBlocked: "该卖家正处于账户审核中。请先解除审核再批准提现。",
  },
  onboarding: {
    openedTitle: "您的店铺已开张。",
    openedBody: "现在就添加第一个商品。身份只需在首次提现前验证一次。",
    documentsOptional: "目前可选。今天即可开店，在首次提现前完成身份验证。",
    optionalBadge: "可选",
    reviewNote: "只要通过检查，提交后店铺立即开通。身份只需在首次提现前验证一次。",
    submitLabel: "开通我的店铺",
    heldBody: "您的申请已交给我们的团队。我们会尽快确认您的店铺。",
    rejectedBody: "请修改后重新提交：{reasons}",
    handleTaken: "该店铺标识已被占用。请换一个。",
  },
  hide: {
    noticeTitle: "有商品已下架待审核",
    noticeBody: "“{title}”目前对买家不可见：{reasons}。",
    fixHint: "修正后重新发布——通过检查即恢复上架。",
    reviewHint: "我们的团队正在审核。没有任何内容被删除，审核通过即恢复。",
    reportsReason: "被多位买家举报",
    riskReason: "被我们的风控团队暂停",
  },
  buyer: {
    itemUnavailableTitle: "购物车中有商品已不可购买",
    itemUnavailableBody: "该商品在您加入后被下架。请移除后再结算其余商品。",
  },
  owner: {
    kicker: "市场信任",
    title: "发布关卡",
    body: "关卡做出的每一个决定，以及它下架的每一个商品。恢复即重新上架；维持则保持下架。",
    decisionsTitle: "最近的决定",
    decisionsEmpty: "尚无记录。",
    hidesTitle: "已下架待审核",
    hidesEmpty: "没有待处理事项。",
    columnListing: "商品",
    columnOutcome: "结果",
    columnReasons: "原因",
    columnSource: "决定方",
    columnWhen: "时间",
    outcomePublish: "已发布",
    outcomeHold: "已暂缓",
    outcomeReject: "已拒绝",
    sourceEngine: "自动关卡",
    sourceStaff: "团队",
    sourceCatalogue: "公司商品目录",
    sourceBackfill: "补录",
    sourceRescan: "重新扫描",
    restore: "恢复",
    uphold: "保持下架",
    notePlaceholder: "给卖家的备注（可选）",
    restored: "商品已恢复。",
    restoredBody: "商品已重新上架。系统会通知卖家，并附上您填写的备注（如有）。",
    upheld: "商品保持下架。",
    upheldBody: "商品仍不在目录中。系统会通知卖家，并附上您填写的备注（如有）。",
    actionFailed: "操作未成功。未做任何更改。",
    actionFailedBody: "该商品可能已在其他地方处理。请刷新本页并查看列表。",
    unavailable: "此数据库上尚无关卡记录。",
    subjectStore: "店铺开通",
    staffRoleRequired: "数据库拒绝了此操作：您的账户不在市场团队名单中。请为账户添加市场所有者角色后重试。",
    storeHandleTaken: "该店铺标识已属于另一家店铺，因此未批准任何内容。请让申请人另选一个标识。",
  },
};

// ig / yo / ha / hi are intentionally absent — never machine-translated; they
// fall through to English by construction.
const LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<MarketplaceTrustCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  de: DE,
  it: IT,
  ar: AR,
  zh: ZH,
};

export function getMarketplaceTrustCopy(locale: AppLocale): MarketplaceTrustCopy {
  const overrides = LOCALE_MAP[locale];
  if (overrides) {
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      overrides as unknown as Record<string, unknown>,
    ) as unknown as MarketplaceTrustCopy;
  }
  return EN;
}

/** @internal */
export function __dangerouslyGetEnglishMarketplaceTrustCopy(): MarketplaceTrustCopy {
  return EN;
}

/** Replace `{key}` tokens in a copy string with values (mirrors the surface pattern). */
export function formatMarketplaceTrustTemplate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in values ? String(values[key]) : match,
  );
}
