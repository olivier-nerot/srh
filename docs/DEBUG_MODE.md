# Newsletter Debug Mode

## Overview

Debug mode allows you to test the newsletter queue system without sending emails to real subscribers. All emails are redirected to a test email address.

## Features

When debug mode is enabled:
- ✅ All emails redirect to your test email address
- ✅ Subject line prefixed with `[DEBUG]`
- ✅ Batch limit reduced (default: 3 recipients)
- ✅ Detailed logging shows original recipient → debug email
- ✅ Database still tracks recipients as "sent" (for testing queue logic)

## Setup

### 1. Add Environment Variables

Add these to your Vercel project environment variables or local `.env` file:

```bash
# Enable debug mode
NEWSLETTER_DEBUG_MODE=true

# Your test email address (all emails go here)
NEWSLETTER_DEBUG_EMAIL=your-test-email@example.com

# Maximum recipients per batch in debug mode (optional, default: 3)
NEWSLETTER_DEBUG_LIMIT=3
```

### 2. Deploy or Restart Local Server

**For Vercel (Production/Preview):**
1. Add environment variables in Vercel Dashboard
2. Redeploy your project

**For Local Development:**
1. Add to `.env` file
2. Restart `vercel dev`

## Usage

### Test Manual Newsletter Send

1. Enable debug mode (see Setup above)
2. Go to `/admin/newsletter`
3. Create and send a newsletter
4. Check your debug email inbox
5. Verify emails arrive with `[DEBUG]` subject prefix

### Test Cron Job

**Manual Trigger:**
```bash
curl -X POST https://your-domain.vercel.app/api/cron/send-newsletter-batch \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

**Check Logs:**
- Vercel Dashboard → Functions → `/api/cron/send-newsletter-batch`
- Look for debug mode indicators:
  ```
  [CRON] ⚠️  DEBUG MODE ENABLED ⚠️
  [CRON] - All emails will be sent to: your-test-email@example.com
  [CRON] - Limit: 3 recipients per batch
  [CRON] 🐛 DEBUG: Would send to user1@example.com, redirecting to your-test-email@example.com
  ```

## What Gets Tested

### ✅ Tested in Debug Mode
- Queue creation and status tracking
- Batch size limiting
- Email template generation
- Resend API integration
- Rate limiting (500ms delays)
- Database updates (recipients marked as "sent")
- Progress tracking and counts
- Error handling for failed sends
- Cron job execution flow

### ❌ NOT Tested in Debug Mode
- Actual delivery to real subscriber emails
- Email deliverability to various domains
- Spam filtering
- Email client rendering (all emails go to same client)

## Example Debug Session

### 1. Create Test Newsletter (250 Subscribers)

```
Admin creates newsletter
↓
System creates queue entry
↓
First batch: 3 emails (DEBUG_LIMIT)
  - All 3 go to your-test-email@example.com
  - Subject: [DEBUG] Newsletter SRH - Janvier 2025
↓
Check your inbox: 3 emails received
```

### 2. Check Database

```sql
-- View queue status
SELECT * FROM newsletter_queue ORDER BY created_at DESC LIMIT 1;

-- View recipients (first 3 should be marked "sent")
SELECT status, COUNT(*)
FROM newsletter_recipients
WHERE newsletter_id = 1
GROUP BY status;

-- Result:
-- sent: 3
-- pending: 247
```

### 3. Trigger Cron Manually

```bash
curl -X POST https://your-domain.vercel.app/api/cron/send-newsletter-batch \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

**Expected:**
- Next 3 emails sent to your debug email
- 6 total marked as "sent" in database
- 244 still "pending"

## Logs Examples

### Debug Mode Enabled

```
⚠️  DEBUG MODE ENABLED ⚠️
- All emails will be sent to: test@example.com
- Batch limit: 3 recipients

🐛 DEBUG: Would send to user1@example.com, redirecting to test@example.com
Sent to user1@example.com → test@example.com (1/3)

🐛 DEBUG: Would send to user2@example.com, redirecting to test@example.com
Sent to user2@example.com → test@example.com (2/3)

🐛 DEBUG: Would send to user3@example.com, redirecting to test@example.com
Sent to user3@example.com → test@example.com (3/3)
```

### Debug Mode Disabled (Production)

```
Found 100 pending recipients (limit: 100)
Sent to user1@example.com (1/100)
Sent to user2@example.com (2/100)
...
```

## Important Notes

### ⚠️ Remember to Disable

**Before sending real newsletters:**
1. Go to Vercel Dashboard → Environment Variables
2. Set `NEWSLETTER_DEBUG_MODE=false`
3. Redeploy your project

### Database Cleanup

If you want to reset test data after debugging:

```sql
-- Delete test queue entries
DELETE FROM newsletter_queue WHERE title LIKE '%TEST%';

-- This will cascade delete recipients due to foreign key
```

### Rate Limiting Still Applies

Even in debug mode:
- 500ms delay between emails
- 3 emails = ~1.5 seconds total
- This tests the rate limiting logic

## Troubleshooting

### Debug Mode Not Working

**Check environment variables:**
```bash
# In Vercel Dashboard
Settings → Environment Variables

# Verify:
NEWSLETTER_DEBUG_MODE = true (not "true" in quotes)
NEWSLETTER_DEBUG_EMAIL = your-test-email@example.com
```

**Check logs for debug indicators:**
```
# Should see:
⚠️  DEBUG MODE ENABLED ⚠️

# If not, debug mode is disabled
```

### Not Receiving Debug Emails

1. **Check Resend Dashboard:**
   - Visit: https://resend.com/emails
   - Verify emails were sent to debug address
   - Check for delivery errors

2. **Check spam folder** in your debug email inbox

3. **Verify debug email is valid** and can receive emails

### Database Marks Emails as "Sent" But Not Received

This is **normal in debug mode**. The database tracks emails as "sent" because they were successfully handed to Resend. The redirection to debug email happens at the API level, not database level.

## Best Practices

### 1. Use Dedicated Test Email

Create a dedicated test email address (e.g., `newsletter-test@yourdomain.com`) rather than your personal email.

### 2. Test Full Flow

1. Send newsletter with >100 subscribers (in debug mode)
2. Verify first 3 arrive
3. Manually trigger cron
4. Verify next 3 arrive
5. Check database counts match expected values

### 3. Test Error Handling

**Invalid debug email:**
```bash
NEWSLETTER_DEBUG_EMAIL=invalid-email
```

This will cause sends to fail, letting you test error handling.

### 4. Clean Up After Testing

```sql
-- Delete test newsletters
DELETE FROM newsletter_queue
WHERE created_at > [timestamp_of_test_start];
```

## Production Checklist

Before deploying to production:

- [ ] Set `NEWSLETTER_DEBUG_MODE=false`
- [ ] Verify `RESEND_EMAIL` is correct
- [ ] Test with 1-2 real subscribers first
- [ ] Monitor Resend dashboard for issues
- [ ] Check Vercel function logs
- [ ] Verify queue status displays correctly

## Support

If debug mode issues persist:
1. Check Vercel function logs
2. Check Resend dashboard
3. Verify environment variables
4. Review database queue status
