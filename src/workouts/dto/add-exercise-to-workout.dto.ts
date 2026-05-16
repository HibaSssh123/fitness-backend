import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsString,
  ValidateNested,
} from 'class-validator';
import { AddWorkoutSetDto } from './add-workout-set.dto';

export class AddExerciseToWorkoutDto {
  @IsString()
  exerciseId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AddWorkoutSetDto)
  sets!: AddWorkoutSetDto[];
}
