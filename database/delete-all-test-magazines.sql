-- PRODUCTION DATABASE CLEANUP
-- This script removes ALL test magazines from the production database
-- Run this in Supabase SQL Editor

-- Check current magazines
SELECT id, title, issue_number, publish_date, available_copies 
FROM magazines 
ORDER BY publish_date;

-- Delete ALL existing magazines to start fresh
-- The admin should manually add the real magazines through the Supabase dashboard
DELETE FROM magazines;

-- Verify all magazines are deleted
SELECT COUNT(*) as magazine_count FROM magazines;

-- After running this script, manually add your real magazine through:
-- 1. Supabase Dashboard > Table Editor > magazines table
-- 2. Click "Insert row"
-- 3. Add your real magazine details