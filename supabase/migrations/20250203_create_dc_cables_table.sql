-- Create DC Single Core Cables Table
CREATE TABLE IF NOT EXISTS dc_single_core_cables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cross_section_mm2 DECIMAL NOT NULL,
    material VARCHAR(20) NOT NULL CHECK (material IN ('Copper', 'Aluminum')),
    insulation_type VARCHAR(20) DEFAULT 'XLPE',
    
    -- Ampacity ratings for different installation methods (A)
    free_air_ampacity_a DECIMAL,
    direct_buried_ampacity_a DECIMAL,
    
    -- Physical properties
    max_conductor_temp_c INTEGER DEFAULT 90,
    
    -- DC resistance at 20°C (Ohm/km)
    resistance_dc_20c_ohm_per_km DECIMAL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(cross_section_mm2, material)
);

-- Create DC Cable Derating Factors Table
CREATE TABLE IF NOT EXISTS dc_cable_derating_factors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material VARCHAR(20) NOT NULL CHECK (material IN ('Copper', 'Aluminum')),
    factor_type VARCHAR(50) NOT NULL,
    factor_key VARCHAR(100) NOT NULL,
    factor_value DECIMAL NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(material, factor_type, factor_key)
);

-- Insert Copper Single Core Cable Ampacity Data
INSERT INTO dc_single_core_cables (cross_section_mm2, material, free_air_ampacity_a, direct_buried_ampacity_a, resistance_dc_20c_ohm_per_km) VALUES
(1.5, 'Copper', 23, 27, 12.1),
(2.5, 'Copper', 32, 36, 7.41),
(4, 'Copper', 42, 47, 4.61),
(6, 'Copper', 54, 59, 3.08),
(10, 'Copper', 75, 80, 1.83),
(16, 'Copper', 100, 105, 1.15),
(25, 'Copper', 127, 137, 0.727),
(35, 'Copper', 158, 167, 0.524),
(50, 'Copper', 192, 202, 0.387),
(70, 'Copper', 246, 255, 0.268),
(95, 'Copper', 298, 307, 0.193),
(120, 'Copper', 346, 352, 0.153),
(150, 'Copper', 399, 404, 0.124),
(185, 'Copper', 456, 461, 0.0991),
(240, 'Copper', 538, 546, 0.0754),
(300, 'Copper', 621, 626, 0.0601),
(400, 'Copper', 726, 733, 0.0470),
(500, 'Copper', 830, 837, 0.0366),
(630, 'Copper', 961, 959, 0.0283),
(800, 'Copper', 1118, 1108, 0.0221),
(1000, 'Copper', 1264, 1245, 0.0176);

-- Insert Aluminum Single Core Cable Ampacity Data
INSERT INTO dc_single_core_cables (cross_section_mm2, material, free_air_ampacity_a, direct_buried_ampacity_a, resistance_dc_20c_ohm_per_km) VALUES
(2.5, 'Aluminum', 25, 28, 12.2),
(4, 'Aluminum', 32, 36, 7.56),
(6, 'Aluminum', 41, 45, 5.08),
(10, 'Aluminum', 57, 61, 3.01),
(16, 'Aluminum', 76, 81, 1.88),
(25, 'Aluminum', 96, 105, 1.19),
(35, 'Aluminum', 119, 129, 0.858),
(50, 'Aluminum', 144, 157, 0.627),
(70, 'Aluminum', 184, 200, 0.443),
(95, 'Aluminum', 223, 241, 0.318),
(120, 'Aluminum', 261, 278, 0.250),
(150, 'Aluminum', 303, 318, 0.201),
(185, 'Aluminum', 349, 362, 0.162),
(240, 'Aluminum', 413, 430, 0.124),
(300, 'Aluminum', 477, 493, 0.0993),
(400, 'Aluminum', 571, 583, 0.0770),
(500, 'Aluminum', 659, 671, 0.0602),
(630, 'Aluminum', 775, 783, 0.0467),
(800, 'Aluminum', 899, 912, 0.0364),
(1000, 'Aluminum', 1026, 1030, 0.0287);

-- Insert Copper Single Core Derating Factors
-- Ambient Temperature Derating
INSERT INTO dc_cable_derating_factors (material, factor_type, factor_key, factor_value, description) VALUES
('Copper', 'ambient_temp', '10', 1.16, 'Temperature derating at 10°C'),
('Copper', 'ambient_temp', '15', 1.12, 'Temperature derating at 15°C'),
('Copper', 'ambient_temp', '20', 1.08, 'Temperature derating at 20°C'),
('Copper', 'ambient_temp', '25', 1.04, 'Temperature derating at 25°C'),
('Copper', 'ambient_temp', '30', 1.00, 'Temperature derating at 30°C'),
('Copper', 'ambient_temp', '35', 0.96, 'Temperature derating at 35°C'),
('Copper', 'ambient_temp', '40', 0.91, 'Temperature derating at 40°C'),
('Copper', 'ambient_temp', '45', 0.87, 'Temperature derating at 45°C'),
('Copper', 'ambient_temp', '50', 0.82, 'Temperature derating at 50°C'),
('Copper', 'ambient_temp', '55', 0.77, 'Temperature derating at 55°C'),
('Copper', 'ambient_temp', '60', 0.71, 'Temperature derating at 60°C'),
('Copper', 'ambient_temp', '65', 0.65, 'Temperature derating at 65°C'),
('Copper', 'ambient_temp', '70', 0.58, 'Temperature derating at 70°C'),
('Copper', 'ambient_temp', '75', 0.50, 'Temperature derating at 75°C'),
('Copper', 'ambient_temp', '80', 0.41, 'Temperature derating at 80°C');

-- Grouping Derating (Air - Touching)
INSERT INTO dc_cable_derating_factors (material, factor_type, factor_key, factor_value, description) VALUES
('Copper', 'grouping_air_touch', '1', 1.00, 'Grouping factor for 1 circuit'),
('Copper', 'grouping_air_touch', '2', 0.88, 'Grouping factor for 2 circuits'),
('Copper', 'grouping_air_touch', '3', 0.82, 'Grouping factor for 3 circuits'),
('Copper', 'grouping_air_touch', '4', 0.79, 'Grouping factor for 4 circuits'),
('Copper', 'grouping_air_touch', '5', 0.76, 'Grouping factor for 5 circuits'),
('Copper', 'grouping_air_touch', '6', 0.73, 'Grouping factor for 6 circuits');

-- Aluminum Single Core Derating Factors
-- Ambient Temperature Derating
INSERT INTO dc_cable_derating_factors (material, factor_type, factor_key, factor_value, description) VALUES
('Aluminum', 'ambient_temp', '10', 1.15, 'Temperature derating at 10°C'),
('Aluminum', 'ambient_temp', '15', 1.12, 'Temperature derating at 15°C'),
('Aluminum', 'ambient_temp', '20', 1.08, 'Temperature derating at 20°C'),
('Aluminum', 'ambient_temp', '25', 1.04, 'Temperature derating at 25°C'),
('Aluminum', 'ambient_temp', '30', 1.00, 'Temperature derating at 30°C'),
('Aluminum', 'ambient_temp', '35', 0.96, 'Temperature derating at 35°C'),
('Aluminum', 'ambient_temp', '40', 0.91, 'Temperature derating at 40°C'),
('Aluminum', 'ambient_temp', '45', 0.87, 'Temperature derating at 45°C'),
('Aluminum', 'ambient_temp', '50', 0.82, 'Temperature derating at 50°C'),
('Aluminum', 'ambient_temp', '55', 0.76, 'Temperature derating at 55°C'),
('Aluminum', 'ambient_temp', '60', 0.71, 'Temperature derating at 60°C'),
('Aluminum', 'ambient_temp', '65', 0.65, 'Temperature derating at 65°C'),
('Aluminum', 'ambient_temp', '70', 0.58, 'Temperature derating at 70°C'),
('Aluminum', 'ambient_temp', '75', 0.50, 'Temperature derating at 75°C'),
('Aluminum', 'ambient_temp', '80', 0.41, 'Temperature derating at 80°C');

-- Grouping Derating (Air - Touching)
INSERT INTO dc_cable_derating_factors (material, factor_type, factor_key, factor_value, description) VALUES
('Aluminum', 'grouping_air_touch', '1', 1.00, 'Grouping factor for 1 circuit'),
('Aluminum', 'grouping_air_touch', '2', 0.87, 'Grouping factor for 2 circuits'),
('Aluminum', 'grouping_air_touch', '3', 0.82, 'Grouping factor for 3 circuits'),
('Aluminum', 'grouping_air_touch', '4', 0.80, 'Grouping factor for 4 circuits'),
('Aluminum', 'grouping_air_touch', '5', 0.80, 'Grouping factor for 5 circuits'),
('Aluminum', 'grouping_air_touch', '6', 0.79, 'Grouping factor for 6 circuits');

-- Create indexes for better query performance
CREATE INDEX idx_dc_cables_material ON dc_single_core_cables(material);
CREATE INDEX idx_dc_cables_cross_section ON dc_single_core_cables(cross_section_mm2);
CREATE INDEX idx_dc_derating_material_type ON dc_cable_derating_factors(material, factor_type);

-- Enable Row Level Security
ALTER TABLE dc_single_core_cables ENABLE ROW LEVEL SECURITY;
ALTER TABLE dc_cable_derating_factors ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to dc cables" ON dc_single_core_cables
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to dc derating factors" ON dc_cable_derating_factors
    FOR SELECT USING (true);

-- Add comments for documentation
COMMENT ON TABLE dc_single_core_cables IS 'DC single core cable specifications for solar PV and battery systems';
COMMENT ON TABLE dc_cable_derating_factors IS 'Derating factors for DC single core cables based on installation conditions';

