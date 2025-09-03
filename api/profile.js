const { getDb } = require('./lib/turso');
const { eq } = require('drizzle-orm');
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getUserById(req, res);
      case 'PUT':
        return await updateProfile(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Profile API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getUserById(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'User ID is required'
    });
  }

  try {
    const db = await getDb();
    const result = await db.select()
      .from(users)
      .where(eq(users.id, parseInt(id)))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Remove sensitive fields for non-admin requests
    const user = result[0];
    
    return res.status(200).json({
      success: true,
      user: user
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({
      success: false,
      error: 'Error fetching user: ' + error.message
    });
  }
}

async function updateProfile(req, res) {
  const { id } = req.query;
  const {
    firstname,
    lastname,
    email,
    hospital,
    address,
    subscription,
    newsletter,
    isadmin,
    // Professional information fields
    huTitulaire,
    phLiberal,
    hospitaloUniversitaireTitulaire,
    adhesionCollegiale,
    huLiberal,
    hospitaloUniversitaireCCA,
    adhesionAlliance,
    assistantSpecialiste,
    assistantTempsPartage
  } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'User ID is required'
    });
  }

  try {
    const db = await getDb();

    // Create professional info object
    const professionalInfo = {
      huTitulaire: Boolean(huTitulaire),
      phLiberal: Boolean(phLiberal),
      hospitaloUniversitaireTitulaire: Boolean(hospitaloUniversitaireTitulaire),
      adhesionCollegiale: Boolean(adhesionCollegiale),
      huLiberal: Boolean(huLiberal),
      hospitaloUniversitaireCCA: Boolean(hospitaloUniversitaireCCA),
      adhesionAlliance: Boolean(adhesionAlliance),
      assistantSpecialiste: Boolean(assistantSpecialiste),
      assistantTempsPartage: Boolean(assistantTempsPartage)
    };

    const result = await db.update(users)
      .set({
        firstname: firstname || null,
        lastname: lastname || null,
        email: email || null,
        hospital: hospital || null,
        address: address || null,
        subscription: subscription || null,
        newsletter: Boolean(newsletter),
        isadmin: isadmin !== undefined ? Boolean(isadmin) : undefined,
        infopro: JSON.stringify(professionalInfo),
        updatedAt: new Date(),
      })
      .where(eq(users.id, parseInt(id)))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      user: result[0],
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({
      success: false,
      error: 'Error updating profile: ' + error.message
    });
  }
}