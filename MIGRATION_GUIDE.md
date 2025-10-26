# Migration Guide: Newsletter System Upgrade

## Overview

This guide helps you migrate from the immediate-send newsletter system to the queue-based batch sending system.

## Pre-Migration Checklist

- [ ] Backup your database
- [ ] Note current number of newsletter subscribers
- [ ] Test new system in development/staging first
- [ ] Plan migration during low-traffic period
- [ ] Inform admin users of new workflow

## Migration Steps

### Step 1: Database Migration

Run the migration SQL to create new tables:

```bash
# For Turso
turso db shell <your-database-name> < migrations/add_newsletter_queue.sql

# For local SQLite
sqlite3 <your-database>.db < migrations/add_newsletter_queue.sql
```

**Verify migration:**
```sql
-- Should return the new tables
SELECT name FROM sqlite_master
WHERE type='table' AND name LIKE 'newsletter%';
```

Expected output:
- `newsletter_queue`
- `newsletter_recipients`

### Step 2: Generate CRON_SECRET

```bash
# Run the generator script
node scripts/generate-cron-secret.js
```

Copy the generated secret - you'll need it in the next step.

### Step 3: Configure Vercel Environment Variables

1. Go to https://vercel.com/dashboard
2. Select your project (srh-website)
3. Navigate to: **Settings** → **Environment Variables**
4. Add new variable:
   - **Key**: `CRON_SECRET`
   - **Value**: (paste the generated secret from Step 2)
   - **Environments**: Select all (Production, Preview, Development)
5. Click **Save**

**Verify existing variables:**
Ensure these are already set:
- ✅ `RESEND_API_KEY`
- ✅ `RESEND_EMAIL`
- ✅ `TURSO_DATABASE_URL`
- ✅ `TURSO_AUTH_TOKEN`

### Step 4: Deploy New Code

```bash
# Stage all changes
git add .

# Commit
git commit -m "Add newsletter queue system with Vercel Cron

- Add newsletter_queue and newsletter_recipients tables
- Implement batch sending to respect Resend 100/day limit
- Add Vercel Cron job for daily automated sends
- Fair first-come, first-served delivery order
- Progress tracking and error handling"

# Push to trigger deployment
git push origin main
```

**Wait for deployment to complete** (check Vercel dashboard).

### Step 5: Verify Cron Job Setup

1. Go to Vercel Dashboard → Your Project
2. Click **Cron Jobs** tab
3. Verify the cron job is listed:
   - **Path**: `/api/cron/send-newsletter-batch`
   - **Schedule**: `0 9 * * *` (daily at 9:00 AM UTC)
   - **Status**: ✅ Active

### Step 6: Test the New System

#### 6.1 Test Newsletter Preview (No Changes)

1. Login as admin
2. Go to: `/admin/newsletter`
3. Create test newsletter
4. Click **Aperçu** (Preview)
5. Verify preview displays correctly

#### 6.2 Test Queue System

**Option A: Production Test (Recommended)**

1. Create a test user with newsletter subscription
2. Send a test newsletter with minimal content
3. Check database to verify queue entry:

```sql
SELECT * FROM newsletter_queue ORDER BY created_at DESC LIMIT 1;
SELECT * FROM newsletter_recipients WHERE newsletter_id = (
  SELECT id FROM newsletter_queue ORDER BY created_at DESC LIMIT 1
);
```

4. Verify first batch was sent immediately
5. Check Resend dashboard for delivery confirmation

**Option B: Manual Cron Trigger (Advanced)**

```bash
# Trigger cron manually to test
curl -X POST https://your-domain.vercel.app/api/cron/send-newsletter-batch \
  -H "Authorization: Bearer YOUR_CRON_SECRET_HERE"
```

### Step 7: Monitor First Automated Run

**Next day at 9:00 AM UTC**, verify the cron job runs automatically:

1. Go to Vercel Dashboard → Cron Jobs tab
2. Check execution log for latest run
3. Verify status is "Success"
4. Check database for updated counts:

```sql
SELECT id, title, status, sent_count, total_recipients
FROM newsletter_queue
WHERE status = 'sending';
```

## Rollback Plan

If issues occur, you can rollback:

### Quick Rollback (Keep New Tables)

1. Revert to previous git commit:
   ```bash
   git revert HEAD
   git push origin main
   ```

2. Vercel will auto-deploy previous version

3. New tables remain in database (harmless)

### Full Rollback (Remove New Tables)

```sql
-- Only if necessary
DROP TABLE IF EXISTS newsletter_recipients;
DROP TABLE IF EXISTS newsletter_queue;
```

## Breaking Changes

### API Endpoint Change (Backend Only)

**Old behavior** (`/api/newsletter`):
- `action: 'send'` → Sent all emails immediately

**New behavior** (`/api/newsletter-v2`):
- `action: 'queue'` → Queues emails for batch sending

**Important:** The frontend (`AdminNewsletter.tsx`) still uses `/api/newsletter` with the old immediate-send logic. You can:

**Option 1: Keep Both Systems (Recommended During Migration)**
- Old endpoint (`/api/newsletter`) - immediate send for testing
- New endpoint (`/api/newsletter-v2`) - queue system for production

**Option 2: Replace Old System (After Testing)**
- Update frontend to use `/api/newsletter-v2`
- Change `action: 'send'` to `action: 'queue'`
- Remove old `/api/newsletter` endpoint

## Post-Migration Tasks

### Week 1: Monitoring

- [ ] Check cron execution logs daily
- [ ] Monitor database queue status
- [ ] Review Resend dashboard for delivery rates
- [ ] Check for failed sends and investigate

**Query for monitoring:**
```sql
-- Daily health check
SELECT
  status,
  COUNT(*) as count,
  SUM(sent_count) as total_sent,
  SUM(failed_count) as total_failed,
  SUM(total_recipients - sent_count) as total_pending
FROM newsletter_queue
GROUP BY status;
```

### Week 2: Optimization

- [ ] Review failure patterns
- [ ] Adjust cron schedule if needed (currently 9:00 AM UTC)
- [ ] Consider adding retry logic for failed sends
- [ ] Document any issues or improvements needed

### Month 1: Evaluation

- [ ] Assess system performance
- [ ] Gather admin feedback
- [ ] Consider UI improvements (queue status dashboard)
- [ ] Plan for Resend upgrade if subscriber count exceeds sustainable threshold

## Troubleshooting

### Cron Job Not Running

**Check 1: Environment Variable**
```bash
# Verify CRON_SECRET is set
# In Vercel Dashboard → Settings → Environment Variables
```

**Check 2: Cron Configuration**
```json
// Verify in vercel.json
{
  "crons": [
    {
      "path": "/api/cron/send-newsletter-batch",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Check 3: Function Logs**
- Vercel Dashboard → Functions tab
- Look for errors in `/api/cron/send-newsletter-batch`

### Newsletter Stuck in "Sending"

**Check pending count:**
```sql
SELECT COUNT(*) FROM newsletter_recipients
WHERE newsletter_id = <ID> AND status = 'pending';
```

**Manual trigger:**
```bash
curl -X POST https://your-domain.vercel.app/api/cron/send-newsletter-batch \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

### High Failure Rate

**Identify issues:**
```sql
SELECT email, error_message, COUNT(*) as failure_count
FROM newsletter_recipients
WHERE status = 'failed'
GROUP BY error_message
ORDER BY failure_count DESC;
```

**Common fixes:**
- Clean invalid email addresses from database
- Verify Resend API key is valid
- Check email content formatting
- Review Resend dashboard for blocks/bounces

## FAQ

### Q: Will this affect existing newsletters?
**A:** No. Only new newsletters use the queue system. Old data is unaffected.

### Q: Can I still send newsletters immediately?
**A:** Yes, the first 100 emails send immediately. Remaining emails queue for next-day delivery.

### Q: What if I have fewer than 100 subscribers?
**A:** All emails send immediately, just like before. Queue system only activates when subscribers > 100.

### Q: Can I change the cron schedule?
**A:** Yes. Edit `vercel.json` cron schedule and redeploy:
```json
"schedule": "0 10 * * *"  // 10:00 AM UTC instead of 9:00 AM
```

### Q: How do I know if cron is working?
**A:** Check Vercel Dashboard → Cron Jobs tab for execution history and logs.

### Q: Can I test cron without waiting 24 hours?
**A:** Yes, manually trigger the endpoint with curl (see Testing section).

## Support

### Resources

- **Full Documentation**: [docs/newsletter-queue-system.md](docs/newsletter-queue-system.md)
- **Quick Start**: [NEWSLETTER_QUEUE_SUMMARY.md](NEWSLETTER_QUEUE_SUMMARY.md)
- **Vercel Cron Docs**: https://vercel.com/docs/cron-jobs
- **Resend Docs**: https://resend.com/docs

### Getting Help

1. Check Vercel function logs (Dashboard → Functions)
2. Check cron execution logs (Dashboard → Cron Jobs)
3. Review database queue status (SQL queries above)
4. Check Resend dashboard (resend.com/emails)

## Success Criteria

Migration is successful when:

✅ Database tables created without errors
✅ Cron job appears in Vercel dashboard
✅ Test newsletter queues successfully
✅ First batch sends immediately (up to 100 emails)
✅ Cron job executes automatically next day
✅ Queue progresses daily until completion
✅ No errors in function logs
✅ Resend delivery rate remains high (>95%)

## Timeline Estimate

- **Preparation**: 15 minutes
- **Migration Steps 1-4**: 30 minutes
- **Testing**: 30 minutes
- **Monitoring**: 1 week (5 min/day)
- **Total Active Time**: ~1.5 hours
- **Total Calendar Time**: 1 week

## Conclusion

This migration enables your newsletter system to scale beyond Resend's free tier limits while maintaining reliable, fair delivery to all subscribers.

**Questions or issues?** Document them in the project issues tracker.
