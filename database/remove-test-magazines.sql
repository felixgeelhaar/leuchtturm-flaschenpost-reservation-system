-- Remove test/sample magazines from production database
-- Run this script in Supabase SQL Editor to clean up test data

-- First, check what magazines are in the database
SELECT id, title, issue_number, publish_date, description, available_copies 
FROM magazines 
ORDER BY publish_date;

-- The API currently shows 2 magazines:
-- 1. "Ausgabe 2025/1" - Winterausgabe (95 available)
-- 2. "Ausgabe 2025/2" - Frühlingsausgabe (100 available)

-- Option 1: Delete the specific test magazines that were found
DELETE FROM magazines 
WHERE issue_number IN ('Ausgabe 2025/1', 'Ausgabe 2025/2')
AND (description LIKE '%Winterausgabe mit spannenden Geschichten%' 
   OR description LIKE '%Frühlingsausgabe voller Naturentdeckungen%');

-- Option 2: Delete ALL magazines and let admin add the real one manually
-- DELETE FROM magazines;

-- Option 3: Keep only one specific magazine (update issue_number with the real one you want to keep)
-- DELETE FROM magazines 
-- WHERE issue_number != 'YOUR_REAL_ISSUE_NUMBER';

-- Verify the result
SELECT id, title, issue_number, publish_date, description, available_copies 
FROM magazines 
ORDER BY publish_date;