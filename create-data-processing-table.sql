-- Create data_processing_activity table with proper RLS policies
-- Run this in Supabase SQL editor

-- Step 1: Create the table first
CREATE TABLE data_processing_activity (
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

-- Step 2: Create indexes for better query performance
CREATE INDEX idx_data_processing_activity_user_id 
ON data_processing_activity(user_id);

CREATE INDEX idx_data_processing_activity_timestamp 
ON data_processing_activity(timestamp);

-- Step 3: Enable RLS
ALTER TABLE data_processing_activity ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
-- Policy 1: Allow service role full access
CREATE POLICY "Service role full access" 
ON data_processing_activity 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 2: Allow anonymous inserts for public API endpoints
CREATE POLICY "Anonymous can insert logs" 
ON data_processing_activity 
FOR INSERT 
TO anon
WITH CHECK (true);

-- Policy 3: Allow authenticated users to insert
CREATE POLICY "Authenticated users can insert logs" 
ON data_processing_activity 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Policy 4: Users can view their own logs
CREATE POLICY "Users can view own logs" 
ON data_processing_activity 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Step 5: Grant necessary permissions
GRANT INSERT ON data_processing_activity TO anon;
GRANT INSERT ON data_processing_activity TO authenticated;
GRANT ALL ON data_processing_activity TO service_role;

-- Step 6: Test insert
INSERT INTO data_processing_activity (
  action, 
  data_type, 
  legal_basis, 
  details
) VALUES (
  'table_created',
  'system',
  'legitimate_interest',
  'Table created successfully with RLS policies'
);

-- Step 7: Verify it worked
SELECT * FROM data_processing_activity 
ORDER BY created_at DESC 
LIMIT 1;