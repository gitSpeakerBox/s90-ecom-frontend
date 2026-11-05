export interface LocalizedProductData {
  name: string
  category: string
  description?: string
}

/**
 * Arabic product translations keyed by product ID or slug.
 * In a production Sanity CMS setup, these would be localized fields (title.en, title.ar, category.en, category.ar).
 */
export const arabicProductTranslations: Record<string, LocalizedProductData> = {
  // ─── Jerseys (Screenshot Catalog) ──────────────────────────────────────────
  'jersey-rm-home-2425': {
    name: 'قميص ريال مدريد الأساسي 2024/25',
    category: 'قمصان الأندية',
  },
  'real-madrid-home-jersey-2024-25': {
    name: 'قميص ريال مدريد الأساسي 2024/25',
    category: 'قمصان الأندية',
  },

  'jersey-barca-home-2425': {
    name: 'قميص برشلونة الأساسي 2024/25',
    category: 'قمصان الأندية',
  },
  'barcelona-home-jersey-2024-25': {
    name: 'قميص برشلونة الأساسي 2024/25',
    category: 'قمصان الأندية',
  },

  'jersey-mufc-home-2425': {
    name: 'قميص مانشستر يونايتد الأساسي 2024/25',
    category: 'قمصان الأندية',
  },
  'manchester-united-home-jersey-2024-25': {
    name: 'قميص مانشستر يونايتد الأساسي 2024/25',
    category: 'قمصان الأندية',
  },

  'jersey-psg-home-2425': {
    name: 'قميص باريس سان جيرمان الأساسي 2024/25',
    category: 'قمصان الأندية',
  },
  'psg-home-jersey-2024-25': {
    name: 'قميص باريس سان جيرمان الأساسي 2024/25',
    category: 'قمصان الأندية',
  },

  'jersey-miami-home-2425': {
    name: 'قميص إنتر ميامي الأساسي 2024/25',
    category: 'قمصان الأندية',
  },
  'inter-miami-home-jersey-2024-25': {
    name: 'قميص إنتر ميامي الأساسي 2024/25',
    category: 'قمصان الأندية',
  },

  'jersey-nassr-home-2425': {
    name: 'قميص النصر الأساسي 2024/25',
    category: 'قمصان الأندية',
  },
  'al-nassr-home-jersey-2024-25': {
    name: 'قميص النصر الأساسي 2024/25',
    category: 'قمصان الأندية',
  },

  'jersey-germany-home-2425': {
    name: 'قميص منتخب ألمانيا الأساسي 2024/25',
    category: 'قمصان المنتخبات',
  },
  'germany-home-jersey-2024-25': {
    name: 'قميص منتخب ألمانيا الأساسي 2024/25',
    category: 'قمصان المنتخبات',
  },

  'jersey-milan-home-2425': {
    name: 'قميص إيه سي ميلان الأساسي 2024/25',
    category: 'قمصان الأندية',
  },
  'ac-milan-home-jersey-2024-25': {
    name: 'قميص إيه سي ميلان الأساسي 2024/25',
    category: 'قمصان الأندية',
  },

  'jersey-extra-retro-98': {
    name: 'قميص كونتيننتال 1998 الكلاسيكي',
    category: 'قمصان كلاسيكية',
  },
  'continental-1998-revival-retro-jersey': {
    name: 'قميص كونتيننتال 1998 الكلاسيكي',
    category: 'قمصان كلاسيكية',
  },

  'jersey-extra-azzurri-94': {
    name: 'قميص الآزوري التراثي 1994 الكلاسيكي',
    category: 'قمصان كلاسيكية',
  },
  'classic-1994-azzurri-heritage-retro-jersey': {
    name: 'قميص الآزوري التراثي 1994 الكلاسيكي',
    category: 'قمصان كلاسيكية',
  },

  'jersey-extra-atlas-away': {
    name: 'قميص أسود الأطلس التراثي الاحتياطي',
    category: 'قمصان المنتخبات',
  },
  'atlas-lions-national-heritage-away-jersey': {
    name: 'قميص أسود الأطلس التراثي الاحتياطي',
    category: 'قمصان المنتخبات',
  },

  'jersey-kids-pro-strike': {
    name: 'طقم برو سترايك للأطفال 2024/25',
    category: 'قمصان التدريب',
  },
  'kids-pro-strike-match-kit-2024-25': {
    name: 'طقم برو سترايك للأطفال 2024/25',
    category: 'قمصان التدريب',
  },

  // ─── Extended Base Jerseys ────────────────────────────────────────────────
  'jersey-apex-home-2425': {
    name: 'قميص إيبكس أتلتيك الأساسي 24/25',
    category: 'القمصان الأساسية',
  },
  'apex-athletic-home-jersey-24-25': {
    name: 'قميص إيبكس أتلتيك الأساسي 24/25',
    category: 'القمصان الأساسية',
  },

  'jersey-atlas-away-2425': {
    name: 'قميص أسود الأطلس التراثي الاحتياطي',
    category: 'القمصان الاحتياطية',
  },
  'atlas-lions-national-away-jersey': {
    name: 'قميص أسود الأطلس التراثي الاحتياطي',
    category: 'القمصان الاحتياطية',
  },

  'jersey-continental-retro-98': {
    name: 'قميص كونتيننتال 1998 الكلاسيكي',
    category: 'قمصان كلاسيكية',
  },

  'jersey-prostrike-aero-train': {
    name: 'قميص برو سترايك إيرو إيليت للتدريب',
    category: 'قمصان التدريب',
  },
  'pro-strike-aero-elite-training-jersey': {
    name: 'قميص برو سترايك إيرو إيليت للتدريب',
    category: 'قمصان التدريب',
  },

  'jersey-sahara-home-2425': {
    name: 'قميص ثعالب الصحراء الأساسي',
    category: 'القمصان الأساسية',
  },
  'sahara-desert-foxes-home-jersey': {
    name: 'قميص ثعالب الصحراء الأساسي',
    category: 'القمصان الأساسية',
  },

  'jersey-valence-away-2425': {
    name: 'قميص فالنس الاحتياطي 24/25',
    category: 'القمصان الاحتياطية',
  },
  'valence-sc-away-jersey-24-25': {
    name: 'قميص فالنس الاحتياطي 24/25',
    category: 'القمصان الاحتياطية',
  },

  'jersey-riviera-retro-84': {
    name: 'قميص ريفييرا 1984 الأوروبي الكلاسيكي',
    category: 'قمصان كلاسيكية',
  },
  'riviera-1984-european-retro-jersey': {
    name: 'قميص ريفييرا 1984 الأوروبي الكلاسيكي',
    category: 'قمصان كلاسيكية',
  },

  'jersey-apex-qzip-train': {
    name: 'قميص إيبكس بسحاب ربع للتدريب',
    category: 'قمصان التدريب',
  },
  'apex-performance-quarter-zip-training-jersey': {
    name: 'قميص إيبكس بسحاب ربع للتدريب',
    category: 'قمصان التدريب',
  },

  'jersey-olympians-centennial-home': {
    name: 'قميص أولمبيانز المئوي الأساسي',
    category: 'القمصان الأساسية',
  },
  'olympians-fc-centennial-home-jersey': {
    name: 'قميص أولمبيانز المئوي الأساسي',
    category: 'القمصان الأساسية',
  },

  'jersey-azzurri-heritage-retro-94': {
    name: 'قميص الآزوري التراثي 1994 الكلاسيكي',
    category: 'قمصان كلاسيكية',
  },
  'azzurri-1994-heritage-retro-jersey': {
    name: 'قميص الآزوري التراثي 1994 الكلاسيكي',
    category: 'قمصان كلاسيكية',
  },

  'jersey-velocity-prematch-train': {
    name: 'قميص فيلوسيتي للإحماء قبل المباراة',
    category: 'قمصان التدريب',
  },
  'velocity-pre-match-warmup-jersey': {
    name: 'قميص فيلوسيتي للإحماء قبل المباراة',
    category: 'قمصان التدريب',
  },

  'jersey-vanguard-blackout-third': {
    name: 'قميص فانغارد بلاك أوت الثالث 24/25',
    category: 'القمصان الاحتياطية',
  },
  'vanguard-blackout-third-kit-24-25': {
    name: 'قميص فانغارد بلاك أوت الثالث 24/25',
    category: 'القمصان الاحتياطية',
  },

  // ─── Shoes (Screenshot Catalog) ───────────────────────────────────────────
  'shoe-ysl-sl01': {
    name: 'حذاء سنيكرز سان لوران SL/01 برقبة منخفضة',
    category: 'سنيكرز',
  },
  'saint-laurent-sl-01-low-top-sneaker': {
    name: 'حذاء سنيكرز سان لوران SL/01 برقبة منخفضة',
    category: 'سنيكرز',
  },

  'shoe-gucci-jordaan': {
    name: 'حذاء جوردان لوفر جلدي من غوتشي',
    category: 'لوفر',
  },
  'jordaan-loafer-in-leather': {
    name: 'حذاء جوردان لوفر جلدي من غوتشي',
    category: 'لوفر',
  },

  'shoe-bal-speed2': {
    name: 'سنيكرز سبيد 2.0 من نسيج معاد تدويره من بالنسياغا',
    category: 'سنيكرز',
  },
  'speed-2-0-recycled-knit-sneakers': {
    name: 'سنيكرز سبيد 2.0 من نسيج معاد تدويره من بالنسياغا',
    category: 'سنيكرز',
  },

  'shoe-tods-gommino': {
    name: 'حذاء غومينو لوفر جلدي من تودز',
    category: 'لوفر',
  },
  'leather-gommino-loafer': {
    name: 'حذاء غومينو لوفر جلدي من تودز',
    category: 'لوفر',
  },

  'shoe-clarks-wallabee': {
    name: 'حذاء والابي شمواه من كلاركس',
    category: 'أحذية كاجوال',
  },
  'wallabee-suede-shoes': {
    name: 'حذاء والابي شمواه من كلاركس',
    category: 'أحذية كاجوال',
  },

  'shoe-tods-driver': {
    name: 'حذاء درايفر لوفر جلدي من تودز',
    category: 'لوفر',
  },
  'driver-loafer-in-leather': {
    name: 'حذاء درايفر لوفر جلدي من تودز',
    category: 'لوفر',
  },

  'shoe-nb-9060': {
    name: 'سنيكرز نيو بالانس 9060',
    category: 'سنيكرز',
  },
  '9060-sneakers': {
    name: 'سنيكرز نيو بالانس 9060',
    category: 'سنيكرز',
  },

  'shoe-birk-arizona': {
    name: 'صندل أريزونا بنعل مرن من بيركنستوك',
    category: 'أحذية كاجوال',
  },
  'arizona-soft-footbed-sandals': {
    name: 'صندل أريزونا بنعل مرن من بيركنستوك',
    category: 'أحذية كاجوال',
  },

  'shoe-extra-sovereign-oxford': {
    name: 'حذاء سوفرين أوكسفورد جلدي رسمي',
    category: 'أحذية رسمية',
  },
  'sovereign-cap-toe-oxford-formal-leather-shoes': {
    name: 'حذاء سوفرين أوكسفورد جلدي رسمي',
    category: 'أحذية رسمية',
  },

  'shoe-extra-belgravia-monk': {
    name: 'حذاء بيلغرافيا مزدوج المشبك جلدي رسمي',
    category: 'أحذية رسمية',
  },
  'belgravia-double-monk-strap-formal-leather-shoes': {
    name: 'حذاء بيلغرافيا مزدوج المشبك جلدي رسمي',
    category: 'أحذية رسمية',
  },

  'shoe-extra-windsor-wholecut': {
    name: 'حذاء وندسور هول كت رسمي من جلد براء',
    category: 'أحذية رسمية',
  },
  'windsor-wholecut-patent-formal-leather-shoes': {
    name: 'حذاء وندسور هول كت رسمي من جلد براء',
    category: 'أحذية رسمية',
  },

  'shoe-extra-amalfi-loafers': {
    name: 'حذاء أمالفي لوفر بشراشيب من جلد العجل المنسوج',
    category: 'لوفر',
  },
  'amalfi-woven-calfskin-tassel-loafers': {
    name: 'حذاء أمالفي لوفر بشراشيب من جلد العجل المنسوج',
    category: 'لوفر',
  },

  // ─── Extended Base Shoes ──────────────────────────────────────────────────
  'shoe-veloce-court-sneaker': {
    name: 'سنيكرز فيلوتشي كورت فاخر مينيمال',
    category: 'سنيكرز',
  },
  'veloce-court-sneaker': {
    name: 'سنيكرز فيلوتشي كورت فاخر مينيمال',
    category: 'سنيكرز',
  },

  'shoe-milano-leather-penny-loafer': {
    name: 'حذاء ميلانو بيني لوفر جلدي يدوي الصنع',
    category: 'لوفر',
  },
  'milano-leather-penny-loafer': {
    name: 'حذاء ميلانو بيني لوفر جلدي يدوي الصنع',
    category: 'لوفر',
  },

  'shoe-sovereign-cap-toe-oxford': {
    name: 'حذاء سوفرين أوكسفورد جلدي رسمي',
    category: 'أحذية رسمية',
  },

  'shoe-cortina-technical-runner': {
    name: 'سنيكرز كورتينا رانر الرياضي التقني',
    category: 'سنيكرز',
  },
  'cortina-technical-runner': {
    name: 'سنيكرز كورتينا رانر الرياضي التقني',
    category: 'سنيكرز',
  },

  'shoe-kensington-burnished-derby': {
    name: 'حذاء كنسينغتون ديربي من جلد العجل المصقول',
    category: 'أحذية رسمية',
  },
  'kensington-burnished-derby': {
    name: 'حذاء كنسينغتون ديربي من جلد العجل المصقول',
    category: 'أحذية رسمية',
  },

  'shoe-belgravia-double-monk-strap': {
    name: 'حذاء بيلغرافيا مزدوج المشبك جلدي رسمي',
    category: 'أحذية رسمية',
  },

  'shoe-amalfi-woven-tassel-loafer': {
    name: 'حذاء أمالفي لوفر بشراشيب من جلد العجل المنسوج',
    category: 'لوفر',
  },

  'shoe-apex-glide-performance-trainer': {
    name: 'سنيكرز إيبكس غلايد الرياضي اليومي',
    category: 'سنيكرز',
  },
  'apex-glide-performance-trainer': {
    name: 'سنيكرز إيبكس غلايد الرياضي اليومي',
    category: 'سنيكرز',
  },

  'shoe-montecarlo-grained-driver': {
    name: 'حذاء مونت كارلو درايفينغ لوفر من الجلد المحبب',
    category: 'لوفر',
  },
  'monte-carlo-grained-driver': {
    name: 'حذاء مونت كارلو درايفينغ لوفر من الجلد المحبب',
    category: 'لوفر',
  },

  'shoe-windsor-wholecut-patent': {
    name: 'حذاء وندسور هول كت رسمي من جلد براء',
    category: 'أحذية رسمية',
  },

  'shoe-torino-suede-chelsea-boot': {
    name: 'بوت تورينو تشيلسي شمواه إيطالي',
    category: 'أحذية كاجوال',
  },
  'torino-suede-chelsea-boot': {
    name: 'بوت تورينو تشيلسي شمواه إيطالي',
    category: 'أحذية كاجوال',
  },

  'shoe-via-condotti-dress-loafer': {
    name: 'حذاء فيا كوندوتي لوفر فاخر من جلد العجل المصقول',
    category: 'لوفر',
  },
  'via-condotti-dress-loafer': {
    name: 'حذاء فيا كوندوتي لوفر فاخر من جلد العجل المصقول',
    category: 'لوفر',
  },
}

