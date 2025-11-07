-- Fix payment_id column to allow NULL values
ALTER TABLE payments ALTER COLUMN payment_id DROP NOT NULL;

-- Verify the change
\d payments;
