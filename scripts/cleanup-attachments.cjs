const { getDb } = require('../api/lib/turso');
const { eq, or, isNull } = require('drizzle-orm');
const { sqliteTable, text, integer } = require('drizzle-orm/sqlite-core');

// Define tables
const publications = sqliteTable('publications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  tags: text('tags', { mode: 'json' }),
  pubdate: integer('pubdate', { mode: 'timestamp' }).notNull(),
  subscribersonly: integer('subscribers_only', { mode: 'boolean' }).default(false),
  homepage: integer('homepage', { mode: 'boolean' }).default(true),
  picture: text('picture'),
  attachmentIds: text('attachment_ids', { mode: 'json' }),
  type: text('type').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

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

// Function to normalize text for comparison
function normalizeText(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' '); // Normalize whitespace
}

// Function to calculate string similarity (simple approach)
function calculateSimilarity(str1, str2) {
  const norm1 = normalizeText(str1);
  const norm2 = normalizeText(str2);
  
  // Exact match
  if (norm1 === norm2) return 1.0;
  
  // Check if one contains the other
  if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.8;
  
  // Simple word overlap scoring
  const words1 = norm1.split(' ').filter(w => w.length > 2);
  const words2 = norm2.split(' ').filter(w => w.length > 2);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const commonWords = words1.filter(w => words2.includes(w));
  return (commonWords.length * 2) / (words1.length + words2.length);
}

async function cleanupAttachments() {
  console.log('🧹 Starting attachment cleanup...');
  
  try {
    const db = await getDb();
    
    // Step 1: Find publications with empty attachment_ids arrays
    console.log('📋 Finding publications with empty attachment_ids arrays...');
    
    const allPublications = await db.select().from(publications);
    
    // Filter publications with empty arrays
    const publicationsWithoutAttachments = allPublications.filter(pub => {
      if (!pub.attachmentIds) return true;
      
      try {
        const parsed = Array.isArray(pub.attachmentIds) ? pub.attachmentIds : JSON.parse(pub.attachmentIds);
        return !Array.isArray(parsed) || parsed.length === 0;
      } catch (error) {
        return true; // Include invalid JSON as needing cleanup
      }
    });
    
    console.log(`Found ${publicationsWithoutAttachments.length} publications without attachments`);
    
    if (publicationsWithoutAttachments.length === 0) {
      console.log('✅ No publications need cleanup!');
      return;
    }
    
    // Step 2: Get all documents
    console.log('📄 Loading all documents...');
    const allDocuments = await db.select().from(documents);
    console.log(`Found ${allDocuments.length} documents in database`);
    
    // Step 3: Match publications with documents
    console.log('🔍 Matching publications with documents...');
    const matches = [];
    let updateCount = 0;
    
    for (const publication of publicationsWithoutAttachments) {
      const bestMatches = [];
      
      // Find potential matches
      for (const document of allDocuments) {
        const similarity = calculateSimilarity(publication.title, document.title);
        
        if (similarity >= 0.7) { // Minimum similarity threshold
          bestMatches.push({
            document,
            similarity,
            publicationTitle: publication.title,
            documentTitle: document.title
          });
        }
      }
      
      // Sort by similarity (best matches first)
      bestMatches.sort((a, b) => b.similarity - a.similarity);
      
      if (bestMatches.length > 0) {
        const bestMatch = bestMatches[0];
        
        console.log(`\n🎯 Match found:`);
        console.log(`  Publication: "${publication.title}"`);
        console.log(`  Document: "${bestMatch.document.title}"`);
        console.log(`  Similarity: ${(bestMatch.similarity * 100).toFixed(1)}%`);
        
        if (bestMatches.length > 1) {
          console.log(`  📝 Other candidates:`);
          bestMatches.slice(1, 3).forEach((match, index) => {
            console.log(`    ${index + 2}. "${match.document.title}" (${(match.similarity * 100).toFixed(1)}%)`);
          });
        }
        
        // Update the publication with the document ID
        try {
          const result = await db.update(publications)
            .set({
              attachmentIds: [bestMatch.document.id],
              updatedAt: new Date()
            })
            .where(eq(publications.id, publication.id));
          
          console.log(`✅ Updated publication ID ${publication.id}`);
          updateCount++;
          
          matches.push({
            publicationId: publication.id,
            publicationTitle: publication.title,
            documentId: bestMatch.document.id,
            documentTitle: bestMatch.document.title,
            similarity: bestMatch.similarity
          });
          
        } catch (updateError) {
          console.error(`❌ Failed to update publication ID ${publication.id}:`, updateError.message);
        }
      } else {
        console.log(`\n⚠️  No match found for: "${publication.title}"`);
      }
    }
    
    // Step 4: Summary
    console.log('\n📊 Cleanup Summary:');
    console.log(`  Publications processed: ${publicationsWithoutAttachments.length}`);
    console.log(`  Successfully updated: ${updateCount}`);
    console.log(`  No matches found: ${publicationsWithoutAttachments.length - updateCount}`);
    
    if (matches.length > 0) {
      console.log('\n🎯 Updated Publications:');
      matches.forEach((match, index) => {
        console.log(`  ${index + 1}. "${match.publicationTitle}" → "${match.documentTitle}"`);
      });
    }
    
    console.log('\n✅ Cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup if this script is executed directly
if (require.main === module) {
  cleanupAttachments()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { cleanupAttachments };