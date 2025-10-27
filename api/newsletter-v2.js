const { getDb } = require('./lib/turso');
const { eq, gte, desc, and } = require('drizzle-orm');
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
  subscribedUntil: integer('subscribed_until', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

const publications = sqliteTable('publications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content'),
  tags: text('tags', { mode: 'json' }).$type(),
  pubdate: integer('pubdate', { mode: 'timestamp_ms' }).notNull(),
  subscribersonly: integer('subscribersonly', { mode: 'boolean' }).notNull().default(false),
  homepage: integer('homepage', { mode: 'boolean' }).notNull().default(true),
  picture: text('picture'),
  attachmentIds: text('attachment_ids', { mode: 'json' }).$type(),
  type: text('type', { enum: ['publication', 'communique', 'jo', 'rapport'] }).notNull().default('publication'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

const newsletterQueue = sqliteTable('newsletter_queue', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  selectedPublicationIds: text('selected_publication_ids', { mode: 'json' }).$type(),
  status: text('status', { enum: ['pending', 'sending', 'completed', 'failed'] }).notNull().default('pending'),
  totalRecipients: integer('total_recipients').notNull(),
  sentCount: integer('sent_count').notNull().default(0),
  failedCount: integer('failed_count').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
});

const newsletterRecipients = sqliteTable('newsletter_recipients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  newsletterId: integer('newsletter_id').notNull(),
  userId: integer('user_id').notNull(),
  email: text('email').notNull(),
  status: text('status', { enum: ['pending', 'sent', 'failed'] }).notNull().default('pending'),
  sentAt: integer('sent_at', { mode: 'timestamp_ms' }),
  errorMessage: text('error_message'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

const resend = new Resend(process.env.RESEND_API_KEY);

// Constants
const DAILY_EMAIL_LIMIT = 100; // Resend free tier limit
const RATE_LIMIT_MS = 500; // 500ms between emails (2 emails/second)

// Debug mode configuration
const DEBUG_MODE = process.env.NEWSLETTER_DEBUG_MODE === 'true';
const DEBUG_EMAIL = process.env.NEWSLETTER_DEBUG_EMAIL || 'test@example.com';
const DEBUG_LIMIT = parseInt(process.env.NEWSLETTER_DEBUG_LIMIT || '3', 10);

// Helper functions from original file
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
    return content ? content.replace(/\n/g, '<br>') : '';
  }
  return content || '';
}

function getTypeLabel(type) {
  const types = {
    publication: 'Publication',
    communique: 'Communiqué',
    jo: 'Journal Officiel',
    rapport: 'Rapport'
  };
  return types[type] || type;
}

function generateEmailTemplate(title, content, selectedPublications, userEmail, req) {
  let baseUrl;

  if (req && req.headers && req.headers.host) {
    const protocol = req.headers['x-forwarded-proto'] ||
                    (req.connection && req.connection.encrypted ? 'https' : 'http') ||
                    'https';
    baseUrl = `${protocol}://${req.headers.host}`;
  } else {
    baseUrl = process.env.VERCEL_URL || 'https://srh-info.org';
    if (baseUrl && !baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`;
    }
  }

  const publicationsHtml = selectedPublications.map(pub => {
    const publicationUrl = `${baseUrl}/publications/${pub.id}`;
    return `
    <div style="margin: 20px 0; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f9fafb;">
      <h3 style="color: #1e40af; margin: 0 0 8px 0; font-size: 18px;">
        <a href="${publicationUrl}" style="color: #1e40af; text-decoration: none;">${pub.title}</a>
      </h3>
      <p style="color: #6b7280; margin: 0 0 8px 0; font-size: 14px;">
        Publié le ${new Date(pub.pubdate).toLocaleDateString('fr-FR')}
        ${pub.type ? `• ${getTypeLabel(pub.type)}` : ''}
      </p>
      <div style="color: #374151; line-height: 1.6; margin-bottom: 12px;">
        ${deltaToHtml(pub.content).substring(0, 300)}${deltaToHtml(pub.content).length > 300 ? '...' : ''}
      </div>
      <a href="${publicationUrl}"
         style="display: inline-block; color: #1e40af; text-decoration: none; font-weight: 500;">
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
        <div style="background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); padding: 20px; text-align: center;">
          <a href="${baseUrl}" style="text-decoration: none;">
            <img src="${baseUrl}/logo.svg" alt="SRH Logo" style="height: 60px; width: auto;">
          </a>
          <h1 style="color: white; margin: 10px 0 0 0; font-size: 24px;">
            Syndicat des Radiologues Hospitaliers
          </h1>
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #1e40af; margin: 0 0 20px 0;">${title}</h2>
          <div style="color: #374151; line-height: 1.6; margin-bottom: 30px;">
            ${deltaToHtml(content)}
          </div>
          ${publicationsHtml ? `
            <div style="margin: 30px 0;">
              <h3 style="color: #1e40af; margin: 0 0 20px 0; border-bottom: 2px solid #1e40af; padding-bottom: 8px;">
                Publications récentes
              </h3>
              ${publicationsHtml}
              <div style="text-align: center; margin-top: 20px;">
                <a href="${baseUrl}/publications"
                   style="display: inline-block; background: #1e40af; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px;">
                  Voir toutes nos publications →
                </a>
              </div>
            </div>
          ` : ''}
        </div>
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px;">
            <strong>Syndicat des Radiologues Hospitaliers</strong><br>
            Email envoyé depuis <a href="${baseUrl}" style="color: #1e40af;">srh-info.org</a>
          </p>
          <p style="color: #9ca3af; margin: 0; font-size: 12px;">
            Vous recevez cet email car vous êtes abonné à la newsletter SRH.<br>
            <a href="${unsubscribeUrl}" style="color: #6b7280;">Se désabonner</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getNewsletterData(req, res);
      case 'POST':
        const { action } = req.body;
        if (action === 'preview') {
          return await previewNewsletter(req, res);
        } else if (action === 'queue') {
          return await queueNewsletter(req, res);
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

// Get recent publications AND queue status
async function getNewsletterData(req, res) {
  try {
    const db = await getDb();

    // Get recent publications (last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const recentPublications = await db
      .select()
      .from(publications)
      .where(gte(publications.pubdate, threeMonthsAgo))
      .orderBy(desc(publications.pubdate));

    // Get active newsletter queue status
    const activeQueue = await db
      .select()
      .from(newsletterQueue)
      .where(eq(newsletterQueue.status, 'sending'))
      .limit(1);

    return res.status(200).json({
      success: true,
      publications: recentPublications,
      queueStatus: activeQueue[0] || null,
      debugMode: {
        enabled: DEBUG_MODE,
        email: DEBUG_MODE ? DEBUG_EMAIL : null,
        limit: DEBUG_MODE ? DEBUG_LIMIT : null,
      }
    });
  } catch (error) {
    console.error('Error fetching newsletter data:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des données'
    });
  }
}

// Preview newsletter (unchanged)
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

    let selectedPublications = [];
    if (selectedPublicationIds && selectedPublicationIds.length > 0) {
      const allPubs = await db.select().from(publications);
      selectedPublications = allPubs.filter(pub =>
        selectedPublicationIds.includes(pub.id)
      );
    }

    const previewHtml = generateEmailTemplate(
      title,
      content,
      selectedPublications,
      'preview@example.com',
      req
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

// NEW: Queue newsletter for batch sending
async function queueNewsletter(req, res) {
  try {
    const { title, content, selectedPublicationIds } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Titre et contenu requis'
      });
    }

    const db = await getDb();

    // Get all newsletter subscribers ordered by subscription date (fairest approach)
    const subscribers = await db
      .select()
      .from(users)
      .where(eq(users.newsletter, true))
      .orderBy(users.createdAt); // First come, first served

    if (subscribers.length === 0) {
      return res.status(200).json({
        success: false,
        error: 'Aucun abonné à la newsletter'
      });
    }

    const now = new Date();

    // Create newsletter queue entry
    const [newsletter] = await db.insert(newsletterQueue).values({
      title,
      content,
      selectedPublicationIds: selectedPublicationIds || [],
      status: 'pending',
      totalRecipients: subscribers.length,
      sentCount: 0,
      failedCount: 0,
      createdAt: now,
      updatedAt: now,
    }).returning();

    // Create recipient entries for all subscribers
    const recipientValues = subscribers.map(sub => ({
      newsletterId: newsletter.id,
      userId: sub.id,
      email: sub.email,
      status: 'pending',
      createdAt: now,
    }));

    await db.insert(newsletterRecipients).values(recipientValues);

    // Send first batch immediately (up to DAILY_EMAIL_LIMIT)
    const firstBatchCount = Math.min(DAILY_EMAIL_LIMIT, subscribers.length);
    const sendResult = await sendNewsletterBatch(newsletter.id, firstBatchCount);

    return res.status(200).json({
      success: true,
      message: `Newsletter mise en file d'attente`,
      newsletterId: newsletter.id,
      totalRecipients: subscribers.length,
      sentImmediately: sendResult.sent,
      remainingToSend: subscribers.length - sendResult.sent,
      estimatedDays: Math.ceil((subscribers.length - sendResult.sent) / DAILY_EMAIL_LIMIT)
    });

  } catch (error) {
    console.error('Error queueing newsletter:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise en file d\'attente'
    });
  }
}

// Send a batch of newsletter emails
async function sendNewsletterBatch(newsletterId, limit = DAILY_EMAIL_LIMIT) {
  const db = await getDb();

  // Apply debug limit if in debug mode
  const effectiveLimit = DEBUG_MODE ? Math.min(limit, DEBUG_LIMIT) : limit;

  if (DEBUG_MODE) {
    console.log('⚠️  DEBUG MODE ENABLED ⚠️');
    console.log(`- All emails will be sent to: ${DEBUG_EMAIL}`);
    console.log(`- Batch limit: ${effectiveLimit} recipients`);
  }

  try {
    // Get newsletter details
    const [newsletter] = await db
      .select()
      .from(newsletterQueue)
      .where(eq(newsletterQueue.id, newsletterId));

    if (!newsletter) {
      throw new Error('Newsletter not found');
    }

    // Update status to sending
    await db
      .update(newsletterQueue)
      .set({
        status: 'sending',
        updatedAt: new Date()
      })
      .where(eq(newsletterQueue.id, newsletterId));

    // Get pending recipients (limit to batch size)
    const pendingRecipients = await db
      .select()
      .from(newsletterRecipients)
      .where(
        and(
          eq(newsletterRecipients.newsletterId, newsletterId),
          eq(newsletterRecipients.status, 'pending')
        )
      )
      .limit(effectiveLimit);

    if (pendingRecipients.length === 0) {
      // All sent, mark as completed
      await db
        .update(newsletterQueue)
        .set({
          status: 'completed',
          completedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(newsletterQueue.id, newsletterId));

      return { sent: 0, failed: 0 };
    }

    // Get selected publications
    let selectedPublications = [];
    if (newsletter.selectedPublicationIds && newsletter.selectedPublicationIds.length > 0) {
      const allPubs = await db.select().from(publications);
      selectedPublications = allPubs.filter(pub =>
        newsletter.selectedPublicationIds.includes(pub.id)
      );
    }

    let sent = 0;
    let failed = 0;

    // Send emails with rate limiting
    for (const recipient of pendingRecipients) {
      try {
        // In debug mode, override recipient email with debug email
        const targetEmail = DEBUG_MODE ? DEBUG_EMAIL : recipient.email;

        const emailHtml = generateEmailTemplate(
          newsletter.title,
          newsletter.content,
          selectedPublications,
          recipient.email, // Keep original email in template
          null // No req object in cron
        );

        if (DEBUG_MODE) {
          console.log(`🐛 DEBUG: Would send to ${recipient.email}, redirecting to ${DEBUG_EMAIL}`);
        }

        await resend.emails.send({
          from: process.env.RESEND_EMAIL,
          to: targetEmail,
          subject: DEBUG_MODE ? `[DEBUG] ${newsletter.title}` : newsletter.title,
          html: emailHtml,
        });

        // Mark as sent
        await db
          .update(newsletterRecipients)
          .set({
            status: 'sent',
            sentAt: new Date()
          })
          .where(eq(newsletterRecipients.id, recipient.id));

        sent++;

        // Rate limiting
        if (sent < pendingRecipients.length) {
          await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS));
        }
      } catch (error) {
        console.error(`Failed to send to ${recipient.email}:`, error);

        // Mark as failed
        await db
          .update(newsletterRecipients)
          .set({
            status: 'failed',
            errorMessage: error.message
          })
          .where(eq(newsletterRecipients.id, recipient.id));

        failed++;
      }
    }

    // Update newsletter queue counts
    await db
      .update(newsletterQueue)
      .set({
        sentCount: newsletter.sentCount + sent,
        failedCount: newsletter.failedCount + failed,
        updatedAt: new Date()
      })
      .where(eq(newsletterQueue.id, newsletterId));

    // Check if all sent
    const remainingCount = await db
      .select()
      .from(newsletterRecipients)
      .where(
        and(
          eq(newsletterRecipients.newsletterId, newsletterId),
          eq(newsletterRecipients.status, 'pending')
        )
      );

    if (remainingCount.length === 0) {
      await db
        .update(newsletterQueue)
        .set({
          status: 'completed',
          completedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(newsletterQueue.id, newsletterId));
    }

    return { sent, failed };

  } catch (error) {
    console.error('Error sending newsletter batch:', error);

    // Mark newsletter as failed
    await db
      .update(newsletterQueue)
      .set({
        status: 'failed',
        updatedAt: new Date()
      })
      .where(eq(newsletterQueue.id, newsletterId));

    throw error;
  }
}

// Export for use in cron job
module.exports.sendNewsletterBatch = sendNewsletterBatch;
