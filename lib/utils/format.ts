export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'BDT',
        minimumFractionDigits: 2,
    })
        .format(amount)
        .replace('BDT', '৳');
}

export function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-GB'); // DD/MM/YYYY
}

export function formatDateBangla(date: Date | string): string {
    const months = [
        'জানুয়ারি',
        'ফেব্রুয়ারি',
        'মার্চ',
        'এপ্রিল',
        'মে',
        'জুন',
        'জুলাই',
        'আগস্ট',
        'সেপ্টেম্বর',
        'অক্টোবর',
        'নভেম্বর',
        'ডিসেম্বর',
    ];

    const d = typeof date === 'string' ? new Date(date) : date;
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();

    return `${toBanglaNumber(day)} ${month} ${toBanglaNumber(year)}`;
}

export function toBanglaNumber(num: number | string): string {
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num
        .toString()
        .split('')
        .map((d) => (d >= '0' && d <= '9' ? banglaDigits[parseInt(d)] : d))
        .join('');
}

export function toEnglishNumber(banglaNum: string): string {
    const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

    return banglaNum
        .split('')
        .map((d) => {
            const index = banglaDigits.indexOf(d);
            return index !== -1 ? englishDigits[index] : d;
        })
        .join('');
}

export function formatPercentage(value: number, total: number): string {
    if (total === 0) return '০%';
    const percentage = (value / total) * 100;
    return `${toBanglaNumber(percentage.toFixed(1))}%`;
}
