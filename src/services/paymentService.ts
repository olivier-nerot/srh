export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: Date;
  description?: string;
  failure_code?: string;
  failure_message?: string;
}

export interface Subscription {
  id: string;
  status: string;
  current_period_start: Date;
  current_period_end: Date;
  amount: number;
  currency: string;
  tier: string;
  customer_email: string;
  cancel_at_period_end: boolean;
  canceled_at: Date | null;
}

export interface TierData {
  id: string;
  title: string;
  price: number;
}

interface SubscriptionApiResponse {
  id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  amount: number;
  currency: string;
  tier: string;
  customer_email: string;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
}

interface PaymentIntentResponse {
  success: boolean;
  type?: string;
  subscriptionId?: string;
  clientSecret?: string;
  setupIntentId?: string;
  customer?: { id: string; email: string };
  trial_end?: string;
  willCancelAfterPayment?: boolean;
  error?: string;
}

const API_BASE = "";

export async function createPaymentIntent(paymentData: {
  amount: number;
  currency: string;
  customer: {
    email: string;
    name: string;
    hospital?: string;
  };
  recurring: boolean;
  tierData: TierData;
}): Promise<{
  success: boolean;
  data?: PaymentIntentResponse;
  error?: string;
}> {
  try {
    const response = await fetch(
      `${API_BASE}/api/stripe?action=create-payment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error:
          errorData.error ||
          `API error: ${response.status} ${response.statusText}`,
      };
    }

    const result = await response.json();
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return {
      success: false,
      error: "Erreur lors de la création du paiement",
    };
  }
}

export async function getUserSubscriptions(email: string): Promise<{
  success: boolean;
  subscriptions: Subscription[] | null;
  error?: string;
}> {
  try {
    const response = await fetch(
      `${API_BASE}/api/stripe?action=get-subscriptions&email=${encodeURIComponent(email)}`,
    );

    if (!response.ok) {
      console.error(
        "Subscriptions API response not OK:",
        response.status,
        response.statusText,
      );
      return {
        success: false,
        subscriptions: null,
        error: `API error: ${response.status} ${response.statusText}`,
      };
    }

    const result = await response.json();

    if (result.success && result.subscriptions) {
      // Convert date strings back to Date objects
      result.subscriptions = result.subscriptions.map(
        (sub: SubscriptionApiResponse) => ({
          ...sub,
          current_period_start: new Date(sub.current_period_start),
          current_period_end: new Date(sub.current_period_end),
        }),
      );
    }

    return result;
  } catch (error) {
    console.error("Error fetching user subscriptions:", error);
    return {
      success: false,
      subscriptions: null,
      error: "Erreur lors de la récupération des abonnements",
    };
  }
}

export async function getUserLastPayment(email: string): Promise<{
  success: boolean;
  lastPayment: Payment | null;
  firstPayment: Payment | null;
  error?: string;
}> {
  try {
    const response = await fetch(
      `${API_BASE}/api/stripe?action=get-payments&email=${encodeURIComponent(email)}`,
    );

    if (!response.ok) {
      console.error(
        "Payment API response not OK:",
        response.status,
        response.statusText,
      );
      return {
        success: false,
        lastPayment: null,
        firstPayment: null,
        error: `API error: ${response.status} ${response.statusText}`,
      };
    }

    const result = await response.json();

    if (result.success && result.lastPayment) {
      // Convert the created date string back to Date object
      result.lastPayment.created = new Date(result.lastPayment.created);
    }

    if (result.success && result.firstPayment) {
      // Convert the created date string back to Date object
      result.firstPayment.created = new Date(result.firstPayment.created);
    }

    return {
      success: result.success,
      lastPayment: result.lastPayment || null,
      firstPayment: result.firstPayment || null,
      error: result.error,
    };
  } catch (error) {
    console.error("Error fetching user last payment:", error);
    return {
      success: false,
      lastPayment: null,
      firstPayment: null,
      error: "Erreur lors de la récupération des informations de paiement",
    };
  }
}

export async function retryPayment(
  email: string,
  subscriptionId?: string,
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  details?: string;
}> {
  try {
    const response = await fetch(
      `${API_BASE}/api/stripe?action=retry-payment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, subscriptionId }),
      },
    );

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || "Erreur lors de la relance du paiement",
        details: result.details,
      };
    }

    return {
      success: true,
      message: result.message,
    };
  } catch (error) {
    console.error("Error retrying payment:", error);
    return {
      success: false,
      error: "Erreur lors de la relance du paiement",
    };
  }
}
