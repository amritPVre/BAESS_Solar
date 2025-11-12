-- Create circuit breakers table with simplified structure
CREATE TABLE IF NOT EXISTS public.circuit_breakers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  breaker_type TEXT NOT NULL CHECK (breaker_type IN ('MCB', 'MCCB', 'ACB', 'VCB')),
  ampacity NUMERIC NOT NULL,
  rated_voltage NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on breaker_type for faster queries
CREATE INDEX IF NOT EXISTS idx_circuit_breakers_breaker_type ON public.circuit_breakers (breaker_type);

-- Create index on ampacity for range queries
CREATE INDEX IF NOT EXISTS idx_circuit_breakers_ampacity ON public.circuit_breakers (ampacity);

-- Enable Row Level Security
ALTER TABLE public.circuit_breakers ENABLE ROW LEVEL SECURITY;

-- Grant access to authenticated users
CREATE POLICY "Allow authenticated users to read circuit breakers"
  ON public.circuit_breakers
  FOR SELECT
  TO authenticated
  USING (true);

-- Grant access to service role for management
GRANT ALL ON public.circuit_breakers TO service_role;

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update the updated_at timestamp
CREATE TRIGGER update_circuit_breakers_updated_at
BEFORE UPDATE ON public.circuit_breakers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column(); 