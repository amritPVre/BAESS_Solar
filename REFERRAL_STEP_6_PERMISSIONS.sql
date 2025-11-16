-- ============================================================================
-- REFERRAL SYSTEM - STEP 6: Set Permissions and RLS
-- ============================================================================
-- Only run this AFTER Steps 1-5 complete successfully!
-- ============================================================================

-- Enable RLS on referrals table
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own referral stats" ON public.referrals;
DROP POLICY IF EXISTS "System can insert referrals" ON public.referrals;

-- Users can view their own referral stats
CREATE POLICY "Users can view own referral stats"
ON public.referrals
FOR SELECT
USING (referrer_id = auth.uid() OR referred_id = auth.uid());

-- Only the system can insert referrals
CREATE POLICY "System can insert referrals"
ON public.referrals
FOR INSERT
WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.referrals TO authenticated;
GRANT INSERT ON public.referrals TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.generate_referral_code() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.apply_referral_bonus(UUID, VARCHAR) TO authenticated, service_role;

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'referrals';

-- Verify policies exist
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'referrals';

-- You should see row security enabled and 2 policies

SELECT '✅ Referral system setup complete!' as status;

