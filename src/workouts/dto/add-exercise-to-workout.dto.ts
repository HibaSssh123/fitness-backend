import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class AddExerciseToWorkoutDto {
  @IsString()
  exerciseId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sets?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  reps?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  weight?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  duration?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  distance?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(10)
  rpe?: number;
}
