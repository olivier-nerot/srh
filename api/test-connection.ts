import type { VercelRequest, VercelResponse } from '@vercel/node';
import { testConnection } from './lib/turso';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await testConnection();
    return res.status(200).json(result);
  } catch (error) {
    console.error('Connection test failed:', error);
    return res.status(500).json({ success: false, error: 'Connection test failed' });
  }
}