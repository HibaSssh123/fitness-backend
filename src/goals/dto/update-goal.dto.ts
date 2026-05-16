import { GoalType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class UpdateGoalDto {
  @IsOptional()
  @IsEnum(GoalType)
  type?: GoalType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  targetCalories?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  startWeightKg?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  targetWeightKg?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  targetProtein?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  targetCarbs?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  targetFat?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
