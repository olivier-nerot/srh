const { testConnection: tursoTestConnection } = require('./lib/turso');

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Extract utility type from URL path
  const { utilType } = req.query;
  
  if (!utilType) {
    return res.status(400).json({ error: 'Utility type is required (test-connection)' });
  }

  try {
    switch (utilType) {
      case 'test-connection':
        return await testConnection(req, res);
      default:
        return res.status(400).json({ error: 'Invalid utility type' });
    }
  } catch (error) {
    console.error(`Utils API Error (${utilType}):`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function testConnection(req, res) {
  try {
    // Use the existing turso test connection function
    const result = await tursoTestConnection();
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Database connection successful',
        result: result.data,
        timestamp: new Date().toISOString()
      });
    } else {
      throw result.error;
    }
  } catch (error) {
    console.error('Database connection test failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Database connection failed: ' + error.message
    });
  }
}

