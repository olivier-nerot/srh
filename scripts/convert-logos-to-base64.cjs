// Load environment variables
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { getDb } = require('../api/lib/turso');
const { eq } = require('drizzle-orm');
const { sqliteTable, text, integer } = require('drizzle-orm/sqlite-core');

// Define the liens table schema
const liens = sqliteTable('liens', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  icon: text('icon').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  url: text('url').notNull(),
  logo: text('logo'),
  picture: text('picture'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Function to convert file to base64
function fileToBase64(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    let mimeType = 'image/png';
    
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        mimeType = 'image/jpeg';
        break;
      case '.png':
        mimeType = 'image/png';
        break;
      case '.webp':
        mimeType = 'image/webp';
        break;
    }
    
    return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
  } catch (error) {
    console.error(`Error converting ${filePath}:`, error.message);
    return null;
  }
}

// Function to extract filename from path
function extractFilename(logoPath) {
  if (!logoPath || !logoPath.includes('/')) return null;
  return path.basename(logoPath);
}

// Main function to update logos
async function updateLogosToBase64() {
  try {
    console.log('Starting logo conversion process...');
    
    const db = await getDb();
    
    // Get all liens from database
    const allLiens = await db.select().from(liens);
    console.log(`Found ${allLiens.length} liens in database`);
    
    const assetsDir = path.join(__dirname, '../src/assets/images/partner-logos');
    
    if (!fs.existsSync(assetsDir)) {
      console.error('Partner logos directory not found:', assetsDir);
      return;
    }
    
    let updated = 0;
    let skipped = 0;
    
    for (const lien of allLiens) {
      console.log(`\nProcessing: ${lien.title}`);
      
      // Check if logo is already base64
      if (lien.picture && lien.picture.startsWith('data:')) {
        console.log('  - Already has base64 picture, skipping');
        skipped++;
        continue;
      }
      
      if (lien.logo && lien.logo.startsWith('data:')) {
        console.log('  - Already has base64 logo, skipping');
        skipped++;
        continue;
      }
      
      // Extract filename from logo path
      let filename = null;
      if (lien.logo && lien.logo.includes('/')) {
        filename = extractFilename(lien.logo);
      }
      
      if (!filename) {
        console.log('  - No valid logo path found, skipping');
        skipped++;
        continue;
      }
      
      const logoPath = path.join(assetsDir, filename);
      
      if (!fs.existsSync(logoPath)) {
        console.log(`  - Logo file not found: ${logoPath}, skipping`);
        skipped++;
        continue;
      }
      
      console.log(`  - Converting: ${filename}`);
      const base64Data = fileToBase64(logoPath);
      
      if (!base64Data) {
        console.log('  - Failed to convert to base64, skipping');
        skipped++;
        continue;
      }
      
      // Update the database
      try {
        await db.update(liens)
          .set({
            picture: base64Data, // Store as picture (base64)
            logo: null, // Clear the old path
            updatedAt: new Date(),
          })
          .where(eq(liens.id, lien.id));
        
        console.log('  ✓ Updated successfully');
        updated++;
      } catch (error) {
        console.error('  ✗ Failed to update database:', error.message);
        skipped++;
      }
    }
    
    console.log(`\n=== Conversion Summary ===`);
    console.log(`Updated: ${updated}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Total: ${allLiens.length}`);
    
  } catch (error) {
    console.error('Error in updateLogosToBase64:', error);
  }
}

// Run the script
if (require.main === module) {
  updateLogosToBase64()
    .then(() => {
      console.log('\nConversion process completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { updateLogosToBase64 };