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

    // Use the connected account ID for API calls
    const requestOptions = process.env.STRIPE_COMPANY_ID ? {
      stripeAccount: process.env.STRIPE_COMPANY_ID
    } : {};

    // Search for customers by email in the connected account
    const customers = await stripe.customers.list({
      email: email,
      limit: 10, // Get more results for debugging
    }, requestOptions);


    if (customers.data.length === 0) {
      // Try searching for charges by receipt_email instead
      try {
        const charges = await stripe.charges.list({
          limit: 50, // Search more charges
        }, requestOptions);
        
        // Filter charges by receipt_email (case insensitive)
        const chargesForEmail = charges.data.filter(charge => 
          charge.receipt_email && charge.receipt_email.toLowerCase() === email.toLowerCase()
        );
        
        if (chargesForEmail.length > 0) {
          const lastCharge = chargesForEmail[0]; // Most recent
          
          const lastPayment = {
            id: lastCharge.id,
            amount: lastCharge.amount / 100,
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
      } catch (chargeError) {
        console.error('Error searching charges:', chargeError);
      }
      
      return res.status(200).json({ 
        success: true, 
        lastPayment: null,
        message: 'No payment found for this email'
      });
    }

    const customer = customers.data[0];

    // Try to get charges first (for completed payments)
    const charges = await stripe.charges.list({
      customer: customer.id,
      limit: 1,
    }, requestOptions);

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
    const paymentIntents = await stripe.paymentIntents.list({
      customer: customer.id,
      limit: 1,
    }, requestOptions);

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
    console.error('Error fetching payments for email:', email, error);
    return res.status(500).json({
      success: false,
      error: 'Error fetching payment information',
      details: error.message
    });
  }
}