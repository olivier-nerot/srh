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
      case "retry-payment":
        return await retryPayment(req, res);
      case "confirm-setup":
        return await confirmSetup(req, res);
      case "cleanup-duplicate-subscriptions":
        return await cleanupDuplicateSubscriptions(req, res);
      case "get-duplicate-subscriptions":
        return await getDuplicateSubscriptions(req, res);
      case "create-subscription-after-payment":
        return await createSubscriptionAfterPayment(req, res);
      case "preview-trialing-migration":
        return await previewTrialingMigration(req, res);
      case "execute-trialing-migration":
        return await executeTrialingMigration(req, res);
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
    const emailParts = email.split('@');
    const localPart = emailParts[0]?.toLowerCase();
    const domain = emailParts[1]?.toLowerCase();

    // Collect customers from multiple search strategies
    const customersSet = new Map(); // Use Map to dedupe by customer ID

    // Strategy 1: Exact email match
    try {
      const exactMatch = await stripe.customers.list(
        { email: email, limit: 10 },
        requestOptions,
      );
      if (exactMatch?.data) {
        exactMatch.data.forEach(c => customersSet.set(c.id, c));
      }
    } catch (err) {
      console.log('Exact email search failed:', err.message);
    }

    // Strategy 2: Lowercase email match (if different from exact)
    if (emailLower !== email) {
      try {
        const lowerMatch = await stripe.customers.list(
          { email: emailLower, limit: 10 },
          requestOptions,
        );
        if (lowerMatch?.data) {
          lowerMatch.data.forEach(c => customersSet.set(c.id, c));
        }
      } catch (err) {
        console.log('Lowercase email search failed:', err.message);
      }
    }

    // Strategy 3: Search API for case-insensitive matches
    // This catches customers with uppercase variants like michel.SOFFER@...
    try {
      const searchResult = await stripe.customers.search({
        query: `email~"${localPart}"`,
        limit: 20,
      }, requestOptions);

      if (searchResult?.data) {
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
      }
    } catch (searchError) {
      // Search API might not be available in all Stripe versions or connected accounts
      console.log('Search API not available:', searchError.message);
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
    for (const customer of customers) {
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
        // Extract card info from payment_method_details
        const cardDetails = charge.payment_method_details?.card;
        allPayments.push({
          type: 'charge',
          id: charge.id,
          amount: charge.amount / 100,
          currency: charge.currency,
          status: charge.status,
          created: charge.created,
          description: charge.description,
          customerId: customer.id,
          // Include failure information for failed charges
          failure_code: charge.failure_code || null,
          failure_message: charge.failure_message || null,
          // Include card info
          card_last4: cardDetails?.last4 || null,
          card_brand: cardDetails?.brand || null,
        });
      });

      // Add payment intents from this customer (all statuses for history)
      paymentIntents.data.forEach(pi => {
        allPayments.push({
          type: 'payment_intent',
          id: pi.id,
          amount: pi.amount / 100,
          currency: pi.currency,
          status: pi.status,
          created: pi.created,
          description: pi.description,
          customerId: customer.id,
          // Include failure information for failed payment intents
          failure_code: pi.last_payment_error?.code || null,
          failure_message: pi.last_payment_error?.message || null,
        });
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

    // Get the first (oldest) successful payment for "member since" date
    const successfulPayments = allPayments.filter(p => p.status === 'succeeded');
    const oldestSuccessful = successfulPayments.length > 0
      ? successfulPayments[successfulPayments.length - 1]
      : null;

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
      failure_code: mostRecent.failure_code,
      failure_message: mostRecent.failure_message,
      card_last4: mostRecent.card_last4,
      card_brand: mostRecent.card_brand,
    };

    // Format the first payment data (for "member since")
    const firstPayment = oldestSuccessful ? {
      id: oldestSuccessful.id,
      amount: oldestSuccessful.amount,
      currency: oldestSuccessful.currency,
      status: oldestSuccessful.status,
      created: new Date(oldestSuccessful.created * 1000),
      description: oldestSuccessful.description,
    } : null;

    // Format all payments for history - deduplicate by keeping only charges for succeeded
    // (payment_intents create charges when successful, so we'd have duplicates)
    // For failed/canceled payments, keep payment_intents (they don't have charges)
    const paymentHistory = allPayments
      .filter(p => {
        // Keep all charges (these are actual successful payments)
        if (p.type === 'charge') return true;
        // Keep payment_intents only if NOT succeeded (failed, canceled, etc.)
        if (p.type === 'payment_intent' && p.status !== 'succeeded') return true;
        return false;
      })
      .map(p => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        created: new Date(p.created * 1000),
        description: p.description,
        card_last4: p.card_last4,
        card_brand: p.card_brand,
        failure_code: p.failure_code,
        failure_message: p.failure_message,
      }));

    return res.status(200).json({
      success: true,
      lastPayment: lastPayment,
      firstPayment: firstPayment,
      paymentHistory: paymentHistory,
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

// Create payment functionality - IMMEDIATE PAYMENT (no free trial)
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

    // Calculate membership end date (1 year from now)
    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 1);

    // ALWAYS create PaymentIntent for immediate payment (no more free trial)
    console.log(`Creating PaymentIntent for immediate payment - ${customer.email}`);

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: amount,
        currency: currency,
        customer: stripeCustomer.id,
        metadata: {
          tier: tierData.id,
          hospital: customer.hospital || "",
          payment_type: recurring ? "recurring" : "one_time",
          valid_until: validUntil.toISOString(),
        },
      },
      requestOptions,
    );

    if (recurring) {
      // For recurring payments: get or create price for subscription
      const priceId = await createOrGetPrice(tierData, requestOptions);

      return res.status(200).json({
        success: true,
        type: "subscription_with_payment",
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        customer: stripeCustomer,
        validUntil: validUntil.toISOString(),
        // Subscription will be created after payment confirmation
        pendingSubscription: {
          priceId: priceId,
          tier: tierData.id,
        },
      });
    } else {
      // One-time payment: just return the payment intent
      return res.status(200).json({
        success: true,
        type: "one_time_payment",
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        customer: stripeCustomer,
        validUntil: validUntil.toISOString(),
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
    const domain = emailParts[1]?.toLowerCase();

    // Collect customers from multiple search strategies
    const customersSet = new Map();

    // Strategy 1: Exact email match
    try {
      const exactMatch = await stripe.customers.list(
        { email: email, limit: 10 },
        requestOptions,
      );
      if (exactMatch?.data) {
        exactMatch.data.forEach(c => customersSet.set(c.id, c));
      }
    } catch (err) {
      console.log('Exact email search failed:', err.message);
    }

    // Strategy 2: Lowercase email match
    if (emailLower !== email) {
      try {
        const lowerMatch = await stripe.customers.list(
          { email: emailLower, limit: 10 },
          requestOptions,
        );
        if (lowerMatch?.data) {
          lowerMatch.data.forEach(c => customersSet.set(c.id, c));
        }
      } catch (err) {
        console.log('Lowercase email search failed:', err.message);
      }
    }

    // Strategy 3: Search API for case-insensitive matches
    try {
      const searchResult = await stripe.customers.search({
        query: `email~"${localPart}"`,
        limit: 20,
      }, requestOptions);

      if (searchResult?.data) {
        searchResult.data.forEach(c => {
          if (c.email) {
            const customerDomain = c.email.split('@')[1]?.toLowerCase();
            const customerLocal = c.email.split('@')[0]?.toLowerCase();
            if (customerLocal === localPart && customerDomain === domain) {
              customersSet.set(c.id, c);
            }
          }
        });
      }
    } catch (searchError) {
      console.log('Search API not available for subscriptions:', searchError.message);
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
        expand: ['data.default_payment_method'], // Include payment method info
      };
      const subscriptions = await stripe.subscriptions.list(
        subscriptionListParams,
        requestOptions,
      );

      console.log(`Customer ${customer.id} (${customer.email}): ${subscriptions.data.length} subscriptions`);

      // Try to get customer's default payment method if subscriptions don't have one
      let customerCardInfo = { last4: null, brand: null };
      if (customer.invoice_settings?.default_payment_method) {
        try {
          const customerPM = await stripe.paymentMethods.retrieve(
            customer.invoice_settings.default_payment_method,
            requestOptions
          );
          if (customerPM.card) {
            customerCardInfo = { last4: customerPM.card.last4, brand: customerPM.card.brand };
          }
        } catch (e) {
          console.log(`Could not retrieve customer payment method: ${e.message}`);
        }
      }

      // Format and add subscriptions from this customer
      subscriptions.data.forEach((sub) => {
        // Extract card info from default_payment_method if available
        const paymentMethod = sub.default_payment_method;
        let cardInfo = paymentMethod && typeof paymentMethod === 'object' && paymentMethod.card
          ? { last4: paymentMethod.card.last4, brand: paymentMethod.card.brand }
          : customerCardInfo; // Fallback to customer's default payment method

        console.log(`  Subscription ${sub.id}:`, {
          status: sub.status,
          amount: sub.items.data[0]?.price?.unit_amount / 100,
          tier: sub.metadata?.tier,
          card: cardInfo.last4 ? `${cardInfo.brand} ****${cardInfo.last4}` : 'none',
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
          card_last4: cardInfo.last4,
          card_brand: cardInfo.brand,
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

// Create recurring subscription from one-time payment - NO TRIAL PERIOD
// This is used when a member with one-time payment wants to switch to recurring
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

    // Calculate valid until date (1 year from now)
    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 1);

    // Create the subscription with immediate payment (no trial period)
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
      // NO trial_period_days - payment is immediate
      metadata: {
        tier: tierData.id,
        converted_from_onetime: "true",
        payment_type: "recurring",
        valid_until: validUntil.toISOString(),
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
      validUntil: validUntil.toISOString(),
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

    // First, retrieve the subscription to check its current status
    const existingSubscription = await stripe.subscriptions.retrieve(
      subscriptionId,
      requestOptions,
    );

    // Check if subscription can be reactivated
    // Only subscriptions with status 'active' or 'trialing' that are scheduled to cancel can be reactivated
    if (existingSubscription.status === 'canceled') {
      return res.status(400).json({
        success: false,
        error: "Cet abonnement est définitivement annulé et ne peut pas être réactivé. Veuillez créer un nouvel abonnement.",
        code: "subscription_canceled",
        status: existingSubscription.status,
      });
    }

    if (!['active', 'trialing'].includes(existingSubscription.status)) {
      return res.status(400).json({
        success: false,
        error: `L'abonnement ne peut pas être réactivé car son statut est "${existingSubscription.status}".`,
        code: "invalid_subscription_status",
        status: existingSubscription.status,
      });
    }

    if (!existingSubscription.cancel_at_period_end) {
      return res.status(400).json({
        success: false,
        error: "L'abonnement est déjà actif et n'a pas besoin d'être réactivé.",
        code: "subscription_already_active",
        status: existingSubscription.status,
      });
    }

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

// Retry failed payment functionality
async function retryPayment(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, subscriptionId } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Use the connected account ID for API calls
    const requestOptions = {
      stripeAccount: process.env.VITE_STRIPE_COMPANY_ID,
    };

    // Find customer by email
    const customers = await stripe.customers.list(
      { email: email, limit: 1 },
      requestOptions
    );

    if (customers.data.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const customer = customers.data[0];
    console.log(`Retrying payment for customer ${customer.id} (${email})`);

    // If subscriptionId is provided, try to pay the latest invoice for that subscription
    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(
        subscriptionId,
        { expand: ['latest_invoice'] },
        requestOptions
      );

      // Check subscription status first
      if (subscription.status === 'canceled') {
        return res.status(400).json({
          success: false,
          error: "L'abonnement est annulé. Aucun paiement ne peut être relancé. Un nouvel abonnement doit être créé.",
          code: "subscription_canceled",
          subscriptionStatus: subscription.status,
        });
      }

      if (subscription.latest_invoice && typeof subscription.latest_invoice === 'object') {
        const invoice = subscription.latest_invoice;

        // Check if invoice is open or draft (retryable)
        if (invoice.status === 'open' || invoice.status === 'draft') {
          console.log(`Attempting to pay invoice ${invoice.id}`);

          try {
            const paidInvoice = await stripe.invoices.pay(
              invoice.id,
              {},
              requestOptions
            );

            return res.status(200).json({
              success: true,
              message: "Payment retry successful",
              invoice: {
                id: paidInvoice.id,
                status: paidInvoice.status,
                amount_paid: paidInvoice.amount_paid / 100,
              }
            });
          } catch (payError) {
            console.error("Invoice payment failed:", payError.message);
            return res.status(400).json({
              success: false,
              error: "Payment retry failed",
              details: payError.message,
              failure_code: payError.code,
            });
          }
        }

        // If invoice is paid, void, or uncollectible, return specific message
        if (invoice.status === 'paid') {
          return res.status(400).json({
            success: false,
            error: "La dernière facture est déjà payée.",
            code: "invoice_already_paid",
            invoiceStatus: invoice.status,
            subscriptionStatus: subscription.status,
          });
        }

        if (invoice.status === 'void') {
          return res.status(400).json({
            success: false,
            error: "La dernière facture a été annulée et ne peut pas être relancée.",
            code: "invoice_void",
            invoiceStatus: invoice.status,
            subscriptionStatus: subscription.status,
          });
        }

        if (invoice.status === 'uncollectible') {
          return res.status(400).json({
            success: false,
            error: "La dernière facture a été marquée comme irrécupérable. Veuillez mettre à jour le moyen de paiement et créer un nouvel abonnement.",
            code: "invoice_uncollectible",
            invoiceStatus: invoice.status,
            subscriptionStatus: subscription.status,
          });
        }
      }

      // If we have a subscription but no retryable invoice, return specific message
      return res.status(404).json({
        success: false,
        error: `Aucune facture à relancer pour cet abonnement (statut: ${subscription.status}).`,
        code: "no_retryable_invoice",
        subscriptionStatus: subscription.status,
      });
    }

    // No subscriptionId provided - search for subscriptions with retryable invoices
    // Check multiple statuses: past_due, incomplete, unpaid
    const statusesToCheck = ['past_due', 'incomplete', 'unpaid'];

    for (const status of statusesToCheck) {
      const subscriptions = await stripe.subscriptions.list(
        {
          customer: customer.id,
          status: status,
          limit: 1,
        },
        requestOptions
      );

      if (subscriptions.data.length > 0) {
        const subscription = subscriptions.data[0];
        console.log(`Found ${status} subscription ${subscription.id}`);

        // Get the latest invoice
        const invoices = await stripe.invoices.list(
          {
            subscription: subscription.id,
            status: 'open',
            limit: 1,
          },
          requestOptions
        );

        if (invoices.data.length > 0) {
          const invoice = invoices.data[0];
          console.log(`Attempting to pay invoice ${invoice.id}`);

          try {
            const paidInvoice = await stripe.invoices.pay(
              invoice.id,
              {},
              requestOptions
            );

            return res.status(200).json({
              success: true,
              message: "Payment retry successful",
              invoice: {
                id: paidInvoice.id,
                status: paidInvoice.status,
                amount_paid: paidInvoice.amount_paid / 100,
              }
            });
          } catch (payError) {
            console.error("Invoice payment failed:", payError.message);
            return res.status(400).json({
              success: false,
              error: "Payment retry failed",
              details: payError.message,
              failure_code: payError.code,
            });
          }
        }
      }
    }

    return res.status(404).json({
      success: false,
      error: "Aucun paiement en attente ou échoué à relancer. L'abonnement est peut-être déjà actif ou définitivement annulé.",
      code: "no_pending_payment",
    });
  } catch (error) {
    console.error("Error retrying payment:", error);
    return res.status(500).json({
      success: false,
      error: "Error retrying payment",
      details: error.message,
    });
  }
}

// Confirm setup intent and attach payment method to subscription
// This MUST be called after confirmCardSetup() succeeds on the frontend
async function confirmSetup(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { setupIntentId, subscriptionId, customerId } = req.body;

    if (!setupIntentId) {
      return res.status(400).json({ error: "setupIntentId is required" });
    }

    // Use the connected account ID for API calls
    const requestOptions = {
      stripeAccount: process.env.VITE_STRIPE_COMPANY_ID,
    };

    // Retrieve the SetupIntent to get the payment method
    const setupIntent = await stripe.setupIntents.retrieve(
      setupIntentId,
      requestOptions
    );

    console.log(`\n=== Confirming setup intent ${setupIntentId} ===`);
    console.log(`Status: ${setupIntent.status}`);
    console.log(`Payment method: ${setupIntent.payment_method}`);

    if (setupIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        error: `SetupIntent is not succeeded (status: ${setupIntent.status})`,
      });
    }

    const paymentMethodId = setupIntent.payment_method;
    if (!paymentMethodId) {
      return res.status(400).json({
        success: false,
        error: "No payment method found on SetupIntent",
      });
    }

    // Get the customer ID from the SetupIntent if not provided
    const customerIdToUse = customerId || setupIntent.customer;
    if (!customerIdToUse) {
      return res.status(400).json({
        success: false,
        error: "No customer ID found",
      });
    }

    // 1. Set the payment method as the customer's default for invoices
    console.log(`Setting payment method ${paymentMethodId} as default for customer ${customerIdToUse}`);
    await stripe.customers.update(
      customerIdToUse,
      {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      },
      requestOptions
    );

    // 2. Update all active/trialing subscriptions to use this payment method
    const subscriptions = await stripe.subscriptions.list(
      {
        customer: customerIdToUse,
        status: 'all',
      },
      requestOptions
    );

    let subscriptionsUpdated = 0;
    for (const sub of subscriptions.data) {
      if (sub.status === 'trialing' || sub.status === 'active') {
        console.log(`Updating subscription ${sub.id} (status: ${sub.status})`);
        await stripe.subscriptions.update(
          sub.id,
          {
            default_payment_method: paymentMethodId,
          },
          requestOptions
        );
        subscriptionsUpdated++;
      }
    }

    console.log(`✓ Payment method attached successfully`);
    console.log(`  - Customer default updated`);
    console.log(`  - ${subscriptionsUpdated} subscription(s) updated`);

    return res.status(200).json({
      success: true,
      message: "Payment method attached successfully",
      paymentMethodId: paymentMethodId,
      customerId: customerIdToUse,
      subscriptionsUpdated: subscriptionsUpdated,
    });
  } catch (error) {
    console.error("Error confirming setup:", error);
    return res.status(500).json({
      success: false,
      error: "Error confirming setup",
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

// Get duplicate subscriptions preview - returns list of duplicates without cancelling
async function getDuplicateSubscriptions(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const requestOptions = {
    stripeAccount: process.env.VITE_STRIPE_COMPANY_ID,
  };

  try {
    // Fetch all active/trialing subscriptions
    const allSubscriptions = [];
    let hasMore = true;
    let startingAfter = null;

    while (hasMore) {
      const params = {
        limit: 100,
        status: "all",
        expand: ["data.customer"],
      };
      if (startingAfter) {
        params.starting_after = startingAfter;
      }

      const subscriptions = await stripe.subscriptions.list(params, requestOptions);
      allSubscriptions.push(...subscriptions.data);
      hasMore = subscriptions.has_more;
      if (subscriptions.data.length > 0) {
        startingAfter = subscriptions.data[subscriptions.data.length - 1].id;
      }
    }

    // Group by customer email
    const subscriptionsByEmail = {};

    for (const sub of allSubscriptions) {
      // Only consider active or trialing subscriptions
      if (sub.status !== "active" && sub.status !== "trialing") {
        continue;
      }

      const customer = sub.customer;
      const email = typeof customer === "object" ? customer.email : null;
      const name = typeof customer === "object" ? customer.name : null;

      if (!email) continue;

      if (!subscriptionsByEmail[email]) {
        subscriptionsByEmail[email] = {
          email,
          name,
          subscriptions: [],
        };
      }

      subscriptionsByEmail[email].subscriptions.push({
        id: sub.id,
        status: sub.status,
        created: new Date(sub.created * 1000).toISOString(),
        amount: sub.items.data[0]?.price?.unit_amount / 100 || sub.items.data[0]?.plan?.amount / 100 || 0,
        hasPaymentMethod: !!sub.default_payment_method,
      });
    }

    // Find members with duplicates and sort subscriptions by date
    const duplicates = [];
    let totalToCancel = 0;

    for (const [email, data] of Object.entries(subscriptionsByEmail)) {
      if (data.subscriptions.length > 1) {
        // Sort by created date (newest first)
        data.subscriptions.sort((a, b) => new Date(b.created) - new Date(a.created));

        duplicates.push({
          email: data.email,
          name: data.name,
          count: data.subscriptions.length,
          toKeep: data.subscriptions[0],
          toCancel: data.subscriptions.slice(1),
        });

        totalToCancel += data.subscriptions.length - 1;
      }
    }

    // Sort by count descending
    duplicates.sort((a, b) => b.count - a.count);

    return res.status(200).json({
      success: true,
      duplicates,
      summary: {
        membersWithDuplicates: duplicates.length,
        subscriptionsToCancel: totalToCancel,
      },
    });
  } catch (error) {
    console.error("Error fetching duplicate subscriptions:", error);
    return res.status(500).json({
      success: false,
      error: "Error fetching duplicate subscriptions",
      details: error.message,
    });
  }
}

// Cleanup duplicate subscriptions - keeps only the most recent one per customer
async function cleanupDuplicateSubscriptions(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const requestOptions = {
    stripeAccount: process.env.VITE_STRIPE_COMPANY_ID,
  };

  try {
    console.log("=== CLEANUP DUPLICATE SUBSCRIPTIONS ===");
    console.log("Fetching all subscriptions...");

    // Fetch all active/trialing subscriptions
    const allSubscriptions = [];
    let hasMore = true;
    let startingAfter = null;

    while (hasMore) {
      const params = {
        limit: 100,
        status: "all",
        expand: ["data.customer"],
      };
      if (startingAfter) {
        params.starting_after = startingAfter;
      }

      const subscriptions = await stripe.subscriptions.list(params, requestOptions);
      allSubscriptions.push(...subscriptions.data);
      hasMore = subscriptions.has_more;
      if (subscriptions.data.length > 0) {
        startingAfter = subscriptions.data[subscriptions.data.length - 1].id;
      }
    }

    console.log(`Found ${allSubscriptions.length} total subscriptions`);

    // Group by customer email
    const subscriptionsByEmail = {};

    for (const sub of allSubscriptions) {
      // Only consider active or trialing subscriptions
      if (sub.status !== "active" && sub.status !== "trialing") {
        continue;
      }

      const customer = sub.customer;
      const email = typeof customer === "object" ? customer.email : null;

      if (!email) continue;

      if (!subscriptionsByEmail[email]) {
        subscriptionsByEmail[email] = [];
      }

      subscriptionsByEmail[email].push({
        id: sub.id,
        status: sub.status,
        created: sub.created,
        default_payment_method: sub.default_payment_method,
      });
    }

    // Find and cancel duplicates
    const report = {
      membersWithDuplicates: 0,
      subscriptionsCancelled: 0,
      errors: [],
      details: [],
    };

    for (const [email, subs] of Object.entries(subscriptionsByEmail)) {
      if (subs.length <= 1) continue;

      report.membersWithDuplicates++;

      // Sort by created date (newest first)
      subs.sort((a, b) => b.created - a.created);

      // Keep the first (newest), cancel the rest
      const toKeep = subs[0];
      const toCancel = subs.slice(1);

      console.log(`\nProcessing ${email}: ${subs.length} subscriptions`);
      console.log(`  Keeping: ${toKeep.id} (created: ${new Date(toKeep.created * 1000).toISOString()})`);

      for (const sub of toCancel) {
        try {
          console.log(`  Cancelling: ${sub.id} (created: ${new Date(sub.created * 1000).toISOString()})`);

          await stripe.subscriptions.cancel(sub.id, requestOptions);

          report.subscriptionsCancelled++;
          report.details.push({
            email,
            cancelledSubscriptionId: sub.id,
            keptSubscriptionId: toKeep.id,
            cancelledAt: new Date().toISOString(),
          });

          console.log(`    ✓ Cancelled successfully`);
        } catch (error) {
          console.error(`    ✗ Error cancelling ${sub.id}:`, error.message);
          report.errors.push({
            email,
            subscriptionId: sub.id,
            error: error.message,
          });
        }
      }
    }

    console.log("\n=== CLEANUP COMPLETE ===");
    console.log(`Members with duplicates: ${report.membersWithDuplicates}`);
    console.log(`Subscriptions cancelled: ${report.subscriptionsCancelled}`);
    console.log(`Errors: ${report.errors.length}`);

    return res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("Error in cleanup script:", error);
    return res.status(500).json({
      success: false,
      error: "Error cleaning up duplicate subscriptions",
      details: error.message,
    });
  }
}

// Create subscription after payment confirmation - NO TRIAL PERIOD
// The subscription starts immediately and renews in 1 year
async function createSubscriptionAfterPayment(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, priceId, tier, paymentIntentId } = req.body;

    if (!email || !priceId) {
      return res.status(400).json({
        error: "Missing required fields: email, priceId",
      });
    }

    const requestOptions = {
      stripeAccount: process.env.VITE_STRIPE_COMPANY_ID,
    };

    // Find customer by email
    const customers = await stripe.customers.list(
      { email: email, limit: 1 },
      requestOptions
    );

    if (customers.data.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    const customer = customers.data[0];

    // Get payment method from the payment intent
    let paymentMethodId = null;
    if (paymentIntentId) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(
          paymentIntentId,
          requestOptions
        );
        paymentMethodId = paymentIntent.payment_method;
      } catch (piError) {
        console.log("Could not retrieve payment intent:", piError.message);
      }
    }

    // Calculate valid until date (1 year from now)
    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 1);

    // Create subscription - first payment already made via PaymentIntent
    // Use billing_cycle_anchor to schedule next payment in 1 year
    const billingAnchor = Math.floor(validUntil.getTime() / 1000); // Unix timestamp

    const subscriptionParams = {
      customer: customer.id,
      items: [{ price: priceId }],
      // Anchor billing to 1 year from now (next payment date)
      billing_cycle_anchor: billingAnchor,
      proration_behavior: 'none', // Don't charge for the "free" period
      payment_settings: {
        save_default_payment_method: "on_subscription",
        payment_method_types: ['card'],
      },
      metadata: {
        tier: tier || "unknown",
        payment_type: "recurring",
        valid_until: validUntil.toISOString(),
        payment_intent_id: paymentIntentId || "",
      },
    };

    // Attach payment method if available
    if (paymentMethodId) {
      subscriptionParams.default_payment_method = paymentMethodId;
    }

    const subscription = await stripe.subscriptions.create(
      subscriptionParams,
      requestOptions
    );

    console.log(`Created subscription ${subscription.id} for ${email} - status: ${subscription.status}`);

    return res.status(200).json({
      success: true,
      subscriptionId: subscription.id,
      status: subscription.status,
      validUntil: validUntil.toISOString(),
    });
  } catch (error) {
    console.error("Error creating subscription after payment:", error);
    return res.status(500).json({
      success: false,
      error: "Error creating subscription",
      details: error.message,
    });
  }
}

// Preview trialing subscriptions migration
// Lists all "trialing" subscriptions and determines what will happen to each
async function previewTrialingMigration(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const requestOptions = {
      stripeAccount: process.env.VITE_STRIPE_COMPANY_ID,
    };

    // Get all trialing subscriptions
    const subscriptions = await stripe.subscriptions.list(
      {
        status: "trialing",
        limit: 100,
      },
      requestOptions
    );

    const results = {
      total: subscriptions.data.length,
      toKeep: [],
      toCancel: [],
    };

    for (const subscription of subscriptions.data) {
      // Get customer info
      const customer = await stripe.customers.retrieve(
        subscription.customer,
        requestOptions
      );

      // Check if customer has any successful payments in the last year
      const oneYearAgo = Math.floor(Date.now() / 1000) - (365 * 24 * 60 * 60);
      const payments = await stripe.paymentIntents.list(
        {
          customer: subscription.customer,
          limit: 10,
        },
        requestOptions
      );

      const hasRecentPayment = payments.data.some(
        (payment) =>
          payment.status === "succeeded" && payment.created > oneYearAgo
      );

      const subscriptionInfo = {
        subscriptionId: subscription.id,
        email: customer.email || "unknown",
        name: customer.name || customer.email || "unknown",
        createdAt: new Date(subscription.created * 1000).toISOString(),
        hasRecentPayment,
        recentPaymentCount: payments.data.filter(
          (p) => p.status === "succeeded" && p.created > oneYearAgo
        ).length,
      };

      if (hasRecentPayment) {
        // Member has paid, keep their membership valid
        results.toKeep.push(subscriptionInfo);
      } else {
        // No recent payment, subscription will be cancelled
        results.toCancel.push(subscriptionInfo);
      }
    }

    return res.status(200).json({
      success: true,
      preview: results,
      message: `Found ${results.total} trialing subscriptions: ${results.toKeep.length} to keep (with recent payment), ${results.toCancel.length} to cancel (no payment)`,
    });
  } catch (error) {
    console.error("Error previewing trialing migration:", error);
    return res.status(500).json({
      success: false,
      error: "Error previewing trialing migration",
      details: error.message,
    });
  }
}

// Execute trialing subscriptions migration
// Cancels trialing subscriptions without recent payment
async function executeTrialingMigration(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const requestOptions = {
      stripeAccount: process.env.VITE_STRIPE_COMPANY_ID,
    };

    // Get all trialing subscriptions
    const subscriptions = await stripe.subscriptions.list(
      {
        status: "trialing",
        limit: 100,
      },
      requestOptions
    );

    const results = {
      total: subscriptions.data.length,
      kept: [],
      cancelled: [],
      errors: [],
    };

    for (const subscription of subscriptions.data) {
      try {
        // Get customer info
        const customer = await stripe.customers.retrieve(
          subscription.customer,
          requestOptions
        );

        // Check if customer has any successful payments in the last year
        const oneYearAgo = Math.floor(Date.now() / 1000) - (365 * 24 * 60 * 60);
        const payments = await stripe.paymentIntents.list(
          {
            customer: subscription.customer,
            limit: 10,
          },
          requestOptions
        );

        const hasRecentPayment = payments.data.some(
          (payment) =>
            payment.status === "succeeded" && payment.created > oneYearAgo
        );

        const subscriptionInfo = {
          subscriptionId: subscription.id,
          email: customer.email || "unknown",
          name: customer.name || customer.email || "unknown",
        };

        // Check if we should cancel all trialing subscriptions
        const cancelAll = req.query.cancelAll === "true";

        if (hasRecentPayment && !cancelAll) {
          // Member has paid - keep membership, just update status
          // We don't cancel, the subscription can stay as-is
          results.kept.push({
            ...subscriptionInfo,
            reason: "Has recent payment - membership valid",
          });
        } else {
          // Cancel the subscription (either no payment, or cancelAll=true)
          await stripe.subscriptions.cancel(subscription.id, requestOptions);
          results.cancelled.push({
            ...subscriptionInfo,
            reason: hasRecentPayment
              ? "Has payment - subscription cancelled (membership still valid via payment date)"
              : "No payment found - subscription cancelled",
            hadPayment: hasRecentPayment,
          });
        }
      } catch (subError) {
        results.errors.push({
          subscriptionId: subscription.id,
          error: subError.message,
        });
      }
    }

    return res.status(200).json({
      success: true,
      results,
      message: `Migration complete: ${results.kept.length} kept, ${results.cancelled.length} cancelled, ${results.errors.length} errors`,
    });
  } catch (error) {
    console.error("Error executing trialing migration:", error);
    return res.status(500).json({
      success: false,
      error: "Error executing trialing migration",
      details: error.message,
    });
  }
}

