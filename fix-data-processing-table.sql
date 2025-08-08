-- Fix data_processing_activity table and RLS policies
-- Run this in Supabase SQL editor

-- Check if table exists
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'data_processing_activity'
) as table_exists;

-- Drop existing policies if they exist (to recreate them properly)
DROP POLICY IF EXISTS "Service role can manage all logs" ON data_processing_activity;
DROP POLICY IF EXISTS "Enable insert for service role" ON data_processing_activity;
DROP POLICY IF EXISTS "Allow anonymous inserts" ON data_processing_activity;

-- Create table if it doesn't exist
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_data_processing_activity_user_id 
ON data_processing_activity(user_id);

CREATE INDEX IF NOT EXISTS idx_data_processing_activity_timestamp 
ON data_processing_activity(timestamp);

-- Enable RLS
ALTER TABLE data_processing_activity ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies
-- Policy 1: Allow service role full access
CREATE POLICY "Service role full access" 
ON data_processing_activity 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 2: Allow authenticated users to insert (for API calls)
CREATE POLICY "Authenticated users can insert logs" 
ON data_processing_activity 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Policy 3: Allow anonymous inserts for public API endpoints
CREATE POLICY "Anonymous can insert logs" 
ON data_processing_activity 
FOR INSERT 
TO anon
WITH CHECK (true);

-- Policy 4: Users can view their own logs
CREATE POLICY "Users can view own logs" 
ON data_processing_activity 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT INSERT ON data_processing_activity TO anon;
GRANT INSERT ON data_processing_activity TO authenticated;
GRANT ALL ON data_processing_activity TO service_role;

-- Test insert (should work now)
INSERT INTO data_processing_activity (
  action, 
  data_type, 
  legal_basis, 
  details
) VALUES (
  'test_insert',
  'test',
  'legitimate_interest',
  'Testing RLS policies'
);

-- Verify the test insert worked
SELECT * FROM data_processing_activity 
WHERE action = 'test_insert' 
ORDER BY created_at DESC 
LIMIT 1;

-- Show current RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'data_processing_activity';