const { getDb } = require('./lib/turso');
const { eq, asc, desc } = require('drizzle-orm');
const { sqliteTable, text, integer } = require('drizzle-orm/sqlite-core');

// Define jotextes table directly
const jotextes = sqliteTable('jotextes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  content: text('content').notNull(),
  document: integer('document'),
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
      case 'GET':
        return await getAllJOTexts(req, res);
      case 'POST':
        return await createJOText(req, res);
      case 'PUT':
        return await updateJOText(req, res);
      case 'DELETE':
        return await deleteJOText(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('JO Texts API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getAllJOTexts(req, res) {
  try {
    const db = await getDb();
    
    const result = await db.select().from(jotextes).orderBy(desc(jotextes.createdAt));
    return res.status(200).json({ success: true, jotextes: result });
  } catch (error) {
    console.error('Error fetching JO texts:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error fetching JO texts',
      jotextes: []
    });
  }
}

async function createJOText(req, res) {
  const { name, content, document, isAdmin } = req.body;

  // Check if user is admin
  if (!isAdmin) {
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied. Admin privileges required.' 
    });
  }

  if (!name || !content) {
    return res.status(400).json({ 
      success: false, 
      error: 'Name and content are required' 
    });
  }

  try {
    const db = await getDb();
    const result = await db.insert(jotextes).values({
      name,
      content,
      document: document || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return res.status(201).json({ success: true, jotext: result[0] });
  } catch (error) {
    console.error('Error creating JO text:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error creating JO text' 
    });
  }
}

async function updateJOText(req, res) {
  const { id, name, content, document, isAdmin } = req.body;

  // Check if user is admin
  if (!isAdmin) {
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied. Admin privileges required.' 
    });
  }

  if (!id || !name || !content) {
    return res.status(400).json({ 
      success: false, 
      error: 'ID, name, and content are required' 
    });
  }

  try {
    const db = await getDb();
    const result = await db.update(jotextes)
      .set({
        name,
        content,
        document: document || null,
        updatedAt: new Date(),
      })
      .where(eq(jotextes.id, id))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'JO text not found' 
      });
    }

    return res.status(200).json({ success: true, jotext: result[0] });
  } catch (error) {
    console.error('Error updating JO text:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error updating JO text' 
    });
  }
}

async function deleteJOText(req, res) {
  const { id, isAdmin } = req.body;

  // Check if user is admin
  if (!isAdmin) {
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied. Admin privileges required.' 
    });
  }

  if (!id) {
    return res.status(400).json({ 
      success: false, 
      error: 'ID is required' 
    });
  }

  try {
    const db = await getDb();
    const result = await db.delete(jotextes)
      .where(eq(jotextes.id, id))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'JO text not found' 
      });
    }

    return res.status(200).json({ success: true, message: 'JO text deleted successfully' });
  } catch (error) {
    console.error('Error deleting JO text:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error deleting JO text' 
    });
  }
}