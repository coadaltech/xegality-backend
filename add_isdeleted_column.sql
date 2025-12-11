-- Add isDeleted column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS isDeleted BOOLEAN DEFAULT FALSE;

-- Create index for better performance on soft deletes
CREATE INDEX IF NOT EXISTS idx_users_isdeleted ON users(isDeleted);

-- Update existing records to ensure they have the correct default value
UPDATE users SET isDeleted = FALSE WHERE isDeleted IS NULL;
