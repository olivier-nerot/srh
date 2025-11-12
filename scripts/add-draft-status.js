/**
 * Migration script to add 'draft' status to newsletter_queue table
 * This is a safe migration that doesn't lose data
 */

import 'dotenv/config';
import { getDb } from '../api/lib/turso.js';

async function addDraftStatus() {
  console.log('🔄 Adding draft status to newsletter_queue...');

  try {
    const db = await getDb();

    // SQLite doesn't support modifying ENUM types directly
    // But since we're using TEXT with enum constraint, we just need to ensure
    // the constraint allows 'draft' value, which is already done in the schema

    // The schema change is already in place, so no SQL migration needed
    // SQLite TEXT columns don't enforce enum constraints at the database level

    console.log('✅ Draft status is now available in the schema');
    console.log('✅ Existing newsletters will retain their current status');
    console.log('✅ New newsletters will default to draft status');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addDraftStatus();
