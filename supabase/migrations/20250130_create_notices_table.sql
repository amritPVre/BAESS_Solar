-- Create notices/announcements table
CREATE TABLE IF NOT EXISTS public.notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('event', 'webinar', 'training', 'feature_update', 'announcement')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_active BOOLEAN DEFAULT true,
  published_date TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active notices
CREATE POLICY "Anyone can view active notices"
  ON public.notices
  FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

-- Policy: Super admins can insert notices
CREATE POLICY "Super admins can insert notices"
  ON public.notices
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

-- Policy: Super admins can update notices
CREATE POLICY "Super admins can update notices"
  ON public.notices
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

-- Policy: Super admins can delete notices
CREATE POLICY "Super admins can delete notices"
  ON public.notices
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

-- Create index for efficient querying
CREATE INDEX idx_notices_active_date ON public.notices(is_active, published_date DESC);
CREATE INDEX idx_notices_type ON public.notices(type);
CREATE INDEX idx_notices_priority ON public.notices(priority);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_notices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notices_updated_at
  BEFORE UPDATE ON public.notices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_notices_updated_at();

