import type { AppLocale } from "./locales";
import { deepMergeMessages, type DeepPartial } from "./merge-messages";

/**
 * Copy for the shared @henryco/address-selector AddressForm surface.
 *
 * Each top-level key maps to one component; nested keys are the individual
 * user-visible strings within it.
 *
 * Pattern A module: author EN + fr/es/pt/ar/de/it/zh only. ig/yo/ha/hi are
 * intentionally omitted and fall back to EN (human-translation only).
 */
export type AddressSelectorCopy = {
  form: {
    labelField: string;
    alreadyInUseSuffix: string;
    searchField: string;
    searchAriaLabel: string;
    resolving: string;
    resolveError: string;
    pickFromSuggestions: string;
    streetField: string;
    unitField: string;
    unitPlaceholder: string;
    fullNameField: string;
    fullNamePlaceholder: string;
    phoneField: string;
    phonePlaceholder: string;
    cityLabel: string;
    stateLabel: string;
    countryLabel: string;
    postalLabel: string;
    makeDefault: string;
    saving: string;
    saveChanges: string;
    useThisAddress: string;
    saveAddress: string;
    cancel: string;
  };
};

const EN: AddressSelectorCopy = {
  form: {
    labelField: "Label",
    alreadyInUseSuffix: " (already in use)",
    searchField: "Search address",
    searchAriaLabel: "Search for your address",
    resolving: "Resolving address details…",
    resolveError: "Couldn't resolve that address. Try a different suggestion.",
    pickFromSuggestions: "Please pick the address from the suggestion list.",
    streetField: "Street",
    unitField: "Apartment / suite / floor (optional)",
    unitPlaceholder: "Apt 4B, Floor 3, Suite 200…",
    fullNameField: "Full name on address (optional)",
    fullNamePlaceholder: "Recipient name for deliveries",
    phoneField: "Phone (optional)",
    phonePlaceholder: "+234…",
    cityLabel: "City:",
    stateLabel: "State:",
    countryLabel: "Country:",
    postalLabel: "Postal:",
    makeDefault: "Make this my default address",
    saving: "Saving…",
    saveChanges: "Save changes",
    useThisAddress: "Use this address",
    saveAddress: "Save address",
    cancel: "Cancel",
  },
};

const FR: DeepPartial<AddressSelectorCopy> = {
  form: {
    labelField: "Libellé",
    alreadyInUseSuffix: " (déjà utilisé)",
    searchField: "Rechercher une adresse",
    searchAriaLabel: "Rechercher votre adresse",
    resolving: "Récupération des détails de l'adresse…",
    resolveError: "Impossible de récupérer cette adresse. Essayez une autre suggestion.",
    pickFromSuggestions: "Veuillez choisir l'adresse dans la liste de suggestions.",
    streetField: "Rue",
    unitField: "Appartement / suite / étage (facultatif)",
    unitPlaceholder: "Appt 4B, 3e étage, Suite 200…",
    fullNameField: "Nom complet sur l'adresse (facultatif)",
    fullNamePlaceholder: "Nom du destinataire pour les livraisons",
    phoneField: "Téléphone (facultatif)",
    phonePlaceholder: "+234…",
    cityLabel: "Ville :",
    stateLabel: "Région :",
    countryLabel: "Pays :",
    postalLabel: "Code postal :",
    makeDefault: "Définir comme mon adresse par défaut",
    saving: "Enregistrement…",
    saveChanges: "Enregistrer les modifications",
    useThisAddress: "Utiliser cette adresse",
    saveAddress: "Enregistrer l'adresse",
    cancel: "Annuler",
  },
};

const ES: DeepPartial<AddressSelectorCopy> = {
  form: {
    labelField: "Etiqueta",
    alreadyInUseSuffix: " (ya en uso)",
    searchField: "Buscar dirección",
    searchAriaLabel: "Busca tu dirección",
    resolving: "Obteniendo los detalles de la dirección…",
    resolveError: "No se pudo obtener esa dirección. Prueba con otra sugerencia.",
    pickFromSuggestions: "Selecciona la dirección de la lista de sugerencias.",
    streetField: "Calle",
    unitField: "Apartamento / suite / piso (opcional)",
    unitPlaceholder: "Apto. 4B, Piso 3, Suite 200…",
    fullNameField: "Nombre completo en la dirección (opcional)",
    fullNamePlaceholder: "Nombre del destinatario para las entregas",
    phoneField: "Teléfono (opcional)",
    phonePlaceholder: "+234…",
    cityLabel: "Ciudad:",
    stateLabel: "Provincia:",
    countryLabel: "País:",
    postalLabel: "Código postal:",
    makeDefault: "Establecer como mi dirección predeterminada",
    saving: "Guardando…",
    saveChanges: "Guardar cambios",
    useThisAddress: "Usar esta dirección",
    saveAddress: "Guardar dirección",
    cancel: "Cancelar",
  },
};

const PT: DeepPartial<AddressSelectorCopy> = {
  form: {
    labelField: "Rótulo",
    alreadyInUseSuffix: " (já em uso)",
    searchField: "Pesquisar endereço",
    searchAriaLabel: "Pesquise o seu endereço",
    resolving: "Obtendo os detalhes do endereço…",
    resolveError: "Não foi possível obter esse endereço. Tente outra sugestão.",
    pickFromSuggestions: "Selecione o endereço na lista de sugestões.",
    streetField: "Rua",
    unitField: "Apartamento / suíte / andar (opcional)",
    unitPlaceholder: "Apto. 4B, 3.º andar, Suíte 200…",
    fullNameField: "Nome completo no endereço (opcional)",
    fullNamePlaceholder: "Nome do destinatário para as entregas",
    phoneField: "Telefone (opcional)",
    phonePlaceholder: "+234…",
    cityLabel: "Cidade:",
    stateLabel: "Estado:",
    countryLabel: "País:",
    postalLabel: "CEP:",
    makeDefault: "Definir como o meu endereço padrão",
    saving: "Salvando…",
    saveChanges: "Salvar alterações",
    useThisAddress: "Usar este endereço",
    saveAddress: "Salvar endereço",
    cancel: "Cancelar",
  },
};

const AR: DeepPartial<AddressSelectorCopy> = {
  form: {
    labelField: "التسمية",
    alreadyInUseSuffix: " (مُستخدَمة بالفعل)",
    searchField: "البحث عن عنوان",
    searchAriaLabel: "ابحث عن عنوانك",
    resolving: "جارٍ جلب تفاصيل العنوان…",
    resolveError: "تعذّر جلب هذا العنوان. جرّب اقتراحًا آخر.",
    pickFromSuggestions: "يرجى اختيار العنوان من قائمة الاقتراحات.",
    streetField: "الشارع",
    unitField: "الشقة / الجناح / الطابق (اختياري)",
    unitPlaceholder: "شقة 4B، الطابق 3، جناح 200…",
    fullNameField: "الاسم الكامل على العنوان (اختياري)",
    fullNamePlaceholder: "اسم المستلِم لعمليات التوصيل",
    phoneField: "الهاتف (اختياري)",
    phonePlaceholder: "+234…",
    cityLabel: "المدينة:",
    stateLabel: "الولاية:",
    countryLabel: "الدولة:",
    postalLabel: "الرمز البريدي:",
    makeDefault: "اجعل هذا عنواني الافتراضي",
    saving: "جارٍ الحفظ…",
    saveChanges: "حفظ التغييرات",
    useThisAddress: "استخدام هذا العنوان",
    saveAddress: "حفظ العنوان",
    cancel: "إلغاء",
  },
};

const DE: DeepPartial<AddressSelectorCopy> = {
  form: {
    labelField: "Bezeichnung",
    alreadyInUseSuffix: " (bereits in Verwendung)",
    searchField: "Adresse suchen",
    searchAriaLabel: "Nach Ihrer Adresse suchen",
    resolving: "Adressdetails werden abgerufen…",
    resolveError: "Diese Adresse konnte nicht abgerufen werden. Versuchen Sie einen anderen Vorschlag.",
    pickFromSuggestions: "Bitte wählen Sie die Adresse aus der Vorschlagsliste aus.",
    streetField: "Straße",
    unitField: "Wohnung / Suite / Etage (optional)",
    unitPlaceholder: "Whg. 4B, 3. Etage, Suite 200…",
    fullNameField: "Vollständiger Name an der Adresse (optional)",
    fullNamePlaceholder: "Name des Empfängers für Lieferungen",
    phoneField: "Telefon (optional)",
    phonePlaceholder: "+234…",
    cityLabel: "Stadt:",
    stateLabel: "Bundesland:",
    countryLabel: "Land:",
    postalLabel: "PLZ:",
    makeDefault: "Als meine Standardadresse festlegen",
    saving: "Wird gespeichert…",
    saveChanges: "Änderungen speichern",
    useThisAddress: "Diese Adresse verwenden",
    saveAddress: "Adresse speichern",
    cancel: "Abbrechen",
  },
};

const IT: DeepPartial<AddressSelectorCopy> = {
  form: {
    labelField: "Etichetta",
    alreadyInUseSuffix: " (già in uso)",
    searchField: "Cerca indirizzo",
    searchAriaLabel: "Cerca il tuo indirizzo",
    resolving: "Recupero dei dettagli dell'indirizzo…",
    resolveError: "Impossibile recuperare questo indirizzo. Prova un altro suggerimento.",
    pickFromSuggestions: "Seleziona l'indirizzo dall'elenco dei suggerimenti.",
    streetField: "Via",
    unitField: "Appartamento / interno / piano (facoltativo)",
    unitPlaceholder: "Int. 4B, Piano 3, Suite 200…",
    fullNameField: "Nome completo sull'indirizzo (facoltativo)",
    fullNamePlaceholder: "Nome del destinatario per le consegne",
    phoneField: "Telefono (facoltativo)",
    phonePlaceholder: "+234…",
    cityLabel: "Città:",
    stateLabel: "Provincia:",
    countryLabel: "Paese:",
    postalLabel: "CAP:",
    makeDefault: "Imposta come mio indirizzo predefinito",
    saving: "Salvataggio…",
    saveChanges: "Salva le modifiche",
    useThisAddress: "Usa questo indirizzo",
    saveAddress: "Salva indirizzo",
    cancel: "Annulla",
  },
};

const ZH: DeepPartial<AddressSelectorCopy> = {
  form: {
    labelField: "标签",
    alreadyInUseSuffix: "（已使用）",
    searchField: "搜索地址",
    searchAriaLabel: "搜索您的地址",
    resolving: "正在获取地址详情…",
    resolveError: "无法获取该地址。请尝试其他建议。",
    pickFromSuggestions: "请从建议列表中选择地址。",
    streetField: "街道",
    unitField: "公寓 / 套房 / 楼层（可选）",
    unitPlaceholder: "4B 公寓、3 楼、200 套房…",
    fullNameField: "地址上的全名（可选）",
    fullNamePlaceholder: "收件人姓名（用于配送）",
    phoneField: "电话（可选）",
    phonePlaceholder: "+234…",
    cityLabel: "城市：",
    stateLabel: "州/省：",
    countryLabel: "国家/地区：",
    postalLabel: "邮编：",
    makeDefault: "设为我的默认地址",
    saving: "正在保存…",
    saveChanges: "保存更改",
    useThisAddress: "使用此地址",
    saveAddress: "保存地址",
    cancel: "取消",
  },
};

const LOCALE_MAP: Partial<Record<AppLocale, DeepPartial<AddressSelectorCopy>>> = {
  fr: FR,
  es: ES,
  pt: PT,
  ar: AR,
  de: DE,
  it: IT,
  zh: ZH,
};
// ig, yo, ha, hi are intentionally OMITTED -> fall back to EN (human-translation only).

export function getAddressSelectorCopy(locale: AppLocale): AddressSelectorCopy {
  const o = LOCALE_MAP[locale];
  if (o)
    return deepMergeMessages(
      EN as unknown as Record<string, unknown>,
      o as unknown as Record<string, unknown>,
    ) as unknown as AddressSelectorCopy;
  return EN;
}
