const { getDb } = require('../api/lib/turso');
const { sqliteTable, text, integer } = require('drizzle-orm/sqlite-core');
const { eq } = require('drizzle-orm');

// Define liens table schema
const liens = sqliteTable('liens', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  icon: text('icon').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  url: text('url').notNull(),
  logo: text('logo'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

// Logo path mappings - convert from relative paths to Vite asset paths
const logoMappings = {
  '../assets/images/partner-logos/afib.png': '/src/assets/images/partner-logos/afib.png',
  '../assets/images/partner-logos/afppe.png': '/src/assets/images/partner-logos/afppe.png',
  '../assets/images/partner-logos/apir.png': '/src/assets/images/partner-logos/apir.png',
  '../assets/images/partner-logos/appa.jpg': '/src/assets/images/partner-logos/appa.jpg',
  '../assets/images/partner-logos/cng.png': '/src/assets/images/partner-logos/cng.png',
  '../assets/images/partner-logos/cneh.png': '/src/assets/images/partner-logos/cneh.png',
  '../assets/images/partner-logos/cerf.png': '/src/assets/images/partner-logos/cerf.png',
  '../assets/images/partner-logos/aphp.png': '/src/assets/images/partner-logos/aphp.png',
  '../assets/images/partner-logos/cnpmem.png': '/src/assets/images/partner-logos/cnpmem.png',
  '../assets/images/partner-logos/cnom.png': '/src/assets/images/partner-logos/cnom.png',
  '../assets/images/partner-logos/cnpg4.png': '/src/assets/images/partner-logos/cnpg4.png',
  '../assets/images/partner-logos/fmcrim.png': '/src/assets/images/partner-logos/fmcrim.png',
  '../assets/images/partner-logos/fhf.png': '/src/assets/images/partner-logos/fhf.png',
  '../assets/images/partner-logos/fnmr.png': '/src/assets/images/partner-logos/fnmr.png',
  '../assets/images/partner-logos/specialites-medicales.png': '/src/assets/images/partner-logos/specialites-medicales.png',
  '../assets/images/partner-logos/leh.png': '/src/assets/images/partner-logos/leh.png',
  '../assets/images/partner-logos/sfr.jpeg': '/src/assets/images/partner-logos/sfr.jpeg',
  '../assets/images/partner-logos/snamhp.png': '/src/assets/images/partner-logos/snamhp.png',
  '../assets/images/partner-logos/unir.png': '/src/assets/images/partner-logos/unir.png',
  '../assets/images/partner-logos/bracco.png': '/src/assets/images/partner-logos/bracco.png',
  '../assets/images/partner-logos/fujifilm.png': '/src/assets/images/partner-logos/fujifilm.png',
  '../assets/images/partner-logos/ge-healthcare.png': '/src/assets/images/partner-logos/ge-healthcare.png',
  '../assets/images/partner-logos/guerbet.png': '/src/assets/images/partner-logos/guerbet.png',
  '../assets/images/partner-logos/siemens.png': '/src/assets/images/partner-logos/siemens.png',
  '../assets/images/partner-logos/terumo.png': '/src/assets/images/partner-logos/terumo.png',
  '../assets/images/partner-logos/toshiba.png': '/src/assets/images/partner-logos/toshiba.png',
};

async function fixLogoPaths() {
  try {
    const db = await getDb();
    
    console.log('Fetching all liens...');
    const allLiens = await db.select().from(liens);
    
    console.log(`Found ${allLiens.length} liens to update`);
    
    for (const lien of allLiens) {
      if (lien.logo && logoMappings[lien.logo]) {
        const newLogoPath = logoMappings[lien.logo];
        
        await db.update(liens)
          .set({ 
            logo: newLogoPath,
            updatedAt: new Date()
          })
          .where(eq(liens.id, lien.id));
        
        console.log(`Updated ${lien.title}: ${lien.logo} → ${newLogoPath}`);
      } else if (lien.logo) {
        console.log(`No mapping found for ${lien.title}: ${lien.logo}`);
      }
    }
    
    console.log('Logo paths update completed!');
    
  } catch (error) {
    console.error('Error fixing logo paths:', error);
  }
}

// Run the fix
fixLogoPaths();