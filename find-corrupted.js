const fs = require('fs');

const file = 'app/(protected)/tender/[tenderId]/reports/daily/page.tsx';
const content = fs.readFileSync(file, 'latin1');

// Find all Bengali corrupted patterns - use more specific pattern
const pattern = /à¦[\x80-\xFF]+/g;
const matches = content.match(pattern);

if (matches) {
  console.log(`Found ${matches.length} corrupted text patterns:\n`);
  const unique = [...new Set(matches)];
  unique.forEach((text, i) => {
    console.log(`${i+1}. "${text}"`);
  });
} else {
  console.log('No corrupted text found');
}
