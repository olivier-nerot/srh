const { Resend } = require('resend');
const { setCorsHeaders } = require('./_lib/cors');
const { getDb } = require('./_lib/turso');
const { users, newsletterQueue, newsletterRecipients } = require('./_lib/schema');
const { eq, and } = require('drizzle-orm');

const resend = new Resend(process.env.RESEND_API_KEY);

const DAILY_EMAIL_LIMIT = 100;
const RATE_LIMIT_MS = 500;

// Generate HTML email template for admin emails (payment requests, etc.)
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

  <!-- Header -->
  <div style="text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); border-radius: 8px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Syndicat des Radiologues Hospitaliers</h1>
  </div>

  <!-- Greeting -->
  <p style="font-size: 16px; margin-bottom: 20px;">
    ${recipientName ? `Cher(e) ${recipientName},` : 'Cher(e) membre,'}
  </p>

  <!-- Body Content -->
  <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #1e40af;">
    ${body.split('\n').map(line => `<p style="margin: 0 0 10px 0;">${line}</p>`).join('')}
  </div>

  <!-- Call to Action Button -->
  <div style="text-align: center; margin: 30px 0;">
    <a href="${profileUrl}"
       style="display: inline-block; background: #1e40af; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
      Accéder à mon espace membre
    </a>
  </div>

  <!-- Footer -->
  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
    <p style="margin: 0 0 10px 0;">
      Cordialement,<br>
      <strong>L'équipe SRH</strong>
    </p>
    <p style="margin: 20px 0 0 0; font-size: 12px; color: #9ca3af;">
      Syndicat des Radiologues Hospitaliers<br>
      <a href="${baseUrl}" style="color: #1e40af;">srh-info.org</a>
    </p>
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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { recipients, subject, body, testMode } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'Recipients are required' });
    }

    if (!subject || !body) {
      return res.status(400).json({ error: 'Subject and body are required' });
    }

    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({ error: 'Email service not configured' });
    }

    // Test mode: send 1 email directly, no queue
    if (testMode) {
      const recipient = recipients[0];
      const htmlContent = generatePaymentEmailTemplate(
        subject,
        body,
        recipient.email,
        recipient.name
      );

      try {
        const { data, error } = await resend.emails.send({
          from: process.env.RESEND_EMAIL || 'SRH <no-reply@srh-info.org>',
          to: recipient.email,
          subject: subject,
          html: htmlContent,
        });

        if (error) {
          return res.status(200).json({
            success: false,
            testMode: true,
            error: error.message,
          });
        }

        return res.status(200).json({
          success: true,
          testMode: true,
          results: { sent: [{ email: recipient.email, id: data?.id }], failed: [] },
          summary: { total: 1, sent: 1, failed: 0 },
        });
      } catch (emailError) {
        return res.status(200).json({
          success: false,
          testMode: true,
          error: emailError.message,
        });
      }
    }

    // Normal mode: queue emails for batch sending
    const db = await getDb();
    const now = new Date();

    // Create queue entry
    const [queueEntry] = await db.insert(newsletterQueue).values({
      title: subject,
      content: body,
      selectedPublicationIds: null,
      type: 'admin-email',
      status: 'pending',
      totalRecipients: recipients.length,
      sentCount: 0,
      failedCount: 0,
      createdAt: now,
      updatedAt: now,
    }).returning();

    // Create recipient entries
    const recipientValues = recipients.map(r => ({
      newsletterId: queueEntry.id,
      userId: r.id || 0,
      email: r.email,
      status: 'pending',
      createdAt: now,
    }));

    await db.insert(newsletterRecipients).values(recipientValues);

    // Send first batch immediately
    const firstBatchLimit = Math.min(DAILY_EMAIL_LIMIT, recipients.length);
    const sendResult = await sendFirstBatch(db, queueEntry, firstBatchLimit);

    return res.status(200).json({
      success: true,
      testMode: false,
      queueId: queueEntry.id,
      totalRecipients: recipients.length,
      sentImmediately: sendResult.sent,
      remainingToSend: recipients.length - sendResult.sent,
    });

  } catch (error) {
    console.error('Error in send-payment-email:', error);
    return res.status(500).json({
      success: false,
      error: 'Error sending emails',
      details: error.message,
    });
  }
};

// Send first batch right after queuing
async function sendFirstBatch(db, queueEntry, limit) {
  // Update status to sending
  await db
    .update(newsletterQueue)
    .set({ status: 'sending', updatedAt: new Date() })
    .where(eq(newsletterQueue.id, queueEntry.id));

  // Get pending recipients
  const pendingRecipients = await db
    .select()
    .from(newsletterRecipients)
    .where(
      and(
        eq(newsletterRecipients.newsletterId, queueEntry.id),
        eq(newsletterRecipients.status, 'pending')
      )
    )
    .limit(limit);

  if (pendingRecipients.length === 0) {
    await db
      .update(newsletterQueue)
      .set({ status: 'completed', completedAt: new Date(), updatedAt: new Date() })
      .where(eq(newsletterQueue.id, queueEntry.id));
    return { sent: 0, failed: 0 };
  }

  // Batch-fetch user names for personalization
  const userIds = [...new Set(pendingRecipients.map(r => r.userId).filter(id => id > 0))];
  const userMap = {};
  if (userIds.length > 0) {
    const allUsers = await db.select().from(users);
    for (const u of allUsers) {
      userMap[u.id] = u.firstname ? `${u.firstname} ${u.lastname || ''}`.trim() : null;
    }
  }

  let sent = 0;
  let failed = 0;

  for (const recipient of pendingRecipients) {
    try {
      const recipientName = userMap[recipient.userId] || null;
      const emailHtml = generatePaymentEmailTemplate(
        queueEntry.title,
        queueEntry.content,
        recipient.email,
        recipientName
      );

      await resend.emails.send({
        from: process.env.RESEND_EMAIL || 'SRH <no-reply@srh-info.org>',
        to: recipient.email,
        subject: queueEntry.title,
        html: emailHtml,
      });

      await db
        .update(newsletterRecipients)
        .set({ status: 'sent', sentAt: new Date() })
        .where(eq(newsletterRecipients.id, recipient.id));

      sent++;

      if (sent < pendingRecipients.length) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS));
      }
    } catch (error) {
      console.error(`Failed to send admin email to ${recipient.email}:`, error);

      await db
        .update(newsletterRecipients)
        .set({ status: 'failed', errorMessage: error.message })
        .where(eq(newsletterRecipients.id, recipient.id));

      failed++;
    }
  }

  // Update queue counts
  await db
    .update(newsletterQueue)
    .set({
      sentCount: queueEntry.sentCount + sent,
      failedCount: queueEntry.failedCount + failed,
      updatedAt: new Date()
    })
    .where(eq(newsletterQueue.id, queueEntry.id));

  // Check if all done
  const remaining = await db
    .select()
    .from(newsletterRecipients)
    .where(
      and(
        eq(newsletterRecipients.newsletterId, queueEntry.id),
        eq(newsletterRecipients.status, 'pending')
      )
    );

  if (remaining.length === 0) {
    await db
      .update(newsletterQueue)
      .set({ status: 'completed', completedAt: new Date(), updatedAt: new Date() })
      .where(eq(newsletterQueue.id, queueEntry.id));
  }

  return { sent, failed };
}

// Export template function for reuse in cron and newsletter-v2
module.exports.generatePaymentEmailTemplate = generatePaymentEmailTemplate;
