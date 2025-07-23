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
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const updateData = req.body;

    if (!id) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID is required' 
      });
    }

    // Convert id to number
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid user ID format' 
      });
    }

    // Get database
    const db = await getDb();

    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.id, userId));
    if (existingUser.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Prepare update data
    const updateFields = {
      firstname: updateData.firstname,
      lastname: updateData.lastname,
      email: updateData.email,
      hospital: updateData.hospital,
      address: updateData.address || '',
      subscription: updateData.subscription,
      infopro: updateData.infopro,
      newsletter: updateData.newsletter ?? true,
      updatedAt: new Date(),
    };

    // Remove undefined fields
    Object.keys(updateFields).forEach(key => {
      if (updateFields[key] === undefined) {
        delete updateFields[key];
      }
    });

    // Update user in database
    const result = await db
      .update(users)
      .set(updateFields)
      .where(eq(users.id, userId))
      .returning();

    if (result.length === 0) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to update user' 
      });
    }

    // Return updated user data
    return res.status(200).json({ 
      success: true, 
      user: {
        id: result[0].id,
        email: result[0].email,
        firstname: result[0].firstname,
        lastname: result[0].lastname,
        hospital: result[0].hospital,
        address: result[0].address,
        subscription: result[0].subscription,
        infopro: result[0].infopro,
        isadmin: result[0].isadmin,
        newsletter: result[0].newsletter,
        subscribedUntil: result[0].subscribedUntil,
        createdAt: result[0].createdAt,
        updatedAt: result[0].updatedAt,
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    
    // Handle unique constraint violation
    if (error.message?.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cette adresse email est déjà utilisée par un autre compte' 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}