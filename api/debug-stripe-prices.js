/**
 * DEBUG API ENDPOINT: List all Stripe prices to find incorrect 50€ prices
 *
 * Usage: GET /api/debug-stripe-prices?action=audit
 */

const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Only allow in development/test mode
  if (process.env.NODE_ENV === 'production' && !req.query.allow_production) {
    return res.status(403).json({ error: 'Debug endpoint not available in production' });
  }

  const { action } = req.query;

  if (action !== 'audit') {
    return res.status(400).json({
      error: 'Invalid action. Use ?action=audit'
    });
  }

  try {
    const requestOptions = {
      stripeAccount: process.env.VITE_STRIPE_COMPANY_ID,
    };

    // 1. List ALL prices
    const allPrices = await stripe.prices.list(
      { limit: 100 },
      requestOptions
    );

    // 2. Find all 50€ prices
    const fiftyEuroPrices = allPrices.data.filter(
      price => price.unit_amount === 5000 && price.currency === 'eur'
    );

    // 3. Group prices by tier
    const pricesByTier = {};
    allPrices.data.forEach(price => {
      const tier = price.metadata?.tier || 'unknown';
      if (!pricesByTier[tier]) {
        pricesByTier[tier] = [];
      }
      pricesByTier[tier].push({
        id: price.id,
        amount: price.unit_amount / 100,
        lookup_key: price.lookup_key,
        nickname: price.nickname,
        active: price.active,
        metadata: price.metadata
      });
    });

    // 4. Find subscriptions using 50€ prices
    const subscriptionsUsing50Euro = [];
    for (const price of fiftyEuroPrices) {
      const subscriptions = await stripe.subscriptions.list(
        {
          price: price.id,
          limit: 100,
          status: 'all'
        },
        requestOptions
      );

      if (subscriptions.data.length > 0) {
        subscriptionsUsing50Euro.push({
          priceId: price.id,
          priceNickname: price.nickname,
          priceTier: price.metadata?.tier,
          subscriptionCount: subscriptions.data.length,
          subscriptions: subscriptions.data.map(sub => ({
            id: sub.id,
            status: sub.status,
            customer: sub.customer,
            current_period_end: new Date(sub.current_period_end * 1000)
          }))
        });
      }
    }

    // 5. Expected prices validation
    const expectedPrices = [
      { tier: 'practicing', price: 120 },
      { tier: 'retired', price: 60 },
      { tier: 'assistant', price: 30 },
    ];

    const priceValidation = expectedPrices.map(({ tier, price: expectedPrice }) => {
      const tierPrices = pricesByTier[tier] || [];
      const correctPrices = tierPrices.filter(p => p.amount === expectedPrice);
      const incorrectPrices = tierPrices.filter(p => p.amount !== expectedPrice);

      return {
        tier,
        expectedPrice,
        correctPriceCount: correctPrices.length,
        incorrectPriceCount: incorrectPrices.length,
        incorrectPrices: incorrectPrices.map(p => ({
          id: p.id,
          amount: p.amount,
          active: p.active
        }))
      };
    });

    return res.status(200).json({
      success: true,
      summary: {
        totalPrices: allPrices.data.length,
        fiftyEuroPriceCount: fiftyEuroPrices.length,
        subscriptionsUsing50Euro: subscriptionsUsing50Euro.length
      },
      fiftyEuroPrices: fiftyEuroPrices.map(p => ({
        id: p.id,
        amount: p.unit_amount / 100,
        lookup_key: p.lookup_key,
        nickname: p.nickname,
        active: p.active,
        tier: p.metadata?.tier,
        metadata: p.metadata
      })),
      pricesByTier,
      subscriptionsUsing50Euro,
      priceValidation
    });
  } catch (error) {
    console.error('Error auditing Stripe prices:', error);
    return res.status(500).json({
      success: false,
      error: 'Error auditing Stripe prices',
      details: error.message
    });
  }
};
