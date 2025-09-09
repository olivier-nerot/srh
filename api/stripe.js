import Stripe from 'stripe';

// Use VITE_STRIPE_TESTMODE to determine which Stripe keys to use
const isTestMode = process.env.VITE_STRIPE_TESTMODE === 'true';
const stripeSecretKey = isTestMode
  ? (process.env.VITE_STRIPE_TEST_SECRET_API_KEY || process.env.STRIPE_TEST_SECRET_API_KEY)
  : (process.env.VITE_STRIPE_SECRET_API_KEY || process.env.STRIPE_SECRET_API_KEY);

console.log('=== BACKEND STRIPE DEBUG ===');
console.log('VITE_STRIPE_TESTMODE:', process.env.VITE_STRIPE_TESTMODE);
console.log('Test mode enabled:', isTestMode);
console.log('Using test key:', stripeSecretKey?.startsWith('sk_test_'));
console.log('Using live key:', stripeSecretKey?.startsWith('sk_live_'));

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-11-20.acacia',
});

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Extract action from URL path or query
  const { action } = req.query;
  
  if (!action) {
    return res.status(400).json({ 
      error: 'Action is required (get-payments, create-payment, get-subscriptions, cancel-subscription, update-payment-method)' 
    });
  }

  try {
    switch (action) {
      case 'get-payments':
        return await getPayments(req, res);
      case 'create-payment':
        return await createPayment(req, res);
      case 'get-subscriptions':
        return await getSubscriptions(req, res);
      case 'cancel-subscription':
        return await cancelSubscription(req, res);
      case 'update-payment-method':
        return await updatePaymentMethod(req, res);
      case 'create-recurring-subscription':
        return await createRecurringSubscription(req, res);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error(`Stripe API Error (${action}):`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Get payments functionality (from payments.js)
async function getPayments(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Use the connected account ID for API calls
    const requestOptions = {
      stripeAccount: process.env.VITE_STRIPE_COMPANY_ID
    };

    // Search for customers by email in the connected account
    const customerParams = {
      email: email,
      limit: 10, // Get more results for debugging
    };
    const customers = await stripe.customers.list(customerParams, requestOptions);

    if (customers.data.length === 0) {
      return res.status(200).json({ 
        success: true, 
        lastPayment: null,
        message: 'No customer found for this email'
      });
    }

    const customer = customers.data[0];

    // Try to get charges first (for completed payments)
    const chargeParams = {
      customer: customer.id,
      limit: 1,
    };
    const charges = await stripe.charges.list(chargeParams, requestOptions);

    if (charges.data.length > 0) {
      const lastCharge = charges.data[0];
      
      // Format the payment data from charge
      const lastPayment = {
        id: lastCharge.id,
        amount: lastCharge.amount / 100, // Convert from cents to euros
        currency: lastCharge.currency,
        status: lastCharge.status,
        created: new Date(lastCharge.created * 1000),
        description: lastCharge.description,
      };

      return res.status(200).json({
        success: true,
        lastPayment: lastPayment,
      });
    }

    // If no charges, try payment intents
    const paymentIntentParams = {
      customer: customer.id,
      limit: 1,
    };
    const paymentIntents = await stripe.paymentIntents.list(paymentIntentParams, requestOptions);

    if (paymentIntents.data.length === 0) {
      return res.status(200).json({ 
        success: true, 
        lastPayment: null,
        message: 'No payments found for this customer'
      });
    }

    const lastPaymentIntent = paymentIntents.data[0];

    // Format the payment data from payment intent
    const lastPayment = {
      id: lastPaymentIntent.id,
      amount: lastPaymentIntent.amount / 100, // Convert from cents to euros
      currency: lastPaymentIntent.currency,
      status: lastPaymentIntent.status,
      created: new Date(lastPaymentIntent.created * 1000),
      description: lastPaymentIntent.description,
    };

    return res.status(200).json({
      success: true,
      lastPayment: lastPayment,
    });

  } catch (error) {
    console.error('Error fetching payments for email:', req.query.email, error);
    return res.status(500).json({
      success: false,
      error: 'Error fetching payment information',
      details: error.message
    });
  }
}

// Create payment functionality (from create-payment.js)
async function createPayment(req, res) {
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
    const requestOptions = {
      stripeAccount: process.env.VITE_STRIPE_COMPANY_ID
    };

    // Create or get customer
    let stripeCustomer;
    
    // First try to find existing customer
    const existingCustomerParams = {
      email: customer.email,
      limit: 1,
    };
    const existingCustomers = await stripe.customers.list(existingCustomerParams, requestOptions);

    if (existingCustomers.data.length > 0) {
      stripeCustomer = existingCustomers.data[0];
    } else {
      // Create new customer
      const newCustomerParams = {
        email: customer.email,
        name: customer.name,
        metadata: {
          tier: tierData.id,
          hospital: customer.hospital || '',
        }
      };
      stripeCustomer = await stripe.customers.create(newCustomerParams, requestOptions);
    }

    if (recurring) {
      // Create a subscription for recurring payments
      
      // First create a price object for this tier if it doesn't exist
      const priceId = await createOrGetPrice(tierData, requestOptions);
      
      // Create the subscription
      const subscriptionParams = {
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
      };
      const subscription = await stripe.subscriptions.create(subscriptionParams, requestOptions);

      return res.status(200).json({
        success: true,
        type: 'subscription',
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
        customer: stripeCustomer,
      });
    } else {
      // Create a one-time payment intent
      const paymentIntentParams = {
        amount: amount,
        currency: currency,
        customer: stripeCustomer.id,
        metadata: {
          tier: tierData.id,
          hospital: customer.hospital || '',
          type: 'one_time_membership',
        },
        description: `Adhésion SRH - ${tierData.title}`,
      };
      const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams, requestOptions);

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

// Get subscriptions functionality (from subscriptions.js)
async function getSubscriptions(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Use the connected account ID for API calls
    const requestOptions = {
      stripeAccount: process.env.VITE_STRIPE_COMPANY_ID
    };

    // Search for customers by email in the connected account
    const customerSearchParams = {
      email: email,
      limit: 10,
    };
    const customers = await stripe.customers.list(customerSearchParams, requestOptions);

    if (customers.data.length === 0) {
      return res.status(200).json({ 
        success: true, 
        subscriptions: [],
        message: 'No customer found for this email'
      });
    }

    const customer = customers.data[0];

    // Get all subscriptions for this customer
    const subscriptionListParams = {
      customer: customer.id,
      status: 'all', // Get all statuses (active, past_due, canceled, etc.)
      limit: 100,
    };
    const subscriptions = await stripe.subscriptions.list(subscriptionListParams, requestOptions);

    if (subscriptions.data.length === 0) {
      return res.status(200).json({ 
        success: true, 
        subscriptions: [],
        message: 'No subscriptions found for this customer'
      });
    }

    // Format the subscription data
    const formattedSubscriptions = subscriptions.data.map(sub => ({
      id: sub.id,
      status: sub.status,
      current_period_start: new Date(sub.current_period_start * 1000),
      current_period_end: new Date(sub.current_period_end * 1000),
      amount: sub.items.data[0]?.price?.unit_amount ? sub.items.data[0].price.unit_amount / 100 : 0,
      currency: sub.currency,
      tier: sub.metadata?.tier || 'unknown',
      customer_email: customer.email,
      cancel_at_period_end: sub.cancel_at_period_end,
      canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
    }));

    return res.status(200).json({
      success: true,
      subscriptions: formattedSubscriptions,
    });

  } catch (error) {
    console.error('Error fetching subscriptions for email:', req.query.email, error);
    return res.status(500).json({
      success: false,
      error: 'Error fetching subscription information',
      details: error.message
    });
  }
}

// Helper function for creating or getting Stripe prices
async function createOrGetPrice(tierData, requestOptions) {
  try {
    // Try to find existing price first
    const priceListParams = {
      lookup_keys: [`srh_${tierData.id}_yearly`],
      limit: 1,
    };
    const prices = await stripe.prices.list(priceListParams, requestOptions);

    if (prices.data.length > 0) {
      return prices.data[0].id;
    }

    // Create new price if not found
    const priceCreateParams = {
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
        metadata: {
          tier: tierData.id,
        }
      }
    };
    const price = await stripe.prices.create(priceCreateParams, requestOptions);

    return price.id;
  } catch (error) {
    console.error('Error creating/getting price:', error);
    throw error;
  }
}

// Cancel subscription functionality
async function cancelSubscription(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, subscriptionId } = req.body;

    if (!email || !subscriptionId) {
      return res.status(400).json({ error: 'Email and subscriptionId are required' });
    }

    // Use the connected account ID for API calls
    const requestOptions = {
      stripeAccount: process.env.VITE_STRIPE_COMPANY_ID
    };

    // Cancel the subscription at the end of the current period
    const subscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        cancel_at_period_end: true,
        metadata: {
          canceled_by: 'customer',
          canceled_at: new Date().toISOString(),
        }
      },
      requestOptions
    );

    return res.status(200).json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end,
        current_period_end: new Date(subscription.current_period_end * 1000),
      },
      message: 'Subscription will be canceled at the end of the current period'
    });

  } catch (error) {
    console.error('Error canceling subscription:', error);
    return res.status(500).json({
      success: false,
      error: 'Error canceling subscription',
      details: error.message
    });
  }
}

// Update payment method functionality
async function updatePaymentMethod(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, subscriptionId } = req.body;

    if (!email || !subscriptionId) {
      return res.status(400).json({ error: 'Email and subscriptionId are required' });
    }

    // Use the connected account ID for API calls
    const requestOptions = {
      stripeAccount: process.env.VITE_STRIPE_COMPANY_ID
    };

    // Get the subscription to check current payment method
    const subscription = await stripe.subscriptions.retrieve(
      subscriptionId,
      { expand: ['default_payment_method'] },
      requestOptions
    );

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // For now, we'll return instructions for the user
    // In a full implementation, you'd create a setup intent for the new payment method
    return res.status(200).json({
      success: true,
      message: 'Payment method update initiated',
      instructions: 'Please provide new payment method details',
      subscription_id: subscriptionId
    });

  } catch (error) {
    console.error('Error updating payment method:', error);
    return res.status(500).json({
      success: false,
      error: 'Error updating payment method',
      details: error.message
    });
  }
}

// Create recurring subscription from one-time payment
async function createRecurringSubscription(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, tierData } = req.body;

    if (!email || !tierData) {
      return res.status(400).json({ error: 'Email and tierData are required' });
    }

    // Use the connected account ID for API calls
    const requestOptions = {
      stripeAccount: process.env.VITE_STRIPE_COMPANY_ID
    };

    // Find existing customer
    const existingCustomerParams = {
      email: email,
      limit: 1,
    };
    const existingCustomers = await stripe.customers.list(existingCustomerParams, requestOptions);

    if (existingCustomers.data.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const stripeCustomer = existingCustomers.data[0];

    // Create a price object for this tier if it doesn't exist
    const priceId = await createOrGetPrice(tierData, requestOptions);
    
    // Create the subscription
    const subscriptionParams = {
      customer: stripeCustomer.id,
      items: [{
        price: priceId,
      }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        tier: tierData.id,
        converted_from_onetime: 'true',
      }
    };
    const subscription = await stripe.subscriptions.create(subscriptionParams, requestOptions);

    return res.status(200).json({
      success: true,
      type: 'subscription',
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      customer: stripeCustomer,
    });

  } catch (error) {
    console.error('Error creating recurring subscription:', error);
    return res.status(500).json({
      success: false,
      error: 'Error creating recurring subscription',
      details: error.message
    });
  }
}