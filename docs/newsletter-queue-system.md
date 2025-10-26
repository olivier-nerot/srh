# Newsletter Queue System Documentation

## Overview

The newsletter system has been upgraded to handle Resend free tier limitations (100 emails/day) through a **queue-based batch sending system** with Vercel Cron automation.

## Key Features

### 1. Fair Distribution
- Subscribers receive newsletters in **subscription order** (first-come, first-served)
- No random selection - everyone gets the newsletter eventually
- Transparent queue status tracking

### 2. Automatic Batch Sending
- Sends up to 100 emails immediately upon newsletter creation
- Vercel Cron automatically sends next batch daily at 9:00 AM UTC
- Continues until all subscribers have received the newsletter

### 3. Progress Tracking
- Real-time status updates (pending, sending, completed, failed)
- Individual recipient tracking with failure reasons
- Admin dashboard shows queue progress

## Database Schema

### `newsletter_queue` Table
Stores newsletter campaigns with batch sending status.

```sql
CREATE TABLE newsletter_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,                    -- Delta JSON format
  selected_publication_ids TEXT,            -- JSON array of publication IDs
  status TEXT NOT NULL DEFAULT 'pending',   -- pending|sending|completed|failed
  total_recipients INTEGER NOT NULL,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  completed_at INTEGER
);
```

### `newsletter_recipients` Table
Tracks individual recipient delivery status.

```sql
CREATE TABLE newsletter_recipients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  newsletter_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',   -- pending|sent|failed
  sent_at INTEGER,
  error_message TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (newsletter_id) REFERENCES newsletter_queue(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## API Endpoints

### POST `/api/newsletter-v2` (action: queue)
Creates newsletter and queues for batch sending.

**Request:**
```json
{
  "action": "queue",
  "title": "Newsletter SRH - Janvier 2025",
  "content": "{\"ops\":[...]}",
  "selectedPublicationIds": [1, 2, 3]
}
```

**Response:**
```json
{
  "success": true,
  "newsletterId": 1,
  "totalRecipients": 250,
  "sentImmediately": 100,
  "remainingToSend": 150,
  "estimatedDays": 2
}
```

### GET `/api/newsletter-v2`
Gets recent publications and active queue status.

**Response:**
```json
{
  "success": true,
  "publications": [...],
  "queueStatus": {
    "id": 1,
    "title": "Newsletter SRH - Janvier 2025",
    "status": "sending",
    "totalRecipients": 250,
    "sentCount": 100,
    "failedCount": 2
  }
}
```

### POST `/api/cron/send-newsletter-batch` (Cron Only)
Vercel Cron endpoint that runs daily at 9:00 AM UTC.

**Authentication:** Requires `Authorization: Bearer ${CRON_SECRET}` header

**Response:**
```json
{
  "success": true,
  "newsletterId": 1,
  "sent": 100,
  "failed": 2,
  "remaining": 50,
  "completed": false
}
```

## Workflow

### Admin Creates Newsletter
1. Admin fills out newsletter form
2. Admin clicks "Envoyer la newsletter"
3. System creates queue entry and recipient records
4. First batch (100 emails) sent immediately
5. Admin sees confirmation with estimated completion time

### Automatic Daily Sending
1. Vercel Cron triggers at 9:00 AM UTC daily
2. System finds oldest active newsletter with pending recipients
3. Sends next batch of up to 100 emails
4. Updates queue status and recipient records
5. Marks newsletter as "completed" when all sent

### Example Timeline
- **Day 1, 2:00 PM**: Admin sends newsletter to 250 subscribers
  - 100 emails sent immediately
  - 150 remaining in queue
- **Day 2, 9:00 AM**: Cron sends next 100 emails
  - 50 remaining in queue
- **Day 3, 9:00 AM**: Cron sends final 50 emails
  - Newsletter marked as completed

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
# Resend email service
RESEND_API_KEY=re_your_api_key_here
RESEND_EMAIL=noreply@srh-info.org

# Cron security (generate random 32+ char string)
CRON_SECRET=your_random_secret_token_here
```

### Vercel Cron Schedule

Defined in `vercel.json`:

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

**Schedule:** `0 9 * * *` = Every day at 9:00 AM UTC (10:00 AM CET / 11:00 AM CEST)

### Vercel Dashboard Setup

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add `CRON_SECRET` with a secure random string
4. Deploy your changes
5. Verify cron is active in "Cron Jobs" tab

## Database Migration

Run the migration to create new tables:

```bash
# Using SQLite/Turso CLI
sqlite3 your-database.db < migrations/add_newsletter_queue.sql

# Or using Turso CLI
turso db shell your-database < migrations/add_newsletter_queue.sql
```

## Rate Limiting

- **Daily Limit:** 100 emails (Resend free tier)
- **Per-Email Delay:** 500ms (2 emails/second)
- **Batch Processing:** Sequential to respect rate limits
- **Error Handling:** Failed emails marked individually, don't block batch

## Monitoring

### Check Queue Status

```sql
-- View active newsletters
SELECT * FROM newsletter_queue
WHERE status IN ('pending', 'sending')
ORDER BY created_at;

-- View pending recipients for a newsletter
SELECT COUNT(*) FROM newsletter_recipients
WHERE newsletter_id = 1 AND status = 'pending';

-- View failed sends
SELECT * FROM newsletter_recipients
WHERE status = 'failed'
ORDER BY newsletter_id, created_at;
```

### Cron Logs

View cron execution logs in Vercel Dashboard:
1. Go to your project
2. Click "Cron Jobs" tab
3. View execution history and logs

## Advantages Over Random Selection

### Why First-Come, First-Served is Better

1. **Fairness:** Long-time subscribers receive content first
2. **Predictability:** Deterministic order, no randomness
3. **Transparency:** Clear queue progression
4. **Debugging:** Easy to track who got what and when
5. **User Trust:** Consistent experience for subscribers

### Why Not Random?

- Random selection could exclude some users for extended periods
- Difficult to debug "why didn't I receive the newsletter?"
- No guarantee of eventual delivery
- Appears arbitrary to users

## Troubleshooting

### Newsletter Stuck in "Sending" Status

**Check remaining recipients:**
```sql
SELECT COUNT(*) FROM newsletter_recipients
WHERE newsletter_id = 1 AND status = 'pending';
```

**Manually trigger cron:**
```bash
curl -X POST https://your-domain.vercel.app/api/cron/send-newsletter-batch \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

### High Failure Rate

**Check failed recipients:**
```sql
SELECT email, error_message FROM newsletter_recipients
WHERE newsletter_id = 1 AND status = 'failed';
```

**Common causes:**
- Invalid email addresses in database
- Resend API key issues
- Email content formatting errors
- Recipient email server rejections

### Cron Not Running

1. Verify `CRON_SECRET` is set in Vercel environment variables
2. Check cron is enabled in Vercel Dashboard > Cron Jobs
3. Verify cron syntax in `vercel.json` is correct
4. Check function logs for authentication errors

## Future Enhancements

Potential improvements for future versions:

1. **Priority Queues:** Admin, paid members, then free users
2. **Retry Logic:** Automatic retry for failed sends after 24h
3. **Email Preferences:** Let users choose send time window
4. **Analytics:** Open rates, click tracking, engagement metrics
5. **A/B Testing:** Test different subject lines or content
6. **Segmentation:** Send to specific user groups only
7. **Scheduled Newsletters:** Queue newsletters for future sending
8. **Upgrade Path:** Auto-transition to paid Resend tier when needed

## Migration from Old System

If migrating from the old immediate-send system:

1. Run database migration to create new tables
2. Update API endpoint references from `/api/newsletter` to `/api/newsletter-v2`
3. Change `action: 'send'` to `action: 'queue'` in frontend
4. Deploy backend changes first
5. Deploy frontend changes
6. Test with small batch before bulk sending
7. Keep old endpoint as fallback during transition period

## Support

For issues or questions:
- Check Vercel function logs
- Review database queue status
- Check Resend dashboard for email delivery status
- Contact support with newsletter ID and error details
