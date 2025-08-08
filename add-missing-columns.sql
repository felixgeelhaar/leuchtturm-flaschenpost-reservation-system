-- Add missing address columns to reservations table
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS street VARCHAR(200),
ADD COLUMN IF NOT EXISTS house_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS country VARCHAR(2),
ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(200),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add index for shipping reservations
CREATE INDEX IF NOT EXISTS idx_reservations_delivery_method 
ON reservations(delivery_method) 
WHERE delivery_method = 'shipping';