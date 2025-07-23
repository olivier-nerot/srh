import { db } from '../lib/turso';
import { users } from '../db/schema';

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

export async function createUser(userData: CreateUserData) {
  try {
    // Check if user already exists
    const existingUser = await getUserByEmail(userData.email);
    if (existingUser) {
      return { 
        success: false, 
        error: 'Un utilisateur avec cette adresse email existe déjà.' 
      };
    }

    const result = await db.insert(users).values({
      email: userData.email,
      firstname: userData.firstname,
      lastname: userData.lastname,
      hospital: userData.hospital,
      address: userData.address || '',
      subscription: userData.subscription,
      infopro: userData.infopro || '',
      newsletter: userData.newsletter ?? true,
      isadmin: userData.isadmin ?? false,
    }).returning();

    return { success: true, user: result[0] };
  } catch (error: any) {
    console.error('Error creating user:', error);
    
    // Handle specific database errors
    if (error.message?.includes('UNIQUE constraint failed')) {
      return { 
        success: false, 
        error: 'Un utilisateur avec cette adresse email existe déjà.' 
      };
    }
    
    return { 
      success: false, 
      error: 'Erreur lors de la création du compte utilisateur.' 
    };
  }
}

export async function getUserByEmail(email: string) {
  try {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0] || null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export async function getAllUsers() {
  try {
    const result = await db.select().from(users).orderBy(users.lastname, users.firstname);
    return { success: true, users: result };
  } catch (error) {
    console.error('Error fetching all users:', error);
    return { success: false, error: 'Erreur lors de la récupération des utilisateurs', users: [] };
  }
}

export async function updateExistingUsersSubscriptions() {
  try {
    // Get all users with null subscription dates
    const usersWithoutSubscription = await db.select().from(users).where(isNull(users.subscribedUntil));
    
    const updates = [];
    for (const user of usersWithoutSubscription) {
      // Set subscription to 1 year from their creation date, or 1 year from now if no creation date
      const baseDate = user.createdAt ? new Date(user.createdAt) : new Date();
      const subscriptionDate = new Date(baseDate.getTime() + 365 * 24 * 60 * 60 * 1000);
      
      updates.push(
        db.update(users)
          .set({ subscribedUntil: subscriptionDate })
          .where(eq(users.id, user.id))
      );
    }
    
    // Execute all updates
    await Promise.all(updates);
    
    return { success: true, updated: usersWithoutSubscription.length };
  } catch (error) {
    console.error('Error updating existing users subscriptions:', error);
    return { success: false, error: 'Erreur lors de la mise à jour des abonnements' };
  }
}

import { eq, isNull } from 'drizzle-orm';