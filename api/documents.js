const { getDb } = require('./lib/turso');
const { eq, inArray } = require('drizzle-orm');
const { sqliteTable, text, integer } = require('drizzle-orm/sqlite-core');

// Define documents table directly
const documents = sqliteTable('documents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  fileName: text('file_name').notNull(),
  filePath: text('file_path').notNull(),
  fileSize: integer('file_size'),
  mimeType: text('mime_type'),
  category: text('category').notNull(),
  isPublic: integer('is_public', { mode: 'boolean' }).default(true),
  uploadedBy: integer('uploaded_by'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ids } = req.query;

  if (!ids) {
    return res.status(400).json({
      success: false,
      error: 'Document IDs are required'
    });
  }

  try {
    // Parse IDs (can be comma-separated string or array)
    const documentIds = Array.isArray(ids) 
      ? ids.map(id => parseInt(id)) 
      : ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));

    if (documentIds.length === 0) {
      return res.status(200).json({
        success: true,
        documents: []
      });
    }

    const db = await getDb();
    const result = await db.select()
      .from(documents)
      .where(inArray(documents.id, documentIds));

    return res.status(200).json({
      success: true,
      documents: result
    });

  } catch (error) {
    console.error('Error fetching documents:', error);
    return res.status(500).json({
      success: false,
      error: 'Error fetching documents: ' + error.message
    });
  }
}