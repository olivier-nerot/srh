const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// Generate HTML email template for payment update request
function generatePaymentEmailTemplate(subject, body, recipientEmail, recipientName) {
  // Always use production domain for emails
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
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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

    // Validate Resend API key
    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({ error: 'Email service not configured' });
    }

    const results = {
      sent: [],
      failed: [],
    };

    // In test mode, only send to the first recipient
    const recipientsToSend = testMode ? [recipients[0]] : recipients;

    // Send emails one by one to personalize each one
    for (const recipient of recipientsToSend) {
      try {
        const htmlContent = generatePaymentEmailTemplate(
          subject,
          body,
          recipient.email,
          recipient.name
        );

        const { data, error } = await resend.emails.send({
          from: 'SRH <no-reply@srh-info.org>',
          to: recipient.email,
          subject: subject,
          html: htmlContent,
        });

        if (error) {
          console.error(`Failed to send email to ${recipient.email}:`, error);
          results.failed.push({
            email: recipient.email,
            error: error.message,
          });
        } else {
          console.log(`Email sent to ${recipient.email}:`, data?.id);
          results.sent.push({
            email: recipient.email,
            id: data?.id,
          });
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (emailError) {
        console.error(`Error sending to ${recipient.email}:`, emailError);
        results.failed.push({
          email: recipient.email,
          error: emailError.message,
        });
      }
    }

    return res.status(200).json({
      success: true,
      testMode: testMode || false,
      results: results,
      summary: {
        total: recipientsToSend.length,
        sent: results.sent.length,
        failed: results.failed.length,
      },
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
