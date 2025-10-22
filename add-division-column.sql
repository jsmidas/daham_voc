-- Add division column to MenuType table
ALTER TABLE "MenuType"
ADD COLUMN IF NOT EXISTS "division" TEXT NOT NULL DEFAULT 'HQ';

-- Create index on division column
CREATE INDEX IF NOT EXISTS "MenuType_division_idx" ON "MenuType"("division");

-- Verify the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'MenuType';
