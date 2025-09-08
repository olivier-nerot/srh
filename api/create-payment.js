import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_API_KEY, {
  apiVersion: '2024-11-20.acacia',
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, currency, customer, recurring, tierData } = req.body;

    if (!amount || !currency || !customer) {
      return res.status(400).json({ 
        error: 'Missing required fields: amount, currency, customer' 
      });
    }

    // Use the connected account ID for API calls
    const requestOptions = process.env.STRIPE_COMPANY_ID ? {
      stripeAccount: process.env.STRIPE_COMPANY_ID
    } : {};

    // Create or get customer
    let stripeCustomer;
    
    // First try to find existing customer
    const existingCustomers = await stripe.customers.list({
      email: customer.email,
      limit: 1,
    }, requestOptions);

    if (existingCustomers.data.length > 0) {
      stripeCustomer = existingCustomers.data[0];
    } else {
      // Create new customer
      stripeCustomer = await stripe.customers.create({
        email: customer.email,
        name: customer.name,
        metadata: {
          tier: tierData.id,
          hospital: customer.hospital || '',
        }
      }, requestOptions);
    }

    if (recurring) {
      // Create a subscription for recurring payments
      
      // First create a price object for this tier if it doesn't exist
      const priceId = await createOrGetPrice(tierData, requestOptions);
      
      // Create the subscription
      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomer.id,
        items: [{
          price: priceId,
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          tier: tierData.id,
          hospital: customer.hospital || '',
        }
      }, requestOptions);

      return res.status(200).json({
        success: true,
        type: 'subscription',
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
        customer: stripeCustomer,
      });
    } else {
      // Create a one-time payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: currency,
        customer: stripeCustomer.id,
        metadata: {
          tier: tierData.id,
          hospital: customer.hospital || '',
          type: 'one_time_membership',
        },
        description: `Adhésion SRH - ${tierData.title}`,
      }, requestOptions);

      return res.status(200).json({
        success: true,
        type: 'payment_intent',
        clientSecret: paymentIntent.client_secret,
        customer: stripeCustomer,
      });
    }

  } catch (error) {
    console.error('Error creating payment:', error);
    return res.status(500).json({
      success: false,
      error: 'Error creating payment',
      details: error.message
    });
  }
}

async function createOrGetPrice(tierData, requestOptions) {
  try {
    // Try to find existing price first
    const prices = await stripe.prices.list({
      lookup_keys: [`srh_${tierData.id}_yearly`],
      limit: 1,
    }, requestOptions);

    if (prices.data.length > 0) {
      return prices.data[0].id;
    }

    // Create new price if not found
    const price = await stripe.prices.create({
      unit_amount: tierData.price * 100, // Convert to cents
      currency: 'eur',
      recurring: {
        interval: 'year',
      },
      lookup_key: `srh_${tierData.id}_yearly`,
      nickname: `${tierData.title} - Abonnement annuel`,
      metadata: {
        tier: tierData.id,
      },
      product_data: {
        name: `Adhésion SRH - ${tierData.title}`,
        description: tierData.description,
        metadata: {
          tier: tierData.id,
        }
      }
    }, requestOptions);

    return price.id;
  } catch (error) {
    console.error('Error creating/getting price:', error);
    throw error;
  }
}