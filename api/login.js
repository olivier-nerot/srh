const { getDb } = require('./lib/turso');
const { eq } = require('drizzle-orm');

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

    // Get database and schema
    const db = await getDb();
    const { users } = await import('../src/db/schema/users.js');

    // Check if user exists in database
    const result = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim()));
    
    if (result.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: 'Aucun compte trouvé avec cette adresse email.' 
      });
    }

    const user = result[0];

    // Return user data (excluding sensitive info if any)
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
    console.error('Login error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la connexion.' 
    });
  }
}