-- =====================================================
-- BESS Inverter Tables Migration
-- Created: 2025-02-02
-- Description: Creates tables for Hybrid Inverters and Battery Inverters
-- =====================================================

-- =====================================================
-- 1. HYBRID INVERTERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.hybrid_inverters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier TEXT NOT NULL,
    model TEXT NOT NULL,
    application TEXT NOT NULL CHECK (application IN ('Residential', 'C&I', 'Utility Scale')),
    max_pv_capacity_kwp NUMERIC(10, 2) NOT NULL,
    max_pv_dc_voltage_v INTEGER NOT NULL,
    mppt_voltage_range_min_v INTEGER,
    mppt_voltage_range_max_v INTEGER,
    max_pv_dc_input_current_a NUMERIC(10, 2),
    battery_voltage_range_min_v INTEGER,
    battery_voltage_range_max_v INTEGER,
    battery_charge_current_a NUMERIC(10, 2),
    battery_discharge_current_a NUMERIC(10, 2),
    rated_ac_capacity_kw NUMERIC(10, 2) NOT NULL,
    operating_ac_voltage_v INTEGER NOT NULL,
    max_ac_output_current_a NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for hybrid_inverters
CREATE INDEX IF NOT EXISTS idx_hybrid_inverters_application ON public.hybrid_inverters(application);
CREATE INDEX IF NOT EXISTS idx_hybrid_inverters_supplier ON public.hybrid_inverters(supplier);
CREATE INDEX IF NOT EXISTS idx_hybrid_inverters_rated_capacity ON public.hybrid_inverters(rated_ac_capacity_kw);

-- Enable RLS for hybrid_inverters
ALTER TABLE public.hybrid_inverters ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow all authenticated users to read hybrid inverters
CREATE POLICY "Allow authenticated users to read hybrid inverters"
ON public.hybrid_inverters
FOR SELECT
TO authenticated
USING (true);

-- RLS Policy: Allow public read access (for public-facing features)
CREATE POLICY "Allow public read access to hybrid inverters"
ON public.hybrid_inverters
FOR SELECT
TO anon
USING (true);

-- =====================================================
-- 2. BATTERY INVERTERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.battery_inverters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manufacturer TEXT NOT NULL,
    application TEXT NOT NULL CHECK (application IN ('Residential', 'C&I', 'Utility-Scale', 'Utility Scale')),
    model TEXT NOT NULL,
    battery_voltage_min_v INTEGER,
    battery_voltage_max_v INTEGER,
    max_battery_charging_current_a INTEGER,
    max_battery_discharging_current_a INTEGER,
    operating_ac_voltage_v INTEGER NOT NULL,
    max_ac_output_current_a NUMERIC(10, 2),
    rated_inverter_ac_capacity_kw NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for battery_inverters
CREATE INDEX IF NOT EXISTS idx_battery_inverters_application ON public.battery_inverters(application);
CREATE INDEX IF NOT EXISTS idx_battery_inverters_manufacturer ON public.battery_inverters(manufacturer);
CREATE INDEX IF NOT EXISTS idx_battery_inverters_rated_capacity ON public.battery_inverters(rated_inverter_ac_capacity_kw);

-- Enable RLS for battery_inverters
ALTER TABLE public.battery_inverters ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow all authenticated users to read battery inverters
CREATE POLICY "Allow authenticated users to read battery inverters"
ON public.battery_inverters
FOR SELECT
TO authenticated
USING (true);

-- RLS Policy: Allow public read access (for public-facing features)
CREATE POLICY "Allow public read access to battery inverters"
ON public.battery_inverters
FOR SELECT
TO anon
USING (true);

-- =====================================================
-- 3. HELPER FUNCTION TO PARSE VOLTAGE RANGES
-- =====================================================
-- Function to parse voltage range strings like "200-950" or "100 - 550"
CREATE OR REPLACE FUNCTION parse_voltage_range(range_text TEXT, OUT min_voltage INTEGER, OUT max_voltage INTEGER)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Remove spaces and split by dash
    range_text := REPLACE(range_text, ' ', '');
    min_voltage := CAST(SPLIT_PART(range_text, '-', 1) AS INTEGER);
    max_voltage := CAST(SPLIT_PART(range_text, '-', 2) AS INTEGER);
EXCEPTION
    WHEN OTHERS THEN
        min_voltage := NULL;
        max_voltage := NULL;
END;
$$;

-- =====================================================
-- 4. COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE public.hybrid_inverters IS 'Solar PV + BESS Hybrid Inverters database for BESS Designer application';
COMMENT ON TABLE public.battery_inverters IS 'Battery Inverters database for AC-coupled BESS systems';

COMMENT ON COLUMN public.hybrid_inverters.supplier IS 'Inverter manufacturer/supplier name';
COMMENT ON COLUMN public.hybrid_inverters.model IS 'Inverter model number/name';
COMMENT ON COLUMN public.hybrid_inverters.application IS 'Application type: Residential, C&I, or Utility Scale';
COMMENT ON COLUMN public.hybrid_inverters.max_pv_capacity_kwp IS 'Maximum PV capacity in kWp';
COMMENT ON COLUMN public.hybrid_inverters.rated_ac_capacity_kw IS 'Rated AC output capacity in kW';

COMMENT ON COLUMN public.battery_inverters.manufacturer IS 'Inverter manufacturer name';
COMMENT ON COLUMN public.battery_inverters.model IS 'Inverter model number/name';
COMMENT ON COLUMN public.battery_inverters.application IS 'Application type: Residential, C&I, or Utility-Scale';
COMMENT ON COLUMN public.battery_inverters.rated_inverter_ac_capacity_kw IS 'Rated AC inverter capacity in kW';

