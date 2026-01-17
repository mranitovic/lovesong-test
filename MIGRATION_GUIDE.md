# Quick Migration Guide

## 🚀 Running the Database Migration

The new payment flow requires database schema changes. Follow these steps:

### Step 1: Backup Your Database (Production Only)

```bash
# PostgreSQL backup
pg_dump -U username -d love_album_db > backup_$(date +%Y%m%d).sql
```

### Step 2: Apply Migration

**For Development:**
```bash
npx prisma migrate dev --name add_session_tracking_and_webhook_logging
```

**For Production:**
```bash
npx prisma migrate deploy
```

### Step 3: Verify Migration

Run this SQL to check new fields exist:

```sql
-- Check AlbumSession table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'AlbumSession'
AND column_name IN ('shopifyCheckoutId', 'webhookProcessedAt');

-- Check WebhookLog table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables
   WHERE table_name = 'WebhookLog'
);

-- Check Purchase table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'Purchase'
AND column_name IN ('emailSent', 'emailSentAt');
```

Expected results:
- `shopifyCheckoutId` → text
- `webhookProcessedAt` → timestamp
- `WebhookLog` table → true
- `emailSent` → boolean
- `emailSentAt` → timestamp

### Step 4: Update Environment Variables

Add to your `.env` file:

```env
# Required for email functionality
RESEND_API_KEY=re_your_key_here
EMAIL_FROM=AI Love Album <noreply@yourdomain.com>
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Step 5: Regenerate Prisma Client

```bash
npx prisma generate
```

### Step 6: Restart Your Application

```bash
npm run dev  # Development
# or
npm run build && npm start  # Production
```

---

## ⚠️ Breaking Changes

None! This is fully backward compatible:

- ✅ Existing `AlbumSession` records work without `shopifyCheckoutId`
- ✅ Existing `Purchase` records work without `emailSent`
- ✅ Old webhook processing still works (with enhanced features)
- ✅ Polling fallback still exists if SSE fails

---

## 🧪 Testing the Migration

### Test 1: Create New Album Session

```bash
# Should succeed without errors
curl -X POST http://localhost:3000/api/user/album-session \
  -H "Content-Type: application/json" \
  -d '{"albumData": {"test": true}}'
```

### Test 2: Verify Webhook Logging

```sql
-- Should return empty result set (no errors)
SELECT * FROM "WebhookLog" LIMIT 1;
```

### Test 3: Check Indexes

```sql
-- Verify indexes were created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('AlbumSession', 'WebhookLog');
```

---

## 🔄 Rollback Plan (If Needed)

If you need to rollback:

```bash
# Find migration name
ls prisma/migrations/

# Delete migration folder
rm -rf prisma/migrations/YYYYMMDDHHMMSS_add_session_tracking_and_webhook_logging

# Reset Prisma
npx prisma migrate reset
```

**Warning:** This will delete all data. Only use in development or after restoring backup.

---

## 📞 Support

If you encounter issues:

1. Check logs: `tail -f .next/server/app.log`
2. Review Prisma logs: `npx prisma studio`
3. Check database connection: `npx prisma db pull`
4. Review [SHOPIFY_PAYMENT_FLOW.md](SHOPIFY_PAYMENT_FLOW.md) for troubleshooting

---

**Estimated Migration Time:** 2-5 minutes
**Downtime Required:** None (can apply while running)
