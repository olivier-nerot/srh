/**
 * FIX SCRIPT: Update all subscriptions with incorrect 50€ prices
 *
 * This script will:
 * 1. Find all subscriptions with 50€ price for "practicing" tier
 * 2. Create correct 120€ price if it doesn't exist
 * 3. Update each subscription to use the correct price
 * 4. Archive the incorrect 50€ price
 * 5. Generate a report of all changes
 *
 * Usage: Add to stripe.js as a new action endpoint
 */

const Stripe = require('stripe');

async function fixIncorrectPrices(stripe, requestOptions) {
  console.log('\n=== FIXING INCORRECT SUBSCRIPTION PRICES ===\n');

  const report = {
    subscriptionsChecked: 0,
    subscriptionsFixed: 0,
    pricesCreated: 0,
    pricesArchived: 0,
    errors: [],
    details: []
  };

  try {
    // 1. Define expected prices
    const expectedPrices = {
      'practicing': 120,
      'retired': 60,
      'assistant': 30
    };

    // 2. For each tier, find and fix incorrect prices
    for (const [tier, expectedPrice] of Object.entries(expectedPrices)) {
      console.log(`\n--- Processing ${tier} tier (expected: ${expectedPrice}€) ---`);

      // Find all prices for this tier
      const allPrices = await stripe.prices.list(
        { limit: 100 },
        requestOptions
      );

      const tierPrices = allPrices.data.filter(
        p => p.metadata?.tier === tier || p.lookup_key?.includes(tier)
      );

      console.log(`Found ${tierPrices.length} prices for ${tier} tier`);

      // Identify correct and incorrect prices
      const correctPrices = tierPrices.filter(p => p.unit_amount === expectedPrice * 100 && p.active);
      const incorrectPrices = tierPrices.filter(p => p.unit_amount !== expectedPrice * 100 && p.active);

      console.log(`  Correct: ${correctPrices.length}, Incorrect: ${incorrectPrices.length}`);

      if (incorrectPrices.length === 0) {
        console.log(`  ✓ No incorrect prices found for ${tier}`);
        continue;
      }

      // 3. Ensure we have a correct price to migrate to
      let correctPriceId;
      if (correctPrices.length > 0) {
        correctPriceId = correctPrices[0].id;
        console.log(`  ✓ Using existing correct price: ${correctPriceId}`);
      } else {
        // Create a new correct price
        console.log(`  Creating new correct price for ${tier}: ${expectedPrice}€`);

        const newPrice = await stripe.prices.create({
          unit_amount: expectedPrice * 100,
          currency: 'eur',
          recurring: { interval: 'year' },
          lookup_key: `srh_${tier}_yearly_${expectedPrice * 100}_${Date.now()}`,
          nickname: `${tier} - Correct Price (${expectedPrice}€)`,
          metadata: {
            tier: tier,
            amount_euros: expectedPrice.toString(),
            created_by_fix_script: 'true',
            fix_date: new Date().toISOString()
          },
          product_data: {
            name: `Adhésion SRH - ${tier}`,
            metadata: { tier: tier }
          }
        }, requestOptions);

        correctPriceId = newPrice.id;
        report.pricesCreated++;
        console.log(`  ✓ Created price: ${correctPriceId}`);
      }

      // 4. Find and update subscriptions using incorrect prices
      for (const incorrectPrice of incorrectPrices) {
        console.log(`\n  Processing incorrect price ${incorrectPrice.id} (${incorrectPrice.unit_amount / 100}€)`);

        const subscriptions = await stripe.subscriptions.list({
          price: incorrectPrice.id,
          status: 'all',
          limit: 100
        }, requestOptions);

        console.log(`    Found ${subscriptions.data.length} subscriptions using this price`);
        report.subscriptionsChecked += subscriptions.data.length;

        for (const subscription of subscriptions.data) {
          try {
            // Only update active or trialing subscriptions
            if (subscription.status !== 'active' && subscription.status !== 'trialing') {
              console.log(`    - ${subscription.id}: Skipped (status: ${subscription.status})`);
              continue;
            }

            console.log(`    - ${subscription.id}: Updating from ${incorrectPrice.unit_amount / 100}€ to ${expectedPrice}€`);

            // Get customer email for reporting
            const customer = await stripe.customers.retrieve(subscription.customer, requestOptions);

            // Update subscription to use correct price
            await stripe.subscriptions.update(
              subscription.id,
              {
                items: [{
                  id: subscription.items.data[0].id,
                  price: correctPriceId
                }],
                proration_behavior: 'none', // Don't charge/credit the difference
                metadata: {
                  ...subscription.metadata,
                  price_fixed: 'true',
                  fixed_date: new Date().toISOString(),
                  old_price: incorrectPrice.id,
                  new_price: correctPriceId
                }
              },
              requestOptions
            );

            report.subscriptionsFixed++;
            report.details.push({
              subscriptionId: subscription.id,
              customerEmail: customer.email,
              tier: tier,
              oldPrice: `${incorrectPrice.unit_amount / 100}€`,
              newPrice: `${expectedPrice}€`,
              status: subscription.status
            });

            console.log(`    ✓ Updated successfully`);
          } catch (error) {
            console.error(`    ✗ Error updating ${subscription.id}:`, error.message);
            report.errors.push({
              subscriptionId: subscription.id,
              error: error.message
            });
          }
        }

        // 5. Archive the incorrect price (don't delete - Stripe doesn't allow it)
        console.log(`    Archiving incorrect price ${incorrectPrice.id}`);
        try {
          await stripe.prices.update(
            incorrectPrice.id,
            { active: false },
            requestOptions
          );
          report.pricesArchived++;
          console.log(`    ✓ Price archived`);
        } catch (error) {
          console.error(`    ✗ Error archiving price:`, error.message);
        }
      }
    }

    console.log('\n=== FIX COMPLETE ===\n');
    console.log(`Subscriptions checked: ${report.subscriptionsChecked}`);
    console.log(`Subscriptions fixed: ${report.subscriptionsFixed}`);
    console.log(`Prices created: ${report.pricesCreated}`);
    console.log(`Prices archived: ${report.pricesArchived}`);
    console.log(`Errors: ${report.errors.length}`);

    return report;
  } catch (error) {
    console.error('Fatal error in fix script:', error);
    throw error;
  }
}

module.exports = { fixIncorrectPrices };
