-- AlterTable
ALTER TABLE "User" ADD COLUMN "height" INTEGER, ADD COLUMN "weight" INTEGER;
-- Drop old columns if they exist
ALTER TABLE "User" DROP COLUMN IF EXISTS "heightCm";
ALTER TABLE "User" DROP COLUMN IF EXISTS "weightKg";
