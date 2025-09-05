const { getDb } = require('./lib/turso');
const { eq, isNull, asc } = require('drizzle-orm');
const { sqliteTable, text, integer } = require('drizzle-orm/sqlite-core');

// Define users table directly
const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  firstname: text('firstname'),
  lastname: text('lastname'),
  infopro: text('infopro'),
  isadmin: integer('isadmin', { mode: 'boolean' }).default(false),
  newsletter: integer('newsletter', { mode: 'boolean' }).default(false),
  hospital: text('hospital'),
  address: text('address'),
  subscription: text('subscription'),
  subscribedUntil: integer('subscribed_until', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

module.exports = async function handler(req, res) {
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

async function createUser(req, res) {
  const userData = req.body;

  try {
    // Get database
    const db = await getDb();

    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, userData.email));
    if (existingUser.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Un utilisateur avec cette adresse email existe déjà.' 
      });
    }

    const now = new Date();
    
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
      createdAt: now,
      updatedAt: now,
    }).returning();

    return res.status(201).json({ success: true, user: result[0] });
  } catch (error) {
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

async function getUserByEmail(req, res) {
  const { email } = req.query;
  
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email parameter is required' });
  }

  try {
    // Get database
    const db = await getDb();

    const result = await db.select().from(users).where(eq(users.email, email));
    return res.status(200).json({ user: result[0] || null });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ error: 'Error fetching user' });
  }
}

async function getAllUsers(req, res) {
  try {
    console.log('getAllUsers: Starting...');
    // Get database
    const db = await getDb();
    console.log('getAllUsers: Database connected');

    const result = await db.select().from(users).orderBy(asc(users.lastname), asc(users.firstname));
    console.log('getAllUsers: Query executed, found', result.length, 'users');
    
    return res.status(200).json({ success: true, users: result });
  } catch (error) {
    console.error('Error fetching all users:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des utilisateurs', 
      users: [] 
    });
  }
}

async function updateExistingUsersSubscriptions(req, res) {
  try {
    // Get database
    const db = await getDb();

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