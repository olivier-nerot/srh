export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: Date;
  description?: string;
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

const API_BASE = '';

export async function createPaymentIntent(paymentData: {
  amount: number;
  currency: string;
  customer: {
    email: string;
    name: string;
    hospital?: string;
  };
  recurring: boolean;
  tierData: any;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/api/stripe?action=create-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || `API error: ${response.status} ${response.statusText}`
      };
    }
    
    const result = await response.json();
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return { 
      success: false, 
      error: 'Erreur lors de la création du paiement' 
    };
  }
}

export async function getUserSubscriptions(email: string): Promise<{ success: boolean; subscriptions: Subscription[] | null; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/api/stripe?action=get-subscriptions&email=${encodeURIComponent(email)}`);
    
    if (!response.ok) {
      console.error('Subscriptions API response not OK:', response.status, response.statusText);
      return {
        success: false,
        subscriptions: null,
        error: `API error: ${response.status} ${response.statusText}`
      };
    }
    
    const result = await response.json();
    
    if (result.success && result.subscriptions) {
      // Convert date strings back to Date objects
      result.subscriptions = result.subscriptions.map((sub: any) => ({
        ...sub,
        current_period_start: new Date(sub.current_period_start),
        current_period_end: new Date(sub.current_period_end)
      }));
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    return { 
      success: false, 
      subscriptions: null,
      error: 'Erreur lors de la récupération des abonnements' 
    };
  }
}

export async function getUserLastPayment(email: string): Promise<{ success: boolean; lastPayment: Payment | null; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/api/stripe?action=get-payments&email=${encodeURIComponent(email)}`);
    
    if (!response.ok) {
      console.error('Payment API response not OK:', response.status, response.statusText);
      return {
        success: false,
        lastPayment: null,
        error: `API error: ${response.status} ${response.statusText}`
      };
    }
    
    const result = await response.json();
    
    if (result.success && result.lastPayment) {
      // Convert the created date string back to Date object
      result.lastPayment.created = new Date(result.lastPayment.created);
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching user last payment:', error);
    return { 
      success: false, 
      lastPayment: null,
      error: 'Erreur lors de la récupération des informations de paiement' 
    };
  }
}