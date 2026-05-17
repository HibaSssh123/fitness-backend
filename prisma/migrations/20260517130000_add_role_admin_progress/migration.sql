-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER',
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "ProgressMetric" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "metricDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weightKg" DOUBLE PRECISION,
    "calorieTarget" INTEGER,
    "calorieConsumed" INTEGER,
    "calorieAdherencePercent" DOUBLE PRECISION,
    "proteinTarget" DOUBLE PRECISION,
    "proteinConsumed" DOUBLE PRECISION,
    "carbsTarget" DOUBLE PRECISION,
    "carbsConsumed" DOUBLE PRECISION,
    "fatTarget" DOUBLE PRECISION,
    "fatConsumed" DOUBLE PRECISION,
    "workoutsCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalCaloriesBurned" INTEGER NOT NULL DEFAULT 0,
    "goalProgressPercent" DOUBLE PRECISION DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgressMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProgressMetric_userId_metricDate_idx" ON "ProgressMetric"("userId", "metricDate");

-- CreateIndex
CREATE INDEX "ProgressMetric_userId_createdAt_idx" ON "ProgressMetric"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ChatMessage_userId_createdAt_idx" ON "ChatMessage"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "ProgressMetric" ADD CONSTRAINT "ProgressMetric_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
