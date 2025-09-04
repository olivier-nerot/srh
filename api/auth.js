const { getDb } = require('./lib/turso');
const { eq } = require('drizzle-orm');
const { sqliteTable, text, integer } = require('drizzle-orm/sqlite-core');
const { Resend } = require('resend');

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

const resend = new Resend(process.env.RESEND_API_KEY);

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Email is required' 
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Get database
    const db = await getDb();

    // Check if user exists in database
    const result = await db.select().from(users).where(eq(users.email, normalizedEmail));
    
    if (result.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: 'Aucun compte trouvé avec cette adresse email.' 
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    const now = new Date();

    // Clear any existing OTPs for this email
    await db.delete(otps).where(eq(otps.email, normalizedEmail));

    // Store OTP in database
    await db.insert(otps).values({
      email: normalizedEmail,
      otp,
      expiresAt,
      createdAt: now,
    });

    // Send OTP via email
    await resend.emails.send({
      from: process.env.RESEND_EMAIL,
      to: normalizedEmail,
      subject: 'Code de connexion SRH',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Votre code de connexion</h2>
          <p>Bonjour,</p>
          <p>Voici votre code de connexion pour accéder à votre espace adhérent SRH :</p>
          <div style="background: #f3f4f6; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e40af;">${otp}</span>
          </div>
          <p>Ce code est valide pendant <strong>10 minutes</strong>.</p>
          <p>Si vous n'avez pas demandé ce code, vous pouvez ignorer cet email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Syndicat des Radiologues Hospitalo-universitaires<br>
            <a href="https://srh-info.org" style="color: #1e40af;">srh-info.org</a>
          </p>
        </div>
      `,
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Code envoyé par email',
      email: normalizedEmail
    });

  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de l\'envoi du code. Veuillez réessayer.' 
    });
  }
}