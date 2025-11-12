-- Temporary RLS disable for testing BOQ system
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/ejmjukrfpdpgkxdwgoax/sql

-- Disable RLS on BOQ tables for testing
ALTER TABLE public.boq_runs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.boq_exports DISABLE ROW LEVEL SECURITY;

-- Grant direct access to authenticated users for testing
GRANT ALL ON public.boq_runs TO authenticated;
GRANT ALL ON public.boq_exports TO authenticated;
GRANT ALL ON public.boq_runs TO anon;
GRANT ALL ON public.boq_exports TO anon;

-- Note: This is for TESTING only!
-- Re-enable RLS for production:
-- ALTER TABLE public.boq_runs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.boq_exports ENABLE ROW LEVEL SECURITY;
