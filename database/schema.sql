-- Flaschenpost Magazine Reservation System Database Schema
-- GDPR-compliant database design with proper indexing and constraints

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS data_processing_logs CASCADE;
DROP TABLE IF EXISTS user_consents CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS magazines CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table with GDPR compliance
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(254) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    
    -- Optional address fields for shipping
    street VARCHAR(200),
    house_number VARCHAR(20),
    address_line2 VARCHAR(200), -- For apartment, suite, etc.
    postal_code VARCHAR(20),
    city VARCHAR(100),
    country VARCHAR(2) DEFAULT 'DE', -- ISO 3166-1 alpha-2 country code
    
    -- GDPR compliance fields
    consent_version VARCHAR(10) NOT NULL DEFAULT '1.0',
    consent_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_retention_until TIMESTAMPTZ,
    last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT users_name_check CHECK (LENGTH(first_name) >= 2 AND LENGTH(last_name) >= 2),
    CONSTRAINT users_phone_check CHECK (phone IS NULL OR phone ~* '^\+?[1-9]\d{1,14}$'),
    CONSTRAINT users_postal_code_check CHECK (postal_code IS NULL OR LENGTH(postal_code) >= 4),
    CONSTRAINT users_country_check CHECK (country IS NULL OR LENGTH(country) = 2)
);

-- Magazines table
CREATE TABLE magazines (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    issue_number VARCHAR(50) NOT NULL,
    publish_date DATE NOT NULL,
    description TEXT,
    total_copies INTEGER NOT NULL CHECK (total_copies > 0),
    available_copies INTEGER NOT NULL CHECK (available_copies >= 0),
    cover_image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT magazines_copies_check CHECK (available_copies <= total_copies),
    CONSTRAINT magazines_unique_issue UNIQUE (title, issue_number)
);

-- Reservations table
CREATE TABLE reservations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    magazine_id UUID NOT NULL REFERENCES magazines(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0 AND quantity <= 5),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'expired')),
    reservation_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Delivery options
    delivery_method VARCHAR(20) DEFAULT 'pickup' CHECK (delivery_method IN ('pickup', 'shipping')),
    pickup_date DATE,
    pickup_location VARCHAR(200),
    
    -- Shipping address (if different from user address)
    shipping_street VARCHAR(200),
    shipping_house_number VARCHAR(20),
    shipping_address_line2 VARCHAR(200),
    shipping_postal_code VARCHAR(20),
    shipping_city VARCHAR(100),
    shipping_country VARCHAR(2) DEFAULT 'DE',
    
    notes TEXT,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    
    -- GDPR compliance
    consent_reference VARCHAR(100) NOT NULL,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT reservations_pickup_date_check CHECK (pickup_date IS NULL OR pickup_date >= CURRENT_DATE),
    CONSTRAINT reservations_expires_check CHECK (expires_at > reservation_date),
    CONSTRAINT reservations_pickup_location_check CHECK (
        (delivery_method = 'pickup' AND pickup_location IS NOT NULL) OR 
        (delivery_method = 'shipping')
    ),
    CONSTRAINT reservations_shipping_address_check CHECK (
        (delivery_method = 'pickup') OR 
        (delivery_method = 'shipping' AND shipping_postal_code IS NOT NULL AND shipping_city IS NOT NULL)
    )
);

-- GDPR consent tracking
CREATE TABLE user_consents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    consent_type VARCHAR(20) NOT NULL CHECK (consent_type IN ('essential', 'functional', 'analytics', 'marketing')),
    consent_given BOOLEAN NOT NULL,
    consent_version VARCHAR(10) NOT NULL DEFAULT '1.0',
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    ip_address INET,
    user_agent TEXT,
    withdrawal_timestamp TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT user_consents_unique UNIQUE (user_id, consent_type, timestamp),
    CONSTRAINT user_consents_withdrawal_check CHECK (withdrawal_timestamp IS NULL OR withdrawal_timestamp > timestamp)
);

-- GDPR audit trail
CREATE TABLE data_processing_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN (
        'created', 'updated', 'accessed', 'exported', 'deleted',
        'consent_given', 'consent_withdrawn', 'reservation_created',
        'reservation_updated', 'reservation_cancelled'
    )),
    data_type VARCHAR(30) NOT NULL CHECK (data_type IN ('user_data', 'reservation', 'consent', 'processing_log')),
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    legal_basis VARCHAR(30) NOT NULL CHECK (legal_basis IN ('consent', 'contract', 'legitimate_interest', 'user_request')),
    processor_id VARCHAR(100),
    ip_address INET,
    details JSONB,
    
    -- Indexes will be created separately for better performance
    CONSTRAINT data_processing_logs_timestamp_check CHECK (timestamp <= NOW())
);

-- Indexes for performance optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = TRUE;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_retention ON users(data_retention_until) WHERE data_retention_until IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_last_activity ON users(last_activity);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_magazines_active ON magazines(is_active) WHERE is_active = TRUE;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_magazines_available ON magazines(available_copies) WHERE available_copies > 0;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_magazines_publish_date ON magazines(publish_date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_magazine_id ON reservations(magazine_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_expires_at ON reservations(expires_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_pickup_date ON reservations(pickup_date) WHERE pickup_date IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_consents_type ON user_consents(consent_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_consents_timestamp ON user_consents(timestamp);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_processing_logs_user_id ON data_processing_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_processing_logs_timestamp ON data_processing_logs(timestamp);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_processing_logs_action ON data_processing_logs(action);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_processing_logs_data_type ON data_processing_logs(data_type);

-- Full-text search indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_magazines_title_search ON magazines USING gin(to_tsvector('english', title));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_name_search ON users USING gin(to_tsvector('english', first_name || ' ' || last_name));

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_magazines_updated_at BEFORE UPDATE ON magazines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update user's last_activity
CREATE OR REPLACE FUNCTION update_user_last_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users SET last_activity = NOW() WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_activity_on_reservation AFTER INSERT OR UPDATE ON reservations
    FOR EACH ROW EXECUTE FUNCTION update_user_last_activity();

CREATE TRIGGER update_user_activity_on_consent AFTER INSERT ON user_consents
    FOR EACH ROW EXECUTE FUNCTION update_user_last_activity();

-- Function to automatically expire old reservations
CREATE OR REPLACE FUNCTION expire_old_reservations()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE reservations 
    SET status = 'expired' 
    WHERE expires_at < NOW() 
    AND status = 'pending';
    
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Function to ensure magazine availability on reservation
CREATE OR REPLACE FUNCTION check_magazine_availability()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if enough copies are available
    IF (SELECT available_copies FROM magazines WHERE id = NEW.magazine_id) < NEW.quantity THEN
        RAISE EXCEPTION 'Not enough copies available for magazine ID %', NEW.magazine_id;
    END IF;
    
    -- Decrease available copies
    UPDATE magazines 
    SET available_copies = available_copies - NEW.quantity 
    WHERE id = NEW.magazine_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER check_magazine_availability_trigger 
    BEFORE INSERT ON reservations
    FOR EACH ROW 
    EXECUTE FUNCTION check_magazine_availability();

-- Function to restore magazine availability when reservation is cancelled
CREATE OR REPLACE FUNCTION restore_magazine_availability()
RETURNS TRIGGER AS $$
BEGIN
    -- Only restore if status changed to cancelled or expired
    IF OLD.status IN ('pending', 'confirmed') AND NEW.status IN ('cancelled', 'expired') THEN
        UPDATE magazines 
        SET available_copies = available_copies + OLD.quantity 
        WHERE id = OLD.magazine_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER restore_magazine_availability_trigger 
    AFTER UPDATE ON reservations
    FOR EACH ROW 
    EXECUTE FUNCTION restore_magazine_availability();

-- Row Level Security (RLS) for GDPR compliance
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_processing_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own data
CREATE POLICY users_own_data ON users
    FOR ALL USING (auth.uid()::text = id::text);

-- Users can only see their own reservations
CREATE POLICY reservations_own_data ON reservations
    FOR ALL USING (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = reservations.user_id 
        AND auth.uid()::text = users.id::text
    ));

-- Users can only see their own consents
CREATE POLICY consents_own_data ON user_consents
    FOR ALL USING (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = user_consents.user_id 
        AND auth.uid()::text = users.id::text
    ));

-- Processing logs are restricted to admin access only
CREATE POLICY processing_logs_admin_only ON data_processing_logs
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Public read access to active magazines
CREATE POLICY magazines_public_read ON magazines
    FOR SELECT USING (is_active = TRUE);

-- Insert sample data for development
INSERT INTO magazines (id, title, issue_number, publish_date, description, total_copies, available_copies, cover_image_url) VALUES
(
    uuid_generate_v4(),
    'Flaschenpost',
    '2024-01',
    '2024-02-01',
    'Das Magazin für neugierige Eltern und ihre Kinder. Diese Ausgabe behandelt spannende Experimente für zu Hause.',
    100,
    95,
    '/images/flaschenpost-2024-01-cover.jpg'
),
(
    uuid_generate_v4(),
    'Flaschenpost',
    '2024-02',
    '2024-03-01',
    'Frühlingsausgabe mit Gartenprojekten und Naturentdeckungen für die ganze Familie.',
    100,
    100,
    '/images/flaschenpost-2024-02-cover.jpg'
);

-- Create database views for common queries
CREATE VIEW active_magazines AS
SELECT 
    id,
    title,
    issue_number,
    publish_date,
    description,
    total_copies,
    available_copies,
    cover_image_url,
    created_at,
    updated_at
FROM magazines 
WHERE is_active = TRUE 
ORDER BY publish_date DESC;

CREATE VIEW reservation_summary AS
SELECT 
    r.id,
    r.status,
    r.quantity,
    r.reservation_date,
    r.pickup_date,
    r.pickup_location,
    u.first_name,
    u.last_name,
    u.email,
    m.title as magazine_title,
    m.issue_number,
    r.created_at,
    r.expires_at
FROM reservations r
JOIN users u ON r.user_id = u.id
JOIN magazines m ON r.magazine_id = m.id
ORDER BY r.created_at DESC;

-- Comments for documentation
COMMENT ON TABLE users IS 'GDPR-compliant user data with automatic retention management';
COMMENT ON TABLE magazines IS 'Magazine catalog with availability tracking';
COMMENT ON TABLE reservations IS 'User reservations with automatic expiration';
COMMENT ON TABLE user_consents IS 'Granular consent tracking for GDPR compliance';
COMMENT ON TABLE data_processing_logs IS 'Complete audit trail for GDPR compliance';

COMMENT ON COLUMN users.data_retention_until IS 'Automatic deletion date for GDPR compliance';
COMMENT ON COLUMN users.consent_version IS 'Version of privacy policy user consented to';
COMMENT ON COLUMN reservations.consent_reference IS 'Reference to consent given for this reservation';
COMMENT ON COLUMN reservations.expires_at IS 'Automatic reservation expiration date';