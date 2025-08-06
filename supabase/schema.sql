-- ============================================================================
-- FLASCHENPOST RESERVATION SYSTEM - DATABASE SCHEMA
-- ============================================================================
-- Run this entire script in Supabase SQL Editor after creating your project
-- ============================================================================

-- Create users table with GDPR compliance
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  address_street VARCHAR(255),
  address_house_number VARCHAR(50),
  address_postal_code VARCHAR(20),
  address_city VARCHAR(100),
  address_country VARCHAR(2) DEFAULT 'DE',
  address_line2 VARCHAR(255),
  consent_version VARCHAR(50),
  consent_timestamp TIMESTAMPTZ,
  data_retention_until DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create magazines table
CREATE TABLE IF NOT EXISTS magazines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  issue_number VARCHAR(100) NOT NULL,
  publish_date DATE NOT NULL,
  description TEXT,
  total_copies INTEGER DEFAULT 100,
  available_copies INTEGER DEFAULT 100,
  cover_image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  magazine_id UUID REFERENCES magazines(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0 AND quantity <= 5),
  delivery_method VARCHAR(20) CHECK (delivery_method IN ('pickup', 'shipping')),
  pickup_location VARCHAR(255),
  pickup_date DATE,
  payment_method VARCHAR(20) DEFAULT 'paypal',
  payment_status VARCHAR(20) DEFAULT 'pending',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  reservation_date TIMESTAMPTZ DEFAULT NOW(),
  confirmation_code VARCHAR(20) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_consents table for GDPR
CREATE TABLE IF NOT EXISTS user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  consent_type VARCHAR(50) NOT NULL,
  consent_given BOOLEAN NOT NULL,
  consent_version VARCHAR(50) NOT NULL,
  ip_address INET,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create audit_logs table for GDPR compliance
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  user_id UUID,
  ip_address INET,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create data_processing_activities table for GDPR
CREATE TABLE IF NOT EXISTS data_processing_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(100) NOT NULL,
  data_type VARCHAR(100) NOT NULL,
  legal_basis VARCHAR(100) NOT NULL,
  user_id UUID,
  ip_address INET,
  details JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_confirmation ON reservations(confirmation_code);
CREATE INDEX IF NOT EXISTS idx_magazines_active ON magazines(is_active);
CREATE INDEX IF NOT EXISTS idx_magazines_publish_date ON magazines(publish_date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE magazines ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_processing_activities ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Magazines: Public read access for active magazines
CREATE POLICY "Public can view active magazines" 
  ON magazines FOR SELECT 
  USING (is_active = true);

-- Allow service role full access to magazines
CREATE POLICY "Service role can manage magazines" 
  ON magazines FOR ALL 
  USING (auth.role() = 'service_role');

-- Users: Can only view their own data
CREATE POLICY "Users can view own data" 
  ON users FOR SELECT 
  USING (auth.uid()::text = id::text OR auth.role() = 'service_role');

-- Users: Service role can manage all users
CREATE POLICY "Service role can manage users" 
  ON users FOR ALL 
  USING (auth.role() = 'service_role');

-- Reservations: Users can view their own reservations
CREATE POLICY "Users can view own reservations" 
  ON reservations FOR SELECT 
  USING (auth.uid()::text = user_id::text OR auth.role() = 'service_role');

-- Reservations: Service role can manage all reservations
CREATE POLICY "Service role can manage reservations" 
  ON reservations FOR ALL 
  USING (auth.role() = 'service_role');

-- User consents: Users can view their own consent history
CREATE POLICY "Users can view own consents" 
  ON user_consents FOR SELECT 
  USING (auth.uid()::text = user_id::text OR auth.role() = 'service_role');

-- User consents: Service role can manage all consents
CREATE POLICY "Service role can manage consents" 
  ON user_consents FOR ALL 
  USING (auth.role() = 'service_role');

-- Audit logs: Only service role can access
CREATE POLICY "Service role can access audit logs" 
  ON audit_logs FOR ALL 
  USING (auth.role() = 'service_role');

-- Data processing activities: Only service role can access
CREATE POLICY "Service role can access data processing" 
  ON data_processing_activities FOR ALL 
  USING (auth.role() = 'service_role');

-- ============================================================================
-- INITIAL DATA - MAGAZINE ISSUES
-- ============================================================================

-- Insert current magazine issues
INSERT INTO magazines (title, issue_number, publish_date, description, total_copies, available_copies, is_active)
VALUES 
  (
    'Flaschenpost Magazin', 
    'Ausgabe 2025/1', 
    '2025-02-01', 
    'Winterausgabe mit spannenden Geschichten aus dem Leuchtturm, kreativen Bastelanleitungen für kalte Tage und lehrreichen Experimenten zum Thema Eis und Schnee.', 
    100, 
    95, 
    true
  ),
  (
    'Flaschenpost Magazin', 
    'Ausgabe 2025/2', 
    '2025-04-01', 
    'Frühlingsausgabe voller Naturentdeckungen, Gartenprojekte für kleine Gärtner und Osterbastelein. Mit extra Rätselspaß und Frühlingsgeschichten.', 
    100, 
    100, 
    true
  ),
  (
    'Flaschenpost Magazin', 
    'Ausgabe 2025/3', 
    '2025-06-01', 
    'Sommerausgabe mit Outdoor-Abenteuern, Wasserspielen, Urlaubsgeschichten und tollen Ideen für die Ferienzeit. Plus: Unser großes Sommer-Quiz!', 
    100, 
    100, 
    false -- Not yet active
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to generate confirmation codes
CREATE OR REPLACE FUNCTION generate_confirmation_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_magazines_updated_at BEFORE UPDATE ON magazines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- VERIFICATION QUERY - Run this to check if everything is set up correctly
-- ============================================================================

-- This query should return the table count if everything is created successfully
SELECT 
  'Setup Complete!' as status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count,
  (SELECT COUNT(*) FROM magazines WHERE is_active = true) as active_magazines;