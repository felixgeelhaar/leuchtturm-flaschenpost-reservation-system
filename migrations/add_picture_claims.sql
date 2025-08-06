-- Add picture order fields to reservations table
ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS order_group_picture BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS child_group_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS order_vorschul_picture BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS child_is_vorschueler BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS child_name VARCHAR(200);

-- Create picture_claims table to track claimed pictures
CREATE TABLE IF NOT EXISTS picture_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_email VARCHAR(255) NOT NULL,
  group_name VARCHAR(100) NOT NULL,
  picture_type VARCHAR(20) NOT NULL CHECK (picture_type IN ('group', 'vorschul')),
  child_name VARCHAR(200) NOT NULL,
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure one picture per family per type per group
  UNIQUE(family_email, group_name, picture_type)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_picture_claims_email ON picture_claims(family_email);
CREATE INDEX IF NOT EXISTS idx_picture_claims_group ON picture_claims(group_name);
CREATE INDEX IF NOT EXISTS idx_picture_claims_reservation ON picture_claims(reservation_id);

-- Add comment for documentation
COMMENT ON TABLE picture_claims IS 'Tracks which families have claimed their free group and Vorschüler pictures';
COMMENT ON COLUMN picture_claims.family_email IS 'Email address used to identify the family';
COMMENT ON COLUMN picture_claims.group_name IS 'The kindergarten group the child belongs to';
COMMENT ON COLUMN picture_claims.picture_type IS 'Type of picture: group or vorschul';
COMMENT ON COLUMN picture_claims.child_name IS 'Name of the child for verification';