export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: Date;
  description?: string;
}

const API_BASE = '';

export async function getUserLastPayment(email: string): Promise<{ success: boolean; lastPayment: Payment | null; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/api/payments?email=${encodeURIComponent(email)}`);
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