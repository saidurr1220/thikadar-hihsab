#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Checking থিকাদারি হিসাব Setup...\n');

const checks = [];

// Check 1: Auth pages exist
const authLoginExists = fs.existsSync('app/(auth)/login/page.tsx');
const authSignupExists = fs.existsSync('app/(auth)/signup/page.tsx');
checks.push({
  name: 'Auth pages (new structure)',
  status: authLoginExists && authSignupExists,
  details: authLoginExists && authSignupExists ? 
    'app/(auth)/login and signup pages found' : 
    'Missing auth pages in (auth) folder'
});

// Check 2: Old login page deleted
const oldLoginExists = fs.existsSync('app/login/page.tsx');
checks.push({
  name: 'Old login page removed',
  status: !oldLoginExists,
  details: oldLoginExists ? 
    '⚠️ Old placeholder still exists at app/login/page.tsx' : 
    'Old placeholder removed'
});

// Check 3: Dashboard exists
const dashboardExists = fs.existsSync('app/(protected)/dashboard/page.tsx');
checks.push({
  name: 'Dashboard page',
  status: dashboardExists,
  details: dashboardExists ? 'Dashboard page found' : 'Dashboard missing'
});

// Check 4: Protected layout
const protectedLayoutExists = fs.existsSync('app/(protected)/layout.tsx');
checks.push({
  name: 'Protected layout',
  status: protectedLayoutExists,
  details: protectedLayoutExists ? 'Protected layout found' : 'Layout missing'
});

// Check 5: Signout API
const signoutExists = fs.existsSync('app/api/auth/signout/route.ts');
checks.push({
  name: 'Signout API',
  status: signoutExists,
  details: signoutExists ? 'Signout route found' : 'Signout API missing'
});

// Check 6: Environment variables
const envExists = fs.existsSync('.env.local');
let envConfigured = false;
if (envExists) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  envConfigured = envContent.includes('qrnbpeowkkinjfksxavz');
}
checks.push({
  name: 'Environment configured',
  status: envConfigured,
  details: envConfigured ? 'Supabase credentials found' : 'Check .env.local'
});

// Check 7: Middleware
const middlewareExists = fs.existsSync('middleware.ts');
checks.push({
  name: 'Auth middleware',
  status: middlewareExists,
  details: middlewareExists ? 'Middleware found' : 'Middleware missing'
});

// Print results
let allGood = true;
checks.forEach((check, index) => {
  const icon = check.status ? '✅' : '❌';
  console.log(`${icon} ${index + 1}. ${check.name}`);
  console.log(`   ${check.details}`);
  if (!check.status) allGood = false;
});

console.log('\n' + '='.repeat(60) + '\n');

if (allGood) {
  console.log('✅ All checks passed! Authentication system is ready.\n');
  console.log('📋 Next Steps:');
  console.log('   1. Run UPDATE_USER.sql in Supabase SQL Editor');
  console.log('   2. Restart dev server: npm run dev');
  console.log('   3. Clear browser cache (Ctrl+Shift+R)');
  console.log('   4. Go to: http://localhost:3000/login');
  console.log('   5. Login with your credentials\n');
} else {
  console.log('❌ Some checks failed.\n');
  console.log('🔧 Fixes:');
  if (!authLoginExists || !authSignupExists) {
    console.log('   - Auth pages missing. Files should be created.');
  }
  if (oldLoginExists) {
    console.log('   - Delete: app/login/page.tsx');
  }
  if (!envConfigured) {
    console.log('   - Check .env.local has Supabase credentials');
  }
  console.log('');
}

// Additional info
console.log('📚 Documentation:');
console.log('   - QUICK_FIX.md - Quick troubleshooting guide');
console.log('   - AUTHENTICATION_GUIDE.md - Complete auth guide');
console.log('   - UPDATE_USER.sql - SQL to update your user\n');

console.log('🔗 Your User ID: bce3a381-10af-4eac-b5b7-242d3f351ff2\n');

process.exit(allGood ? 0 : 1);
