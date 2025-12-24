export const labels = {
    // Common
    save: 'সংরক্ষণ করুন',
    cancel: 'বাতিল',
    delete: 'মুছুন',
    edit: 'সম্পাদনা',
    view: 'দেখুন',
    download: 'ডাউনলোড',
    print: 'প্রিন্ট করুন',
    search: 'খুঁজুন',
    filter: 'ফিল্টার',
    export: 'এক্সপোর্ট',
    add: 'যোগ করুন',
    create: 'তৈরি করুন',
    update: 'আপডেট করুন',
    submit: 'জমা দিন',
    approve: 'অনুমোদন করুন',
    reject: 'প্রত্যাখ্যান করুন',

    // Navigation
    home: 'হোম',
    dashboard: 'ড্যাশবোর্ড',
    labor: 'শ্রমিক',
    materials: 'মালামাল',
    activities: 'কাজের খরচ',
    advances: 'অগ্রিম',
    expenses: 'খরচ',
    reports: 'রিপোর্ট',
    settings: 'সেটিংস',
    admin: 'অ্যাডমিন',
    logout: 'লগআউট',

    // Forms
    date: 'তারিখ',
    amount: 'পরিমাণ',
    quantity: 'পরিমাণ',
    unit: 'একক',
    rate: 'দর',
    total: 'মোট',
    description: 'বিবরণ',
    notes: 'নোট',
    attachments: 'সংযুক্তি',

    // Labor
    laborType: 'শ্রমিকের ধরন',
    contract: 'চুক্তি',
    daily: 'দৈনিক',
    crewName: 'দলের নাম',
    laborName: 'শ্রমিকের নাম',
    workType: 'কাজের ধরন',
    headcount: 'লোক সংখ্যা',
    khoraki: 'খোরাকি',
    khorakiPerHead: 'খোরাকি (প্রতি জন)',
    khorakiTotal: 'খোরাকি (মোট)',
    wage: 'মজুরি',
    wageTotal: 'মজুরি (মোট)',

    // Materials
    item: 'মালামাল',
    supplier: 'সরবরাহকারী',
    paymentMethod: 'পেমেন্ট পদ্ধতি',
    paymentRef: 'পেমেন্ট রেফারেন্স',
    bulkBreakdown: 'বাল্ক ব্রেকডাউন',
    baseRate: 'মূল দর',
    baseCost: 'মূল খরচ',
    transport: 'পরিবহন',
    transportCost: 'পরিবহন খরচ',
    unloading: 'খালাস',
    unloadingRate: 'খালাস দর',
    unloadingCost: 'খালাস খরচ',
    grandTotal: 'সর্বমোট',

    // Activities
    category: 'বিভাগ',
    subcategory: 'উপ-বিভাগ',
    vendor: 'বিক্রেতা',

    // Advances
    person: 'ব্যক্তি',
    role: 'ভূমিকা',
    purpose: 'উদ্দেশ্য',
    balance: 'ব্যালেন্স',
    currentBalance: 'বর্তমান ব্যালেন্স',
    totalAdvances: 'মোট অগ্রিম',
    totalExpenses: 'মোট খরচ',

    // Tender
    tender: 'টেন্ডার',
    tenderCode: 'টেন্ডার কোড',
    projectName: 'প্রকল্পের নাম',
    location: 'স্থান',
    clientDepartment: 'ক্লায়েন্ট বিভাগ',
    startDate: 'শুরুর তারিখ',
    endDate: 'শেষের তারিখ',

    // Status
    pending: 'অপেক্ষমাণ',
    approved: 'অনুমোদিত',
    rejected: 'প্রত্যাখ্যাত',
    active: 'সক্রিয়',
    inactive: 'নিষ্ক্রিয়',

    // Reports
    dailySheet: 'দৈনিক শিট',
    laborRegister: 'শ্রমিক খতিয়ান',
    materialsRegister: 'মালামাল খতিয়ান',
    activityRegister: 'কাজভিত্তিক খরচ খতিয়ান',
    advanceLedger: 'অগ্রিম হিসাব',
    tenderSummary: 'টেন্ডার সারসংক্ষেপ',

    // Settings
    settings: 'সেটিংস',

    // Time periods
    today: 'আজ',
    yesterday: 'গতকাল',
    thisWeek: 'এই সপ্তাহ',
    thisMonth: 'এই মাস',
    lastMonth: 'গত মাস',
    customRange: 'কাস্টম রেঞ্জ',

    // Validation
    required: 'এই ফিল্ডটি আবশ্যক',
    invalidAmount: 'সঠিক পরিমাণ লিখুন',
    invalidDate: 'সঠিক তারিখ নির্বাচন করুন',
    invalidEmail: 'সঠিক ইমেইল লিখুন',
    invalidPhone: 'সঠিক ফোন নম্বর লিখুন',

    // Messages
    saveSuccess: 'সফলভাবে সংরক্ষিত হয়েছে',
    saveError: 'সংরক্ষণ ব্যর্থ হয়েছে',
    deleteConfirm: 'আপনি কি নিশ্চিত মুছতে চান?',
    deleteSuccess: 'সফলভাবে মুছে ফেলা হয়েছে',
    updateSuccess: 'সফলভাবে আপডেট হয়েছে',
    loading: 'লোড হচ্ছে...',
    noData: 'কোন তথ্য নেই',

    // Payment methods
    cash: 'নগদ',
    bank: 'ব্যাংক',
    mfs: 'মোবাইল ব্যাংকিং',
    advance: 'অগ্রিম',
};

export function getBanglaNumber(num: number): string {
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().split('').map(d => {
        if (d >= '0' && d <= '9') {
            return banglaDigits[parseInt(d)];
        }
        return d;
    }).join('');
}

export function formatBanglaDate(date: Date | string): string {
    const months = [
        'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
        'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];

    const d = typeof date === 'string' ? new Date(date) : date;
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();

    return `${getBanglaNumber(day)} ${month} ${getBanglaNumber(year)}`;
}
