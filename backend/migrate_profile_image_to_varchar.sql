-- Migration: Change profile_image column from TEXT to VARCHAR(255)
-- This is because we're now storing file paths instead of base64 data

-- Alter column to VARCHAR(255)
ALTER TABLE users 
ALTER COLUMN profile_image TYPE VARCHAR(255);

-- Verify the change
SELECT 
    table_name,
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'profile_image';

-- Success message
SELECT 'Migration completed successfully! Profile images now use file storage.' AS status;
