const { handleUpload } = require('@vercel/blob/client');
const { getDb } = require('./lib/turso');
const { sqliteTable, text, integer } = require('drizzle-orm/sqlite-core');

// Define documents table directly (same as in files.js)
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
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    switch (action) {
      case 'upload':
        return await handleClientUpload(req, res);
      case 'save-document':
        return await saveDocumentRecord(req, res);
      default:
        return res.status(400).json({ error: 'Invalid action. Use upload or save-document' });
    }
  } catch (error) {
    console.error('Blob upload API error:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
};

// Handle the client upload token generation and completion callback
async function handleClientUpload(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;

    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Parse client payload for validation
        let payload = {};
        try {
          payload = clientPayload ? JSON.parse(clientPayload) : {};
        } catch (e) {
          // Ignore parse errors
        }

        // Validate admin access
        if (!payload.isAdmin) {
          throw new Error('Admin access required for uploads');
        }

        // Define allowed content types based on upload type
        const documentTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain'
        ];

        const imageTypes = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif'
        ];

        const allowedContentTypes = payload.uploadType === 'image'
          ? imageTypes
          : documentTypes;

        return {
          allowedContentTypes,
          addRandomSuffix: true,
          maximumSizeInBytes: 50 * 1024 * 1024, // 50MB max
          tokenPayload: JSON.stringify({
            title: payload.title || '',
            description: payload.description || '',
            category: payload.category || 'other',
            uploadType: payload.uploadType || 'document',
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // This callback is called by Vercel after upload completes
        // Note: This won't work on localhost - we handle DB save separately
        console.log('Blob upload completed:', blob.pathname);

        // We don't save to DB here because onUploadCompleted doesn't work on localhost
        // Instead, the client will call save-document action after upload
      },
    });

    return res.status(200).json(jsonResponse);
  } catch (error) {
    console.error('Error handling client upload:', error);
    return res.status(400).json({
      error: error.message || 'Error processing upload'
    });
  }
}

// Save document record to database after successful blob upload
async function saveDocumentRecord(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      url,
      fileName,
      fileSize,
      mimeType,
      title,
      description,
      category,
      isAdmin
    } = req.body;

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin privileges required.'
      });
    }

    if (!url || !fileName) {
      return res.status(400).json({
        success: false,
        error: 'URL and fileName are required'
      });
    }

    const db = await getDb();
    const result = await db.insert(documents).values({
      title: title || fileName.replace(/\.[^/.]+$/, ''),
      description: description || '',
      fileName: fileName,
      filePath: url,
      fileSize: fileSize || 0,
      mimeType: mimeType || 'application/octet-stream',
      category: category || 'other',
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return res.status(201).json({
      success: true,
      document: result[0]
    });

  } catch (error) {
    console.error('Error saving document record:', error);
    return res.status(500).json({
      success: false,
      error: 'Error saving document: ' + error.message
    });
  }
}
