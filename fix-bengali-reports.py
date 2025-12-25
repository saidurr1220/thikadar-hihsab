#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import re

# Fix the daily report file
daily_file = 'app/(protected)/tender/[tenderId]/reports/daily/page.tsx'

print("Reading file...")
with open(daily_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace all garbled Bengali text with proper Bengali
replacements = {
    'â†': '←',
    'à¦°à¦¿à¦ªà§‹à¦°à§à¦Ÿ à¦®à§‡à¦¨à§': 'রিপোর্ট মেনু',
    'à¦Ÿà§‡à¦¨à§à¦¡à¦¾à¦° à¦•à§‹à¦¡': 'টেন্ডার কোড',
    'à¦ªà§à¦°à¦•à¦²à§à¦ªà§‡à¦° à¦¨à¦¾à¦®': 'প্রকল্পের নাম',
    'à¦¸à§à¦¥à¦¾à¦¨': 'স্থান',
    'à¦¤à¦¾à¦°à¦¿à¦–': 'তারিখ',
    'à¦‰à¦ªমোট': 'উপমোট',
    'à¦…à¦—à§à¦°à¦¿à¦® à¦ªà§à¦°à¦¦à¦¾à¦¨': 'অগ্রিম প্রদান',
    'à¦¬à§à¦¯à¦•à§à¦¤à¦¿': 'ব্যক্তি',
    'à¦‰à¦¦à§à¦¦à§‡à¦¶à§à¦¯': 'উদ্দেশ্য',
    'à¦¦à¦¿à¦¨à§‡à¦° à¦¸à¦¾à¦°à¦¸à¦‚à¦•à§à¦·à§‡à¦ª': 'দিনের সারসংক্ষেপ',
    'à¦ªà§à¦°à¦¸à§à¦¤à§à¦¤à¦•à¦¾à¦°à§€': 'প্রস্তুতকারী',
    'à¦¸à§à¦¬à¦¾à¦•à§à¦·à¦° à¦" à¦¤à¦¾à¦°à¦¿à¦–': 'স্বাক্ষর ও তারিখ',
    'à¦ªà¦°à§€à¦•à§à¦·à¦•': 'পরীক্ষক',
    'à¦…à¦¨à§à¦®à§‹à¦¦à¦¨à¦•à¦¾à¦°à§€': 'অনুমোদনকারী',
}

print("Replacing garbled text...")
for old, new in replacements.items():
    content = content.replace(old, new)

print("Writing fixed content...")
with open(daily_file, 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ Fixed daily report!")

# Fix activities report
activities_file = 'app/(protected)/tender/[tenderId]/reports/activities/page.tsx'

if os.path.exists(activities_file):
    print("\nReading activities file...")
    with open(activities_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print("Replacing garbled text...")
    for old, new in replacements.items():
        content = content.replace(old, new)
    
    print("Writing fixed content...")
    with open(activities_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✓ Fixed activities report!")

print("\n✅ All Bengali text fixed!")
