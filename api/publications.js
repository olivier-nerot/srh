const { getDb } = require('./lib/turso');
const { eq, asc, desc } = require('drizzle-orm');
const { sqliteTable, text, integer } = require('drizzle-orm/sqlite-core');

// Define publications table directly
const publications = sqliteTable('publications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  tags: text('tags', { mode: 'json' }),
  pubdate: integer('pubdate', { mode: 'timestamp' }).notNull(),
  subscribersonly: integer('subscribersonly', { mode: 'boolean' }).notNull(),
  homepage: integer('homepage', { mode: 'boolean' }).notNull(),
  picture: text('picture'),
  attachmentIds: text('attachment_ids', { mode: 'json' }),
  type: text('type').notNull(),
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
        return await getAllPublications(req, res);
      case 'POST':
        return await createPublication(req, res);
      case 'PUT':
        return await updatePublication(req, res);
      case 'DELETE':
        return await deletePublication(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Publications API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getAllPublications(req, res) {
  try {
    const { type } = req.query;
    const db = await getDb();
    
    let query = db.select().from(publications);
    
    // Filter by type if provided
    if (type) {
      query = query.where(eq(publications.type, type));
    }
    
    const result = await query.orderBy(desc(publications.pubdate));
    return res.status(200).json({ success: true, publications: result });
  } catch (error) {
    console.error('Error fetching publications:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error fetching publications',
      publications: []
    });
  }
}

async function createPublication(req, res) {
  const { title, content, tags, pubdate, subscribersonly, homepage, picture, attachmentIds, type, isAdmin } = req.body;

  // Check if user is admin
  if (!isAdmin) {
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied. Admin privileges required.' 
    });
  }

  if (!title || !content || !pubdate) {
    return res.status(400).json({ 
      success: false, 
      error: 'Title, content, and publication date are required' 
    });
  }

  try {
    const db = await getDb();
    const result = await db.insert(publications).values({
      title,
      content,
      tags: tags || [],
      pubdate: new Date(pubdate),
      subscribersonly: subscribersonly || false,
      homepage: homepage !== undefined ? homepage : true,
      picture: picture || null,
      attachmentIds: attachmentIds || [],
      type: type || 'publication',
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return res.status(201).json({ success: true, publication: result[0] });
  } catch (error) {
    console.error('Error creating publication:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error creating publication' 
    });
  }
}

async function updatePublication(req, res) {
  const { id, title, content, tags, pubdate, subscribersonly, homepage, picture, attachmentIds, type, isAdmin } = req.body;

  // Check if user is admin
  if (!isAdmin) {
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied. Admin privileges required.' 
    });
  }

  if (!id || !title || !content || !pubdate) {
    return res.status(400).json({ 
      success: false, 
      error: 'ID, title, content, and publication date are required' 
    });
  }

  try {
    const db = await getDb();
    const result = await db.update(publications)
      .set({
        title,
        content,
        tags: tags || [],
        pubdate: new Date(pubdate),
        subscribersonly: subscribersonly || false,
        homepage: homepage !== undefined ? homepage : true,
        picture: picture || null,
        attachmentIds: attachmentIds || [],
        type: type || 'publication',
        updatedAt: new Date(),
      })
      .where(eq(publications.id, id))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Publication not found' 
      });
    }

    return res.status(200).json({ success: true, publication: result[0] });
  } catch (error) {
    console.error('Error updating publication:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error updating publication' 
    });
  }
}

async function deletePublication(req, res) {
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
    const result = await db.delete(publications)
      .where(eq(publications.id, id))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Publication not found' 
      });
    }

    return res.status(200).json({ success: true, message: 'Publication deleted successfully' });
  } catch (error) {
    console.error('Error deleting publication:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error deleting publication' 
    });
  }
}