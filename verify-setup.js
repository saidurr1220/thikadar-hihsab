#!/usr/bin/env node

/**
 * Setup Verification Script
 * Checks if all required files and configurations are in place
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Verifying থিকাদারি হিসাব Setup...\n');

let allGood = true;
const checks = [];

// Check 1: Node modules
const check1 = fs.existsSync('node_modules');
checks.push({
  name: 'Dependencies installed',
  status: check1,
  fix: 'Run: npm install'
});

// Check 2: .env.local file
const check2 = fs.existsSync('.env.local');
checks.push({
  name: '.env.local file exists',
  status: check2,
  fix: 'File should already exist with your Supabase credentials'
});

// Check 3: Environment variables
let check3 = false;
if (check2) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  check3 = envContent.includes('qrnbpeowkkinjfksxavz.supabase.co');
}
checks.push({
  name: 'Supabase URL configured',
  status: check3,
  fix: 'Check .env.local has correct NEXT_PUBLIC_SUPABASE_URL'
});

// Check 4: Documentation files
const docFiles = [
  'docs/03_DATABASE_SCHEMA.sql',
  'docs/04_RLS_POLICIES.sql',
  'docs/05_SEED_DATA.sql',
  'docs/SETUP_GUIDE.md',
  'docs/QUICK_REFERENCE.md'
];
const check4 = docFiles.every(f => fs.existsSync(f));
checks.push({
  name: 'Documentation files present',
  status: check4,
  fix: 'All documentation should be in docs/ folder'
});

// Check 5: Core app files
const appFiles = [
  'app/layout.tsx',
  'app/page.tsx',
  'app/globals.css',
  'middleware.ts',
  'lib/supabase/client.ts',
  'lib/supabase/server.ts'
];
const check5 = appFiles.every(f => fs.existsSync(f));
checks.push({
  name: 'Core application files present',
  status: check5,
  fix: 'Core files should be in app/ and lib/ folders'
});

// Check 6: Config files
const configFiles = [
  'package.json',
  'tsconfig.json',
  'tailwind.config.ts',
  'next.config.js'
];
const check6 = configFiles.every(f => fs.existsSync(f));
checks.push({
  name: 'Configuration files present',
  status: check6,
  fix: 'Config files should be in root folder'
});

// Print results
checks.forEach((check, index) => {
  const icon = check.status ? '✅' : '❌';
  const status = check.status ? 'OK' : 'MISSING';
  console.log(`${icon} ${index + 1}. ${check.name}: ${status}`);
  if (!check.status) {
    console.log(`   Fix: ${check.fix}`);
    allGood = false;
  }
});

console.log('\n' + '='.repeat(60) + '\n');

if (allGood) {
  console.log('✅ All checks passed! Your setup is ready.\n');
  console.log('📋 Next Steps:');
  console.log('   1. Read SETUP_INSTRUCTIONS.md');
  console.log('   2. Run database scripts in Supabase SQL Editor');
  console.log('   3. Create admin user');
  console.log('   4. Run: npm run dev');
  console.log('   5. Open: http://localhost:3000\n');
} else {
  console.log('❌ Some checks failed. Please fix the issues above.\n');
  console.log('📖 For detailed setup instructions, see:');
  console.log('   - SETUP_INSTRUCTIONS.md (quick start)');
  console.log('   - docs/SETUP_GUIDE.md (detailed guide)\n');
}

// Additional info
console.log('📚 Documentation:');
console.log('   - Complete Spec: docs/00_COMPLETE_SPECIFICATION.md');
console.log('   - Quick Reference: docs/QUICK_REFERENCE.md');
console.log('   - All Docs Index: docs/INDEX.md\n');

console.log('🔗 Your Supabase Project:');
console.log('   https://supabase.com/dashboard/project/qrnbpeowkkinjfksxavz\n');

process.exit(allGood ? 0 : 1);
