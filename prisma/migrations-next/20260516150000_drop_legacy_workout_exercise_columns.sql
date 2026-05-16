-- Planned follow-up migration after all clients read/write WorkoutSet data.
-- Apply this only after the compatibility window has ended.
ALTER TABLE "WorkoutExercise"
DROP COLUMN "sets",
DROP COLUMN "reps",
DROP COLUMN "weight",
DROP COLUMN "duration",
DROP COLUMN "distance",
DROP COLUMN "rpe";
