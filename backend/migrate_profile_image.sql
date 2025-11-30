-- Migration: Change profile_image column from VARCHAR(500) to TEXT
-- This fixes the error when saving large base64-encoded profile images

-- Check current column type
SELECT 
    table_name,
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'profile_image';

-- Alter column to TEXT
ALTER TABLE users 
ALTER COLUMN profile_image TYPE TEXT;

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
SELECT 'Migration completed successfully!' AS status;
