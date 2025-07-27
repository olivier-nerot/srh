const { getDb } = require('./lib/turso');
const { eq, asc, desc } = require('drizzle-orm');
const { sqliteTable, text, integer } = require('drizzle-orm/sqlite-core');

// Define tables directly
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

const jotextes = sqliteTable('jotextes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  content: text('content').notNull(),
  document: integer('document'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

const faq = sqliteTable('faq', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  tags: text('tags', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

const rapports = sqliteTable('rapports', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  content: text('content').notNull(),
  year: text('year'),
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

  // Extract content type from URL path
  const { contentType } = req.query;
  
  if (!contentType) {
    return res.status(400).json({ error: 'Content type is required (publications, jotextes, faq, or rapports)' });
  }

  try {
    switch (contentType) {
      case 'publications':
        return await handlePublications(req, res);
      case 'jotextes':
        return await handleJOTextes(req, res);
      case 'faq':
        return await handleFAQ(req, res);
      case 'rapports':
        return await handleRapports(req, res);
      default:
        return res.status(400).json({ error: 'Invalid content type' });
    }
  } catch (error) {
    console.error(`Content API Error (${contentType}):`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Publications handlers
async function handlePublications(req, res) {
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
}

async function getAllPublications(req, res) {
  try {
    const { type } = req.query;
    const db = await getDb();
    
    let query = db.select().from(publications);
    
    // Filter by specific publication type if provided
    if (type) {
      query = query.where(eq(publications.type, type));
    }
    // If no type filter, return all publications
    
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

// JO Textes handlers
async function handleJOTextes(req, res) {
  switch (req.method) {
    case 'GET':
      return await getAllJOTextes(req, res);
    case 'POST':
      return await createJOText(req, res);
    case 'PUT':
      return await updateJOText(req, res);
    case 'DELETE':
      return await deleteJOText(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getAllJOTextes(req, res) {
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

// FAQ handlers
async function handleFAQ(req, res) {
  switch (req.method) {
    case 'GET':
      return await getAllFAQ(req, res);
    case 'POST':
      return await createFAQ(req, res);
    case 'PUT':
      return await updateFAQ(req, res);
    case 'DELETE':
      return await deleteFAQ(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getAllFAQ(req, res) {
  try {
    const db = await getDb();
    const result = await db.select().from(faq).orderBy(asc(faq.createdAt));
    return res.status(200).json({ success: true, faqs: result });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error fetching FAQs',
      faqs: []
    });
  }
}

async function createFAQ(req, res) {
  const { question, answer, tags, isAdmin } = req.body;

  if (!isAdmin) {
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied. Admin privileges required.' 
    });
  }

  if (!question || !answer) {
    return res.status(400).json({ 
      success: false, 
      error: 'Question and answer are required' 
    });
  }

  try {
    const db = await getDb();
    const result = await db.insert(faq).values({
      question,
      answer,
      tags: tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return res.status(201).json({ success: true, faq: result[0] });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error creating FAQ' 
    });
  }
}

async function updateFAQ(req, res) {
  const { id, question, answer, tags, isAdmin } = req.body;

  if (!isAdmin) {
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied. Admin privileges required.' 
    });
  }

  if (!id || !question || !answer) {
    return res.status(400).json({ 
      success: false, 
      error: 'ID, question, and answer are required' 
    });
  }

  try {
    const db = await getDb();
    const result = await db.update(faq)
      .set({
        question,
        answer,
        tags: tags || [],
        updatedAt: new Date(),
      })
      .where(eq(faq.id, id))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'FAQ not found' 
      });
    }

    return res.status(200).json({ success: true, faq: result[0] });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error updating FAQ' 
    });
  }
}

async function deleteFAQ(req, res) {
  const { id, isAdmin } = req.body;

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
    const result = await db.delete(faq)
      .where(eq(faq.id, id))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'FAQ not found' 
      });
    }

    return res.status(200).json({ success: true, message: 'FAQ deleted successfully' });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error deleting FAQ' 
    });
  }
}

// Rapports handlers
async function handleRapports(req, res) {
  switch (req.method) {
    case 'GET':
      return await getAllRapports(req, res);
    case 'POST':
      return await createRapport(req, res);
    case 'PUT':
      return await updateRapport(req, res);
    case 'DELETE':
      return await deleteRapport(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getAllRapports(req, res) {
  try {
    const db = await getDb();
    const result = await db.select().from(rapports).orderBy(desc(rapports.createdAt));
    return res.status(200).json({ success: true, rapports: result });
  } catch (error) {
    console.error('Error fetching rapports:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error fetching rapports',
      rapports: []
    });
  }
}

async function createRapport(req, res) {
  const { name, content, document, isAdmin } = req.body;

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
    const result = await db.insert(rapports).values({
      name,
      content,
      document: document || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return res.status(201).json({ success: true, rapport: result[0] });
  } catch (error) {
    console.error('Error creating rapport:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error creating rapport' 
    });
  }
}

async function updateRapport(req, res) {
  const { id, name, content, document, isAdmin } = req.body;

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
    const result = await db.update(rapports)
      .set({
        name,
        content,
        document: document || null,
        updatedAt: new Date(),
      })
      .where(eq(rapports.id, id))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Rapport not found' 
      });
    }

    return res.status(200).json({ success: true, rapport: result[0] });
  } catch (error) {
    console.error('Error updating rapport:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error updating rapport' 
    });
  }
}

async function deleteRapport(req, res) {
  const { id, isAdmin } = req.body;

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
    const result = await db.delete(rapports)
      .where(eq(rapports.id, id))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Rapport not found' 
      });
    }

    return res.status(200).json({ success: true, message: 'Rapport deleted successfully' });
  } catch (error) {
    console.error('Error deleting rapport:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error deleting rapport' 
    });
  }
}