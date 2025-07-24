const { getDb } = require('./lib/turso');
const { sqliteTable, text, integer } = require('drizzle-orm/sqlite-core');

// Define publications table directly
const publications = sqliteTable('publications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  tags: text('tags', { mode: 'json' }),
  pubdate: integer('pubdate', { mode: 'timestamp' }).notNull(),
  subscribersonly: integer('subscribersonly', { mode: 'boolean' }).notNull(),
  homepage: integer('homepage', { mode: 'boolean' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Existing content from content.ts
const existingNews = [
  {
    id: "1",
    title: "Arrêté du 8 juillet 2025 portant diverses dispositions relatives à l'organisation et à l'indemnisation de la permanence des soins",
    excerpt: "Nouvelles dispositions relatives à l'organisation et à l'indemnisation de la permanence des soins dans les établissements publics de santé.",
    content: "Arrêté du 8 juillet 2025 portant diverses dispositions relatives à l'organisation et à l'indemnisation de la permanence des soins dans les établissements publics de santé.",
    publishedAt: "2025-07-08",
    slug: "arrete-juillet-2025-permanence-soins",
    image: "news-article-1.jpg",
    pdf: "1.pdf",
    category: "Communiqué",
  },
  {
    id: "2", 
    title: "LFSS 2025 : pas d'économies sur la qualité !",
    excerpt: "Nos réflexions et propositions pour des mesures rapides et concrètes dans le cadre de la loi de financement de la sécurité sociale.",
    content: "LFSS 2025 : pas d'économies sur la qualité ! Nos réflexions et propositions pour des mesures rapides et concrètes.",
    publishedAt: "2024-11-28",
    slug: "lfss-2025-economies-qualite",
    image: "news-article-2.jpg",
    pdf: "2.pdf",
    category: "Publication",
  },
  {
    id: "3",
    title: "Appel à une grève illimitée de la permanence des soins",
    excerpt: "Grèves de mai. Appel à une grève illimitée de la permanence des soins des praticiens des hôpitaux, dès le 1er Mai 2025.",
    content: "Grèves de mai. Appel à une grève illimitée de la permanence des soins des praticiens des hôpitaux, dès le 1er Mai 2025.",
    publishedAt: "2025-04-15",
    slug: "greve-permanence-soins-mai-2025",
    image: "news-article-3.jpg",
    pdf: "3.pdf",
    category: "Communiqué",
  },
  {
    id: "4",
    title: "Des économies OK mais pas de bouts de chandelles !",
    excerpt: "L'adoption définitive du PLFSS 2025 impose la recherche de 300 Millions d'économies pour l'imagerie médicale.",
    content: "Communiqué. Des économies OK mais pas de bouts de chandelles ! L'adoption définitive du PLFSS 2025 impose la recherche de 300 Millions d'économies pour l'imagerie.",
    publishedAt: "2025-01-03",
    slug: "economies-plfss-2025-imagerie",
    image: "news-article-4.jpg",
    pdf: "4.pdf",
    category: "Communiqué",
  },
  {
    id: "5",
    title: "Newsletter Flash janvier 2025",
    excerpt: "Une très bonne année et surtout.. la santé ! Par le nouveau bureau du SRH.",
    content: "NewsLetter Flash janvier 2025. Une très bonne année et surtout.. la santé ! Par le nouveau bureau du SRH.",
    publishedAt: "2025-01-01",
    slug: "newsletter-flash-janvier-2025",
    image: "news-article-5.jpg",
    pdf: "5.pdf",
    category: "Newsletter",
  },
  {
    id: "6",
    title: "Permanence des Soins : Merci l'hôpital !",
    excerpt: "Le SRH a examiné avec attention le rapport de la DGOS sur la permanence des soins hospitaliers.",
    content: "Communiqué. Permanence des Soins : Merci l'hôpital ! Le SRH a examiné avec attention le rapport de la DGOS sur la permanence des soins.",
    publishedAt: "2025-01-28",
    slug: "permanence-soins-rapport-dgos",
    image: "news-article-6.jpg",
    pdf: "6.pdf",
    category: "Communiqué",
  }
];

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

  const { isAdmin } = req.body;

  // Check if user is admin
  if (!isAdmin) {
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied. Admin privileges required.' 
    });
  }

  try {
    const db = await getDb();
    let migratedCount = 0;
    const errors = [];

    for (const newsItem of existingNews) {
      try {
        // Convert category to tags array
        const tags = [newsItem.category];
        
        // Determine if it should be on homepage (all existing content should be)
        const homepage = true;
        
        // Default to not subscribers only
        const subscribersonly = false;

        const result = await db.insert(publications).values({
          title: newsItem.title,
          content: newsItem.content, // Use content as HTML for now
          tags: tags,
          pubdate: new Date(newsItem.publishedAt),
          subscribersonly: subscribersonly,
          homepage: homepage,
          createdAt: new Date(),
          updatedAt: new Date(),
        }).returning();

        migratedCount++;
        console.log(`Migrated: ${newsItem.title}`);
      } catch (error) {
        console.error(`Error migrating item ${newsItem.id}:`, error);
        errors.push(`Failed to migrate "${newsItem.title}": ${error.message}`);
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: `Successfully migrated ${migratedCount} publications`,
      migratedCount,
      errors: errors.length > 0 ? errors : undefined 
    });
  } catch (error) {
    console.error('Migration error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error during migration: ' + error.message 
    });
  }
}