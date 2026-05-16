import { ExerciseType } from '@prisma/client';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateExerciseDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsEnum(ExerciseType)
  type!: ExerciseType;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  targetMuscles!: string[];
}
