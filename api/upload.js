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
    const formData = new FormData();
    const chunks = [];
    
    // Parse multipart form data
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      try {
        const buffer = Buffer.concat(chunks);
        const boundary = req.headers['content-type'].split('boundary=')[1];
        
        if (!boundary) {
          return res.status(400).json({
            success: false,
            error: 'Invalid multipart form data'
          });
        }

        // Parse the multipart data manually (simplified version)
        const parts = buffer.toString().split(`--${boundary}`);
        let file = null;
        let title = '';
        let category = 'other';

        for (const part of parts) {
          if (part.includes('Content-Disposition: form-data; name="file"')) {
            // Extract file data
            const headerEnd = part.indexOf('\r\n\r\n');
            if (headerEnd !== -1) {
              const fileData = part.slice(headerEnd + 4);
              const filename = part.match(/filename="([^"]+)"/)?.[1] || 'document.pdf';
              file = {
                name: filename,
                data: Buffer.from(fileData, 'binary')
              };
            }
          } else if (part.includes('name="title"')) {
            const valueMatch = part.match(/\r\n\r\n([^\r\n]+)/);
            if (valueMatch) title = valueMatch[1];
          } else if (part.includes('name="category"')) {
            const valueMatch = part.match(/\r\n\r\n([^\r\n]+)/);
            if (valueMatch) category = valueMatch[1];
          }
        }

        if (!file) {
          return res.status(400).json({
            success: false,
            error: 'No file provided'
          });
        }

        // Upload to Vercel Blob
        const { url } = await put(file.name, file.data, {
          access: 'public',
          contentType: file.type || 'application/pdf'
        });

        // Save to database
        const db = await getDb();
        const result = await db.insert(documents).values({
          title: title || file.name,
          fileName: file.name,
          filePath: url,
          fileSize: file.data.length,
          mimeType: file.type || 'application/pdf',
          category: category,
          isPublic: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }).returning();

        return res.status(201).json({
          success: true,
          document: result[0]
        });

      } catch (parseError) {
        console.error('Error parsing form data:', parseError);
        return res.status(400).json({
          success: false,
          error: 'Error parsing upload data'
        });
      }
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
            error: 'Invalid multipart form data'
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