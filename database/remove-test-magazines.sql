-- Remove test/sample magazines from production database
-- Run this script in Supabase SQL Editor to clean up test data

-- First, check what magazines are in the database
SELECT id, title, issue_number, publish_date, description, available_copies 
FROM magazines 
ORDER BY publish_date;

-- Delete test magazines (keeping only the real one you want)
-- IMPORTANT: Update the WHERE clause based on what you see above
-- Example: Keep only the most recent magazine or the one with a specific issue number

-- Option 1: Delete all magazines with issue numbers that look like test data
DELETE FROM magazines 
WHERE issue_number IN ('2024-01', '2024-02')
AND description LIKE '%Experimente für zu Hause%' 
   OR description LIKE '%Gartenprojekten und Naturentdeckungen%';

-- Option 2: Keep only the magazine you manually added (replace with your actual magazine details)
-- DELETE FROM magazines 
-- WHERE issue_number != 'YOUR_REAL_ISSUE_NUMBER';

-- Verify the result
SELECT id, title, issue_number, publish_date, description, available_copies 
FROM magazines 
ORDER BY publish_date;