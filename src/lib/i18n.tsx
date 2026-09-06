import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "ar" | "en";

/** Default for fresh visits. Not derived from Accept-Language. */
export const DEFAULT_LANG: Lang = "en";
export const LANG_KEY = "waahid-lang";
const LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function resolveLang(value: string | null | undefined): Lang {
  if (value === "en" || value === "ar") return value;
  return DEFAULT_LANG;
}

function readLangCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${LANG_KEY}=([^;]*)`));
  return match?.[1] ?? null;
}

/** Client-only: localStorage, then lang cookie, then DEFAULT_LANG. */
export function readSavedLang(): Lang {
  if (typeof window === "undefined") return DEFAULT_LANG;
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "en" || saved === "ar") return saved;
  } catch {
    /* ignore */
  }
  return resolveLang(readLangCookie());
}

export function persistLang(lang: Lang): void {
  if (typeof document !== "undefined") {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    try {
      document.cookie = `${LANG_KEY}=${lang};path=/;max-age=${LANG_COOKIE_MAX_AGE};samesite=lax`;
    } catch {
      /* ignore */
    }
  }
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      /* ignore */
    }
  }
}

/** Runs in <head> before paint so html lang/dir match the saved preference (default en). */
export const LANG_BOOTSTRAP_SCRIPT = `(function(){var k="${LANG_KEY}",l="${DEFAULT_LANG}";try{var s=localStorage.getItem(k);if(s==="en"||s==="ar")l=s;else{var m=document.cookie.match(new RegExp("(?:^|; )"+k+"=([^;]*)"));if(m&&(m[1]==="en"||m[1]==="ar"))l=m[1];}}catch(e){}document.documentElement.lang=l;document.documentElement.dir=l==="ar"?"rtl":"ltr";})();`;

const strings = {
  ar: {
    brand: "واحد",
    family: "عائلة العضد",
    markAria: "واحد",
    networkNav: "الشبكة",
    deskNav: "مكتبي",
    invite: "ادعُ",
    round: "الجولة",
    storyKicker: "مستوى المحفظة · بلا حساب · USDT",
    storyH1a: "قد تكون بخير اليوم.",
    storyH1b: "غيرك ليس كذلك.",
    storyP1:
      "هذا ليس يانصيباً. هذه عائلة. عائلة العضد. خمسة USDT على TRC-20، وتصبح عضيداً. لا تدخل لتأخذ. ادخل لأنك عضُد أحد.",
    storyP2:
      "لا دولة. لا بنك. لا حساب. لا اسم إلا محفظتك. المال، الخدمة، القوة، النفوذ. كل مليون يصل إلى واحد منا. كل عضيد ناشر.",
    storyEtymWord1: "عَضُد",
    storyEtym1: "الذراع. القوة. من يشدّ أزرك.",
    storyEtymWord2: "عَضِيد",
    storyEtym2: "من يقف بجانبك ويمدّك قوة. كل دافعٍ عضيد.",
    joinCta: "كن عضيداً · 5 USDT",
    sendThree: "أرسل لثلاثة",
    openNetwork: "افتح الشبكة",
    houseWallet: "محفظة البيت",
    joinFlowTitle: "ثلاث خطوات للانضمام",
    joinFlow1t: "افتح منصتك",
    joinFlow1: "بينانس أو أي منصة تستخدمها. اختر سحب USDT.",
    joinFlow2t: "أرسل 5 USDT على TRC-20",
    joinFlow2: "اختر شبكة TRC-20 (ترون). المبلغ: 5 USDT بالضبط.",
    joinFlow3t: "انسخ عنوان البيت وأرسل",
    joinFlow3: "الصق عنوان البيت أدناه، أرسل، ثم سجّل محفظة الصرف والبلد في النموذج.",
    joinWarnNetwork: "تحذير: شبكة خاطئة = خسارة المال. استخدم TRC-20 فقط.",
    joinWarnAmount: "المبلغ يجب أن يكون 5 USDT.",
    scanHint: "امسح أو انسخ عنوان البيت — TRC-20 · 5 USDT",
    address: "العنوان",
    tronFees: "TRC-20 (ترون) هي الشبكة الأساسية لمحفظة البيت.",
    ethGas: "متقدم: غاز إيثيريوم مرتفع. استخدم TRC-20 إن أمكن.",
    best: "الأساسية",
    advanced: "متقدم",
    joinTitle: "أدخل محفظتك. تصبح عضيداً.",
    joinBody: "بلا اسم. بلا دخول. محفظتك هي مكتبك. اختر البلد الذي تقدر تخدم منه — هذه عقدتك على الشبكة.",
    payoutWallet: "محفظة الصرف",
    serveCountry: "البلد الذي تقدر تخدم منه",
    joining: "جارٍ الانضمام…",
    yourGift: "عطاؤك هذه الجولة",
    openDesk: "افتح مكتبي",
    point1: "بلا حساب. كل دافع عضيد. المحفظة هي الاسم.",
    point2: "لا تدخل لتأخذ. ادخل لأنك عضُد أحد.",
    point3: "المال، الخدمة، القوة، النفوذ. كل مليون يعين واحداً منا.",
    newAdhuds: "عضيدون جدد",
    live: "حيّ",
    noAdhud: "لا عضيد بعد. كن الأول.",
    howTitle: "كيف يعمل البيت",
    step1t: "كن عضيداً",
    step1: "أرسل 5 USDT على TRC-20، سجّل محفظتك والبلد الذي تقدر تخدم منه.",
    step2t: "يقوى العضد",
    step2: "الهدف: 1,000,000 USDT. كل عطية تظهر في السجل والشبكة.",
    step3t: "يصل العون إلى عضيد",
    step3: "عند المليون يصل العون إلى واحد منا. وتبدأ جولة جديدة.",
    prevKicker: "الجولة السابقة · وصل العون",
    prevTitle: "هذا العضيد استلم المليون.",
    copyAddress: "انسخ العنوان",
    footerLead: "نحن العضد. كل دافعٍ عضيد.",
    footerBody: "لا دولة. لا بنك. لا حساب. تحويلات USDT نهائية. كل عطية عضد. كل مليون عون.",
    toastJoined: "أنت عضيد. أرسل هذا لثلاثة.",
    toastMillion: "وصل المليون. العون بلغ عضيداً.",
    toastJoinFail: "تعذر الانضمام. حاول مرة أخرى.",
    aidArrived: "وصل العون",
    millionReached: "المليون بلغ واحداً منا",
    millionBody: "هذه المحفظة استلمت عون البيت. جولة جديدة مفتوحة.",
    copyWallet: "انسخ المحفظة",
    continue: "تابع",
    close: "إغلاق",
    copy: "نسخ",
    copied: "تم النسخ",
    totalRound: "المجموع هذه الجولة",
    of: "من",
    adhuds: "عضد",
    remaining: "المتبقي",
    networkTitle: "شبكة العضد",
    networkLead: "كل عقدة عضيد. التجمع بلد الخدمة. المركز مجموع البيت — بلا حركة وهمية.",
    serveCountries: "بلدان الخدمة",
    whereServe: "من أين يقدر العضد أن يخدم",
    noneYet: "لا عضد بعد.",
    mapAria: "شبكة العضد. اضغط عقدة لفتح مكتبه.",
    shareKickerNew: "أنت عضيد",
    shareKicker: "انشر",
    shareTitle: "أرسل هذا لثلاثة. لا تشرح.",
    shareTitleJoined: "أرسل لثلاثة",
    shareBody: "واتساب أولاً. الكلام يعمل وحده. كل عضيد ناشر.",
    shareBodyJoined: "انسخ النص أو اضغط واتساب. ثلاثة أشخاص — لا تشرح أكثر.",
    shareDismissLater: "لاحقاً",
    inviteDeskTitle: "ادعُ ثلاثة",
    inviteDeskBody: "رابطك يحمل عضدك. انسخ الرسالة أو أرسلها مباشرة.",
    inviteLink: "رابط الدعوة",
    copyInvite: "انسخ رسالة الدعوة",
    wa: "أرسل على واتساب",
    postX: "انشر على X",
    copyText: "انسخ النص",
    shareDevice: "شارك من هذا الجهاز",
    sent: "أُرسل.",
    copiedPaste: "نُسخ. الصقه في أي مكان.",
    deskKicker: "مكتب العضيد",
    yourLedger: "سجلك",
    given: "أُعطي",
    thisRound: "هذه الجولة",
    servesFrom: "يخدم من",
    messageHouse: "راسل البيت",
    messages: "الرسائل",
    messagesLead:
      "محفظة إلى محفظة. راسل البيت أو أي عضيد. أرفق اسم ملف ليعرف الطرف الآخر ما ينتظره — أرسل الملف خارج الصفحة.",
    recipient: "محفظة المستلم",
    talkingTo: "تتحدث مع",
    theHouse: "البيت",
    noMessages: "لا رسائل بعد.",
    you: "أنت",
    write: "اكتب لهذا العضيد",
    fileName: "اسم ملف اختياري",
    attach: "إرفاق",
    send: "أرسل",
    sending: "جارٍ الإرسال…",
    sendFail: "تعذر الإرسال.",
    invalidPeer: "محفظة المستلم غير صالحة",
    unknownWallet: "محفظة غير معروفة",
    unknownBody: "أدخل عنوان TRC-20 أو ERC-20 لفتح مكتب.",
    joinFromHouse: "انضم من البيت",
    backHouse: "العودة إلى البيت",
    houseOnly: "للبيت فقط",
    activateAdmin: "تفعيل الإدارة",
    editWallet: "تعديل محفظة البيت",
    setupHelp: "ضع كلمة سر والصق محفظة الاستلام. الترس يبقى على هذا الجهاز بعد الحفظ.",
    editHelp: "أدخل كلمة سر الإدارة لتغيير عنوان الاستلام. رمز QR يتحدث فوراً.",
    adminPass: "كلمة سر الإدارة",
    confirmPass: "تأكيد الكلمة",
    houseTrc: "محفظة البيت · TRC-20",
    houseErc: "محفظة البيت · ERC-20 (متقدم)",
    saving: "جارٍ الحفظ…",
    saveActivate: "احفظ وفعّل",
    saveWallet: "احفظ المحفظة",
    adminLive: "الإدارة تعمل. المحفظة محفوظة.",
    walletUpdated: "محفظة البيت حُدّثت.",
    saveFail: "تعذر الحفظ. حاول مرة أخرى.",
    passShort: "ثمانية أحرف على الأقل",
    passMismatch: "الكلمتان غير متطابقتين",
    hintBtc: "هذا عنوان بيتكوين، ليس USDT. افتح USDT على ترون (TRC-20) وانسخ عنواناً يبدأ بـ T.",
    hintTrc: "عنوان TRC-20 غير صالح. يجب أن يبدأ بـ T.",
    hintErc: "عنوان ERC-20 غير صالح. يجب أن يبدأ بـ 0x.",
    hintBad: "عنوان غير صالح. TRC-20 يبدأ بـ T. ERC-20 يبدأ بـ 0x.",
    mismatchTrc: "هذا عنوان ترون — اختر TRC-20.",
    mismatchErc: "هذا عنوان إيثيريوم — اختر ERC-20.",
    qrAlt: "رمز QR لمحفظة البيت",
    shareTitleLine: "واحد · عائلة العضد",
    now: "الآن",
    mAgo: "د",
    hAgo: "س",
    dAgo: "ي",
    threads: "المحادثات",
    filePrefix: "ملف:",
    houseAdmin: "إدارة البيت",
    totalShort: "المجموع",
  },
  en: {
    brand: "Wahid",
    family: "The ʿAḍud",
    markAria: "Wahid",
    networkNav: "Network",
    deskNav: "My desk",
    invite: "Invite",
    round: "Round",
    storyKicker: "Wallet-level · no account · USDT",
    storyH1a: "You may be fine today.",
    storyH1b: "Someone else is not.",
    storyP1:
      "This is not a lottery. This is a family. The ʿAḍud. Five USDT on TRC-20, and you become ʿAḍīd. Do not join to take. Join because you are someone's arm.",
    storyP2:
      "No state. No bank. No account. No name but your wallet. Money, service, force, influence. Every million reaches one of us. Every ʿAḍīd is a publisher.",
    storyEtymWord1: "ʿAḍud",
    storyEtym1: "The upper arm. Strength. The one who backs you.",
    storyEtymWord2: "ʿAḍīd",
    storyEtym2: "The one who stands beside you and lends that strength. Every payer is ʿAḍīd.",
    joinCta: "Become ʿAḍīd · 5 USDT",
    sendThree: "Send to three",
    openNetwork: "Open the network",
    houseWallet: "House wallet",
    joinFlowTitle: "Three steps to join",
    joinFlow1t: "Open your exchange",
    joinFlow1: "Binance or whatever you use. Choose Withdraw USDT.",
    joinFlow2t: "Send 5 USDT on TRC-20",
    joinFlow2: "Choose network TRC-20 (Tron). Amount: exactly 5 USDT.",
    joinFlow3t: "Copy the House address and send",
    joinFlow3: "Paste the House address below, send, then enter your payout wallet and country in the form.",
    joinWarnNetwork: "Warning: wrong network = lost funds. Use TRC-20 only.",
    joinWarnAmount: "The amount must be 5 USDT.",
    scanHint: "Scan or copy the House address — TRC-20 · 5 USDT",
    address: "Address",
    tronFees: "TRC-20 (Tron) is the primary network for the House wallet.",
    ethGas: "Advanced: Ethereum gas is high. Use TRC-20 when you can.",
    best: "primary",
    advanced: "advanced",
    joinTitle: "Enter your wallet. Become ʿAḍīd.",
    joinBody: "No name. No login. Your wallet is the desk. Pick the country you can serve from — that is your node on the network.",
    payoutWallet: "Payout wallet",
    serveCountry: "Country you can serve",
    joining: "Joining…",
    yourGift: "Your gift this round",
    openDesk: "Open my desk",
    point1: "No account. Every payer is ʿAḍīd. The wallet is the name.",
    point2: "Do not join to take. Join because you are someone's arm.",
    point3: "Money, service, force, influence. Every million aids one of us.",
    newAdhuds: "New ʿAḍīd",
    live: "Live",
    noAdhud: "No ʿAḍīd yet. Be the first.",
    howTitle: "How the House works",
    step1t: "Become ʿAḍīd",
    step1: "Send 5 USDT on TRC-20, register your wallet and the country you can serve.",
    step2t: "The arm strengthens",
    step2: "Target: 1,000,000 USDT. Every gift shows on the ledger and the network.",
    step3t: "Aid reaches an ʿAḍīd",
    step3: "At one million, aid lands with one of us. A new round begins.",
    prevKicker: "Previous round · aid arrived",
    prevTitle: "This ʿAḍīd received the million.",
    copyAddress: "Copy address",
    footerLead: "We are the arm. Every payer is ʿAḍīd.",
    footerBody: "No state. No bank. No account. USDT transfers are final. Each gift is an arm. Each million is aid.",
    toastJoined: "You are ʿAḍīd. Send this to three people.",
    toastMillion: "The million landed. Aid reached an ʿAḍīd.",
    toastJoinFail: "Could not join. Try again.",
    aidArrived: "Aid arrived",
    millionReached: "The million reached one of us",
    millionBody: "This wallet received the House aid. A new round is open.",
    copyWallet: "Copy wallet",
    continue: "Continue",
    close: "Close",
    copy: "Copy",
    copied: "Copied",
    totalRound: "The total this round",
    of: "of",
    adhuds: "ʿAḍīd",
    remaining: "Remaining",
    networkTitle: "The ʿAḍud network",
    networkLead: "Each node is ʿAḍīd. Clusters are countries they can serve from. The center is the House total — no fake motion.",
    serveCountries: "Service countries",
    whereServe: "Where ʿAḍīd can serve",
    noneYet: "No ʿAḍīd yet.",
    mapAria: "ʿAḍud network. Click a node to open a desk.",
    shareKickerNew: "You are ʿAḍīd",
    shareKicker: "Spread",
    shareTitle: "Send this to three people. Do not explain.",
    shareTitleJoined: "Send to three",
    shareBody: "WhatsApp first. The words work alone. Every ʿAḍīd is a publisher.",
    shareBodyJoined: "Copy the text or tap WhatsApp. Three people — no extra explanation.",
    shareDismissLater: "Later",
    inviteDeskTitle: "Invite three",
    inviteDeskBody: "Your link carries your arm. Copy the message or send it directly.",
    inviteLink: "Invite link",
    copyInvite: "Copy invite message",
    wa: "Send on WhatsApp",
    postX: "Post on X",
    copyText: "Copy text",
    shareDevice: "Share from this device",
    sent: "Sent.",
    copiedPaste: "Copied. Paste it anywhere.",
    deskKicker: "ʿAḍīd desk",
    yourLedger: "Your ledger",
    given: "Given",
    thisRound: "This round",
    servesFrom: "Serves from",
    messageHouse: "Message the House",
    messages: "Messages",
    messagesLead:
      "Wallet to wallet. Talk to the House, or to any ʿAḍīd. Attach a file name so they know what to expect — send the file off-band.",
    recipient: "Recipient wallet",
    talkingTo: "Talking to",
    theHouse: "The House",
    noMessages: "No messages yet.",
    you: "You",
    write: "Write to this ʿAḍīd",
    fileName: "Optional file name",
    attach: "Attach",
    send: "Send",
    sending: "Sending…",
    sendFail: "Could not send.",
    invalidPeer: "Invalid recipient wallet",
    unknownWallet: "Unknown wallet",
    unknownBody: "Enter a TRC-20 or ERC-20 address to open a desk.",
    joinFromHouse: "Join from the House",
    backHouse: "Back to the House",
    houseOnly: "House only",
    activateAdmin: "Activate admin",
    editWallet: "Edit House wallet",
    setupHelp: "Set a password and paste the receiving wallet. The gear stays on this device after save.",
    editHelp: "Enter the admin password to change the receiving address. The QR updates at once.",
    adminPass: "Admin password",
    confirmPass: "Confirm password",
    houseTrc: "House wallet · TRC-20",
    houseErc: "House wallet · ERC-20 (advanced)",
    saving: "Saving…",
    saveActivate: "Save and activate",
    saveWallet: "Save wallet",
    adminLive: "Admin is live. Wallet saved.",
    walletUpdated: "House wallet updated.",
    saveFail: "Could not save. Try again.",
    passShort: "At least 8 characters",
    passMismatch: "Passwords do not match",
    hintBtc: "That is a Bitcoin address, not USDT. Open USDT on Tron (TRC-20) and copy an address starting with T.",
    hintTrc: "Invalid TRC-20 address. It must start with T.",
    hintErc: "Invalid ERC-20 address. It must start with 0x.",
    hintBad: "Invalid address. TRC-20 starts with T. ERC-20 starts with 0x.",
    mismatchTrc: "That is a Tron address — choose TRC-20.",
    mismatchErc: "That is an Ethereum address — choose ERC-20.",
    qrAlt: "QR code for the House wallet",
    shareTitleLine: "Wahid · The ʿAḍud",
    now: "now",
    mAgo: "m",
    hAgo: "h",
    dAgo: "d",
    threads: "Threads",
    filePrefix: "file:",
    houseAdmin: "House admin",
    totalShort: "TOTAL",
  },
} as const;

export type CopyKey = keyof typeof strings.ar;

export const HINT_KEYS = {
  btc: "hintBtc",
  trc20: "hintTrc",
  erc20: "hintErc",
  invalid: "hintBad",
} as const satisfies Record<"btc" | "trc20" | "erc20" | "invalid", CopyKey>;

type I18nValue = {
  lang: Lang;
  dir: "rtl" | "ltr";
  t: (key: CopyKey) => string;
  setLang: (lang: Lang) => void;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => readSavedLang());

  useEffect(() => {
    persistLang(lang);
  }, [lang]);

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      dir: lang === "ar" ? "rtl" : "ltr",
      t: (key) => strings[lang][key],
      setLang: setLangState,
    }),
    [lang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export const SHARE_COPY = {
  ar: `قد تكون بخير اليوم.
غيرك ليس كذلك.

ادفع 5 USDT على TRC-20.
تصبح عضيداً.

لا تدخل لتأخذ.
ادخل لأنك عضُد أحد.

واحد · عائلة العضد`,
  en: `You may be fine today.
Someone else is not.

Pay 5 USDT on TRC-20.
Become ʿAḍīd.

Do not join to take.
Join because you are someone's arm.

Wahid · The ʿAḍud`,
};

export const COUNTRY_AR: Record<string, string> = {
  "Saudi Arabia": "السعودية",
  "United Arab Emirates": "الإمارات",
  Kuwait: "الكويت",
  Qatar: "قطر",
  Bahrain: "البحرين",
  Oman: "عُمان",
  Egypt: "مصر",
  Jordan: "الأردن",
  Morocco: "المغرب",
  Algeria: "الجزائر",
  Tunisia: "تونس",
  Iraq: "العراق",
  Yemen: "اليمن",
  Turkey: "تركيا",
  Pakistan: "باكستان",
  India: "الهند",
  Indonesia: "إندونيسيا",
  Malaysia: "ماليزيا",
  "United States": "الولايات المتحدة",
  "United Kingdom": "بريطانيا",
  Germany: "ألمانيا",
  France: "فرنسا",
  Canada: "كندا",
  Nigeria: "نيجيريا",
  Kenya: "كينيا",
  "South Africa": "جنوب أفريقيا",
  Other: "أخرى",
};

export function countryLabel(name: string, lang: Lang): string {
  if (lang === "ar") return COUNTRY_AR[name] ?? name;
  return name;
}
