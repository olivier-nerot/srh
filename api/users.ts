import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './lib/turso';
import { users } from '../src/db/schema';
import { eq, isNull } from 'drizzle-orm';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'POST':
        return await createUser(req, res);
      case 'GET':
        const { email } = req.query;
        if (email) {
          return await getUserByEmail(req, res);
        }
        return await getAllUsers(req, res);
      case 'PUT':
        return await updateExistingUsersSubscriptions(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function createUser(req: VercelRequest, res: VercelResponse) {
  const userData: CreateUserData = req.body;

  try {
    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, userData.email));
    if (existingUser.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Un utilisateur avec cette adresse email existe déjà.' 
      });
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

    return res.status(201).json({ success: true, user: result[0] });
  } catch (error: any) {
    console.error('Error creating user:', error);
    
    if (error.message?.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Un utilisateur avec cette adresse email existe déjà.' 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la création du compte utilisateur.' 
    });
  }
}

async function getUserByEmail(req: VercelRequest, res: VercelResponse) {
  const { email } = req.query;
  
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email parameter is required' });
  }

  try {
    const result = await db.select().from(users).where(eq(users.email, email));
    return res.status(200).json({ user: result[0] || null });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ error: 'Error fetching user' });
  }
}

async function getAllUsers(req: VercelRequest, res: VercelResponse) {
  try {
    const result = await db.select().from(users).orderBy(users.lastname, users.firstname);
    return res.status(200).json({ success: true, users: result });
  } catch (error) {
    console.error('Error fetching all users:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des utilisateurs', 
      users: [] 
    });
  }
}

async function updateExistingUsersSubscriptions(req: VercelRequest, res: VercelResponse) {
  try {
    const usersWithoutSubscription = await db.select().from(users).where(isNull(users.subscribedUntil));
    
    const updates = [];
    for (const user of usersWithoutSubscription) {
      const baseDate = user.createdAt ? new Date(user.createdAt) : new Date();
      const subscriptionDate = new Date(baseDate.getTime() + 365 * 24 * 60 * 60 * 1000);
      
      updates.push(
        db.update(users)
          .set({ subscribedUntil: subscriptionDate })
          .where(eq(users.id, user.id))
      );
    }
    
    await Promise.all(updates);
    
    return res.status(200).json({ success: true, updated: usersWithoutSubscription.length });
  } catch (error) {
    console.error('Error updating existing users subscriptions:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la mise à jour des abonnements' 
    });
  }
}