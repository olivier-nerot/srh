const { put } = require('@vercel/blob');
const { getDb } = require('./lib/turso');
const { eq, inArray } = require('drizzle-orm');
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
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Extract action and type from URL path or query
  const { action, type } = req.query;
  
  if (!action) {
    return res.status(400).json({ 
      error: 'Action is required (upload, download, list, delete)' 
    });
  }

  try {
    switch (action) {
      case 'upload':
        return await handleUpload(req, res, type);
      case 'download':
        return await handleDownload(req, res);
      case 'list':
        return await handleListDocuments(req, res);
      case 'delete':
        return await handleDeleteDocument(req, res);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error(`Files API Error (${action}):`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Upload functionality (from upload.js)
async function handleUpload(req, res, type) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!type || !['document', 'image'].includes(type)) {
    return res.status(400).json({ error: 'Upload type is required (document or image)' });
  }

  if (type === 'document') {
    return await handleDocumentUpload(req, res);
  } else {
    return await handleImageUpload(req, res);
  }
}

async function handleDocumentUpload(req, res) {
  try {
    // Ensure we're parsing JSON properly
    let body = req.body;
    
    // If body is not parsed, try to parse it manually
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);  
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid JSON in request body'
        });
      }
    }
    
    // Parse JSON body (the DocumentUpload component sends JSON, not multipart)
    const {
      file,
      fileName,
      mimeType,
      title,
      description,
      category,
      isAdmin
    } = body;

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin privileges required.'
      });
    }

    if (!file || !fileName) {
      return res.status(400).json({
        success: false,
        error: 'File data and filename are required'
      });
    }

    // Convert array back to buffer
    const fileBuffer = Buffer.from(file);

    // Upload to Vercel Blob
    const { url } = await put(fileName, fileBuffer, {
      access: 'public',
      contentType: mimeType || 'application/pdf'
    });

    // Save to database
    const db = await getDb();
    const result = await db.insert(documents).values({
      title: title || fileName,
      fileName: fileName,
      filePath: url,
      fileSize: fileBuffer.length,
      mimeType: mimeType || 'application/pdf',
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
    console.error('Error uploading document:', error);
    return res.status(500).json({
      success: false,
      error: 'Error uploading document: ' + error.message
    });
  }
}

async function handleImageUpload(req, res) {
  try {
    // Check if this is multipart form data or JSON
    const contentType = req.headers['content-type'] || '';
    
    if (contentType.includes('application/json')) {
      // Handle JSON format (similar to document upload)
      let body = req.body;
      
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);  
        } catch (parseError) {
          return res.status(400).json({
            success: false,
            error: 'Invalid JSON in request body'
          });
        }
      }
      
      // For JSON image uploads, implement similar logic as document upload
      return res.status(400).json({
        success: false,
        error: 'JSON image upload not implemented yet'
      });
    }
    
    // Original multipart handling
    const chunks = [];
    
    // Parse image upload data
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      try {
        const buffer = Buffer.concat(chunks);
        const boundary = req.headers['content-type'].split('boundary=')[1];
        
        if (!boundary) {
          return res.status(400).json({
            success: false,
            error: 'Invalid multipart data'
          });
        }

        // Parse the multipart data manually (simplified version)
        const parts = buffer.toString('binary').split(`--${boundary}`);
        let file = null;

        for (const part of parts) {
          if (part.includes('Content-Disposition: form-data; name="image"')) {
            // Extract file data
            const headerEnd = part.indexOf('\r\n\r\n');
            if (headerEnd !== -1) {
              const fileData = part.slice(headerEnd + 4, -2); // Remove trailing --
              const filename = part.match(/filename="([^"]+)"/)?.[1] || 'image.jpg';
              const contentType = part.match(/Content-Type: ([^\r\n]+)/)?.[1] || 'image/jpeg';
              
              file = {
                name: filename,
                type: contentType,
                data: Buffer.from(fileData, 'binary')
              };
            }
          }
        }

        if (!file) {
          return res.status(400).json({
            success: false,
            error: 'No image file provided'
          });
        }

        // Upload to Vercel Blob
        const { url } = await put(file.name, file.data, {
          access: 'public',
          contentType: file.type
        });

        return res.status(201).json({
          success: true,
          imageUrl: url
        });

      } catch (parseError) {
        console.error('Error parsing image data:', parseError);
        return res.status(400).json({
          success: false,
          error: 'Error parsing image data'
        });
      }
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    return res.status(500).json({
      success: false,
      error: 'Error uploading image: ' + error.message
    });
  }
}

// Download functionality (from download.js)
async function handleDownload(req, res) {
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
    const result = await db.select().from(documents).where(eq(documents.id, documentId)).limit(1);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    const document = result[0];

    // If the document is stored on Vercel Blob (URL starts with https://), redirect to it
    if (document.filePath.startsWith('https://')) {
      return res.redirect(302, document.filePath);
    }

    // Legacy handling for local files (if any exist)
    const filePath = path.resolve(document.filePath);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found on server'
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${document.fileName}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error downloading document:', error);
    return res.status(500).json({
      success: false,
      error: 'Error downloading document: ' + error.message
    });
  }
}

// List documents functionality (from documents.js)
async function handleListDocuments(req, res) {
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
      return res.status(400).json({
        success: false,
        error: 'No valid document IDs provided'
      });
    }

    const db = await getDb();
    const result = await db.select().from(documents).where(inArray(documents.id, documentIds));

    // Convert timestamps and format response
    const formattedDocuments = result.map(doc => ({
      id: doc.id,
      title: doc.title,
      description: doc.description,
      fileName: doc.fileName,
      filePath: doc.filePath,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      category: doc.category,
      isPublic: doc.isPublic,
      uploadedBy: doc.uploadedBy,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      documents: formattedDocuments
    });

  } catch (error) {
    console.error('Error fetching documents:', error);
    return res.status(500).json({
      success: false,
      error: 'Error fetching documents: ' + error.message
    });
  }
}

// Delete document functionality
async function handleDeleteDocument(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id, isAdmin } = req.query;

  if (!isAdmin || isAdmin !== 'true') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Admin privileges required.'
    });
  }

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
    
    // Check if document exists
    const existingDoc = await db.select().from(documents).where(eq(documents.id, documentId)).limit(1);
    
    if (existingDoc.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Delete from database
    await db.delete(documents).where(eq(documents.id, documentId));

    return res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting document:', error);
    return res.status(500).json({
      success: false,
      error: 'Error deleting document: ' + error.message
    });
  }
}