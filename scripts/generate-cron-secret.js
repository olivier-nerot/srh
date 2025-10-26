#!/usr/bin/env node

/**
 * Generate a secure random CRON_SECRET for Vercel Cron authentication
 *
 * Usage: node scripts/generate-cron-secret.js
 */

import crypto from 'crypto';

function generateCronSecret() {
  // Generate 32 bytes (256 bits) of random data
  const secret = crypto.randomBytes(32).toString('hex');

  console.log('\n' + '='.repeat(70));
  console.log('  CRON SECRET GENERATOR');
  console.log('='.repeat(70));
  console.log('\nYour secure CRON_SECRET:\n');
  console.log(`  ${secret}`);
  console.log('\n' + '-'.repeat(70));
  console.log('Add this to your Vercel project environment variables:');
  console.log('-'.repeat(70));
  console.log('\n1. Go to: https://vercel.com/dashboard');
  console.log('2. Select your project');
  console.log('3. Go to: Settings > Environment Variables');
  console.log('4. Add new variable:');
  console.log('   - Key: CRON_SECRET');
  console.log(`   - Value: ${secret}`);
  console.log('   - Environment: Production, Preview, Development');
  console.log('\n5. Redeploy your project for changes to take effect');
  console.log('\n' + '='.repeat(70));
  console.log('\nℹ️  Keep this secret secure! Do not commit it to git.\n');
}

generateCronSecret();
