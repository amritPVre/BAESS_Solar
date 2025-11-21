-- ============================================================================
-- Blog Post Scheduling System
-- ============================================================================
-- Adds 'scheduled' status and auto-publish functionality
-- ============================================================================

-- Step 1: Update status constraint to include 'scheduled'
ALTER TABLE public.blog_posts
DROP CONSTRAINT IF EXISTS blog_posts_status_check;

ALTER TABLE public.blog_posts
ADD CONSTRAINT blog_posts_status_check
CHECK (status IN ('draft', 'published', 'archived', 'scheduled'));

-- Step 2: Add index for scheduled posts (for better query performance)
CREATE INDEX IF NOT EXISTS idx_blog_posts_scheduled 
ON public.blog_posts(scheduled_at) 
WHERE status = 'scheduled' AND scheduled_at IS NOT NULL;

-- Step 3: Create function to auto-publish scheduled posts
CREATE OR REPLACE FUNCTION public.publish_scheduled_blog_posts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Update posts that are scheduled and their scheduled_at time has passed
  UPDATE public.blog_posts
  SET 
    status = 'published',
    published_at = scheduled_at,
    updated_at = CURRENT_TIMESTAMP
  WHERE 
    status = 'scheduled'
    AND scheduled_at IS NOT NULL
    AND scheduled_at <= CURRENT_TIMESTAMP;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Log the operation
  RAISE NOTICE 'Auto-published % scheduled blog posts', updated_count;
  
  RETURN updated_count;
END;
$$;

-- Step 4: Create a function to validate scheduled date
CREATE OR REPLACE FUNCTION public.validate_blog_schedule()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If status is 'scheduled', ensure scheduled_at is set and in the future
  IF NEW.status = 'scheduled' THEN
    IF NEW.scheduled_at IS NULL THEN
      RAISE EXCEPTION 'scheduled_at must be set when status is scheduled';
    END IF;
    
    IF NEW.scheduled_at <= CURRENT_TIMESTAMP THEN
      RAISE EXCEPTION 'scheduled_at must be in the future';
    END IF;
    
    -- Maximum 14 days in the future
    IF NEW.scheduled_at > CURRENT_TIMESTAMP + INTERVAL '14 days' THEN
      RAISE EXCEPTION 'scheduled_at cannot be more than 14 days in the future';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 5: Create trigger for schedule validation
DROP TRIGGER IF EXISTS trigger_validate_blog_schedule ON public.blog_posts;
CREATE TRIGGER trigger_validate_blog_schedule
  BEFORE INSERT OR UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_blog_schedule();

-- Step 6: Grant permissions
GRANT EXECUTE ON FUNCTION public.publish_scheduled_blog_posts() TO authenticated, service_role;

-- Step 7: Update RLS policy to include scheduled posts for admins
DROP POLICY IF EXISTS "Anyone can view published posts" ON public.blog_posts;
CREATE POLICY "Anyone can view published posts"
  ON public.blog_posts FOR SELECT
  USING (
    status = 'published' 
    AND published_at IS NOT NULL 
    AND published_at <= CURRENT_TIMESTAMP
  );

-- ============================================================================
-- OPTIONAL: Set up pg_cron to auto-publish every 5 minutes
-- ============================================================================
-- Note: This requires pg_cron extension to be enabled in Supabase
-- Uncomment the following if you want automatic publishing via pg_cron:

-- Enable pg_cron extension (if not already enabled)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the auto-publish function to run every 5 minutes
-- SELECT cron.schedule(
--   'publish-scheduled-blog-posts',
--   '*/5 * * * *',  -- Every 5 minutes
--   $$SELECT public.publish_scheduled_blog_posts()$$
-- );

-- ============================================================================
-- Alternative: Manual trigger (call from Edge Function or client)
-- ============================================================================
-- If you don't want to use pg_cron, you can call this function:
-- 1. From a Supabase Edge Function on a schedule
-- 2. From your frontend when admin visits blog admin page
-- 3. From a GitHub Action or external cron job
--
-- Example usage:
-- SELECT public.publish_scheduled_blog_posts();
-- ============================================================================

-- Add helpful comments
COMMENT ON FUNCTION public.publish_scheduled_blog_posts() IS 'Auto-publishes blog posts that have reached their scheduled time. Returns count of published posts.';
COMMENT ON FUNCTION public.validate_blog_schedule() IS 'Validates scheduled_at date is set, in future, and within 14 days when status is scheduled.';

SELECT '✅ Blog post scheduling system created successfully!' AS status;

