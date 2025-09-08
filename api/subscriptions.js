import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_API_KEY, {
  apiVersion: '2024-11-20.acacia',
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Use the connected account ID for API calls
    const requestOptions = process.env.STRIPE_COMPANY_ID ? {
      stripeAccount: process.env.STRIPE_COMPANY_ID
    } : {};

    // Search for customers by email in the connected account
    const customers = await stripe.customers.list({
      email: email,
      limit: 10,
    }, requestOptions);

    if (customers.data.length === 0) {
      return res.status(200).json({ 
        success: true, 
        subscriptions: [],
        message: 'No customer found for this email'
      });
    }

    const customer = customers.data[0];

    // Get all subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'all', // Get all statuses (active, past_due, canceled, etc.)
      limit: 100,
    }, requestOptions);

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