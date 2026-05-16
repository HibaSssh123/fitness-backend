-- Create enums
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK');
CREATE TYPE "ServingUnit" AS ENUM ('GRAM', 'OUNCE', 'CUP', 'PIECE', 'SERVING');

-- Food and food-log improvements
ALTER TABLE "Food"
ADD COLUMN "defaultServingUnit" "ServingUnit" NOT NULL DEFAULT 'SERVING';

ALTER TABLE "FoodLog"
ADD COLUMN "servingUnit" "ServingUnit" NOT NULL DEFAULT 'SERVING',
ADD COLUMN "mealType" "MealType" NOT NULL DEFAULT 'SNACK';

-- Workout set tracking
CREATE TABLE "WorkoutSet" (
  "id" TEXT NOT NULL,
  "workoutExerciseId" TEXT NOT NULL,
  "setNumber" INTEGER NOT NULL,
  "reps" INTEGER,
  "weight" DOUBLE PRECISION,
  "duration" INTEGER,
  "distance" DOUBLE PRECISION,
  "rpe" DOUBLE PRECISION,
  "completed" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WorkoutSet_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WorkoutSet_workoutExerciseId_idx" ON "WorkoutSet"("workoutExerciseId");
CREATE UNIQUE INDEX "WorkoutSet_workoutExerciseId_setNumber_key" ON "WorkoutSet"("workoutExerciseId", "setNumber");

ALTER TABLE "WorkoutSet"
ADD CONSTRAINT "WorkoutSet_workoutExerciseId_fkey"
FOREIGN KEY ("workoutExerciseId") REFERENCES "WorkoutExercise"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill one default set from existing workout exercises
INSERT INTO "WorkoutSet" (
  "id",
  "workoutExerciseId",
  "setNumber",
  "reps",
  "weight",
  "duration",
  "distance",
  "rpe",
  "completed",
  "createdAt",
  "updatedAt"
)
SELECT
  'ws_' || "id",
  "id",
  1,
  "reps",
  "weight",
  "duration",
  "distance",
  "rpe",
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "WorkoutExercise";
