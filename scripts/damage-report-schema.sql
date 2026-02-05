-- Create barcode_material_mapping table
CREATE TABLE IF NOT EXISTS barcode_material_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode VARCHAR(255) UNIQUE NOT NULL,
  material_code VARCHAR(255) NOT NULL,
  material_description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create damage_reports table
CREATE TABLE IF NOT EXISTS damage_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_number VARCHAR(50) UNIQUE NOT NULL,
  rcv_control_no VARCHAR(100),
  report_date DATE NOT NULL,
  seal_no VARCHAR(100),
  driver_name VARCHAR(255),
  plate_no VARCHAR(50),
  container_no VARCHAR(100),
  prepared_by VARCHAR(255),
  noted_by VARCHAR(255),
  acknowledged_by VARCHAR(255),
  narrative_findings TEXT,
  actions_required TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create damage_items table
CREATE TABLE IF NOT EXISTS damage_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  damage_report_id UUID NOT NULL REFERENCES damage_reports(id) ON DELETE CASCADE,
  item_number INTEGER NOT NULL,
  barcode VARCHAR(255),
  serial_number VARCHAR(255),
  material_code VARCHAR(255),
  material_description TEXT,
  category VARCHAR(100),
  damage_type VARCHAR(100),
  damage_description TEXT,
  photo_url TEXT,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(damage_report_id, item_number)
);

-- Create indexes for better performance
CREATE INDEX idx_damage_reports_date ON damage_reports(report_date);
CREATE INDEX idx_damage_reports_status ON damage_reports(status);
CREATE INDEX idx_damage_items_report_id ON damage_items(damage_report_id);
CREATE INDEX idx_barcode_mapping_barcode ON barcode_material_mapping(barcode);

-- Enable RLS
ALTER TABLE barcode_material_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE damage_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE damage_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all authenticated users for now)
CREATE POLICY "Allow all authenticated users to read barcode mapping"
  ON barcode_material_mapping
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow all authenticated users to insert barcode mapping"
  ON barcode_material_mapping
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to read damage reports"
  ON damage_reports
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow all authenticated users to insert damage reports"
  ON damage_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to update damage reports"
  ON damage_reports
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to read damage items"
  ON damage_items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow all authenticated users to insert damage items"
  ON damage_items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to update damage items"
  ON damage_items
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert sample barcode data for testing
INSERT INTO barcode_material_mapping (barcode, material_code, material_description, category)
VALUES
  ('TD005411300018F0181', 'HFS-503G1E3GOSR', 'Refrigerant Component', 'Electronics'),
  ('TD005411300018F0024', 'HFS-503G1E3GOSR', 'Refrigerant Component', 'Electronics'),
  ('TD005411300018F0231', 'HFS-503G1E3GOSR', 'Refrigerant Component', 'Electronics')
ON CONFLICT (barcode) DO NOTHING;
