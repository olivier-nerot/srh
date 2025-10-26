# Newsletter Queue System - Quick Start Guide

## Problem Solved

Resend free tier limits sending to 100 emails/day. With more subscribers, newsletters couldn't reach everyone.

## Solution

**Queue-based batch sending** with Vercel Cron automation:
- Sends 100 emails immediately when newsletter created
- Automatically sends next 100 emails daily at 9:00 AM UTC
- Continues until all subscribers receive the newsletter
- Fair first-come, first-served delivery order

## Setup Steps

### 1. Run Database Migration

```bash
# Apply the migration
turso db shell your-database < migrations/add_newsletter_queue.sql
```

This creates two new tables:
- `newsletter_queue` - Tracks newsletter campaigns
- `newsletter_recipients` - Tracks individual deliveries

### 2. Add Environment Variable

Add to Vercel project environment variables:

```bash
CRON_SECRET=your_random_32plus_character_secret_here
```

Generate a secure random string:
```bash
openssl rand -hex 32
```

### 3. Deploy to Vercel

```bash
git add .
git commit -m "Add newsletter queue system with Vercel Cron"
git push
```

Vercel will automatically:
- Deploy the new API endpoints
- Set up the daily cron job (9:00 AM UTC)
- Start batch processing newsletters

### 4. Verify Cron is Active

1. Go to Vercel Dashboard → Your Project
2. Click "Cron Jobs" tab
3. Verify `/api/cron/send-newsletter-batch` is listed
4. Schedule should show: `0 9 * * *` (daily at 9:00 AM UTC)

## How It Works

### Creating a Newsletter

Admin creates newsletter → System immediately sends first 100 emails → Queue remaining emails

### Automatic Daily Sending

Every day at 9:00 AM UTC:
1. Cron job wakes up
2. Finds oldest newsletter with pending recipients
3. Sends next batch of 100 emails
4. Updates progress tracking
5. Marks newsletter complete when done

### Example Timeline

**250 Subscribers:**
- **Day 1, 2:00 PM**: Admin sends newsletter
  - ✅ 100 sent immediately
  - ⏳ 150 in queue
- **Day 2, 9:00 AM**: Cron sends next batch
  - ✅ 200 total sent
  - ⏳ 50 in queue
- **Day 3, 9:00 AM**: Cron sends final batch
  - ✅ 250 total sent
  - ✅ Newsletter completed

## Key Files Created

```
api/
  newsletter-v2.js                    # New queue-based API
  cron/
    send-newsletter-batch.js          # Daily cron job
  db/
    newsletter-schema.js              # Table definitions

migrations/
  add_newsletter_queue.sql            # Database migration

docs/
  newsletter-queue-system.md          # Full documentation
```

## Configuration

### `vercel.json`
```json
{
  "crons": [
    {
      "path": "/api/cron/send-newsletter-batch",
      "schedule": "0 9 * * *"
    }
  ]
}
```

### Environment Variables Required
```bash
RESEND_API_KEY=re_...
RESEND_EMAIL=noreply@srh-info.org
CRON_SECRET=your_secret_here
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=eyJ...
```

## Testing

### Test Newsletter Creation
```bash
curl -X POST https://your-domain.vercel.app/api/newsletter-v2 \
  -H "Content-Type: application/json" \
  -d '{
    "action": "queue",
    "title": "Test Newsletter",
    "content": "{\"ops\":[{\"insert\":\"Test content\\n\"}]}",
    "selectedPublicationIds": []
  }'
```

### Manually Trigger Cron (for testing)
```bash
curl -X POST https://your-domain.vercel.app/api/cron/send-newsletter-batch \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Check Queue Status
```sql
SELECT id, title, status, sent_count, total_recipients
FROM newsletter_queue
ORDER BY created_at DESC;
```

## Monitoring

### View Active Newsletters
```sql
SELECT * FROM newsletter_queue
WHERE status IN ('pending', 'sending');
```

### Check Failed Sends
```sql
SELECT email, error_message
FROM newsletter_recipients
WHERE status = 'failed';
```

### Vercel Dashboard
- **Functions Tab**: View API endpoint logs
- **Cron Jobs Tab**: View cron execution history
- **Environment Variables Tab**: Manage secrets

## Advantages

✅ **Fair Distribution**: First subscribers get newsletter first
✅ **Guaranteed Delivery**: Everyone receives it eventually
✅ **Zero Manual Work**: Fully automated after setup
✅ **Progress Tracking**: Know exactly who received what
✅ **Error Handling**: Failed sends tracked individually
✅ **Free Tier Compliant**: Works within Resend limits
✅ **Scalable**: Handles any number of subscribers

## Troubleshooting

### Newsletter not sending?
- Check `CRON_SECRET` is set in Vercel
- Verify cron job is enabled in Vercel dashboard
- Check function logs for errors

### Cron job failing?
- Verify `Authorization` header in cron request
- Check Resend API key is valid
- Review database connection settings

### High failure rate?
- Check for invalid email addresses in database
- Review Resend dashboard for delivery issues
- Verify email content formatting

## Next Steps

1. ✅ Run database migration
2. ✅ Add `CRON_SECRET` environment variable
3. ✅ Deploy to Vercel
4. ✅ Verify cron job is active
5. ⏳ Test with small newsletter
6. ⏳ Monitor first automated batch send
7. ⏳ Update admin UI (optional enhancement)

## Full Documentation

See [docs/newsletter-queue-system.md](docs/newsletter-queue-system.md) for complete details.

## Support

Questions? Check:
1. Vercel function logs (Functions tab)
2. Cron execution logs (Cron Jobs tab)
3. Database queue status (SQL queries above)
4. Resend dashboard (resend.com/emails)
