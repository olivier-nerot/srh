import Stripe from "stripe";

// Use VITE_STRIPE_TESTMODE to determine which Stripe keys to use
const isTestMode = process.env.VITE_STRIPE_TESTMODE === "true";
const stripeSecretKey = isTestMode
  ? process.env.VITE_STRIPE_TEST_SECRET_API_KEY ||
    process.env.STRIPE_TEST_SECRET_API_KEY
  : process.env.VITE_STRIPE_SECRET_API_KEY || process.env.STRIPE_SECRET_API_KEY;

console.log("=== BACKEND STRIPE DEBUG ===");
console.log("VITE_STRIPE_TESTMODE:", process.env.VITE_STRIPE_TESTMODE);
console.log("Test mode enabled:", isTestMode);
console.log("Using test key:", stripeSecretKey?.startsWith("sk_test_"));
console.log("Using live key:", stripeSecretKey?.startsWith("sk_live_"));

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-11-20.acacia",
});

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Extract action from URL path or query
  const { action } = req.query;

  if (!action) {
    return res.status(400).json({
      error:
        "Action is required (get-payments, create-payment, get-subscriptions, cancel-subscription, reactivate-subscription, update-payment-method, fix-incorrect-prices)",
    });
  }

  try {
    switch (action) {
      case "get-payments":
        return await getPayments(req, res);
      case "create-payment":
        return await createPayment(req, res);
      case "get-subscriptions":
        return await getSubscriptions(req, res);
      case "cancel-subscription":
        return await cancelSubscription(req, res);
      case "reactivate-subscription":
        return await reactivateSubscription(req, res);
      case "update-payment-method":
        return await updatePaymentMethod(req, res);
      case "create-recurring-subscription":
        return await createRecurringSubscription(req, res);
      case "fix-incorrect-prices":
        return await fixIncorrectPrices(req, res);
      default:
        return res.status(400).json({ error: "Invalid action" });
    }
  } catch (error) {
    console.error(`Stripe API Error (${action}):`, error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Get payments functionality (from payments.js)
async function getPayments(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Use the connected account ID for API calls
    const requestOptions = {
      stripeAccount: process.env.VITE_STRIPE_COMPANY_ID,
    };

    // Stripe email search is CASE-SENSITIVE, so we search for multiple variants
    // Also try searching by the local part (before @) with different domains
    const emailLower = email.toLowerCase();
    const emailUpper = email.toUpperCase();
    const emailParts = email.split('@');
    const localPart = emailParts[0]?.toLowerCase();

    // Collect customers from multiple search strategies
    const customersSet = new Map(); // Use Map to dedupe by customer ID

    // Strategy 1: Exact email match
    const exactMatch = await stripe.customers.list(
      { email: email, limit: 10 },
      requestOptions,
    );
    exactMatch.data.forEach(c => customersSet.set(c.id, c));

    // Strategy 2: Lowercase email match (if different from exact)
    if (emailLower !== email) {
      const lowerMatch = await stripe.customers.list(
        { email: emailLower, limit: 10 },
        requestOptions,
      );
      lowerMatch.data.forEach(c => customersSet.set(c.id, c));
    }

    // Strategy 3: Search all customers and filter by case-insensitive email
    // This catches customers with uppercase variants like michel.SOFFER@...
    // Stripe's search API allows searching with query syntax
    try {
      const searchResult = await stripe.customers.search({
        query: `email~"${localPart}"`,
        limit: 20,
      }, requestOptions);

      // Filter results to match the domain part case-insensitively
      const domain = emailParts[1]?.toLowerCase();
      searchResult.data.forEach(c => {
        if (c.email) {
          const customerDomain = c.email.split('@')[1]?.toLowerCase();
          const customerLocal = c.email.split('@')[0]?.toLowerCase();
          // Match if local part is similar (case-insensitive)
          if (customerLocal === localPart && customerDomain === domain) {
            customersSet.set(c.id, c);
          }
        }
      });
    } catch (searchError) {
      // Search API might not be available in all Stripe versions
      console.log('Search API not available, using list fallback');
    }

    const customers = Array.from(customersSet.values());

    console.log(`\n=== Customer Search for ${email} ===`);
    console.log(`Search strategies: exact="${email}", lower="${emailLower}"`);
    console.log(`Customers found: ${customers.length}`);
    if (customers.length > 0) {
      console.log('Customer emails found:', customers.map(c => c.email));
    }
    if (customers.length > 1) {
      console.log('Multiple customers found! IDs:', customers.map(c => c.id));
    }

    if (customers.length === 0) {
      return res.status(200).json({
        success: true,
        lastPayment: null,
        message: "No customer found for this email",
      });
    }

    // IMPORTANT: When multiple customer records exist for the same email,
    // we need to check ALL of them to find the most recent payment
    const allPayments = [];

    // Iterate through ALL customer records
    for (const customer of customers.data) {
      console.log(`\n=== Checking customer ${customer.id} ===`);

      // Fetch charges for this customer
      const chargeParams = {
        customer: customer.id,
        limit: 10,
      };
      const charges = await stripe.charges.list(chargeParams, requestOptions);

      // Fetch payment intents for this customer
      const paymentIntentParams = {
        customer: customer.id,
        limit: 10,
      };
      const paymentIntents = await stripe.paymentIntents.list(
        paymentIntentParams,
        requestOptions,
      );

      console.log(`Charges: ${charges.data.length}, Payment Intents: ${paymentIntents.data.length}`);

      // Add charges from this customer
      charges.data.forEach(charge => {
        allPayments.push({
          type: 'charge',
          id: charge.id,
          amount: charge.amount / 100,
          currency: charge.currency,
          status: charge.status,
          created: charge.created,
          description: charge.description,
          customerId: customer.id,
        });
      });

      // Add payment intents from this customer (excluding canceled)
      paymentIntents.data.forEach(pi => {
        if (pi.status !== 'canceled') {
          allPayments.push({
            type: 'payment_intent',
            id: pi.id,
            amount: pi.amount / 100,
            currency: pi.currency,
            status: pi.status,
            created: pi.created,
            description: pi.description,
            customerId: customer.id,
          });
        }
      });
    }

    console.log(`\n=== Total payments found across all customers: ${allPayments.length} ===`);

    if (allPayments.length === 0) {
      return res.status(200).json({
        success: true,
        lastPayment: null,
        message: "No payments found for this customer",
      });
    }

    // Sort by creation timestamp descending (most recent first)
    allPayments.sort((a, b) => b.created - a.created);

    // Get the absolute most recent payment (excluding canceled trial intents)
    const mostRecent = allPayments[0];

    // Debug logging to see what status is being returned
    console.log(`Payment status for ${email}:`, {
      id: mostRecent.id,
      type: mostRecent.type,
      status: mostRecent.status,
      amount: mostRecent.amount,
      created: new Date(mostRecent.created * 1000)
    });

    // Format the payment data
    const lastPayment = {
      id: mostRecent.id,
      amount: mostRecent.amount,
      currency: mostRecent.currency,
      status: mostRecent.status,
      created: new Date(mostRecent.created * 1000),
      description: mostRecent.description,
    };

    return res.status(200).json({
      success: true,
      lastPayment: lastPayment,
    });
  } catch (error) {
    console.error("Error fetching payments for email:", req.query.email, error);
    return res.status(500).json({
      success: false,
      error: "Error fetching payment information",
      details: error.message,
    });
  }
}

// Create payment functionality (from create-payment.js)
async function createPayment(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { amount, currency, customer, recurring, tierData } = req.body;

    if (!amount || !currency || !customer) {
      return res.status(400).json({
        error: "Missing required fields: amount, currency, customer",
      });
    }

    // Use the connected account ID for API calls
    const requestOptions = {
      stripeAccount: process.env.VITE_STRIPE_COMPANY_ID,
    };

    // Create or get customer
    let stripeCustomer;

    // First try to find existing customer
    const existingCustomerParams = {
      email: customer.email,
      limit: 1,
    };
    const existingCustomers = await stripe.customers.list(
      existingCustomerParams,
      requestOptions,
    );

    if (existingCustomers.data.length > 0) {
      stripeCustomer = existingCustomers.data[0];
    } else {
      // Create new customer
      const newCustomerParams = {
        email: customer.email,
        name: customer.name,
        metadata: {
          tier: tierData.id,
          hospital: customer.hospital || "",
        },
      };
      stripeCustomer = await stripe.customers.create(
        newCustomerParams,
        requestOptions,
      );
    }

    if (recurring) {
      // Create a subscription for recurring payments

      // First create a price object for this tier if it doesn't exist
      const priceId = await createOrGetPrice(tierData, requestOptions);

      // Calculate days until next January 1st (all members renew on the same date)
      const today = new Date();
      const nextJan1 = new Date(today.getFullYear() + 1, 0, 1); // January 1st next year
      const trialPeriod = Math.ceil((nextJan1.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // For subscriptions with trial, we need to create a SetupIntent (not PaymentIntent)
      // to save the payment method WITHOUT charging immediately
      const setupIntent = await stripe.setupIntents.create(
        {
          customer: stripeCustomer.id,
          payment_method_types: ['card'],
          metadata: {
            tier: tierData.id,
            hospital: customer.hospital || "",
            trial_period_days: trialPeriod.toString(),
          },
        },
        requestOptions,
      );

      // Create the subscription without immediate payment
      const subscriptionParams = {
        customer: stripeCustomer.id,
        items: [
          {
            price: priceId,
          },
        ],
        trial_period_days: trialPeriod,
        payment_settings: {
          save_default_payment_method: "on_subscription",
          payment_method_types: ['card'],
        },
        metadata: {
          tier: tierData.id,
          hospital: customer.hospital || "",
          free_trial: `${trialPeriod} days`,
        },
      };
      const subscription = await stripe.subscriptions.create(
        subscriptionParams,
        requestOptions,
      );

      return res.status(200).json({
        success: true,
        type: "subscription",
        subscriptionId: subscription.id,
        clientSecret: setupIntent.client_secret, // Return SetupIntent secret, not PaymentIntent
        setupIntentId: setupIntent.id,
        customer: stripeCustomer,
        trial_end: new Date(Date.now() + trialPeriod * 24 * 60 * 60 * 1000).toISOString(),
      });
    } else {
      // One-time payment delayed until next January 1st
      // All members renew on the same date for easier management

      // Calculate days until next January 1st
      const today = new Date();
      const nextJan1 = new Date(today.getFullYear() + 1, 0, 1); // January 1st next year
      const trialPeriod = Math.ceil((nextJan1.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Create SetupIntent to save payment method without charging
      const setupIntent = await stripe.setupIntents.create(
        {
          customer: stripeCustomer.id,
          payment_method_types: ['card'],
          metadata: {
            tier: tierData.id,
            hospital: customer.hospital || "",
            type: "one_time_membership_delayed",
            amount: amount.toString(),
            currency: currency,
            trial_period_days: trialPeriod.toString(),
          },
        },
        requestOptions,
      );

      // Create a single-payment subscription with trial (auto-cancels after first payment)
      // This is the only way to schedule a one-time payment for the future in Stripe
      const priceId = await createOrGetPrice(tierData, requestOptions);

      const subscription = await stripe.subscriptions.create(
        {
          customer: stripeCustomer.id,
          items: [{ price: priceId }],
          trial_period_days: trialPeriod,
          cancel_at_period_end: true, // Auto-cancel after first payment
          payment_settings: {
            save_default_payment_method: "on_subscription",
            payment_method_types: ['card'],
          },
          metadata: {
            tier: tierData.id,
            hospital: customer.hospital || "",
            type: "one_time_membership_delayed",
            free_trial: `${trialPeriod} days`,
          },
        },
        requestOptions,
      );

      return res.status(200).json({
        success: true,
        type: "one_time_delayed",
        subscriptionId: subscription.id,
        clientSecret: setupIntent.client_secret,
        setupIntentId: setupIntent.id,
        customer: stripeCustomer,
        trial_end: new Date(Date.now() + trialPeriod * 24 * 60 * 60 * 1000).toISOString(),
        willCancelAfterPayment: true,
      });
    }
  } catch (error) {
    console.error("Error creating payment:", error);
    return res.status(500).json({
      success: false,
      error: "Error creating payment",
      details: error.message,
    });
  }
}

// Get subscriptions functionality (from subscriptions.js)
async function getSubscriptions(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Use the connected account ID for API calls
    const requestOptions = {
      stripeAccount: process.env.VITE_STRIPE_COMPANY_ID,
    };

    // Stripe email search is CASE-SENSITIVE, so we search for multiple variants
    const emailLower = email.toLowerCase();
    const emailParts = email.split('@');
    const localPart = emailParts[0]?.toLowerCase();

    // Collect customers from multiple search strategies
    const customersSet = new Map();

    // Strategy 1: Exact email match
    const exactMatch = await stripe.customers.list(
      { email: email, limit: 10 },
      requestOptions,
    );
    exactMatch.data.forEach(c => customersSet.set(c.id, c));

    // Strategy 2: Lowercase email match
    if (emailLower !== email) {
      const lowerMatch = await stripe.customers.list(
        { email: emailLower, limit: 10 },
        requestOptions,
      );
      lowerMatch.data.forEach(c => customersSet.set(c.id, c));
    }

    // Strategy 3: Search API for case-insensitive matches
    try {
      const searchResult = await stripe.customers.search({
        query: `email~"${localPart}"`,
        limit: 20,
      }, requestOptions);

      const domain = emailParts[1]?.toLowerCase();
      searchResult.data.forEach(c => {
        if (c.email) {
          const customerDomain = c.email.split('@')[1]?.toLowerCase();
          const customerLocal = c.email.split('@')[0]?.toLowerCase();
          if (customerLocal === localPart && customerDomain === domain) {
            customersSet.set(c.id, c);
          }
        }
      });
    } catch (searchError) {
      console.log('Search API not available for subscriptions lookup');
    }

    const customers = Array.from(customersSet.values());

    if (customers.length === 0) {
      return res.status(200).json({
        success: true,
        subscriptions: [],
        message: "No customer found for this email",
      });
    }

    // Collect subscriptions from ALL matching customers
    const allSubscriptions = [];

    console.log(`\n=== Subscriptions search for ${email} ===`);
    console.log(`Found ${customers.length} customer records to check`);

    // Iterate through ALL customer records
    for (const customer of customers) {
      const subscriptionListParams = {
        customer: customer.id,
        status: "all", // Get all statuses (active, past_due, canceled, etc.)
        limit: 100,
      };
      const subscriptions = await stripe.subscriptions.list(
        subscriptionListParams,
        requestOptions,
      );

      console.log(`Customer ${customer.id} (${customer.email}): ${subscriptions.data.length} subscriptions`);

      // Format and add subscriptions from this customer
      subscriptions.data.forEach((sub) => {
        console.log(`  Subscription ${sub.id}:`, {
          status: sub.status,
          amount: sub.items.data[0]?.price?.unit_amount / 100,
          tier: sub.metadata?.tier,
        });

        allSubscriptions.push({
          id: sub.id,
          status: sub.status,
          current_period_start: new Date(sub.current_period_start * 1000),
          current_period_end: new Date(sub.current_period_end * 1000),
          amount: sub.items.data[0]?.price?.unit_amount
            ? sub.items.data[0].price.unit_amount / 100
            : 0,
          currency: sub.currency,
          tier: sub.metadata?.tier || "unknown",
          customer_email: customer.email,
          cancel_at_period_end: sub.cancel_at_period_end,
          canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
        });
      });
    }

    if (allSubscriptions.length === 0) {
      return res.status(200).json({
        success: true,
        subscriptions: [],
        message: "No subscriptions found for this customer",
      });
    }

    console.log(`Total subscriptions found: ${allSubscriptions.length}`);

    return res.status(200).json({
      success: true,
      subscriptions: allSubscriptions,
    });
  } catch (error) {
    console.error(
      "Error fetching subscriptions for email:",
      req.query.email,
      error,
    );
    return res.status(500).json({
      success: false,
      error: "Error fetching subscription information",
      details: error.message,
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
      const existingPrice = prices.data[0];
      const expectedAmount = tierData.price * 100;

      // IMPORTANT: Validate that the existing price matches our expected amount
      // This prevents reusing incorrectly created prices
      if (existingPrice.unit_amount === expectedAmount) {
        console.log(`✓ Using existing price ${existingPrice.id} for tier ${tierData.id}: ${tierData.price}€`);
        return existingPrice.id;
      } else {
        console.warn(`⚠️  Price mismatch for tier ${tierData.id}:`, {
          expected: `${tierData.price}€ (${expectedAmount} cents)`,
          found: `${existingPrice.unit_amount / 100}€ (${existingPrice.unit_amount} cents)`,
          price_id: existingPrice.id
        });
        console.log(`Creating new price with correct amount for tier ${tierData.id}`);
        // Don't return the wrong price - create a new one instead
      }
    }

    // Create new price if not found or if amount mismatch
    const expectedAmount = tierData.price * 100;
    const timestamp = Date.now();

    const priceCreateParams = {
      unit_amount: expectedAmount, // Convert to cents
      currency: "eur",
      recurring: {
        interval: "year",
      },
      // Use unique lookup key with amount to avoid conflicts with incorrect prices
      lookup_key: `srh_${tierData.id}_yearly_${expectedAmount}_${timestamp}`,
      nickname: `${tierData.title} - Abonnement annuel (${tierData.price}€)`,
      metadata: {
        tier: tierData.id,
        amount_euros: tierData.price.toString(),
      },
      product_data: {
        name: `Adhésion SRH - ${tierData.title}`,
        metadata: {
          tier: tierData.id,
          amount_euros: tierData.price.toString(),
        },
      },
    };

    console.log(`Creating new Stripe price for tier ${tierData.id}: ${tierData.price}€`);
    const price = await stripe.prices.create(priceCreateParams, requestOptions);
    console.log(`✓ Created price ${price.id}`);

    return price.id;
  } catch (error) {
    console.error("Error creating/getting price:", error);
    throw error;
  }
}

// Cancel subscription functionality
async function cancelSubscription(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, subscriptionId } = req.body;

    if (!email || !subscriptionId) {
      return res
        .status(400)
        .json({ error: "Email and subscriptionId are required" });
    }

    // Use the connected account ID for API calls
    const requestOptions = {
      stripeAccount: process.env.VITE_STRIPE_COMPANY_ID,
    };

    // Cancel the subscription at the end of the current period
    const subscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        cancel_at_period_end: true,
        metadata: {
          canceled_by: "customer",
          canceled_at: new Date().toISOString(),
        },
      },
      requestOptions,
    );

    return res.status(200).json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end,
        current_period_end: new Date(subscription.current_period_end * 1000),
      },
      message: "Subscription will be canceled at the end of the current period",
    });
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return res.status(500).json({
      success: false,
      error: "Error canceling subscription",
      details: error.message,
    });
  }
}

// Update payment method functionality
async function updatePaymentMethod(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, subscriptionId } = req.body;

    if (!email || !subscriptionId) {
      return res
        .status(400)
        .json({ error: "Email and subscriptionId are required" });
    }

    // Use the connected account ID for API calls
    const requestOptions = {
      stripeAccount: process.env.VITE_STRIPE_COMPANY_ID,
    };

    // Get the subscription to check current payment method
    const subscription = await stripe.subscriptions.retrieve(
      subscriptionId,
      { expand: ["default_payment_method"] },
      requestOptions,
    );

    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    // For now, we'll return instructions for the user
    // In a full implementation, you'd create a setup intent for the new payment method
    return res.status(200).json({
      success: true,
      message: "Payment method update initiated",
      instructions: "Please provide new payment method details",
      subscription_id: subscriptionId,
    });
  } catch (error) {
    console.error("Error updating payment method:", error);
    return res.status(500).json({
      success: false,
      error: "Error updating payment method",
      details: error.message,
    });
  }
}

// Create recurring subscription from one-time payment
async function createRecurringSubscription(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, tierData } = req.body;

    if (!email || !tierData) {
      return res.status(400).json({ error: "Email and tierData are required" });
    }

    // Use the connected account ID for API calls
    const requestOptions = {
      stripeAccount: process.env.VITE_STRIPE_COMPANY_ID,
    };

    // Find existing customer
    const existingCustomerParams = {
      email: email,
      limit: 1,
    };
    const existingCustomers = await stripe.customers.list(
      existingCustomerParams,
      requestOptions,
    );

    if (existingCustomers.data.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const stripeCustomer = existingCustomers.data[0];

    // Create a price object for this tier if it doesn't exist
    const priceId = await createOrGetPrice(tierData, requestOptions);

    // Create the subscription with 1-year trial period
    const subscriptionParams = {
      customer: stripeCustomer.id,
      items: [
        {
          price: priceId,
        },
      ],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
      trial_period_days: 365, // 1-year free trial
      metadata: {
        tier: tierData.id,
        converted_from_onetime: "true",
        free_trial: "365 days",
      },
    };
    const subscription = await stripe.subscriptions.create(
      subscriptionParams,
      requestOptions,
    );

    return res.status(200).json({
      success: true,
      type: "subscription",
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      customer: stripeCustomer,
    });
  } catch (error) {
    console.error("Error creating recurring subscription:", error);
    return res.status(500).json({
      success: false,
      error: "Error creating recurring subscription",
      details: error.message,
    });
  }
}

// Reactivate subscription functionality
async function reactivateSubscription(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, subscriptionId } = req.body;

    if (!email || !subscriptionId) {
      return res
        .status(400)
        .json({ error: "Email and subscriptionId are required" });
    }

    // Use the connected account ID for API calls
    const requestOptions = {
      stripeAccount: process.env.VITE_STRIPE_COMPANY_ID,
    };

    // Reactivate the subscription by removing the cancel_at_period_end flag
    const subscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        cancel_at_period_end: false,
        metadata: {
          reactivated_by: "customer",
          reactivated_at: new Date().toISOString(),
        },
      },
      requestOptions,
    );

    return res.status(200).json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end,
        current_period_end: new Date(subscription.current_period_end * 1000),
      },
      message: "Subscription has been reactivated successfully",
    });
  } catch (error) {
    console.error("Error reactivating subscription:", error);
    return res.status(500).json({
      success: false,
      error: "Error reactivating subscription",
      details: error.message,
    });
  }
}

// Fix incorrect subscription prices functionality
async function fixIncorrectPrices(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

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
    // Use the connected account ID for API calls
    const requestOptions = {
      stripeAccount: process.env.VITE_STRIPE_COMPANY_ID,
    };

    // Define expected prices
    const expectedPrices = {
      'practicing': 120,
      'retired': 60,
      'assistant': 30
    };

    // For each tier, find and fix incorrect prices
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

      // Ensure we have a correct price to migrate to
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

      // Find and update subscriptions using incorrect prices
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

        // Archive the incorrect price (don't delete - Stripe doesn't allow it)
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

    return res.status(200).json({
      success: true,
      report: report
    });
  } catch (error) {
    console.error('Fatal error in fix script:', error);
    return res.status(500).json({
      success: false,
      error: 'Error fixing incorrect prices',
      details: error.message
    });
  }
}
