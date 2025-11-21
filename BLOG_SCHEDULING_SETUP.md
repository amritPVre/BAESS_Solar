# 📅 Blog Post Scheduling System

## Overview

The blog scheduling system allows super admins to schedule blog posts up to **14 days in advance**. Posts will automatically publish at the scheduled time without manual intervention.

---

## ✨ Features

1. **Schedule Button**: New "Schedule" button in post editor
2. **Date/Time Picker**: Select publication date and time
3. **14-Day Limit**: Maximum scheduling window (optimal for SEO)
4. **Auto-Publish**: Scheduled posts automatically go live
5. **Validation**: Prevents scheduling errors (past dates, too far ahead, etc.)
6. **Status Badge**: "Scheduled" posts clearly marked in admin dashboard

---

## 🚀 Setup Instructions

### **Step 1: Run Database Migration**

Run the SQL migration in Supabase to add scheduling functionality:

```sql
-- Run this in Supabase SQL Editor
-- File: supabase/migrations/20250121_add_blog_post_scheduling.sql
```

Go to **Supabase Dashboard → SQL Editor → New Query** and paste the contents of `supabase/migrations/20250121_add_blog_post_scheduling.sql`.

This will:
- Add 'scheduled' status option
- Create `publish_scheduled_blog_posts()` function
- Add validation triggers
- Update RLS policies

---

### **Step 2: Set Up Auto-Publishing**

You have **3 options** to automatically publish scheduled posts:

#### **Option A: Supabase pg_cron (Recommended)**

**Best for:** Fully automated, reliable, server-side publishing.

1. Enable pg_cron extension in Supabase:
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_cron;
   ```

2. Schedule the auto-publish function:
   ```sql
   SELECT cron.schedule(
     'publish-scheduled-blog-posts',
     '*/5 * * * *',  -- Every 5 minutes
     $$SELECT public.publish_scheduled_blog_posts()$$
   );
   ```

3. Verify it's running:
   ```sql
   SELECT * FROM cron.job;
   ```

**✅ Pros:** Fully automated, no external dependencies  
**❌ Cons:** Requires Supabase Pro plan

---

#### **Option B: Supabase Edge Function (Free)**

**Best for:** Free tier users, reliable, no external services.

1. Create Edge Function to check scheduled posts:

```typescript
// supabase/functions/publish-scheduled-posts/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Call the database function
    const { data, error } = await supabase.rpc('publish_scheduled_blog_posts');

    if (error) throw error;

    return new Response(
      JSON.stringify({
        success: true,
        published_count: data,
        timestamp: new Date().toISOString(),
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

2. Deploy the Edge Function:
```bash
supabase functions deploy publish-scheduled-posts
```

3. Set up a cron job using **GitHub Actions** (free):

```yaml
# .github/workflows/publish-scheduled-posts.yml
name: Publish Scheduled Blog Posts

on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
  workflow_dispatch:  # Manual trigger

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - name: Call Supabase Edge Function
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            https://your-project.supabase.co/functions/v1/publish-scheduled-posts
```

**✅ Pros:** Free, reliable, GitHub Actions are free  
**❌ Cons:** Requires GitHub Actions setup

---

#### **Option C: Frontend Check (Simplest)**

**Best for:** Low-traffic sites, quick setup.

Add this to your Blog Admin Dashboard component:

```typescript
// src/pages/BlogAdmin.tsx
useEffect(() => {
  const checkScheduledPosts = async () => {
    try {
      await supabase.rpc('publish_scheduled_blog_posts');
    } catch (error) {
      console.error('Error checking scheduled posts:', error);
    }
  };

  // Check when admin visits the page
  checkScheduledPosts();

  // Optional: Check every 5 minutes while admin is on the page
  const interval = setInterval(checkScheduledPosts, 5 * 60 * 1000);
  return () => clearInterval(interval);
}, []);
```

**✅ Pros:** Simple, no external setup  
**❌ Cons:** Requires someone to visit admin dashboard

---

## 📖 Usage Guide

### For Super Admins:

#### **Creating a Scheduled Post:**

1. Navigate to `/blog/admin`
2. Click **"Create New Post"**
3. Fill in all required fields (title, content, featured image)
4. Click **"Schedule"** button (purple/violet)
5. Select **Date** and **Time** for publication
   - Date must be: Tomorrow to 14 days ahead
   - Time can be any hour/minute
6. Click **"Schedule Post"**
7. Post will show as **"Scheduled"** in admin dashboard

#### **Editing Scheduled Posts:**

1. Go to Blog Admin
2. Find the scheduled post (shows "Scheduled" badge)
3. Click **"Edit"**
4. Make changes
5. Click **"Schedule"** again to reschedule, or **"Publish Now"** to publish immediately

#### **Canceling Scheduled Posts:**

1. Edit the scheduled post
2. Click **"Save Draft"** to convert back to draft
3. Or click **"Publish Now"** to publish immediately

---

## 🎯 SEO Best Practices

### **Recommended Posting Schedule:**

- **New Sites:** 2-3 posts per week
- **Established Sites:** 1 post every 2-3 days
- **High-Traffic Sites:** Daily posts (if quality maintained)

### **Optimal Scheduling Strategy:**

1. **Create Multiple Posts**: Write 7-10 posts in a batch
2. **Schedule Spacing**: Schedule 2-3 days apart
3. **Consistent Times**: Pick the same time of day (e.g., 9 AM)
4. **Avoid Weekends**: Schedule for Tuesday-Thursday (best engagement)

### **Example 2-Week Schedule:**

```
Week 1:
- Monday, 9 AM: Solar Technology post
- Wednesday, 9 AM: Design Tips post
- Friday, 9 AM: Industry News post

Week 2:
- Tuesday, 9 AM: Case Study post
- Thursday, 9 AM: Tutorial post
```

---

## 🧪 Testing

### **Manual Testing:**

1. Create a test post
2. Schedule it for 2 minutes from now
3. Wait and refresh the Blog page
4. Post should automatically appear as "Published"

### **Database Testing:**

```sql
-- Check scheduled posts
SELECT id, title, status, scheduled_at
FROM blog_posts
WHERE status = 'scheduled'
ORDER BY scheduled_at;

-- Manually trigger auto-publish
SELECT public.publish_scheduled_blog_posts();

-- Verify posts were published
SELECT id, title, status, published_at
FROM blog_posts
WHERE published_at > NOW() - INTERVAL '1 hour'
ORDER BY published_at DESC;
```

---

## 🔍 Monitoring

### **Check Scheduled Posts:**

```sql
SELECT 
  title,
  scheduled_at,
  scheduled_at - CURRENT_TIMESTAMP AS time_until_publish
FROM blog_posts
WHERE status = 'scheduled'
ORDER BY scheduled_at;
```

### **Check Recent Auto-Publishes:**

```sql
SELECT 
  title,
  published_at,
  updated_at
FROM blog_posts
WHERE 
  status = 'published'
  AND published_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
ORDER BY published_at DESC;
```

---

## 🐛 Troubleshooting

### **Posts Not Auto-Publishing:**

1. **Check if function exists:**
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'publish_scheduled_blog_posts';
   ```

2. **Check for pg_cron jobs:**
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'publish-scheduled-blog-posts';
   ```

3. **Manually trigger publish:**
   ```sql
   SELECT public.publish_scheduled_blog_posts();
   ```

4. **Check RLS policies:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'blog_posts';
   ```

### **Scheduling Errors:**

- **"scheduled_at must be in the future"**: Selected time is in the past
- **"Cannot schedule more than 14 days"**: Selected date is too far ahead
- **"scheduled_at must be set"**: No date/time selected

---

## 📊 Database Structure

### **blog_posts Table:**

```sql
status VARCHAR(20) CHECK (status IN ('draft', 'published', 'archived', 'scheduled'))
published_at TIMESTAMP WITH TIME ZONE
scheduled_at TIMESTAMP WITH TIME ZONE
```

### **Auto-Publish Function:**

```sql
CREATE FUNCTION publish_scheduled_blog_posts()
RETURNS INTEGER
```

This function:
1. Finds all posts with `status = 'scheduled'`
2. Checks if `scheduled_at <= CURRENT_TIMESTAMP`
3. Updates them to `status = 'published'`
4. Sets `published_at = scheduled_at`
5. Returns count of published posts

---

## 🎨 UI Components

### **Scheduling Dialog:**

- **Date Picker**: Limited to tomorrow → 14 days ahead
- **Time Picker**: 24-hour or 12-hour format
- **Preview**: Shows selected date/time in readable format
- **Validation**: Real-time validation messages
- **Guidelines**: SEO best practices shown in dialog

### **Status Badges:**

- **Draft**: Gray badge
- **Published**: Green badge
- **Scheduled**: Purple/violet badge
- **Archived**: Red badge

---

## 🔐 Security

### **RLS Policies:**

- Only super admins and moderators can schedule posts
- Public users can only see published posts
- Scheduled posts are hidden from public until published

### **Validation:**

- Server-side date validation (trigger)
- Client-side validation (TypeScript)
- Maximum 14-day limit enforced

---

## 🚀 Future Enhancements

Possible future features:
1. **Recurring Posts**: Auto-create and schedule recurring content
2. **Time Zone Support**: Schedule in different time zones
3. **Batch Scheduling**: Schedule multiple posts at once
4. **Calendar View**: Visual calendar for scheduled posts
5. **Email Notifications**: Alert when posts are published
6. **Social Media Integration**: Auto-post to LinkedIn/Twitter

---

## ✅ Quick Checklist

- [ ] Run migration in Supabase
- [ ] Choose auto-publish method (pg_cron/Edge Function/Frontend)
- [ ] Set up chosen auto-publish method
- [ ] Test with a post scheduled for 2 minutes ahead
- [ ] Verify post auto-publishes
- [ ] Create your first batch of scheduled posts
- [ ] Monitor scheduled posts regularly

---

**Need Help?** Check Supabase logs or Vercel deployment logs if posts aren't auto-publishing!

🎉 **Happy Scheduling!**

