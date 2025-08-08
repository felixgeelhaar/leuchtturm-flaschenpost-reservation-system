-- Check if data_processing_activity table exists and its structure
-- Run this in Supabase SQL editor

-- Check if table exists
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'data_processing_activity'
) as table_exists;

-- If table doesn't exist, create it
CREATE TABLE IF NOT EXISTS data_processing_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  data_type VARCHAR(50) NOT NULL,
  legal_basis VARCHAR(50) NOT NULL,
  processor_id UUID,
  ip_address VARCHAR(45),
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_data_processing_activity_user_id 
ON data_processing_activity(user_id);

CREATE INDEX IF NOT EXISTS idx_data_processing_activity_timestamp 
ON data_processing_activity(timestamp);

-- Enable RLS
ALTER TABLE data_processing_activity ENABLE ROW LEVEL SECURITY;

-- Create policy for service role (full access)
CREATE POLICY "Service role can manage all logs" 
ON data_processing_activity 
FOR ALL 
USING (auth.role() = 'service_role');

-- Show table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'data_processing_activity'
ORDER BY ordinal_position;