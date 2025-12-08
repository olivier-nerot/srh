/**
 * DEBUG SCRIPT: List all Stripe prices to find incorrect 50€ prices
 *
 * This script will:
 * 1. List all prices in the Stripe account
 * 2. Identify prices with unit_amount = 5000 (50€)
 * 3. Show which tiers they're associated with
 * 4. List all subscriptions using these prices
 */

const Stripe = require('stripe');
require('dotenv/config');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function debugPrices() {
  console.log('\n=== STRIPE PRICE AUDIT ===\n');
  console.log('Looking for incorrect 50€ prices...\n');

  const requestOptions = {
    stripeAccount: process.env.VITE_STRIPE_COMPANY_ID,
  };

  // 1. List ALL prices
  const allPrices = await stripe.prices.list(
    { limit: 100 },
    requestOptions
  );

  console.log(`Total prices found: ${allPrices.data.length}\n`);

  // 2. Find all 50€ prices
  const fiftyEuroPrices = allPrices.data.filter(
    price => price.unit_amount === 5000 && price.currency === 'eur'
  );

  console.log(`\n📌 Found ${fiftyEuroPrices.length} price(s) with 50€:\n`);

  fiftyEuroPrices.forEach((price, index) => {
    console.log(`Price ${index + 1}:`);
    console.log(`  ID: ${price.id}`);
    console.log(`  Amount: ${price.unit_amount / 100}€`);
    console.log(`  Lookup Key: ${price.lookup_key || 'N/A'}`);
    console.log(`  Nickname: ${price.nickname || 'N/A'}`);
    console.log(`  Active: ${price.active}`);
    console.log(`  Metadata:`, price.metadata);
    console.log(`  Product: ${price.product}`);
    console.log('');
  });

  // 3. List all prices grouped by tier
  console.log('\n📊 ALL PRICES GROUPED BY TIER:\n');

  const pricesByTier = {};
  allPrices.data.forEach(price => {
    const tier = price.metadata?.tier || 'unknown';
    if (!pricesByTier[tier]) {
      pricesByTier[tier] = [];
    }
    pricesByTier[tier].push(price);
  });

  Object.keys(pricesByTier).forEach(tier => {
    console.log(`\n${tier.toUpperCase()}:`);
    pricesByTier[tier].forEach(price => {
      const indicator = price.unit_amount === 5000 ? '⚠️  ' : '   ';
      console.log(`${indicator}${price.id}: ${price.unit_amount / 100}€ (${price.active ? 'active' : 'inactive'})`);
    });
  });

  // 4. Find subscriptions using 50€ prices
  console.log('\n\n🔍 SUBSCRIPTIONS USING 50€ PRICES:\n');

  for (const price of fiftyEuroPrices) {
    const subscriptions = await stripe.subscriptions.list(
      {
        price: price.id,
        limit: 100,
        status: 'all'
      },
      requestOptions
    );

    console.log(`Price ${price.id} (${price.nickname || 'no nickname'}):`);
    console.log(`  Subscriptions: ${subscriptions.data.length}`);

    if (subscriptions.data.length > 0) {
      subscriptions.data.forEach((sub, idx) => {
        console.log(`  ${idx + 1}. ${sub.id} - Status: ${sub.status} - Customer: ${sub.customer}`);
      });
    }
    console.log('');
  }

  // 5. Expected prices
  console.log('\n\n✅ EXPECTED PRICES:\n');
  const expectedPrices = [
    { tier: 'practicing', price: 120 },
    { tier: 'retired', price: 60 },
    { tier: 'assistant', price: 30 },
  ];

  expectedPrices.forEach(({ tier, price: expectedPrice }) => {
    const tierPrices = pricesByTier[tier] || [];
    const correctPrices = tierPrices.filter(p => p.unit_amount === expectedPrice * 100);
    const incorrectPrices = tierPrices.filter(p => p.unit_amount !== expectedPrice * 100);

    console.log(`${tier}:`);
    console.log(`  Expected: ${expectedPrice}€`);
    console.log(`  Correct prices: ${correctPrices.length}`);
    console.log(`  Incorrect prices: ${incorrectPrices.length}`);

    if (incorrectPrices.length > 0) {
      console.log(`  ⚠️  INCORRECT:`);
      incorrectPrices.forEach(p => {
        console.log(`    - ${p.id}: ${p.unit_amount / 100}€`);
      });
    }
    console.log('');
  });
}

debugPrices().catch(console.error);
