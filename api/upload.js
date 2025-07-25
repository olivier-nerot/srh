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

  // Extract upload type from URL path
  const { uploadType } = req.query;
  
  if (!uploadType || !['document', 'image'].includes(uploadType)) {
    return res.status(400).json({ error: 'Upload type is required (document or image)' });
  }

  try {
    switch (uploadType) {
      case 'document':
        return await handleDocumentUpload(req, res);
      case 'image':
        return await handleImageUpload(req, res);
      default:
        return res.status(400).json({ error: 'Invalid upload type' });
    }
  } catch (error) {
    console.error(`Upload API Error (${uploadType}):`, error);
    return res.status(500).json({ error: 'Internal server error' });
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