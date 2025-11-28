-- Create solar_ai_chat_sessions table
CREATE TABLE IF NOT EXISTS solar_ai_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  messages JSONB DEFAULT '[]'::jsonb,
  calculation_type TEXT,
  project_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_solar_ai_chat_sessions_user_id 
ON solar_ai_chat_sessions(user_id);

-- Create index on updated_at for sorting
CREATE INDEX IF NOT EXISTS idx_solar_ai_chat_sessions_updated_at 
ON solar_ai_chat_sessions(updated_at DESC);

-- Enable Row Level Security
ALTER TABLE solar_ai_chat_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own chat sessions
CREATE POLICY "Users can view their own chat sessions"
ON solar_ai_chat_sessions
FOR SELECT
USING (auth.uid() = user_id);

-- Create policy for users to insert their own chat sessions
CREATE POLICY "Users can insert their own chat sessions"
ON solar_ai_chat_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own chat sessions
CREATE POLICY "Users can update their own chat sessions"
ON solar_ai_chat_sessions
FOR UPDATE
USING (auth.uid() = user_id);

-- Create policy for users to delete their own chat sessions
CREATE POLICY "Users can delete their own chat sessions"
ON solar_ai_chat_sessions
FOR DELETE
USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_solar_ai_chat_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_solar_ai_chat_sessions_updated_at
BEFORE UPDATE ON solar_ai_chat_sessions
FOR EACH ROW
EXECUTE FUNCTION update_solar_ai_chat_sessions_updated_at();

-- Grant permissions
GRANT ALL ON solar_ai_chat_sessions TO authenticated;

