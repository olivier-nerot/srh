const { getDb } = require('../api/lib/turso');
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

async function inspectAttachments() {
  console.log('🔍 Inspecting current attachment state...');
  
  try {
    const db = await getDb();
    
    // Get all publications
    console.log('📋 Loading all publications...');
    const allPublications = await db.select().from(publications);
    console.log(`Found ${allPublications.length} publications total`);
    
    // Get all documents
    console.log('📄 Loading all documents...');
    const allDocuments = await db.select().from(documents);
    console.log(`Found ${allDocuments.length} documents total`);
    
    // Analyze attachment status
    console.log('\n📊 Attachment Analysis:');
    
    let withAttachments = 0;
    let emptyAttachments = 0;
    let nullAttachments = 0;
    let invalidAttachments = 0;
    
    console.log('\n📚 Publication Details:');
    allPublications.forEach((pub) => {
      let status = '';
      let attachmentCount = 0;
      
      if (pub.attachmentIds === null || pub.attachmentIds === undefined) {
        nullAttachments++;
        status = '❌ NULL';
      } else if (pub.attachmentIds === '' || pub.attachmentIds === '[]') {
        emptyAttachments++;
        status = '⚪ EMPTY';
      } else {
        try {
          const parsed = Array.isArray(pub.attachmentIds) ? pub.attachmentIds : JSON.parse(pub.attachmentIds);
          if (Array.isArray(parsed) && parsed.length > 0) {
            withAttachments++;
            attachmentCount = parsed.length;
            status = `✅ ${attachmentCount} attachment(s)`;
          } else {
            emptyAttachments++;
            status = '⚪ EMPTY ARRAY';
          }
        } catch (error) {
          invalidAttachments++;
          status = '❗ INVALID JSON';
        }
      }
      
      console.log(`  ${pub.id}. "${pub.title}" - ${status}`);
      if (attachmentCount > 0) {
        const attachmentIds = Array.isArray(pub.attachmentIds) ? pub.attachmentIds : JSON.parse(pub.attachmentIds);
        attachmentIds.forEach((docId) => {
          const doc = allDocuments.find(d => d.id === docId);
          if (doc) {
            console.log(`     → Document ID ${docId}: "${doc.title}"`);
          } else {
            console.log(`     → Document ID ${docId}: ❌ NOT FOUND`);
          }
        });
      }
    });
    
    console.log('\n📈 Summary:');
    console.log(`  Publications with attachments: ${withAttachments}`);
    console.log(`  Publications with empty attachments: ${emptyAttachments}`);
    console.log(`  Publications with NULL attachments: ${nullAttachments}`);
    console.log(`  Publications with invalid attachments: ${invalidAttachments}`);
    
    // Show documents without publications
    console.log('\n📄 Orphaned Documents (not linked to any publication):');
    const linkedDocIds = new Set();
    allPublications.forEach((pub) => {
      if (pub.attachmentIds && pub.attachmentIds !== '' && pub.attachmentIds !== '[]') {
        try {
          const parsed = Array.isArray(pub.attachmentIds) ? pub.attachmentIds : JSON.parse(pub.attachmentIds);
          if (Array.isArray(parsed)) {
            parsed.forEach(id => linkedDocIds.add(id));
          }
        } catch (error) {
          // Ignore invalid JSON
        }
      }
    });
    
    const orphanedDocs = allDocuments.filter(doc => !linkedDocIds.has(doc.id));
    if (orphanedDocs.length > 0) {
      orphanedDocs.forEach((doc) => {
        console.log(`  ${doc.id}. "${doc.title}" (${doc.fileName})`);
      });
    } else {
      console.log('  ✅ No orphaned documents found');
    }
    
  } catch (error) {
    console.error('❌ Error during inspection:', error);
    process.exit(1);
  }
}

// Run the inspection if this script is executed directly
if (require.main === module) {
  inspectAttachments()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { inspectAttachments };