const { getDb } = require('./_lib/turso');
const { eq, ne, gte, desc, and } = require('drizzle-orm');
const { Resend } = require('resend');
const { setCorsHeaders } = require('./_lib/cors');
const { users, publications, newsletterQueue, newsletterRecipients } = require('./_lib/schema');

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
        if (typeof op.insert === 'object' && op.insert.image) {
          const src = op.insert.image;
          return `<img src="${src}" alt="" style="max-width: 100%; height: auto; margin: 10px 0; border-radius: 4px;" />`;
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

// Admin email template (duplicated for serverless isolation)
function generatePaymentEmailTemplate(subject, body, recipientEmail, recipientName) {
  const baseUrl = process.env.PRODUCTION_URL || 'https://srh-info.org';
  const profileUrl = `${baseUrl}/login`;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); border-radius: 8px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Syndicat des Radiologues Hospitaliers</h1>
  </div>
  <p style="font-size: 16px; margin-bottom: 20px;">
    ${recipientName ? `Cher(e) ${recipientName},` : 'Cher(e) membre,'}
  </p>
  <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #1e40af;">
    ${body.split('\n').map(line => `<p style="margin: 0 0 10px 0;">${line}</p>`).join('')}
  </div>
  <div style="text-align: center; margin: 30px 0;">
    <a href="${profileUrl}" style="display: inline-block; background: #1e40af; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
      Accéder à mon espace membre
    </a>
  </div>
  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
    <p style="margin: 0 0 10px 0;">Cordialement,<br><strong>L'équipe SRH</strong></p>
    <p style="margin: 20px 0 0 0; font-size: 12px; color: #9ca3af;">
      Syndicat des Radiologues Hospitaliers<br>
      <a href="${baseUrl}" style="color: #1e40af;">srh-info.org</a>
    </p>
  </div>
</body>
</html>
`;
}

function generateEmailTemplate(title, content, selectedPublications, userEmail, req) {
  // IMPORTANT: Always use production domain for emails, never preview/branch URLs
  // Emails are permanent records and should only link to production
  const baseUrl = process.env.PRODUCTION_URL || 'https://srh-info.org';

  const publicationsHtml = selectedPublications.map(pub => {
    const publicationUrl = `${baseUrl}/item?id=${pub.id}&type=${pub.type || 'publication'}`;
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
            <img src="${baseUrl}/icon.png" alt="SRH Logo" style="height: 60px; width: auto;">
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
  setCorsHeaders(req, res);

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
        } else if (action === 'save-draft') {
          return await saveDraft(req, res);
        } else if (action === 'send-draft') {
          return await sendDraft(req, res);
        }
        return res.status(400).json({ success: false, error: 'Invalid action' });
      case 'DELETE':
        return await deleteNewsletter(req, res);
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

    // Get draft newsletters (ordered by most recent)
    const drafts = await db
      .select()
      .from(newsletterQueue)
      .where(eq(newsletterQueue.status, 'draft'))
      .orderBy(desc(newsletterQueue.updatedAt))
      .limit(20);

    // Get newsletter history (completed/failed/pending/sending newsletters, ordered by most recent)
    const newsletterHistory = await db
      .select()
      .from(newsletterQueue)
      .where(ne(newsletterQueue.status, 'draft'))
      .orderBy(desc(newsletterQueue.createdAt))
      .limit(50);

    return res.status(200).json({
      success: true,
      publications: recentPublications,
      queueStatus: activeQueue[0] || null,
      drafts: drafts,
      history: newsletterHistory,
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

    // For newsletters: get selected publications
    // For admin-emails: get user names for personalization
    let selectedPublications = [];
    const userMap = {};

    if (newsletter.type === 'admin-email') {
      const allUsers = await db.select().from(users);
      for (const u of allUsers) {
        userMap[u.id] = u.firstname ? `${u.firstname} ${u.lastname || ''}`.trim() : null;
      }
    } else {
      if (newsletter.selectedPublicationIds && newsletter.selectedPublicationIds.length > 0) {
        const allPubs = await db.select().from(publications);
        selectedPublications = allPubs.filter(pub =>
          newsletter.selectedPublicationIds.includes(pub.id)
        );
      }
    }

    let sent = 0;
    let failed = 0;

    // Send emails with rate limiting
    for (const recipient of pendingRecipients) {
      try {
        // In debug mode, override recipient email with debug email
        const targetEmail = DEBUG_MODE ? DEBUG_EMAIL : recipient.email;

        let emailHtml;
        if (newsletter.type === 'admin-email') {
          const recipientName = userMap[recipient.userId] || null;
          emailHtml = generatePaymentEmailTemplate(
            newsletter.title,
            newsletter.content,
            recipient.email,
            recipientName
          );
        } else {
          emailHtml = generateEmailTemplate(
            newsletter.title,
            newsletter.content,
            selectedPublications,
            recipient.email,
            null
          );
        }

        if (DEBUG_MODE) {
          console.log(`DEBUG: Would send to ${recipient.email}, redirecting to ${DEBUG_EMAIL}`);
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

// Delete newsletter
async function deleteNewsletter(req, res) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ success: false, error: 'Newsletter ID is required' });
    }

    const db = await getDb();
    const newsletterId = parseInt(id);

    // Check if newsletter exists
    const newsletter = await db
      .select()
      .from(newsletterQueue)
      .where(eq(newsletterQueue.id, newsletterId))
      .limit(1);

    if (newsletter.length === 0) {
      return res.status(404).json({ success: false, error: 'Newsletter not found' });
    }

    // Don't allow deletion of newsletters that are currently sending
    if (newsletter[0].status === 'sending') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete a newsletter that is currently being sent'
      });
    }

    // Delete related newsletter recipients first (foreign key constraint)
    await db
      .delete(newsletterRecipients)
      .where(eq(newsletterRecipients.newsletterId, newsletterId));

    // Delete the newsletter
    await db
      .delete(newsletterQueue)
      .where(eq(newsletterQueue.id, newsletterId));

    return res.status(200).json({
      success: true,
      message: 'Newsletter deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting newsletter:', error);
    return res.status(500).json({
      success: false,
      error: 'Error deleting newsletter: ' + error.message
    });
  }
}

// Save newsletter as draft
async function saveDraft(req, res) {
  try {
    const { title, content, selectedPublicationIds, draftId } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Title and content are required'
      });
    }

    const db = await getDb();
    const now = new Date();

    // If draftId is provided, update existing draft
    if (draftId) {
      const existingDraft = await db
        .select()
        .from(newsletterQueue)
        .where(eq(newsletterQueue.id, draftId))
        .limit(1);

      if (existingDraft.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Draft not found'
        });
      }

      if (existingDraft[0].status !== 'draft') {
        return res.status(400).json({
          success: false,
          error: 'Cannot update a newsletter that is not a draft'
        });
      }

      await db
        .update(newsletterQueue)
        .set({
          title,
          content,
          selectedPublicationIds: selectedPublicationIds || null,
          updatedAt: now
        })
        .where(eq(newsletterQueue.id, draftId));

      return res.status(200).json({
        success: true,
        message: 'Draft updated successfully',
        draftId: draftId
      });
    }

    // Create new draft
    const result = await db
      .insert(newsletterQueue)
      .values({
        title,
        content,
        selectedPublicationIds: selectedPublicationIds || null,
        status: 'draft',
        totalRecipients: 0,
        sentCount: 0,
        failedCount: 0,
        createdAt: now,
        updatedAt: now
      })
      .returning();

    return res.status(200).json({
      success: true,
      message: 'Draft saved successfully',
      draftId: result[0].id
    });

  } catch (error) {
    console.error('Error saving draft:', error);
    return res.status(500).json({
      success: false,
      error: 'Error saving draft: ' + error.message
    });
  }
}

// Send a draft newsletter
async function sendDraft(req, res) {
  try {
    const { draftId } = req.body;

    if (!draftId) {
      return res.status(400).json({
        success: false,
        error: 'Draft ID is required'
      });
    }

    const db = await getDb();

    // Get the draft
    const draft = await db
      .select()
      .from(newsletterQueue)
      .where(eq(newsletterQueue.id, draftId))
      .limit(1);

    if (draft.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Draft not found'
      });
    }

    if (draft[0].status !== 'draft') {
      return res.status(400).json({
        success: false,
        error: 'Newsletter is not a draft'
      });
    }

    // Get newsletter subscribers
    const subscribers = await db
      .select()
      .from(users)
      .where(eq(users.newsletter, true));

    if (subscribers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No subscribers found'
      });
    }

    // Update draft to pending status and set recipient count
    await db
      .update(newsletterQueue)
      .set({
        status: 'pending',
        totalRecipients: subscribers.length,
        updatedAt: new Date()
      })
      .where(eq(newsletterQueue.id, draftId));

    // Create recipient records
    const recipientRecords = subscribers.map(subscriber => ({
      newsletterId: draftId,
      userId: subscriber.id,
      email: subscriber.email,
      status: 'pending',
      createdAt: new Date()
    }));

    await db.insert(newsletterRecipients).values(recipientRecords);

    return res.status(200).json({
      success: true,
      message: `Newsletter queued successfully. ${subscribers.length} recipients will receive it.`,
      newsletterId: draftId
    });

  } catch (error) {
    console.error('Error sending draft:', error);
    return res.status(500).json({
      success: false,
      error: 'Error sending draft: ' + error.message
    });
  }
}

// Export for use in cron job
module.exports.sendNewsletterBatch = sendNewsletterBatch;
