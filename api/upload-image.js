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

  const { isAdmin, file, fileName, mimeType } = req.body;

  // Check if user is admin
  if (!isAdmin) {
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied. Admin privileges required.' 
    });
  }

  if (!file || !fileName) {
    return res.status(400).json({
      success: false,
      error: 'File and fileName are required'
    });
  }

  try {
    // Validate image type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp'
    ];
    
    if (!allowedTypes.includes(mimeType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid image type. Only JPEG, PNG, and WebP are allowed.'
      });
    }

    // Convert file buffer to base64 if not already
    let base64Data;
    if (typeof file === 'string' && file.startsWith('data:')) {
      // Already a data URL
      base64Data = file;
    } else if (Buffer.isBuffer(file)) {
      // Convert buffer to base64 data URL
      base64Data = `data:${mimeType};base64,${file.toString('base64')}`;
    } else if (typeof file === 'string') {
      // Assume it's base64 string, add data URL prefix
      base64Data = `data:${mimeType};base64,${file}`;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid file format'
      });
    }

    // Validate base64 size (max 500KB for thumbnails)
    const sizeInBytes = (base64Data.length * 3) / 4;
    if (sizeInBytes > 500 * 1024) {
      return res.status(400).json({
        success: false,
        error: 'Image size too large. Maximum size is 500KB for thumbnails.'
      });
    }

    // Return the processed base64 data
    return res.status(200).json({
      success: true,
      base64: base64Data,
      size: sizeInBytes,
      message: 'Image processed successfully'
    });

  } catch (error) {
    console.error('Error processing image:', error);
    return res.status(500).json({
      success: false,
      error: 'Error processing image: ' + error.message
    });
  }
}