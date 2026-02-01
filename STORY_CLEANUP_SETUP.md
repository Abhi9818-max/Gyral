# Story Cleanup Setup Instructions

Stories should persist for 24 hours and then be automatically deleted from both the database and Supabase Storage.

## Steps to Enable Automatic Cleanup:

### 1. **Enable pg_cron Extension** (for scheduled cleanup)

In your Supabase Dashboard:
1. Go to **Database** → **Extensions**
2. Search for `pg_cron`
3. Click **Enable** next to `pg_cron`

### 2. **Run the Cleanup SQL**

Go to **SQL Editor** and run the contents of `cleanup-stories.sql`:

```sql
-- This creates a function that deletes expired stories
-- and schedules it to run every hour
```

Copy and paste the entire contents of `cleanup-stories.sql` into the SQL editor and execute it.

### 3. **Set Up Storage Lifecycle Policy**

In your Supabase Dashboard:
1. Go to **Storage** → Click on `stories-media` bucket
2. Click **Settings** (gear icon)
3. Scroll to **Lifecycle policies**
4. Add a new policy:
   - **Delete files older than**: `1 day`
   - This will automatically delete media files after 24 hours

### 4. **Alternative: Manual Cleanup (if pg_cron not available)**

If you can't enable `pg_cron` (some Supabase plans don't support it), you can:

**Option A**: Call cleanup from your app when it loads:
- Already implemented in the stories context
- Runs `delete_expired_stories()` on app startup

**Option B**: Use Supabase Edge Functions (serverless):
- Create an edge function that runs on a schedule
- Calls the cleanup function periodically

### 5. **Verify Cleanup is Working**

After setup, check:
1. Stories older than 24 hours are automatically deleted
2. Storage files are removed after 24 hours
3. Stories persist correctly until expiration

## Current Behavior:

- ✅ Stories expire after 24 hours (`expires_at` field)
- ✅ Stories are hidden from queries after expiration
- ✅ Automatic cleanup runs every hour (after setup)
- ✅ Storage files are deleted automatically (with lifecycle policy)

## No More Issues:

- ❌ ~~Stories disappearing on refresh~~ → Fixed with proper database persistence
- ❌ ~~Storage bloat from old media~~ → Fixed with lifecycle policy
- ❌ ~~Manual deletion needed~~ → Fully automatic now
