-- Refresh schema cache (for Supabase)
NOTIFY pgrst, 'reload schema';

-- Drop existing tables if they exist (optional - use cautiously)
DROP TABLE IF EXISTS damage_items CASCADE;
DROP TABLE IF EXISTS damage_reports CASCADE;
DROP TABLE IF EXISTS barcode_material_mapping CASCADE;

-- Create damage_reports table
CREATE TABLE IF NOT EXISTS damage_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_number TEXT UNIQUE,
  rcv_control_no TEXT NOT NULL,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ship_date DATE,
  seal_no TEXT,
  driver_name TEXT,
  plate_no TEXT,
  container_no TEXT,
  prepared_by TEXT,
  acknowledged_by TEXT,
  noted_by TEXT,
  narrative_findings TEXT,
  actions_required TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'archived'))
);

-- Create damage_items table
CREATE TABLE IF NOT EXISTS damage_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  damage_report_id UUID NOT NULL REFERENCES damage_reports(id) ON DELETE CASCADE,
  item_number INTEGER,
  barcode TEXT,
  serial_number TEXT NOT NULL,
  material_code TEXT,
  material_description TEXT,
  category TEXT,
  material_category TEXT,
  damage_type TEXT,
  damage_description TEXT,
  damage_severity TEXT CHECK (damage_severity IN ('low', 'medium', 'high')),
  remarks TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create barcode_material_mapping table for quick lookups
CREATE TABLE IF NOT EXISTS barcode_material_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode TEXT UNIQUE NOT NULL,
  material_code TEXT,
  material_description TEXT,
  material_category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_damage_reports_date ON damage_reports(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_damage_reports_status ON damage_reports(status);
CREATE INDEX IF NOT EXISTS idx_damage_items_report_id ON damage_items(damage_report_id);
CREATE INDEX IF NOT EXISTS idx_barcode_material_mapping ON barcode_material_mapping(barcode);

-- Enable RLS (Row Level Security)
ALTER TABLE damage_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE damage_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE barcode_material_mapping ENABLE ROW LEVEL SECURITY;

-- Create policies for damage_reports (allow all authenticated users for now)
CREATE POLICY "Allow all authenticated users to view damage_reports" 
ON damage_reports FOR SELECT USING (true);

CREATE POLICY "Allow all authenticated users to insert damage_reports" 
ON damage_reports FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to update damage_reports" 
ON damage_reports FOR UPDATE USING (true);

-- Create policies for damage_items
CREATE POLICY "Allow all authenticated users to view damage_items" 
ON damage_items FOR SELECT USING (true);

CREATE POLICY "Allow all authenticated users to insert damage_items" 
ON damage_items FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to update damage_items" 
ON damage_items FOR UPDATE USING (true);

-- Create policies for barcode_material_mapping
CREATE POLICY "Allow all authenticated users to view barcode_material_mapping" 
ON barcode_material_mapping FOR SELECT USING (true);

CREATE POLICY "Allow all authenticated users to insert barcode_material_mapping" 
ON barcode_material_mapping FOR INSERT WITH CHECK (true);
