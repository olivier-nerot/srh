const { getDb } = require('./lib/turso');
const { eq, and, gt } = require('drizzle-orm');
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

// Define OTP table
const otps = sqliteTable('otps', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull(),
  otp: text('otp').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, otp } = req.body;

    if (!email || typeof email !== 'string' || !otp || typeof otp !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and OTP are required' 
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Get database
    const db = await getDb();

    // Find valid OTP
    const now = new Date();
    const otpResult = await db
      .select()
      .from(otps)
      .where(
        and(
          eq(otps.email, normalizedEmail),
          eq(otps.otp, otp.trim()),
          gt(otps.expiresAt, now)
        )
      );

    if (otpResult.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: 'Code invalide ou expiré.' 
      });
    }

    // OTP is valid, delete it to prevent reuse
    await db.delete(otps).where(eq(otps.email, normalizedEmail));

    // Get user data
    const userResult = await db.select().from(users).where(eq(users.email, normalizedEmail));
    
    if (userResult.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: 'Utilisateur introuvable.' 
      });
    }

    const user = userResult[0];

    // Return user data for login
    return res.status(200).json({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        hospital: user.hospital,
        isadmin: user.isadmin,
        subscription: user.subscription,
        subscribedUntil: user.subscribedUntil,
      }
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la vérification du code.' 
    });
  }
}