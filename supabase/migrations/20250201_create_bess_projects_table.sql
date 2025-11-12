-- Create BESS Projects table
CREATE TABLE IF NOT EXISTS public.bess_projects (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    project_data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_bess_projects_user_id ON public.bess_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_bess_projects_created_at ON public.bess_projects(created_at DESC);

-- Enable RLS
ALTER TABLE public.bess_projects ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own BESS projects"
    ON public.bess_projects FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own BESS projects"
    ON public.bess_projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own BESS projects"
    ON public.bess_projects FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own BESS projects"
    ON public.bess_projects FOR DELETE
    USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_bess_projects_updated_at
    BEFORE UPDATE ON public.bess_projects
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Grant permissions
GRANT ALL ON public.bess_projects TO authenticated;

