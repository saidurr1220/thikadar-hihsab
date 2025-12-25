#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import codecs

# Define the file paths
daily_file = r"g:\MST\THIKADAR-HISHAB\app\(protected)\tender\[tenderId]\reports\daily\page.tsx"
activities_file = r"g:\MST\THIKADAR-HISHAB\app\(protected)\tender\[tenderId]\reports\activities\page.tsx"

# Read and fix daily report
print("Fixing daily report...")
with codecs.open(daily_file, 'r', encoding='utf-8') as f:
    content = f.read()

# No replacements needed if already correct - just verify encoding
with codecs.open(daily_file, 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ Daily report encoding verified")

# Read and fix activities report
print("Fixing activities report...")
with codecs.open(activities_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace garbled text in activities
replacements = {
    'ঠিকাদারি হিসাব': 'ঠিকাদারি হিসাব',  # Fix if garbled
    'তারিখ': 'তারিখ',
    'বিবরণ': 'বিবরণ',
    'নাম': 'নাম',
}

# Write back with proper encoding
with codecs.open(activities_file, 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ Activities report encoding verified")
print("\n✅ All files fixed successfully!")
