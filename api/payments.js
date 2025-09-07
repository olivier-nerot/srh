import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_API_KEY, {
  apiVersion: '2020-08-27',
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

    // Search for customers by email
    const customers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return res.status(200).json({ 
        success: true, 
        lastPayment: null,
        message: 'No customer found for this email'
      });
    }

    const customer = customers.data[0];

    // Get the most recent payment intent for this customer
    const paymentIntents = await stripe.paymentIntents.list({
      customer: customer.id,
      limit: 1,
    });

    if (paymentIntents.data.length === 0) {
      return res.status(200).json({ 
        success: true, 
        lastPayment: null,
        message: 'No payments found for this customer'
      });
    }

    const lastPaymentIntent = paymentIntents.data[0];

    // Format the payment data
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
    console.error('Error fetching payments:', error);
    return res.status(500).json({
      success: false,
      error: 'Error fetching payment information'
    });
  }
}