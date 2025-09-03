const { getDb } = require('./lib/turso');
const { eq } = require('drizzle-orm');
const { sqliteTable, text, integer } = require('drizzle-orm/sqlite-core');
const fs = require('fs');
const path = require('path');

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

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Document ID is required'
    });
  }

  try {
    const documentId = parseInt(id);
    
    if (isNaN(documentId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid document ID'
      });
    }

    const db = await getDb();
    const result = await db.select()
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    const document = result[0];

    // Check if document is public (you might want to add authentication checks here)
    if (!document.isPublic) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Document is not public'
      });
    }

    // Handle different file path formats
    let filePath = document.filePath;
    
    // If it's a URL (blob storage), redirect to it
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return res.redirect(filePath);
    }

    // If it's a local file path, serve it directly
    if (!path.isAbsolute(filePath)) {
      // Make it relative to the project root
      filePath = path.join(process.cwd(), filePath);
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found on server'
      });
    }

    // Set appropriate headers for file display (not forced download)
    const fileName = document.fileName || path.basename(filePath);
    const mimeType = document.mimeType || 'application/octet-stream';

    res.setHeader('Content-Type', mimeType);
    // Use inline instead of attachment to display PDFs in browser
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Error serving file'
        });
      }
    });

  } catch (error) {
    console.error('Error in download handler:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error: ' + error.message
    });
  }
};