const { getDb } = require('./lib/turso');
const { eq, and, gt, isNull, asc, desc } = require('drizzle-orm');
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Extract action from URL path or query
  const { action } = req.query;
  
  if (!action) {
    return res.status(400).json({ 
      error: 'Action is required (create, get, update, delete, list, login, verify-otp, profile)' 
    });
  }

  try {
    switch (action) {
      case 'create':
        return await createUser(req, res);
      case 'get':
        return await getUser(req, res);
      case 'update':
        return await updateUser(req, res);
      case 'delete':
        return await deleteUser(req, res);
      case 'list':
        return await listUsers(req, res);
      case 'login':
        return await loginUser(req, res);
      case 'verify-otp':
        return await verifyOTP(req, res);
      case 'profile':
        return await handleProfile(req, res);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error(`User Management API Error (${action}):`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Create user functionality (from users.js)
async function createUser(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      email, 
      firstname, 
      lastname, 
      infopro,
      hospital, 
      address, 
      subscription,
      newsletter,
      isadmin 
    } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email is required' 
      });
    }

    const db = await getDb();
    
    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (existingUser.length > 0) {
      return res.status(409).json({ 
        success: false, 
        error: 'User with this email already exists' 
      });
    }

    const result = await db.insert(users).values({
      email: email,
      firstname: firstname || null,
      lastname: lastname || null,
      infopro: infopro || null,
      hospital: hospital || null,
      address: address || null,
      subscription: subscription || null,
      newsletter: newsletter || false,
      isadmin: isadmin || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    const newUser = result[0];

    return res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstname: newUser.firstname,
        lastname: newUser.lastname,
        hospital: newUser.hospital,
        address: newUser.address,
        subscription: newUser.subscription,
        isadmin: newUser.isadmin,
        newsletter: newUser.newsletter,
        created_at: newUser.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({
      success: false,
      error: 'Error creating user: ' + error.message
    });
  }
}

// Get user functionality (from users.js)
async function getUser(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, id } = req.query;

    if (!email && !id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Either email or id is required' 
      });
    }

    const db = await getDb();
    let user;

    if (email) {
      const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
      user = result[0];
    } else {
      const result = await db.select().from(users).where(eq(users.id, parseInt(id))).limit(1);
      user = result[0];
    }

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        hospital: user.hospital,
        address: user.address,
        subscription: user.subscription,
        isadmin: user.isadmin,
        newsletter: user.newsletter,
        infopro: user.infopro,
        subscribedUntil: user.subscribedUntil,
        created_at: user.createdAt
      }
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({
      success: false,
      error: 'Error fetching user: ' + error.message
    });
  }
}

// Update user functionality (from users.js and profile.js)
async function updateUser(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID is required' 
      });
    }

    const { 
      firstname, 
      lastname, 
      hospital, 
      address, 
      subscription,
      newsletter,
      isadmin,
      infopro 
    } = req.body;

    const db = await getDb();
    
    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.id, parseInt(id))).limit(1);
    
    if (existingUser.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    const result = await db.update(users)
      .set({
        firstname: firstname,
        lastname: lastname,
        hospital: hospital,
        address: address,
        subscription: subscription,
        newsletter: newsletter,
        isadmin: isadmin,
        infopro: infopro,
        updatedAt: new Date(),
      })
      .where(eq(users.id, parseInt(id)))
      .returning();

    const updatedUser = result[0];

    return res.status(200).json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstname: updatedUser.firstname,
        lastname: updatedUser.lastname,
        hospital: updatedUser.hospital,
        address: updatedUser.address,
        subscription: updatedUser.subscription,
        isadmin: updatedUser.isadmin,
        newsletter: updatedUser.newsletter,
        infopro: updatedUser.infopro
      }
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({
      success: false,
      error: 'Error updating user: ' + error.message
    });
  }
}

// Delete user functionality (from users.js)
async function deleteUser(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID is required' 
      });
    }

    const db = await getDb();
    
    await db.delete(users).where(eq(users.id, parseInt(id)));

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({
      success: false,
      error: 'Error deleting user: ' + error.message
    });
  }
}

// List users functionality (from users.js)
async function listUsers(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { isAdmin } = req.query;

    if (isAdmin !== 'true') {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied. Admin privileges required.' 
      });
    }

    const db = await getDb();
    
    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      firstname: users.firstname,
      lastname: users.lastname,
      hospital: users.hospital,
      subscription: users.subscription,
      isadmin: users.isadmin,
      newsletter: users.newsletter,
      subscribedUntil: users.subscribedUntil,
      createdAt: users.createdAt
    }).from(users).orderBy(asc(users.id));

    const formattedUsers = allUsers.map(user => ({
      ...user,
      created_at: user.createdAt || user.created_at
    }));

    return res.status(200).json({
      success: true,
      users: formattedUsers
    });

  } catch (error) {
    console.error('Error listing users:', error);
    return res.status(500).json({
      success: false,
      error: 'Error listing users: ' + error.message
    });
  }
}

// Login user functionality (from auth.js)
async function loginUser(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Email is required and must be a string' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email format' 
      });
    }

    const db = await getDb();

    // Check if user exists
    const existingUsers = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUsers.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Aucun compte n\'est associé à cette adresse email.' 
      });
    }

    // Generate OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

    // Store OTP in database
    const otpData = {
      email: email,
      otp: otpCode,
      expiresAt: expiresAt,
      createdAt: new Date(),
    };
    
    console.log('=== OTP INSERT DEBUG ===');
    console.log('expiresAt type:', typeof otpData.expiresAt, 'value:', otpData.expiresAt);
    console.log('createdAt type:', typeof otpData.createdAt, 'value:', otpData.createdAt);
    
    await db.insert(otps).values(otpData);

    // Send OTP email
    try {
      await resend.emails.send({
        from: 'SRH <noreply@srh-info.org>',
        to: [email],
        subject: 'Votre code de connexion SRH',
        html: `
          <h2>Code de connexion</h2>
          <p>Voici votre code de connexion à usage unique :</p>
          <h1 style="font-family: monospace; font-size: 32px; letter-spacing: 0.5em; text-align: center; background-color: #f0f0f0; padding: 20px; margin: 20px 0;">${otpCode}</h1>
          <p>Ce code expire dans 10 minutes.</p>
          <p>Si vous n'avez pas demandé ce code, vous pouvez ignorer cet email.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">Syndicat des Radiologues Hospitaliers</p>
        `
      });

      return res.status(200).json({ 
        success: true, 
        message: 'Code OTP envoyé avec succès',
        email: email 
      });

    } catch (emailError) {
      console.error('Error sending email:', emailError);
      return res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer.' 
      });
    }

  } catch (error) {
    console.error('Login API Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    });
  }
}

// Verify OTP functionality (from verify-otp.js)
async function verifyOTP(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, otp } = req.body;

    if (!email || typeof email !== 'string' || !otp || typeof otp !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Email et OTP sont requis et doivent être des chaînes de caractères' 
      });
    }

    const db = await getDb();

    // Find the most recent valid OTP for this email
    const validOtps = await db.select()
      .from(otps)
      .where(
        and(
          eq(otps.email, email),
          eq(otps.otp, otp),
          gt(otps.expiresAt, new Date())
        )
      )
      .orderBy(desc(otps.createdAt))
      .limit(1);

    if (validOtps.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Code OTP invalide ou expiré' 
      });
    }

    // Get user information
    const userResult = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (userResult.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Utilisateur non trouvé' 
      });
    }

    const user = userResult[0];

    // Clean up used OTP
    await db.delete(otps).where(eq(otps.id, validOtps[0].id));

    // Return user data for login
    return res.status(200).json({ 
      success: true, 
      message: 'Connexion réussie',
      user: {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        hospital: user.hospital,
        isadmin: user.isadmin,
        subscription: user.subscription,
        newsletter: user.newsletter
      }
    });

  } catch (error) {
    console.error('OTP Verification Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erreur interne du serveur' 
    });
  }
}

// Profile functionality (from profile.js)
async function handleProfile(req, res) {
  try {
    if (req.method === 'GET') {
      return await getUserProfile(req, res);
    } else if (req.method === 'PUT') {
      return await updateProfile(req, res);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Profile API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getUserProfile(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ 
      success: false, 
      error: 'User ID is required' 
    });
  }

  try {
    const db = await getDb();
    const result = await db.select().from(users).where(eq(users.id, parseInt(id))).limit(1);

    if (result.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    const user = result[0];

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        hospital: user.hospital,
        address: user.address,
        subscription: user.subscription,
        isadmin: user.isadmin,
        newsletter: user.newsletter,
        infopro: user.infopro,
        subscribedUntil: user.subscribedUntil,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({
      success: false,
      error: 'Error fetching user profile: ' + error.message
    });
  }
}

async function updateProfile(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ 
      success: false, 
      error: 'User ID is required' 
    });
  }

  try {
    const { 
      firstname, 
      lastname, 
      hospital, 
      address,
      newsletter 
    } = req.body;

    const db = await getDb();
    
    const result = await db.update(users)
      .set({
        firstname: firstname,
        lastname: lastname,
        hospital: hospital,
        address: address,
        newsletter: newsletter,
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

    const updatedUser = result[0];

    return res.status(200).json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstname: updatedUser.firstname,
        lastname: updatedUser.lastname,
        hospital: updatedUser.hospital,
        address: updatedUser.address,
        subscription: updatedUser.subscription,
        isadmin: updatedUser.isadmin,
        newsletter: updatedUser.newsletter,
        infopro: updatedUser.infopro
      }
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({
      success: false,
      error: 'Error updating profile: ' + error.message
    });
  }
}