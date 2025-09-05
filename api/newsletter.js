const { getDb } = require('./lib/turso');
const { eq, gte, desc } = require('drizzle-orm');
const { sqliteTable, text, integer } = require('drizzle-orm/sqlite-core');
const { Resend } = require('resend');

// Define tables directly
const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  firstname: text('firstname'),
  lastname: text('lastname'),
  infopro: text('infopro'),
  isadmin: integer('isadmin', { mode: 'boolean' }).default(false),
  newsletter: integer('newsletter', { mode: 'boolean' }).default(false),
  hospital: text('hospital'),
  address: text('address'),
  subscription: text('subscription'),
  subscribedUntil: integer('subscribed_until', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

const publications = sqliteTable('publications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content'),
  tags: text('tags', { mode: 'json' }).$type(),
  pubdate: integer('pubdate', { mode: 'timestamp' }).notNull(),
  subscribersonly: integer('subscribersonly', { mode: 'boolean' }).notNull().default(false),
  homepage: integer('homepage', { mode: 'boolean' }).notNull().default(true),
  picture: text('picture'),
  attachmentIds: text('attachment_ids', { mode: 'json' }).$type(),
  type: text('type', { enum: ['publication', 'communique', 'jo', 'rapport'] }).notNull().default('publication'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

const resend = new Resend(process.env.RESEND_API_KEY);

// Helper function to convert Delta JSON to HTML
function deltaToHtml(content) {
  try {
    const delta = JSON.parse(content);
    if (delta.ops && Array.isArray(delta.ops)) {
      return delta.ops.map((op) => {
        if (typeof op.insert === 'string') {
          let text = op.insert;
          
          if (op.attributes) {
            const attrs = op.attributes;
            if (attrs.bold) text = `<strong>${text}</strong>`;
            if (attrs.italic) text = `<em>${text}</em>`;
            if (attrs.underline) text = `<u>${text}</u>`;
            if (attrs.link) text = `<a href="${attrs.link}" target="_blank" rel="noopener noreferrer" style="color: #1e40af;">${text}</a>`;
            if (attrs.header) text = `<h${attrs.header} style="color: #1e40af; margin: 16px 0 8px 0;">${text}</h${attrs.header}>`;
          }
          
          return text.replace(/\n/g, '<br>');
        }
        return '';
      }).join('');
    }
  } catch (error) {
    // If not Delta JSON, return as-is with line breaks
    return content ? content.replace(/\n/g, '<br>') : '';
  }
  return content || '';
}

// Generate HTML email template
function generateEmailTemplate(title, content, selectedPublications, userEmail) {
  let baseUrl = process.env.VERCEL_URL || 'https://srh-info.org';
  
  // Ensure the URL has a protocol
  if (baseUrl && !baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `https://${baseUrl}`;
  }
  
  const publicationsHtml = selectedPublications.map(pub => {
    const publicationUrl = `${baseUrl}/publications/${pub.id}`;
    return `
    <div style="margin: 20px 0; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f9fafb; transition: background-color 0.2s;">
      <h3 style="color: #1e40af; margin: 0 0 8px 0; font-size: 18px;">
        <a href="${publicationUrl}" style="color: #1e40af; text-decoration: none; border-bottom: 1px solid transparent; transition: border-bottom 0.2s;"
           onmouseover="this.style.borderBottom='1px solid #1e40af'" 
           onmouseout="this.style.borderBottom='1px solid transparent'">${pub.title}</a>
      </h3>
      <p style="color: #6b7280; margin: 0 0 8px 0; font-size: 14px;">
        Publié le ${new Date(pub.pubdate).toLocaleDateString('fr-FR')} 
        ${pub.type ? `• ${getTypeLabel(pub.type)}` : ''}
      </p>
      <div style="color: #374151; line-height: 1.6; margin-bottom: 12px;">
        ${deltaToHtml(pub.content).substring(0, 300)}${deltaToHtml(pub.content).length > 300 ? '...' : ''}
      </div>
      <a href="${publicationUrl}" 
         style="display: inline-block; color: #1e40af; text-decoration: none; font-weight: 500; border-bottom: 1px solid #1e40af; padding-bottom: 2px;">
        Lire la suite →
      </a>
    </div>
  `;
  }).join('');

  const unsubscribeUrl = `${baseUrl}/unsubscribe?email=${encodeURIComponent(userEmail)}`;

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); padding: 20px; text-align: center;">
          <a href="${baseUrl}" style="text-decoration: none;">
            <img src="${baseUrl}/logo.svg" alt="SRH Logo" style="height: 60px; width: auto; display: block; margin: 0 auto;">
          </a>
          <h1 style="color: white; margin: 10px 0 0 0; font-size: 24px; font-weight: bold;">
            <a href="${baseUrl}" style="color: white; text-decoration: none;">
              Syndicat des Radiologues Hospitalo-universitaires
            </a>
          </h1>
        </div>

        <!-- Main Content -->
        <div style="padding: 30px;">
          <h2 style="color: #1e40af; margin: 0 0 20px 0; font-size: 22px;">${title}</h2>
          
          <!-- Newsletter Content -->
          <div style="color: #374151; line-height: 1.6; margin-bottom: 30px;">
            ${deltaToHtml(content)}
          </div>

          <!-- Publications -->
          ${publicationsHtml ? `
            <div style="margin: 30px 0;">
              <h3 style="color: #1e40af; margin: 0 0 20px 0; font-size: 20px; border-bottom: 2px solid #1e40af; padding-bottom: 8px;">
                Publications récentes
              </h3>
              ${publicationsHtml}
              <div style="text-align: center; margin-top: 20px;">
                <a href="${baseUrl}/publications" 
                   style="display: inline-block; background: #1e40af; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500;">
                  Voir toutes nos publications →
                </a>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px;">
            <strong>Syndicat des Radiologues Hospitalo-universitaires</strong><br>
            Email envoyé depuis <a href="${baseUrl}" style="color: #1e40af;">srh-info.org</a>
          </p>
          <p style="color: #9ca3af; margin: 0; font-size: 12px;">
            Vous recevez cet email car vous êtes abonné à la newsletter SRH.<br>
            <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">
              Se désabonner de la newsletter
            </a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Helper function for type labels
function getTypeLabel(type) {
  const types = {
    publication: 'Publication',
    communique: 'Communiqué',
    jo: 'Journal Officiel',
    rapport: 'Rapport'
  };
  return types[type] || type;
}

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getRecentPublications(req, res);
      case 'POST':
        const { action } = req.body;
        if (action === 'preview') {
          return await previewNewsletter(req, res);
        } else if (action === 'send') {
          return await sendNewsletter(req, res);
        }
        return res.status(400).json({ success: false, error: 'Invalid action' });
      default:
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Newsletter API Error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Get publications from last 3 months
async function getRecentPublications(req, res) {
  try {
    const db = await getDb();
    
    // Calculate date 3 months ago
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const recentPublications = await db
      .select()
      .from(publications)
      .where(gte(publications.pubdate, threeMonthsAgo))
      .orderBy(desc(publications.pubdate));

    return res.status(200).json({
      success: true,
      publications: recentPublications
    });
  } catch (error) {
    console.error('Error fetching recent publications:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des publications'
    });
  }
}

// Preview newsletter
async function previewNewsletter(req, res) {
  try {
    const { title, content, selectedPublicationIds } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Titre et contenu requis'
      });
    }

    const db = await getDb();
    
    // Get selected publications
    let selectedPublications = [];
    if (selectedPublicationIds && selectedPublicationIds.length > 0) {
      selectedPublications = await db
        .select()
        .from(publications)
        .where(
          selectedPublicationIds.length === 1 
            ? eq(publications.id, selectedPublicationIds[0])
            : undefined // We'll handle multiple IDs differently if needed
        );
      
      // For multiple IDs, we need a different approach
      if (selectedPublicationIds.length > 1) {
        const allPubs = await db.select().from(publications);
        selectedPublications = allPubs.filter(pub => 
          selectedPublicationIds.includes(pub.id)
        );
      }
    }

    // Generate preview HTML
    const previewHtml = generateEmailTemplate(
      title,
      content,
      selectedPublications,
      'preview@example.com' // Placeholder email for preview
    );

    return res.status(200).json({
      success: true,
      previewHtml
    });
  } catch (error) {
    console.error('Error generating preview:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération de l\'aperçu'
    });
  }
}

// Send newsletter
async function sendNewsletter(req, res) {
  try {
    const { title, content, selectedPublicationIds } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Titre et contenu requis'
      });
    }

    const db = await getDb();
    
    // Get newsletter subscribers
    const subscribers = await db
      .select()
      .from(users)
      .where(eq(users.newsletter, true));

    if (subscribers.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Aucun abonné à la newsletter',
        sent: 0,
        failed: 0
      });
    }

    // Get selected publications
    let selectedPublications = [];
    if (selectedPublicationIds && selectedPublicationIds.length > 0) {
      const allPubs = await db.select().from(publications);
      selectedPublications = allPubs.filter(pub => 
        selectedPublicationIds.includes(pub.id)
      );
    }

    // Send emails with rate limiting
    let sent = 0;
    let failed = 0;
    const errors = [];

    for (const subscriber of subscribers) {
      try {
        const emailHtml = generateEmailTemplate(
          title,
          content,
          selectedPublications,
          subscriber.email
        );

        await resend.emails.send({
          from: process.env.RESEND_EMAIL,
          to: subscriber.email,
          subject: title,
          html: emailHtml,
        });

        sent++;
        
        // Rate limiting: wait 500ms between emails (2 emails per second)
        if (sent < subscribers.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`Failed to send to ${subscriber.email}:`, error);
        failed++;
        errors.push({
          email: subscriber.email,
          error: error.message
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Newsletter envoyée à ${sent} abonnés`,
      sent,
      failed,
      total: subscribers.length,
      errors: failed > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error sending newsletter:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'envoi de la newsletter'
    });
  }
}