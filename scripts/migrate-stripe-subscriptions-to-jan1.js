#!/usr/bin/env node

/**
 * Migration Script: Update Stripe Subscriptions to Renew on January 1st
 *
 * This script updates all existing Stripe subscriptions to align their renewal
 * dates to January 1st of the following year. This ensures all members renew
 * on the same date for easier membership management.
 *
 * Usage:
 *   node scripts/migrate-stripe-subscriptions-to-jan1.js [--dry-run] [--test-mode]
 *
 * Options:
 *   --dry-run: Preview changes without applying them
 *   --test-mode: Run against test/sandbox Stripe account
 */

import 'dotenv/config';
import Stripe from 'stripe';
import { getDb } from '../api/lib/turso.js';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { eq } from 'drizzle-orm';

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isTestMode = args.includes('--test-mode') || process.env.VITE_STRIPE_TESTMODE === 'true';

// Initialize Stripe
const stripeSecretKey = isTestMode
  ? process.env.VITE_STRIPE_TEST_SECRET_API_KEY || process.env.STRIPE_TEST_SECRET_API_KEY
  : process.env.VITE_STRIPE_SECRET_API_KEY || process.env.STRIPE_SECRET_API_KEY;

if (!stripeSecretKey) {
  console.error('❌ Error: Stripe API key not found');
  console.error('Please set VITE_STRIPE_SECRET_API_KEY or VITE_STRIPE_TEST_SECRET_API_KEY');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-11-20.acacia',
});

const requestOptions = {
  stripeAccount: process.env.VITE_STRIPE_COMPANY_ID,
};

// Define users table schema
const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  firstname: text('firstname'),
  lastname: text('lastname'),
  subscription: text('subscription'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

/**
 * Calculate days until next January 1st
 */
function calculateDaysUntilNextJan1() {
  const today = new Date();
  const nextJan1 = new Date(today.getFullYear() + 1, 0, 1);
  return Math.ceil((nextJan1.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Get the next January 1st date
 */
function getNextJan1() {
  const today = new Date();
  return new Date(today.getFullYear() + 1, 0, 1);
}

/**
 * Main migration function
 */
async function migrateSubscriptions() {
  console.log('\n🚀 Stripe Subscription Migration Script');
  console.log('==========================================');
  console.log(`Mode: ${isTestMode ? 'TEST' : 'PRODUCTION'}`);
  console.log(`Dry Run: ${isDryRun ? 'YES (no changes will be made)' : 'NO (changes will be applied)'}`);
  console.log('==========================================\n');

  if (!isDryRun) {
    console.log('⚠️  WARNING: This will modify live Stripe subscriptions!');
    console.log('Press Ctrl+C within 5 seconds to cancel...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  const daysUntilJan1 = calculateDaysUntilNextJan1();
  const nextJan1 = getNextJan1();

  console.log(`📅 Target renewal date: ${nextJan1.toLocaleDateString('fr-FR')}`);
  console.log(`⏱️  Days until renewal: ${daysUntilJan1}\n`);

  try {
    // Get all users from database
    const db = await getDb();
    const allUsers = await db.select().from(users);

    console.log(`📊 Found ${allUsers.length} users in database\n`);

    let processedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const user of allUsers) {
      try {
        // Find Stripe customer
        const customers = await stripe.customers.list(
          { email: user.email, limit: 1 },
          requestOptions
        );

        if (customers.data.length === 0) {
          console.log(`⏭️  Skipping ${user.email} - no Stripe customer found`);
          skippedCount++;
          continue;
        }

        const customer = customers.data[0];

        // Get all active subscriptions
        const subscriptions = await stripe.subscriptions.list(
          {
            customer: customer.id,
            status: 'all',
            limit: 100,
          },
          requestOptions
        );

        if (subscriptions.data.length === 0) {
          console.log(`⏭️  Skipping ${user.email} - no subscriptions found`);
          skippedCount++;
          continue;
        }

        // Process each subscription
        for (const subscription of subscriptions.data) {
          processedCount++;

          // Skip if subscription is canceled or incomplete
          if (['canceled', 'incomplete', 'incomplete_expired'].includes(subscription.status)) {
            console.log(`⏭️  Skipping subscription ${subscription.id} - status: ${subscription.status}`);
            skippedCount++;
            continue;
          }

          // Check if subscription is already in trial or has correct trial_end
          const trialEnd = subscription.trial_end;
          const isInTrial = subscription.status === 'trialing';

          console.log(`\n📝 Processing: ${user.email}`);
          console.log(`   Subscription: ${subscription.id}`);
          console.log(`   Status: ${subscription.status}`);
          console.log(`   Current trial end: ${trialEnd ? new Date(trialEnd * 1000).toLocaleDateString('fr-FR') : 'None'}`);
          console.log(`   In trial: ${isInTrial}`);

          if (!isDryRun) {
            try {
              // Update the subscription to end trial on next Jan 1st
              const nextJan1Timestamp = Math.floor(nextJan1.getTime() / 1000);

              const updateParams = {
                trial_end: nextJan1Timestamp,
                proration_behavior: 'none', // Don't prorate when changing trial
                metadata: {
                  ...subscription.metadata,
                  migration_date: new Date().toISOString(),
                  original_trial_end: trialEnd ? new Date(trialEnd * 1000).toISOString() : 'none',
                  aligned_to_jan1: 'true',
                },
              };

              await stripe.subscriptions.update(
                subscription.id,
                updateParams,
                requestOptions
              );

              console.log(`   ✅ Updated to renew on ${nextJan1.toLocaleDateString('fr-FR')}`);
              updatedCount++;
            } catch (updateError) {
              console.error(`   ❌ Error updating subscription: ${updateError.message}`);
              errors.push({ email: user.email, subscriptionId: subscription.id, error: updateError.message });
              errorCount++;
            }
          } else {
            console.log(`   🔍 [DRY RUN] Would update to renew on ${nextJan1.toLocaleDateString('fr-FR')}`);
            updatedCount++;
          }
        }
      } catch (userError) {
        console.error(`❌ Error processing user ${user.email}: ${userError.message}`);
        errors.push({ email: user.email, error: userError.message });
        errorCount++;
      }
    }

    // Print summary
    console.log('\n\n==========================================');
    console.log('📊 Migration Summary');
    console.log('==========================================');
    console.log(`Total users: ${allUsers.length}`);
    console.log(`Subscriptions processed: ${processedCount}`);
    console.log(`✅ Updated: ${updatedCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);

    if (isDryRun) {
      console.log('\n⚠️  DRY RUN - No changes were made');
      console.log('Run without --dry-run to apply changes');
    }

    if (errors.length > 0) {
      console.log('\n\n⚠️  Errors encountered:');
      errors.forEach((err, idx) => {
        console.log(`${idx + 1}. ${err.email} ${err.subscriptionId ? `(${err.subscriptionId})` : ''}: ${err.error}`);
      });
    }

    console.log('\n✅ Migration complete!\n');
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the migration
migrateSubscriptions().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
