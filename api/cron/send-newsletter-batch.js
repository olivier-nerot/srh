/**
 * Vercel Cron Job: Send Newsletter Batch
 *
 * This cron job runs daily to send the next batch of queued newsletter emails.
 * Respects Resend free tier limit of 100 emails per day.
 *
 * Schedule: Daily at 9:00 AM UTC (10:00 AM CET / 11:00 AM CEST)
 */

const { getDb } = require('../lib/turso');
const { eq, and } = require('drizzle-orm');
const { sqliteTable, text, integer } = require('drizzle-orm/sqlite-core');
const { Resend } = require('resend');

// Define tables
const newsletterQueue = sqliteTable('newsletter_queue', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  selectedPublicationIds: text('selected_publication_ids', { mode: 'json' }).$type(),
  status: text('status').notNull().default('pending'),
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
  status: text('status').notNull().default('pending'),
  sentAt: integer('sent_at', { mode: 'timestamp_ms' }),
  errorMessage: text('error_message'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
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
  type: text('type').notNull().default('publication'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

const DAILY_EMAIL_LIMIT = 100;
const RATE_LIMIT_MS = 500;

const resend = new Resend(process.env.RESEND_API_KEY);

// Import helper functions (duplicated for serverless function isolation)
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
            if (attrs.link) text = `<a href="${attrs.link}" target="_blank" style="color: #1e40af;">${text}</a>`;
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

function generateEmailTemplate(title, content, selectedPublications, userEmail) {
  const baseUrl = process.env.VERCEL_URL || 'https://srh-info.org';
  const fullBaseUrl = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;

  const publicationsHtml = selectedPublications.map(pub => {
    const publicationUrl = `${fullBaseUrl}/publications/${pub.id}`;
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
      <a href="${publicationUrl}" style="display: inline-block; color: #1e40af; text-decoration: none; font-weight: 500;">
        Lire la suite →
      </a>
    </div>
  `;
  }).join('');

  const unsubscribeUrl = `${fullBaseUrl}/unsubscribe?email=${encodeURIComponent(userEmail)}`;

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
          <a href="${fullBaseUrl}"><img src="${fullBaseUrl}/logo.svg" alt="SRH Logo" style="height: 60px;"></a>
          <h1 style="color: white; margin: 10px 0 0 0; font-size: 24px;">Syndicat des Radiologues Hospitaliers</h1>
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #1e40af; margin: 0 0 20px 0;">${title}</h2>
          <div style="color: #374151; line-height: 1.6; margin-bottom: 30px;">${deltaToHtml(content)}</div>
          ${publicationsHtml ? `
            <div style="margin: 30px 0;">
              <h3 style="color: #1e40af; margin: 0 0 20px 0; border-bottom: 2px solid #1e40af; padding-bottom: 8px;">
                Publications récentes
              </h3>
              ${publicationsHtml}
              <div style="text-align: center; margin-top: 20px;">
                <a href="${fullBaseUrl}/publications" style="display: inline-block; background: #1e40af; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px;">
                  Voir toutes nos publications →
                </a>
              </div>
            </div>
          ` : ''}
        </div>
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px;">
            <strong>Syndicat des Radiologues Hospitaliers</strong><br>
            Email envoyé depuis <a href="${fullBaseUrl}" style="color: #1e40af;">srh-info.org</a>
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
  // Security: Verify this is a cron request from Vercel
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  console.log('[CRON] Starting newsletter batch send job...');

  try {
    const db = await getDb();

    // Find the oldest active newsletter that still has pending recipients
    const activeNewsletters = await db
      .select()
      .from(newsletterQueue)
      .where(eq(newsletterQueue.status, 'sending'))
      .orderBy(newsletterQueue.createdAt)
      .limit(1);

    // If no active newsletters, check for pending ones
    if (activeNewsletters.length === 0) {
      const pendingNewsletters = await db
        .select()
        .from(newsletterQueue)
        .where(eq(newsletterQueue.status, 'pending'))
        .orderBy(newsletterQueue.createdAt)
        .limit(1);

      if (pendingNewsletters.length === 0) {
        console.log('[CRON] No newsletters to send');
        return res.status(200).json({
          success: true,
          message: 'No newsletters in queue',
          sent: 0
        });
      }

      // Start sending this newsletter
      const newsletter = pendingNewsletters[0];
      await db
        .update(newsletterQueue)
        .set({ status: 'sending', updatedAt: Date.now() })
        .where(eq(newsletterQueue.id, newsletter.id));

      activeNewsletters.push(newsletter);
    }

    const newsletter = activeNewsletters[0];
    console.log(`[CRON] Processing newsletter ID ${newsletter.id}: "${newsletter.title}"`);

    // Get pending recipients (batch of 100)
    const pendingRecipients = await db
      .select()
      .from(newsletterRecipients)
      .where(
        and(
          eq(newsletterRecipients.newsletterId, newsletter.id),
          eq(newsletterRecipients.status, 'pending')
        )
      )
      .limit(DAILY_EMAIL_LIMIT);

    console.log(`[CRON] Found ${pendingRecipients.length} pending recipients`);

    if (pendingRecipients.length === 0) {
      // Mark newsletter as completed
      await db
        .update(newsletterQueue)
        .set({
          status: 'completed',
          completedAt: Date.now(),
          updatedAt: Date.now()
        })
        .where(eq(newsletterQueue.id, newsletter.id));

      console.log(`[CRON] Newsletter ${newsletter.id} completed`);
      return res.status(200).json({
        success: true,
        message: 'Newsletter completed',
        newsletterId: newsletter.id
      });
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
        const emailHtml = generateEmailTemplate(
          newsletter.title,
          newsletter.content,
          selectedPublications,
          recipient.email
        );

        await resend.emails.send({
          from: process.env.RESEND_EMAIL,
          to: recipient.email,
          subject: newsletter.title,
          html: emailHtml,
        });

        // Mark as sent
        await db
          .update(newsletterRecipients)
          .set({
            status: 'sent',
            sentAt: Date.now()
          })
          .where(eq(newsletterRecipients.id, recipient.id));

        sent++;
        console.log(`[CRON] Sent to ${recipient.email} (${sent}/${pendingRecipients.length})`);

        // Rate limiting
        if (sent < pendingRecipients.length) {
          await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS));
        }
      } catch (error) {
        console.error(`[CRON] Failed to send to ${recipient.email}:`, error);

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

    // Update newsletter counts
    await db
      .update(newsletterQueue)
      .set({
        sentCount: newsletter.sentCount + sent,
        failedCount: newsletter.failedCount + failed,
        updatedAt: Date.now()
      })
      .where(eq(newsletterQueue.id, newsletter.id));

    // Check if all sent
    const remainingRecipients = await db
      .select()
      .from(newsletterRecipients)
      .where(
        and(
          eq(newsletterRecipients.newsletterId, newsletter.id),
          eq(newsletterRecipients.status, 'pending')
        )
      );

    if (remainingRecipients.length === 0) {
      await db
        .update(newsletterQueue)
        .set({
          status: 'completed',
          completedAt: Date.now(),
          updatedAt: Date.now()
        })
        .where(eq(newsletterQueue.id, newsletter.id));

      console.log(`[CRON] Newsletter ${newsletter.id} completed`);
    } else {
      console.log(`[CRON] ${remainingRecipients.length} recipients remaining for next batch`);
    }

    return res.status(200).json({
      success: true,
      newsletterId: newsletter.id,
      sent,
      failed,
      remaining: remainingRecipients.length,
      completed: remainingRecipients.length === 0
    });

  } catch (error) {
    console.error('[CRON] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
