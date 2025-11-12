-- Add comprehensive_boq_data column to store detailed AI BOQ data
ALTER TABLE public.advanced_calculator_projects 
ADD COLUMN IF NOT EXISTS comprehensive_boq_data JSONB;

-- Add comment to the column
COMMENT ON COLUMN public.advanced_calculator_projects.comprehensive_boq_data IS 'Stores comprehensive AI-generated BOQ data including generated, merged, and priced line items with timestamps and AI model info';

