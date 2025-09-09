export interface CreateUserData {
  email: string;
  firstname: string;
  lastname: string;
  hospital: string;
  address?: string;
  subscription: string;
  infopro?: string;
  newsletter?: boolean;
  isadmin?: boolean;
}

const API_BASE = '';

export async function createUser(userData: CreateUserData) {
  try {
    const response = await fetch(`${API_BASE}/api/user-management?action=create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error('Error creating user:', error);
    return { 
      success: false, 
      error: 'Erreur lors de la création du compte utilisateur.' 
    };
  }
}

export async function getUserByEmail(email: string) {
  try {
    const response = await fetch(`${API_BASE}/api/user-management?action=get&email=${encodeURIComponent(email)}`);
    const result = await response.json();
    return result.user || null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export async function getAllUsers() {
  try {
    const response = await fetch(`${API_BASE}/api/user-management?action=list&isAdmin=true`);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching all users:', error);
    return { success: false, error: 'Erreur lors de la récupération des utilisateurs', users: [] };
  }
}

export async function getUserById(id: string | number) {
  try {
    const response = await fetch(`${API_BASE}/api/user-management?action=profile&id=${encodeURIComponent(id)}`);
    const result = await response.json();
    
    if (result.success) {
      // Convert date strings back to Date objects
      const user = result.user;
      
      // Handle createdAt - convert from timestamp to Date
      if (user.createdAt) {
        user.createdAt = new Date(user.createdAt);
      }
      
      if (user.updatedAt) {
        user.updatedAt = new Date(user.updatedAt);
      }
      if (user.subscribedUntil) {
        user.subscribedUntil = new Date(user.subscribedUntil);
      }
      return user;
    } else {
      console.error('Error fetching user by ID:', result.error);
      return null;
    }
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return null;
  }
}

export async function updateProfile(id: string | number, profileData: any) {
  try {
    const response = await fetch(`${API_BASE}/api/user-management?action=profile&id=${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, error: 'Erreur lors de la mise à jour du profil' };
  }
}

export async function updateExistingUsersSubscriptions() {
  try {
    const response = await fetch(`${API_BASE}/api/user-management?action=update-subscriptions`, {
      method: 'PUT',
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error updating existing users subscriptions:', error);
    return { success: false, error: 'Erreur lors de la mise à jour des abonnements' };
  }
}