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
    const response = await fetch(`${API_BASE}/api/users`, {
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
    const response = await fetch(`${API_BASE}/api/users?email=${encodeURIComponent(email)}`);
    const result = await response.json();
    return result.user || null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export async function getAllUsers() {
  try {
    const response = await fetch(`${API_BASE}/api/users`);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching all users:', error);
    return { success: false, error: 'Erreur lors de la récupération des utilisateurs', users: [] };
  }
}

export async function getUserById(id: string | number) {
  try {
    const response = await fetch(`${API_BASE}/api/profile?id=${encodeURIComponent(id)}`);
    const result = await response.json();
    
    if (result.success) {
      return result.user;
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
    const response = await fetch(`${API_BASE}/api/profile?id=${encodeURIComponent(id)}`, {
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
    const response = await fetch(`${API_BASE}/api/users`, {
      method: 'PUT',
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error updating existing users subscriptions:', error);
    return { success: false, error: 'Erreur lors de la mise à jour des abonnements' };
  }
}