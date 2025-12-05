-- Create sandbox_settings table for storing user's OpenRouter API keys
CREATE TABLE IF NOT EXISTS public.sandbox_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    api_key TEXT NOT NULL,
    selected_model TEXT DEFAULT 'google/gemini-2.5-pro-preview',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sandbox_settings_user_id ON public.sandbox_settings(user_id);

-- Enable Row Level Security
ALTER TABLE public.sandbox_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own settings
CREATE POLICY "Users can view own sandbox settings"
    ON public.sandbox_settings
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own settings
CREATE POLICY "Users can insert own sandbox settings"
    ON public.sandbox_settings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own settings
CREATE POLICY "Users can update own sandbox settings"
    ON public.sandbox_settings
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own settings
CREATE POLICY "Users can delete own sandbox settings"
    ON public.sandbox_settings
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sandbox_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_sandbox_settings_updated_at ON public.sandbox_settings;
CREATE TRIGGER trigger_sandbox_settings_updated_at
    BEFORE UPDATE ON public.sandbox_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_sandbox_settings_updated_at();

-- Add comment to table
COMMENT ON TABLE public.sandbox_settings IS 'Stores user OpenRouter API keys for BAESS Sandbox apps';