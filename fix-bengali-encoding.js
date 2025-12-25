const fs = require('fs');

// Files to fix
const filesToFix = [
  'app/(protected)/tender/[tenderId]/reports/daily/page.tsx',
  'app/(protected)/tender/[tenderId]/reports/activities/page.tsx'
];

// Map of corrupted to correct - word-level replacements
const fixes = {
  // Individual words
  'à¦¤à¦¾à¦°à¦¿à¦': 'তারিখ',
  'à¦¨à¦¿à¦°à§à¦¬à¦¾à¦à¦¨': 'নির্বাচন',
  'à¦à¦°à§à¦¨': 'করুন',
  'à¦à¦à§à¦°': 'আগের',
  'à¦¦à¦¿à¦¨': 'দিন',
  'à¦ªà¦°à§à¦°': 'পরের',
  'à¦ à¦¿à¦à¦¾à¦¦à¦¾à¦°à¦¿': 'ঠিকাদারি',
  'à¦¹à¦¿à¦¸à¦¾à¦¬': 'হিসাব',
  'à¦²à§à¦': 'লোক',
  'à¦à§à¦°à¦¾à¦à¦¿': 'খোরাকি',
  'à¦®à§à¦': 'মোট',
  'à¦¦à§à¦¨à¦¿à¦': 'দৈনিক',
  'à¦¸à¦°à¦¬à¦°à¦¾à¦¹à¦à¦¾à¦°à§': 'সরবরাহকারী',
  'à¦à¦¾à¦à§à¦°': 'কাজের',
  'à¦à¦°à¦': 'খরচ',
  
  // Phrases (run after individual words)
  'তারিখ নির্বাচন করুন': 'তারিখ নির্বাচন করুন',
  'আগের দিন': 'আগের দিন',
  'পরের দিন': 'পরের দিন',
  'ঠিকাদারি হিসাব': 'ঠিকাদারি হিসাব',
  'কাজের খরচ': 'কাজের খরচ',
  
  // Additional patterns from before
  'à¦§à¦°à¦¨': 'ধরন',
  'à¦¬à¦¿à¦¬à¦°à¦£': 'বিবরণ',
  'à¦®à¦¾à¦²à¦¾à¦®à¦¾à¦²': 'মালামাল',
  'à¦ªà¦°à¦¿à¦®à¦¾à¦£': 'পরিমাণ',
  'à¦¦à¦°': 'দর',
  'à¦¬à¦¿à¦­à¦¾à¦': 'বিভাগ',
  'à¦Ÿà§‡à¦¨à§à¦¡à¦¾à¦°': 'টেন্ডার',
  'à¦•à§‹à¦¡': 'কোড',
  'à¦ªà§à¦°à¦•à¦²à§à¦ªà§‡à¦°': 'প্রকল্পের',
  'à¦¨à¦¾à¦®': 'নাম',
  'à¦¸à§à¦¥à¦¾à¦¨': 'স্থান',
  'à¦¶à§à¦°à¦®à¦¿à¦•': 'শ্রমিক',
  'à¦®à¦œà§à¦°à¦¿': 'মজুরি',
  'à¦šà§à¦•à§à¦¤à¦¿': 'চুক্তি',
  'à¦‰à¦ªà¦®à§‹à¦Ÿ': 'উপমোট',
  'à¦¬à¦¿à¦•à§à¦°à§‡à¦¤à¦¾': 'বিক্রেতা',
  'à¦…à¦—à§à¦°à¦¿à¦®': 'অগ্রিম',
  'à¦ªà§à¦°à¦¦à¦¾à¦¨': 'প্রদান',
  'à¦¬à§à¦¯à¦•à§à¦¤à¦¿': 'ব্যক্তি',
  'à¦‰à¦¦à§à¦¦à§‡à¦¶à§à¦¯': 'উদ্দেশ্য',
  'à¦•à§‹à¦¨': 'কোন',
  'à¦à¦¨à§à¦Ÿà§à¦°à¦¿': 'এন্ট্রি',
  'à¦¨à§‡à¦‡': 'নেই',
  'à¦¦à¦¿à¦¨à§‡à¦°': 'দিনের',
  'à¦¸à¦¾à¦°à¦¸à¦‚à¦•à§à¦·à§‡à¦ª': 'সারসংক্ষেপ',
  'à¦ªà§à¦°à¦¸à§à¦¤à§à¦¤à¦•à¦¾à¦°à§€': 'প্রস্তুতকারী',
  'à¦ªà¦°à§€à¦•à§à¦·à¦•': 'পরীক্ষক',
  'à¦…à¦¨à§à¦®à§‹à¦¦à¦¨à¦•à¦¾à¦°à§€': 'অনুমোদনকারী',
  'à¦¸à§à¦¬à¦¾à¦•à§à¦·à¦°': 'স্বাক্ষর',
  'à¦°à¦¿à¦ªà§‹à¦°à§à¦Ÿ': 'রিপোর্ট',
  'à¦®à§‡à¦¨à§': 'মেনু',
  'à¦¸à¦®à§‚à¦¹': 'সমূহ'
};

filesToFix.forEach(file => {
  try {
    console.log(`\nProcessing: ${file}`);
    let content = fs.readFileSync(file, 'latin1'); // Read as latin1 to preserve bytes
    let changeCount = 0;
    
    Object.keys(fixes).forEach(corrupted => {
      const correct = fixes[corrupted];
      const regex = new RegExp(corrupted.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const matches = (content.match(regex) || []).length;
      
      if (matches > 0) {
        content = content.replace(regex, correct);
        changeCount += matches;
        console.log(`  ✓ Replaced ${matches}x: "${corrupted.substring(0,20)}..." -> "${correct}"`);
      }
    });
    
    if (changeCount > 0) {
      fs.writeFileSync(file, content, 'latin1'); // Write back as latin1
      console.log(`\n✅ Fixed ${changeCount} occurrences in: ${file}`);
    } else {
      console.log(`\n⚠️  No corrupted text found in: ${file}`);
    }
  } catch (error) {
    console.error(`\n❌ Error fixing ${file}:`, error.message);
  }
});

console.log('\n=== Done! ===');
