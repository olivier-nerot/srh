const { put } = require('@vercel/blob');
const { getDb } = require('./lib/turso');
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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { isAdmin } = req.body;

  // Check if user is admin
  if (!isAdmin) {
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied. Admin privileges required.' 
    });
  }

  try {
    // Handle JSON request with binary data
    const { file, fileName, mimeType, title, description, uploadedBy } = req.body;
    
    if (!file || !fileName) {
      return res.status(400).json({
        success: false,
        error: 'File and fileName are required'
      });
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (!allowedTypes.includes(mimeType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'
      });
    }

    // Convert array back to Uint8Array
    const fileBuffer = new Uint8Array(file);
    
    // Validate file size (max 10MB)
    if (fileBuffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: 'File size too large. Maximum size is 10MB.'
      });
    }

    // Generate unique filename to avoid conflicts
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}-${fileName}`;

    // Upload to Vercel Blob
    const blob = await put(uniqueFileName, fileBuffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    // Save document metadata to database
    const db = await getDb();
    const result = await db.insert(documents).values({
      title: title || fileName.replace(/\.[^/.]+$/, ''),
      description: description || '',
      fileName: fileName,
      filePath: blob.url,
      fileSize: fileBuffer.length,
      mimeType: mimeType,
      category: 'publication-attachment',
      isPublic: true,
      uploadedBy: uploadedBy || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return res.status(201).json({
      success: true,
      document: result[0],
      message: 'Document uploaded successfully'
    });

  } catch (error) {
    console.error('Error uploading document:', error);
    return res.status(500).json({
      success: false,
      error: 'Error uploading document: ' + error.message
    });
  }
}