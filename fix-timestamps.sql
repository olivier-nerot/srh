-- Fix timestamp inconsistencies in the database
-- Standardize on milliseconds (like publications table)
-- Convert ISO datetime strings to Unix timestamps (milliseconds since epoch)
-- Convert 10-digit Unix seconds to milliseconds by multiplying by 1000

-- Fix users table created_at - convert ISO strings to milliseconds
UPDATE users 
SET created_at = CAST(strftime('%s', created_at) AS INTEGER) * 1000
WHERE created_at LIKE '____-__-__ __:__:__';

-- Fix users table created_at - convert seconds to milliseconds (for 10-digit timestamps)
UPDATE users 
SET created_at = created_at * 1000
WHERE created_at < 2000000000 AND created_at > 1000000000;

-- Fix users table updated_at - convert ISO strings to milliseconds  
UPDATE users 
SET updated_at = CAST(strftime('%s', updated_at) AS INTEGER) * 1000
WHERE updated_at LIKE '____-__-__ __:__:__';

-- Fix users table updated_at - convert seconds to milliseconds (for 10-digit timestamps)
UPDATE users 
SET updated_at = updated_at * 1000
WHERE updated_at < 2000000000 AND updated_at > 1000000000;

-- Show the results
SELECT id, email, created_at, updated_at FROM users ORDER BY id;