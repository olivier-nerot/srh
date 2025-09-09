// Load environment variables
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { getDb } = require('../api/lib/turso');
const { eq } = require('drizzle-orm');
const { sqliteTable, text, integer } = require('drizzle-orm/sqlite-core');

// Define the publications table schema
const publications = sqliteTable('publications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content'),
  tags: text('tags', { mode: 'json' }).$type(),
  pubdate: integer('pubdate', { mode: 'timestamp_ms' }).notNull(),
  subscribersonly: integer('subscribersonly', { mode: 'boolean' }).notNull().default(false),
  homepage: integer('homepage', { mode: 'boolean' }).notNull().default(true),
  picture: text('picture'), // Base64 encoded image data
  attachmentIds: text('attachment_ids', { mode: 'json' }).$type(),
  type: text('type', { enum: ['publication', 'communique', 'jo', 'rapport'] }).notNull().default('publication'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
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
      case '.gif':
        mimeType = 'image/gif';
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

// Main function to update article images
async function updateArticleImages() {
  try {
    console.log('Starting article image update process...');
    
    const db = await getDb();
    
    const assetsDir = path.join(__dirname, '../src/assets/images');
    
    if (!fs.existsSync(assetsDir)) {
      console.error('Assets directory not found:', assetsDir);
      return;
    }
    
    // Define the image mappings
    const imageMap = {
      'jo': 'jo.gif',
      'rapport': 'rappport.gif'  // Note: double 'p' in filename
    };
    
    let totalUpdated = 0;
    let totalSkipped = 0;
    
    // Process each type
    for (const [type, filename] of Object.entries(imageMap)) {
      console.log(`\n=== Processing ${type.toUpperCase()} publications ===`);
      
      const imagePath = path.join(assetsDir, filename);
      
      if (!fs.existsSync(imagePath)) {
        console.log(`  ⚠️  Image file not found: ${imagePath}, skipping ${type} publications`);
        continue;
      }
      
      console.log(`  📄 Converting ${filename} to base64...`);
      const base64Data = fileToBase64(imagePath);
      
      if (!base64Data) {
        console.log(`  ❌ Failed to convert ${filename}, skipping ${type} publications`);
        continue;
      }
      
      // Get all publications of this type
      const publications_of_type = await db.select().from(publications).where(eq(publications.type, type));
      console.log(`  📊 Found ${publications_of_type.length} ${type} publications`);
      
      let typeUpdated = 0;
      let typeSkipped = 0;
      
      for (const publication of publications_of_type) {
        console.log(`    Processing: ${publication.title.substring(0, 50)}...`);
        
        // Force update all publications with the new base64 image
        try {
          await db.update(publications)
            .set({
              picture: base64Data,
              updatedAt: new Date(),
            })
            .where(eq(publications.id, publication.id));
          
          console.log(`      ✅ Updated successfully`);
          typeUpdated++;
        } catch (error) {
          console.error(`      ❌ Failed to update:`, error.message);
          typeSkipped++;
        }
      }
      
      console.log(`  📈 ${type.toUpperCase()} Summary: Updated ${typeUpdated}, Skipped ${typeSkipped}`);
      totalUpdated += typeUpdated;
      totalSkipped += typeSkipped;
    }
    
    console.log(`\n=== Final Summary ===`);
    console.log(`✅ Total Updated: ${totalUpdated}`);
    console.log(`⏭️  Total Skipped: ${totalSkipped}`);
    console.log(`📊 Total Processed: ${totalUpdated + totalSkipped}`);
    
  } catch (error) {
    console.error('Error in updateArticleImages:', error);
  }
}

// Run the script
if (require.main === module) {
  updateArticleImages()
    .then(() => {
      console.log('\n🎉 Article image update process completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { updateArticleImages };